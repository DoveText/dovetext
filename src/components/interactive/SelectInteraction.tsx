'use client';

import React, { useState, useEffect } from 'react';
import { SelectInteractionParams } from '@/types/interactive';

interface SelectInteractionProps {
  parameters: Record<string, any>;
  onResponse: (response: string) => void;
  isResponseSubmitted: boolean;
  message?: any; 
}

/**
 * Component for handling select interactions (choosing from multiple options)
 */
const SelectInteraction: React.FC<SelectInteractionProps> = ({
  parameters,
  onResponse,
  isResponseSubmitted,
  message
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [customOption, setCustomOption] = useState<string | null>(null);
  const params = parameters as SelectInteractionParams;
  
  const { question, options, placeholder } = params;
  
  // Effect to check if there's a responseValue to use
  useEffect(() => {
    if (isResponseSubmitted && message?.responseValue) {
      const responseValueStr = String(message.responseValue);
      setSelectedOption(responseValueStr);
      
      // Check if it's a custom option
      if (!options.includes(responseValueStr)) {
        setCustomOption(responseValueStr);
      }
    }
  }, [isResponseSubmitted, message, options]);
  
  const handleOptionClick = (option: string) => {
    if (isResponseSubmitted) return;
    
    setSelectedOption(option);
    setCustomOption(null); // Clear any custom option when selecting a predefined one
    onResponse(option);
  };
  
  return (
    <div className="mt-2 mb-4">
      <div className="flex flex-wrap gap-2">
        {options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleOptionClick(option)}
            disabled={isResponseSubmitted}
            className={`px-4 py-2 rounded-md text-sm transition-colors ${isResponseSubmitted
              ? selectedOption === option
                ? 'bg-blue-500 text-white' // Selected and submitted
                : 'bg-gray-200 text-gray-500 cursor-not-allowed' // Not selected and submitted
              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
          >
            {option}
          </button>
        ))}
      </div>
      
      {/* Show custom option message if applicable */}
      {customOption && isResponseSubmitted && (
        <div className="mt-2 text-sm text-amber-600 bg-amber-50 p-2 rounded">
          User provided custom option: <span className="font-semibold">"{customOption}"</span>
        </div>
      )}
    </div>
  );
};

export default SelectInteraction;
