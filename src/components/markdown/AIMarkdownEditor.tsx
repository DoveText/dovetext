'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  EditorRoot,
  EditorContent,
  EditorCommand,
  EditorCommandItem,
  EditorCommandEmpty,
  type EditorContentProps,
  HorizontalRule,
  HighlightExtension,
  Placeholder,
  UpdatedImage
} from 'novel';
import { JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import { aiApi } from '@/app/admin-tools/api/ai';
import { Spinner } from '@/components/common/Spinner';

// Define props interface for our component
export interface AIMarkdownEditorProps {
  initialContent?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

export function AIMarkdownEditor({
  initialContent = '',
  onChange,
  placeholder = 'Start writing...',
  className = '',
  minHeight = '400px'
}: AIMarkdownEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [isClient, setIsClient] = useState(false);
  const [aiActionInProgress, setAiActionInProgress] = useState<string | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  // Handle client-side rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Update editor content when initialContent changes significantly
  const prevInitialContentRef = useRef(initialContent);
  
  useEffect(() => {
    if (initialContent !== prevInitialContentRef.current) {
      setContent(initialContent);
      prevInitialContentRef.current = initialContent;
    }
  }, [initialContent]);
  
  // Define extensions for the editor
  const extensions = useMemo(() => [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3, 4, 5, 6],
      },
    }),
    Placeholder.configure({
      placeholder: placeholder,
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
  ], [placeholder]);
  
  // Convert initial content to JSONContent format
  const getInitialContent = useCallback((): JSONContent => {
    if (!content || content.trim() === '') {
      return {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
          }
        ]
      };
    }
    
    // Simple conversion for plain text
    // In a production app, you might want to use a proper HTML-to-JSON converter
    return {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: content }]
        }
      ]
    };
  }, [content]);

  // Handle AI actions
  const handleGenerateContent = async () => {
    setAiActionInProgress('generate');
    try {
      const generateResult = await aiApi.generateContent({ 
        prompt: "Generate content about: " + content.substring(0, 100) 
      });
      
      const newContent = content + '\n\n' + generateResult.content;
      setContent(newContent);
      
      if (onChange) {
        onChange(newContent);
      }
    } catch (error) {
      console.error('AI generation failed:', error);
    } finally {
      setAiActionInProgress(null);
    }
  };

  const handleRefineContent = async () => {
    setAiActionInProgress('refine');
    try {
      const refineResult = await aiApi.refineContent({ 
        content: content,
        instructions: "Improve clarity and readability" 
      });
      
      const newContent = refineResult.refined_content;
      setContent(newContent);
      
      if (onChange) {
        onChange(newContent);
      }
    } catch (error) {
      console.error('AI refinement failed:', error);
    } finally {
      setAiActionInProgress(null);
    }
  };

  const handleCreateSchema = async () => {
    setAiActionInProgress('schema');
    try {
      const schemaResult = await aiApi.generateSchema({ 
        topic: content.substring(0, 100),
        description: "Create a document outline" 
      });
      
      const newContent = content + '\n\n' + schemaResult.schema;
      setContent(newContent);
      
      if (onChange) {
        onChange(newContent);
      }
    } catch (error) {
      console.error('AI schema creation failed:', error);
    } finally {
      setAiActionInProgress(null);
    }
  };

  // Show loading state during server-side rendering
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

  // Custom handler for Novel's onChange
  const handleEditorChange: EditorContentProps['onUpdate'] = ({ editor }) => {
    const htmlContent = editor.getHTML();
    const textContent = editor.getText();
    setContent(htmlContent);
    
    if (onChange) {
      onChange(htmlContent);
    }
  };

  return (
    <div className={`ai-markdown-editor relative ${className}`} style={{ minHeight }} ref={editorRef}>
      <EditorRoot>
        <div className="flex justify-end mb-2 space-x-2">
          <button
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-md px-3 py-1 text-sm"
            onClick={handleGenerateContent}
            disabled={!!aiActionInProgress}
          >
            ✨ Generate
          </button>
          <button
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-md px-3 py-1 text-sm"
            onClick={handleRefineContent}
            disabled={!!aiActionInProgress}
          >
            🔍 Refine
          </button>
          <button
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-md px-3 py-1 text-sm"
            onClick={handleCreateSchema}
            disabled={!!aiActionInProgress}
          >
            📋 Schema
          </button>
        </div>
        
        <EditorContent 
          initialContent={getInitialContent()}
          onUpdate={handleEditorChange}
          extensions={extensions}
          className="min-h-[300px] prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none"
          editorProps={{
            attributes: {
              class: "prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none p-4",
            },
          }}
        />
        
        {/* AI Command Support */}
        <EditorCommand className="z-50 h-auto max-h-[330px] w-72 overflow-y-auto rounded-md border border-muted bg-background px-1 py-2 shadow-md transition-all">
          <EditorCommandEmpty>No results</EditorCommandEmpty>
          <EditorCommandItem
            onCommand={({ editor }) => {
              handleGenerateContent();
            }}
          >
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-muted bg-background">
                ✨
              </div>
              <div>
                <p className="font-medium">Generate Content</p>
                <p className="text-sm text-muted-foreground">
                  Generate content using AI
                </p>
              </div>
            </div>
          </EditorCommandItem>
          <EditorCommandItem
            onCommand={({ editor }) => {
              handleRefineContent();
            }}
          >
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-muted bg-background">
                🔍
              </div>
              <div>
                <p className="font-medium">Refine Content</p>
                <p className="text-sm text-muted-foreground">
                  Improve clarity and readability
                </p>
              </div>
            </div>
          </EditorCommandItem>
          <EditorCommandItem
            onCommand={({ editor }) => {
              handleCreateSchema();
            }}
          >
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-muted bg-background">
                📋
              </div>
              <div>
                <p className="font-medium">Create Schema</p>
                <p className="text-sm text-muted-foreground">
                  Generate a document outline
                </p>
              </div>
            </div>
          </EditorCommandItem>
        </EditorCommand>
      </EditorRoot>
      
      {/* AI Action Progress Indicator */}
      {aiActionInProgress && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-20">
          <div className="bg-white p-4 rounded-lg shadow-lg flex flex-col items-center">
            <Spinner />
            <span className="mt-2 text-gray-700">
              {aiActionInProgress === 'generate' && 'Generating content...'}
              {aiActionInProgress === 'refine' && 'Refining content...'}
              {aiActionInProgress === 'schema' && 'Creating schema...'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default AIMarkdownEditor;
