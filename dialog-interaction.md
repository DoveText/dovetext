# Dialog Interaction System Documentation

## Overview

This document outlines the implementation of the global action context system that enables the TaskOrientedChat component to control navigation and trigger UI actions across different pages in the Dove Text application.

## Architecture

### Core Components

1. **ActionContext**: A global context that manages actions across the application
2. **ChatContext**: A context that manages chat state, messages, and SSE connections
3. **TaskOrientedChat**: A chat interface component that sets actions in the context
4. **ProtectedRoute**: A wrapper component that provides authentication protection and includes the chat component

### Flow Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  User Request   │────▶│ TaskOrientedChat│────▶│  ActionContext  │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                │
                                ▼
                        ┌─────────────────┐
                        │                 │
                        │   ChatContext   │
                        │                 │
                        └─────────────────┘
                                │
                                ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  UI Response    │◀────│   Page Component│◀────│  Action Handler │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Implementation Details

### 1. ActionContext

The ActionContext provides a global state for managing actions across the application. It includes:

- `pendingAction`: The current action to be performed
- `actionPayload`: Optional data associated with the action
- `setPendingAction`: Function to set a new pending action
- `clearPendingAction`: Function to clear the current action

```tsx
// src/context/ActionContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define the types of actions that can be performed across the app
export type ActionType = 
  | 'create-delivery-method'
  | 'edit-delivery-method'
  | 'create-task'
  | 'edit-task'
  | 'create-event'
  | 'open-settings'
  | 'none';

interface ActionContextType {
  pendingAction: ActionType;
  actionPayload: any;
  setPendingAction: (action: ActionType, payload?: any) => void;
  clearPendingAction: () => void;
}

const ActionContext = createContext<ActionContextType | undefined>(undefined);

export function ActionProvider({ children }: { children: ReactNode }) {
  const [pendingAction, setPendingActionState] = useState<ActionType>('none');
  const [actionPayload, setActionPayload] = useState<any>(null);

  // Set a pending action with optional payload
  const setPendingAction = (action: ActionType, payload: any = null) => {
    setPendingActionState(action);
    setActionPayload(payload);
  };

  // Clear the pending action
  const clearPendingAction = () => {
    setPendingActionState('none');
    setActionPayload(null);
  };

  // Context value
  const contextValue: ActionContextType = {
    pendingAction,
    actionPayload,
    setPendingAction,
    clearPendingAction
  };

  return (
    <ActionContext.Provider value={contextValue}>
      {children}
    </ActionContext.Provider>
  );
}

// Default empty context value
const defaultContextValue: ActionContextType = {
  pendingAction: 'none',
  actionPayload: null,
  setPendingAction: () => {},
  clearPendingAction: () => {}
};

// Custom hook to use the action context
export function useAction() {
  const context = useContext(ActionContext);
  // Return default context if not within provider instead of throwing
  return context || defaultContextValue;
}
```

### 2. ChatContext

The ChatContext provides a comprehensive state management system for the chat functionality:

```tsx
// src/context/ChatContext.tsx (simplified)
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface ChatContextType {
  // Connection state
  connectionId: string | null;
  connectionStatus: ConnectionStatus;
  reconnectAttempts: number;
  
  // Chat state
  chatHistory: ChatMessage[];
  currentTask: ChatTask | null;
  isProcessing: boolean;
  
  // UI state
  isExpanded: boolean;
  animationState: AnimationState;
  
  // Methods
  addUserMessage: (content: string, id?: string) => void;
  addSystemMessage: (content: string, id?: string, interactiveData?: InteractiveMessage) => void;
  handleInteractiveResponse: (messageId: string, response: any, contextType?: string) => void;
  sendMessage: (message: string, type?: string, contextType: string) => Promise<void>;
  expandChat: () => void;
  minimizeChat: () => void;
}

export function ChatProvider({ children }: { children: ReactNode }) {
  // Implementation details...
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
```

### 3. ProtectedRoute Component

The ProtectedRoute component wraps authenticated pages and includes the TaskOrientedChat component with context-aware functionality:

