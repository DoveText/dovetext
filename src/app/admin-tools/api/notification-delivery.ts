import { apiClient } from '@/app/api/client';
import { formatMethodRequest, DELIVERY_METHOD_TYPES } from './delivery-method-types';

export interface DeliveryMethod {
  id: number;
  userId: number;
  name: string;
  type: string;
  description: string;
  config: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TestDeliveryRequest {
  methodId?: number;
  methodType?: string;
  title?: string;
  message: string;
  priority?: string;
}

export interface NotificationTestResponse {
  success: boolean;
  notificationId: number;
  methodId: number;
  deliveryId?: string;
  metadata?: any;
  error?: string;
}

// Generic request interface for all method types
export interface DeliveryMethodRequest {
  name: string;
  [key: string]: any;
}

// Type-specific interfaces for better type checking
export interface EmailMethodRequest extends DeliveryMethodRequest {
  email: string;
  format?: 'html' | 'text';
  enableReply?: boolean;
  replyToAddress?: string;
}

export interface SlackMethodRequest extends DeliveryMethodRequest {
  webhookUrl: string;
  channel?: string;
  username?: string;
  iconEmoji?: string;
}

export interface TextMethodRequest extends DeliveryMethodRequest {
  phoneNumber: string;
  provider?: 'TWILIO' | 'BANDWIDTH' | 'AWS';
  enableReply?: boolean;
  replyCallbackUrl?: string;
}

export interface VoiceMethodRequest extends DeliveryMethodRequest {
  phoneNumber: string;
  provider?: 'TWILIO' | 'BANDWIDTH';
  language?: string;
  voice?: 'male' | 'female';
  enableActions?: boolean;
  actionCallbackUrl?: string;
}

export interface WebhookMethodRequest extends DeliveryMethodRequest {
  url: string;
  method?: 'GET' | 'POST' | 'PUT';
  contentType?: string;
  authType?: 'none' | 'basic' | 'bearer' | 'custom';
  username?: string;
  password?: string;
  bearerToken?: string;
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
   * Create a delivery method of any type
   */
  async createMethod(type: string, request: DeliveryMethodRequest): Promise<DeliveryMethod> {
    const formattedRequest = formatMethodRequest(type, request);
    const { data } = await apiClient.post<DeliveryMethod>('/api/v1/methods', formattedRequest);
    return data;
  },

  /**
   * Create a Slack delivery method (legacy method, use createMethod instead)
   */
  async createSlackMethod(request: SlackMethodRequest): Promise<DeliveryMethod> {
    return this.createMethod('SLACK', request);
  },

  /**
   * Create an Email delivery method (legacy method, use createMethod instead)
   */
  async createEmailMethod(request: EmailMethodRequest): Promise<DeliveryMethod> {
    return this.createMethod('EMAIL', request);
  },

  /**
   * Create a Text (SMS) delivery method
   */
  async createTextMethod(request: TextMethodRequest): Promise<DeliveryMethod> {
    return this.createMethod('TEXT', request);
  },

  /**
   * Create a Voice delivery method
   */
  async createVoiceMethod(request: VoiceMethodRequest): Promise<DeliveryMethod> {
    return this.createMethod('VOICE', request);
  },

  /**
   * Create a Webhook delivery method
   */
  async createWebhookMethod(request: WebhookMethodRequest): Promise<DeliveryMethod> {
    return this.createMethod('WEBHOOK', request);
  },

  /**
   * Update a delivery method
   */
  async updateMethod(id: number, type: string, request: DeliveryMethodRequest): Promise<DeliveryMethod> {
    const formattedRequest = formatMethodRequest(type, request);
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
