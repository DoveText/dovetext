'use client';

import { Fragment, useState, useEffect, useRef } from 'react';
import { Dialog as HeadlessDialog, Transition } from '@headlessui/react';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { EscalationChain, EscalationStage, CreateEscalationChainRequest } from '@/types/escalation-chain';
import { DeliveryChannel } from '@/types/delivery-channel';
import { DeliveryMethod } from '@/types/delivery-method';
import { deliveryChannelsApi } from '@/app/api/delivery-channels';
import { deliveryMethodsApi } from '@/app/api/delivery-methods';
import { escalationChainsApi } from '@/app/api/escalation-chains';
import Select from '@/components/common/Select';
import { FormField, FormInput, FormTextArea } from '@/components/common/form';
import DeliveryChannelSelector, { DeliveryChannelSelectorRef } from './DeliveryChannelSelector';
import DeliveryMethodSelector, { DeliveryMethodSelectorRef } from './DeliveryMethodSelector';

const retryIntervalOptions = [
  { value: '300', label: 'Five Minutes' },
  { value: '600', label: 'Ten Minutes' },
  { value: '900', label: 'Fifteen Minutes' },
  { value: '1800', label: 'Thirty Minutes' },
  { value: '3600', label: 'One Hour' },
];

const waitDelayOptions = [
  { value: '0', label: 'No Delay' },
  { value: '300', label: 'Five Minutes' },
  { value: '600', label: 'Ten Minutes' },
  { value: '900', label: 'Fifteen Minutes' },
  { value: '1800', label: 'Thirty Minutes' },
  { value: '3600', label: 'One Hour' },
];

interface EscalationChainModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingChain?: EscalationChain | null;
  onSave: () => void;
}

