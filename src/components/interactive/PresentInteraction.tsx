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
  const { title, content, format = 'text', level = 'info' } = params;
  
  // Define styles based on level
  const getLevelStyles = () => {
    switch (level) {
      case 'error':
        return {
          container: 'bg-red-50 border-red-100',
          title: 'text-red-800',
          content: 'text-red-700'
        };
      case 'warn':
      case 'warning':
        return {
          container: 'bg-amber-50 border-amber-100',
          title: 'text-amber-800',
          content: 'text-amber-700'
        };
      case 'success':
        return {
          container: 'bg-green-50 border-green-100',
          title: 'text-green-800',
          content: 'text-green-700'
        };
      case 'info':
      default:
        return {
          container: 'bg-blue-50 border-blue-100',
          title: 'text-blue-800',
          content: 'text-blue-700'
        };
    }
  };
  
  const styles = getLevelStyles();
  
  return (
    <div className={`mt-2 mb-4 p-4 ${styles.container} border rounded-md`}>
      {title && (
        <div className={`font-medium ${styles.title} mb-2`}>{title}</div>
      )}
      <div className={`text-sm ${styles.content}`}>
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
