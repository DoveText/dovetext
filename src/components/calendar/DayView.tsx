'use client';

import React from 'react';
import { ScheduleEvent } from './Calendar';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import CalendarDaySlot from './CalendarDaySlot';
import { generateTimeSlots } from './CalendarUtils';

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
      {/* Calendar container with time labels and day slot */}
      <div className="flex-grow overflow-hidden flex">
        {/* Time labels column */}
        <div className="time-labels-column" style={{ width: '70px', minWidth: '70px', flexShrink: 0 }}>
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
                <div className="text-xs text-gray-500 -mt-2 whitespace-nowrap">{slot.label}</div>
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
            onDateClick={handleDateClick}
            width="100%"
            dayIndex={0}
          />
        </div>
      </div>
    </div>
  );
}
