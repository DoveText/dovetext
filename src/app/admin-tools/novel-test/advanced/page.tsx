'use client';

import React, { useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Editor from './editor';

export default function AdvancedNovelTestPage() {
  return (
    <ProtectedRoute>
      <AdvancedNovelTest />
    </ProtectedRoute>
  );
}

function AdvancedNovelTest() {
  const [content, setContent] = useState<string>('');

  const handleContentChange = (html: string) => {
    setContent(html);
  };

  // Initial content for the editor
  const initialContent = {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 1 },
        content: [{ type: 'text', text: 'Advanced Novel Editor' }]
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'This is a full-featured editor with slash commands and a formatting toolbar.' }]
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Try the following:' }]
      },
      {
        type: 'bulletList',
        content: [
          {
            type: 'listItem',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Type / to see available commands' }] }]
          },
          {
            type: 'listItem',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Select text to see the formatting toolbar' }] }]
          },
          {
            type: 'listItem',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Click on the AI menu to generate content' }] }]
          }
        ]
      },
      {
        type: 'paragraph',
      }
    ]
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Advanced Novel Editor</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Full-Featured Editor with Slash Commands and Toolbar</h2>
        
        <div className="border rounded-md">
          <Editor 
            initialContent={initialContent}
            onChange={handleContentChange}
            placeholder="Start writing... (Type / for commands)"
            minHeight="600px"
          />
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