```tsx
// src/components/auth/ProtectedRoute.tsx
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import TaskOrientedChat from '@/components/common/TaskOrientedChat';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, needsValidation, isActive } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/signin');
      } else if (needsValidation) {
        router.push('/auth/validate-email');
      } else if (!isActive) {
        router.push('/auth/activate');
      }
    }
  }, [user, loading, needsValidation, isActive, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user || needsValidation || !isActive) {
    return null;
  }

  const pathname = usePathname();
  const contextType = pathname?.includes('/schedule') ? 'schedule' : pathname?.includes('/tasks') ? 'automation' : 'general';

  return (
    <>
      {children}
      <TaskOrientedChat contextType={contextType} />
    </>  
  );
}
```

### 4. TaskOrientedChat Component

The TaskOrientedChat component uses both the ActionContext and ChatContext to manage user interactions:

```tsx
// src/components/common/TaskOrientedChat.tsx (simplified)
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAction } from '@/context/ActionContext';
import { useChat } from '@/context/ChatContext';
import { 
  getContextTitle, 
  getContextExample,
  handlePageSpecificCommand
} from '@/utils/chatHelpers';

interface TaskOrientedChatProps {
  contextType?: string;
  onSwitchContext?: (contextType: string) => void;
  className?: string;
  enableNavigation?: boolean;
  enableChatTrigger?: boolean;
}

export default function TaskOrientedChat({ 
  contextType = 'general',
  onSwitchContext,
  className = '',
  enableNavigation = false,
  enableChatTrigger = true
}: TaskOrientedChatProps) {
  const [currentPage, setCurrentPage] = useState('');
  const router = useRouter();
  const actionContext = useAction();
  const {
    chatHistory,
    currentTask,
    isProcessing,
    isExpanded,
    animationState,
    expandChat,
    minimizeChat,
    sendMessage,
    // ...other chat context values
  } = useChat();
  
  // Handle user input
  const handleSubmit = useCallback((message: string) => {
    // Check for page-specific commands first
    if (handlePageSpecificCommandForPage(message)) {
      return;
    }
    
    // Handle interactive messages or send as regular message
    // ...implementation details
    
    sendMessage(message, 'chat', contextType);
  }, [sendMessage, contextType, handlePageSpecificCommandForPage]);
  
  // ...other component logic
}
```

### 5. Chat Helpers

The chat helper utilities provide functions for detecting user intent and handling page-specific commands:

```tsx
// src/utils/chatHelpers.ts
export function detectNavigationIntent(text: string): string | null {
  const lowerText = text.toLowerCase();
  
  // Comprehensive navigation patterns
  const navigationPatterns = [
    { pattern: /create.*delivery method|add.*delivery method|new delivery method/i, action: 'create-delivery-method' },
    { pattern: /create.*task|add.*task|new task/i, action: 'create-task' },
    { pattern: /create.*schedule|add.*schedule|new schedule|create.*event|add.*event|new event/i, action: 'create-schedule' },
    // ...other patterns
  ];
  
  // Check if message matches any navigation pattern
  for (const { pattern, action } of navigationPatterns) {
    if (pattern.test(lowerText)) {
      return action;
    }
  }
  
  return null;
}

export function handlePageSpecificCommand(
  text: string, 
  currentPage: string,
  actionContext: any,
  addSystemMessage: (message: string) => void
): boolean {
  const lowerText = text.toLowerCase();
  
  // Dashboard page commands
  if (currentPage.includes('/dashboard')) {
    if (/show.*schedule|view.*schedule|my schedule/i.test(lowerText)) {
      window.dispatchEvent(new CustomEvent('switchTab', { detail: { tab: 0 } }));
      addSystemMessage(`I've switched to the Schedule tab for you.`);
      return true;
    }
    // ...other dashboard commands
  }
  
  // Delivery methods page commands
  if (currentPage.includes('/notifications/delivery-methods')) {
    if (/add.*method|create.*method|new method/i.test(lowerText)) {
      actionContext.setPendingAction('create-delivery-method');
      addSystemMessage(`I'm opening the dialog to create a new delivery method.`);
      return true;
    }
  }
  
  return false;
}
```
    if (/go to|navigate to|open/i.test(lowerText)) {
      const action = extractAction(lowerText);
      switch (action) {
        case 'create-delivery-method':
          actionContext.setPendingAction('create-delivery-method');
          router.push('/notifications/delivery-methods');
          break;
        case 'create-task':
          actionContext.setPendingAction('create-task');
          router.push('/dashboard');
          break;
        // Other navigation cases
      }
      return true;
    }
    
    return false;
  };
  
  // Component rendering
  return (
    <div className="chat-container">
      {/* Chat UI implementation */}
    </div>
  );
}
```

