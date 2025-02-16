'use client';

import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Select from '@/components/common/Select';
import EditableSelect, { EditableSelectOption } from '../common/EditableSelect';
import { DeliveryMethod, DeliveryMethodType, CreateDeliveryMethodRequest, PluginType, WebhookConfig, PhoneConfig } from '@/types/delivery-method';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';
import { TrashIcon } from '@heroicons/react/24/outline';

type DeliveryMethodGroup = 'DOVEAPP' | 'EMAIL' | 'PHONE' | 'PLUGIN';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateDeliveryMethodRequest) => void;
  onDelete?: (id: string) => void;
  editingMethod?: DeliveryMethod | null;
  group: DeliveryMethodGroup;
}

const methodTypesByGroup: Record<DeliveryMethodGroup, DeliveryMethodType[]> = {
  DOVEAPP: ['DOVEAPP'],
  EMAIL: ['EMAIL'],
  PHONE: ['TEXT', 'VOICE'],
  PLUGIN: ['WEBHOOK', 'PLUGIN'],
};

const pluginTypes: { value: PluginType; label: string }[] = [
  { value: 'SLACK', label: 'Slack' },
  { value: 'TELEGRAM', label: 'Telegram' },
  { value: 'CUSTOM_WEBHOOK', label: 'Custom Webhook' },
];

const httpMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

const pluginTypeMap: Record<PluginType, string> = {
  SLACK: 'Slack',
  TELEGRAM: 'Telegram',
  CUSTOM_WEBHOOK: 'Custom Webhook',
};

const commonHeaderOptions: EditableSelectOption[] = [
  { value: 'Authorization', label: 'Authorization' },
  { value: 'Content-Type', label: 'Content-Type' },
  { value: 'Accept', label: 'Accept' },
  { value: 'User-Agent', label: 'User-Agent' },
  { value: 'X-API-Key', label: 'X-API-Key' },
  { value: 'X-Request-ID', label: 'X-Request-ID' },
];

