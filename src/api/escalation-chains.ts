import { apiClient } from './client';
import { 
  EscalationChain, 
  CreateEscalationChainRequest, 
  UpdateEscalationChainRequest 
} from '@/types/escalation-chain';

export const escalationChainsApi = {
  getAll: async (): Promise<EscalationChain[]> => {
    const response = await apiClient.get('/api/v1/chains');
    return response.data.map((chain: any) => ({
      ...chain,
      steps: chain.steps || []
    }));
  },

  get: async (id: string): Promise<EscalationChain> => {
    const response = await apiClient.get(`/api/v1/chains/${id}`);
    const chain = response.data;
    return {
      ...chain,
      steps: chain.steps || []
    };
  },

  create: async (data: CreateEscalationChainRequest): Promise<EscalationChain> => {
    const response = await apiClient.post('/api/v1/chains', {
      ...data,
      steps: data.steps || []
    });
    return response.data;
  },

  update: async (id: string, data: UpdateEscalationChainRequest): Promise<EscalationChain> => {
    const response = await apiClient.put(`/api/v1/chains/${id}`, {
      ...data,
      steps: data.steps || []
    });
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
