import { Editor } from '@tiptap/react';

/**
 * Utility functions for checking editor state and node types
 */

/**
 * Check if the current node at cursor position is a heading
 * @param editor The editor instance
 * @returns boolean indicating if cursor is on a heading
 */
export const isHeading = (editor: Editor | null): boolean => {
  return editor?.isActive('heading') || false;
};

/**
 * Check if the current node at cursor position is a paragraph
 * @param editor The editor instance
 * @returns boolean indicating if cursor is on a paragraph
 */
export const isParagraph = (editor: Editor | null): boolean => {
  return editor?.isActive('paragraph') || false;
};

/**
 * Check if the current paragraph is empty
 * @param editor The editor instance
 * @returns boolean indicating if the current paragraph is empty
 */
export const isParagraphEmpty = (editor: Editor | null): boolean => {
  if (!editor || !isParagraph(editor)) return false;
  
  const { from } = editor.state.selection;
  const node = editor.state.doc.nodeAt(from);
  return !node || !node.textContent || node.textContent.trim() === '';
};

/**
 * Check if the current selection spans multiple nodes
 * @param editor The editor instance
 * @returns boolean indicating if selection spans multiple nodes
 */
export const hasMultiNodeSelection = (editor: Editor | null): boolean => {
  if (!editor) return false;
  
  const { from, to } = editor.state.selection;
  if (from === to) return false;
  
  // Get the position of the start and end of the selection
  const startPos = editor.state.doc.resolve(from);
  const endPos = editor.state.doc.resolve(to);
  
  // Check if they are in different nodes
  return startPos.parent !== endPos.parent;
};

/**
 * Check if the current selection contains any heading nodes
 * @param editor The editor instance
 * @returns boolean indicating if selection contains headings
 */
export const selectionContainsHeading = (editor: Editor | null): boolean => {
  if (!editor) return false;
  
  const { from, to } = editor.state.selection;
  if (from === to) return false;
  
  let containsHeading = false;
  editor.state.doc.nodesBetween(from, to, (node: any) => {
    if (node.type.name === 'heading') {
      containsHeading = true;
      return false; // Stop traversal
    }
    return true; // Continue traversal
  });
  
  return containsHeading;
};

/**
 * Get the heading level of the current node if it's a heading
 * @param editor The editor instance
 * @returns number representing heading level (1-6) or null if not a heading
 */
export const getHeadingLevel = (editor: Editor | null): number | null => {
  if (!editor || !isHeading(editor)) return null;
  
  for (let level = 1; level <= 6; level++) {
    if (editor.isActive('heading', { level })) {
      return level;
    }
  }
  
  return null;
};

/**
 * Check if the editor has any text selected
 * @param editor The editor instance
 * @returns boolean indicating if there is a text selection
 */
export const hasSelection = (editor: Editor | null): boolean => {
  if (!editor) return false;
  
  const { from, to } = editor.state.selection;
  return from !== to;
};

/**
 * Get the selected text from the editor
 * @param editor The editor instance
 * @returns string of selected text or empty string if no selection
 */
export const getSelectedText = (editor: Editor | null): string => {
  if (!editor || !hasSelection(editor)) return '';
  
  const { from, to } = editor.state.selection;
  return editor.state.doc.textBetween(from, to, ' ');
};
