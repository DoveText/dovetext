import { useState, useEffect } from 'react';
import { Editor } from 'novel';

interface SelectionState {
  from: number;
  to: number;
}

/**
 * Hook to manage editor selection state, including:
 * - Tracking selection changes
 * - Restoring selection when clicking outside the editor
 * - Preserving selection when dialog closes
 */
export function useSelectionManager(editor: Editor | null, isDialogOpen: boolean = false) {
  const [selectionState, setSelectionState] = useState<SelectionState | null>(null);
  const [hasSelection, setHasSelection] = useState(false);
  const [selectedText, setSelectedText] = useState<string>('');

  useEffect(() => {
    if (!editor) return;

    // Store selection state when selection changes
    const handleSelectionUpdate = ({ editor }: { editor: Editor }) => {
      const { from, to } = editor.state.selection;
      const hasCurrentSelection = from !== to;
      
      if (hasCurrentSelection) {
        const text = editor.state.doc.textBetween(from, to);
        console.log('🔍 Storing selection state:', { from, to, text });
        setSelectionState({ from, to });
        setHasSelection(true);
        setSelectedText(text);
      } else {
        setHasSelection(false);
        setSelectedText('');
      }
    };

    // Add document-level click handler to maintain selection when clicking outside editor
    const handleDocumentClick = (event: MouseEvent) => {
      // Skip if dialog is open
      if (isDialogOpen) return;
      
      // If we have a stored selection
      if (selectionState) {
        // Check if the click is outside the editor
        if (!editor.view.dom.contains(event.target as Node)) {
          console.log('🔍 Click outside editor, restoring selection');
          
          // Focus the editor
          editor.view.focus();
          
          // Restore the selection
          const { from, to } = selectionState;
          const transaction = editor.state.tr.setSelection(
            editor.state.selection.constructor.create(
              editor.state.doc,
              from,
              to
            )
          );
          editor.view.dispatch(transaction);
          
          // Prevent default behavior
          event.preventDefault();
        }
      }
    };
    
    // Register event listeners
    editor.on('selectionUpdate', handleSelectionUpdate);
    document.addEventListener('click', handleDocumentClick);
    
    // Clean up event listeners
    return () => {
      editor.off('selectionUpdate', handleSelectionUpdate);
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [editor, selectionState, isDialogOpen]);

  /**
   * Restore the selection in the editor
   */
  const restoreSelection = () => {
    if (!editor || !selectionState) return;
    
    console.log('🔍 Restoring selection state:', selectionState);
    
    // Use setTimeout to ensure any dialogs are fully closed
    setTimeout(() => {
      if (!editor) return;
      
      // Focus the editor
      editor.view.focus();
      
      // Restore the selection
      const { from, to } = selectionState;
      const transaction = editor.state.tr.setSelection(
        editor.state.selection.constructor.create(
          editor.state.doc,
          from,
          to
        )
      );
      editor.view.dispatch(transaction);
      
      console.log('🔍 Selection restored');
    }, 10);
  };

  return {
    selectionState,
    hasSelection,
    selectedText,
    restoreSelection
  };
}
