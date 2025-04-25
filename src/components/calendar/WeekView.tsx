'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ScheduleEvent } from './Calendar';
import { PlusIcon } from '@heroicons/react/24/outline';
import { createPortal } from 'react-dom';
import Tooltip from '../common/Tooltip';

interface WeekViewProps {
  date: Date;
  events: ScheduleEvent[];
  onEventClick?: (event: ScheduleEvent) => void;
  onDateClick?: (date: Date) => void;
  onAddEvent?: (date: Date, event?: ScheduleEvent) => void;
  currentTime: Date;
  onEventDrop?: (event: ScheduleEvent, newStart: Date, newEnd: Date) => void;
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

// Calculate time from y-position
const getTimeFromPosition = (y: number, containerTop: number) => {
  const relativeY = y - containerTop;
  const hourHeight = 60;
  
  // Calculate the hour part (0 for positions within the first hour slot)
  const hours = 0;
  
  // Calculate minutes based on position within the hour slot (0, 15, 30, 45)
  const minutePosition = relativeY % hourHeight;
  let minutes = 0;
  
  if (minutePosition < 15) {
    minutes = 0;
  } else if (minutePosition < 30) {
    minutes = 15;
  } else if (minutePosition < 45) {
    minutes = 30;
  } else {
    minutes = 45;
  }
  
  return { hours, minutes };
};

// Format time for display
const formatTimeSlot = (hour: number, minute: number) => {
  const hourDisplay = hour % 12 === 0 ? 12 : hour % 12;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const minuteDisplay = minute.toString().padStart(2, '0');
  return `${hourDisplay}:${minuteDisplay} ${ampm}`;
};

// Get time slot range string
const getTimeSlotRange = (hour: number, minute: number) => {
  const startTime = formatTimeSlot(hour, minute);
  
  // Calculate end time (15 minutes later)
  let endHour = hour;
  let endMinute = minute + 15;
  
  if (endMinute >= 60) {
    endHour += 1;
    endMinute = 0;
  }
  
  const endTime = formatTimeSlot(endHour, endMinute);
  return `${startTime} - ${endTime}`;
};

export default function WeekView({ date, events, onEventClick, onDateClick, onAddEvent, currentTime, onEventDrop }: WeekViewProps) {
  const daysOfWeek = getDaysOfWeek(date);
  const timeSlots = generateTimeSlots();
  
  const [tooltipContent, setTooltipContent] = useState<React.ReactNode | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const [selectionStart, setSelectionStart] = useState<{day: Date, hour: number, minute: number} | null>(null);
  const [currentSelectionDay, setCurrentSelectionDay] = useState<Date | null>(null);
  const [hoverSlot, setHoverSlot] = useState<{day: Date, hour: number, minute: number} | null>(null);

  const [isMouseOverCalendar, setIsMouseOverCalendar] = useState(false);

  // Clean up any timeouts when component unmounts
  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
    };
  }, []);

  // Function to get time slot from mouse position
  const getTimeSlotFromMouseEvent = (e: React.MouseEvent) => {
    const calendarRect = scrollContainerRef.current?.getBoundingClientRect();
    if (!calendarRect) return null;
    
    // Calculate the relative position within the calendar
    const relativeY = e.clientY - calendarRect.top + (scrollContainerRef.current?.scrollTop || 0);
    const relativeX = e.clientX - calendarRect.left;
    
    // Calculate hour and minute
    const hour = Math.floor(relativeY / 60);
    const minutePosition = relativeY % 60;
    
    let minute = 0;
    if (minutePosition < 15) minute = 0;
    else if (minutePosition < 30) minute = 15;
    else if (minutePosition < 45) minute = 30;
    else minute = 45;
    
    // Calculate day index based on X position
    // First column (4rem) is for time labels, the rest is divided among 7 days
    const timeColumnWidth = 64; // 4rem in pixels
    const dayWidth = (calendarRect.width - timeColumnWidth) / 7;
    
    // Ensure we're in the day area, not in the time column
    if (relativeX <= timeColumnWidth) return null;
    
    const dayIndex = Math.floor((relativeX - timeColumnWidth) / dayWidth);
    if (dayIndex < 0 || dayIndex >= 7) return null;
    
    // Get the day based on the calculated index
    const day = daysOfWeek[dayIndex];
    
    return { day, hour, minute };
  };
  
  // Scroll to current time on mount
  useEffect(() => {
    if (scrollContainerRef.current && new Date().toDateString() === currentTime.toDateString()) {
      const currentHour = currentTime.getHours();
      const scrollTop = currentHour * 60 - 100; // 60px per hour, offset by 100px to show a bit of context
      scrollContainerRef.current.scrollTop = scrollTop > 0 ? scrollTop : 0;
    }
  }, [currentTime]);

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
    
    // For reminders, we only care about the start time
    if (event.type === 'reminder') {
      const top = (startHour + startMinute / 60) * 60;
      
      return {
        top: `${top}px`,
        height: '24px', // Compact height for reminders
        width: 'calc(100% - 16px)', // Not full width to indicate it's a point event
        marginLeft: '8px', // Centered
        backgroundColor: event.color || getEventColor('reminder'),
        borderLeft: '4px solid #f59e0b', // Amber border to distinguish reminders
        borderRadius: '12px', // Pill shape to indicate point-in-time
        display: 'flex',
        alignItems: 'center',
        boxShadow: '0 1px 2px rgba(0,0,0,0.1)' // Subtle shadow for depth
      };
    }
    
    // For regular events
    const endHour = event.end.getHours();
    const endMinute = event.end.getMinutes();

    // Calculate duration in minutes
    const durationMinutes = 
      ((endHour * 60 + endMinute) - (startHour * 60 + startMinute));
    
    const top = (startHour + startMinute / 60) * 60;
    
    // If event is 15 minutes or less, make it exactly 15 minutes tall
    // Otherwise, use the actual duration
    const height = durationMinutes <= 15 ? 15 : durationMinutes / 60 * 60;

    return {
      top: `${top}px`,
      height: `${height}px`,
      width: 'calc(100% - 16px)', // Match reminder width
      marginLeft: '8px', // Centered like reminders
      backgroundColor: event.color || getEventColor(event.type),
      borderLeft: '4px solid #3b82f6', // Blue border for events (vs amber for reminders)
      borderRadius: '6px', // Slightly less rounded than reminders
      boxShadow: '0 1px 2px rgba(0,0,0,0.1)' // Same subtle shadow as reminders
    };
  };

  // Handle drag start
  const handleDragStart = (event: React.DragEvent, scheduleEvent: ScheduleEvent) => {
    event.dataTransfer.setData('text/plain', JSON.stringify({
      id: scheduleEvent.id,
      eventType: scheduleEvent.type,
      duration: scheduleEvent.end.getTime() - scheduleEvent.start.getTime()
    }));
    event.dataTransfer.effectAllowed = 'move';
  };

  // Handle drag over
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  // Handle drop
  const handleDrop = (event: React.DragEvent, day: Date, hour: number) => {
    event.preventDefault();
    const data = JSON.parse(event.dataTransfer.getData('text/plain'));

    if (!data.id || !onEventDrop) return;

    const timeSlotElement = event.currentTarget as HTMLElement;
    const rect = timeSlotElement.getBoundingClientRect();
    const { hours, minutes } = getTimeFromPosition(event.clientY, rect.top);

    // Find the original event
    const originalEvent = events.find(e => e.id === data.id);
    if (!originalEvent) return;

    // Calculate new start and end times
    const newStart = new Date(day);
    newStart.setHours(hour, minutes, 0, 0);

    const newEnd = new Date(newStart.getTime() + data.duration);

    // Call the onEventDrop handler
    onEventDrop(originalEvent, newStart, newEnd);
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

  const getSelectionStartMinutes = useCallback(() => {
    if(!hoverSlot || !selectionStart || !currentSelectionDay || hoverSlot.day.getTime() !== currentSelectionDay.getTime()) {
      return 0;
    }

    if(selectionStart.hour < hoverSlot.hour || selectionStart.hour === hoverSlot.hour && selectionStart.minute < hoverSlot.minute) {
      return selectionStart.hour * 60 + selectionStart.minute;
    }
    else {
      return hoverSlot.hour * 60 + hoverSlot.minute;
    }
  }, [hoverSlot, selectionStart, currentSelectionDay]);

  const getSelectionMinutes = useCallback(() => {
    if(!hoverSlot || !selectionStart || !currentSelectionDay || hoverSlot.day.getTime() !== currentSelectionDay.getTime()) {
      return 0;
    }

    return Math.abs((hoverSlot.hour * 60 + hoverSlot.minute) - (selectionStart.hour * 60 + selectionStart.minute)) + 15;
  }, [hoverSlot, selectionStart, currentSelectionDay]);

  const getSelectionTimeSlotRange = useCallback(() => {
    if(!selectionStart || !hoverSlot || !currentSelectionDay || hoverSlot.day.getTime() !== currentSelectionDay.getTime()) {
      return '';
    }

    let startTime = '';
    let endHour = 0;
    let endMinute = 0;

    if(selectionStart.hour < hoverSlot.hour || (selectionStart.hour === hoverSlot.hour && selectionStart.minute < hoverSlot.minute)) {
      startTime = formatTimeSlot(selectionStart.hour, selectionStart.minute);

      // Calculate end time
      endHour = hoverSlot.hour;
      endMinute = hoverSlot.minute + 15;
    }
    else {
      startTime = formatTimeSlot(hoverSlot.hour, hoverSlot.minute);

      // Calculate end time
      endHour = selectionStart.hour;
      endMinute = selectionStart.minute + 15;
    }

    if (endMinute >= 60) {
      endHour += 1;
      endMinute = 0;
    }

    const endTime = formatTimeSlot(endHour, endMinute);

    return `${startTime} - ${endTime}`;
  }, [hoverSlot, selectionStart, currentSelectionDay]);

  return (
    <div className="flex flex-col h-full"
         onMouseEnter={() => setIsMouseOverCalendar(true)}
         onMouseLeave={() => {
           setIsMouseOverCalendar(false);
           setHoverSlot(null);
           setSelectionStart(null);
           setCurrentSelectionDay(null);
         }}
    >
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
      <div 
        className="flex-1 overflow-y-auto cursor-pointer" 
        ref={scrollContainerRef}
        onMouseEnter={() => setIsMouseOverCalendar(true)}
        onMouseLeave={() => {
          setIsMouseOverCalendar(false);
          setHoverSlot(null);
        }}
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest('.z-10')) {
            // Clicked on an event, don't start selection
            return;
          }

          // Only process if we have an add event handler and we're not in selection mode
          if (!onAddEvent || selectionStart !== null) return;
          
          const timeSlot = getTimeSlotFromMouseEvent(e);
          if (!timeSlot) return;
          
          // Create the event date
          const newDate = new Date(timeSlot.day);
          newDate.setHours(timeSlot.hour, timeSlot.minute, 0, 0);
          
          // Create end date 15 minutes later
          const endDate = new Date(newDate);
          endDate.setMinutes(endDate.getMinutes() + 15);
          
          // Create a temporary event object
          const tempEvent: ScheduleEvent = {
            id: '',
            title: '',
            start: newDate,
            end: endDate,
            isAllDay: false,
            type: 'event'
          };
          
          onAddEvent(newDate, tempEvent);
        }}
        onMouseMove={(e) => {
          // Get time slot from mouse position
          const timeSlot = getTimeSlotFromMouseEvent(e);
          if (!timeSlot) return;
          
          // Update hover slot
          setHoverSlot(timeSlot);
          
          // Prevent text selection during drag if we're selecting
          if (selectionStart && currentSelectionDay?.getTime() === timeSlot.day.getTime()) {
            e.preventDefault();
          }
        }}
        onMouseDown={(e) => {
          // Prevent default to avoid text selection
          e.preventDefault();
          
          // Check if we clicked on an event by checking the target's class list
          // If the target or any parent has z-10 class, it's an event (events have z-10)
          const target = e.target as HTMLElement;
          if (target.closest('.z-10')) {
            // Clicked on an event, don't start selection
            return;
          }
          
          // Get time slot from mouse position
          const timeSlot = getTimeSlotFromMouseEvent(e);
          if (!timeSlot) return;
          
          console.log('Mouse down on week calendar', timeSlot);
          
          // Start selection
          setSelectionStart(timeSlot);
          setCurrentSelectionDay(timeSlot.day);
        }}
        onMouseUp={(e) => {
          // Only process if we're in selection mode
          if (!selectionStart || !hoverSlot || !onAddEvent || !currentSelectionDay) return;
          
          console.log('Mouse up on week calendar', { selectionStart, hoverSlot });
          
          // Calculate start and end times
          const startDate = new Date(currentSelectionDay);
          const endDate = new Date(currentSelectionDay);
          
          // Decide which one is start, which one is end
          if (hoverSlot.hour > selectionStart.hour || (hoverSlot.hour === selectionStart.hour && hoverSlot.minute > selectionStart.minute)) {
            startDate.setHours(selectionStart.hour, selectionStart.minute, 0, 0);
            endDate.setHours(hoverSlot.hour, hoverSlot.minute, 0, 0);
          } else {
            startDate.setHours(hoverSlot.hour, hoverSlot.minute, 0, 0);
            endDate.setHours(selectionStart.hour, selectionStart.minute, 0, 0);
          }
          
          // Add 15 minutes to end time
          endDate.setMinutes(endDate.getMinutes() + 15);
          
          console.log('Creating event from selection', { startDate, endDate });
          
          // Create a temporary event object for the selection
          const tempEvent: ScheduleEvent = {
            id: '',
            title: '',
            start: startDate,
            end: endDate,
            isAllDay: false,
            type: 'event'
          };
          
          // Call the onAddEvent handler with the selected time range
          onAddEvent(startDate, tempEvent);
          
          // Reset selection
          setSelectionStart(null);
          setCurrentSelectionDay(null);
        }}
        onDragOver={handleDragOver}
      >
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
                    className={`flex-1 relative ${dayIndex < 6 ? 'border-r border-solid' : ''} ${isToday(day) ? 'bg-blue-50' : ''} time-slot cursor-pointer`}
                    data-hour={slot.hour}
                    data-day-index={dayIndex}
                  >
                    {/* 15-minute interval line */}
                    <div className="absolute left-0 right-0 top-[15px] border-t border-dashed border-gray-200"></div>
                    {/* 30-minute interval line - solid */}
                    <div className="absolute left-0 right-0 top-[30px] border-t border-solid border-gray-200"></div>
                    {/* 45-minute interval line */}
                    <div className="absolute left-0 right-0 top-[45px] border-t border-dashed border-gray-200"></div>
                    
                    <div className="absolute left-0 top-0 h-full w-full flex items-center justify-center">
                      <PlusIcon className="h-5 w-5 text-blue-500 opacity-0 hover:opacity-100" />
                    </div>
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
          
          {/* Hover highlight */}
          {hoverSlot && !selectionStart && isMouseOverCalendar && (
            <div
              className="absolute bg-blue-50 opacity-50 rounded-md border border-blue-200 z-0"
              style={{
                top: `${hoverSlot.hour * 60 + hoverSlot.minute}px`,
                height: '15px',
                left: `calc(4rem + (${daysOfWeek.findIndex(d => d.getTime() === hoverSlot.day.getTime())} * calc((100% - 4rem) / 7)))`,
                width: `calc((100% - 4rem) / 7 - 6px)`
              }}
            >
              <div className="absolute right-2 top-0 text-xs text-blue-600 font-medium">
                {getTimeSlotRange(hoverSlot.hour, hoverSlot.minute)}
              </div>
            </div>
          )}
          
          {/* Selection highlight */}
          {selectionStart && hoverSlot && currentSelectionDay && hoverSlot.day.getTime() === currentSelectionDay.getTime() && (
            <div
              className="absolute bg-blue-100 opacity-70 rounded-md border border-blue-300 z-0"
              style={{
                top: `${getSelectionStartMinutes()}px`,
                height: `${getSelectionMinutes()}px`,
                left: `calc(4rem + (${daysOfWeek.findIndex(d => d.getTime() === currentSelectionDay.getTime())} * calc((100% - 4rem) / 7)))`,
                width: `calc((100% - 4rem) / 7 - 6px)`
              }}
            >
              <div className="absolute right-2 top-0 text-xs text-blue-600 font-medium">
                {getSelectionTimeSlotRange()}
              </div>
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
                  className="absolute rounded-md border shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow z-10"
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
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, event)}
                >
                  {/* Two-part display: Header (tag) and Body */}
                  
                  {/* Part 1: Header/Tag - Fixed height with title and icon */}
                  <div className={`
                    ${event.type === 'reminder' ? 'bg-amber-50 border-l-4 border-amber-500' : 'bg-blue-50 border-l-4 border-blue-500'}
                    h-6 rounded-t-md px-2 py-0 flex items-center z-10 shadow-sm
                  `}>
                    {event.type === 'reminder' ? 
                      <span className="mr-1 text-amber-500">⏰</span> : 
                      <span className="mr-1 text-blue-500">📅</span>
                    }
                    <div className="font-medium text-xs truncate flex-1">{event.title}</div>
                    <div className="text-xs text-gray-600 ml-1">
                      {formatEventTime(event.start)}
                    </div>
                  </div>
                  
                  {/* Part 2: Body - Variable height based on duration */}
                  {event.type === 'reminder' ? (
                    <div className="h-0 border-l border-r border-b border-amber-200 mx-2"></div>
                  ) : (
                    <div className={`
                      bg-blue-50/80 border-l-4 border-blue-500 border-r border-b border-blue-200
                      rounded-b-md px-2 py-1 flex-1 flex flex-col
                      ${(event.end.getHours() * 60 + event.end.getMinutes()) - (event.start.getHours() * 60 + event.start.getMinutes()) <= 15 ? 'hidden' : ''}
                    `}>
                      <div className="text-xs text-gray-600">
                        {`${formatEventTime(event.start)} - ${formatEventTime(event.end)}`}
                      </div>
                      {event.location && (
                        <div className="text-xs text-gray-500 truncate mt-1">{event.location}</div>
                      )}
                      {event.description && (event.end.getHours() * 60 + event.end.getMinutes()) - (event.start.getHours() * 60 + event.start.getMinutes()) > 30 && (
                        <div className="text-xs text-gray-500 truncate mt-1">{event.description}</div>
                      )}
                    </div>
                  )}
                </div>
              );
            });
          })}
        </div>
      </div>
    </div>
  );
}
