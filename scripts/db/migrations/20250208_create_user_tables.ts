import { Pool } from 'pg';
import { config } from '../config';

const createTables = `
-- Users table for managing user information
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    firebase_uid VARCHAR(128) UNIQUE,
    encrypted_password VARCHAR(255),
    display_name VARCHAR(255),
    avatar_url TEXT,
    settings JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Invitation codes table
CREATE TABLE invitation_codes (
    code VARCHAR(128) PRIMARY KEY,
    max_uses INTEGER NOT NULL,
    used_count INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    platform VARCHAR(50),
    description TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Track invitation code usage
CREATE TABLE invitation_code_uses (
    id SERIAL PRIMARY KEY,
    code VARCHAR(128) REFERENCES invitation_codes(code),
    user_id INTEGER REFERENCES users(id),
    user_email VARCHAR(255) NOT NULL,
    used_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
`;

const dropTables = `
DROP TABLE IF EXISTS invitation_code_uses;
DROP TABLE IF EXISTS invitation_codes;
DROP TABLE IF EXISTS users;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
`;

async function migrate() {
  const pool = new Pool(config);
  
  try {
    console.log('Starting migration...');
    
    // Run migration
    await pool.query(createTables);
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    
    // Attempt to rollback on failure
    console.log('Attempting to rollback...');
    await pool.query(dropTables);
    
    throw error;
  } finally {
    await pool.end();
  }
}

// Run migration if this script is run directly
if (require.main === module) {
  migrate().catch(console.error);
}

export { migrate, dropTables };
