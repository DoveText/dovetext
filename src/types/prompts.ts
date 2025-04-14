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
 * Form data for creating/editing prompts
 */
export interface PromptFormData {
  name: string;
  description: string;
  prompt: string;
}
