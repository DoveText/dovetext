'use client';

import { useEffect, useState } from 'react';
import { TimeRange, DAYS_OF_WEEK, TIME_OPTIONS } from '@/types/time-range';
import Select from '@/components/common/Select';
import { ClockIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (value: TimeRange) => void;
  className?: string;
}

export default function TimeRangeSelector({
  value,
  onChange,
  className = '',
}: TimeRangeSelectorProps) {
  const [localTimezone, setLocalTimezone] = useState('');

  useEffect(() => {
    setLocalTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  const handleTimeChange = (field: keyof Pick<TimeRange, 'startTime' | 'endTime'>) => (newTime: string) => {
    onChange({
      ...value,
      [field]: newTime,
    });
  };

  const handleDaysChange = (selectedDays: string) => {
    onChange({
      ...value,
      daysOfWeek: selectedDays.split(',').map(Number).sort((a, b) => a - b),
    });
  };

  const handleTimezoneChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...value,
      timezone: event.target.value,
    });
  };

  const isValidTimeRange = (start: string, end: string): boolean => {
    const [startHour, startMinute] = start.split(':').map(Number);
    const [endHour, endMinute] = end.split(':').map(Number);
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    return endMinutes > startMinutes;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Start Time</label>
          <div className="mt-1 relative">
            <Select<string>
              value={value.startTime}
              onChange={handleTimeChange('startTime')}
              options={TIME_OPTIONS.filter(time => 
                !value.endTime || isValidTimeRange(time.value, value.endTime)
              )}
              placeholder="Select start time"
              className="w-full"
            />
            <ClockIcon className="absolute right-8 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">End Time</label>
          <div className="mt-1 relative">
            <Select<string>
              value={value.endTime}
              onChange={handleTimeChange('endTime')}
              options={TIME_OPTIONS.filter(time => 
                !value.startTime || isValidTimeRange(value.startTime, time.value)
              )}
              placeholder="Select end time"
              className="w-full"
            />
            <ClockIcon className="absolute right-8 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Days of Week</label>
        <div className="mt-1">
          <Select<string>
            value={value.daysOfWeek.join(',')}
            onChange={handleDaysChange}
            options={DAYS_OF_WEEK.map(day => ({
              value: day.value.toString(),
              label: day.label,
            }))}
            placeholder="Select days"
            multiple
            className="w-full"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Timezone
          <span className="ml-1 text-sm text-gray-500">
            (leave empty for {localTimezone})
          </span>
        </label>
        <div className="mt-1 relative">
          <input
            type="text"
            value={value.timezone}
            onChange={handleTimezoneChange}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder={localTimezone}
            list="timezones"
          />
          <GlobeAltIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
          <datalist id="timezones">
            {Intl.supportedValuesOf('timeZone').map((zone) => (
              <option key={zone} value={zone} />
            ))}
          </datalist>
        </div>
      </div>
    </div>
  );
}
