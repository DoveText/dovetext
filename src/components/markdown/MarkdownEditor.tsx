'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Spinner } from '@/components/common/Spinner';

// Import SimpleMDE dynamically to avoid SSR issues with navigator object
const SimpleMDEEditor = dynamic(
  () => import('react-simplemde-editor'),
  {
    ssr: false,
    loading: () => (
      <div className="border rounded-md p-4 w-full h-64 flex items-center justify-center bg-gray-50">
        <Spinner />
        <span className="ml-2 text-gray-500">Loading editor...</span>
      </div>
    )
  }
);

// Note: CSS is imported in globals.css

export interface MarkdownEditorProps {
  initialContent?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

export function MarkdownEditor({
  initialContent = '',
  onChange,
  placeholder = 'Start writing...',
  className = '',
  minHeight = '400px'
}: MarkdownEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [isClient, setIsClient] = useState(false);

  // Handle client-side rendering
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Update local content when initialContent prop changes
  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  // Show loading state during server-side rendering or when component is loading
  if (!isClient) {
    return (
      <div className={`border rounded-md p-4 w-full bg-gray-50 ${className}`} style={{ minHeight }}>
        <div className="flex items-center justify-center h-full">
          <Spinner />
          <span className="ml-2 text-gray-500">Loading editor...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`markdown-editor ${className}`} style={{ minHeight }}>
      <SimpleMDEEditor
        value={content}
        onChange={(value) => {
          setContent(value);
          if (onChange) {
            onChange(value);
          }
        }}
        options={{
          placeholder,
          spellChecker: false,
          autofocus: false,
          status: ['lines', 'words'],
          minHeight,
          toolbar: [
            'bold', 'italic', 'heading', '|',
            'quote', 'unordered-list', 'ordered-list', '|',
            'link', 'image', '|',
            'preview', 'side-by-side', 'fullscreen', '|',
            'guide'
          ]
        }}
      />
    </div>
  );
}

export default MarkdownEditor;
