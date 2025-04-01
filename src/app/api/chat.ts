import { apiClient } from './client';
import { auth } from '@/lib/firebase/config';
import { fetchEventSource } from '@microsoft/fetch-event-source';

export interface ChatMessage {
  type: 'user' | 'system';
  content: string;
}

export interface ChatMessageRequest {
  type?: 'schedule' | 'tasks' | 'general';
  content: string;
  connectionId?: string;
  currentPage?: string;
}

export interface ChatMessageResponse {
  type: 'message' | 'system' | 'error' | 'processing';
  content: string;
  connectionId?: string;
  currentStep?: number;
  totalSteps?: number;
  complete?: boolean;
}

export const chatApi = {
  // Keep track of the current connection
  _currentConnectionId: null as string | null,
  _activeEventSource: null as any,
  
  /**
   * Send a message to the chat API
   */
  async sendMessage(request: ChatMessageRequest): Promise<ChatMessageResponse> {
    console.log('[Chat API] Sending message to backend:', request);
    
    // If no connectionId is provided but we have a current one, use it
    if (!request.connectionId && this._currentConnectionId) {
      console.log('[Chat API] Using stored connectionId:', this._currentConnectionId);
      request.connectionId = this._currentConnectionId;
    }
    
    try {
      const { data } = await apiClient.post<ChatMessageResponse>('/api/v1/chat/message', request);
      console.log('[Chat API] Received response from backend:', data);
      return data;
    } catch (error) {
      console.error('[Chat API] Error sending message to backend:', error);
      throw error;
    }
  },
  
  /**
   * Create an SSE connection for streaming chat responses using fetchEventSource
   * Returns a controller to close the connection and the connection ID
   */
  async createChatStream(onMessage?: (event: string, data: any) => void): Promise<{ eventSource: { close: () => void }, connectionId: string | null }> {
    console.log('[Chat API] createChatStream called');
    
    // If we already have a connection, return it
    if (this._currentConnectionId && this._activeEventSource) {
      console.log('[Chat API] REUSING existing connectionId (NO NETWORK REQUEST):', this._currentConnectionId);
      return {
        eventSource: this._activeEventSource,
        connectionId: this._currentConnectionId
      };
    }
    
    console.log('[Chat API] No valid existing connection, creating new SSE connection');
    
    // Get the current user's token
    const user = auth.currentUser;
    if (!user) {
      console.error('[Chat API] No authenticated user found');
      throw new Error('User not authenticated');
    }
    
    try {
      const token = await user.getIdToken();
      console.log('[Chat API] Successfully obtained Firebase token');
      
      // Get the base URL from the apiClient
      const baseURL = apiClient.defaults.baseURL || '';
      const url = `${baseURL}/api/v1/chat/stream`;
      console.log('[Chat API] Connecting to SSE endpoint:', url);
      
      // Create an abort controller for the fetch
      const abortController = new AbortController();
      
      // Create a controller object with a close method
      const controller = { 
        close: () => {
          console.log('[Chat API] Closing SSE connection');
          abortController.abort();
        } 
      };
      
      // Store the controller for reuse
      this._activeEventSource = controller;
      
      // Create a promise to wait for the connection ID
      return new Promise((resolve, reject) => {
        console.log('[Chat API] Setting up SSE connection with fetchEventSource...');
        
        // Store the connection ID when we receive it
        let connectionId: string | null = null;
        let resolved = false;
        
        // Set a timeout to resolve even if we don't get a connection event
        const timeoutId = setTimeout(() => {
          if (!resolved) {
            console.warn('[Chat API] Connection timeout reached without receiving connectionId');
            resolved = true;
            resolve({ 
              eventSource: controller, 
              connectionId: null 
            });
          }
        }, 5000);
        
        // Use fetchEventSource to establish the SSE connection
        fetchEventSource(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'text/event-stream',
            'Cache-Control': 'no-cache'
          },
          signal: abortController.signal,
          onopen(response) {
            console.log('[Chat API] SSE connection opened with status:', response.status);
            console.log('[Chat API] Response headers:', {
              contentType: response.headers.get('Content-Type'),
              cacheControl: response.headers.get('Cache-Control'),
              connection: response.headers.get('Connection')
            });
            
            if (response.ok) {
              console.log('[Chat API] SSE connection established successfully');
              return Promise.resolve();
            }
            
            // If response is not ok, throw an error
            throw new Error(`Failed to establish SSE connection: ${response.status} ${response.statusText}`);
          },
          onmessage(event) {
            console.log('[Chat API] Received SSE event:', event.event);
            console.log('[Chat API] Event data:', event.data);
            
            // Parse the event data
            try {
              const data = JSON.parse(event.data);
              
              // Handle connection established event
              if (event.event === 'connected' && data.connectionId && !resolved) {
                console.log('[Chat API] Connection established with ID:', data.connectionId);
                connectionId = data.connectionId;
                chatApi._currentConnectionId = data.connectionId;
                
                // Resolve the promise immediately when we get the connectionId
                console.log('[Chat API] Resolving promise with connectionId:', data.connectionId);
                clearTimeout(timeoutId);
                resolved = true;
                resolve({
                  eventSource: controller,
                  connectionId: data.connectionId
                });
              }
              
              // Call the message handler if provided
              if (onMessage && typeof onMessage === 'function') {
                onMessage(event.event, data);
              }
            } catch (err) {
              console.error('[Chat API] Error parsing SSE event data:', err);
            }
          },
          onerror(err) {
            console.error('[Chat API] SSE connection error:', err);
            console.error('[Chat API] Error details:', {
              name: err.name,
              message: err.message,
              stack: err.stack
            });
            
            // Don't immediately reject on error - we'll try to reconnect
            console.log('[Chat API] Aborting fetch due to error');
            abortController.abort();
            
            // If we haven't resolved yet, resolve with null to prevent hanging
            if (!resolved) {
              console.warn('[Chat API] Resolving with null connectionId due to error');
              clearTimeout(timeoutId);
              resolved = true;
              resolve({ 
                eventSource: controller, 
                connectionId: null 
              });
            }
            
            // Clear the stored connection ID to allow reconnection attempts
            chatApi._currentConnectionId = null;
            chatApi._activeEventSource = null;
          },
          onclose() {
            console.log('[Chat API] SSE connection closed');
            // Clear the stored connection ID and event source
            chatApi._currentConnectionId = null;
            chatApi._activeEventSource = null;
            
            // If we haven't resolved yet, resolve with null
            if (!resolved) {
              console.warn('[Chat API] Resolving with null connectionId due to connection close');
              clearTimeout(timeoutId);
              resolved = true;
              resolve({
                eventSource: controller,
                connectionId: null
              });
            }
          },
          // Add custom retry behavior
          openWhenHidden: true  // Keep connection open even when tab is not visible
          // Note: We'll handle retry logic manually in the error handler
        }).catch(error => {
          console.error('[Chat API] Error in fetchEventSource:', error);
          
          // If we haven't resolved yet, reject the promise
          if (!resolved) {
            console.warn('[Chat API] Rejecting promise due to fetchEventSource error');
            clearTimeout(timeoutId);
            resolved = true;
            reject(error);
          }
        });
      });
    } catch (error) {
      console.error('[Chat API] Error setting up SSE connection:', error);
      throw error;
    }
  }
}
