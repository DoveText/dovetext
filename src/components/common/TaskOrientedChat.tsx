'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useAction } from '@/context/ActionContext';
import { useChat } from '@/context/ChatContext';
import { ChatMessage } from '@/types/chat';

// Import our utility functions
import { 
  getContextTitle, 
  getContextExample,
  handlePageSpecificCommand
} from '@/utils/chatHelpers';

// Import our UI components
import { 
  ChatBubble, 
  ChatHeader, 
  ChatMessageList, 
  ConnectionStatus 
} from '@/components/chat';

// Import the ChatInputArea with its handle type
import ChatInputArea, { ChatInputAreaHandle } from '@/components/chat/ChatInputArea';

interface TaskOrientedChatProps {
  contextType?: string;
  onSwitchContext?: (contextType: string) => void;
  className?: string;
  enableNavigation?: boolean; // New prop to enable/disable navigation
  enableChatTrigger?: boolean; // New prop to enable/disable chat trigger
}

/**
 * A reusable task-oriented chat component that uses the ChatContext for state management.
 * Features:
 * - Starts as a minimized chat bubble
 * - Expands to a full chat interface when clicked
 * - Handles multi-step conversations with task completion tracking
 * - Can navigate between pages and trigger UI actions (optional)
 * - Can be triggered with a pre-filled message from elsewhere (optional)
 * - Resets to initial state after task completion
 * - Context-aware based on current page/tab
 * - Supports interactive messages (chat, confirm, select, form, present)
 */
