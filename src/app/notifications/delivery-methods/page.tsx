'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { DeliveryMethod } from '@/types/delivery-method';
import DeliveryMethodList from '@/components/notifications/DeliveryMethodList';
import { deliveryMethodsApi } from '@/app/api/delivery-methods';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { PlusIcon } from '@heroicons/react/24/outline';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function DeliveryMethodsPage() {
  const searchParams = useSearchParams();
  const [methods, setMethods] = useState<DeliveryMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        loadDeliveryMethods();
      }
    });

    // Check for action parameter in URL
    const action = searchParams?.get('action');
    if (action === 'create') {
      setShowCreateDialog(true);
    }

    // Listen for custom event from chat component
    const handleOpenCreateDialog = () => {
      setShowCreateDialog(true);
    };

    window.addEventListener('openCreateMethodDialog', handleOpenCreateDialog);

    return () => {
      unsubscribe();
      window.removeEventListener('openCreateMethodDialog', handleOpenCreateDialog);
    };
  }, [searchParams]);

  const loadDeliveryMethods = async () => {
    try {
      setIsLoading(true);
      const data = await deliveryMethodsApi.getAll();
      setMethods(data);
      setError(null);
    } catch (err) {
      setError('Failed to load delivery methods');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              Delivery Methods
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Configure how you want to receive notifications
            </p>
          </div>
          <div className="mt-4 flex md:ml-4 md:mt-0">
            <button
              type="button"
              onClick={() => setShowCreateDialog(true)}
              className="ml-3 inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
              Add Method
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="mt-6 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          </div>
        ) : (
          <div className="mt-6 bg-white shadow rounded-lg">
            {methods.length > 0 ? (
              <DeliveryMethodList
                methods={methods}
                onMethodsChange={loadDeliveryMethods}
              />
            ) : (
              <div className="text-center py-12">
                <p className="text-sm text-gray-500">No delivery methods found</p>
              </div>
            )}
          </div>
        )}
        </div>

        {/* Create Delivery Method Dialog */}
        {showCreateDialog && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Create Delivery Method</h2>
              <button onClick={() => setShowCreateDialog(false)} className="text-gray-500 hover:text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              // Add new delivery method logic would go here
              const formData = new FormData(e.target as HTMLFormElement);
              const name = formData.get('name') as string;
              const type = formData.get('type') as string;
              
              // Call your API to create a new delivery method
              // For now, just close the dialog and refresh the list
              setShowCreateDialog(false);
              loadDeliveryMethods();
            }}>
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  name="type"
                  id="type"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="push">Push Notification</option>
                  <option value="webhook">Webhook</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateDialog(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </ProtectedRoute>
  );
}
