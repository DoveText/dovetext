'use client';

import { useState, useCallback, useEffect } from 'react';
import { chatApi } from '@/app/api/chat';

interface SSEConnectionResult {
  connectionId: string | null;
}

type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';

// Define the event types that can be received from the SSE connection
export type SSEEventType = 'thinking' | 'processing' | 'message' | 'task_update' | 'action';

// Define the structure of SSE event data
export interface SSEEventData {
  type: SSEEventType;
  content?: string;
  id?: string;
  complete?: boolean;
  steps?: number;
  currentStep?: number;
  actionType?: string;
  [key: string]: any; // Allow for additional properties
}

// Define callback types for different event types
export interface SSEEventCallbacks {
  onThinking?: (content: string) => void;
  onProcessing?: (content: string) => void;
  onMessage?: (content: string, id?: string) => void;
  onTaskUpdate?: (task: { complete: boolean, steps: number, currentStep: number }) => void;
  onAction?: (actionType: string, data: any) => void;
  onError?: (error: Error) => void;
  onConnectionStatusChange?: (status: ConnectionStatus) => void;
}

// Define options for the hook
export interface SSEConnectionOptions {
  autoConnect?: boolean; // Whether to automatically connect when isActive becomes true
  autoReconnect?: boolean; // Whether to automatically attempt reconnection when disconnected
  maxReconnectAttempts?: number; // Maximum number of automatic reconnection attempts
  isActive?: boolean; // Whether the connection should be active (e.g., chat is expanded)
}

// Define a custom EventSource interface that matches what chatApi.createChatStream returns
interface CustomEventSource {
  close: () => void;
}

