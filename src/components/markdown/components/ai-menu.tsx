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
    <div className="flex">
      <button
        className="flex h-9 w-9 items-center justify-center rounded-md p-2 text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-500"
        onClick={onGenerateContent}
      >
        ✨
        <span className="sr-only">Generate Content</span>
      </button>
      <button
        className="flex h-9 w-9 items-center justify-center rounded-md p-2 text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-500"
        onClick={onRefineContent}
      >
        ✏️
        <span className="sr-only">Refine Content</span>
      </button>
      <button
        className="flex h-9 w-9 items-center justify-center rounded-md p-2 text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-500"
        onClick={onCreateSchema}
      >
        📋
        <span className="sr-only">Create Outline</span>
      </button>
    </div>
  );
};

export default AIMenu;
