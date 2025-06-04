'use client';

import React from 'react';
import {
  Command,
  createSuggestionItems,
  renderItems
} from 'novel';

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
]);

// Create the slash command extension
export const slashCommand = Command.configure({
  suggestion: {
    items: () => suggestionItems,
    render: renderItems,
  },
});
