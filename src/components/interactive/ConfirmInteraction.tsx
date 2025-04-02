'use client';

import React, { useState } from 'react';
import { ConfirmInteractionParams } from '@/types/interactive';

interface ConfirmInteractionProps {
  parameters: Record<string, any>;
  onResponse: (response: boolean) => void;
  isResponseSubmitted: boolean;
}

/**
 * Component for handling confirm (yes/no) interactions
 */
const ConfirmInteraction: React.FC<ConfirmInteractionProps> = ({
  parameters,
  onResponse,
  isResponseSubmitted
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const params = parameters as ConfirmInteractionParams;
  
  // Extract parameters
  const { yesPrompt, noPrompt } = params;
  
  console.log('[ConfirmInteraction] Parameters:', params);
  
  const handleOptionClick = (value: boolean, buttonText: string) => {
    if (isResponseSubmitted) return;
    
    // Use the button text (yesPrompt/noPrompt) as the selected option
    setSelectedOption(buttonText);
    onResponse(value);
  };
  
  return (
    <div className="mt-2 mb-4">
      <div className="flex space-x-2">
        <button
          onClick={() => handleOptionClick(true, yesPrompt)}
          disabled={isResponseSubmitted}
          className={`px-4 py-2 rounded-md text-sm transition-colors ${isResponseSubmitted
            ? selectedOption === yesPrompt
              ? 'bg-blue-500 text-white' // Selected and submitted
              : 'bg-gray-200 text-gray-500 cursor-not-allowed' // Not selected and submitted
            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
        >
          {yesPrompt}
        </button>
        <button
          onClick={() => handleOptionClick(false, noPrompt)}
          disabled={isResponseSubmitted}
          className={`px-4 py-2 rounded-md text-sm transition-colors ${isResponseSubmitted
            ? selectedOption === noPrompt
              ? 'bg-blue-500 text-white' // Selected and submitted
              : 'bg-gray-200 text-gray-500 cursor-not-allowed' // Not selected and submitted
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          {noPrompt}
        </button>
      </div>
    </div>
  );
};

export default ConfirmInteraction;
