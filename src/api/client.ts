import axios from 'axios';
import { auth } from '@/lib/firebase/config';

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
      // Get token directly from Firebase
      const token = await auth.currentUser?.getIdToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting Firebase token:', error);
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
          // Handle unauthorized - could redirect to login
          window.location.href = '/signin';
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
          break;
      }
    }
    return Promise.reject(error);
  }
);
