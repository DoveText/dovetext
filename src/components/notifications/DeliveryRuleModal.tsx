'use client';

import { Fragment, useState, useEffect, useRef, useCallback } from 'react';
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
import { deliveryMethodsApi } from '@/app/api/delivery-methods';
import { deliveryChannelsApi } from '@/app/api/delivery-channels';
import { escalationChainsApi } from '@/app/api/escalation-chains';
import { deliveryRulesApi } from '@/app/api/delivery-rules';

interface DeliveryRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingRule: DeliveryRule | null;
  onSave: () => void;
}

const priorityOptions = [
  { value: '1', label: 'Low' },
  { value: '2', label: 'Medium' },
  { value: '3', label: 'High' },
  { value: '4', label: 'Critical' },
  { value: '10', label: 'Default' },
];

export default function DeliveryRuleModal({
  isOpen,
  onClose,
  editingRule,
  onSave,
}: DeliveryRuleModalProps) {
  const [name, setName] = useState(editingRule?.name || '');
  const [description, setDescription] = useState(editingRule?.description || '');
  const [priority, setPriority] = useState(editingRule?.priority || 10);
  const [timeslot, setTimeslot] = useState(editingRule?.timeslot || {
    startTime: '09:00',
    endTime: '17:00',
    daysOfWeek: ALL_DAYS,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });
  const [methodIds, setMethodIds] = useState<string[]>(editingRule?.methodIds || []);
  const [channelIds, setChannelIds] = useState<string[]>(editingRule?.channelIds || []);
  const [chainIds, setChainIds] = useState<string[]>(editingRule?.chainIds || []);
  const [methods, setMethods] = useState<DeliveryMethod[]>([]);
  const [channels, setChannels] = useState<DeliveryChannel[]>([]);
  const [chains, setChains] = useState<EscalationChain[]>([]);
  const [conditions, setConditions] = useState(editingRule?.conditions || {});
  const [settings, setSettings] = useState(editingRule?.settings || { isActive: true });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const methodSelectorRef = useRef<DeliveryMethodSelectorRef>(null);
  const channelSelectorRef = useRef<DeliveryChannelSelectorRef>(null);
  const chainSelectorRef = useRef<EscalationChainSelectorRef>(null);

  useEffect(() => {
    if (editingRule) {
      setName(editingRule.name);
      setDescription(editingRule.description || '');
      setPriority(editingRule.priority || 10);
      setTimeslot(editingRule.timeslot || {
        startTime: '09:00',
        endTime: '17:00',
        daysOfWeek: ALL_DAYS,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });
      setMethodIds(editingRule.methodIds || []);
      setChannelIds(editingRule.channelIds || []);
      setChainIds(editingRule.chainIds || []);
      setConditions(editingRule.conditions || {});
      setSettings(editingRule.settings || { isActive: true });
    } else {
      setName('');
      setDescription('');
      setPriority(10);
      setTimeslot({
        startTime: '09:00',
        endTime: '17:00',
        daysOfWeek: ALL_DAYS,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });
      setMethodIds([]);
      setChannelIds([]);
      setChainIds([]);
      setConditions({});
      setSettings({ isActive: true });
    }
    setFormErrors({});
  }, [editingRule]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fetchedMethods, fetchedChannels, fetchedChains] = await Promise.all([
          deliveryMethodsApi.getAll(),
          deliveryChannelsApi.getAll(),
          escalationChainsApi.getAll()
        ]);
        setMethods(fetchedMethods);
        setChannels(fetchedChannels);
        setChains(fetchedChains);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormErrors({});

    try {
      const request: any = {
        name,
        description,
        priority,
        methodIds,
        channelIds,
        chainIds,
        timeslot,
        conditions,
        settings
      };

      if (editingRule) {
        await deliveryRulesApi.update(editingRule.id, request);
      } else {
        await deliveryRulesApi.create(request);
      }

      onSave();
      onClose();
    } catch (err) {
      console.error('Failed to save rule:', err);
      setFormErrors({
        submit: 'Failed to save rule. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
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
                    {editingRule ? 'Edit Delivery Rule' : 'New Delivery Rule'}
                    <button
                      type="button"
                      className="rounded-md text-gray-400 hover:text-gray-500"
                      onClick={onClose}
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </HeadlessDialog.Title>

                  {formErrors.submit && (
                    <div className="mt-2 rounded-md bg-red-50 p-4">
                      <div className="flex">
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800">{formErrors.submit}</h3>
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
                      label="Settings"
                      htmlFor="settings"
                    >
                      <div className="space-y-4">
                        <TimeRangeSelector
                          value={timeslot}
                          onChange={setTimeslot}
                        />

                        <FormField label="Priority">
                          <Select
                            value={priority.toString()}
                            onChange={(value) => setPriority(parseInt(value))}
                            options={priorityOptions}
                          />
                        </FormField>

                        <div>
                          <FormField 
                            label={
                              <div className="flex items-center justify-between">
                                <span>Methods</span>
                                <button
                                  type="button"
                                  onClick={() => methodSelectorRef.current?.openDialog()}
                                  className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-500"
                                >
                                  <PlusIcon className="h-4 w-4 mr-1" />
                                  Add Method
                                </button>
                              </div>
                            }
                          >
                            <DeliveryMethodSelector
                              ref={methodSelectorRef}
                              value={methods.filter(m => methodIds.includes(m.id))}
                              onChange={(selected) => setMethodIds(selected.map(m => m.id))}
                              hideAddButton
                            />
                          </FormField>
                        </div>

                        <div>
                          <FormField 
                            label={
                              <div className="flex items-center justify-between">
                                <span>Channels</span>
                                <button
                                  type="button"
                                  onClick={() => channelSelectorRef.current?.openDialog()}
                                  className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-500"
                                >
                                  <PlusIcon className="h-4 w-4 mr-1" />
                                  Add Channel
                                </button>
                              </div>
                            }
                          >
                            <DeliveryChannelSelector
                              ref={channelSelectorRef}
                              value={channels.filter(c => channelIds.includes(c.id))}
                              onChange={(selected) => setChannelIds(selected.map(c => c.id))}
                              hideAddButton
                            />
                          </FormField>
                        </div>

                        <div>
                          <FormField 
                            label={
                              <div className="flex items-center justify-between">
                                <span>Escalation Chains</span>
                                <button
                                  type="button"
                                  onClick={() => chainSelectorRef.current?.openDialog()}
                                  className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-500"
                                >
                                  <PlusIcon className="h-4 w-4 mr-1" />
                                  Add Chain
                                </button>
                              </div>
                            }
                          >
                            <EscalationChainSelector
                              ref={chainSelectorRef}
                              value={chains.filter(c => chainIds.includes(c.id))}
                              onChange={(selected) => setChainIds(selected.map(c => c.id))}
                              hideAddButton
                            />
                          </FormField>
                        </div>
                      </div>
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
                        {editingRule ? 'Save Changes' : 'Create Rule'}
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
