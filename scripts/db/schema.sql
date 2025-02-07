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
