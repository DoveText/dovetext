'use client';

// Navigation intent detection
export function detectNavigationIntent(text: string): string | null {
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
    { pattern: /go to.*settings|show.*settings|open.*settings|settings/i, action: 'user-settings' },
    { pattern: /go to.*profile|show.*profile|open.*profile|profile/i, action: 'user-profile' },
  ];
  
  // Check if message matches any navigation pattern
  for (const { pattern, action } of navigationPatterns) {
    if (pattern.test(lowerText)) {
      return action;
    }
  }
  
  return null;
}

// Context-specific title based on current page or context type
export function getContextTitle(contextType: string, currentPage: string): string {
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
  } else if (currentPage.includes('/user/profile')) {
    return 'Profile';
  } else if (currentPage.includes('/user/settings')) {
    return 'Settings';
  }
  
  return 'Assistant';
}

// Context-specific example queries
export function getContextExample(contextType: string, currentPage: string): string {
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
  } else if (currentPage.includes('/user/profile')) {
    return '"Update my profile information"';
  } else if (currentPage.includes('/user/settings')) {
    return '"Change my notification preferences"';
  }
  
  return '"Help me navigate to..."';
}

// Handle page-specific commands based on current page
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
      // Switch to schedule tab
      window.dispatchEvent(new CustomEvent('switchTab', { detail: { tab: 0 } }));
      addSystemMessage(`I've switched to the Schedule tab for you.`);
      return true;
    } else if (/show.*tasks|view.*tasks|my tasks/i.test(lowerText)) {
      // Switch to tasks tab
      window.dispatchEvent(new CustomEvent('switchTab', { detail: { tab: 1 } }));
      addSystemMessage(`I've switched to the Tasks tab for you.`);
      return true;
    }
  }
  
  // Delivery methods page commands
  if (currentPage.includes('/notifications/delivery-methods')) {
    if (/add.*method|create.*method|new method/i.test(lowerText)) {
      // Use the action context instead of events
      actionContext.setPendingAction('create-delivery-method');
      addSystemMessage(`I'm opening the dialog to create a new delivery method.`);
      return true;
    }
  }
  
  return false;
}
