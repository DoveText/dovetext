'use client';

import React from 'react';
import Tooltip from '@/components/common/Tooltip';

interface ToolbarButtonProps {
  icon: React.ReactNode;
  isActive?: boolean;
  onClick: () => void;
  disabled?: boolean;
  tooltip?: string;
}

export const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  icon,
  isActive = false,
  onClick,
  disabled = false,
  tooltip
}) => {
  // Create a button element with consistent styling
  const buttonElement = (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        p-2 rounded-md transition-colors
        ${isActive 
          ? 'bg-indigo-100 text-indigo-800' 
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
        ${disabled 
          ? 'opacity-50 cursor-not-allowed' 
          : 'cursor-pointer'}
      `}
      aria-label={tooltip}
    >
      {icon}
    </button>
  );
  
  // If tooltip is provided, use a portal-based tooltip that doesn't affect layout
  if (tooltip) {
    return (
      <div className="relative inline-flex">
        <Tooltip 
          content={tooltip} 
          position="bottom" 
          delay={300}
        >
          {buttonElement}
        </Tooltip>
      </div>
    );
  }
  
  // If no tooltip, just return the button
  return buttonElement;
};

export default ToolbarButton;
