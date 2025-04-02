'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useAction } from '@/context/ActionContext';
import { chatApi, ChatMessageRequest } from '@/app/api/chat';

// Import our custom hooks
import { useSSEConnection, SSEEventCallbacks, SSEConnectionOptions } from '@/hooks/useSSEConnection';
import { useChatState, ChatTask } from '@/hooks/useChatState';
import { useAnimationState } from '@/hooks/useAnimationState';
import { useNavigationHandler, NavigationHandlerOptions } from '@/hooks/useNavigationHandler';
import { useChatTriggerHandler, ChatTriggerOptions } from '@/hooks/useChatTriggerHandler';
import { useMessageSubmitHandler, MessageSubmitOptions } from '@/hooks/useMessageSubmitHandler';

// Import our UI components
import { 
  ChatBubble, 
  ChatHeader, 
  ChatInputArea, 
  ChatMessageList, 
  ConnectionStatus 
} from '@/components/chat';

// Import our utility functions
import { 
  getContextTitle, 
  getContextExample,
  handlePageSpecificCommand
} from '@/utils/chatHelpers';

interface TaskOrientedChatProps {
  contextType?: 'schedule' | 'tasks' | 'general';
  onSwitchContext?: (contextType: 'schedule' | 'tasks' | 'general') => void;
  className?: string;
  enableNavigation?: boolean; // New prop to enable/disable navigation
  enableChatTrigger?: boolean; // New prop to enable/disable chat trigger
}

/**
 * A reusable task-oriented chat component that can be used across the application.
 * Features:
 * - Starts as a minimized chat bubble
 * - Expands to a full chat interface when clicked
 * - Handles multi-step conversations with task completion tracking
 * - Can navigate between pages and trigger UI actions (optional)
 * - Can be triggered with a pre-filled message from elsewhere (optional)
 * - Resets to initial state after task completion
 * - Context-aware based on current page/tab
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
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Use our custom hooks for chat state and animation
  const {
    chatHistory,
    currentTask,
    isProcessing,
    processingHint,
    showInputForm,
    isSending,
    setChatHistory,
    setCurrentTask,
    setIsProcessing,
    setProcessingHint,
    setShowInputForm,
    setIsSending,
    addUserMessage,
    addSystemMessage,
    addErrorMessage,
    clearChatHistory,
    updateTask,
    setProcessing
  } = useChatState();
  
  const {
    isExpanded,
    animationState,
    isUserInitiated,
    isActive,
    setIsExpanded,
    setIsUserInitiated,
    setIsActive,
    expandChat,
    minimizeChat
  } = useAnimationState();
  
  // Helper function to show error messages
  const showError = (message: string) => {
    addErrorMessage(message);
    setShowInputForm(false);
  };
  
  // Function to get context-specific title
  const getContextTitleForPage = useCallback(() => {
    return getContextTitle(contextType, currentPage);
  }, [contextType, currentPage]);
  
  // Function to get context-specific example
  const getContextExampleForPage = useCallback(() => {
    return getContextExample(contextType, currentPage);
  }, [contextType, currentPage]);
  
  // Set up navigation handler if enabled
  const navigationOptions: NavigationHandlerOptions = {
    onSwitchContext,
    onNavigationStart: (action) => {
      addSystemMessage(`I'll help you with that. Navigating to the appropriate page...`);
    },
    onNavigationComplete: () => {
      updateTask({ complete: true, steps: 1, currentStep: 1 });
    }
  };
  
  const { processNavigationIntent } = useNavigationHandler(
    enableNavigation ? navigationOptions : undefined
  );
  
  // Handle page-specific commands
  const handlePageSpecificCommandForPage = useCallback((text: string) => {
    return handlePageSpecificCommand(text, currentPage, actionContext, addSystemMessage);
  }, [currentPage, actionContext, addSystemMessage]);
  
  // Define SSE event callbacks
  const sseCallbacks: SSEEventCallbacks = {
    onThinking: (content) => {
      setProcessing(true, content);
    },
    onProcessing: (content) => {
      setProcessing(true, content);
    },
    onMessage: (content, id) => {
      setProcessing(false);
      addSystemMessage(content, id);
    },
    onTaskUpdate: (task) => {
      updateTask(task);
      
      // If task is complete, notify parent component
      if (task.complete && onSwitchContext) {
        onSwitchContext(contextType);
        
        // Reset chat after a delay
        setTimeout(() => {
          clearChatHistory();
        }, 5000);
      }
    },
    onAction: (actionType, data) => {
      // Handle action events (navigation, form filling, etc.)
      if (actionContext) {
        if (actionType === 'OPEN_DELIVERY_METHOD_FORM') {
          actionContext.setPendingAction('create-delivery-method');
        } else if (actionType === 'CREATE_TASK') {
          actionContext.setPendingAction('create-task');
        } else {
          console.log('[TaskOrientedChat] Unknown action type:', actionType);
        }
      }
    },
    onError: (error) => {
      console.error('[TaskOrientedChat] SSE connection error:', error);
      addSystemMessage('Connection lost. Please click the reconnect button to continue chatting.');
      setShowInputForm(false);
    },
    onConnectionStatusChange: (status) => {
      if (status === 'disconnected') {
        setShowInputForm(false);
      }
    }
  };
  
  // Define SSE connection options
  const sseOptions: SSEConnectionOptions = {
    autoConnect: true,
    autoReconnect: true,
    maxReconnectAttempts: 5,
    isActive: isExpanded // Only keep the connection active when the chat is expanded
  };
  
  // Use our custom hook for SSE connection with callbacks and options
  const {
    connectionId,
    connectionStatus,
    reconnectAttempts,
    MAX_AUTO_RECONNECT_ATTEMPTS,
    handleReconnect,
    connectToSSE
  } = useSSEConnection(sseCallbacks, sseOptions);
  
  // Set up chat trigger handler if enabled
  const chatTriggerOptions: ChatTriggerOptions = {
    onTrigger: (message) => {
      expandChat();
      setChatHistory([{ type: 'user', content: message }]);
    },
    onError: (error) => {
      showError('An error occurred processing your message. Please try again.');
    },
    contextType,
    enabled: enableChatTrigger
  };
  
  // Use our custom hook for handling chat triggers
  useChatTriggerHandler(connectionId, connectToSSE, chatTriggerOptions);
  
  // Set up message submit handler
  const messageSubmitOptions: MessageSubmitOptions = {
    contextType,
    addUserMessage,
    addSystemMessage,
    setIsSending,
    enableNavigation,
    processNavigationIntent: enableNavigation ? processNavigationIntent : undefined,
    handlePageSpecificCommand: handlePageSpecificCommandForPage
  };
  
  // Use our custom hook for handling message submission
  const handleSubmit = useMessageSubmitHandler(
    connectionId,
    connectToSSE,
    messageSubmitOptions
  );
  
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
        setIsActive(false);
        closeChat();
      }
    }
  }, [chatHistory, currentTask, setIsUserInitiated, minimizeChat, clearChatHistory, setIsActive]);
  
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
              onSubmit={handleSubmit}
              isSending={isSending}
              showInputForm={showInputForm}
              currentTask={currentTask}
            />
          </div>
        )}
      </div>
    </div>
  );
}
