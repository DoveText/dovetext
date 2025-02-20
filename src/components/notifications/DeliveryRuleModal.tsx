'use client';

import { Fragment, useState, useEffect, useRef } from 'react';
import { Dialog as HeadlessDialog, Transition } from '@headlessui/react';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import Select from '@/components/common/Select';
import { FormField, FormInput, FormTextArea } from '@/components/common/form';
import DeliveryMethodSelector, { DeliveryMethodSelectorRef } from './DeliveryMethodSelector';
import DeliveryChannelSelector, { DeliveryChannelSelectorRef } from './DeliveryChannelSelector';
import EscalationChainSelector, { EscalationChainSelectorRef } from './EscalationChainSelector';
import TimeRangeSelector from '@/components/common/TimeRangeSelector';
import { DeliveryRule, DeliveryRuleSlot } from '@/types/delivery-rule';
import { DeliveryMethod } from '@/types/delivery-method';
import { DeliveryChannel } from '@/types/delivery-channel';
import { EscalationChain } from '@/types/escalation-chain';
import { TimeRange, ALL_DAYS } from '@/types/time-range';
import { deliveryMethodsApi } from '@/api/delivery-methods';
import { deliveryChannelsApi } from '@/api/delivery-channels';
import { escalationChainsApi } from '@/api/escalation-chains';
import { deliveryRulesApi } from '@/api/delivery-rules';

interface DeliveryRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  rule: DeliveryRule | null;
  onSave: () => void;
}

const priorityOptions = [
  { value: '0', label: 'Low' },
  { value: '1', label: 'Medium' },
  { value: '2', label: 'High' },
];

const timeOptions = [
  { value: '00:00', label: '12:00 AM' },
  { value: '01:00', label: '1:00 AM' },
  { value: '02:00', label: '2:00 AM' },
  { value: '03:00', label: '3:00 AM' },
  { value: '04:00', label: '4:00 AM' },
  { value: '05:00', label: '5:00 AM' },
  { value: '06:00', label: '6:00 AM' },
  { value: '07:00', label: '7:00 AM' },
  { value: '08:00', label: '8:00 AM' },
  { value: '09:00', label: '9:00 AM' },
  { value: '10:00', label: '10:00 AM' },
  { value: '11:00', label: '11:00 AM' },
  { value: '12:00', label: '12:00 PM' },
  { value: '13:00', label: '1:00 PM' },
  { value: '14:00', label: '2:00 PM' },
  { value: '15:00', label: '3:00 PM' },
  { value: '16:00', label: '4:00 PM' },
  { value: '17:00', label: '5:00 PM' },
  { value: '18:00', label: '6:00 PM' },
  { value: '19:00', label: '7:00 PM' },
  { value: '20:00', label: '8:00 PM' },
  { value: '21:00', label: '9:00 PM' },
  { value: '22:00', label: '10:00 PM' },
  { value: '23:00', label: '11:00 PM' },
];

