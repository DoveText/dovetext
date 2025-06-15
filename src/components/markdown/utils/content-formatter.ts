import { JSONContent } from '@tiptap/react';
import { Editor } from 'novel';
import { marked } from 'marked';
import TurndownService from 'turndown';
import { generateJSON } from '@tiptap/html';
import { Extension } from '@tiptap/core';

/**
 * Utility functions for converting between different content formats
 * (markdown, HTML, JSON) for the editor
 */

/**
 * Count words in a text string
 */
export function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

/**
 * Parse initial content into the format expected by the editor
 */
export function parseInitialContent(
  initialContent: string | JSONContent,
  format: 'markdown' | 'html' | 'json',
  extensions: Extension[]
): JSONContent {
  // If content is already in JSON format, return it
  if (typeof initialContent !== 'string') {
    return initialContent as JSONContent;
  }
  
  if (!initialContent || initialContent.trim() === '') {
    return {
      type: 'doc',
      content: [{ type: 'paragraph' }]
    };
  }
  
  // If format is markdown, convert markdown to HTML first, then to JSON
  if (format === 'markdown') {
    try {
      // Convert markdown to HTML
      const html = marked.parse(initialContent) as string;
      // Convert HTML to JSON
      return generateJSON(html, extensions);
    } catch (error) {
      console.error('Error converting markdown to JSON:', error);
    }
  }
  
  // Fallback or if format is not markdown
  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: initialContent }]
      }
    ]
  };
}

/**
 * Get formatted content from the editor based on the desired format
 */
export function getFormattedContent(
  editor: Editor,
  format: 'markdown' | 'html' | 'json' = 'markdown'
): string | JSONContent {
  if (format === 'json') {
    return editor.getJSON();
  }
  
  if (format === 'html') {
    return editor.getHTML();
  }
  
  // Default: convert to markdown
  const html = editor.getHTML();
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced'
  });
  
  return turndownService.turndown(html);
}
