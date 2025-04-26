'use client';

import { useState, useEffect } from 'react';
import DayView from './DayView';
import WeekView from './WeekView';
import MonthView from './MonthView';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export type CalendarViewType = 'day' | 'week' | 'month';

export interface ScheduleEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  isAllDay: boolean;
  type: 'event' | 'reminder';
  location?: string;
  description?: string;
  color?: string;
}

interface CalendarProps {
  events: ScheduleEvent[];
  onEventClick?: (event: ScheduleEvent) => void;
  onDateClick?: (date: Date) => void;
  onAddEvent?: (date: Date) => void;
  onEventDrop?: (event: ScheduleEvent, newStart: Date, newEnd: Date) => void;
}

export default function Calendar({ events, onEventClick, onDateClick, onAddEvent, onEventDrop }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarViewType>('week');
  const today = new Date();

  // Format date for display in header
  const formatHeaderDate = () => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric',
      month: 'long'
    };
    
    if (view === 'day') {
      return new Intl.DateTimeFormat('en-US', {
        ...options,
        day: 'numeric',
        weekday: 'long'
      }).format(currentDate);
    } else if (view === 'week') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      const startMonth = startOfWeek.getMonth();
      const endMonth = endOfWeek.getMonth();
      
      if (startMonth === endMonth) {
        return `${new Intl.DateTimeFormat('en-US', { month: 'long' }).format(startOfWeek)} ${startOfWeek.getDate()} - ${endOfWeek.getDate()}, ${startOfWeek.getFullYear()}`;
      } else {
        return `${new Intl.DateTimeFormat('en-US', { month: 'short' }).format(startOfWeek)} ${startOfWeek.getDate()} - ${new Intl.DateTimeFormat('en-US', { month: 'short' }).format(endOfWeek)} ${endOfWeek.getDate()}, ${startOfWeek.getFullYear()}`;
      }
    } else {
      return new Intl.DateTimeFormat('en-US', options).format(currentDate);
    }
  };

  // Navigate to previous period
  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    if (view === 'day') {
      newDate.setDate(currentDate.getDate() - 1);
    } else if (view === 'week') {
      newDate.setDate(currentDate.getDate() - 7);
    } else {
      newDate.setMonth(currentDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  // Navigate to next period
  const goToNext = () => {
    const newDate = new Date(currentDate);
    if (view === 'day') {
      newDate.setDate(currentDate.getDate() + 1);
    } else if (view === 'week') {
      newDate.setDate(currentDate.getDate() + 7);
    } else {
      newDate.setMonth(currentDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  // Go to today
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Handle view change with specific date
  const handleViewChange = (newView: CalendarViewType, newDate: Date) => {
    setView(newView);
    setCurrentDate(newDate);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow overflow-hidden">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold">{formatHeaderDate()}</h2>
          <div className="flex space-x-1">
            <button 
              onClick={goToPrevious}
              className="p-1 rounded-full hover:bg-gray-100"
              aria-label="Previous"
            >
              <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
            </button>
            <button 
              onClick={goToNext}
              className="p-1 rounded-full hover:bg-gray-100"
              aria-label="Next"
            >
              <ChevronRightIcon className="h-5 w-5 text-gray-600" />
            </button>
          </div>
          <button 
            onClick={goToToday}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200"
          >
            Today
          </button>
        </div>
        
        <div className="flex space-x-2">
          <button 
            onClick={() => setView('day')}
            className={`px-3 py-1 text-sm rounded-md ${view === 'day' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Day
          </button>
          <button 
            onClick={() => setView('week')}
            className={`px-3 py-1 text-sm rounded-md ${view === 'week' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Week
          </button>
          <button 
            onClick={() => setView('month')}
            className={`px-3 py-1 text-sm rounded-md ${view === 'month' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Month
          </button>
        </div>
      </div>
      
      {/* Calendar Content */}
      <div className="flex-1 overflow-auto">
        {view === 'day' && (
          <DayView 
            date={currentDate} 
            events={events} 
            onEventClick={onEventClick}
            onAddEvent={onAddEvent}
            currentTime={today}
            onEventDrop={onEventDrop}
          />
        )}
        {view === 'week' && (
          <WeekView 
            date={currentDate} 
            events={events} 
            onEventClick={onEventClick}
            onDateClick={onDateClick}
            onAddEvent={onAddEvent}
            currentTime={today}
            onEventDrop={onEventDrop}
          />
        )}
        {view === 'month' && (
          <MonthView 
            date={currentDate} 
            events={events} 
            onEventClick={onEventClick}
            onDateClick={onDateClick}
            onAddEvent={onAddEvent}
            currentTime={today}
            onEventDrop={onEventDrop}
            onViewChange={handleViewChange}
          />
        )}
      </div>
    </div>
  );
}
