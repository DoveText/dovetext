import { apiClient } from './client';
import { 
  DeliveryRule, 
  CreateDeliveryRuleRequest, 
  UpdateDeliveryRuleRequest 
} from '@/types/delivery-rule';

export const deliveryRulesApi = {
  getAll: async (): Promise<DeliveryRule[]> => {
    const response = await apiClient.get('/delivery-rules');
    return response.data;
  },

  get: async (id: string): Promise<DeliveryRule> => {
    const response = await apiClient.get(`/delivery-rules/${id}`);
    return response.data;
  },

  create: async (data: CreateDeliveryRuleRequest): Promise<DeliveryRule> => {
    const response = await apiClient.post('/delivery-rules', data);
    return response.data;
  },

  update: async (id: string, data: UpdateDeliveryRuleRequest): Promise<DeliveryRule> => {
    const response = await apiClient.patch(`/delivery-rules/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/delivery-rules/${id}`);
  },

  enable: async (id: string): Promise<DeliveryRule> => {
    const response = await apiClient.post(`/delivery-rules/${id}/enable`);
    return response.data;
  },

  disable: async (id: string): Promise<DeliveryRule> => {
    const response = await apiClient.post(`/delivery-rules/${id}/disable`);
    return response.data;
  },
};
