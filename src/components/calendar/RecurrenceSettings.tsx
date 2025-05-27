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
  const [yearlyType, setYearlyType] = useState<'specificDate' | 'positionBased' | 'beforeMonth'>(
    value?.pattern?.weekOfMonth ? 'positionBased' : 
    (value?.pattern?.dayOfMonth && value.pattern.dayOfMonth < 0) ? 'beforeMonth' : 'specificDate'
  );

  const [yearlyMonth, setYearlyMonth] = useState<number>(
    value?.pattern?.month !== undefined
      ? value.pattern.month
      : initialDate.getMonth() + 1 // Convert JS month (0-11) to calendar month (1-12)
  );
  
  const [yearlyDaysBeforeMonth, setYearlyDaysBeforeMonth] = useState<number>(
    (value?.pattern?.dayOfMonth && value.pattern.dayOfMonth < 0)
      ? -value.pattern.dayOfMonth
      : 1
  );
  
  const [yearlyDay, setYearlyDay] = useState<number>(
    value?.pattern?.dayOfMonth || initialDate.getDate()
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
    const rule: RecurrenceRule = {
      type: recurrenceType,
      interval: interval,
      pattern: {}
    };

    // Set pattern based on recurrence type
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
        // For "X days before the month starts/ends" pattern
        rule.pattern!.dayOfMonth = -monthlyDaysBeforeMonth;
        // Add a custom property to indicate if it's before start or end
      }
    } else if (recurrenceType === 'YEARLY') {
      if (yearlyType === 'specificDate') {
        // For specific date in a year (e.g., January 1st)
        rule.pattern!.month = yearlyMonth;
        rule.pattern!.dayOfMonth = yearlyDay;
      } else if (yearlyType === 'positionBased') {
        // For position-based pattern (e.g., fourth Thursday in November)
        rule.pattern!.dayOfWeek = yearlyDayOfWeek;
        rule.pattern!.weekOfMonth = yearlyWeekOfMonth;
        rule.pattern!.month = yearlyMonth;
      } else if (yearlyType === 'beforeMonth') {
        // For "X days before the month starts/ends" pattern
        rule.pattern!.dayOfMonth = -yearlyDaysBeforeMonth;
        rule.pattern!.month = yearlyMonth;
      }
    }

    // Set end condition
    if (endType === 'count' && occurrences > 0) {
      // For count-based end condition
      rule.count = occurrences;
      rule.until = null;
    } else if (endType === 'until' && endDate) {
      // For date-based end condition
      // Make sure to clear count and set until
      rule.count = undefined;
      rule.until = parseDate(endDate);
    } else {
      // Never end
      rule.count = undefined;
      rule.until = null;
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
    // No need to call onChange here - the useEffect will handle it
  };

  const handleIntervalChange = (value: number) => {
    setInterval(value);
    // No need to call onChange here - the useEffect will handle it
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
    // No need to call onChange here - the useEffect will handle it
  };
  
  // For toggling a weekday with a click
  const handleWeekdayToggle = (day: number) => {
    const isSelected = weekdays.includes(day);
    handleWeekdayChange(day, !isSelected);
  };

  const handleMonthlyTypeChange = (value: string) => {
    setMonthlyType(value as 'dayOfMonth' | 'dayOfWeek' | 'beforeMonth');
    // No need to call onChange here - the useEffect will handle it
  };

  const handleMonthlyDayOfMonthChange = (value: number) => {
    setMonthlyDayOfMonth(value);
    // No need to call onChange here - the useEffect will handle it
  };

  const handleMonthlyDayOfWeekChange = (value: number) => {
    setMonthlyDayOfWeek(value);
    // No need to call onChange here - the useEffect will handle it
  };

  const handleMonthlyWeekOfMonthChange = (value: number) => {
    setMonthlyWeekOfMonth(value);
    // No need to call onChange here - the useEffect will handle it
  };

  const handleMonthlyDaysBeforeMonthChange = (value: number) => {
    setMonthlyDaysBeforeMonth(value);
    // No need to call onChange here - the useEffect will handle it
  };
  
  const handleYearlyTypeChange = (value: string) => {
    setYearlyType(value as 'specificDate' | 'positionBased' | 'beforeMonth');
    // No need to call onChange here - the useEffect will handle it
  };
  
  const handleYearlyDaysBeforeMonthChange = (value: number) => {
    setYearlyDaysBeforeMonth(value);
    // No need to call onChange here - the useEffect will handle it
  };

  const handleYearlyMonthChange = (value: number) => {
    setYearlyMonth(value);
    // No need to call onChange here - the useEffect will handle it
  };

  const handleYearlyDayChange = (value: number) => {
    setYearlyDay(value);
    // No need to call onChange here - the useEffect will handle it
  };

  const handleYearlyDayOfWeekChange = (value: number) => {
    setYearlyDayOfWeek(value);
    // No need to call onChange here - the useEffect will handle it
  };

  const handleYearlyWeekOfMonthChange = (value: number) => {
    setYearlyWeekOfMonth(value);
    // No need to call onChange here - the useEffect will handle it
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
    // No need to call onChange here - the useEffect will handle it
  };

  const handleOccurrencesChange = (value: number) => {
    setOccurrences(value);
    // No need to call onChange here - the useEffect will handle it
  };

  const handleEndDateChange = (value: string) => {
    setEndDate(value);
    // No need to call onChange here - the useEffect will handle it
  };

  // Generate and update the recurrence rule whenever any relevant state changes
  useEffect(() => {
    const rule = generateRecurrenceRule();
    console.log('Generate rule', rule)
    onChange(rule);
  }, [
    // Dependencies - any state that affects the rule
    recurrenceType,
    interval,
    weekdays,
    monthlyType,
    monthlyDayOfMonth,
    monthlyDayOfWeek,
    monthlyWeekOfMonth,
    monthlyDaysBeforeMonth,
    yearlyType,
    yearlyMonth,
    yearlyDay,
    yearlyDayOfWeek,
    yearlyWeekOfMonth,
    yearlyDaysBeforeMonth,
    endType,
    occurrences,
    endDate
  ]);

  // No need for a separate initial update since the dependency-based useEffect above will run on mount

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
    <div className="space-y-6 p-2">
      {/* 1. Recurrence Type Selection - radio buttons in one line */}
      <div>
        <div className="mb-2 text-sm font-medium text-gray-700">Recurrence Type:</div>
        <div className="flex flex-wrap gap-4 pl-3">
          <label className="inline-flex items-center">
            <input
                type="radio"
                name="recurrenceType"
                value="DAILY"
                checked={recurrenceType === 'DAILY'}
                onChange={() => handleRecurrenceTypeChange('DAILY')}
                className="mr-2"
            />
            <span className="text-sm">Daily</span>
          </label>
          <label className="inline-flex items-center">
            <input
                type="radio"
                name="recurrenceType"
                value="WEEKLY"
                checked={recurrenceType === 'WEEKLY'}
                onChange={() => handleRecurrenceTypeChange('WEEKLY')}
                className="mr-2"
            />
            <span className="text-sm">Weekly</span>
          </label>
          <label className="inline-flex items-center">
            <input
                type="radio"
                name="recurrenceType"
                value="MONTHLY"
                checked={recurrenceType === 'MONTHLY'}
                onChange={() => handleRecurrenceTypeChange('MONTHLY')}
                className="mr-2"
            />
            <span className="text-sm">Monthly</span>
          </label>
          <label className="inline-flex items-center">
            <input
                type="radio"
                name="recurrenceType"
                value="YEARLY"
                checked={recurrenceType === 'YEARLY'}
                onChange={() => handleRecurrenceTypeChange('YEARLY')}
                className="mr-2"
            />
            <span className="text-sm">Yearly</span>
          </label>
        </div>
      </div>

      <div>
        <div className="mb-2 text-sm font-medium text-gray-700">Recurrence Settings:</div>
        <div className="pl-3">
          <div className="flex items-center gap-3 mb-4 pl-3">
            <span className="text-sm">Repeat Every</span>
            <div className="w-20">
              <FormInput
                  id="recurrence-interval"
                  type="number"
                  min="1"
                  max="99"
                  value={interval}
                  onChange={(e) => handleIntervalChange(parseInt(e.target.value) || 1)}
                  className="w-full text-xs"
              />
            </div>
            <span className="text-sm text-gray-700">
            {recurrenceType === 'DAILY' && (interval === 1 ? 'day' : 'days')}
              {recurrenceType === 'WEEKLY' && (interval === 1 ? 'week' : 'weeks')}
              {recurrenceType === 'MONTHLY' && (interval === 1 ? 'month' : 'months')}
              {recurrenceType === 'YEARLY' && (interval === 1 ? 'year' : 'years')}
            </span>
          </div>

          <div className="flex items-start gap-3 pl-4 pr-4">
            {/* Weekly Pattern (days of week) */}
            {recurrenceType === 'WEEKLY' && (
                <div>
                  <div className="mb-2">On these days:</div>
                  <div className="flex flex-wrap gap-2">
                    {[0, 1, 2, 3, 4, 5, 6].map((jsIndex) => {
                      const isoDay = jsIndexToIsoDay(jsIndex);
                      return (
                          <button
                              key={jsIndex}
                              type="button"
                              className={`w-9 h-9 rounded-full flex items-center justify-center font-medium transition-colors ${
                                  weekdays.includes(isoDay)
                                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                  <div>
                    <label className="inline-flex items-center">
                      <input
                          type="radio"
                          id="monthly-day-of-month"
                          name="monthlyType"
                          value="dayOfMonth"
                          checked={monthlyType === 'dayOfMonth'}
                          onChange={() => handleMonthlyTypeChange('dayOfMonth')}
                          className="mr-2"
                      />
                      <span className="mr-2 text-sm">On day</span>
                      <div className="w-20 inline-block mx-1">
                        <Select
                            value={monthlyDayOfMonth.toString()}
                            onChange={(value) => handleMonthlyDayOfMonthChange(parseInt(value))}
                            disabled={monthlyType !== 'dayOfMonth'}
                            options={generateDayOptionsArray()}
                            className="text-xs"
                        />
                      </div>
                      <span>of the month</span>
                    </label>
                  </div>

                  <div>
                    <label className="inline-flex items-center">
                      <input
                          type="radio"
                          id="monthly-day-of-week"
                          name="monthlyType"
                          value="dayOfWeek"
                          checked={monthlyType === 'dayOfWeek'}
                          onChange={() => handleMonthlyTypeChange('dayOfWeek')}
                          className="mr-2"
                      />
                      <span className="mr-2">On the</span>
                      <div className="w-28 inline-block mx-1">
                        <Select
                            value={monthlyWeekOfMonth.toString()}
                            onChange={(value) => handleMonthlyWeekOfMonthChange(parseInt(value))}
                            disabled={monthlyType !== 'dayOfWeek'}
                            options={generateWeekOptionsArray()}
                            className="text-xs"
                        />
                      </div>
                      <div className="w-28 inline-block mx-1">
                        <Select
                            value={monthlyDayOfWeek.toString()}
                            onChange={(value) => handleMonthlyDayOfWeekChange(parseInt(value))}
                            disabled={monthlyType !== 'dayOfWeek'}
                            options={generateDayOfWeekOptionsArray()}
                            className="text-xs"
                        />
                      </div>
                      <span>of the month</span>
                    </label>
                  </div>

                  <div>
                    <label className="inline-flex items-center">
                      <input
                          type="radio"
                          id="monthly-before-month"
                          name="monthlyType"
                          value="beforeMonth"
                          checked={monthlyType === 'beforeMonth'}
                          onChange={() => handleMonthlyTypeChange('beforeMonth')}
                          className="mr-2"
                      />
                      <div className="w-20 inline-block mx-1">
                        <Select
                            value={monthlyDaysBeforeMonth.toString()}
                            onChange={(value) => handleMonthlyDaysBeforeMonthChange(parseInt(value))}
                            disabled={monthlyType !== 'beforeMonth'}
                            options={[1, 2, 3, 4, 5, 7, 10, 14, 21, 28].map(day => ({
                              value: day.toString(),
                              label: day.toString()
                            }))}
                            className="text-xs"
                        />
                      </div>
                      <span className="text-sm">{monthlyDaysBeforeMonth === 1 ? 'day' : 'days'} before month ends</span>
                    </label>
                  </div>
                </div>
            )}

            {/* Yearly Pattern */}
            {recurrenceType === 'YEARLY' && (
              <div className="space-y-3">
                <div>
                  <label className="inline-flex items-center">
                    <input
                          type="radio"
                          id="yearly-specific-date"
                          name="yearlyType"
                          value="specificDate"
                          checked={yearlyType === 'specificDate'}
                          onChange={() => handleYearlyTypeChange('specificDate')}
                          className="mr-2"
                      />
                    <span className="mr-2 text-sm">Every</span>
                    <div className="w-32 inline-block mx-1">
                      <Select
                            value={yearlyMonth.toString()}
                            onChange={(value) => handleYearlyMonthChange(parseInt(value))}
                            disabled={yearlyType !== 'specificDate'}
                            options={generateMonthOptionsArray()}
                            className="text-xs"
                        />
                    </div>
                    <div className="w-16 inline-block mx-1">
                      <Select
                            value={yearlyDay.toString()}
                            onChange={(value) => handleYearlyDayChange(parseInt(value))}
                            disabled={yearlyType !== 'specificDate'}
                            options={generateDayOptionsArray()}
                            className="text-xs"
                        />
                    </div>
                  </label>
                </div>
                
                <div>
                  <label className="inline-flex items-center flex-wrap">
                    <input
                          type="radio"
                          id="yearly-position-based"
                          name="yearlyType"
                          value="positionBased"
                          checked={yearlyType === 'positionBased'}
                          onChange={() => handleYearlyTypeChange('positionBased')}
                          className="mr-2"
                      />
                    <span className="mr-2 text-sm">On the</span>
                    <div className="w-28 inline-block mx-1">
                      <Select
                            value={yearlyWeekOfMonth.toString()}
                            onChange={(value) => handleYearlyWeekOfMonthChange(parseInt(value))}
                            disabled={yearlyType !== 'positionBased'}
                            options={generateWeekOptionsArray()}
                            className="text-xs"
                        />
                    </div>
                    <div className="w-28 inline-block mx-1">
                      <Select
                            value={yearlyDayOfWeek.toString()}
                            onChange={(value) => handleYearlyDayOfWeekChange(parseInt(value))}
                            disabled={yearlyType !== 'positionBased'}
                            options={generateDayOfWeekOptionsArray()}
                            className="text-xs"
                        />
                    </div>
                    <span className="mx-1 text-sm">of</span>
                    <div className="w-28 inline-block mx-1">
                      <Select
                            value={yearlyMonth.toString()}
                            onChange={(value) => handleYearlyMonthChange(parseInt(value))}
                            disabled={yearlyType !== 'positionBased'}
                            options={generateMonthOptionsArray()}
                            className="text-xs"
                        />
                    </div>
                  </label>
                </div>
                
                <div>
                  <label className="inline-flex items-center">
                    <input
                        type="radio"
                        id="yearly-before-month"
                        name="yearlyType"
                        value="beforeMonth"
                        checked={yearlyType === 'beforeMonth'}
                        onChange={() => handleYearlyTypeChange('beforeMonth')}
                        className="mr-2"
                    />
                    <div className="w-16 inline-block mx-1">
                      <Select
                          value={yearlyDaysBeforeMonth.toString()}
                          onChange={(value) => handleYearlyDaysBeforeMonthChange(parseInt(value))}
                          disabled={yearlyType !== 'beforeMonth'}
                          options={[1, 2, 3, 4, 5, 7, 10, 14, 21, 28].map(day => ({
                            value: day.toString(),
                            label: day.toString()
                          }))}
                          className="text-xs"
                      />
                    </div>
                    <span className="text-sm">{yearlyDaysBeforeMonth === 1 ? 'day' : 'days'} before</span>
                    <div className="w-32 inline-block mx-1">
                      <Select
                          value={yearlyMonth.toString()}
                          onChange={(value) => handleYearlyMonthChange(parseInt(value))}
                          disabled={yearlyType !== 'beforeMonth'}
                          options={generateMonthOptionsArray()}
                          className="text-xs"
                      />
                    </div>
                    <span className="text-sm">{yearlyDaysBeforeMonth === 1 ? 'day' : 'days'} ends</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>


      {/* 3. Recurrence End Conditions - with checkbox for Never Ends */}
      <div>
        <div className="flex items-center mb-2">
          <div className="text-sm font-medium text-gray-700 mr-4">Recurrence Ends:</div>
          <label className="inline-flex items-center">
            <input
                type="checkbox"
                id="end-never"
                checked={endType === 'never'}
                onChange={() => handleEndTypeChange(endType === 'never' ? 'count' : 'never')}
                className="mr-2"
            />
            <span className="text-sm">Never Ends</span>
          </label>
        </div>
        {endType !== 'never' && (<div className="flex gap-3 pl-3">
              <label className="inline-flex items-center  p-2 rounded-md">
                <input
                    type="radio"
                    id="end-count"
                    name="endType"
                    value="count"
                    checked={endType === 'count'}
                    onChange={() => handleEndTypeChange('count')}
                    className="mr-2"
                />
                <span className="mr-2 text-sm">After</span>
                <div className="w-16">
                  <FormInput
                      type="number"
                      min="1"
                      max="99"
                      value={occurrences}
                      onChange={(e) => handleOccurrencesChange(parseInt(e.target.value) || 1)}
                      disabled={endType !== 'count'}
                      className="text-xs"
                  />
                </div>
                <span className="ml-2 text-sm">occurrences</span>
              </label>

              <label className="inline-flex items-center  p-2 rounded-md">
                <input
                    type="radio"
                    id="end-until"
                    name="endType"
                    value="until"
                    checked={endType === 'until'}
                    onChange={() => handleEndTypeChange('until')}
                    className="mr-2"
                />
                <span className="mr-2 text-sm">On</span>
                <div className="w-40">
                  <FormInput
                      type="date"
                      value={endDate}
                      onChange={(e) => handleEndDateChange(e.target.value)}
                      disabled={endType !== 'until'}
                      className="text-xs"
                  />
                </div>
              </label>
        </div>)}
      </div>
      </div>
      );
      }
