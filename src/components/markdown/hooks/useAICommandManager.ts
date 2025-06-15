import { useState } from 'react';
import { Editor } from 'novel';
import { AICommandType } from '../components/ai-command-dialog';
import { AICommandService } from '../services/ai-command-service';

/**
 * Hook to manage AI command dialog state and interactions
 */
export function useAICommandManager(editor: Editor | null) {
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiCommandType, setAiCommandType] = useState<AICommandType>(null);
  const [aiCommandLoading, setAiCommandLoading] = useState(false);
  const [aiService, setAiService] = useState<AICommandService | null>(null);

  // Initialize AI service when editor is ready
  if (editor && !aiService) {
    setAiService(new AICommandService(editor));
  }

  /**
   * Open AI command dialog with specified command type
   */
  const openAiCommandDialog = (type: AICommandType) => {
    console.log('🤖 Opening AI command dialog:', type);
    setAiCommandType(type);
    setAiDialogOpen(true);
  };

  /**
   * Handle AI command dialog submission
   */
  const handleAiCommandSubmit = async (commandType: AICommandType, params: Record<string, any>): Promise<string> => {
    if (!aiService || !editor) {
      return 'Error: Editor not initialized';
    }
    
    try {
      setAiCommandLoading(true);
      
      // Execute the AI command and return the result
      const result = await aiService.executeCommand(commandType, params);
      return result;
    } catch (error) {
      console.error('❌ Error executing AI command:', error);
      return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    } finally {
      setAiCommandLoading(false);
    }
  };

  /**
   * Handle accepting the AI command result
   */
  const handleAcceptResult = (commandType: AICommandType, result: string) => {
    if (!aiService || !editor) {
      console.error('❌ Cannot accept result: Editor not initialized');
      return;
    }
    
    try {
      // Apply the result to the editor
      aiService.applyCommandResult(commandType, result);
      
      // Close the dialog
      setAiDialogOpen(false);
    } catch (error) {
      console.error('❌ Error accepting AI command result:', error);
    }
  };

  /**
   * Close the AI command dialog
   */
  const closeAiCommandDialog = () => {
    setAiDialogOpen(false);
  };

  return {
    aiDialogOpen,
    aiCommandType,
    aiCommandLoading,
    openAiCommandDialog,
    closeAiCommandDialog,
    handleAiCommandSubmit,
    handleAcceptResult
  };
}
