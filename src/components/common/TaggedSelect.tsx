import { Fragment, useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { ChevronUpDownIcon, XMarkIcon } from '@heroicons/react/24/outline';

export interface TaggedSelectOption<T> {
  value: T;
  label: string;
}

interface TaggedSelectProps<T> {
  value: T | T[];
  onChange: (value: T | T[]) => void;
  options: TaggedSelectOption<T>[];
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  error?: string;
  id?: string;
  multiple?: boolean;
  editable?: boolean;
  onCreateOption?: (label: string) => void;
}

export default function TaggedSelect<T extends string>({
  value,
  onChange,
  options,
  disabled = false,
  className = '',
  placeholder = 'Select an option',
  error,
  id,
  multiple = false,
  editable = false,
  onCreateOption
}: TaggedSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle outside clicks to close the dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Convert value to array for consistent handling
  const selectedValues = multiple ? (value as T[]) : value ? [value as T] : [];
  
  // Get selected options with labels
  const selectedOptions = selectedValues.map(val => {
    // Find the option that matches the value
    const matchingOption = options.find(option => option.value === val);
    // If found, return the option with its label, otherwise use the value as the label
    return matchingOption || { value: val, label: val as string };
  });

  // Filter options based on input value and already selected options
  const filteredOptions = options.filter(option => {
    const isSelected = selectedValues.includes(option.value);
    const matchesInput = option.label.toLowerCase().includes(inputValue.toLowerCase());
    return (!multiple || !isSelected) && (!inputValue || matchesInput);
  });

  const handleSelect = (optionValue: T) => {
    if (multiple) {
      const newValue = [...selectedValues, optionValue] as T[];
      onChange(newValue);
    } else {
      onChange(optionValue);
      setIsOpen(false);
    }
    setInputValue('');
  };

  const handleRemoveTag = (optionValue: T) => {
    if (multiple) {
      const newValue = selectedValues.filter(val => val !== optionValue) as T[];
      onChange(newValue);
    } else {
      // For single select, allow clearing the selection
      onChange('' as T);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue && editable) {
      e.preventDefault();
      
      // Check if the input matches any existing option
      const matchingOption = options.find(
        option => option.label.toLowerCase() === inputValue.toLowerCase()
      );
      
      if (matchingOption) {
        handleSelect(matchingOption.value);
      } else if (onCreateOption) {
        // Create a new option using the provided handler
        onCreateOption(inputValue);
        setInputValue('');
      } else {
        // If no onCreateOption handler is provided, create the tag directly
        // This allows Enter key to work for creating tags without requiring an external handler
        handleSelect(inputValue as T);
      }
    } else if (e.key === 'Backspace' && !inputValue && selectedValues.length > 0) {
      // Remove the last tag when backspace is pressed and input is empty
      handleRemoveTag(selectedValues[selectedValues.length - 1]);
    }
  };

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen && inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  return (
    <div className="relative" ref={inputRef}>
      <div
        onClick={toggleDropdown}
        className={`flex flex-wrap items-center min-h-[38px] w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ${
          error ? 'ring-red-500' : 'ring-gray-300'
        } focus-within:ring-2 focus-within:ring-indigo-600 sm:text-sm sm:leading-6 ${
          disabled ? 'bg-gray-50' : ''
        } ${className}`}
      >
        {selectedOptions.map((option) => (
          <div
            key={option.value}
            className="flex items-center bg-blue-100 text-blue-800 rounded-full px-2 py-0.5 m-0.5 text-sm"
          >
            <span className="mr-1">{option.label}</span>
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveTag(option.value);
                }}
                className="text-blue-500 hover:text-blue-700 focus:outline-none"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}

        {(editable || selectedOptions.length === 0) && (
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(true);
            }}
            placeholder={selectedOptions.length === 0 ? placeholder : ''}
            className="flex-grow border-none focus:ring-0 focus:outline-none text-sm py-0.5 px-1 min-w-[50px]"
            disabled={disabled}
          />
        )}

        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
          <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </span>
      </div>

      <Transition
        show={isOpen}
        as={Fragment}
        leave="transition ease-in duration-100"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => {
              // Check if this option is currently selected (for single-select mode)
              const isSelected = !multiple && selectedValues.includes(option.value);
              return (
                <div
                  key={option.value}
                  className={`relative cursor-default select-none py-2 pl-3 pr-9 hover:bg-indigo-600 hover:text-white ${
                    isSelected ? 'bg-indigo-100 font-medium' : ''
                  }`}
                  onClick={() => handleSelect(option.value)}
                >
                  <span className="block truncate">{option.label}</span>
                  {isSelected && (
                    <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-indigo-600">
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                      </svg>
                    </span>
                  )}
                </div>
              );
            })
          ) : (
            <div className="relative cursor-default select-none py-2 pl-3 pr-9 text-gray-500">
              {editable && inputValue ? 'Press Enter to create new tag' : 'No options available'}
            </div>
          )}
        </div>
      </Transition>
    </div>
  );
}