export default function TaskOrientedChat({ 
  contextType = 'general',
  onSwitchContext,
  className = '',
  enableNavigation = false, // Disabled by default
  enableChatTrigger = true  // Enabled by default
}: TaskOrientedChatProps) {
  // Detect current page to provide context-aware assistance
  const [currentPage, setCurrentPage] = useState('');
  const router = useRouter();
  const actionContext = useAction();
  const inputRef = useRef<ChatInputAreaHandle>(null);
  
  // Use our ChatContext for state management
  const {
    // Connection state
    connectionId,
    connectionStatus,
    reconnectAttempts,
    MAX_AUTO_RECONNECT_ATTEMPTS,
    handleReconnect,
    
    // Chat state
    chatHistory,
    currentTask,
    isProcessing,
    processingHint,
    showInputForm,
    isSending,
    
    // UI state
    isExpanded,
    animationState,
    isUserInitiated,
    
    // Chat methods
    addUserMessage,
    addSystemMessage,
    addErrorMessage,
    clearChatHistory,
    updateTask,
    
    // Interactive message methods
    handleInteractiveResponse,
    
    // UI methods
    expandChat,
    minimizeChat,
    
    // Message submission
    sendMessage,
    
    // Other methods
    setIsUserInitiated
  } = useChat();
  
  // Find the last interactive message that hasn't been responded to
  const getLastInteractiveMessage = useCallback(() => {
    if (chatHistory.length === 0) return null;
    
    // Search from the end of the chat history
    for (let i = chatHistory.length - 1; i >= 0; i--) {
      const message = chatHistory[i];
      // Only consider system messages that are interactive and not responded to
      if (message.type === 'system' && message.interactive && !message.isResponseSubmitted) {
        return message;
      }
    }
    
    return null;
  }, [chatHistory]);
  
  // Focus the input field when the chat is opened
  useEffect(() => {
    if (isExpanded && animationState === 'open' && inputRef.current) {
      // Small delay to ensure the input is rendered
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isExpanded, animationState]);
  
  // Helper function to show error messages
  const showError = (message: string) => {
    addErrorMessage(message);
  };
  
  // Function to get context-specific title
  const getContextTitleForPage = useCallback(() => {
    return getContextTitle(contextType, currentPage);
  }, [contextType, currentPage]);
  
  // Function to get context-specific example
  const getContextExampleForPage = useCallback(() => {
    return getContextExample(contextType, currentPage);
  }, [contextType, currentPage]);
  
  // Handle page-specific commands
  const handlePageSpecificCommandForPage = useCallback((text: string) => {
    return handlePageSpecificCommand(text, currentPage, actionContext, addSystemMessage);
  }, [currentPage, actionContext, addSystemMessage]);
  
  // Handle action events from the chat
  useEffect(() => {
    // Listen for task completion
    if (currentTask?.complete && onSwitchContext) {
      onSwitchContext(contextType);
    }
  }, [currentTask, onSwitchContext, contextType]);
  
  // Get current page on mount and when route changes
  useEffect(() => {
    // Get the current pathname to determine context
    const pathname = window.location.pathname;
    setCurrentPage(pathname);

    // Listen for route changes
    const handleRouteChange = () => {
      setCurrentPage(window.location.pathname);
    };

    // Add event listener for route changes
    window.addEventListener('popstate', handleRouteChange);

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);
  
  // Handle closing the chat
  const handleClose = useCallback(() => {
    // Direct close function for better reliability
    const closeChat = () => {
      setIsUserInitiated(true);
      minimizeChat();
    };
    
    if (chatHistory.length === 0 || currentTask?.complete) {
      closeChat();
    } else {
      // Show confirmation if in middle of conversation
      if (confirm('Are you sure you want to close this conversation?')) {
        clearChatHistory();
        closeChat();
      }
    }
  }, [chatHistory, currentTask, setIsUserInitiated, minimizeChat, clearChatHistory]);
  
  // Handle message submission
  const handleSubmit = useCallback((message: string) => {
    // Check for page-specific commands first
    if (handlePageSpecificCommandForPage(message)) {
      return;
    }
    
    // Check if there's an active interactive message that hasn't been responded to
    const lastInteractive = getLastInteractiveMessage();
    if (lastInteractive && !lastInteractive.isResponseSubmitted) {
      console.log('[TaskOrientedChat] Handling text input as response to interactive message:', lastInteractive.id);
      
      // For confirm interactions, we don't allow text input responses - user must click the buttons
      if (lastInteractive.interactiveData?.function === 'confirm') {
        // Don't process text input for confirm interactions
        console.log('[TaskOrientedChat] Text input not allowed for confirm interactions');
        return;
      }
      
      // For present interactions, we don't expect responses - treat as a new message
      if (lastInteractive.interactiveData?.function === 'present') {
        console.log('[TaskOrientedChat] Present interaction does not expect responses, treating as new message');
        // Send as a regular message
        sendMessage(message, 'chat', contextType);
        return;
      }
      
      // Convert the text input to the appropriate response format based on the interactive function type
      let formattedResponse: any;
      
      switch (lastInteractive.interactiveData?.function) {
        case 'select':
          // For select, check if the text matches any of the options (case insensitive)
          const options = lastInteractive.interactiveData.parameters?.options || [];
          const normalizedMessage = message.toLowerCase().trim();
          const normalizedOptions = options.map((opt: string) => opt.toLowerCase().trim());
          const matchIndex = normalizedOptions.findIndex((opt: string) => opt === normalizedMessage);
          
          if (matchIndex >= 0) {
            // If there's a match, use the original option text (preserving case)
            formattedResponse = options[matchIndex];
            console.log('[TaskOrientedChat] Text input matched option:', formattedResponse);
            // Trigger highlighting in the SelectInteraction component
            // We do this by using the exact matched option from the original list
          } else {
            // If no match, use the custom input
            formattedResponse = message;
            console.log('[TaskOrientedChat] Text input did not match any option, using as custom input');
          }
          break;
          
        case 'form':
          // For form, we can't really handle complex form data via text input
          // Just show a message that forms need to be filled using the form interface
          addSystemMessage('Please use the form interface to submit form data.');
          return;
          
        case 'chat':
        default:
          // For chat and other types, just pass the text as is
          formattedResponse = message;
          break;
      }
      
      // Handle the interactive response with the formatted response
      handleInteractiveResponse(lastInteractive.id || `interactive-${Date.now()}`, formattedResponse, contextType);
      return;
    }
    
    // If no interactive message, send as a regular message
    sendMessage(message, 'chat', contextType);
  }, [sendMessage, contextType, handlePageSpecificCommandForPage, getLastInteractiveMessage, handleInteractiveResponse, addSystemMessage]);
  
  // Handle interactive message responses
  const handleInteractiveMessageResponse = useCallback((messageId: string, response: any) => {
    handleInteractiveResponse(messageId, response, contextType);
  }, [handleInteractiveResponse, contextType]);
  
  // Get the last interactive message that hasn't been responded to
  const lastInteractiveMessage = getLastInteractiveMessage();
  
  // Determine classes based on animation state
  const containerClasses = (() => {
    const baseClass = `fixed z-50 ${className}`;
    
    // When fully closed and not expanded, show just the chat bubble in the corner
    if (!isExpanded && animationState === 'closed') {
      return `${baseClass} bottom-4 right-4 w-12 h-12`;
    }
    
    // For all other states, show the full-screen container
    return `${baseClass} inset-0 flex items-center justify-center bg-black bg-opacity-50`;
  })();
  
  const chatClasses = (() => {
    // Base classes for different states
    const expandedClass = 'bg-white shadow-xl rounded-2xl w-11/12 md:w-3/4 lg:w-2/3 xl:w-1/2 max-w-4xl h-3/4 flex flex-col overflow-hidden';
    const closedClass = 'bg-white shadow-xl overflow-hidden rounded-full h-12 w-12';
    
    if (!isExpanded && animationState === 'closed') {
      return closedClass;
    }
    
    // For opening/closing animations
    if (animationState === 'opening' || animationState === 'closing') {
      return `${expandedClass} transform transition-all duration-300 ease-in-out ${
        animationState === 'opening' ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
      }`;
    }
    
    // Fully open state
    return expandedClass;
  })();
  
  // If chat is minimized and animation is complete, show the chat bubble
  if (!isExpanded && animationState === 'closed') {
    return (
      <div className={containerClasses}>
        <ChatBubble 
          onClick={() => {
            setIsUserInitiated(true);
            expandChat();
          }}
        />
      </div>
    );
  }
  
  // Otherwise, show the full chat interface
  return (
    <div className={containerClasses} onClick={(e) => {
      // Close the modal when clicking the overlay background
      if (e.target === e.currentTarget) {
        handleClose();
      }
    }}>
      <div 
        className={chatClasses}
        onClick={(e) => e.stopPropagation()}
        style={{ transformOrigin: 'bottom right' }}
      >
        {/* Chat Header */}
        <ChatHeader 
          contextTitle={getContextTitleForPage()}
          currentTask={currentTask}
          onClose={handleClose}
        />

        {/* Connection status */}
        {isExpanded && (
          <ConnectionStatus 
            connectionStatus={connectionStatus}
            onReconnect={handleReconnect}
          />
        )}

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto">
          <ChatMessageList 
            chatHistory={chatHistory}
            isProcessing={isProcessing}
            processingHint={processingHint}
            currentTask={currentTask}
            getContextExample={getContextExampleForPage}
            onInteractiveResponse={handleInteractiveMessageResponse}
          />
        </div>
        
        {/* Connection lost message */}
        {connectionStatus === 'disconnected' && reconnectAttempts >= MAX_AUTO_RECONNECT_ATTEMPTS && (
          <div className="p-4 bg-red-50 border-t border-red-200">
            <div className="flex items-center text-red-800">
              <WifiOff className="h-5 w-5 mr-2" />
              <p>Connection lost. Unable to reconnect automatically.</p>
            </div>
            <button
              onClick={handleReconnect}
              className="mt-2 w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md"
            >
              Try to reconnect manually
            </button>
          </div>
        )}
        
        {/* Input Form */}
        {showInputForm && (
          <div className="mt-auto border-t">
            <ChatInputArea 
              ref={inputRef}
              onSubmit={handleSubmit}
              isSending={isSending}
              showInputForm={showInputForm}
              currentTask={currentTask}
              lastInteractiveMessage={lastInteractiveMessage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
