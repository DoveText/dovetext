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
  detectNavigationIntent, 
  getContextTitle, 
  getContextExample,
  handlePageSpecificCommand
} from '@/utils/chatHelpers';

interface TaskOrientedChatProps {
  contextType?: 'schedule' | 'tasks' | 'general';
  onSwitchContext?: (contextType: 'schedule' | 'tasks' | 'general') => void;
  className?: string;
}

/**
 * A reusable task-oriented chat component that can be used across the application.
 * Features:
 * - Starts as a minimized chat bubble
 * - Expands to a full chat interface when clicked
 * - Handles multi-step conversations with task completion tracking
 * - Can navigate between pages and trigger UI actions
 * - Resets to initial state after task completion
 * - Context-aware based on current page/tab
 */
export default function TaskOrientedChat({ 
  contextType = 'general',
  onSwitchContext,
  className = ''
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
  
  // Function to handle navigation
  const handleNavigation = useCallback((action: string) => {
    // Set a message that we're navigating
    addSystemMessage(`I'll help you with that. Navigating to the appropriate page...`);
    
    // Wait a moment before navigation to show the message
    setTimeout(() => {
      switch (action) {
        case 'create-delivery-method':
          // Set the pending action in context and navigate
          actionContext.setPendingAction('create-delivery-method');
          router.push('/notifications/delivery-methods');
          break;
        case 'view-delivery-methods':
          router.push('/notifications/delivery-methods');
          break;
        case 'create-task':
          // If already on dashboard, switch to tasks tab and open create dialog
          if (window.location.pathname === '/dashboard') {
            // Switch context if provided
            if (onSwitchContext) {
              onSwitchContext('tasks');
            }
            window.dispatchEvent(new CustomEvent('switchTab', { detail: { tab: 1 } })); // Switch to Tasks tab
            actionContext.setPendingAction('create-task');
          } else {
            // Set the pending action in context and navigate
            actionContext.setPendingAction('create-task');
            router.push('/dashboard');
          }
          break;
        case 'create-schedule':
          // If already on dashboard, switch to schedule tab and open create dialog
          if (window.location.pathname === '/dashboard') {
            // Switch context if provided
            if (onSwitchContext) {
              onSwitchContext('schedule');
            }
            window.dispatchEvent(new CustomEvent('switchTab', { detail: { tab: 0 } })); // Switch to Schedule tab
            actionContext.setPendingAction('create-task');
          } else {
            // Set the pending action in context and navigate
            actionContext.setPendingAction('create-task');
            router.push('/dashboard');
          }
          break;
        case 'dashboard':
          router.push('/dashboard');
          break;
        case 'settings':
          actionContext.setPendingAction('open-settings');
          router.push('/settings');
          break;
        case 'profile':
          router.push('/profile');
          break;
        default:
          // No navigation needed
          break;
      }
      
      // Reset chat after navigation
      updateTask({ complete: true, steps: 1, currentStep: 1 });
    }, 1000);
  }, [actionContext, onSwitchContext, router, addSystemMessage, updateTask]);
  
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
  
  // Handle message submission
  const handleSubmit = useCallback(async (currentMessage: string) => {
    // Add user message to chat history
    addUserMessage(currentMessage);
    
    // Set sending state to show loading animation on submit button
    setIsSending(true);
    
    try {
      console.log('[TaskOrientedChat] Sending message with connectionId:', connectionId);
      
      // Ensure we have a connection to the chat backend
      let activeConnectionId = connectionId;
      if (!activeConnectionId) {
        console.log('[TaskOrientedChat] No active connection, attempting to connect first');
        const result = await connectToSSE();
        activeConnectionId = result.connectionId;
        if (!activeConnectionId) {
          throw new Error('Failed to establish connection');
        }
      }
      
      // Send the message
      const response = await chatApi.sendMessage({
        type: contextType as 'schedule' | 'tasks' | 'general',
        content: currentMessage,
        connectionId: activeConnectionId,
        currentPage: window.location.pathname
      });
      
      // Turn off the sending indicator
      setIsSending(false);
      
      // Check if we got an error response
      if (response.type === 'error') {
        console.warn('[TaskOrientedChat] Error response:', response.content);
        
        // Handle connection lost errors
        if (response.content.includes('Connection lost') || response.content.includes('reconnect')) {
          console.warn('[TaskOrientedChat] Connection lost, attempting to reconnect');
          
          // Show the error in the chat with a reconnect button
          addSystemMessage('Connection lost. Please click the reconnect button to continue chatting.');
          
          // Don't automatically reconnect - let the user click the button
          return;
        }
        
        // Handle other errors
        addSystemMessage(response.content);
        
        return;
      }
      
      // Check for navigation intents in the message
      const navigationIntent = detectNavigationIntent(currentMessage);
      if (navigationIntent) {
        console.log('[TaskOrientedChat] Navigation intent detected:', navigationIntent);
        handleNavigation(navigationIntent);
        return;
      }
      
      // Check for page-specific commands
      const handled = handlePageSpecificCommandForPage(currentMessage);
      if (handled) {
        console.log('[TaskOrientedChat] Page-specific command handled');
        return;
      }
      
    } catch (error) {
      console.error('[TaskOrientedChat] Error sending message:', error);
      
      // Turn off loading states
      setIsSending(false);
      
      // Add error message to chat with reconnect instructions
      addSystemMessage('Sorry, there was an error sending your message. Please use the reconnect button to try again.');
    }
  }, [connectionId, connectToSSE, contextType, addUserMessage, setIsSending, addSystemMessage, handleNavigation, handlePageSpecificCommandForPage]);
  
  // Get current page on mount and when route changes
  useEffect(() => {
    // Get the current pathname to determine context
    const pathname = window.location.pathname;
    setCurrentPage(pathname);

    // Listen for route changes
    const handleRouteChange = () => {
      setCurrentPage(window.location.pathname);
    };
    
    // Listen for chat trigger events from dashboard input
    const handleChatTrigger = async (event: CustomEvent) => {
      expandChat();
      
      if (event.detail?.message) {
        const userMessage = event.detail.message;
        
        // Add the user message directly to chat history
        setChatHistory([{ type: 'user', content: userMessage }]);
        
        // Ensure we have a connection before processing the message
        try {
          console.log('[TaskOrientedChat] Chat triggered with message, ensuring connection is established first');
          
          // If no connection or connecting, wait for connection to be established
          let activeConnectionId = connectionId;
          if (!activeConnectionId) {
            console.log('[TaskOrientedChat] No active connection, attempting to connect first');
            
            // Wait for connection to be established
            const result = await connectToSSE();
            activeConnectionId = result.connectionId;
            
            if (!activeConnectionId) {
              console.error('[TaskOrientedChat] Failed to establish connection');
              showError('An error occurred connecting to the chat service. Please try again.');
              return;
            }
            
            console.log('[TaskOrientedChat] Connection established successfully:', activeConnectionId);
          }
          
          // Now that we have a connection, process the message
          console.log('[TaskOrientedChat] Processing triggered message with connectionId:', activeConnectionId);
          
          // Send the message using the obtained connectionId
          await chatApi.sendMessage({
            type: contextType,
            content: userMessage,
            connectionId: activeConnectionId,
            currentPage: window.location.pathname
          });
          
        } catch (error) {
          console.error('[TaskOrientedChat] Error processing triggered message:', error);
          showError('An error occurred processing your message. Please try again.');
        }
      }
    };

    // Add event listeners
    window.addEventListener('popstate', handleRouteChange);
    window.addEventListener('triggerChatBubble', (handleChatTrigger as unknown) as EventListener);

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      window.removeEventListener('triggerChatBubble', (handleChatTrigger as unknown) as EventListener);
    };
  }, [connectionId, contextType, expandChat, setChatHistory, connectToSSE, showError]);
  
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
  
  // Container classes for positioning
  const containerClasses = `fixed bottom-4 right-4 z-50 ${className}`;
  
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
    <div className={containerClasses}>
      <div 
        className={`bg-white rounded-lg shadow-xl overflow-hidden flex flex-col ${
          isExpanded ? 'w-96 h-[500px]' : 'w-0 h-0 opacity-0'
        } transition-all duration-300 ease-in-out`}
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
        <ChatMessageList 
          chatHistory={chatHistory}
          isProcessing={isProcessing}
          processingHint={processingHint}
          currentTask={currentTask}
          getContextExample={getContextExampleForPage}
        />
        
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
          <ChatInputArea 
            onSubmit={handleSubmit}
            isSending={isSending}
            showInputForm={showInputForm}
            currentTask={currentTask}
          />
        )}
      </div>
    </div>
  );
}
