import { apiClient } from './client';

// Types for assets API
export interface AssetDto {
  id: number;
  userId: number;
  uuid: string;
  type: string; // Added type field for file/url distinction
  meta: {
    filename?: string;
    contentType?: string;
    description?: string;
    [key: string]: any;
  };
  state: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssetUploadResponse {
  asset: AssetDto;
  uploadUrl?: string;
}

export interface AssetUpdateRequest {
  meta?: {
    [key: string]: any;
  };
}

/**
 * Assets API client
 */
export const assetsApi = {
  /**
   * Verify an asset by uploading it to a temp location, calculating MD5, and checking for duplicates
   * @param file The file to verify
   * @returns The verification result including MD5, UUID, and duplicate information
   */
  verify: async (file: File): Promise<{ 
    md5: string; 
    uuid: string;
    filename: string;
    size: number;
    contentType: string;
    isDuplicate: boolean; 
    duplicateInfo?: {
      filename: string;
      uploadDate: string;
      uuid: string;
    } 
  }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const { data } = await apiClient.post<{
      md5: string;
      uuid: string;
      filename: string;
      size: number;
      contentType: string;
      isDuplicate: boolean;
      duplicateInfo?: {
        filename: string;
        uploadDate: string;
        uuid: string;
      }
    }>('/api/v1/assets/verify', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return data;
  },

  /**
   * Verify a URL asset without saving it permanently
   * @param url The URL to verify
   * @returns The verification result including MD5, UUID, and duplicate information
   */
  verifyUrl: async (url: string): Promise<{ 
    md5: string; 
    uuid: string;
    filename: string;
    size: number;
    contentType: string;
    url: string;
    isDuplicate: boolean; 
    duplicateInfo?: {
      filename: string;
      uploadDate: string;
      uuid: string;
    } 
  }> => {
    const formData = new FormData();
    formData.append('url', url);
    
    const { data } = await apiClient.post<{
      md5: string;
      uuid: string;
      filename: string;
      size: number;
      contentType: string;
      url: string;
      isDuplicate: boolean;
      duplicateInfo?: {
        filename: string;
        uploadDate: string;
        uuid: string;
      }
    }>('/api/v1/assets/verify-url', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return data;
  },
  
  /**
   * Get all assets for the current user
   */
  getAll: async (): Promise<AssetDto[]> => {
    const { data } = await apiClient.get<AssetDto[]>('/api/v1/assets');
    return data || [];
  },

  /**
   * Get a specific asset by UUID
   */
  getAsset: async (assetId: string): Promise<AssetDto> => {
    const { data } = await apiClient.get<AssetDto>(`/api/v1/assets/${encodeURIComponent(assetId)}`);
    return data;
  },

  /**
   * Complete the asset upload process after verification
   * @param uuid The UUID from the verification step
   * @param md5 The MD5 hash from the verification step
   * @param metadata Metadata for the asset
   * @param forceDuplicate Optional flag to force upload even if duplicate exists
   * @param assetType The type of asset ('file' or 'url')
   */
  createAsset: async (
    uuid: string,
    md5: string,
    metadata: Record<string, any>,
    forceDuplicate: boolean = false,
    assetType: 'file' | 'url' = 'file'
  ): Promise<AssetDto> => {
    // Add force duplicate flag if true
    const queryParams = forceDuplicate ? '?forceDuplicate=true' : '';
    
    try {
      // Create FormData with MD5, metadata, and asset type
      const formData = new FormData();
      formData.append('md5', md5);
      formData.append('meta', JSON.stringify(metadata));
      formData.append('type', assetType);
      
      const response = await apiClient.post<AssetDto>(
        `/api/v1/assets/uuid/${encodeURIComponent(uuid)}${queryParams}`, 
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      return response.data;
    } catch (error: any) {
      // If we get a 409 Conflict, it means a duplicate was found but forceDuplicate was false
      if (error.response && error.response.status === 409 && error.response.data.duplicateAsset) {
        throw new Error('Duplicate asset found. Set forceDuplicate to true to upload anyway.');
      }
      throw error;
    }
  },

  /**
   * Update an existing asset
   * @param assetId The UUID of the asset to update
   * @param updates The updates to apply (metadata and/or file)
   */
  updateAsset: async (
    assetId: string, 
    updates: { meta?: Record<string, any>, file?: File }
  ): Promise<AssetDto> => {
    const formData = new FormData();
    
    // Add file if provided
    if (updates.file) {
      formData.append('file', updates.file);
    }
    
    // Add metadata if provided
    if (updates.meta) {
      formData.append('meta', JSON.stringify(updates.meta));
    }
    
    const { data } = await apiClient.put<AssetDto>(
      `/api/v1/assets/${encodeURIComponent(assetId)}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    return data;
  },

  /**
   * Get the content of an asset
   * @param assetId The UUID of the asset
   * @returns A URL to the asset content
   */
  getAssetContentUrl: (assetId: string): string => {
    return `${apiClient.defaults.baseURL}/api/v1/assets/${encodeURIComponent(assetId)}/content`;
  },

  /**
   * Download asset content
   * @param assetId The UUID of the asset
   * @returns The asset content as a Blob
   */
  downloadAssetContent: async (assetId: string): Promise<Blob> => {
    const { data } = await apiClient.get<Blob>(
      `/api/v1/assets/${encodeURIComponent(assetId)}/content`,
      { responseType: 'blob' }
    );
    return data;
  },

  /**
   * Delete an asset
   * @param assetId The UUID of the asset to delete
   */
  deleteAsset: async (assetId: string): Promise<void> => {
    await apiClient.delete(`/api/v1/assets/${encodeURIComponent(assetId)}`);
  },

  /**
   * Get all tags for an asset
   * @param assetId The UUID of the asset
   */
  getAssetTags: async (assetId: string): Promise<string[]> => {
    const { data } = await apiClient.get<string[]>(`/api/v1/assets/${encodeURIComponent(assetId)}/tags`);
    return data || [];
  },

  /**
   * Add a tag to an asset
   * @param assetId The UUID of the asset
   * @param tag The tag to add
   */
  addTagToAsset: async (assetId: string, tag: string): Promise<void> => {
    await apiClient.post(`/api/v1/assets/${encodeURIComponent(assetId)}/tags/${encodeURIComponent(tag)}`);
  },

  /**
   * Remove a tag from an asset
   * @param assetId The UUID of the asset
   * @param tag The tag to remove
   */
  removeTagFromAsset: async (assetId: string, tag: string): Promise<void> => {
    await apiClient.delete(`/api/v1/assets/${encodeURIComponent(assetId)}/tags/${encodeURIComponent(tag)}`);
  }
};
