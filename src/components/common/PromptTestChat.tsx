import { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '@/app/api/chat';
import { openTestSession, sendTestMessage, closeTestSession, getAvailableTools, listenTestSessionEvents, keepAliveTestSession } from '@/app/api/systemPromptTest';
import { Maximize2, Minimize2 } from 'lucide-react';

interface PromptTestChatProps {
  systemPrompt: string;
  open: boolean;
  onClose: () => void;
}

const MODEL_OPTIONS = [
  { label: 'Gemini 2.0 Flash', value: 'gemini-2.0-flash' },
  { label: 'Gemini 2.5 Pro (Exp 03-25)', value: 'gemini-2.5-pro-exp-03-25' },
];

export default function PromptTestChat({ systemPrompt, open, onClose }: PromptTestChatProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLarge, setIsLarge] = useState(false);
  const [status, setStatus] = useState<'idle' | 'opening' | 'waiting' | 'responding' | 'error'>('idle');
  const [availableTools, setAvailableTools] = useState<{ name: string; description: string }[]>([]);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>(MODEL_OPTIONS[0].value);
  const [initError, setInitError] = useState<string | null>(null);
  const [initLoading, setInitLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Only fetch tools on open, before session is started
  useEffect(() => {
    if (open && !initialized) {
      getAvailableTools().then(setAvailableTools).catch(() => setAvailableTools([]));
    }
  }, [open, initialized]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSessionId(null);
      setMessages([]);
      setInput('');
      setIsSending(false);
      setStatus('idle');
      setAvailableTools([]);
      setSelectedTools([]);
      setSelectedModel(MODEL_OPTIONS[0].value);
      setInitError(null);
      setInitLoading(false);
      setInitialized(false);
    }
  }, [open]);

  // Restore focus to textarea after sending completes
  useEffect(() => {
    if (!isSending && sessionId && inputRef.current && !inputRef.current.disabled) {
      inputRef.current.focus();
    }
  }, [isSending, sessionId]);

  // Listen to SSE events for server-pushed messages and keepalive
  useEffect(() => {
    if (!sessionId) return;
    let stopped = false;
    const es = listenTestSessionEvents(
      sessionId,
      (msg) => {
        setMessages(prev => [...prev, msg]);
      },
      (status) => {
        if (status.status === 'session_closed') {
          setStatus('idle');
        }
      },
      () => {
        // Optionally handle keepalive from server (noop or log)
        // console.log('Received keepalive from server');
      }
    );
    // Keepalive interval (every 30s)
    const keepAliveInterval = setInterval(async () => {
      try {
        await keepAliveTestSession(sessionId);
      } catch (err: any) {
        if (err?.response?.status === 404) {
          setStatus('error');
          setInitError('Session expired or closed. Please start a new test session.');
          es.close();
          stopped = true;
          clearInterval(keepAliveInterval);
        }
      }
    }, 30000);
    // Handle SSE error event (network/server issues)
    es.addEventListener('error', () => {
      if (!stopped) {
        setStatus('error');
        setInitError('Lost connection to server. Please try again.');
        es.close();
        clearInterval(keepAliveInterval);
      }
    });
    return () => {
      es.close();
      clearInterval(keepAliveInterval);
    };
  }, [sessionId]);

  // Close session on unmount or when dialog closes
  useEffect(() => {
    if (!open) return;
    return () => {
      if (sessionId) closeTestSession(sessionId);
    };
  }, [open, sessionId]);

  const sendMessage = async () => {
    if (!input.trim() || !sessionId) return;
    const userMessage: ChatMessage = { type: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setIsSending(true);
    setStatus('responding');
    setInput('');
    try {
      const response = await sendTestMessage(sessionId, input);
      setMessages(prev => [...prev, { type: 'system', content: response }]);
    } catch {
      setMessages(prev => [...prev, { type: 'system', content: 'Error receiving response from server.' }]);
      setStatus('error');
    } finally {
      setIsSending(false);
      setStatus('idle');
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleStart = async () => {
    setInitLoading(true);
    setInitError(null);
    try {
      const resp = await openTestSession(systemPrompt, selectedTools, selectedModel);
      setSessionId(resp.session);
      setInitialized(true);
      setStatus('idle');
      // If backend returns a welcome message, display it
      if (resp.message) {
        setMessages([{ type: 'system', content: resp.message }]);
      } else {
        setMessages([]);
      }
    } catch (err: any) {
      setInitError('Failed to start test session.');
    } finally {
      setInitLoading(false);
    }
  };

  if (!open) return null;
  if (!initialized) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
        <div className={`relative mx-auto bg-white rounded shadow-lg flex flex-col transition-all duration-200 w-full max-w-xl`}>
          <div className="flex items-center justify-between px-4 py-2 border-b">
            <div className="flex items-center gap-2 font-semibold">
              Test Prompt Chat
            </div>
            <button
              className="text-gray-600 hover:text-black bg-white rounded-full shadow p-2"
              onClick={onClose}
              aria-label="Close chat"
            >
              ×
            </button>
          </div>
          <div className="px-4 py-4">
            <div className="mb-4">
              <label className="block font-semibold mb-1 text-sm">Select Tools:</label>
              {availableTools.length === 0 ? (
                <div className="text-gray-400 italic text-xs">No tools available</div>
              ) : (
                <div className="flex flex-wrap gap-4 items-center">
                  {availableTools.map(tool => (
                    <label key={tool.name} className="flex items-center gap-1 text-xs cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={selectedTools.includes(tool.name)}
                        onChange={e => {
                          setSelectedTools(prev =>
                            e.target.checked
                              ? [...prev, tool.name]
                              : prev.filter(name => name !== tool.name)
                          );
                        }}
                        className="accent-blue-500"
                        disabled={initLoading}
                      />
                      <span className="font-medium text-gray-700">{tool.name}</span>
                      <span className="text-gray-400" title={tool.description}>({tool.description})</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="mb-4">
              <label className="block font-semibold mb-1 text-sm">Select Model:</label>
              <select
                className="border rounded px-3 py-2 text-sm"
                value={selectedModel}
                onChange={e => setSelectedModel(e.target.value)}
                disabled={initLoading}
              >
                {MODEL_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded min-w-[100px]"
              onClick={handleStart}
              disabled={initLoading || !selectedModel}
            >
              {initLoading ? 'Starting...' : 'Start'}
            </button>
            {initError && <div className="text-red-500 text-xs mt-2">{initError}</div>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div
        className={`relative mx-auto bg-white rounded shadow-lg flex flex-col transition-all duration-200 ${isLarge ? 'w-[900px] h-[700px]' : 'w-full max-w-xl'} `}
        style={isLarge ? { height: 700, width: 900 } : {}}
      >
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <div className="flex items-center gap-2 font-semibold">
            <button
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full p-1 flex items-center"
              onClick={() => setIsLarge(v => !v)}
              aria-label={isLarge ? 'Shrink' : 'Enlarge'}
              style={{ zIndex: 10 }}
              tabIndex={0}
            >
              {isLarge ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
            Test Prompt Chat
          </div>
          <button
            className="text-gray-600 hover:text-black bg-white rounded-full shadow p-2"
            onClick={onClose}
            aria-label="Close chat"
          >
            ×
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2" style={{ minHeight: isLarge ? 500 : 300, maxHeight: isLarge ? 600 : 400 }}>
          {status === 'opening' && (
            <div className="text-center text-gray-400 animate-pulse">Opening test session...</div>
          )}
          {messages.map((msg, idx) => (
            <div key={idx} className={`text-sm ${msg.type === 'user' ? 'text-right' : 'text-left'} w-full`}>
              <span className={msg.type === 'user' ? 'bg-blue-100 text-blue-800 rounded px-2 py-1 inline-block' : 'bg-gray-100 text-gray-800 rounded px-2 py-1 inline-block'}>
                {msg.content}
              </span>
            </div>
          ))}
          {status === 'responding' && (
            <div className="flex items-center gap-2 text-gray-400 animate-pulse">
              <span className="inline-block w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></span>
              Waiting for LLM response...
            </div>
          )}
        </div>
        <div className="border-t px-4 py-3 flex gap-2 items-end bg-gray-50">
          <textarea
            ref={inputRef}
            className="flex-1 border rounded px-3 py-2 text-sm resize-y min-h-[48px] max-h-40 font-mono"
            placeholder="Type your message..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleInputKeyDown}
            disabled={isSending || !sessionId}
            rows={2}
          />
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            onClick={sendMessage}
            disabled={isSending || !input.trim() || !sessionId}
            style={{ minWidth: 80 }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
