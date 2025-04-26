'use client';

import { useState } from 'react';
import { XMarkIcon, PencilIcon, TrashIcon, ClockIcon, MapPinIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { ScheduleEvent } from './Calendar';

interface EventDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  event: ScheduleEvent | null;
  onEdit?: (event: ScheduleEvent) => void;
  onDelete?: (eventId: string) => void;
}

export default function EventDetailsDialog({ 
  isOpen, 
  onClose, 
  event, 
  onEdit, 
  onDelete 
}: EventDetailsDialogProps) {
  if (!isOpen || !event) return null;

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Format time for display
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Get event type badge color
  const getEventTypeBadgeColor = (type: string, isAllDay: boolean = false) => {
    if (isAllDay) {
      return 'bg-green-100 text-green-800';
    }
    
    switch (type) {
      case 'event':
        return 'bg-blue-100 text-blue-800';
      case 'reminder':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold">{event.title}</h2>
            <span className={`text-xs font-medium px-2.5 py-0.5 rounded mt-1 inline-block ${getEventTypeBadgeColor(event.type, event.isAllDay)}`}>
              {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
            </span>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <div className="mt-4 space-y-3">
          {/* Date and Time */}
          <div className="flex items-start">
            <ClockIcon className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
            <div>
              <p className="text-sm font-medium">{formatDate(event.start)}</p>
              {event.isAllDay ? (
                <p className="text-sm text-gray-600">All day</p>
              ) : (
                <p className="text-sm text-gray-600">
                  {formatTime(event.start)} - {formatTime(event.end)}
                </p>
              )}
            </div>
          </div>
          
          {/* Location */}
          {event.location && (
            <div className="flex items-start">
              <MapPinIcon className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
              <p className="text-sm">{event.location}</p>
            </div>
          )}
          
          {/* Description */}
          {event.description && (
            <div className="flex items-start">
              <DocumentTextIcon className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
              <p className="text-sm">{event.description}</p>
            </div>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 mt-6">
          {onDelete && (
            <button
              onClick={() => {
                onDelete(event.id);
                onClose();
              }}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <TrashIcon className="h-4 w-4 mr-1" />
              Delete
            </button>
          )}
          
          {onEdit && (
            <button
              onClick={() => {
                onEdit(event);
                onClose();
              }}
              className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <PencilIcon className="h-4 w-4 mr-1" />
              Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
