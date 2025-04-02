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
  
  const { prompt, yesText = 'Yes', noText = 'No' } = params;
  
  const handleOptionClick = (value: boolean) => {
    if (isResponseSubmitted) return;
    
    setSelectedOption(value ? yesText : noText);
    onResponse(value);
  };
  
  return (
    <div className="mt-2 mb-4">
      <div className="text-sm text-gray-600 mb-2">{prompt}</div>
      <div className="flex space-x-2">
        <button
          onClick={() => handleOptionClick(true)}
          disabled={isResponseSubmitted}
          className={`px-4 py-2 rounded-md text-sm transition-colors ${isResponseSubmitted
            ? selectedOption === yesText
              ? 'bg-blue-500 text-white' // Selected and submitted
              : 'bg-gray-200 text-gray-500 cursor-not-allowed' // Not selected and submitted
            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
        >
          {yesText}
        </button>
        <button
          onClick={() => handleOptionClick(false)}
          disabled={isResponseSubmitted}
          className={`px-4 py-2 rounded-md text-sm transition-colors ${isResponseSubmitted
            ? selectedOption === noText
              ? 'bg-blue-500 text-white' // Selected and submitted
              : 'bg-gray-200 text-gray-500 cursor-not-allowed' // Not selected and submitted
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          {noText}
        </button>
      </div>
    </div>
  );
};

export default ConfirmInteraction;
