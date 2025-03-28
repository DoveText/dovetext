'use client';

import { useState, useEffect } from 'react';
import { DeliveryChannel } from '@/types/delivery-channel';
import DeliveryChannelList from '@/components/notifications/DeliveryChannelList';
import { deliveryChannelsApi } from '@/app/api/delivery-channels';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function DeliveryChannelsPage() {
  const [channels, setChannels] = useState<DeliveryChannel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        loadDeliveryChannels();
      }
    });

    return () => unsubscribe();
  }, []);

  const loadDeliveryChannels = async () => {
    try {
      setIsLoading(true);
      const data = await deliveryChannelsApi.getAll();
      setChannels(data);
      setError(null);
    } catch (err) {
      setError('Failed to load delivery channels');
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
              Delivery Channels
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Manage your notification delivery channels
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="mt-4">
          {error && (
            <div className="rounded-md bg-red-50 p-4 mb-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
            </div>
          ) : (
            <DeliveryChannelList
              channels={channels}
              onChannelsChange={loadDeliveryChannels}
            />
          )}
        </div>
      </div>
    </div>
      </ProtectedRoute>
  );
}
