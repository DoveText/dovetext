import { Fragment, useState, useRef, useEffect } from 'react';
import { Combobox, Transition } from '@headlessui/react';
import { ChevronUpDownIcon } from '@heroicons/react/20/solid';

export interface EditableSelectOption {
  value: string;
  label: string;
}

interface EditableSelectProps {
  options: EditableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
}

export default function EditableSelect({
  options,
  value,
  onChange,
  onBlur,
  placeholder = 'Type or select...',
  className = '',
}: EditableSelectProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredOptions =
    query === ''
      ? options
      : options.filter((option) => {
          return option.label.toLowerCase().includes(query.toLowerCase());
        });

  // Find the matching option for the current value
  const selectedOption = options.find(option => option.value === value);

  return (
    <div className={className}>
      <Combobox 
        value={value} 
        onChange={(newValue) => {
          onChange(newValue);
          // Find the selected option to get its label
          const selected = options.find(option => option.value === newValue);
          setQuery(selected ? selected.label : newValue);
          setIsEditing(false);
          setIsOpen(false);
        }}
      >
        <div className="relative">
          <Combobox.Input
            ref={inputRef}
            className="w-full rounded-md border-0 bg-white py-1.5 pl-3 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            onChange={(event) => {
              const newValue = event.target.value;
              setQuery(newValue);
              setIsOpen(true);
            }}
            displayValue={() => isEditing ? query : (selectedOption?.label || value)}
            onFocus={() => {
              setIsEditing(true);
              setQuery(selectedOption?.label || value);
              setIsOpen(true);
            }}
            onBlur={() => {
              setTimeout(() => {
                const finalValue = query || value;
                onChange(finalValue);
                setIsOpen(false);
                setIsEditing(false);
                onBlur?.();
              }, 200);  // Increased timeout to ensure dropdown click is registered
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const currentValue = query || value;
                if (currentValue) {
                  onChange(currentValue);
                  setIsOpen(false);
                  setIsEditing(false);
                  inputRef.current?.blur();
                }
              }
            }}
            placeholder={placeholder}
          />
          <Combobox.Button 
            className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none"
            onClick={() => {
              setIsOpen(!isOpen);
              if (!isOpen) {
                setIsEditing(true);
                setQuery(value);
                inputRef.current?.focus();
              }
            }}
          >
            <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </Combobox.Button>

          <Transition
            as={Fragment}
            show={isOpen}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Combobox.Options static className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {filteredOptions.length === 0 && query !== '' ? (
                <div className="relative cursor-default select-none px-4 py-2 text-gray-700">
                  Press Enter to use &quot;{query}&quot;
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <Combobox.Option
                    key={option.value}
                    value={option.value}
                    className={({ active }) =>
                      `relative cursor-default select-none py-2 pl-3 pr-9 ${
                        active ? 'bg-indigo-600 text-white' : 'text-gray-900'
                      }`
                    }
                  >
                    {({ active, selected }) => (
                      <span className={`block truncate ${selected ? 'font-semibold' : ''}`}>
                        {option.label}
                      </span>
                    )}
                  </Combobox.Option>
                ))
              )}
            </Combobox.Options>
          </Transition>
        </div>
      </Combobox>
    </div>
  );
}
