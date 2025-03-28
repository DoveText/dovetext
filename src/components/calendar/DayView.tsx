'use client';

import { useState, useEffect, useRef } from 'react';
import { ScheduleEvent } from './Calendar';
import { PlusIcon } from '@heroicons/react/24/outline';

interface DayViewProps {
  date: Date;
  events: ScheduleEvent[];
  onEventClick?: (event: ScheduleEvent) => void;
  onAddEvent?: (date: Date) => void;
  currentTime: Date;
}

// Generate time slots for the day
const generateTimeSlots = () => {
  const slots = [];
  for (let i = 0; i < 24; i++) {
    slots.push({
      hour: i,
      label: `${i === 0 ? '12' : i > 12 ? i - 12 : i}:00 ${i >= 12 ? 'PM' : 'AM'}`
    });
  }
  return slots;
};

export default function DayView({ date, events, onEventClick, onAddEvent, currentTime }: DayViewProps) {
  const timeSlots = generateTimeSlots();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Scroll to 9:00 AM when component mounts
  useEffect(() => {
    if (scrollContainerRef.current) {
      // Scroll to 9:00 AM (9 hours * 60px per hour = 540px)
      scrollContainerRef.current.scrollTop = 540;
    }
  }, []);
  
  // Filter events for the current day
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.start);
    return eventDate.getDate() === date.getDate() &&
           eventDate.getMonth() === date.getMonth() &&
           eventDate.getFullYear() === date.getFullYear();
  });
  
  // Separate all-day events
  const allDayEvents = dayEvents.filter(event => event.isAllDay || event.type === 'all-day');
  const timedEvents = dayEvents.filter(event => !event.isAllDay && event.type !== 'all-day');
  
  // Check if the date is today
  const isToday = currentTime.getDate() === date.getDate() &&
                  currentTime.getMonth() === date.getMonth() &&
                  currentTime.getFullYear() === date.getFullYear();
  
  // Calculate current time position for the time indicator
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  const currentTimePosition = `${(currentHour + currentMinute / 60) * 60}px`;
  
  // Helper function to position events on the timeline
  const getEventStyle = (event: ScheduleEvent) => {
    const startHour = event.start.getHours();
    const startMinute = event.start.getMinutes();
    const endHour = event.end.getHours();
    const endMinute = event.end.getMinutes();
    
    const top = (startHour + startMinute / 60) * 60;
    const height = ((endHour + endMinute / 60) - (startHour + startMinute / 60)) * 60;
    
    return {
      top: `${top}px`,
      height: `${Math.max(height, 30)}px`, // Minimum height for very short events
      backgroundColor: event.color || getEventColor(event.type)
    };
  };
  
  // Get color based on event type
  const getEventColor = (type: string) => {
    switch (type) {
      case 'event':
        return 'rgba(59, 130, 246, 0.2)'; // blue
      case 'reminder':
        return 'rgba(245, 158, 11, 0.2)'; // amber
      case 'all-day':
        return 'rgba(16, 185, 129, 0.2)'; // green
      default:
        return 'rgba(107, 114, 128, 0.2)'; // gray
    }
  };
  
  // Get border color based on event type
  const getEventBorderColor = (type: string) => {
    switch (type) {
      case 'event':
        return 'border-blue-500';
      case 'reminder':
        return 'border-amber-500';
      case 'all-day':
        return 'border-green-500';
      default:
        return 'border-gray-500';
    }
  };
  
  // Format time for display
  const formatEventTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* All-day events section */}
      {allDayEvents.length > 0 && (
        <div className="border-b p-2">
          <h3 className="text-xs font-medium text-gray-500 mb-2">ALL DAY</h3>
          <div className="space-y-1">
            {allDayEvents.map((event) => (
              <div 
                key={event.id}
                onClick={() => onEventClick && onEventClick(event)}
                className={`px-2 py-1 rounded text-sm cursor-pointer border-l-4 ${getEventBorderColor(event.type)} bg-gray-50 hover:bg-gray-100`}
              >
                <div className="font-medium truncate">{event.title}</div>
                {event.location && <div className="text-xs text-gray-500 truncate">{event.location}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Timed events */}
      <div className="flex-1 overflow-y-auto" ref={scrollContainerRef}>
        <div className="relative min-h-[1440px]"> {/* 24 hours * 60px per hour */}
          {/* Time slots */}
          {timeSlots.map((slot) => (
            <div key={slot.hour} className="flex h-[60px] border-b border-gray-100">
              <div className="w-16 pr-2 pt-[12px] text-right text-xs text-gray-500 -mt-2">
                {slot.label}
              </div>
              <div 
                className="flex-1 relative border-l border-gray-200 group"
                onClick={() => {
                  if (onAddEvent) {
                    const newDate = new Date(date);
                    newDate.setHours(slot.hour, 0, 0, 0);
                    onAddEvent(newDate);
                  }
                }}
              >
                <button className="absolute left-0 top-0 h-full w-full flex items-center justify-center opacity-0 group-hover:opacity-100 bg-blue-50 bg-opacity-30">
                  <PlusIcon className="h-5 w-5 text-blue-500" />
                </button>
              </div>
            </div>
          ))}
          
          {/* Current time indicator */}
          {isToday && (
            <div 
              className="absolute left-0 right-0 flex items-center z-10 pointer-events-none"
              style={{ top: currentTimePosition }}
            >
              <div className="w-16 pr-2 flex justify-end">
                <div className="h-2 w-2 rounded-full bg-red-500"></div>
              </div>
              <div className="flex-1 h-[1px] bg-red-500"></div>
            </div>
          )}
          
          {/* Events */}
          {timedEvents.map((event) => (
            <div 
              key={event.id}
              className="absolute left-16 right-2 rounded-md border shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              style={getEventStyle(event)}
              onClick={() => onEventClick && onEventClick(event)}
            >
              <div className={`h-full p-1 ${event.type === 'reminder' ? 'bg-amber-50' : 'bg-blue-50'}`}>
                <div className="font-medium text-sm truncate">{event.title}</div>
                <div className="text-xs text-gray-600">
                  {formatEventTime(event.start)} - {formatEventTime(event.end)}
                </div>
                {event.location && (
                  <div className="text-xs text-gray-500 truncate">{event.location}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
