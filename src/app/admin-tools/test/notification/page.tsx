'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { FormEvent } from 'react';
import { notificationDeliveryApi, DeliveryMethod, NotificationTestResponse } from '@/app/admin-tools/api/notification-delivery';
import Link from 'next/link';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';

export default function NotificationTestPage() {
  const { user } = useAuth();
  const [deliveryMethods, setDeliveryMethods] = useState<DeliveryMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<NotificationTestResponse | null>(null);
  
  // Form states
  const [selectedMethodId, setSelectedMethodId] = useState<number | ''>('');
  const [notificationForm, setNotificationForm] = useState({
    title: 'Test Notification',
    message: 'This is a test notification from Dove Text.',
    priority: 'MEDIUM'
  });
  
  // Email method form
  const [emailForm, setEmailForm] = useState({
    name: 'Email Notification',
    email: '',
    format: 'html',
    enableReply: false,
    replyToAddress: ''
  });
  
  // Slack method form
  const [slackForm, setSlackForm] = useState({
    name: 'Slack Notification',
    webhookUrl: '',
    channel: '#general',
    username: 'Dove Text',
    iconEmoji: ':dove:'
  });

  // Fetch delivery methods on initial render
  useEffect(() => {
    fetchDeliveryMethods();
  }, []);

  // Fetch all delivery methods
  const fetchDeliveryMethods = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await notificationDeliveryApi.getAllMethods();
      setDeliveryMethods(data);
      
      // Auto-select first method if available
      if (data.length > 0) {
        setSelectedMethodId(data[0].id);
      }
    } catch (err) {
      setError('Failed to load delivery methods. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle notification form input changes
  const handleNotificationInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNotificationForm(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle email form input changes
  const handleEmailInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setEmailForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  // Handle slack form input changes
  const handleSlackInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSlackForm(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Submit test notification
  const handleTestNotification = async (e: FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      setTestResult(null);
      
      const result = await notificationDeliveryApi.testDelivery({
        methodId: selectedMethodId ? Number(selectedMethodId) : undefined,
        ...notificationForm
      });
      
      setTestResult(result);
    } catch (err) {
      setError('Failed to send test notification. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Create email delivery method
  const handleCreateEmailMethod = async (e: FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await notificationDeliveryApi.createEmailMethod(emailForm);
      
      // Refresh the delivery methods list
      await fetchDeliveryMethods();
      
      // Reset form
      setEmailForm({
        name: 'Email Notification',
        email: '',
        format: 'html',
        enableReply: false,
        replyToAddress: ''
      });
      
      // Show success message
      setTestResult({
        success: true,
        message: `Email delivery method "${result.name}" created successfully.`
      });
    } catch (err) {
      setError('Failed to create email delivery method. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Create slack delivery method
  const handleCreateSlackMethod = async (e: FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await notificationDeliveryApi.createSlackMethod(slackForm);
      
      // Refresh the delivery methods list
      await fetchDeliveryMethods();
      
      // Reset form
      setSlackForm({
        name: 'Slack Notification',
        webhookUrl: '',
        channel: '#general',
        username: 'Dove Text',
        iconEmoji: ':dove:'
      });
      
      // Show success message
      setTestResult({
        success: true,
        message: `Slack delivery method "${result.name}" created successfully.`
      });
    } catch (err) {
      setError('Failed to create Slack delivery method. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb Navigation */}
      <nav className="flex mb-6" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link href="/admin-tools" className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600">
              <HomeIcon className="w-4 h-4 mr-2" />
              Admin Tools
            </Link>
          </li>
          <li>
            <div className="flex items-center">
              <ChevronRightIcon className="w-4 h-4 text-gray-400" />
              <Link href="/admin-tools/test" className="ml-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ml-2">
                Test Tools
              </Link>
            </div>
          </li>
          <li>
            <div className="flex items-center">
              <ChevronRightIcon className="w-4 h-4 text-gray-400" />
              <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">Notification Delivery</span>
            </div>
          </li>
        </ol>
      </nav>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Notification Delivery Test</h1>
        <div className="flex space-x-4">
          <button
            onClick={fetchDeliveryMethods}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {testResult && (
        <div className={`${testResult.success ? 'bg-green-100 border-green-400 text-green-700' : 'bg-red-100 border-red-400 text-red-700'} border px-4 py-3 rounded mb-4`}>
          {testResult.message || (testResult.success ? (
            <div>
              <p className="font-bold">Notification sent successfully!</p>
              <p>Notification ID: {testResult.notificationId}</p>
              <p>Method ID: {testResult.methodId}</p>
              {testResult.deliveryId && <p>Delivery ID: {testResult.deliveryId}</p>}
              {testResult.metadata && <p>Metadata: {JSON.stringify(testResult.metadata)}</p>}
            </div>
          ) : (
            <div>
              <p className="font-bold">Failed to send notification</p>
              <p>Error: {testResult.error}</p>
            </div>
          ))}
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Test Notification Panel */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Test Notification</h2>
          
          <form onSubmit={handleTestNotification} className="space-y-4">
            <div>
              <label htmlFor="methodId" className="block text-sm font-medium text-gray-700 mb-1">Delivery Method</label>
              <select
                id="methodId"
                value={selectedMethodId}
                onChange={(e) => setSelectedMethodId(e.target.value ? Number(e.target.value) : '')}
                className="w-full border border-gray-300 rounded px-3 py-2"
                required
              >
                <option value="">Select a delivery method</option>
                {deliveryMethods.map((method) => (
                  <option key={method.id} value={method.id}>
                    {method.name} ({method.type})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                id="title"
                name="title"
                value={notificationForm.title}
                onChange={handleNotificationInputChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
                required
              />
            </div>
            
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                id="message"
                name="message"
                value={notificationForm.message}
                onChange={handleNotificationInputChange}
                className="w-full border border-gray-300 rounded px-3 py-2 h-24"
                required
              />
            </div>
            
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                id="priority"
                name="priority"
                value={notificationForm.priority}
                onChange={handleNotificationInputChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            
            <button
              type="submit"
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded w-full"
              disabled={loading || !selectedMethodId}
            >
              {loading ? 'Sending...' : 'Send Test Notification'}
            </button>
          </form>
        </div>
        
        {/* Create Email Method Panel */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Create Email Method</h2>
          
          <form onSubmit={handleCreateEmailMethod} className="space-y-4">
            <div>
              <label htmlFor="email-name" className="block text-sm font-medium text-gray-700 mb-1">Method Name</label>
              <input
                type="text"
                id="email-name"
                name="name"
                value={emailForm.name}
                onChange={handleEmailInputChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
                required
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={emailForm.email}
                onChange={handleEmailInputChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
                required
              />
            </div>
            
            <div>
              <label htmlFor="format" className="block text-sm font-medium text-gray-700 mb-1">Format</label>
              <select
                id="format"
                name="format"
                value={emailForm.format}
                onChange={handleEmailInputChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="html">HTML</option>
                <option value="text">Plain Text</option>
              </select>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="enableReply"
                name="enableReply"
                checked={emailForm.enableReply}
                onChange={handleEmailInputChange}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              <label htmlFor="enableReply" className="ml-2 block text-sm text-gray-700">Enable Reply</label>
            </div>
            
            {emailForm.enableReply && (
              <div>
                <label htmlFor="replyToAddress" className="block text-sm font-medium text-gray-700 mb-1">Reply-To Address</label>
                <input
                  type="email"
                  id="replyToAddress"
                  name="replyToAddress"
                  value={emailForm.replyToAddress}
                  onChange={handleEmailInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
            )}
            
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded w-full"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Email Method'}
            </button>
          </form>
        </div>
        
        {/* Create Slack Method Panel */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Create Slack Method</h2>
          
          <form onSubmit={handleCreateSlackMethod} className="space-y-4">
            <div>
              <label htmlFor="slack-name" className="block text-sm font-medium text-gray-700 mb-1">Method Name</label>
              <input
                type="text"
                id="slack-name"
                name="name"
                value={slackForm.name}
                onChange={handleSlackInputChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
                required
              />
            </div>
            
            <div>
              <label htmlFor="webhookUrl" className="block text-sm font-medium text-gray-700 mb-1">Webhook URL</label>
              <input
                type="url"
                id="webhookUrl"
                name="webhookUrl"
                value={slackForm.webhookUrl}
                onChange={handleSlackInputChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
                required
                placeholder="https://hooks.slack.com/services/..."
              />
            </div>
            
            <div>
              <label htmlFor="channel" className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
              <input
                type="text"
                id="channel"
                name="channel"
                value={slackForm.channel}
                onChange={handleSlackInputChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
                required
              />
            </div>
            
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                value={slackForm.username}
                onChange={handleSlackInputChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
                required
              />
            </div>
            
            <div>
              <label htmlFor="iconEmoji" className="block text-sm font-medium text-gray-700 mb-1">Icon Emoji</label>
              <input
                type="text"
                id="iconEmoji"
                name="iconEmoji"
                value={slackForm.iconEmoji}
                onChange={handleSlackInputChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
                required
              />
            </div>
            
            <button
              type="submit"
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded w-full"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Slack Method'}
            </button>
          </form>
        </div>
      </div>
      
      {/* Delivery Methods List */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Available Delivery Methods</h2>
        
        {deliveryMethods.length === 0 ? (
          <p className="text-gray-500">No delivery methods found. Create one using the forms above.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Default</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {deliveryMethods.map((method) => (
                  <tr key={method.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedMethodId(method.id)}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{method.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{method.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{method.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{method.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {method.isDefault ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Default
                        </span>
                      ) : 'No'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(method.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
