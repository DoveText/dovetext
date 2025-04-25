'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ScheduleEvent } from './Calendar';
import { PlusIcon } from '@heroicons/react/24/outline';

interface DayViewProps {
  date: Date;
  events: ScheduleEvent[];
  onEventClick?: (event: ScheduleEvent) => void;
  onAddEvent?: (date: Date, event?: ScheduleEvent) => void;
  currentTime: Date;
  onEventDrop?: (event: ScheduleEvent, newStart: Date, newEnd: Date) => void;
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

export default function DayView({ date, events, onEventClick, onAddEvent, currentTime, onEventDrop }: DayViewProps) {
  const timeSlots = generateTimeSlots();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [selectionStart, setSelectionStart] = useState<{hour: number, minute: number} | null>(null);
  const [hoverSlot, setHoverSlot] = useState<{hour: number, minute: number} | null>(null);
  const [isMouseOverCalendar, setIsMouseOverCalendar] = useState(false);
  
  // Tooltip state
  const [tooltipContent, setTooltipContent] = useState<React.ReactNode | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Function to get time slot from mouse position
  const getTimeSlotFromMouseEvent = (e: React.MouseEvent) => {
    const calendarRect = scrollContainerRef.current?.getBoundingClientRect();
    if (!calendarRect) return null;
    
    // Calculate the relative position within the calendar
    const relativeY = e.clientY - calendarRect.top + (scrollContainerRef.current?.scrollTop || 0);
    
    // Calculate hour and minute
    const hour = Math.floor(relativeY / 60);
    const minutePosition = relativeY % 60;
    
    let minute = 0;
    if (minutePosition < 15) minute = 0;
    else if (minutePosition < 30) minute = 15;
    else if (minutePosition < 45) minute = 30;
    else minute = 45;
    
    return { hour, minute };
  };
  
  // Scroll to current time on mount
  useEffect(() => {
    if (scrollContainerRef.current && date.toDateString() === new Date().toDateString()) {
      const currentHour = currentTime.getHours();
      const scrollTop = currentHour * 60 - 100; // 60px per hour, offset by 100px to show a bit of context
      scrollContainerRef.current.scrollTop = scrollTop > 0 ? scrollTop : 0;
    }
  }, [date, currentTime]);
  
  // Function to handle click on the calendar container (for single click event creation)
  const handleCalendarClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.z-10')) {
      // Clicked on an event, don't start selection
      return;
    }

    // Only process if we have an add event handler and we're not in selection mode
    if (!onAddEvent || selectionStart != null) return;
    
    const timeSlot = getTimeSlotFromMouseEvent(e);
    if (!timeSlot) return;
    
