import { Pool } from 'pg';
import { config } from '../config';

const up = `
-- Your SQL migration goes here
`;

const down = `
-- Your rollback SQL goes here
`;

export async function migrate() {
  const pool = new Pool(config);
  
  try {
    await pool.query(up);
  } catch (error) {
    console.error('Migration failed:', error);
    // Attempt rollback
    await pool.query(down);
    throw error;
  } finally {
    await pool.end();
  }
}

export async function rollback() {
  const pool = new Pool(config);
  
  try {
    await pool.query(down);
  } catch (error) {
    console.error('Rollback failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}
