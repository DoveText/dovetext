'use client';

import React, { useState } from 'react';
import { useEditor } from 'novel';
import { aiApi } from '@/app/admin-tools/api/ai';
import { Spinner } from '@/components/common/Spinner';

interface AIMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AIMenu = ({ open, onOpenChange }: AIMenuProps) => {
  const { editor } = useEditor();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  if (!editor) return null;

  const handleGenerateContent = async () => {
    if (!editor || isLoading) return;
    
    onOpenChange(false);
    setIsLoading('generate');
    
    try {
      // Get the current content or selection
      const currentContent = editor.getText();
      const selection = editor.state.selection;
      const hasSelection = !selection.empty;
      
      // Use the selection as context or the first 100 chars
      const context = hasSelection 
        ? editor.state.doc.textBetween(selection.from, selection.to)
        : currentContent.substring(0, 100);
      
      // Call the AI API
      const result = await aiApi.generateContent({ 
        prompt: "Generate content about: " + context 
      });
      
      // Insert the generated content
      if (hasSelection) {
        // Replace selection with generated content
        editor.chain().focus().deleteSelection().insertContent(result.content).run();
      } else {
        // Append to the end
        editor.chain().focus().insertContentAt(editor.state.doc.content.size, '\n\n' + result.content).run();
      }
    } catch (error) {
      console.error('Error generating content:', error);
      editor.chain().focus().insertContent('\n\n**Error:** Failed to generate content.').run();
    } finally {
      setIsLoading(null);
    }
  };

  const handleRefineContent = async () => {
    if (!editor || isLoading) return;
    
    onOpenChange(false);
    setIsLoading('refine');
    
    try {
      // Get the current selection or all content
      const selection = editor.state.selection;
      const hasSelection = !selection.empty;
      
      const contentToRefine = hasSelection 
        ? editor.state.doc.textBetween(selection.from, selection.to)
        : editor.getText();
      
      if (!contentToRefine.trim()) {
        setIsLoading(null);
        return;
      }
      
      // Call the AI API
      const result = await aiApi.refineContent({ 
        content: contentToRefine,
        instructions: "Improve clarity and readability" 
      });
      
      // Replace with refined content
      if (hasSelection) {
        editor.chain().focus().deleteSelection().insertContent(result.refined_content).run();
      } else {
        // Replace entire content
        editor.commands.setContent(result.refined_content);
      }
    } catch (error) {
      console.error('Error refining content:', error);
      editor.chain().focus().insertContent('\n\n**Error:** Failed to refine content.').run();
    } finally {
      setIsLoading(null);
    }
  };
  
  const handleGenerateSchema = async () => {
    if (!editor || isLoading) return;
    
    onOpenChange(false);
    setIsLoading('schema');
    
    try {
      // Get the current content for context
      const currentContent = editor.getText();
      
      // Call the AI API
      const result = await aiApi.generateSchema({ 
        topic: currentContent.substring(0, 100),
        description: "Create a document outline" 
      });
      
      // Insert the schema at the cursor position or end
      editor.chain().focus().insertContent('\n\n' + result.schema).run();
    } catch (error) {
      console.error('Error generating schema:', error);
      editor.chain().focus().insertContent('\n\n**Error:** Failed to generate schema.').run();
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => onOpenChange(!open)}
        className="flex h-10 items-center gap-1 rounded-md p-2 text-sm font-medium hover:bg-stone-100 active:bg-stone-200"
        disabled={!!isLoading}
      >
        {isLoading ? (
          <>
            <Spinner className="h-4 w-4" />
            <span>AI</span>
          </>
        ) : (
          <>
            <span>✨</span>
            <span>AI</span>
            <span>▼</span>
          </>
        )}
      </button>
      
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-48 rounded-md border border-stone-200 bg-white p-1 shadow-md">
          <button
            onClick={handleGenerateContent}
            className="flex w-full items-center gap-2 rounded-md p-2 text-sm hover:bg-stone-100"
            disabled={!!isLoading}
          >
            <div className="flex h-5 w-5 items-center justify-center">
              <span>✨</span>
            </div>
            <span>Generate Content</span>
          </button>
          
          <button
            onClick={handleRefineContent}
            className="flex w-full items-center gap-2 rounded-md p-2 text-sm hover:bg-stone-100"
            disabled={!!isLoading}
          >
            <div className="flex h-5 w-5 items-center justify-center">
              <span>🔍</span>
            </div>
            <span>Refine Content</span>
          </button>
          
          <button
            onClick={handleGenerateSchema}
            className="flex w-full items-center gap-2 rounded-md p-2 text-sm hover:bg-stone-100"
            disabled={!!isLoading}
          >
            <div className="flex h-5 w-5 items-center justify-center">
              <span>📋</span>
            </div>
            <span>Create Outline</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default AIMenu;
