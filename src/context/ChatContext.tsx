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
  sendMessage: (message: string, contextType: string, type?: string) => Promise<void>;
  
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

// Wrapper component to handle the conditional rendering
// This avoids the React hooks order issues
export function ChatProvider({ 
  children, 
  maxReconnectAttempts = 5,
  animationDuration = 300
}: ChatProviderProps) {
  const auth = useAuth();
  
  // If user is not authenticated or not active, just render children without chat functionality
  if (!auth.user || !auth.isActive) {
    return <>{children}</>;
  }
  
  return <ChatProviderContent 
    children={children} 
    maxReconnectAttempts={maxReconnectAttempts} 
    animationDuration={animationDuration} 
  />;
}

// Inner component that only renders when user is authenticated
// All hooks are defined here without conditionals
function ChatProviderContent({ 
  children, 
  maxReconnectAttempts,
  animationDuration
}: ChatProviderProps) {
  const auth = useAuth();
  const router = useRouter();
  
  // ===== Connection State =====
  const [eventSource, setEventSource] = useState<CustomEventSource | null>(null);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const [lastHeartbeatReceivedTime, setLastHeartbeatReceivedTime] = useState<number | null>(null);
  const MAX_AUTO_RECONNECT_ATTEMPTS = maxReconnectAttempts;
  const HEARTBEAT_TIMEOUT_MS = 45 * 1000;
  
  // ===== Chat State =====
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [currentTask, setCurrentTask] = useState<ChatTask | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingHint, setProcessingHint] = useState('');
  const [showInputForm, setShowInputForm] = useState(true);
  const [isSending, setIsSending] = useState(false);
  
  // ===== UI State =====
  const [isUserInitiated, setIsUserInitiated] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [animationState, setAnimationState] = useState<AnimationState>('closed');
  const [isActive, setIsActive] = useState(false);

  // ===== Chat Methods =====
  
  /**
   * Add a user message to the chat history
   */
  const addUserMessage = useCallback((content: string, id?: string, interactive = false, request = '') => {
    const messageId = id || `user-${Date.now()}`;
    setChatHistory(prev => [...prev, {
      id: messageId,
      role: 'user',
      content,
      timestamp: Date.now(),
      interactive,
      request
    }]);
    return messageId;
  }, []);

  /**
   * Add a system message to the chat history
   */
  const addSystemMessage = useCallback((content: string, id?: string, interactiveData?: InteractiveMessage, isResponseSubmitted = false) => {
    const messageId = id || `system-${Date.now()}`;
    setChatHistory(prev => [...prev, {
      id: messageId,
      role: 'system',
      content,
      timestamp: Date.now(),
      interactive: !!interactiveData,
      interactiveData,
      isResponseSubmitted
    }]);
    return messageId;
  }, []);

  /**
   * Add an error message to the chat history
   */
  const addErrorMessage = useCallback((content: string, id?: string) => {
    const messageId = id || `error-${Date.now()}`;
    setChatHistory(prev => [...prev, {
      id: messageId,
      role: 'error',
      content,
      timestamp: Date.now()
    }]);
    return messageId;
  }, []);

  /**
   * Clear the chat history
   */
  const clearChatHistory = useCallback(() => {
    setChatHistory([]);
    setCurrentTask(null);
  }, []);

  /**
   * Update the current task
   */
  const updateTask = useCallback((task: Partial<ChatTask>) => {
    setCurrentTask(prev => prev ? { ...prev, ...task } : null);
  }, []);

  /**
   * Set the processing state
   */
  const setProcessing = useCallback((processing: boolean, hint = '') => {
    setIsProcessing(processing);
    setProcessingHint(hint);
  }, []);

  /**
   * Handle an interactive response from the user
   */
  const handleInteractiveResponse = useCallback((messageId: string, response: any, contextType = 'general') => {
    // Find the message in the chat history
    const message = chatHistory.find(msg => msg.id === messageId);
    if (!message || !message.interactive) return;

    // Mark the message as having a response
    setChatHistory(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, isResponseSubmitted: true } : msg
    ));

    // Send the response to the backend
    chatApi.sendInteractiveResponse({
      messageId,
      response,
      contextType
    }).catch(error => {
      console.error('Error sending interactive response:', error);
      addErrorMessage('Failed to send your response. Please try again.');
    });
  }, [chatHistory, addErrorMessage]);

  /**
   * Connect to the server-sent events endpoint
   */
  const connectToSSE = useCallback(async (): Promise<SSEConnectionResult> => {
    if (isConnecting) {
      return { success: false, error: 'Already connecting' };
    }

    setIsConnecting(true);
    
    try {
      // Create a new EventSource connection
      const result = await chatApi.connectSSE();
      
      if (!result.success) {
        setConnectionStatus('error');
        setIsConnecting(false);
        return result;
      }
      
      const { eventSource, connectionId } = result;
      
      // Set up event listeners
      eventSource.addEventListener('open', () => {
        setConnectionStatus('connected');
        setConnectionId(connectionId);
        setLastHeartbeatReceivedTime(Date.now());
        setReconnectAttempts(0);
      });
      
      eventSource.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'heartbeat') {
            setLastHeartbeatReceivedTime(Date.now());
            return;
          }
          
          // Handle other message types here
          
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      });
      
      eventSource.addEventListener('error', () => {
        setConnectionStatus('error');
        eventSource.close();
        setEventSource(null);
      });
      
      // Store the event source and connection ID
      setEventSource(eventSource);
      setConnectionId(connectionId);
      setIsConnecting(false);
      
      return { success: true, eventSource, connectionId };
    } catch (error) {
      console.error('Error connecting to SSE:', error);
      setConnectionStatus('error');
      setIsConnecting(false);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, [isConnecting]);

  /**
   * Handle reconnection to the server
   */
  const handleReconnect = useCallback(async () => {
    if (isConnecting || reconnectAttempts >= MAX_AUTO_RECONNECT_ATTEMPTS) {
      return;
    }
    
    setReconnectAttempts(prev => prev + 1);
    await connectToSSE();
  }, [isConnecting, reconnectAttempts, MAX_AUTO_RECONNECT_ATTEMPTS, connectToSSE]);

  /**
   * Terminate the connection to the server
   */
  const terminateConnection = useCallback(() => {
    if (eventSource) {
      eventSource.close();
      setEventSource(null);
    }
    
    setConnectionId(null);
    setConnectionStatus('disconnected');
  }, [eventSource]);

  /**
   * Send a message to the server
   * - If no connection, connect first
   * - If no heartbeat for 30s, reconnect first
   * - If 404 error, reconnect and retry ONCE
   */
  const sendMessage = useCallback(async (message: string, contextType: string, type?: string) => {
    addUserMessage(message, undefined, false, 'chat');
    setIsSending(true);
    let activeConnectionId = connectionId;
    let triedReconnect = false;
    
    try {
      // If not connected or heartbeat timeout, try to reconnect
      const now = Date.now();
      const heartbeatExpired = lastHeartbeatReceivedTime && (now - lastHeartbeatReceivedTime > HEARTBEAT_TIMEOUT_MS);
      
      if (!activeConnectionId || heartbeatExpired) {
        triedReconnect = true;
        const result = await connectToSSE();
        if (!result.success) {
          throw new Error('Failed to connect to server');
        }
        activeConnectionId = result.connectionId;
      }
      
      // Send the message
      try {
        const response = await chatApi.sendMessage({
          message,
          type: type || 'chat',
          connectionId: activeConnectionId!,
          contextType
        });
        
        // Handle successful response
        if (response.task) {
          setCurrentTask(response.task);
        }
        
        if (response.message) {
          addSystemMessage(response.message);
        }
      } catch (error: any) {
        // If 404 error and haven't tried reconnecting yet, try once
        if (error.status === 404 && !triedReconnect) {
          triedReconnect = true;
          const result = await connectToSSE();
          if (!result.success) {
            throw new Error('Failed to reconnect to server');
          }
          
          // Retry with new connection
          const retryResponse = await chatApi.sendMessage({
            message,
            type: type || 'chat',
            connectionId: result.connectionId!,
            contextType
          });
          
          if (retryResponse.task) {
            setCurrentTask(retryResponse.task);
          }
          
          if (retryResponse.message) {
            addSystemMessage(retryResponse.message);
          }
        } else {
          // Other error, just throw
          throw error;
        }
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      addErrorMessage(error.message || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  }, [
    connectionId, 
    lastHeartbeatReceivedTime, 
    HEARTBEAT_TIMEOUT_MS, 
    connectToSSE, 
    addUserMessage, 
    addSystemMessage, 
    addErrorMessage
  ]);

  /**
   * Expand the chat UI
   */
  const expandChat = useCallback(() => {
    setAnimationState('opening');
    setTimeout(() => {
      setIsExpanded(true);
      setAnimationState('open');
    }, animationDuration);
  }, [animationDuration]);

  /**
   * Minimize the chat UI
   */
  const minimizeChat = useCallback(() => {
    setAnimationState('closing');
    setTimeout(() => {
      setIsExpanded(false);
      setAnimationState('closed');
    }, animationDuration);
  }, [animationDuration]);

  /**
   * Handle a chat trigger (e.g., from a button click)
   */
  const handleChatTrigger = useCallback((message: string, contextType: string) => {
    // If not expanded, expand first
    if (!isExpanded) {
      expandChat();
    }
    
    // If not connected, connect first
    if (connectionStatus !== 'connected') {
      setConnectionId(null);
      setEventSource(null);
      setConnectionStatus('disconnected');
    }

    // Send the message to the backend (this will establish a new connection if needed)
    sendMessage(message, contextType, 'new_chat');
  }, [expandChat, sendMessage, connectionStatus, setConnectionId, setEventSource, setConnectionStatus, clearChatHistory, isExpanded]);

  /**
   * Check for heartbeat timeouts
   */
  useEffect(() => {
    const interval = setInterval(() => {
      if (!lastHeartbeatReceivedTime) return;
      
      const now = Date.now();
      if (now - lastHeartbeatReceivedTime > HEARTBEAT_TIMEOUT_MS) {
        // Heartbeat timeout, try to reconnect
        handleReconnect();
      }
    }, 10000); // Check every 10 seconds
    
    return () => clearInterval(interval);
  }, [lastHeartbeatReceivedTime, HEARTBEAT_TIMEOUT_MS, handleReconnect]);

  /**
   * Clean up on unmount
   */
  useEffect(() => {
    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [eventSource]);

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
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
