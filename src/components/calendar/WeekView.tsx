'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  onViewChange?: (view: 'day' | 'week' | 'month', date: Date) => void;
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

export default function WeekView({ date, events, onEventClick, onDateClick, onAddEvent, currentTime, onEventDrop, onViewChange }: WeekViewProps) {
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

  /**
   * Process events to handle overlaps using a simplified slot-based approach
   * We sort events by
   * 1. how long the last, the longer the event, the earlier it should be shown
   * 2. when it starts, if an event starts earlier, it should be shown earlier (unless above condition is met)
   *    The start time shall be rounded to 30 min start (so a meeting start on 17 min is the same as a meeting
   *    start on 15min).
   * 3. Now we adopt column strategy to display events
   *    a. for a 30min slot, if there is just one event to show, that event take full day space
   *    b. if two events, each take 50% of the space
   *    c. if three events, each take 33% of the space
   *    d. otherwise, a +N more indicator is shown and user shall jump to day view to see details
   * 4. following events are displayed and rendered so if there are overlapping with previous events, they shall
   *    have different start time, thus we can safely show them as it is without fully covering previous events
   * @param day
   */
  const getProcessedEventsForDay = (day: Date) => {
    const timedEvents = getTimedEventsForDay(day);
    
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

    // Group events by their starting slot (rounded to 30-minute intervals)
    const startingSlots: { [key: string]: ScheduleEvent[] } = {};
    
    // Initialize all slots
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const slotKey = `${hour}:${minute}`;
        startingSlots[slotKey] = [];
      }
    }
    
    // Assign events to their starting slots (rounded to 30-minute intervals)
    sortedEvents.forEach((event: ScheduleEvent) => {
      const startHour = event.start.getHours();
      const startMinute = Math.floor(event.start.getMinutes() / 30) * 30;
      const slotKey = `${startHour}:${startMinute}`;
      
      startingSlots[slotKey].push(event);
    });
    
    // Process events for each starting slot
    const processedEvents: (ScheduleEvent & { column: number, maxColumns: number, inFirstQuarter: boolean })[] = [];
    const moreIndicators: { [key: string]: { count: number, eventIds: string[] } } = {};
    
    Object.entries(startingSlots).forEach(([slotKey, eventsInSlot]) => {
      const eventCount = eventsInSlot.length;
      
      if (eventCount === 0) {
        // No events in this slot, nothing to do
        return;
      } else if (eventCount === 1) {
        // One event, it takes full width
        // Check if event starts in the first 15 minutes of the 30-minute slot
        const event = eventsInSlot[0];
        const inFirstQuarter = event.start.getMinutes() % 30 < 15;
        
        processedEvents.push({
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
          
          processedEvents.push({
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
          
          processedEvents.push({
            ...event,
            column: index,
            maxColumns: 3,
            inFirstQuarter
          });
        });
      } else {
        // More than three events, first two are shown, rest go into "+N More"
        const firstEvent = eventsInSlot[0];
        const secondEvent = eventsInSlot[1];
        
        // Check if events start in the first 15 minutes of the 30-minute slot
        const firstInFirstQuarter = firstEvent.start.getMinutes() % 30 < 15;
        const secondInFirstQuarter = secondEvent.start.getMinutes() % 30 < 15;
        
        processedEvents.push({
          ...firstEvent,
          column: 0,
          maxColumns: 3,
          inFirstQuarter: firstInFirstQuarter
        });
        processedEvents.push({
          ...secondEvent,
          column: 1,
          maxColumns: 3,
          inFirstQuarter: secondInFirstQuarter
        });
        
        // Create a "more" indicator for the rest
        const moreEvents = eventsInSlot.slice(2);
        moreIndicators[slotKey] = {
          count: moreEvents.length,
          eventIds: moreEvents.map(e => e.id)
        };
      }
    });
    
    return {
      events: processedEvents,
      moreIndicators
    };
  };

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
    return dayEvents.filter(event => event.isAllDay);
  };

  // Get timed events for each day
  const getTimedEventsForDay = (day: Date) => {
    const dayEvents = getEventsForDay(day);
    return dayEvents.filter(event => !event.isAllDay);
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
        backgroundColor: event.color || getEventColor(event.type),
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
                        className={`px-1 py-1 rounded text-xs cursor-pointer border-l-2 ${getEventBorderColor(event.type, event.isAllDay)} bg-white hover:bg-gray-100 truncate w-full`}
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
                        <div className="flex items-center">
                          <span className="mr-1 text-green-500 flex-shrink-0 text-xs">📆</span>
                          <span className="truncate">{event.title}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div 
                    className="h-6 w-full flex items-center justify-center opacity-0 hover:opacity-100 cursor-pointer"
                    onClick={() => {
                      if (onAddEvent) {
                        console.log('Add new event ' + day)
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
          if (target.closest('.z-10') || target.closest('.z-20')) {
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
          if (target.closest('.z-10') || target.closest('.z-20')) {
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
                height: '30px',
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
            const { events: processedEvents, moreIndicators } = getProcessedEventsForDay(day);
            // Calculate width and position based on the container width
            // Each day takes 1/7 of the available width (minus the time column)
            const dayWidth = `calc((100% - 4rem) / 7)`;
            const dayLeft = `calc(4rem + (${dayIndex} * ${dayWidth}))`;
            
            return (
              <React.Fragment key={`day-${dayIndex}`}>
                {/* Visible events - render in order so events are stacked according to their sorting */}
                {processedEvents.map((event) => {
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
                    height = `${Math.max(30, durationMinutes)}px`;
                  }
                  
                  // Calculate width based on column and maxColumns
                  // Add spacing between columns by making each column slightly narrower
                  const columnWidth = `calc(((${dayWidth} - 6px) / ${event.maxColumns}) - ${event.maxColumns > 1 ? '2px' : '0px'})`;
                  const columnLeft = event.maxColumns > 1 
                    ? `calc((${event.column} * ((${dayWidth} - 6px) / ${event.maxColumns})) + ${event.column * 2}px)`
                    : '0px'; // If only one column, take full width
                  
                  return (
                    <div 
                      key={`${dayIndex}-${event.id}`}
                      className="absolute cursor-pointer hover:shadow-md transition-shadow z-10 hover:z-30"
                      style={{
                        top: `${top}px`,
                        height: height,
                        left: `calc(${dayLeft} + ${columnLeft})`,
                        width: columnWidth
                      }}
                      onClick={() => onEventClick && onEventClick(event)}
                      onMouseEnter={(e) => {
                        // Show tooltip when hovering over the time indicator
                        showTooltip(
                          <>
                            <div className="font-bold">{event.title}</div>
                            <div>{formatEventDate(event.start)} {formatEventTime(event.start)} - {formatEventTime(event.end)}</div>
                            {event.description && <div className="mt-1">{event.description}</div>}
                            {event.location && <div className="mt-1">{event.location}</div>}
                          </>,
                          e
                        );
                      }}
                      onMouseLeave={hideTooltip}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, event)}
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
                              {event.location && <div className="mt-1">{event.location}</div>}
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
                            absolute ${event.inFirstQuarter ? 'top-0.5' : (event.type === 'reminder' ? 'bottom-0' : 'bottom-0.5')} left-1
                            px-1 py-0.5 flex items-center
                            ${event.type === 'reminder' ? 'bg-amber-50 border border-amber-200' : 'bg-blue-50 border border-blue-200'}
                            rounded-md shadow-sm
                          `}
                          style={{
                            minHeight: '20px',
                            maxWidth: 'calc(100% - 8px)', // Ensure it doesn't extend beyond the time indicator
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
                                {event.location && <div className="mt-1">{event.location}</div>}
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
                            <span className="text-amber-500 flex-shrink-0 text-xs">⏰</span> : 
                            event.isAllDay ?
                            <span className="text-green-500 flex-shrink-0 text-xs">📆</span> :
                            <span className="text-blue-500 flex-shrink-0 text-xs">📅</span>
                          }
                          
                          {/* Title with ellipsis */}
                          <div className="font-medium text-xs truncate ml-1">{event.title}</div>
                          
                          {/* Show time if there's only one event in this slot */}
                          {event.maxColumns === 1 && (
                            <div className="text-xs text-gray-600 ml-1 flex-shrink-0">
                              {formatEventTime(event.start)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {/* "+More" indicators */}
                {Object.entries(moreIndicators).map(([slotKey, { count, eventIds }]) => {
                  const [hourStr, minuteStr] = slotKey.split(':');
                  const hour = parseInt(hourStr);
                  const minute = parseInt(minuteStr);
                  const top = (hour + minute / 60) * 60;
                  
                  // Find the max columns for this slot
                  const slotKeyMaxColumns = 3;
                  
                  // Calculate width and position for the "+more" indicator (column 2)
                  const columnWidth = `calc(((${dayWidth} - 6px) / ${slotKeyMaxColumns}) - 2px)`;
                  const columnLeft = `calc((2 * ((${dayWidth} - 6px) / ${slotKeyMaxColumns})) + 4px)`;
                  
                  return (
                    <div 
                      key={`more-${dayIndex}-${slotKey}`}
                      className="absolute cursor-pointer z-20 bg-gray-100 hover:bg-gray-200 text-xs text-blue-600 font-medium rounded-sm border border-gray-300 flex items-center justify-center"
                      style={{
                        top: `${top}px`,
                        height: '20px',
                        left: `calc(${dayLeft} + ${columnLeft})`,
                        width: columnWidth
                      }}
                      onClick={(e) => {
                        // Prevent event bubbling to avoid triggering other handlers
                        e.stopPropagation();
                        
                        // Switch to day view for this date when clicking on "+x more"
                        if (onViewChange) {
                          onViewChange('day', day);
                        } else if (onDateClick) {
                          // Fallback to onDateClick if onViewChange is not provided
                          onDateClick(day);
                        }
                      }}
                      onMouseDown={(e) => {
                        // Prevent default to avoid any drag behavior
                        e.preventDefault();
                      }}
                    >
                      +{count}
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
