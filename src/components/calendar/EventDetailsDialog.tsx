'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, PencilIcon, TrashIcon, ClockIcon, MapPinIcon, DocumentTextIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { schedulesApi } from '@/app/api/schedules';
import { ScheduleEvent } from './Calendar';

interface EventDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  event: ScheduleEvent | null;
  onEdit?: (event: ScheduleEvent) => void;
  onDelete?: (eventId: string) => void;
  onAcknowledge?: (event: ScheduleEvent) => void;
}

export default function EventDetailsDialog({ 
  isOpen, 
  onClose, 
  event, 
  onEdit, 
  onDelete,
  onAcknowledge 
}: EventDetailsDialogProps) {
  const [instanceDetails, setInstanceDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Define type for instance status
  interface InstanceStatus {
    id: number;
    scheduleId: number;
    status: string;
    acknowledged: boolean;
    start: number;
    end: number;
  }

  // Fetch instance status when the dialog opens and the event has an instanceId
  useEffect(() => {
    if (isOpen && event) {
      setIsLoading(true);
      schedulesApi.getInstanceStatus(event.id, event.instanceId || 0)
        .then((status: InstanceStatus) => {
          setInstanceDetails(status);
          console.log('Fetched instance status:', status);
        })
        .catch((error: Error) => {
          console.error('Error fetching instance status:', error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setInstanceDetails(null);
    }
  }, [isOpen, event]);
  
  if (!isOpen || !event) return null;
  
  // Check if a date is from the current day
  const isCurrentDay = (date: Date): boolean => {
    const now = new Date();
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    );
  };

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
  
  // Get status indicator color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-blue-500';
      case 'STARTED':
        return 'bg-yellow-500';
      case 'COMPLETED':
        return 'bg-green-500';
      case 'MISSED':
        return 'bg-red-500';
      case 'CANCELED':
        return 'bg-gray-500';
      default:
        return 'bg-gray-300';
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold">{event.title}</h2>
            <div className="flex flex-wrap gap-2 mt-1">
              <span className={`text-xs font-medium px-2.5 py-0.5 rounded inline-block ${getEventTypeBadgeColor(event.type, event.isAllDay)}`}>
                {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
              </span>
              {(instanceDetails?.acknowledged || event.acknowledged) && (
                <span className="text-xs font-medium px-2.5 py-0.5 rounded inline-block bg-green-100 text-green-800">
                  You have acknowledged this {event.type}
                </span>
              )}
            </div>
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
              ) : event.type === 'reminder' ? (
                <p className="text-sm text-gray-600">
                  {formatTime(event.start)}
                </p>
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
          
          {/* Instance Status - Show for all events */}
          <div className="flex items-start mt-2">
            <CheckCircleIcon className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Status</p>
              <div className="flex items-center mt-1">
                {isLoading ? (
                  <p className="text-sm text-gray-600">Loading status...</p>
                ) : (
                  <>
                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${getStatusColor(instanceDetails?.status || event.status || 'SCHEDULED')}`}></span>
                    <p className="text-sm text-gray-600">
                      {instanceDetails?.status || event.status || 'SCHEDULED'}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 mt-6">
          {/* Acknowledge Button - Only show for instances from the current day that aren't already acknowledged */}
          {onAcknowledge &&
           (!instanceDetails || !instanceDetails.acknowledged) && (
            <button
              onClick={async () => {
                try {
                  // Call the API to acknowledge the instance
                  await schedulesApi.acknowledgeInstance(event?.id, instanceDetails.id);
                  
                  // Update the local state
                  if (onAcknowledge) {
                    const updatedEvent = { ...event, acknowledged: true };
                    onAcknowledge(updatedEvent);
                  }
                  
                  // Update instance details locally
                  if (instanceDetails) {
                    setInstanceDetails({
                      ...instanceDetails,
                      acknowledged: true
                    });
                  }
                  
                  onClose();
                } catch (error) {
                  console.error('Failed to acknowledge schedule instance:', error);
                  // You could add error handling UI here
                }
              }}
              className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
              // Disable button if event is not from the current day or if loading
              disabled={!isCurrentDay(event.start) || isLoading}
            >
              <CheckCircleIcon className="h-4 w-4 mr-1" />
              {isLoading ? 'Loading...' : 'Acknowledge'}
            </button>
          )}
          
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
