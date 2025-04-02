'use client';

import React, { useState } from 'react';
import { SelectInteractionParams } from '@/types/interactive';

interface SelectInteractionProps {
  parameters: Record<string, any>;
  onResponse: (response: string) => void;
  isResponseSubmitted: boolean;
}

/**
 * Component for handling select interactions (choosing from multiple options)
 */
const SelectInteraction: React.FC<SelectInteractionProps> = ({
  parameters,
  onResponse,
  isResponseSubmitted
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const params = parameters as SelectInteractionParams;
  
  const { question, options, placeholder } = params;
  
  const handleOptionClick = (option: string) => {
    if (isResponseSubmitted) return;
    
    setSelectedOption(option);
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
    </div>
  );
};

export default SelectInteraction;
