'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

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