const EscalationChainModal: React.FC<EscalationChainModalProps> = ({
  isOpen,
  onClose,
  editingChain,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [stages, setStages] = useState<Omit<EscalationStage, 'id' | 'createdAt' | 'updatedAt'>[]>([]);
  const [channels, setChannels] = useState<DeliveryChannel[]>([]);
  const [methods, setMethods] = useState<DeliveryMethod[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const channelSelectorRefs = useRef<(DeliveryChannelSelectorRef | null)[]>([]);
  const methodSelectorRefs = useRef<(DeliveryMethodSelectorRef | null)[]>([]);

  useEffect(() => {
    if (editingChain) {
      setName(editingChain.name);
      setDescription(editingChain.description || '');
      setStages(
        editingChain.stages.map(stage => ({
          name: stage.name || `Stage ${stage.stageOrder}`,
          stageOrder: stage.stageOrder,
          channelIds: stage.channelIds || [],
          methodIds: stage.methodIds || [],
          settings: {
            waitDuration: stage.settings.waitDuration || 300,
            maxAttempts: stage.settings.maxAttempts || 3,
            retryInterval: stage.settings.retryInterval || 60,
            timeRange: stage.settings.timeRange || null
          }
        }))
      );
    } else {
      setName('');
      setDescription('');
      setStages([]);
    }
  }, [editingChain]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fetchedChannels, fetchedMethods] = await Promise.all([
          deliveryChannelsApi.getAll(),
          deliveryMethodsApi.getAll()
        ]);
        setChannels(fetchedChannels);
        setMethods(fetchedMethods);
      } catch (err) {
        console.error('Failed to fetch delivery options:', err);
        setError('Failed to load delivery options');
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate required fields
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    if (stages.length === 0) {
      setError('Please add at least one stage');
      return;
    }

    // Validate each stage
    for (const stage of stages) {
      if ((!stage.channelIds || stage.channelIds.length === 0) && 
          (!stage.methodIds || stage.methodIds.length === 0)) {
        setError(`Please select at least one channel or method for stage ${stage.stageOrder}`);
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const chainData: CreateEscalationChainRequest = {
        name,
        description,
        type: 'staged' as const,
        stages: stages.map(stage => ({
          name: stage.name,
          stageOrder: stage.stageOrder,
          channelIds: stage.channelIds,
          methodIds: stage.methodIds,
          settings: stage.settings
        }))
      };

      if (editingChain?.id) {
        await escalationChainsApi.update(editingChain.id, chainData);
      } else {
        await escalationChainsApi.create(chainData);
      }
      onSave();
      onClose();
    } catch (err) {
      console.error('Failed to save chain:', err);
      setError('Failed to save escalation chain');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addStage = () => {
    const newStageOrder = stages.length + 1;
    setStages([
      ...stages,
      {
        name: `Stage ${newStageOrder}`,
        stageOrder: newStageOrder,
        channelIds: [],
        methodIds: [],
        settings: {
          waitDuration: 0,
          maxAttempts: 3,
          retryInterval: 300,
          timeRange: null
        }
      }
    ]);
  };

  const removeStage = (index: number) => {
    setStages(stages.filter((_, i) => i !== index));
  };

  const updateStage = (index: number, field: keyof Omit<EscalationStage, 'id' | 'createdAt' | 'updatedAt'>, value: any) => {
    const newStages = [...stages];
    newStages[index] = {
      ...newStages[index],
      [field]: value
    };
    setStages(newStages);
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <HeadlessDialog as="div" className="relative z-40" onClose={() => {}}>
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

        <div className="fixed inset-0 z-40 overflow-y-auto">
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

                <div className="sm:flex sm:items-start">
                  <div className="mt-3 w-full text-center sm:mt-0 sm:text-left">
                    <HeadlessDialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                      {editingChain ? 'Edit Escalation Chain' : 'Create Escalation Chain'}
                    </HeadlessDialog.Title>

                    <form onSubmit={handleSubmit}>
                      <div className="mt-6 space-y-6">
                        {/* Name */}
                        <FormField label="Name" htmlFor="name">
                          <FormInput
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter chain name"
                            required
                          />
                        </FormField>

                        {/* Stages */}
                        <div>
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium leading-6 text-gray-900">Stages</h4>
                            <button
                              type="button"
                              onClick={addStage}
                              className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-500"
                            >
                              <PlusIcon className="h-4 w-4 mr-1" />
                              Add Stage
                            </button>
                          </div>

                          <div className="mt-4 space-y-4">
                            {stages.length === 0 ? (
                              <div className="text-center py-6 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-500">No escalation stage created yet</p>
                                <button
                                  type="button"
                                  onClick={addStage}
                                  className="mt-2 inline-flex items-center text-sm text-indigo-600 hover:text-indigo-500"
                                >
                                  <PlusIcon className="h-4 w-4 mr-1" />
                                  Add your first stage
                                </button>
                                {error && (
                                  <p className="mt-2 text-sm text-red-600">{error}</p>
                                )}
                              </div>
                            ) : (
                              stages.map((stage, index) => (
                                <div key={index} className="flex items-start gap-4 rounded-lg border border-gray-200 p-4">
                                  <div className="flex-1 space-y-4">
                                    {/* Stage Settings */}
                                    <div className="grid grid-cols-3 gap-4">
                                      {/* Wait Duration */}
                                      <FormField label="Stage Delay">
                                        <Select<string>
                                          value={stage.settings.waitDuration.toString()}
                                          onChange={(value) => {
                                            updateStage(index, 'settings', {
                                              ...stage.settings,
                                              waitDuration: parseInt(value) || 0
                                            });
                                          }}
                                          options={waitDelayOptions}
                                          placeholder="Select a delay interval"
                                          className="block w-full"
                                        />
                                      </FormField>

                                      {/* Max Retries */}
                                      <FormField label="Max Retries">
                                        <FormInput
                                          type="number"
                                          min="1"
                                          value={stage.settings.maxAttempts}
                                          onChange={(e) => {
                                            const value = parseInt(e.target.value) || 1;
                                            updateStage(index, 'settings', {
                                              ...stage.settings,
                                              maxAttempts: value
                                            });
                                          }}
                                        />
                                      </FormField>

                                      {/* Retry Interval */}
                                      <FormField label="Retry Interval">
                                        <Select<string>
                                          value={stage.settings.retryInterval.toString()}
                                          onChange={(value) => {
                                            updateStage(index, 'settings', {
                                              ...stage.settings,
                                              retryInterval: parseInt(value) || 0
                                            });
                                          }}
                                          options={retryIntervalOptions}
                                          placeholder="Select a retry interval"
                                          className="block w-full"
                                        />
                                      </FormField>
                                    </div>
                                    {/* Delivery Options */}
                                    <div className="space-y-4">
                                      {/* Channels */}
                                      <FormField 
                                        label={
                                          <div className="flex items-center justify-between">
                                            <span>Delivery Channels</span>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                channelSelectorRefs.current[index]?.openDialog();
                                              }}
                                              className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-500"
                                            >
                                              <PlusIcon className="h-4 w-4 mr-1" />
                                              Add Channel
                                            </button>
                                          </div>
                                        }
                                      >
                                        <DeliveryChannelSelector
                                          ref={el => channelSelectorRefs.current[index] = el}
                                          value={channels.filter(c => stage.channelIds.includes(String(c.id)))}
                                          onChange={(selectedChannels) => {
                                            const updatedStage = {
                                              ...stage,
                                              channelIds: selectedChannels.map(c => String(c.id))
                                            };
                                            const newStages = [...stages];
                                            newStages[index] = updatedStage;
                                            setStages(newStages);
                                          }}
                                          hideAddButton
                                        />
                                      </FormField>

                                      {/* Methods */}
                                      <FormField 
                                        label={
                                          <div className="flex items-center justify-between">
                                            <span>Delivery Methods</span>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                methodSelectorRefs.current[index]?.openDialog();
                                              }}
                                              className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-500"
                                            >
                                              <PlusIcon className="h-4 w-4 mr-1" />
                                              Add Method
                                            </button>
                                          </div>
                                        }
                                      >
                                        <DeliveryMethodSelector
                                          ref={el => methodSelectorRefs.current[index] = el}
                                          value={methods.filter(m => stage.methodIds.includes(m.id))}
                                          onChange={(selectedMethods) => {
                                            const updatedStage = {
                                              ...stage,
                                              methodIds: selectedMethods.map(m => m.id)
                                            };
                                            const newStages = [...stages];
                                            newStages[index] = updatedStage;
                                            setStages(newStages);
                                          }}
                                          hideAddButton
                                        />
                                      </FormField>
                                    </div>
                                    {/* Show stage-specific error */}
                                    {error && error.includes(`stage ${stage.stageOrder}`) && (
                                      <div className="mt-2">
                                        <p className="text-sm text-red-600">{error}</p>
                                      </div>
                                    )}
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => removeStage(index)}
                                    className="text-gray-400 hover:text-gray-500"
                                  >
                                    <TrashIcon className="h-5 w-5" />
                                  </button>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        {/* Description */}
                        <FormField label="Description" htmlFor="description">
                          <FormTextArea
                            id="description"
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Enter a description for this escalation chain"
                          />
                        </FormField>

                        {/* Submit and Cancel Buttons */}
                        <div className="mt-8 flex flex-row-reverse space-x-3 space-x-reverse">
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex w-auto justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
                          >
                            {isSubmitting ? 'Saving...' : editingChain ? 'Update' : 'Create'}
                          </button>
                          <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex w-auto justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </HeadlessDialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </HeadlessDialog>
    </Transition.Root>
  );
};

export default EscalationChainModal;
