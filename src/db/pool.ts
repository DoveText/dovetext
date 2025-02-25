import { Pool } from 'pg';
import { config, devConfig } from '../../scripts/db/config';

class DatabasePool {
  private static instance: Pool;
  private static isDev: boolean = process.env.NODE_ENV !== 'production';

  public static getInstance(): Pool {
    if (!DatabasePool.instance) {
      // Set max listeners to avoid warnings
      const pool = new Pool(DatabasePool.isDev ? devConfig : config);
      pool.on('connect', (client) => {
        client.setMaxListeners(20); // Increase the limit for each client
      });
      
      DatabasePool.instance = pool;
    }
    return DatabasePool.instance;
  }

  public static async close(): Promise<void> {
    if (DatabasePool.instance) {
      await DatabasePool.instance.end();
    }
  }
}

// Export a singleton instance
export const pool = DatabasePool.getInstance();

// Handle cleanup on process termination
process.on('SIGINT', async () => {
  await DatabasePool.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await DatabasePool.close();
  process.exit(0);
});
