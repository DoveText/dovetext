/**
 * API client for Markdown AI operations
 * This file contains all API calls related to AI features for the markdown editor
 */
import { apiClient } from './client';

// Interface for content generation request
export interface GenerateContentRequest {
  prompt: string;
  context_before?: string;
  context_after?: string;
  document_title?: string;
  document_tone?: string;
  current_heading_level?: number;
}

// Interface for content generation response
export interface GenerateContentResponse {
  generated_text: string;
  error?: string;
}

// Interface for summarize request
export interface SummarizeRequest {
  text_to_summarize: string;
  parent_heading?: string;
  desired_heading_level: number;
  document_title?: string;
  document_tone?: string;
  document_structure?: any;
  additional_instructions?: string;
}

// Interface for summarize response
export interface SummarizeResponse {
  titles: string[];
  reasoning?: string;
  error?: string;
}

// Interface for refine content request
export interface RefineContentRequest {
  text_to_refine: string;
  prompt: string;
  context_before?: string;
  context_after?: string;
  document_title?: string;
  document_tone?: string;
  current_heading_level?: number;
}

// Interface for refine content response
export interface RefineContentResponse {
  refined_text: string;
  error?: string;
}

/**
 * API client for AI markdown operations
 */
export const markdownAiApi = {
  /**
   * Generate heading title suggestions for content
   * @param params The summarization request parameters
   * @returns AI-generated title suggestions
   */
  summarizeTitle: async (params: SummarizeRequest): Promise<SummarizeResponse> => {
    try {
      // Make API call to the summarize endpoint using apiClient for authentication
      const response = await apiClient.post('/api/v1/gen/summarize/title', params);
      
      return response.data;
    } catch (error) {
      console.error('Error in summarizeContent API call:', error);
      throw error;
    }
  },

  /**
   * Generate content based on prompt and context
   * @param params The content generation request parameters
   * @returns AI-generated content
   */
  generateContent: async (params: GenerateContentRequest): Promise<GenerateContentResponse> => {
    try {
      // Make API call to the generate content endpoint
      const response = await apiClient.post('/api/v1/gen/generate', params);
      
      return response.data;
    } catch (error) {
      console.error('Error in generateContent API call:', error);
      throw error;
    }
  },
  
  /**
   * Refine content based on instructions and context
   * @param params The refine content request parameters
   * @returns Refined content
   */
  refineContent: async (params: RefineContentRequest): Promise<RefineContentResponse> => {
    try {
      // Make API call to the refine content endpoint
      const response = await apiClient.post('/api/v1/gen/refine', params);
      
      return response.data;
    } catch (error) {
      console.error('Error in refineContent API call:', error);
      throw error;
    }
  }
};
