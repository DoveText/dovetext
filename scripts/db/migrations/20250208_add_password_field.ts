import { Pool } from 'pg';
import { config } from '../config';

const up = `
ALTER TABLE users
ADD COLUMN encrypted_password VARCHAR(255);
`;

const down = `
ALTER TABLE users
DROP COLUMN encrypted_password;
`;

export async function migrate() {
  const pool = new Pool(config);
  
  try {
    await pool.query(up);
    console.log('Added encrypted_password field to users table');
  } catch (error) {
    console.error('Migration failed:', error);
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
    console.log('Removed encrypted_password field from users table');
  } catch (error) {
    console.error('Rollback failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}
