/**
 * A helper class to make request to API server (Java backend)
 * The API may need authentication, in which case it will use the authentication token
 * from our centralized auth system in Authorization: Bearer xxx
 */
import axios from 'axios';
import { auth } from '@/lib/auth';
import { apiConfig } from '@/config/api';

// Use the centralized API configuration
const API_BASE_URL = apiConfig.baseUrl;

// Create axios instance with configurable base URL
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add authentication token
apiClient.interceptors.request.use(
  async (config) => {
    // console.log('[API Client] Request interceptor called for:', config.url);
    
    // Skip authentication for public endpoints
    if (config.url?.startsWith('/public/')) {
      return config;
    }
    
    try {
      // Get token from our auth system
      const token = await auth.getIdToken();
      if (!token) {
        // Don't make the request if we're not authenticated
        console.error('[API Client] Not authenticated, rejecting request');
        return Promise.reject(new Error('Not authenticated'));
      }

      // console.log('[API Client] Successfully obtained token for request');
      config.headers.Authorization = `Bearer ${token}`;
      // console.log('[API Client] Request headers set:', {
      //   contentType: config.headers['Content-Type'],
      //   hasAuth: !!config.headers.Authorization,
      //   method: config.method,
      //   url: config.url
      // });
    } catch (error) {
      console.error('[API Client] Error getting authentication token:', error);
      return Promise.reject(error);
    }
    return config;
  },
  (error) => {
    console.error('[API Client] Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    // console.log('[API Client] Response received:', {
    //   status: response.status,
    //   url: response.config.url,
    //   data: response.data
    // });
    return response;
  },
  (error) => {
    // console.error('[API Client] Response error:', {
    //   url: error.config?.url,
    //   status: error.response?.status,
    //   statusText: error.response?.statusText,
    //   message: error.message
    // });
    
    if (error.response) {
      // Handle specific error cases
      switch (error.response.status) {
        case 401:
          // Only redirect if we're not already on the signin page
          if (!window.location.pathname.includes('/signin')) {
            window.location.href = '/signin';
          }
          break;
        case 403:
          // Handle forbidden
          console.error('Access forbidden');
          break;
        case 404:
          // Handle not found
          console.error('Resource not found');
          break;
        default:
          // Handle other errors
          console.error('API error:', error.response.data);
      }
    }
    return Promise.reject(error);
  }
);
