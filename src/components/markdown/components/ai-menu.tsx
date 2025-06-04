'use client';

import React from 'react';
import { useEditor } from 'novel';

interface AIMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AIMenu = ({ open, onOpenChange }: AIMenuProps) => {
  const { editor } = useEditor();

  if (!editor) return null;

  const handleGenerateContent = () => {
    // Simulate AI generation
    editor.chain().focus().insertContent("**AI Generated Content:** This is simulated AI-generated content.").run();
    onOpenChange(false);
  };

  const handleRefineContent = () => {
    // Simulate AI refinement
    editor.chain().focus().insertContent("**AI Refined Content:** This content has been refined for clarity and impact.").run();
    onOpenChange(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => onOpenChange(!open)}
        className="flex h-10 items-center gap-1 rounded-md p-2 text-sm font-medium hover:bg-stone-100 active:bg-stone-200"
      >
        <span>✨</span>
        <span>AI</span>
        <span>▼</span>
      </button>
      
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-48 rounded-md border border-stone-200 bg-white p-1 shadow-md">
          <button
            onClick={handleGenerateContent}
            className="flex w-full items-center gap-2 rounded-md p-2 text-sm hover:bg-stone-100"
          >
            <div className="flex h-5 w-5 items-center justify-center">
              <span>✨</span>
            </div>
            <span>Generate Content</span>
          </button>
          
          <button
            onClick={handleRefineContent}
            className="flex w-full items-center gap-2 rounded-md p-2 text-sm hover:bg-stone-100"
          >
            <div className="flex h-5 w-5 items-center justify-center">
              <span>🔍</span>
            </div>
            <span>Refine Content</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default AIMenu;
