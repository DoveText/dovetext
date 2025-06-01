'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Spinner } from '@/components/common/Spinner';

// Dynamically import the MDX Editor to avoid SSR issues
const MDXEditorComponent = dynamic(
  () => import('@mdxeditor/editor').then(mod => mod.MDXEditor),
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

export interface MarkdownEditorProps {
  initialContent?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

// Create a simple editor component that loads on client-side only
const SimpleMDXEditor = dynamic(
  async () => {
    const mod = await import('@mdxeditor/editor');
    const { MDXEditor } = mod;
    
    // Create a component that uses the basic MDXEditor
    return function SimpleMDXEditorComponent({
      markdown,
      onChange,
      placeholder
    }: {
      markdown: string;
      onChange: (markdown: string) => void;
      placeholder: string;
    }) {
      return (
        <MDXEditor
          markdown={markdown}
          onChange={onChange}
          placeholder={placeholder}
          contentEditableClassName="prose max-w-none p-4 min-h-[300px] focus:outline-none"
        />
      );
    };
  },
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

export function MarkdownEditor({
  initialContent = '',
  onChange,
  placeholder = 'Start writing...',
  className = '',
  minHeight = '400px'
}: MarkdownEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [isClient, setIsClient] = useState(false);

  // This ensures the component only renders on the client
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleChange = (value: string) => {
    setContent(value);
    if (onChange) {
      onChange(value);
    }
  };

  if (!isClient) {
    return (
      <div className={`border rounded-md p-4 w-full bg-gray-50 ${className}`} style={{ minHeight }}>
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`markdown-editor ${className}`} style={{ minHeight }}>
      {isClient && (
        <SimpleMDXEditor 
          markdown={content} 
          onChange={handleChange} 
          placeholder={placeholder} 
        />
      )}
    </div>
  );
}

export default MarkdownEditor;
