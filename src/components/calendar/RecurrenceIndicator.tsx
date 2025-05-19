'use client';

import { ReactNode } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { ScheduleEvent } from './Calendar';

interface RecurrenceIndicatorProps {
  event: ScheduleEvent;
  children?: ReactNode;
  showDetails?: boolean;
}

export default function RecurrenceIndicator({ event, children, showDetails = false }: RecurrenceIndicatorProps) {
  if (!event.isRecurring || !event.recurrenceRule) {
    return <>{children}</>;
  }

  // Generate human-readable description of recurrence pattern
  const getRecurrenceDescription = (): string => {
    const { type, interval, pattern, count, until } = event.recurrenceRule!;
    
    let description = '';
    
    // Frequency description
    switch (type) {
      case 'DAILY':
        description = interval === 1 ? 'Daily' : `Every ${interval} days`;
        break;
      case 'WEEKLY':
        if (interval === 1) {
          if (pattern?.daysOfWeek && pattern.daysOfWeek.length > 0) {
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const selectedDays = pattern.daysOfWeek.map(day => days[day]).join(', ');
            description = `Weekly on ${selectedDays}`;
          } else {
            description = 'Weekly';
          }
        } else {
          description = `Every ${interval} weeks`;
        }
        break;
      case 'MONTHLY':
        if (pattern?.dayOfMonth) {
          description = interval === 1 
            ? `Monthly on day ${pattern.dayOfMonth}` 
            : `Every ${interval} months on day ${pattern.dayOfMonth}`;
        } else if (pattern?.dayOfWeek !== undefined && pattern?.weekOfMonth !== undefined) {
          const weeks = ['first', 'second', 'third', 'fourth', 'last'];
          const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          description = interval === 1 
            ? `Monthly on the ${weeks[pattern.weekOfMonth - 1]} ${days[pattern.dayOfWeek]}` 
            : `Every ${interval} months on the ${weeks[pattern.weekOfMonth - 1]} ${days[pattern.dayOfWeek]}`;
        } else {
          description = interval === 1 ? 'Monthly' : `Every ${interval} months`;
        }
        break;
      case 'YEARLY':
        const months = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        if (pattern?.month !== undefined && pattern?.day !== undefined) {
          description = interval === 1 
            ? `Yearly on ${months[pattern.month]} ${pattern.day}` 
            : `Every ${interval} years on ${months[pattern.month]} ${pattern.day}`;
        } else {
          description = interval === 1 ? 'Yearly' : `Every ${interval} years`;
        }
        break;
    }
    
    // End description
    if (count) {
      description += `, ${count} times`;
    } else if (until) {
      const untilDate = new Date(until);
      description += `, until ${untilDate.toLocaleDateString()}`;
    }
    
    return description;
  };

  // If we're showing details, render the full indicator with description
  if (showDetails) {
    return (
      <div className="flex flex-col">
        <div className="flex items-center">
          <ArrowPathIcon className="h-3 w-3 text-blue-500 mr-1" />
          <span className="text-xs text-blue-500 font-medium">Recurring</span>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {getRecurrenceDescription()}
        </div>
      </div>
    );
  }
  
  // If we have children, we're being used as a wrapper
  if (children) {
    return <>{children}</>;
  }
  
  // Return a more prominent but still transparent icon
  return (
    <div className="bg-blue-500 bg-opacity-30 rounded-full p-0.5">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-600">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.9" fill="currentColor" fillOpacity="0.2" />
        <path 
          d="M20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12C4 7.58172 7.58172 4 12 4" 
          stroke="white" 
          strokeWidth="2.5" 
          strokeLinecap="round"
          strokeOpacity="0.9"
        />
        <path 
          d="M16 4L12 8L8 4" 
          stroke="white" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          strokeOpacity="0.9"
        />
      </svg>
    </div>
  );
}
