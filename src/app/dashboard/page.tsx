'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Tab } from '@headlessui/react';
import { CalendarIcon, ClipboardIcon, ArrowUpCircleIcon } from '@heroicons/react/24/outline';

function ChatInterface({ tabType }: { tabType: 'schedule' | 'tasks' }) {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{type: 'user' | 'system', content: string}[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    // Add user message to chat
    setChatHistory(prev => [...prev, { type: 'user', content: message }]);

    // Simulate AI response based on tab type
    setTimeout(() => {
      let response = '';
      if (tabType === 'schedule') {
        response = `I'll help you manage your schedule with: "${message}". What date would you like to schedule this for?`;
      } else {
        response = `I'll add "${message}" to your tasks. Would you like to set a priority level or deadline?`;
      }
      setChatHistory(prev => [...prev, { type: 'system', content: response }]);
    }, 1000);

    setMessage('');
  };

  return (
    <div className="mt-4 border rounded-lg overflow-hidden">
      <div className="h-64 p-4 overflow-y-auto bg-gray-50">
        {chatHistory.length === 0 ? (
          <div className="text-center text-gray-500 mt-16">
            <p>Ask me anything about your {tabType === 'schedule' ? 'schedule' : 'tasks'}!</p>
            <p className="text-sm mt-2">For example: {tabType === 'schedule' ? '"Schedule a meeting with John tomorrow at 3pm"' : '"Add a task to review project proposal"'}</p>
          </div>
        ) : (
          chatHistory.map((chat, index) => (
            <div key={index} className={`mb-3 ${chat.type === 'user' ? 'text-right' : ''}`}>
              <div className={`inline-block p-3 rounded-lg ${chat.type === 'user' ? 'bg-blue-500 text-white' : 'bg-white border'}`}>
                {chat.content}
              </div>
            </div>
          ))
        )}
      </div>
      <form onSubmit={handleSubmit} className="flex items-center p-2 border-t">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={`Type a message about your ${tabType}...`}
          className="flex-1 p-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white p-2 rounded-r-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <ArrowUpCircleIcon className="h-6 w-6" />
        </button>
      </form>
    </div>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState(0);

  // Mock user stats - in a real app, these would come from the backend
  const userStats = {
    scheduledEvents: 3,
    completedTasks: 8,
    pendingTasks: 5,
    upcomingDeadlines: 2
  };

  return (
    <div className="w-full h-full px-4 py-4 sm:px-6 sm:py-6">
      {/* Welcome Section with User Profile Status */}
      <div className="bg-white shadow rounded-lg p-4 sm:p-6 mb-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.displayName || user?.email?.split('@')[0] || 'User'}</h1>
            <p className="text-gray-600 mt-1">Here's your current status and activities</p>
          </div>
          <div className="mt-4 md:mt-0 bg-blue-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-blue-800">Last login: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-4 sm:mt-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-500">Scheduled Events</p>
            <p className="text-2xl font-bold text-blue-600">{userStats.scheduledEvents}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-500">Completed Tasks</p>
            <p className="text-2xl font-bold text-green-600">{userStats.completedTasks}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-500">Pending Tasks</p>
            <p className="text-2xl font-bold text-yellow-600">{userStats.pendingTasks}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-500">Upcoming Deadlines</p>
            <p className="text-2xl font-bold text-purple-600">{userStats.upcomingDeadlines}</p>
          </div>
        </div>
      </div>

      {/* Tabbed Interface */}
      <div className="bg-white shadow rounded-lg p-4 sm:p-6">
        <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
          <Tab.List className="flex space-x-1 rounded-xl bg-blue-50 p-1 sticky top-0 z-10">
            <Tab
              className={({ selected }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5 flex items-center justify-center
                 ${selected
                  ? 'bg-white shadow text-blue-700'
                  : 'text-gray-600 hover:bg-white/[0.12] hover:text-blue-700'}`
              }
            >
              <CalendarIcon className="h-5 w-5 mr-2" />
              My Schedule
            </Tab>
            <Tab
              className={({ selected }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5 flex items-center justify-center
                 ${selected
                  ? 'bg-white shadow text-blue-700'
                  : 'text-gray-600 hover:bg-white/[0.12] hover:text-blue-700'}`
              }
            >
              <ClipboardIcon className="h-5 w-5 mr-2" />
              My Tasks
            </Tab>
          </Tab.List>
          <Tab.Panels className="mt-4">
            <Tab.Panel className="rounded-xl p-3">
              <div className="bg-white p-3 sm:p-4 rounded-lg border">
                <h2 className="text-xl font-semibold mb-4">Your Schedule</h2>
                <div className="space-y-4">
                  {/* Mock schedule data - would be dynamic in real app */}
                  <div className="p-3 border rounded-lg flex justify-between items-center">
                    <div>
                      <p className="font-medium">Team Meeting</p>
                      <p className="text-sm text-gray-500">Today, 2:00 PM - 3:00 PM</p>
                    </div>
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">Upcoming</span>
                  </div>
                  <div className="p-3 border rounded-lg flex justify-between items-center">
                    <div>
                      <p className="font-medium">Project Review</p>
                      <p className="text-sm text-gray-500">Tomorrow, 10:00 AM - 11:30 AM</p>
                    </div>
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">Upcoming</span>
                  </div>
                  <div className="p-3 border rounded-lg flex justify-between items-center">
                    <div>
                      <p className="font-medium">Client Call</p>
                      <p className="text-sm text-gray-500">Friday, 4:00 PM - 4:30 PM</p>
                    </div>
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">Upcoming</span>
                  </div>
                </div>
              </div>
              
              {/* Chat Interface for Schedule */}
              <ChatInterface tabType="schedule" />
            </Tab.Panel>
            <Tab.Panel className="rounded-xl p-3">
              <div className="bg-white p-3 sm:p-4 rounded-lg border">
                <h2 className="text-xl font-semibold mb-4">Your Tasks</h2>
                <div className="space-y-4">
                  {/* Mock task data - would be dynamic in real app */}
                  <div className="p-3 border rounded-lg flex justify-between items-center">
                    <div className="flex items-center">
                      <input type="checkbox" className="mr-3 h-4 w-4 text-blue-600" />
                      <div>
                        <p className="font-medium">Complete project proposal</p>
                        <p className="text-sm text-gray-500">Due: Today</p>
                      </div>
                    </div>
                    <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">High</span>
                  </div>
                  <div className="p-3 border rounded-lg flex justify-between items-center">
                    <div className="flex items-center">
                      <input type="checkbox" className="mr-3 h-4 w-4 text-blue-600" />
                      <div>
                        <p className="font-medium">Review marketing materials</p>
                        <p className="text-sm text-gray-500">Due: Tomorrow</p>
                      </div>
                    </div>
                    <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">Medium</span>
                  </div>
                  <div className="p-3 border rounded-lg flex justify-between items-center">
                    <div className="flex items-center">
                      <input type="checkbox" className="mr-3 h-4 w-4 text-blue-600" />
                      <div>
                        <p className="font-medium">Prepare for client meeting</p>
                        <p className="text-sm text-gray-500">Due: Friday</p>
                      </div>
                    </div>
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">Low</span>
                  </div>
                </div>
              </div>
              
              {/* Chat Interface for Tasks */}
              <ChatInterface tabType="tasks" />
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <DashboardContent />
      </div>
    </ProtectedRoute>
  );
}
