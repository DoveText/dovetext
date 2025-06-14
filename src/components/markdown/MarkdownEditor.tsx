'use client';

import React, { useCallback, useState, useEffect } from 'react';
import {
  EditorRoot,
  EditorContent,
  EditorCommand,
  EditorCommandItem,
  EditorCommandEmpty,
  EditorCommandList,
  EditorBubble,
  ImageResizer,
  handleCommandNavigation,
  handleImageDrop,
  handleImagePaste,
  useEditor
} from 'novel';
import { JSONContent } from '@tiptap/react';
import { useDebouncedCallback } from 'use-debounce';

// Import markdown conversion libraries
import { marked } from 'marked';
import TurndownService from 'turndown';
import { generateJSON } from '@tiptap/html';

// Import our custom components and extensions
import { defaultExtensions } from './extensions';
import { slashCommand, suggestionItems } from './slash-command';
import { TextButtons } from './components/text-buttons';
import { LinkSelector } from './components/link-selector';
import { NodeSelector } from './components/node-selector';
import { Separator } from './components/separator';
import AIMenu from './components/ai-menu';
import AICommandDialog, { AICommandType } from './components/ai-command-dialog';
import { AICommandService } from './services/ai-command-service';
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
  const [showBubbleMenu, setShowBubbleMenu] = useState(true); // Toggle for bubble menu
  
  // AI command dialog state
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiCommandType, setAiCommandType] = useState<AICommandType>(null);
  const [aiCommandLoading, setAiCommandLoading] = useState(false);
  const [aiService, setAiService] = useState<AICommandService | null>(null);
  const [openNode, setOpenNode] = useState(false);
  const [openLink, setOpenLink] = useState(false);
  const [openAI, setOpenAI] = useState(false);
  
  // Editor reference
  const [editorInstance, setEditorInstance] = useState<any>(null);
  
  // Initialize AI service when editor is ready
  useEffect(() => {
    if (editorInstance) {
      setAiService(new AICommandService(editorInstance));
    }
  }, [editorInstance]);
  
  // Listen for custom events from slash commands
  useEffect(() => {
    const handleAiCommandDialogEvent = (event: CustomEvent) => {
      const { commandType, initialContent, hasSelection } = event.detail;
      setAiCommandType(commandType);
      setAiDialogOpen(true);
    };
    
    // Add event listener
    document.addEventListener('openAiCommandDialog', handleAiCommandDialogEvent as EventListener);
    
    // Clean up
    return () => {
      document.removeEventListener('openAiCommandDialog', handleAiCommandDialogEvent as EventListener);
    };
  }, []);
  
  // Create extensions array with slash command
  const extensions = [...defaultExtensions, slashCommand];
  
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
    if (format === 'markdown' && typeof initialContent === 'string') {
      try {
        // Convert markdown to HTML
        const html = marked.parse(initialContent as string) as string;
        // Convert HTML to JSON
        return generateJSON(html, extensions);
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
  }, [initialContent, format, extensions]);
  
  // Convert editor content to the specified format
  const getFormattedContent = useCallback((editor: any) => {
    if (!editor) return '';
    
    switch (format) {
      case 'markdown': {
        const html = editor.getHTML();
        const turndownService = new TurndownService({
          headingStyle: 'atx',
          codeBlockStyle: 'fenced'
        });
        // Add rules for better markdown conversion
        turndownService.addRule('codeBlocks', {
          filter: (node) => {
            return node.nodeName === 'PRE' && 
              node.firstChild && 
              node.firstChild.nodeName === 'CODE';
          },
          replacement: (content, node) => {
            if (node.firstChild) {
              const code = node.firstChild.textContent || '';
              let lang = '';
              
              // Safe type checking for getAttribute
              if (node.firstChild.nodeType === 1) { // Element node
                const element = node.firstChild as Element;
                lang = element.getAttribute?.('class')?.replace('language-', '') || '';
              }
              
              return '\n```' + lang + '\n' + code + '\n```\n';
            }
            return content;
          }
        });
        return turndownService.turndown(html);
      }
      case 'json':
        return JSON.stringify(editor.getJSON());
      case 'html':
      default:
        return editor.getHTML();
    }
  }, [format]);
  
  // Debounced update function
  const debouncedUpdates = useDebouncedCallback(
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
        const formattedContent = getFormattedContent(editor);
        onChange(formattedContent);
      }
    },
    500
  );

  // Handle AI command dialog submission
  const handleAiCommandSubmit = async (commandType: AICommandType, params: Record<string, any>) => {
    if (!aiService || !editorInstance) return;
    
    try {
      setAiCommandLoading(true);
      
      // Get the current selection if any
      const { from, to } = editorInstance.state.selection;
      const hasSelection = from !== to;
      
      // Execute the AI command
      const result = await aiService.executeCommand(commandType, params);
      
      // Insert the result based on command type and selection
      if (commandType === 'refine' && hasSelection) {
        aiService.replaceSelection(result);
      } else if (commandType === 'refine' && !hasSelection) {
        aiService.replaceAll(result);
      } else {
        // For generate and schema, insert at current position
        aiService.insertContent(result);
      }
      
    } catch (error) {
      console.error('Error executing AI command:', error);
      if (editorInstance) {
        editorInstance.chain().focus().insertContent('\n\n**Error:** Failed to execute AI command.').run();
      }
    } finally {
      setAiCommandLoading(false);
    }
  };
  
  // Open AI command dialog
  const openAiCommandDialog = (type: AICommandType) => {
    setAiCommandType(type);
    setAiDialogOpen(true);
  };
  
  return (
    <div className={`novel-editor-wrapper ${className}`} style={{ minHeight }}>
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
        
        /* Typography */
        .ProseMirror h1 {
          font-size: 2rem;
          font-weight: 700;
          margin-top: 1.5rem;
          margin-bottom: 1rem;
        }
        
        .ProseMirror h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-top: 1.25rem;
          margin-bottom: 0.75rem;
        }
        
        .ProseMirror h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
        }
        
        .ProseMirror p {
          margin-top: 0.75rem;
          margin-bottom: 0.75rem;
          line-height: 1.6;
        }
        
        /* Lists */
        .ProseMirror ul,
        .ProseMirror ol {
          padding-left: 1.5rem;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }
        
        .ProseMirror li {
          margin-top: 0.25rem;
          margin-bottom: 0.25rem;
        }
        
        /* Links */
        .ProseMirror a {
          color: #2563eb;
          text-decoration: underline;
          cursor: pointer;
        }
        
        /* Code blocks */
        .ProseMirror pre {
          background-color: #f1f5f9;
          border-radius: 0.375rem;
          padding: 0.75rem 1rem;
          overflow-x: auto;
          margin: 1rem 0;
        }
        
        /* Blockquotes */
        .ProseMirror blockquote {
          border-left: 4px solid #e2e8f0;
          padding-left: 1rem;
          font-style: italic;
          margin: 1rem 0;
        }
      `}</style>
      
      {/* Fixed Toolbar */}
      <div className="sticky top-0 z-20 w-full bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center space-x-1 flex-wrap flex-grow mr-4">
            {/* Text Formatting Tools */}
            <ToolbarButton 
              icon={<span className="font-bold">B</span>} 
              isActive={editorInstance?.isActive('bold')} 
              onClick={(e) => {
                e.preventDefault();
                editorInstance?.chain().focus().toggleBold().run()
              }}
              disabled={!editorInstance}
              tooltip="Bold"
            />
            <ToolbarButton 
              icon={<span className="italic">I</span>} 
              isActive={editorInstance?.isActive('italic')} 
              onClick={(e) => {
                e.preventDefault();                
                editorInstance?.chain().focus().toggleItalic().run()
              }}
              disabled={!editorInstance}
              tooltip="Italic"
            />
            <ToolbarButton 
              icon={<span className="underline">U</span>} 
              isActive={editorInstance?.isActive('underline')} 
              onClick={(e) => {
                e.preventDefault();
                editorInstance?.chain().focus().toggleUnderline().run()
              }}
              disabled={!editorInstance}
              tooltip="Underline"
            />
            <ToolbarButton 
              icon={<span className="line-through">S</span>} 
              isActive={editorInstance?.isActive('strike')} 
              onClick={(e) => {
                e.preventDefault();
                editorInstance?.chain().focus().toggleStrike().run()
              }}
              disabled={!editorInstance}
              tooltip="Strikethrough"
            />
            <ToolbarButton 
              icon={<span className="font-mono">{'<>'}</span>} 
              isActive={editorInstance?.isActive('code')} 
              onClick={(e) => {
                e.preventDefault();
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
              onClick={(e) => {
                e.preventDefault();
                editorInstance?.chain().focus().toggleHeading({ level: 1 }).run()
              }}
              disabled={!editorInstance}
              tooltip="Heading 1"
            />
            <ToolbarButton 
              icon={<span className="font-bold">H2</span>} 
              isActive={editorInstance?.isActive('heading', { level: 2 })} 
              onClick={(e) => {
                e.preventDefault();
                editorInstance?.chain().focus().toggleHeading({ level: 2 }).run()
              }}
              disabled={!editorInstance}
              tooltip="Heading 2"
            />
            <ToolbarButton 
              icon={<span className="font-bold">H3</span>} 
              isActive={editorInstance?.isActive('heading', { level: 3 })} 
              onClick={(e) => {
                e.preventDefault();
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
              onClick={(e) => {
                e.preventDefault();
                editorInstance?.chain().focus().toggleBulletList().run()
              }}
              disabled={!editorInstance}
              tooltip="Bullet List"
            />
            <ToolbarButton 
              icon={<span>1.</span>} 
              isActive={editorInstance?.isActive('orderedList')} 
              onClick={(e) => {
                e.preventDefault();
                editorInstance?.chain().focus().toggleOrderedList().run()
              }}
              disabled={!editorInstance}
              tooltip="Numbered List"
            />
            <ToolbarButton 
              icon={<span>[ ]</span>} 
              isActive={editorInstance?.isActive('taskList')} 
              onClick={(e) => {
                e.preventDefault();
                editorInstance?.chain().focus().toggleTaskList().run()
              }}
              disabled={!editorInstance}
              tooltip="Task List"
            />

            <div className="h-4 w-px bg-gray-200 mx-2" />

            {/* Block formatting */}
            <ToolbarButton 
              icon={<span>"</span>} 
              isActive={editorInstance?.isActive('blockquote')} 
              onClick={(e) => {
                e.preventDefault();
                editorInstance?.chain().focus().toggleBlockquote().run()
              }}
              disabled={!editorInstance}
              tooltip="Blockquote"
            />
            <ToolbarButton 
              icon={<span className="font-mono">```</span>} 
              isActive={editorInstance?.isActive('codeBlock')} 
              onClick={(e) => {
                e.preventDefault();
                editorInstance?.chain().focus().toggleCodeBlock().run()
              }}
              disabled={!editorInstance}
              tooltip="Code Block"
            />

            <div className="h-4 w-px bg-gray-200 mx-2" />

            {/* AI Tools */}
            <ToolbarButton 
              icon={<span>✨</span>} 
              isActive={false} 
              onClick={(e) => {
                e.preventDefault();
                setAiCommandType('generate'); setAiDialogOpen(true); 
              }}
              disabled={!editorInstance}
              tooltip="Generate Content"
            />
            <ToolbarButton 
              icon={<span>🔄</span>} 
              isActive={false} 
              onClick={(e) => {
                e.preventDefault();
                setAiCommandType('refine'); setAiDialogOpen(true); 
              }}
              disabled={!editorInstance}
              tooltip="Refine Content"
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
          initialContent={getInitialContent()}
          extensions={extensions}
          className="relative w-full border border-gray-200 bg-white rounded-lg shadow-sm overflow-hidden"
          editorProps={{
            handleDOMEvents: {
              keydown: (_view, event) => handleCommandNavigation(event, suggestionItems),
            },
            attributes: {
              class: "prose prose-lg prose-stone dark:prose-invert prose-headings:font-title font-default focus:outline-none max-w-full",
            },
          }}
          onUpdate={({ editor }) => {
            setEditorInstance(editor);
            debouncedUpdates({ editor });
            setSaveStatus('Unsaved');
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
                onGenerateContent={() => { setAiCommandType('generate'); setAiDialogOpen(true); }} 
                onRefineContent={() => { setAiCommandType('refine'); setAiDialogOpen(true); }} 
                onCreateSchema={() => { setAiCommandType('schema'); setAiDialogOpen(true); }} 
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
      onClose={() => setAiDialogOpen(false)}
      onSubmit={handleAiCommandSubmit}
      commandType={aiCommandType}
      initialContent={editorInstance?.getText() || ''}
    />
    </div>
  );
}

export default MarkdownEditor;
