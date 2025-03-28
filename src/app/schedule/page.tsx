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
import { getMockScheduleEvents } from '@/lib/mockData/scheduleEvents';

function ScheduleContent() {
  const { user } = useAuth();
  const actionContext = useAction();
  const [showCreateEventDialog, setShowCreateEventDialog] = useState(false);
  const [showEventDetailsDialog, setShowEventDetailsDialog] = useState(false);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedView, setSelectedView] = useState<CalendarViewType>('week');
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
  
  // Load mock events on component mount
  useEffect(() => {
    setEvents(getMockScheduleEvents());
  }, []);

  // Handle event click
  const handleEventClick = (event: ScheduleEvent) => {
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
  const handleAddEvent = (date: Date) => {
    setSelectedDate(date);
    setShowCreateEventDialog(true);
  };

  // Handle save event
  const handleSaveEvent = (eventData: any) => {
    const newEvent: ScheduleEvent = {
      id: `event-${Date.now()}`, // Generate a unique ID
      ...eventData
    };
    
    setEvents([...events, newEvent]);
    setShowCreateEventDialog(false);
    setSelectedEvent(null); // Clear the selected event after saving
  };
  
  // Handle edit event
  const handleEditEvent = (event: ScheduleEvent) => {
    setSelectedEvent(event);
    setShowCreateEventDialog(true);
    // In a real app, you would pre-populate the form with the event data
  };
  
  // Handle delete event
  const handleDeleteEvent = (eventId: string) => {
    setEvents(events.filter(event => event.id !== eventId));
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
            />
          </div>
        </div>

      {/* Create Event Dialog */}
      <CreateEventDialog 
        isOpen={showCreateEventDialog}
        onClose={() => setShowCreateEventDialog(false)}
        onSave={handleSaveEvent}
        initialDate={selectedDate}
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
