import { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '@/app/api/chat';
import { openTestSessionSSE, startTestSession, sendTestMessage, closeTestSession, getAvailableTools, keepAliveTestSession } from '@/app/api/systemPromptTest';
import { Maximize2, Minimize2 } from 'lucide-react';
import PromptTestChatUI from './PromptTestChatUI';

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
  const [isSending, setIsSending] = useState(false);
  const [isLarge, setIsLarge] = useState(true);
  const [status, setStatus] = useState<'idle' | 'opening' | 'connected' | 'disconnected' | 'error'>('idle');
  const [messageStatus, setMessageStatus] = useState<'idle' | 'sending' | 'responding'>('idle');
  const [availableTools, setAvailableTools] = useState<{ name: string; description: string }[]>([]);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>(MODEL_OPTIONS[0].value);
  const [initError, setInitError] = useState<string | null>(null);
  const [initLoading, setInitLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // SSE controller ref for cleanup
  const [sseController, setSseController] = useState<{ close: () => void } | null>(null);
  // Keepalive interval ref
  const keepaliveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  // Add ref to track session close
  const sessionClosedRef = useRef(false);

  // Only fetch tools on open, before session is started
  useEffect(() => {
    if (open && !initialized) {
      console.log('[PromptTestChat] open effect: open=', open, 'initialized=', initialized, 'sessionId=', sessionId);
      getAvailableTools().then(setAvailableTools).catch(() => setAvailableTools([]));
    }
  }, [open, initialized]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      console.log('[PromptTestChat] Dialog closed, resetting state. SessionId before reset:', sessionId);
      setStatusWithLog('idle');
      setSessionId(null);
      setMessages([]);
      setIsSending(false);
      setAvailableTools([]);
      setSelectedTools([]);
      setSelectedModel(MODEL_OPTIONS[0].value);
      setInitError(null);
      setInitLoading(false);
      setInitialized(false);
    }
  }, [open]);

  // Reset sessionClosedRef when a new session is started
  useEffect(() => {
    if (open) sessionClosedRef.current = false;
  }, [open]);

  // Cleanup SSE and keepalive on unmount or dialog close
  useEffect(() => {
    return () => {
      console.log('[PromptTestChat] Cleanup: closing SSE and clearing keepalive');
      if (sseController) sseController.close();
      if (keepaliveIntervalRef.current) clearInterval(keepaliveIntervalRef.current);
    };
  }, [sseController, keepaliveIntervalRef]);

  // Start session handler: open SSE, get sessionId, then POST to <session>/start
  const handleStart = async () => {
    console.log('[PromptTestChat] handleStart called. open:', open, 'initialized:', initialized, 'sessionId:', sessionId);
    setInitLoading(true);
    setInitError(null);
    setMessages([]);
    setSessionId(null);
    setInitialized(false);
    if (sseController) sseController.close();
    if (keepaliveIntervalRef.current) clearInterval(keepaliveIntervalRef.current);
    try {
      const controller = await openTestSessionSSE(
        async (session, welcomeMsg) => {
          console.log('[PromptTestChat] SSE opened. sessionId:', session);
          setSessionId(session);
          setInitialized(true);
          setStatusWithLog('connected');
          if (welcomeMsg) {
            setMessages([{ type: 'system', content: welcomeMsg }]);
          } else {
            setMessages([]);
          }
          // Start the test session after getting sessionId
          try {
            await startTestSession(session, systemPrompt, selectedTools, selectedModel);
          } catch {
            setStatusWithLog('error');
            setInitError('Failed to start test session.');
            controller.close();
            return;
          }
          // Start keepalive interval
          if (keepaliveIntervalRef.current) clearInterval(keepaliveIntervalRef.current);
          keepaliveIntervalRef.current = setInterval(async () => {
            if (sessionClosedRef.current) return;
            try {
              await keepAliveTestSession(session);
            } catch (err: any) {
              setStatusWithLog('disconnected');
              setInitError('Lost connection to server. Please try again.');
              controller.close();
              clearInterval(keepaliveIntervalRef.current!);
            }
          }, 30000);
        },
        (msg) => {
          if (msg && (msg.type === 'user' || msg.type === 'system')) {
            setMessages(prev => [...prev, msg]);
          }
        },
        (status) => {
          if (status.status === 'session_closed') {
            setStatusWithLog('idle');
          }
        },
        () => {},
        (err: unknown) => {
          setStatusWithLog('disconnected');
          setInitError('Lost connection to server. Please try again.');
          if (keepaliveIntervalRef.current) clearInterval(keepaliveIntervalRef.current);
          if (sseController) sseController.close();
        }
      );
      setSseController(controller);
    } catch (err) {
      setStatusWithLog('disconnected');
      setInitError('Lost connection to server. Please try again.');
    } finally {
      setInitLoading(false);
    }
  };

  // Close session on unmount or when dialog closes, but only if not already closed
  useEffect(() => {
    if (!open && sessionId && !sessionClosedRef.current) {
      sessionClosedRef.current = true;
      closeTestSession(sessionId);
    }
  }, [open, sessionId]);

  // Add logging for connection status changes
  useEffect(() => {
    console.log('[PromptTestChat] Connection status changed:', status, 'sessionId:', sessionId);
  }, [status, sessionId]);

  const setStatusWithLog = (newStatus: typeof status) => {
    console.log('[PromptTestChat] setStatus:', newStatus, 'sessionId:', sessionId);
    setStatus(newStatus);
  };

  const sendMessage = async (message: string) => {
    if (!message.trim() || !sessionId) return;
    const userMessage: ChatMessage = { type: 'user', content: message };
    setMessages(prev => [...prev, userMessage]);
    setIsSending(true);
    setMessageStatus('responding');
    try {
      const response = await sendTestMessage(sessionId, message);
      setMessages(prev => [...prev, { type: 'system', content: response }]);
    } catch {
      setMessages(prev => [...prev, { type: 'system', content: 'Error receiving response from server.' }]);
      setStatusWithLog('error');
    } finally {
      setIsSending(false);
      setMessageStatus('idle');
    }
  };

  // Handler for close icon
  const handleChatClose = () => {
    if (!sessionClosedRef.current && sessionId) {
      sessionClosedRef.current = true;
      closeTestSession(sessionId);
    }
    onClose();
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
              onClick={handleChatClose}
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
      <div className={`relative mx-auto w-full ${isLarge ? 'max-w-5xl' : 'max-w-xl'} h-[600px]`}>
        <PromptTestChatUI
          messages={messages}
          isSending={isSending}
          status={status}
          messageStatus={messageStatus}
          onSend={sendMessage}
          onClose={handleChatClose}
          onReconnect={handleStart}
          inputDisabled={isSending || status === 'opening' || status === 'disconnected'}
          processingHint={messageStatus === 'responding' ? 'Model is thinking...' : ''}
          contextTitle="Prompt Test"
          isLarge={isLarge}
          onToggleSize={() => setIsLarge(!isLarge)}
        />
      </div>
    </div>
  );
}