export default function DeliveryMethodModal({ isOpen, onClose, onSubmit, onDelete, editingMethod, group = 'EMAIL' }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<DeliveryMethodType>(() => {
    if (editingMethod) {
      return editingMethod.type;
    }
    return methodTypesByGroup[group][0];
  });
  const [email, setEmail] = useState('');
  const [doveNumber, setDoveNumber] = useState('');
  const [phone, setPhone] = useState<PhoneConfig>({
    phoneNumber: '',
    countryCode: '86',
    enableText: true,
    enableVoice: true,
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

  const [headerKeys, setHeaderKeys] = useState<string[]>([]);

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validatePhoneNumber = (phoneNumber: string, countryCode: string): string | null => {
    if (!phoneNumber.trim()) {
      return "Phone number is required";
    }
    
    if (phoneNumber.includes('_')) {
      return "Please enter a complete phone number";
    }

    try {
      // The phoneNumber already includes country code from the input component
      const fullNumber = `+${phoneNumber}`;
      
      // Try to parse the phone number
      const parsedNumber = parsePhoneNumber(fullNumber);
      
      if (!parsedNumber) {
        return "Invalid phone number format";
      }

      // Check if the number is valid for its country
      if (!parsedNumber.isValid()) {
        return `Invalid phone number for ${parsedNumber.country || 'this country'}`;
      }

      // Verify the number type (should be mobile)
      const numberType = parsedNumber.getType();

      // Check if the number type is mobile. Only check if we get valid numberType
      // for CN, the numberType would be null!!
      if (numberType && numberType !== 'MOBILE' && numberType !== 'FIXED_LINE_OR_MOBILE') {
        return "Please enter a mobile phone number";
      }

      return null;
    } catch (error) {
      console.error('Phone validation error:', error);
      return "Invalid phone number format";
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!name.trim()) {
      errors.name = "Name is required";
    }

    switch (group) {
      case 'EMAIL':
        if (!email.trim()) {
          errors.email = "Email address is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          errors.email = "Please enter a valid email address";
        }
        break;

      case 'PHONE':
        const phoneError = validatePhoneNumber(phone.phoneNumber, phone.countryCode);
        if (phoneError) {
          errors.phone = phoneError;
        }
        break;

      case 'PLUGIN':
        if (pluginConfig.type === 'SLACK') {
          if (!pluginConfig.slackWebhookUrl?.trim()) {
            errors.webhook = "Slack webhook URL is required";
          }
        } else if (pluginConfig.type === 'TELEGRAM') {
          if (!pluginConfig.telegramBotToken?.trim()) {
            errors.botToken = "Telegram bot token is required";
          }
          if (!pluginConfig.telegramChatId?.trim()) {
            errors.chatId = "Telegram chat ID is required";
          }
        } else if (pluginConfig.type === 'CUSTOM_WEBHOOK') {
          if (!pluginConfig.webhook?.url?.trim()) {
            errors.webhook = "Webhook URL is required";
          }
        }
        break;
    }

    setValidationErrors(errors);
    const hasErrors = Object.keys(errors).length > 0;
    const phoneMethodsValid = group !== 'PHONE' || phone.enableText || phone.enableVoice;
    
    return !hasErrors && phoneMethodsValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const config: CreateDeliveryMethodRequest['config'] = {};
    let requests: CreateDeliveryMethodRequest[] = [];
    let deleteIds: string[] = [];

    if (group === 'DOVEAPP') {
      Object.assign(config, { doveNumber });
      requests.push({
        id: editingMethod?.id,
        name,
        description,
        type,
        config,
      });
    } else if (group === 'EMAIL') {
      Object.assign(config, { email });
      requests.push({
        id: editingMethod?.id,
        name,
        description,
        type,
        config,
      });
    } else if (group === 'PHONE') {
      const baseConfig = {
        phoneNumber: phone.phoneNumber,
        countryCode: phone.countryCode,
      };

      if (editingMethod) {
        const config = typeof editingMethod.config === 'string' 
          ? JSON.parse(editingMethod.config)
          : editingMethod.config;

        // Handle text method
        if (config.textMethodId && !phone.enableText) {
          deleteIds.push(config.textMethodId);
        } else if (phone.enableText) {
          if (!config.textMethodId) {
            requests.push({
              name,
              description,
              type: 'TEXT',
              config: { ...baseConfig },
            });
          } else {
            requests.push({
              id: config.textMethodId,
              name,
              description,
              type: 'TEXT',
              config: { ...baseConfig },
            });
          }
        }

        // Handle voice method
        if (config.voiceMethodId && !phone.enableVoice) {
          deleteIds.push(config.voiceMethodId);
        } else if (phone.enableVoice) {
          if (!config.voiceMethodId) {
            requests.push({
              name,
              description,
              type: 'VOICE',
              config: { ...baseConfig },
            });
          } else {
            requests.push({
              id: config.voiceMethodId,
              name,
              description,
              type: 'VOICE',
              config: { ...baseConfig },
            });
          }
        }
      } else {
        // For new methods or when editing a method of different type
        if (phone.enableText) {
          requests.push({
            name,
            description,
            type: 'TEXT',
            config: { ...baseConfig },
          });
        }
        if (phone.enableVoice) {
          requests.push({
            name,
            description,
            type: 'VOICE',
            config: { ...baseConfig },
          });
        }
      }
    } else if (group === 'PLUGIN') {
      Object.assign(config, { type: pluginConfig.type });
      
      // Add only the relevant config based on plugin type
      if (pluginConfig.type === 'SLACK') {
        Object.assign(config, {
          slackWebhookUrl: pluginConfig.slackWebhookUrl,
          slackChannel: pluginConfig.slackChannel
        });
      } else if (pluginConfig.type === 'TELEGRAM') {
        Object.assign(config, {
          telegramBotToken: pluginConfig.telegramBotToken,
          telegramChatId: pluginConfig.telegramChatId
        });
      } else if (pluginConfig.type === 'CUSTOM_WEBHOOK') {
        Object.assign(config, {
          webhook: pluginConfig.webhook
        });
      }
      
      requests.push({
        id: editingMethod?.id,
        name,
        description,
        type: 'PLUGIN',  // Always set type as PLUGIN
        config,
      });
    }

    try {
      // First delete any methods that need to be deleted
      if (deleteIds.length > 0 && onDelete) {
        await Promise.all(deleteIds.map(id => onDelete(id)));
      }

      // Then process all create/update requests
      await Promise.all(requests.map(request => onSubmit(request)));
      onClose()
    } catch (error) {
      console.error('Error creating/updating delivery methods:', error);
      setValidationErrors({ submit: 'Failed to save delivery method' });
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setEmail('');
    setDoveNumber('');
    setPhone({
      phoneNumber: '',
      countryCode: '',
      enableText: true,
      enableVoice: true,
    });
    setPluginConfig({
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
    setHeaderKeys([]);
    setValidationErrors({});
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
      return;
    }

    if (editingMethod) {
      const config = typeof editingMethod.config === 'string' 
        ? JSON.parse(editingMethod.config)
        : editingMethod.config;

      setName(editingMethod.name);
      setDescription(editingMethod.description || '');
      setType(editingMethod.type);

      if (group === 'DOVEAPP') {
        setDoveNumber(config.doveNumber || '');
      } else if (group === 'EMAIL') {
        setEmail(config.email || '');
      } else if (group === 'PHONE') {
        setPhone({
          phoneNumber: config.phoneNumber || '',
          countryCode: config.countryCode || '',
          enableText: Boolean(config.textMethodId),
          enableVoice: Boolean(config.voiceMethodId),
        });
      } else if (group === 'PLUGIN') {
        setPluginConfig(config);
        setHeaderKeys(Object.keys(config.webhook?.headers || {}));
      }
    } else {
      resetForm();
    }
  }, [isOpen, editingMethod, group]);

  const getPhoneHint = (enableText: boolean, enableVoice: boolean): JSX.Element => {
    if (!enableText && !enableVoice) {
      return (
        <span className="text-red-500">
          You must select one of text or voice to create the delivery method
        </span>
      );
    }
    
    if (enableText && enableVoice) {
      return <span>Both Text and Voice methods will be created using provided number</span>;
    } else if (enableText) {
      return <span>A text method will be created using the number</span>;
    } else if (enableVoice) {
      return <span>A voice method will be created using this number</span>;
    }
    
    return <span></span>;
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={() => {}}>
        <style jsx global>{`
          .phone-input-container {
            width: 100%;
          }
          .phone-input-container .form-control {
            width: 100% !important;
            height: 38px !important;
            border-radius: 6px !important;
            padding-left: 48px !important;
          }
          .phone-input-container .flag-dropdown {
            border: none !important;
            background: transparent !important;
          }
          .phone-input-container .selected-flag {
            background: transparent !important;
            border-radius: 6px 0 0 6px !important;
          }
          .phone-input-container .form-control:focus {
            border-color: #6366f1 !important;
            box-shadow: 0 0 0 1px #6366f1 !important;
          }
        `}</style>
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
              <Dialog.Panel className="relative transform overflow-hidden bg-white px-4 pb-4 pt-5 text-left transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
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

                      <div className="mt-4 space-y-6">
                        {/* Common Fields */}
                        <div className="space-y-6">
                          {/* Name field */}
                          <div>
                            <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900">
                              Name
                            </label>
                            <div className="mt-2">
                              <input
                                type="text"
                                name="name"
                                id="name"
                                value={name}
                                onChange={(e) => {
                                  setName(e.target.value);
                                  if (validationErrors.name) {
                                    setValidationErrors(prev => ({ ...prev, name: '' }));
                                  }
                                }}
                                className={`block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ${
                                  validationErrors.name ? 'ring-red-500' : 'ring-gray-300'
                                } placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6`}
                                placeholder="Enter a name for this delivery method"
                              />
                              {validationErrors.name && (
                                <p className="mt-2 text-sm text-red-500">{validationErrors.name}</p>
                              )}
                            </div>
                          </div>

                          {/* Type-specific Fields */}
                          {group === 'DOVEAPP' && (
                            <div>
                              <label className="block text-sm font-medium leading-6 text-gray-900">Dove Number</label>
                              <input
                                type="text"
                                value={doveNumber}
                                readOnly
                                disabled
                                className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-500 bg-gray-50 shadow-sm ring-1 ring-inset ring-gray-300 sm:text-sm sm:leading-6"
                              />
                            </div>
                          )}

                          {group === 'EMAIL' && (
                            <div>
                              <label className="block text-sm font-medium leading-6 text-gray-900">Email Address</label>
                              <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => {
                                  setEmail(e.target.value);
                                  if (validationErrors.email) {
                                    setValidationErrors(prev => ({ ...prev, email: '' }));
                                  }
                                }}
                                className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                              />
                              {validationErrors.email && (
                                <p className="mt-2 text-sm text-red-500">{validationErrors.email}</p>
                              )}
                            </div>
                          )}

                          {group === 'PHONE' && (
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium leading-6 text-gray-900 mb-2">
                                  Phone Number
                                </label>
                                <div className="flex space-x-4">
                                  <div className="flex-grow">
                                    <div>
                                      <PhoneInput
                                        country={'cn'}
                                        value={phone.phoneNumber}
                                        onChange={(value, data: any) => {
                                          setPhone(prev => ({
                                            ...prev,
                                            phoneNumber: value,
                                            countryCode: data.dialCode
                                          }));
                                          if (validationErrors.phone) {
                                            setValidationErrors(prev => ({ ...prev, phone: '' }));
                                          }
                                        }}
                                        containerClass="phone-input-container"
                                        specialLabel=""
                                        masks={{cn: '... .... ....', us: '... ... ....', gb: '.... ......'}}
                                      />
                                    </div>
                                    {validationErrors.phone ? (
                                      <p className="mt-2 text-sm text-red-500">{validationErrors.phone}</p>
                                    ) : (
                                      <p className="mt-2 text-sm text-gray-500">
                                        {getPhoneHint(phone.enableText, phone.enableVoice)}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-4 h-[38px]">
                                    <label className="inline-flex items-center whitespace-nowrap">
                                      <input
                                        type="checkbox"
                                        checked={phone.enableText}
                                        onChange={(e) => setPhone(prev => ({ ...prev, enableText: e.target.checked }))}
                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                                      />
                                      <span className="ml-2 text-sm text-gray-700">Text</span>
                                    </label>
                                    <label className="inline-flex items-center whitespace-nowrap">
                                      <input
                                        type="checkbox"
                                        checked={phone.enableVoice}
                                        onChange={(e) => setPhone(prev => ({ ...prev, enableVoice: e.target.checked }))}
                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                                      />
                                      <span className="ml-2 text-sm text-gray-700">Voice</span>
                                    </label>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {group === 'PLUGIN' && (
                            <div className="space-y-4">
                              <Select
                                label="Integration Type"
                                value={pluginConfig.type}
                                onChange={(value) => setPluginConfig(prev => ({ 
                                  ...prev, 
                                  type: value as PluginType,
                                  // Reset other fields when type changes
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
                                }))}
                                options={pluginTypes}
                                disabled={!!editingMethod}
                                className="mt-2"
                              />

                              {pluginConfig.type === 'SLACK' && (
                                <div className="space-y-4 rounded-md bg-gray-50 px-4 py-4">
                                  <div>
                                    <label className="block text-sm font-medium leading-6 text-gray-900">Webhook URL</label>
                                    <input
                                      type="url"
                                      required
                                      value={pluginConfig.slackWebhookUrl}
                                      onChange={(e) => setPluginConfig(prev => ({
                                        ...prev,
                                        slackWebhookUrl: e.target.value
                                      }))}
                                      className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                      placeholder="https://hooks.slack.com/services/..."
                                    />
                                    {validationErrors.webhook && (
                                      <p className="mt-2 text-sm text-red-500">{validationErrors.webhook}</p>
                                    )}
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium leading-6 text-gray-900">Channel (Optional)</label>
                                    <input
                                      type="text"
                                      value={pluginConfig.slackChannel || ''}
                                      onChange={(e) => setPluginConfig(prev => ({
                                        ...prev,
                                        slackChannel: e.target.value
                                      }))}
                                      className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                      placeholder="#general"
                                    />
                                  </div>
                                </div>
                              )}

                              {pluginConfig.type === 'TELEGRAM' && (
                                <div className="space-y-4 rounded-md bg-gray-50 px-4 py-4">
                                  <div>
                                    <label className="block text-sm font-medium leading-6 text-gray-900">Bot Token</label>
                                    <input
                                      type="text"
                                      required
                                      value={pluginConfig.telegramBotToken}
                                      onChange={(e) => setPluginConfig(prev => ({
                                        ...prev,
                                        telegramBotToken: e.target.value
                                      }))}
                                      className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                      placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                                    />
                                    <p className="mt-2 text-sm text-gray-500">
                                      Create a bot and get the token from @BotFather
                                    </p>
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium leading-6 text-gray-900">Chat ID</label>
                                    <input
                                      type="text"
                                      required
                                      value={pluginConfig.telegramChatId}
                                      onChange={(e) => setPluginConfig(prev => ({
                                        ...prev,
                                        telegramChatId: e.target.value
                                      }))}
                                      className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                      placeholder="-100123456789"
                                    />
                                    <p className="mt-2 text-sm text-gray-500">
                                      Add the bot to a group/channel and get the chat ID
                                    </p>
                                  </div>
                                </div>
                              )}

                              {pluginConfig.type === 'CUSTOM_WEBHOOK' && (
                                <div className="space-y-4 rounded-md bg-gray-50 px-4 py-4">
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
                                      className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                      placeholder="https://api.example.com/webhook"
                                    />
                                    {validationErrors.webhook && (
                                      <p className="mt-2 text-sm text-red-500">{validationErrors.webhook}</p>
                                    )}
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium leading-6 text-gray-900">HTTP Method</label>
                                    <select
                                      value={pluginConfig.webhook?.method}
                                      onChange={(e) => setPluginConfig(prev => ({
                                        ...prev,
                                        webhook: { ...prev.webhook!, method: e.target.value }
                                      }))}
                                      className="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                    >
                                      {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(method => (
                                        <option key={method} value={method}>{method}</option>
                                      ))}
                                    </select>
                                  </div>

                                  <div>
                                    <div className="flex items-center justify-between">
                                      <label className="block text-sm font-medium leading-6 text-gray-900">Headers</label>
                                    </div>
                                    <div className="mt-2 space-y-2">
                                      {headerKeys.map((headerKey) => {
                                        const value = pluginConfig.webhook?.headers?.[headerKey] || '';
                                        return (
                                          <div key={headerKey} className="flex gap-x-2 items-center">
                                            <div className="w-1/3">
                                              <EditableSelect
                                                options={commonHeaderOptions}
                                                value={headerKey}
                                                onChange={(newKey) => {
                                                  if (newKey === headerKey) return;
                                                  
                                                  const currentHeaders = { ...pluginConfig.webhook?.headers };
                                                  const currentValue = currentHeaders[headerKey];
                                                  delete currentHeaders[headerKey];
                                                  currentHeaders[newKey] = currentValue;

                                                  setHeaderKeys(prev => 
                                                    prev.map(k => k === headerKey ? newKey : k)
                                                  );

                                                  setPluginConfig(prev => ({
                                                    ...prev,
                                                    webhook: {
                                                      ...prev.webhook!,
                                                      headers: currentHeaders
                                                    }
                                                  }));
                                                }}
                                                placeholder="Header name"
                                              />
                                            </div>
                                            <div className="flex-1">
                                              <input
                                                type="text"
                                                value={value}
                                                onChange={(e) => {
                                                  const currentHeaders = { ...pluginConfig.webhook?.headers };
                                                  currentHeaders[headerKey] = e.target.value;
                                                  setPluginConfig(prev => ({
                                                    ...prev,
                                                    webhook: {
                                                      ...prev.webhook!,
                                                      headers: currentHeaders
                                                    }
                                                  }));
                                                }}
                                                placeholder="Header value"
                                                className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                              />
                                            </div>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const currentHeaders = { ...pluginConfig.webhook?.headers };
                                                delete currentHeaders[headerKey];
                                                
                                                setHeaderKeys(prev => 
                                                  prev.filter(k => k !== headerKey)
                                                );

                                                setPluginConfig(prev => ({
                                                  ...prev,
                                                  webhook: {
                                                    ...prev.webhook!,
                                                    headers: currentHeaders
                                                  }
                                                }));
                                              }}
                                              className="inline-flex items-center rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
                                            >
                                              <TrashIcon className="h-5 w-5" aria-hidden="true" />
                                            </button>
                                          </div>
                                        );
                                      })}
                                      {headerKeys.length === 0 && (
                                        <p className="text-sm text-gray-500 text-center py-4">
                                          No headers added yet. Click "Add Header" to add one.
                                        </p>
                                      )}
                                      <div className="mt-4">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const newKey = `header${headerKeys.length + 1}`;
                                            setHeaderKeys(prev => [...prev, newKey]);
                                            
                                            setPluginConfig(prev => ({
                                              ...prev,
                                              webhook: {
                                                ...prev.webhook || {
                                                  url: '',
                                                  method: 'POST',
                                                  headers: {},
                                                  payload: '',
                                                },
                                                headers: {
                                                  ...(prev.webhook?.headers || {}),
                                                  [newKey]: ''
                                                }
                                              }
                                            }));
                                          }}
                                          className="w-full rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                                        >
                                          Add Header
                                        </button>
                                      </div>
                                    </div>
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
                                      className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 font-mono"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Description field at bottom */}
                          <div>
                            <label htmlFor="description" className="block text-sm font-medium leading-6 text-gray-900">
                              Description
                            </label>
                            <div className="mt-2">
                              <textarea
                                id="description"
                                name="description"
                                rows={3}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                placeholder="Optional description..."
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Footer with buttons */}
                      <div className="mt-8 flex flex-row-reverse space-x-3 space-x-reverse">
                        <button
                          type="submit"
                          className="inline-flex w-auto justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                        >
                          {editingMethod ? 'Save Changes' : 'Add Method'}
                        </button>
                        <button
                          type="button"
                          className="inline-flex w-auto justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                          onClick={onClose}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
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
