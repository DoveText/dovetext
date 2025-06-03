import { apiClient } from '@/app/api/client';

export interface GenerateContentRequest {
  prompt: string;
}

export interface GenerateContentResponse {
  content: string;
}

export interface RefineContentRequest {
  content: string;
  instructions: string;
}

export interface RefineContentResponse {
  refined_content: string;
}

export interface SchemaRequest {
  topic: string;
  description?: string;
}

export interface SchemaResponse {
  schema: string;
}

/**
 * AI service for content generation and refinement
 */
export const aiApi = {
  /**
   * Generate content based on a prompt
   */
  async generateContent(request: GenerateContentRequest): Promise<GenerateContentResponse> {
    try {
      const response = await apiClient.post('/api/v1/gen/generate', request);
      return response.data;
    } catch (error) {
      console.error('Error generating content:', error);
      throw error;
    }
  },

  /**
   * Refine existing content based on instructions
   */
  async refineContent(request: RefineContentRequest): Promise<RefineContentResponse> {
    try {
      const response = await apiClient.post('/api/v1/gen/refine', request);
      return response.data;
    } catch (error) {
      console.error('Error refining content:', error);
      throw error;
    }
  },

  /**
   * Generate a document schema/outline based on a topic
   */
  async generateSchema(request: SchemaRequest): Promise<SchemaResponse> {
    try {
      const response = await apiClient.post('/api/v1/gen/schema', request);
      return response.data;
    } catch (error) {
      console.error('Error generating schema:', error);
      throw error;
    }
  }
};

/**
 * Hook for using the AI API
 */
export function useAiService() {
  return {
    generateContent: aiApi.generateContent,
    refineContent: aiApi.refineContent,
    generateSchema: aiApi.generateSchema
  };
}
