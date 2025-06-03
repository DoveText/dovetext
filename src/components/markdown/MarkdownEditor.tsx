'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Spinner } from '@/components/common/Spinner';
import { aiApi } from '@/app/admin-tools/api/ai';

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
  
  // Store a reference to the SimpleMDE instance
  const simpleMdeInstanceRef = useRef<any>(null);
  
  // Callback to get the SimpleMDE instance
  const getMdeInstanceCallback = useCallback((simpleMde: any) => {
    console.log('Got SimpleMDE instance');
    simpleMdeInstanceRef.current = simpleMde;
  }, []);

  // Handle client-side rendering
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // We no longer need this effect since we're using getMdeInstance callback
  // to get the SimpleMDE instance directly
  
  // Update editor content directly when initialContent changes significantly
  const prevInitialContentRef = useRef(initialContent);
  
  useEffect(() => {
    // Only update if this is a significant change (like switching blogs)
    if (initialContent !== prevInitialContentRef.current && simpleMdeInstanceRef.current) {
      console.log('Updating editor content directly via SimpleMDE API');
      simpleMdeInstanceRef.current.value(initialContent);
      
      // Focus the editor after content change
      setTimeout(() => {
        if (simpleMdeInstanceRef.current) {
          console.log('Focusing editor after initialContent change');
          simpleMdeInstanceRef.current.codemirror.focus();
        }
      }, 10);
      
      prevInitialContentRef.current = initialContent;
    } else if (initialContent !== prevInitialContentRef.current) {
      // Fallback if SimpleMDE instance isn't available yet
      setContent(initialContent);
      prevInitialContentRef.current = initialContent;
    }
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
      // Get current content directly from the SimpleMDE instance if available
      const currentContent = simpleMdeInstanceRef.current ? 
        simpleMdeInstanceRef.current.value() : content;
    
      let newContent = currentContent;
      let insertedText = '';
      let insertPosition = 0;
    
      switch (actionId) {
        case 'generate':
          // Use real AI API to generate content
          const generateResult = await aiApi.generateContent({ 
            prompt: "Generate content about: " + currentContent.substring(0, 100) 
          });
          insertedText = '\n\n' + generateResult.content;
          insertPosition = currentContent.length;
          newContent = currentContent + insertedText;
          break;
        case 'refine':
          // Use real AI API to refine content
          const refineResult = await aiApi.refineContent({ 
            content: currentContent,
            instructions: "Improve clarity and readability" 
          });
          newContent = refineResult.refined_content;
          break;
        case 'schema':
          // Use real AI API to generate schema
          const schemaResult = await aiApi.generateSchema({ 
            topic: currentContent.substring(0, 100),
            description: "Create a document outline" 
          });
          newContent = currentContent + '\n\n' + schemaResult.schema;
          break;
        case 'summarize':
          // For now, keep the mock implementation for summarize
          newContent = currentContent + '\n\n**Summary:** This is an AI-generated summary of the content above.\n';
          break;
        case 'translate':
          // For now, keep the mock implementation for translate
          newContent = currentContent + '\n\n*Translated version:*\nThis would be the translated content in another language.\n';
          break;
      }
    
      // Update the editor content directly using SimpleMDE's API
      if (simpleMdeInstanceRef.current) {
        console.log('Setting content via SimpleMDE API');
        simpleMdeInstanceRef.current.value(newContent);
      
        // Focus the editor after content change
        setTimeout(() => {
          if (simpleMdeInstanceRef.current) {
            const cm = simpleMdeInstanceRef.current.codemirror;
            console.log('Focusing editor after content change');
            cm.focus();
          
            // For 'generate' action, select the inserted text
            if (actionId === 'generate' && insertedText) {
              // Calculate the start and end positions for the selection
              // We need to convert string position to CodeMirror position (line, ch)
              const doc = cm.getDoc();
              const startPos = doc.posFromIndex(insertPosition);
              const endPos = doc.posFromIndex(insertPosition + insertedText.length);
            
              // Set the selection
              console.log('Selecting inserted text');
              doc.setSelection(startPos, endPos);
            }
          }
        }, 10);
      } else {
        console.log('Falling back to React state');
        // Fallback to React state if direct manipulation isn't possible
        setContent(newContent);
      }
    
      // Notify parent component of change
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
            if (onChange) {
              onChange(value);
            }
          }}
          getMdeInstance={getMdeInstanceCallback}
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
          className="absolute bg-indigo-600 hover:bg-indigo-700 text-white rounded-md px-4 py-1.5 flex items-center space-x-1.5 z-10 shadow-sm"
          onClick={handleAIButtonClick}
          style={{ 
            top: '8px',  /* Position to vertically center in toolbar */
            right: '12px', /* More spacing from the right edge */
            height: '32px' /* Slightly taller button */
          }}
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
