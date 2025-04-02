'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Possible animation states for the chat component
 */
type AnimationState = 'opening' | 'open' | 'closing' | 'closed';

/**
 * A hook that manages animation states for expandable/collapsible UI components.
 * 
 * This hook handles the transition between different animation states:
 * - opening: Component is in the process of expanding/maximizing
 * - open: Component is fully expanded/maximized
 * - closing: Component is in the process of collapsing/minimizing
 * - closed: Component is fully collapsed/minimized
 * 
 * It also tracks whether the animation was initiated by the user and whether
 * the component is currently active.
 * 
 * @param {boolean} initialExpanded - Initial expanded state of the component
 * @returns An object containing animation state and methods to control it
 * 
 * @example
 * // Basic usage
 * const {
 *   isExpanded,
 *   animationState,
 *   expandChat,
 *   minimizeChat,
 *   toggleChat
 * } = useAnimationState();
 * 
 * // In your JSX:
 * return (
 *   <div className={`chat-container ${animationState}`}>
 *     {isExpanded ? (
 *       <FullChatInterface onClose={minimizeChat} />
 *     ) : (
 *       <ChatBubble onClick={expandChat} />
 *     )}
 *   </div>
 * );
 */
export function useAnimationState(initialExpanded = false) {
  // Expanded state controls whether the chat is expanded or minimized
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  
  // Animation state tracks the current animation phase
  const [animationState, setAnimationState] = useState<AnimationState>(
    initialExpanded ? 'open' : 'closed'
  );
  
  // User initiated state tracks whether the user initiated the state change
  const [isUserInitiated, setIsUserInitiated] = useState(false);
  
  // Active state tracks whether the chat is actively being used
  const [isActive, setIsActive] = useState(false);
  
  /**
   * Handle animation transitions when expanded state changes
   */
  useEffect(() => {
    let animationTimer: NodeJS.Timeout;
    
    if (isExpanded) {
      // Transitioning from closed to open
      setAnimationState('opening');
      animationTimer = setTimeout(() => {
        setAnimationState('open');
      }, 300); // Match this with your CSS transition duration
    } else {
      // Transitioning from open to closed
      setAnimationState('closing');
      animationTimer = setTimeout(() => {
        setAnimationState('closed');
      }, 300); // Match this with your CSS transition duration
    }
    
    return () => {
      clearTimeout(animationTimer);
    };
  }, [isExpanded]);
  
  /**
   * Expand the chat with animation
   */
  const expandChat = useCallback((userInitiated = true) => {
    setIsUserInitiated(userInitiated);
    setIsExpanded(true);
    setIsActive(true);
  }, []);
  
  /**
   * Minimize the chat with animation
   */
  const minimizeChat = useCallback((userInitiated = true) => {
    setIsUserInitiated(userInitiated);
    setIsExpanded(false);
  }, []);
  
  /**
   * Toggle the chat state with animation
   */
  const toggleChat = useCallback(() => {
    setIsUserInitiated(true);
    setIsExpanded(prev => !prev);
    setIsActive(true);
  }, []);
  
  return {
    // State
    isExpanded,
    animationState,
    isUserInitiated,
    isActive,
    
    // Setters
    setIsExpanded,
    setAnimationState,
    setIsUserInitiated,
    setIsActive,
    
    // Helper methods
    expandChat,
    minimizeChat,
    toggleChat
  };
}
