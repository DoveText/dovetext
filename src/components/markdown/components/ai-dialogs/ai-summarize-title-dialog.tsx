'use client';

import React, { useState, useEffect } from 'react';
import { Label } from '@/components/common/form';
import { Textarea } from '@/components/common/form';
import BaseAIDialog, { Progress } from './base-ai-dialog';

interface AISummarizeTitleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (params: Record<string, any>) => Promise<{ titles: string[]; reasoning?: string }>;
  initialContent?: string;
  selectedText?: string;
  onAccept?: (content: string) => void;
  aiService?: any;
}

export default function AISummarizeTitleDialog({
  isOpen,
  onClose,
  onSubmit,
  initialContent = '',
  selectedText = '',
  onAccept,
  aiService
}: AISummarizeTitleDialogProps) {
  // Dialog state
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ titles: string[]; reasoning?: string } | null>(null);
  const [selectedTitleIndex, setSelectedTitleIndex] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<Record<string, any>>({
    description: '',
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
      setSelectedTitleIndex(0);
      
      // Set default parameters
      const initialParams = {
        description: '',
        content: selectedText || ''
      };
      
      // Get the content from the AICommandService
      if (aiService) {
        try {
          const summarizeContent = aiService.getSummarizeContent();
          if (summarizeContent) {
            initialParams.content = summarizeContent;
          }
        } catch (error) {
          console.error('Error getting summarize title:', error);
        }
      }
      
      setParams(initialParams);
    }
  }, [isOpen, selectedText, aiService]);

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
    if (result && result.titles && result.titles.length > 0) {
      const selectedTitle = result.titles[selectedTitleIndex];
      if (onAccept && selectedTitle) {
        onAccept(selectedTitle);
        onClose();
      }
    }
  };

  return (
    <>
      {!result ? (
        <BaseAIDialog
          isOpen={isOpen}
          onClose={onClose}
          title="Summarize Title"
          description="Generate title suggestions based on the content below your heading."
          loading={loading}
          progress={progress}
          error={error}
          actionButtonText="Generate Titles"
          onSubmit={handleSubmit}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="content-to-process">Selected Heading Line</Label>
              <div 
                id="content-to-process"
                className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700 max-h-[80px] overflow-y-auto whitespace-pre-wrap"
              >
                {params.content ? (
                  <div>Introduction</div>
                ) : (
                  <div className="text-red-500">
                    No heading selected. Please position your cursor on a heading.
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="content-to-summarize">Heading Content Preview</Label>
              <div 
                id="content-to-summarize"
                className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700 max-h-[200px] overflow-y-auto whitespace-pre-wrap"
              >
                {params.content ? (
                  <div>{params.content}</div>
                ) : (
                  <div className="text-red-500">
                    No content available to summarize. Please make sure there is content below your heading.
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">This is the content below your heading that will be used to generate title suggestions.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Additional Requirements for Summarizing <span className="text-gray-400">(optional)</span></Label>
              <Textarea
                id="description"
                value={params.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Any additional requirements you want for the generated titles?"
                className="min-h-[80px]"
                disabled={loading}
              />
            </div>
          </div>
        </BaseAIDialog>
      ) : (
        <BaseAIDialog
          isOpen={isOpen}
          onClose={onClose}
          title="Title Suggestions"
          description="Select a title to use for your heading."
          error={error}
          actionButtonText="Use Selected Title"
          onSubmit={(e) => {
            e.preventDefault();
            handleAccept();
          }}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Generated Title Suggestions</Label>
              <div className="space-y-2">
                {result.titles.map((title, index) => (
                  <div
                    key={index}
                    className={`p-3 border rounded-md cursor-pointer transition-colors ${
                      selectedTitleIndex === index
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                    }`}
                    onClick={() => setSelectedTitleIndex(index)}
                  >
                    {title}
                  </div>
                ))}
              </div>
            </div>
            
            {result.reasoning && (
              <div className="space-y-2">
                <Label>AI Reasoning</Label>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700 max-h-[150px] overflow-y-auto">
                  {result.reasoning}
                </div>
              </div>
            )}
          </div>
        </BaseAIDialog>
      )}
    </>
  );
}
