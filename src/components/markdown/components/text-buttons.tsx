'use client';

import React from 'react';
import { EditorBubbleItem, useEditor } from 'novel';

// Define the type for toolbar items
interface ToolbarItem {
  name: string;
  isActive: (editor: any) => boolean;
  command: (editor: any) => void;
  icon: React.ReactNode;
}

export const TextButtons = () => {
  const { editor } = useEditor();
  if (!editor) return null;
  
  const items: ToolbarItem[] = [
    {
      name: "bold",
      isActive: (editor) => editor.isActive("bold"),
      command: (editor) => editor.chain().focus().toggleBold().run(),
      icon: <span className="font-bold">B</span>,
    },
    {
      name: "italic",
      isActive: (editor) => editor.isActive("italic"),
      command: (editor) => editor.chain().focus().toggleItalic().run(),
      icon: <span className="italic">I</span>,
    },
    {
      name: "underline",
      isActive: (editor) => editor.isActive("underline"),
      command: (editor) => editor.chain().focus().toggleUnderline().run(),
      icon: <span className="underline">U</span>,
    },
    {
      name: "strike",
      isActive: (editor) => editor.isActive("strike"),
      command: (editor) => editor.chain().focus().toggleStrike().run(),
      icon: <span className="line-through">S</span>,
    },
    {
      name: "code",
      isActive: (editor) => editor.isActive("code"),
      command: (editor) => editor.chain().focus().toggleCode().run(),
      icon: <span className="font-mono">{'<>'}</span>,
    },
  ];
  
  return (
    <div className="flex">
      {items.map((item, index) => (
        <EditorBubbleItem
          key={index}
          onSelect={(editor) => {
            item.command(editor);
          }}
        >
          <button 
            className={`p-2 text-stone-600 hover:bg-stone-100 hover:text-stone-900 ${
              item.isActive(editor) ? 'bg-stone-100 text-stone-900' : ''
            }`}
          >
            {item.icon}
          </button>
        </EditorBubbleItem>
      ))}
    </div>
  );
};
