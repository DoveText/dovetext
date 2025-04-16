import { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '@/app/api/chat';
import { openTestSession, sendTestMessage, closeTestSession, getAvailableTools, selectSessionTools } from '@/app/api/systemPromptTest';
import { Maximize2, Minimize2 } from 'lucide-react';

interface PromptTestChatProps {
  systemPrompt: string;
  open: boolean;
  onClose: () => void;
}

export default function PromptTestChat({ systemPrompt, open, onClose }: PromptTestChatProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLarge, setIsLarge] = useState(false);
  const [status, setStatus] = useState<'idle' | 'opening' | 'waiting' | 'responding' | 'error'>('idle');
  const [availableTools, setAvailableTools] = useState<{ name: string; description: string }[]>([]);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  // Open session on mount
  useEffect(() => {
    if (open && !sessionId) {
      setStatus('opening');
      openTestSession(systemPrompt)
        .then(id => {
          setSessionId(id);
          setStatus('idle');
        })
        .catch(() => {
          setStatus('error');
        });
    }
    // Close session on unmount or when closed
    return () => {
      if (sessionId) closeTestSession(sessionId);
      setSessionId(null);
      setMessages([]);
      setInput('');
      setIsSending(false);
      setStatus('idle');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Fetch available tools on open
  useEffect(() => {
    if (open) {
      getAvailableTools().then(setAvailableTools).catch(() => setAvailableTools([]));
    }
  }, [open]);

  // When sessionId or selectedTools changes, post selected tools
  useEffect(() => {
    if (sessionId && selectedTools) {
      selectSessionTools(sessionId, selectedTools).catch(() => {});
    }
  }, [sessionId, selectedTools]);

  const sendMessage = async () => {
    if (!input.trim() || !sessionId) return;
    const userMessage: ChatMessage = { type: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setIsSending(true);
    setStatus('responding');
    setInput('');
    inputRef.current?.focus();
    try {
      const response = await sendTestMessage(sessionId, input);
      setMessages(prev => [...prev, { type: 'system', content: response }]);
    } catch {
      setMessages(prev => [...prev, { type: 'system', content: 'Error receiving response from server.' }]);
      setStatus('error');
    } finally {
      setIsSending(false);
      setStatus('idle');
      inputRef.current?.focus();
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

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
        {/* Tool selection UI */}
        {availableTools.length > 0 && (
          <div className="px-4 py-2 border-b bg-gray-50 flex flex-wrap gap-4 items-center">
            <span className="font-semibold text-sm text-gray-700 mr-2">Tools:</span>
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
                  disabled={!sessionId || status === 'opening'}
                />
                <span className="font-medium text-gray-700">{tool.name}</span>
                <span className="text-gray-400" title={tool.description}>({tool.description})</span>
              </label>
            ))}
          </div>
        )}
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
        <div className="flex items-center border-t px-4 py-2">
          <input
            ref={inputRef}
            className="flex-1 border rounded px-3 py-2 mr-2"
            type="text"
            placeholder="Type your message..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleInputKeyDown}
            disabled={isSending}
          />
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            onClick={sendMessage}
            disabled={isSending || !input.trim()}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