export default function DeliveryRuleModal({
  isOpen,
  onClose,
  rule,
  onSave,
}: DeliveryRuleModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [conditions, setConditions] = useState<Record<string, any>>({});
  const [settings, setSettings] = useState<Record<string, any>>({
    isActive: true,
    priority: 1
  });
  const [slots, setSlots] = useState<DeliveryRuleSlot[]>([]);
  const [methods, setMethods] = useState<DeliveryMethod[]>([]);
  const [channels, setChannels] = useState<DeliveryChannel[]>([]);
  const [chains, setChains] = useState<EscalationChain[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const methodSelectorRefs = useRef<(DeliveryMethodSelectorRef | null)[]>([]);
  const channelSelectorRefs = useRef<(DeliveryChannelSelectorRef | null)[]>([]);
  const chainSelectorRefs = useRef<(EscalationChainSelectorRef | null)[]>([]);

  useEffect(() => {
    if (rule) {
      setName(rule.name);
      setDescription(rule.description || '');
      setConditions(rule.conditions);
      setSettings(rule.settings);
      setSlots(rule.slots.map(slot => ({
        ...slot,
        methodIds: slot.methodIds || [],
        channelIds: slot.channelIds || [],
        chainIds: slot.chainIds || [],
        timeslot: {
          startTime: slot.timeslot?.startTime || '09:00',
          endTime: slot.timeslot?.endTime || '17:00',
          daysOfWeek: slot.timeslot?.daysOfWeek || ALL_DAYS,
          timezone: slot.timeslot?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        settings: {
          priority: slot.settings?.priority || 1
        }
      })));
    } else {
      resetForm();
    }
  }, [rule]);

  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async () => {
    try {
      const [methodsData, channelsData, chainsData] = await Promise.all([
        deliveryMethodsApi.getAll(),
        deliveryChannelsApi.getAll(),
        escalationChainsApi.getAll()
      ]);
      setMethods(methodsData);
      setChannels(channelsData);
      setChains(chainsData);
    } catch (err) {
      setError('Failed to load options');
      console.error(err);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setConditions({});
    setSettings({
      isActive: true,
      priority: 1
    });
    setSlots([]);
    setError(null);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!name.trim()) {
      errors.name = 'Name is required';
    }

    if (slots.length === 0) {
      errors.slots = 'At least one delivery slot is required';
    }

    slots.forEach((slot, index) => {
      if (!slot.methodIds.length) {
        errors[`slot${index}`] = 'At least one delivery method is required';
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }

    try {
      const ruleData: DeliveryRule = {
        id: rule?.id,
        name,
        description,
        conditions,
        settings,
        slots: slots.map(slot => ({
          methodIds: slot.methodIds,
          channelIds: slot.channelIds,
          chainIds: slot.chainIds,
          timeslot: slot.timeslot,
          settings: slot.settings
        })),
        createdAt: rule?.createdAt,
        updatedAt: new Date().toISOString()
      };

      if (rule?.id) {
        await deliveryRulesApi.update(rule.id, ruleData);
      } else {
        await deliveryRulesApi.create(ruleData);
      }

      onSave();
      onClose();
      resetForm();
    } catch (err) {
      console.error('Failed to save delivery rule:', err);
      setError('Failed to save delivery rule');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addSlot = () => {
    setSlots([
      ...slots,
      {
        methodIds: [],
        channelIds: [],
        chainIds: [],
        timeslot: {
          startTime: '09:00',
          endTime: '17:00',
          daysOfWeek: ALL_DAYS,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        settings: {
          priority: 1
        }
      }
    ]);
  };

  const removeSlot = (index: number) => {
    const newSlots = [...slots];
    newSlots.splice(index, 1);
    setSlots(newSlots);
    
    // Clean up refs
    methodSelectorRefs.current.splice(index, 1);
    channelSelectorRefs.current.splice(index, 1);
    chainSelectorRefs.current.splice(index, 1);
  };

  const updateSlot = (index: number, updates: Partial<DeliveryRuleSlot>) => {
    setSlots(slots.map((slot, i) => 
      i === index 
        ? { ...slot, ...updates }
        : slot
    ));
  };

  const updateSlotTimeRange = (index: number, timeRange: TimeRange) => {
    updateSlot(index, {
      timeslot: {
        ...slots[index].timeslot,
        startTime: timeRange.startTime || '00:00',
        endTime: timeRange.endTime || '23:59',
        daysOfWeek: timeRange.daysOfWeek || ALL_DAYS,
      }
    });
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <HeadlessDialog as="div" className="relative z-10" onClose={onClose}>
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
              <HeadlessDialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <form onSubmit={handleSubmit}>
                  <HeadlessDialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 flex justify-between items-center"
                  >
                    {rule ? 'Edit Delivery Rule' : 'New Delivery Rule'}
                    <button
                      type="button"
                      className="rounded-md text-gray-400 hover:text-gray-500"
                      onClick={onClose}
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </HeadlessDialog.Title>

                  {error && (
                    <div className="mt-2 rounded-md bg-red-50 p-4">
                      <div className="flex">
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800">{error}</h3>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 space-y-4">
                    <FormField
                      label="Name"
                      htmlFor="name"
                      error={formErrors.name}
                    >
                      <FormInput
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter rule name"
                        error={formErrors.name}
                      />
                    </FormField>

                    <FormField
                      label="Description"
                      htmlFor="description"
                    >
                      <FormTextArea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Enter rule description"
                        rows={3}
                      />
                    </FormField>

                    <FormField
                      label="Settings"
                      htmlFor="settings"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="isActive"
                            checked={settings.isActive}
                            onChange={(e) => setSettings({ ...settings, isActive: e.target.checked })}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                          />
                          <label htmlFor="isActive" className="ml-2 text-sm text-gray-900">
                            Active
                          </label>
                        </div>
                        <Select
                          value={settings.priority.toString()}
                          onChange={(value) => setSettings({ ...settings, priority: parseInt(value) })}
                          options={priorityOptions}
                          className="mt-1"
                        />
                      </div>
                    </FormField>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-medium text-gray-900">Delivery Slots</h4>
                        <button
                          type="button"
                          onClick={addSlot}
                          className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                        >
                          <PlusIcon className="h-4 w-4 mr-1" />
                          Add Slot
                        </button>
                      </div>
                      
                      {formErrors.slots && (
                        <p className="mt-2 text-sm text-red-500">{formErrors.slots}</p>
                      )}

                      {slots.map((slot, index) => (
                        <div key={index} className="relative rounded-lg border border-gray-200 p-4">
                          <button
                            type="button"
                            onClick={() => removeSlot(index)}
                            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>

                          <div className="space-y-4">
                            <TimeRangeSelector
                              value={{
                                startTime: slot.timeslot.startTime,
                                endTime: slot.timeslot.endTime,
                                daysOfWeek: slot.timeslot.daysOfWeek,
                              }}
                              onChange={(timeRange) => updateSlotTimeRange(index, timeRange)}
                            />

                            <FormField
                              label="Methods"
                              error={formErrors[`slot${index}`]}
                            >
                              <DeliveryMethodSelector
                                ref={(ref) => (methodSelectorRefs.current[index] = ref)}
                                value={methods.filter(m => slot.methodIds.includes(m.id))}
                                onChange={(selected) => updateSlot(index, {
                                  methodIds: selected.map(m => m.id)
                                })}
                              />
                            </FormField>

                            <FormField label="Channels">
                              <DeliveryChannelSelector
                                ref={(ref) => (channelSelectorRefs.current[index] = ref)}
                                value={channels.filter(c => slot.channelIds.includes(c.id))}
                                onChange={(selected) => updateSlot(index, {
                                  channelIds: selected.map(c => c.id)
                                })}
                              />
                            </FormField>

                            <FormField label="Escalation Chains">
                              <EscalationChainSelector
                                ref={(ref) => (chainSelectorRefs.current[index] = ref)}
                                value={chains.filter(c => slot.chainIds.includes(c.id))}
                                onChange={(selected) => updateSlot(index, {
                                  chainIds: selected.map(c => c.id)
                                })}
                              />
                            </FormField>

                            <FormField label="Priority">
                              <Select
                                value={slot.settings.priority.toString()}
                                onChange={(value) => updateSlot(index, {
                                  settings: { ...slot.settings, priority: parseInt(value) }
                                })}
                                options={priorityOptions}
                              />
                            </FormField>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                      >
                        {rule ? 'Save Changes' : 'Create Rule'}
                      </button>
                    </div>
                  </div>
                </form>
              </HeadlessDialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </HeadlessDialog>
    </Transition>
  );
}
