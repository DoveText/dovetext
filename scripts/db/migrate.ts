import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { config } from './config';
import { initMigrations } from './migrations/00000000_init_migrations';

async function getExecutedMigrations(pool: Pool): Promise<string[]> {
  const result = await pool.query('SELECT name FROM migrations ORDER BY id');
  return result.rows.map(row => row.name);
}

async function markMigrationAsExecuted(pool: Pool, migrationName: string) {
  await pool.query('INSERT INTO migrations (name) VALUES ($1)', [migrationName]);
}

async function runMigration(pool: Pool, migration: any) {
  if (typeof migration.migrate !== 'function') {
    throw new Error(`Migration ${migration} does not export a migrate function`);
  }
  await migration.migrate();
}

async function migrate() {
  const pool = new Pool(config);
  
  try {
    // Ensure migrations table exists
    await initMigrations();
    
    // Get list of executed migrations
    const executedMigrations = await getExecutedMigrations(pool);
    
    // Get all migration files
    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.ts'))
      .sort();
    
    // Run pending migrations
    for (const file of migrationFiles) {
      if (file === '00000000_init_migrations.ts') continue;
      
      if (!executedMigrations.includes(file)) {
        console.log(`Running migration: ${file}`);
        
        const migration = require(path.join(migrationsDir, file));
        await runMigration(pool, migration);
        await markMigrationAsExecuted(pool, file);
        
        console.log(`Completed migration: ${file}`);
      } else {
        console.log(`Skipping already executed migration: ${file}`);
      }
    }
    
    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run migrations if this script is run directly
if (require.main === module) {
  migrate().catch(console.error);
}

export { migrate };
