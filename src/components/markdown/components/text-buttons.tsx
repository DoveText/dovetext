'use client';

import React from 'react';
import { EditorBubbleItem, useEditor } from 'novel';
import { Tooltip as ReactTippyTooltip } from 'react-tippy';
import 'react-tippy/dist/tippy.css';

// Create a wrapper component for Tooltip to fix TypeScript issues
const Tooltip = ({ children, ...props }: { children: React.ReactNode } & any) => {
  return <ReactTippyTooltip {...props}>{children}</ReactTippyTooltip>;
};

// Define the type for toolbar items
interface ToolbarItem {
  name: string;
  tooltip: string;
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
      tooltip: "Bold",
      isActive: (editor) => editor.isActive("bold"),
      command: (editor) => editor.chain().focus().toggleBold().run(),
      icon: <span className="font-bold">B</span>,
    },
    {
      name: "italic",
      tooltip: "Italic",
      isActive: (editor) => editor.isActive("italic"),
      command: (editor) => editor.chain().focus().toggleItalic().run(),
      icon: <span className="italic">I</span>,
    },
    {
      name: "underline",
      tooltip: "Underline",
      isActive: (editor) => editor.isActive("underline"),
      command: (editor) => editor.chain().focus().toggleUnderline().run(),
      icon: <span className="underline">U</span>,
    },
    {
      name: "strike",
      tooltip: "Strikethrough",
      isActive: (editor) => editor.isActive("strike"),
      command: (editor) => editor.chain().focus().toggleStrike().run(),
      icon: <span className="line-through">S</span>,
    },
    {
      name: "code",
      tooltip: "Code",
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
          <Tooltip
            title={item.tooltip}
            position="bottom"
            animation="fade"
            arrow={true}
            delay={100}
            distance={10}
            theme="dark"
            hideOnClick={false}
          >
            <button 
              className={`p-2 text-stone-600 hover:bg-stone-100 hover:text-stone-900 ${
                item.isActive(editor) ? 'bg-stone-100 text-stone-900' : ''
              }`}
              aria-label={item.tooltip}
            >
              {item.icon}
              <span className="sr-only">{item.tooltip}</span>
            </button>
          </Tooltip>
        </EditorBubbleItem>
      ))}
    </div>
  );
};
