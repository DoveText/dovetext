import { Pool } from 'pg';
import { config } from '../config';

const createMigrationsTable = `
CREATE TABLE IF NOT EXISTS migrations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    executed_at TIMESTAMP NOT NULL DEFAULT NOW()
);
`;

async function initMigrations() {
  const pool = new Pool(config);
  
  try {
    await pool.query(createMigrationsTable);
    console.log('Migrations table created or verified');
  } catch (error) {
    console.error('Failed to create migrations table:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  initMigrations().catch(console.error);
}

export { initMigrations };
