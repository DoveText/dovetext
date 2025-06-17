import { Editor } from '@tiptap/react';
import { isHeading, isParagraph, isParagraphEmpty, selectionContainsHeading } from './editor-state';

/**
 * Command types for categorizing different commands
 */
export enum CommandType {
  AI = 'ai',
  FORMAT = 'format',
  STRUCTURE = 'structure',
  MEDIA = 'media'
}

/**
 * Command metadata registry for all commands in the editor
 */
export const COMMAND_METADATA: Record<string, { 
  type: CommandType;
  description?: string;
}> = {
  // AI Commands
  "Generate Content": { type: CommandType.AI, description: "Generate content using AI" },
  "Refine Content": { type: CommandType.AI, description: "Refine selected content using AI" },
  "Summarize Content": { type: CommandType.AI, description: "Summarize content using AI" },
  "Create Outline": { type: CommandType.AI, description: "Create an outline from document" }
};

/**
 * Helper function to check if a command is an AI command
 */
export const isAICommand = (title: string): boolean => {
  return COMMAND_METADATA[title]?.type === CommandType.AI;
};

/**
 * Get all AI command titles
 */
export const getAICommandTitles = (): string[] => {
  return Object.keys(COMMAND_METADATA).filter(title => 
    COMMAND_METADATA[title].type === CommandType.AI
  );
};

/**
 * Check if an AI command should be enabled based on editor context
 */
export const isAICommandEnabled = (commandTitle: string, editor: Editor | null): boolean => {
  if (!editor) return false;
  
  switch (commandTitle) {
    case "Generate Content":
      return !isHeading(editor);
    case "Refine Content":
      return !(
        (isParagraph(editor) && isParagraphEmpty(editor)) || 
        (!isParagraph(editor) && !editor.state.selection.content().size) || 
        selectionContainsHeading(editor)
      );
    case "Summarize Content":
      return isHeading(editor);
    case "Create Outline":
      return !!editor.getText().trim();
    default:
      return true; // Non-AI commands are always enabled
  }
};
