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
  EditorInstance,
  handleCommandNavigation
} from 'novel';
import { defaultExtensions } from './extensions';
import { slashCommand, suggestionItems, isAICommandEnabled } from './components/slash-command';
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
import AICommandDialog from './components/ai-command-dialog';
import { TextButtons } from './components/text-buttons';
import { LinkSelector } from './components/link-selector';
import { NodeSelector } from './components/node-selector';
import { Separator } from './components/separator';
import AIMenu from './components/ai-menu';
import { FixedToolbar } from './components/fixed-toolbar';

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
    aiService,
    openAiCommandDialog,
    closeAiCommandDialog,
    handleAiCommandSubmit,
    handleAcceptResult
  } = useAICommandManager(editorInstance);
  
  // Initialize selection manager
  const {
    hasSelection,
    selectedText,
  } = useSelectionManager(editorInstance, aiDialogOpen);
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

  // Set up a ref to measure the editor container
  const editorContainerRef = useRef<HTMLDivElement>(null);
  
  // Update CSS variables when the editor size or position changes
  useEffect(() => {
    const updateEditorDimensions = () => {
      if (editorContainerRef.current) {
        const rect = editorContainerRef.current.getBoundingClientRect();
        document.documentElement.style.setProperty('--editor-width', `${rect.width}px`);
        document.documentElement.style.setProperty('--editor-left', `${rect.left}px`);
      }
    };
    
    // Update dimensions initially, on resize, and on scroll
    updateEditorDimensions();
    window.addEventListener('resize', updateEditorDimensions);
    window.addEventListener('scroll', updateEditorDimensions, { passive: true });
    
    // Create a ResizeObserver to detect size changes of the editor container
    const resizeObserver = new ResizeObserver(() => {
      updateEditorDimensions();
    });
    
    if (editorContainerRef.current) {
      resizeObserver.observe(editorContainerRef.current);
    }
    
    return () => {
      window.removeEventListener('resize', updateEditorDimensions);
      window.removeEventListener('scroll', updateEditorDimensions);
      resizeObserver.disconnect();
    };
  }, []);
  
  return (
    <div 
      className={`novel-editor-wrapper ${className}`} 
      id="markdown-editor-container"
      ref={editorContainerRef}
    >
      {/* Fixed Toolbar with Status */}
      <FixedToolbar
        editor={editorInstance}
        onAICommand={openAiCommandDialog}
        saveStatus={saveStatus}
        wordCount={wordCount}
        showBubbleMenu={showBubbleMenu}
        onToggleBubbleMenu={() => setShowBubbleMenu(!showBubbleMenu)}
      />
      
      <div className="novel-editor-root">
        <EditorRoot>
        <EditorContent
          ref={editorRef}
          initialContent={getInitialContent()}
          extensions={[...defaultExtensions, slashCommand]}
          className="relative w-full border border-gray-200 bg-white rounded-lg shadow-sm overflow-hidden"
          editorProps={{
            handleDOMEvents: {
              keydown: (_view, event) => handleCommandNavigation(event),
            },
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
              {suggestionItems
                .filter(item => {
                  // Filter out disabled AI commands
                  if (["Generate Content", "Refine Content", "Summarize Title", "Create Outline"].includes(item.title)) {
                    return isAICommandEnabled(item.title, editorInstance);
                  }
                  return true;
                })
                .map((item) => (
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
                onSummarizeContent={() => openAiCommandDialog('summarize-title')}
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
      </div>
      
      {/* AI Command Dialog */}
      <AICommandDialog
        isOpen={aiDialogOpen}
        onClose={() => {
          console.log('🔍 Dialog closing');
          closeAiCommandDialog();
        }}
        onSubmit={handleAiCommandSubmit}
        onAccept={handleAcceptResult}
        commandType={aiCommandType}
        initialContent={typeof initialContent === 'string' ? initialContent : ''}
        hasSelection={hasSelection}
        selectedText={selectedText}
        aiService={aiService} // Pass the AICommandService instance
      />
    </div>
  );
}

export default MarkdownEditor;
