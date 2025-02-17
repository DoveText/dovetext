import pgPromise from 'pg-promise';
import { EventEmitter } from 'events';

// Set max listeners to prevent memory leak warnings
EventEmitter.defaultMaxListeners = 20;

const initOptions = {
  // Initialization options
  error(err: Error, e: { cn: any; query: string }) {
    if (e.cn) {
      console.error('CN:', e.cn);
    }
    if (e.query) {
      console.error('QUERY:', e.query);
    }
    console.error('ERROR:', err);
  },
  // Reuse the same connection for the same client
  connect(client: any) {
    const cp = client.connectionParameters;
    console.log('Connected to database:', cp.database);
  }
};

const pgp = pgPromise(initOptions);

// Database connection configuration
const config = {
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.NODE_ENV === 'development' 
    ? `${process.env.POSTGRES_DB || 'dovetext'}_dev`
    : process.env.POSTGRES_DB || 'dovetext',
};

// Create a singleton database instance
const db = pgp(config);

console.log(`[Database] Using ${process.env.NODE_ENV} environment`);

// Handle connection errors
db.connect()
  .then(obj => {
    console.log('Database connection successful' + (process.env.NODE_ENV === 'development' ? ' (development environment)' : ''));
    obj.done(); // success, release the connection;
  })
  .catch(error => {
    console.error('ERROR:', error.message || error);
  });

export { db, pgp };
