'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { SparklesIcon, PlusIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useAction } from '@/context/ActionContext';
import ChatInput from '@/components/common/ChatInput';

function TasksContent() {
  const { user } = useAuth();
  const actionContext = useAction();
  const [showCreateTaskDialog, setShowCreateTaskDialog] = useState(false);
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Complete project proposal', dueDate: 'Today', priority: 'High', completed: false },
    { id: 2, title: 'Review marketing materials', dueDate: 'Tomorrow', priority: 'Medium', completed: false },
    { id: 3, title: 'Prepare for client meeting', dueDate: 'Friday', priority: 'Low', completed: false },
    { id: 4, title: 'Update documentation', dueDate: 'Next Monday', priority: 'Medium', completed: false },
    { id: 5, title: 'Send weekly report', dueDate: 'Friday', priority: 'High', completed: false }
  ]);
  
  // Handle pending actions from the ActionContext
  useEffect(() => {
    if (actionContext.pendingAction === 'create-task') {
      setShowCreateTaskDialog(true);
      actionContext.clearPendingAction();
    }
  }, [actionContext]);

  const toggleTaskCompletion = (taskId: number) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  const getPriorityBadgeClasses = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="bg-white shadow rounded-lg p-4 sm:p-6 mb-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">AI Automations</h2>
            <p className="mt-1 text-sm text-gray-500">Manage your web automation tasks powered by AI</p>
          </div>
          <button
            onClick={() => setShowCreateTaskDialog(true)}
            className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Automation
          </button>
        </div>

          {/* Chat Input Box */}
          <ChatInput
              className="mt-4"
              placeholder="Having something to do? Try talk to me"
              hintText="Press Enter to create an AI-powered task"
              onSubmit={() => {}}
              dispatchEvent={true}
              eventName="triggerChatBubble"
          />
      </div>

      {/* Tasks Content */}
      <div className="bg-white shadow rounded-lg p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Your Automations</h2>
          <div className="flex space-x-2">
            <button className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-md">All</button>
            <button className="px-3 py-1 text-sm bg-gray-50 text-gray-700 rounded-md">Active</button>
            <button className="px-3 py-1 text-sm bg-gray-50 text-gray-700 rounded-md">Completed</button>
          </div>
        </div>

        <div className="space-y-4">
          {tasks.map(task => (
            <div 
              key={task.id} 
              className={`p-3 border rounded-lg flex justify-between items-center hover:bg-gray-50 ${task.completed ? 'bg-gray-50' : ''}`}
            >
              <div className="flex items-center">
                <button 
                  onClick={() => toggleTaskCompletion(task.id)}
                  className={`mr-3 h-5 w-5 rounded-full border flex items-center justify-center ${
                    task.completed 
                      ? 'bg-blue-600 border-blue-600 text-white' 
                      : 'border-gray-300'
                  }`}
                >
                  {task.completed && <CheckIcon className="h-3 w-3" />}
                </button>
                <div>
                  <p className={`font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}>{task.title}</p>
                  <p className="text-sm text-gray-500">Due: {task.dueDate}</p>
                </div>
              </div>
              <span className={`text-xs font-medium px-2.5 py-0.5 rounded ${getPriorityBadgeClasses(task.priority)}`}>
                {task.priority}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Create Task Dialog - Would be a separate component in a real app */}
      {showCreateTaskDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Create New Task</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Task Title</label>
                <input type="text" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Due Date</label>
                  <input type="date" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Priority</label>
                  <select className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" rows={3}></textarea>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateTaskDialog(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateTaskDialog(false)}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

export default function TasksPage() {
  return (
    <ProtectedRoute>
      <TasksContent />
    </ProtectedRoute>
  );
}
