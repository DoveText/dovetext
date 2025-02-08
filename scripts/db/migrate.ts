import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { config } from './config';
import { initMigrations } from './migrations/00000000_init_migrations';

interface MigrationInfo {
  date: string;  // YYYYMMDD
  name: string | null;  // part after YYYYMMDD_
  filename: string;
}

async function getLastMigration(pool: Pool): Promise<{ date: string; name: string | null } | null> {
  const result = await pool.query(
    'SELECT date, name FROM migrations ORDER BY date DESC, executed_at DESC LIMIT 1'
  );
  return result.rows[0] || null;
}

async function markMigrationAsExecuted(pool: Pool, migration: MigrationInfo) {
  await pool.query(
    'INSERT INTO migrations (date, name) VALUES ($1, $2)',
    [migration.date, migration.name]
  );
}

function parseMigrationFile(filename: string): MigrationInfo {
  const parts = filename.replace('.ts', '').split('_');
  const date = parts[0];
  const name = parts.length > 1 ? parts.slice(1).join('_') : null;
  
  return { date, name, filename };
}

async function runMigration(pool: Pool, migration: any) {
  if (typeof migration.migrate !== 'function') {
    throw new Error(`Migration ${migration.filename} does not export a migrate function`);
  }
  await migration.migrate();
}

async function migrate() {
  const pool = new Pool(config);
  
  try {
    // Ensure migrations table exists
    await initMigrations();
    
    // Get last executed migration
    const lastMigration = await getLastMigration(pool);
    
    // Get all migration files
    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.ts') && file !== '00000000_init_migrations.ts')
      .sort();
    
    // Run pending migrations
    for (const file of migrationFiles) {
      const migration = parseMigrationFile(file);
      
      // Skip if migration date is older than last executed
      if (lastMigration && migration.date < lastMigration.date) {
        console.log(`Skipping older migration: ${file}`);
        continue;
      }
      
      // For same date, skip if name already executed
      if (lastMigration && 
          migration.date === lastMigration.date && 
          migration.name === lastMigration.name) {
        console.log(`Skipping already executed migration: ${file}`);
        continue;
      }
      
      console.log(`Running migration: ${file}`);
      const migrationModule = require(path.join(migrationsDir, file));
      await runMigration(pool, migrationModule);
      await markMigrationAsExecuted(pool, migration);
      console.log(`Completed migration: ${file}`);
    }
    
    console.log('All migrations completed');
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
