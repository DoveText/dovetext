'use client';

import { useEffect, useState, Fragment } from 'react';
import { useAuth } from '@/context/AuthContext';
import { FormEvent } from 'react';
import { notificationDeliveryApi, DeliveryMethod, NotificationTestResponse, EmailMethodRequest, SlackMethodRequest } from '@/app/admin-tools/api/notification-delivery';
import Link from 'next/link';
import { ChevronRightIcon, HomeIcon, XMarkIcon, PlusIcon, ChevronDownIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Dialog, Transition, Menu } from '@headlessui/react';

export default function NotificationTestPage() {
  const { user } = useAuth();
  const [deliveryMethods, setDeliveryMethods] = useState<DeliveryMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<NotificationTestResponse | null>(null);
  
  // Modal states
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isCreateEmailModalOpen, setIsCreateEmailModalOpen] = useState(false);
  const [isCreateSlackModalOpen, setIsCreateSlackModalOpen] = useState(false);
  const [isEditEmailModalOpen, setIsEditEmailModalOpen] = useState(false);
  const [isEditSlackModalOpen, setIsEditSlackModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isTestingInProgress, setIsTestingInProgress] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<DeliveryMethod | null>(null);
  
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

  // Open test modal for a specific delivery method
  const openTestModal = (method: DeliveryMethod) => {
    setSelectedMethod(method);
    setSelectedMethodId(method.id);
    setTestResult(null);
    setIsTestModalOpen(true);
  };

  // Close test modal
  const closeTestModal = () => {
    // Only allow closing if test is not in progress or if there's a test result
    if (!isTestingInProgress || testResult) {
      setIsTestModalOpen(false);
      setSelectedMethod(null);
      setTestResult(null);
    }
  };

  // Handle test notification submission from modal
  const handleModalTestNotification = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!selectedMethodId) return;
    
    try {
      setIsTestingInProgress(true);
      setError(null);
      setTestResult(null);
      
      const response = await notificationDeliveryApi.testDelivery({
        methodId: Number(selectedMethodId),
        title: notificationForm.title,
        message: notificationForm.message,
        priority: notificationForm.priority
      });
      
      setTestResult(response);
    } catch (err) {
      setError('Failed to send test notification. Please try again.');
      console.error(err);
    } finally {
      setIsTestingInProgress(false);
    }
  };

  // Open edit modal for a specific delivery method
  const openEditModal = (method: DeliveryMethod) => {
    setSelectedMethod(method);
    setSelectedMethodId(method.id);
    
    try {
      // Parse the config JSON
      const config = JSON.parse(method.config);
      
      if (method.type === 'EMAIL') {
        setEmailForm({
          name: method.name,
          email: config.email || '',
          format: config.format || 'html',
          enableReply: config.enableReply || false,
          replyToAddress: config.replyToAddress || ''
        });
        setIsEditEmailModalOpen(true);
      } else if (method.type === 'SLACK') {
        setSlackForm({
          name: method.name,
          webhookUrl: config.webhookUrl || '',
          channel: config.channel || '#general',
          username: config.username || 'Dove Text',
          iconEmoji: config.iconEmoji || ':dove:'
        });
        setIsEditSlackModalOpen(true);
      }
    } catch (err) {
      console.error('Error parsing method config:', err);
      setError('Failed to parse method configuration. Cannot edit this method.');
    }
  };

  // Open delete confirmation modal
  const openDeleteModal = (method: DeliveryMethod) => {
    setSelectedMethod(method);
    setSelectedMethodId(method.id);
    setIsDeleteModalOpen(true);
  };

  // Handle update email method
  const handleUpdateEmailMethod = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!selectedMethod) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const request: EmailMethodRequest = {
        name: emailForm.name,
        email: emailForm.email,
        format: emailForm.format,
        enableReply: emailForm.enableReply,
        replyToAddress: emailForm.enableReply ? emailForm.replyToAddress : undefined
      };
      
      await notificationDeliveryApi.updateMethod(selectedMethod.id, request);
      await fetchDeliveryMethods();
      setIsEditEmailModalOpen(false);
    } catch (err) {
      setError('Failed to update Email delivery method. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle update slack method
  const handleUpdateSlackMethod = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!selectedMethod) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const request: SlackMethodRequest = {
        name: slackForm.name,
        webhookUrl: slackForm.webhookUrl,
        channel: slackForm.channel,
        username: slackForm.username,
        iconEmoji: slackForm.iconEmoji
      };
      
      await notificationDeliveryApi.updateMethod(selectedMethod.id, request);
      await fetchDeliveryMethods();
      setIsEditSlackModalOpen(false);
    } catch (err) {
      setError('Failed to update Slack delivery method. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete method
  const handleDeleteMethod = async () => {
    if (!selectedMethod) return;
    
    try {
      setLoading(true);
      setError(null);
      
      await notificationDeliveryApi.deleteMethod(selectedMethod.id);
      await fetchDeliveryMethods();
      setIsDeleteModalOpen(false);
    } catch (err) {
      setError('Failed to delete delivery method. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle set as default
  const handleSetAsDefault = async (method: DeliveryMethod) => {
    try {
      setLoading(true);
      setError(null);
      
      await notificationDeliveryApi.setDefaultMethod(method.id);
      await fetchDeliveryMethods();
    } catch (err) {
      setError('Failed to set delivery method as default. Please try again.');
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
          {/* Create Method Dropdown */}
          <Menu as="div" className="relative inline-block text-left">
            <div>
              <Menu.Button className="inline-flex justify-center items-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Method
                <ChevronDownIcon className="w-5 h-5 ml-2 -mr-1" aria-hidden="true" />
              </Menu.Button>
            </div>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                <div className="py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => setIsCreateEmailModalOpen(true)}
                        className={`${
                          active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                        } block w-full text-left px-4 py-2 text-sm`}
                      >
                        Email Delivery Method
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => setIsCreateSlackModalOpen(true)}
                        className={`${
                          active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                        } block w-full text-left px-4 py-2 text-sm`}
                      >
                        Slack Delivery Method
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>

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
      
      {/* Delivery Methods Panel */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Delivery Methods</h2>
        
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : deliveryMethods.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No delivery methods found. Create one using the "Create Method" button above.
          </div>
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
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {deliveryMethods.map((method) => (
                  <tr key={method.id} className="hover:bg-gray-50">
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
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => openTestModal(method)}
                          className="text-blue-600 hover:text-blue-900 bg-blue-100 hover:bg-blue-200 px-3 py-1 rounded"
                          title="Test this delivery method"
                        >
                          Test
                        </button>
                        <button
                          onClick={() => openEditModal(method)}
                          className="text-green-600 hover:text-green-900 bg-green-100 hover:bg-green-200 px-3 py-1 rounded"
                          title="Edit this delivery method"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        {!method.isDefault && (
                          <button
                            onClick={() => openDeleteModal(method)}
                            className="text-red-600 hover:text-red-900 bg-red-100 hover:bg-red-200 px-3 py-1 rounded"
                            title="Delete this delivery method"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                        {!method.isDefault && (
                          <button
                            onClick={() => handleSetAsDefault(method)}
                            className="text-purple-600 hover:text-purple-900 bg-purple-100 hover:bg-purple-200 px-3 py-1 rounded"
                            title="Set as default delivery method"
                          >
                            Default
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Test Notification Modal */}
      <Transition appear show={isTestModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => !isTestingInProgress && closeTestModal()}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 flex justify-between items-center"
                  >
                    Test {selectedMethod?.name}
                    {!isTestingInProgress && testResult && (
                      <button
                        type="button"
                        className="inline-flex justify-center rounded-md border border-transparent p-1 text-sm font-medium text-gray-400 hover:text-gray-500 focus:outline-none"
                        onClick={closeTestModal}
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    )}
                  </Dialog.Title>
                  
                  {/* Test Result Section */}
                  {testResult && (
                    <div className={`mt-4 p-4 rounded ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                      {testResult.success ? (
                        <div>
                          <p className="font-semibold text-green-800">Notification sent successfully!</p>
                          <p className="text-sm text-green-700 mt-1">Notification ID: {testResult.notificationId}</p>
                          {testResult.deliveryId && <p className="text-sm text-green-700">Delivery ID: {testResult.deliveryId}</p>}
                          {testResult.metadata && (
                            <div className="mt-2">
                              <p className="text-sm font-medium text-green-700">Metadata:</p>
                              <pre className="text-xs bg-white p-2 rounded mt-1 overflow-x-auto">
                                {JSON.stringify(testResult.metadata, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <p className="font-semibold text-red-800">Failed to send notification</p>
                          <p className="text-sm text-red-700 mt-1">{testResult.error || testResult.message}</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Test Form */}
                  {!testResult && (
                    <form onSubmit={handleModalTestNotification} className="mt-4">
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="modal-title" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                          <input
                            type="text"
                            id="modal-title"
                            name="title"
                            value={notificationForm.title}
                            onChange={handleNotificationInputChange}
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="modal-message" className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                          <textarea
                            id="modal-message"
                            name="message"
                            value={notificationForm.message}
                            onChange={handleNotificationInputChange}
                            className="w-full border border-gray-300 rounded px-3 py-2 h-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="modal-priority" className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                          <select
                            id="modal-priority"
                            name="priority"
                            value={notificationForm.priority}
                            onChange={handleNotificationInputChange}
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                            <option value="URGENT">Urgent</option>
                          </select>
                        </div>
                      </div>

                      <div className="mt-6">
                        <button
                          type="submit"
                          className="w-full inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                          disabled={isTestingInProgress}
                        >
                          {isTestingInProgress ? (
                            <span className="flex items-center">
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Testing...
                            </span>
                          ) : 'Send Test Notification'}
                        </button>
                      </div>
                    </form>
                  )}
                  
                  {/* Close Button (only shown when test result is available) */}
                  {testResult && (
                    <div className="mt-6">
                      <button
                        type="button"
                        className="w-full inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        onClick={closeTestModal}
                      >
                        Close
                      </button>
                    </div>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Create Email Method Modal */}
      <Transition appear show={isCreateEmailModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setIsCreateEmailModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 flex justify-between items-center"
                  >
                    Create Email Delivery Method
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent p-1 text-sm font-medium text-gray-400 hover:text-gray-500 focus:outline-none"
                      onClick={() => setIsCreateEmailModalOpen(false)}
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </Dialog.Title>
                  
                  <form onSubmit={handleCreateEmailMethod} className="mt-4">
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="email-name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input
                          type="text"
                          id="email-name"
                          name="name"
                          value={emailForm.name}
                          onChange={handleEmailInputChange}
                          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="email-email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input
                          type="email"
                          id="email-email"
                          name="email"
                          value={emailForm.email}
                          onChange={handleEmailInputChange}
                          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="email-format" className="block text-sm font-medium text-gray-700 mb-1">Format</label>
                        <select
                          id="email-format"
                          name="format"
                          value={emailForm.format}
                          onChange={handleEmailInputChange}
                          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="html">HTML</option>
                          <option value="text">Plain Text</option>
                        </select>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="email-enableReply"
                          name="enableReply"
                          checked={emailForm.enableReply}
                          onChange={(e) => setEmailForm({...emailForm, enableReply: e.target.checked})}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="email-enableReply" className="ml-2 block text-sm text-gray-700">
                          Enable Reply
                        </label>
                      </div>
                      
                      {emailForm.enableReply && (
                        <div>
                          <label htmlFor="email-replyToAddress" className="block text-sm font-medium text-gray-700 mb-1">Reply-To Address</label>
                          <input
                            type="email"
                            id="email-replyToAddress"
                            name="replyToAddress"
                            value={emailForm.replyToAddress}
                            onChange={handleEmailInputChange}
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                      )}
                    </div>

                    <div className="mt-6">
                      <button
                        type="submit"
                        className="w-full inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        disabled={loading}
                      >
                        {loading ? 'Creating...' : 'Create Email Method'}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Create Slack Method Modal */}
      <Transition appear show={isCreateSlackModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setIsCreateSlackModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 flex justify-between items-center"
                  >
                    Create Slack Delivery Method
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent p-1 text-sm font-medium text-gray-400 hover:text-gray-500 focus:outline-none"
                      onClick={() => setIsCreateSlackModalOpen(false)}
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </Dialog.Title>
                  
                  <form onSubmit={handleCreateSlackMethod} className="mt-4">
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="slack-name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input
                          type="text"
                          id="slack-name"
                          name="name"
                          value={slackForm.name}
                          onChange={handleSlackInputChange}
                          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="slack-webhookUrl" className="block text-sm font-medium text-gray-700 mb-1">Webhook URL</label>
                        <input
                          type="url"
                          id="slack-webhookUrl"
                          name="webhookUrl"
                          value={slackForm.webhookUrl}
                          onChange={handleSlackInputChange}
                          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="slack-channel" className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
                        <input
                          type="text"
                          id="slack-channel"
                          name="channel"
                          value={slackForm.channel}
                          onChange={handleSlackInputChange}
                          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="slack-username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                        <input
                          type="text"
                          id="slack-username"
                          name="username"
                          value={slackForm.username}
                          onChange={handleSlackInputChange}
                          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="slack-iconEmoji" className="block text-sm font-medium text-gray-700 mb-1">Icon Emoji</label>
                        <input
                          type="text"
                          id="slack-iconEmoji"
                          name="iconEmoji"
                          value={slackForm.iconEmoji}
                          onChange={handleSlackInputChange}
                          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="mt-6">
                      <button
                        type="submit"
                        className="w-full inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        disabled={loading}
                      >
                        {loading ? 'Creating...' : 'Create Slack Method'}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Edit Email Method Modal */}
      <Transition appear show={isEditEmailModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setIsEditEmailModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 flex justify-between items-center"
                  >
                    Edit Email Delivery Method
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent p-1 text-sm font-medium text-gray-400 hover:text-gray-500 focus:outline-none"
                      onClick={() => setIsEditEmailModalOpen(false)}
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </Dialog.Title>
                  
                  <form onSubmit={handleUpdateEmailMethod} className="mt-4">
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="edit-email-name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input
                          type="text"
                          id="edit-email-name"
                          name="name"
                          value={emailForm.name}
                          onChange={handleEmailInputChange}
                          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="edit-email-email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input
                          type="email"
                          id="edit-email-email"
                          name="email"
                          value={emailForm.email}
                          onChange={handleEmailInputChange}
                          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="edit-email-format" className="block text-sm font-medium text-gray-700 mb-1">Format</label>
                        <select
                          id="edit-email-format"
                          name="format"
                          value={emailForm.format}
                          onChange={handleEmailInputChange}
                          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="html">HTML</option>
                          <option value="text">Plain Text</option>
                        </select>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="edit-email-enableReply"
                          name="enableReply"
                          checked={emailForm.enableReply}
                          onChange={(e) => setEmailForm({...emailForm, enableReply: e.target.checked})}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="edit-email-enableReply" className="ml-2 block text-sm text-gray-700">
                          Enable Reply
                        </label>
                      </div>
                      
                      {emailForm.enableReply && (
                        <div>
                          <label htmlFor="edit-email-replyToAddress" className="block text-sm font-medium text-gray-700 mb-1">Reply-To Address</label>
                          <input
                            type="email"
                            id="edit-email-replyToAddress"
                            name="replyToAddress"
                            value={emailForm.replyToAddress}
                            onChange={handleEmailInputChange}
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                      )}
                    </div>

                    <div className="mt-6">
                      <button
                        type="submit"
                        className="w-full inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        disabled={loading}
                      >
                        {loading ? 'Updating...' : 'Update Email Method'}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Edit Slack Method Modal */}
      <Transition appear show={isEditSlackModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setIsEditSlackModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 flex justify-between items-center"
                  >
                    Edit Slack Delivery Method
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent p-1 text-sm font-medium text-gray-400 hover:text-gray-500 focus:outline-none"
                      onClick={() => setIsEditSlackModalOpen(false)}
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </Dialog.Title>
                  
                  <form onSubmit={handleUpdateSlackMethod} className="mt-4">
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="edit-slack-name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input
                          type="text"
                          id="edit-slack-name"
                          name="name"
                          value={slackForm.name}
                          onChange={handleSlackInputChange}
                          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="edit-slack-webhookUrl" className="block text-sm font-medium text-gray-700 mb-1">Webhook URL</label>
                        <input
                          type="url"
                          id="edit-slack-webhookUrl"
                          name="webhookUrl"
                          value={slackForm.webhookUrl}
                          onChange={handleSlackInputChange}
                          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="edit-slack-channel" className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
                        <input
                          type="text"
                          id="edit-slack-channel"
                          name="channel"
                          value={slackForm.channel}
                          onChange={handleSlackInputChange}
                          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="edit-slack-username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                        <input
                          type="text"
                          id="edit-slack-username"
                          name="username"
                          value={slackForm.username}
                          onChange={handleSlackInputChange}
                          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="edit-slack-iconEmoji" className="block text-sm font-medium text-gray-700 mb-1">Icon Emoji</label>
                        <input
                          type="text"
                          id="edit-slack-iconEmoji"
                          name="iconEmoji"
                          value={slackForm.iconEmoji}
                          onChange={handleSlackInputChange}
                          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="mt-6">
                      <button
                        type="submit"
                        className="w-full inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        disabled={loading}
                      >
                        {loading ? 'Updating...' : 'Update Slack Method'}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Delete Confirmation Modal */}
      <Transition appear show={isDeleteModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setIsDeleteModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Delete Delivery Method
                  </Dialog.Title>
                  
                  <div className="mt-4">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to delete the delivery method "{selectedMethod?.name}"? This action cannot be undone.
                    </p>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                      onClick={() => setIsDeleteModalOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                      onClick={handleDeleteMethod}
                      disabled={loading}
                    >
                      {loading ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
