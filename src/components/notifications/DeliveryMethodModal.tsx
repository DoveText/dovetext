'use client';

import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { DeliveryMethod, DeliveryMethodType, CreateDeliveryMethodRequest, PluginType, WebhookConfig, PhoneConfig } from '@/types/delivery-method';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateDeliveryMethodRequest) => void;
  editingMethod?: DeliveryMethod | null;
  initialType?: DeliveryMethodType;
}

const methodTypes: { value: DeliveryMethodType; label: string }[] = [
  { value: 'EMAIL', label: 'Email' },
  { value: 'TEXT', label: 'Text' },
  { value: 'VOICE', label: 'Voice' },
  { value: 'WEBHOOK', label: 'Webhook' },
  { value: 'PLUGIN', label: 'Plugin' },
];

const pluginTypes: { value: PluginType; label: string }[] = [
  { value: 'SLACK', label: 'Slack' },
  { value: 'TELEGRAM', label: 'Telegram' },
  { value: 'CUSTOM_WEBHOOK', label: 'Custom Webhook' },
];

const httpMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

export default function DeliveryMethodModal({ isOpen, onClose, onSubmit, editingMethod, initialType }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<DeliveryMethodType>(initialType || 'EMAIL');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState<PhoneConfig>({
    phoneNumber: '',
    countryCode: '1',
    enableText: true,
    enableVoice: false,
  });
  const [pluginConfig, setPluginConfig] = useState<PluginConfig>({
    type: 'SLACK',
    slackWebhookUrl: '',
    slackChannel: '',
    telegramBotToken: '',
    telegramChatId: '',
    webhook: {
      url: '',
      method: 'POST',
      headers: {},
      payload: '',
    },
  });

  useEffect(() => {
    if (editingMethod) {
      setName(editingMethod.name);
      setDescription(editingMethod.description || '');
      setType(editingMethod.type);
      if (editingMethod.config.email) {
        setEmail(editingMethod.config.email);
      }
      if (editingMethod.config.phone) {
        setPhone(editingMethod.config.phone);
      }
      if (editingMethod.config.plugin) {
        setPluginConfig(editingMethod.config.plugin);
      }
    } else if (initialType) {
      setType(initialType);
    }
  }, [editingMethod, initialType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const config: CreateDeliveryMethodRequest['config'] = {};

    if (type === 'EMAIL') {
      config.email = email;
    } else if (type === 'TEXT' || type === 'VOICE') {
      if (!phone.enableText && !phone.enableVoice) {
        alert('Please enable at least one delivery method (Text or Voice)');
        return;
      }
      config.phone = phone;
    } else if (type === 'WEBHOOK' || type === 'PLUGIN') {
      config.plugin = pluginConfig;
    }

    onSubmit({
      type,
      name,
      description,
      config,
    });
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <form onSubmit={handleSubmit}>
                  <div>
                    <div className="mt-3 sm:mt-5">
                      <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                        {editingMethod ? 'Edit Delivery Method' : 'Add Delivery Method'}
                      </Dialog.Title>

                      <div className="mt-6 space-y-6">
                        {/* Common Fields */}
                        <div className="bg-white px-6 py-6 shadow-lg sm:rounded-lg sm:p-8">
                          <div className="space-y-8">
                            <div>
                              <label className="block text-sm font-medium leading-6 text-gray-900">Name</label>
                              <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                              />
                            </div>

                            {/* Type-specific Fields */}
                            {type === 'DOVEAPP' && (
                              <div>
                                <label className="block text-sm font-medium leading-6 text-gray-900">Dove Number</label>
                                <input
                                  type="text"
                                  value={editingMethod?.config.doveNumber || ''}
                                  readOnly
                                  disabled
                                  className="block w-full rounded-md border-0 py-1.5 text-gray-500 bg-gray-50 shadow-sm ring-1 ring-inset ring-gray-300 sm:text-sm sm:leading-6"
                                />
                              </div>
                            )}

                            {type === 'EMAIL' && (
                              <div>
                                <label className="block text-sm font-medium leading-6 text-gray-900">Email Address</label>
                                <input
                                  type="email"
                                  required
                                  value={email}
                                  onChange={(e) => setEmail(e.target.value)}
                                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                />
                              </div>
                            )}

                            {(type === 'TEXT' || type === 'VOICE') && (
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-medium leading-6 text-gray-900">Phone Number</label>
                                  <PhoneInput
                                    country={'us'}
                                    value={phone.phoneNumber}
                                    onChange={(value, data: any) => {
                                      setPhone(prev => ({
                                        ...prev,
                                        phoneNumber: value,
                                        countryCode: data.dialCode
                                      }));
                                    }}
                                    containerClass="phone-input-container"
                                    inputClass="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                    buttonClass="phone-select-button"
                                  />
                                </div>
                                <div className="flex items-center space-x-6">
                                  <label className="inline-flex items-center">
                                    <input
                                      type="checkbox"
                                      checked={phone.enableText}
                                      onChange={(e) => setPhone(prev => ({ ...prev, enableText: e.target.checked }))}
                                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Enable Text</span>
                                  </label>
                                  <label className="inline-flex items-center">
                                    <input
                                      type="checkbox"
                                      checked={phone.enableVoice}
                                      onChange={(e) => setPhone(prev => ({ ...prev, enableVoice: e.target.checked }))}
                                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Enable Voice</span>
                                  </label>
                                </div>
                              </div>
                            )}

                            {(type === 'WEBHOOK' || type === 'PLUGIN') && (
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-medium leading-6 text-gray-900">Integration Type</label>
                                  <select
                                    value={pluginConfig.type}
                                    onChange={(e) => setPluginConfig(prev => ({ ...prev, type: e.target.value as PluginType }))}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                  >
                                    {pluginTypes.map((type) => (
                                      <option key={type.value} value={type.value}>
                                        {type.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                {pluginConfig.type === 'SLACK' && (
                                  <div className="space-y-4 bg-gray-50 px-4 py-4 rounded-lg">
                                    <div>
                                      <label className="block text-sm font-medium leading-6 text-gray-900">Slack Webhook URL</label>
                                      <input
                                        type="url"
                                        required
                                        value={pluginConfig.slackWebhookUrl}
                                        onChange={(e) => setPluginConfig(prev => ({ ...prev, slackWebhookUrl: e.target.value }))}
                                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium leading-6 text-gray-900">Slack Channel</label>
                                      <input
                                        type="text"
                                        value={pluginConfig.slackChannel}
                                        onChange={(e) => setPluginConfig(prev => ({ ...prev, slackChannel: e.target.value }))}
                                        placeholder="#general"
                                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                      />
                                    </div>
                                  </div>
                                )}

                                {pluginConfig.type === 'TELEGRAM' && (
                                  <div className="space-y-4 bg-gray-50 px-4 py-4 rounded-lg">
                                    <div>
                                      <label className="block text-sm font-medium leading-6 text-gray-900">Bot Token</label>
                                      <input
                                        type="text"
                                        required
                                        value={pluginConfig.telegramBotToken}
                                        onChange={(e) => setPluginConfig(prev => ({ ...prev, telegramBotToken: e.target.value }))}
                                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium leading-6 text-gray-900">Chat ID</label>
                                      <input
                                        type="text"
                                        required
                                        value={pluginConfig.telegramChatId}
                                        onChange={(e) => setPluginConfig(prev => ({ ...prev, telegramChatId: e.target.value }))}
                                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                      />
                                    </div>
                                  </div>
                                )}

                                {pluginConfig.type === 'CUSTOM_WEBHOOK' && (
                                  <div className="space-y-4 bg-gray-50 px-4 py-4 rounded-lg">
                                    <div>
                                      <label className="block text-sm font-medium leading-6 text-gray-900">Webhook URL</label>
                                      <input
                                        type="url"
                                        required
                                        value={pluginConfig.webhook?.url}
                                        onChange={(e) => setPluginConfig(prev => ({
                                          ...prev,
                                          webhook: { ...prev.webhook!, url: e.target.value }
                                        }))}
                                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium leading-6 text-gray-900">HTTP Method</label>
                                      <select
                                        value={pluginConfig.webhook?.method}
                                        onChange={(e) => setPluginConfig(prev => ({
                                          ...prev,
                                          webhook: { ...prev.webhook!, method: e.target.value as WebhookConfig['method'] }
                                        }))}
                                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                      >
                                        {httpMethods.map((method) => (
                                          <option key={method} value={method}>
                                            {method}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium leading-6 text-gray-900">Headers (JSON)</label>
                                      <textarea
                                        value={JSON.stringify(pluginConfig.webhook?.headers, null, 2)}
                                        onChange={(e) => {
                                          try {
                                            const headers = JSON.parse(e.target.value);
                                            setPluginConfig(prev => ({
                                              ...prev,
                                              webhook: { ...prev.webhook!, headers }
                                            }));
                                          } catch (err) {
                                            // Invalid JSON, ignore
                                          }
                                        }}
                                        placeholder="{}"
                                        rows={4}
                                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 font-mono"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium leading-6 text-gray-900">Payload Template (JSON)</label>
                                      <textarea
                                        value={pluginConfig.webhook?.payload}
                                        onChange={(e) => setPluginConfig(prev => ({
                                          ...prev,
                                          webhook: { ...prev.webhook!, payload: e.target.value }
                                        }))}
                                        placeholder="{}"
                                        rows={4}
                                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 font-mono"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Description at bottom */}
                            <div>
                              <label className="block text-sm font-medium leading-6 text-gray-900">Description</label>
                              <textarea
                                rows={2}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                placeholder="Optional description..."
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                    <button
                      type="submit"
                      className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2"
                    >
                      {editingMethod ? 'Save Changes' : 'Add Method'}
                    </button>
                    <button
                      type="button"
                      className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
                      onClick={onClose}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
