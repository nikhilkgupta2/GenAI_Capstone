import { useAuthStore } from './auth-store';

export type ChatResponse = {
  answer: string;
  sources: string[];
};

export async function sendChatMessage(message: string, currentModule?: string | null, sessionId?: string | null) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1';
  const token = useAuthStore.getState().token;
  const response = await fetch(`${baseUrl}/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ message, current_module: currentModule ?? null, session_id: sessionId ?? null }),
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  const envelope = (await response.json()) as { data: ChatResponse };
  return envelope.data;
}

export async function streamChatMessage(
  message: string,
  currentModule: string | null | undefined,
  sessionId: string | null | undefined,
  onChunk: (chunk: string) => void,
  onSources: (sources: string[]) => void,
) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1';
  const token = useAuthStore.getState().token;
  const response = await fetch(`${baseUrl}/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ message, current_module: currentModule ?? null, session_id: sessionId ?? null, stream: true }),
  });

  if (!response.ok || !response.body) {
    throw new Error(await response.text());
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split('\n\n');
    buffer = events.pop() ?? '';

    for (const event of events) {
      const eventName = event.split('\n').find((line) => line.startsWith('event: '))?.slice(7) ?? 'message';
      const dataLine = event.split('\n').find((line) => line.startsWith('data: '));
      if (!dataLine) continue;
      const raw = dataLine.slice(6);
      if (eventName === 'chunk') {
        onChunk(JSON.parse(raw) as string);
      }
      if (eventName === 'sources') {
        onSources(JSON.parse(raw) as string[]);
      }
      if (eventName === 'done') {
        return;
      }
    }
  }
}
