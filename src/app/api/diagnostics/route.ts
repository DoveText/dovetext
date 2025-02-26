import { NextResponse } from 'next/server';
import { getDatabaseConnectionListeners } from '@/lib/diagnostics';
import { pool } from '@/lib/db/pool';

export async function GET() {
  try {
    // Get database connection listeners
    const dbListeners = getDatabaseConnectionListeners(pool);

    // Get Node.js process memory usage
    const memoryUsage = process.memoryUsage();

    // Get event loop delay (rough measure)
    const startTime = process.hrtime();
    const endTime = process.hrtime(startTime);
    const eventLoopDelay = endTime[1] / 1000000; // Convert to milliseconds

    // Get pool stats if available
    const poolStats = pool ? {
      poolSize: (pool as any).totalCount,
      activeConnections: (pool as any).activeCount,
      waitingClients: (pool as any).waitingCount,
      maxListeners: (pool as any).getMaxListeners?.() || 'unknown',
    } : 'Pool not available';

    const diagnostics = {
      timestamp: new Date().toISOString(),
      database: {
        listeners: dbListeners,
        pool: poolStats,
      },
      process: {
        uptime: process.uptime(),
        pid: process.pid,
        memoryUsage: {
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          rss: Math.round(memoryUsage.rss / 1024 / 1024),
          external: Math.round(memoryUsage.external / 1024 / 1024),
        },
        eventLoopDelay: Math.round(eventLoopDelay * 100) / 100,
        nodeVersion: process.version,
      },
      env: {
        nodeEnv: process.env.NODE_ENV,
      }
    };

    // Log diagnostics to console for debugging
    console.log('Diagnostics collected:', JSON.stringify(diagnostics, null, 2));

    return NextResponse.json(diagnostics);
  } catch (error) {
    console.error('Diagnostics error:', error);
    return NextResponse.json({ 
      error: 'Failed to get diagnostics',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
