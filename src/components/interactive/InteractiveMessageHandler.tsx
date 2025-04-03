'use client';

import React, { useState } from 'react';
import { InteractiveMessage, InteractiveFunction } from '@/types/interactive';
import ConfirmInteraction from './ConfirmInteraction';
import SelectInteraction from './SelectInteraction';
import FormInteraction from './FormInteraction';
import PresentInteraction from './PresentInteraction';

interface InteractiveMessageHandlerProps {
  message: InteractiveMessage;
  onResponse: (response: any) => void;
  isResponseSubmitted: boolean;
  parentMessage?: any; // Add reference to the parent ChatMessage
}

/**
 * Component that handles rendering different types of interactive messages
 * based on the function type (chat, confirm, select, form, present)
 */
const InteractiveMessageHandler: React.FC<InteractiveMessageHandlerProps> = ({
  message,
  onResponse,
  isResponseSubmitted,
  parentMessage
}) => {
  const { function: functionType, parameters } = message;

  // Extract submitted response from parent message if available
  const submittedResponse = parentMessage?.responseValue;

  // Render the appropriate interaction component based on the function type
  switch (functionType) {
    case 'confirm':
      return (
        <ConfirmInteraction 
          parameters={parameters} 
          onResponse={onResponse} 
          isResponseSubmitted={isResponseSubmitted}
        />
      );
    
    case 'select':
      return (
        <SelectInteraction 
          parameters={parameters} 
          onResponse={onResponse} 
          isResponseSubmitted={isResponseSubmitted}
          message={parentMessage}
        />
      );
    
    case 'form':
      return (
        <FormInteraction 
          parameters={parameters} 
          onResponse={onResponse} 
          isResponseSubmitted={isResponseSubmitted}
          submittedValues={submittedResponse}
        />
      );
    
    case 'present':
      return (
        <PresentInteraction 
          parameters={parameters} 
        />
      );
    
    case 'chat':
      // Chat is handled by the main input form, so we don't need a special component
      return null;
    
    default:
      console.warn(`Unknown interactive function type: ${functionType}`);
      return null;
  }
};

export default InteractiveMessageHandler;
