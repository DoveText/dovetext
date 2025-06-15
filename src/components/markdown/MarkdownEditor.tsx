'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  EditorRoot,
  EditorContent,
  EditorCommand,
  EditorCommandItem,
  EditorCommandEmpty,
  EditorCommandList,
  EditorBubble,
  ImageResizer,
  EditorInstance
} from 'novel';
import { defaultExtensions } from './extensions';
import { slashCommand, suggestionItems } from './components/slash-command';
import { JSONContent } from '@tiptap/react';
import { useDebouncedCallback } from 'use-debounce';

// Import markdown conversion libraries
import { marked } from 'marked';
import TurndownService from 'turndown';
import { generateJSON } from '@tiptap/html';

// Import our custom components and hooks
import { useSelectionManager } from './hooks/useSelectionManager';
import { useAICommandManager } from './hooks/useAICommandManager';
import { countWords, getFormattedContent } from './utils/content-formatter';
import { getEditorConfig } from './components/editor-config';
import { EditorUI, EditorStatusBar } from './components/editor-ui';
import AICommandDialog from './components/ai-command-dialog';
import { TextButtons } from './components/text-buttons';
import { LinkSelector } from './components/link-selector';
import { NodeSelector } from './components/node-selector';
import { Separator } from './components/separator';
import AIMenu from './components/ai-menu';
import { ToolbarButton } from './components/toolbar-button';

