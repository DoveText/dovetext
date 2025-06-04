'use client';

import React, { useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import {
  EditorRoot,
  EditorContent,
  EditorCommand,
  EditorCommandItem,
  HorizontalRule,
  HighlightExtension,
  Placeholder,
  UpdatedImage
} from 'novel';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';

export default function NovelTestPage() {
  return (
    <ProtectedRoute>
      <NovelTest />
    </ProtectedRoute>
  );
}

function NovelTest() {
  const [content, setContent] = useState<string>('');

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Novel Editor Test</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Basic Novel Editor</h2>
        
        <div className="novel-editor-wrapper border rounded-md">
          <EditorRoot>
            <EditorContent
              initialContent={{
                type: 'doc',
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      {
                        type: 'text',
                        text: 'This is a test of the Novel editor. Try typing here...'
                      }
                    ]
                  }
                ]
              }}
              extensions={[
                StarterKit.configure({
                  heading: {
                    levels: [1, 2, 3, 4, 5, 6],
                  },
                }),
                Placeholder.configure({
                  placeholder: 'Start writing...',
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
              className="min-h-[300px]"
              editorProps={{
                attributes: {
                  class: "prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none",
                },
              }}
              onUpdate={({ editor }) => {
                setContent(editor.getHTML());
              }}
            />
          </EditorRoot>
        </div>
        
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-2">Editor Output (HTML):</h3>
          <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-[200px] text-sm">
            {content}
          </pre>
        </div>
      </div>
    </div>
  );
}
