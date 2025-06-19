'use client';

import React, { useState, useEffect } from 'react';
import { Label } from '@/components/common/form';
import { Textarea } from '@/components/common/form';
import BaseAIDialog from './base-ai-dialog';

interface AISchemaDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (params: Record<string, any>) => Promise<string>;
  initialContent?: string;
  onAccept?: (content: string) => void;
}

export default function AISchemaDialog({
  isOpen,
  onClose,
  onSubmit,
  initialContent = '',
  onAccept
}: AISchemaDialogProps) {
  // Dialog state
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<Record<string, any>>({
    topic: '',
    description: ''
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
        topic: initialContent ? initialContent.substring(0, 100) : '',
        description: ''
      };
      
      setParams(initialParams);
    }
  }, [isOpen, initialContent]);

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
          title="Create Schema"
          description="Generate a JSON schema based on your description."
          loading={loading}
          progress={progress}
          error={error}
          actionButtonText="Generate Schema"
          onSubmit={handleSubmit}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="topic">Schema Topic</Label>
              <Textarea
                id="topic"
                value={params.topic}
                onChange={(e) => handleInputChange('topic', e.target.value)}
                placeholder="What kind of schema do you want to create? (e.g., User Profile, Product Catalog)"
                className="min-h-[80px]"
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Detailed Description</Label>
              <Textarea
                id="description"
                value={params.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe the schema in detail, including fields, types, and any constraints..."
                className="min-h-[150px]"
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
          title="Generated Schema"
          description="Review the generated schema and use it if you're satisfied."
          error={error}
          actionButtonText="Use Schema"
          onSubmit={(e) => {
            e.preventDefault();
            handleAccept();
          }}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Generated JSON Schema</Label>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700 max-h-[400px] overflow-y-auto whitespace-pre-wrap font-mono">
                {result}
              </div>
            </div>
          </div>
        </BaseAIDialog>
      )}
    </>
  );
}
