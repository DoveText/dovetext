import React, { useEffect, useRef, useState } from 'react';
import { EditorInstance } from 'novel';
import { ToolbarButton } from './toolbar-button';
import { isHeading, isParagraph, isParagraphEmpty, selectionContainsHeading } from '../utils/editor-state';

interface FixedToolbarProps {
  editor: EditorInstance | null;
  onAICommand: (type: 'generate' | 'refine' | 'summarize-title') => void;
  saveStatus: string;
  wordCount: number | null;
  showBubbleMenu: boolean;
  onToggleBubbleMenu: () => void;
}

export const FixedToolbar: React.FC<FixedToolbarProps> = ({
  editor,
  onAICommand,
  saveStatus,
  wordCount,
  showBubbleMenu,
  onToggleBubbleMenu
}) => {
  // Refs and state for sticky toolbar behavior
  const toolbarRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<HTMLDivElement>(null);
  const editorObserverRef = useRef<HTMLDivElement>(null);
  const [isSticky, setIsSticky] = useState(false);
  const [isEditorVisible, setIsEditorVisible] = useState(true);
  const [toolbarHeight, setToolbarHeight] = useState(0);
  
  // Set up intersection observers to detect when toolbar should become sticky
  // and when editor is visible
  useEffect(() => {
    if (!toolbarRef.current || !observerRef.current) return;
    
    // Get initial measurements
    const toolbar = toolbarRef.current;
    setToolbarHeight(toolbar.offsetHeight);
    
    // Use a single state update function to prevent race conditions
    const updateStickyState = (isTopInView: boolean, isEditorInView: boolean) => {
      // Only show sticky toolbar when:
      // 1. Top sentinel is out of view (scrolled past the original toolbar position)
      // 2. AND editor is at least partially visible
      // 3. AND we're not already in the correct state (to prevent unnecessary renders)
      
      const shouldBeSticky = !isTopInView && isEditorInView;
      
      if (shouldBeSticky !== isSticky) {
        // Use RAF to ensure smooth transitions and prevent flashing
        requestAnimationFrame(() => {
          setIsSticky(shouldBeSticky);
        });
      }
    };
    
    // Track current visibility states
    let isTopVisible = true;
    let isEditorVisible = true;
    
    // Create intersection observer for the top sentinel element
    const topObserver = new IntersectionObserver(
      ([entry]) => {
        isTopVisible = entry.isIntersecting;
        updateStickyState(isTopVisible, isEditorVisible);
      },
      { 
        threshold: 0,
        rootMargin: '-1px 0px 0px 0px' // Trigger 1px before the element leaves the viewport
      }
    );
    
    // Create intersection observer for the editor container
    const editorObserver = new IntersectionObserver(
      ([entry]) => {
        isEditorVisible = entry.isIntersecting;
        updateStickyState(isTopVisible, isEditorVisible);
      },
      {
        threshold: 0, // Even a small part of the editor being visible counts
        rootMargin: '0px' 
      }
    );
    
    // Observe the sentinel elements
    topObserver.observe(observerRef.current);
    
    // Find the editor container to observe
    const editorContainer = document.getElementById('markdown-editor-container');
    if (editorContainer) {
      editorObserver.observe(editorContainer);
    }
    
    // Handle window resize to recalculate heights
    const handleResize = () => {
      if (toolbarRef.current) {
        setToolbarHeight(toolbarRef.current.offsetHeight);
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      topObserver.disconnect();
      editorObserver.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [isSticky]);
  
  // Using shared editor state utility functions from utils/editor-state.ts
  
  // Force component to update on editor state changes
  const [updateCounter, setUpdateCounter] = React.useState(0);
  
  // Add effect to listen for editor state changes
  React.useEffect(() => {
    if (!editor) return;
    
    const handleUpdate = () => {
      // Increment counter to force re-render
      setUpdateCounter(prev => prev + 1);
    };
    
    // Listen for both selection and transaction updates
    editor.on('selectionUpdate', handleUpdate);
    editor.on('transaction', handleUpdate);
    
    return () => {
      editor.off('selectionUpdate', handleUpdate);
      editor.off('transaction', handleUpdate);
    };
  }, [editor]);
  
  // Determine button states based on editor context
  const generateDisabled = !editor || isHeading(editor);
  
  const refineDisabled = !editor || (
    (isParagraph(editor) && isParagraphEmpty(editor)) || // Disabled on empty paragraphs
    (!isParagraph(editor) && !editor.state.selection.content().size) || // Disabled on non-paragraphs with no selection
    selectionContainsHeading(editor) // Disabled if selection contains headings
  );
  
  const summarizeDisabled = !editor || !isHeading(editor);
  
  // Log current state for debugging
  if (editor) {
    const currentNodeType = editor.isActive('heading') 
      ? `heading-${editor.isActive('heading', { level: 1 }) ? '1' : 
          editor.isActive('heading', { level: 2 }) ? '2' : 
          editor.isActive('heading', { level: 3 }) ? '3' : 'other'}`
      : editor.isActive('paragraph') 
        ? 'paragraph' 
        : 'other';
    // console.log('Current node type:', currentNodeType, 'Update counter:', updateCounter);
  }
  return (
    <>
      {/* Observer element to detect when toolbar should become sticky */}
      <div ref={observerRef} className="absolute top-0 left-0 h-1 w-full opacity-0 pointer-events-none" />
      
      {/* Placeholder div to prevent content jump when toolbar becomes fixed */}
      {isSticky && <div style={{ height: toolbarHeight }} />}
      
      {/* Actual toolbar that can be fixed or sticky */}
      <div 
        ref={toolbarRef}
        className={`${isSticky ? 'fixed' : 'relative'} top-0 z-50 bg-white border-b border-gray-200 shadow-sm will-change-transform editor-toolbar`}
        style={{ 
          transition: 'transform 150ms ease-in-out',
          width: isSticky ? 'var(--editor-width, 100%)' : '100%',
          left: isSticky ? 'var(--editor-left, 0)' : '0',
          maxWidth: isSticky ? 'var(--editor-width, 100%)' : '100%'
        }}>
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center space-x-1 flex-wrap flex-grow mr-4">
          {/* AI Tools */}
          <ToolbarButton 
            icon={<span>⚡</span>} 
            isActive={false} 
            onClick={() => {
              if (!generateDisabled) onAICommand('generate');
            }}
            disabled={generateDisabled}
            tooltip={`Generate Content ${generateDisabled ? '(Not available here)' : ''}`}
          />
          <ToolbarButton 
            icon={<span>✨</span>} 
            isActive={false} 
            onClick={() => {
              if (!refineDisabled) onAICommand('refine');
            }}
            disabled={refineDisabled}
            tooltip={`Refine Content ${refineDisabled ? '(Not available here)' : ''}`}
          />
          <ToolbarButton 
            icon={<span>⭐</span>} 
            isActive={false} 
            onClick={() => {
              if (!summarizeDisabled) onAICommand('summarize-title');
            }}
            disabled={summarizeDisabled}
            tooltip={`Summarize Title ${summarizeDisabled ? '(Not available here)' : ''}`}
          />

          <div className="h-4 w-px bg-gray-200 mx-2" />

          {/* Text Formatting Tools */}
          <ToolbarButton 
            icon={<span className="font-bold">B</span>} 
            isActive={editor?.isActive('bold')} 
            onClick={() => editor?.chain().focus().toggleBold().run()}
            disabled={!editor}
            tooltip="Bold"
          />
          <ToolbarButton 
            icon={<span className="italic">I</span>} 
            isActive={editor?.isActive('italic')} 
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            disabled={!editor}
            tooltip="Italic"
          />
          <ToolbarButton 
            icon={<span className="underline">U</span>} 
            isActive={editor?.isActive('underline')} 
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
            disabled={!editor}
            tooltip="Underline"
          />
          <ToolbarButton 
            icon={<span className="line-through">S</span>} 
            isActive={editor?.isActive('strike')} 
            onClick={() => editor?.chain().focus().toggleStrike().run()}
            disabled={!editor}
            tooltip="Strikethrough"
          />
          <ToolbarButton 
            icon={<span className="font-mono">{'<>'}</span>} 
            isActive={editor?.isActive('code')} 
            onClick={() => editor?.chain().focus().toggleCode().run()}
            disabled={!editor}
            tooltip="Inline Code"
          />

          <div className="h-4 w-px bg-gray-200 mx-2" />

          {/* Headings */}
          <ToolbarButton 
            icon={<span className="font-bold">H1</span>} 
            isActive={editor?.isActive('heading', { level: 1 })} 
            onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
            disabled={!editor}
            tooltip="Heading 1"
          />
          <ToolbarButton 
            icon={<span className="font-bold">H2</span>} 
            isActive={editor?.isActive('heading', { level: 2 })} 
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
            disabled={!editor}
            tooltip="Heading 2"
          />
          <ToolbarButton 
            icon={<span className="font-bold">H3</span>} 
            isActive={editor?.isActive('heading', { level: 3 })} 
            onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
            disabled={!editor}
            tooltip="Heading 3"
          />

          <div className="h-4 w-px bg-gray-200 mx-2" />

          {/* Lists */}
          <ToolbarButton 
            icon={<span>•</span>} 
            isActive={editor?.isActive('bulletList')} 
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            disabled={!editor}
            tooltip="Bullet List"
          />
          <ToolbarButton 
            icon={<span>1.</span>} 
            isActive={editor?.isActive('orderedList')} 
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            disabled={!editor}
            tooltip="Numbered List"
          />
          <ToolbarButton 
            icon={<span>[ ]</span>} 
            isActive={editor?.isActive('taskList')} 
            onClick={() => editor?.chain().focus().toggleTaskList().run()}
            disabled={!editor}
            tooltip="Task List"
          />

          <div className="h-4 w-px bg-gray-200 mx-2" />

          {/* Block formatting */}
          <ToolbarButton 
            icon={<span>&#34;</span>}
            isActive={editor?.isActive('blockquote')} 
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
            disabled={!editor}
            tooltip="Blockquote"
          />
          <ToolbarButton 
            icon={<span className="font-mono">```</span>} 
            isActive={editor?.isActive('codeBlock')} 
            onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
            disabled={!editor}
            tooltip="Code Block"
          />
        </div>

        {/* Right side of toolbar with status */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          {/* Bubble Menu Toggle */}
          <div className="flex items-center">
            <label className="inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={showBubbleMenu} 
                onChange={onToggleBubbleMenu} 
                className="sr-only peer"
              />
              <div className="relative w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              <span className="ms-2 text-sm font-medium text-gray-600">Bubble Menu</span>
            </label>
          </div>

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
    </>
  );
};
