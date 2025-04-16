'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { chatApi } from '@/app/api/chat';
import { useAuth } from '@/context/AuthContext'; // Assuming you have an AuthContext

// Import types from our types file instead of hooks
import { 
  ChatMessage, 
  ChatTask, 
  ConnectionStatus, 
  AnimationState, 
  CustomEventSource,
  SSEConnectionResult 
} from '@/types/chat';
import { InteractiveMessage } from '@/types/interactive';

/**
 * The shape of the ChatContext
 */
interface ChatContextType {
  // Connection state
  connectionId: string | null;
  connectionStatus: ConnectionStatus;
  reconnectAttempts: number;
  MAX_AUTO_RECONNECT_ATTEMPTS: number;
  
  // Chat state
  chatHistory: ChatMessage[];
  currentTask: ChatTask | null;
  isProcessing: boolean;
  processingHint: string;
  showInputForm: boolean;
  isSending: boolean;
  
  // UI state
  isExpanded: boolean;
  animationState: AnimationState;
  isUserInitiated: boolean;
  isActive: boolean;
  setIsUserInitiated: (isUserInitiated: boolean) => void;
  
  // Connection methods
  connectToSSE: () => Promise<SSEConnectionResult>;
  handleReconnect: () => Promise<void>;
  terminateConnection: () => void;
  
  // Chat methods
  addUserMessage: (content: string, id?: string, interactive?: boolean, request?: string) => void;
  addSystemMessage: (content: string, id?: string, interactiveData?: InteractiveMessage, isResponseSubmitted?: boolean) => void;
  addErrorMessage: (content: string, id?: string) => void;
  clearChatHistory: () => void;
  updateTask: (task: Partial<ChatTask>) => void;
  setProcessing: (processing: boolean, hint?: string) => void;
  
  // Interactive message methods
  handleInteractiveResponse: (messageId: string, response: any, contextType?: string) => void;
  
  // Message submission
  sendMessage: (message: string, type?: string, contextType: string) => Promise<void>;
  
  // UI methods
  expandChat: () => void;
  minimizeChat: () => void;
  handleChatTrigger: (message: string, contextType: string) => void;
}

// Create the context with a default value of null
const ChatContext = createContext<ChatContextType | null>(null);

/**
 * Props for the ChatProvider component
 */
interface ChatProviderProps {
  children: ReactNode;
  maxReconnectAttempts?: number;
  animationDuration?: number;
}

/**
 * Provider component for the ChatContext
 * Manages all chat-related state and functionality
 */
