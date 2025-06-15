'use client';

import React from 'react';
import {
  Command,
  createSuggestionItems,
  renderItems
} from 'novel';
import { aiApi } from '@/app/admin-tools/api/ai';
import { marked } from 'marked';

// Define proper types for suggestion items
interface CommandItemProps {
  editor: any;
  range: any;
}

interface SuggestionItem {
  title: string;
  description: string;
  searchTerms: string[];
  icon: React.ReactNode;
  command: (props: CommandItemProps) => void;
}

// Define slash command suggestions
export const suggestionItems = createSuggestionItems([
  {
    title: "Generate Content",
    description: "Generate content using AI",
    searchTerms: ["generate", "ai", "content"],
    icon: <span className="flex h-6 w-6 items-center justify-center text-lg">⚡</span>,
    command: ({ editor, range }) => {
      // Delete the slash command text
      editor.chain().focus().deleteRange(range).run();
      
      // Get the current content for context
      const currentContent = editor.getText();
      
      // Dispatch a custom event to open the AI command dialog
      const event = new CustomEvent('openAiCommandDialog', {
        detail: {
          commandType: 'generate',
          initialContent: currentContent
        }
      });
      document.dispatchEvent(event);
    },
  },
  {
    title: "Refine Content",
    description: "Improve clarity and readability",
    searchTerms: ["refine", "improve", "clarity"],
    icon: <span className="flex h-6 w-6 items-center justify-center text-lg">✨</span>,
    command: ({ editor, range }) => {
      // Delete the slash command text
      editor.chain().focus().deleteRange(range).run();
      
      // Get the current selection or all content
      const selection = editor.state.selection;
      const hasSelection = !selection.empty;
      
      const contentToRefine = hasSelection 
        ? editor.state.doc.textBetween(selection.from, selection.to)
        : editor.getText();
      
      if (!contentToRefine.trim()) {
        editor.chain().focus().insertContent('Please add some content to refine.').run();
        return;
      }
      
      // Dispatch a custom event to open the AI command dialog
      const event = new CustomEvent('openAiCommandDialog', {
        detail: {
          commandType: 'refine',
          initialContent: contentToRefine,
          hasSelection
        }
      });
      document.dispatchEvent(event);
    },
  },
  {
    title: "Summarize Content",
    description: "Create a summary of your content",
    searchTerms: ["summarize", "summary", "tldr"],
    icon: <span className="flex h-6 w-6 items-center justify-center text-lg">⭐</span>,
    command: ({ editor, range }) => {
      // Delete the slash command text
      editor.chain().focus().deleteRange(range).run();

      // Get the current content for context
      const currentContent = editor.getText();

      if (!currentContent.trim()) {
        editor.chain().focus().insertContent('Please add some content to summarize.').run();
        return;
      }

      // Dispatch a custom event to open the AI command dialog
      const event = new CustomEvent('openAiCommandDialog', {
        detail: {
          commandType: 'summarize',
          initialContent: currentContent
        }
      });
      document.dispatchEvent(event);
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
      
      // Set cursor to the empty heading to show the placeholder
      const { state } = editor;
      const pos = state.selection.$head.pos;
      editor.commands.setTextSelection(pos);
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
      
      // Set cursor to the empty heading to show the placeholder
      const { state } = editor;
      const pos = state.selection.$head.pos;
      editor.commands.setTextSelection(pos);
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
  {
    title: "Code Block",
    description: "Add a code block",
    searchTerms: ["code", "codeblock"],
    icon: <span className="flex h-6 w-6 items-center justify-center font-mono">{ }</span>,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
    },
  },
  {
    title: "Quote",
    description: "Add a quote or citation",
    searchTerms: ["quote", "blockquote"],
    icon: <span className="flex h-6 w-6 items-center justify-center">"</span>,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    },
  },
  {
    title: "Create Outline",
    description: "Generate a document outline",
    searchTerms: ["outline", "schema", "structure"],
    icon: <span className="flex h-6 w-6 items-center justify-center">📋</span>,
    command: ({ editor, range }) => {
      // Delete the slash command text
      editor.chain().focus().deleteRange(range).run();
      
      // Get the current content for context
      const currentContent = editor.getText();
      
      if (!currentContent.trim()) {
        editor.chain().focus().insertContent('Please add some content to create a schema for.').run();
        return;
      }
      
      // Dispatch a custom event to open the AI command dialog
      const event = new CustomEvent('openAiCommandDialog', {
        detail: {
          commandType: 'schema',
          initialContent: currentContent
        }
      });
      document.dispatchEvent(event);
    },
  },
]);

// Create the slash command extension
export const slashCommand = Command.configure({
  suggestion: {
    items: () => suggestionItems,
    render: renderItems,
  },
});
