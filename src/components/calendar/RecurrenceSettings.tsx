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
  // Initialize all state from the value prop
  const [recurrenceType, setRecurrenceType] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'>(
    value?.type || 'DAILY'
  );
  const [interval, setInterval] = useState<number>(value?.interval || 1);
  
  // Weekly specific state
  const [weekdays, setWeekdays] = useState<number[]>(() => {
    if (value?.pattern?.daysOfWeek && value.pattern.daysOfWeek.length > 0) {
      return value.pattern.daysOfWeek;
    }
    // Convert JS day (0=Sunday) to ISO day (1=Monday, 7=Sunday)
    const isoDay = initialDate.getDay() === 0 ? 7 : initialDate.getDay();
    return [isoDay];
  });
  
  // Monthly specific state
  const [monthlyType, setMonthlyType] = useState<'dayOfMonth' | 'dayOfWeek' | 'beforeMonth'>(() => {
    if (value?.pattern?.weekOfMonth) return 'dayOfWeek';
    if (value?.pattern?.dayOfMonth && value.pattern.dayOfMonth < 0) return 'beforeMonth';
    return 'dayOfMonth';
  });
  
  const [monthlyDayOfMonth, setMonthlyDayOfMonth] = useState<number>(
    (value?.pattern?.dayOfMonth && value.pattern.dayOfMonth > 0) 
      ? value.pattern.dayOfMonth 
      : initialDate.getDate()
  );
  
  const [monthlyDayOfWeek, setMonthlyDayOfWeek] = useState<number>(
    value?.pattern?.dayOfWeek || jsToIsoDay(initialDate.getDay())
  );
  
  const [monthlyWeekOfMonth, setMonthlyWeekOfMonth] = useState<number>(
    value?.pattern?.weekOfMonth || Math.floor((initialDate.getDate() - 1) / 7) + 1
  );
  
  const [monthlyDaysBeforeMonth, setMonthlyDaysBeforeMonth] = useState<number>(
    (value?.pattern?.dayOfMonth && value.pattern.dayOfMonth < 0) 
      ? -value.pattern.dayOfMonth 
      : 1
  );
  
  // Yearly specific state
  const [yearlyType, setYearlyType] = useState<'specificDate' | 'positionBased'>(
    value?.pattern?.weekOfMonth ? 'positionBased' : 'specificDate'
  );
  
  const [yearlyMonth, setYearlyMonth] = useState<number>(
    value?.pattern?.month !== undefined 
      ? value.pattern.month 
      : initialDate.getMonth() + 1 // Convert JS month (0-11) to calendar month (1-12)
  );
  
  const [yearlyDay, setYearlyDay] = useState<number>(
    value?.pattern?.day || initialDate.getDate()
  );
  
  const [yearlyDayOfWeek, setYearlyDayOfWeek] = useState<number>(
    value?.pattern?.dayOfWeek || jsToIsoDay(initialDate.getDay())
  );
  
  const [yearlyWeekOfMonth, setYearlyWeekOfMonth] = useState<number>(
    value?.pattern?.weekOfMonth || Math.floor((initialDate.getDate() - 1) / 7) + 1
  );
  
  // End condition state
  const [endType, setEndType] = useState<'never' | 'count' | 'until'>(
    value?.until ? 'until' : value?.count ? 'count' : 'never'
  );
  
  const [occurrences, setOccurrences] = useState<number>(value?.count || 10);
  
  const [endDate, setEndDate] = useState<string>(
    value?.until 
      ? formatDateForInput(value.until) 
      : formatDateForInput(new Date(initialDate.getTime() + 90 * 24 * 60 * 60 * 1000)) // 90 days later by default
  );

  // Create a function to generate the recurrence rule based on current settings
  const generateRecurrenceRule = (): RecurrenceRule => {
    // Create a rule based on current state
    const rule: RecurrenceRule = {
      type: recurrenceType,
      interval: interval,
      pattern: {}
    };

    // Add pattern based on recurrence type
    if (recurrenceType === 'WEEKLY') {
      // Ensure weekdays is sorted for consistency and not empty
      if (weekdays.length === 0) {
        rule.pattern!.daysOfWeek = [jsToIsoDay(initialDate.getDay())];
      } else {
        rule.pattern!.daysOfWeek = [...weekdays].sort((a, b) => a - b);
      }
    } else if (recurrenceType === 'MONTHLY') {
      if (monthlyType === 'dayOfMonth') {
        // Use the selected day of month option
        rule.pattern!.dayOfMonth = monthlyDayOfMonth;
      } else if (monthlyType === 'dayOfWeek') {
        // For "nth day of the week" pattern
        rule.pattern!.dayOfWeek = monthlyDayOfWeek;
        rule.pattern!.weekOfMonth = monthlyWeekOfMonth;
      } else if (monthlyType === 'beforeMonth') {
        // For "X days before the month starts" pattern
        rule.pattern!.dayOfMonth = -monthlyDaysBeforeMonth;
      }
    } else if (recurrenceType === 'YEARLY') {
      if (yearlyType === 'specificDate') {
        // For specific date in a year (e.g., January 1st)
        rule.pattern!.month = yearlyMonth;
        rule.pattern!.day = yearlyDay;
      } else if (yearlyType === 'positionBased') {
        // For position-based pattern (e.g., fourth Thursday in November)
        rule.pattern!.month = yearlyMonth;
        rule.pattern!.dayOfWeek = yearlyDayOfWeek;
        rule.pattern!.weekOfMonth = yearlyWeekOfMonth;
      }
    }

    // Add end condition
    if (endType === 'count') {
      rule.count = occurrences || 10; // Default to 10 if not set
      rule.until = undefined;
    } else if (endType === 'until') {
      try {
        rule.until = parseDate(endDate);
      } catch (e) {
        // If date parsing fails, set a default date 90 days in the future
        rule.until = new Date(initialDate.getTime() + 90 * 24 * 60 * 60 * 1000);
      }
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
    const newType = value as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
    setRecurrenceType(newType);
    
    // Reset weekdays when changing to weekly
    if (newType === 'WEEKLY') {
      setWeekdays([jsToIsoDay(initialDate.getDay())]);
    }
    
    // Update parent immediately
    onChange(generateRecurrenceRule());
  };

  const handleIntervalChange = (value: number) => {
    setInterval(value);
    // Update parent immediately
    onChange(generateRecurrenceRule());
  };

  const handleWeekdayChange = (day: number, checked: boolean) => {
    let newWeekdays;
    if (checked && !weekdays.includes(day)) {
      // Add the day
      newWeekdays = [...weekdays, day];
    } else if (!checked && weekdays.includes(day)) {
      // Remove the day, but ensure at least one day remains selected
      if (weekdays.length > 1) {
        newWeekdays = weekdays.filter(d => d !== day);
      } else {
        // Can't remove the last day
        return;
      }
    } else {
      // No change needed
      return;
    }
    
    // Update state
    setWeekdays(newWeekdays);
    
    // Update parent immediately
    onChange(generateRecurrenceRule());
  };

  const handleMonthlyTypeChange = (value: string) => {
    setMonthlyType(value as 'dayOfMonth' | 'dayOfWeek' | 'beforeMonth');
    // Update parent immediately
    onChange(generateRecurrenceRule());
  };
  
  const handleMonthlyDayOfMonthChange = (value: number) => {
    setMonthlyDayOfMonth(value);
    onChange(generateRecurrenceRule());
  };
  
  const handleMonthlyDayOfWeekChange = (value: number) => {
    setMonthlyDayOfWeek(value);
    onChange(generateRecurrenceRule());
  };
  
  const handleMonthlyWeekOfMonthChange = (value: number) => {
    setMonthlyWeekOfMonth(value);
    onChange(generateRecurrenceRule());
  };
  
  const handleMonthlyDaysBeforeMonthChange = (value: number) => {
    setMonthlyDaysBeforeMonth(value);
    onChange(generateRecurrenceRule());
  };
  
  const handleYearlyTypeChange = (value: string) => {
    setYearlyType(value as 'specificDate' | 'positionBased');
    onChange(generateRecurrenceRule());
  };
  
  const handleYearlyMonthChange = (value: number) => {
    setYearlyMonth(value);
    onChange(generateRecurrenceRule());
  };
  
  const handleYearlyDayChange = (value: number) => {
    setYearlyDay(value);
    onChange(generateRecurrenceRule());
  };
  
  const handleYearlyDayOfWeekChange = (value: number) => {
    setYearlyDayOfWeek(value);
    onChange(generateRecurrenceRule());
  };
  
  const handleYearlyWeekOfMonthChange = (value: number) => {
    setYearlyWeekOfMonth(value);
    onChange(generateRecurrenceRule());
  };

  const handleEndTypeChange = (value: string) => {
    const newEndType = value as 'never' | 'count' | 'until';
    
    // Always set the end type immediately
    setEndType(newEndType);
    
    // Set default values when changing end type
    if (newEndType === 'count') {
      // Always ensure occurrences has a valid value
      if (!occurrences || occurrences < 1) {
        setOccurrences(10);
      }
    } else if (newEndType === 'until') {
      // Always ensure end date has a valid value
      if (!endDate) {
        const defaultEndDate = new Date(initialDate.getTime() + 90 * 24 * 60 * 60 * 1000);
        setEndDate(formatDateForInput(defaultEndDate));
      }
    }
    
    // Update parent after state change
    onChange(generateRecurrenceRule());
  };

  const handleOccurrencesChange = (value: number) => {
    setOccurrences(value);
    // Update parent immediately
    onChange(generateRecurrenceRule());
  };

  const handleEndDateChange = (value: string) => {
    setEndDate(value);
    // Update parent immediately
    onChange(generateRecurrenceRule());
  };

  // Initial update on mount
  useEffect(() => {
    // Only call once on initial mount
    onChange(generateRecurrenceRule());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helper functions for formatting dates and getting day/month names
  function formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  function parseDate(dateString: string): Date {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  
  // Convert JS day (0=Sunday) to ISO day (1=Monday, 7=Sunday)
  function jsToIsoDay(jsDay: number): number {
    return jsDay === 0 ? 7 : jsDay;
  }
  
  // Convert ISO day (1=Monday, 7=Sunday) to JS day (0=Sunday, 6=Saturday)
  function isoToJsDay(isoDay: number): number {
    return isoDay === 7 ? 0 : isoDay;
  }
  
  function getDayName(day: number): string {
    // Ensure we're using JS day format (0-6)
    const jsDay = day > 7 ? day % 7 : (day === 7 ? 0 : day);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[jsDay];
  }
  
  function getIsoDayName(isoDay: number): string {
    const isoDays = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return isoDays[isoDay];
  }
  
  function getMonthName(month: number): string {
    // Adjust for 0-based (JS) or 1-based (calendar) month
    const adjustedMonth = month > 11 ? (month - 1) % 12 : month;
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return months[adjustedMonth];
  }
  
  function getOrdinal(n: number): string {
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
  }
  
  // Generate options for select elements
  function generateDayOptionsArray() {
    const options = [];
    for (let i = 1; i <= 31; i++) {
      options.push({
        value: i.toString(),
        label: i.toString()
      });
    }
    return options;
  }
  
  function generateMonthOptionsArray() {
    const options = [];
    for (let i = 1; i <= 12; i++) {
      options.push({
        value: i.toString(),
        label: getMonthName(i-1)
      });
    }
    return options;
  }
  
  function generateWeekOptionsArray() {
    return [
      { value: '1', label: 'First' },
      { value: '2', label: 'Second' },
      { value: '3', label: 'Third' },
      { value: '4', label: 'Fourth' },
      { value: '5', label: 'Fifth' },
      { value: '-1', label: 'Last' },
      { value: '-2', label: 'Second to last' },
      { value: '-3', label: 'Third to last' }
    ];
  }
  
  function generateDayOfWeekOptionsArray() {
    return [
      { value: '1', label: 'Monday' },
      { value: '2', label: 'Tuesday' },
      { value: '3', label: 'Wednesday' },
      { value: '4', label: 'Thursday' },
      { value: '5', label: 'Friday' },
      { value: '6', label: 'Saturday' },
      { value: '7', label: 'Sunday' }
    ];
  }

  // Convert JS day indices (0-6, Sunday-Saturday) to ISO day names (1-7, Monday-Sunday)
  function getWeekdayButtonLabel(index: number): string {
    // Map JS day index to ISO day name initial
    const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    return dayLabels[index];
  }
  
  // Convert JS day index (0-6) to ISO day (1-7)
  function jsIndexToIsoDay(index: number): number {
    return index === 0 ? 7 : index;
  }
  
  // Convert ISO day (1-7) to JS day index (0-6)
  function isoDayToJsIndex(isoDay: number): number {
    return isoDay === 7 ? 0 : isoDay;
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
            {[0, 1, 2, 3, 4, 5, 6].map((jsIndex) => {
              const isoDay = jsIndexToIsoDay(jsIndex);
              return (
                <button
                  key={jsIndex}
                  type="button"
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    weekdays.includes(isoDay) 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 text-gray-700'
                  }`}
                  onClick={() => {
                    if (weekdays.includes(isoDay)) {
                      // Don't allow removing the last day
                      if (weekdays.length > 1) {
                        handleWeekdayChange(isoDay, false);
                      }
                    } else {
                      handleWeekdayChange(isoDay, true);
                    }
                  }}
                >
                  {getWeekdayButtonLabel(jsIndex)}
                </button>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Monthly Pattern */}
      {recurrenceType === 'MONTHLY' && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="monthly-day-of-month"
              name="monthlyType"
              value="dayOfMonth"
              checked={monthlyType === 'dayOfMonth'}
              onChange={() => handleMonthlyTypeChange('dayOfMonth')}
              className="mr-2"
            />
            <label htmlFor="monthly-day-of-month" className="flex items-center">
              <span>On day</span>
              <Select
                value={monthlyDayOfMonth.toString()}
                onChange={(value) => handleMonthlyDayOfMonthChange(parseInt(value))}
                className="mx-2 w-16"
                disabled={monthlyType !== 'dayOfMonth'}
                options={generateDayOptionsArray()}
              />
              <span>of the month</span>
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="monthly-day-of-week"
              name="monthlyType"
              value="dayOfWeek"
              checked={monthlyType === 'dayOfWeek'}
              onChange={() => handleMonthlyTypeChange('dayOfWeek')}
              className="mr-2"
            />
            <label htmlFor="monthly-day-of-week" className="flex items-center flex-wrap">
              <span>On the</span>
              <Select
                value={monthlyWeekOfMonth.toString()}
                onChange={(value) => handleMonthlyWeekOfMonthChange(parseInt(value))}
                className="mx-2 w-32"
                disabled={monthlyType !== 'dayOfWeek'}
                options={generateWeekOptionsArray()}
              />
              <Select
                value={monthlyDayOfWeek.toString()}
                onChange={(value) => handleMonthlyDayOfWeekChange(parseInt(value))}
                className="mx-2 w-32"
                disabled={monthlyType !== 'dayOfWeek'}
                options={generateDayOfWeekOptionsArray()}
              />
              <span>of the month</span>
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="monthly-before-month"
              name="monthlyType"
              value="beforeMonth"
              checked={monthlyType === 'beforeMonth'}
              onChange={() => handleMonthlyTypeChange('beforeMonth')}
              className="mr-2"
            />
            <label htmlFor="monthly-before-month" className="flex items-center">
              <Select
                value={monthlyDaysBeforeMonth.toString()}
                onChange={(value) => handleMonthlyDaysBeforeMonthChange(parseInt(value))}
                className="mx-2 w-16"
                disabled={monthlyType !== 'beforeMonth'}
                options={[1, 2, 3, 4, 5, 7, 10, 14, 21, 28].map(day => ({
                  value: day.toString(),
                  label: day.toString()
                }))}
              />
              <span>{monthlyDaysBeforeMonth === 1 ? 'day' : 'days'} before the month starts</span>
            </label>
          </div>
        </div>
      )}
      
      {/* Yearly Pattern */}
      {recurrenceType === 'YEARLY' && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="yearly-specific-date"
              name="yearlyType"
              value="specificDate"
              checked={yearlyType === 'specificDate'}
              onChange={() => handleYearlyTypeChange('specificDate')}
              className="mr-2"
            />
            <label htmlFor="yearly-specific-date" className="flex items-center">
              <span>Every</span>
              <Select
                value={yearlyMonth.toString()}
                onChange={(value) => handleYearlyMonthChange(parseInt(value))}
                className="mx-2 w-32"
                disabled={yearlyType !== 'specificDate'}
                options={generateMonthOptionsArray()}
              />
              <Select
                value={yearlyDay.toString()}
                onChange={(value) => handleYearlyDayChange(parseInt(value))}
                className="mx-2 w-16"
                disabled={yearlyType !== 'specificDate'}
                options={generateDayOptionsArray()}
              />
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="yearly-position-based"
              name="yearlyType"
              value="positionBased"
              checked={yearlyType === 'positionBased'}
              onChange={() => handleYearlyTypeChange('positionBased')}
              className="mr-2"
            />
            <label htmlFor="yearly-position-based" className="flex items-center flex-wrap">
              <span>On the</span>
              <Select
                value={yearlyWeekOfMonth.toString()}
                onChange={(value) => handleYearlyWeekOfMonthChange(parseInt(value))}
                className="mx-2 w-32"
                disabled={yearlyType !== 'positionBased'}
                options={generateWeekOptionsArray()}
              />
              <Select
                value={yearlyDayOfWeek.toString()}
                onChange={(value) => handleYearlyDayOfWeekChange(parseInt(value))}
                className="mx-2 w-32"
                disabled={yearlyType !== 'positionBased'}
                options={generateDayOfWeekOptionsArray()}
              />
              <span>of</span>
              <Select
                value={yearlyMonth.toString()}
                onChange={(value) => handleYearlyMonthChange(parseInt(value))}
                className="mx-2 w-32"
                disabled={yearlyType !== 'positionBased'}
                options={generateMonthOptionsArray()}
              />
            </label>
          </div>
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
              id="end-count"
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
              disabled={endType !== 'count'}
            />
            <span>occurrences</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="end-until"
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
              disabled={endType !== 'until'}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
