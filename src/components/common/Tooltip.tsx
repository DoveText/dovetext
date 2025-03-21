'use client';

import React, { useState, useRef, useEffect } from 'react';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
}

export default function Tooltip({ 
  content, 
  children, 
  position = 'top', 
  delay = 100,
  className = ''
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState({});
  const childRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const showTooltip = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      setIsVisible(true);
      setTimeout(updatePosition, 0);
    }, delay);
  };

  const hideTooltip = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsVisible(false);
  };

  const updatePosition = () => {
    if (!childRef.current || !tooltipRef.current) return;
    
    const childRect = childRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    
    let top = 0;
    let left = 0;
    
    // Calculate position based on specified position prop
    switch (position) {
      case 'top':
        top = childRect.top - tooltipRect.height - 8;
        left = childRect.left + (childRect.width / 2) - (tooltipRect.width / 2);
        break;
      case 'bottom':
        top = childRect.bottom + 8;
        left = childRect.left + (childRect.width / 2) - (tooltipRect.width / 2);
        break;
      case 'left':
        top = childRect.top + (childRect.height / 2) - (tooltipRect.height / 2);
        left = childRect.left - tooltipRect.width - 8;
        break;
      case 'right':
        top = childRect.top + (childRect.height / 2) - (tooltipRect.height / 2);
        left = childRect.right + 8;
        break;
      default:
        // Default to top
        top = childRect.top - tooltipRect.height - 8;
        left = childRect.left + (childRect.width / 2) - (tooltipRect.width / 2);
    }
    
    // Adjust if tooltip would be off screen
    // Top boundary
    if (top < 10) {
      if (position === 'top') {
        // Flip to bottom
        top = childRect.bottom + 8;
      } else {
        // Just keep it in viewport
        top = 10;
      }
    }
    
    // Bottom boundary
    if (top + tooltipRect.height > window.innerHeight - 10) {
      if (position === 'bottom') {
        // Flip to top
        top = childRect.top - tooltipRect.height - 8;
      } else {
        // Just keep it in viewport
        top = window.innerHeight - tooltipRect.height - 10;
      }
    }
    
    // Left boundary
    if (left < 10) {
      left = 10;
    }
    
    // Right boundary
    if (left + tooltipRect.width > window.innerWidth - 10) {
      left = window.innerWidth - tooltipRect.width - 10;
    }
    
    setTooltipStyle({
      top: `${top}px`,
      left: `${left}px`
    });
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Update position when scrolling or resizing
  useEffect(() => {
    const handleUpdate = () => {
      if (isVisible) {
        updatePosition();
      }
    };
    
    window.addEventListener('scroll', handleUpdate, { passive: true });
    window.addEventListener('resize', handleUpdate, { passive: true });
    window.addEventListener('mousemove', handleUpdate, { passive: true });
    
    // Also update position periodically while visible
    let intervalId: NodeJS.Timeout | null = null;
    if (isVisible) {
      intervalId = setInterval(updatePosition, 100);
    }
    
    return () => {
      window.removeEventListener('scroll', handleUpdate);
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('mousemove', handleUpdate);
      if (intervalId) clearInterval(intervalId);
    };
  }, [isVisible]);
  
  // Force update position when content changes
  useEffect(() => {
    if (isVisible) {
      updatePosition();
    }
  }, [content]);

  return (
    <div 
      className={`relative inline-block w-full h-full ${className}`}
      ref={childRef}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {isVisible && (
        <div
          ref={tooltipRef}
          className="fixed z-50 max-w-xs px-3 py-2 text-xs text-white bg-gray-800 rounded shadow-lg whitespace-pre-wrap"
          style={tooltipStyle}
          onMouseEnter={hideTooltip} // Hide tooltip when mouse enters it to prevent flickering
        >
          {content}
        </div>
      )}
    </div>
  );
}
