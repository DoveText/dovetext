'use client';

import React, { useEffect, useRef } from 'react';
import { ChatTask } from '@/hooks/useChatState';

// Define the props for the ChatMessageList component
interface ChatMessageListProps {
  chatHistory: Array<{ type: 'user' | 'system' | 'error', content: string, id?: string }>;
  isProcessing: boolean;
  processingHint: string;
  currentTask: ChatTask | null;
  getContextExample: () => string;
}

/**
 * ChatMessageList component displays the chat messages and handles scrolling
 * Features:
 * - Displays user and system messages with different styling
 * - Shows a typing indicator when the system is processing
 * - Displays a welcome message when the chat is empty
 * - Auto-scrolls to the bottom when new messages arrive
 */
export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  chatHistory,
  isProcessing,
  processingHint,
  currentTask,
  getContextExample
}) => {
  // Reference to the chat container for auto-scrolling
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when chat history changes or when processing state changes
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, isProcessing]);

  return (
    <div 
      ref={chatContainerRef}
      className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
    >
      {/* Welcome message when chat is empty */}
      {chatHistory.length === 0 && !isProcessing && (
        <div className="text-center py-8">
          <h3 className="text-lg font-medium text-gray-700 mb-2">How can I help you today?</h3>
          <p className="text-sm text-gray-500 mb-4">
            Try asking me something like {getContextExample()}
          </p>
        </div>
      )}

      {/* Display chat messages */}
      {chatHistory.map((message, index) => (
        <div 
          key={message.id || `message-${index}`}
          className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div 
            className={`max-w-[85%] rounded-lg px-4 py-2 ${
              message.type === 'user' 
                ? 'bg-blue-500 text-white' 
                : message.type === 'error'
                  ? 'bg-red-100 text-red-800 border border-red-200'
                  : 'bg-white text-gray-800 border border-gray-200'
            }`}
          >
            {message.content}
          </div>
        </div>
      ))}

      {/* Show typing indicator when processing */}
      {isProcessing && (
        <div className="flex justify-start">
          <div className="bg-white text-gray-800 border border-gray-200 rounded-lg px-4 py-2 max-w-[85%]">
            <div className="flex items-center">
              <span className="text-sm">{processingHint}</span>
              <span className="ml-2 flex space-x-1">
                <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Show task progress if available */}
      {currentTask && !currentTask.complete && (
        <div className="mt-4 bg-blue-50 border border-blue-100 rounded-lg p-3">
          <div className="text-sm text-blue-800 mb-1">
            Task in progress: Step {currentTask.currentStep} of {currentTask.steps}
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full" 
              style={{ width: `${(currentTask.currentStep / currentTask.steps) * 100}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatMessageList;
