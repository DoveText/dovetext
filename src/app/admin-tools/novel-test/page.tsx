'use client';

import React, { useState, useRef } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import {
  EditorRoot,
  EditorContent,
  EditorCommand,
  EditorCommandItem,
  EditorCommandEmpty,
  EditorCommandList,
  EditorBubble,
  EditorBubbleItem,
  HorizontalRule,
  HighlightExtension,
  Placeholder,
  UpdatedImage,
  Command,
  createSuggestionItems,
  renderItems,
  useEditor
} from 'novel';
import { JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';

export default function NovelTestPage() {
  return (
    <ProtectedRoute>
      <NovelTest />
    </ProtectedRoute>
  );
}

// Define slash command suggestions
const suggestionItems = createSuggestionItems([
  {
    title: "Generate Content",
    description: "Generate content using AI",
    searchTerms: ["generate", "ai", "content"],
    icon: <span className="flex h-6 w-6 items-center justify-center text-lg">✨</span>,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      // Simulate AI generation
      setTimeout(() => {
        editor
          .chain()
          .focus()
          .insertContent("**AI Generated Content:** This is simulated AI-generated content.")
          .run();
      }, 1000);
    },
  },
  {
    title: "Refine Content",
    description: "Improve clarity and readability",
    searchTerms: ["refine", "improve", "clarity"],
    icon: <span className="flex h-6 w-6 items-center justify-center text-lg">🔍</span>,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      // Simulate AI refinement
      setTimeout(() => {
        editor
          .chain()
          .focus()
          .insertContent("**AI Refined Content:** This content has been refined for clarity and impact.")
          .run();
      }, 1000);
    },
  },
  {
    title: "Heading 1",
    description: "Large section heading",
    searchTerms: ["h1", "header", "heading", "large"],
    icon: <span className="flex h-6 w-6 items-center justify-center font-bold">H1</span>,
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode("heading", { level: 1 })
        .run();
    },
  },
  {
    title: "Heading 2",
    description: "Medium section heading",
    searchTerms: ["h2", "header", "heading", "medium"],
    icon: <span className="flex h-6 w-6 items-center justify-center font-bold">H2</span>,
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode("heading", { level: 2 })
        .run();
    },
  },
  {
    title: "Bullet List",
    description: "Create a simple bullet list",
    searchTerms: ["bullet", "list", "unordered"],
    icon: <span className="flex h-6 w-6 items-center justify-center">•</span>,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: "Numbered List",
    description: "Create a numbered list",
    searchTerms: ["numbered", "list", "ordered"],
    icon: <span className="flex h-6 w-6 items-center justify-center">1.</span>,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
]);

// Create the slash command extension
const slashCommand = Command.configure({
  suggestion: {
    items: () => suggestionItems,
    render: renderItems,
  },
});

