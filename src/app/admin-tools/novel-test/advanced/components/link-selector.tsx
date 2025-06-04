'use client';

import React, { useEffect, useRef } from 'react';
import { useEditor } from 'novel';

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
  const { editor } = useEditor();

  // Autofocus on input by default
  useEffect(() => {
    inputRef.current && inputRef.current?.focus();
  });
  
  if (!editor) return null;

  return (
    <div className="relative">
      <button 
        onClick={() => onOpenChange(!open)}
        className={`p-2 text-stone-600 hover:bg-stone-100 hover:text-stone-900 ${
          editor.isActive("link") ? "bg-stone-100 text-stone-900" : ""
        }`}
      >
        <span className="underline">Link</span>
      </button>
      
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-60 rounded-md border border-stone-200 bg-white p-1 shadow-md">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const target = e.currentTarget as HTMLFormElement;
              const input = target[0] as HTMLInputElement;
              const url = getUrlFromString(input.value);
              if (url) {
                editor.chain().focus().setLink({ href: url }).run();
                onOpenChange(false);
              }
            }}
            className="flex"
          >
            <input
              ref={inputRef}
              type="text"
              placeholder="Paste a link"
              className="flex-1 bg-transparent p-1 text-sm outline-none"
              defaultValue={editor.getAttributes("link").href || ""}
            />
            <div className="flex">
              {editor.getAttributes("link").href ? (
                <button
                  type="button"
                  className="flex h-8 items-center rounded-sm p-1 text-red-600 transition-all hover:bg-red-100"
                  onClick={() => {
                    editor.chain().focus().unsetLink().run();
                    onOpenChange(false);
                  }}
                >
                  <span>🗑️</span>
                </button>
              ) : (
                <button type="submit" className="flex h-8 items-center rounded-sm p-1">
                  <span>✓</span>
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
