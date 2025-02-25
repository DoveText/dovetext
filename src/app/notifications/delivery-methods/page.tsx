'use client';

import { useState, useEffect } from 'react';
import { DeliveryMethod } from '@/types/delivery-method';
import DeliveryMethodList from '@/components/notifications/DeliveryMethodList';
import { deliveryMethodsApi } from '@/api/delivery-methods';
import { auth } from '@/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { PlusIcon } from '@heroicons/react/24/outline';

export default function DeliveryMethodsPage() {
  const [methods, setMethods] = useState<DeliveryMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        loadDeliveryMethods();
      }
    });

    return () => unsubscribe();
  }, []);

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
    </div>
  );
}
