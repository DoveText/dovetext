'use client';

import React, { MouseEvent } from 'react';
import { Editor } from '@tiptap/react';
import { Tooltip as ReactTippyTooltip } from 'react-tippy';
import 'react-tippy/dist/tippy.css';
import { isHeading, isParagraph, isParagraphEmpty, selectionContainsHeading, hasSelection } from '../utils/editor-state';

// Create a wrapper component for Tooltip to fix TypeScript issues
const Tooltip = ({ children, ...props }: { children: React.ReactNode } & any) => {
  return <ReactTippyTooltip {...props}>{children}</ReactTippyTooltip>;
};

interface AIMenuProps {
  editor: Editor;
  onGenerateContent: () => void;
  onRefineContent: () => void;
  onSummarizeContent: () => void;
}

// Helper interface for menu items
interface MenuItemProps {
  icon: React.ReactNode;
  tooltip: string;
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
}

const AIMenu = ({ editor, onGenerateContent, onRefineContent, onSummarizeContent }: AIMenuProps) => {
  // Helper function to create menu items with tooltips
  const createMenuItem = ({ icon, tooltip, onClick, disabled = false }: MenuItemProps) => {
    return (
      <Tooltip
        title={disabled ? `${tooltip} (Not available here)` : tooltip}
        position="bottom"
        animation="fade"
        arrow={true}
        delay={100}
        distance={10}
        theme="dark"
        hideOnClick={false}
      >
        <button
          className={`inline-flex h-8 w-8 items-center justify-center rounded-md p-1 text-sm font-medium ${disabled 
            ? 'text-stone-400 cursor-not-allowed bg-stone-50' 
            : 'text-stone-600 hover:bg-stone-100 hover:text-stone-500'} flex-shrink-0`}
          onClick={(e) => {
            if (disabled) {
              return;
            }
            e.preventDefault();
            e.stopPropagation();
            onClick(e);
          }}
          aria-label={tooltip}
          disabled={disabled}
          data-status={disabled ? 'disabled' : 'enabled'}
        >
          {icon}
          <span className="sr-only">{tooltip}</span>
        </button>
      </Tooltip>
    );
  };

  if (!editor) {
    return null;
  }

  const hasValidSelection = hasSelection(editor);
  const inHeading = selectionContainsHeading(editor);

  return (
    <div className="flex flex-nowrap min-w-fit whitespace-nowrap pt-1 pl-1">
      {!inHeading && createMenuItem({
        icon: '⚡',
        tooltip: 'Generate Content',
        onClick: onGenerateContent,
        disabled: !isParagraph(editor) || isParagraphEmpty(editor),
      })}

      {!inHeading && createMenuItem({
        icon: '✨',
        tooltip: 'Refine Content',
        onClick: onRefineContent,
        disabled: !hasValidSelection,
      })}

      {inHeading && createMenuItem({
        icon: '⭐',
        tooltip: 'Summarize Content',
        onClick: onSummarizeContent,
        disabled: !hasValidSelection,
      })}
    </div>
  );
};

export default AIMenu;
