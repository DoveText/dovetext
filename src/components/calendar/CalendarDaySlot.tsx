'use client';

import React, {useEffect, useState, useRef, useCallback} from 'react';
import {ScheduleEvent} from './Calendar';
import {PlusIcon} from '@heroicons/react/24/outline';
import RecurrenceIndicator from './RecurrenceIndicator';
import {
  generateTimeSlots,
  formatTimeSlot,
  formatEventTime,
  formatEventDate,
  getEventDurationMinutes,
  getEventColor,
  getEventBorderColor,
  getEventStyle,
  getTimeSlotFromMouseEvent,
  useTooltip,
  useDragAndDrop,
  processEvents
} from './CalendarUtils';
import {createPortal} from 'react-dom';

// Process timed events to handle overlaps
const processTimedEvents = (events: ScheduleEvent[]) => {
    return processEvents(events);
};
interface CalendarDaySlotProps {
    date: Date;
    events: ScheduleEvent[];
    onEventClick?: (event: ScheduleEvent) => void;
    onAddEvent?: (date: Date, event?: ScheduleEvent) => void;
    currentTime: Date;
    onEventDrop?: (event: ScheduleEvent, newStart: Date, newEnd: Date) => void;
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
        // Check if we clicked on an event by checking if the target or any parent has event-container class
        const target = e.target as HTMLElement;
        if (target.closest('.event-container')) {
            // Clicked on an event, don't start selection
            return;
        }
        
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
            // Use empty string for ID to trigger the Create Event dialog instead of Edit dialog
            onAddEvent(startDate, {
                id: '', // Empty ID indicates this is a new event
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
            {/* All-day section */}
            <div className="border-b h-8 flex items-center">
                {/* All-day events */}
                {allDayEvents.length > 0 ? (
                    <div className="all-day-events py-1 px-2 w-full">
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
                                {event.isRecurring && event.recurrenceRule && (
                                    <div className="ml-1">
                                        <RecurrenceIndicator
                                            event={event}
                                        />
                                    </div>
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
                    // Check if the click target is an event element
                    // We need to check if the click is on an event by examining the target and its parents
                    const isClickOnEvent = (e.target as HTMLElement).closest('.event-container') !== null;
                    
                    // Only trigger click if we're not in a drag operation and not clicking on an event
                    if (!selectionStart && onAddEvent && !isClickOnEvent) {
                        const slot = getTimeSlotFromMouseEvent(e, scrollContainerRef);
                        if (slot) {
                            const eventDate = new Date(date);
                            eventDate.setHours(slot.hour, slot.minute, 0, 0);
                            
                            // Create a default end time (30 minutes after start)
                            const endDate = new Date(eventDate);
                            endDate.setMinutes(endDate.getMinutes() + 30);
                            
                            // Call onAddEvent with the selected time
                            // Use empty string for ID to trigger the Create Event dialog instead of Edit dialog
                            onAddEvent(eventDate, {
                                id: '', // Empty ID indicates this is a new event
                                title: '',
                                start: eventDate,
                                end: endDate,
                                type: 'event',
                                isAllDay: false
                            });
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
                            className="absolute cursor-pointer hover:shadow-md transition-shadow z-10 hover:z-30 event-container"
                            style={{
                                top: style.top,
                                height: event.type === 'reminder' ? '22px' : style.height,
                                left: `${event.left}%`,
                                width: `calc(${event.width}% - 4px)`,
                                marginRight: '2px'
                            }}
                            onClick={() => onEventClick && onEventClick(event)}
                            draggable={true}
                            onDragStart={(e) => handleDragStart(e, event)}
                            onMouseEnter={(e) => {
                                showTooltip(
                                    <>
                                        <div className="font-bold">{event.title}</div>
                                        {event.type === 'reminder' ? (
                                            <div>{formatEventDate(event.start)} {formatEventTime(event.start)}</div>
                                        ) : (
                                            <div>{formatEventDate(event.start)} {formatEventTime(event.start)} - {formatEventTime(event.end)}</div>
                                        )}
                                        {event.description && <div className="mt-1">{event.description}</div>}
                                        {event.location && <div className="mt-1">📍 {event.location}</div>}
                                    </>,
                                    e
                                );
                            }}
                            onMouseLeave={hideTooltip}
                        >
                            {/* Time indicator (full width) */}
                            <div className="relative w-full h-full">
                                {event.type === 'reminder' ? (
                                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-amber-500"></div>
                                ) : (
                                    <div
                                        className={`absolute top-0 left-0 right-0 bottom-0 ${event.isAllDay ? 'bg-green-500' : 'bg-blue-500'} rounded-sm`}
                                        style={{
                                            border: '1px solid rgba(255, 255, 255, 0.8)'
                                        }}
                                    ></div>
                                )}
                                
                                {/* Title/icon part */}
                                <div
                                    className={`
                                        absolute ${(event.type === 'reminder' || getEventDurationMinutes(event) < 30) ?
                                            ((style.inFirstQuarter) ? 'top-0.5' : (event.type === 'reminder' ? 'bottom-0' : 'bottom-0.5')) :
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
                                            '1px solid rgba(245, 158, 11, 0.8)' : // amber color for reminders
                                            event.isAllDay ?
                                                '1px solid rgba(34, 197, 94, 0.8)' : // green color for all-day events
                                                '1px solid rgba(59, 130, 246, 0.8)', // blue color for regular events
                                        pointerEvents: 'auto',
                                        fontSize: '0.75rem',
                                        lineHeight: '1rem',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
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
                                    {event.isRecurring && event.recurrenceRule && (
                                        <RecurrenceIndicator
                                            event={event}
                                            showDetails={false}
                                        />
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

// No need to export utility functions as they are now imported from CalendarUtils.tsx
export type { ScheduleEvent };
