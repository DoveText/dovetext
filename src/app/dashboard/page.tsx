'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Tab } from '@headlessui/react';
import { CalendarIcon, ClipboardIcon } from '@heroicons/react/24/outline';

// Removed the embedded TaskOrientedChat component as it's now a standalone component

function DashboardContent({ activeTab }: { activeTab: number }) {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState(activeTab);
  // Keep selectedTab in sync with activeTab from parent
  useEffect(() => {
    setSelectedTab(activeTab);
  }, [activeTab]);

  // Share the selected tab with parent component
  useEffect(() => {
    // This would normally use a context or prop function
    // For now we'll use a custom event
    window.dispatchEvent(new CustomEvent('tabChange', { detail: { tab: selectedTab } }));
  }, [selectedTab]);

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
              
              {/* No embedded chat interface here anymore */}
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
              
              {/* No embedded chat interface here anymore */}
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState(0);
  
  // Listen for tab changes and custom events
  useEffect(() => {
    const handleTabChange = (e: any) => {
      setActiveTab(e.detail.tab);
    };
    
    const handleSwitchTab = (e: any) => {
      setActiveTab(e.detail.tab);
    };
    
    window.addEventListener('tabChange', handleTabChange);
    window.addEventListener('switchTab', handleSwitchTab);
    
    return () => {
      window.removeEventListener('tabChange', handleTabChange);
      window.removeEventListener('switchTab', handleSwitchTab);
    };
  }, []);
  
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <DashboardContent activeTab={activeTab} />
      </div>
    </ProtectedRoute>
  );
}
