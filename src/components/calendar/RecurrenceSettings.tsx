'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import FormField from '../common/form/FormField';
import FormInput from '../common/form/FormInput';
import Select from '../common/Select';

export interface RecurrenceRule {
  type: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  interval: number;
  pattern?: {
    daysOfWeek?: number[];
    dayOfMonth?: number;
    dayOfWeek?: number;
    weekOfMonth?: number;
    month?: number;
    day?: number;
  };
  count?: number;
  until?: Date | null;
}

interface RecurrenceSettingsProps {
  initialDate: Date;
  value: RecurrenceRule | null;
  onChange: (rule: RecurrenceRule | null) => void;
}

export default function RecurrenceSettings({ initialDate, value, onChange }: RecurrenceSettingsProps) {
  const [recurrenceType, setRecurrenceType] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'>(
    value?.type || 'DAILY'
  );
  const [interval, setInterval] = useState<number>(value?.interval || 1);
  const [weekdays, setWeekdays] = useState<number[]>(
    value?.pattern?.daysOfWeek || [initialDate.getDay()]
  );
  const [monthlyType, setMonthlyType] = useState<'dayOfMonth' | 'dayOfWeek'>(
    value?.pattern?.weekOfMonth ? 'dayOfWeek' : 'dayOfMonth'
  );
  const [endType, setEndType] = useState<'never' | 'count' | 'until'>(
    value?.until ? 'until' : value?.count ? 'count' : 'never'
  );
  const [occurrences, setOccurrences] = useState<number>(value?.count || 10);
  const [endDate, setEndDate] = useState<string>(
    value?.until ? formatDateForInput(value.until) : formatDateForInput(new Date(initialDate.getTime() + 90 * 24 * 60 * 60 * 1000)) // 90 days later by default
  );

  // Create a function to generate the recurrence rule based on current settings
  const generateRecurrenceRule = () => {
    // Create a rule based on current state
    const rule: RecurrenceRule = {
      type: recurrenceType,
      interval: interval,
      pattern: {}
    };

    // Add pattern based on recurrence type
    if (recurrenceType === 'WEEKLY') {
      rule.pattern!.daysOfWeek = weekdays;
    } else if (recurrenceType === 'MONTHLY') {
      if (monthlyType === 'dayOfMonth') {
        rule.pattern!.dayOfMonth = initialDate.getDate();
      } else {
        // For "nth day of the week" pattern
        const dayOfWeek = initialDate.getDay();
        const weekOfMonth = Math.floor((initialDate.getDate() - 1) / 7) + 1;
        
        rule.pattern!.dayOfWeek = dayOfWeek;
        rule.pattern!.weekOfMonth = weekOfMonth;
      }
    } else if (recurrenceType === 'YEARLY') {
      rule.pattern!.month = initialDate.getMonth();
      rule.pattern!.day = initialDate.getDate();
    }

    // Add end condition
    if (endType === 'count') {
      rule.count = occurrences;
      rule.until = undefined;
    } else if (endType === 'until') {
      rule.until = parseDate(endDate);
      rule.count = undefined;
    } else {
      // For 'never' end type, don't set count or until
      rule.count = undefined;
      rule.until = undefined;
    }

    return rule;
  };
  
  // Create handlers for each form field change
  const handleRecurrenceTypeChange = (value: string) => {
    setRecurrenceType(value as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY');
    // Update parent after state change
    setTimeout(() => {
      onChange(generateRecurrenceRule());
    }, 0);
  };
  
  const handleIntervalChange = (value: number) => {
    setInterval(value);
    // Update parent after state change
    setTimeout(() => {
      onChange(generateRecurrenceRule());
    }, 0);
  };
  
  const handleWeekdayChange = (day: number, checked: boolean) => {
    const newWeekdays = [...weekdays];
    if (checked && !newWeekdays.includes(day)) {
      newWeekdays.push(day);
    } else if (!checked && newWeekdays.includes(day)) {
      const index = newWeekdays.indexOf(day);
      newWeekdays.splice(index, 1);
    }
    setWeekdays(newWeekdays);
    // Update parent after state change
    setTimeout(() => {
      onChange(generateRecurrenceRule());
    }, 0);
  };
  
  const handleMonthlyTypeChange = (value: string) => {
    setMonthlyType(value as 'dayOfMonth' | 'dayOfWeek');
    // Update parent after state change
    setTimeout(() => {
      onChange(generateRecurrenceRule());
    }, 0);
  };
  
  const handleEndTypeChange = (value: string) => {
    setEndType(value as 'never' | 'count' | 'until');
    // Update parent after state change
    setTimeout(() => {
      onChange(generateRecurrenceRule());
    }, 0);
  };
  
  const handleOccurrencesChange = (value: number) => {
    setOccurrences(value);
    // Update parent after state change
    setTimeout(() => {
      onChange(generateRecurrenceRule());
    }, 0);
  };
  
  const handleEndDateChange = (value: string) => {
    setEndDate(value);
    // Update parent after state change
    setTimeout(() => {
      onChange(generateRecurrenceRule());
    }, 0);
  };
  
  // Initial update on mount
  useEffect(() => {
    // Only call once on initial mount
    onChange(generateRecurrenceRule());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helper function to format date for input
  function formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Helper function to parse date from input
  function parseDate(dateString: string): Date {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  return (
    <div className="space-y-4">
      {/* Recurrence Type Selection */}
      <div>
        <FormField label="Repeat" htmlFor="recurrence-type">
          <Select
            id="recurrence-type"
            value={recurrenceType}
            onChange={handleRecurrenceTypeChange}
            options={[
              { value: 'DAILY', label: 'Daily' },
              { value: 'WEEKLY', label: 'Weekly' },
              { value: 'MONTHLY', label: 'Monthly' },
              { value: 'YEARLY', label: 'Yearly' }
            ]}
          />
        </FormField>
      </div>
      
      {/* Interval Selection */}
      <div className="flex items-center space-x-2">
        <FormField label="Every" htmlFor="recurrence-interval">
          <FormInput
            id="recurrence-interval"
            type="number"
            min="1"
            max="99"
            value={interval}
            onChange={(e) => handleIntervalChange(parseInt(e.target.value) || 1)}
            className="w-16 mr-2"
          />
        </FormField>
        
        <span className="mt-7">
          {recurrenceType === 'DAILY' && (interval === 1 ? 'day' : 'days')}
          {recurrenceType === 'WEEKLY' && (interval === 1 ? 'week' : 'weeks')}
          {recurrenceType === 'MONTHLY' && (interval === 1 ? 'month' : 'months')}
          {recurrenceType === 'YEARLY' && (interval === 1 ? 'year' : 'years')}
        </span>
      </div>
      
      {/* Weekly Pattern (days of week) */}
      {recurrenceType === 'WEEKLY' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">On these days</label>
          <div className="flex flex-wrap gap-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
              <button
                key={index}
                type="button"
                className={`w-8 h-8 rounded-full flex items-center justify-center ${weekdays.includes(index) ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
                onClick={() => {
                  if (weekdays.includes(index)) {
                    // Don't allow removing the last day
                    if (weekdays.length > 1) {
                      setWeekdays(weekdays.filter(d => d !== index));
                    }
                  } else {
                    setWeekdays([...weekdays, index]);
                  }
                }}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Monthly Pattern */}
      {recurrenceType === 'MONTHLY' && (
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <input
              type="radio"
              name="monthlyType"
              value="dayOfMonth"
              checked={monthlyType === 'dayOfMonth'}
              onChange={() => handleMonthlyTypeChange('dayOfMonth')}
              className="mr-2"
            />
            <label htmlFor="monthly-day-of-month">
              On day {initialDate.getDate()} of the month
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              name="monthlyType"
              value="dayOfWeek"
              checked={monthlyType === 'dayOfWeek'}
              onChange={() => handleMonthlyTypeChange('dayOfWeek')}
              className="mr-2"
            />
            <label htmlFor="monthly-day-of-week">
              On the {getOrdinal(Math.floor((initialDate.getDate() - 1) / 7) + 1)} {getDayName(initialDate.getDay())} of the month
            </label>
          </div>
        </div>
      )}
      
      {/* Yearly Pattern */}
      {recurrenceType === 'YEARLY' && (
        <div>
          <p className="text-sm text-gray-700">
            This event will repeat on {getMonthName(initialDate.getMonth())} {initialDate.getDate()}
          </p>
        </div>
      )}
      
      {/* End Condition */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Ends</label>
        
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              name="endType"
              value="never"
              checked={endType === 'never'}
              onChange={() => handleEndTypeChange('never')}
              className="mr-2"
            />
            <label htmlFor="end-never">Never</label>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              name="endType"
              value="count"
              checked={endType === 'count'}
              onChange={() => handleEndTypeChange('count')}
              className="mr-2"
            />
            <label htmlFor="end-count">After</label>
            <FormInput
              type="number"
              min="1"
              max="99"
              value={occurrences}
              onChange={(e) => handleOccurrencesChange(parseInt(e.target.value) || 1)}
              className="w-16 mx-2"
            />
            <span>occurrences</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              name="endType"
              value="until"
              checked={endType === 'until'}
              onChange={() => handleEndTypeChange('until')}
              className="mr-2"
            />
            <label htmlFor="end-until">On</label>
            <FormInput
              type="date"
              value={endDate}
              onChange={(e) => handleEndDateChange(e.target.value)}
              className="ml-2"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions for formatting
function getOrdinal(n: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}

function getDayName(day: number): string {
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day];
}

function getMonthName(month: number): string {
  return ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][month];
}
