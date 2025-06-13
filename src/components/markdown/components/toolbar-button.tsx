'use client';

import React from 'react';

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
  return (
    <div className="relative group">
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
      
      {tooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
          {tooltip}
        </div>
      )}
    </div>
  );
};

export default ToolbarButton;
