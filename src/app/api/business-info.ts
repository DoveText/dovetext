import { apiClient } from './client';

// Types for business info API
export interface UserBusinessInfoDto {
  id?: number;
  key: string;
  value: string;
}

export interface UserBusinessInfoBatchRequest {
  items: UserBusinessInfoDto[];
}

export interface UserBusinessInfoBatchResponse {
  results: UserBusinessInfoDto[];
  errors: any[];
}

/**
 * Business Info API client
 */
export const businessInfoApi = {
  /**
   * Get all business info entries for the current user
   */
  getAll: async (): Promise<UserBusinessInfoDto[]> => {
    const { data } = await apiClient.get<UserBusinessInfoDto[]>('/api/v1/user/business-info');
    return data || [];
  },

  /**
   * Get a specific business info entry by key
   */
  getByKey: async (key: string): Promise<UserBusinessInfoDto | null> => {
    const { data } = await apiClient.get<UserBusinessInfoDto>(`/api/v1/user/business-info/${encodeURIComponent(key)}`);
    return data;
  },

  /**
   * Create or update a single business info entry
   */
  createOrUpdate: async (key: string, value: string): Promise<UserBusinessInfoDto> => {
    const { data } = await apiClient.post<UserBusinessInfoDto>(
      '/api/v1/user/business-info',
      { key, value }
    );
    return data;
  },

  /**
   * Batch create or update multiple business info entries
   */
  batchUpdate: async (items: UserBusinessInfoDto[]): Promise<UserBusinessInfoBatchResponse> => {
    const { data } = await apiClient.post<UserBusinessInfoBatchResponse>(
      '/api/v1/user/business-info/batch',
      { items }
    );
    return data;
  },

  /**
   * Delete a business info entry by key
   */
  delete: async (key: string): Promise<void> => {
    await apiClient.delete(`/api/v1/user/business-info/${encodeURIComponent(key)}`);
  }
};
