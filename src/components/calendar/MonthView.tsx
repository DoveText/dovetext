'use client';

import { useState, useEffect, useRef } from 'react';
import { ScheduleEvent } from './Calendar';
import { PlusIcon } from '@heroicons/react/24/outline';
import { createPortal } from 'react-dom';
import Tooltip from '../common/Tooltip';

interface MonthViewProps {
  date: Date;
  events: ScheduleEvent[];
  onEventClick?: (event: ScheduleEvent) => void;
  onDateClick?: (date: Date) => void;
  onAddEvent?: (date: Date) => void;
  currentTime: Date;
  onEventDrop?: (event: ScheduleEvent, newStart: Date, newEnd: Date) => void;
}

// Get days for the month view (includes days from prev/next months to fill the grid)
const getDaysInMonthView = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  
  // First day of the month
  const firstDay = new Date(year, month, 1);
  // Last day of the month
  const lastDay = new Date(year, month + 1, 0);
  
  // Get the day of the week for the first day (0 = Sunday, 6 = Saturday)
  const firstDayOfWeek = firstDay.getDay();
  
  // Calculate days from previous month to include
  const daysFromPrevMonth = firstDayOfWeek;
  
  // Calculate days from next month to include (to fill a 6-row grid)
  const totalDaysInGrid = 42; // 6 rows of 7 days
  const daysFromNextMonth = totalDaysInGrid - lastDay.getDate() - daysFromPrevMonth;
  
  // Get the days from the previous month
  const prevMonthDays = [];
  if (daysFromPrevMonth > 0) {
    const prevMonth = new Date(year, month, 0);
    const prevMonthLastDay = prevMonth.getDate();
    
    for (let i = prevMonthLastDay - daysFromPrevMonth + 1; i <= prevMonthLastDay; i++) {
      prevMonthDays.push(new Date(year, month - 1, i));
    }
  }
  
  // Get the days from the current month
  const currentMonthDays = [];
  for (let i = 1; i <= lastDay.getDate(); i++) {
    currentMonthDays.push(new Date(year, month, i));
  }
  
  // Get the days from the next month
  const nextMonthDays = [];
  for (let i = 1; i <= daysFromNextMonth; i++) {
    nextMonthDays.push(new Date(year, month + 1, i));
  }
  
  // Combine all days
  return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
};

