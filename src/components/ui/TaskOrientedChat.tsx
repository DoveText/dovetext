'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpCircleIcon } from '@heroicons/react/24/outline';
import { useAction, ActionType } from '@/context/ActionContext';

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
  const router = useRouter();
  const actionContext = useAction();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{type: 'user' | 'system', content: string}[]>([]);
  const [currentTask, setCurrentTask] = useState<{complete: boolean, steps: number, currentStep: number} | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
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

  const handleBubbleClick = () => {
    setIsExpanded(true);
  };

  // Handle page-specific commands based on current page
  const handlePageSpecificCommand = (text: string) => {
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
  };

  // Helper function to detect navigation commands
  const detectNavigationCommand = (text: string) => {
    const lowerText = text.toLowerCase();
    
    // Navigation command patterns
    const navigationPatterns = [
      { pattern: /create.*delivery method|add.*delivery method|new delivery method/i, action: 'create-delivery-method' },
      { pattern: /go to.*delivery|show.*delivery|open.*delivery|view.*delivery/i, action: 'view-delivery-methods' },
      { pattern: /create.*task|add.*task|new task/i, action: 'create-task' },
      { pattern: /create.*schedule|add.*schedule|new schedule/i, action: 'create-schedule' },
      { pattern: /go to.*dashboard|show.*dashboard|open.*dashboard/i, action: 'dashboard' },
      { pattern: /go to.*settings|show.*settings|open.*settings/i, action: 'settings' },
      { pattern: /go to.*profile|show.*profile|open.*profile/i, action: 'profile' },
    ];
    
    // Check if message matches any navigation pattern
    for (const { pattern, action } of navigationPatterns) {
      if (pattern.test(lowerText)) {
        return action;
      }
    }
    
    return null;
  };
  
  // Function to handle navigation actions
  const handleNavigation = (action: string) => {
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
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    // Set active state on first message
    if (!isActive) {
      setIsActive(true);
    }

    // Add user message to chat
    setChatHistory(prev => [...prev, { type: 'user', content: message }]);
    
    // Check if this is a navigation command
    const navigationAction = detectNavigationCommand(message);
    if (navigationAction) {
      handleNavigation(navigationAction);
      setMessage('');
      return;
    }
    
    // If we're on a specific page, handle page-specific commands
    const pageSpecificCommand = handlePageSpecificCommand(message);
    if (pageSpecificCommand) {
      setMessage('');
      return;
    }

    // Determine if this is a new task or continuing
    const isNewTask = !currentTask;
    
    // Simulate AI response and task progression
    setTimeout(() => {
      let response = '';
      
      if (isNewTask) {
        // Initialize a new task based on context
        if (contextType === 'schedule') {
          response = `I'll help you schedule "${message}". What date would you like to schedule this for?`;
          setCurrentTask({ complete: false, steps: 3, currentStep: 1 });
        } else if (contextType === 'tasks') {
          response = `I'll add "${message}" to your tasks. Would you like to set a priority level (high, medium, low)?`;
          setCurrentTask({ complete: false, steps: 2, currentStep: 1 });
        } else {
          // General context
          response = `I'll help you with "${message}". Could you provide more details about what you'd like to do?`;
          setCurrentTask({ complete: false, steps: 2, currentStep: 1 });
        }
      } else if (currentTask) {
        // Continue existing task based on context
        if (contextType === 'schedule') {
          if (currentTask.currentStep === 1) {
            response = `Got it, ${message}. What time should this be scheduled for?`;
            setCurrentTask({ ...currentTask, currentStep: 2 });
          } else if (currentTask.currentStep === 2) {
            response = `Perfect! I've scheduled your event for ${message}. Is there anything else you'd like to add, such as participants or notes?`;
            setCurrentTask({ ...currentTask, currentStep: 3 });
          } else {
            response = `Great! I've updated your schedule with all the details. Your event has been created successfully.`;
            setCurrentTask({ ...currentTask, complete: true });
          }
        } else if (contextType === 'tasks') {
          if (currentTask.currentStep === 1) {
            response = `I've set the priority to ${message}. When is this task due?`;
            setCurrentTask({ ...currentTask, currentStep: 2 });
          } else {
            response = `Perfect! I've added your task with priority ${message} and due date. The task has been created successfully.`;
            setCurrentTask({ ...currentTask, complete: true });
          }
        } else {
          // General context
          if (currentTask.currentStep === 1) {
            response = `Thanks for the details. I'll process that for you right away.`;
            setCurrentTask({ ...currentTask, complete: true });
          }
        }
      }
      
      setChatHistory(prev => [...prev, { type: 'system', content: response }]);
    }, 800);

    setMessage('');
  };

  // Determine classes based on state
  const containerClasses = `fixed ${isExpanded ? 'bottom-4 right-4 w-80 sm:w-96' : 'bottom-4 right-4 w-12 h-12'} 
    transition-all duration-300 ease-in-out z-50 ${className}`;
  
  const chatClasses = `bg-white rounded-2xl shadow-lg overflow-hidden 
    ${isExpanded ? 'border border-gray-200 h-96' : 'h-12 w-12'} 
    transition-all duration-300 ease-in-out`;

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

  // If not expanded, show just the chat bubble
  if (!isExpanded) {
    return (
      <div className={containerClasses}>
        <button 
          onClick={handleBubbleClick}
          className="bg-blue-500 hover:bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg"
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
    <div className={containerClasses}>
      <div className={chatClasses}>
        {/* Chat Header */}
        <div className="bg-blue-500 text-white px-4 py-3 flex justify-between items-center">
          <h3 className="font-medium text-sm">
            {currentTask 
              ? `${getContextTitle()} Assistant (${currentTask.currentStep}/${currentTask.steps})` 
              : `${getContextTitle()} Assistant`}
          </h3>
          <button 
            onClick={() => {
              if (chatHistory.length === 0 || currentTask?.complete) {
                setIsExpanded(false);
              } else {
                // Show confirmation if in middle of conversation
                if (confirm('Are you sure you want to close this conversation?')) {
                  setChatHistory([]);
                  setCurrentTask(null);
                  setIsActive(false);
                  setIsExpanded(false);
                }
              }
            }}
            className="text-white hover:text-gray-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        {/* Chat Messages */}
        <div 
          ref={chatContainerRef}
          className={`p-4 overflow-y-auto ${currentTask?.complete ? 'bg-green-50' : 'bg-gray-50'}`}
          style={{ height: 'calc(100% - 110px)' }}
        >
          {chatHistory.length === 0 ? (
            <div className="text-center text-gray-500 mt-16">
              <p>How can I help you today?</p>
              <p className="text-sm mt-2">For example: {getContextExample()}</p>
              <p className="text-sm mt-2 text-blue-500">You can also try: "Create a delivery method" or "Go to settings"</p>
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
        <form onSubmit={handleSubmit} className="flex items-center p-3 border-t bg-white">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={currentTask?.complete 
              ? 'Task completed!' 
              : currentTask 
                ? 'Continue your conversation...' 
                : `Ask me anything...`}
            className="flex-1 p-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={currentTask?.complete}
          />
          <button
            type="submit"
            disabled={currentTask?.complete}
            className={`p-2 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${currentTask?.complete 
              ? 'bg-gray-300 text-gray-500' 
              : 'bg-blue-500 text-white hover:bg-blue-600'}`}
          >
            <ArrowUpCircleIcon className="h-6 w-6" />
          </button>
        </form>
      </div>
    </div>
  );
}
