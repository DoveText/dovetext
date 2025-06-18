/**
 * API client for Markdown AI operations
 * This file contains all API calls related to AI features for the markdown editor
 */
import { apiClient } from './client';

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
  }
};
