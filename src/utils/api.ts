/**
 * API utilities for making requests to the backend
 */
import { apiConfig } from '@/config/api';

// Types for API requests
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface RequestOptions {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: any;
  token?: string | null;
  timeout?: number;
}

interface ApiResponse<T = any> {
  data: T | null;
  error: string | null;
  status: number;
}

/**
 * Make an API request to the backend
 * 
 * @param path The API path (without the base URL)
 * @param options Request options
 * @returns Promise with the response data
 */
export async function apiRequest<T = any>(
  path: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const {
    method = 'GET',
    headers = {},
    body,
    token,
    timeout = apiConfig.timeout,
  } = options;

  // Build the full URL
  const url = apiConfig.getUrl(path);

  // Prepare headers
  const requestHeaders: Record<string, string> = {
    ...apiConfig.headers,
    ...headers,
  };

  // Add authorization header if token is provided
  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  // Prepare the request options
  const requestOptions: RequestInit = {
    method,
    headers: requestHeaders,
    credentials: 'include', // Include cookies for cross-origin requests
  };

  // Add body for non-GET requests
  if (body && method !== 'GET') {
    requestOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  try {
    // Create an AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    requestOptions.signal = controller.signal;

    // Make the request
    const response = await fetch(url, requestOptions);
    clearTimeout(timeoutId);

    // Parse the response
    let data: T | null = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    }

    // Return the response
    return {
      data,
      error: response.ok ? null : (data as any)?.error || response.statusText,
      status: response.status,
    };
  } catch (error: any) {
    // Handle request errors
    return {
      data: null,
      error: error.name === 'AbortError' 
        ? 'Request timeout' 
        : error.message || 'Unknown error',
      status: 0,
    };
  }
}

/**
 * Convenience methods for common HTTP methods
 */
export const api = {
  get: <T = any>(path: string, options: Omit<RequestOptions, 'method' | 'body'> = {}) => 
    apiRequest<T>(path, { ...options, method: 'GET' }),
    
  post: <T = any>(path: string, body: any, options: Omit<RequestOptions, 'method'> = {}) => 
    apiRequest<T>(path, { ...options, method: 'POST', body }),
    
  put: <T = any>(path: string, body: any, options: Omit<RequestOptions, 'method'> = {}) => 
    apiRequest<T>(path, { ...options, method: 'PUT', body }),
    
  patch: <T = any>(path: string, body: any, options: Omit<RequestOptions, 'method'> = {}) => 
    apiRequest<T>(path, { ...options, method: 'PATCH', body }),
    
  delete: <T = any>(path: string, options: Omit<RequestOptions, 'method'> = {}) => 
    apiRequest<T>(path, { ...options, method: 'DELETE' }),
};
