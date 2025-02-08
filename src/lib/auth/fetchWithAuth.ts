import { useAuth } from '@/context/AuthContext';

type FetchOptions = RequestInit & {
  body?: any;  // Allow any type for body, we'll JSON.stringify if needed
};

export async function fetchWithAuth(
  url: string,
  { body, headers, ...options }: FetchOptions = {}
) {
  const { getIdToken } = useAuth();
  const idToken = await getIdToken();

  // Prepare headers with auth token
  const authHeaders: Record<string, string> = {
    'Authorization': `Bearer ${idToken}`,
    ...(headers as Record<string, string>),
  };

  // Add Content-Type for requests with body
  if (body) {
    authHeaders['Content-Type'] = 'application/json';
  }

  return fetch(url, {
    ...options,
    headers: authHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });
}

// Helper methods for common HTTP methods
export const authFetch = {
  get: (url: string, options?: Omit<FetchOptions, 'body'>) => 
    fetchWithAuth(url, { ...options, method: 'GET' }),

  post: (url: string, body: any, options?: FetchOptions) => 
    fetchWithAuth(url, { ...options, method: 'POST', body }),

  put: (url: string, body: any, options?: FetchOptions) => 
    fetchWithAuth(url, { ...options, method: 'PUT', body }),

  patch: (url: string, body: any, options?: FetchOptions) => 
    fetchWithAuth(url, { ...options, method: 'PATCH', body }),

  delete: (url: string, options?: FetchOptions) => 
    fetchWithAuth(url, { ...options, method: 'DELETE' }),
};
