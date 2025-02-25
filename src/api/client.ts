/**
 * A helper class to make request to API server (Java backend)
 * The API may need authentication, in this case it would try piggy back Firebase ID token
 * in Authorization: Bearer xxx
 */
import axios from 'axios';
import { auth } from '@/firebase/config';

// Create axios instance with relative base URL
export const apiClient = axios.create({
  // No baseURL needed since we're using relative paths
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add Firebase ID token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Get current user and wait for it to be ready
      const user = auth.currentUser;
      if (!user) {
        // Don't make the request if we're not authenticated
        return Promise.reject(new Error('Not authenticated'));
      }

      // Get token directly from Firebase
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    } catch (error) {
      console.error('Error getting Firebase token:', error);
      return Promise.reject(error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
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
