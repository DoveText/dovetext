import { Fragment, useState, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import { 
  DeliveryChannel, 
  DeliveryChannelType, 
  DeliveryChannelSlot,
  createSimpleChannelSlot,
  createFallbackSlot,
} from '@/types/delivery-channel';
import { deliveryChannelsApi } from '@/api/delivery-channels';
import Select from '@/components/common/Select';
import { FormField, FormInput, FormTextArea } from '@/components/common/form';
import DeliveryMethodSelector from './DeliveryMethodSelector';
import TimeRangeSelector from '@/components/common/TimeRangeSelector';

interface DeliveryChannelModalProps {
  channel?: DeliveryChannel | null;
  onClose: () => void;
  onSave: () => void;
}

const channelTypeOptions = [
  { value: 'SIMPLE' as DeliveryChannelType, label: 'Simple' },
  { value: 'TIME_BASED' as DeliveryChannelType, label: 'Time-based' },
];

export default function DeliveryChannelModal({
  channel,
  onClose,
  onSave,
}: DeliveryChannelModalProps) {
  const [name, setName] = useState(channel?.name || '');
  const [type, setType] = useState<DeliveryChannelType>(channel?.type || 'SIMPLE');
  const [description, setDescription] = useState(channel?.description || '');
  const [settings, setSettings] = useState(channel?.settings || '{}');
  const [slots, setSlots] = useState<DeliveryChannelSlot[]>(
    channel?.slots || [type === 'SIMPLE' ? createSimpleChannelSlot() : createFallbackSlot()]
  );
  const [error, setError] = useState<string | null>(null);

  const methodSelectorRef = useRef<DeliveryMethodSelectorRef>(null);

  const handleTypeChange = (newType: DeliveryChannelType) => {
    setType(newType);
    // Reset slots when changing type
    if (newType === 'SIMPLE') {
      setSlots([createSimpleChannelSlot()]);
    } else {
      setSlots([createFallbackSlot()]);
    }
  };

  const handleSlotMethodsChange = (slotIndex: number, methodIds: number[]) => {
    setSlots(currentSlots => 
      currentSlots.map((slot, index) => 
        index === slotIndex ? { ...slot, methodIds } : slot
      )
    );
  };

  const handleSlotTimeRangeChange = (slotIndex: number, timeslot: any) => {
    setSlots(currentSlots => 
      currentSlots.map((slot, index) => 
        index === slotIndex ? { ...slot, timeslot } : slot
      )
    );
  };

  const addNewTimeSlot = () => {
    setSlots(currentSlots => [...currentSlots, createSimpleChannelSlot()]);
  };

  const removeTimeSlot = (index: number) => {
    if (index === 0 && type === 'TIME_BASED') {
      // Don't remove fallback slot
      return;
    }
    setSlots(currentSlots => currentSlots.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      // Validate settings JSON
      JSON.parse(settings);

      const data = {
        name,
        type,
        description,
        settings,
        slots: slots.map(({ id, channelId, ...slot }) => slot), // Remove id and channelId for API
      };

      if (channel) {
        await deliveryChannelsApi.update(channel.id, data);
      } else {
        await deliveryChannelsApi.create(data);
      }
      onSave();
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError('Invalid JSON format in settings');
      } else {
        setError('Failed to save channel');
        console.error(err);
      }
    }
  };

  const handleTimeSlotChange = (index: number, slot: any) => {
    setSlots(currentSlots => 
      currentSlots.map((s, i) => 
        i === index ? slot : s
      )
    );
  };

  const handleRemoveTimeSlot = (index: number) => {
    setSlots(currentSlots => currentSlots.filter((_, i) => i !== index));
  };

  const handleAddMethod = () => {
    methodSelectorRef.current?.openDialog();
  };

  return (
    <Transition.Root show={true} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={() => {}}>
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
                        {channel ? 'Edit Channel' : 'Add Channel'}
                      </Dialog.Title>

                      <div className="mt-4 space-y-6">
                        <FormField label="Name" htmlFor="name">
                          <FormInput
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter a name for this channel"
                            required
                          />
                        </FormField>

                        <FormField label="Type" htmlFor="type">
                          <Select
                            id="type"
                            value={type}
                            onChange={handleTypeChange}
                            options={channelTypeOptions}
                            disabled={!!channel} // Disable type change for existing channels
                          />
                        </FormField>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-900">
                              {type === 'SIMPLE' ? 'Delivery Methods' : 'Time Slots'}
                            </h4>
                            {type === 'TIME_BASED' && (
                              <button
                                type="button"
                                onClick={addNewTimeSlot}
                                className="text-sm text-indigo-600 hover:text-indigo-500"
                              >
                                Add Time Slot
                              </button>
                            )}
                            {type === 'SIMPLE' && (
                              <button
                                type="button"
                                onClick={() => methodSelectorRef.current?.openDialog()}
                                className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-500"
                              >
                                <PlusIcon className="h-4 w-4 mr-1" />
                                Add Method
                              </button>
                            )}
                          </div>

                          {type === 'TIME_BASED' && (
                            <div className="space-y-4">
                              {slots.slice(1).map((slot, index) => (
                                <div key={index + 1} className="rounded-lg border border-gray-200 p-4">
                                  <TimeRangeSelector
                                    value={slot.timeRange}
                                    onChange={(timeRange) =>
                                      handleTimeSlotChange(index + 1, {
                                        ...slot,
                                        timeRange,
                                      })
                                    }
                                    name={`Time Slot ${index + 1}`}
                                    onNameChange={(name) => {
                                      // Handle name change if needed
                                    }}
                                    onDelete={() => handleRemoveTimeSlot(index + 1)}
                                  />
                                  <div className="mt-4">
                                    <DeliveryMethodSelector
                                      value={slot.deliveryMethods}
                                      onChange={(deliveryMethods) =>
                                        handleTimeSlotChange(index + 1, {
                                          ...slot,
                                          deliveryMethods,
                                        })
                                      }
                                    />
                                  </div>
                                </div>
                              ))}
                              
                              {/* Fallback Time Slot */}
                              <div className="rounded-lg border border-gray-200 p-4">
                                <div className="flex items-center justify-between mb-4">
                                  <h5 className="text-sm font-medium text-gray-900">
                                    Fallback Time Slot
                                  </h5>
                                </div>
                                <div className="mt-4">
                                  <DeliveryMethodSelector
                                    value={slots[0].deliveryMethods}
                                    onChange={(deliveryMethods) =>
                                      handleTimeSlotChange(0, {
                                        ...slots[0],
                                        deliveryMethods,
                                      })
                                    }
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                          {type === 'SIMPLE' && (
                            slots.map((slot, index) => (
                              <div key={index} className="rounded-lg border border-gray-200 p-4">
                                <DeliveryMethodSelector
                                  ref={methodSelectorRef}
                                  value={slot.deliveryMethods}
                                  onChange={(deliveryMethods) =>
                                    handleTimeSlotChange(index, {
                                      ...slot,
                                      deliveryMethods,
                                    })
                                  }
                                  hideAddButton={true}
                                />
                              </div>
                            ))
                          )}
                        </div>

                        <FormField label="Description" htmlFor="description">
                          <FormTextArea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            placeholder="Enter a description for this channel"
                          />
                        </FormField>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-end gap-x-6">
                    <button
                      type="button"
                      onClick={onClose}
                      className="text-sm font-semibold leading-6 text-gray-900"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="inline-flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                      {channel ? 'Update' : 'Create'}
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
