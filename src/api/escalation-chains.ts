import { apiClient } from './client';
import { 
  EscalationChain, 
  CreateEscalationChainRequest, 
  UpdateEscalationChainRequest 
} from '@/types/escalation-chain';

export const escalationChainsApi = {
  getAll: async (): Promise<EscalationChain[]> => {
    const response = await apiClient.get('/api/v1/chains');
    return response.data;
  },

  get: async (id: string): Promise<EscalationChain> => {
    const response = await apiClient.get(`/api/v1/chains/${id}`);
    return response.data;
  },

  create: async (data: CreateEscalationChainRequest): Promise<EscalationChain> => {
    const response = await apiClient.post('/api/v1/chains', data);
    return response.data;
  },

  update: async (id: string, data: UpdateEscalationChainRequest): Promise<EscalationChain> => {
    const response = await apiClient.patch(`/api/v1/chains/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/chains/${id}`);
  },

  enable: async (id: string): Promise<EscalationChain> => {
    const response = await apiClient.post(`/api/v1/chains/${id}/enable`);
    return response.data;
  },

  disable: async (id: string): Promise<EscalationChain> => {
    const response = await apiClient.post(`/api/v1/chains/${id}/disable`);
    return response.data;
  },
};
