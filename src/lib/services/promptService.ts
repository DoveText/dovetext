/**
 * Data transfer object for LLM prompts
 */
interface LlmPromptDto {
  id?: number;
  name: string;
  description: string;
  prompt: string;
  createdBy?: number;
  updatedBy?: number;
  createdAt?: string;
  updatedAt?: string;
}

import { useAuth } from '@/context/AuthContext';

/**
 * Create a service for interacting with LLM prompt APIs
 */
export const createPromptService = () => {
  const { getIdToken } = useAuth();
  
  // Service implementation with proper authentication
  const service = {
    /**
     * Get auth headers for API requests
     */
    getAuthHeaders: async (): Promise<HeadersInit> => {
      // Get the current user's token from Auth context
      const token = await getIdToken();
      
      return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      };
    },
    
    /**
     * Get all prompts
     */
    getAllPrompts: async (): Promise<LlmPromptDto[]> => {
      const headers = await service.getAuthHeaders();
      
      const response = await fetch('/api/v1/prompts', {
        method: 'GET',
        headers
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch prompts');
      }
      
      return response.json();
    },
    
    /**
     * Get prompt by ID
     */
    getPromptById: async (id: number): Promise<LlmPromptDto> => {
      const headers = await service.getAuthHeaders();
      
      const response = await fetch(`/api/v1/prompts/${id}`, {
        method: 'GET',
        headers
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch prompt');
      }
      
      return response.json();
    },
    
    /**
     * Get prompt by name
     */
    getPromptByName: async (name: string): Promise<LlmPromptDto> => {
      const headers = await service.getAuthHeaders();
      
      const response = await fetch(`/api/v1/prompts/name/${encodeURIComponent(name)}`, {
        method: 'GET',
        headers
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch prompt by name');
      }
      
      return response.json();
    },
    
    /**
     * Create new prompt
     */
    createPrompt: async (promptData: Omit<LlmPromptDto, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>): Promise<LlmPromptDto> => {
      const headers = await service.getAuthHeaders();
      
      const response = await fetch('/api/v1/prompts', {
        method: 'POST',
        headers,
        body: JSON.stringify(promptData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create prompt');
      }
      
      return response.json();
    },
    
    /**
     * Update existing prompt
     */
    updatePrompt: async (id: number, promptData: Partial<LlmPromptDto>): Promise<LlmPromptDto> => {
      const headers = await service.getAuthHeaders();
      
      const response = await fetch(`/api/v1/prompts/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(promptData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update prompt');
      }
      
      return response.json();
    },
    
    /**
     * Delete prompt
     */
    deletePrompt: async (id: number): Promise<void> => {
      const headers = await service.getAuthHeaders();
      
      const response = await fetch(`/api/v1/prompts/${id}`, {
        method: 'DELETE',
        headers
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete prompt');
      }
    }
  };
  
  return service;
};

// Custom hook for using the prompt service within React components
export const usePromptService = () => {
  return createPromptService();
};
