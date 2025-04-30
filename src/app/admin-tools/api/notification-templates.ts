import { apiClient } from '@/app/api/client';

export interface NotificationTemplate {
  id: number;
  name: string;
  type: 'email' | 'sms' | 'voice' | 'webhook' | 'plugin';
  subject?: string;
  content: string;
  variables: string[];
  createdAt: string;
  updatedAt: string;
  isDefault: boolean;
}

export interface EmailTemplate extends NotificationTemplate {
  type: 'email';
  subject: string;
  htmlContent: string;
  textContent: string;
}

export interface SmsTemplate extends NotificationTemplate {
  type: 'sms';
}

export interface VoiceTemplate extends NotificationTemplate {
  type: 'voice';
  voiceType?: 'male' | 'female';
  language?: string;
  speed?: number;
}

export interface WebhookTemplate extends NotificationTemplate {
  type: 'webhook';
  payloadSchema: string;
}

export interface PluginTemplate extends NotificationTemplate {
  type: 'plugin';
  pluginType: string;
  configSchema: string;
}

export interface TemplateCreateRequest {
  name: string;
  type: 'email' | 'sms' | 'voice' | 'webhook' | 'plugin';
  subject?: string;
  content: string;
  htmlContent?: string;
  textContent?: string;
  voiceType?: 'male' | 'female';
  language?: string;
  speed?: number;
  payloadSchema?: string;
  pluginType?: string;
  configSchema?: string;
}

export interface TemplateUpdateRequest extends Partial<TemplateCreateRequest> {
  id: number;
}

// Mock data for templates
const mockTemplates: NotificationTemplate[] = [
  {
    id: 1,
    name: 'Welcome Email',
    type: 'email',
    subject: 'Welcome to Dove Text!',
    content: 'Hi {{name}},\n\nWelcome to Dove Text! We\'re excited to have you on board.\n\nBest regards,\nThe Dove Text Team',
    variables: ['name'],
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
    isDefault: true
  },
  {
    id: 2,
    name: 'Password Reset',
    type: 'email',
    subject: 'Password Reset Request',
    content: 'Hi {{name}},\n\nYou requested a password reset. Click the link below to reset your password:\n\n{{resetLink}}\n\nIf you didn\'t request this, please ignore this email.\n\nBest regards,\nThe Dove Text Team',
    variables: ['name', 'resetLink'],
    createdAt: '2023-01-02T00:00:00Z',
    updatedAt: '2023-01-02T00:00:00Z',
    isDefault: false
  },
  {
    id: 3,
    name: 'Account Verification SMS',
    type: 'sms',
    content: 'Your Dove Text verification code is: {{code}}. Valid for 10 minutes.',
    variables: ['code'],
    createdAt: '2023-01-03T00:00:00Z',
    updatedAt: '2023-01-03T00:00:00Z',
    isDefault: true
  },
  {
    id: 4,
    name: 'Appointment Reminder',
    type: 'voice',
    content: 'Hello {{name}}. This is a reminder about your appointment scheduled for {{time}} on {{date}}. Please press 1 to confirm or 2 to reschedule.',
    variables: ['name', 'time', 'date'],
    createdAt: '2023-01-04T00:00:00Z',
    updatedAt: '2023-01-04T00:00:00Z',
    isDefault: true
  },
  {
    id: 5,
    name: 'Event Notification',
    type: 'webhook',
    content: '{\n  "event": "{{eventType}}",\n  "userId": "{{userId}}",\n  "timestamp": "{{timestamp}}",\n  "data": {\n    "message": "{{message}}"\n  }\n}',
    variables: ['eventType', 'userId', 'timestamp', 'message'],
    createdAt: '2023-01-05T00:00:00Z',
    updatedAt: '2023-01-05T00:00:00Z',
    isDefault: true
  },
  {
    id: 6,
    name: 'Slack Notification',
    type: 'plugin',
    content: '{\n  "blocks": [\n    {\n      "type": "section",\n      "text": {\n        "type": "mrkdwn",\n        "text": "*{{title}}*\\n{{message}}"\n      }\n    }\n  ]\n}',
    variables: ['title', 'message'],
    createdAt: '2023-01-06T00:00:00Z',
    updatedAt: '2023-01-06T00:00:00Z',
    isDefault: true
  }
];

