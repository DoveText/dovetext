import { apiClient } from './client';
import { auth } from '@/lib/firebase/config';
import { fetchEventSource } from '@microsoft/fetch-event-source';

// Open a new test session with a system prompt, tools, and model
export interface OpenSessionResponse {
  session: string;
  message?: string;
}
export async function openTestSession(systemPrompt: string, tools: string[], model: string): Promise<OpenSessionResponse> {
  const res = await apiClient.post('/api/v1/prompt/test/open', { prompt: systemPrompt, tools, model });
  if (res.data && typeof res.data.session === 'string') return res.data;
  throw new Error('Invalid response from /open');
}

// Send a user message in a test session
export async function sendTestMessage(session: string, message: string): Promise<string> {
  const res = await apiClient.post<{ response: string }>(`/api/v1/prompt/test/${session}/chat`, { message });
  return res.data.response;
}

// Close a test session
export async function closeTestSession(session: string): Promise<void> {
  await apiClient.post(`/api/v1/prompt/test/${session}/close`);
}

// Send keepalive ping for a test session
export async function keepAliveTestSession(session: string): Promise<void> {
  await apiClient.post(`/api/v1/prompt/test/${session}/keepalive`);
}

// Get list of available tools
export async function getAvailableTools(): Promise<{ name: string; description: string }[]> {
  const res = await apiClient.get<{ tools: { name: string; description: string }[] }>('/api/v1/prompt/test/tools');
  return res.data.tools;
}

// Listen to SSE events for a prompt test session (with Firebase Auth)
export async function listenTestSessionEvents(
  session: string,
  onMessage: (msg: any) => void,
  onStatus?: (status: any) => void,
  onKeepAlive?: () => void
): Promise<{ close: () => void }> {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  const token = await user.getIdToken();
  const url = `/api/v1/prompt/test/${session}/events`;
  const abortController = new AbortController();

  fetchEventSource(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'text/event-stream',
      'Cache-Control': 'no-cache'
    },
    signal: abortController.signal,
    onmessage(event) {
      if (!event.data) return;
      try {
        if (event.event === 'status' && onStatus) {
          onStatus(JSON.parse(event.data));
        } else if (event.event === 'keepalive' && onKeepAlive) {
          onKeepAlive();
        } else {
          onMessage(JSON.parse(event.data));
        }
      } catch {}
    },
    onerror(err) {
      abortController.abort();
    }
  });

  return {
    close: () => abortController.abort()
  };
}
