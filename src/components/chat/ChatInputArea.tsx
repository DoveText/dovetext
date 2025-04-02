'use client';

import React, { useState, useRef, FormEvent, useImperativeHandle, forwardRef } from 'react';
import { ArrowUpCircleIcon } from '@heroicons/react/24/outline';
import { ChatMessage, ChatTask } from '@/types/chat';
import { InteractiveFunction } from '@/types/interactive';

interface ChatInputAreaProps {
  onSubmit: (message: string) => void;
  isSending: boolean;
  showInputForm: boolean;
  currentTask: ChatTask | null;
  lastInteractiveMessage?: ChatMessage | null;
}

// Define the handle type for the forwarded ref
export interface ChatInputAreaHandle {
  focus: () => void;
}

export const ChatInputArea = forwardRef<ChatInputAreaHandle, ChatInputAreaProps>(({ 
  onSubmit, 
  isSending, 
  showInputForm,
  currentTask,
  lastInteractiveMessage
}, ref) => {
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Expose the focus method to parent components
  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
    }
  }));
  
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      // Refocus the input field even when the message is empty
      setTimeout(() => inputRef.current?.focus(), 0);
      return;
    }

    // Get the current message and clear the input
    const currentMessage = message;
    setMessage('');
    
    // Refocus the input field
    setTimeout(() => inputRef.current?.focus(), 0);
    
    // Call the onSubmit handler with the message
    onSubmit(currentMessage);
  };
  
  // Determine placeholder text based on interactive state
  const getPlaceholder = () => {
    if (currentTask?.complete) {
      return 'Task completed!';
    }
    
    if (lastInteractiveMessage?.interactive && lastInteractiveMessage?.interactiveData && !lastInteractiveMessage?.isResponseSubmitted) {
      const interactiveType = lastInteractiveMessage.interactiveData.function as InteractiveFunction;
      
      switch (interactiveType) {
        case 'chat':
          return 'Type your response...';
        case 'confirm':
          return 'Select Yes or No, or type your response...';
        case 'select':
          return 'Choose an option or type your response...';
        case 'form':
          return 'Fill out the form...';
        default:
          return 'Type your response...';
      }
    }
    
    return currentTask ? 'Continue your conversation...' : 'Ask me anything...';
  };
  
  if (!showInputForm) {
    return null;
  }
  
  // Determine if input should be disabled
  const isInputDisabled = currentTask?.complete || 
    (lastInteractiveMessage?.interactive && 
     lastInteractiveMessage?.interactiveData?.function === 'form' && 
     !lastInteractiveMessage?.isResponseSubmitted);
  
  return (
    <form onSubmit={handleSubmit} className="flex items-center p-4 border-t bg-white chat-form mb-3 rounded-b-lg">
      <div className="relative flex-1">
        <input
          ref={inputRef}
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={getPlaceholder()}
          className={`w-full p-3 pr-12 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isInputDisabled ? 'bg-gray-100' : ''}`}
          disabled={isInputDisabled}
        />
        <button
          type="submit"
          disabled={currentTask?.complete || isSending || isInputDisabled}
          className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full focus:outline-none ${
            currentTask?.complete || isInputDisabled
              ? 'text-gray-400' 
              : isSending 
                ? 'text-blue-500' 
                : 'text-blue-500 hover:bg-blue-100'
          }`}
        >
          {isSending ? (
            <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <ArrowUpCircleIcon className="h-6 w-6" />
          )}
        </button>
      </div>
    </form>
  );
});

ChatInputArea.displayName = 'ChatInputArea';

export default ChatInputArea;
