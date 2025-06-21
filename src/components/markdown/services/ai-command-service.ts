import { aiApi } from '@/app/admin-tools/api/ai';
import { marked } from 'marked';
import { Editor } from '@tiptap/core';
import { Node as ProseMirrorNode } from 'prosemirror-model';
import { EditorState } from '@tiptap/pm/state';
import { TextSelection } from '@tiptap/pm/state';
import { EditorView } from '@tiptap/pm/view';
import { AICommandType } from '../components/ai-command-dialog';
import { markdownAiApi, GenerateContentRequest, RefineContentRequest, RefineContentResponse } from '@/app/api/markdown-ai';

interface AICommandParams {
  // Common parameters
  prompt?: string;
  instructions?: string;
  topic?: string;
  description?: string;
  content?: string;
  
  // Refine content specific parameters
  text_to_refine?: string;
  context_before?: string;
  context_after?: string;
  document_title?: string;
  document_tone?: string;
  current_heading_level?: number;
  selectedText?: string;
  showContext?: boolean;
}

// Content to be summarized, stored temporarily when opening the summarize dialog
let summarizeContent: string = '';

export class AICommandService {
  private editor: Editor;
  
  constructor(editor: Editor) {
    this.editor = editor;
  }

  async executeCommand(commandType: AICommandType, params: AICommandParams = {}): Promise<string | { titles: string[]; reasoning?: string }> {
    if (!commandType) throw new Error('Command type is required');
    
    switch (commandType) {
      case 'generate':
        return this.generateContent(params);
      case 'refine':
        return this.refineContent(params);
      case 'schema':
        return this.createSchema(params);
      case 'summarize-title':
        return this.summarizeTitle(params);
      default:
        throw new Error(`Unknown command type: ${commandType}`);
    }
  }

  /**
   * Get context before the current paragraph as Markdown
   * Returns a string of Markdown content from before the current paragraph
   */
  getContextBeforeParagraph(limit: number = 1500): string {
    if (!this.editor) return '';
    
    const currentParagraph = this.getCurrentParagraph();
    if (!currentParagraph) return '';
    
    // Get the content before the current paragraph
    const { doc } = this.editor.state;
    const startPos = 0;
    const endPos = currentParagraph.pos;
    
    // Extract text with formatting preserved as much as possible
    let contextBefore = '';
    doc.nodesBetween(startPos, endPos, (node, pos) => {
      if (node.type.name === 'paragraph') {
        contextBefore += node.textContent + '\n\n';
      } else if (node.type.name === 'heading') {
        // Add heading markers based on level
        const level = node.attrs.level;
        const prefix = '#'.repeat(level) + ' ';
        contextBefore += prefix + node.textContent + '\n\n';
      } else if (node.type.name === 'bulletList' || node.type.name === 'orderedList') {
        // Lists are handled by their children
        return true;
      } else if (node.type.name === 'listItem') {
        contextBefore += '- ' + node.textContent + '\n';
      }
      return true;
    });
    
    // Limit the context length
    if (contextBefore.length > limit) {
      // Try to preserve complete markdown blocks when truncating
      const lines = contextBefore.split('\n');
      let truncatedContent = '';
      let currentLength = 0;
      
      // Start from the end to get the most recent context
      for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i];
        if (currentLength + line.length + 1 > limit) break;
        
        truncatedContent = line + '\n' + truncatedContent;
        currentLength += line.length + 1;
      }
      
