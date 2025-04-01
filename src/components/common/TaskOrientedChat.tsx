'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpCircleIcon } from '@heroicons/react/24/outline';
import { useAction, ActionType } from '@/context/ActionContext';
import { chatApi, ChatMessage, ChatMessageRequest, ChatMessageResponse } from '@/app/api/chat';

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
  const [isExpanded, setIsExpanded] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{type: 'user' | 'system', content: string}[]>([]);
  const [currentTask, setCurrentTask] = useState<{complete: boolean, steps: number, currentStep: number} | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // SSE connection state
  const [eventSource, setEventSource] = useState<any>(null);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Auto-focus the input field when the dialog is expanded
  useEffect(() => {
    if (isExpanded && inputRef.current && !currentTask?.complete) {
      // Short timeout to ensure the dialog is fully rendered
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isExpanded, currentTask?.complete]);
  
  // Scroll to bottom of chat when history changes
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // Reset chat after task completion
  useEffect(() => {
    if (currentTask?.complete) {
      const timer = setTimeout(() => {
        setChatHistory([]);
        setCurrentTask(null);
        setIsActive(false);
        setIsExpanded(false);
      }, 3000); // Wait 3 seconds before resetting
      
      return () => clearTimeout(timer);
    }
  }, [currentTask]);
  
  // Error message when backend is unavailable
  const getConnectionErrorMessage = (error: any): string => {
    if (error?.message?.includes('Failed to fetch')) {
      return 'Unable to connect to the chat service. Please check your internet connection.';
    }
    return error?.message || 'An error occurred connecting to the chat service';
  };
  
  // Show error message
  const showError = (message: string) => {
    setChatHistory(prev => [...prev, { 
      type: 'system', 
      content: message
    }]);
  };
  
  // Function to establish SSE connection
  const connectToSSE = useCallback(async () => {
    console.log('[TaskOrientedChat] Starting SSE connection...');
    try {
      if (isConnecting) {
        console.log('[TaskOrientedChat] Connection already in progress, skipping');
        return { connectionId: connectionId };
      }
      
      // Define the message handler for SSE events
      const handleSSEEvent = (eventType: string, data: any) => {
        console.log('[TaskOrientedChat] Received SSE event:', eventType, data);
        
        // Skip processing for certain event types
        if (eventType === 'connected') {
          return; // Connection event is handled separately
        }
        
        // Add the message to chat history
        setChatHistory(prev => [...prev, { 
          type: data.type as 'user' | 'system', 
          content: data.content 
        }]);
        
        // Update task state if provided
        if (data.currentStep !== undefined && data.totalSteps !== undefined) {
          setCurrentTask({
            complete: data.complete || false,
            steps: data.totalSteps,
            currentStep: data.currentStep
          });
        }
      };
      
      console.log('[TaskOrientedChat] Calling createChatStream');
      const { eventSource: newEventSource, connectionId: newConnectionId } = await chatApi.createChatStream(handleSSEEvent);
      
      console.log('[TaskOrientedChat] createChatStream returned:', { 
        eventSource: !!newEventSource, 
        connectionId: newConnectionId 
      });
      
      // Update state with new connection details
      setEventSource(newEventSource);
      setConnectionId(newConnectionId);
      setIsConnecting(false);
      
      // Return the connection ID for immediate use
      return { connectionId: newConnectionId };
    } catch (error) {
      console.error('[TaskOrientedChat] Error establishing SSE connection:', error);
      setIsConnecting(false);
      showError('Failed to establish chat connection. Please try again.');
      return { connectionId: null };
    }
  }, [isConnecting, connectionId]);

  // Establish SSE connection when the chat is expanded
  useEffect(() => {
    let isMounted = true; // Flag to track if component is mounted
    let reconnectAttempts = 0;
    let reconnectTimer: NodeJS.Timeout | null = null;
    
    const setupConnection = async () => {
      if (isExpanded && !eventSource && !isConnecting && isMounted) {
        console.log('[TaskOrientedChat] Setting up SSE connection (isExpanded:', isExpanded, ', eventSource:', !!eventSource, ', isConnecting:', isConnecting, ')');
        try {
          setIsConnecting(true);
          const result = await connectToSSE();
          if (result && isMounted) {
            console.log('[TaskOrientedChat] Connection setup completed, result:', result);
            // Reset reconnect attempts on successful connection
            reconnectAttempts = 0;
          }
        } catch (error) {
          console.error('[TaskOrientedChat] Error setting up connection:', error);
          if (isMounted) {
            setIsConnecting(false);
            
            // Attempt to reconnect with exponential backoff
            if (reconnectAttempts < 5) {
              const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
              console.log(`[TaskOrientedChat] Will attempt reconnection in ${delay}ms (attempt ${reconnectAttempts + 1})`);
              
              reconnectTimer = setTimeout(() => {
                if (isMounted && isExpanded) {
                  reconnectAttempts++;
                  setupConnection();
                }
              }, delay);
            } else {
              console.error('[TaskOrientedChat] Maximum reconnection attempts reached');
              showError('Unable to establish a stable connection. Please try again later.');
            }
          }
        }
      }
    };
    
    setupConnection();
    
    // Listen for network status changes
    const handleOnline = () => {
      console.log('[TaskOrientedChat] Network is online, attempting to reconnect');
      if (isMounted && isExpanded && !eventSource && !isConnecting) {
        reconnectAttempts = 0; // Reset attempts when network comes back online
        setupConnection();
      }
    };
    
    window.addEventListener('online', handleOnline);
    
    return () => {
      // Set flag to prevent state updates after unmount
      isMounted = false;
      
      // Clear any pending reconnection attempts
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      
      // Remove event listeners
      window.removeEventListener('online', handleOnline);
      
      // Clean up connection when component unmounts or when expanded state changes
      if (eventSource) {
        console.log('[TaskOrientedChat] Cleaning up SSE connection on unmount/state change');
        eventSource.close();
        setEventSource(null);
        setConnectionId(null);
      }
    };
  }, [isExpanded, connectToSSE]); // Remove eventSource and isConnecting from dependencies
  
  // Handle page-specific commands based on current page
  const handlePageSpecificCommand = useCallback((text: string) => {
    const lowerText = text.toLowerCase();
    
    // Dashboard page commands
    if (currentPage.includes('/dashboard')) {
      if (/show.*schedule|view.*schedule|my schedule/i.test(lowerText)) {
        // Switch to schedule tab
        window.dispatchEvent(new CustomEvent('switchTab', { detail: { tab: 0 } }));
        setChatHistory(prev => [...prev, { 
          type: 'system', 
          content: `I've switched to the Schedule tab for you.` 
        }]);
        return true;
      } else if (/show.*tasks|view.*tasks|my tasks/i.test(lowerText)) {
        // Switch to tasks tab
        window.dispatchEvent(new CustomEvent('switchTab', { detail: { tab: 1 } }));
        setChatHistory(prev => [...prev, { 
          type: 'system', 
          content: `I've switched to the Tasks tab for you.` 
        }]);
        return true;
      }
    }
    
    // Delivery methods page commands
    if (currentPage.includes('/notifications/delivery-methods')) {
      if (/add.*method|create.*method|new method/i.test(lowerText)) {
        // Use the action context instead of events
        actionContext.setPendingAction('create-delivery-method');
        setChatHistory(prev => [...prev, { 
          type: 'system', 
          content: `I'm opening the dialog to create a new delivery method.` 
        }]);
        return true;
      }
    }
    
    return false;
  }, [actionContext, currentPage]);

  // Detect navigation commands and intents in user messages
  const detectNavigationIntent = useCallback((text: string) => {
    const lowerText = text.toLowerCase();
    
    // Comprehensive navigation patterns
    const navigationPatterns = [
      // Delivery method patterns
      { pattern: /create.*delivery method|add.*delivery method|new delivery method/i, action: 'create-delivery-method' },
      { pattern: /go to.*delivery|show.*delivery|open.*delivery|view.*delivery|delivery methods/i, action: 'view-delivery-methods' },
      
      // Task patterns
      { pattern: /create.*task|add.*task|new task/i, action: 'create-task' },
      
      // Schedule patterns
      { pattern: /create.*schedule|add.*schedule|new schedule|create.*event|add.*event|new event/i, action: 'create-schedule' },
      
      // Navigation patterns
      { pattern: /go to.*dashboard|show.*dashboard|open.*dashboard|dashboard|home/i, action: 'dashboard' },
      { pattern: /go to.*settings|show.*settings|open.*settings|settings/i, action: 'settings' },
      { pattern: /go to.*profile|show.*profile|open.*profile|profile/i, action: 'profile' },
    ];
    
    // Check if message matches any navigation pattern
    for (const { pattern, action } of navigationPatterns) {
      if (pattern.test(lowerText)) {
        return action;
      }
    }
    
    return null;
  }, []);
  
  // Function to handle navigation actions
  const handleNavigation = useCallback((action: string) => {
    // Set a message that we're navigating
    setChatHistory(prev => [...prev, { 
      type: 'system', 
      content: `I'll help you with that. Navigating to the appropriate page...` 
    }]);
    
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
      setCurrentTask({ complete: true, steps: 1, currentStep: 1 });
    }, 1000);
  }, [actionContext, onSwitchContext, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('[TaskOrientedChat] Form submitted');
    e.preventDefault();
    setTimeout(() => inputRef.current?.focus(), 0);

    if (!message.trim()) {
      console.log('[TaskOrientedChat] Empty message, not sending');
      // Refocus the input field even when the message is empty
      return;
    }
    
    // Add user message to chat history
    const userMessage = message.trim();
    console.log('[TaskOrientedChat] Adding user message to chat history:', userMessage);
    setChatHistory(prev => [...prev, { type: 'user', content: userMessage }]);
    setMessage('');

    // Ensure we have a connection before sending the message
    let activeConnectionId = connectionId;
    console.log('[TaskOrientedChat] Checking connection status, connectionId:', activeConnectionId);
    
    if (!activeConnectionId) {
      console.log('[TaskOrientedChat] No active connection, attempting to connect');
      try {
        const result = await connectToSSE();
        activeConnectionId = result.connectionId;
        console.log('[TaskOrientedChat] New connection established with ID:', activeConnectionId);
      } catch (error) {
        console.error('[TaskOrientedChat] Failed to establish connection:', error);
        showError('Failed to connect to chat service. Please try again.');
        return;
      }
    }
    
    if (!activeConnectionId) {
      console.error('[TaskOrientedChat] Still no connection ID after connection attempt');
      showError('Unable to establish a connection. Please refresh the page and try again.');
      return;
    }
    
    // Send the message to the API
    console.log('[TaskOrientedChat] All checks passed, sending message to API with connectionId:', activeConnectionId);
    await sendMessage(userMessage, activeConnectionId);
    
    // Refocus the input field after sending message
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  // Handle sending a message
  const sendMessage = async (currentMessage: string, activeConnectionId?: string | null) => {
    console.log('[TaskOrientedChat] Preparing to send message:', currentMessage);
    
    // Use the provided connectionId or fall back to the state
    const connId = activeConnectionId || connectionId;
    
    if (!connId) {
      console.error('[TaskOrientedChat] No connectionId available for sending message');
      showError('No connection to chat service');
      return;
    }
    
    try {
      console.log('[TaskOrientedChat] Sending message with connectionId:', connId);
      const response = await chatApi.sendMessage({
        type: contextType,
        content: currentMessage,
        connectionId: connId,
      } as ChatMessageRequest);
      
      console.log('[TaskOrientedChat] Message sent successfully, response:', response);
      // Response will be handled by the SSE event listener
    } catch (error: any) {
      console.error('[TaskOrientedChat] Error sending message to chat API:', error);
      
      // Show consistent error message if API call fails
      showError(error.message || 'Error sending message');
    }
  };

  // Animation state for smooth transitions
  const [animationState, setAnimationState] = useState<'closed' | 'opening' | 'open' | 'closing'>('closed');
  const [isUserInitiated, setIsUserInitiated] = useState(false);
  
  // Handle animation state changes when expanded state changes
  useEffect(() => {
    // Only animate if it's a user-initiated action
    if (!isUserInitiated) return;
    
    if (isExpanded) {
      // Start opening animation
      setAnimationState('opening');
      // After animation completes, set to fully open
      const timer = setTimeout(() => {
        setAnimationState('open');
        setIsUserInitiated(false);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      // Start closing animation
      setAnimationState('closing');
      // After animation completes, set to fully closed
      const timer = setTimeout(() => {
        setAnimationState('closed');
        setIsUserInitiated(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isExpanded, isUserInitiated]);
  
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
    const expandedClass = 'bg-white shadow-xl rounded-2xl w-11/12 md:w-3/4 lg:w-2/3 xl:w-1/2 max-w-4xl h-3/4';
    const closedClass = 'bg-white shadow-xl overflow-hidden rounded-full h-12 w-12';
    
    if (!isExpanded && animationState === 'closed') {
      return closedClass;
    }
    
    // For all other states, use the expanded class with appropriate animations
    switch (animationState) {
      case 'opening':
        return `${expandedClass} animate-scaleUp`;
      case 'closing':
        return `${expandedClass} animate-scaleDown`;
      default:
        return expandedClass;
    }
  })();

  // Get context-specific title and examples based on current page and passed context
  const getContextTitle = () => {
    // First check the explicitly passed contextType
    if (contextType === 'schedule') return 'Schedule';
    if (contextType === 'tasks') return 'Task';
    
    // If general, try to determine from current page
    if (currentPage.includes('/dashboard')) {
      return 'Dashboard';
    } else if (currentPage.includes('/notifications/delivery-methods')) {
      return 'Delivery Methods';
    } else if (currentPage.includes('/notifications')) {
      return 'Notifications';
    } else if (currentPage.includes('/profile')) {
      return 'Profile';
    } else if (currentPage.includes('/settings')) {
      return 'Settings';
    }
    
    return 'Assistant';
  };

  const getContextExample = () => {
    // First check the explicitly passed contextType
    if (contextType === 'schedule') return '"Schedule a team meeting tomorrow"';
    if (contextType === 'tasks') return '"Add a task to review the proposal"';
    
    // If general, try to determine from current page
    if (currentPage.includes('/dashboard')) {
      return '"Show me my upcoming schedule"';
    } else if (currentPage.includes('/notifications/delivery-methods')) {
      return '"Create a new delivery method"';
    } else if (currentPage.includes('/notifications')) {
      return '"Show me my notification settings"';
    } else if (currentPage.includes('/profile')) {
      return '"Update my profile information"';
    } else if (currentPage.includes('/settings')) {
      return '"Change my notification preferences"';
    }
    
    return '"Help me navigate to..."';
  };

  useEffect(() => {
    // Get the current pathname to determine context
    const pathname = window.location.pathname;
    setCurrentPage(pathname);

    // Listen for route changes
    const handleRouteChange = () => {
      setCurrentPage(window.location.pathname);
    };
      
  // Process user message from dashboard input
  const processUserMessage = async (text: string) => {
    // Set active state to show we're processing
    setIsActive(true);
    
    // Check for navigation intent
    const navigationAction = detectNavigationIntent(text);
    
    if (navigationAction) {
      // Handle navigation
      handleNavigation(navigationAction);
      return;
    }
    
    // Check for page-specific commands
    if (handlePageSpecificCommand(text)) {
      return;
    }
    
    // Ensure we have a connection to the chat backend
    if (!connectionId) {
      // If no connection, try to establish one
      if (!isConnecting) {
        await connectToSSE();
      }
      
      // If still no connection, show error message
      if (!connectionId) {
        setChatHistory(prev => [...prev, { 
          type: 'system', 
          content: getConnectionErrorMessage(null)
        }]);
        return;
      }
    }
    
    try {
      // Send the message to the backend via SSE
      console.log('TaskOrientedChat: Sending message:', text);
      
      if (!connectionId) {
        console.error('TaskOrientedChat: No connectionId available for sending message');
        showError('No connection to chat service');
        return;
      }
      
      console.log('TaskOrientedChat: Calling API with message and connectionId:', connectionId);
      await chatApi.sendMessage({
        type: contextType,
        content: text,
        connectionId: connectionId,
      } as ChatMessageRequest);
      
      console.log('TaskOrientedChat: Message sent successfully');
      // Response will be handled by the SSE event listener
    } catch (error: any) {
      console.error('TaskOrientedChat: Error sending message to chat API:', error);
      
      // Show consistent error message if API call fails
      showError(error.message || 'Error sending message');
    }
  };

    // Listen for chat trigger events from dashboard input
    const handleChatTrigger = (event: CustomEvent) => {
      setIsExpanded(true);
      if (event.detail?.message) {
        const userMessage = event.detail.message;
        // Add the user message directly to chat history
        setChatHistory([{ type: 'user', content: userMessage }]);
        
        // Process the message after a short delay to simulate response
        setTimeout(() => {
          processUserMessage(userMessage);
        }, 300);
      }
    };

    // Add event listeners
    window.addEventListener('popstate', handleRouteChange);
    window.addEventListener('triggerChatBubble', handleChatTrigger as EventListener);

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      window.removeEventListener('triggerChatBubble', handleChatTrigger as EventListener);
    };
  }, [connectionId, contextType, handleNavigation, handlePageSpecificCommand, detectNavigationIntent, connectToSSE, isConnecting]);
   
  // If not expanded and fully closed, show just the chat bubble
  if (!isExpanded && animationState === 'closed') {
    return (
      <div className={containerClasses}>
        <button 
          onClick={() => {
            setIsUserInitiated(true);
            setIsExpanded(true);
          }}
          className="bg-blue-500 hover:bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg animate-pulse"
          aria-label="Open chat assistant"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className={containerClasses} onClick={(e) => {
      // Close the modal when clicking the overlay background
      if (e.target === e.currentTarget) {
        // Direct close function for better reliability
        const closeChat = () => {
          setIsUserInitiated(true);
          setIsExpanded(false);
        };
        
        if (chatHistory.length === 0 || currentTask?.complete) {
          closeChat();
        } else {
          // Show confirmation if in middle of conversation
          if (confirm('Are you sure you want to close this conversation?')) {
            setChatHistory([]);
            setCurrentTask(null);
            setIsActive(false);
            closeChat();
          }
        }
      }
    }}>
      <div 
        className={chatClasses} 
        onClick={(e) => e.stopPropagation()}
        style={{ transformOrigin: 'bottom right' }}
      >
        {/* Chat Header */}
        <div className="bg-blue-500 text-white px-4 py-4 flex justify-between items-center">
          <h3 className="font-medium text-lg">
            {currentTask 
              ? `${getContextTitle()} Assistant (${currentTask.currentStep}/${currentTask.steps})` 
              : `${getContextTitle()} Assistant`}
          </h3>
          <button 
            onClick={() => {
              // Direct close function for better reliability
              const closeChat = () => {
                setIsUserInitiated(true);
                setIsExpanded(false);
              };
              
              if (chatHistory.length === 0 || currentTask?.complete) {
                closeChat();
              } else {
                // Show confirmation if in middle of conversation
                if (confirm('Are you sure you want to close this conversation?')) {
                  setChatHistory([]);
                  setCurrentTask(null);
                  setIsActive(false);
                  closeChat();
                }
              }
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-1.5 flex items-center justify-center transition-colors cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        {/* Chat Messages */}
        <div 
          ref={chatContainerRef}
          className={`p-6 overflow-y-auto ${currentTask?.complete ? 'bg-green-50' : 'bg-gray-50'}`}
          style={{ height: 'calc(100% - 130px)' }}
        >
          {chatHistory.length === 0 ? (
            <div className="text-center text-gray-600 mt-16">
              <p className="text-xl font-medium">How can I help you today?</p>
              <p className="text-base mt-4">For example: {getContextExample()}</p>
              <p className="text-base mt-4 text-blue-500">You can also try: &quot;Create a delivery method&quot; or &quot;Go to settings&quot;</p>
            </div>
          ) : (
            chatHistory.map((chat, index) => (
              <div key={index} className={`mb-3 ${chat.type === 'user' ? 'text-right' : ''}`}>
                <div 
                  className={`inline-block p-3 rounded-lg max-w-[85%] ${chat.type === 'user' 
                    ? 'bg-blue-500 text-white' 
                    : currentTask?.complete && index === chatHistory.length - 1 
                      ? 'bg-green-100 border border-green-200 text-green-800' 
                      : 'bg-white border'}`}
                >
                  {chat.content}
                </div>
              </div>
            ))
          )}
          
          {/* Task completion indicator */}
          {currentTask?.complete && (
            <div className="text-center mt-4 text-sm text-green-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Task completed! The assistant will reset shortly...
            </div>
          )}
        </div>
        
        {/* Chat Input */}
        <form onSubmit={handleSubmit} className="flex items-center p-4 border-t bg-white chat-form mb-3 rounded-b-lg">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={currentTask?.complete 
                ? 'Task completed!' 
                : currentTask 
                  ? 'Continue your conversation...' 
                  : `Ask me anything...`}
              className="w-full p-3 pr-12 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={currentTask?.complete}
            />
            <button
              type="submit"
              disabled={currentTask?.complete}
              onClick={() => console.log('[TaskOrientedChat] Submit button clicked')}
              className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full focus:outline-none ${
                currentTask?.complete 
                  ? 'text-gray-400' 
                  : 'text-blue-500 hover:bg-blue-100'
              }`}
            >
              <ArrowUpCircleIcon className="h-6 w-6" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
