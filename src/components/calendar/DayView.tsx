'use client';

import React from 'react';
import { ScheduleEvent } from './Calendar';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import CalendarDaySlot, { generateTimeSlots } from './CalendarDaySlot';

export interface DayViewProps {
  date: Date;
  events: ScheduleEvent[];
  onEventClick?: (event: ScheduleEvent) => void;
  onAddEvent?: (date: Date, event?: ScheduleEvent) => void;
  currentTime: Date;
  onEventDrop?: (event: ScheduleEvent, newStart: Date, newEnd: Date) => void;
  onDateChange?: (date: Date) => void;
}

export default function DayView({ date, events, onEventClick, onAddEvent, currentTime, onEventDrop, onDateChange }: DayViewProps) {
  // Navigation functions
  const goToPreviousDay = () => {
    const prevDay = new Date(date);
    prevDay.setDate(prevDay.getDate() - 1);
    if (onDateChange) onDateChange(prevDay);
  };
  
  const goToNextDay = () => {
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    if (onDateChange) onDateChange(nextDay);
  };

  // Handle date click (if needed)
  const handleDateClick = (clickedDate: Date) => {
    if (onDateChange) onDateChange(clickedDate);
  };

  return (
    <div className="day-view h-full flex flex-col">
      {/* Day header with navigation */}
      <div className="day-header flex items-center justify-between p-4 border-b">
        <div className="flex items-center">
          <button 
            className="mr-4 p-1 rounded-full hover:bg-gray-100"
            onClick={goToPreviousDay}
          >
            <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          
          <h2 className="text-xl font-semibold">
            {date.toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h2>
          
          <button 
            className="ml-4 p-1 rounded-full hover:bg-gray-100"
            onClick={goToNextDay}
          >
            <ChevronRightIcon className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>
      
      {/* Calendar container with time labels and day slot */}
      <div className="flex-grow overflow-hidden flex">
        {/* Time labels column */}
        <div className="time-labels-column" style={{ width: '60px', minWidth: '60px' }}>
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
        
        {/* Calendar day slot */}
        <div className="flex-grow">
          <CalendarDaySlot
            date={date}
            events={events}
            onEventClick={onEventClick}
            onAddEvent={onAddEvent}
            currentTime={currentTime}
            onEventDrop={onEventDrop}
            showHeader={false}
            onDateClick={handleDateClick}
            width="100%"
            dayIndex={0}
          />
        </div>
      </div>
    </div>
  );
}
