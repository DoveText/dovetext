'use client';

import React, { useState, useRef, useEffect } from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { TitleGenerationDialog } from './TitleGenerationDialog';

interface TitleSelectInputProps {
  title: string;
  suggestedTitles: string[];
  onTitleChange: (title: string) => void;
  onGenerateTitles: (prompt: string) => Promise<string[]>;
  onAddSuggestedTitle: (title: string) => void;
}

export default function TitleSelectInput({
  title: initialTitle,
  suggestedTitles: initialSuggestedTitles,
  onTitleChange,
  onGenerateTitles,
  onAddSuggestedTitle
}: TitleSelectInputProps) {
  // Initialize title state from initialTitle prop
  const [title, setTitle] = useState<string>(initialTitle || '');
  
  // Log initial title for debugging
  console.log('TitleSelectInput initialized with title:', initialTitle);
  const [suggestedTitlesState, setSuggestedTitlesState] = useState<string[]>(initialSuggestedTitles || []);
  const [isTitleDropdownOpen, setIsTitleDropdownOpen] = useState(false);
  const [isTitleDialogOpen, setIsTitleDialogOpen] = useState(false);
  
  const titleInputRef = useRef<HTMLInputElement>(null);
  const titleButtonRef = useRef<HTMLButtonElement>(null);
  const titleDropdownRef = useRef<HTMLDivElement>(null);
  
  // Debug logging - no filtering, show all titles
  console.log('TitleSelectInput rendering with:', { 
    title, 
    suggestedTitles: suggestedTitlesState, 
    dropdownOpen: isTitleDropdownOpen, 
    suggestedCount: suggestedTitlesState.length,
    suggestedTitlesSource: initialSuggestedTitles 
  });

  // Log when suggestedTitles prop changes
  useEffect(() => {
    console.log('TitleSelectInput received new suggestedTitles prop:', initialSuggestedTitles);
    // Always update the state when the prop changes, even if empty
    setSuggestedTitlesState(Array.isArray(initialSuggestedTitles) ? [...initialSuggestedTitles] : []);
    
    // Don't automatically open the dropdown - let the user click to see options
    // This prevents the dropdown from stealing focus when the page loads
  }, [initialSuggestedTitles]);
  
  // Update title when initialTitle prop changes
  useEffect(() => {
    console.log('TitleSelectInput initialTitle changed:', initialTitle);
    if (initialTitle) {
      setTitle(initialTitle);
      // Log that we've updated the title
      console.log('TitleSelectInput updated title state to:', initialTitle);
    }
  }, [initialTitle]);

  // Handle clicks outside the dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        titleDropdownRef.current &&
        titleInputRef.current &&
        titleButtonRef.current &&
        !titleDropdownRef.current.contains(event.target as Node) &&
        !titleInputRef.current.contains(event.target as Node) &&
        !titleButtonRef.current.contains(event.target as Node)
      ) {
        setIsTitleDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle title changes
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    onTitleChange(newTitle);
  };
  
  // Handle title selection from dropdown
  const handleTitleSelect = (selectedTitle: string) => {
    console.log('Title selected from dropdown:', selectedTitle);
    // First update local state
    setTitle(selectedTitle);
    // Then notify parent component
    onTitleChange(selectedTitle);
    // Close the dropdown
    setIsTitleDropdownOpen(false);
  };

  // Handle generate titles
  const handleGenerateTitles = async (prompt: string): Promise<string[]> => {
    try {
      const titles = await onGenerateTitles(prompt);
      return titles;
    } catch (error) {
      console.error('Error generating titles:', error);
      return [];
    }
  };

  return (
    <div className="mb-6">
      <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
        Title
      </label>
      <div className="relative">
        <div className="relative w-full">
          <input
            type="text"
            id="title"
            name="title"
            ref={titleInputRef}
            value={title}
            onChange={handleTitleChange}
            onClick={() => setIsTitleDropdownOpen(true)}
            onFocus={() => setIsTitleDropdownOpen(true)}
            className="block w-full rounded-md py-2 pl-3 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            placeholder="Enter article title"
            /* No autofocus here */
          />
          <button
            type="button"
            ref={titleButtonRef}
            onClick={() => setIsTitleDropdownOpen(!isTitleDropdownOpen)}
            className="absolute inset-y-0 right-0 flex items-center pr-2"
          >
            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"/>
            </svg>
          </button>

          <div 
            ref={titleDropdownRef}
            className={`${isTitleDropdownOpen ? '' : 'hidden'} absolute z-50 top-full mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm`}
          >
            {/* Debug info */}
            <div className="text-xs text-gray-500 p-2 border-b border-gray-200">
              Available titles: {suggestedTitlesState.length}
            </div>
            {/* Current title if not in suggested titles */}
            {title && !suggestedTitlesState.includes(title) && (
              <div
                className="text-gray-900 cursor-pointer select-none relative py-2 pl-3 pr-9 bg-indigo-50 font-medium"
                onClick={() => setIsTitleDropdownOpen(false)}
              >
                {title}
              </div>
            )}
            
            {/* Suggested titles - show ALL without filtering */}
            {suggestedTitlesState.length > 0 ? (
              suggestedTitlesState.map((suggestedTitle: string, index: number) => (
                <div
                  key={index}
                  className={`cursor-pointer select-none relative py-2 pl-3 pr-9 ${title === suggestedTitle ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-gray-900 hover:bg-gray-100'}`}
                  onClick={() => handleTitleSelect(suggestedTitle)}
                >
                  {suggestedTitle}
                  {title === suggestedTitle && (
                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-indigo-600">
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                          fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"/>
                      </svg>
                    </span>
                  )}
                </div>
              ))
            ) : (
              <div className="text-gray-500 cursor-default select-none relative py-2 pl-3 pr-9">
                No suggested titles available
              </div>
            )}

            {/* Generate option */}
            <div
              className="cursor-pointer select-none relative py-2 pl-3 pr-9 text-blue-600 hover:bg-gray-100 border-t border-gray-200"
              onClick={() => {
                setIsTitleDialogOpen(true);
                setIsTitleDropdownOpen(false);
              }}
            >
              <div className="flex items-center">
                <SparklesIcon className="h-4 w-4 mr-2"/>
                <span>✨ Generate New Titles...</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Title generation dialog */}
      {isTitleDialogOpen && (
        <TitleGenerationDialog
          isOpen={isTitleDialogOpen}
          onClose={() => {
            setIsTitleDialogOpen(false);
          }}
          onSelectTitle={(selectedTitle) => {
            onTitleChange(selectedTitle);
            // Add to suggested titles if not already there
            if (!suggestedTitlesState.includes(selectedTitle)) {
              onAddSuggestedTitle(selectedTitle);
            }
            setIsTitleDialogOpen(false);
          }}
          onGenerateTitles={handleGenerateTitles}
        />
      )}
    </div>
  );
}
