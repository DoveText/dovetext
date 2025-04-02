'use client';

import { useCallback } from 'react';
import { chatApi } from '@/app/api/chat';

/**
 * Configuration options for the message submit handler
 */
export interface MessageSubmitOptions {
  /** The context type for the message */
  contextType: 'schedule' | 'tasks' | 'general';
  /** Function to add a user message to the chat history */
  addUserMessage: (content: string, id?: string) => void;
  /** Function to add a system message to the chat history */
  addSystemMessage: (content: string, id?: string) => void;
  /** Function to set the sending state */
  setIsSending: (isSending: boolean) => void;
  /** Function to process navigation intents */
  processNavigationIntent?: (message: string) => boolean;
  /** Function to handle page-specific commands */
  handlePageSpecificCommand?: (message: string) => boolean;
  /** Whether navigation is enabled */
  enableNavigation?: boolean;
}

/**
 * A hook that handles message submission in chat interfaces.
 * 
 * This hook encapsulates the logic for:
 * - Adding user messages to chat history
 * - Ensuring a connection exists before sending messages
 * - Sending messages to the backend
 * - Handling errors and connection issues
 * - Processing navigation intents and page-specific commands
 * 
 * It addresses the race condition between connection establishment and message sending
 * by using the immediate connectionId returned from connectToSSE.
 * 
 * @param connectionId - The current SSE connection ID, or null if no connection exists
 * @param connectToSSE - Function to establish an SSE connection and get a connectionId
 * @param options - Configuration options for message submission
 * 
 * @returns A function to handle message submission
 * 
 * @example
 * // Basic usage
 * const { connectionId, connectToSSE } = useSSEConnection();
 * 
 * const submitOptions = {
 *   contextType: 'general',
 *   addUserMessage,
 *   addSystemMessage,
 *   setIsSending,
 *   enableNavigation: true,
 *   processNavigationIntent,
 *   handlePageSpecificCommand
 * };
 * 
 * const handleSubmit = useMessageSubmitHandler(
 *   connectionId, 
 *   connectToSSE, 
 *   submitOptions
 * );
 */
export function useMessageSubmitHandler(
  connectionId: string | null,
  connectToSSE: () => Promise<{ connectionId: string | null }>,
  options: MessageSubmitOptions
) {
  const {
    contextType,
    addUserMessage,
    addSystemMessage,
    setIsSending,
    processNavigationIntent,
    handlePageSpecificCommand,
    enableNavigation = false
  } = options;
  
  /**
   * Handles message submission
   * Ensures a connection exists before sending the message
   * 
   * @param message - The message to submit
   */
  const handleSubmit = useCallback(async (message: string) => {
    // Add user message to chat history
    addUserMessage(message);
    
    // Set sending state to show loading animation on submit button
    setIsSending(true);
    
    try {
      console.log('[useMessageSubmitHandler] Sending message with connectionId:', connectionId);
      
      // Ensure we have a connection to the chat backend
      let activeConnectionId = connectionId;
      if (!activeConnectionId) {
        console.log('[useMessageSubmitHandler] No active connection, attempting to connect first');
        const result = await connectToSSE();
        activeConnectionId = result.connectionId;
        if (!activeConnectionId) {
          throw new Error('Failed to establish connection');
        }
      }
      
      // Send the message
      const response = await chatApi.sendMessage({
        type: contextType,
        content: message,
        connectionId: activeConnectionId,
        currentPage: window.location.pathname
      });
      
      // Turn off the sending indicator
      setIsSending(false);
      
      // Check if we got an error response
      if (response.type === 'error') {
        console.warn('[useMessageSubmitHandler] Error response:', response.content);
        
        // Handle connection lost errors
        if (response.content.includes('Connection lost') || response.content.includes('reconnect')) {
          console.warn('[useMessageSubmitHandler] Connection lost, attempting to reconnect');
          
          // Show the error in the chat with a reconnect button
          addSystemMessage('Connection lost. Please click the reconnect button to continue chatting.');
          
          // Don't automatically reconnect - let the user click the button
          return;
        }
        
        // Handle other errors
        addSystemMessage(response.content);
        
        return;
      }
      
      // Check for navigation intents if navigation is enabled
      if (enableNavigation && processNavigationIntent) {
        const handled = processNavigationIntent(message);
        if (handled) {
          console.log('[useMessageSubmitHandler] Navigation intent handled');
          return;
        }
      }
      
      // Check for page-specific commands
      if (handlePageSpecificCommand) {
        const handled = handlePageSpecificCommand(message);
        if (handled) {
          console.log('[useMessageSubmitHandler] Page-specific command handled');
          return;
        }
      }
      
    } catch (error) {
      console.error('[useMessageSubmitHandler] Error sending message:', error);
      
      // Turn off loading states
      setIsSending(false);
      
      // Add error message to chat with reconnect instructions
      addSystemMessage('Sorry, there was an error sending your message. Please use the reconnect button to try again.');
    }
  }, [connectionId, connectToSSE, contextType, addUserMessage, setIsSending, addSystemMessage, enableNavigation, processNavigationIntent, handlePageSpecificCommand]);
  
  return handleSubmit;
}
