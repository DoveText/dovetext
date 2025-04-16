import { apiClient } from './client';

// Open a new test session with a system prompt
export async function openTestSession(systemPrompt: string): Promise<string> {
  const res = await apiClient.post<{ session: string }>('/api/v1/prompt/test/open', { prompt: systemPrompt });
  return res.data.session;
}

// Send a user message in a test session
export async function sendTestMessage(session: string, message: string): Promise<string> {
  const res = await apiClient.post<{ response: string }>(`/api/v1/system-prompt-test/${session}/chat`, { message });
  return res.data.response;
}

// Close a test session
export async function closeTestSession(session: string): Promise<void> {
  await apiClient.post(`/api/v1/system-prompt-test/${session}/close`);
}

// Get list of available tools
export async function getAvailableTools(): Promise<{ name: string; description: string }[]> {
  const res = await apiClient.get<{ tools: { name: string; description: string }[] }>('/api/v1/system-prompt-test/tools');
  return res.data.tools;
}

// Select tools for a session
export async function selectSessionTools(session: string, tools: string[]): Promise<void> {
  await apiClient.post(`/api/v1/system-prompt-test/${session}/tools`, { tools });
}
