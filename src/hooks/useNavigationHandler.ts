'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Configuration options for the navigation handler
 */
export interface NavigationHandlerOptions {
  /** Called when the user wants to switch context (e.g., from tasks to schedule) */
  onSwitchContext?: (contextType: 'schedule' | 'tasks' | 'general') => void;
  /** Called when navigation is about to start */
  onNavigationStart?: (action: string) => void;
  /** Called when navigation is complete */
  onNavigationComplete?: () => void;
  /** Whether to automatically navigate without confirmation (use with caution) */
  autoNavigate?: boolean;
}

/**
 * A hook that handles navigation intents from chat messages.
 * 
 * This hook provides functionality to:
 * - Detect navigation intents in user messages
 * - Navigate to appropriate pages based on detected intents
 * - Notify parent components about navigation events
 * - Optionally switch chat context based on navigation
 * 
 * It can be disabled completely by not providing options, making it safe
 * to include in components where navigation might not be desired.
 * 
 * @param options - Configuration options for navigation handling, or undefined to disable
 * 
 * @returns An object containing functions to process navigation intents
 * 
 * @example
 * // Basic usage with navigation enabled
 * const navigationOptions = {
 *   onNavigationStart: (action) => {
 *     console.log(`Starting navigation: ${action}`);
 *   },
 *   onNavigationComplete: () => {
 *     console.log('Navigation complete');
 *   }
 * };
 * 
 * const { processNavigationIntent } = useNavigationHandler(navigationOptions);
 * 
 * // Later in code:
 * const handled = processNavigationIntent(userMessage);
 * if (handled) {
 *   console.log('Message contained navigation intent and was handled');
 * }
 * 
 * // Disable navigation completely
 * const { processNavigationIntent } = useNavigationHandler(undefined);
 */
export function useNavigationHandler(options?: NavigationHandlerOptions) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  
  /**
   * Process a user message to detect and handle navigation intents
   * 
   * @param message - The user message to analyze for navigation intents
   * @returns True if the message contained a navigation intent and was handled, false otherwise
   */
  const processNavigationIntent = useCallback((message: string): boolean => {
    // If options are not provided, navigation is disabled
    if (!options) {
      return false;
    }
    
    // Convert message to lowercase for easier matching
    const lowerMessage = message.toLowerCase();
    
    // Check for navigation intents related to schedule
    if (lowerMessage.includes('go to schedule') || 
        lowerMessage.includes('show me my schedule') || 
        lowerMessage.includes('view schedule') || 
        lowerMessage.includes('open schedule')) {
      
      // Notify that navigation is starting
      if (options.onNavigationStart) {
        options.onNavigationStart('schedule');
      }
      
      // Switch context if handler is provided
      if (options.onSwitchContext) {
        options.onSwitchContext('schedule');
      }
      
      // Navigate to schedule page
      setIsNavigating(true);
      router.push('/schedule');
      return true;
    }
    
    // Check for navigation intents related to tasks
    if (lowerMessage.includes('go to tasks') || 
        lowerMessage.includes('show me my tasks') || 
        lowerMessage.includes('view tasks') || 
        lowerMessage.includes('open tasks') || 
        lowerMessage.includes('task list')) {
      
      // Notify that navigation is starting
      if (options.onNavigationStart) {
        options.onNavigationStart('tasks');
      }
      
      // Switch context if handler is provided
      if (options.onSwitchContext) {
        options.onSwitchContext('tasks');
      }
      
      // Navigate to tasks page
      setIsNavigating(true);
      router.push('/tasks');
      return true;
    }
    
    // Check for navigation intents related to dashboard/home
    if (lowerMessage.includes('go to dashboard') || 
        lowerMessage.includes('go to home') || 
        lowerMessage.includes('show dashboard') || 
        lowerMessage.includes('open dashboard') || 
        lowerMessage.includes('main page')) {
      
      // Notify that navigation is starting
      if (options.onNavigationStart) {
        options.onNavigationStart('dashboard');
      }
      
      // Switch context if handler is provided
      if (options.onSwitchContext) {
        options.onSwitchContext('general');
      }
      
      // Navigate to dashboard page
      setIsNavigating(true);
      router.push('/');
      return true;
    }
    
    // No navigation intent detected
    return false;
  }, [options, router]);
  
  // Handle navigation completion
  useEffect(() => {
    // If we're not currently navigating, do nothing
    if (!isNavigating) {
      return;
    }
    
    // Set a timeout to consider navigation complete
    const navigationTimer = setTimeout(() => {
      setIsNavigating(false);
      
      // Notify that navigation is complete
      if (options?.onNavigationComplete) {
        options.onNavigationComplete();
      }
    }, 1000); // Allow 1 second for navigation to complete
    
    // Clean up timer if component unmounts during navigation
    return () => {
      clearTimeout(navigationTimer);
    };
  }, [isNavigating, options]);
  
  return {
    isNavigating,
    processNavigationIntent
  };
}
