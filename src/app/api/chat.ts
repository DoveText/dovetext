import { apiClient } from './client';
import { auth } from '@/lib/firebase/config';
import { fetchEventSource } from '@microsoft/fetch-event-source';

export interface ChatMessage {
  type: 'user' | 'system';
  content: string;
}

export interface ChatMessageRequest {
  message: string;
  connectionId?: string;
  contextType?: 'schedule' | 'tasks' | 'general';
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
  async createChatStream(): Promise<{ eventSource: { close: () => void }, connectionId: string | null }> {
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
      
      // Store the connection ID when we receive it
      let connectionId: string | null = null;
      
      // Return both the controller and a promise that resolves with the connection ID
      return new Promise((resolve, reject) => {
        console.log('[Chat API] Setting up SSE connection with fetchEventSource...');
        let controller: { close: () => void } | null = null;
        
        // Set a timeout to resolve even if we don't get a connection event
        const timeoutId = setTimeout(() => {
          console.warn('[Chat API] Connection timeout reached without receiving connectionId');
          if (!connectionId && controller) {
            console.warn('[Chat API] Resolving with null connectionId due to timeout');
            resolve({ 
              eventSource: controller || { close: () => console.log('[Chat API] Closing dummy controller') }, 
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
          onopen(response) {
            console.log('[Chat API] SSE connection opened with status:', response.status, response.statusText);
            console.log('[Chat API] Response headers:', {
              contentType: response.headers.get('content-type'),
              cacheControl: response.headers.get('cache-control'),
              connection: response.headers.get('connection')
            });
            
            // Connection opened successfully
            if (response.ok && response.headers.get('content-type')?.includes('text/event-stream')) {
              console.log('[Chat API] SSE connection established successfully');
              return Promise.resolve(); // Return a Promise to satisfy TypeScript
            } else {
              // If we get an error response, throw an error to trigger the onerror handler
              const errorMsg = `Failed to open SSE connection: ${response.status} ${response.statusText}`;
              console.error('[Chat API] ' + errorMsg);
              clearTimeout(timeoutId);
              reject(new Error(errorMsg));
              return Promise.reject(new Error(errorMsg));
            }
          },
          onmessage(event) {
            console.log('[Chat API] Received SSE event:', event.event);
            console.log('[Chat API] Event data:', event.data);
            
            // Handle different event types
            if (event.event === 'connected') {
              try {
                const data = JSON.parse(event.data);
                connectionId = data.connectionId;
                // Store the connection ID for reuse
                chatApi._currentConnectionId = connectionId;
                console.log('[Chat API] Connection established with ID:', connectionId);
                
                // Clear the timeout and resolve the promise
                clearTimeout(timeoutId);
                if (controller) {
                  console.log('[Chat API] Resolving promise with connectionId:', connectionId);
                  resolve({ eventSource: controller, connectionId });
                }
              } catch (error) {
                console.error('[Chat API] Error parsing SSE connected event', error);
              }
            } else if (event.event === 'message') {
              console.log('[Chat API] Received message event');
              try {
                const data = JSON.parse(event.data);
                console.log('[Chat API] Parsed message data:', data);
              } catch (error) {
                console.error('[Chat API] Error parsing message event data:', error);
              }
            } else {
              console.log('[Chat API] Received unknown event type:', event.event);
            }
          },
          onerror(err) {
            console.error('[Chat API] SSE connection error:', err);
            console.error('[Chat API] Error details:', {
              name: err.name,
              message: err.message,
              stack: err.stack
            });
            // Don't retry on error, just reject the promise
            clearTimeout(timeoutId);
            reject(err);
          },
          onclose() {
            console.log('[Chat API] SSE connection closed');
            // Clear the stored connection ID and event source
            chatApi._currentConnectionId = null;
            chatApi._activeEventSource = null;
          }
        }).then(ctrl => {
          // Store the controller
          console.log('[Chat API] Received controller from fetchEventSource');
          controller = ctrl;
          
          // Store the controller for reuse
          chatApi._activeEventSource = controller;
          
          // If we already have the connectionId, resolve the promise
          if (connectionId) {
            console.log('[Chat API] Already have connectionId, resolving promise');
            clearTimeout(timeoutId);
            resolve({ 
              eventSource: controller, 
              connectionId 
            });
          } else {
            console.log('[Chat API] Waiting for connectionId event...');
          }
        }).catch(error => {
          console.error('Error establishing SSE connection', error);
          clearTimeout(timeoutId);
          reject(error);
        });
      });
    } catch (error) {
      console.error('Error in createChatStream:', error);
      throw error;
    }
  }
}
