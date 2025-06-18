import { EditorInstance } from 'novel';
import { defaultExtensions } from '../extensions';
import { JSONContent } from '@tiptap/react';
import { parseInitialContent } from '../utils/content-formatter';
import { slashCommand } from './slash-command';

export interface EditorConfigProps {
  initialContent: string | JSONContent;
  format: 'markdown' | 'html' | 'json';
  placeholder: string;
  onUpdate: (editor: EditorInstance) => void;
  onSelectionUpdate: (editor: EditorInstance) => void;
}

/**
 * Get editor configuration options
 */
export function getEditorConfig({
  initialContent,
  format,
  placeholder,
  onUpdate,
  onSelectionUpdate
}: EditorConfigProps) {
  // Parse initial content based on format
  const parsedContent = parseInitialContent(initialContent, format, defaultExtensions);
  
  return {
    extensions: [...defaultExtensions, slashCommand] as any,
    content: parsedContent,
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-2xl focus:outline-none',
      },
      transformPastedHTML: (html: string) => {
        return html.replace(/<img.*?>/g, (match: string) => {
          return match.replace(/width="(\d+)"/, 'width="100%"').replace(/height="(\d+)"/, '');
        });
      }
    },
    onUpdate: ({ editor }: { editor: EditorInstance }) => {
      onUpdate(editor);
    },
    onSelectionUpdate: ({ editor }: { editor: EditorInstance }) => {
      onSelectionUpdate(editor);
    },
  };
}

/**
 * Get the current paragraph text at the cursor position
 */
export function getCurrentParagraphText(editor: EditorInstance): string {
  const { selection } = editor.state;
  const { $from } = selection;
  const node = $from.parent;
  
  if (node.type.name === 'paragraph') {
    return node.textContent;
  }
  
  return '';
}

/**
 * Get the previous paragraph text if current paragraph is empty
 */
export function getPreviousParagraphText(editor: EditorInstance): string {
  const { selection } = editor.state;
  const { $from } = selection;
  const node = $from.parent;
  
  // If current paragraph is not empty, return its text
  if (node.type.name === 'paragraph' && node.textContent.trim() !== '') {
    return node.textContent;
  }
  
  // Try to get previous paragraph
  const pos = $from.before();
  const resolvedPos = editor.state.doc.resolve(pos);
  const prevNode = resolvedPos.parent;
  
  if (prevNode && prevNode.type.name === 'paragraph') {
    return prevNode.textContent;
  }
  
  return '';
}
