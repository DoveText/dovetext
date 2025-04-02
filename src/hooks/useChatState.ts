'use client';

import { useState, useCallback } from 'react';

export interface ChatMessage {
  type: 'user' | 'system';
  content: string;
  id?: string;
}

export interface ChatTask {
  complete: boolean;
  steps: number;
  currentStep: number;
}

export function useChatState() {
  // Chat history state
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  
  // Current task state
  const [currentTask, setCurrentTask] = useState<ChatTask | null>(null);
  
  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingHint, setProcessingHint] = useState('Thinking...');
  
  // Input form state
  const [showInputForm, setShowInputForm] = useState(true);
  const [isSending, setIsSending] = useState(false);
  
  // Add a user message to the chat history
  const addUserMessage = useCallback((content: string) => {
    setChatHistory(prev => [...prev, { 
      type: 'user', 
      content 
    }]);
  }, []);
  
  // Add a system message to the chat history
  const addSystemMessage = useCallback((content: string, id?: string) => {
    setChatHistory(prev => [...prev, { 
      type: 'system', 
      content,
      id
    }]);
  }, []);
  
  // Add an error message to the chat history
  const addErrorMessage = useCallback((content: string) => {
    setChatHistory(prev => [...prev, { 
      type: 'system', 
      content: `Error: ${content}`
    }]);
  }, []);
  
  // Clear the chat history
  const clearChatHistory = useCallback(() => {
    setChatHistory([]);
    setCurrentTask(null);
  }, []);
  
  // Update the current task
  const updateTask = useCallback((taskData: Partial<ChatTask>) => {
    setCurrentTask(prev => {
      if (!prev) {
        return {
          complete: taskData.complete || false,
          steps: taskData.steps || 1,
          currentStep: taskData.currentStep || 1
        };
      }
      
      return {
        ...prev,
        ...taskData
      };
    });
  }, []);
  
  // Set processing state
  const setProcessing = useCallback((isProcessing: boolean, hint?: string) => {
    setIsProcessing(isProcessing);
    if (hint) {
      setProcessingHint(hint);
    }
  }, []);
  
  return {
    // State
    chatHistory,
    currentTask,
    isProcessing,
    processingHint,
    showInputForm,
    isSending,
    
    // Setters
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
