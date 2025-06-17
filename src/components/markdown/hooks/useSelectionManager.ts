import { useState, useEffect } from 'react';
import { EditorInstance as Editor } from 'novel';

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
        setSelectionState({ from, to });
        setHasSelection(true);
        setSelectedText(text);
      } else {
        // Clear selection state when text is deselected
        setSelectionState(null);
        setHasSelection(false);
        setSelectedText('');
      }
    };

    // Add document-level click handler to maintain selection when clicking outside editor
    const handleDocumentClick = (event: MouseEvent) => {
      // Skip if dialog is open
      if (isDialogOpen) return;
      
      // Skip if clicking on form controls or interactive elements
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || 
          target.tagName === 'BUTTON' || 
          target.tagName === 'SELECT' || 
          target.tagName === 'TEXTAREA' || 
          target.tagName === 'LABEL' ||
          target.closest('.dropdown') || // Skip dropdown menus
          target.closest('button') || // Skip buttons and their children
          target.closest('input') || // Skip inputs and their children
          target.getAttribute('role') === 'button') {
        return;
      }
      
      // If we have a stored selection and it's still valid
      if (selectionState && hasSelection) {
        // Check if the click is outside the editor
        if (!editor.view.dom.contains(event.target as Node)) {
          // Focus the editor
          editor.view.focus();
          
          // Restore the selection - safely handle different selection types
          try {
            const { from, to } = selectionState;
            const { state } = editor;
            
            // Create a text selection directly instead of using constructor.create
            const { TextSelection } = require('@tiptap/pm/state');
            const newSelection = TextSelection.create(state.doc, from, to);
            
            const transaction = state.tr.setSelection(newSelection);
            editor.view.dispatch(transaction);
          } catch (error) {
            console.error('Failed to restore selection:', error);
            // Don't throw - just log the error and continue
          }
          
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
    
    // Use setTimeout to ensure any dialogs are fully closed
    setTimeout(() => {
      if (!editor) return;
      
      // Focus the editor
      editor.view.focus();
      
      // Only restore if we have a valid selection
      if (hasSelection) {
        try {
          const { from, to } = selectionState;
          const { state } = editor;
          
          // Create a text selection directly instead of using constructor.create
          const { TextSelection } = require('@tiptap/pm/state');
          const newSelection = TextSelection.create(state.doc, from, to);
          
          const transaction = state.tr.setSelection(newSelection);
          editor.view.dispatch(transaction);
        } catch (error) {
          console.error('Failed to restore selection:', error);
          // Don't throw - just log the error and continue
        }
      }
    }, 10);
  };

  return {
    selectionState,
    hasSelection,
    selectedText,
    restoreSelection
  };
}
