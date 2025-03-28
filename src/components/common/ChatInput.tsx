'use client';

import React, { useState } from 'react';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';

interface ChatInputProps {
  placeholder?: string;
  hintText?: string;
  onSubmit: (message: string) => void;
  className?: string;
  dispatchEvent?: boolean;
  eventName?: string;
}

export default function ChatInput({
  placeholder = 'Type a message...',
  hintText = 'Press Enter to send',
  onSubmit,
  className = '',
  dispatchEvent = false,
  eventName = 'triggerChatBubble',
}: ChatInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = () => {
    if (inputValue.trim()) {
      // Call the onSubmit callback
      onSubmit(inputValue);
      
      // Optionally dispatch a custom event
      if (dispatchEvent) {
        const chatEvent = new CustomEvent(eventName, { 
          detail: { message: inputValue }
        });
        window.dispatchEvent(chatEvent);
      }
      
      // Clear the input
      setInputValue('');
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
        <input
          type="text"
          className="flex-grow px-4 py-2 outline-none text-gray-700 placeholder-gray-500"
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
        <button
          className="flex-shrink-0 mx-2 text-white bg-blue-600 hover:bg-blue-700 rounded-full p-2 transition-colors duration-200"
          onClick={handleSubmit}
          title="Send message"
        >
          <PaperAirplaneIcon className="h-5 w-5" />
        </button>
      </div>
      {hintText && <p className="text-xs text-gray-500 mt-1 ml-2">{hintText}</p>}
    </div>
  );
}
