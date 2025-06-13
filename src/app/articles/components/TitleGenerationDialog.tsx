'use client';

import React, { useState } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/common/dialog/Dialog';
import { Button } from '@/components/common/Button';
import { articleAiApi, TitleGenerationRequest } from '@/app/api/article-ai';
import { Loader2, CheckCircle, RefreshCw } from 'lucide-react';

interface TitleGenerationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTitle: (title: string) => void;
  onGenerateTitles: (direction: string) => Promise<string[]>;
  initialDirection?: string;
}

export function TitleGenerationDialog({
  isOpen,
  onClose,
  onSelectTitle,
  onGenerateTitles,
  initialDirection = ''
}: TitleGenerationDialogProps) {
  const [direction, setDirection] = useState(initialDirection);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTitles, setGeneratedTitles] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [selectedTitleIndex, setSelectedTitleIndex] = useState<number | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setProgress(0);
    setSelectedTitleIndex(null);
    
    // Simulate progress while waiting for API response
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + Math.random() * 15;
        return newProgress < 90 ? newProgress : 90; // Cap at 90% until complete
      });
    }, 300);

    try {
      const titles = await onGenerateTitles(direction);
      setGeneratedTitles(titles || []);
      setProgress(100); // Complete the progress bar
    } catch (err: any) {
      console.error('Error generating titles:', err);
      setError(err.message || 'Failed to generate titles. Please try again.');
    } finally {
      clearInterval(progressInterval);
      setIsGenerating(false);
    }
  };

  const handleSelectTitle = (title: string, index: number) => {
    setSelectedTitleIndex(index);
  };
  
  const handleAcceptTitle = () => {
    if (selectedTitleIndex !== null && generatedTitles[selectedTitleIndex]) {
      onSelectTitle(generatedTitles[selectedTitleIndex]);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Generate Article Titles</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* Description */}
          <div className="bg-blue-50 p-4 rounded-md text-sm text-blue-800 mb-2">
            <p>AI will help you generate 5 new titles for your article. You can provide specific requests or guidance in the box below.</p>
          </div>
          
          {!generatedTitles.length && (
            <>
              <div className="w-full">
                <textarea
                  id="direction"
                  value={direction}
                  onChange={(e) => setDirection(e.target.value)}
                  placeholder="Your requests for the new titles"
                  className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  rows={3}
                  disabled={isGenerating}
                />
              </div>
            </>
          )}
          
          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-md text-sm mb-4 flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-medium">{error}</p>
                {error.includes('Content is too short') && (
                  <p className="mt-1">Please write more content in your article before generating titles.</p>
                )}
              </div>
            </div>
          )}
          
          {/* Progress bar during generation */}
          {isGenerating && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Generating titles...</span>
                <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}
          
          {/* Generate button (only shown before generation) */}
          {!isGenerating && generatedTitles.length === 0 && (
            <div className="flex justify-between mt-4">
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button onClick={handleGenerate}>Generate Titles</Button>
            </div>
          )}
          
          {/* Generated titles selection */}
          {!isGenerating && generatedTitles.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Select a title:</h3>
              <div className="space-y-2">
                {generatedTitles.map((title, index) => (
                  <div
                    key={index}
                    onClick={() => handleSelectTitle(title, index)}
                    className={`p-3 border rounded-md hover:bg-gray-50 cursor-pointer transition-colors flex justify-between items-center ${selectedTitleIndex === index ? 'border-blue-500 bg-blue-50' : ''}`}
                  >
                    <span>{title}</span>
                    {selectedTitleIndex === index && (
                      <CheckCircle className="h-5 w-5 text-blue-500" />
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-6 flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={handleGenerate} 
                  disabled={isGenerating}
                  className="flex items-center"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerate
                </Button>
                <div className="space-x-2">
                  <Button variant="ghost" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAcceptTitle} 
                    disabled={selectedTitleIndex === null}
                  >
                    Accept
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
        

      </DialogContent>
    </Dialog>
  );
}
