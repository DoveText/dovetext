'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import {
  EditorRoot,
  EditorContent,
  EditorCommand,
  EditorCommandItem,
  EditorCommandEmpty,
  HorizontalRule,
  HighlightExtension,
  Placeholder,
  UpdatedImage
} from 'novel';
import { JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import { useEditor, Editor as TiptapEditor } from '@tiptap/react';

interface EditorProps {
  initialContent?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

export function Editor({
  initialContent = '',
  onChange,
  placeholder = 'Start writing...',
  className = '',
  minHeight = '300px'
}: EditorProps) {
  // Convert initial content to JSONContent format
  const getInitialContent = useCallback((): JSONContent => {
    if (!initialContent || initialContent.trim() === '') {
      return {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
          }
        ]
      };
    }
    
    return {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: initialContent }]
        }
      ]
    };
  }, [initialContent]);

  return (
    <div className={`novel-editor-wrapper ${className}`} style={{ minHeight }}>
      <EditorRoot>
        <EditorContent
          initialContent={getInitialContent()}
          extensions={[
            StarterKit.configure({
              heading: {
                levels: [1, 2, 3, 4, 5, 6],
              },
            }),
            Placeholder.configure({
              placeholder,
            }),
            Link.configure({
              openOnClick: false,
              HTMLAttributes: {
                class: 'text-primary underline',
              },
            }),
            Underline,
            HighlightExtension,
            HorizontalRule,
            UpdatedImage,
          ]}
          className="min-h-[300px] prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none"
          editorProps={{
            attributes: {
              class: "prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none p-4",
            },
          }}
          onUpdate={({ editor }) => {
            if (onChange) {
              onChange(editor.getHTML());
            }
          }}
        />
        
        {/* Command menu for slash commands */}
        <EditorCommand className="z-50 h-auto max-h-[330px] w-72 overflow-y-auto rounded-md border border-muted bg-background px-1 py-2 shadow-md transition-all">
          <EditorCommandEmpty>No results</EditorCommandEmpty>
          <EditorCommandItem
            onCommand={({ editor }) => {
              editor.chain().focus().toggleHeading({ level: 1 }).run();
            }}
          >
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-muted bg-background">
                H1
              </div>
              <div>
                <p className="font-medium">Heading 1</p>
                <p className="text-sm text-muted-foreground">
                  Large section heading
                </p>
              </div>
            </div>
          </EditorCommandItem>
          <EditorCommandItem
            onCommand={({ editor }) => {
              editor.chain().focus().toggleHeading({ level: 2 }).run();
            }}
          >
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-muted bg-background">
                H2
              </div>
              <div>
                <p className="font-medium">Heading 2</p>
                <p className="text-sm text-muted-foreground">
                  Medium section heading
                </p>
              </div>
            </div>
          </EditorCommandItem>
          <EditorCommandItem
            onCommand={({ editor }) => {
              editor.chain().focus().toggleBulletList().run();
            }}
          >
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-muted bg-background">
                •
              </div>
              <div>
                <p className="font-medium">Bullet List</p>
                <p className="text-sm text-muted-foreground">
                  Create a simple bullet list
                </p>
              </div>
            </div>
          </EditorCommandItem>
        </EditorCommand>
      </EditorRoot>
    </div>
  );
}
