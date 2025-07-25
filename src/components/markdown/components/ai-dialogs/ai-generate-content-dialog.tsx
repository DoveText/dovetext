'use client';

import React, { useState, useEffect } from 'react';
import { Label } from '@/components/common/form';
import { Textarea } from '@/components/common/form';
import BaseAIDialog from './base-ai-dialog';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';

interface AIGenerateContentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (params: Record<string, any>) => Promise<string>;
  initialContent?: string;
  hasSelection?: boolean;
  selectedText?: string;
  onAccept?: (content: string) => void;
  aiService?: any; // AICommandService instance
}

export default function AIGenerateContentDialog({
  isOpen,
  onClose,
  onSubmit,
  initialContent = '',
  hasSelection = false,
  selectedText = '',
  onAccept,
  aiService
}: AIGenerateContentDialogProps) {
  // Dialog state
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<Record<string, any>>({
    prompt: ''
  });
  
  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      // Reset state
      setLoading(false);
      setProgress(0);
      setResult(null);
      setError(null);

      // Get context data from AICommandService if available
      if (aiService) {
        try {
          // Get current paragraph text safely
          // For content generation, we should already have a selection of the current paragraph
          // so we should use the selectedText if available
          const currentParagraph = aiService.getCurrentParagraph();
          const currentParagraphText = currentParagraph?.text || '';

          setParams({
            prompt: currentParagraphText
          })
        } catch (error) {
          console.error('Error getting context data:', error);
          // Set empty context data on error
          setParams({
            prompt: ''
          });
        }
      }
    }
  }, [isOpen, aiService]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If there was an error and user clicks "Try Again", just reset the error state
    if (error) {
      setError(null);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    // Start progress simulation
    setProgress(0);
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + Math.random() * 5;
        return newProgress > 90 ? 90 : newProgress;
      });
    }, 300);
    
    try {
      // Make sure we include the current paragraph text in the params
      // This ensures the paragraph selection is not lost during API call
      // Execute the AI command with the updated params
      const resultContent = await onSubmit(params);
      
      // Complete the progress bar
      setProgress(100);
      
      // Set the result
      setResult(resultContent);
      
      // Clear the interval
      clearInterval(progressInterval);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
      clearInterval(progressInterval);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (key: string, value: string) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const handleAccept = () => {
    if (result && onAccept) {
      onAccept(result);
      onClose();
    }
  };

  return (
    <>
      {!result || error ? (
        <BaseAIDialog
          isOpen={isOpen}
          onClose={onClose}
          title="Generate Content"
          description="Generate new content based on your prompt to fill in current empty paragraph or replace existing paragraph."
          loading={loading}
          progress={progress}
          error={error}
          actionButtonText={error ? "Try Again" : "Generate"}
          onSubmit={handleSubmit}
        >
          <div className="space-y-4">
            {/* Generation prompt */}
            <div className="space-y-2">
              <Label htmlFor="prompt">Generating Instructions</Label>
              <Textarea
                id="prompt"
                value={params.prompt}
                onChange={(e) => handleInputChange('prompt', e.target.value)}
                placeholder="Describe what content you want to generate..."
                className="min-h-[100px]"
                required
                disabled={loading}
              />
              <p className="text-xs text-gray-500">Provide instructions for the AI to generate content that will replace the selected paragraph.</p>
            </div>
          </div>
        </BaseAIDialog>
      ) : (
        <BaseAIDialog
          isOpen={isOpen}
          onClose={onClose}
          title="Generated Content"
          description="Review the generated content and use it if you're satisfied."
          actionButtonText="Use Content"
          onSubmit={(e) => {
            e.preventDefault();
            handleAccept();
          }}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Generated Content</Label>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700 max-h-[400px] overflow-y-auto whitespace-pre-wrap">
                {result}
              </div>
            </div>
          </div>
        </BaseAIDialog>
      )}
    </>
  );
}
