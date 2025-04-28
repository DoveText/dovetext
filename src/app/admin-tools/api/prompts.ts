import { apiClient } from '@/app/api/client';

/**
 * Data transfer object for LLM prompts
 */
export interface LlmPromptDto {
  id?: number;
  name: string;
  description: string;
  prompt: string;
  createdBy?: number;
  updatedBy?: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Type for creating or updating a prompt
 */
export type PromptFormData = {
  name: string;
  description: string;
  prompt: string;
};

export const promptsApi = {
  /**
   * Get all prompts
   */
  async getAllPrompts(): Promise<LlmPromptDto[]> {
    const { data } = await apiClient.get<LlmPromptDto[]>('/api/v1/prompts');
    return data;
  },

  /**
   * Get prompt by ID
   */
  async getPromptById(id: number): Promise<LlmPromptDto> {
    const { data } = await apiClient.get<LlmPromptDto>(`/api/v1/prompts/${id}`);
    return data;
  },

  /**
   * Get prompt by name
   */
  async getPromptByName(name: string): Promise<LlmPromptDto> {
    const { data } = await apiClient.get<LlmPromptDto>(`/api/v1/prompts/name/${encodeURIComponent(name)}`);
    return data;
  },

  /**
   * Create new prompt
   */
  async createPrompt(promptData: PromptFormData): Promise<LlmPromptDto> {
    const { data } = await apiClient.post<LlmPromptDto>('/api/v1/prompts', promptData);
    return data;
  },

  /**
   * Update existing prompt
   */
  async updatePrompt(id: number, promptData: Partial<PromptFormData>): Promise<LlmPromptDto> {
    const { data } = await apiClient.put<LlmPromptDto>(`/api/v1/prompts/${id}`, promptData);
    return data;
  },

  /**
   * Delete prompt
   */
  async deletePrompt(id: number): Promise<void> {
    await apiClient.delete(`/api/v1/prompts/${id}`);
  }
};

/**
 * Legacy hook for backward compatibility
 * @deprecated Use promptsApi directly instead
 */
export const usePromptService = () => {
  return {
    getAllPrompts: promptsApi.getAllPrompts,
    getPromptById: promptsApi.getPromptById,
    getPromptByName: promptsApi.getPromptByName,
    createPrompt: promptsApi.createPrompt,
    updatePrompt: promptsApi.updatePrompt,
    deletePrompt: promptsApi.deletePrompt
  };
};
