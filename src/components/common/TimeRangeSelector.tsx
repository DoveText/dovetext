'use client';

import { useEffect, useState } from 'react';
import { 
  TimeRange, 
  DAYS_OF_WEEK, 
  TIME_OPTIONS,
  ALL_DAYS,
  ALL_DAY_START,
  ALL_DAY_END,
  isAllDay,
  isAllDays,
  getEffectiveDays,
  getEffectiveTime,
} from '@/types/time-range';
import Select from '@/components/common/Select';
import { ClockIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import { Switch } from '@headlessui/react';

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
  const [isAllDayEnabled, setIsAllDayEnabled] = useState(isAllDay(value.startTime, value.endTime));
  const [isAllDaysEnabled, setIsAllDaysEnabled] = useState(isAllDays(value.daysOfWeek));

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
    const newDays = selectedDays ? selectedDays.split(',').map(Number).sort((a, b) => a - b) : ALL_DAYS;
    onChange({
      ...value,
      daysOfWeek: newDays,
    });
  };

  const handleTimezoneChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...value,
      timezone: event.target.value,
    });
  };

  const toggleAllDay = (enabled: boolean) => {
    setIsAllDayEnabled(enabled);
    onChange({
      ...value,
      startTime: enabled ? ALL_DAY_START : '09:00',
      endTime: enabled ? ALL_DAY_END : '17:00',
    });
  };

  const toggleAllDays = (enabled: boolean) => {
    setIsAllDaysEnabled(enabled);
    onChange({
      ...value,
      daysOfWeek: enabled ? ALL_DAYS : [1, 2, 3, 4, 5], // Mon-Fri by default
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
      <div className="flex items-center justify-between">
        <Switch.Group as="div" className="flex items-center">
          <Switch
            checked={isAllDayEnabled}
            onChange={toggleAllDay}
            className={`${
              isAllDayEnabled ? 'bg-indigo-600' : 'bg-gray-200'
            } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2`}
          >
            <span
              className={`${
                isAllDayEnabled ? 'translate-x-5' : 'translate-x-0'
              } pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
            />
          </Switch>
          <Switch.Label as="span" className="ml-3 text-sm">
            <span className="font-medium text-gray-900">All Day</span>
          </Switch.Label>
        </Switch.Group>

        <Switch.Group as="div" className="flex items-center">
          <Switch
            checked={isAllDaysEnabled}
            onChange={toggleAllDays}
            className={`${
              isAllDaysEnabled ? 'bg-indigo-600' : 'bg-gray-200'
            } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2`}
          >
            <span
              className={`${
                isAllDaysEnabled ? 'translate-x-5' : 'translate-x-0'
              } pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
            />
          </Switch>
          <Switch.Label as="span" className="ml-3 text-sm">
            <span className="font-medium text-gray-900">Every Day</span>
          </Switch.Label>
        </Switch.Group>
      </div>

      {!isAllDayEnabled && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Time</label>
            <div className="mt-1 relative">
              <Select<string>
                value={getEffectiveTime(value.startTime, true)}
                onChange={handleTimeChange('startTime')}
                options={TIME_OPTIONS.filter(time => 
                  !value.endTime || isValidTimeRange(time.value, getEffectiveTime(value.endTime, false))
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
                value={getEffectiveTime(value.endTime, false)}
                onChange={handleTimeChange('endTime')}
                options={TIME_OPTIONS.filter(time => 
                  !value.startTime || isValidTimeRange(getEffectiveTime(value.startTime, true), time.value)
                )}
                placeholder="Select end time"
                className="w-full"
              />
              <ClockIcon className="absolute right-8 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      )}

      {!isAllDaysEnabled && (
        <div>
          <label className="block text-sm font-medium text-gray-700">Days of Week</label>
          <div className="mt-1">
            <Select<string>
              value={getEffectiveDays(value.daysOfWeek).join(',')}
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
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">Timezone</label>
        <div className="mt-1 relative">
          <input
            type="text"
            value={value.timezone}
            onChange={handleTimezoneChange}
            className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
          />
          <GlobeAltIcon className="absolute right-3 top-2 h-5 w-5 text-gray-400" />
        </div>
      </div>
    </div>
  );
}
