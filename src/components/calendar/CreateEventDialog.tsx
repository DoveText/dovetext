'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { ScheduleEvent } from './Calendar';

interface CreateEventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: any) => void;
  initialDate?: Date;
  initialEvent?: ScheduleEvent | null;
}

export default function CreateEventDialog({ isOpen, onClose, onSave, initialDate = new Date(), initialEvent = null }: CreateEventDialogProps) {
  const [eventType, setEventType] = useState<'event' | 'reminder' | 'all-day'>('event');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(formatDateForInput(initialDate));
  const [startTime, setStartTime] = useState(formatTimeForInput(initialDate));
  const [endTime, setEndTime] = useState(formatTimeForInput(new Date(initialDate.getTime() + 60 * 60 * 1000))); // 1 hour later
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [eventId, setEventId] = useState<string | null>(null);

  // Update form when initialDate changes (for new events)
  useEffect(() => {
    if (!initialEvent) {
      setDate(formatDateForInput(initialDate));
      setStartTime(formatTimeForInput(initialDate));
      setEndTime(formatTimeForInput(new Date(initialDate.getTime() + 60 * 60 * 1000)));
    }
  }, [initialDate, initialEvent]);

  // Helper function to format date for input
  function formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  // Helper function to format time for input
  function formatTimeForInput(date: Date): string {
    return date.toTimeString().slice(0, 5);
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create start and end date objects
    const startDate = new Date(date);
    const endDate = new Date(date);
    
    if (eventType !== 'all-day') {
      // Parse start time
      const [startHours, startMinutes] = startTime.split(':').map(Number);
      startDate.setHours(startHours, startMinutes, 0, 0);
      
      if (eventType === 'reminder') {
        // For reminders, set end time to 15 minutes after start time
        endDate.setHours(startHours, startMinutes + 15, 0, 0);
      } else {
        // Parse end time for regular events
        const [endHours, endMinutes] = endTime.split(':').map(Number);
        endDate.setHours(endHours, endMinutes, 0, 0);
      }
    } else {
      // For all-day events, set to full day
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    }
    
    // Create event object
    const eventData = {
      id: eventId, // Include the ID for editing existing events
      title,
      start: startDate,
      end: endDate,
      isAllDay: eventType === 'all-day',
      type: eventType,
      location,
      description
    };
    
    onSave(eventData);
    resetForm();
  };
  
  // Reset form fields
  const resetForm = () => {
    setTitle('');
    setDate(formatDateForInput(new Date()));
    setStartTime(formatTimeForInput(new Date()));
    setEndTime(formatTimeForInput(new Date(Date.now() + 60 * 60 * 1000)));
    setLocation('');
    setDescription('');
    setEventType('event');
    setIsEditing(false);
    setEventId(null);
  };
  
  // Handle event type change
  useEffect(() => {
    // When switching to reminder type, clear location
    if (eventType !== 'event') {
      setLocation('');
    }
  }, [eventType]);

  // Load event data when initialEvent changes
  useEffect(() => {
    if (initialEvent && isOpen) {
      setIsEditing(true);
      setEventId(initialEvent.id);
      setTitle(initialEvent.title);
      setEventType(initialEvent.type);
      setDate(formatDateForInput(initialEvent.start));
      
      if (!initialEvent.isAllDay) {
        setStartTime(formatTimeForInput(initialEvent.start));
        // Only set end time for non-reminder events
        if (initialEvent.type !== 'reminder') {
          setEndTime(formatTimeForInput(initialEvent.end));
        }
      }
      
      // Only set location for ordinary events
      if (initialEvent.type !== 'event') {
        setLocation(initialEvent.location || '');
      } else {
        setLocation('');
      }
      
      setDescription(initialEvent.description || '');
    } else if (!initialEvent && isOpen) {
      // Reset form when opening for a new event
      resetForm();
    }
  }, [initialEvent, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {eventType === 'reminder' 
              ? (isEditing ? 'Edit Reminder' : 'Create New Reminder')
              : (isEditing ? 'Edit Event' : 'Create New Event')
            }
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Event Type Selection */}
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="eventType"
                checked={eventType === 'event'}
                onChange={() => setEventType('event')}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">Event</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="eventType"
                checked={eventType === 'reminder'}
                onChange={() => setEventType('reminder')}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">Reminder</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="eventType"
                checked={eventType === 'all-day'}
                onChange={() => setEventType('all-day')}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">All Day</span>
            </label>
          </div>
          
          {/* Event/Reminder Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {eventType === 'reminder' ? 'Reminder Title' : 'Event Title'}
            </label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            />
          </div>
          
          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            />
          </div>
          
          {/* Time (only for non-all-day events) */}
          {eventType !== 'all-day' && (
            <div className={eventType === 'reminder' ? '' : 'grid grid-cols-2 gap-4'}>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {eventType === 'reminder' ? 'Reminder Time' : 'Start Time'}
                </label>
                <input 
                  type="time" 
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required
                />
              </div>
              {eventType !== 'reminder' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Time</label>
                  <input 
                    type="time" 
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    required
                  />
                </div>
              )}
            </div>
          )}
          
          {/* Location - only for events, not for reminders or all-day events */}
          {eventType === 'event' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <input 
                type="text" 
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>
          )}
          
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" 
              rows={3}
            ></textarea>
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              {eventType === 'reminder'
                ? (isEditing ? 'Update Reminder' : 'Create Reminder')
                : (isEditing ? 'Update Event' : 'Create Event')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
