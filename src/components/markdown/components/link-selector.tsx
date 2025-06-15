'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useEditor } from 'novel';
import { Tooltip as ReactTippyTooltip } from 'react-tippy';
import 'react-tippy/dist/tippy.css';

// Create a wrapper component for Tooltip to fix TypeScript issues
const Tooltip = ({ children, ...props }: { children: React.ReactNode } & any) => {
  return <ReactTippyTooltip {...props}>{children}</ReactTippyTooltip>;
};

// Helper functions for URL validation
export function isValidUrl(url: string) {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

export function getUrlFromString(str: string) {
  if (isValidUrl(str)) return str;
  try {
    if (str.includes(".") && !str.includes(" ")) {
      return new URL(`https://${str}`).toString();
    }
  } catch (e) {
    return null;
  }
}

interface LinkSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const LinkSelector = ({ open, onOpenChange }: LinkSelectorProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { editor } = useEditor();
  const [error, setError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState<string>('');

  // Autofocus on input by default
  useEffect(() => {
    if (open) {
      inputRef.current && inputRef.current?.focus();
      // Set initial value from editor if link exists
      const href = editor?.getAttributes('link').href || '';
      setInputValue(href);
      setError(null);
    }
  }, [open, editor]);
  
  // Handle click outside to close the link selector
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        onOpenChange(false);
      }
    };

    // Handle ESC key to close the link selector
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onOpenChange]);
  
  if (!editor) return null;

  return (
    <div className="relative">
      <Tooltip
        title="Insert link"
        position="bottom"
        animation="fade"
        arrow={true}
        delay={100}
        distance={10}
        theme="dark"
        hideOnClick={false}
      >
        <button 
          onClick={() => onOpenChange(!open)}
          className={`p-2 text-stone-600 hover:bg-stone-100 hover:text-stone-900 ${
            editor.isActive("link") ? "bg-stone-100 text-stone-900" : ""
          }`}
          aria-label="Insert link"
        >
          <span className="underline">Link</span>
          <span className="sr-only">Insert link</span>
        </button>
      </Tooltip>
      
      {open && (
        <div 
          ref={wrapperRef}
          className="absolute left-0 top-full z-50 mt-1 w-72 rounded-md border border-stone-200 bg-white p-1 shadow-md"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const url = getUrlFromString(inputValue);
              if (url) {
                editor.chain().focus().setLink({ href: url }).run();
                onOpenChange(false);
                setError(null);
              } else {
                setError('Invalid URL. Please enter a valid web address.');
              }
            }}
            className="flex flex-col"
          >
            <div className="flex">
              <input
                ref={inputRef}
                type="text"
                placeholder="Paste a link (https://example.com)"
                className={`flex-1 bg-transparent p-1 text-sm outline-none ${error ? 'border-red-300 border rounded' : ''}`}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  if (error && e.target.value !== inputValue) {
                    setError(null);
                  }
                }}
              />
            </div>
            <div className="flex">
              {editor.getAttributes("link").href ? (
                <button
                  type="button"
                  className="flex h-8 items-center rounded-sm p-1 text-red-600 transition-all hover:bg-red-100"
                  onClick={() => {
                    editor.chain().focus().unsetLink().run();
                    onOpenChange(false);
                  }}
                  title="Remove link"
                >
                  <span>🗑️</span>
                </button>
              ) : (
                <button 
                  type="submit" 
                  className="flex h-8 items-center rounded-sm p-1 text-green-600 hover:bg-green-100"
                  title="Apply link"
                >
                  <span>✓</span>
                </button>
              )}
              <button 
                type="button" 
                className="flex h-8 items-center rounded-sm p-1 text-gray-500 hover:bg-gray-100 ml-1"
                onClick={() => onOpenChange(false)}
                title="Cancel"
              >
                <span>✕</span>
              </button>
            </div>
            {error && (
              <div className="text-red-500 text-xs mt-1 px-1">
                {error}
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
};
