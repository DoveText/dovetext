import { apiClient } from './client';
import { 
  DeliveryRule, 
  CreateDeliveryRuleRequest, 
  UpdateDeliveryRuleRequest 
} from '@/types/delivery-rule';

export const deliveryRulesApi = {
  getAll: async (): Promise<DeliveryRule[]> => {
    const response = await apiClient.get('/api/v1/rules');
    return response.data;
  },

  get: async (id: string): Promise<DeliveryRule> => {
    const response = await apiClient.get(`/api/v1/rules/${id}`);
    return response.data;
  },

  create: async (data: CreateDeliveryRuleRequest): Promise<DeliveryRule> => {
    const response = await apiClient.post('/api/v1/rules', data);
    return response.data;
  },

  update: async (id: string, data: UpdateDeliveryRuleRequest): Promise<DeliveryRule> => {
    const response = await apiClient.patch(`/api/v1/rules/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/rules/${id}`);
  },

  enable: async (id: string): Promise<DeliveryRule> => {
    const response = await apiClient.post(`/api/v1/rules/${id}/enable`);
    return response.data;
  },

  disable: async (id: string): Promise<DeliveryRule> => {
    const response = await apiClient.post(`/api/v1/rules/${id}/disable`);
    return response.data;
  },
};
