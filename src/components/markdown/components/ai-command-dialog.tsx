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

export type AICommandType = 'generate' | 'refine' | 'summarize' | null;

interface AICommandDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (commandType: AICommandType, params: Record<string, any>) => Promise<string>;
  commandType: AICommandType;
  initialContent?: string;
  // Whether the user has selected text in the editor
  hasSelection?: boolean;
  // The selected text or text at cursor position
  selectedText?: string;
  // Optional callback for when the user accepts the result
  onAccept?: (commandType: AICommandType, result: string) => void;
}

export default function AICommandDialog({ 
  isOpen, 
  onClose, 
  onSubmit, 
  commandType, 
  initialContent = '',
  hasSelection = false,
  selectedText = '',
  onAccept
}: AICommandDialogProps) {
  // Dialog state
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<Record<string, any>>({
    prompt: '',
    instructions: '',
    topic: '',
    description: '',
  });

  // Reset form when dialog opens with new command type
  useEffect(() => {
    if (isOpen) {
      // Reset state
      setLoading(false);
      setProgress(0);
      setResult(null);
      setError(null);
      
      // Set default parameters based on command type
      setParams({
        prompt: initialContent ? `Generate content about: ${initialContent.substring(0, 100)}` : '',
        instructions: 'Improve clarity and readability',
        topic: initialContent ? initialContent.substring(0, 100) : '',
        description: 'Create a document outline',
        // Only store the selected text, not the entire initialContent
        content: selectedText,
      });
    }
  }, [isOpen, commandType, initialContent, selectedText]);

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
        onAccept(commandType, result);
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
      case 'summarize': return 'Summarize Content';
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
      case 'summarize': 
        return 'Create a concise summary of the selected content.';
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
      case 'summarize': return 'Summarize';
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
              <Label htmlFor="result" className="text-base font-medium">Generated Content</Label>
              <div 
                id="result"
                className="p-4 bg-white border border-gray-200 rounded-md text-sm max-h-[400px] overflow-y-auto whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: result }}
              />
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

            {commandType === 'summarize' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="topic">Document Topic</Label>
                  <Input
                    id="topic"
                    value={params.topic}
                    onChange={(e) => handleInputChange('topic', e.target.value)}
                    placeholder="What is your document about?"
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Additional Details</Label>
                  <Textarea
                    id="description"
                    value={params.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Any specific requirements for the summary?"
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
