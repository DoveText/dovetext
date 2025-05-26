'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { CalendarIcon, SparklesIcon, ArrowRightIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useAction } from '@/context/ActionContext';
import ChatInput from '@/components/common/ChatInput';
import { dashboardApi, DashboardStats, UpcomingSchedule } from '@/app/api/dashboard';

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
  // Dashboard stats state
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalSchedules: 0,
    missedSchedules: 0,
    automationExecutions: 0,
    failedExecutions: 0
  });
  
  // Local state for date range label
  const [dateRangeLabel, setDateRangeLabel] = useState('');
  
  // State for upcoming schedules
  const [upcomingSchedules, setUpcomingSchedules] = useState<UpcomingSchedule[]>([]);
  // Loading state for upcoming schedules
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  
  // Fetch dashboard stats from API
  const fetchDashboardStats = async (timeRange: string) => {
    try {
      // Calculate date range in user's local timezone
      const dateRange = dashboardApi.calculateDateRange(timeRange);
      
      // Fetch stats with calculated date range
      const data = await dashboardApi.getStats(
        dateRange.startTime,
        dateRange.endTime
      );
      
      // Update stats and date range label
      setDashboardStats(data);
      setDateRangeLabel(dateRange.dateRangeLabel);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };
  
  // Fetch stats when time range changes
  useEffect(() => {
    fetchDashboardStats(selectedTimeRange);
  }, [selectedTimeRange]);
  
  // Fetch upcoming schedules on component mount
  useEffect(() => {
    const fetchUpcomingSchedules = async () => {
      setLoadingSchedules(true);
      try {
        const data = await dashboardApi.getUpcomingSchedules();
        setUpcomingSchedules(data);
      } catch (error) {
        console.error('Error fetching upcoming schedules:', error);
      } finally {
        setLoadingSchedules(false);
      }
    };
    
    fetchUpcomingSchedules();
  }, []);
  
  // The dateRangeLabel is now calculated by the dashboardApi.calculateDateRange function
  // and stored in local state

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Section with User Profile Status */}
      <div className="bg-white shadow rounded-lg p-4 sm:p-6 mb-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.displayName || user?.email?.split('@')[0] || 'User'}</h1>
            <p className="text-gray-600 mt-2">Here&apos;s your current status and activities</p>
          </div>
          <div className="mt-4 md:mt-0">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-50 p-2 rounded-md inline-block">
                <p className="text-sm font-medium text-blue-800">Last login: {new Date().toLocaleDateString()}</p>
              </div>
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
            </div>
            <p className="text-xs text-gray-500 mt-1 text-right">
              {dateRangeLabel}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-4 sm:mt-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-500">Total Schedules</p>
            <p className="text-2xl font-bold text-blue-600">{dashboardStats.totalSchedules}</p>
            <p className="text-xs text-gray-500 mt-1">Events in selected period</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-500">Missed Schedules</p>
            <p className="text-2xl font-bold text-red-600">{dashboardStats.missedSchedules}</p>
            <p className="text-xs text-gray-500 mt-1">Unacknowledged past events</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-500">Automation Executions</p>
            <p className="text-2xl font-bold text-green-600">{dashboardStats.automationExecutions}</p>
            <p className="text-xs text-gray-500 mt-1">Total runs in period</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-500">Failed Executions</p>
            <p className="text-2xl font-bold text-yellow-600">{dashboardStats.failedExecutions}</p>
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
          {loadingSchedules ? (
            <div className="text-center py-4">
              <p className="text-gray-500">Loading schedules...</p>
            </div>
          ) : upcomingSchedules.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-500">No upcoming schedules found</p>
            </div>
          ) : (
            upcomingSchedules.map((schedule) => {
              // Format the date and time for display
              const startDate = new Date(schedule.startTime);
              const endDate = new Date(schedule.endTime);
              
              // Format time (e.g., "2:00 PM - 3:00 PM")
              const timeFormatter = new Intl.DateTimeFormat('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              });
              
              // Format date (e.g., "Today" or "May 27, 2025")
              const dateFormatter = new Intl.DateTimeFormat('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              });
              
              // Determine if the date is today or tomorrow for display
              const today = new Date();
              const tomorrow = new Date(today);
              tomorrow.setDate(tomorrow.getDate() + 1);
              
              let dateDisplay = dateFormatter.format(startDate);
              if (startDate.toDateString() === today.toDateString()) {
                dateDisplay = 'Today';
              } else if (startDate.toDateString() === tomorrow.toDateString()) {
                dateDisplay = 'Tomorrow';
              }
              
              // Format the time range
              let timeDisplay = '';
              if (schedule.isAllDay) {
                timeDisplay = 'All day';
              } else {
                timeDisplay = `${timeFormatter.format(startDate)} - ${timeFormatter.format(endDate)}`;
              }
              
              // Determine tag based on the date
              let tag = 'Upcoming';
              if (startDate.toDateString() === today.toDateString()) {
                tag = 'Today';
              } else if (startDate.toDateString() === tomorrow.toDateString()) {
                tag = 'Tomorrow';
              } else if (startDate < new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000)) {
                tag = 'Soon';
              }
              
              // Determine tag color based on the tag value
              let tagColorClass = 'bg-blue-100 text-blue-800';
              if (tag === 'Today') {
                tagColorClass = 'bg-green-100 text-green-800';
              } else if (tag === 'Tomorrow') {
                tagColorClass = 'bg-purple-100 text-purple-800';
              } else if (tag === 'Soon') {
                tagColorClass = 'bg-yellow-100 text-yellow-800';
              }
              
              return (
                <div key={schedule.id} className="p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{schedule.title}</p>
                        <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">
                          {schedule.type === 'EVENT' ? 'Event' : 'Reminder'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{dateDisplay}, {timeDisplay}</p>
                    </div>
                    <span className={`${tagColorClass} text-xs font-medium px-2.5 py-0.5 rounded whitespace-nowrap`}>
                      {tag}
                    </span>
                  </div>
                  
                  {/* Additional details section */}
                  {(schedule.location || schedule.description) && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      {schedule.location && (
                        <p className="text-xs text-gray-500">📍 {schedule.location}</p>
                      )}
                      {schedule.description && (
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{schedule.description}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
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
