# Database Management

This directory contains all database-related scripts and schema definitions for DoveText.

## Directory Structure

```
db/
├── schema.sql          # Source of truth for database structure
├── config.ts           # Database configuration
├── init-db.ts         # Database initialization script
├── migrate.ts         # Database migration script
└── migrations/        # Migration scripts directory
    ├── YYYYMMDD_description.ts   # Migration script format
```

## Database Setup and Migration

### Fresh Installation

For a new installation:

1. Create the database:
```bash
npm run db:create
```

2. Initialize the database:
```bash
npm run db:init
```

This will:
- Create all tables defined in `schema.sql`
- Record today's date in the migrations table as 'init'
- Set up all necessary indexes and triggers

### Database Migrations

For existing installations that need updates:

```bash
npm run db:migrate
```

The migration system uses a date-based approach:
- Each migration script is named as `YYYYMMDD_description.ts`
- Migrations are tracked by date and name in the `migrations` table
- Only newer migrations or same-day migrations with different names will be executed

#### How Migrations Work

1. **Date Comparison**:
   - If a migration's date is older than the last executed migration, it's skipped
   - If a migration's date is newer, it's executed

2. **Same-Day Migrations**:
   - Multiple migrations can exist for the same date
   - Each migration must have a unique name part after the date
   - Already executed migrations (same date and name) are skipped

#### Creating New Migrations

1. Create a new file in `migrations/` following the naming convention:
```
YYYYMMDD_description.ts
```

2. Implement the migration:
```typescript
import { Pool } from 'pg';
import { config } from '../config';

export async function migrate() {
  const pool = new Pool(config);
  try {
    await pool.query(`
      -- Your migration SQL here
    `);
  } finally {
    await pool.end();
  }
}
```

### Database Schema

The schema is maintained in `schema.sql` and includes:

1. **migrations**: Tracks executed migrations
   - `date`: YYYYMMDD format
   - `name`: Optional description after date
   - `executed_at`: Timestamp of execution

2. **users**: Main user table
   - Core user information
   - Authentication details
   - Profile settings

3. **invitation_codes**: Manages signup invitations
   - Code tracking
   - Usage limits
   - Platform information

4. **invitation_code_uses**: Tracks invitation usage
   - Links codes to users
   - Records usage timestamps

### Best Practices

1. **Schema Changes**:
   - Always update `schema.sql` first
   - Create a migration script for existing deployments
   - Test migrations on a copy of production data

2. **Migration Scripts**:
   - Keep migrations atomic and focused
   - Include both up and down migrations when possible
   - Document complex migrations in the script

3. **Naming Conventions**:
   - Tables: plural, snake_case
   - Columns: snake_case
   - Indexes: idx_table_column
   - Foreign keys: table_id

4. **Deployment**:
   - Always backup before migrating
   - Run migrations during low-traffic periods
   - Verify migrations on staging first
