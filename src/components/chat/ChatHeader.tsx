'use client';

import React from 'react';
import { ChatTask } from '@/types/chat';

interface ChatHeaderProps {
  contextTitle: string;
  currentTask: ChatTask | null;
  onClose: () => void;
}

export function ChatHeader({ 
  contextTitle, 
  currentTask, 
  onClose 
}: ChatHeaderProps) {
  return (
    <div className="bg-blue-500 text-white px-4 py-4 flex justify-between items-center">
      <h3 className="font-medium text-lg">
        {currentTask 
          ? `DoveText Virtual Assistant (${currentTask.currentStep}/${currentTask.steps})`
          : `DoveText Virtual Assistant (${contextTitle})`}
      </h3>
      <button 
        onClick={onClose}
        className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-1.5 flex items-center justify-center transition-colors cursor-pointer"
        aria-label="Close chat"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
}
