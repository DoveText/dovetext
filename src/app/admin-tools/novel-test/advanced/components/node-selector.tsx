'use client';

import React from 'react';
import { EditorBubbleItem, useEditor } from 'novel';

export interface SelectorItem {
  name: string;
  icon: React.ReactNode;
  command: (editor: any) => void;
  isActive: (editor: any) => boolean;
}

interface NodeSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NodeSelector = ({ open, onOpenChange }: NodeSelectorProps) => {
  const { editor } = useEditor();
  
  if (!editor) return null;
  
  const items: SelectorItem[] = [
    {
      name: "Text",
      icon: <span className="text-base">T</span>,
      command: (editor) => editor.chain().focus().setParagraph().run(),
      isActive: (editor) => editor.isActive("paragraph") && !editor.isActive("bulletList") && !editor.isActive("orderedList"),
    },
    {
      name: "Heading 1",
      icon: <span className="font-bold">H1</span>,
      command: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      isActive: (editor) => editor.isActive("heading", { level: 1 }),
    },
    {
      name: "Heading 2",
      icon: <span className="font-bold">H2</span>,
      command: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: (editor) => editor.isActive("heading", { level: 2 }),
    },
    {
      name: "Heading 3",
      icon: <span className="font-bold">H3</span>,
      command: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      isActive: (editor) => editor.isActive("heading", { level: 3 }),
    },
    {
      name: "Bullet List",
      icon: <span>•</span>,
      command: (editor) => editor.chain().focus().toggleBulletList().run(),
      isActive: (editor) => editor.isActive("bulletList"),
    },
    {
      name: "Numbered List",
      icon: <span>1.</span>,
      command: (editor) => editor.chain().focus().toggleOrderedList().run(),
      isActive: (editor) => editor.isActive("orderedList"),
    },
    {
      name: "Quote",
      icon: <span>"</span>,
      command: (editor) => editor.chain().focus().toggleBlockquote().run(),
      isActive: (editor) => editor.isActive("blockquote"),
    },
    {
      name: "Code Block",
      icon: <span className="font-mono">{ }</span>,
      command: (editor) => editor.chain().focus().toggleCodeBlock().run(),
      isActive: (editor) => editor.isActive("codeBlock"),
    },
  ];

  const activeItem = items.find((item) => item.isActive(editor));

  return (
    <div className="relative">
      <button
        onClick={() => onOpenChange(!open)}
        className="flex h-10 items-center gap-1 rounded-md p-2 text-sm font-medium hover:bg-stone-100 active:bg-stone-200"
      >
        <span>{activeItem?.icon}</span>
        <span>{activeItem?.name || "Paragraph"}</span>
        <span>▼</span>
      </button>
      
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-48 rounded-md border border-stone-200 bg-white p-1 shadow-md">
          {items.map((item, index) => (
            <EditorBubbleItem
              key={index}
              onSelect={() => {
                item.command(editor);
                onOpenChange(false);
              }}
            >
              <button
                className={`flex w-full items-center gap-2 rounded-md p-2 text-sm hover:bg-stone-100 ${
                  item.isActive(editor) ? "bg-stone-100" : ""
                }`}
              >
                <div className="flex h-5 w-5 items-center justify-center">
                  {item.icon}
                </div>
                <span>{item.name}</span>
              </button>
            </EditorBubbleItem>
          ))}
        </div>
      )}
    </div>
  );
};
