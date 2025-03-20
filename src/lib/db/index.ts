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

// Initialization options for pg-promise
const initOptions = {
  // Disable duplicate instantiation warning
  noWarnings: true,
  // Event handling for connection issues
  error: (err: any, e: any) => {
    if (e.cn) {
      // Connection-related error
      console.error('Database connection error:', err);
    }
  }
};

// Singleton instance of pg-promise
const pgp = pgPromise(initOptions);

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

// Create a symbol to ensure our global is unique
declare global {
  var __db: ReturnType<typeof pgp> | undefined;
}

// Global database instance using a singleton pattern that survives hot reloads
// This approach works better with Next.js than a module-level variable

// Set up warning monitoring for database connections
process.on('warning', (warning) => {
  if (warning.name === 'MaxListenersExceededWarning' && warning.message.includes('Connection')) {
    console.warn('[Database] MaxListenersExceededWarning detected:', {
      name: warning.name,
      message: warning.message,
      stack: warning.stack,
      timestamp: new Date().toISOString()
    });
  }
});

export const db = (() => {
  // If we already have a connection instance in the global object, use it
  if (global.__db) {
    return global.__db;
  }
  
  // Create a new database instance
  const instance = pgp(getConnectionConfig());
  
  // Set max listeners to prevent warnings
  // This addresses the MaxListenersExceededWarning directly
  try {
    // Safely attempt to increase max listeners if the pool is available
    if (instance.$pool && instance.$pool.pool) {
      const pg = require('pg');
      // Set max listeners on the pg.Client prototype directly
      if (pg && pg.Client && pg.Client.prototype) {
        pg.Client.prototype.setMaxListeners(20);
        console.log('Successfully set max listeners on pg.Client');
      }
    }
  } catch (error) {
    console.warn('Could not set max listeners:', error);
  }
  
  // Test the connection once
  instance.connect()
    .then(obj => {
      console.log(`Database connection successful (${NODE_ENV} environment)`);
      obj.done(); // success, release the connection
    })
    .catch(error => {
      console.error('Database connection error:', error.message || error);
    });
    
  // Store in global to survive hot reloads
  global.__db = instance;
  
  return instance;
})();

// Cleanup function for testing environments
export const closeDatabase = async () => {
  if (global.__db) {
    await global.__db.$pool.end();
    global.__db = undefined;
    console.log('Database connection closed');
  }
};
