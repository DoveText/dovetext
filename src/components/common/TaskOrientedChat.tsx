'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpCircleIcon } from '@heroicons/react/24/outline';
import { RefreshCw, Wifi, WifiOff } from 'lucide-react';
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
  const [chatHistory, setChatHistory] = useState<{type: 'user' | 'system', content: string, id?: string}[]>([]);
  const [currentTask, setCurrentTask] = useState<{complete: boolean, steps: number, currentStep: number} | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // SSE connection state
  const [eventSource, setEventSource] = useState<any>(null);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Connection status tracking
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const MAX_AUTO_RECONNECT_ATTEMPTS = 5;
  
  // Loading states
  const [isSending, setIsSending] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingHint, setProcessingHint] = useState('Processing your request...');
  const [showInputForm, setShowInputForm] = useState(true);
  
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
  const connectToSSE = useCallback(async (isReconnecting = false) => {
    console.log('[TaskOrientedChat] Starting SSE connection...');
    try {
      if (isConnecting && !isReconnecting) {
        console.log('[TaskOrientedChat] Connection already in progress, skipping');
        return { connectionId: connectionId };
      }
      
      if (isReconnecting) {
        setConnectionStatus('reconnecting');
      } else {
        setIsConnecting(true);
      }
      
      // Define the message handler for SSE events
      const handleSSEEvent = (eventType: string, data: any) => {
        console.log('[TaskOrientedChat] Received SSE event:', eventType, data);
        
        // Update connection status on first successful message
        if (connectionStatus !== 'connected') {
          setConnectionStatus('connected');
          setReconnectAttempts(0);
          
          // If connection was restored, show the input form again
          setShowInputForm(true);
        }
        
        // Skip processing for certain event types
        if (eventType === 'connected') {
          return; // Connection event is handled separately
        }
        
        // Handle different event types
        if (eventType === 'processing') {
          console.log('[TaskOrientedChat] Processing event received, showing animation');
          
          // Set processing state and hint
          setIsProcessing(true);
          setProcessingHint(data.content || 'Processing your request...');
          
        } else if (eventType === 'message' || !eventType) {
          // For message events or default events

          /**
           * event:message
           * data: {
           *   "type": "system",
           *   "content":"I'm here to help you with DoveText. You can ask me to navigate to different pages, create tasks, schedule events, or help you find information.",
           *   "connectionId":"936df53a-876c-464b-ab48-8a1924e45d0e",
           *   "complete":false,
           *   "currentStep":1,
           *   "totalSteps":2
           * }
           */
          // Turn off processing state
          // Update task status if provided
          if (data.currentStep !== undefined && data.totalSteps !== undefined) {
            setIsProcessing(data.currentStep < data.totalSteps);

            setCurrentTask({
              complete: !!data.complete,
              steps: data.totalSteps,
              currentStep: data.currentStep
            });
          }
          else {
            setIsProcessing(false)
          }

          // Add the message to chat history
          setChatHistory(prev => [...prev, { 
            type: data.type as 'user' | 'system', 
            content: data.content 
          }]);
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
      setConnectionStatus('connected');
      
      // Return the connection ID for immediate use
      return { connectionId: newConnectionId };
    } catch (error) {
      console.error('[TaskOrientedChat] Error establishing SSE connection:', error);
      setIsConnecting(false);
      setConnectionStatus('disconnected');
      
      if (!isReconnecting) {
        showError('Failed to establish chat connection. Please try again.');
      }
      
      return { connectionId: null };
    }
  }, [isConnecting, connectionId, connectionStatus]);

  // Centralized function to handle connection termination
  const terminateConnection = useCallback(() => {
    if (eventSource) {
      console.log('[TaskOrientedChat] Terminating SSE connection');
      // Use the terminateChatStream method to properly notify the server
      chatApi.terminateChatStream().catch(err => {
        console.error('[TaskOrientedChat] Error terminating chat stream:', err);
      });
      setEventSource(null);
      setConnectionId(null);
    }
  }, [eventSource]);

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
      if (!isExpanded && eventSource) {
        terminateConnection();
      }
    };
  }, [isExpanded, connectToSSE, terminateConnection, eventSource, isConnecting]);
  
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
    
    // Add user message to chat history
    setChatHistory(prev => [...prev, { 
      type: 'user', 
      content: currentMessage 
    }]);
    
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
          setConnectionStatus('disconnected');
          
          // Hide the input form
          setShowInputForm(false);
          
          // Show the error in the chat with a reconnect button
          setChatHistory(prev => [...prev, { 
            type: 'system', 
            content: 'Connection lost. Please click the reconnect button to continue chatting.' 
          }]);
          
          // Don't automatically reconnect - let the user click the button
          return;
        }
        
        // Handle other errors
        setChatHistory(prev => [...prev, { 
          type: 'system', 
          content: response.content
        }]);
        
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
      const handled = handlePageSpecificCommand(currentMessage);
      if (handled) {
        console.log('[TaskOrientedChat] Page-specific command handled');
        return;
      }
      
    } catch (error) {
      console.error('[TaskOrientedChat] Error sending message:', error);
      
      // Turn off loading states
      setIsSending(false);
      
      // Set connection status to disconnected
      setConnectionStatus('disconnected');
      
      // Hide the input form
      setShowInputForm(false);
      
      // Add error message to chat with reconnect instructions
      setChatHistory(prev => [...prev, { 
        type: 'system', 
        content: 'Sorry, there was an error sending your message. Please use the reconnect button to try again.' 
      }]);
    }
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
      
      // Ensure we have a connection before sending
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
        type: contextType,
        content: currentMessage,
        connectionId: activeConnectionId,
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
    const handleChatTrigger = async (event: CustomEvent) => {
      setIsExpanded(true);
      
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
            setIsConnecting(true);
            
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
  }, [connectionId, contextType, handleNavigation, handlePageSpecificCommand, detectNavigationIntent, connectToSSE, isConnecting]);
   
  // Add a function to handle manual reconnection
  const handleReconnect = useCallback(async () => {
    if (connectionStatus === 'reconnecting') return;
    
    // Show the input form again
    setShowInputForm(true);
    
    // Reset reconnect attempts
    setReconnectAttempts(0);
    
    // Attempt to reconnect
    await connectToSSE(true);
  }, [connectToSSE, connectionStatus]);
  
  // Add automatic reconnection logic
  useEffect(() => {
    let reconnectTimer: NodeJS.Timeout | null = null;
    
    if (isExpanded && connectionStatus === 'disconnected' && reconnectAttempts < MAX_AUTO_RECONNECT_ATTEMPTS) {
      // Calculate backoff time (1s, 2s, 4s, 8s, 16s)
      const backoffTime = Math.min(1000 * Math.pow(2, reconnectAttempts), 16000);
      
      console.log(`[TaskOrientedChat] Attempting to reconnect in ${backoffTime}ms (attempt ${reconnectAttempts + 1}/${MAX_AUTO_RECONNECT_ATTEMPTS})`);
      
      reconnectTimer = setTimeout(async () => {
        setReconnectAttempts(prev => prev + 1);
        await connectToSSE(true);
      }, backoffTime);
    }
    
    return () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
    };
  }, [isExpanded, connectionStatus, reconnectAttempts, connectToSSE]);

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
          terminateConnection();
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
                terminateConnection();
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

        {/* Connection status */}
        {isExpanded && (
            <div className="bg-amber-100 connection-status flex items-center justify-between px-4 py-1 text-xs">
              <div className="text-gray-700 font-medium">
                You are talking with your personal DoveText AI Assistant
              </div>
              {connectionStatus === 'connected' && (
                  <div className="flex items-center text-green-600">
                    <Wifi className="w-3 h-3 mr-1" />
                    <span>Connected</span>
                  </div>
              )}
              {connectionStatus === 'reconnecting' && (
                  <div className="flex items-center text-amber-600">
                    <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                    <span>Reconnecting...</span>
                  </div>
              )}
              {connectionStatus === 'disconnected' && (
                  <div className="flex items-center gap-2">
                    <div className="text-red-600 flex items-center">
                      <WifiOff className="w-3 h-3 mr-1" />
                      <span>Disconnected</span>
                    </div>
                    <button
                        onClick={handleReconnect}
                        className="text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      <span>Reconnect</span>
                    </button>
                  </div>
              )}
            </div>
        )}

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
            <>
              {/* Regular chat messages */}
              {chatHistory.map((message, index) => (
                <div key={message.id || index} className={`mb-3 ${message.type === 'user' ? 'text-right' : ''}`}>
                  <div 
                    className={`inline-block p-3 rounded-lg max-w-[85%] ${
                      message.type === 'user' 
                        ? 'bg-blue-500 text-white' 
                        : currentTask?.complete && index === chatHistory.length - 1 
                          ? 'bg-green-100 border border-green-200 text-green-800' 
                          : 'bg-white border'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              
              {/* Processing indicator - shown after the last message when processing */}
              {isProcessing && (
                <div className="mb-3">
                  <div className="inline-block p-3 rounded-lg max-w-[85%] bg-white border border-gray-200 text-gray-700">
                    <div className="flex items-center">
                      <span>{processingHint}</span>
                      <span className="ml-2 flex">
                        <span className="h-2 w-2 bg-gray-500 rounded-full mr-1 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="h-2 w-2 bg-gray-500 rounded-full mr-1 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '600ms' }}></span>
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
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
        
        {/* Connection lost message */}
        {connectionStatus === 'disconnected' && !showInputForm && (
          <div className="p-4 bg-yellow-50 border-t border-yellow-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-yellow-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="text-sm text-yellow-700">
                  Connection lost. Please reconnect to continue.
                </span>
              </div>
              <button
                onClick={handleReconnect}
                className="px-4 py-2 text-sm font-medium rounded-md bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Reconnect
              </button>
            </div>
          </div>
        )}
        
        {/* Chat Input */}
        {showInputForm && (
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
                disabled={currentTask?.complete || isSending}
                onClick={() => console.log('[TaskOrientedChat] Submit button clicked')}
                className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full focus:outline-none ${
                  currentTask?.complete 
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
        )}
      </div>
    </div>
  );
}
