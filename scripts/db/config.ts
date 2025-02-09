import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'dovetext',
};

// For development, we'll use a simpler config
export const devConfig = {
  ...config,
  database: `${config.database}_dev`,
};
