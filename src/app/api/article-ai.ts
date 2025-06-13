'use client';

import { ArticlePlanningData } from '../articles/create/components/ArticlePlanningForm';
import { AIGeneratedArticle } from '../articles/create/components/AIArticleSuggestions';
import { apiClient } from './client';

// Interface for title generation request
export interface TitleGenerationRequest {
  content: string;
  keywords?: string[];
  direction?: string;
}

// Interface for title generation response
export interface TitleGenerationResponse {
  titles: string[];
  reasoning?: string;
}

/**
 * API client for AI article generation
 */
export const articleAiApi = {
  /**
   * Generate article suggestions based on planning data
   * @param planningData The article planning data
   * @returns AI-generated article suggestions
   */
  generateArticle: async (planningData: ArticlePlanningData): Promise<AIGeneratedArticle> => {
    try {
      console.log('Making API call to /api/v1/gen/schema with data:', planningData);
      
      // Make API call to the schema generation endpoint using apiClient for authentication
      const response = await apiClient.post('/api/v1/gen/schema', planningData);
      
      console.log('API response received:', response.data);
      
      // Handle the case where the API returns a content property with a JSON string
      let parsedData;
      if (response.data && response.data.content && typeof response.data.content === 'string') {
        try {
          // Parse the JSON string in the content property
          parsedData = JSON.parse(response.data.content);
          console.log('Successfully parsed content JSON:', parsedData);
        } catch (parseError) {
          console.error('Error parsing content JSON:', parseError);
          throw new Error('Failed to parse API response content');
        }
      } else {
        // If the response is already in the expected format
        parsedData = response.data;
      }
      
      // Validate the parsed data
      if (!parsedData || !parsedData.title || !parsedData.outline || !Array.isArray(parsedData.outline)) {
        console.error('Invalid API response structure after parsing:', parsedData);
        throw new Error('Received invalid data structure from API');
      }
      
      // Transform the API response to match our AIGeneratedArticle interface
      return {
        titles: [parsedData.title, ...(parsedData.alternativeTitles || []).slice(0, 3)],
        selectedTitle: parsedData.title,
        outline: parsedData.outline.map((item: any) => ({
          level: item.level,
          heading: item.heading,
          content: item.content || ''
        })),
        introduction: parsedData.introduction,
        conclusion: parsedData.conclusion,
        tags: parsedData.tags || planningData.keywords || []
      };
    } catch (error: any) {
      console.error('Error generating article:', error);
      
      // Enhance error with more context
      if (error.response) {
        const enhancedError = new Error(
          `API error (${error.response.status}): ${error.response.data?.error || error.message}`
        );
        (enhancedError as any).originalError = error;
        (enhancedError as any).status = error.response.status;
        throw enhancedError;
      }
      
      throw error;
    }
  },
  
  /**
   * Regenerate article suggestions based on planning data
   * @param planningData The article planning data
   * @returns AI-generated article suggestions
   */
  regenerateArticle: async (planningData: ArticlePlanningData): Promise<AIGeneratedArticle> => {
    // Add a flag to indicate this is a regeneration request
    const regenerationData = {
      ...planningData,
      isRegeneration: true
    };
    
    // Use the same generateArticle method which now handles the content property correctly
    return articleAiApi.generateArticle(regenerationData);
  },
  
  /**
   * Generate article titles based on content and optional parameters
   * @param request The title generation request data
   * @returns Generated title suggestions
   */
  generateTitles: async (request: TitleGenerationRequest): Promise<TitleGenerationResponse> => {
    try {
      console.log('Making API call to /api/v1/gen/title with data:', request);
      
      // Make API call to the title generation endpoint
      const response = await apiClient.post('/api/v1/gen/title', request);
      
      console.log('Title generation API response received:', response.data);
      
      // Validate the response
      if (!response.data || !response.data.titles || !Array.isArray(response.data.titles)) {
        console.error('Invalid API response structure:', response.data);
        throw new Error('Received invalid data structure from API');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Error generating titles:', error);
      
      // Enhance error with more context
      if (error.response) {
        const enhancedError = new Error(
          `API error (${error.response.status}): ${error.response.data?.error || error.message}`
        );
        (enhancedError as any).originalError = error;
        (enhancedError as any).status = error.response.status;
        throw enhancedError;
      }
      
      throw error;
    }
  }
};





