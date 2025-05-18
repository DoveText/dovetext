'use client';

import React, {useEffect, useState, useRef, useCallback} from 'react';
import {createPortal} from 'react-dom';
import {ScheduleEvent} from './Calendar';
import {PlusIcon} from '@heroicons/react/24/outline';
import RecurrenceIndicator from './RecurrenceIndicator';

// Utility functions for calendar operations
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

const formatTimeSlot = (hour: number, minute: number) => {
    const hourDisplay = hour % 12 === 0 ? 12 : hour % 12;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const minuteDisplay = minute.toString().padStart(2, '0');
    return `${hourDisplay}:${minuteDisplay} ${ampm}`;
};

const formatEventTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour = hours % 12 || 12;
    const minuteStr = minutes < 10 ? `0${minutes}` : minutes;
    return `${hour}:${minuteStr} ${ampm}`;
};

const formatEventDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    };
    return date.toLocaleDateString('en-US', options);
};

const getEventDurationMinutes = (event: ScheduleEvent) => {
    const start = new Date(event.start);
    const end = new Date(event.end);
    return (end.getTime() - start.getTime()) / (1000 * 60);
};

const getEventColor = (type: string) => {
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

const getEventBorderColor = (type: string, isAllDay: boolean = false) => {
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

// Process timed events to handle overlaps
const processTimedEvents = (events: ScheduleEvent[]) => {
    if (!events || events.length === 0) return [];

    // Sort events by start time and then by duration (longest first)
    const sortedEvents = [...events].sort((a, b) => {
        const aStart = new Date(a.start).getTime();
        const bStart = new Date(b.start).getTime();

        if (aStart === bStart) {
            const aDuration = getEventDurationMinutes(a);
            const bDuration = getEventDurationMinutes(b);
            return bDuration - aDuration; // Longer events first
        }

        return aStart - bStart;
    });

    // Process events to assign column positions
    const processedEvents: ScheduleEvent[] = [];
    const columns: { end: number, events: ScheduleEvent[] }[] = [];

    for (const event of sortedEvents) {
        const eventStart = new Date(event.start).getTime();
        const eventEnd = new Date(event.end).getTime();

        // Find a column where this event can fit
        let columnIndex = -1;
        for (let i = 0; i < columns.length; i++) {
            if (columns[i].end <= eventStart) {
                columnIndex = i;
                break;
            }
        }

        // If no column found, create a new one
        if (columnIndex === -1) {
            columnIndex = columns.length;
            columns.push({end: 0, events: []});
        }

        // Update the column's end time
        columns[columnIndex].end = eventEnd;
        columns[columnIndex].events.push(event);

        // Add the processed event with column information
        const processedEvent = {
            ...event,
            column: columnIndex,
            maxColumns: columns.length
        };

        processedEvents.push(processedEvent);
    }

    // Calculate width and left position for each event
    const finalEvents = processedEvents.map(event => {
        const columnWidth = 100 / columns.length;
        // Safely access column with default value if undefined
        const column = event.column ?? 0;
        return {
            ...event,
            width: columnWidth,
            left: column * columnWidth,
            maxColumns: columns.length
        };
    });

    return finalEvents;
};

// Helper function to position events on the timeline
const getEventStyle = (event: ScheduleEvent) => {
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

// Get time slot from mouse position
const getTimeSlotFromMouseEvent = (e: React.MouseEvent, scrollContainerRef: React.RefObject<HTMLDivElement>) => {
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

    return {hour, minute};
};

// Tooltip hook
const useTooltip = () => {
    const [tooltipContent, setTooltipContent] = useState<React.ReactNode | null>(null);
    const [tooltipPosition, setTooltipPosition] = useState({top: 0, left: 0});
    const [isTooltipVisible, setIsTooltipVisible] = useState(false);
    const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const activeEventRef = useRef<HTMLElement | null>(null);

    const showTooltip = useCallback((content: React.ReactNode, e: React.MouseEvent) => {
        // Clear any existing timeout
        if (tooltipTimeoutRef.current) {
            clearTimeout(tooltipTimeoutRef.current);
        }

        // Store the current target element
        activeEventRef.current = e.currentTarget as HTMLElement;

        // Set tooltip content and position
        setTooltipContent(content);

        // Calculate position
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const scrollY = window.scrollY || document.documentElement.scrollTop;
        const scrollX = window.scrollX || document.documentElement.scrollLeft;

        // Position tooltip above the element by default
        let top = rect.top + scrollY - 10;
        let left = rect.left + scrollX + rect.width / 2;

        // Adjust if tooltip would go off screen
        if (top < 10) {
            // Position below element if it would go off the top
            top = rect.bottom + scrollY + 10;
        }

        setTooltipPosition({top, left});

        // Show tooltip with a small delay
        tooltipTimeoutRef.current = setTimeout(() => {
            setIsTooltipVisible(true);
        }, 200);
    }, []);

    const hideTooltip = useCallback((e?: React.MouseEvent) => {
        // Only hide if the mouse is not moving to the tooltip itself
        if (e && activeEventRef.current === e.currentTarget) {
            // Clear any existing timeout
            if (tooltipTimeoutRef.current) {
                clearTimeout(tooltipTimeoutRef.current);
            }

            // Hide tooltip with a small delay to allow moving to tooltip
            tooltipTimeoutRef.current = setTimeout(() => {
                setIsTooltipVisible(false);
            }, 200);
        }
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

// Drag and drop hook
const useDragAndDrop = (onEventDrop?: (event: ScheduleEvent, newStart: Date, newEnd: Date) => void) => {
    const [draggedEvent, setDraggedEvent] = useState<ScheduleEvent | null>(null);

    const handleDragStart = useCallback((event: React.DragEvent, scheduleEvent: ScheduleEvent) => {
        event.dataTransfer.setData('text/plain', JSON.stringify(scheduleEvent));
        setDraggedEvent(scheduleEvent);

        // Set the drag image (optional)
        const dragImage = document.createElement('div');
        dragImage.textContent = scheduleEvent.title;
        dragImage.style.position = 'absolute';
        dragImage.style.top = '-1000px';
        document.body.appendChild(dragImage);
        event.dataTransfer.setDragImage(dragImage, 0, 0);

        // Clean up the drag image after a short delay
        setTimeout(() => {
            document.body.removeChild(dragImage);
        }, 0);
    }, []);

    const handleDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const handleDrop = useCallback((event: React.DragEvent, day: Date, hour: number) => {
        event.preventDefault();

        if (!draggedEvent || !onEventDrop) return;

        try {
            // Create new start date based on drop location
            const newStart = new Date(day);
            newStart.setHours(hour, 0, 0, 0);

            // Calculate original duration
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

interface CalendarDaySlotProps {
    date: Date;
    events: ScheduleEvent[];
    onEventClick?: (event: ScheduleEvent) => void;
    onAddEvent?: (date: Date, event?: ScheduleEvent) => void;
    currentTime: Date;
    onEventDrop?: (event: ScheduleEvent, newStart: Date, newEnd: Date) => void;
    showHeader?: boolean;
    onDateClick?: (date: Date) => void;
    width?: string;
    dayIndex?: number;
}

export default function CalendarDaySlot({
                                            date,
                                            events,
                                            onEventClick,
                                            onAddEvent,
                                            currentTime,
                                            onEventDrop,
                                            showHeader = false,
                                            onDateClick,
                                            width = '100%',
                                            dayIndex = 0
                                        }: CalendarDaySlotProps) {

    const timeSlots = generateTimeSlots();
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [selectionStart, setSelectionStart] = useState<{ hour: number, minute: number } | null>(null);
    const [hoverSlot, setHoverSlot] = useState<{ hour: number, minute: number } | null>(null);
    const [isMouseOverCalendar, setIsMouseOverCalendar] = useState(false);
    const [currentSelectionDay] = useState(date);

    // Initialize tooltip and drag-and-drop
    const {showTooltip, hideTooltip, renderTooltip} = useTooltip();
    const {handleDragStart, handleDragOver, handleDrop} = useDragAndDrop(onEventDrop);

    // Scroll to current time on initial render
    useEffect(() => {
        if (scrollContainerRef.current && date.toDateString() === currentTime.toDateString()) {
            const currentHour = currentTime.getHours();
            const scrollTop = currentHour * 60 - 100; // 60px per hour, offset by 100px to show a bit of context
            scrollContainerRef.current.scrollTop = scrollTop > 0 ? scrollTop : 0;
        }
    }, [date, currentTime]);

    // Filter events for this day
    const dayEvents = events.filter(event => {
        const eventStart = new Date(event.start);
        const eventDay = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate());
        const targetDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        return eventDay.getTime() === targetDay.getTime();
    });

    // Separate all-day events and timed events
    const allDayEvents = dayEvents.filter(event => event.isAllDay);
    const timedEvents = dayEvents.filter(event => !event.isAllDay);

    // Process timed events to handle overlaps
    const processedEvents = processTimedEvents(timedEvents);

    // Check if the day is today
    const isToday = date.toDateString() === new Date().toDateString();

    // Handle mouse down for drag selection
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        const slot = getTimeSlotFromMouseEvent(e, scrollContainerRef);
        if (slot) {
            setSelectionStart(slot);
        }
    }, []);

    // Handle mouse up for drag selection
    const handleMouseUp = useCallback(() => {
        if (selectionStart && hoverSlot && onAddEvent) {
            // Create start and end dates for the selection
            const startDate = new Date(currentSelectionDay);
            const endDate = new Date(currentSelectionDay);

            // Determine which slot is earlier
            if (
                (selectionStart.hour < hoverSlot.hour) ||
                (selectionStart.hour === hoverSlot.hour && selectionStart.minute < hoverSlot.minute)
            ) {
                startDate.setHours(selectionStart.hour, selectionStart.minute, 0, 0);
                endDate.setHours(hoverSlot.hour, hoverSlot.minute, 0, 0);
            } else {
                startDate.setHours(hoverSlot.hour, hoverSlot.minute, 0, 0);
                endDate.setHours(selectionStart.hour, selectionStart.minute, 0, 0);
            }

            // Add at least 30 minutes if start and end are the same
            if (startDate.getTime() === endDate.getTime()) {
                endDate.setMinutes(endDate.getMinutes() + 30);
            }

            // Call onAddEvent with the selected time range
            onAddEvent(startDate, {
                id: `new-event-${Date.now()}`,
                start: startDate,
                end: endDate,
                title: '',
                type: 'event',
                isAllDay: false
            });
        }

        // Reset selection
        setSelectionStart(null);
    }, [selectionStart, hoverSlot, currentSelectionDay, onAddEvent]);

    // Calculate selection display
    const getSelectionDisplay = useCallback(() => {
        if (!selectionStart || !hoverSlot) return null;

        // Determine which slot is earlier
        let startSlot, endSlot;
        if (
            (selectionStart.hour < hoverSlot.hour) ||
            (selectionStart.hour === hoverSlot.hour && selectionStart.minute < hoverSlot.minute)
        ) {
            startSlot = selectionStart;
            endSlot = hoverSlot;
        } else {
            startSlot = hoverSlot;
            endSlot = selectionStart;
        }

        // Calculate position and size
        const top = (startSlot.hour + startSlot.minute / 60) * 60;
        const bottom = (endSlot.hour + endSlot.minute / 60) * 60;
        const height = bottom - top;

        return {
            top: `${top}px`,
            height: `${height}px`
        };
    }, [selectionStart, hoverSlot]);

    return (
        <div className="calendar-day-slot" style={{width}}>
            {/* Day header if needed */}
            {showHeader && (
                <div
                    className={`text-center py-2 border-b ${isToday ? 'bg-blue-50' : ''}`}
                    onClick={() => onDateClick && onDateClick(date)}
                >
                    <div className="text-sm font-medium">
                        {date.toLocaleDateString('en-US', {weekday: 'short'})}
                    </div>
                    <div
                        className={`text-lg ${isToday ? 'bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto' : ''}`}>
                        {date.getDate()}
                    </div>
                </div>
            )}

            {/* All-day section */}
            <div className="border-b">
                {/* All-day events */}
                {allDayEvents.length > 0 ? (
                    <div className="all-day-events py-1 px-2">
                        {allDayEvents.map((event, index) => (
                            <div
                                key={`all-day-${event.id || index}`}
                                className={`
                    mb-1 px-2 py-1 rounded-md cursor-pointer flex items-center
                    ${getEventColor(event.type)}
                    border ${getEventBorderColor(event.type, true)}
                  `}
                                onClick={() => onEventClick && onEventClick(event)}
                                onMouseEnter={(e) => {
                                    showTooltip(
                                        <>
                                            <div className="font-bold">{event.title}</div>
                                            <div>{formatEventDate(event.start)} (All day)</div>
                                            {event.description && <div className="mt-1">{event.description}</div>}
                                            {event.location && <div className="mt-1">📍 {event.location}</div>}
                                        </>,
                                        e
                                    );
                                }}
                                onMouseLeave={hideTooltip}
                                draggable
                                onDragStart={(e) => handleDragStart(e, event)}
                            >
                                <span className="mr-1 text-green-500 flex-shrink-0 text-xs">📆</span>
                                <div className="text-xs font-medium truncate flex-grow">{event.title}</div>
                                {event.recurrenceRule && (
                                    <RecurrenceIndicator
                                        rule={event.recurrenceRule}
                                        className="ml-1"
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="h-8"></div> /* Empty placeholder to maintain height */
                )}
            </div>

            {/* Time slots grid */}
            <div
                className="time-slots relative overflow-y-auto"
                style={{height: 'calc(100% - 64px)'}}
                ref={scrollContainerRef}
                onMouseEnter={() => setIsMouseOverCalendar(true)}
                onMouseLeave={() => {
                    setIsMouseOverCalendar(false);
                    setHoverSlot(null);
                }}
                onMouseMove={(e) => {
                    const slot = getTimeSlotFromMouseEvent(e, scrollContainerRef);
                    if (slot) {
                        setHoverSlot(slot);
                    }
                }}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onClick={(e) => {
                    // Only trigger click if we're not in a drag operation
                    if (!selectionStart && onAddEvent) {
                        const slot = getTimeSlotFromMouseEvent(e, scrollContainerRef);
                        if (slot) {
                            const eventDate = new Date(date);
                            eventDate.setHours(slot.hour, slot.minute, 0, 0);
                            onAddEvent(eventDate);
                        }
                    }
                }}
            >
                {/* Current time indicator */}
                {isToday && (
                    <div
                        className="absolute left-0 right-0 border-t border-red-500 z-10"
                        style={{
                            top: `${(currentTime.getHours() + currentTime.getMinutes() / 60) * 60}px`,
                        }}
                    >
                        <div className="w-2 h-2 rounded-full bg-red-500 absolute -top-1 -left-1"></div>
                    </div>
                )}

                {/* Selection indicator */}
                {selectionStart && hoverSlot && getSelectionDisplay() && (
                    <div
                        className="absolute left-0 right-0 bg-blue-100 opacity-50 z-5 pointer-events-none"
                        style={getSelectionDisplay() || undefined}
                    />
                )}

                {/* Time slots */}
                {timeSlots.map((slot: {hour: number, label: string}, index: number) => (
                    <div
                        key={`slot-${index}`}
                        className="time-slot border-b border-gray-100"
                        style={{height: '60px'}}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, date, slot.hour)}
                    >
                        {/* Slot content */}
                        <div className="slot-content relative h-full border-l">
                            {/* Quarter-hour lines */}
                            <div className="absolute left-0 right-0 border-t border-gray-100 opacity-50"
                                 style={{top: '15px'}}></div>
                            <div className="absolute left-0 right-0 border-t border-gray-100 opacity-50"
                                 style={{top: '30px'}}></div>
                            <div className="absolute left-0 right-0 border-t border-gray-100 opacity-50"
                                 style={{top: '45px'}}></div>

                            {/* Hover indicator */}
                            {isMouseOverCalendar && hoverSlot && hoverSlot.hour === slot.hour && !selectionStart && (
                                <div
                                    className="absolute left-0 right-0 bg-blue-50 opacity-50 z-0"
                                    style={{
                                        top: `${(hoverSlot.minute / 60) * 60}px`,
                                        height: '15px'
                                    }}
                                >
                                    {/* Add button */}
                                    <div
                                        className="absolute right-2 top-0 bottom-0 flex items-center justify-center cursor-pointer"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (onAddEvent) {
                                                const eventDate = new Date(date);
                                                eventDate.setHours(slot.hour, hoverSlot.minute, 0, 0);
                                                onAddEvent(eventDate);
                                            }
                                        }}
                                    >
                                        <PlusIcon className="h-4 w-4 text-blue-500"/>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {/* Events */}
                {processedEvents.map((event: ScheduleEvent, index: number) => {
                    const style = getEventStyle(event);

                    return (
                        <div
                            key={`event-${event.id || index}`}
                            className="absolute z-10"
                            style={{
                                ...style,
                                width: `calc(${style.width} - 4px)`,
                            }}
                        >
                            <div
                                className={`
                    absolute inset-0 rounded-md border ${getEventBorderColor(event.type)}
                    cursor-pointer overflow-hidden
                  `}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (onEventClick) onEventClick(event);
                                }}
                                onMouseEnter={(e) => {
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
                                draggable
                                onDragStart={(e) => handleDragStart(e, event)}
                            >
                                {/* Background */}
                                <div
                                    className="absolute top-0 left-0 right-0 bottom-0 bg-blue-500 rounded-sm"
                                    style={{
                                        border: '1px solid rgba(255, 255, 255, 0.8)'
                                    }}
                                ></div>

                                {/* Title/icon part */}
                                <div
                                    className={`
                      absolute ${(event.type === 'reminder' || getEventDurationMinutes(event) < 30) ?
                                        ((event.inFirstQuarter ?? false) ? 'top-0.5' : (event.type === 'reminder' ? 'bottom-0' : 'bottom-0.5')) :
                                        'top-0.5'} left-1.5
                      px-2 py-0.5 flex items-center
                      ${getEventColor(event.type)} 
                      rounded-md shadow-sm
                    `}
                                    style={{
                                        minHeight: '20px',
                                        maxWidth: 'calc(100% - 10px)',
                                        width: 'fit-content',
                                        border: event.type === 'reminder' ?
                                            '1px solid rgba(245, 158, 11, 0.8)' :
                                            event.isAllDay ?
                                                '1px solid rgba(34, 197, 94, 0.8)' :
                                                '1px solid rgba(59, 130, 246, 0.8)',
                                        pointerEvents: 'auto'
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
                                    {(event.maxColumns ?? 1) <= 3 && (
                                        <div className="text-xs text-gray-600 ml-1 flex-shrink-0">
                                            {formatEventTime(event.start)}
                                        </div>
                                    )}

                                    {/* Recurrence indicator */}
                                    {event.recurrenceRule && (
                                        <RecurrenceIndicator
                                            event={event}
                                            showDetails={false}
                                        >
                                            <span className="ml-1">↻</span>
                                        </RecurrenceIndicator>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            {/* Render tooltip */}
            {renderTooltip()}
        </div>
    );
}

// Export utility functions for use in other components
export type { ScheduleEvent };
export {
  generateTimeSlots,
  formatTimeSlot,
  formatEventTime,
  formatEventDate,
  getEventDurationMinutes,
  getEventColor,
  getEventBorderColor,
  processTimedEvents,
  getEventStyle,
  getTimeSlotFromMouseEvent
};

// Export hooks separately to avoid circular references
export { useTooltip, useDragAndDrop };
