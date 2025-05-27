'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { CalendarIcon, PlusIcon } from '@heroicons/react/24/outline';
import ChatInput from '@/components/common/ChatInput';
import { useAction } from '@/context/ActionContext';
import Calendar, { ScheduleEvent, CalendarViewType } from '@/components/calendar/Calendar';
import CreateEventDialog from '@/components/calendar/CreateEventDialog';
import EventDetailsDialog from '@/components/calendar/EventDetailsDialog';
import { schedulesApi } from '@/app/api/schedules';
import { Schedule } from '@/types/schedule';

function ScheduleContent() {
  const { user } = useAuth();
  const actionContext = useAction();
  const [showCreateEventDialog, setShowCreateEventDialog] = useState(false);
  const [showEventDetailsDialog, setShowEventDetailsDialog] = useState(false);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedView, setSelectedView] = useState<CalendarViewType>('week');
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Load events from API
  const loadEvents = async () => {
    if (!user) return;
    
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30); // Get events from 30 days ago
      
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 60); // Get events up to 60 days in the future
      
      // Convert to timestamps
      const startTimestamp = Math.floor(startDate.getTime() / 1000);
      const endTimestamp = Math.floor(endDate.getTime() / 1000);
      
      // Fetch both regular events and recurring event expansions in parallel
      const [regularData, recurringExpansions] = await Promise.all([
        schedulesApi.getByDateRange(startTimestamp, endTimestamp),
        schedulesApi.getRecurringExpansions(startTimestamp, endTimestamp)
      ]);
      
      // Filter out the base recurring events (we'll show their expansions instead)
      const filteredRegularEvents = regularData.filter(event => !event.isRecurring);
      
      // Process regular events
      const regularEvents = filteredRegularEvents.map(event => formatEventForCalendar(event));
      
      // Process recurring event expansions
      const recurringEvents = recurringExpansions.map(event => formatEventForCalendar(event));
      
      // Combine all events
      setEvents([...regularEvents, ...recurringEvents]);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };
  
  // Helper function to format events for the calendar
  const formatEventForCalendar = (event: any): ScheduleEvent => {
    // Create a new object with only the properties we need for ScheduleEvent
    const formattedEvent: ScheduleEvent = {
      id: event.id,
      title: event.title,
      start: new Date(event.start * 1000), // Convert from seconds to milliseconds
      end: new Date(event.end * 1000),     // Convert from seconds to milliseconds
      isAllDay: event.isAllDay,
      type: event.type,
      location: event.location,
      description: event.description,
      color: event.color,
      isRecurring: event.isRecurring
    };
    
    // Handle recurrence data if present
    if (event.recurrenceRule) {
      formattedEvent.recurrenceRule = {
        type: event.recurrenceRule.type,
        interval: event.recurrenceRule.interval,
        pattern: event.recurrenceRule.pattern,
        count: event.recurrenceRule.count,
        // until is now stored in recurrenceEnd
      };
      
      // Add recurrence start/end fields if present
      if (event.recurrenceStart) {
        formattedEvent.recurrenceStart = event.recurrenceStart;
      }
      
      if (event.recurrenceEnd) {
        formattedEvent.recurrenceEnd = event.recurrenceEnd;
        // For backwards compatibility with components that still use until
        formattedEvent.recurrenceRule.until = new Date(event.recurrenceEnd * 1000);
      }
    }
    
    return formattedEvent;
  };
  
  // Load events on component mount
  useEffect(() => {
    if (user) {
      loadEvents();
    }
  }, [user]);

  // Handle event click
  const handleEventClick = (event: ScheduleEvent) => {
    console.log("handle event click", event)
    setSelectedEvent(event);
    setShowEventDetailsDialog(true);
  };
  
  // Handle date click
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    // Optionally open the create event dialog
    // setShowCreateEventDialog(true);
  };
  
  // Handle add event
  const handleAddEvent = (date: Date, presetEvent?: ScheduleEvent) => {
    setSelectedDate(date);
    if (presetEvent) {
      setSelectedEvent(presetEvent);
    } else {
      // Create default event with 1-hour duration
      const endDate = new Date(date);
      endDate.setHours(endDate.getHours() + 1);
      
      const defaultEvent: ScheduleEvent = {
        id: '',
        title: '',
        start: date,
        end: endDate,
        isAllDay: false,
        type: 'event'
      };
      
      setSelectedEvent(defaultEvent);
    }
    setShowCreateEventDialog(true);
  };

  // Handle save event
  const handleSaveEvent = async (eventData: any) => {
    try {
      if (eventData.id) {
        // Update existing event - with our simplified approach, we can directly update any instance
        await handleRegularEventUpdate(eventData);
      } else {
        // Creating a new event
        await handleNewEventCreation(eventData);
      }
      
      // Reload events to get the updated data
      await loadEvents();
      
      setShowCreateEventDialog(false);
      setSelectedEvent(null); // Clear the selected event after saving
    } catch (error) {
      console.error('Error saving event:', error);
      // Could add error handling UI here
    }
  };
  
  // These helper functions are no longer needed with our simplified approach
  
  // Helper function to handle regular event updates
  const handleRegularEventUpdate = async (eventData: any) => {
    // Convert Date objects to epoch seconds for API
    const apiEvent = prepareEventForApi(eventData);
    
    // Update the event via API
    await schedulesApi.update(eventData.id, apiEvent);
  };
  
  // Helper function to handle new event creation
  const handleNewEventCreation = async (eventData: any) => {
    // Convert Date objects to epoch seconds for API
    const apiEvent = prepareEventForApi(eventData);
    
    // Create the event via API
    await schedulesApi.create(apiEvent);
  };
  
  // Helper function to prepare event data for API
  const prepareEventForApi = (eventData: any) => {
    const apiEvent = {
      ...eventData,
      // Handle both Date objects and Unix timestamps
      start: typeof eventData.start === 'number' 
        ? eventData.start 
        : Math.floor(eventData.start.getTime() / 1000),
      end: typeof eventData.end === 'number' 
        ? eventData.end 
        : Math.floor(eventData.end.getTime() / 1000),
      // Remove until from recurrenceRule as it's now stored in recurrenceEnd
      recurrenceRule: eventData.recurrenceRule ? {
        ...eventData.recurrenceRule,
        // Remove until from recurrenceRule
        until: undefined
      } : undefined
    };
    
    // Set recurrenceStart to event start time for recurring events if not already set
    if (eventData.isRecurring && !eventData.recurrenceStart) {
      apiEvent.recurrenceStart = typeof eventData.start === 'number'
        ? eventData.start
        : Math.floor(eventData.start.getTime() / 1000);
    }
    
    // Set recurrenceEnd from the until field in recurrenceRule if present
    if (eventData.isRecurring && eventData.recurrenceRule?.until && !eventData.recurrenceEnd) {
      apiEvent.recurrenceEnd = Math.floor(eventData.recurrenceRule.until.getTime() / 1000);
    }
    
    return apiEvent;
  };
  
  // Handle edit event
  const handleEditEvent = (event: ScheduleEvent) => {
    setSelectedEvent(event);
    setShowCreateEventDialog(true);
  };
  
  // Handle delete event
  const handleDeleteEvent = async (eventId: string) => {
    try {
      // With our simplified approach, we can directly delete any event
      await schedulesApi.delete(eventId);
      
      // Reload events to get the updated state
      await loadEvents();

      setSelectedEvent(null)
      setShowEventDetailsDialog(false);
    } catch (error) {
      console.error('Error deleting event:', error);
      // Could add error handling UI here
    }
  };
  
  // Handle event acknowledgment - just update local state since API call is handled in the dialog
  const handleAcknowledgeEvent = (event: ScheduleEvent) => {
    // Update the event in the local state
    setEvents((prevEvents: ScheduleEvent[]) => 
      prevEvents.map((e: ScheduleEvent) => 
        e.id === event.id && e.instanceId === event.instanceId 
          ? { ...e, acknowledged: true } 
          : e
      )
    );
    
    console.log('Event acknowledged successfully');
    
    // Refresh events to get the latest status
    loadEvents();
  };
  
  // Handle event drop
  const handleEventDrop = (event: ScheduleEvent, newStart: Date, newEnd: Date) => {
    // Create a copy of the event with updated times
    const updatedEvent: ScheduleEvent = {
      ...event,
      start: newStart,
      end: newEnd
    };
    
    // Set the selected event and open the edit dialog
    setSelectedEvent(updatedEvent);
    setShowCreateEventDialog(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="bg-white shadow rounded-lg p-4 sm:p-6 mb-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">My Schedule</h2>
              <p className="mt-1 text-sm text-gray-500">Manage your upcoming events and meetings</p>
            </div>
            <button
              onClick={() => setShowCreateEventDialog(true)}
              className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Event
            </button>
          </div>
          
          {/* Chat Input Box */}
          <ChatInput
            className="mt-4"
            placeholder="Anything in your mind? Talk to me to create a schedule"
            hintText="Press Enter to create a schedule"
            onSubmit={() => {}}
            dispatchEvent={true}
            eventName="triggerChatBubble"
          />
        </div>

        {/* Calendar Component */}
        <div className="bg-white shadow rounded-lg p-4 sm:p-6">
          <div className="h-full">
            <Calendar 
              events={events}
              onEventClick={handleEventClick}
              onDateClick={handleDateClick}
              onAddEvent={handleAddEvent}
              onEventDrop={handleEventDrop}
            />
          </div>
        </div>

      {/* Create Event Dialog */}
      <CreateEventDialog 
        isOpen={showCreateEventDialog}
        onClose={() => {
          setShowCreateEventDialog(false);
          setSelectedEvent(null); // Clear selected event when closing
        }}
        onSave={handleSaveEvent}
        initialDate={selectedDate}
        initialEvent={selectedEvent}
      />
      
      {/* Event Details Dialog */}
      <EventDetailsDialog 
        isOpen={showEventDetailsDialog}
        onClose={() => setShowEventDetailsDialog(false)}
        event={selectedEvent}
        onEdit={handleEditEvent}
        onDelete={handleDeleteEvent}
        onAcknowledge={handleAcknowledgeEvent}
      />
      </div>
    </div>
  );
}

export default function SchedulePage() {
  return (
    <ProtectedRoute>
      <ScheduleContent />
    </ProtectedRoute>
  );
}
