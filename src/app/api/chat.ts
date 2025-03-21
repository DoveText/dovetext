import { apiClient } from './client';
import { auth } from '@/lib/firebase/config';

export interface ChatMessage {
  type: 'user' | 'system';
  content: string;
  connectionId?: string;
  complete?: boolean;
  currentStep?: number;
  totalSteps?: number;
}

export interface ChatRequest {
  content: string;
  connectionId: string;
  contextType?: 'schedule' | 'tasks' | 'general';
}

export interface ChatResponse {
  type: string;
  content: string;
  connectionId: string;
  complete?: boolean;
  currentStep?: number;
  totalSteps?: number;
}

export const chatApi = {
  /**
   * Send a message to the chat API
   */
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    const { data } = await apiClient.post<ChatResponse>('/api/v1/chat/message', request);
    return data;
  },
  
  /**
   * Create an SSE connection for streaming chat responses
   * Returns an EventSource instance and the connection ID
   */
  async createChatStream(): Promise<{ eventSource: EventSource, connectionId: string | null }> {
    // Get the current user's token
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const token = await user.getIdToken();
    
    // Create EventSource with authorization header
    const eventSource = new EventSource(`/api/v1/chat/stream`, {
      withCredentials: true
    });
    
    // Add authorization header via a custom fetch
    const originalFetch = window.fetch;
    window.fetch = async function(input, init) {
      if (typeof input === 'string' && input.includes('/api/v1/chat/stream')) {
        init = init || {};
        init.headers = init.headers || {};
        Object.assign(init.headers, {
          'Authorization': `Bearer ${token}`
        });
      }
      return originalFetch.call(this, input, init);
    };
    
    // Store the connection ID when we receive it
    let connectionId: string | null = null;
    
    // Return both the event source and a promise that resolves with the connection ID
    return new Promise((resolve) => {
      const onConnected = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          connectionId = data.connectionId;
          eventSource.removeEventListener('connected', onConnected);
          resolve({ eventSource, connectionId });
        } catch (error) {
          console.error('Error parsing SSE connected event', error);
        }
      };
      
      eventSource.addEventListener('connected', onConnected);
      
      // If we don't get a connection event within 5 seconds, resolve anyway
      setTimeout(() => {
        if (!connectionId) {
          console.warn('No connection ID received within timeout');
          resolve({ eventSource, connectionId: null });
        }
      }, 5000);
    });
  }
};
