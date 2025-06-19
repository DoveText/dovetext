'use client';

import React, { useState, useEffect } from 'react';
import { Label } from '@/components/common/form';
import { Textarea } from '@/components/common/form';
import BaseAIDialog from './base-ai-dialog';

interface AIRefineContentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (params: Record<string, any>) => Promise<string>;
  initialContent?: string;
  selectedText?: string;
  onAccept?: (content: string) => void;
}

export default function AIRefineContentDialog({
  isOpen,
  onClose,
  onSubmit,
  initialContent = '',
  selectedText = '',
  onAccept
}: AIRefineContentDialogProps) {
  // Dialog state
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<Record<string, any>>({
    instructions: 'Improve clarity and readability',
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
        instructions: 'Improve clarity and readability',
        content: selectedText || initialContent || ''
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
          title="Refine Content"
          description="Refine your selected content based on your instructions."
          loading={loading}
          progress={progress}
          error={error}
          actionButtonText="Refine"
          onSubmit={handleSubmit}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="content-to-refine">Content to Refine</Label>
              <div 
                id="content-to-refine"
                className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700 max-h-[200px] overflow-y-auto whitespace-pre-wrap"
              >
                {params.content ? (
                  <div>{params.content}</div>
                ) : (
                  <div className="text-red-500">
                    No content selected to refine. Please select some text first.
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="instructions">Refinement Instructions</Label>
              <Textarea
                id="instructions"
                value={params.instructions}
                onChange={(e) => handleInputChange('instructions', e.target.value)}
                placeholder="How would you like to improve the content?"
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
          title="Refined Content"
          description="Review the refined content and use it if you're satisfied."
          error={error}
          actionButtonText="Use Refined Content"
          onSubmit={(e) => {
            e.preventDefault();
            handleAccept();
          }}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Original Content</Label>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700 max-h-[200px] overflow-y-auto whitespace-pre-wrap">
                {params.content}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Refined Content</Label>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700 max-h-[200px] overflow-y-auto whitespace-pre-wrap">
                {result}
              </div>
            </div>
          </div>
        </BaseAIDialog>
      )}
    </>
  );
}
