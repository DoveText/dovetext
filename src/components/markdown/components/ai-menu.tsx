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
    console.log(`AI Menu Button: ${tooltip} - ${disabled ? 'Disabled' : 'Enabled'}`);
    
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
              console.log(`Clicked disabled button: ${tooltip}`);
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
  
  // Using shared editor state utility functions from utils/editor-state.ts

  // If editor is null, disable all buttons
  if (!editor) {
    return (
      <div className="flex flex-nowrap min-w-fit whitespace-nowrap pt-1 pl-1">
        {createMenuItem({
          icon: '⚡',
          tooltip: 'Generate Content',
          onClick: onGenerateContent,
          disabled: true
        })}
        
        {createMenuItem({
          icon: '✨',
          tooltip: 'Refine Content',
          onClick: onRefineContent,
          disabled: true
        })}
        
        {createMenuItem({
          icon: '⭐',
          tooltip: 'Summarize Content',
          onClick: onSummarizeContent,
          disabled: true
        })}
      </div>
    );
  }
  
  // Get current node type for logging
  const currentNodeType = editor.isActive('heading') 
    ? `heading-${editor.isActive('heading', { level: 1 }) ? '1' : 
        editor.isActive('heading', { level: 2 }) ? '2' : 
        editor.isActive('heading', { level: 3 }) ? '3' : 'other'}`
    : editor.isActive('paragraph') 
      ? 'paragraph' 
      : 'other';
  
  // Get selection info for logging
  const { from, to } = editor.state.selection;
  const hasSelection = from !== to;
  const selectionSize = editor.state.selection.content().size;
  
  // Log current editor state
  console.log('------- AI Menu Status -------');
  console.log(`Current node type: ${currentNodeType}`);
  console.log(`Has selection: ${hasSelection}, Selection size: ${selectionSize}`);
  console.log(`Is paragraph: ${isParagraph(editor)}, Is empty: ${isParagraphEmpty(editor)}`);
  console.log(`Is heading: ${isHeading(editor)}`);
  console.log(`Selection contains heading: ${selectionContainsHeading(editor)}`);
  
  // Generate: Enabled only on paragraph lines, disabled on title lines
  const generateDisabled = isHeading(editor);
  
  // Refine: Enabled on paragraphs (not empty) or when text is selected across paragraphs (not titles)
  const refineDisabled = (
    (isParagraph(editor) && isParagraphEmpty(editor)) || // Disabled on empty paragraphs
    (!isParagraph(editor) && !editor.state.selection.content().size) || // Disabled on non-paragraphs with no selection
    selectionContainsHeading(editor) // Disabled if selection contains headings
  );
  
  // Summarize: Enabled only on title lines
  const summarizeDisabled = !isHeading(editor);
  
  console.log(`Generate button: ${generateDisabled ? 'Disabled' : 'Enabled'}`);
  console.log(`Refine button: ${refineDisabled ? 'Disabled' : 'Enabled'}`);
  console.log(`Summarize button: ${summarizeDisabled ? 'Disabled' : 'Enabled'}`);
  console.log('-----------------------------');
  
  return (
    <div className="flex flex-nowrap min-w-fit whitespace-nowrap pt-1 pl-1">
      {createMenuItem({
        icon: '⚡',
        tooltip: 'Generate Content',
        onClick: onGenerateContent,
        disabled: generateDisabled
      })}
      
      {createMenuItem({
        icon: '✨',
        tooltip: 'Refine Content',
        onClick: onRefineContent,
        disabled: refineDisabled
      })}
      
      {createMenuItem({
        icon: '⭐',
        tooltip: 'Summarize Content',
        onClick: onSummarizeContent,
        disabled: summarizeDisabled
      })}
    </div>
  );
};

export default AIMenu;
