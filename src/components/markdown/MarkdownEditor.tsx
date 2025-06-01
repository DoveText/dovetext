'use client';

import React, { useState, useEffect, useRef } from 'react';
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

// Define AI actions for the dropdown menu
const AI_ACTIONS = [
  { id: 'generate', label: 'Generate Content', icon: '✨' },
  { id: 'refine', label: 'Refine Content', icon: '🔍' },
  { id: 'schema', label: 'Create Schema', icon: '📋' },
  { id: 'summarize', label: 'Summarize', icon: '📝' },
  { id: 'translate', label: 'Translate', icon: '🌐' },
];

// Note: CSS is imported in globals.css

export interface MarkdownEditorProps {
  initialContent?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

// Custom component for AI dropdown menu
const AIDropdownMenu = ({ 
  show, 
  onClose, 
  onSelectAction, 
  actionInProgress,
  position
}: { 
  show: boolean; 
  onClose: () => void; 
  onSelectAction: (actionId: string) => void; 
  actionInProgress: string | null;
  position: { top: number; right: number; }
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle clicks outside the dropdown to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  if (!show) return null;

  return (
    <div 
      ref={dropdownRef}
      className="absolute z-10 bg-white shadow-lg rounded-md border border-gray-200 py-1 w-48"
      style={{ top: `${position.top}px`, right: `${position.right}px` }}
    >
      {AI_ACTIONS.map(action => (
        <button
          key={action.id}
          onClick={() => onSelectAction(action.id)}
          className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center"
          disabled={!!actionInProgress}
        >
          <span className="mr-2">{action.icon}</span>
          {action.label}
        </button>
      ))}
    </div>
  );
};

// Main MarkdownEditor component
export function MarkdownEditor({
  initialContent = '',
  onChange,
  placeholder = 'Start writing...',
  className = '',
  minHeight = '400px'
}: MarkdownEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [isClient, setIsClient] = useState(false);
  const [showAIDropdown, setShowAIDropdown] = useState(false);
  const [aiActionInProgress, setAiActionInProgress] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 40, right: 10 });
  const editorRef = useRef<HTMLDivElement>(null);
  const aiButtonRef = useRef<HTMLButtonElement>(null);

  // Handle client-side rendering
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Update local content when initialContent prop changes
  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  // Handle AI button click
  const handleAIButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Calculate dropdown position based on button position
    if (aiButtonRef.current) {
      const rect = aiButtonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.height + 5,
        right: 5
      });
    }
    
    setShowAIDropdown(prev => !prev);
  };

  // Handle AI action
  const handleAIAction = async (actionId: string) => {
    setShowAIDropdown(false);
    setAiActionInProgress(actionId);
    
    try {
      // Here you would implement the actual AI functionality
      // For now, we'll just simulate a delay and add some placeholder text
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      let newContent = content;
      switch (actionId) {
        case 'generate':
          newContent = content + '\n\n## AI Generated Content\nThis is some AI-generated content that would be created based on your prompt or context.\n';
          break;
        case 'refine':
          newContent = content + '\n\n*This content has been refined by AI to improve clarity and readability.*\n';
          break;
        case 'schema':
          newContent = content + '\n\n```json\n{\n  "title": "Sample Schema",\n  "type": "object",\n  "properties": {\n    "name": { "type": "string" },\n    "description": { "type": "string" },\n    "isActive": { "type": "boolean" }\n  }\n}\n```\n';
          break;
        case 'summarize':
          newContent = content + '\n\n**Summary:** This is an AI-generated summary of the content above.\n';
          break;
        case 'translate':
          newContent = content + '\n\n*Translated version:*\nThis would be the translated content in another language.\n';
          break;
      }
      
      setContent(newContent);
      if (onChange) {
        onChange(newContent);
      }
    } catch (error) {
      console.error('AI action failed:', error);
    } finally {
      setAiActionInProgress(null);
    }
  };

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
    <div className={`markdown-editor relative ${className}`} style={{ minHeight }} ref={editorRef}>
      {/* Custom AI Button */}
      <div className="relative">
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
        
        {/* Overlay AI Button */}
        <button
          ref={aiButtonRef}
          className="absolute top-0 right-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded px-3 py-1 flex items-center space-x-1 my-1 z-10"
          onClick={handleAIButtonClick}
          style={{ height: '30px' }}
        >
          <span className="text-sm">✨</span>
          <span className="text-sm font-medium">AI</span>
        </button>
      </div>
      
      {/* AI Dropdown Menu */}
      <AIDropdownMenu 
        show={showAIDropdown}
        onClose={() => setShowAIDropdown(false)}
        onSelectAction={handleAIAction}
        actionInProgress={aiActionInProgress}
        position={dropdownPosition}
      />
      
      {/* AI Action Progress Indicator */}
      {aiActionInProgress && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-20">
          <div className="bg-white p-4 rounded-lg shadow-lg flex flex-col items-center">
            <Spinner />
            <span className="mt-2 text-gray-700">
              {AI_ACTIONS.find(a => a.id === aiActionInProgress)?.label} in progress...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default MarkdownEditor;
