import { useState } from 'react';
import { EditorInstance as Editor } from 'novel';
import { AICommandType } from '../components/ai-command-dialog';
import { AICommandService } from '../services/ai-command-service';

/**
 * Hook to manage AI command dialog state and interactions
 */
export function useAICommandManager(editor: Editor | null) {
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiCommandType, setAiCommandType] = useState<AICommandType | null>(null);
  const [aiCommandLoading, setAiCommandLoading] = useState(false);
  const [selectionRange, setSelectionRange] = useState<{from: number, to: number} | null>(null);
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
    
    // For summarize, extract content below the heading and select the heading line if no selection
    if (type === 'summarize' && aiService && editor) {
      try {
        // Get the current heading (position, node, and level)
        const currentHeading = aiService.getCurrentHeading();
        console.log('Current heading:', currentHeading);
        
        if (currentHeading !== null) {
          // We now have the heading level directly from getCurrentHeading
          console.log('Heading level:', currentHeading.level);
          
          // Check if there's an active selection
          const { from, to } = editor.state.selection;
          const hasSelection = from !== to;
          console.log(`Current selection: from ${from} to ${to}, hasSelection: ${hasSelection}`);
          
          // always selecting the whole heading line
          const headingStart = currentHeading.pos;
            
          const contentStart = headingStart;
          const contentEnd = contentStart + currentHeading.node.content.size;
            
          // Select the entire heading content
          editor.commands.setTextSelection({ from: contentStart, to: contentEnd });
          console.log(`Selected heading content from ${contentStart} to ${contentEnd}`);
            
          // Get the updated selection
          const updatedSelection = editor.state.selection;
          setSelectionRange({ from: updatedSelection.from, to: updatedSelection.to });
          console.log(`Stored selection range: ${updatedSelection.from} to ${updatedSelection.to}`);
          
          // Extract content below the heading using the node, position, and level
          const contentBelowHeading = aiService.getContentBelowHeading(currentHeading.node, currentHeading.pos, currentHeading.level);
          console.log('Content below heading:', contentBelowHeading);
          
          // Store it for the dialog
          aiService.setSummarizeContent(contentBelowHeading);
          
          // If we have a heading but no content, we can still use the paragraph text in the editor
          if (!contentBelowHeading.trim()) {
            // Try to get the current paragraph text as a fallback
            const { state } = editor;
            const { selection } = state;
            const { $from } = selection;
            const node = $from.parent;
            
            if (node && node.textContent) {
              console.log('Using paragraph text as fallback:', node.textContent);
              aiService.setSummarizeContent(node.textContent);
            }
          }
        }
      } catch (error) {
        console.error('Error extracting content for summarize:', error);
      }
    }
    
    setAiDialogOpen(true);
  };

  /**
   * Handle AI command dialog submission
   */
  const handleAiCommandSubmit = async (commandType: AICommandType, params: Record<string, any>): Promise<string | { titles: string[]; reasoning?: string }> => {
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
      // For all command types, restore the user's original selection if available
      if (selectionRange) {
        console.log(`Restoring selection from ${selectionRange.from} to ${selectionRange.to}`);
        editor.commands.setTextSelection({ from: selectionRange.from, to: selectionRange.to });
      }
      
      // Apply the result to the editor
      aiService.applyCommandResult(commandType, result);
      
      // Reset the selection range
      setSelectionRange(null);
      
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
    // Just close the dialog without clearing the selection
    // This allows the user to see what was selected after closing the dialog
    setAiDialogOpen(false);
    
    // We intentionally don't reset the selection range here
    // so that the selection remains visible after closing the dialog
    console.log('Dialog closed, selection preserved');
  };

  return {
    aiDialogOpen,
    aiCommandType,
    aiCommandLoading,
    aiService, // Expose the AICommandService instance
    openAiCommandDialog,
    closeAiCommandDialog,
    handleAiCommandSubmit,
    handleAcceptResult
  };
}
