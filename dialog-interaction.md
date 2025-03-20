# Dialog Interaction System Documentation

## Overview

This document outlines the implementation of the global action context system that enables the TaskOrientedChat component to control navigation and trigger UI actions across different pages in the Dove Text application.

## Architecture

### Core Components

1. **ActionContext**: A global context that manages actions across the application
2. **TaskOrientedChat**: A chat interface component that sets actions in the context
3. **ProtectedRoute**: A wrapper component that provides authentication protection and includes the chat component

### Flow Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  User Request   │────▶│ TaskOrientedChat│────▶│  ActionContext  │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
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
import { createContext, useContext, useState, ReactNode } from 'react';

type ActionType = 'none' | 'create-delivery-method' | 'create-task' | 'open-settings';

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

  const setPendingAction = (action: ActionType, payload?: any) => {
    setPendingActionState(action);
    setActionPayload(payload || null);
  };

  const clearPendingAction = () => {
    setPendingActionState('none');
    setActionPayload(null);
  };

  return (
    <ActionContext.Provider value={{ 
      pendingAction, 
      actionPayload, 
      setPendingAction, 
      clearPendingAction 
    }}>
      {children}
    </ActionContext.Provider>
  );
}

export function useAction() {
  const context = useContext(ActionContext);
  return context || {
    pendingAction: 'none',
    actionPayload: null,
    setPendingAction: () => {},
    clearPendingAction: () => {}
  };
}
```

### 2. Root Layout

The ActionProvider is included in the root layout to ensure it's available throughout the application:

```tsx
// src/app/layout.tsx
import { AuthProvider } from '@/context/AuthContext';
import { ActionProvider } from '@/context/ActionContext';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ActionProvider>
            <Navigation />
            <main>
              {children}
            </main>
            <Footer />
          </ActionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
```

### 3. ProtectedRoute Component

The ProtectedRoute component wraps authenticated pages and includes the TaskOrientedChat component:

```tsx
// src/components/auth/ProtectedRoute.tsx
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import TaskOrientedChat from '@/components/ui/TaskOrientedChat';

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

  return (
    <>
      {children}
      <TaskOrientedChat contextType="general" />
    </>  
  );
}
```

### 4. TaskOrientedChat Component

The TaskOrientedChat component uses the ActionContext to set pending actions based on user input:

```tsx
// src/components/ui/TaskOrientedChat.tsx (simplified)
import { useAction } from '@/context/ActionContext';

function TaskOrientedChat({ contextType }: { contextType: string }) {
  const router = useRouter();
  const actionContext = useAction();
  
  // Handle user input
  const handleUserInput = (text: string) => {
    const lowerText = text.toLowerCase();
    
    // Check for delivery method commands
    if (currentPage.includes('/notifications/delivery-methods')) {
      if (/add.*method|create.*method|new method/i.test(lowerText)) {
        actionContext.setPendingAction('create-delivery-method');
        // Update chat history
        return true;
      }
    }
    
    // Check for dashboard commands
    if (currentPage.includes('/dashboard')) {
      if (/create.*task|add.*task|new task/i.test(lowerText)) {
        actionContext.setPendingAction('create-task');
        // Update chat history
        return true;
      }
    }
    
    // Handle navigation commands
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