export function ChatProvider({ 
  children, 
  maxReconnectAttempts = 5,
  animationDuration = 300
}: ChatProviderProps) {
  const auth = useAuth();
  const router = useRouter();
  
  // If user is not authenticated or not active, just render children without chat functionality
  if (!auth.user || !auth.isActive) {
    return <>{children}</>;
  }
  
  // ===== Connection State =====
  const [eventSource, setEventSource] = useState<CustomEventSource | null>(null);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const MAX_AUTO_RECONNECT_ATTEMPTS = maxReconnectAttempts;

  // Track last time a heartbeat is received from server
  const [lastHeartbeatReceivedTime, setLastHeartbeatReceivedTime] = useState<number | null>(null);
  const HEARTBEAT_TIMEOUT_MS = 45 * 1000;
  
  // ===== Chat State =====
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [currentTask, setCurrentTask] = useState<ChatTask | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingHint, setProcessingHint] = useState('');
  const [showInputForm, setShowInputForm] = useState(true);
  const [isSending, setIsSending] = useState(false);
  
  // ===== UI State =====
  const [isExpanded, setIsExpanded] = useState(false);
  const [animationState, setAnimationState] = useState<AnimationState>('closed');
  const [isUserInitiated, setIsUserInitiated] = useState(false);
  const [isActive, setIsActive] = useState(false);
  
  // ===== Chat Methods =====
  
  /**
   * Adds a user message to the chat history
   */
  const addUserMessage = useCallback((
    content: string, 
    id?: string, 
    interactive: boolean = false,
    request: string = 'chat'
  ) => {
    setChatHistory(prev => [...prev, {
      type: 'user',
      content,
      id,
      timestamp: Date.now(),
      interactive,
      request
    }]);
  }, []);
  
  /**
   * Adds a system message to the chat history
   */
  const addSystemMessage = useCallback((content: string, id?: string, interactiveData?: InteractiveMessage, isResponseSubmitted?: boolean) => {
    setChatHistory(prev => [...prev, {
      type: 'system',
      content,
      id,
      timestamp: Date.now(),
      interactive: !!interactiveData,
      interactiveData,
      isResponseSubmitted
    }]);
  }, []);

  /**
   * Adds an error message to the chat history
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
   */
  const setProcessing = useCallback((processing: boolean, hint: string = '') => {
    setIsProcessing(processing);
    setProcessingHint(hint);
  }, []);
  
  // ===== UI Methods =====
  
  /**
   * Expands the chat interface
   */
  const expandChat = useCallback(() => {
    setAnimationState('opening');
    setIsExpanded(true);
    setIsActive(true);
    
    setTimeout(() => {
      setAnimationState('open');
    }, animationDuration);
  }, [animationDuration]);
  
  /**
   * Minimizes the chat interface
   */
  const minimizeChat = useCallback(() => {
    setAnimationState('closing');
    
    setTimeout(() => {
      setIsExpanded(false);
      setAnimationState('closed');
    }, animationDuration);
  }, [animationDuration]);
  
  // ===== Connection Methods =====
  
  /**
   * Process SSE events received from the server
   */
  const processSSEEvent = useCallback((eventType: string, eventData: any) => {
    console.log('[ChatContext] Processing SSE event:', eventType, eventData);
    
    try {
      // Process different event types
      if (eventType === 'heartbeat') {
        setLastHeartbeatReceivedTime(Date.now());
        return;
      }
      if (eventType === 'connected') {
        setConnectionStatus('connected');
        setConnectionId(eventData.connectionId);
        setReconnectAttempts(0);
        setLastHeartbeatReceivedTime(Date.now());
      }
      if (eventType === 'thinking' || eventType === 'processing') {
        const content = eventData.content || 'Thinking...';
        setProcessing(true, content);
      } else if (eventType === 'message') {
        setProcessing(false);
        
        // Check if this is an interactive message
        if (eventData.interactive) {
          addSystemMessage(
            eventData.content, 
            eventData.id, 
            {
              interactive: true,
              function: eventData.function,
              parameters: eventData.parameters
            }
          );
        } else {
          addSystemMessage(eventData.content, eventData.id);
        }
      } else if (eventType === 'interactive') {
        // Handle interactive event type directly
        setProcessing(false);
        
        // Extract the appropriate content based on the function type
        let content = '';
        
        if (eventData.function === 'confirm') {
          // For confirm interactions, use the message parameter
          content = eventData.parameters?.message || 'Confirm?';
        } else if (eventData.function === 'select') {
          // For select interactions, use the question parameter
          content = eventData.parameters?.question || 'Select an option:';
        } else if (eventData.function === 'form') {
          // For form interactions, use the title parameter
          content = eventData.parameters?.prompt || 'Please fill out this form:';
        } else if (eventData.function === 'chat') {
          // For chat interactions, use the question parameter
          content = eventData.parameters?.question || 'What would you like to chat about?';
        } else if (eventData.function === 'present') {
          // For present interactions, don't use the title as content
          // Instead, use a generic message or empty string since the PresentInteraction component will show the title
          content = ''; // Don't include title in the message content
        } else {
          // Default fallback for unknown function types
          content = 'Interactive message';
        }
        
        console.log('[ChatContext] Extracted content for interactive message:', content);
        console.log('[ChatContext] Full interactive message data:', eventData);
        
        // For present interactions, mark as already responded to since they don't expect responses
        const isPresent = eventData.function === 'present';
        
        addSystemMessage(
          content,
          eventData.messageId || eventData.id || `interactive-${Date.now()}`,
          {
            interactive: true,
            function: eventData.function,
            parameters: eventData.parameters
          },
          isPresent // Mark present messages as already responded to
        );
      } else if (eventType === 'task_update') {
        updateTask({
          complete: eventData.complete || false,
          steps: eventData.steps || 1,
          currentStep: eventData.currentStep || 1
        });
        
        // If task is complete, reset chat after a delay
        if (eventData.complete) {
          setTimeout(() => {
            clearChatHistory();
          }, 5000);
        }
      } else if (eventType === 'action') {
        // Handle action events (navigation, form filling, etc.)
        // This would need to be expanded based on your application's needs
        console.log('[ChatContext] Action received:', eventData.actionType);
      } else if (eventType === 'complete') {
        // Handle session completion event
        console.log('[ChatContext] Session completed:', eventData);
        
        // Add a system message to indicate completion
        addSystemMessage(eventData.content || 'Session completed');
        
        // Set processing to false
        setProcessing(false);
        
        // Wait a moment to allow the user to see the completion message
        setTimeout(() => {
          // Minimize the chat window
          minimizeChat();
          
          // Terminate the SSE connection
          terminateConnection();
          
          // Optional: Clear chat history after a delay if desired
          // setTimeout(() => {
          //   clearChatHistory();
          // }, 3000);
        }, 2000);
      }
    } catch (error) {
      console.error('[ChatContext] Error processing SSE event:', error);
      addSystemMessage('An error occurred processing the response. Please try again.');
    }
  }, [setProcessing, addSystemMessage, updateTask, clearChatHistory]);
  
  /**
   * Establishes an SSE connection to the server
   * Returns the connectionId immediately for use without waiting for state updates
   */
  const connectToSSE = useCallback(async (): Promise<SSEConnectionResult> => {
    console.log('[ChatContext] Starting SSE connection...');
    try {
      // Prevent duplicate connection attempts
      if (isConnecting) {
        console.log('[ChatContext] Connection already in progress, skipping');
        return { connectionId };
      }
      
      // Update connection status
      setIsConnecting(true);
      setConnectionStatus('reconnecting');
      
      // Define the message handler for SSE events
      const handleSSEEvent = (eventType: string, data: any) => {
        console.log('[ChatContext] Received SSE event:', eventType, data);
        
        // Update connection status on first successful message
        if (connectionStatus !== 'connected') {
          setConnectionStatus('connected');
          setReconnectAttempts(0);
        }
        
        // Process the event
        processSSEEvent(eventType, data);
      };
      
      console.log('[ChatContext] Calling createChatStream');
      const { eventSource: newEventSource, connectionId: newConnectionId } = await chatApi.createChatStream(handleSSEEvent);
      
      console.log('[ChatContext] createChatStream returned:', { 
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
      console.error('[ChatContext] Error establishing SSE connection:', error);
      setIsConnecting(false);
      setConnectionStatus('disconnected');
      
      addSystemMessage('Error connecting to chat service. Please try again.');
      
      return { connectionId: null };
    }
  }, [isConnecting, connectionId, connectionStatus, processSSEEvent, addSystemMessage]);
  
  /**
   * Handles manual reconnection attempts
   */
  const handleReconnect = useCallback(async () => {
    if (connectionStatus === 'reconnecting') return;
    
    // Attempt to reconnect
    await connectToSSE();
  }, [connectToSSE, connectionStatus]);
  
  /**
   * Terminates the SSE connection and cleans up resources
   */
  const terminateConnection = useCallback(() => {
    if (eventSource) {
      console.log('[ChatContext] Terminating SSE connection');
      // Use the terminateChatStream method to properly notify the server
      chatApi.terminateChatStream().catch(err => {
        console.error('[ChatContext] Error terminating chat stream:', err);
      });
      
      // Clean up the event source
      eventSource.close();
      setEventSource(null);
      setConnectionId(null);
      setConnectionStatus('disconnected');
    }

    clearChatHistory();
  }, [eventSource, clearChatHistory]);
  
  /**
   * Handles sending a message to the chat backend
   * - If no heartbeat for 30s, reconnect first
   * - If 404 error, reconnect and retry ONCE
   */
  const sendMessage = useCallback(async (message: string, type?: string, contextType: string) => {
    addUserMessage(message, undefined, false, 'chat');
    setIsSending(true);
    let activeConnectionId = connectionId;
    let triedReconnect = false;

    // Helper to reconnect SSE and get new connectionId
    const reconnect = async () => {
      setConnectionStatus('reconnecting');
      setConnectionId(null);
      if (eventSource) {
        eventSource.close();
        setEventSource(null);
      }
      const result = await connectToSSE();
      setLastHeartbeatReceivedTime(Date.now());
      return result.connectionId;
    };

    // Check heartbeat freshness
    const now = Date.now();
    if (!lastHeartbeatReceivedTime || now - lastHeartbeatReceivedTime > HEARTBEAT_TIMEOUT_MS) {
      console.log('[ChatContext] No recent heartbeat, reconnecting before sending message');
      activeConnectionId = await reconnect();
      if (!activeConnectionId) {
        setIsSending(false);
        addSystemMessage('Failed to reconnect before sending message.');
        return;
      }
    }

    // Try sending message, retry ONCE on error (response or 404 exception)
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await chatApi.sendMessage({
          type: type ?? "chat",
          context: contextType,
          content: message,
          connectionId: activeConnectionId ?? undefined,
          currentPage: window.location.pathname
        });
        setIsSending(false);
        // Update heartbeat timestamp on any successful response (connection is alive)
        if (response && response.type !== 'error') {
          setLastHeartbeatReceivedTime(Date.now());
        }
        if (response.type === 'error') {
          if (!triedReconnect) {
            console.log('[ChatContext] Error response, reconnecting and retrying message');
            activeConnectionId = await reconnect();
            triedReconnect = true;
            continue; // retry
          } else {
            addSystemMessage('Connection lost. Please click the reconnect button to continue chatting.');
            return;
          }
        }
        // Success
        return;
      } catch (error: any) {
        // Axios or network error: check for 404 status
        setIsSending(false);
        if (error && error.response && error.response.status === 404) {
          if (!triedReconnect) {
            console.log('[ChatContext] 404 error (exception), reconnecting and retrying message');
            activeConnectionId = await reconnect();
            triedReconnect = true;
            continue; // retry
          } else {
            addSystemMessage('Connection lost. Please click the reconnect button to continue chatting.');
            return;
          }
        }
        console.error('[ChatContext] Error sending message:', error);
        addSystemMessage('Sorry, there was an error sending your message. Please use the reconnect button to try again.');
        return;
      }
    }
  }, [connectionId, connectToSSE, addUserMessage, addSystemMessage, setIsSending, eventSource, lastHeartbeatReceivedTime]);
  
  /**
   * Handles a chat trigger event (e.g., from dashboard input)
   */
  const handleChatTrigger = useCallback((message: string, contextType: string) => {
    // Expand the chat
    expandChat();

    clearChatHistory();

    // Check if we need to reset the connection
    if (connectionStatus === 'disconnected') {
      console.log('[ChatContext] Connection is disconnected, resetting connection state before sending message');
      
      // Reset connection state
      setConnectionId(null);
      setEventSource(null);
      setConnectionStatus('reconnecting');
      
      // Clear chat history for a fresh start
      clearChatHistory();
    }

    // Send the message to the backend (this will establish a new connection if needed)
    sendMessage(message, 'new_chat', contextType);
  }, [expandChat, sendMessage, connectionStatus, setConnectionId, setEventSource, setConnectionStatus, clearChatHistory]);
  
  /**
   * Handles responses from interactive messages
   */
  const handleInteractiveResponse = useCallback((messageId: string, response: any, contextType: string = 'general') => {
    console.log('[ChatContext] Handling interactive response for message ID:', messageId, 'response:', response);
    
    // Mark the message as having received a response
    setChatHistory(prev => prev.map(message => {
      if (message.id === messageId) {
        return {
          ...message,
          isResponseSubmitted: true,
          responseValue: response // Store the actual response value
        };
      }
      return message;
    }));
    
    // Format the response based on type and get response content
    let responseContent = '';
    if (typeof response === 'boolean') {
      // For confirm interactions, find the original message to get the button text
      const originalMessage = chatHistory.find(msg => msg.id === messageId);
      if (originalMessage?.interactiveData?.function === 'confirm') {
        // Use the yesPrompt/noPrompt text as the response content
        const params = originalMessage.interactiveData.parameters;
        responseContent = response ? params.yesPrompt : params.noPrompt;
      } else {
        // Fallback if we can't find the original message
        responseContent = response ? 'Yes' : 'No';
      }
    } else if (typeof response === 'string') {
      responseContent = response;
    } else if (typeof response === 'object') {
      // For form responses, create a summary
      responseContent = 'Form submitted';
    } else {
      responseContent = String(response);
    }
    
    // Add the response as a user message
    const originalMessage = chatHistory.find(msg => msg.id === messageId);
    const requestType = originalMessage?.interactiveData?.function as string;
    
    addUserMessage(
      responseContent,
      `response-${messageId}`, // Use original message ID to link the response
      true, // This is an interactive message
      requestType || 'chat' // Use the original message's function type
    );
    
    // Send the response to the backend
    if (connectionId) {
      // Make sure we're using the exact messageId format that the backend expects
      // For interactive messages, the backend expects the raw messageId without any prefix
      const cleanMessageId = messageId.startsWith('interactive-') ? messageId : messageId;
      
      console.log('[ChatContext] Sending interactive response with messageId:', cleanMessageId);
      
      chatApi.sendMessage({
        type: 'interactive_response',
        context: contextType,
        content: JSON.stringify({
          messageId: cleanMessageId,
          response
        }),
        connectionId
      }).catch(error => {
        console.error('[ChatContext] Error sending interactive response:', error);
        addErrorMessage('Failed to send your response. Please try again.');
      });
    }
  }, [connectionId, addUserMessage, addErrorMessage, chatHistory]);

  // Auto-connect when isActive becomes true
  useEffect(() => {
    if (isActive && connectionStatus === 'disconnected' && !isConnecting) {
      console.log('[ChatContext] Auto-connecting because isActive is true');
      connectToSSE().catch(error => {
        console.error('[ChatContext] Error initializing connection:', error);
      });
    } else if (!isActive && connectionStatus !== 'disconnected') {
      // Terminate connection when isActive becomes false
      console.log('[ChatContext] Terminating connection because isActive is false');
      terminateConnection();
    }
  }, [isActive, connectionStatus, isConnecting, connectToSSE, terminateConnection]);
  
  // Add automatic reconnection logic with exponential backoff
  useEffect(() => {
    let reconnectTimer: NodeJS.Timeout | null = null;
    
    // Only attempt automatic reconnection if:
    // 1. We're currently disconnected
    // 2. We haven't exceeded the maximum number of attempts
    // 3. The connection should be active
    if (connectionStatus === 'disconnected' && 
        reconnectAttempts < MAX_AUTO_RECONNECT_ATTEMPTS && 
        isActive) {
      
      console.log(`[ChatContext] Attempting automatic reconnection (attempt ${reconnectAttempts + 1}/${MAX_AUTO_RECONNECT_ATTEMPTS})`);
      
      // Use exponential backoff for reconnection attempts
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
      
      reconnectTimer = setTimeout(() => {
        handleReconnect();
        setReconnectAttempts(prev => prev + 1);
      }, delay);
    }
    
    // Clean up timer on unmount or when reconnection status changes
    return () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
    };
  }, [connectionStatus, reconnectAttempts, MAX_AUTO_RECONNECT_ATTEMPTS, isActive, handleReconnect]);
  
  // Set up event listener for chat triggers
  useEffect(() => {
    const handleChatTriggerEvent = (event: CustomEvent) => {
      if (event.detail?.message) {
        handleChatTrigger(event.detail.message, event.detail.contextType);
      }
    };
    
    window.addEventListener('triggerChatBubble', handleChatTriggerEvent as EventListener);
    
    return () => {
      window.removeEventListener('triggerChatBubble', handleChatTriggerEvent as EventListener);
    };
  }, [handleChatTrigger]);
  
  // Reset user initiated flag when animation completes
  useEffect(() => {
    if (animationState === 'open' || animationState === 'closed') {
      setIsUserInitiated(false);
    }
  }, [animationState]);
  
  // Clean up connection when component unmounts
  useEffect(() => {
    return () => {
      if (eventSource) {
        terminateConnection();
      }
    };
  }, [eventSource, terminateConnection]);
  
  // Create the context value
  const contextValue: ChatContextType = {
    // Connection state
    connectionId,
    connectionStatus,
    reconnectAttempts,
    MAX_AUTO_RECONNECT_ATTEMPTS,
    
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
    isActive,
    setIsUserInitiated,
    
    // Connection methods
    connectToSSE,
    handleReconnect,
    terminateConnection,
    
    // Chat methods
    addUserMessage,
    addSystemMessage,
    addErrorMessage,
    clearChatHistory,
    updateTask,
    setProcessing,
    
    // Interactive message methods
    handleInteractiveResponse,
    
    // Message submission
    sendMessage,
    
    // UI methods
    expandChat,
    minimizeChat,
    handleChatTrigger
  };
  
  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
}

/**
 * Hook to use the ChatContext
 * @returns The ChatContext value
 * @throws Error if used outside of a ChatProvider
 */
export function useChat() {
  const context = useContext(ChatContext);
  
  if (context === null) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  
  return context;
}