interface EditorProps {
  initialContent?: string | JSONContent;
  onChange?: (content: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  format?: 'markdown' | 'html' | 'json';
}

export function MarkdownEditor({
  initialContent = '',
  onChange,
  placeholder = 'Start writing... (Type / for commands)',
  className = '',
  minHeight = '500px',
  format = 'markdown'
}: EditorProps) {
  // State for UI elements
  const [saveStatus, setSaveStatus] = useState('Saved');
  const [wordCount, setWordCount] = useState<number | null>(null);
  const [showBubbleMenu, setShowBubbleMenu] = useState(true);
  
  // Editor reference and instance
  const editorRef = useRef<HTMLDivElement>(null);
  const [editorInstance, setEditorInstance] = useState<EditorInstance | null>(null);
  const [content, setContent] = useState<JSONContent | null>(null);
  
  // UI state
  const [openNode, setOpenNode] = useState(false);
  const [openLink, setOpenLink] = useState(false);
  
  // Function to normalize initial content to JSONContent
  const getInitialContent = useCallback((): JSONContent => {
    if (typeof initialContent === 'object') {
      return initialContent as JSONContent;
    }
    
    if (!initialContent || (typeof initialContent === 'string' && initialContent.trim() === '')) {
      return {
        type: 'doc',
        content: [{ type: 'paragraph' }]
      };
    }
    
    // If format is markdown, convert markdown to HTML first, then to JSON
    if (format === 'markdown') {
      try {
        // Convert markdown to HTML
        const html = marked.parse(initialContent as string) as string;
        // Convert HTML to JSON
        return generateJSON(html, [...defaultExtensions, slashCommand]);
      } catch (error) {
        console.error('Error converting markdown to JSON:', error);
      }
    }
    
    // Fallback or if format is not markdown
    return {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: initialContent as string }]
        }
      ]
    };
  }, [initialContent, format]);
  
  // Initialize AI command manager
  const {
    aiDialogOpen,
    aiCommandType,
    aiCommandLoading,
    openAiCommandDialog,
    closeAiCommandDialog,
    handleAiCommandSubmit,
    handleAcceptResult
  } = useAICommandManager(editorInstance);
  
  // Initialize selection manager
  const {
    hasSelection,
    selectedText,
    selectionState,
    restoreSelection
  } = useSelectionManager(editorInstance, aiDialogOpen);
  
  // We'll initialize the editor through the EditorContent component
  
  // Listen for custom events from slash commands
  useEffect(() => {
    const handleAiCommandDialogEvent = (event: CustomEvent) => {
      const { commandType } = event.detail;
      
      // Get the current selection if any
      openAiCommandDialog(commandType);
    };
    
    // Add event listener
    document.addEventListener('ai-command-dialog', handleAiCommandDialogEvent as EventListener);
    
    // Clean up
    return () => {
      document.removeEventListener('ai-command-dialog', handleAiCommandDialogEvent as EventListener);
    };
  }, [openAiCommandDialog]);
  
  // Debounced save handler
  const debouncedSave = useDebouncedCallback(
    ({ editor }) => {
      // Calculate word count
      const text = editor.getText();
      setWordCount(text.split(/\s+/).filter(Boolean).length);
      
      // Update save status
      setSaveStatus('Saving...');
      setTimeout(() => {
        setSaveStatus('Saved');
      }, 500);
      
      if (onChange) {
        const formattedContent = getFormattedContent(editor, format);
        onChange(formattedContent as string);
      }
    },
    500
  );
  
  // Filter function for image resizing
  const filter = (node: HTMLElement) => {
    if (node.nodeName === 'IMG') {
      return true;
    }
    return false;
  };
  
  // Replacement function for image resizing
  const replacement = (content: string, node: HTMLElement) => {
    if (node.nodeName === 'IMG') {
      const width = node.getAttribute('width');
      const height = node.getAttribute('height');
      
      if (width && height) {
        return `<img src="${node.getAttribute('src')}" width="${width}" height="${height}" />`;
      }
    }
    return content;
  };
  
  return (
    <div
      className={`novel-editor-wrapper ${className}`}
      style={{ minHeight }}
    >
      {/* Custom CSS for placeholder styling and editor appearance */}
      <style jsx global>{`
        /* Placeholder for empty paragraphs */
        .ProseMirror p.is-editor-empty::before,
        .ProseMirror p.is-empty::before {
          content: attr(data-placeholder);
          float: left;
          color: #adb5bd;
          pointer-events: none;
          height: 0;
          opacity: 0.5;
        }
        
        /* Placeholder for headings */
        .ProseMirror h1.is-empty::before,
        .ProseMirror h2.is-empty::before,
        .ProseMirror h3.is-empty::before {
          content: attr(data-placeholder);
          float: left;
          color: #64748b;
          pointer-events: none;
          height: 0;
          font-style: normal;
          font-weight: 500;
          opacity: 0.8;
        }
        
        /* Basic editor styling */
        .ProseMirror {
          padding: 1rem;
          min-height: ${minHeight};
          outline: none;
        }
      `}</style>
      
      {/* Fixed Toolbar */}
      <div className="sticky top-0 z-20 w-full bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center space-x-1 flex-wrap flex-grow mr-4">
            {/* AI Tools */}
            <ToolbarButton 
              icon={<span>⚡</span>} 
              isActive={false} 
              onClick={() => {
                openAiCommandDialog('generate');
              }}
              disabled={!editorInstance}
              tooltip="Generate Content"
            />
            <ToolbarButton 
              icon={<span>✨</span>} 
              isActive={false} 
              onClick={() => {
                openAiCommandDialog('refine');
              }}
              disabled={!editorInstance}
              tooltip="Refine Selected Content"
            />
            <ToolbarButton 
              icon={<span>⭐</span>} 
              isActive={false} 
              onClick={() => {
                openAiCommandDialog('summarize');
              }}
              disabled={!editorInstance}
              tooltip="Summarize Selected Content"
            />

            <div className="h-4 w-px bg-gray-200 mx-2" />

            {/* Text Formatting Tools */}
            <ToolbarButton 
              icon={<span className="font-bold">B</span>} 
              isActive={editorInstance?.isActive('bold')} 
              onClick={() => {
                editorInstance?.chain().focus().toggleBold().run()
              }}
              disabled={!editorInstance}
              tooltip="Bold"
            />
            <ToolbarButton 
              icon={<span className="italic">I</span>} 
              isActive={editorInstance?.isActive('italic')} 
              onClick={() => {
                editorInstance?.chain().focus().toggleItalic().run()
              }}
              disabled={!editorInstance}
              tooltip="Italic"
            />
            <ToolbarButton 
              icon={<span className="underline">U</span>} 
              isActive={editorInstance?.isActive('underline')} 
              onClick={() => {
                editorInstance?.chain().focus().toggleUnderline().run()
              }}
              disabled={!editorInstance}
              tooltip="Underline"
            />
            <ToolbarButton 
              icon={<span className="line-through">S</span>} 
              isActive={editorInstance?.isActive('strike')} 
              onClick={() => {
                editorInstance?.chain().focus().toggleStrike().run()
              }}
              disabled={!editorInstance}
              tooltip="Strikethrough"
            />
            <ToolbarButton 
              icon={<span className="font-mono">{'<>'}</span>} 
              isActive={editorInstance?.isActive('code')} 
              onClick={() => {
                editorInstance?.chain().focus().toggleCode().run()
              }}
              disabled={!editorInstance}
              tooltip="Inline Code"
            />

            <div className="h-4 w-px bg-gray-200 mx-2" />

            {/* Headings */}
            <ToolbarButton 
              icon={<span className="font-bold">H1</span>} 
              isActive={editorInstance?.isActive('heading', { level: 1 })} 
              onClick={() => {
                editorInstance?.chain().focus().toggleHeading({ level: 1 }).run()
              }}
              disabled={!editorInstance}
              tooltip="Heading 1"
            />
            <ToolbarButton 
              icon={<span className="font-bold">H2</span>} 
              isActive={editorInstance?.isActive('heading', { level: 2 })} 
              onClick={() => {
                editorInstance?.chain().focus().toggleHeading({ level: 2 }).run()
              }}
              disabled={!editorInstance}
              tooltip="Heading 2"
            />
            <ToolbarButton 
              icon={<span className="font-bold">H3</span>} 
              isActive={editorInstance?.isActive('heading', { level: 3 })} 
              onClick={() => {
                editorInstance?.chain().focus().toggleHeading({ level: 3 }).run()
              }}
              disabled={!editorInstance}
              tooltip="Heading 3"
            />

            <div className="h-4 w-px bg-gray-200 mx-2" />

            {/* Lists */}
            <ToolbarButton 
              icon={<span>•</span>} 
              isActive={editorInstance?.isActive('bulletList')} 
              onClick={() => {
                editorInstance?.chain().focus().toggleBulletList().run()
              }}
              disabled={!editorInstance}
              tooltip="Bullet List"
            />
            <ToolbarButton 
              icon={<span>1.</span>} 
              isActive={editorInstance?.isActive('orderedList')} 
              onClick={() => {
                editorInstance?.chain().focus().toggleOrderedList().run()
              }}
              disabled={!editorInstance}
              tooltip="Numbered List"
            />
            <ToolbarButton 
              icon={<span>[ ]</span>} 
              isActive={editorInstance?.isActive('taskList')} 
              onClick={() => {
                editorInstance?.chain().focus().toggleTaskList().run()
              }}
              disabled={!editorInstance}
              tooltip="Task List"
            />

            <div className="h-4 w-px bg-gray-200 mx-2" />

            {/* Block formatting */}
            <ToolbarButton 
              icon={<span>&#34;</span>}
              isActive={editorInstance?.isActive('blockquote')} 
              onClick={() => {
                editorInstance?.chain().focus().toggleBlockquote().run()
              }}
              disabled={!editorInstance}
              tooltip="Blockquote"
            />
            <ToolbarButton 
              icon={<span className="font-mono">```</span>} 
              isActive={editorInstance?.isActive('codeBlock')} 
              onClick={() => {
                editorInstance?.chain().focus().toggleCodeBlock().run()
              }}
              disabled={!editorInstance}
              tooltip="Code Block"
            />
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0">
            {/* Bubble Menu Toggle */}
            <div className="flex items-center">
              <label className="inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={showBubbleMenu} 
                  onChange={() => setShowBubbleMenu(!showBubbleMenu)} 
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
      
      <EditorRoot>
        <EditorContent
          ref={editorRef}
          initialContent={getInitialContent()}
          extensions={[...defaultExtensions, slashCommand]}
          className="relative w-full border border-gray-200 bg-white rounded-lg shadow-sm overflow-hidden"
          editorProps={{
            attributes: {
              class: "prose prose-lg prose-stone dark:prose-invert prose-headings:font-title font-default focus:outline-none max-w-full",
            },
            transformPastedHTML: (html) => {
              return html.replace(/<img.*?>/g, (match) => {
                return match.replace(/width="(\d+)"/, 'width="100%"').replace(/height="(\d+)"/, '');
              });
            }
          }}
          onCreate={({ editor }) => {
            setEditorInstance(editor);
          }}
          onUpdate={({ editor }) => {
            // Update content when editor changes
            const content = editor.getJSON();
            setContent(content);
            setWordCount(countWords(editor.getText()));
            setSaveStatus('unsaved');
            
            // Call onChange with the new content
            if (onChange) {
              onChange(getFormattedContent(editor, format) as string);
            }
          }}
          slotAfter={<ImageResizer />}
        >
          {/* Slash Command Menu */}
          <EditorCommand className="z-50 h-auto max-h-[330px] w-72 overflow-y-auto rounded-md border border-stone-200 bg-white px-1 py-2 shadow-md transition-all">
            <EditorCommandEmpty className="px-2 text-stone-500">
              No results
            </EditorCommandEmpty>
            <EditorCommandList>
              {suggestionItems.map((item) => (
                <EditorCommandItem
                  key={item.title}
                  value={item.title}
                  onCommand={(val) => {
                    if (item.command) {
                      item.command(val);
                    }
                  }}
                  className="flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm hover:bg-stone-100 aria-selected:bg-stone-100"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-md border border-stone-200 bg-white">
                    {item.icon}
                  </div>
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-xs text-stone-500">{item.description}</p>
                  </div>
                </EditorCommandItem>
              ))}
            </EditorCommandList>
          </EditorCommand>
          
          {/* Bubble Menu - appears when text is selected, hidden when AI dialog is open or disabled */}
          {!aiDialogOpen && showBubbleMenu && (
            <EditorBubble
              className="flex w-fit divide-x divide-stone-200 rounded-md border border-stone-200 bg-white shadow-xl"
              tippyOptions={{ duration: 100 }}
            >
              <AIMenu 
                editor={editorInstance!} 
                onGenerateContent={() => openAiCommandDialog('generate')} 
                onRefineContent={() => openAiCommandDialog('refine')} 
                onSummarizeContent={() => openAiCommandDialog('summarize')} 
              />
              <Separator orientation="vertical" />
              <NodeSelector open={openNode} onOpenChange={setOpenNode} />
              <Separator orientation="vertical" />
              <TextButtons />
              <Separator orientation="vertical" />
              <LinkSelector open={openLink} onOpenChange={setOpenLink} />
            </EditorBubble>
          )}
        </EditorContent>
      </EditorRoot>
      
      {/* AI Command Dialog */}
      <AICommandDialog
        isOpen={aiDialogOpen}
        onClose={() => {
          console.log('🔍 Dialog closing');
          closeAiCommandDialog();
          
          // Restore selection when dialog closes
          restoreSelection();
        }}
        onSubmit={handleAiCommandSubmit}
        onAccept={handleAcceptResult}
        commandType={aiCommandType}
        initialContent={typeof initialContent === 'string' ? initialContent : ''}
        hasSelection={hasSelection}
        selectedText={selectedText}
      />
    </div>
  );
}

export default MarkdownEditor;
