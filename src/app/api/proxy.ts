/**
 * Client-side utility for authenticated asset access
 * This provides methods to create blob URLs for authenticated assets
 * Compatible with static deployments like Cloudflare Pages
 */
import { apiClient } from './client';
import { auth } from '@/lib/auth';

// Cache for blob URLs to avoid creating duplicates
const blobUrlCache = new Map<string, string>();

/**
 * Creates a blob URL for an asset that requires authentication
 * @param assetId The UUID of the asset to access
 * @returns A Promise that resolves to a blob URL that can be used in img tags
 */
export const createAuthenticatedBlobUrl = async (assetId: string): Promise<string> => {
  // Check if we already have a blob URL for this asset
  if (blobUrlCache.has(assetId)) {
    return blobUrlCache.get(assetId)!;
  }
  
  try {
    // Make an authenticated request using our API client
    const response = await apiClient.get(
      `/api/v1/assets/${encodeURIComponent(assetId)}/content`, 
      { responseType: 'blob' }
    );
    
    // Create a blob URL from the response data
    const blob = new Blob([response.data], {
      type: response.headers['content-type'] || 'application/octet-stream'
    });
    
    const blobUrl = URL.createObjectURL(blob);
    
    // Cache the blob URL
    blobUrlCache.set(assetId, blobUrl);
    
    return blobUrl;
  } catch (error) {
    console.error('Error creating blob URL for asset:', error);
    throw error;
  }
};

/**
 * Revokes all cached blob URLs to prevent memory leaks
 * Call this when the component unmounts
 */
export const revokeBlobUrls = (): void => {
  blobUrlCache.forEach((url) => {
    URL.revokeObjectURL(url);
  });
  blobUrlCache.clear();
};

/**
 * Creates a direct URL with auth token as a query parameter
 * This is an alternative approach that doesn't use blob URLs
 * @param assetId The UUID of the asset
 * @returns Promise with a URL containing the auth token
 */
export const createTokenizedUrl = async (assetId: string): Promise<string> => {
  try {
    const token = await auth.getIdToken();
    if (!token) {
      throw new Error('No authentication token available');
    }
    const baseUrl = apiClient.defaults.baseURL || '';
    return `${baseUrl}/api/v1/assets/${encodeURIComponent(assetId)}/content?token=${encodeURIComponent(token)}`;
  } catch (error) {
    console.error('Error creating tokenized URL:', error);
    throw error;
  }
};
