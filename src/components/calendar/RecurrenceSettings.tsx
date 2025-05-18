'use client';

import { useState, useEffect } from 'react';
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

  // Update the parent component when recurrence settings change
  useEffect(() => {
    if (!value) {
      return;
    }

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

    onChange(rule);
  }, [recurrenceType, interval, weekdays, monthlyType, endType, occurrences, endDate, initialDate, onChange, value]);

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
            onChange={(e) => setRecurrenceType(e.target.value as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY')}
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
        <FormField label="Every" htmlFor="recurrence-interval" className="w-24">
          <FormInput
            id="recurrence-interval"
            type="number"
            min="1"
            max="99"
            value={interval.toString()}
            onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
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
              id="monthly-day-of-month"
              name="monthly-type"
              checked={monthlyType === 'dayOfMonth'}
              onChange={() => setMonthlyType('dayOfMonth')}
            />
            <label htmlFor="monthly-day-of-month">
              On day {initialDate.getDate()} of the month
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="monthly-day-of-week"
              name="monthly-type"
              checked={monthlyType === 'dayOfWeek'}
              onChange={() => setMonthlyType('dayOfWeek')}
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
              id="end-never"
              name="end-type"
              checked={endType === 'never'}
              onChange={() => setEndType('never')}
            />
            <label htmlFor="end-never">Never</label>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="end-count"
              name="end-type"
              checked={endType === 'count'}
              onChange={() => setEndType('count')}
            />
            <label htmlFor="end-count">After</label>
            <input
              type="number"
              className={`w-16 px-2 py-1 border rounded-md ${endType === 'count' ? '' : 'opacity-50'}`}
              min="1"
              max="999"
              value={occurrences}
              onChange={(e) => setOccurrences(parseInt(e.target.value) || 1)}
              disabled={endType !== 'count'}
            />
            <span>occurrences</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="end-until"
              name="end-type"
              checked={endType === 'until'}
              onChange={() => setEndType('until')}
            />
            <label htmlFor="end-until">On</label>
            <input
              type="date"
              className={`px-2 py-1 border rounded-md ${endType === 'until' ? '' : 'opacity-50'}`}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={endType !== 'until'}
              min={formatDateForInput(new Date())}
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
