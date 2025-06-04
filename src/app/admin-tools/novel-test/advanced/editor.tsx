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

// Import our custom components and extensions
import { defaultExtensions } from './extensions';
import { slashCommand, suggestionItems } from './slash-command';
import { TextButtons } from './components/text-buttons';
import { LinkSelector } from './components/link-selector';
import { NodeSelector } from './components/node-selector';
import { Separator } from './components/separator';
import AIMenu from './components/ai-menu';

interface EditorProps {
  initialContent?: string | JSONContent;
  onChange?: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

export function Editor({
  initialContent = '',
  onChange,
  placeholder = 'Start writing... (Type / for commands)',
  className = '',
  minHeight = '500px'
}: EditorProps) {
  // State for UI elements
  const [saveStatus, setSaveStatus] = useState('Saved');
  const [wordCount, setWordCount] = useState<number | null>(null);
  const [openNode, setOpenNode] = useState(false);
  const [openLink, setOpenLink] = useState(false);
  const [openAI, setOpenAI] = useState(false);
  
  // Create extensions array with slash command
  const extensions = [...defaultExtensions, slashCommand];
  
  // Convert initial content to JSONContent format if it's a string
  const getInitialContent = useCallback((): JSONContent => {
    if (typeof initialContent === 'object') {
      return initialContent as JSONContent;
    }
    
    if (!initialContent || (typeof initialContent === 'string' && initialContent.trim() === '')) {
      return {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
          }
        ]
      };
    }
    
    return {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: initialContent as string }]
        }
      ]
    };
  }, [initialContent]);
  
  // Debounce updates to avoid excessive state changes
  const debouncedUpdates = useDebouncedCallback(({ editor }) => {
    // Count words in the editor
    const text = editor.getText();
    const words = text.trim() ? text.split(/\s+/).length : 0;
    setWordCount(words);
    
    // Call onChange callback if provided
    if (onChange) {
      onChange(editor.getHTML());
    }
    
    setSaveStatus('Saved');
  }, 750);

  return (
    <div className={`novel-editor-wrapper ${className}`} style={{ minHeight }}>
      {/* Custom CSS for placeholder styling */}
      <style jsx global>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #adb5bd;
          pointer-events: none;
          height: 0;
        }
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
        }
      `}</style>
      <div className="flex absolute right-5 top-5 z-10 mb-5 gap-2">
        <div className="rounded-lg bg-stone-100 px-2 py-1 text-sm text-stone-600">
          {saveStatus}
        </div>
        {wordCount !== null && (
          <div className="rounded-lg bg-stone-100 px-2 py-1 text-sm text-stone-600">
            {wordCount} words
          </div>
        )}
      </div>
      
      <EditorRoot>
        <EditorContent
          initialContent={getInitialContent()}
          extensions={extensions}
          className="relative min-h-[500px] w-full max-w-screen-lg border-stone-200 bg-white sm:mb-[calc(20vh)] sm:rounded-lg sm:border sm:shadow-lg"
          editorProps={{
            handleDOMEvents: {
              keydown: (_view, event) => handleCommandNavigation(event),
            },
            attributes: {
              class: "prose prose-lg dark:prose-invert prose-headings:font-title font-default focus:outline-none max-w-full p-4",
            },
          }}
          onUpdate={({ editor }) => {
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
          
          {/* Bubble Menu - appears when text is selected */}
          <EditorBubble
            className="flex w-fit divide-x divide-stone-200 rounded-md border border-stone-200 bg-white shadow-xl"
            tippyOptions={{ duration: 100 }}
          >
            <AIMenu open={openAI} onOpenChange={setOpenAI} />
            <Separator orientation="vertical" />
            <NodeSelector open={openNode} onOpenChange={setOpenNode} />
            <Separator orientation="vertical" />
            <LinkSelector open={openLink} onOpenChange={setOpenLink} />
            <Separator orientation="vertical" />
            <TextButtons />
          </EditorBubble>
        </EditorContent>
      </EditorRoot>
    </div>
  );
}

export default Editor;
