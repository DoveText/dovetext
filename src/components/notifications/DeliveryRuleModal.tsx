'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog as HeadlessDialog, Transition } from '@headlessui/react';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import Select from '@/components/common/Select';
import { DeliveryRule, DeliveryRuleTarget } from '@/types/delivery-rule';
import { DeliveryMethod } from '@/types/delivery-method';
import { EscalationChain } from '@/types/escalation-chain';
import { deliveryMethodsApi } from '@/api/delivery-methods';
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

const daysOfWeek = [
  { value: '0', label: 'Sunday' },
  { value: '1', label: 'Monday' },
  { value: '2', label: 'Tuesday' },
  { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday' },
  { value: '5', label: 'Friday' },
  { value: '6', label: 'Saturday' },
];

export default function DeliveryRuleModal({
  isOpen,
  onClose,
  rule,
  onSave,
}: DeliveryRuleModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('0');
  const [conditions, setConditions] = useState('{}');
  const [targets, setTargets] = useState<DeliveryRuleTarget[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [deliveryMethods, setDeliveryMethods] = useState<DeliveryMethod[]>([]);
  const [escalationChains, setEscalationChains] = useState<EscalationChain[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [methodsResponse, chainsResponse] = await Promise.all([
          deliveryMethodsApi.getAll(),
          escalationChainsApi.getAll(),
        ]);
        setDeliveryMethods(methodsResponse);
        setEscalationChains(chainsResponse);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load delivery methods and escalation chains');
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (rule) {
      setName(rule.name);
      setDescription(rule.description || '');
      setPriority(rule.priority.toString());
      setConditions(JSON.stringify(rule.conditions, null, 2));
      setTargets(rule.targets);
    } else {
      setName('');
      setDescription('');
      setPriority('0');
      setConditions('{}');
      setTargets([]);
    }
  }, [rule]);

  const handleAddTarget = () => {
    setTargets([
      ...targets,
      {
        methodId: '',
        chainId: '',
        startTime: '09:00',
        endTime: '17:00',
        daysOfWeek: [1, 2, 3, 4, 5],
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        priority: targets.length,
      },
    ]);
  };

  const handleRemoveTarget = (index: number) => {
    setTargets(targets.filter((_, i) => i !== index));
  };

  const handleUpdateTarget = (index: number, updates: Partial<DeliveryRuleTarget>) => {
    setTargets(
      targets.map((target, i) =>
        i === index ? { ...target, ...updates } : target
      )
    );
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      const ruleData = {
        name,
        description,
        priority: parseInt(priority),
        conditions: JSON.parse(conditions),
        targets: targets.map(({ method, chain, ...target }) => target),
        isActive: true,
      };

      if (rule) {
        await deliveryRulesApi.update(rule.id, ruleData);
      } else {
        await deliveryRulesApi.create(ruleData);
      }

      onSave();
      onClose();
    } catch (err) {
      console.error('Failed to save delivery rule:', err);
      setError('Failed to save delivery rule');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
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
              <HeadlessDialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
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

                <div>
                  <HeadlessDialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                    {rule ? 'Edit Delivery Rule' : 'Create Delivery Rule'}
                  </HeadlessDialog.Title>

                  <div className="mt-6 space-y-6">
                    {/* Error Message */}
                    {error && (
                      <div className="rounded-md bg-red-50 p-4">
                        <div className="flex">
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">{error}</h3>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Name */}
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
                          onChange={(e) => setName(e.target.value)}
                          className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                          placeholder="Enter rule name"
                        />
                      </div>
                    </div>

                    {/* Priority */}
                    <div>
                      <label htmlFor="priority" className="block text-sm font-medium leading-6 text-gray-900">
                        Priority
                      </label>
                      <div className="mt-2">
                        <Select<string>
                          value={priority}
                          onChange={setPriority}
                          options={priorityOptions}
                          placeholder="Select priority"
                        />
                      </div>
                    </div>

                    {/* Conditions */}
                    <div>
                      <label htmlFor="conditions" className="block text-sm font-medium leading-6 text-gray-900">
                        Conditions
                      </label>
                      <div className="mt-2">
                        <textarea
                          id="conditions"
                          name="conditions"
                          rows={4}
                          value={conditions}
                          onChange={(e) => setConditions(e.target.value)}
                          className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                          placeholder="Enter conditions in JSON format"
                        />
                      </div>
                    </div>

                    {/* Description */}
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
                          placeholder="Enter a description for this rule"
                        />
                      </div>
                    </div>

                    {/* Targets */}
                    <div>
                      <label className="block text-sm font-medium leading-6 text-gray-900">
                        Targets
                      </label>
                      <div className="mt-2">
                        {targets.map((target, index) => (
                          <div key={index} className="mb-4">
                            <div className="flex justify-between">
                              <h4 className="text-sm font-medium leading-6 text-gray-900">
                                Target {index + 1}
                              </h4>
                              <button
                                type="button"
                                onClick={() => handleRemoveTarget(index)}
                                className="rounded-md bg-red-50 px-2 py-1 text-sm font-semibold text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
                              >
                                Remove
                              </button>
                            </div>
                            <div className="mt-2">
                              <Select<string>
                                value={target.methodId}
                                onChange={(value) => handleUpdateTarget(index, { methodId: value })}
                                options={deliveryMethods.map((method) => ({ value: method.id, label: method.name }))}
                                placeholder="Select delivery method"
                              />
                            </div>
                            <div className="mt-2">
                              <Select<string>
                                value={target.chainId}
                                onChange={(value) => handleUpdateTarget(index, { chainId: value })}
                                options={escalationChains.map((chain) => ({ value: chain.id, label: chain.name }))}
                                placeholder="Select escalation chain"
                              />
                            </div>
                            <div className="mt-2">
                              <Select<string>
                                value={target.startTime}
                                onChange={(value) => handleUpdateTarget(index, { startTime: value })}
                                options={timeOptions}
                                placeholder="Select start time"
                              />
                            </div>
                            <div className="mt-2">
                              <Select<string>
                                value={target.endTime}
                                onChange={(value) => handleUpdateTarget(index, { endTime: value })}
                                options={timeOptions}
                                placeholder="Select end time"
                              />
                            </div>
                            <div className="mt-2">
                              <Select<string>
                                value={target.daysOfWeek.join(',')}
                                onChange={(value) => handleUpdateTarget(index, { daysOfWeek: value.split(',').map(Number) })}
                                options={daysOfWeek.map((day) => ({ value: day.value, label: day.label }))}
                                placeholder="Select days of week"
                                multiple
                              />
                            </div>
                            <div className="mt-2">
                              <input
                                type="text"
                                value={target.timezone}
                                onChange={(e) => handleUpdateTarget(index, { timezone: e.target.value })}
                                className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                placeholder="Enter timezone"
                              />
                            </div>
                            <div className="mt-2">
                              <input
                                type="number"
                                value={target.priority}
                                onChange={(e) => handleUpdateTarget(index, { priority: Number(e.target.value) })}
                                className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                placeholder="Enter priority"
                              />
                            </div>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={handleAddTarget}
                          className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                        >
                          Add Target
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2"
                  >
                    {isSubmitting ? 'Saving...' : rule ? 'Save Changes' : 'Create Rule'}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
                  >
                    Cancel
                  </button>
                </div>
              </HeadlessDialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </HeadlessDialog>
    </Transition.Root>
  );
}
