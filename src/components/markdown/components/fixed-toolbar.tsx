'use client';

import React, { useEffect, useState } from 'react';
import { useEditor } from 'novel';

// Import existing components
import { TextButtons } from './text-buttons';
import { LinkSelector } from './link-selector';
import { NodeSelector } from './node-selector';
import { Separator } from './separator';
import { ToolbarButton } from './toolbar-button';
import { AICommandType } from './ai-command-dialog';

interface FixedToolbarProps {
  className?: string;
  onOpenAiDialog?: (type: AICommandType) => void;
  showBubbleMenu?: boolean;
  onToggleBubbleMenu?: () => void;
  saveStatus?: string;
  wordCount?: number | null;
}

export const FixedToolbar = ({ 
  className = '',
  onOpenAiDialog,
  showBubbleMenu = true,
  onToggleBubbleMenu,
  saveStatus = 'Saved',
  wordCount = null
}: FixedToolbarProps) => {
  const { editor } = useEditor();
  const [openNode, setOpenNode] = useState(false);
  const [openLink, setOpenLink] = useState(false);
  
  // State to track if toolbar should be updated
  const [updateCounter, setUpdateCounter] = useState(0);
  
  useEffect(() => {
    if (!editor) return;
    
    // Function to update toolbar state when selection changes
    const updateToolbar = () => {
      setUpdateCounter(prev => prev + 1);
    };
    
    // Listen for selection changes
    editor.on('selectionUpdate', updateToolbar);
    
    // Listen for document changes that might affect toolbar state
    editor.on('update', updateToolbar);
    
    // Listen for focus changes
    editor.on('focus', updateToolbar);
    editor.on('blur', updateToolbar);
    
    return () => {
      // Clean up event listeners
      editor.off('selectionUpdate', updateToolbar);
      editor.off('update', updateToolbar);
      editor.off('focus', updateToolbar);
      editor.off('blur', updateToolbar);
    };
  }, [editor]);
  
  // If editor is not available, don't render anything
  if (!editor) return null;
  
  return (
    <div className="sticky top-0 z-20 w-full bg-white border-b border-gray-200 shadow-sm" key={updateCounter}>
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center space-x-1 flex-wrap flex-grow mr-4">
          {/* Text Formatting Tools */}
          <ToolbarButton 
            icon={<span className="font-bold">B</span>} 
            isActive={editor.isActive('bold')} 
            onClick={() => {
              
              editor.chain().focus().toggleBold().run()
            }}
            tooltip="Bold"
          />
          <ToolbarButton 
            icon={<span className="italic">I</span>} 
            isActive={editor.isActive('italic')} 
            onClick={() => {
                              
              editor.chain().focus().toggleItalic().run()
            }}
            tooltip="Italic"
          />
          <ToolbarButton 
            icon={<span className="underline">U</span>} 
            isActive={editor.isActive('underline')} 
            onClick={() => {
              
              editor.chain().focus().toggleUnderline().run()
            }}
            tooltip="Underline"
          />
          <ToolbarButton 
            icon={<span className="line-through">S</span>} 
            isActive={editor.isActive('strike')} 
            onClick={() => {
              
              editor.chain().focus().toggleStrike().run()
            }}
            tooltip="Strikethrough"
          />
          <ToolbarButton 
            icon={<span className="font-mono">{'<>'}</span>} 
            isActive={editor.isActive('code')} 
            onClick={() => {
              
              editor.chain().focus().toggleCode().run()
            }}
            tooltip="Inline Code"
          />

          <div className="h-4 w-px bg-gray-200 mx-2" />

          {/* Headings */}
          <ToolbarButton 
            icon={<span className="font-bold">H1</span>} 
            isActive={editor.isActive('heading', { level: 1 })} 
            onClick={() => {
              
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }}
            tooltip="Heading 1"
          />
          <ToolbarButton 
            icon={<span className="font-bold">H2</span>} 
            isActive={editor.isActive('heading', { level: 2 })} 
            onClick={() => {
              
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }}
            tooltip="Heading 2"
          />
          <ToolbarButton 
            icon={<span className="font-bold">H3</span>} 
            isActive={editor.isActive('heading', { level: 3 })} 
            onClick={() => {
              
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }}
            tooltip="Heading 3"
          />

          <div className="h-4 w-px bg-gray-200 mx-2" />

          {/* Lists */}
          <ToolbarButton 
            icon={<span>•</span>} 
            isActive={editor.isActive('bulletList')} 
            onClick={() => {
              
              editor.chain().focus().toggleBulletList().run()
            }}
            tooltip="Bullet List"
          />
          <ToolbarButton 
            icon={<span>1.</span>} 
            isActive={editor.isActive('orderedList')} 
            onClick={() => {
              
              editor.chain().focus().toggleOrderedList().run()
            }}
            tooltip="Numbered List"
          />
          <ToolbarButton 
            icon={<span>[ ]</span>} 
            isActive={editor.isActive('taskList')} 
            onClick={() => {
              
              editor.chain().focus().toggleTaskList().run()
            }}
            tooltip="Task List"
          />

          <div className="h-4 w-px bg-gray-200 mx-2" />

          {/* Block formatting */}
          <ToolbarButton 
            icon={<span>"</span>} 
            isActive={editor.isActive('blockquote')} 
            onClick={() => {
              
              editor.chain().focus().toggleBlockquote().run()
            }}
            tooltip="Blockquote"
          />
          <ToolbarButton 
            icon={<span className="font-mono">```</span>} 
            isActive={editor.isActive('codeBlock')} 
            onClick={() => {
              
              editor.chain().focus().toggleCodeBlock().run()
            }}
            tooltip="Code Block"
          />

          {onOpenAiDialog && (
            <>
              <div className="h-4 w-px bg-gray-200 mx-2" />

              {/* AI Tools */}
              <ToolbarButton 
                icon={<span>✨</span>} 
                isActive={false} 
                onClick={() => {
                  
                  onOpenAiDialog('generate');
                }}
                tooltip="Generate Content"
              />
              <ToolbarButton 
                icon={<span>🔄</span>} 
                isActive={false} 
                onClick={() => {
                  
                  onOpenAiDialog('refine');
                }}
                tooltip="Refine Content"
              />
            </>
          )}
        </div>

        <div className="flex items-center space-x-2 flex-shrink-0">
          {/* Bubble Menu Toggle */}
          {onToggleBubbleMenu && (
            <div className="flex items-center">
              <label className="inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={showBubbleMenu} 
                  onChange={() => onToggleBubbleMenu && onToggleBubbleMenu()} 
                  className="sr-only peer"
                />
                <div className="relative w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                <span className="ms-2 text-sm font-medium text-gray-600">Bubble Menu</span>
              </label>
            </div>
          )}

          {/* Status indicators */}
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-stone-100 px-2 py-1 text-sm text-stone-600">
              {saveStatus}
            </div>
            {wordCount !== null && (
              <div className="rounded-lg bg-stone-100 px-2 py-1 text-sm text-stone-600">
                {wordCount} words
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
