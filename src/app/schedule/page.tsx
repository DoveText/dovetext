'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { CalendarIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useAction } from '@/context/ActionContext';

function ScheduleContent() {
  const { user } = useAuth();
  const actionContext = useAction();
  const [showCreateEventDialog, setShowCreateEventDialog] = useState(false);
  
  // Handle pending actions from the ActionContext
  useEffect(() => {
    if (actionContext.pendingAction === 'create-event') {
      setShowCreateEventDialog(true);
      actionContext.clearPendingAction();
    }
  }, [actionContext]);

  return (
    <div className="w-full h-full px-4 py-4 sm:px-6 sm:py-6">
      {/* Header Section */}
      <div className="bg-white shadow rounded-lg p-4 sm:p-6 mb-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Schedule</h1>
            <p className="text-gray-600 mt-1">Manage your upcoming events and meetings</p>
          </div>
          <button
            onClick={() => setShowCreateEventDialog(true)}
            className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Event
          </button>
        </div>
      </div>

      {/* Schedule Content */}
      <div className="bg-white shadow rounded-lg p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Upcoming Events</h2>
          <div className="flex space-x-2">
            <button className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-md">Today</button>
            <button className="px-3 py-1 text-sm bg-gray-50 text-gray-700 rounded-md">Week</button>
            <button className="px-3 py-1 text-sm bg-gray-50 text-gray-700 rounded-md">Month</button>
          </div>
        </div>

        <div className="space-y-4">
          {/* Today's Events */}
          <div className="border-b pb-2">
            <h3 className="text-md font-medium text-gray-700 mb-2">Today</h3>
            <div className="space-y-3">
              <div className="p-3 border rounded-lg flex justify-between items-center hover:bg-gray-50">
                <div className="flex items-start">
                  <div className="bg-blue-100 p-2 rounded-md mr-3">
                    <CalendarIcon className="h-5 w-5 text-blue-700" />
                  </div>
                  <div>
                    <p className="font-medium">Team Meeting</p>
                    <p className="text-sm text-gray-500">2:00 PM - 3:00 PM</p>
                    <p className="text-sm text-gray-500">Conference Room A</p>
                  </div>
                </div>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">Upcoming</span>
              </div>
            </div>
          </div>

          {/* Tomorrow's Events */}
          <div className="border-b pb-2">
            <h3 className="text-md font-medium text-gray-700 mb-2">Tomorrow</h3>
            <div className="space-y-3">
              <div className="p-3 border rounded-lg flex justify-between items-center hover:bg-gray-50">
                <div className="flex items-start">
                  <div className="bg-blue-100 p-2 rounded-md mr-3">
                    <CalendarIcon className="h-5 w-5 text-blue-700" />
                  </div>
                  <div>
                    <p className="font-medium">Project Review</p>
                    <p className="text-sm text-gray-500">10:00 AM - 11:30 AM</p>
                    <p className="text-sm text-gray-500">Virtual Meeting</p>
                  </div>
                </div>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">Upcoming</span>
              </div>
            </div>
          </div>

          {/* Later Events */}
          <div>
            <h3 className="text-md font-medium text-gray-700 mb-2">Later This Week</h3>
            <div className="space-y-3">
              <div className="p-3 border rounded-lg flex justify-between items-center hover:bg-gray-50">
                <div className="flex items-start">
                  <div className="bg-blue-100 p-2 rounded-md mr-3">
                    <CalendarIcon className="h-5 w-5 text-blue-700" />
                  </div>
                  <div>
                    <p className="font-medium">Client Call</p>
                    <p className="text-sm text-gray-500">Friday, 4:00 PM - 4:30 PM</p>
                    <p className="text-sm text-gray-500">Phone Call</p>
                  </div>
                </div>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">Upcoming</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Event Dialog - Would be a separate component in a real app */}
      {showCreateEventDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Create New Event</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Event Title</label>
                <input type="text" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <input type="date" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Time</label>
                  <input type="time" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <input type="text" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" rows={3}></textarea>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateEventDialog(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateEventDialog(false)}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
