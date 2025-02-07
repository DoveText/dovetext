const pg = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
const NODE_ENV = process.env.NODE_ENV || 'development';
const envPath = path.resolve(process.cwd(), `.env.${NODE_ENV}`);
const localEnvPath = path.resolve(process.cwd(), '.env');

dotenv.config({ path: envPath });
dotenv.config({ path: localEnvPath, override: true });

async function createDatabase() {
  // Connect to postgres database to create the target database
  const client = new pg.Client({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    database: 'postgres' // Connect to default postgres database
  });

  try {
    await client.connect();
    const dbName = process.env.POSTGRES_DB || 'dovetext';

    // Check if database exists
    const res = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName]
    );

    if (res.rows.length === 0) {
      // Database doesn't exist, create it
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`Database ${dbName} created successfully`);
    } else {
      console.log(`Database ${dbName} already exists`);
    }
  } catch (err) {
    console.error('Error creating database:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  createDatabase();
}

module.exports = createDatabase;
