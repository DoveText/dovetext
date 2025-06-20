'use client';

import React from 'react';
import { Tooltip as ReactTippyTooltip } from 'react-tippy';
import 'react-tippy/dist/tippy.css';

// Create a wrapper component for Tooltip to fix TypeScript issues
const Tooltip = ({ children, ...props }: { children: React.ReactNode } & any) => {
  return <ReactTippyTooltip {...props}>{children}</ReactTippyTooltip>;
};

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
        p-2 rounded-md transition-colors relative
        ${isActive 
          ? 'bg-indigo-100 text-indigo-800' 
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
        ${disabled 
          ? 'opacity-50 cursor-not-allowed bg-gray-50 border border-gray-200' 
          : 'cursor-pointer'}
      `}
      aria-label={tooltip}
      data-status={disabled ? 'disabled' : 'enabled'}
    >
      {icon}
    </button>
  );
  
  // If tooltip is provided, use Tippy.js tooltip for consistency with other tooltips
  if (tooltip) {
    return (
      <div className="relative inline-flex">
        <Tooltip
          title={tooltip}
          position="bottom"
          animation="fade"
          arrow={true}
          delay={100}
          distance={10}
          theme="dark"
          hideOnClick={false}
        >
          {buttonElement}
          <span className="sr-only">{tooltip}</span>
        </Tooltip>
      </div>
    );
  }
  
  // If no tooltip, just return the button
  return buttonElement;
};

export default ToolbarButton;
