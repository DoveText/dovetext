'use client';

import React, { useState } from 'react';
import MarkdownEditor from '@/components/markdown/MarkdownEditor';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// Sample markdown content to test the editor
const sampleMarkdown = `# Welcome to the AI Markdown Editor Test

This is a test page for the AIMarkdownEditor component.

## Features to test:

- **Bold text** and *italic text*
- Lists like this one
- [Links](https://example.com)
- Code blocks:

\`\`\`javascript
function testCode() {
  console.log("Hello, world!");
}
\`\`\`

### Try the slash commands

Type / to see available commands, including:
- AI content generation
- Text formatting
- Lists and headings

### Try the bubble menu

Select text to see the formatting options bubble menu.
`;

export default function TestAIMarkdownPage() {
  return (
    <ProtectedRoute>
      <TestAIMarkdown />
    </ProtectedRoute>
  );
}

function TestAIMarkdown() {
  const { user } = useAuth();
  const [content, setContent] = useState(sampleMarkdown);
  const [format, setFormat] = useState<'markdown' | 'html' | 'json'>('markdown');

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    console.log('Content updated:', newContent);
  };
  
  const handleFormatChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormat(e.target.value as 'markdown' | 'html' | 'json');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">AI Markdown Editor Test</h1>
      
      <div className="mb-4">
        <p className="text-gray-600 mb-2">This is a test page for the AIMarkdownEditor component.</p>
        <p className="text-gray-600 mb-4">Try using slash commands (type "/") and the bubble menu (select text).</p>
        
        <div className="flex items-center mb-4">
          <label htmlFor="format" className="mr-2 text-gray-700">Output Format:</label>
          <select 
            id="format" 
            value={format} 
            onChange={handleFormatChange}
            className="border border-gray-300 rounded px-2 py-1"
          >
            <option value="markdown">Markdown</option>
            <option value="html">HTML</option>
            <option value="json">JSON</option>
          </select>
        </div>
      </div>
      
      <div className="border border-gray-200 rounded-lg p-4 bg-white">
        <MarkdownEditor
          initialContent={sampleMarkdown}
          onChange={handleContentChange}
          placeholder="Start typing or use / commands..."
          minHeight="500px"
          format={format}
        />
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Current {format.toUpperCase()} Content:</h2>
        <div className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-60">
          <pre className="text-xs whitespace-pre-wrap">{content}</pre>
        </div>
      </div>
    </div>
  );
}