// Mock API implementation
export const notificationTemplatesApi = {
  /**
   * Get all notification templates
   */
  async getAllTemplates(): Promise<NotificationTemplate[]> {
    // In a real implementation, this would call the API
    // const { data } = await apiClient.get<NotificationTemplate[]>('/api/v1/notification-templates');
    // return data;
    
    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([...mockTemplates]);
      }, 500);
    });
  },

  /**
   * Get templates by type
   */
  async getTemplatesByType(type: string): Promise<NotificationTemplate[]> {
    // In a real implementation, this would call the API
    // const { data } = await apiClient.get<NotificationTemplate[]>(`/api/v1/notification-templates?type=${type}`);
    // return data;
    
    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockTemplates.filter(template => template.type === type));
      }, 500);
    });
  },

  /**
   * Get a template by ID
   */
  async getTemplateById(id: number): Promise<NotificationTemplate> {
    // In a real implementation, this would call the API
    // const { data } = await apiClient.get<NotificationTemplate>(`/api/v1/notification-templates/${id}`);
    // return data;
    
    // Mock implementation
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const template = mockTemplates.find(t => t.id === id);
        if (template) {
          resolve({...template});
        } else {
          reject(new Error('Template not found'));
        }
      }, 500);
    });
  },

  /**
   * Create a new template
   */
  async createTemplate(request: TemplateCreateRequest): Promise<NotificationTemplate> {
    // In a real implementation, this would call the API
    // const { data } = await apiClient.post<NotificationTemplate>('/api/v1/notification-templates', request);
    // return data;
    
    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        const newTemplate: NotificationTemplate = {
          id: Math.max(...mockTemplates.map(t => t.id)) + 1,
          name: request.name,
          type: request.type,
          subject: request.subject,
          content: request.content,
          variables: extractVariables(request.content),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isDefault: false
        };
        
        mockTemplates.push(newTemplate);
        resolve({...newTemplate});
      }, 500);
    });
  },

  /**
   * Update an existing template
   */
  async updateTemplate(request: TemplateUpdateRequest): Promise<NotificationTemplate> {
    // In a real implementation, this would call the API
    // const { data } = await apiClient.put<NotificationTemplate>(`/api/v1/notification-templates/${request.id}`, request);
    // return data;
    
    // Mock implementation
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = mockTemplates.findIndex(t => t.id === request.id);
        if (index !== -1) {
          const updatedTemplate = {
            ...mockTemplates[index],
            ...request,
            updatedAt: new Date().toISOString()
          };
          
          if (request.content) {
            updatedTemplate.variables = extractVariables(request.content);
          }
          
          mockTemplates[index] = updatedTemplate;
          resolve({...updatedTemplate});
        } else {
          reject(new Error('Template not found'));
        }
      }, 500);
    });
  },

  /**
   * Delete a template
   */
  async deleteTemplate(id: number): Promise<void> {
    // In a real implementation, this would call the API
    // await apiClient.delete(`/api/v1/notification-templates/${id}`);
    
    // Mock implementation
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = mockTemplates.findIndex(t => t.id === id);
        if (index !== -1) {
          mockTemplates.splice(index, 1);
          resolve();
        } else {
          reject(new Error('Template not found'));
        }
      }, 500);
    });
  },

  /**
   * Set a template as default for its type
   */
  async setDefaultTemplate(id: number): Promise<NotificationTemplate> {
    // In a real implementation, this would call the API
    // const { data } = await apiClient.post<NotificationTemplate>(`/api/v1/notification-templates/${id}/default`);
    // return data;
    
    // Mock implementation
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const template = mockTemplates.find(t => t.id === id);
        if (!template) {
          reject(new Error('Template not found'));
          return;
        }
        
        // Reset default flag for all templates of the same type
        mockTemplates.forEach(t => {
          if (t.type === template.type) {
            t.isDefault = false;
          }
        });
        
        // Set this template as default
        template.isDefault = true;
        resolve({...template});
      }, 500);
    });
  },

  /**
   * Test a template with sample data
   */
  async testTemplate(id: number, testData: Record<string, string>): Promise<string> {
    // In a real implementation, this would call the API
    // const { data } = await apiClient.post<{result: string}>(`/api/v1/notification-templates/${id}/test`, testData);
    // return data.result;
    
    // Mock implementation
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const template = mockTemplates.find(t => t.id === id);
        if (!template) {
          reject(new Error('Template not found'));
          return;
        }
        
        let content = template.content;
        
        // Replace variables with test data
        Object.keys(testData).forEach(key => {
          const regex = new RegExp(`{{${key}}}`, 'g');
          content = content.replace(regex, testData[key]);
        });
        
        resolve(content);
      }, 500);
    });
  }
};

// Helper function to extract variables from template content
function extractVariables(content: string): string[] {
  const regex = /{{([^}]+)}}/g;
  const variables: string[] = [];
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }
  
  return variables;
}
