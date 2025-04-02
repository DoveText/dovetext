'use client';

import { useEffect, useCallback, useState } from 'react';
import { chatApi } from '@/app/api/chat';

/**
 * Configuration options for the chat trigger handler
 */
export interface ChatTriggerOptions {
  /** Called when a chat trigger event is received with the message to process */
  onTrigger?: (message: string) => void;
  /** Called when an error occurs while processing a trigger */
  onError?: (error: Error) => void;
  /** The context type to use when sending triggered messages */
  contextType?: 'schedule' | 'tasks' | 'general';
  /** Whether the chat trigger functionality is enabled */
  enabled?: boolean;
  /** Called when a message has been processed */
  onMessageProcessed?: () => void;
}

/**
 * A hook that handles chat trigger events from external sources.
 * 
 * This hook solves the race condition problem between establishing an SSE connection
 * and sending messages by ensuring a connection exists before processing messages.
 * 
 * It listens for 'triggerChatBubble' custom events and processes them by:
 * 1. Ensuring an SSE connection is established
 * 2. Sending the message using the established connection
 * 3. Notifying the parent component about the trigger
 * 
 * @param connectionId - The current SSE connection ID, or null if no connection exists
 * @param connectToSSE - Function to establish an SSE connection and get a connectionId
 * @param options - Configuration options for the chat trigger handler
 * 
 * @example
 * // Basic usage
 * const { connectionId, connectToSSE } = useSSEConnection();
 * 
 * const chatTriggerOptions = {
 *   onTrigger: (message) => {
 *     // Handle the triggered message, e.g., expand chat and add to history
 *     expandChat();
 *     setChatHistory([{ type: 'user', content: message }]);
 *   },
 *   contextType: 'general',
 *   enabled: true
 * };
 * 
 * useChatTriggerHandler(connectionId, connectToSSE, chatTriggerOptions);
 */
export function useChatTriggerHandler(
  connectionId: string | null,
  connectToSSE: () => Promise<{ connectionId: string | null }>,
  options?: ChatTriggerOptions
) {
  // Track if we're currently processing a trigger
  const [isProcessingTrigger, setIsProcessingTrigger] = useState(false);
  
  // Destructure options with defaults
  const {
    onTrigger,
    onError,
    onMessageProcessed,
    contextType = 'general',
    enabled = true
  } = options || {};
  
  /**
   * Process a chat trigger event
   * Ensures a connection exists before sending the message
   * 
   * @param event - The custom event containing the message to process
   */
  const handleChatTrigger = useCallback(async (event: CustomEvent) => {
    // Skip processing if disabled or already processing
    if (!enabled || isProcessingTrigger) {
      console.log('[useChatTriggerHandler] Skipping trigger: disabled or already processing');
      return;
    }
    
    // Check if the event has a message
    if (!event.detail?.message) {
      console.warn('[useChatTriggerHandler] Trigger event missing message');
      return;
    }
    
    const userMessage = event.detail.message;
    console.log('[useChatTriggerHandler] Received chat trigger with message:', userMessage);
    
    // Set processing state to prevent multiple simultaneous triggers
    setIsProcessingTrigger(true);
    
    try {
      // Notify parent component about the trigger
      if (onTrigger) {
        onTrigger(userMessage);
      }
      
      // Ensure we have a connection before processing the message
      let activeConnectionId = connectionId;
      if (!activeConnectionId) {
        console.log('[useChatTriggerHandler] No active connection, attempting to connect first');
        
        // Wait for connection to be established
        const result = await connectToSSE();
        activeConnectionId = result.connectionId;
        
        if (!activeConnectionId) {
          throw new Error('Failed to establish connection');
        }
        
        console.log('[useChatTriggerHandler] Connection established successfully:', activeConnectionId);
      }
      
      // Now that we have a connection, send the message
      console.log('[useChatTriggerHandler] Sending triggered message with connectionId:', activeConnectionId);
      
      await chatApi.sendMessage({
        type: contextType as 'schedule' | 'tasks' | 'general',
        content: userMessage,
        connectionId: activeConnectionId,
        currentPage: window.location.pathname
      });
      
      // Notify that message was processed successfully
      if (onMessageProcessed) {
        onMessageProcessed();
      }
      
    } catch (error) {
      console.error('[useChatTriggerHandler] Error processing triggered message:', error);
      
      // Notify about the error
      if (onError) {
        onError(error as Error);
      }
    } finally {
      // Reset processing state
      setIsProcessingTrigger(false);
    }
  }, [connectionId, connectToSSE, onTrigger, onError, onMessageProcessed, contextType, enabled, isProcessingTrigger]);
  
  // Set up event listener for chat triggers
  useEffect(() => {
    // Only set up listener if enabled
    if (!enabled) {
      return;
    }
    
    console.log('[useChatTriggerHandler] Setting up chat trigger event listener');
    
    // Add event listener for chat triggers
    window.addEventListener('triggerChatBubble', (handleChatTrigger as unknown) as EventListener);
    
    // Clean up event listener on unmount
    return () => {
      console.log('[useChatTriggerHandler] Removing chat trigger event listener');
      window.removeEventListener('triggerChatBubble', (handleChatTrigger as unknown) as EventListener);
    };
  }, [enabled, handleChatTrigger]);
  
  // Return processing state for external use if needed
  return {
    isProcessingTrigger
  };
}
