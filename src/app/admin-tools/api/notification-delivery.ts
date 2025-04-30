import { apiClient } from '@/app/api/client';

// Types for notification delivery
export interface DeliveryMethod {
  id: number;
  userId: number;
  type: string;
  name: string;
  description: string;
  config: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationTestResponse {
  success: boolean;
  notificationId?: number;
  methodId?: number;
  deliveryId?: string;
  metadata?: any;
  error?: string;
  message?: string;
}

export interface EmailMethodRequest {
  name: string;
  email: string;
  format?: string;
  enableReply?: boolean;
  replyToAddress?: string;
}

export interface SlackMethodRequest {
  name: string;
  webhookUrl: string;
  channel?: string;
  username?: string;
  iconEmoji?: string;
}

export interface TestDeliveryRequest {
  methodId?: number;
  methodType?: string;
  title?: string;
  message?: string;
  priority?: string;
}

export const notificationDeliveryApi = {
  /**
   * Get all delivery methods for the current user
   */
  async getAllMethods(): Promise<DeliveryMethod[]> {
    const { data } = await apiClient.get<DeliveryMethod[]>('/api/v1/methods');
    return data;
  },

  /**
   * Get a specific delivery method by ID
   */
  async getMethodById(id: number): Promise<DeliveryMethod> {
    const { data } = await apiClient.get<DeliveryMethod>(`/api/v1/methods/${id}`);
    return data;
  },

  /**
   * Test notification delivery
   */
  async testDelivery(request: TestDeliveryRequest): Promise<NotificationTestResponse> {
    const { data } = await apiClient.post<NotificationTestResponse>('/api/v1/test-delivery', request);
    return data;
  },

  /**
   * Create a Slack delivery method
   */
  async createSlackMethod(request: SlackMethodRequest): Promise<DeliveryMethod> {
    // Format the request to match what DeliveryMethodController expects
    const formattedRequest = {
      name: request.name,
      type: "SLACK",
      description: `Slack notification to ${request.channel || '#general'}`,
      config: {
        webhookUrl: request.webhookUrl,
        channel: request.channel || '#general',
        username: request.username || 'Dove Text',
        iconEmoji: request.iconEmoji || ':dove:',
        useBlocks: true,
        includeAttachments: true
      }
    };
    
    const { data } = await apiClient.post<DeliveryMethod>('/api/v1/methods', formattedRequest);
    return data;
  },

  /**
   * Create an Email delivery method
   */
  async createEmailMethod(request: EmailMethodRequest): Promise<DeliveryMethod> {
    // Format the request to match what DeliveryMethodController expects
    const formattedRequest = {
      name: request.name,
      type: "EMAIL",
      description: `Email notification to ${request.email}`,
      config: {
        email: request.email,
        format: request.format || 'html',
        enableReply: request.enableReply || false,
        ...(request.enableReply && request.replyToAddress ? { replyToAddress: request.replyToAddress } : {})
      }
    };
    
    const { data } = await apiClient.post<DeliveryMethod>('/api/v1/methods', formattedRequest);
    return data;
  },

  /**
   * Update a delivery method
   */
  async updateMethod(id: number, request: EmailMethodRequest | SlackMethodRequest): Promise<DeliveryMethod> {
    // Get the current method to determine its type
    const { data: currentMethod } = await apiClient.get<DeliveryMethod>(`/api/v1/methods/${id}`);
    
    let formattedRequest: any = {
      name: request.name
    };
    
    // Format the config based on the method type
    if (currentMethod.type === 'EMAIL' && 'email' in request) {
      formattedRequest.config = {
        email: request.email,
        format: request.format || 'html',
        enableReply: request.enableReply || false,
        ...(request.enableReply && request.replyToAddress ? { replyToAddress: request.replyToAddress } : {})
      };
      formattedRequest.description = `Email notification to ${request.email}`;
    } else if (currentMethod.type === 'SLACK' && 'webhookUrl' in request) {
      formattedRequest.config = {
        webhookUrl: request.webhookUrl,
        channel: request.channel || '#general',
        username: request.username || 'Dove Text',
        iconEmoji: request.iconEmoji || ':dove:',
        useBlocks: true,
        includeAttachments: true
      };
      formattedRequest.description = `Slack notification to ${request.channel || '#general'}`;
    }
    
    const { data } = await apiClient.put<DeliveryMethod>(`/api/v1/methods/${id}`, formattedRequest);
    return data;
  },

  /**
   * Delete a delivery method
   */
  async deleteMethod(id: number): Promise<void> {
    await apiClient.delete(`/api/v1/methods/${id}`);
  },

  /**
   * Set a delivery method as default
   */
  async setDefaultMethod(id: number): Promise<DeliveryMethod> {
    const { data } = await apiClient.post<DeliveryMethod>(`/api/v1/methods/${id}/default`);
    return data;
  }
};
