'use client';

import React from 'react';
import {
  Command,
  createSuggestionItems,
  renderItems
} from 'novel';
import { aiApi } from '@/app/admin-tools/api/ai';
import { marked } from 'marked';
import { isHeading, isParagraph, isParagraphEmpty, selectionContainsHeading } from '../utils/editor-state';
import { isAICommand, isAICommandEnabled, getAICommandTitles } from '../utils/command-registry';
import { Editor } from '@tiptap/react';

// Define proper types for suggestion items
interface CommandItemProps {
  editor: Editor;
  range: any; // Using any for range since we don't have access to the proper Range type from Novel
}

interface SuggestionItem {
  title: string;
  description: string;
  searchTerms: string[];
  icon: React.ReactNode;
  command: (props: CommandItemProps) => void;
}

// Define base slash command suggestions
const baseItems: SuggestionItem[] = [
  {
    title: "Generate Content",
    description: "Generate content using AI",
    searchTerms: ["generate", "ai", "content"],
    icon: <span className="flex h-6 w-6 items-center justify-center text-lg">⚡</span>,
    command: ({ editor, range }: CommandItemProps) => {
      // Delete the slash command text
      editor.chain().focus().deleteRange(range).run();
      
      // Get the current content for context
      const currentContent = editor.getText();
      
      // Dispatch a custom event to open the AI command dialog
      const event = new CustomEvent('ai-command-dialog', {
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
    command: ({ editor, range }: CommandItemProps) => {
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
      const event = new CustomEvent('ai-command-dialog', {
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
    command: ({ editor, range }: CommandItemProps) => {
      // Delete the slash command text
      editor.chain().focus().deleteRange(range).run();

      // Get the current content for context
      const currentContent = editor.getText();

      if (!currentContent.trim()) {
        editor.chain().focus().insertContent('Please add some content to summarize.').run();
        return;
      }

      // Dispatch a custom event to open the AI command dialog
      const event = new CustomEvent('ai-command-dialog', {
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
    command: ({ editor, range }: CommandItemProps) => {
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
    command: ({ editor, range }: CommandItemProps) => {
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
    command: ({ editor, range }: CommandItemProps) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: "Numbered List",
    description: "Create a numbered list",
    searchTerms: ["numbered", "list", "ordered"],
    icon: <span className="flex h-6 w-6 items-center justify-center">1.</span>,
    command: ({ editor, range }: CommandItemProps) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    title: "Code Block",
    description: "Add a code block",
    searchTerms: ["code", "codeblock"],
    icon: <span className="flex h-6 w-6 items-center justify-center font-mono">{ }</span>,
    command: ({ editor, range }: CommandItemProps) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
    },
  },
  {
    title: "Quote",
    description: "Add a quote or citation",
    searchTerms: ["quote", "blockquote"],
    icon: <span className="flex h-6 w-6 items-center justify-center">"</span>,
    command: ({ editor, range }: CommandItemProps) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    },
  },
  {
    title: "Create Outline",
    description: "Generate a document outline",
    searchTerms: ["outline", "schema", "structure"],
    icon: <span className="flex h-6 w-6 items-center justify-center">📋</span>,
    command: ({ editor, range }: CommandItemProps) => {
      // Delete the slash command text
      editor.chain().focus().deleteRange(range).run();
      
      // Get the current content for context
      const currentContent = editor.getText();
      
      if (!currentContent.trim()) {
        editor.chain().focus().insertContent('Please add some content to create a schema for.').run();
        return;
      }
      
      // Dispatch a custom event to open the AI command dialog
      const event = new CustomEvent('ai-command-dialog', {
        detail: {
          commandType: 'schema',
          initialContent: currentContent
        }
      });
      document.dispatchEvent(event);
    },
  },
];

// Using shared editor state utility functions from utils/editor-state.ts

// Export the base suggestion items for use in other components
export const suggestionItems = createSuggestionItems(baseItems);

// Function to get filtered suggestion items based on editor state
const getFilteredSuggestionItems = (editor: Editor | null) => {
  // If editor is null, only include non-AI commands
  if (!editor) {
    const nonAiCommands = baseItems.filter(item => !isAICommand(item.title));
    return createSuggestionItems(nonAiCommands);
  }
  
  // Log which commands are available for debugging
  console.log('------- Slash Command Menu Status -------');
  baseItems.forEach(item => {
    if (isAICommand(item.title)) {
      console.log(`${item.title}: ${isAICommandEnabled(item.title, editor) ? 'Enabled' : 'Disabled'}`);
    }
  });
  console.log('---------------------------------------');
  
  // Filter out disabled AI commands
  const filteredItems = baseItems.filter(item => {
    // Only filter AI commands, always show formatting commands
    if (isAICommand(item.title)) {
      return isAICommandEnabled(item.title, editor);
    }
    return true;
  });
  
  return createSuggestionItems(filteredItems);
};

// Export the isAICommandEnabled function from command-registry for use in other components
export { isAICommandEnabled } from '../utils/command-registry';

// Create a custom render function with logging
const customRenderItems = (props: any) => {
  console.log('Rendering slash command menu with props:', props);
  
  // Extract the selectItem function from props
  const { selectItem } = props;
  
  // Create a wrapped version of selectItem that logs
  const wrappedSelectItem = (item: any) => {
    console.log('Item selected:', item);
    // Call the original selectItem
    selectItem(item);
  };
  
  // Create modified props with our wrapped selectItem
  const modifiedProps = {
    ...props,
    selectItem: wrappedSelectItem,
    // Add a keydown handler to the list
    onKeyDown: (event: KeyboardEvent) => {
      console.log('Key pressed in menu:', event.key);
      if (event.key === 'Enter' && props.items && props.items.length > 0) {
        console.log('Enter pressed with items available');
        // If there's a selected item, execute its command
        if (props.selectedIndex !== undefined && props.selectedIndex >= 0) {
          const selectedItem = props.items[props.selectedIndex];
          console.log('Selected item:', selectedItem);
          if (selectedItem && selectedItem.command) {
            console.log('Executing command for:', selectedItem.title);
            event.preventDefault();
            event.stopPropagation();
            selectedItem.command({
              editor: props.editor,
              range: props.range
            });
            props.command(selectedItem);
            return true;
          }
        }
      }
      // Let the original handler deal with it
      if (props.onKeyDown) {
        return props.onKeyDown(event);
      }
      return false;
    }
  };
  
  // Call the original renderItems with our modified props
  return renderItems(modifiedProps);
};

// Create the slash command extension with context-aware filtering
export const slashCommand = Command.configure({
  suggestion: {
    items: ({ editor }: { editor: Editor }) => {
      console.log('Slash command items requested');
      return getFilteredSuggestionItems(editor);
    },
    render: customRenderItems,
    // This is the handler that's called when a command is selected
    command: ({ editor, range, props }: { editor: Editor, range: any, props: any }) => {
      console.log('Command handler called with props:', props);
      // The command function is called when an item is selected
      if (props && props.command) {
        try {
          console.log('Executing command for:', props.title);
          props.command({ editor, range });
          console.log('Command executed successfully');
          return true;
        } catch (error) {
          console.error('Error executing command:', error);
          return false;
        }
      }
      console.log('No command found in props');
      return false;
    }
  },
});
