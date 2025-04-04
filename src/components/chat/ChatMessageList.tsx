'use client';

import React, { useEffect, useRef } from 'react';
import { ChatMessage, ChatTask } from '@/types/chat';
import InteractiveMessageHandler from '@/components/interactive/InteractiveMessageHandler';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

// Define the props for the ChatMessageList component
interface ChatMessageListProps {
  chatHistory: ChatMessage[];
  isProcessing: boolean;
  processingHint: string;
  currentTask: ChatTask | null;
  getContextExample: () => string;
  onInteractiveResponse?: (messageId: string, response: any) => void;
}

/**
 * ChatMessageList component displays the chat messages and handles scrolling
 * Features:
 * - Displays user and system messages with different styling
 * - Shows a typing indicator when the system is processing
 * - Displays a welcome message when the chat is empty
 * - Auto-scrolls to the bottom when new messages arrive
 * - Handles interactive messages with different UI components
 */
export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  chatHistory,
  isProcessing,
  processingHint,
  currentTask,
  getContextExample,
  onInteractiveResponse
}) => {
  // Reference to the chat container for auto-scrolling
  const chatContainerRef = useRef<HTMLDivElement>(null);
  // Reference to the last message for scrolling into view
  const lastMessageRef = useRef<HTMLDivElement>(null);
  // Reference to the processing indicator
  const processingIndicatorRef = useRef<HTMLDivElement>(null);
  
  // Scroll to the bottom when chat history or processing state changes
  useEffect(() => {
    // If there's a processing indicator, scroll to it
    if (isProcessing && processingIndicatorRef.current) {
      processingIndicatorRef.current.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    
    // If there's a last message, scroll to it
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: 'smooth' });
    } else if (chatContainerRef.current) {
      // Fallback to scrolling the container
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, isProcessing]);

  // Handle interactive message responses
  const handleInteractiveResponse = (messageId: string, response: any) => {
    if (onInteractiveResponse) {
      onInteractiveResponse(messageId, response);
    }
  };

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
      {chatHistory.map((message, index) => {
        // Determine if this is the last message
        const isLastMessage = index === chatHistory.length - 1;
        
        return (
          <div 
            key={message.id || `message-${index}`}
            ref={isLastMessage ? lastMessageRef : undefined}
            className={`flex flex-col ${message.type === 'user' ? 'items-end' : 'items-start'}`}
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
              <div>{message.content}</div>
              {/* Render interactive components if this is an interactive message */}
              {message.interactive && message.interactiveData && (
                <InteractiveMessageHandler
                  message={message.interactiveData}
                  onResponse={(response) => {
                    // Use the exact message ID for interactive responses
                    // The backend expects the ID without any modifications
                    const messageId = message.id || `interactive-${index}-${Date.now()}`;
                    console.log('[ChatMessageList] Handling interactive response for message ID:', messageId);
                    // Save the response in the message for later display
                    message.responseValue = response;
                    handleInteractiveResponse(messageId, response);
                  }}
                  isResponseSubmitted={!!message.isResponseSubmitted}
                  parentMessage={message}
                />
              )}
            </div>
            { message.type === 'user' && message.interactive && (
              <div className="flex items-center mt-1 space-x-1 text-xs text-gray-500 italic">
                <InformationCircleIcon className="h-3 w-3 text-blue-400" />
                <span>
                  {message.request === 'form' && 'Response to form submission'}
                  {message.request === 'select' && 'Response to selection prompt'}
                  {message.request === 'confirm' && 'Response to confirmation prompt'}
                </span>
              </div>
            )}
          </div>
        );
      })}

      {/* Show typing indicator when processing */}
      {isProcessing && (
        <div 
          ref={processingIndicatorRef}
          className="flex justify-start"
        >
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
