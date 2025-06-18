import { aiApi } from '@/app/admin-tools/api/ai';
import { marked } from 'marked';
import { Editor } from '@tiptap/core';
import { Node as ProseMirrorNode } from 'prosemirror-model';
import { EditorState } from '@tiptap/pm/state';
import { EditorView } from '@tiptap/pm/view';
import { AICommandType } from '../components/ai-command-dialog';
import { markdownAiApi } from '@/app/api/markdown-ai';

interface AICommandParams {
  prompt?: string;
  instructions?: string;
  topic?: string;
  description?: string;
  content?: string;
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
      case 'summarize':
        return this.summarizeContent(params);
      default:
        throw new Error(`Unknown command type: ${commandType}`);
    }
  }

  private async generateContent(params: AICommandParams): Promise<string> {
    try {
      const result = await aiApi.generateContent({ 
        prompt: params.prompt || 'Generate content'
      });
      
      // Convert markdown to HTML
      return marked.parse(result.content) as string;
    } catch (error) {
      console.error('Error generating content:', error);
      throw error;
    }
  }

  private async refineContent(params: AICommandParams): Promise<string> {
    try {
      // Get the current selection or all content
      const selection = this.editor.state.selection;
      const hasSelection = !selection.empty;
      
      const contentToRefine = params.content || (hasSelection 
        ? this.editor.state.doc.textBetween(selection.from, selection.to)
        : this.editor.getText());
      
      if (!contentToRefine.trim()) {
        throw new Error('No content to refine');
      }
      
      const result = await aiApi.refineContent({ 
        content: contentToRefine,
        instructions: params.instructions || 'Improve clarity and readability'
      });
      
      // Convert markdown to HTML
      return marked.parse(result.refined_content) as string;
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
  private async summarizeContent(params: AICommandParams = {}): Promise<{ titles: string[]; reasoning?: string }> {
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
          console.log('Using paragraph text as content:', node.textContent);
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
            console.log('Trying to use parent heading content at level', parentHeadingNode.attrs.level);
            const parentContent = this.getContentBelowHeading(parentHeadingNode, parentHeadingPos, parentHeadingNode.attrs.level);
            if (parentContent && parentContent.trim()) {
              contentToSummarize = parentContent;
              console.log('Using parent heading content:', contentToSummarize.substring(0,100) + '...');
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
      const data = await markdownAiApi.summarizeContent({
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

  replaceSelection(content: string): void {
    this.editor.chain().focus()
      .deleteSelection()
      .insertContent(content)
      .run();
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
      
      console.log('Getting heading level at position:', $from.pos);
      
      // Check if selection is within a heading
      const node = $from.node();
      if (node.type.name === 'heading') {
        console.log('Found heading level directly:', node.attrs.level);
        return node.attrs.level || 3;
      }
      
      // Check parent nodes for headings
      for (let depth = $from.depth; depth > 0; depth--) {
        const node = $from.node(depth);
        if (node.type.name === 'heading') {
          console.log('Found heading level at depth', depth, ':', node.attrs.level);
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
          console.log('Found heading level by looking backward:', resolvedPos.nodeBefore.attrs.level);
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
          console.log('Found heading level by looking forward:', resolvedPos.nodeAfter.attrs.level);
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
      console.log('No heading found, defaulting to level 3');
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
    try {
      const { selection } = this.editor.state;
      const { $from } = selection; // $from is a ResolvedPos
      const { doc } = this.editor.state;

      console.log('Attempting to find heading. Cursor at pos:', $from.pos, 'depth:', $from.depth);

      // Iterate from the current resolved position's depth upwards to find an ancestor heading.
      for (let d = $from.depth; d > 0; d--) { // d > 0 because depth 0 is the doc itself
        const ancestorNode: ProseMirrorNode | null = $from.node(d);
        if (ancestorNode && ancestorNode.type.name === 'heading') {
          const headingStartPosition = $from.start(d);
          const headingLevel = ancestorNode.attrs.level || 3;
          console.log(`Found ancestor heading node '${ancestorNode.textContent.substring(0,30)}...' (type: ${ancestorNode.type.name}, level: ${headingLevel}) at depth ${d}. Starts at: ${headingStartPosition}. Size: ${ancestorNode.nodeSize}`);
          return { pos: headingStartPosition, node: ancestorNode, level: headingLevel };
        }
      }

      console.log('No heading found for position:', $from.pos);
      return null; // Default if no heading is found by any means
    } catch (error) {
      console.error('Error getting current heading position:', error);
      return null;
    }
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
        console.log('getContentBelowHeading: Invalid or null heading node provided.');
        return '';
      }

      // Ensure currentHeadingPos is non-negative.
      const normalizedHeadingPos = currentHeadingPos < 0 ? 0 : currentHeadingPos;
      console.log(`getContentBelowHeading: Processing heading '${currentHeadingNode.textContent.substring(0, 30)}...' (level ${currentHeadingNode.attrs.level}) at pos ${normalizedHeadingPos}. Ref level for next: ${referenceHeadingLevel}`);

      let contentStart = normalizedHeadingPos + currentHeadingNode.nodeSize;
      let contentEnd = doc.content.size; // Default to end of document

      // Find the end position (next heading of same or numerically lower level)
      let foundEnd = false;
      doc.nodesBetween(contentStart, doc.content.size, (node: ProseMirrorNode, pos: number) => {
        if (foundEnd) return false; // Stop if we've already found the end

        if (node.type.name === 'heading' && node.attrs.level <= referenceHeadingLevel) {
          contentEnd = pos; // The new heading starts at 'pos', so content is up to this point
          foundEnd = true;
          console.log(`Found next heading '${node.textContent.substring(0, 20)}...' (level ${node.attrs.level}) at pos ${pos}, ending current section.`);
          return false; // Stop iterating
        }
        return true; // Continue iterating
      });

      console.log('Calculated content range for summarization:', contentStart, 'to', contentEnd);

      if (contentStart >= contentEnd) {
        console.log('Content start is at or after content end. No content to extract.');
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
      
      console.log('Extracted Markdown:', extractedMarkdown.substring(0, 200) + (extractedMarkdown.length > 200 ? '...' : ''));
      return extractedMarkdown.trim();

    } catch (error) {
      console.error('Error in getContentBelowHeading:', error);
      return '';
    }
  }

  /**
   * Apply the summarize command result by replacing the heading title
   * This is called when the user selects a title from the suggestions
   */
  applyCommandResult(commandType: AICommandType, result: string): void {
    if (commandType === 'summarize') {
      // For summarize, we expect the result to be the selected title text directly
      // No need to extract from HTML anymore as we're passing the raw title
      const title = result;
      
      // Find the current heading position
      const currentHeadingInfo = this.getCurrentHeading();
      if (currentHeadingInfo !== null) {
        // Get the heading node and its position directly from currentHeadingInfo
        const { doc } = this.editor.state; // doc might still be needed for other operations or if we revert
        const headingNode = currentHeadingInfo.node;
        const headingStart = currentHeadingInfo.pos;
        const headingEnd = currentHeadingInfo.pos + currentHeadingInfo.node.nodeSize;
        
        if (headingNode) {
          // Replace the heading content with the selected title
          this.editor.chain().focus()
            .deleteRange({ from: headingStart + 1, to: headingEnd - 1 }) // +1 and -1 to preserve the heading node itself
            .insertContentAt(headingStart + 1, title)
            .run();
          return;
        }
      }
      
      // Fallback: If not in a heading or heading not found, just insert at cursor position
      this.editor.chain().focus()
        .insertContent(title)
        .run();
    } else if (commandType === 'generate' || commandType === 'refine') {
      // For generate and refine, insert the content at cursor position or replace selection
      this.replaceSelection(result);
    } else if (commandType === 'schema') {
      // For schema, replace the entire document
      this.replaceAll(result);
    }
  }
}
