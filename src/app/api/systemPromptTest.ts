import { apiClient } from './client';

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

// Listen to SSE events for a prompt test session
export function listenTestSessionEvents(session: string, onMessage: (msg: any) => void, onStatus?: (status: any) => void, onKeepAlive?: () => void): EventSource {
  const url = `/api/v1/prompt/test/${session}/events`;
  const es = new EventSource(url);
  es.addEventListener('message', (e) => {
    try {
      const data = JSON.parse((e as MessageEvent).data);
      onMessage(data);
    } catch {}
  });
  if (onStatus) {
    es.addEventListener('status', (e) => {
      try {
        const data = JSON.parse((e as MessageEvent).data);
        onStatus(data);
      } catch {}
    });
  }
  if (onKeepAlive) {
    es.addEventListener('keepalive', () => {
      onKeepAlive();
    });
  }
  return es;
}
