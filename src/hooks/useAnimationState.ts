'use client';

import { useState, useEffect, useCallback } from 'react';

type AnimationState = 'opening' | 'open' | 'closing' | 'closed';

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
  
  // Handle animation transitions when expanded state changes
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
  
  // Function to expand the chat
  const expandChat = useCallback((userInitiated = true) => {
    setIsUserInitiated(userInitiated);
    setIsExpanded(true);
    setIsActive(true);
  }, []);
  
  // Function to minimize the chat
  const minimizeChat = useCallback((userInitiated = true) => {
    setIsUserInitiated(userInitiated);
    setIsExpanded(false);
  }, []);
  
  // Function to toggle the chat state
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
