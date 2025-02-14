import { apiClient } from './client';
import { 
  DeliveryMethod, 
  CreateDeliveryMethodRequest, 
  UpdateDeliveryMethodRequest,
  DeliveryMethodType 
} from '@/types/delivery-method';

export const deliveryMethodsApi = {
  /**
   * Get all delivery methods for the current user
   */
  async getAll(): Promise<DeliveryMethod[]> {
    const { data } = await apiClient.get<DeliveryMethod[]>('/api/v1/methods');
    return data;
  },

  /**
   * Get a specific delivery method by ID
   */
  async getById(id: string): Promise<DeliveryMethod> {
    const { data } = await apiClient.get<DeliveryMethod>(`/api/v1/methods/${id}`);
    return data;
  },

  /**
   * Create a new delivery method
   */
  async create(request: CreateDeliveryMethodRequest): Promise<DeliveryMethod> {
    const { data } = await apiClient.post<DeliveryMethod>('/api/v1/methods', request);
    return data;
  },

  /**
   * Update an existing delivery method
   */
  async update(id: string, request: UpdateDeliveryMethodRequest): Promise<DeliveryMethod> {
    const { data } = await apiClient.put<DeliveryMethod>(`/api/v1/methods/${id}`, request);
    return data;
  },

  /**
   * Delete a delivery method
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/api/v1/methods/${id}`);
  },

  /**
   * Test a delivery method configuration
   */
  async verify(id: string): Promise<void> {
    await apiClient.post(`/api/v1/methods/${id}/verify`);
  },

  /**
   * Set a delivery method as default
   */
  async setDefault(id: string): Promise<void> {
    await apiClient.post(`/api/v1/methods/${id}/default`);
  },

  /**
   * Get all available delivery method types
   */
  async getTypes(): Promise<DeliveryMethodType[]> {
    const { data } = await apiClient.get<DeliveryMethodType[]>('/api/v1/methods/types');
    return data;
  }
};
