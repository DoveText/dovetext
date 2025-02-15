'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { DeliveryMethod, DeliveryMethodType, CreateDeliveryMethodRequest } from '@/types/delivery-method';

interface DeliveryMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateDeliveryMethodRequest) => Promise<void>;
  editingMethod?: DeliveryMethod | null;
}

const methodTypes: { value: DeliveryMethodType; label: string }[] = [
  { value: 'DOVEAPP', label: 'DoveApp' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'TEXT', label: 'Text (Coming Soon)' },
  { value: 'VOICE', label: 'Voice (Coming Soon)' },
  { value: 'WEBHOOK', label: 'Webhook (Coming Soon)' },
  { value: 'PLUGIN', label: 'Plugin (Coming Soon)' },
];

export default function DeliveryMethodModal({
  isOpen,
  onClose,
  onSubmit,
  editingMethod,
}: DeliveryMethodModalProps) {
  const [type, setType] = useState<DeliveryMethodType>('DOVEAPP');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [pluginId, setPluginId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingMethod) {
      setType(editingMethod.type);
      setName(editingMethod.name);
      setEmail(editingMethod.config.email || '');
      setPhone(editingMethod.config.phone || '');
      setWebhookUrl(editingMethod.config.webhookUrl || '');
      setPluginId(editingMethod.config.pluginId || '');
    } else {
      resetForm();
    }
  }, [editingMethod]);

  const resetForm = () => {
    setType('DOVEAPP');
    setName('');
    setEmail('');
    setPhone('');
    setWebhookUrl('');
    setPluginId('');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const config: any = {};
      switch (type) {
        case 'EMAIL':
          config.email = email;
          break;
        case 'TEXT':
        case 'VOICE':
          config.phone = phone;
          break;
        case 'WEBHOOK':
          config.webhookUrl = webhookUrl;
          break;
        case 'PLUGIN':
          config.pluginId = pluginId;
          break;
      }

      await onSubmit({
        type,
        name,
        config,
      });

      resetForm();
      onClose();
    } catch (err) {
      setError('Failed to save delivery method');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                      {editingMethod ? 'Edit Delivery Method' : 'Add Delivery Method'}
                    </Dialog.Title>

                    {error && (
                      <div className="mt-2 rounded-md bg-red-50 p-4">
                        <div className="flex">
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">{error}</h3>
                          </div>
                        </div>
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                      {/* Type Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Type</label>
                        <select
                          value={type}
                          onChange={(e) => setType(e.target.value as DeliveryMethodType)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          disabled={!!editingMethod}
                        >
                          {methodTypes.map((methodType) => (
                            <option
                              key={methodType.value}
                              value={methodType.value}
                              disabled={methodType.value !== 'DOVEAPP' && methodType.value !== 'EMAIL'}
                            >
                              {methodType.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          required
                        />
                      </div>

                      {/* Type-specific fields */}
                      {type === 'EMAIL' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Email</label>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            required
                          />
                        </div>
                      )}

                      {(type === 'TEXT' || type === 'VOICE') && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            required
                          />
                        </div>
                      )}

                      {type === 'WEBHOOK' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Webhook URL</label>
                          <input
                            type="url"
                            value={webhookUrl}
                            onChange={(e) => setWebhookUrl(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            required
                          />
                        </div>
                      )}

                      {type === 'PLUGIN' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Plugin ID</label>
                          <input
                            type="text"
                            value={pluginId}
                            onChange={(e) => setPluginId(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            required
                          />
                        </div>
                      )}

                      {/* Submit Button */}
                      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto"
                        >
                          {isSubmitting ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          type="button"
                          onClick={onClose}
                          className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
