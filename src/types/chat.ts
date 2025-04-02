/**
 * Types related to chat functionality
 */

/**
 * ChatMessage represents a single message in the chat history
 */
export interface ChatMessage {
  type: 'user' | 'system' | 'error';
  content: string;
  id?: string;
  timestamp?: number;
}

/**
 * ChatTask represents a multi-step task being performed by the chat assistant
 */
export interface ChatTask {
  complete: boolean;
  steps: number;
  currentStep: number;
}

/**
 * Possible connection status values for the SSE connection
 */
export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';

/**
 * Animation states for the chat UI
 */
export type AnimationState = 'closed' | 'opening' | 'open' | 'closing';

/**
 * Custom EventSource interface that matches what chatApi.createChatStream returns
 */
export interface CustomEventSource {
  close: () => void;
}

/**
 * Result type returned by the connectToSSE function
 * Contains the connectionId that can be used immediately without waiting for state updates
 */
export interface SSEConnectionResult {
  connectionId: string | null;
}

/**
 * Options for configuring the message submit handler
 */
export interface MessageSubmitOptions {
  contextType: 'schedule' | 'tasks' | 'general';
  enableNavigation?: boolean;
  processNavigationIntent?: (text: string) => boolean;
  handlePageSpecificCommand?: (text: string) => boolean;
}

/**
 * Options for configuring the navigation handler
 */
export interface NavigationHandlerOptions {
  onSwitchContext?: (contextType: 'schedule' | 'tasks' | 'general') => void;
  onNavigationStart?: (action: string) => void;
  onNavigationComplete?: () => void;
}

/**
 * Options for configuring the chat trigger handler
 */
export interface ChatTriggerOptions {
  contextType: 'schedule' | 'tasks' | 'general';
  enabled?: boolean;
}