export default function MonthView({ date, events, onEventClick, onDateClick, onAddEvent, currentTime, onEventDrop }: MonthViewProps) {
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
  const daysInMonth = getDaysInMonthView(date);
  
  // Check if a day is today
  const isToday = (day: Date) => {
    return day.getDate() === currentTime.getDate() &&
           day.getMonth() === currentTime.getMonth() &&
           day.getFullYear() === currentTime.getFullYear();
  };
  
  // Check if a day is in the current month
  const isCurrentMonth = (day: Date) => {
    return day.getMonth() === date.getMonth();
  };
  
  // Filter events for a specific day
  const getEventsForDay = (day: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate.getDate() === day.getDate() &&
             eventDate.getMonth() === day.getMonth() &&
             eventDate.getFullYear() === day.getFullYear();
    });
  };
  
  // Get event background color based on type
  const getEventColor = (type: string, isAllDay: boolean = false) => {
    if (isAllDay) {
      return 'bg-green-100 text-green-800 border-green-200';
    }
    
    switch (type) {
      case 'event':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'reminder':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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
  
  // Handle drag start
  const handleDragStart = (event: React.DragEvent, scheduleEvent: ScheduleEvent) => {
    event.dataTransfer.setData('text/plain', JSON.stringify({
      id: scheduleEvent.id,
      eventType: scheduleEvent.type,
      duration: scheduleEvent.end.getTime() - scheduleEvent.start.getTime(),
      isAllDay: scheduleEvent.isAllDay
    }));
    event.dataTransfer.effectAllowed = 'move';
  };
  
  // Handle drag over
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };
  
  // Handle drop
  const handleDrop = (event: React.DragEvent, day: Date) => {
    event.preventDefault();
    const data = JSON.parse(event.dataTransfer.getData('text/plain'));
    
    if (!data.id || !onEventDrop) return;
    
    // Find the original event
    const originalEvent = events.find(e => e.id === data.id);
    if (!originalEvent) return;
    
    // Calculate new start and end times
    const newStart = new Date(day);
    // Keep the same time for the event
    newStart.setHours(
      originalEvent.start.getHours(),
      originalEvent.start.getMinutes(),
      0,
      0
    );
    
    const newEnd = new Date(newStart.getTime() + data.duration);
    
    // Call the onEventDrop handler
    onEventDrop(originalEvent, newStart, newEnd);
  };

  return (
    <div className="h-full overflow-y-auto">
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
      {/* Weekday headers */}
      <div className="grid grid-cols-7 text-center py-2 border-b">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
          <div key={index} className="text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 auto-rows-fr border-b" style={{ minHeight: '600px' }}>
        {daysInMonth.map((day, index) => {
          const dayEvents = getEventsForDay(day);
          const maxEventsToShow = 3;
          const remainingEvents = dayEvents.length - maxEventsToShow;
          
          // Determine if this is the last day of a week (Saturday)
          const isLastDayOfWeek = index % 7 === 6;
          // Determine if this is the last row
          const isLastRow = index >= 35;
          
          return (
            <div 
              key={index} 
              className={`
                min-h-[140px] border-r p-1
                ${isLastDayOfWeek ? 'border-r-0' : ''}
                ${isLastRow ? '' : 'border-b-2 border-b-gray-200'}
                ${isCurrentMonth(day) 
                  ? isToday(day) 
                    ? 'bg-blue-50' 
                    : 'bg-white' 
                  : 'bg-gray-50 text-gray-400'
                }
              `}
              onClick={() => onDateClick && onDateClick(day)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, day)}
            >
              <div className="flex justify-between items-center mb-1 min-h-[24px]">
                <span className={`text-sm font-medium ${isToday(day) ? 'bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''}`}>
                  {day.getDate()}
                </span>
                {isCurrentMonth(day) && (
                  <button 
                    className="text-blue-500 opacity-0 hover:opacity-100 focus:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onAddEvent) {
                        const newDate = new Date(day);
                        newDate.setHours(9, 0, 0, 0); // Default to 9 AM
                        onAddEvent(newDate);
                      }
                    }}
                  >
                    <PlusIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
              
              {/* Events */}
              <div className="space-y-1">
                {dayEvents.slice(0, maxEventsToShow).map((event) => (
                  <div 
                    key={event.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick && onEventClick(event);
                    }}
                    className={`px-1 py-0.5 text-xs rounded cursor-pointer truncate border ${getEventColor(event.type, event.isAllDay)} w-full`}
                    onMouseEnter={(e) => showTooltip(
                      <>
                        <div className="font-medium">{event.title}</div>
                        {event.description && <div className="mt-1">{event.description}</div>}
                        <div className="mt-1 text-gray-300">
                          {event.isAllDay 
                            ? `All day: ${formatEventDate(event.start)}` 
                            : `${formatEventTime(event.start)} - ${formatEventTime(event.end)}, ${formatEventDate(event.start)}`
                          }
                        </div>
                      </>, 
                      e
                    )}
                    onMouseLeave={hideTooltip}
                    draggable={true}
                    onDragStart={(e) => {
                      e.stopPropagation();
                      handleDragStart(e, event);
                    }}
                  >
                    <div className="flex w-full truncate">
                      {/* Icon based on event type */}
                      {event.type === 'reminder' ? (
                        <span className="mr-1 text-amber-500 flex-shrink-0 text-xs">⏰</span>
                      ) : event.isAllDay ? (
                        <span className="mr-1 text-green-500 flex-shrink-0 text-xs">📆</span>
                      ) : (
                        <span className="mr-1 text-blue-500 flex-shrink-0 text-xs">📅</span>
                      )}
                      
                      {/* Time (for non-all-day events) */}
                      {!event.isAllDay && (
                        <span className="mr-1 flex-shrink-0">{formatEventTime(event.start)}</span>
                      )}
                      
                      {/* Event title */}
                      <span className="truncate">{event.title}</span>
                    </div>
                  </div>
                ))}
                
                {/* Show indicator for additional events */}
                {remainingEvents > 0 && (
                  <div 
                    className="text-xs text-gray-500 pl-1 cursor-pointer hover:text-blue-500 w-full"
                    onMouseEnter={(e) => showTooltip(
                      `${remainingEvents} more event${remainingEvents > 1 ? 's' : ''} on ${formatEventDate(day)}`,
                      e
                    )}
                    onMouseLeave={hideTooltip}
                  >
                    +{remainingEvents} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
