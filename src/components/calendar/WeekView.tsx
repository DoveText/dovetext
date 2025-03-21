'use client';

import { useState, useEffect, useRef } from 'react';
import { ScheduleEvent } from './Calendar';
import { PlusIcon } from '@heroicons/react/24/outline';
import { createPortal } from 'react-dom';
import Tooltip from '../ui/Tooltip';

interface WeekViewProps {
  date: Date;
  events: ScheduleEvent[];
  onEventClick?: (event: ScheduleEvent) => void;
  onDateClick?: (date: Date) => void;
  onAddEvent?: (date: Date) => void;
  currentTime: Date;
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

export default function WeekView({ date, events, onEventClick, onDateClick, onAddEvent, currentTime }: WeekViewProps) {
  const daysOfWeek = getDaysOfWeek(date);
  const timeSlots = generateTimeSlots();
  
  const [tooltipContent, setTooltipContent] = useState<React.ReactNode | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Clean up any timeouts when component unmounts
  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
    };
  }, []);
  
  const showTooltip = (content: React.ReactNode, e: React.MouseEvent) => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }
    
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipContent(content);
    setTooltipPosition({
      top: rect.top,
      left: rect.left + rect.width / 2
    });
    
    tooltipTimeoutRef.current = setTimeout(() => {
      setIsTooltipVisible(true);
    }, 100);
  };
  
  const hideTooltip = () => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }
    setIsTooltipVisible(false);
  };
  
  // Check if a day is today
  const isToday = (day: Date) => {
    return day.getDate() === currentTime.getDate() &&
           day.getMonth() === currentTime.getMonth() &&
           day.getFullYear() === currentTime.getFullYear();
  };
  
  // Format day for display
  const formatDay = (day: Date) => {
    return day.toLocaleDateString('en-US', { weekday: 'short' });
  };
  
  // Format date for display
  const formatDate = (day: Date) => {
    return day.getDate().toString();
  };
  
  // Calculate current time position for the time indicator
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  const currentTimePosition = `${(currentHour + currentMinute / 60) * 60}px`;
  
  // Filter events for each day
  const getEventsForDay = (day: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate.getDate() === day.getDate() &&
             eventDate.getMonth() === day.getMonth() &&
             eventDate.getFullYear() === day.getFullYear();
    });
  };
  
  // Get all-day events for each day
  const getAllDayEventsForDay = (day: Date) => {
    const dayEvents = getEventsForDay(day);
    return dayEvents.filter(event => event.isAllDay || event.type === 'all-day');
  };
  
  // Get timed events for each day
  const getTimedEventsForDay = (day: Date) => {
    const dayEvents = getEventsForDay(day);
    return dayEvents.filter(event => !event.isAllDay && event.type !== 'all-day');
  };
  
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
  
  // Format date for tooltip display
  const formatEventDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Custom tooltip portal */}
      {isTooltipVisible && tooltipContent && typeof window !== 'undefined' && createPortal(
        <div 
          className="fixed z-50 max-w-xs px-3 py-2 text-xs text-white bg-gray-800 rounded shadow-lg whitespace-pre-wrap"
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            transform: 'translate(-50%, -100%)',
            marginTop: '-5px'
          }}
        >
          {tooltipContent}
        </div>,
        document.body
      )}
      {/* Week header */}
      <div className="flex border-b pr-[10px]">
        <div className="w-16 shrink-0"></div>
        <div className="flex-1 flex">
          {daysOfWeek.map((day, index) => (
            <div 
              key={index} 
              className={`flex-1 text-center py-2 ${isToday(day) ? 'bg-blue-50' : ''}`}
              onClick={() => onDateClick && onDateClick(day)}
            >
              <div className="text-sm font-medium">{formatDay(day)}</div>
              <div className={`text-2xl ${isToday(day) ? 'text-blue-600 font-semibold' : ''}`}>
                {formatDate(day)}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* All-day events */}
      <div className="flex border-b pr-[10px]">
        <div className="w-16 shrink-0 p-2 text-xs font-medium text-gray-500 border-r">ALL DAY</div>
        <div className="flex flex-1">
          {daysOfWeek.map((day, dayIndex) => {
            const allDayEvents = getAllDayEventsForDay(day);
            return (
              <div 
                key={dayIndex} 
                className={`flex-1 p-1 ${isToday(day) ? 'bg-blue-50' : ''} ${dayIndex < 6 ? 'border-r' : ''}`}
              >
                {allDayEvents.length > 0 ? (
                  <div className="space-y-1">
                    {allDayEvents.map((event) => (
                      <div 
                        key={event.id}
                        onClick={() => onEventClick && onEventClick(event)}
                        className={`px-1 py-1 rounded text-xs cursor-pointer border-l-2 ${getEventBorderColor(event.type)} bg-white hover:bg-gray-100 truncate w-full`}
                        onMouseEnter={(e) => showTooltip(
                          <>
                            <div className="font-medium">{event.title}</div>
                            {event.description && <div className="mt-1">{event.description}</div>}
                            <div className="mt-1 text-gray-300">All day: {formatEventDate(event.start)}</div>
                          </>,
                          e
                        )}
                        onMouseLeave={hideTooltip}
                      >
                        {event.title}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div 
                    className="h-6 w-full flex items-center justify-center opacity-0 hover:opacity-100 cursor-pointer"
                    onClick={() => {
                      if (onAddEvent) {
                        const newDate = new Date(day);
                        newDate.setHours(9, 0, 0, 0); // Default to 9 AM
                        onAddEvent(newDate);
                      }
                    }}
                  >
                    <PlusIcon className="h-4 w-4 text-blue-500" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Time grid - with scrollbar */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="relative" style={{ height: "1440px" }}> {/* 24 hours * 60px per hour */}
          {/* Time slots - show all hours */}
          {timeSlots.map((slot) => (
            <div key={slot.hour} className="flex h-[60px] border-b border-gray-100">
              <div className="w-16 pr-2 pt-[12px] text-right text-xs text-gray-500 -mt-2 border-r">
                {slot.label}
              </div>
              <div className="flex flex-1">
                {daysOfWeek.map((day, dayIndex) => (
                  <div 
                    key={dayIndex} 
                    className={`flex-1 relative ${dayIndex < 6 ? 'border-r' : ''} group ${isToday(day) ? 'bg-blue-50' : ''}`}
                    onClick={() => {
                      if (onAddEvent) {
                        const newDate = new Date(day);
                        newDate.setHours(slot.hour, 0, 0, 0);
                        onAddEvent(newDate);
                      }
                    }}
                  >
                    <button className="absolute left-0 top-0 h-full w-full flex items-center justify-center opacity-0 group-hover:opacity-100 bg-blue-50 bg-opacity-30">
                      <PlusIcon className="h-4 w-4 text-blue-500" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {/* Current time indicator */}
          {(
            <div 
              className="absolute left-0 right-0 flex items-center z-10 pointer-events-none"
              style={{ top: `${(currentHour + currentMinute / 60) * 60}px` }}
            >
              <div className="w-16 pr-2 flex justify-end">
                <div className="h-2 w-2 rounded-full bg-red-500"></div>
              </div>
              <div className="flex-1 h-[1px] bg-red-500"></div>
            </div>
          )}
          
          {/* Events for each day */}
          {daysOfWeek.map((day, dayIndex) => {
            const timedEvents = getTimedEventsForDay(day);
            // Calculate width and position based on the container width
            // Each day takes 1/7 of the available width (minus the time column)
            const dayWidth = `calc((100% - 4rem) / 7)`;
            const dayLeft = `calc(4rem + (${dayIndex} * ${dayWidth}))`;
            
            return timedEvents.map((event) => {
              // Use original event style calculation
              const eventStyle = getEventStyle(event);
              
              return (
                <div 
                  key={`${dayIndex}-${event.id}`}
                  className="absolute rounded-md border shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                  style={{
                    ...eventStyle,
                    left: dayLeft,
                    width: `calc(${dayWidth} - 6px)`
                  }}
                  onClick={() => onEventClick && onEventClick(event)}
                  onMouseEnter={(e) => showTooltip(
                    <>
                      <div className="font-medium">{event.title}</div>
                      <div className="text-gray-300">
                        {formatEventTime(event.start)} - {formatEventTime(event.end)}
                      </div>
                      {event.description && <div className="mt-1">{event.description}</div>}
                      <div className="mt-1 text-gray-300">{formatEventDate(event.start)}</div>
                    </>,
                    e
                  )}
                  onMouseLeave={hideTooltip}
                >
                  <div className={`h-full p-1 ${event.type === 'reminder' ? 'bg-amber-50' : 'bg-blue-50'}`}>
                    <div className="font-medium text-xs truncate">{event.title}</div>
                    <div className="text-xs text-gray-600 truncate">
                      {formatEventTime(event.start)}
                    </div>
                  </div>
                </div>
              );
            });
          })}
        </div>
      </div>
    </div>
  );
}
