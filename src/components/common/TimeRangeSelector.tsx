'use client';

import { useEffect, useState } from 'react';
import { 
  TimeRange, 
  DAYS_OF_WEEK,
  ALL_DAYS,
} from '@/types/time-range';
import { TrashIcon } from '@heroicons/react/24/outline';

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (value: TimeRange) => void;
  name?: string;
  onNameChange?: (name: string) => void;
  onDelete?: () => void;
  className?: string;
}

export default function TimeRangeSelector({
  value,
  onChange,
  name,
  onNameChange,
  onDelete,
  className = '',
}: TimeRangeSelectorProps) {
  const [isEveryDay, setIsEveryDay] = useState(value?.daysOfWeek?.length === 0);
  const [isAllDay, setIsAllDay] = useState(value?.startTime === null && value?.endTime === null);
  const [selectedDays, setSelectedDays] = useState(
    value?.daysOfWeek?.length === 0 
      ? ALL_DAYS 
      : value?.daysOfWeek || ALL_DAYS
  );
  const [startTime, setStartTime] = useState(value?.startTime || '09:00');
  const [endTime, setEndTime] = useState(value?.endTime || '17:00');

  // Update parent when values change
  useEffect(() => {
    const newValue: TimeRange = {
      daysOfWeek: isEveryDay ? ALL_DAYS : selectedDays,
      startTime: isAllDay ? null : startTime,
      endTime: isAllDay ? null : endTime,
    };
    
    // Only update if values actually changed
    if (JSON.stringify(newValue) !== JSON.stringify(value)) {
      onChange(newValue);
    }
  }, [isAllDay, isEveryDay, selectedDays, startTime, endTime, onChange, value]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* First Row: Delete, Name, Time Range, Any Time */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="text-gray-400 hover:text-gray-500"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          )}

          <div className="relative rounded-md shadow-sm">
            <input
              type="text"
              value={name}
              onChange={(e) => onNameChange?.(e.target.value)}
              className="block w-40 rounded-md border-0 px-3 py-1.5 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
              placeholder="Time Slot Name"
            />
          </div>

          {/* Always show time inputs, just disable when Any Time is checked */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">From</span>
            <div className="relative rounded-md shadow-sm w-24">
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="block w-full rounded-md border-0 py-1.5 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 px-2"
                disabled={isAllDay}
              />
            </div>
            <span className="text-sm text-gray-700">to</span>
            <div className="relative rounded-md shadow-sm w-24">
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="block w-full rounded-md border-0 py-1.5 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 px-2"
                disabled={isAllDay}
              />
            </div>
          </div>
        </div>

        {/* Any Time checkbox at the end of first line */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={isAllDay}
            onChange={(e) => {
              setIsAllDay(e.target.checked);
            }}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            id="any-time"
          />
          <label htmlFor="any-time" className="text-sm text-gray-700 whitespace-nowrap">Any Time</label>
        </div>
      </div>

      {/* Second Row: Days Selection with All Days at the end */}
      <div className="flex items-center justify-between pl-[37px]">
        <div className="flex items-center space-x-4">
          {DAYS_OF_WEEK.map((day) => (
            <label key={day.value} className="flex items-center space-x-1">
              <input
                type="checkbox"
                checked={selectedDays.includes(day.value)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedDays([...selectedDays, day.value]);
                  } else {
                    setSelectedDays(selectedDays.filter(d => d !== day.value));
                  }
                }}
                disabled={isEveryDay}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">{day.label.slice(0, 3)}</span>
            </label>
          ))}
        </div>

        {/* All Days checkbox at the end of second line */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={isEveryDay}
            onChange={(e) => {
              setIsEveryDay(e.target.checked);
              // Whether checking or unchecking, always set all days to checked
              setSelectedDays([0,1,2,3,4,5,6]);
            }}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            id="all-days"
          />
          <label htmlFor="all-days" className="text-sm text-gray-700 whitespace-nowrap">All Days</label>
        </div>
      </div>
    </div>
  );
}
