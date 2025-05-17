'use client';

import { useState, useEffect } from 'react';
import { ChevronUpDownIcon } from '@heroicons/react/24/outline';

interface TimezoneSelectorProps {
  value: string;
  onChange: (timezone: string) => void;
  className?: string;
}

export default function TimezoneSelector({ value, onChange, className = '' }: TimezoneSelectorProps) {
  const [timezones, setTimezones] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [browserTimezone, setBrowserTimezone] = useState('');

  // Get all available timezones
  useEffect(() => {
    // Get browser's timezone
    const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setBrowserTimezone(browserTz);

    // If no value is provided, default to browser timezone
    if (!value) {
      onChange(browserTz);
    }

    // Get all available timezones
    try {
      // This is a simplified list of common timezones
      // In a real app, you might want to use a library like moment-timezone
      const commonTimezones = [
        'Africa/Cairo',
        'Africa/Johannesburg',
        'Africa/Lagos',
        'America/Anchorage',
        'America/Bogota',
        'America/Chicago',
        'America/Denver',
        'America/Los_Angeles',
        'America/Mexico_City',
        'America/New_York',
        'America/Phoenix',
        'America/Sao_Paulo',
        'America/Toronto',
        'Asia/Bangkok',
        'Asia/Dubai',
        'Asia/Hong_Kong',
        'Asia/Jakarta',
        'Asia/Kolkata',
        'Asia/Seoul',
        'Asia/Shanghai',
        'Asia/Singapore',
        'Asia/Tokyo',
        'Australia/Melbourne',
        'Australia/Sydney',
        'Europe/Amsterdam',
        'Europe/Berlin',
        'Europe/London',
        'Europe/Madrid',
        'Europe/Moscow',
        'Europe/Paris',
        'Europe/Rome',
        'Pacific/Auckland',
        'Pacific/Honolulu',
        'UTC'
      ];

      // Make sure browser timezone is included
      if (!commonTimezones.includes(browserTz)) {
        commonTimezones.push(browserTz);
      }

      setTimezones(commonTimezones.sort());
    } catch (error) {
      console.error('Error getting timezones:', error);
      setTimezones(['UTC']);
    }
  }, [onChange, value]);

  // Filter timezones based on search
  const filteredTimezones = timezones.filter(tz => 
    tz.toLowerCase().includes(search.toLowerCase())
  );

  // Format timezone for display
  const formatTimezone = (tz: string) => {
    try {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      });
      const formattedTime = formatter.format(now);
      return `${tz} (${formattedTime})`;
    } catch (e) {
      return tz;
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        className="relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm sm:leading-6"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="block truncate">{value ? formatTimezone(value) : 'Select timezone'}</span>
        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
          <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
          <div className="sticky top-0 z-10 bg-white p-2">
            <input
              type="text"
              className="w-full rounded-md border-0 bg-white py-1.5 pl-3 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              placeholder="Search timezones..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <ul
            className="max-h-56 overflow-auto py-1 text-base focus:outline-none sm:text-sm"
            tabIndex={-1}
            role="listbox"
          >
            {/* Browser timezone at the top */}
            {browserTimezone && (
              <li
                className={`relative cursor-default select-none py-2 pl-3 pr-9 text-gray-900 ${browserTimezone === value ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                onClick={() => {
                  onChange(browserTimezone);
                  setIsOpen(false);
                  setSearch('');
                }}
              >
                <div className="flex items-center">
                  <span className={`block truncate font-medium ${browserTimezone === value ? 'font-semibold' : 'font-normal'}`}>
                    {formatTimezone(browserTimezone)} (Browser)
                  </span>
                </div>
              </li>
            )}

            {/* Divider */}
            <li className="border-t border-gray-200 my-1"></li>

            {filteredTimezones.length > 0 ? (
              filteredTimezones.map((tz) => (
                <li
                  key={tz}
                  className={`relative cursor-default select-none py-2 pl-3 pr-9 text-gray-900 ${tz === value ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                  onClick={() => {
                    onChange(tz);
                    setIsOpen(false);
                    setSearch('');
                  }}
                >
                  <div className="flex items-center">
                    <span className={`block truncate ${tz === value ? 'font-semibold' : 'font-normal'}`}>
                      {formatTimezone(tz)}
                    </span>
                  </div>
                </li>
              ))
            ) : (
              <li className="relative cursor-default select-none py-2 pl-3 pr-9 text-gray-500">
                No timezones found
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
