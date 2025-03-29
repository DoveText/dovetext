import { Fragment, useState, useRef, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import { 
  DeliveryChannel, 
  DeliveryChannelType, 
  DeliveryChannelSlot,
  createSimpleChannelSlot,
  createFallbackSlot,
} from '@/types/delivery-channel';
import { deliveryChannelsApi } from '@/app/api/delivery-channels';
import { deliveryMethodsApi } from '@/app/api/delivery-methods';
import Select from '@/components/common/Select';
import { FormField, FormInput, FormTextArea } from '@/components/common/form';
import DeliveryMethodSelector, { DeliveryMethodSelectorRef } from './DeliveryMethodSelector';
import TimeRangeSelector from '@/components/common/TimeRangeSelector';
import { TimeRange } from '@/types/time-range';
import { DeliveryMethod } from '@/types/delivery-method';

interface DeliveryChannelModalProps {
  channel?: DeliveryChannel | null;
  onClose: () => void;
  onSave: () => void;
}

// Extended interface for internal component use
interface ExtendedDeliveryChannelSlot extends DeliveryChannelSlot {
  deliveryMethods?: DeliveryMethod[];
  timeRange?: TimeRange;
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
  const [slots, setSlots] = useState<ExtendedDeliveryChannelSlot[]>(() => {
    const initialSlots = channel?.slots || [type === 'SIMPLE' ? createSimpleChannelSlot() : createFallbackSlot()];
    return initialSlots.map(slot => {
      // Parse timeslot if it's a string
      let timeRange;
      if (typeof slot.timeslot === 'string') {
        try {
          timeRange = JSON.parse(slot.timeslot);
        } catch (e) {
          console.error('Failed to parse timeslot:', e);
          timeRange = {
            daysOfWeek: [],
            startTime: "09:00",
            endTime: "17:00",
            timezone: ""
          };
        }
      } else {
        timeRange = slot.timeslot;
      }

      return {
        ...slot,
        deliveryMethods: [], // Will be populated by useEffect
        timeRange
      };
    });
  });
  const [error, setError] = useState<string | null>(null);
  const [slotErrors, setSlotErrors] = useState<{ [key: number]: string }>({});
  const [methodErrors, setMethodErrors] = useState<{ [key: number]: string }>({});
  const methodSelectorRefs = useRef<{ [key: number]: DeliveryMethodSelectorRef | null }>({});

  // Load methods for slots when editing
  useEffect(() => {
    if (channel?.slots) {
      const loadMethods = async () => {
        const updatedSlots = await Promise.all(
          slots.map(async (slot) => {
            if (slot.methodIds?.length) {
              const methods = await Promise.all(
                slot.methodIds.map(id => deliveryMethodsApi.getById(id.toString()))
              );
              return {
                ...slot,
                deliveryMethods: methods
              };
            }
            return slot;
          })
        );
        setSlots(updatedSlots);
      };

      loadMethods().catch(console.error);
    }
  }, [channel, slots]);

  const handleOpenDialog = (index: number) => {
    methodSelectorRefs.current[index]?.openDialog();
  };

  const handleTypeChange = (newType: DeliveryChannelType) => {
    setType(newType);
    // Reset slots when changing type
    if (newType === 'SIMPLE') {
      setSlots([createSimpleChannelSlot()]);
    } else {
      setSlots([createFallbackSlot()]);
    }
  };

  const handleTimeSlotChange = (index: number, timeRange: TimeRange) => {
    setSlots(currentSlots => 
      currentSlots.map((slot, i) => 
        i === index ? { ...slot, timeRange } : slot
      )
    );
  };

  const handleDeliveryMethodsChange = (index: number, deliveryMethods: DeliveryMethod[]) => {
    setSlots(currentSlots => {
      const newSlots = [...currentSlots];
      if (!newSlots[index]) {
        newSlots[index] = createFallbackSlot();
      }
      newSlots[index] = {
        ...newSlots[index],
        deliveryMethods
      };
      return newSlots;
    });
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

  const validateForm = () => {
    const newSlotErrors: { [key: number]: string } = {};
    const newMethodErrors: { [key: number]: string } = {};
    let isValid = true;

    // For simple type, validate method list
    if (type === 'SIMPLE') {
      if (!slots[0]?.deliveryMethods?.length) {
        newMethodErrors[0] = 'Please select at least one delivery method';
        isValid = false;
      }
    }
    
    // For time-based type
    if (type === 'TIME_BASED') {
      // Must have at least one non-fallback slot
      if (slots.length <= 1) {
        setError('Please create at least one time slot');
        isValid = false;
      }

      // Validate each slot
      slots.forEach((slot, index) => {
        // Skip fallback slot (index 0)
        if (index === 0) {
          if (!slot.deliveryMethods?.length) {
            newMethodErrors[index] = 'Please select at least one delivery method for fallback slot';
            isValid = false;
          }
          return;
        }

        // Validate delivery methods
        if (!slot.deliveryMethods?.length) {
          newMethodErrors[index] = 'Please select at least one delivery method';
          isValid = false;
        }

        // Validate time range
        if (slot.timeRange) {
          const isAnyTime = !slot.timeRange.startTime || !slot.timeRange.endTime;
          const isAllDays = !slot.timeRange.daysOfWeek?.length || slot.timeRange.daysOfWeek?.length === 7;
          const hasNoDays = !slot.timeRange.daysOfWeek?.length;

          // Cannot have both Any Time and All Days checked
          if (isAnyTime && isAllDays) {
            newSlotErrors[index] = 'You cannot select all days without specifying a time range in a day'
            isValid = false;
          }

          // If Any Time is not checked, validate start/end time
          if (!isAnyTime && slot.timeRange.startTime && slot.timeRange.endTime) {
            if (slot.timeRange.startTime >= slot.timeRange.endTime) {
              newSlotErrors[index] = 'Invalid time range in a day'
              isValid = false;
            }
          }

          // If All Days is not checked, must have at least one day selected
          if (!isAllDays && hasNoDays) {
            newSlotErrors[index] = 'Please select at least one day';
            isValid = false;
          }
        }
      });
    }

    setSlotErrors(newSlotErrors);
    setMethodErrors(newMethodErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSlotErrors({});
    setMethodErrors({});

    if (!validateForm()) {
      return;
    }

    try {
      // Validate settings JSON
      JSON.parse(settings);

      const data = {
        name,
        type,
        description,
        settings,
        slots: slots.map(({ id, channelId, deliveryMethods, timeRange, ...slot }) => ({
          ...slot,
          methodIds: deliveryMethods?.map(method => typeof method.id === 'string' ? parseInt(method.id, 10) : method.id) || [],
          timeslot: {
            daysOfWeek: timeRange?.daysOfWeek || [],
            startTime: timeRange?.startTime || null,
            endTime: timeRange?.endTime || null,
            timezone: timeRange?.timezone || 'Asia/Shanghai'
          },
          settings: slot.settings || '{}'
        }))
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

  useEffect(() => {
    if (slots.length === 0) {
      setSlots([type === 'SIMPLE' ? createSimpleChannelSlot() : createFallbackSlot()].map(slot => ({
        ...slot,
        deliveryMethods: []
      })));
    }
  }, [slots.length, type]);

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
                                onClick={() => handleOpenDialog(0)}
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
                                    value={slot.timeRange || {
                                      daysOfWeek: [],
                                      startTime: "09:00",
                                      endTime: "17:00",
                                      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                                    }}
                                    onChange={(timeRange) => handleTimeSlotChange(index + 1, timeRange)}
                                    name={`Time Slot ${index + 1}`}
                                    onNameChange={(name) => {
                                      // Handle name change if needed
                                    }}
                                    onDelete={() => removeTimeSlot(index + 1)}
                                  />
                                  {slotErrors[index + 1] && (
                                    <p className="mt-2 text-sm text-red-600">{slotErrors[index + 1]}</p>
                                  )}
                                  <div className="mt-4">
                                    <div className="flex items-center justify-between mb-4">
                                      <h5 className="text-sm font-medium text-gray-900">
                                        Delivery Methods
                                      </h5>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenDialog(index + 1)}
                                        className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-500"
                                      >
                                        <PlusIcon className="h-4 w-4 mr-1" />
                                        Add Method
                                      </button>
                                    </div>
                                    <DeliveryMethodSelector
                                      ref={(ref) => methodSelectorRefs.current[index + 1] = ref}
                                      value={slot.deliveryMethods || []}
                                      onChange={(deliveryMethods) => 
                                        handleDeliveryMethodsChange(index + 1, deliveryMethods)
                                      }
                                      hideAddButton={true}
                                    />
                                    {methodErrors[index + 1] && (
                                      <p className="mt-2 text-sm text-red-600">{methodErrors[index + 1]}</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                              
                              {/* Fallback Time Slot */}
                              <div className="rounded-lg border border-gray-200 p-4">
                                <div className="flex items-center justify-between mb-4">
                                  <h5 className="text-sm font-medium text-gray-900">
                                    Fallback Time Slot
                                  </h5>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenDialog(0)}
                                    className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-500"
                                  >
                                    <PlusIcon className="h-4 w-4 mr-1" />
                                    Add Method
                                  </button>
                                </div>
                                <div className="mt-4">
                                  <DeliveryMethodSelector
                                    ref={(ref) => methodSelectorRefs.current[0] = ref}
                                    value={slots[0]?.deliveryMethods || []}
                                    onChange={(deliveryMethods) =>
                                      handleDeliveryMethodsChange(0, deliveryMethods)
                                    }
                                    hideAddButton={true}
                                  />
                                  {methodErrors[0] && (
                                    <p className="mt-2 text-sm text-red-600">{methodErrors[0]}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                          {type === 'SIMPLE' && (
                            slots.map((slot, index) => (
                              <div key={index} className="rounded-lg border border-gray-200 p-4">
                                <DeliveryMethodSelector
                                  ref={(ref) => methodSelectorRefs.current[index] = ref}
                                  value={slot.deliveryMethods || []}
                                  onChange={(deliveryMethods) =>
                                    handleDeliveryMethodsChange(index, deliveryMethods)
                                  }
                                  hideAddButton={true}
                                />
                                {methodErrors[index] && (
                                  <p className="mt-2 text-sm text-red-600">{methodErrors[index]}</p>
                                )}
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
