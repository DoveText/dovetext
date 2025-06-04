'use client';

import React from 'react';
import {
  Command,
  createSuggestionItems,
  renderItems
} from 'novel';
import { aiApi } from '@/app/admin-tools/api/ai';

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
    command: async ({ editor, range }) => {
      try {
        // Delete the slash command text
        editor.chain().focus().deleteRange(range).run();
        
        // Insert a loading text (as plain text, not HTML)
        const loadingText = "Generating content...";
        const { from } = editor.state.selection;
        editor.chain().focus().insertContent(loadingText).run();
        
        // Get the current content for context
        const currentContent = editor.getText().replace(loadingText, "");
        
        // Call the AI API
        const result = await aiApi.generateContent({ 
          prompt: "Generate content about: " + currentContent.substring(0, 100) 
        });
        
        // Find and remove the loading text
        const currentPos = editor.state.selection.from;
        const startPos = currentPos - loadingText.length;
        
        // Replace the loading text with the generated content
        editor.chain()
          .focus()
          .deleteRange({ from: startPos, to: currentPos })
          .insertContent(result.content)
          .run();
      } catch (error) {
        console.error('Error generating content:', error);
        // Find and remove any loading text that might still be there
        const doc = editor.state.doc;
        let loadingPos = -1;
        
        doc.descendants((node, pos) => {
          if (node.type.name === 'text' && node.text?.includes('Generating content...')) {
            loadingPos = pos;
            return false;
          }
          return true;
        });
        
        if (loadingPos >= 0) {
          editor.chain().focus()
            .deleteRange({ from: loadingPos, to: loadingPos + 'Generating content...'.length })
            .insertContent('**Error:** Failed to generate content.')
            .run();
        } else {
          editor.chain().focus().insertContent('\n\n**Error:** Failed to generate content.').run();
        }
      }
    },
  },
  {
    title: "Refine Content",
    description: "Improve clarity and readability",
    searchTerms: ["refine", "improve", "clarity"],
    icon: <span className="flex h-6 w-6 items-center justify-center text-lg">🔍</span>,
    command: async ({ editor, range }) => {
      try {
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
        
        // Insert a loading text (as plain text, not HTML)
        const loadingText = "Refining content...";
        const { from } = editor.state.selection;
        editor.chain().focus().insertContent(loadingText).run();
        
        // Call the AI API
        const result = await aiApi.refineContent({ 
          content: contentToRefine.replace(loadingText, ""),
          instructions: "Improve clarity and readability" 
        });
        
        // Find and remove the loading text
        const currentPos = editor.state.selection.from;
        const startPos = currentPos - loadingText.length;
        
        // Remove the loading text
        editor.chain().focus().deleteRange({ from: startPos, to: currentPos }).run();
        
        // Handle the refined content
        if (hasSelection) {
          // Replace selection with refined content
          editor.chain().focus().deleteSelection().insertContent(result.refined_content).run();
        } else {
          // Replace entire content
          editor.commands.setContent(result.refined_content);
        }
      } catch (error) {
        console.error('Error refining content:', error);
        // Find and remove any loading text that might still be there
        const doc = editor.state.doc;
        let loadingPos = -1;
        
        doc.descendants((node, pos) => {
          if (node.type.name === 'text' && node.text?.includes('Refining content...')) {
            loadingPos = pos;
            return false;
          }
          return true;
        });
        
        if (loadingPos >= 0) {
          editor.chain().focus()
            .deleteRange({ from: loadingPos, to: loadingPos + 'Refining content...'.length })
            .insertContent('**Error:** Failed to refine content.')
            .run();
        } else {
          editor.chain().focus().insertContent('\n\n**Error:** Failed to refine content.').run();
        }
      }
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
    command: async ({ editor, range }) => {
      try {
        // Delete the slash command text
        editor.chain().focus().deleteRange(range).run();
        
        // Insert a loading text (as plain text, not HTML)
        const loadingText = "Creating outline...";
        const { from } = editor.state.selection;
        editor.chain().focus().insertContent(loadingText).run();
        
        // Get the current content for context
        const currentContent = editor.getText().replace(loadingText, "");
        
        // Call the AI API
        const result = await aiApi.generateSchema({ 
          topic: currentContent.substring(0, 100),
          description: "Create a document outline" 
        });
        
        // Find and remove the loading text
        const currentPos = editor.state.selection.from;
        const startPos = currentPos - loadingText.length;
        
        // Replace the loading text with the schema
        editor.chain()
          .focus()
          .deleteRange({ from: startPos, to: currentPos })
          .insertContent(result.schema)
          .run();
      } catch (error) {
        console.error('Error generating schema:', error);
        // Find and remove any loading text that might still be there
        const doc = editor.state.doc;
        let loadingPos = -1;
        
        doc.descendants((node, pos) => {
          if (node.type.name === 'text' && node.text?.includes('Creating outline...')) {
            loadingPos = pos;
            return false;
          }
          return true;
        });
        
        if (loadingPos >= 0) {
          editor.chain().focus()
            .deleteRange({ from: loadingPos, to: loadingPos + 'Creating outline...'.length })
            .insertContent('**Error:** Failed to generate outline.')
            .run();
        } else {
          editor.chain().focus().insertContent('\n\n**Error:** Failed to generate outline.').run();
        }
      }
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
