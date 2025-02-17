'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog as HeadlessDialog, Transition } from '@headlessui/react';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { EscalationChain, EscalationStage } from '@/types/escalation-chain';
import { DeliveryMethod } from '@/types/delivery-method';
import { deliveryMethodsApi } from '@/api/delivery-methods';
import { escalationChainsApi } from '@/api/escalation-chains';
import Select from '@/components/common/Select';
import EditableSelect from '@/components/common/EditableSelect';

interface EscalationChainModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingChain?: EscalationChain | null;
  onSubmit: () => void;
}

const retryIntervalOptions = [
  { value: '0', label: 'No Retry' },
  { value: '60', label: 'One Minute' },
  { value: '300', label: 'Five Minutes' },
  { value: '900', label: 'Fifteen Minutes' },
  { value: '3600', label: 'One Hour' },
];

const timeOptions = [
  { value: '0', label: 'No Delay' },
  { value: '60', label: 'One Minute' },
  { value: '300', label: 'Five Minutes' },
  { value: '900', label: 'Fifteen Minutes' },
  { value: '3600', label: 'One Hour' },
];

const EscalationChainModal: React.FC<EscalationChainModalProps> = ({
  isOpen,
  onClose,
  editingChain,
  onSubmit,
}) => {
  const [name, setName] = useState(editingChain?.name || '');
  const [description, setDescription] = useState(editingChain?.description || '');
  const [stages, setStages] = useState<Omit<EscalationStage, 'id' | 'createdAt' | 'updatedAt'>[]>(
    editingChain?.stages ? editingChain.stages.map(stage => ({
      name: `Stage ${stage.stageOrder}`,
      stageOrder: stage.stageOrder,
      waitDurationSeconds: stage.waitDurationSeconds,
      maxAttempts: stage.maxAttempts || 1,
      retryIntervalSeconds: stage.retryIntervalSeconds,
      deliveryMethods: stage.deliveryMethods.map(dm => ({
        methodId: dm.methodId
      }))
    })) : []
  );
  const [deliveryMethods, setDeliveryMethods] = useState<DeliveryMethod[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingChain) {
      setName(editingChain.name);
      setDescription(editingChain.description || '');
      setStages(editingChain.stages ? editingChain.stages.map(stage => ({
        name: `Stage ${stage.stageOrder}`,
        stageOrder: stage.stageOrder,
        waitDurationSeconds: stage.waitDurationSeconds,
        maxAttempts: stage.maxAttempts || 1,
        retryIntervalSeconds: stage.retryIntervalSeconds,
        deliveryMethods: stage.deliveryMethods.map(dm => ({
          methodId: dm.methodId
        }))
      })) : []);
    } else {
      setName('');
      setDescription('');
      setStages([]);
    }
  }, [editingChain]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const methods = await deliveryMethodsApi.getAll();
        setDeliveryMethods(methods);
      } catch (err) {
        console.error('Failed to fetch delivery methods:', err);
        setError('Failed to load delivery methods');
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    // Format stages for API
    const formattedStages = stages.map(stage => ({
      ...stage,
      // Convert seconds to Duration format expected by backend
      waitDurationSeconds: stage.waitDurationSeconds,
      retryIntervalSeconds: stage.retryIntervalSeconds
    }));

    try {
      if (editingChain) {
        await escalationChainsApi.update(editingChain.id, {
          name,
          description,
          stages: formattedStages
        });
      } else {
        await escalationChainsApi.create({
          name,
          description,
          stages: formattedStages
        });
      }
      onSubmit();
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
        waitDurationSeconds: 0,
        maxAttempts: 1,
        retryIntervalSeconds: 0,
        deliveryMethods: []
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
      <HeadlessDialog as="div" className="relative z-50" onClose={onClose}>
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

                <div className="sm:flex sm:items-start">
                  <div className="mt-3 w-full text-center sm:mt-0 sm:text-left">
                    <HeadlessDialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                      {editingChain ? 'Edit Escalation Chain' : 'Create Escalation Chain'}
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
                            placeholder="Enter chain name"
                          />
                        </div>
                      </div>

                      {/* Stages */}
                      <div>
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium leading-6 text-gray-900">Stages</h4>
                          <button
                            type="button"
                            onClick={addStage}
                            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                          >
                            <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                            Add Stage
                          </button>
                        </div>

                        <div className="mt-4 space-y-4">
                          {stages.map((stage, index) => (
                            <div key={index} className="flex items-start gap-4 rounded-lg border border-gray-200 p-4">
                              <div className="flex-1 space-y-4">
                                {/* Method */}
                                <div>
                                  <label className="block text-sm font-medium leading-6 text-gray-900">
                                    Delivery Method
                                  </label>
                                  <div className="mt-2">
                                    <Select<string>
                                      value={stage.deliveryMethods[0]?.methodId || ''}
                                      onChange={(value) => {
                                        const updatedStage = {
                                          ...stage,
                                          deliveryMethods: [{ methodId: value }]
                                        };
                                        const newStages = [...stages];
                                        newStages[index] = updatedStage;
                                        setStages(newStages);
                                      }}
                                      options={deliveryMethods.map((method) => ({
                                        value: method.id,
                                        label: method.name,
                                      }))}
                                      placeholder="Select a delivery method"
                                      className="block w-full"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                  {/* Wait Duration */}
                                  <div>
                                    <label className="block text-sm font-medium leading-6 text-gray-900">
                                      Wait Duration (seconds)
                                    </label>
                                    <div className="mt-2">
                                      <input
                                        type="number"
                                        min="0"
                                        value={stage.waitDurationSeconds}
                                        onChange={(e) => {
                                          const value = parseInt(e.target.value) || 0;
                                          updateStage(index, 'waitDurationSeconds', value);
                                        }}
                                        className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                        placeholder="Duration in seconds"
                                      />
                                    </div>
                                  </div>

                                  {/* Max Attempts */}
                                  <div>
                                    <label className="block text-sm font-medium leading-6 text-gray-900">
                                      Max Attempts
                                    </label>
                                    <div className="mt-2">
                                      <input
                                        type="number"
                                        min="1"
                                        value={stage.maxAttempts}
                                        onChange={(e) => {
                                          const value = parseInt(e.target.value) || 1;
                                          updateStage(index, 'maxAttempts', value);
                                        }}
                                        className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                      />
                                    </div>
                                  </div>

                                  {/* Retry Interval */}
                                  <div>
                                    <label className="block text-sm font-medium leading-6 text-gray-900">
                                      Retry Interval (seconds)
                                    </label>
                                    <div className="mt-2">
                                      <input
                                        type="number"
                                        min="0"
                                        value={stage.retryIntervalSeconds}
                                        onChange={(e) => {
                                          const value = parseInt(e.target.value) || 0;
                                          updateStage(index, 'retryIntervalSeconds', value);
                                        }}
                                        className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                        placeholder="Interval in seconds"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => removeStage(index)}
                                className="rounded-md bg-white p-2 text-gray-400 hover:text-gray-500"
                              >
                                <span className="sr-only">Remove stage</span>
                                <TrashIcon className="h-5 w-5" aria-hidden="true" />
                              </button>
                            </div>
                          ))}

                          {stages.length === 0 && (
                            <p className="text-sm text-gray-500 text-center py-4">
                              No stages added yet. Click "Add Stage" to create your first escalation stage.
                            </p>
                          )}
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
                            placeholder="Enter a description for this escalation chain"
                          />
                        </div>
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
                    {isSubmitting ? 'Saving...' : editingChain ? 'Save Changes' : 'Create Chain'}
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
};

export default EscalationChainModal;
