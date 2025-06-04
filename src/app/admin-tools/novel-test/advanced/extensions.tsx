'use client';

import {
  StarterKit,
  TiptapLink,
  TiptapUnderline,
  HorizontalRule,
  HighlightExtension,
  Placeholder,
  UpdatedImage,
  Command,
  createSuggestionItems,
  renderItems
} from 'novel';

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
  HorizontalRule,
  Placeholder.configure({
    placeholder: 'Start writing... (Type / for commands)',
  }),
  UpdatedImage,
];