export function useSSEConnection(callbacks?: SSEEventCallbacks, options?: SSEConnectionOptions) {
  // Default options
  const {
    autoConnect = true,
    autoReconnect = true,
    maxReconnectAttempts = 5,
    isActive = true
  } = options || {};
  
  // SSE connection state
  const [eventSource, setEventSource] = useState<CustomEventSource | null>(null);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Connection status tracking
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const MAX_AUTO_RECONNECT_ATTEMPTS = maxReconnectAttempts;

  // Notify about connection status changes
  useEffect(() => {
    if (callbacks?.onConnectionStatusChange) {
      callbacks.onConnectionStatusChange(connectionStatus);
    }
  }, [connectionStatus, callbacks]);

  // Process SSE events
  const processSSEEvent = useCallback((eventType: string, eventData: any) => {
    console.log('[useSSEConnection] Processing SSE event:', eventType, eventData);
    
    try {
      // Process different event types
      if (eventData.type === 'thinking' || eventData.type === 'processing') {
        const content = eventData.content || 'Thinking...';
        if (eventData.type === 'thinking' && callbacks?.onThinking) {
          callbacks.onThinking(content);
        } else if (eventData.type === 'processing' && callbacks?.onProcessing) {
          callbacks.onProcessing(content);
        }
      } else if (eventData.type === 'message' && callbacks?.onMessage) {
        callbacks.onMessage(eventData.content, eventData.id);
      } else if (eventData.type === 'task_update' && callbacks?.onTaskUpdate) {
        callbacks.onTaskUpdate({
          complete: eventData.complete || false,
          steps: eventData.steps || 1,
          currentStep: eventData.currentStep || 1
        });
      } else if (eventData.type === 'action' && callbacks?.onAction) {
        callbacks.onAction(eventData.actionType, eventData);
      }
    } catch (error) {
      console.error('[useSSEConnection] Error processing SSE event:', error);
      if (callbacks?.onError) {
        callbacks.onError(error as Error);
      }
    }
  }, [callbacks]);

  // Function to establish SSE connection
  const connectToSSE = useCallback(async (isReconnecting = false): Promise<SSEConnectionResult> => {
    console.log('[useSSEConnection] Starting SSE connection...');
    try {
      // Prevent duplicate connection attempts
      if (isConnecting && !isReconnecting) {
        console.log('[useSSEConnection] Connection already in progress, skipping');
        return { connectionId };
      }
      
      // Update connection status
      if (isReconnecting) {
        setConnectionStatus('reconnecting');
      } else {
        setIsConnecting(true);
      }
      
      // Define the message handler for SSE events
      const handleSSEEvent = (eventType: string, data: any) => {
        console.log('[useSSEConnection] Received SSE event:', eventType, data);
        
        // Update connection status on first successful message
        if (connectionStatus !== 'connected') {
          setConnectionStatus('connected');
          setReconnectAttempts(0);
        }
        
        // Process the event
        processSSEEvent(eventType, data);
      };
      
      console.log('[useSSEConnection] Calling createChatStream');
      const { eventSource: newEventSource, connectionId: newConnectionId } = await chatApi.createChatStream(handleSSEEvent);
      
      console.log('[useSSEConnection] createChatStream returned:', { 
        eventSource: !!newEventSource, 
        connectionId: newConnectionId 
      });
      
      // Update state with new connection details
      setEventSource(newEventSource);
      setConnectionId(newConnectionId);
      setIsConnecting(false);
      setConnectionStatus('connected');
      
      // Return the connection ID for immediate use
      return { connectionId: newConnectionId };
    } catch (error) {
      console.error('[useSSEConnection] Error establishing SSE connection:', error);
      setIsConnecting(false);
      setConnectionStatus('disconnected');
      
      if (callbacks?.onError) {
        callbacks.onError(error as Error);
      }
      
      return { connectionId: null };
    }
  }, [isConnecting, connectionId, connectionStatus, processSSEEvent, callbacks]);

  // Function to handle manual reconnection
  const handleReconnect = useCallback(async () => {
    if (connectionStatus === 'reconnecting') return;
    
    // Attempt to reconnect
    await connectToSSE(true);
  }, [connectToSSE, connectionStatus]);

  // Centralized function to handle connection termination
  const terminateConnection = useCallback(() => {
    if (eventSource) {
      console.log('[useSSEConnection] Terminating SSE connection');
      // Use the terminateChatStream method to properly notify the server
      chatApi.terminateChatStream().catch(err => {
        console.error('[useSSEConnection] Error terminating chat stream:', err);
      });
      
      // Clean up the event source
      eventSource.close();
      setEventSource(null);
      setConnectionId(null);
      setConnectionStatus('disconnected');
    }
  }, [eventSource]);

  // Auto-connect when isActive becomes true
  useEffect(() => {
    if (isActive && autoConnect && connectionStatus === 'disconnected' && !isConnecting) {
      console.log('[useSSEConnection] Auto-connecting because isActive is true');
      const initializeConnection = async () => {
        try {
          await connectToSSE();
        } catch (error) {
          console.error('[useSSEConnection] Error initializing connection:', error);
          setConnectionStatus('disconnected');
        }
      };
      
      initializeConnection();
    } else if (!isActive && connectionStatus !== 'disconnected') {
      // Terminate connection when isActive becomes false
      console.log('[useSSEConnection] Terminating connection because isActive is false');
      terminateConnection();
    }
    
    // Clean up connection when component unmounts
    return () => {
      if (eventSource) {
        console.log('[useSSEConnection] Cleaning up connection on unmount');
        terminateConnection();
      }
    };
  }, [isActive, autoConnect, connectionStatus, isConnecting, connectToSSE, terminateConnection, eventSource]);

  // Add automatic reconnection logic with exponential backoff
  useEffect(() => {
    let reconnectTimer: NodeJS.Timeout | null = null;
    
    // Only attempt automatic reconnection if:
    // 1. Auto-reconnect is enabled
    // 2. We're currently disconnected
    // 3. We haven't exceeded the maximum number of attempts
    // 4. The connection should be active
    if (autoReconnect && 
        connectionStatus === 'disconnected' && 
        reconnectAttempts < MAX_AUTO_RECONNECT_ATTEMPTS && 
        isActive) {
      
      console.log(`[useSSEConnection] Attempting automatic reconnection (attempt ${reconnectAttempts + 1}/${MAX_AUTO_RECONNECT_ATTEMPTS})`);
      
      // Use exponential backoff for reconnection attempts
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
      
      reconnectTimer = setTimeout(() => {
        handleReconnect();
      }, delay);
    }
    
    // Clean up timer on unmount or when reconnection status changes
    return () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
    };
  }, [connectionStatus, reconnectAttempts, MAX_AUTO_RECONNECT_ATTEMPTS, isActive, autoReconnect, handleReconnect]);

  return {
    eventSource,
    connectionId,
    isConnecting,
    connectionStatus,
    reconnectAttempts,
    MAX_AUTO_RECONNECT_ATTEMPTS,
    connectToSSE,
    handleReconnect,
    terminateConnection,
    setReconnectAttempts,
    setConnectionStatus
  };
}