### 5. Page Components

Page components use the ActionContext to detect and handle pending actions:

#### Delivery Methods Page

```tsx
// src/app/notifications/delivery-methods/page.tsx (simplified)
import { useAction } from '@/context/ActionContext';

export default function DeliveryMethodsPage() {
  const actionContext = useAction();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  // Handle pending actions
  useEffect(() => {
    if (actionContext.pendingAction === 'create-delivery-method') {
      setShowCreateDialog(true);
      actionContext.clearPendingAction();
    }
  }, [actionContext]);
  
  // Component rendering
  return (
    <ProtectedRoute>
      <div className="delivery-methods-container">
        {/* Page content */}
        {showCreateDialog && <CreateMethodDialog onClose={() => setShowCreateDialog(false)} />}
      </div>
    </ProtectedRoute>
  );
}
```

#### Dashboard Page

```tsx
// src/app/dashboard/page.tsx (simplified)
import { useAction } from '@/context/ActionContext';

function DashboardContent({ activeTab }: { activeTab: number }) {
  const actionContext = useAction();
  const [selectedTab, setSelectedTab] = useState(activeTab);
  const [showCreateTaskDialog, setShowCreateTaskDialog] = useState(false);
  
  // Handle pending actions
  useEffect(() => {
    if (actionContext.pendingAction === 'create-task') {
      setSelectedTab(1); // Switch to tasks tab
      setShowCreateTaskDialog(true);
      actionContext.clearPendingAction();
    }
  }, [actionContext]);
  
  // Component rendering
  return (
    <div className="dashboard-container">
      {/* Dashboard content */}
      {showCreateTaskDialog && <CreateTaskDialog onClose={() => setShowCreateTaskDialog(false)} />}
    </div>
  );
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState(0);
  
  return (
    <ProtectedRoute>
      <div className="dashboard-page">
        <DashboardContent activeTab={activeTab} />
      </div>
    </ProtectedRoute>
  );
}
```

## Task-Oriented Interaction Flow

The implementation follows a specific task-oriented interaction flow:

1. **Initial Clean State**: The interface starts in a simple, clean state
2. **User Initiation**: The user initiates an interaction with a specific intent (e.g., "create a delivery method")
3. **Focused Conversation**: The system engages in a focused conversation to collect necessary information
4. **Task Completion**: Once the task is complete, the interface returns to its initial clean state
5. **Session Delineation**: This creates a clear separation between different interaction sessions

## Supported Actions

The system currently supports the following actions:

| Action | Description | Trigger Command Examples |
|--------|-------------|-------------------------|
| `create-delivery-method` | Opens the create delivery method dialog | "Create a new delivery method", "Add a method" |
| `create-task` | Opens the create task dialog in the dashboard | "Create a new task", "Add a task" |
| `open-settings` | Navigates to the settings page | "Open settings", "Go to settings" |

## Benefits of This Approach

1. **State Persistence**: Actions remain active even when navigating between pages
2. **Cleaner URLs**: No need to pollute URLs with action parameters
3. **Centralized Management**: All action handling is managed through a single context
4. **Decoupled Components**: Pages can respond to actions without direct communication
5. **Consistent Experience**: Actions triggered from the chat work the same way across pages

## Future Enhancements

Potential improvements to the system could include:

1. **Action History**: Tracking previously performed actions for reference
2. **Multi-step Actions**: Supporting complex workflows that span multiple pages
3. **User Preferences**: Allowing users to customize which actions are available
4. **Action Permissions**: Implementing role-based access control for actions
5. **Contextual Help**: Providing guidance on available actions based on current page

## Troubleshooting

Common issues and their solutions:

1. **Action Not Triggering**: Ensure the action name matches exactly in both the TaskOrientedChat and page components
2. **Context Undefined Error**: Make sure the component is within the ActionProvider hierarchy
3. **Multiple Actions Firing**: Check that clearPendingAction is called after handling an action
4. **Navigation Issues**: Verify that router.push is being called with the correct path
