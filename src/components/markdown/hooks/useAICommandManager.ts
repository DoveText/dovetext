import { useState, useRef, useEffect } from 'react';
import { EditorInstance as Editor } from 'novel';
import { AICommandType } from '../components/ai-command-dialog';
import { AICommandService } from '../services/ai-command-service';
import { toast } from 'react-hot-toast';

/**
 * Hook to manage AI command dialog state and interactions
 */
export function useAICommandManager(editor: Editor | null) {
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiCommandType, setAiCommandType] = useState<AICommandType | null>(null);
  const [aiCommandLoading, setAiCommandLoading] = useState(false);
  const [selectionRange, setSelectionRange] = useState<{from: number, to: number} | null>(null);
  const [selectedText, setSelectedText] = useState<string>('');
  const [aiService, setAiService] = useState<AICommandService | null>(null);
  const [isEditorReadOnly, setIsEditorReadOnly] = useState(false);
  const loadingDotsIntervalRef = useRef<number | null>(null);
  const loadingDotsPositionRef = useRef<{from: number, to: number} | null>(null);

  // Initialize AI service when editor is ready
  if (editor && !aiService) {
    setAiService(new AICommandService(editor));
  }
  
  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (loadingDotsIntervalRef.current) {
        clearInterval(loadingDotsIntervalRef.current);
      }
    };
  }, []);
  
  /**
   * Start animated loading dots at the current paragraph position
   */
  const startLoadingAnimation = (paragraphStart: number, paragraphEnd: number) => {
    if (!editor) return;
    
    // Make editor readonly
    editor.setEditable(false);
    setIsEditorReadOnly(true);
    
    // Store the position for later replacement
    loadingDotsPositionRef.current = { from: paragraphStart, to: paragraphEnd };
    
    // Initial dots
    let dotsCount = 1;
    updateLoadingDots(dotsCount);
    
    // Start animation interval
    loadingDotsIntervalRef.current = window.setInterval(() => {
      dotsCount = (dotsCount % 3) + 1;
      updateLoadingDots(dotsCount);
    }, 500) as unknown as number;
  };
  
  /**
   * Update the loading dots in the editor
   */
  const updateLoadingDots = (count: number) => {
    if (!editor || !loadingDotsPositionRef.current) return;
    
    const { from, to } = loadingDotsPositionRef.current;
    const dots = '.'.repeat(count);
    const loadingText = `Generating${dots}`;
    
    // Replace the current paragraph with loading text
    editor.commands.deleteRange({ from, to });
    editor.commands.insertContentAt(from, loadingText);
    
    // Update the position reference for the next update
    loadingDotsPositionRef.current = { 
      from, 
      to: from + loadingText.length 
    };
  };
  
  /**
   * Stop loading animation and restore editor state
   */
  const stopLoadingAnimation = () => {
    if (!editor) return;
    
    // Clear the animation interval
    if (loadingDotsIntervalRef.current) {
      const { from, to } = loadingDotsPositionRef.current;
      editor.commands.deleteRange({ from, to });

      clearInterval(loadingDotsIntervalRef.current);
      loadingDotsIntervalRef.current = null;
    }
    
    // Make editor editable again
    editor.setEditable(true);
    setIsEditorReadOnly(false);
  };

  /**
   * Open AI command dialog with specified command type
   */
  const openAiCommandDialog = (type: AICommandType) => {
    setAiCommandType(type);
    
    // Special handling for slash-generate command
    if (type === 'slash-generate' && aiService && editor) {
      try {
        // Get the current paragraph
        const currentParagraph = aiService.getCurrentParagraph();
        
        if (currentParagraph !== null) {
          // Select the entire paragraph
          const paragraphStart = currentParagraph.pos;
          const paragraphEnd = paragraphStart + currentParagraph.node.content.size;
          
          // Select the entire paragraph content
          editor.commands.setTextSelection({ from: paragraphStart, to: paragraphEnd });
          
          // Get the updated selection
          const updatedSelection = editor.state.selection;
          setSelectionRange({ from: updatedSelection.from, to: updatedSelection.to });
          
          // Get the paragraph text
          const paragraphText = currentParagraph.text;
          setSelectedText(paragraphText);
          
          // Count words in the current paragraph
          const wordCount = paragraphText.trim().split(/\s+/).filter(Boolean).length;
          
          // If paragraph is empty or too short, show the dialog
          if (wordCount < 5) {
            console.log('Paragraph too short, showing dialog', { wordCount, text: paragraphText });
            // Use regular generate command type for the dialog
            setAiCommandType('generate');
            setAiDialogOpen(true);
          } else {
            // For longer paragraphs, auto-generate without showing dialog
            console.log('Auto-generating content for paragraph', { wordCount, text: paragraphText });
            
            // Create loading toast
            const loadingToastId = toast.loading('AI is generating content...');
            
            // Make sure the paragraph is selected before generating content
            editor.commands.setTextSelection({ 
              from: paragraphStart, 
              to: paragraphEnd 
            });
            
            // Start loading animation with dots
            startLoadingAnimation(paragraphStart, paragraphEnd);
            
            // Execute the generate command
            handleAiCommandSubmit('generate', { prompt: paragraphText })
              .then((result) => {
                if (typeof result === 'string') {
                  // Stop the loading animation
                  stopLoadingAnimation();
                  
                  // Apply the result by replacing the current selection
                  const newSelectionRange = aiService.applyCommandResult('generate', result);
                  
                  // Update the selection to cover the new content if available
                  if (newSelectionRange) {
                    editor.commands.setTextSelection({
                      from: newSelectionRange.from,
                      to: newSelectionRange.to
                    });
                  }
                  
                  // Show success toast
                  toast.success('Content generated successfully', { id: loadingToastId });
                }
              })
              .catch((error) => {
                // Stop the loading animation
                stopLoadingAnimation();
                
                console.error('Error generating content:', error);
                
                // Show error toast
                toast.error(`Error: ${error.message || 'Failed to generate content'}`, { id: loadingToastId });
              });
            
            // Don't open the dialog
            return;
          }
        }
      } catch (error) {
        console.error('Error handling slash-generate command:', error);
        toast.error('Error processing command');
      }
    }
    // For regular generate content, select the current paragraph
    else if (type === 'generate' && aiService && editor) {
      try {
        // Get the current paragraph
        const currentParagraph = aiService.getCurrentParagraph();

        console.log('Try generate', currentParagraph)

        if (currentParagraph !== null) {
          // Select the entire paragraph
          const paragraphStart = currentParagraph.pos;
          const paragraphEnd = paragraphStart + currentParagraph.node.content.size;
          
          // Select the entire paragraph content
          editor.commands.setTextSelection({ from: paragraphStart, to: paragraphEnd });
          
          // Get the updated selection
          const updatedSelection = editor.state.selection;
          setSelectionRange({ from: updatedSelection.from, to: updatedSelection.to });
          
          // Get the paragraph text and set it as selected text
          const paragraphText = currentParagraph.text;
          setSelectedText(paragraphText);
        }
      } catch (error) {
        console.error('Error selecting paragraph for content generation:', error);
      }
    }
    
    // For refine content, use selection if available or select current paragraph
    if (type === 'refine' && aiService && editor) {
      try {
        // Check if there's an active selection
        const { from, to } = editor.state.selection;
        const hasSelection = from !== to;
        
        if (hasSelection) {
          // Get the selected text
          const selectedContent = editor.state.doc.textBetween(from, to);
          setSelectionRange({ from, to });
          setSelectedText(selectedContent);
          console.log('Using existing selection for refine:', selectedContent);
        } else {
          // No selection, get the current paragraph
          const currentParagraph = aiService.getCurrentParagraph();
          console.log('No selection, trying to use paragraph for refine:', currentParagraph);

          if (currentParagraph !== null) {
            // Select the entire paragraph
            const paragraphStart = currentParagraph.pos;
            const paragraphEnd = paragraphStart + currentParagraph.node.content.size;
            
            // Select the entire paragraph content
            editor.commands.setTextSelection({ from: paragraphStart, to: paragraphEnd });
            
            // Get the updated selection
            const updatedSelection = editor.state.selection;
            setSelectionRange({ from: updatedSelection.from, to: updatedSelection.to });
            
            // Get the paragraph text and set it as selected text
            const paragraphText = currentParagraph.text;
            setSelectedText(paragraphText);
          }
        }
      } catch (error) {
        console.error('Error selecting text for refinement:', error);
      }
    }
    
    // For summarize, extract content below the heading and select the heading line if no selection
    if (type === 'summarize-title' && aiService && editor) {
      try {
        // Get the current heading (position, node, and level)
        const currentHeading = aiService.getCurrentHeading();

        if (currentHeading !== null) {
          // Check if there's an active selection
          const { from, to } = editor.state.selection;
          const hasSelection = from !== to;

          // always selecting the whole heading line
          const headingStart = currentHeading.pos;
            
          const contentStart = headingStart;
          const contentEnd = contentStart + currentHeading.node.content.size;
            
          // Select the entire heading content
          editor.commands.setTextSelection({ from: contentStart, to: contentEnd });

          // Get the updated selection
          const updatedSelection = editor.state.selection;
          setSelectionRange({ from: updatedSelection.from, to: updatedSelection.to });

          // Extract content below the heading using the node, position, and level
          const contentBelowHeading = aiService.getContentBelowHeading(currentHeading.node, currentHeading.pos, currentHeading.level);

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
    
    console.log('Accept result for command type:', commandType);
    try {
      // Stop any loading animation if it's running
      stopLoadingAnimation();
      
      // For all command types, restore the user's original selection if available
      if (selectionRange) {
        editor.commands.setTextSelection({ from: selectionRange.from, to: selectionRange.to });
      }
      
      // Apply the result to the editor and get the new selection range
      const newSelectionRange = aiService.applyCommandResult(commandType, result);
      
      // For generate and refine commands, update the selection to cover the new content
      if (newSelectionRange) {
        // Select the newly inserted content
        editor.commands.setTextSelection({
          from: newSelectionRange.from,
          to: newSelectionRange.to
        });
        
        console.log(`Updated selection after ${commandType} to:`, newSelectionRange);
      }
      
      // Reset the stored selection range
      setSelectionRange(null);
      
      // Close the dialog
      setAiDialogOpen(false);
    } catch (error) {
      console.error('❌ Error accepting AI command result:', error);
      // Make sure to stop loading animation even if there's an error
      stopLoadingAnimation();
    }
  };

  /**
   * Close the AI command dialog
   */
  const closeAiCommandDialog = () => {
    // Just close the dialog without clearing the selection
    // This allows the user to see what was selected after closing the dialog
    setAiDialogOpen(false);
  };

  return {
    aiDialogOpen,
    aiCommandType,
    aiCommandLoading,
    selectedText, // Include the selected text
    aiService, // Expose the AICommandService instance
    isEditorReadOnly, // Expose the editor readonly state
    openAiCommandDialog,
    closeAiCommandDialog,
    handleAiCommandSubmit,
    handleAcceptResult
  };
}
