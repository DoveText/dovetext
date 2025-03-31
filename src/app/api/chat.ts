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

export interface ChatSessionRequest {
  contextType?: 'schedule' | 'tasks' | 'general';
  currentPage?: string;
}

export interface ChatSessionResponse {
  sessionId: string;
  expiresAt: number; // Timestamp when the session expires
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
   * Create a chat session
   * This creates a secure, short-lived session for the SSE connection
   */
  async createChatSession(request: ChatSessionRequest): Promise<ChatSessionResponse> {
    const { data } = await apiClient.post<ChatSessionResponse>('/api/v1/chat/createSession', request);
    return data;
  },
  
  /**
   * Create an SSE connection for streaming chat responses
   * Returns an EventSource instance and the connection ID
   */
  async createChatStream(contextType?: 'schedule' | 'tasks' | 'general', currentPage?: string): Promise<{ eventSource: EventSource, connectionId: string | null }> {
    // Get the current user's token
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // First create a session with the backend
    const sessionResponse = await this.createChatSession({
      contextType,
      currentPage
    });
    
    // Get the base URL from the apiClient
    const baseURL = apiClient.defaults.baseURL || '';
    
    // Use the session ID for the SSE connection
    const eventSource = new EventSource(`${baseURL}/api/v1/stream/chat?sessionId=${sessionResponse.sessionId}`, {
      withCredentials: true
    });
    
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
