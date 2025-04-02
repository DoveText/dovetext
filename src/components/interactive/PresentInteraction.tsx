'use client';

import React from 'react';
import { PresentInteractionParams } from '@/types/interactive';

// Try to import ReactMarkdown, but provide a fallback if it's not available
let ReactMarkdown: any;
try {
  // Dynamic import for ReactMarkdown
  ReactMarkdown = require('react-markdown');
} catch (error) {
  // Fallback if ReactMarkdown is not available
  ReactMarkdown = ({ children }: { children: string }) => (
    <div className="whitespace-pre-wrap">{children}</div>
  );
}

interface PresentInteractionProps {
  parameters: Record<string, any>;
}

/**
 * Component for handling present interactions (displaying information)
 */
const PresentInteraction: React.FC<PresentInteractionProps> = ({
  parameters
}) => {
  const params = parameters as PresentInteractionParams;
  const { title, content, format = 'text' } = params;
  
  return (
    <div className="mt-2 mb-4 p-4 bg-blue-50 border border-blue-100 rounded-md">
      {title && (
        <div className="font-medium text-blue-800 mb-2">{title}</div>
      )}
      <div className="text-sm">
        {format === 'markdown' ? (
          <ReactMarkdown className="prose prose-sm max-w-none">
            {content}
          </ReactMarkdown>
        ) : format === 'html' ? (
          <div dangerouslySetInnerHTML={{ __html: content }} />
        ) : (
          <div className="whitespace-pre-wrap">{content}</div>
        )}
      </div>
    </div>
  );
};

export default PresentInteraction;
