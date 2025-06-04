import { aiApi } from '@/app/admin-tools/api/ai';
import { marked } from 'marked';
import { Editor } from '@tiptap/react';

export type AICommandType = 'generate' | 'refine' | 'schema' | null;

interface AICommandParams {
  prompt?: string;
  instructions?: string;
  topic?: string;
  description?: string;
  content?: string;
}

export class AICommandService {
  private editor: Editor;
  
  constructor(editor: Editor) {
    this.editor = editor;
  }

  async executeCommand(commandType: AICommandType, params: AICommandParams): Promise<string> {
    if (!commandType) throw new Error('Command type is required');
    
    switch (commandType) {
      case 'generate':
        return this.generateContent(params);
      case 'refine':
        return this.refineContent(params);
      case 'schema':
        return this.createSchema(params);
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
}
