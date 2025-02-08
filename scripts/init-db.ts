import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { config } from './db/config';

async function initDb() {
  const pool = new Pool(config);
  
  try {
    // Read and execute schema.sql
    const schemaPath = path.join(__dirname, 'db', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await pool.query(schema);
    console.log('Schema initialized successfully');

    // Get today's date in YYYYMMDD format
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    
    // Get all migration files for today or before
    const migrationsDir = path.join(__dirname, 'db', 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.ts'))
      .filter(file => {
        const fileDate = file.split('_')[0];
        return fileDate <= today;
      })
      .sort();

    // If we have migrations for today, record them
    if (migrationFiles.some(file => file.startsWith(today))) {
      for (const file of migrationFiles) {
        const [date, ...nameParts] = file.replace('.ts', '').split('_');
        const name = nameParts.join('_');
        await pool.query(
          'INSERT INTO migrations (date, name) VALUES ($1, $2) ON CONFLICT (date, name) DO NOTHING',
          [date, name || 'init']
        );
      }
    } else {
      // No migrations for today, create a dummy record
      await pool.query(
        'INSERT INTO migrations (date, name) VALUES ($1, $2) ON CONFLICT (date, name) DO NOTHING',
        [today, 'init']
      );
    }
    
    console.log('Migration history initialized');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run initialization if this script is run directly
if (require.main === module) {
  initDb().catch(console.error);
}

export { initDb };
