import { useCallback } from 'react';
import { apiClient } from '@/app/api/client';

export interface SettingItem {
  key: string;
  name: string;
  description: string;
  type: string;
  value: string;
  defaultValue: string;
  category: string;
  allowedValues?: string[];
}

export interface FunctionRegistry {
  id: string;
  name: string;
}

export interface SettingsByCategory {
  [category: string]: SettingItem[];
}

export const settingsApi = {
  /**
   * Get all available function registries
   */
  async getFunctions(): Promise<FunctionRegistry[]> {
    const { data } = await apiClient.get('/api/v1/admin/settings/functions');
    return data;
  },

  /**
   * Get all settings for a specific function
   */
  async getSettings(functionId: string): Promise<SettingItem[]> {
    const { data } = await apiClient.get(`/api/v1/admin/settings/${functionId}`);
    return data;
  },

  /**
   * Get settings grouped by category for a specific function
   */
  async getSettingsByCategory(functionId: string): Promise<SettingsByCategory> {
    const { data } = await apiClient.get(`/api/v1/admin/settings/${functionId}/by-category`);
    return data;
  },

  /**
   * Get a specific setting by key
   */
  async getSetting(functionId: string, key: string): Promise<SettingItem> {
    const { data } = await apiClient.get(`/api/v1/admin/settings/${functionId}/${key}`);
    return data;
  },

  /**
   * Update a setting value
   */
  async updateSetting(functionId: string, key: string, value: string): Promise<SettingItem> {
    const { data } = await apiClient.put(`/api/v1/admin/settings/${functionId}/${key}`, { value });
    return data;
  },

  /**
   * Reset a setting to its default value
   */
  async resetSetting(functionId: string, key: string): Promise<SettingItem> {
    const { data } = await apiClient.delete(`/api/v1/admin/settings/${functionId}/${key}`);
    return data;
  }
};

/**
 * Hook for settings service
 */
export function useSettingsService() {
  return {
    getFunctions: useCallback(settingsApi.getFunctions, []),
    getSettings: useCallback(settingsApi.getSettings, []),
    getSettingsByCategory: useCallback(settingsApi.getSettingsByCategory, []),
    getSetting: useCallback(settingsApi.getSetting, []),
    updateSetting: useCallback(settingsApi.updateSetting, []),
    resetSetting: useCallback(settingsApi.resetSetting, [])
  };
} 