import pgPromise from 'pg-promise';
import dotenv from 'dotenv';
import path from 'path';
import { Pool } from 'pg';

// Extend the pg-promise types to include the pool property
declare module 'pg-promise' {
  interface IMain {
    $pool: {
      pool: Pool;
    };
  }
}

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

// Increase the default max listeners for EventEmitter to prevent warnings
// This needs to be done before any database connections are created
import { EventEmitter } from 'events';
// Set a higher default limit for all EventEmitters
EventEmitter.defaultMaxListeners = 30;

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

// Configure connection pool options
const poolConfig = {
  // Maximum number of clients the pool should contain
  max: 20,
  // Maximum time (ms) a client can be idle before being closed
  idleTimeoutMillis: 30000,
  // Connection timeout (ms)
  connectionTimeoutMillis: 5000,
};

export const db = (() => {
  // If we already have a connection instance in the global object, use it
  if (global.__db) {
    return global.__db;
  }
  
  // Create a new database instance with connection pool configuration
  const config = getConnectionConfig();
  // Add pool configuration to the connection config
  const fullConfig = { ...config, ...{ pool: poolConfig } };
  const instance = pgp(fullConfig);
  
  // Set max listeners to prevent warnings
  try {
    // Get the pg module
    const pg = require('pg');
    
    // Set max listeners on the pg.Client prototype
    if (pg && pg.Client && pg.Client.prototype) {
      pg.Client.prototype.setMaxListeners(30);
      console.log('[Database] Successfully set max listeners on pg.Client');
    }
    
    // Also set max listeners on the pool if available
    const pool = (instance as any).$pool?.pool;
    if (pool?.setMaxListeners) {
      pool.setMaxListeners(30);
      console.log('[Database] Successfully set max listeners on connection pool');
    }
  } catch (error) {
    console.warn('[Database] Could not set max listeners:', error);
  }
  
  // Test the connection once
  instance.connect()
    .then(obj => {
      console.log(`[Database] Connection successful (${NODE_ENV} environment)`);
      // Check connection pool status
      const pool = (instance as any).$pool?.pool;
      if (pool) {
        const poolStatus = {
          total: pool.totalCount,
          idle: pool.idleCount,
          waiting: pool.waitingClientsCount
        };
        console.log(`[Database] Connection pool status:`, poolStatus);
      }
      obj.done(); // success, release the connection
    })
    .catch(error => {
      console.error('[Database] Connection error:', error);
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
