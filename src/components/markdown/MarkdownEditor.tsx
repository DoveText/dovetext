'use client';

import React, { useState, useEffect } from 'react';
import { MDXEditor } from '@mdxeditor/editor';
import { Spinner } from '@/components/common/Spinner';

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
        <div className="flex items-center justify-center h-full">
          <Spinner />
          <span className="ml-2 text-gray-500">Loading editor...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`markdown-editor ${className}`} style={{ minHeight }}>
      {isClient && (
        <MDXEditor
          markdown={content}
          onChange={handleChange}
          placeholder={placeholder}
          contentEditableClassName="prose max-w-none p-4 min-h-[300px] focus:outline-none"
        />
      )}
    </div>
  );
}

export default MarkdownEditor;
