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

// Singleton instance of pg-promise
const pgp = pgPromise({
  // Initialization Options
  noWarnings: true // Disable duplicate instantiation warning
});

// Database connection configuration
const getConnectionConfig = () => {
  return process.env.POSTGRES_URL
    ? { connectionString: process.env.POSTGRES_URL }
    : {
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5432'),
        database: process.env.POSTGRES_DB || 'dovetext',
        user: process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD || 'postgres',
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      };
};

// Global database instance using a singleton pattern
let dbInstance: ReturnType<typeof pgp> | null = null;

export const db = (() => {
  if (!dbInstance) {
    dbInstance = pgp(getConnectionConfig());
    // Test the connection
    dbInstance.connect()
      .then(obj => {
        console.log(`Database connection successful (${NODE_ENV} environment)`);
        obj.done(); // success, release the connection
      })
      .catch(error => {
        console.error('ERROR:', error.message || error);
      });
  }
  return dbInstance;
})();

// Cleanup function for testing environments
export const closeDatabase = async () => {
  if (dbInstance) {
    await dbInstance.$pool.end();
    dbInstance = null;
  }
};
