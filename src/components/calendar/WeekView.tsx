'use client';

import React, { useEffect, useRef } from 'react';
import { ScheduleEvent } from './Calendar';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import CalendarDaySlot, { generateTimeSlots } from './CalendarDaySlot';

export interface WeekViewProps {
  date: Date;
  events: ScheduleEvent[];
  onEventClick?: (event: ScheduleEvent) => void;
  onDateClick?: (date: Date) => void;
  onAddEvent?: (date: Date, event?: ScheduleEvent) => void;
  currentTime: Date;
  onEventDrop?: (event: ScheduleEvent, newStart: Date, newEnd: Date) => void;
  onViewChange?: (view: 'day' | 'week' | 'month', date: Date) => void;
  onDateChange?: (date: Date) => void;
}

// Generate days of the week
const getDaysOfWeek = (date: Date) => {
  const days = [];
  const currentDay = new Date(date);
  currentDay.setDate(date.getDate() - date.getDay()); // Start with Sunday
  
  for (let i = 0; i < 7; i++) {
    days.push(new Date(currentDay));
    currentDay.setDate(currentDay.getDate() + 1);
  }
  
  return days;
};

// Check if a day is today
const isToday = (day: Date) => {
  const today = new Date();
  return day.getDate() === today.getDate() && 
         day.getMonth() === today.getMonth() && 
         day.getFullYear() === today.getFullYear();
};

// Format day for display
const formatDay = (day: Date) => {
  return day.toLocaleDateString('en-US', { weekday: 'short' });
};

// Format date for display
const formatDate = (day: Date) => {
  return day.getDate().toString();
};

export default function WeekView({ date, events, onEventClick, onDateClick, onAddEvent, currentTime, onEventDrop, onViewChange, onDateChange }: WeekViewProps) {
  const daysOfWeek = getDaysOfWeek(date);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Navigation functions
  const goToPreviousWeek = () => {
    const prevWeek = new Date(date);
    prevWeek.setDate(prevWeek.getDate() - 7);
    if (onDateChange) onDateChange(prevWeek);
  };
  
  const goToNextWeek = () => {
    const nextWeek = new Date(date);
    nextWeek.setDate(nextWeek.getDate() + 7);
    if (onDateChange) onDateChange(nextWeek);
  };
  
  // Handle date click
  const handleDateClick = (clickedDate: Date) => {
    if (onDateClick) onDateClick(clickedDate);
  };
  
  // Handle view change to day view
  const handleViewChange = (day: Date) => {
    if (onViewChange) {
      onViewChange('day', day);
    } else if (onDateClick) {
      onDateClick(day);
    }
  };
  
  // Scroll to current time on mount
  useEffect(() => {
    if (scrollContainerRef.current) {
      const currentHour = currentTime.getHours();
      const scrollTop = currentHour * 60 - 100; // 60px per hour, offset by 100px to show a bit of context
      scrollContainerRef.current.scrollTop = scrollTop > 0 ? scrollTop : 0;
    }
  }, [currentTime]);

  return (
    <div className="flex flex-col h-full">
      {/* Week header with navigation */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center">
          <button 
            className="mr-4 p-1 rounded-full hover:bg-gray-100"
            onClick={goToPreviousWeek}
          >
            <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          
          <h2 className="text-xl font-semibold">
            {date.toLocaleDateString('en-US', { 
              month: 'long', 
              year: 'numeric'
            })}
          </h2>
          
          <button 
            className="ml-4 p-1 rounded-full hover:bg-gray-100"
            onClick={goToNextWeek}
          >
            <ChevronRightIcon className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>
      
      {/* Week day headers */}
      <div className="flex border-b">
        {daysOfWeek.map((day, index) => (
          <div 
            key={index} 
            className={`flex-1 text-center py-2 ${isToday(day) ? 'bg-blue-50' : ''}`}
            onClick={() => handleDateClick(day)}
          >
            <div className="text-sm font-medium">{formatDay(day)}</div>
            <div className={`text-2xl ${isToday(day) ? 'text-blue-600 font-semibold' : ''}`}>
              {formatDate(day)}
            </div>
          </div>
        ))}
      </div>
      
      {/* Calendar with time labels and days */}
      <div className="flex-grow overflow-hidden flex" ref={scrollContainerRef}>
        {/* Time labels column */}
        <div className="time-labels-column" style={{ width: '60px', minWidth: '60px', flexShrink: 0 }}>
          {/* All day label */}
          <div className="all-day-label border-b">
            <div className="text-xs text-gray-500 h-8 flex items-center justify-end pr-2">All day</div>
          </div>
          
          {/* Time slot labels */}
          <div className="time-labels" style={{ height: 'calc(100% - 32px)' }}>
            {generateTimeSlots().map((slot, index) => (
              <div 
                key={`time-label-${index}`} 
                className="time-label flex items-start justify-end pr-2"
                style={{ height: '60px' }}
              >
                <div className="text-xs text-gray-500 -mt-2">{slot.label}</div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Calendar days */}
        <div className="flex-grow">
          <div className="flex h-full">
            {daysOfWeek.map((day, index) => (
              <div key={index} className="flex-1">
                <CalendarDaySlot
                  date={day}
                  events={events}
                  onEventClick={onEventClick}
                  onAddEvent={onAddEvent}
                  currentTime={currentTime}
                  onEventDrop={onEventDrop}
                  showHeader={false}
                  onDateClick={() => handleViewChange(day)}
                  width="100%"
                  dayIndex={index}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
