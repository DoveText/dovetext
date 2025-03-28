import { apiClient } from './client';
import { DeliveryChannel, CreateDeliveryChannelRequest } from '@/types/delivery-channel';

export const deliveryChannelsApi = {
  /**
   * Get all delivery channels for the current user
   */
  async getAll(): Promise<DeliveryChannel[]> {
    const { data } = await apiClient.get<DeliveryChannel[]>('/api/v1/channels');
    return data;
  },

  /**
   * Get a specific delivery channel by ID
   */
  async getById(id: number): Promise<DeliveryChannel> {
    const { data } = await apiClient.get<DeliveryChannel>(`/api/v1/channels/${id}`);
    return data;
  },

  /**
   * Create a new delivery channel
   */
  async create(request: CreateDeliveryChannelRequest): Promise<DeliveryChannel> {
    const { data } = await apiClient.post<DeliveryChannel>('/api/v1/channels', request);
    return data;
  },

  /**
   * Update an existing delivery channel
   */
  async update(id: number, request: Partial<CreateDeliveryChannelRequest>): Promise<DeliveryChannel> {
    const { data } = await apiClient.put<DeliveryChannel>(`/api/v1/channels/${id}`, request);
    return data;
  },

  /**
   * Delete a delivery channel
   */
  async delete(id: number): Promise<void> {
    await apiClient.delete(`/api/v1/channels/${id}`);
  },
};
