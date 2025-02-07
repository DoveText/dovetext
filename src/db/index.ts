import pgPromise from 'pg-promise';
import dotenv from 'dotenv';
import path from 'path';

// Load environment-specific .env file
const NODE_ENV = process.env.NODE_ENV || 'development';
const envPath = path.resolve(process.cwd(), `.env.${NODE_ENV}`);
const localEnvPath = path.resolve(process.cwd(), '.env');

// First try to load environment-specific file, then fall back to local .env
dotenv.config({ path: envPath });
dotenv.config({ path: localEnvPath, override: true });

console.log(`[Database] Using ${NODE_ENV} environment`);

const pgp = pgPromise();

// Use Vercel's connection URL if available, otherwise use individual params
const connection = process.env.POSTGRES_URL
  ? { connectionString: process.env.POSTGRES_URL }
  : {
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      database: process.env.POSTGRES_DB || 'dovetext',
      user: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'postgres',
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    };

export const db = pgp(connection);

// Test the connection
db.connect()
  .then(obj => {
    console.log(`Database connection successful (${NODE_ENV} environment)`);
    obj.done(); // success, release the connection;
  })
  .catch(error => {
    console.error('ERROR:', error.message || error);
  });
