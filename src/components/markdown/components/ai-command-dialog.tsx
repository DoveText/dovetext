'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/common/dialog';
import { Button } from '@/components/common/Button';
import { Textarea, FormInput as Input } from '@/components/common/form';
import { Label } from '@/components/common/form';
import { Spinner } from '@/components/common/Spinner';
import { XMarkIcon } from '@heroicons/react/24/outline';

// Simple Progress component for the dialog
const Progress = ({ value, className = '' }: { value: number, className?: string }) => {
  return (
    <div className={`relative h-2 w-full overflow-hidden rounded-full bg-gray-100 ${className}`}>
      <div 
        className="h-full w-full flex-1 bg-blue-500 transition-all" 
        style={{ width: `${Math.min(Math.max(0, value), 100)}%` }}
      />
    </div>
  );
};

export type AICommandType = 'generate' | 'refine' | 'schema' | 'summarize-title' | null;

interface AICommandDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (commandType: AICommandType, params: Record<string, any>) => Promise<string | { titles: string[]; reasoning?: string }>;
  commandType: AICommandType;
  initialContent?: string;
  hasSelection?: boolean;
  selectedText?: string;
  onAccept?: (commandType: AICommandType, content: string) => void;
  aiService?: any; // Reference to AICommandService
}

export default function AICommandDialog({ 
  isOpen, 
  onClose, 
  onSubmit, 
  commandType, 
  initialContent = '',
  hasSelection = false,
  selectedText = '',
  onAccept,
  aiService
}: AICommandDialogProps) {
  // Dialog state
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<string | { titles: string[]; reasoning?: string } | null>(null);
  const [selectedTitleIndex, setSelectedTitleIndex] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<Record<string, any>>({
    prompt: '',
    instructions: '',
    topic: '',
    description: '',
    content: ''
  });

  // Reset form when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      // Reset state
      setLoading(false);
      setProgress(0);
      setResult(null);
      setError(null);
      setSelectedTitleIndex(0); // Reset selected title index
      
      // Set default parameters based on command type
      const initialParams = {
        prompt: initialContent ? `Generate content about: ${initialContent.substring(0, 100)}` : '',
        instructions: 'Improve clarity and readability',
        topic: initialContent ? initialContent.substring(0, 100) : '',
        description: '',
        // Only store the selected text, not the entire initialContent
        content: selectedText || ''
      };
      
      // For summarize, get the content from AICommandService
      if (commandType === 'summarize-title' && aiService) {
        try {
          // Get the content from the AICommandService
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
  }, [isOpen, commandType, initialContent, selectedText, aiService]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // Start progress simulation
    setProgress(0);
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        // Simulate progress up to 90% (the last 10% will be when we get the result)
        const newProgress = prev + Math.random() * 5;
        return newProgress > 90 ? 90 : newProgress;
      });
    }, 300);
    
    try {
      // Execute the AI command
      const resultContent = await onSubmit(commandType, params);
      
      // Complete the progress bar
      setProgress(100);
      
      // Store the result for display
      setResult(resultContent || 'No content generated');
    } catch (error) {
      console.error('Error executing AI command:', error);
      setError('Error: Failed to execute AI command. Please try again.');
      setResult(null);
    } finally {
      clearInterval(progressInterval);
      setLoading(false);
    }
  };

  const handleInputChange = (key: string, value: string) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const handleAccept = () => {
    if (result) {
      // Call the onAccept callback if provided
      if (onAccept && commandType) {
        // For summarize command, extract the selected title
        if (commandType === 'summarize-title' && typeof result !== 'string' && result.titles) {
          const selectedTitle = result.titles[selectedTitleIndex];
          onAccept(commandType, selectedTitle);
        } else {
          // For other command types, pass the result as is
          onAccept(commandType, typeof result === 'string' ? result : JSON.stringify(result));
        }
      } else {
        // Just close the dialog if no callback is provided
        onClose();
      }
    }
  };

  const handleRetry = () => {
    // Reset the result, error and progress to allow the user to try again
    setResult(null);
    setProgress(0);
    setError(null);
  };

  const getDialogTitle = () => {
    switch (commandType) {
      case 'generate': return 'Generate Content';
      case 'refine': return 'Refine Content';
      case 'summarize-title': return 'Summarize Title';
      default: return 'AI Command';
    }
  };

  const getCommandDescription = () => {
    switch (commandType) {
      case 'generate': 
        if (hasSelection) {
          return 'Generate a new paragraph based on selected text below.';
        } else if (selectedText.trim() === '') {
          return 'Generate a new paragraph and insert to current position.';
        } else {
          return 'Expand current paragraph with additional content.';
        }
      case 'refine': 
        return 'Refine the selected text to improve clarity and readability.';
      case 'summarize-title':
        return 'Create a title from selected content or paragraphs';
      default: 
        return 'Use AI to enhance your content.';
    }
  };

  const getContentLabel = () => {
    if (commandType === 'generate') {
      if (hasSelection) {
        return 'Selected text:';
      } else if (selectedText.trim() === '') {
        return 'Paragraph right before:';
      } else {
        return 'The paragraph to be expanded:';
      }
    } else {
      return 'Content to process:';
    }
  };

  const getActionButtonText = () => {
    switch (commandType) {
      case 'generate': return 'Generate';
      case 'refine': return 'Refine';
      case 'summarize-title': return 'Summarize Title';
      default: return 'Submit';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden">
        {/* Custom header with improved styling */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-gray-900">{getDialogTitle()}</DialogTitle>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {getCommandDescription()}
          </p>
        </div>
        
        {/* Common description removed as it's now in the header */}
        
        {/* Show selected content or content at cursor position */}
        {(selectedText || params.content) && (
          <div className="mb-4">
            <Label htmlFor="selected-content">{getContentLabel()}</Label>
            <div 
              id="selected-content"
              className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700 max-h-[150px] overflow-y-auto"
            >
              {selectedText || params.content || initialContent}
            </div>
          </div>
        )}
        
        {/* Show error message if there was an error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
            {error}
          </div>
        )}
        
        {/* Show the result if available */}
        {result ? (
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              {/* For summarize command, show titles as a selectable list */}
              {commandType === 'summarize-title' && typeof result !== 'string' && result.titles ? (
                <>
                  <Label htmlFor="result" className="text-base font-medium">Suggested Titles</Label>
                  <div className="p-4 bg-white border border-gray-200 rounded-md text-sm max-h-[400px] overflow-y-auto">
                    <div className="space-y-2">
                      {result.titles.map((title, index) => (
                        <div 
                          key={index}
                          className={`p-3 rounded-md cursor-pointer ${selectedTitleIndex === index ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'}`}
                          onClick={() => setSelectedTitleIndex(index)}
                        >
                          <div className="flex items-center">
                            <input
                              type="radio"
                              id={`title-${index}`}
                              name="title-selection"
                              checked={selectedTitleIndex === index}
                              onChange={() => setSelectedTitleIndex(index)}
                              className="mr-2"
                            />
                            <label htmlFor={`title-${index}`} className="cursor-pointer flex-1">{title}</label>
                          </div>
                        </div>
                      ))}
                    </div>
                    {result.reasoning && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-md text-sm text-gray-600 italic">
                        <p className="font-medium mb-1">AI Reasoning:</p>
                        <p>{result.reasoning}</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* For other command types, show the result as before */
                <>
                  <Label htmlFor="result" className="text-base font-medium">Generated Content</Label>
                  <div 
                    id="result"
                    className="p-4 bg-white border border-gray-200 rounded-md text-sm max-h-[400px] overflow-y-auto whitespace-pre-wrap"
                  >
                    {typeof result === 'string' ? (
                      <div dangerouslySetInnerHTML={{ __html: result }} />
                    ) : (
                      <pre>{JSON.stringify(result, null, 2)}</pre>
                    )}
                  </div>
                </>
              )}
            </div>
            
            <DialogFooter className="pt-4 border-t border-gray-100 mt-4">
              <Button type="button" variant="outline" onClick={handleRetry} className="px-4 py-2">
                Try Again
              </Button>
              <Button type="button" onClick={handleAccept} className="px-4 py-2 bg-blue-600 hover:bg-blue-700">
                Accept
              </Button>
            </DialogFooter>
          </div>
        ) : (
          /* Only show form when there's no result */
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Command-specific input forms */}
            {commandType === 'generate' && (
              <div className="space-y-2">
                <Label htmlFor="prompt">What would you like to generate?</Label>
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
            )}

            {commandType === 'refine' && (
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
            )}

            {commandType === 'summarize-title' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="content-to-summarize">Content to Summarize</Label>
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
                  <Label htmlFor="description">Your Instructions <span className="text-gray-400">(optional)</span></Label>
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
            )}
            
            {/* Show progress bar during loading - positioned right after the input fields */}
            {loading && (
              <div className="space-y-2 bg-blue-50 p-4 rounded-md border border-blue-100">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-blue-700">Processing your request...</span>
                  <span className="text-blue-700">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="w-full" />
                <p className="text-xs text-blue-600 mt-2">Our AI is generating content based on your input. This may take a moment.</p>
              </div>
            )}
              
            <DialogFooter className="pt-4 border-t border-gray-100 mt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose} 
                disabled={loading}
                className="px-4 py-2"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <Spinner size="sm" className="mr-2" /> Processing...
                  </>
                ) : (
                  getActionButtonText()
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
