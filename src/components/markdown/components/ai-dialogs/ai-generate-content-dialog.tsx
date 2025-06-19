'use client';

import React, { useState, useEffect } from 'react';
import { Label } from '@/components/common/form';
import { Textarea } from '@/components/common/form';
import BaseAIDialog from './base-ai-dialog';

interface AIGenerateContentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (params: Record<string, any>) => Promise<string>;
  initialContent?: string;
  hasSelection?: boolean;
  selectedText?: string;
  onAccept?: (content: string) => void;
}

export default function AIGenerateContentDialog({
  isOpen,
  onClose,
  onSubmit,
  initialContent = '',
  hasSelection = false,
  selectedText = '',
  onAccept
}: AIGenerateContentDialogProps) {
  // Dialog state
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<Record<string, any>>({
    prompt: '',
    content: ''
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      // Reset state
      setLoading(false);
      setProgress(0);
      setResult(null);
      setError(null);
      
      // Set default parameters
      const initialParams = {
        prompt: initialContent ? `Generate content about: ${initialContent.substring(0, 100)}` : '',
        content: selectedText || ''
      };
      
      setParams(initialParams);
    }
  }, [isOpen, initialContent, selectedText]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      // Execute the AI command
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
      {!result ? (
        <BaseAIDialog
          isOpen={isOpen}
          onClose={onClose}
          title="Generate Content"
          description="Generate new content based on your prompt."
          loading={loading}
          progress={progress}
          error={error}
          actionButtonText="Generate"
          onSubmit={handleSubmit}
        >
          <div className="space-y-4">
            {selectedText && (
              <div className="space-y-2">
                <Label htmlFor="selected-content">Selected Text</Label>
                <div 
                  id="selected-content"
                  className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700 max-h-[150px] overflow-y-auto whitespace-pre-wrap"
                >
                  {selectedText}
                </div>
                <p className="text-xs text-gray-500 mt-1">This is the text you've selected. The AI will use this as context.</p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="prompt">Generation Prompt</Label>
              <Textarea
                id="prompt"
                value={params.prompt}
                onChange={(e) => handleInputChange('prompt', e.target.value)}
                placeholder="Describe what content you want to generate..."
                className="min-h-[100px]"
                required
                disabled={loading}
              />
            </div>
          </div>
        </BaseAIDialog>
      ) : (
        <BaseAIDialog
          isOpen={isOpen}
          onClose={onClose}
          title="Generated Content"
          description="Review the generated content and use it if you're satisfied."
          error={error}
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
