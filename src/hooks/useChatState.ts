'use client';

import { useState, useCallback } from 'react';

/**
 * Represents a chat message in the conversation history
 */
export interface ChatMessage {
  /** Type of the message (user, system, or error) */
  type: 'user' | 'system' | 'error';
  /** Content of the message */
  content: string;
  /** Optional ID for the message, useful for referencing or updating */
  id?: string;
  /** Optional timestamp for the message */
  timestamp?: number;
}

/**
 * Represents the current task being processed by the chat
 */
export interface ChatTask {
  /** Whether the task is complete */
  complete: boolean;
  /** Total number of steps in the task */
  steps: number;
  /** Current step being processed */
  currentStep: number;
}

/**
 * A hook that manages the state of a chat conversation.
 * 
 * This hook centralizes all chat-related state management, including:
 * - Chat history (messages from user and system)
 * - Current task progress tracking
 * - Processing states and indicators
 * - Input form visibility
 * 
 * It provides methods to add messages, update task progress, and manage the UI state
 * related to the chat, making it easier to maintain a consistent chat experience
 * across the application.
 * 
 * @returns An object containing chat state and methods to manipulate it
 * 
 * @example
 * // Basic usage
 * const {
 *   chatHistory,
 *   addUserMessage,
 *   addSystemMessage,
 *   isProcessing,
 *   setProcessing
 * } = useChatState();
 * 
 * // Adding messages
 * const handleSubmit = (message) => {
 *   addUserMessage(message);
 *   // ... process message ...
 *   addSystemMessage('Response from the system');
 * };
 * 
 * // Showing processing state
 * const handleThinking = () => {
 *   setProcessing(true, 'Thinking...');
 * };
 */
export function useChatState() {
  // Chat history state
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  
  // Task tracking state
  const [currentTask, setCurrentTask] = useState<ChatTask | null>(null);
  
  // UI state for the chat
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingHint, setProcessingHint] = useState('');
  const [showInputForm, setShowInputForm] = useState(true);
  const [isSending, setIsSending] = useState(false);
  
  /**
   * Adds a user message to the chat history
   * 
   * @param content - The content of the user message
   * @param id - Optional ID for the message
   */
  const addUserMessage = useCallback((content: string, id?: string) => {
    setChatHistory(prev => [...prev, {
      type: 'user',
      content,
      id,
      timestamp: Date.now()
    }]);
  }, []);
  
  /**
   * Adds a system message to the chat history
   * 
   * @param content - The content of the system message
   * @param id - Optional ID for the message
   */
  const addSystemMessage = useCallback((content: string, id?: string) => {
    setChatHistory(prev => [...prev, {
      type: 'system',
      content,
      id,
      timestamp: Date.now()
    }]);
  }, []);
  
  /**
   * Adds an error message to the chat history
   * 
   * @param content - The content of the error message
   * @param id - Optional ID for the message
   */
  const addErrorMessage = useCallback((content: string, id?: string) => {
    setChatHistory(prev => [...prev, {
      type: 'error',
      content,
      id,
      timestamp: Date.now()
    }]);
  }, []);
  
  /**
   * Clears the chat history
   */
  const clearChatHistory = useCallback(() => {
    setChatHistory([]);
    setCurrentTask(null);
  }, []);
  
  /**
   * Updates the current task progress
   * 
   * @param task - The updated task information
   */
  const updateTask = useCallback((task: Partial<ChatTask>) => {
    setCurrentTask(prev => {
      if (!prev) {
        return {
          complete: task.complete || false,
          steps: task.steps || 1,
          currentStep: task.currentStep || 1
        };
      }
      
      return {
        ...prev,
        ...task
      };
    });
  }, []);
  
  /**
   * Sets the processing state and optional hint message
   * 
   * @param processing - Whether the system is processing
   * @param hint - Optional hint message to display during processing
   */
  const setProcessing = useCallback((processing: boolean, hint: string = '') => {
    setIsProcessing(processing);
    setProcessingHint(hint);
  }, []);
  
  return {
    // State
    chatHistory,
    currentTask,
    isProcessing,
    processingHint,
    showInputForm,
    isSending,
    
    // State setters
    setChatHistory,
    setCurrentTask,
    setIsProcessing,
    setProcessingHint,
    setShowInputForm,
    setIsSending,
    
    // Helper methods
    addUserMessage,
    addSystemMessage,
    addErrorMessage,
    clearChatHistory,
    updateTask,
    setProcessing
  };
}
