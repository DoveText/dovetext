'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { ScheduleEvent } from './Calendar';

// Generate time slots for the day
export const generateTimeSlots = () => {
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
export const getTimeFromPosition = (y: number, containerTop: number) => {
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
export const formatTimeSlot = (hour: number, minute: number) => {
  const hourDisplay = hour % 12 === 0 ? 12 : hour % 12;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const minuteDisplay = minute.toString().padStart(2, '0');
  return `${hourDisplay}:${minuteDisplay} ${ampm}`;
};

// Get time slot range string
export const getTimeSlotRange = (hour: number, minute: number) => {
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

// Get color based on event type
export const getEventColor = (type: string) => {
  switch (type) {
    case 'reminder':
      return 'bg-amber-100 text-amber-800';
    case 'task':
      return 'bg-purple-100 text-purple-800';
    case 'meeting':
      return 'bg-blue-100 text-blue-800';
    case 'appointment':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-blue-100 text-blue-800';
  }
};

// Get border color based on event type
export const getEventBorderColor = (type: string, isAllDay: boolean = false) => {
  if (isAllDay) {
    return 'border-green-500';
  }
  
  switch (type) {
    case 'reminder':
      return 'border-amber-500';
    case 'task':
      return 'border-purple-500';
    case 'meeting':
      return 'border-blue-500';
    case 'appointment':
      return 'border-green-500';
    default:
      return 'border-blue-500';
  }
};

// Format time for display
export const formatEventTime = (date: Date) => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hour = hours % 12 || 12;
  const minuteStr = minutes < 10 ? `0${minutes}` : minutes;
  return `${hour}:${minuteStr} ${ampm}`;
};

// Format date for tooltip display
export const formatEventDate = (date: Date) => {
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric'
  };
  return date.toLocaleDateString('en-US', options);
};

// Helper function to calculate event duration in minutes
export const getEventDurationMinutes = (event: ScheduleEvent) => {
  const start = new Date(event.start);
  const end = new Date(event.end);
  return (end.getTime() - start.getTime()) / (1000 * 60);
};

// Helper function to position events on the timeline
export const getEventStyle = (event: ScheduleEvent) => {
  const start = new Date(event.start);
  const end = new Date(event.end);
  
  // Calculate position and height
  const startHour = start.getHours();
  const startMinute = start.getMinutes();
  const endHour = end.getHours();
  const endMinute = end.getMinutes();
  
  // Calculate top position (60px per hour)
  const top = (startHour + startMinute / 60) * 60;
  
  // Calculate height (60px per hour)
  const durationHours = (endHour - startHour) + (endMinute - startMinute) / 60;
  const height = Math.max(durationHours * 60, 20); // Minimum height of 20px
  
  return {
    top: `${top}px`,
    height: `${height}px`,
    width: event.width ? `${event.width}%` : '100%',
    left: event.left ? `${event.left}%` : '0',
  };
};

// Check if a day is today
export const isToday = (day: Date) => {
  const today = new Date();
  return day.getDate() === today.getDate() &&
    day.getMonth() === today.getMonth() &&
    day.getFullYear() === today.getFullYear();
};

// Format day for display
export const formatDay = (day: Date) => {
  return day.toLocaleDateString('en-US', { weekday: 'short' });
};

// Format date for display
export const formatDate = (day: Date) => {
  return day.getDate().toString();
};

// Generate days of the week
export const getDaysOfWeek = (date: Date) => {
  const days = [];
  const currentDay = new Date(date);
  currentDay.setDate(date.getDate() - date.getDay()); // Start with Sunday
  
  for (let i = 0; i < 7; i++) {
    days.push(new Date(currentDay));
    currentDay.setDate(currentDay.getDate() + 1);
  }
  
  return days;
};

// Process events to handle overlaps using a simplified slot-based approach
export const processEvents = (events: ScheduleEvent[]) => {
  if (!events || events.length === 0) return [];

  // Sort events by start time
  const sortedEvents = [...events].sort((a, b) => {
    const aStart = new Date(a.start).getTime();
    const bStart = new Date(b.start).getTime();
    return aStart - bStart;
  });

  // Process events to assign column positions
  const processedEvents = [];
  const columns = [];

  for (const event of sortedEvents) {
    const eventStart = new Date(event.start).getTime();
    const eventEnd = new Date(event.end).getTime();
    
    // Find a column where this event can fit
    let columnIndex = -1;
    for (let i = 0; i < columns.length; i++) {
      if (columns[i] <= eventStart) {
        columnIndex = i;
        break;
      }
    }
    
    // If no column found, create a new one
    if (columnIndex === -1) {
      columnIndex = columns.length;
      columns.push(0);
    }
    
    // Update the column's end time
    columns[columnIndex] = eventEnd;
    
    // Add the processed event with column information
    const processedEvent = {
      ...event,
      column: columnIndex,
    };
    
    processedEvents.push(processedEvent);
  }
  
  // Calculate width and left position for each event
  const finalEvents = processedEvents.map(event => {
    // Safely access column and maxColumns with default values if undefined
    const column = event.column ?? 0;
    const maxColumns = columns.length;
    const width = 1 / maxColumns;
    const left = (column / maxColumns) * 100;
    
    return {
      ...event,
      width,
      left
    };
  });
  
  return finalEvents;
};

// Create a reusable tooltip component
export const useTooltip = () => {
  const [tooltipContent, setTooltipContent] = React.useState<React.ReactNode | null>(null);
  const [tooltipPosition, setTooltipPosition] = React.useState({ top: 0, left: 0 });
  const [isTooltipVisible, setIsTooltipVisible] = React.useState(false);
  const tooltipTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const activeEventRef = React.useRef<HTMLElement | null>(null);

  const showTooltip = React.useCallback((content: React.ReactNode, e: React.MouseEvent) => {
    // Clear any existing timeout
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }
    
    // Set the tooltip content and position
    setTooltipContent(content);
    
    // Position the tooltip near the mouse but ensure it stays within viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Default position near the mouse
    let left = e.clientX + 10;
    let top = e.clientY + 10;
    
    // Adjust if tooltip would go off-screen
    // Assuming tooltip width is about 300px and height is about 200px
    if (left + 300 > viewportWidth) {
      left = e.clientX - 310;
    }
    
    if (top + 200 > viewportHeight) {
      top = e.clientY - 210;
    }
    
    setTooltipPosition({ top, left });
    setIsTooltipVisible(true);
    
    // Store the current target element
    activeEventRef.current = e.currentTarget as HTMLElement;
  }, []);

  const hideTooltip = React.useCallback((e?: React.MouseEvent) => {
    // Only hide if we're not moving from the event to the tooltip
    if (e && e.relatedTarget && 
        ((e.relatedTarget as HTMLElement).classList.contains('tooltip') || 
         (e.relatedTarget as HTMLElement).closest('.tooltip'))) {
      return;
    }
    
    // Set a timeout to hide the tooltip
    tooltipTimeoutRef.current = setTimeout(() => {
      setIsTooltipVisible(false);
      activeEventRef.current = null;
    }, 100);
  }, []);

  const renderTooltip = () => {
    if (!isTooltipVisible || !tooltipContent) return null;
    
    return createPortal(
      <div 
        className="tooltip fixed z-50 bg-white rounded-md shadow-lg p-3 max-w-sm border border-gray-200"
        style={{ 
          top: tooltipPosition.top, 
          left: tooltipPosition.left,
          maxWidth: '300px'
        }}
        onMouseEnter={() => {
          // Clear the hide timeout if user moves mouse to tooltip
          if (tooltipTimeoutRef.current) {
            clearTimeout(tooltipTimeoutRef.current);
          }
        }}
        onMouseLeave={() => {
          // Hide the tooltip when mouse leaves
          setIsTooltipVisible(false);
        }}
      >
        {tooltipContent}
      </div>,
      document.body
    );
  };

  return {
    showTooltip,
    hideTooltip,
    renderTooltip,
    tooltipContent,
    isTooltipVisible
  };
};

