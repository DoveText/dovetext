'use client';

import { useState, useEffect, useRef } from 'react';
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
  const [selectionEnd, setSelectionEnd] = useState<{hour: number, minute: number} | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [hoverSlot, setHoverSlot] = useState<{hour: number, minute: number} | null>(null);
  const [isMouseOverCalendar, setIsMouseOverCalendar] = useState(false);
  
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

  return (
    <div 
      className="flex flex-col h-full overflow-hidden"
      onMouseEnter={() => setIsMouseOverCalendar(true)}
      onMouseLeave={() => {
        setIsMouseOverCalendar(false);
        setHoverSlot(null);
        
        // Reset selection if needed
        if (isSelecting) {
          setIsSelecting(false);
          setSelectionStart(null);
          setSelectionEnd(null);
        }
      }}
    >
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
                className="flex-1 relative border-l border-solid border-gray-200"
                onClick={(e) => {
                  if (onAddEvent) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const { hours, minutes } = getTimeFromPosition(e.clientY, rect.top);
                    const newDate = new Date(date);
                    newDate.setHours(slot.hour, minutes, 0, 0);
                    
                    // Create end date 15 minutes later
                    const endDate = new Date(newDate);
                    endDate.setMinutes(endDate.getMinutes() + 15);
                    
                    // Create a temporary event object for the selection
                    const tempEvent: ScheduleEvent = {
                      id: '',
                      title: '',
                      start: newDate,
                      end: endDate,
                      isAllDay: false,
                      type: 'event'
                    };
                    
                    onAddEvent(newDate, tempEvent);
                  }
                }}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const { hours, minutes } = getTimeFromPosition(e.clientY, rect.top);
                  
                  // Update hover slot
                  setHoverSlot({ hour: slot.hour, minute: minutes });
                  
                  // Update selection end if selecting
                  if (isSelecting && selectionStart) {
                    setSelectionEnd({ hour: slot.hour, minute: minutes });
                  }
                }}
                onMouseDown={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const { hours, minutes } = getTimeFromPosition(e.clientY, rect.top);
                  setSelectionStart({ hour: slot.hour, minute: minutes });
                  setSelectionEnd({ hour: slot.hour, minute: minutes });
                  setIsSelecting(true);
                }}
                onMouseUp={(e) => {
                  if (isSelecting && selectionStart && selectionEnd && onAddEvent) {
                    setIsSelecting(false);
                    
                    // Calculate start and end times
                    const startDate = new Date(date);
                    startDate.setHours(selectionStart.hour, selectionStart.minute, 0, 0);
                    
                    const endDate = new Date(date);
                    endDate.setHours(selectionEnd.hour, selectionEnd.minute, 0, 0);
                    
                    // Ensure end is after start
                    if (endDate < startDate) {
                      const temp = new Date(startDate);
                      startDate.setTime(endDate.getTime());
                      endDate.setTime(temp.getTime());
                    }
                    
                    // Ensure at least 15 minutes duration
                    if (endDate.getTime() - startDate.getTime() < 15 * 60 * 1000) {
                      endDate.setTime(startDate.getTime() + 15 * 60 * 1000);
                    }
                    
                    // Create a temporary event object for the selection
                    const tempEvent: ScheduleEvent = {
                      id: 'temp-id',
                      title: 'New Event',
                      start: startDate,
                      end: endDate,
                      isAllDay: false,
                      type: 'event'
                    };
                    
                    onAddEvent(startDate, tempEvent);
                    
                    // Reset selection
                    setSelectionStart(null);
                    setSelectionEnd(null);
                  }
                }}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, slot.hour)}
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
          {hoverSlot && !isSelecting && isMouseOverCalendar && (
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
          {isSelecting && selectionStart && selectionEnd && (
            <div
              className="absolute left-16 right-2 bg-blue-100 opacity-50 rounded-md border border-blue-300 z-0"
              style={{
                top: `${Math.min(selectionStart.hour, selectionEnd.hour) * 60 + Math.min(selectionStart.minute, selectionEnd.minute)}px`,
                height: `${Math.abs((selectionEnd.hour * 60 + selectionEnd.minute) - (selectionStart.hour * 60 + selectionStart.minute)) || 15}px`
              }}
            />
          )}
          
          {/* Events */}
          {timedEvents.map((event) => (
            <div 
              key={event.id}
              className="absolute left-16 right-2 rounded-md border shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow z-10"
              style={getEventStyle(event)}
              onClick={() => onEventClick && onEventClick(event)}
              draggable={true}
              onDragStart={(e) => handleDragStart(e, event)}
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
