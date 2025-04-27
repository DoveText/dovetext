'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ScheduleEvent } from './Calendar';
import { PlusIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

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
  
  // State for pagination of events in time slots
  const [slotPagination, setSlotPagination] = useState<{ [key: string]: number }>({});
  
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
  const allDayEvents = dayEvents.filter(event => event.isAllDay);
  
  // Process timed events with a 30-minute granularity approach
  const processTimedEvents = () => {
    const timedEvents = dayEvents.filter(event => !event.isAllDay);
    
    // Sort events by duration (longer events first), then by start time
    const sortedEvents = [...timedEvents].sort((a: ScheduleEvent, b: ScheduleEvent) => {
      // Calculate durations
      const aDuration = a.type === 'reminder' ? 0 : a.end.getTime() - a.start.getTime();
      const bDuration = b.type === 'reminder' ? 0 : b.end.getTime() - b.start.getTime();
      
      // First by duration (longer first)
      const durationDiff = bDuration - aDuration;
      if (durationDiff !== 0) return durationDiff;
      
      // Then by start time (rounded to 30-minute slots)
      const aStartSlot = new Date(a.start);
      aStartSlot.setMinutes(Math.floor(a.start.getMinutes() / 30) * 30, 0, 0);
      
      const bStartSlot = new Date(b.start);
      bStartSlot.setMinutes(Math.floor(b.start.getMinutes() / 30) * 30, 0, 0);
      
      return aStartSlot.getTime() - bStartSlot.getTime();
    });
    
    // Group events by their starting 30-minute slot
    const halfHourSlots: { [key: string]: ScheduleEvent[] } = {};
    
    // Initialize all 30-minute slots
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const slotKey = `${hour}:${minute}`;
        halfHourSlots[slotKey] = [];
      }
    }
    
    // Assign events to their starting 30-minute slot
    sortedEvents.forEach((event: ScheduleEvent) => {
      const startHour = event.start.getHours();
      const startMinute = Math.floor(event.start.getMinutes() / 30) * 30;
      const slotKey = `${startHour}:${startMinute}`;
      
      halfHourSlots[slotKey].push(event);
    });
    
    // Process events for each 30-minute slot to assign columns
    const processedEvents: { [key: string]: (ScheduleEvent & { column: number, maxColumns: number, inFirstQuarter: boolean })[] } = {};
    
    Object.entries(halfHourSlots).forEach(([slotKey, eventsInSlot]) => {
      const eventCount = eventsInSlot.length;
      processedEvents[slotKey] = [];
      
      if (eventCount === 0) {
        // No events in this slot, nothing to do
        return;
      } else if (eventCount === 1) {
        // One event, it takes full width
        const event = eventsInSlot[0];
        // Check if event starts in the first 15 minutes of the 30-minute slot
        const inFirstQuarter = event.start.getMinutes() % 30 < 15;
        
        processedEvents[slotKey].push({
          ...event,
          column: 0,
          maxColumns: 1,
          inFirstQuarter
        });
      } else if (eventCount === 2) {
        // Two events, each takes 50% width
        eventsInSlot.forEach((event, index) => {
          // Check if event starts in the first 15 minutes of the 30-minute slot
          const inFirstQuarter = event.start.getMinutes() % 30 < 15;
          
          processedEvents[slotKey].push({
            ...event,
            column: index,
            maxColumns: 2,
            inFirstQuarter
          });
        });
      } else if (eventCount === 3) {
        // Three events, each takes 33% width
        eventsInSlot.forEach((event, index) => {
          // Check if event starts in the first 15 minutes of the 30-minute slot
          const inFirstQuarter = event.start.getMinutes() % 30 < 15;
          
          processedEvents[slotKey].push({
            ...event,
            column: index,
            maxColumns: 3,
            inFirstQuarter
          });
        });
      } else if (eventCount === 4) {
        // Four events, each takes 25% width
        eventsInSlot.forEach((event, index) => {
          // Check if event starts in the first 15 minutes of the 30-minute slot
          const inFirstQuarter = event.start.getMinutes() % 30 < 15;
          
          processedEvents[slotKey].push({
            ...event,
            column: index,
            maxColumns: 4,
            inFirstQuarter
          });
        });
      } else if (eventCount === 5) {
        // Five events, each takes 20% width
        eventsInSlot.forEach((event, index) => {
          // Check if event starts in the first 15 minutes of the 30-minute slot
          const inFirstQuarter = event.start.getMinutes() % 30 < 15;
          
          processedEvents[slotKey].push({
            ...event,
            column: index,
            maxColumns: 5,
            inFirstQuarter
          });
        });
      } else {
        // More than five events, we'll use pagination
        // For the current page, assign columns to the visible events
        const currentPage = slotPagination[slotKey] || 0;
        const startIdx = currentPage * 5;
        const visibleEvents = eventsInSlot.slice(startIdx, startIdx + 5);
        
        visibleEvents.forEach((event, index) => {
          // Check if event starts in the first 15 minutes of the 30-minute slot
          const inFirstQuarter = event.start.getMinutes() % 30 < 15;
          
          processedEvents[slotKey].push({
            ...event,
            column: index,
            maxColumns: 5,
            inFirstQuarter
          });
        });
      }
    });
    
    return {
      processedEvents,
      halfHourSlots
    };
  };
  
  // Get timed events organized by 30-minute slots with column information
  const { processedEvents: processedEventsBySlot, halfHourSlots } = processTimedEvents();
  
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
        return 'bg-blue-100';
      case 'reminder':
        return 'bg-amber-100';
      default:
        return 'bg-gray-100';
    }
  };
  
  // Get border color based on event type
  const getEventBorderColor = (type: string, isAllDay: boolean = false) => {
    if (isAllDay) {
      return 'border-green-500';
    }
    
    switch (type) {
      case 'event':
        return 'border-blue-500';
      case 'reminder':
        return 'border-amber-500';
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
                className={`px-2 py-1 rounded text-sm cursor-pointer border-l-4 ${getEventBorderColor(event.type, event.isAllDay)} bg-gray-50 hover:bg-gray-100`}
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
                <div className="font-medium truncate flex items-center">
                  <span className="mr-1 text-green-500 flex-shrink-0 text-sm">📆</span>
                  {event.title}
                </div>
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
          {Object.entries(processedEventsBySlot).map(([slotKey, eventsInSlot]) => {
            if (eventsInSlot.length === 0) return null;
            
            const [hourStr, minuteStr] = slotKey.split(':');
            const hour = parseInt(hourStr);
            const minute = parseInt(minuteStr);
            
            // Get current page for this slot
            const allEventsInSlot = halfHourSlots[slotKey] || [];
            const currentPage = slotPagination[slotKey] || 0;
            const totalPages = Math.ceil(allEventsInSlot.length / 5);
            const needsPagination = allEventsInSlot.length > 5;
            
            return (
              <React.Fragment key={slotKey}>
                {/* Pagination controls - only show if needed */}
                {needsPagination && (
                  <div 
                    className="absolute flex justify-between items-center z-20"
                    style={{
                      top: `${(hour * 60) + minute - 5}px`, // Position at the start of the 30-minute slot
                      height: '15px',
                      left: '70px',
                      width: 'calc(100% - 74px)'
                    }}
                  >
                    <button
                      className={`text-xs px-1 rounded ${currentPage > 0 ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                      disabled={currentPage === 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        if (currentPage > 0) {
                          setSlotPagination(prev => ({
                            ...prev,
                            [slotKey]: currentPage - 1
                          }));
                        }
                      }}
                    >
                      « Prev
                    </button>
                    <span className="text-xs text-gray-500">{currentPage + 1}/{totalPages}</span>
                    <button
                      className={`text-xs px-1 rounded ${currentPage < totalPages - 1 ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                      disabled={currentPage >= totalPages - 1}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        if (currentPage < totalPages - 1) {
                          setSlotPagination(prev => ({
                            ...prev,
                            [slotKey]: currentPage + 1
                          }));
                        }
                      }}
                    >
                      Next »
                    </button>
                  </div>
                )}
                
                {/* Render visible events for this slot */}
                {eventsInSlot.map((event) => {
                  // Calculate position based on time
                  const startHour = event.start.getHours();
                  const startMinute = event.start.getMinutes();
                  const top = (startHour + startMinute / 60) * 60;
                  
                  // Calculate height for events
                  let height = 'auto';
                  if (event.type !== 'reminder') {
                    const endHour = event.end.getHours();
                    const endMinute = event.end.getMinutes();
                    const durationMinutes = ((endHour * 60 + endMinute) - (startHour * 60 + startMinute));
                    height = `${Math.max(15, durationMinutes)}px`;
                  }
                  
                  // Calculate width and left position based on column
                  const totalAvailableWidth = 'calc(100% - 70px - 4px)';
                  const columnWidth = `calc((${totalAvailableWidth} / ${event.maxColumns}) - 4px)`;
                  const columnLeft = `calc((${event.column} * (${totalAvailableWidth} / ${event.maxColumns})))`;
                  
                  return (
                    <div
                      key={event.id}
                      className="absolute cursor-pointer hover:shadow-md transition-shadow z-10 hover:z-30"
                      style={{
                        top: `${top}px`,
                        height: height,
                        left: `calc(70px + ${columnLeft})`,
                        width: columnWidth,
                        marginRight: '2px'
                      }}
                      onClick={() => onEventClick && onEventClick(event)}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, event)}
                      onMouseEnter={(e) => {
                        // Don't stop propagation on mouse enter to allow parent's handlers to work
                        // This ensures the tooltip appears correctly
                        showTooltip(
                          <>
                            <div className="font-bold">{event.title}</div>
                            <div>{formatEventDate(event.start)} {formatEventTime(event.start)} - {formatEventTime(event.end)}</div>
                            {event.description && <div className="mt-1">{event.description}</div>}
                            {event.location && <div className="mt-1">📍 {event.location}</div>}
                          </>,
                          e
                        );
                      }}
                      onMouseLeave={(e) => {
                        // Don't stop propagation on mouse leave to allow parent's handlers to work
                        // This ensures the tooltip hides correctly when mouse leaves the event
                        hideTooltip();
                      }}
                    >
                      {/* Time indicator (full width) */}
                      <div 
                        className="relative w-full h-full"
                        onMouseEnter={(e) => {
                          // Show tooltip when hovering over the time indicator
                          showTooltip(
                            <>
                              <div className="font-bold">{event.title}</div>
                              <div>{formatEventDate(event.start)} {formatEventTime(event.start)} - {formatEventTime(event.end)}</div>
                              {event.description && <div className="mt-1">{event.description}</div>}
                              {event.location && <div className="mt-1">📍 {event.location}</div>}
                            </>,
                            e
                          );
                        }}
                        onMouseLeave={hideTooltip}
                      >
                        {event.type === 'reminder' ? (
                          <div className="absolute top-0 left-0 right-0 h-0.5 bg-amber-500"></div>
                        ) : (
                          <div
                              className="absolute top-0 left-0 right-0 bottom-0 bg-blue-500 rounded-sm"
                              style={{
                                border: '1px solid rgba(255, 255, 255, 0.8)'
                              }}
                          ></div>
                        )}
                        
                        {/* Title/icon part positioned with margins */}
                        <div 
                          className={`
                            absolute ${event.inFirstQuarter ? 'top-0.5' : (event.type === 'reminder' ? 'bottom-0' : 'bottom-0.5')} left-1.5
                            px-2 py-0.5 flex items-center
                            ${getEventColor(event.type)} 
                            rounded-md shadow-sm
                          `}
                          style={{
                            minHeight: '20px',
                            maxWidth: 'calc(100% - 10px)', // Ensure it doesn't extend beyond the time indicator
                            width: 'fit-content', // Allow it to shrink based on content
                            border: event.type === 'reminder' ? 
                              '1px solid rgba(245, 158, 11, 0.8)' : // amber color for reminders
                              event.isAllDay ?
                              '1px solid rgba(34, 197, 94, 0.8)' : // green color for all-day events
                              '1px solid rgba(59, 130, 246, 0.8)', // blue color for regular events
                            pointerEvents: 'auto' // Allow the title area to capture mouse events
                          }}
                          onMouseEnter={(e) => {
                            // Show tooltip when hovering over the title/icon part
                            e.stopPropagation(); // Prevent event bubbling
                            showTooltip(
                              <>
                                <div className="font-bold">{event.title}</div>
                                <div>{formatEventDate(event.start)} {formatEventTime(event.start)} - {formatEventTime(event.end)}</div>
                                {event.description && <div className="mt-1">{event.description}</div>}
                                {event.location && <div className="mt-1">📍 {event.location}</div>}
                              </>,
                              e
                            );
                          }}
                          onMouseLeave={(e) => {
                            e.stopPropagation(); // Prevent event bubbling
                            hideTooltip();
                          }}
                        >
                          {/* Icon */}
                          {event.type === 'reminder' ? 
                            <span className="mr-1 text-amber-500 flex-shrink-0 text-xs">⏰</span> : 
                            event.isAllDay ?
                            <span className="mr-1 text-green-500 flex-shrink-0 text-xs">📆</span> :
                            <span className="mr-1 text-blue-500 flex-shrink-0 text-xs">📅</span>
                          }
                          
                          {/* Title */}
                          <div className="font-medium text-xs truncate">{event.title}</div>
                          
                          {/* Start time - only show if there's enough space */}
                          {event.maxColumns <= 3 && (
                            <div className="text-xs text-gray-600 ml-1 flex-shrink-0">
                              {formatEventTime(event.start)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
