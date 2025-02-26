import { EventEmitter } from 'events';
import { Pool, PoolClient } from 'pg';

interface ListenerInfo {
  eventName: string;
  listenerCount: number;
  listeners: string[];
}

/**
 * Get current event listeners from a database pool and its clients
 * Can be called directly at any time via the /api/diagnostics endpoint
 */
export function getDatabaseConnectionListeners(pool?: Pool): ListenerInfo[] {
  const diagnostics: ListenerInfo[] = [];
  
  if (!pool) {
    return diagnostics;
  }

  // Get listeners from the pool itself
  const poolEvents = (pool as any)._events;
  if (poolEvents) {
    Object.keys(poolEvents).forEach(eventName => {
      const listeners = (pool as EventEmitter).listeners(eventName);
      diagnostics.push({
        eventName,
        listenerCount: listeners.length,
        listeners: listeners.map(l => l.toString())
      });
    });
  }

  // Get listeners from active clients
  const activeClients = (pool as any)._clients;
  if (activeClients) {
    activeClients.forEach((client: PoolClient, index: number) => {
      const clientEvents = (client as any)._events;
      if (clientEvents) {
        Object.keys(clientEvents).forEach(eventName => {
          const listeners = (client as EventEmitter).listeners(eventName);
          diagnostics.push({
            eventName: `client_${index}_${eventName}`,
            listenerCount: listeners.length,
            listeners: listeners.map(l => l.toString())
          });
        });
      }
    });
  }

  return diagnostics;
}

/**
 * Optional: Set up automatic monitoring that calls /api/diagnostics when warnings occur
 * Not required to use the diagnostics API directly
 */
export function setupEventListenerWarningMonitoring() {
  let isCollectingDiagnostics = false;

  process.on('warning', async (warning) => {
    if (warning.name === 'MaxListenersExceededWarning' && 
        warning.message.includes('Connection') && 
        !isCollectingDiagnostics) {
      isCollectingDiagnostics = true;
      console.warn('MaxListenersExceededWarning detected, collecting diagnostics...');
      
      try {
        const response = await fetch('/api/diagnostics', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const diagnostics = await response.json();
        console.warn('Connection pool diagnostics:', JSON.stringify(diagnostics, null, 2));
      } catch (error) {
        console.error('Failed to collect diagnostics:', error);
      } finally {
        isCollectingDiagnostics = false;
      }
    }
  });
}

/**
 * Manually collect diagnostics at any time
 */
export async function collectDiagnostics(): Promise<any> {
  try {
    const response = await fetch('/api/diagnostics', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to collect diagnostics:', error);
    throw error;
  }
}