    // Create the event date
    const newDate = new Date(date);
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
  }, [onAddEvent, selectionStart, date]);

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
    
    // For reminders, we only care about the start time
    if (event.type === 'reminder') {
      const top = (startHour + startMinute / 60) * 60;
      
      // For reminders, we'll return positioning only
      // The actual styling will be handled in the JSX with two parts
      return {
        top: `${top}px`,
        height: 'auto', // Will be determined by content
        width: 'calc(100% - 16px)', // Not full width
        marginLeft: '8px', // Centered
        display: 'flex',
        flexDirection: 'column' as const,
        backgroundColor: 'transparent', // No background at container level
        boxShadow: 'none' // No shadow at container level
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
    
    // For events, we'll return positioning only
    // The actual styling will be handled in the JSX with two parts
    return {
      top: `${top}px`,
      height: `${height}px`,
      width: 'calc(100% - 16px)', // Not full width
      marginLeft: '8px', // Centered
      display: 'flex',
      flexDirection: 'column' as const,
      backgroundColor: 'transparent', // No background at container level
      boxShadow: 'none' // No shadow at container level
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
  const handleDrop = (event: React.DragEvent, hour: number) => {
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
    const newStart = new Date(date);
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
  
  // Tooltip functions
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
    if(!hoverSlot) {
      return 0;
    }

    if(!selectionStart) {
      return hoverSlot.hour * 60 + hoverSlot.minute;
    }

    if(selectionStart.hour < hoverSlot.hour || selectionStart.hour === hoverSlot.hour && selectionStart.minute < hoverSlot.minute) {
      return selectionStart.hour * 60 + selectionStart.minute;
    }
    else {
      return hoverSlot.hour * 60 + hoverSlot.minute;
    }
  }, [hoverSlot, selectionStart])

  const getSelectionMinutes = useCallback(() => {
    if(!hoverSlot || !selectionStart) {
      return 0;
    }

    return Math.abs((hoverSlot.hour * 60 + hoverSlot.minute) - (selectionStart.hour * 60 + selectionStart.minute)) + 15;
  }, [hoverSlot, selectionStart])

  const getSelectionTimeSlotRange = useCallback(() => {
    if(!selectionStart || !hoverSlot) {
      return '';
    }

    let startTime = ''
    let endHour = 0;
    let endMinute = 0;

    if(selectionStart.hour < hoverSlot.hour || selectionStart.hour === hoverSlot.hour && selectionStart.minute < hoverSlot.minute) {
      startTime = formatTimeSlot(selectionStart?.hour, selectionStart.minute);

      // Calculate end time (15 minutes later)
      endHour = hoverSlot.hour;
      endMinute = hoverSlot.minute + 15;
    }
    else {
      startTime = formatTimeSlot(hoverSlot?.hour, hoverSlot.minute);

      // Calculate end time (15 minutes later)
      let endHour = selectionStart.hour;
      let endMinute = selectionStart.minute + 15;
    }

    if (endMinute >= 60) {
      endHour += 1;
      endMinute = 0;
    }

    const endTime = formatTimeSlot(endHour, endMinute);

    return `${startTime} - ${endTime}`;
  }, [hoverSlot, selectionStart])

  return (
    <div 
      className="flex flex-col h-full overflow-hidden"
      onMouseEnter={() => setIsMouseOverCalendar(true)}
      onMouseLeave={() => {
        setIsMouseOverCalendar(false);
        setHoverSlot(null);
        setSelectionStart(null);
        hideTooltip();
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
                onMouseEnter={(e) => showTooltip(
                  <>
                    <div className="font-bold">{event.title}</div>
                    <div>{formatEventDate(event.start)}</div>
                    {event.description && <div className="mt-1">{event.description}</div>}
                    {event.location && <div className="mt-1">📍 {event.location}</div>}
                  </>,
                  e
                )}
                onMouseLeave={hideTooltip}
              >
                <div className="font-medium truncate">{event.title}</div>
                {event.location && <div className="text-xs text-gray-500 truncate">{event.location}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Timed events */}
      <div 
        className="flex-1 overflow-y-auto cursor-pointer"
        ref={scrollContainerRef}
        onClick={handleCalendarClick}
        onMouseEnter={() => setIsMouseOverCalendar(true)}
        onMouseLeave={() => {
          setIsMouseOverCalendar(false);
          setHoverSlot(null);
        }}
        onMouseMove={(e) => {
          // Get time slot from mouse position
          const timeSlot = getTimeSlotFromMouseEvent(e);
          if (!timeSlot) return;
          
          // Update hover slot
          setHoverSlot(timeSlot);
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
          
          console.log('Mouse down on calendar', timeSlot);
          
          // Start selection
          setSelectionStart(timeSlot);
        }}
        onMouseUp={(e) => {
          // Only process if we're in selection mode
          if (!selectionStart || !hoverSlot || !onAddEvent) return;
          
          console.log('Mouse up on calendar', selectionStart, hoverSlot);
          
          // Calculate start and end times
          const startDate = new Date(date);
          const endDate = new Date(date);

          /**
           * Decide which one is start, which one is end
           */
          if(hoverSlot.hour > selectionStart.hour || (hoverSlot.hour === selectionStart.hour && hoverSlot.minute > selectionStart.minute)){
            startDate.setHours(selectionStart.hour, selectionStart.minute, 0, 0);
            endDate.setHours(hoverSlot.hour, hoverSlot.minute, 0, 0);
          }
          else{
            startDate.setHours(hoverSlot.hour, hoverSlot.minute, 0, 0);
            endDate.setHours(selectionStart.hour, selectionStart.minute, 0, 0);
          }

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
        }}
      >
        <div className="relative min-h-[1440px]"> {/* 24 hours * 60px per hour */}
          {/* Time slots */}
          {timeSlots.map((slot) => (
            <div key={slot.hour} className="flex h-[60px] border-b border-gray-100">
              <div className="w-16 pr-2 pt-[12px] text-right text-xs text-gray-500 -mt-2">
                {slot.label}
              </div>
              <div 
                className="flex-1 relative border-l border-solid border-gray-200 time-slot cursor-pointer"
                data-hour={slot.hour}
              >
                {/* 15-minute interval line */}
                <div className="absolute left-0 right-0 top-[15px] border-t border-dashed border-gray-200"></div>
                {/* 30-minute interval line - solid */}
                <div className="absolute left-0 right-0 top-[30px] border-t border-solid border-gray-200"></div>
                {/* 45-minute interval line */}
                <div className="absolute left-0 right-0 top-[45px] border-t border-dashed border-gray-200"></div>
                
                <div 
                  className="absolute left-0 top-0 h-full w-full flex items-center justify-center"
                  style={{ pointerEvents: 'none' }} // Prevent this from capturing mouse events
                >
                  <PlusIcon className="h-5 w-5 text-blue-500 opacity-0 hover:opacity-100" />
                </div>
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
          
          {/* Hover highlight */}
          {hoverSlot && !selectionStart && isMouseOverCalendar && (
            <div
              className="absolute left-16 right-2 bg-blue-50 opacity-50 rounded-md border border-blue-200 z-0"
              style={{
                top: `${hoverSlot.hour * 60 + hoverSlot.minute}px`,
                height: '15px'
              }}
            >
              <div className="absolute right-2 top-0 text-xs text-blue-600 font-medium">
                {getTimeSlotRange(hoverSlot.hour, hoverSlot.minute)}
              </div>
            </div>
          )}
          
          {/* Selection highlight */}
          {selectionStart && hoverSlot && (
            <div
              className="absolute left-16 right-2 bg-blue-100 opacity-70 rounded-md border border-blue-300 z-0"
              style={{
                top: `${getSelectionStartMinutes()}px`,
                height: `${getSelectionMinutes()}px`
              }}
            >
              <div className="absolute right-2 top-0 text-xs text-blue-600 font-medium">
                {getSelectionTimeSlotRange()}
              </div>
            </div>
          )}

          {/* Events */}
          {timedEvents.map((event) => (
              <div
                  key={event.id}
                  className="absolute left-16 right-2 overflow-visible cursor-pointer hover:shadow-md transition-shadow z-10"
                  style={getEventStyle(event)}
                  onClick={() => onEventClick && onEventClick(event)}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, event)}
                  onMouseEnter={(e) => showTooltip(
                    <>
                      <div className="font-bold">{event.title}</div>
                      <div>{formatEventDate(event.start)} {formatEventTime(event.start)} - {formatEventTime(event.end)}</div>
                      {event.description && <div className="mt-1">{event.description}</div>}
                      {event.location && <div className="mt-1">📍 {event.location}</div>}
                    </>,
                    e
                  )}
                  onMouseLeave={hideTooltip}
                >
                {/* Time indicator (full width) */}
                {event.type === 'reminder' ? (
                  <div className="w-full h-0.5 bg-amber-500"></div>
                ) : (
                  <div 
                    className="w-full bg-blue-500 rounded-sm"
                    style={{
                      height: `${(event.end.getHours() * 60 + event.end.getMinutes()) - (event.start.getHours() * 60 + event.start.getMinutes())}px`
                    }}
                  ></div>
                )}
                
                {/* Title/icon part positioned with margins */}
                <div 
                  className={`
                    absolute top-0.5 left-3 right-5
                    px-2 py-0.5 flex items-center
                    ${event.type === 'reminder' ? 'bg-amber-50 border border-amber-200' : 'bg-blue-50 border border-blue-200'}
                    rounded-md shadow-sm
                  `}
                  style={{
                    minHeight: '20px'
                  }}
                >
                  {/* Icon */}
                  {event.type === 'reminder' ? 
                    <span className="mr-1 text-amber-500 flex-shrink-0 text-xs">⏰</span> : 
                    <span className="mr-1 text-blue-500 flex-shrink-0 text-xs">📅</span>
                  }
                  
                  {/* Title */}
                  <div className="font-medium text-xs truncate">{event.title}</div>
                  
                  {/* Start time */}
                  <div className="text-xs text-gray-600 ml-1 flex-shrink-0">
                    {formatEventTime(event.start)}
                  </div>
                </div>
              </div>
          ))}
        </div>
      </div>
    </div>
  );
}
