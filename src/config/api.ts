/**
 * API Configuration
 *
 * This file centralizes API configuration for different environments.
 * It determines the appropriate API base URL based on the environment.
 */

// Environment-specific API configurations
const API_CONFIG = {
  development: {
    // Default development configuration
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://api.dovetext.cn'
  },
  production: {
    // Production API endpoint
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.dovetext.com',
  },
  test: {
    // Test environment
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8081',
  },
};

// Determine current environment
const environment = process.env.NODE_ENV || 'development';

const baseApiUrl = API_CONFIG[environment as keyof typeof API_CONFIG]?.baseUrl || API_CONFIG.development.baseUrl;

// Export the API configuration
export const apiConfig = {
  baseUrl: baseApiUrl,

  // Helper function to get a full API URL
  getUrl: (path: string): string => {
    // Remove leading slash if present to avoid double slashes
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return `${baseApiUrl}/${cleanPath}`;
  },
  
  // Helper function to get a full public asset URL
  getPublicAssetsUrl: (path: string | null): string | null => {
    if (!path) return null;
    
    // If the URL is already absolute (starts with http), return it as is
    if (path.startsWith('http')) return path;
    
    // Remove leading slash if present to avoid double slashes
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    
    // In development mode, use the local proxy to avoid CORS issues
    if (process.env.NODE_ENV !== 'production') {
      // If the path already contains /public/assets, use it directly
      if (cleanPath.includes('public/assets')) {
        return `/${cleanPath}`;
      }
      // Otherwise, assume it's an avatar path and format accordingly
      return `/public/assets/${cleanPath}`;
    }
    
    // In production, use the API base URL
    return `${baseApiUrl}/${cleanPath}`;
  },

  // Common headers
  headers: {
    'Content-Type': 'application/json',
  },

  // Timeout in milliseconds
  timeout: 30000,
};

// Export environment information
export const isProduction = environment === 'production';
export const isDevelopment = environment === 'development';
export const isTest = environment === 'test';
