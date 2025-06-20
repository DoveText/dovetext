'use client';

import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Textarea, Label } from '@/components/common/form';
import BaseAIDialog from './base-ai-dialog';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { AICommandService } from '../../services/ai-command-service';

// Define AICommandParams type to match what's expected by AICommandService
type AICommandParams = {
  command?: 'generate' | 'refine' | 'schema' | 'summarize-title';
  prompt?: string;
  selectedText?: string;
  showContext?: boolean;
};

interface RefineContentParams {
  text_to_refine: string;
  prompt: string;
  context_before?: string;
  context_after?: string;
  document_title?: string;
  document_tone?: string;
  current_heading_level?: number;
}

interface AIService {
  refineContent?: (params: RefineContentParams) => Promise<string>;
  getContextBeforeSelection?: () => string;
  getContextAfterSelection?: () => string;
  getContextBeforeParagraph?: () => string;
  getContextAfterParagraph?: () => string;
  getCurrentHeadingLevel?: () => number;
  getCurrentParagraph?: () => { text: string } | null;
  getDocumentContext?: () => { title: string; tone: string };
  getEditor?: () => any;
}

interface AIRefineContentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (params: Record<string, any>) => Promise<string>;
  initialContent?: string;
  hasSelection?: boolean;
  selectedText?: string;
  onAccept?: (content: string) => void;
  aiService?: AICommandService;
}

export default function AIRefineContentDialog({
  isOpen,
  onClose,
  onSubmit,
  initialContent = '',
  hasSelection = false,
  selectedText = '',
  onAccept,
  aiService
}: AIRefineContentDialogProps) {
  // Dialog state
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showContext, setShowContext] = useState(false);
  
  const [params, setParams] = useState<RefineContentParams>({
    text_to_refine: '',
    prompt: 'Improve clarity and readability',
    context_before: '',
    context_after: '',
    document_title: '',
    document_tone: 'professional'
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      // Reset state
      setLoading(false);
      setProgress(0);
      setResult(null);
      setError(null);
      setValidationError(null);
      
      // Get content to refine and context
      let textToRefine = '';
      let contextBefore = '';
      let contextAfter = '';
      let documentTitle = '';
      let documentTone = 'professional';
      let currentHeadingLevel = undefined;
      let validationMessage = null;
      
      if (aiService) {
        try {
          // Get document metadata
          const docContext = aiService.getDocumentContext?.();
          documentTitle = docContext?.title || '';
          documentTone = docContext?.tone || 'professional';
          
          // Determine text to refine based on selection or cursor position
          if (hasSelection && selectedText) {
            // Check if selection is long enough (at least 10 characters)
            if (selectedText.length < 10) {
              validationMessage = 'Selection is too short to refine. Please select a longer piece of text.';
              textToRefine = '';
            } 
            // Check if selection contains heading markers (# or ##)
            else if (/^\s*#{1,6}\s+/m.test(selectedText)) {
              validationMessage = 'Selection contains headings. Please select content within a single section.';
              textToRefine = '';
            } else {
              textToRefine = selectedText;
              
              // Get context before and after selection
              contextBefore = aiService.getContextBeforeSelection?.() || '';
              contextAfter = aiService.getContextAfterSelection?.() || '';
              currentHeadingLevel = aiService.getCurrentHeadingLevel?.();
            }
          } else {
            // No selection - try to get current paragraph
            const currentParagraph = aiService.getCurrentParagraph?.();
            if (currentParagraph && currentParagraph.text) {
              const paragraphText = currentParagraph.text.trim();
              
              // Validate paragraph content
              if (paragraphText.length < 10) {
                validationMessage = 'Paragraph is too short to refine. Please select a longer paragraph.';
                textToRefine = '';
              } else {
                textToRefine = paragraphText;
                
                // Get context before and after paragraph
                contextBefore = aiService.getContextBeforeParagraph?.() || '';
                contextAfter = aiService.getContextAfterParagraph?.() || '';
                currentHeadingLevel = aiService.getCurrentHeadingLevel?.();
              }
            } else {
              validationMessage = 'No paragraph detected at cursor position. Please place cursor in a paragraph or select text.';
            }
          }
        } catch (error) {
          console.error('Error getting content to refine:', error);
          validationMessage = 'Error getting content to refine. Please try again.';
        }
      } else if (selectedText) {
        // Fallback if no aiService is provided but we have selectedText
        textToRefine = selectedText;
      } else if (initialContent) {
        // Fallback to initialContent if provided
        textToRefine = initialContent;
      } else {
        validationMessage = 'No content available to refine.';
      }
      
      // Set validation error if any
      setValidationError(validationMessage);
      
      // Set parameters for the API call
      setParams({
        text_to_refine: textToRefine,
        prompt: 'Improve clarity and readability',
        context_before: contextBefore,
        context_after: contextAfter,
        document_title: documentTitle,
        document_tone: documentTone,
        current_heading_level: currentHeadingLevel
      });
    }
  }, [isOpen, initialContent, selectedText, hasSelection, aiService]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If there was an error and user clicks "Try Again", just reset the error state
    if (error) {
      setError(null);
      return;
    }
    
    // Check if we have content to refine
    if (!params.text_to_refine) {
      setValidationError('No content available to refine.');
      return;
    }
    
    setLoading(true);
    setError(null);
    setValidationError(null);
    
    // Start progress simulation
    setProgress(0);
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + Math.random() * 5;
        return newProgress > 90 ? 90 : newProgress;
      });
    }, 300);
    
    try {
      // Execute the AI command using the service if available
      let resultContent;
      if (aiService) {
        resultContent = await aiService.executeCommand('refine', {
          prompt: params.prompt,
          selectedText: params.text_to_refine,
          showContext: showContext
        });
        
        // Handle the case where the result might be an object with titles
        if (typeof resultContent === 'object' && 'titles' in resultContent) {
          // This shouldn't happen for refine command, but handle it just in case
          resultContent = resultContent.reasoning || 'Error: Unexpected response format';
        }
      } else {
        // Fallback to the onSubmit prop if no aiService is provided
        resultContent = await onSubmit(params);
      }
      
      // Complete the progress bar
      setProgress(100);
      
      // Set the result
      setResult(resultContent as string);
      
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
          actionButtonText={error ? "Try Again" : "Refine"}
          onSubmit={handleSubmit}
        >
          <div className="space-y-4">
            {validationError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                {validationError}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="content-to-refine">Content to Refine</Label>
              <div 
                id="content-to-refine"
                className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700 max-h-[200px] overflow-y-auto whitespace-pre-wrap"
              >
                {params.text_to_refine ? (
                  <div>{params.text_to_refine}</div>
                ) : (
                  <div className="text-red-500">
                    No content selected to refine. Please select some text or place your cursor in a paragraph.
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prompt">Refinement Instructions</Label>
              <Textarea
                id="prompt"
                value={params.prompt}
                onChange={(e) => handleInputChange('prompt', e.target.value)}
                placeholder="How would you like to improve the content? (e.g., 'Make it more concise', 'Use a more professional tone', 'Add more details about X')"
                className="min-h-[100px]"
                required
                disabled={loading}
              />
              <p className="text-xs text-gray-500">Provide clear instructions on how you want the content to be refined.</p>
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
                {params.text_to_refine}
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
