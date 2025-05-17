'use client';

import { useState, useMemo } from 'react';
import { ScheduleEvent } from './Calendar';
import { format, isToday, isTomorrow, isThisWeek, isThisMonth } from 'date-fns';
import { MagnifyingGlassIcon, XMarkIcon, CalendarDaysIcon, ClockIcon, MapPinIcon } from '@heroicons/react/24/outline';

interface ListViewProps {
  events: ScheduleEvent[];
  date: Date;
  viewType: 'day' | 'week' | 'month';
  onEventClick?: (event: ScheduleEvent) => void;
}

type FilterType = 'all' | 'event' | 'reminder' | 'all-day';

export default function ListView({ events, date, viewType, onEventClick }: ListViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');

  // Filter events based on the current view (day, week, month)
  const filteredEvents = useMemo(() => {
    // First filter by date range based on viewType
    let dateFilteredEvents = events.filter(event => {
      if (viewType === 'day') {
        return (
          event.start.getDate() === date.getDate() &&
          event.start.getMonth() === date.getMonth() &&
          event.start.getFullYear() === date.getFullYear()
        );
      } else if (viewType === 'week') {
        // Get the start and end of the week
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay()); // Sunday
        startOfWeek.setHours(0, 0, 0, 0);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday
        endOfWeek.setHours(23, 59, 59, 999);
        
        return event.start >= startOfWeek && event.start <= endOfWeek;
      } else { // month
        return (
          event.start.getMonth() === date.getMonth() &&
          event.start.getFullYear() === date.getFullYear()
        );
      }
    });

    // Then filter by search term and event type
    return dateFilteredEvents.filter(event => {
      const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (event.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (event.location || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = filterType === 'all' || event.type === filterType;
      
      return matchesSearch && matchesType;
    });
  }, [events, date, viewType, searchTerm, filterType]);

  // Sort events by start date
  const sortedEvents = useMemo(() => {
    return [...filteredEvents].sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [filteredEvents]);

  // Get relative date display
  const getRelativeDateDisplay = (eventDate: Date) => {
    if (isToday(eventDate)) return 'Today';
    if (isTomorrow(eventDate)) return 'Tomorrow';
    if (isThisWeek(eventDate)) return format(eventDate, 'EEEE'); // Day name
    if (isThisMonth(eventDate)) return format(eventDate, 'MMMM d'); // Month day
    return format(eventDate, 'MMM d, yyyy'); // Full date
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Search and Filter Bar */}
      <div className="p-4 border-b">
        <div className="flex items-center space-x-2">
          {/* Search Box */}
          <div className="relative w-1/2">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search events..."
              className="block w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-2 flex items-center"
              >
                <XMarkIcon className="h-4 w-4 text-gray-400" />
              </button>
            )}
          </div>
          
          {/* Filter Buttons */}
          <div className="flex space-x-1 flex-1 justify-end">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 text-xs rounded-md ${filterType === 'all' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              All Types
            </button>
            <button
              onClick={() => setFilterType('event')}
              className={`px-2.5 py-1 text-xs rounded-md ${filterType === 'event' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Events
            </button>
            <button
              onClick={() => setFilterType('reminder')}
              className={`px-2.5 py-1 text-xs rounded-md ${filterType === 'reminder' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Reminders
            </button>
            <button
              onClick={() => setFilterType('all-day')}
              className={`px-2.5 py-1 text-xs rounded-md ${filterType === 'all-day' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              All-Day
            </button>
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="flex-1 overflow-auto">
        {sortedEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12">
            <div className="bg-gray-100 rounded-full p-4 mb-4">
              <CalendarDaysIcon className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No events found</h3>
            <p className="text-sm text-gray-500 mt-1">Try adjusting your search or filters</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterType('all');
              }}
              className="mt-4 text-sm text-blue-600 hover:text-blue-800"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {sortedEvents.map((event) => (
              <li
                key={event.id}
                onClick={() => onEventClick?.(event)}
                className="hover:bg-gray-50 cursor-pointer"
              >
                <div className="px-4 py-3 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center max-w-[70%]">
                      <div
                        className={`w-3 h-3 rounded-full mr-3 flex-shrink-0 ${
                          event.type === 'event' ? 'bg-blue-500' : 
                          event.type === 'reminder' ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                      />
                      <p className="text-sm font-medium text-blue-600 truncate">{event.title}</p>
                    </div>
                    <div className="ml-2 flex-shrink-0 flex">
                      <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        {event.type === 'all-day' ? 'All day' : event.type}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between text-xs">
                    <div className="sm:flex items-center">
                      {event.location && (
                        <p className="flex items-center text-gray-500">
                          <MapPinIcon className="h-3 w-3 mr-1 text-gray-400" />
                          <span>{event.location}</span>
                        </p>
                      )}
                    </div>
                    <div className="mt-2 flex items-center text-gray-500 sm:mt-0">
                      <ClockIcon className="h-3 w-3 mr-1 text-gray-400" />
                      <p>
                        {getRelativeDateDisplay(event.start)}{' '}
                        {!event.isAllDay && (
                          <span>
                            {format(event.start, 'h:mm a')}
                            {event.type !== 'reminder' && ` - ${format(event.end, 'h:mm a')}`}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
