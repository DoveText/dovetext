'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/common/dialog';
import { Button } from '@/components/common/Button';
import { Textarea, FormInput as Input } from '@/components/common/form';
import { Label } from '@/components/common/form';
import { Spinner } from '@/components/common/Spinner';

export type AICommandType = 'generate' | 'refine' | 'summarize' | null;

interface AICommandDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (commandType: AICommandType, params: Record<string, any>) => Promise<void>;
  commandType: AICommandType;
  initialContent?: string;
}

export default function AICommandDialog({ 
  isOpen, 
  onClose, 
  onSubmit, 
  commandType, 
  initialContent = '' 
}: AICommandDialogProps) {
  const [loading, setLoading] = useState(false);
  const [params, setParams] = useState<Record<string, any>>({
    prompt: '',
    instructions: '',
    topic: '',
    description: '',
  });

  // Reset form when dialog opens with new command type
  useEffect(() => {
    if (isOpen) {
      setParams({
        prompt: initialContent ? `Generate content about: ${initialContent.substring(0, 100)}` : '',
        instructions: 'Improve clarity and readability',
        topic: initialContent ? initialContent.substring(0, 100) : '',
        description: 'Create a document outline',
      });
    }
  }, [isOpen, commandType, initialContent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await onSubmit(commandType, params);
      onClose();
    } catch (error) {
      console.error('Error executing AI command:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (key: string, value: string) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const getDialogTitle = () => {
    switch (commandType) {
      case 'generate': return 'Generate Content';
      case 'refine': return 'Refine Content';
      case 'summarize': return 'Summarize Content';
      default: return 'AI Command';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
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
              />
              <p className="text-sm text-gray-500">
                The selected text or entire document will be refined according to these instructions.
              </p>
            </div>
          )}

          {commandType === 'schema' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="topic">Document Topic</Label>
                <Input
                  id="topic"
                  value={params.topic}
                  onChange={(e) => handleInputChange('topic', e.target.value)}
                  placeholder="What is your document about?"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Additional Details</Label>
                <Textarea
                  id="description"
                  value={params.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Any specific requirements for the outline?"
                  className="min-h-[80px]"
                />
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <><Spinner size="sm" className="mr-2" /> Processing...</> : 'Submit'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
