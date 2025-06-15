'use client';

import {
  StarterKit,
  TiptapLink,
  TiptapUnderline,
  HighlightExtension,
  Placeholder,
  UpdatedImage,
  Command,
  createSuggestionItems,
  renderItems
} from 'novel';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';

// Define default extensions to be used in the editor
export const defaultExtensions = [
  StarterKit.configure({
    heading: {
      levels: [1, 2, 3],
    },
  }),
  TiptapLink.configure({
    openOnClick: false,
    HTMLAttributes: {
      class: 'text-primary underline',
    },
  }),
  TiptapUnderline,
  HighlightExtension,
  Placeholder.configure({
    placeholder: ({ node }) => {
      if (node.type.name === 'heading') {
        return `Heading ${node.attrs.level}`;
      }
      return 'Press "/" for commands...';
    },
    showOnlyCurrent: true, // Only show placeholder on the current/active node
    showOnlyWhenEditable: true,
    includeChildren: true,
    emptyNodeClass: 'is-empty',
    emptyEditorClass: 'is-editor-empty',
  }),
  UpdatedImage,
  // Add TaskList and TaskItem extensions for task list support
  TaskList.configure({
    HTMLAttributes: {
      class: 'task-list',
    },
  }),
  TaskItem.configure({
    HTMLAttributes: {
      class: 'task-item',
    },
    nested: true,
  }),
];
