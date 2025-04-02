/**
 * Types for interactive messages in the chat system
 */

export type InteractiveFunction = 'chat' | 'confirm' | 'select' | 'form' | 'present';

export interface InteractiveMessage {
  interactive: boolean;
  function: InteractiveFunction;
  parameters: Record<string, any>;
}

// Chat interaction - simple text response
export interface ChatInteractionParams {
  prompt: string;
  placeholder?: string;
}

// Confirm interaction - yes/no response
export interface ConfirmInteractionParams {
  prompt: string;
  yesText?: string;
  noText?: string;
}

// Select interaction - choose from options
export interface SelectInteractionParams {
  prompt: string;
  options: string[];
  placeholder?: string;
}

// Form interaction - structured data collection
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'textarea' | 'select' | 'checkbox' | 'radio';
  required?: boolean;
  options?: string[]; // For select, checkbox, radio
  placeholder?: string;
  defaultValue?: any;
}

export interface FormInteractionParams {
  title: string;
  description?: string;
  fields: FormField[];
  submitText?: string;
  cancelText?: string;
}

// Present interaction - display information
export interface PresentInteractionParams {
  title?: string;
  content: string;
  format?: 'text' | 'markdown' | 'html';
}
