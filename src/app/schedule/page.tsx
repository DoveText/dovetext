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
  
  // Load events from API on component mount
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30); // Get events from 30 days ago
        
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 60); // Get events up to 60 days in the future
        
        const data = await schedulesApi.getByDateRange(
          Math.floor(startDate.getTime() / 1000), // Convert to epoch seconds
          Math.floor(endDate.getTime() / 1000)    // Convert to epoch seconds
        );
        
        // Convert epoch seconds to Date objects
        const formattedEvents: ScheduleEvent[] = data.map(event => ({
          ...event,
          start: new Date(event.start * 1000), // Convert from seconds to milliseconds
          end: new Date(event.end * 1000)     // Convert from seconds to milliseconds
        }));
        
        setEvents(formattedEvents);
      } catch (error) {
        console.error('Error loading events:', error);
      }
    };
    
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
      // Convert Date objects to epoch seconds for API
      const apiEventData = {
        title: eventData.title,
        start: Math.floor(eventData.start.getTime() / 1000), // Convert to epoch seconds
        end: Math.floor(eventData.end.getTime() / 1000),     // Convert to epoch seconds
        isAllDay: eventData.isAllDay,
        type: eventData.type,
        location: eventData.location,
        description: eventData.description
      };
      
      let savedEvent: Schedule;
      let updatedEvents: ScheduleEvent[];
      
      // Check if we're editing an existing event or creating a new one
      if (eventData.id) {
        // Update existing event
        savedEvent = await schedulesApi.update(eventData.id, apiEventData);
        
        // Update the event in the local state
        updatedEvents = events.map(event => {
          if (event.id === eventData.id) {
            return {
              ...savedEvent,
              start: new Date(savedEvent.start * 1000), // Convert from seconds to milliseconds
              end: new Date(savedEvent.end * 1000)      // Convert from seconds to milliseconds
            };
          }
          return event;
        });
      } else {
        // Create new event
        savedEvent = await schedulesApi.create(apiEventData);
        
        // Add new event to the local state
        const newEvent: ScheduleEvent = {
          ...savedEvent,
          start: new Date(savedEvent.start * 1000), // Convert from seconds to milliseconds
          end: new Date(savedEvent.end * 1000)      // Convert from seconds to milliseconds
        };
        
        updatedEvents = [...events, newEvent];
      }
      
      setEvents(updatedEvents);
      setShowCreateEventDialog(false);
      setSelectedEvent(null); // Clear the selected event after saving
    } catch (error) {
      console.error('Error saving event:', error);
      // Could add error handling UI here
    }
  };
  
  // Handle edit event
  const handleEditEvent = (event: ScheduleEvent) => {
    setSelectedEvent(event);
    setShowCreateEventDialog(true);
  };
  
  // Handle delete event
  const handleDeleteEvent = async (eventId: string) => {
    try {
      await schedulesApi.delete(eventId);
      setEvents(events.filter(event => event.id !== eventId));
      setShowEventDetailsDialog(false);
    } catch (error) {
      console.error('Error deleting event:', error);
      // Could add error handling UI here
    }
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
          <div className="h-[calc(100vh-240px)]">
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
