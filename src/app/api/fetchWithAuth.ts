/**
 * A helper class to make request to frontend API server (SSR for NextJS)
 * The API may need authentication, in this case it would try piggy back Firebase ID token
 * in Authorization: Bearer xxx
 */
import { useAuth } from '@/context/AuthContext';

type FetchOptions = RequestInit & {
  body?: any;  // Allow any type for body, we'll JSON.stringify if needed
};

export async function fetchWithAuth(
  url: string,
  { body, headers, ...options }: FetchOptions = {},
  getIdToken: () => Promise<string | null>
) {
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

// Custom hook for using auth fetch in components
export function useAuthFetch() {
  const { getIdToken } = useAuth();

  return {
    get: (url: string, options?: Omit<FetchOptions, 'body'>) => 
      fetchWithAuth(url, { method: 'GET', ...options }, getIdToken),

    post: (url: string, body: any, options?: FetchOptions) => 
      fetchWithAuth(url, { method: 'POST', body, ...options }, getIdToken),

    put: (url: string, body: any, options?: FetchOptions) => 
      fetchWithAuth(url, { method: 'PUT', body, ...options }, getIdToken),

    patch: (url: string, body: any, options?: FetchOptions) => 
      fetchWithAuth(url, { method: 'PATCH', body, ...options }, getIdToken),

    delete: (url: string, options?: FetchOptions) => 
      fetchWithAuth(url, { method: 'DELETE', ...options }, getIdToken),
  };
}
