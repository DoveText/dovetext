'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, CalendarIcon, MapPinIcon, DocumentTextIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { ScheduleEvent } from './Calendar';
import RecurrenceSettings, { RecurrenceRule } from './RecurrenceSettings';
import FormField from '../common/form/FormField';
import FormInput from '../common/form/FormInput';
import FormTextArea from '../common/form/FormTextArea';

interface CreateEventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: any) => void;
  initialDate?: Date;
  initialEvent?: ScheduleEvent | null;
}

export default function CreateEventDialog({ isOpen, onClose, onSave, initialDate = new Date(), initialEvent = null }: CreateEventDialogProps) {
  const [eventType, setEventType] = useState<'event' | 'reminder'>('event');
  const [isAllDay, setIsAllDay] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(formatDateForInput(initialDate));
  const [startTime, setStartTime] = useState(formatTimeForInput(initialDate));
  const [endTime, setEndTime] = useState(formatTimeForInput(new Date(initialDate.getTime() + 60 * 60 * 1000))); // 1 hour later
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [eventId, setEventId] = useState<string | null>(null);
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule | null>(null);
  
  // Tab state for the dialog
  const [activeTab, setActiveTab] = useState<'details' | 'recurrence'>('details');
  
  // Form validation state
  const [formErrors, setFormErrors] = useState<{
    title?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
  }>({});
  
  // Check if a tab has errors
  const hasTabErrors = (tab: 'details' | 'location' | 'description' | 'recurrence'): boolean => {
    switch (tab) {
      case 'details':
        return !!formErrors.date || !!formErrors.startTime || !!formErrors.endTime;
      default:
        return false;
    }
  };

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
    // Use local date instead of UTC to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Helper function to format time for input
  function formatTimeForInput(date: Date): string {
    // Use local time instead of UTC
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const errors: {[key: string]: string} = {};
    
    if (!title.trim()) {
      errors.title = 'Title is required';
    }
    
    if (!date) {
      errors.date = 'Date is required';
    }
    
    if (!isAllDay) {
      if (!startTime) {
        errors.startTime = 'Start time is required';
      }
      
      if (!endTime && eventType !== 'reminder') {
        errors.endTime = 'End time is required';
      }
      
      // Validate that end time is after start time
      if (startTime && endTime && eventType !== 'reminder') {
        const [startHours, startMinutes] = startTime.split(':').map(Number);
        const [endHours, endMinutes] = endTime.split(':').map(Number);
        
        if (endHours < startHours || (endHours === startHours && endMinutes <= startMinutes)) {
          errors.endTime = 'End time must be after start time';
        }
      }
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      
      // Switch to the tab with errors
      if (errors.date || errors.startTime || errors.endTime) {
        setActiveTab('details');
      }
      
      return;
    }
    
    // Create start and end date objects
    const startDate = new Date(date);
    const endDate = new Date(date);
    
    if (!isAllDay) {
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
    
    // Create event object with all required fields
    // Convert to Unix timestamps for API compatibility
    const startTimestamp = Math.floor(startDate.getTime() / 1000);
    const endTimestamp = Math.floor(endDate.getTime() / 1000);
    
    // Create the event data with Unix timestamps instead of Date objects
    // This ensures timezone consistency between frontend and backend
    const eventData = {
      id: eventId, // Include the ID for editing existing events
      title,
      start: startTimestamp, // Use Unix timestamp to avoid timezone issues
      end: endTimestamp,     // Use Unix timestamp to avoid timezone issues
      isAllDay,
      type: eventType,
      location: location || undefined,
      description: description || undefined,
      isRecurring: !!recurrenceRule,
      recurrenceRule: recurrenceRule ? {
        type: recurrenceRule.type,
        interval: recurrenceRule.interval,
        pattern: recurrenceRule.pattern || {},
        count: recurrenceRule.count,
        // until is now handled by recurrenceEnd directly in the schedule
      } : undefined,
      // Set recurrenceStart to the event start time for recurring events
      recurrenceStart: recurrenceRule ? startTimestamp : undefined,
      // Set recurrenceEnd to the until date if specified
      recurrenceEnd: recurrenceRule?.until ? Math.floor(recurrenceRule.until.getTime() / 1000) : undefined
    };
    
    // Debug log to see what's being sent
    console.log('Saving event with data:', JSON.stringify(eventData, null, 2));
    
    // First save the event data
    onSave(eventData);
    
    // Close the dialog first, then reset the form
    // This prevents the form from visibly changing before the dialog closes
    onClose();
    
    // Reset form after a short delay to ensure it happens after the dialog is closed
    setTimeout(() => {
      resetForm();
    }, 100);
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
    setIsAllDay(false);
    setIsEditing(false);
    setEventId(null);
    setRecurrenceRule(null);
    setFormErrors({});
    setActiveTab('details');
  };
  
  // Handle event type change
  const handleEventTypeChange = (type: 'event' | 'reminder') => {
    setEventType(type);
    
    // When switching to reminder type, clear location
    if (type === 'reminder') {
      setLocation('');
      // Also switch to details tab if we're on recurrence tab
      if (activeTab === 'recurrence') {
        setActiveTab('details');
      }
    }
  };
  
  // Load event data when initialEvent changes
  useEffect(() => {
    if (initialEvent && isOpen) {
      // Only set isEditing to true if the event has a non-empty ID
      // This ensures that time range selections (which create a default event with empty ID)
      // are treated as new events, not edits
      setIsEditing(!!initialEvent.id && initialEvent.id !== '');
      setEventId(initialEvent.id);
      setTitle(initialEvent.title);
      setEventType(initialEvent.type as 'event' | 'reminder');
      setDate(formatDateForInput(initialEvent.start));
      
      if (!initialEvent.isAllDay) {
        setStartTime(formatTimeForInput(initialEvent.start));
        // Only set end time for non-reminder events
        if (initialEvent.type !== 'reminder') {
          setEndTime(formatTimeForInput(initialEvent.end));
        }
      }
      
      setIsAllDay(initialEvent.isAllDay);
      
      // Only set location for ordinary events
      if (initialEvent.type === 'event') {
        setLocation(initialEvent.location || '');
      } else {
        setLocation('');
      }
      
      setDescription(initialEvent.description || '');
      
      // Set recurrence rule if present
      if (initialEvent.recurrenceRule) {
        setRecurrenceRule(initialEvent.recurrenceRule);
      } else {
        setRecurrenceRule(null);
      }
    } else if (!initialEvent && isOpen) {
      // Reset form when opening for a new event
      resetForm();
    }
  }, [initialEvent, isOpen]);
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      
      <div className="bg-white rounded-lg shadow-xl w-full max-w-xl mx-4 z-10 overflow-hidden">
        {/* Dialog Header */}
        <div className="bg-blue-600 text-white px-4 py-3 flex justify-between items-center">
          <h2 className="text-xl font-semibold">{isEditing ? 'Edit Event' : 'Create Event'}</h2>
          <button onClick={onClose} className="text-white hover:text-gray-200">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        {/* Dialog Content */}
        <form onSubmit={handleSubmit}>
          {/* Title Field and Event Type Selection - Always visible at the top */}
          <div className="p-4 pb-2">
            <FormField label="Title" htmlFor="event-title" error={formErrors.title}>
              <FormInput
                id="event-title"
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (formErrors.title) {
                    setFormErrors({...formErrors, title: undefined});
                  }
                }}
                placeholder="Add title"
                required
                error={formErrors.title}
              />
            </FormField>
            
            <div className="flex items-center mt-3 justify-between">
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="eventType"
                    value="event"
                    checked={eventType === 'event'}
                    onChange={() => handleEventTypeChange('event')}
                    className="mr-2"
                  />
                  <span>Event</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="eventType"
                    value="reminder"
                    checked={eventType === 'reminder'}
                    onChange={() => handleEventTypeChange('reminder')}
                    className="mr-2"
                  />
                  <span>Reminder</span>
                </label>
              </div>
              
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isAllDay}
                    onChange={(e) => setIsAllDay(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm">All day</span>
                </label>
                
                <label className="flex items-center">
                  <span className="text-sm mr-2">Recurring</span>
                  <div className="relative inline-block w-10 align-middle select-none">
                    <input
                      type="checkbox"
                      checked={!!recurrenceRule}
                      onChange={() => {
                        if (recurrenceRule) {
                          // If turning off recurrence, set to null
                          setRecurrenceRule(null);
                        } else {
                          // If turning on recurrence, create a basic rule and switch to recurrence tab
                          const newRule = {
                            type: 'DAILY' as const,
                            interval: 1,
                            pattern: {}
                          };
                          setRecurrenceRule(newRule);
                          // Automatically switch to recurrence tab when enabling recurrence
                          setActiveTab('recurrence');
                        }
                      }}
                      className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                      style={{ 
                        right: recurrenceRule ? '0' : 'auto', 
                        backgroundColor: recurrenceRule ? '#3b82f6' : 'white',
                        borderColor: recurrenceRule ? '#3b82f6' : '#d1d5db'
                      }}
                    />
                    <label 
                      className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"
                      style={{ backgroundColor: recurrenceRule ? '#bfdbfe' : '#d1d5db' }}
                    ></label>
                  </div>
                </label>
              </div>
            </div>
          </div>
          
          {/* Tabs Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex" aria-label="Tabs">
              <button
                type="button"
                onClick={() => setActiveTab('details')}
                className={`w-1/2 py-2 px-1 text-center border-b-2 text-xs font-medium ${
                  activeTab === 'details' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } ${hasTabErrors('details') ? 'text-red-500' : ''}`}
              >
                <CalendarIcon className="h-4 w-4 mx-auto mb-1" />
                <span>Event Details</span>
                {hasTabErrors('details') && <span className="absolute top-1 right-2 h-2 w-2 bg-red-500 rounded-full"></span>}
              </button>
              <button
                type="button"
                onClick={() => recurrenceRule && setActiveTab('recurrence')}
                className={`w-1/2 py-2 px-1 text-center border-b-2 text-xs font-medium ${
                  activeTab === 'recurrence' 
                    ? 'border-blue-500 text-blue-600' 
                    : recurrenceRule 
                      ? 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      : 'border-transparent text-gray-300 cursor-not-allowed'
                }`}
                disabled={!recurrenceRule}
              >
                <ArrowPathIcon className="h-4 w-4 mx-auto mb-1" />
                <span>Recurring Settings</span>
                {recurrenceRule && <span className="absolute top-1 right-2 h-2 w-2 bg-blue-500 rounded-full"></span>}
              </button>
            </nav>
          </div>
          
          {/* Tab Content */}
          <div className="p-4">
            {/* Details Tab */}
            {activeTab === 'details' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Date" htmlFor="event-date" error={formErrors.date}>
                    <FormInput
                      id="event-date"
                      type="date"
                      value={date}
                      onChange={(e) => {
                        setDate(e.target.value);
                        if (formErrors.date) {
                          setFormErrors({...formErrors, date: undefined});
                        }
                      }}
                      required
                      error={formErrors.date}
                    />
                  </FormField>
                  
                  {!isAllDay && (
                    <FormField label="Start Time" htmlFor="event-start-time" error={formErrors.startTime}>
                      <FormInput
                        id="event-start-time"
                        type="time"
                        value={startTime}
                        onChange={(e) => {
                          setStartTime(e.target.value);
                          if (formErrors.startTime) {
                            setFormErrors({...formErrors, startTime: undefined});
                          }
                        }}
                        required
                        error={formErrors.startTime}
                      />
                    </FormField>
                  )}
                  
                  {!isAllDay && eventType !== 'reminder' && (
                    <div className={isAllDay ? "col-span-2" : "col-start-2"}>
                      <FormField label="End Time" htmlFor="event-end-time" error={formErrors.endTime}>
                        <FormInput
                          id="event-end-time"
                          type="time"
                          value={endTime}
                          onChange={(e) => {
                            setEndTime(e.target.value);
                            if (formErrors.endTime) {
                              setFormErrors({...formErrors, endTime: undefined});
                            }
                          }}
                          required
                          error={formErrors.endTime}
                        />
                      </FormField>
                    </div>
                  )}
                </div>
                
                {/* Location field */}
                {eventType !== 'reminder' && (
                  <FormField label="Location" htmlFor="event-location">
                    <FormInput
                      id="event-location"
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Add location"
                    />
                  </FormField>
                )}
                
                {/* Description field */}
                <FormField label="Description" htmlFor="event-description">
                  <FormTextArea
                    id="event-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    placeholder="Add description or notes"
                  />
                </FormField>
              </div>
            )}
            
            {/* Recurrence Tab */}
            {activeTab === 'recurrence' && recurrenceRule && (
              <RecurrenceSettings 
                initialDate={new Date(date)}
                value={recurrenceRule}
                onChange={setRecurrenceRule}
              />
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 p-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {isEditing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
