'use client';

import React from 'react';
import { Editor } from '@tiptap/react';
import { Tooltip as ReactTippyTooltip } from 'react-tippy';
import 'react-tippy/dist/tippy.css';

// Create a wrapper component for Tooltip to fix TypeScript issues
const Tooltip = ({ children, ...props }: { children: React.ReactNode } & any) => {
  return <ReactTippyTooltip {...props}>{children}</ReactTippyTooltip>;
};

interface AIMenuProps {
  editor: Editor;
  onGenerateContent: () => void;
  onRefineContent: () => void;
  onCreateSchema: () => void;
}

// Helper interface for menu items
interface MenuItemProps {
  icon: React.ReactNode;
  tooltip: string;
  onClick: (e: React.MouseEvent) => void;
}

const AIMenu = ({ onGenerateContent, onRefineContent, onCreateSchema }: AIMenuProps) => {
  // Helper function to create menu items with tooltips
  const createMenuItem = ({ icon, tooltip, onClick }: MenuItemProps) => {
    return (
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
        <button
          className="inline-flex h-8 w-8 items-center justify-center rounded-md p-1 text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-500 flex-shrink-0"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClick(e);
          }}
          aria-label={tooltip}
        >
          {icon}
          <span className="sr-only">{tooltip}</span>
        </button>
      </Tooltip>
    );
  };
  
  return (
    <div className="flex flex-nowrap min-w-fit whitespace-nowrap pt-1 pl-1">
      {createMenuItem({
        icon: '✨',
        tooltip: 'Generate Content',
        onClick: onGenerateContent
      })}
      
      {createMenuItem({
        icon: '✏️',
        tooltip: 'Refine Content',
        onClick: onRefineContent
      })}
      
      {createMenuItem({
        icon: '📋',
        tooltip: 'Create Outline',
        onClick: onCreateSchema
      })}
    </div>
  );
};

export default AIMenu;