function NovelTest() {
  const [content, setContent] = useState<string>('');
  const [aiActionInProgress, setAiActionInProgress] = useState<string | null>(null);
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  
  // AI action handlers
  const handleGenerateContent = async () => {
    setAiActionInProgress('generate');
    try {
      // Simulate AI generation
      await new Promise(resolve => setTimeout(resolve, 1500));
      setContent(prev => prev + '\n\n**AI Generated Content:** This is simulated AI-generated content. In a real implementation, this would call your AI API.');
    } finally {
      setAiActionInProgress(null);
    }
  };
  
  const handleRefineContent = async () => {
    setAiActionInProgress('refine');
    try {
      // Simulate AI refinement
      await new Promise(resolve => setTimeout(resolve, 1500));
      setContent(prev => prev + '\n\n**AI Refined Content:** This content has been refined for clarity and impact.');
    } finally {
      setAiActionInProgress(null);
    }
  };
  
  // Toggle command menu
  const toggleCommandMenu = () => {
    setShowCommandMenu(!showCommandMenu);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Novel Editor Test</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Basic Novel Editor</h2>
        
        <div className="flex justify-end mb-2 space-x-2">
          <button
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-md px-3 py-1 text-sm"
            onClick={handleGenerateContent}
            disabled={!!aiActionInProgress}
          >
            ✨ Generate
          </button>
          <button
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-md px-3 py-1 text-sm"
            onClick={handleRefineContent}
            disabled={!!aiActionInProgress}
          >
            🔍 Refine
          </button>
          <div className="text-sm text-gray-500 ml-2 flex items-center">
            Tip: Type <kbd className="px-1 py-0.5 bg-gray-100 border rounded text-xs mx-1">/</kbd> in the editor to access commands
          </div>
        </div>
        
        <div className="novel-editor-wrapper border rounded-md relative">
          <EditorRoot>
            {/* Bubble Menu - appears when text is selected */}
            <EditorBubble
              className="flex w-fit rounded-md border border-stone-200 bg-white shadow-xl" 
              tippyOptions={{ duration: 100 }}
            >
              <EditorBubbleItem
                onSelect={(editor) => editor.chain().focus().toggleBold().run()}
              >
                <button className="p-2 text-stone-600 hover:bg-stone-100 hover:text-stone-900">
                  <span className="font-bold">B</span>
                </button>
              </EditorBubbleItem>
              
              <EditorBubbleItem
                onSelect={(editor) => editor.chain().focus().toggleItalic().run()}
              >
                <button className="p-2 text-stone-600 hover:bg-stone-100 hover:text-stone-900">
                  <span className="italic">I</span>
                </button>
              </EditorBubbleItem>
              
              <EditorBubbleItem
                onSelect={(editor) => editor.chain().focus().toggleUnderline().run()}
              >
                <button className="p-2 text-stone-600 hover:bg-stone-100 hover:text-stone-900">
                  <span className="underline">U</span>
                </button>
              </EditorBubbleItem>
              
              <EditorBubbleItem
                onSelect={(editor) => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              >
                <button className="p-2 text-stone-600 hover:bg-stone-100 hover:text-stone-900">
                  H1
                </button>
              </EditorBubbleItem>
              
              <EditorBubbleItem
                onSelect={(editor) => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              >
                <button className="p-2 text-stone-600 hover:bg-stone-100 hover:text-stone-900">
                  H2
                </button>
              </EditorBubbleItem>
              
              <EditorBubbleItem
                onSelect={(editor) => editor.chain().focus().toggleBulletList().run()}
              >
                <button className="p-2 text-stone-600 hover:bg-stone-100 hover:text-stone-900">
                  • List
                </button>
              </EditorBubbleItem>
              
              <EditorBubbleItem
                onSelect={(editor) => editor.chain().focus().toggleOrderedList().run()}
              >
                <button className="p-2 text-stone-600 hover:bg-stone-100 hover:text-stone-900">
                  1. List
                </button>
              </EditorBubbleItem>
              
              <EditorBubbleItem
                onSelect={(editor) => {
                  const url = window.prompt('URL');
                  if (url) {
                    editor.chain().focus().setLink({ href: url }).run();
                  }
                }}
              >
                <button className="p-2 text-stone-600 hover:bg-stone-100 hover:text-stone-900">
                  🔗 Link
                </button>
              </EditorBubbleItem>
            </EditorBubble>
            
            <EditorContent
              initialContent={{
                type: "doc",
                content: [
                  {
                    type: "paragraph",
                    content: [
                      {
                        type: "text",
                        text: "Welcome to the Novel editor test! Try clicking the '/ Commands' button above to access AI commands."
                      }
                    ]
                  }
                ]
              }}
              extensions={[
                StarterKit,
                Placeholder.configure({
                  placeholder: "Start writing... (Type / for commands)"
                }),
                Link.configure({
                  openOnClick: false,
                  HTMLAttributes: {
                    class: "text-primary underline",
                  },
                }),
                Underline,
                HighlightExtension,
                HorizontalRule,
                UpdatedImage,
                slashCommand // Add the slash command extension
              ]}
              className="min-h-[300px]"
              editorProps={{
                attributes: {
                  class: "prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none",
                },
              }}
              onUpdate={({ editor }) => {
                setContent(editor.getHTML());
              }}
            />
            
            {/* Slash Command UI */}
            <EditorCommand className="z-50 h-auto max-h-[330px] w-72 overflow-y-auto rounded-md border border-muted bg-background px-1 py-2 shadow-md transition-all">
              <EditorCommandEmpty className="px-2 text-muted-foreground">No results</EditorCommandEmpty>
              <EditorCommandList>
                {suggestionItems.map((item) => (
                  <EditorCommandItem
                    value={item.title}
                    onCommand={(val) => {
                      if (item.command) {
                        item.command(val);
                      }
                    }}
                    className={`flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm hover:bg-accent aria-selected:bg-accent`}
                    key={item.title}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-md border border-muted bg-background">
                      {item.icon}
                    </div>
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  </EditorCommandItem>
                ))}
              </EditorCommandList>
            </EditorCommand>
          </EditorRoot>
        </div>
        
        {/* AI Action Buttons */}
        <div className="mt-4 flex space-x-2">
          <button
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-md px-3 py-1 text-sm"
            onClick={handleGenerateContent}
            disabled={!!aiActionInProgress}
          >
            ✨ Generate Content
          </button>
          <button
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-md px-3 py-1 text-sm"
            onClick={handleRefineContent}
            disabled={!!aiActionInProgress}
          >
            🔍 Refine Content
          </button>
        </div>
        
        {/* AI Action Progress Indicator */}
        {aiActionInProgress && (
          <div className="mt-2 text-sm text-indigo-600">
            <span className="inline-block animate-pulse mr-2">⚡</span>
            {aiActionInProgress === 'generate' ? 'Generating content...' : 'Refining content...'}
          </div>
        )}
        
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-2">Editor Output (HTML):</h3>
          <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-[200px] text-sm">
            {content}
          </pre>
        </div>
      </div>
    </div>
  );
}
