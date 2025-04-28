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
    const { data } = await apiClient.get<DeliveryMethod[]>('/api/v1/test/notification-delivery/methods');
    return data;
  },

  /**
   * Get a specific delivery method by ID
   */
  async getMethodById(id: number): Promise<DeliveryMethod> {
    const { data } = await apiClient.get<DeliveryMethod>(`/api/v1/test/notification-delivery/methods/${id}`);
    return data;
  },

  /**
   * Test notification delivery
   */
  async testDelivery(request: TestDeliveryRequest): Promise<NotificationTestResponse> {
    const { data } = await apiClient.post<NotificationTestResponse>('/api/v1/test/notification-delivery/test-delivery', request);
    return data;
  },

  /**
   * Create a Slack delivery method
   */
  async createSlackMethod(request: SlackMethodRequest): Promise<DeliveryMethod> {
    const { data } = await apiClient.post<DeliveryMethod>('/api/v1/test/notification-delivery/create-slack-method', request);
    return data;
  },

  /**
   * Create an Email delivery method
   */
  async createEmailMethod(request: EmailMethodRequest): Promise<DeliveryMethod> {
    const { data } = await apiClient.post<DeliveryMethod>('/api/v1/test/notification-delivery/create-email-method', request);
    return data;
  },
};
