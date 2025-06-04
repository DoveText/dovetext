'use client';

import React from 'react';
import { Editor } from '@tiptap/react';

interface AIMenuProps {
  editor: Editor;
  onGenerateContent: () => void;
  onRefineContent: () => void;
  onCreateSchema: () => void;
}

const AIMenu = ({ onGenerateContent, onRefineContent, onCreateSchema }: AIMenuProps) => {
  return (
    <div className="flex flex-nowrap min-w-fit whitespace-nowrap pt-1 pl-1">
      <button
        className="inline-flex h-8 w-8 items-center justify-center rounded-md p-1 text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-500 flex-shrink-0"
        onClick={onGenerateContent}
        title="Generate Content"
      >
        ✨
        <span className="sr-only">Generate Content</span>
      </button>
      <button
        className="inline-flex h-8 w-8 items-center justify-center rounded-md p-1 text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-500 flex-shrink-0"
        onClick={onRefineContent}
        title="Refine Content"
      >
        ✏️
        <span className="sr-only">Refine Content</span>
      </button>
      <button
        className="inline-flex h-8 w-8 items-center justify-center rounded-md p-1 text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-500 flex-shrink-0"
        onClick={onCreateSchema}
        title="Create Outline"
      >
        📋
        <span className="sr-only">Create Outline</span>
      </button>
    </div>
  );
};

export default AIMenu;
