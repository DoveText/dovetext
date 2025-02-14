'use client';

import { useState, useEffect } from 'react';
import { DeliveryMethod, CreateDeliveryMethodRequest } from '@/types/delivery-method';
import DeliveryMethodList from '@/components/notifications/DeliveryMethodList';
import DeliveryMethodModal from '@/components/notifications/DeliveryMethodModal';
import { deliveryMethodsApi } from '@/api/delivery-methods';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';

export default function DeliveryMethodsPage() {
  const [methods, setMethods] = useState<DeliveryMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<DeliveryMethod | null>(null);

  useEffect(() => {
    // Wait for auth state to be ready before loading methods
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

  const handleAdd = async (data: CreateDeliveryMethodRequest) => {
    try {
      const newMethod = await deliveryMethodsApi.create(data);
      setMethods(prev => [...prev, newMethod]);
      setIsAddModalOpen(false);
    } catch (err) {
      setError('Failed to create delivery method');
      console.error(err);
    }
  };

  const handleEdit = async (method: DeliveryMethod) => {
    setEditingMethod(method);
    setIsAddModalOpen(true);
  };

  const handleDelete = async (method: DeliveryMethod) => {
    if (!confirm('Are you sure you want to delete this delivery method?')) {
      return;
    }

    try {
      await deliveryMethodsApi.delete(method.id);
      setMethods(prev => prev.filter(m => m.id !== method.id));
    } catch (err) {
      setError('Failed to delete delivery method');
      console.error(err);
    }
  };

  const handleVerify = async (method: DeliveryMethod) => {
    try {
      await deliveryMethodsApi.verify(method.id);
      await loadDeliveryMethods(); // Reload to get updated status
    } catch (err) {
      setError('Failed to verify delivery method');
      console.error(err);
    }
  };

  const handleSetDefault = async (method: DeliveryMethod) => {
    try {
      await deliveryMethodsApi.setDefault(method.id);
      setMethods(prev => prev.map(m => ({
        ...m,
        isDefault: m.id === method.id
      })));
    } catch (err) {
      setError('Failed to set default delivery method');
      console.error(err);
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
              Manage how you receive notifications across different channels
            </p>
          </div>
          <div className="mt-4 flex md:ml-4 md:mt-0">
            <button
              type="button"
              onClick={() => {
                setEditingMethod(null);
                setIsAddModalOpen(true);
              }}
              className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
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
                onEdit={handleEdit}
                onDelete={handleDelete}
                onVerify={handleVerify}
                onSetDefault={handleSetDefault}
              />
            ) : (
              <div className="text-center py-12">
                <h3 className="mt-2 text-sm font-semibold text-gray-900">No delivery methods</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by adding a new delivery method.
                </p>
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(true)}
                    className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                  >
                    <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                    Add Method
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <DeliveryMethodModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingMethod(null);
        }}
        onSubmit={async (data) => {
          if (editingMethod) {
            await deliveryMethodsApi.update(editingMethod.id, data);
            await loadDeliveryMethods();
          } else {
            await handleAdd(data);
          }
        }}
        editingMethod={editingMethod}
      />
    </div>
  );
}
