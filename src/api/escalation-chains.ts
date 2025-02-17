import { apiClient } from './client';
import { 
  EscalationChain, 
  CreateEscalationChainRequest, 
  UpdateEscalationChainRequest 
} from '@/types/escalation-chain';

export const escalationChainsApi = {
  getAll: async (): Promise<EscalationChain[]> => {
    const response = await apiClient.get('/escalation-chains');
    return response.data;
  },

  get: async (id: string): Promise<EscalationChain> => {
    const response = await apiClient.get(`/escalation-chains/${id}`);
    return response.data;
  },

  create: async (data: CreateEscalationChainRequest): Promise<EscalationChain> => {
    const response = await apiClient.post('/escalation-chains', data);
    return response.data;
  },

  update: async (id: string, data: UpdateEscalationChainRequest): Promise<EscalationChain> => {
    const response = await apiClient.patch(`/escalation-chains/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/escalation-chains/${id}`);
  },

  enable: async (id: string): Promise<EscalationChain> => {
    const response = await apiClient.post(`/escalation-chains/${id}/enable`);
    return response.data;
  },

  disable: async (id: string): Promise<EscalationChain> => {
    const response = await apiClient.post(`/escalation-chains/${id}/disable`);
    return response.data;
  },
};
