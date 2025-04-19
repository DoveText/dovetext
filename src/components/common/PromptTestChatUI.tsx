import { useRef } from 'react';
import { ChatMessage } from '@/types/chat';
import { ChatHeader } from '@/components/chat/ChatHeader';
import ChatMessageList from '@/components/chat/ChatMessageList';
import { ChatInputArea, ChatInputAreaHandle } from '@/components/chat/ChatInputArea';
import { ConnectionStatus } from '@/components/chat/ConnectionStatus';
import { Maximize2, Minimize2 } from 'lucide-react';

interface PromptTestChatUIProps {
  messages: ChatMessage[];
  isSending: boolean;
  status: 'connected' | 'disconnected' | 'reconnecting' | 'idle' | 'opening' | 'waiting' | 'responding' | 'error';
  onSend: (msg: string) => void;
  onClose: () => void;
  onReconnect?: () => void;
  inputDisabled?: boolean;
  processingHint?: string;
  contextTitle?: string;
  isLarge?: boolean;
  onToggleSize?: () => void;
}

export default function PromptTestChatUI({
  messages,
  isSending,
  status,
  onSend,
  onClose,
  onReconnect,
  inputDisabled = false,
  processingHint = '',
  contextTitle = 'Prompt Test',
  isLarge = true,
  onToggleSize,
}: PromptTestChatUIProps) {
  const inputRef = useRef<ChatInputAreaHandle>(null);

  return (
    <div className="flex flex-col h-full w-full bg-white rounded shadow-lg">
      <div className="bg-blue-500 text-white px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          {onToggleSize && (
            <button
              className="text-blue-600 hover:text-blue-800 bg-white hover:bg-blue-100 border border-blue-200 rounded-md p-1.5 flex items-center justify-center transition-colors cursor-pointer shadow-sm"
              onClick={onToggleSize}
              aria-label={isLarge ? 'Shrink' : 'Expand'}
              title={isLarge ? 'Shrink' : 'Expand'}
              style={{ aspectRatio: '1 / 1', minWidth: 32, minHeight: 32 }}
            >
              {isLarge ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
          )}
          <h3 className="font-medium text-lg">
            {contextTitle}
          </h3>
        </div>
        <button
          onClick={() => { console.log('[PromptTestChatUI] Close icon clicked'); onClose(); }}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-1.5 flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Close chat"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      <ConnectionStatus connectionStatus={status === 'connected' ? 'connected' : status === 'reconnecting' ? 'reconnecting' : 'disconnected'} onReconnect={onReconnect || (() => {})} />
      <div className="flex-1 overflow-y-auto p-4">
        <ChatMessageList
          chatHistory={messages}
          isProcessing={isSending || status === 'responding'}
          processingHint={processingHint}
          currentTask={null}
          getContextExample={() => ''}
        />
      </div>
      <div className="border-t px-4 py-3 bg-gray-50">
        <ChatInputArea
          ref={inputRef}
          onSubmit={onSend}
          isSending={isSending}
          showInputForm={!inputDisabled && status !== 'disconnected' && status !== 'error'}
          currentTask={null}
        />
      </div>
    </div>
  );
}
