import { EscalationChain, CreateEscalationChainRequest, UpdateEscalationChainRequest } from '@/types/escalation-chain';
import { apiClient } from './client';

export const escalationChainsApi = {
  async getAll(): Promise<EscalationChain[]> {
    const response = await apiClient.get('/api/v1/chains');
    return response.data;
  },

  async get(id: string): Promise<EscalationChain> {
    const response = await apiClient.get(`/api/v1/chains/${id}`);
    return response.data;
  },

  async create(data: CreateEscalationChainRequest): Promise<EscalationChain> {
    const response = await apiClient.post('/api/v1/chains', data);
    return response.data;
  },

  async update(id: string, data: UpdateEscalationChainRequest): Promise<EscalationChain> {
    const response = await apiClient.put(`/api/v1/chains/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/api/v1/chains/${id}`);
  },

  async toggleEnabled(id: string): Promise<EscalationChain> {
    const response = await apiClient.post(`/api/v1/chains/${id}/toggle`);
    return response.data;
  }
};
