import { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { ChevronUpDownIcon } from '@heroicons/react/24/outline';

export interface SelectOption<T> {
  value: T;
  label: string;
}

interface SelectProps<T> {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  label?: string;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export default function Select<T extends string>({ 
  value, 
  onChange, 
  options, 
  label,
  disabled = false,
  className = '',
  placeholder = 'Select an option'
}: SelectProps<T>) {
  const selectedOption = options.find(option => option.value === value);

  if (disabled) {
    return (
      <div className={className}>
        {label && (
          <label className="block text-sm font-medium leading-6 text-gray-900 mb-2">
            {label}
          </label>
        )}
        <input
          type="text"
          value={selectedOption?.label || value || placeholder}
          disabled
          className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-500 bg-gray-50 shadow-sm ring-1 ring-inset ring-gray-300 sm:text-sm sm:leading-6"
        />
      </div>
    );
  }

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium leading-6 text-gray-900 mb-2">
          {label}
        </label>
      )}
      <Listbox value={value} onChange={onChange}>
        <div className="relative">
          <Listbox.Button className="relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6">
            <span className={`block truncate ${!selectedOption ? 'text-gray-400' : 'text-gray-900'}`}>
              {selectedOption?.label || placeholder}
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </span>
          </Listbox.Button>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {options.map((option) => (
                <Listbox.Option
                  key={option.value}
                  className={({ active }) =>
                    `relative cursor-default select-none py-2 pl-3 pr-9 ${
                      active ? 'bg-indigo-600 text-white' : 'text-gray-900'
                    }`
                  }
                  value={option.value}
                >
                  {({ selected, active }) => (
                    <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                      {option.label}
                    </span>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  );
}
