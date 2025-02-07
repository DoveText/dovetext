const pg = require('pg');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
const NODE_ENV = process.env.NODE_ENV || 'development';
const envPath = path.resolve(process.cwd(), `.env.${NODE_ENV}`);
const localEnvPath = path.resolve(process.cwd(), '.env');

dotenv.config({ path: envPath });
dotenv.config({ path: localEnvPath, override: true });

async function initializeDatabase() {
  const client = new pg.Client({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    database: process.env.POSTGRES_DB || 'dovetext',
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres'
  });

  try {
    await client.connect();
    
    // Drop existing table and related objects
    await client.query('DROP TABLE IF EXISTS waitlist CASCADE');
    
    // Read the schema file
    const schema = fs.readFileSync(
      path.join(__dirname, 'db/schema.sql'),
      'utf8'
    );

    // Execute the schema
    await client.query(schema);
    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Error initializing database schema:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = initializeDatabase;
