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
  /**
   * Send a message to the chat API
   */
  async sendMessage(request: ChatMessageRequest): Promise<ChatMessageResponse> {
    const { data } = await apiClient.post<ChatMessageResponse>('/api/v1/chat/message', request);
    return data;
  },
  
  /**
   * Create an SSE connection for streaming chat responses using fetchEventSource
   * Returns a controller to close the connection and the connection ID
   */
  async createChatStream(): Promise<{ eventSource: { close: () => void }, connectionId: string | null }> {
    // Get the current user's token
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const token = await user.getIdToken();
    
    // Get the base URL from the apiClient
    const baseURL = apiClient.defaults.baseURL || '';
    const url = `${baseURL}/api/v1/chat/stream`;
    
    // Store the connection ID when we receive it
    let connectionId: string | null = null;
    
    // Return both the controller and a promise that resolves with the connection ID
    return new Promise((resolve, reject) => {
      let controller: { close: () => void } | null = null;
      
      // Set a timeout to resolve even if we don't get a connection event
      const timeoutId = setTimeout(() => {
        if (!connectionId && controller) {
          console.warn('No connection ID received within timeout');
          resolve({ 
            eventSource: controller || { close: () => console.log('Closing dummy controller') }, 
            connectionId: null 
          });
        }
      }, 5000);
      
      // Use fetchEventSource to establish the SSE connection
      fetchEventSource(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        onopen(response) {
          // Connection opened successfully
          if (response.ok && response.headers.get('content-type')?.includes('text/event-stream')) {
            console.log('SSE connection opened successfully');
            return Promise.resolve(); // Return a Promise to satisfy TypeScript
          } else {
            // If we get an error response, throw an error to trigger the onerror handler
            const error = new Error(`Failed to open SSE connection: ${response.status} ${response.statusText}`);
            console.error(error);
            clearTimeout(timeoutId);
            reject(error);
            return Promise.reject(error);
          }
        },
        onmessage(event) {
          // Handle different event types
          if (event.event === 'connected') {
            try {
              const data = JSON.parse(event.data);
              connectionId = data.connectionId;
              
              // Clear the timeout and resolve the promise
              clearTimeout(timeoutId);
              if (controller) {
                resolve({ eventSource: controller, connectionId });
              }
            } catch (error) {
              console.error('Error parsing SSE connected event', error);
            }
          }
        },
        onerror(err) {
          console.error('SSE connection error', err);
          // Don't retry on error, just reject the promise
          clearTimeout(timeoutId);
          reject(err);
        },
        onclose() {
          console.log('SSE connection closed');
        }
      }).then(ctrl => {
        // Store the controller
        controller = ctrl;
        
        // If we already have the connectionId, resolve the promise
        if (connectionId) {
          clearTimeout(timeoutId);
          resolve({ 
            eventSource: controller, 
            connectionId 
          });
        }
      }).catch(error => {
        console.error('Error establishing SSE connection', error);
        clearTimeout(timeoutId);
        reject(error);
      });
    });
  }
}
