import { useRef } from 'react';
import { ChatMessage } from '@/types/chat';
import { ChatHeader } from '@/components/chat/ChatHeader';
import ChatMessageList from '@/components/chat/ChatMessageList';
import { ChatInputArea, ChatInputAreaHandle } from '@/components/chat/ChatInputArea';
import { ConnectionStatus } from '@/components/chat/ConnectionStatus';

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
}: PromptTestChatUIProps) {
  const inputRef = useRef<ChatInputAreaHandle>(null);

  return (
    <div className="flex flex-col h-full w-full bg-white rounded shadow-lg">
      <ChatHeader contextTitle={contextTitle} currentTask={null} onClose={onClose} />
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
