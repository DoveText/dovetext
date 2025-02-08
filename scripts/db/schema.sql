-- Schema for DoveText Database
-- This file contains the complete database schema and should be maintained
-- as the source of truth for the database structure.

-- Migrations table for tracking database migrations
CREATE TABLE migrations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    executed_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Waitlist table
CREATE TABLE IF NOT EXISTS waitlist (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,  -- join, update, processed
    use_cases TEXT[] DEFAULT '{}',
    custom_case TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Index on email for faster lookups
CREATE INDEX IF NOT EXISTS waitlist_email_idx ON waitlist(email);

-- Index on status and processed_at for efficient querying of unprocessed entries
CREATE INDEX IF NOT EXISTS waitlist_status_processed_idx ON waitlist(status, processed_at);

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

-- Add indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX idx_invitation_codes_is_active ON invitation_codes(is_active);
CREATE INDEX idx_invitation_code_uses_code ON invitation_code_uses(code);
CREATE INDEX idx_invitation_code_uses_user_id ON invitation_code_uses(user_id);