      contextBefore = truncatedContent;
    }
    
    return contextBefore;
  }
  
  /**
   * Get context after the current paragraph as Markdown
   * Returns a string of Markdown content from after the current paragraph
   */
  getContextAfterParagraph(limit: number = 1500): string {
    if (!this.editor) return '';
    
    const currentParagraph = this.getCurrentParagraph();
    if (!currentParagraph) return '';
    
    // Calculate the position after the current paragraph
    const afterPos = currentParagraph.pos + currentParagraph.node.nodeSize;
    const { doc } = this.editor.state;
    const endPos = doc.content.size;
    
    // Extract text with formatting preserved as much as possible
    let contextAfter = '';
    doc.nodesBetween(afterPos, endPos, (node, pos) => {
      if (node.type.name === 'paragraph') {
        contextAfter += node.textContent + '\n\n';
      } else if (node.type.name === 'heading') {
        // Add heading markers based on level
        const level = node.attrs.level;
        const prefix = '#'.repeat(level) + ' ';
        contextAfter += prefix + node.textContent + '\n\n';
      } else if (node.type.name === 'bulletList' || node.type.name === 'orderedList') {
        // Lists are handled by their children
        return true;
      } else if (node.type.name === 'listItem') {
        contextAfter += '- ' + node.textContent + '\n';
      }
      return true;
    });
    
    // Limit the context length
    if (contextAfter.length > limit) {
      // Try to preserve complete markdown blocks when truncating
      const lines = contextAfter.split('\n');
      let truncatedContent = '';
      let currentLength = 0;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (currentLength + line.length + 1 > limit) break;
        
        truncatedContent += line + '\n';
        currentLength += line.length + 1;
      }
      
      contextAfter = truncatedContent;
    }
    
    return contextAfter;
  }
  
  /**
   * Get the current paragraph as markdown-like text
   * Returns the text representation of the current paragraph
   */
  getCurrentParagraphMarkdown(): string {
    const currentParagraph = this.getCurrentParagraph();
    if (!currentParagraph || !this.editor) return '';
    
    // For paragraphs, just return the text content
    return currentParagraph.text;
  }
  
  /**
   * Get the document title for context
   */
  getDocumentContext(): { title: string; tone: string } {
    return {
      title: this.getDocumentTitle(),
      tone: 'professional' // Default tone, could be made configurable
    };
  }

  /**
   * Generate content based on a prompt
   * Returns raw markdown text that can be used to replace the current paragraph
   */
  private async generateContent(params: AICommandParams): Promise<string> {
    if (!this.editor) return '';
    
    try {
      let contextBefore = '';
      let contextAfter = '';
      
      // Get context before and after
      try {
        contextBefore = this.getContextBeforeParagraph();
        contextAfter = this.getContextAfterParagraph();
      } catch (error) {
        console.warn('Error getting context, continuing with empty context:', error);
      }

      // Get document metadata
      const { title, tone } = this.getDocumentContext();
      
      // Determine the current heading level
      const headingLevel = this.getHeadingLevel();
      
      // Log the context data for debugging
      console.log('Content generation context:', { 
        contextBefore: contextBefore?.substring(0, 100) + '...', 
        contextAfter: contextAfter?.substring(0, 100) + '...', 
        headingLevel
      });
      
      // Prepare the request parameters
      const requestParams: GenerateContentRequest = {
        prompt: params.prompt || 'Generate content according to the context before and after',
        context_before: contextBefore,
        context_after: contextAfter,
        document_title: title,
        document_tone: tone,
        current_heading_level: headingLevel
      };
      
      // Call the API to generate content
      const result = await markdownAiApi.generateContent(requestParams);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      // The API might return a JSON object with the content inside
      // Try to extract just the content field if it's a JSON object
      return result.generated_text;
    } catch (error) {
      console.error('Error generating content:', error);
      throw error;
    }
  }

  private async refineContent(params: AICommandParams): Promise<string> {
    try {
      // Since useAICommandManager now ensures we always have selectedText,
      // we can simplify this method to just use the selected text
      if (!params.selectedText) {
        throw new Error('No text selected for refinement');
      }
      
      // Use the selected text for refinement
      const textToRefine = params.selectedText;
      
      // Get context if requested
      let contextBefore: string = '';
      let contextAfter: string = '';
      if (params.showContext) {
        contextBefore = this.getContextBeforeSelection();
        contextAfter = this.getContextAfterSelection();
      }
      
      // Get document metadata and heading level
      const { title, tone } = this.getDocumentContext();
      const currentHeadingLevel = this.getCurrentHeadingLevel() || 1;
      const prompt = params.prompt || 'Improve clarity and readability';
      
      console.log('Refining content:', {
        textLength: textToRefine.length,
        contextBeforeLength: contextBefore.length,
        contextAfterLength: contextAfter.length,
        showContext: params.showContext
      });
      
      // Call the API
      const response = await markdownAiApi.refineContent({
        text_to_refine: textToRefine,
        prompt: prompt,
        context_before: contextBefore,
        context_after: contextAfter,
        document_title: title,
        document_tone: tone,
        current_heading_level: currentHeadingLevel
      });

      return response.refined_text;
    } catch (error) {
      console.error('Error refining content:', error);
      throw error;
    }
  }

  private async createSchema(params: AICommandParams): Promise<string> {
    try {
      const result = await aiApi.generateSchema({ 
        topic: params.topic || 'Document',
        description: params.description || 'Create a document outline'
      });
      
      // Convert markdown to HTML
      return marked.parse(result.schema) as string;
    } catch (error) {
      console.error('Error generating schema:', error);
      throw error;
    }
  }

  /**
   * Store content to be summarized for use in the dialog
   */
  setSummarizeContent(content: string): void {
    summarizeContent = content;
  }

  /**
   * Get the stored content to be summarized
   */
  getSummarizeContent(): string {
    return summarizeContent;
  }

  /**
   * Generate heading title suggestions for the selected heading content
   * This uses the /api/v1/gen/summarize endpoint to generate title suggestions
   * Uses the stored content from setSummarizeContent or extracts content from the current selection
   */
  private async summarizeTitle(params: AICommandParams = {}): Promise<{ titles: string[]; reasoning?: string }> {
    try {
      // Determine the heading level
      const headingLevel = this.getHeadingLevel();
      
      // Use the stored content from the dialog or extract it if not available
      let contentToSummarize = params.content || summarizeContent;
      
      // If no content is available in params or stored content, try to extract it
      if (!contentToSummarize || !contentToSummarize.trim()) {
        const currentHeadingInfo = this.getCurrentHeading();
        if (currentHeadingInfo !== null) {
          contentToSummarize = this.getContentBelowHeading(currentHeadingInfo.node, currentHeadingInfo.pos, currentHeadingInfo.node.attrs.level);
        }
      }
      
      // If we still don't have content, try to use the paragraph text at the cursor position
      if (!contentToSummarize || !contentToSummarize.trim()) {
        const { selection } = this.editor.state;
        const { $from } = selection;
        const node = $from.parent;
        
        if (node && node.textContent && node.textContent.trim()) {
          contentToSummarize = node.textContent;
        }
      }
      
      // If we still don't have content, try to use content from the parent heading
      if ((!contentToSummarize || !contentToSummarize.trim()) && headingLevel > 1) {
        // Find parent heading (one level up)
        const parentLevel = headingLevel - 1;
        const doc = this.editor.state.doc;
        let parentHeadingPos = null;
        
        // Scan document to find the closest parent heading
        doc.descendants((node, pos) => {
          if (node.type.name === 'heading' && node.attrs.level === parentLevel) {
            // Only consider headings before our current position
            const currentHeadingInfoForParentCheck = this.getCurrentHeading();
            if (currentHeadingInfoForParentCheck !== null && pos < currentHeadingInfoForParentCheck.pos) {
              parentHeadingPos = pos;
            }
          }
          return true;
        });
        
        if (parentHeadingPos !== null) {
          const parentHeadingNode = doc.nodeAt(parentHeadingPos);
          if (parentHeadingNode && parentHeadingNode.type.name === 'heading') {
            const parentContent = this.getContentBelowHeading(parentHeadingNode, parentHeadingPos, parentHeadingNode.attrs.level);
            if (parentContent && parentContent.trim()) {
              contentToSummarize = parentContent;
            }
          }
        }
      }
      
      // Check if we have content to summarize
      if (!contentToSummarize || !contentToSummarize.trim()) {
        throw new Error("You haven't created any content for this section to summarize and generate a title. Please add some content below the heading first.");
      }

      // Extract document structure and context
      const docTitle = this.getDocumentTitle();
      const docTone = 'professional'; // Default tone
      const parentHeading = this.getParentHeading(headingLevel);
      
      // Get document structure for context
      const docStructure = this.getDocumentStructure();
      
      // Add any additional instructions from the user
      const userInstructions = params.description?.trim() || '';
      
      // Call the summarize API using our API client
      const data = await markdownAiApi.summarizeTitle({
        text_to_summarize: contentToSummarize,
        parent_heading: parentHeading,
        desired_heading_level: headingLevel,
        document_title: docTitle,
        document_tone: docTone,
        document_structure: docStructure,
        additional_instructions: userInstructions // Pass any additional instructions from the user
      });
    
      if (data.error) {
        throw new Error(data.error);
      }
    
      // Return the structured data directly
      if (data.titles && Array.isArray(data.titles)) {
        return {
          titles: data.titles,
          reasoning: data.reasoning
        };
      }
    
      return { titles: ['No title suggestions generated'] };
    } catch (error) {
      console.error('Error summarizing content:', error);
      throw error;
    }
  }

  // Helper methods for editor operations
  insertContent(content: string, at?: { from: number, to: number }): void {
    if (at) {
      this.editor.chain().focus()
        .deleteRange(at)
        .insertContent(content)
        .run();
    } else {
      this.editor.chain().focus()
        .insertContent(content)
        .run();
    }
  }

  /**
   * Replace the current selection with new content and return the new selection range
   * @param content The content to insert
   * @returns The new selection range after replacement (from and to positions)
   */
  replaceSelection(content: string): { from: number, to: number } {
    // Get the current selection before replacement
    const { from } = this.editor.state.selection;

    // Delete the current selection and insert the new content
    this.editor.chain().focus()
      .deleteSelection()
      .insertContent(content)
      .run();
    
    // Calculate the end position after insertion
    // The new selection should start at the original 'from' position
    // and end at from + content length (accounting for markdown parsing)
    const newTo = from + content.length;
  
    // Return the new selection range
    return { from, to: newTo };
  }

  replaceAll(content: string): void {
    this.editor.commands.setContent(content);
  }

  /**
   * Extract the document title from the editor content
   * Looks for the first h1 heading or returns a default title
   */
  private getDocumentTitle(): string {
    try {
      // Try to find the first h1 heading
      const doc = this.editor.state.doc;
      let title = '';
      
      // Iterate through nodes to find the first h1
      doc.descendants((node) => {
        if (node.type.name === 'heading' && node.attrs.level === 1) {
          title = node.textContent;
          return false; // Stop iteration after finding the first h1
        }
        return true; // Continue iteration
      });
      
      return title || 'Untitled Document';
    } catch (error) {
      console.error('Error getting document title:', error);
      return 'Untitled Document';
    }
  }

  /**
   * Determine the heading level from the current selection
   * Returns the level of the heading at the current selection or 3 as default
   */
  getHeadingLevel(): number {
    try {
      const { selection } = this.editor.state;
      const { $from } = selection;
      const { doc } = this.editor.state;
      
      // Check if selection is within a heading
      const node = $from.node();
      if (node.type.name === 'heading') {
        return node.attrs.level || 3;
      }
      
      // Check parent nodes for headings
      for (let depth = $from.depth; depth > 0; depth--) {
        const node = $from.node(depth);
        if (node.type.name === 'heading') {
          return node.attrs.level || 3;
        }
      }
      
      // Special case: Check if we're at the beginning of a line that might be a heading
      // This helps with empty headings or when cursor is at the start of a heading
      let pos = $from.pos;
      
      // Look backward to find potential heading
      while (pos > 0) {
        const resolvedPos = doc.resolve(pos);
        if (resolvedPos.nodeBefore && resolvedPos.nodeBefore.type.name === 'heading') {
          return resolvedPos.nodeBefore.attrs.level || 3;
        }
        
        // Move to previous node
        if (resolvedPos.nodeBefore) {
          pos -= resolvedPos.nodeBefore.nodeSize;
        } else {
          break;
        }
      }
      
      // Look forward to find potential heading
      pos = $from.pos;
      while (pos < doc.content.size) {
        const resolvedPos = doc.resolve(pos);
        if (resolvedPos.nodeAfter && resolvedPos.nodeAfter.type.name === 'heading') {
          return resolvedPos.nodeAfter.attrs.level || 3;
        }
        
        // Move to next node
        if (resolvedPos.nodeAfter) {
          pos += resolvedPos.nodeAfter.nodeSize;
        } else {
          break;
        }
      }
      
      // If we're in a section with a red box around it (like in the screenshot),
      // it's likely an H3, so default to that
      return 3;
    } catch (error) {
      console.error('Error getting heading level:', error);
      return 3;
    }
  }

  /**
   * Get the parent heading of the current selection
   * For a heading of level N, finds the closest heading of level N-1 or lower
   */
  private getParentHeading(currentLevel: number): string {
    try {
      if (currentLevel <= 1) return ''; // No parent for h1
      
      const { selection } = this.editor.state;
      const { $from } = selection;
      const targetLevel = currentLevel - 1;
      
      // Start from the current position and go backwards
      let pos = $from.pos;
      let parentHeading = '';
      
      // Iterate through the document backwards to find parent heading
      this.editor.state.doc.nodesBetween(0, pos, (node, nodePos) => {
        if (node.type.name === 'heading' && node.attrs.level <= targetLevel) {
          parentHeading = node.textContent;
          return false; // Stop iteration after finding parent
        }
        return true; // Continue iteration
      });
      
      return parentHeading;
    } catch (error) {
      console.error('Error getting parent heading:', error);
      return '';
    }
  }

  /**
   * Extract the document structure as a hierarchical object
   * Creates a simplified representation of the document's heading structure
   */
  private getDocumentStructure(): Record<string, any> {
    try {
      const structure: Record<string, any> = {};
      const headings: {level: number, title: string, position: number}[] = [];
      
      // First pass: collect all headings with their levels and positions
      this.editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'heading') {
          headings.push({
            level: node.attrs.level,
            title: node.textContent,
            position: pos
          });
        }
        return true;
      });
      
      // Sort headings by position to maintain document order
      headings.sort((a, b) => a.position - b.position);
      
      // Convert flat list to hierarchical structure
      const root: Record<string, any> = { children: [] };
      const stack: {node: Record<string, any>, level: number}[] = [{ node: root, level: 0 }];
      
      headings.forEach(heading => {
        const headingNode = {
          title: heading.title,
          level: heading.level,
          children: []
        };
        
        // Find the appropriate parent in the stack
        while (stack.length > 1 && stack[stack.length - 1].level >= heading.level) {
          stack.pop();
        }
        
        // Add to parent's children
        stack[stack.length - 1].node.children.push(headingNode);
        
        // Add this heading to the stack as potential parent for future headings
        stack.push({ node: headingNode, level: heading.level });
      });
      
      return { headings: root.children };
    } catch (error) {
      console.error('Error getting document structure:', error);
      return { headings: [] };
    }
  }

  /**
   * Get the current heading in the document
   * Returns the position, node, and level of the heading, or null if not in a heading
   */
  getCurrentHeading(): { pos: number; node: ProseMirrorNode; level: number } | null {
    const info = this.getCurrentNode('heading')
    if(info == null) {
      return null;
    }

    return {
      pos: info.pos,
      node: info.node,
      level: info.node.attrs.level || 3
    }
  }

  /**
   * Get the current paragraph node and position
   * Returns the position, node, and text of the paragraph at the current selection, or null if not in a paragraph
   */
  getCurrentParagraph(): { pos: number; node: ProseMirrorNode; text: string } | null {
    const info = this.getCurrentNode('paragraph')
    if (info == null) {
      return null;
    }

    return {
      pos : info.pos,
      node: info.node,
      text: info.node.textContent
    };
  }
  
  /**
   * Get context before the current selection
   * Returns text before the current selection
   */
  getContextBeforeSelection(): string {
    if (!this.editor) return '';
    
    const selection = this.editor.state.selection;
    if (selection.empty) return this.getContextBeforeParagraph();
    
    const startPos = Math.max(0, selection.from - 1500);
    
    // Get text from document between startPos and selection start
    let contextBefore = '';
    const { doc } = this.editor.state;
    
    doc.nodesBetween(startPos, selection.from, (node, pos) => {
      if (node.type.name === 'paragraph') {
        contextBefore += node.textContent + '\n\n';
      } else if (node.type.name === 'heading') {
        // Add heading markers based on level
        const level = node.attrs.level;
        const prefix = '#'.repeat(level) + ' ';
        contextBefore += prefix + node.textContent + '\n\n';
      } else if (node.type.name === 'bulletList' || node.type.name === 'orderedList') {
        // Lists are handled by their children
        return true;
      } else if (node.type.name === 'listItem') {
        contextBefore += '- ' + node.textContent + '\n';
      }
      return true;
    });
    
    return contextBefore;
  }
  
  /**
   * Get context after the current selection
   * Returns text after the current selection
   */
  getContextAfterSelection(): string {
    if (!this.editor) return '';
    
    const selection = this.editor.state.selection;
    if (selection.empty) return this.getContextAfterParagraph();
    
    const { doc } = this.editor.state;
    const endPos = doc.content.size;
    const endLimit = Math.min(endPos, selection.to + 1500);
    
    // Get text from document between selection end and endLimit
    let contextAfter = '';
    
    doc.nodesBetween(selection.to, endLimit, (node, pos) => {
      if (node.type.name === 'paragraph') {
        contextAfter += node.textContent + '\n\n';
      } else if (node.type.name === 'heading') {
        // Add heading markers based on level
        const level = node.attrs.level;
        const prefix = '#'.repeat(level) + ' ';
        contextAfter += prefix + node.textContent + '\n\n';
      } else if (node.type.name === 'bulletList' || node.type.name === 'orderedList') {
        // Lists are handled by their children
        return true;
      } else if (node.type.name === 'listItem') {
        contextAfter += '- ' + node.textContent + '\n';
      }
      return true;
    });
    
    return contextAfter;
  }
  
  /**
   * Get the current heading level at the cursor position or selection
   * Returns the level of the most recent heading above the cursor/selection
   */
  getCurrentHeadingLevel(): number | undefined {
    const { state } = this.editor;
    const { selection } = state;
    const { $from } = selection;
    
    // Walk up the document to find the closest heading
    for (let depth = $from.depth; depth > 0; depth--) {
      const node = $from.node(depth);
      if (node.type.name === 'heading') {
        return node.attrs.level;
      }
    }
    
    // If no heading found, return undefined
    return undefined;
  }
  
  // getDocumentContext is already defined above


  getCurrentNode(typeName: string): { pos: number; node: ProseMirrorNode } | null {
    try {
      const { selection } = this.editor.state;
      const { $from } = selection; // $from is a ResolvedPos

      // Iterate from the current resolved position's depth upwards to find an ancestor heading.
      for (let d = $from.depth; d > 0; d--) { // d > 0 because depth 0 is the doc itself
        const ancestorNode: ProseMirrorNode | null = $from.node(d);
        if (ancestorNode && ancestorNode.type.name === typeName) {
          console.log('Find node from ' + $from.start(d) + ' to ' + $from.end(d))
          const headingStartPosition = $from.start(d);
          return { pos: headingStartPosition, node: ancestorNode };
        }
      }

      return null; // Default if no heading is found by any means
    } catch (error) {
      console.error('Error getting current heading position:', error);
      return null;
    }
  }

  /**
   * Get the text content of the current heading
   * Returns the text of the heading at the current selection, or null if not in a heading
   */
  getCurrentHeadingText(): string {
    const currentHeading = this.getCurrentHeading();
    if (!currentHeading) return '';
    
    return currentHeading.node.textContent || '';
  }

  /**
   * Get content below the given heading node until the next heading of the same or lower level.
   * @param currentHeadingNode The ProseMirror node of the heading to get content below.
   * @param currentHeadingPos The start position of the currentHeadingNode.
   * @param referenceHeadingLevel The level of the currentHeadingNode, used to find the next boundary.
   * @returns The content as markdown text, or an empty string if no content or error.
   */
  getContentBelowHeading(currentHeadingNode: ProseMirrorNode | null, currentHeadingPos: number, referenceHeadingLevel: number): string {
    try {
      const doc = this.editor.state.doc;

      if (!currentHeadingNode || !currentHeadingNode.type || currentHeadingNode.type.name !== 'heading') {
        return '';
      }

      // Ensure currentHeadingPos is non-negative.
      const normalizedHeadingPos = currentHeadingPos < 0 ? 0 : currentHeadingPos;

      let contentStart = normalizedHeadingPos + currentHeadingNode.nodeSize;
      let contentEnd = doc.content.size; // Default to end of document

      // Find the end position (next heading of same or numerically lower level)
      let foundEnd = false;
      doc.nodesBetween(contentStart, doc.content.size, (node: ProseMirrorNode, pos: number) => {
        if (foundEnd) return false; // Stop if we've already found the end

        if (node.type.name === 'heading' && node.attrs.level <= referenceHeadingLevel) {
          contentEnd = pos; // The new heading starts at 'pos', so content is up to this point
          foundEnd = true;

          return false; // Stop iterating
        }
        return true; // Continue iterating
      });

      if (contentStart >= contentEnd) {
        return '';
      }

      const slice = doc.slice(contentStart, contentEnd);
      let extractedMarkdown = '';

      // Convert the slice to markdown text more robustly
      slice.content.forEach((node: ProseMirrorNode) => {
        if (node.isTextblock) {
          if (node.type.name === 'heading') {
            const level = node.attrs.level;
            const prefix = '#'.repeat(level) + ' ';
            extractedMarkdown += prefix + node.textContent + '\n\n';
          } else if (node.type.name === 'paragraph') {
            if (node.textContent.trim() !== '') { // Avoid empty paragraphs if desired
              extractedMarkdown += node.textContent + '\n\n';
            }
          } else if (node.type.name === 'blockquote') {
            // Basic blockquote handling, might need recursion for nested
            const lines = node.textContent.split('\n');
            lines.forEach(line => extractedMarkdown += '> ' + line + '\n');
            extractedMarkdown += '\n';
          } else if (node.type.name === 'code_block') {
            extractedMarkdown += '```' + (node.attrs.language || '') + '\n';
            extractedMarkdown += node.textContent + '\n';
            extractedMarkdown += '```\n\n';
          } else if (node.type.name === 'ordered_list' || node.type.name === 'bullet_list') {
            node.forEach((listItem: ProseMirrorNode, _: number, index: number) => {
              const prefix = node.type.name === 'ordered_list' ? `${index + 1}. ` : '- ';
              // Assuming listItem contains paragraph(s)
              listItem.forEach((listItemContent: ProseMirrorNode) => {
                extractedMarkdown += prefix + listItemContent.textContent + '\n';
              });
            });
            extractedMarkdown += '\n';
          } else {
            // Generic fallback for other text blocks
            extractedMarkdown += node.textContent + '\n\n';
          }
        } else if (node.type.name === 'horizontal_rule') {
          extractedMarkdown += '---'+'\n\n';
        } 
        // Add other node type conversions as needed (e.g., images, tables)
      });
      
      return extractedMarkdown.trim();
    } catch (error) {
      console.error('Error in getContentBelowHeading:', error);
      return '';
    }
  }

  /**
   * Apply the summarize command result by replacing the heading title
   * This is called when the user selects a title from the suggestions
   * @returns The new selection range after replacement (for generate and refine commands)
   */
  applyCommandResult(commandType: AICommandType, result: string): { from: number, to: number } | null {
    if (commandType === 'summarize-title') {
      // For summarize, simply replace the current selection (which should be the heading text)
      // with the selected title
      return this.replaceSelection(result);
    } else if (commandType === 'generate' || commandType === 'refine') {
      // For generate and refine, insert the content at cursor position or replace selection
      return this.replaceSelection(result);
    } else if (commandType === 'schema') {
      // For schema, replace the entire document
      this.replaceAll(result);
      return null; // No specific selection range for schema replacement
    }
    
    return null; // Default return
  }
}
