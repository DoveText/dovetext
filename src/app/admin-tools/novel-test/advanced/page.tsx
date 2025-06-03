'use client';

import React, { useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Editor } from './editor';

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

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Advanced Novel Editor Test</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Novel Editor with Best Practices</h2>
        
        <div className="border rounded-md p-4">
          <Editor 
            initialContent="This is a test of the Novel editor with best practices. Try typing here..."
            onChange={handleContentChange}
            placeholder="Start writing..."
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
