'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { CalendarIcon, SparklesIcon, ArrowRightIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useAction } from '@/context/ActionContext';
import ChatInput from '@/components/common/ChatInput';

function DashboardContent() {
  const { user } = useAuth();
  const router = useRouter();
  const actionContext = useAction();
  const [showCreateTaskDialog, setShowCreateTaskDialog] = useState(false);
  
  // Handle pending actions from the ActionContext
  useEffect(() => {
    if (actionContext.pendingAction === 'create-task') {
      // Navigate to tasks page
      router.push('/tasks');
      // Clear the pending action
      actionContext.clearPendingAction();
    }
  }, [actionContext, router]);

  // Time range options for stats
  const timeRanges = [
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' }
  ];
  
  // Selected time range state
  const [selectedTimeRange, setSelectedTimeRange] = useState<'today' | 'week' | 'month'>('week');
  
  // Generate date range subtitle based on selected time range
  const getDateRangeSubtitle = () => {
    const today = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    if (selectedTimeRange === 'today') {
      return formatter.format(today);
    } else if (selectedTimeRange === 'week') {
      // Get start of week (Sunday)
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      
      // Get end of week (Saturday)
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      return `${formatter.format(startOfWeek)} - ${formatter.format(endOfWeek)}`;
    } else { // month
      // Get start of month
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
      // Get end of month
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      return `${formatter.format(startOfMonth)} - ${formatter.format(endOfMonth)}`;
    }
  };
  
  // Mock user stats based on selected time range - in a real app, these would come from the backend
  const userStatsByRange = {
    today: {
      totalSchedules: 3,
      missedSchedules: 1,
      automationExecutions: 5,
      failedExecutions: 0
    },
    week: {
      totalSchedules: 12,
      missedSchedules: 2,
      automationExecutions: 28,
      failedExecutions: 3
    },
    month: {
      totalSchedules: 45,
      missedSchedules: 8,
      automationExecutions: 120,
      failedExecutions: 7
    }
  };
  
  // Get stats for the selected time range
  const userStats = userStatsByRange[selectedTimeRange];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Section with User Profile Status */}
      <div className="bg-white shadow rounded-lg p-4 sm:p-6 mb-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.displayName || user?.email?.split('@')[0] || 'User'}</h1>
            <p className="text-gray-600 mt-1">Here&apos;s your current status and activities</p>
          </div>
          <div className="mt-4 md:mt-0 flex flex-col items-end">
            <div className="bg-blue-50 p-3 rounded-lg mb-2">
              <p className="text-sm font-medium text-blue-800">Last login: {new Date().toLocaleDateString()}</p>
            </div>
            <div className="flex flex-col items-end">
              <div className="flex space-x-2 text-sm">
                {timeRanges.map(range => (
                  <button
                    key={range.id}
                    onClick={() => setSelectedTimeRange(range.id as 'today' | 'week' | 'month')}
                    className={`px-3 py-1 rounded-md ${
                      selectedTimeRange === range.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {getDateRangeSubtitle()}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-4 sm:mt-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-500">Total Schedules</p>
            <p className="text-2xl font-bold text-blue-600">{userStats.totalSchedules}</p>
            <p className="text-xs text-gray-500 mt-1">Events in selected period</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-500">Missed Schedules</p>
            <p className="text-2xl font-bold text-red-600">{userStats.missedSchedules}</p>
            <p className="text-xs text-gray-500 mt-1">Unacknowledged past events</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-500">Automation Executions</p>
            <p className="text-2xl font-bold text-green-600">{userStats.automationExecutions}</p>
            <p className="text-xs text-gray-500 mt-1">Total runs in period</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-500">Failed Executions</p>
            <p className="text-2xl font-bold text-yellow-600">{userStats.failedExecutions}</p>
            <p className="text-xs text-gray-500 mt-1">Errors during automation</p>
          </div>
        </div>
        
        {/* Chat Input Box - After Stats */}
        <ChatInput 
          className="mt-6"
          placeholder="What's in your mind today, talk to me now..."
          hintText="Press Enter to submit"
          onSubmit={() => {}}
          dispatchEvent={true}
          eventName="triggerChatBubble"
        />
      </div>

      {/* Schedule Card */}
      <div className="bg-white shadow rounded-lg p-4 sm:p-6 mb-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <CalendarIcon className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold">Upcoming Schedule</h2>
          </div>
          <Link 
            href="/schedule"
            className="text-blue-600 hover:text-blue-800 flex items-center text-sm font-medium"
          >
            View All
            <ArrowRightIcon className="h-4 w-4 ml-1" />
          </Link>
        </div>
        
        <div className="space-y-3">
          {/* Mock schedule data - would be dynamic in real app */}
          <div className="p-3 border rounded-lg flex justify-between items-center hover:bg-gray-50">
            <div>
              <p className="font-medium">Team Meeting</p>
              <p className="text-sm text-gray-500">Today, 2:00 PM - 3:00 PM</p>
            </div>
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">Upcoming</span>
          </div>
          <div className="p-3 border rounded-lg flex justify-between items-center hover:bg-gray-50">
            <div>
              <p className="font-medium">Project Review</p>
              <p className="text-sm text-gray-500">Tomorrow, 10:00 AM - 11:30 AM</p>
            </div>
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">Upcoming</span>
          </div>
        </div>
      </div>
      
      {/* Tasks Card */}
      <div className="bg-white shadow rounded-lg p-4 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <SparklesIcon className="h-6 w-6 text-yellow-600 mr-2" />
            <h2 className="text-xl font-semibold">AI Automations</h2>
          </div>
          <Link 
            href="/tasks"
            className="text-blue-600 hover:text-blue-800 flex items-center text-sm font-medium"
          >
            View All
            <ArrowRightIcon className="h-4 w-4 ml-1" />
          </Link>
        </div>
        
        <div className="space-y-3">
          {/* Mock task data - would be dynamic in real app */}
          <div className="p-3 border rounded-lg flex justify-between items-center hover:bg-gray-50">
            <div className="flex items-center">
              <button className="mr-3 h-5 w-5 rounded-full border border-gray-300 flex items-center justify-center"></button>
              <div>
                <p className="font-medium">Complete project proposal</p>
                <p className="text-sm text-gray-500">Due: Today</p>
              </div>
            </div>
            <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">High</span>
          </div>
          <div className="p-3 border rounded-lg flex justify-between items-center hover:bg-gray-50">
            <div className="flex items-center">
              <button className="mr-3 h-5 w-5 rounded-full border border-gray-300 flex items-center justify-center"></button>
              <div>
                <p className="font-medium">Review marketing materials</p>
                <p className="text-sm text-gray-500">Due: Tomorrow</p>
              </div>
            </div>
            <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">Medium</span>
          </div>
        </div>
      </div>
      

      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
