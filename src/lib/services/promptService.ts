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

/**
 * Service for interacting with LLM prompt APIs
 */
export const promptService = {
  /**
   * Get all prompts
   */
  getAllPrompts: async (): Promise<LlmPromptDto[]> => {
    const response = await fetch('/api/prompts', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
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
    const response = await fetch(`/api/prompts/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
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
    const response = await fetch(`/api/prompts/name/${encodeURIComponent(name)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
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
    const response = await fetch('/api/prompts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
    const response = await fetch(`/api/prompts/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
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
    const response = await fetch(`/api/prompts/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete prompt');
    }
  }
};
