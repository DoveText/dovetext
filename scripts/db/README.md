# Database Management

This directory contains all database-related scripts and schema definitions for DoveText.

## Structure

- `schema.sql`: The source of truth for the database structure. Contains all table definitions, triggers, and indexes.
- `migrations/`: Directory containing all database migrations.
- `config.ts`: Database configuration.

## Schema Management

### Main Schema (`schema.sql`)

The `schema.sql` file is the source of truth for our database structure. It contains:
- Complete table definitions
- Triggers and functions
- Indexes
- Any other database objects

When making changes to the database structure:
1. First update `schema.sql` with the new changes
2. Create a new migration file in `migrations/` to implement the change
3. Update this documentation if necessary

### Tables

1. **users**
   - Main user table storing user information
   - Contains both Firebase UID and local authentication data
   - Has automatic `updated_at` trigger

2. **invitation_codes**
   - Manages invitation codes for user signup
   - Tracks usage limits and validity
   - Links to creating user (optional)

3. **invitation_code_uses**
   - Tracks each use of invitation codes
   - Links to both the code and the user
   - Records usage timestamp

## Migrations

Migrations are stored in the `migrations/` directory and follow the naming convention:
```
YYYYMMDD_description.ts
```

To create a new migration:
```bash
npm run db:migrate:create -- description_of_change
```

To run migrations:
```bash
npm run db:migrate
```

## Database Commands

- `npm run db:create`: Create the database
- `npm run db:init`: Initialize the database with the schema
- `npm run db:migrate`: Run pending migrations
- `npm run create:code`: Create a new invitation code

## Best Practices

1. Always update `schema.sql` when making structural changes
2. Create migrations for all schema changes
3. Add appropriate indexes for frequently queried columns
4. Use transactions for data consistency
5. Follow naming conventions:
   - Tables: plural, snake_case
   - Columns: snake_case
   - Indexes: idx_table_column
   - Foreign keys: table_id
