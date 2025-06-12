'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { github } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <div className={`markdown-content ${className}`}>
      <div className="prose prose-lg prose-blue max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            // @ts-ignore - Ignoring type issues with react-markdown components
            code: ({ node, inline, className, children, ...props }) => {
              const match = /language-(\w+)/.exec(className || '');
              return !inline && match ? (
                <SyntaxHighlighter
                  style={github}
                  language={match[1]}
                  PreTag="div"
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            }
          }}
        >
          {content || ''}
        </ReactMarkdown>
      </div>
      <style jsx global>{`
        .markdown-content .prose {
          width: 100%;
        }
        .markdown-content .prose pre {
          background-color: #f6f8fa;
          border-radius: 6px;
          padding: 16px;
          overflow: auto;
        }
        .markdown-content .prose img {
          max-width: 100%;
          height: auto;
          border-radius: 6px;
        }
        .markdown-content .prose blockquote {
          border-left: 4px solid #ddd;
          padding-left: 1rem;
          color: #666;
          font-style: italic;
        }
        .markdown-content .prose table {
          border-collapse: collapse;
          width: 100%;
          margin: 1rem 0;
        }
        .markdown-content .prose table th,
        .markdown-content .prose table td {
          border: 1px solid #ddd;
          padding: 8px 12px;
        }
        .markdown-content .prose table th {
          background-color: #f6f8fa;
          font-weight: 600;
        }
        .markdown-content .prose table tr:nth-child(even) {
          background-color: #f9f9f9;
        }
      `}</style>
    </div>
  );
}

export default MarkdownRenderer;
