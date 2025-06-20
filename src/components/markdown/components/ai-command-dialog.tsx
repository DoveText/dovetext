'use client';

import React from 'react';
import { 
  AISummarizeTitleDialog,
  AIGenerateContentDialog,
  AIRefineContentDialog,
  AISchemaDialog
} from './ai-dialogs';

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

/**
 * AI Command Dialog that delegates to specialized dialog components based on command type
 */
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
  // Handle submission with the correct command type
  const handleSummarizeTitleSubmit = async (params: Record<string, any>): Promise<{ titles: string[]; reasoning?: string }> => {
    const result = await onSubmit(commandType, params);
    if (typeof result === 'string') {
      // Handle unexpected string result
      return { titles: [result], reasoning: 'Unexpected result format' };
    }
    return result;
  };

  const handleContentSubmit = async (params: Record<string, any>): Promise<string> => {
    const result = await onSubmit(commandType, params);
    if (typeof result === 'string') {
      return result;
    }
    // Handle unexpected object result
    return JSON.stringify(result);
  };

  // Handle accepting the result
  const handleAccept = (content: string) => {
    if (onAccept && commandType) {
      onAccept(commandType, content);
    }
  };

  // Render the appropriate dialog based on command type
  switch (commandType) {
    case 'summarize-title':
      return (
        <AISummarizeTitleDialog
          isOpen={isOpen}
          onClose={onClose}
          onSubmit={handleSummarizeTitleSubmit}
          initialContent={initialContent}
          selectedText={selectedText}
          onAccept={handleAccept}
          aiService={aiService}
        />
      );

    case 'generate':
      return (
        <AIGenerateContentDialog
          isOpen={isOpen}
          onClose={onClose}
          onSubmit={handleContentSubmit}
          initialContent={initialContent}
          hasSelection={hasSelection}
          selectedText={selectedText}
          onAccept={handleAccept}
          aiService={aiService}
        />
      );

    case 'refine':
      return (
        <AIRefineContentDialog
          isOpen={isOpen}
          onClose={onClose}
          onSubmit={handleContentSubmit}
          initialContent={initialContent}
          selectedText={selectedText}
          onAccept={handleAccept}
        />
      );

    case 'schema':
      return (
        <AISchemaDialog
          isOpen={isOpen}
          onClose={onClose}
          onSubmit={handleContentSubmit}
          initialContent={initialContent}
          onAccept={handleAccept}
        />
      );

    default:
      return null;
  }
}