// Helper function to get time slot from mouse position
export const getTimeSlotFromMouseEvent = (e: React.MouseEvent, scrollContainerRef: React.RefObject<HTMLDivElement>) => {
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

// Helper for drag and drop functionality
export const useDragAndDrop = (onEventDrop?: (event: ScheduleEvent, newStart: Date, newEnd: Date) => void) => {
  const [draggedEvent, setDraggedEvent] = React.useState<ScheduleEvent | null>(null);

  const handleDragStart = React.useCallback((event: React.DragEvent, scheduleEvent: ScheduleEvent) => {
    event.dataTransfer.setData('text/plain', JSON.stringify(scheduleEvent));
    setDraggedEvent(scheduleEvent);
    
    // Set the drag image (optional)
    const dragImage = document.createElement('div');
    dragImage.textContent = scheduleEvent.title;
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    document.body.appendChild(dragImage);
    event.dataTransfer.setDragImage(dragImage, 0, 0);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  }, []);

  const handleDragOver = React.useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = React.useCallback((event: React.DragEvent, date: Date, hour: number, minute: number = 0) => {
    event.preventDefault();
    
    if (!draggedEvent || !onEventDrop) return;
    
    try {
      // Create new start date based on drop target
      const newStart = new Date(date);
      newStart.setHours(hour, minute, 0, 0);
      
      // Calculate the duration of the original event
      const originalStart = new Date(draggedEvent.start);
      const originalEnd = new Date(draggedEvent.end);
      const durationMs = originalEnd.getTime() - originalStart.getTime();
      
      // Create new end date by adding the original duration
      const newEnd = new Date(newStart.getTime() + durationMs);
      
      // Call the onEventDrop callback
      onEventDrop(draggedEvent, newStart, newEnd);
      
      // Reset dragged event
      setDraggedEvent(null);
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  }, [draggedEvent, onEventDrop]);

  return {
    handleDragStart,
    handleDragOver,
    handleDrop
  };
};

// Helper to filter events for a specific day
export const getEventsForDay = (events: ScheduleEvent[], day: Date) => {
  return events.filter(event => {
    const eventStart = new Date(event.start);
    const eventDay = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate());
    const targetDay = new Date(day.getFullYear(), day.getMonth(), day.getDate());
    return eventDay.getTime() === targetDay.getTime();
  });
};

// Get all-day events for a specific day
export const getAllDayEventsForDay = (events: ScheduleEvent[], day: Date) => {
  return getEventsForDay(events, day).filter(event => event.isAllDay);
};

// Get timed events for a specific day
export const getTimedEventsForDay = (events: ScheduleEvent[], day: Date) => {
  return getEventsForDay(events, day).filter(event => !event.isAllDay);
};

// createPortal is now properly imported from react-dom
