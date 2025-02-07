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
  const client = process.env.POSTGRES_URL
    ? new pg.Client({ connectionString: process.env.POSTGRES_URL })
    : new pg.Client({
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5432'),
        database: process.env.POSTGRES_DB || 'dovetext',
        user: process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD || 'postgres',
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      });

  try {
    await client.connect();
    console.log('Connected to database');
    
    // Read the schema file
    const schema = fs.readFileSync(
      path.join(__dirname, 'db', 'schema.sql'),
      'utf8'
    );
    
    // Execute schema
    await client.query(schema);
    console.log('Database initialized successfully!');

  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  initializeDatabase().catch(console.error);
}
