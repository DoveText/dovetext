'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { 
  BellIcon,
  ChevronRightIcon,
  HomeIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { Tab } from '@headlessui/react';
import { notificationTemplatesApi, NotificationTemplate } from '@/app/admin-tools/api/notification-templates';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function NotificationTemplatesPage() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Tab categories
  const categories = {
    all: { name: 'All Templates' },
    email: { name: 'Email' },
    sms: { name: 'SMS' },
    voice: { name: 'Voice' },
    webhook: { name: 'Webhook' },
    plugin: { name: 'Plugin' }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await notificationTemplatesApi.getAllTemplates();
      setTemplates(data);
    } catch (err) {
      setError('Failed to load notification templates. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (template: NotificationTemplate) => {
    try {
      setLoading(true);
      await notificationTemplatesApi.setDefaultTemplate(template.id);
      await fetchTemplates();
    } catch (err) {
      setError('Failed to set template as default. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (template: NotificationTemplate) => {
    if (!confirm(`Are you sure you want to delete the template "${template.name}"?`)) {
      return;
    }
    
    try {
      setLoading(true);
      await notificationTemplatesApi.deleteTemplate(template.id);
      await fetchTemplates();
    } catch (err) {
      setError('Failed to delete template. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filter templates by category
  const getFilteredTemplates = (category: string) => {
    if (category === 'all') {
      return templates;
    }
    return templates.filter(template => template.type === category);
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
              <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">Notification Templates</span>
            </div>
          </li>
        </ol>
      </nav>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Notification Templates</h1>
        <Link 
          href="/admin-tools/notifications/create" 
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Template
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="w-full">
        <Tab.Group>
          <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
            {Object.entries(categories).map(([category, { name }]) => (
              <Tab
                key={category}
                className={({ selected }) =>
                  classNames(
                    'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                    'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                    selected
                      ? 'bg-white shadow text-blue-700'
                      : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                  )
                }
              >
                {name}
              </Tab>
            ))}
          </Tab.List>
          <Tab.Panels className="mt-2">
            {Object.keys(categories).map((category) => (
              <Tab.Panel
                key={category}
                className={classNames(
                  'rounded-xl bg-white p-3',
                  'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2'
                )}
              >
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                  </div>
                ) : getFilteredTemplates(category).length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    No templates found in this category.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Variables
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Last Updated
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Default
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {getFilteredTemplates(category).map((template) => (
                          <tr key={template.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{template.name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                template.type === 'email' ? 'bg-blue-100 text-blue-800' :
                                template.type === 'sms' ? 'bg-green-100 text-green-800' :
                                template.type === 'voice' ? 'bg-purple-100 text-purple-800' :
                                template.type === 'webhook' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-pink-100 text-pink-800'
                              }`}>
                                {template.type.charAt(0).toUpperCase() + template.type.slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {template.variables.map((variable, index) => (
                                  <span key={variable} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mr-1">
                                    {variable}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(template.updatedAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {template.isDefault ? (
                                <CheckCircleIcon className="h-5 w-5 text-green-500" />
                              ) : (
                                <button 
                                  onClick={() => handleSetDefault(template)}
                                  className="text-xs text-blue-600 hover:text-blue-900"
                                >
                                  Set as default
                                </button>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <Link 
                                href={`/admin-tools/notifications/${template.id}`}
                                className="text-blue-600 hover:text-blue-900 mr-4"
                              >
                                <PencilIcon className="h-5 w-5 inline" />
                              </Link>
                              <button 
                                onClick={() => handleDeleteTemplate(template)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <TrashIcon className="h-5 w-5 inline" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Tab.Panel>
            ))}
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
}
