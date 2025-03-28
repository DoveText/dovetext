'use client';

import { useState, useEffect, Fragment, forwardRef, useImperativeHandle } from 'react';
import { DeliveryChannel } from '@/types/delivery-channel';
import { deliveryChannelsApi } from '@/app/api/delivery-channels';
import { Dialog, Transition } from '@headlessui/react';
import { 
  PlusIcon, 
  XMarkIcon, 
  TrashIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { channelIcons, getChannelTypeDescription } from './DeliveryChannelList';

// Helper function to get descriptive text for delivery channel
function getChannelDescription(channel: DeliveryChannel): string {
  let description = '';
  if (channel.description) {
    description = channel.description;
  }
  if (channel.type === 'TIME_BASED' && channel.slots && channel.slots.length > 0) {
    const slotCount = channel.slots.length;
    if (description) {
      description += ` (${slotCount} time slot${slotCount > 1 ? 's' : ''})`;
    } else {
      description = `${slotCount} time slot${slotCount > 1 ? 's' : ''}`;
    }
  }
  return description || 'No description';
}

// Truncate text with tooltip
function TruncatedText({ text, className = '' }: { text: string; className?: string }) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div 
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className={`truncate ${className}`}>
        {text}
      </div>
      {showTooltip && text.length > 40 && (
        <div className="absolute z-10 px-2 py-1 text-sm text-white bg-gray-900 rounded shadow-lg -mt-1 transform -translate-y-full max-w-xs">
          {text}
        </div>
      )}
    </div>
  );
}

// Channel Card Component
function ChannelCard({ channel, onRemove, onClick, className = '', isButton = false }: { 
  channel: DeliveryChannel; 
  onRemove?: () => void;
  onClick?: () => void;
  className?: string;
  isButton?: boolean;
}) {
  const Component = isButton ? 'button' : 'div';
  const description = getChannelDescription(channel);
  const Icon = channelIcons[channel.type];
  const [showTooltip, setShowTooltip] = useState(false);

  // Different styles for dialog vs selected list
  const containerStyles = isButton
    ? 'p-4 hover:bg-gray-50'  // More padding for dialog items
    : 'p-2';  // Compact for selected list

  const iconStyles = isButton
    ? 'h-6 w-6'  // Larger icons in dialog
    : 'h-5 w-5';  // Smaller icons in selected list

  const nameStyles = isButton
    ? 'text-base'  // Larger text in dialog
    : 'text-sm';   // Smaller text in selected list

  const descriptionStyles = isButton
    ? 'text-sm text-gray-500'  // Larger text in dialog
    : 'text-xs text-gray-500';  // Compact in selected list

  return (
    <Component
      onClick={onClick}
      className={`flex items-start space-x-3 bg-white rounded-lg border border-gray-200 ${isButton ? 'w-full text-left hover:bg-gray-50' : ''} ${containerStyles} ${className}`}
      {...(isButton ? { type: 'button' } : {})}
    >
      <div className="flex-shrink-0">
        <Icon className={`${iconStyles} text-gray-400`} aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-col">
          <div className="flex items-baseline">
            <span className={`${nameStyles} font-medium text-gray-900`}>{channel.name}</span>
            <span className={`${descriptionStyles} ml-1`}>({getChannelTypeDescription(channel.type)})</span>
          </div>
          {description ? (
            <div 
              className="relative mt-0.5"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              <p className={`${descriptionStyles} truncate max-w-[300px]`}>
                {description}
              </p>
              {showTooltip && description.length > 50 && (
                <div className="absolute z-10 px-2 py-1 text-sm text-white bg-gray-900 rounded shadow-lg -mt-1 transform -translate-y-full max-w-xs">
                  {description}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center mt-0.5 text-gray-400">
              <InformationCircleIcon className="h-4 w-4 mr-1" />
              <span className={`${descriptionStyles} italic`}>
                No description available
              </span>
            </div>
          )}
        </div>
      </div>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-500"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      )}
    </Component>
  );
}

export interface DeliveryChannelSelectorRef {
  openDialog: () => void;
}

export interface DeliveryChannelSelectorProps {
  value: DeliveryChannel[];
  onChange: (value: DeliveryChannel[]) => void;
  className?: string;
  hideAddButton?: boolean;
}

const DeliveryChannelSelector = forwardRef<DeliveryChannelSelectorRef, DeliveryChannelSelectorProps>(function DeliveryChannelSelector({
  value = [],
  onChange,
  className = '',
  hideAddButton = false,
}, ref) {
  const [isOpen, setIsOpen] = useState(false);
  const [channels, setChannels] = useState<DeliveryChannel[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Expose the openDialog method via ref
  useImperativeHandle(ref, () => ({
    openDialog: () => setIsOpen(true)
  }), []);

  useEffect(() => {
    async function fetchChannels() {
      try {
        const fetchedChannels = await deliveryChannelsApi.getAll();
        setChannels(fetchedChannels);
      } catch (err) {
        console.error('Failed to fetch channels:', err);
        setError('Failed to load channels');
      }
    }

    fetchChannels();
  }, []);

  const handleAdd = (channelId: string) => {
    const channel = channels.find(m => m.id === channelId);
    if (channel && !value.some(m => m.id === channelId)) {
      onChange([...value, channel]);
    }
    setIsOpen(false);
  };

  const handleRemove = (channelId: string) => {
    onChange(value.filter(m => m.id !== channelId));
  };

  // Filter out already selected channels
  const availableChannels = channels.filter(channel => !value.some(m => m.id === channel.id));

  return (
    <div className={className}>
      {/* Selected Channels */}
      <div className="space-y-2">
        {value.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-4">
            <p className="text-sm text-gray-500 text-center text-italic">No delivery channel is selected</p>
          </div>
        ) : (
          value.map((channel) => (
            <ChannelCard
              key={channel.id}
              channel={channel}
              onRemove={() => handleRemove(channel.id)}
            />
          ))
        )}
      </div>

      {/* Add Button */}
      {!hideAddButton && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="mt-2 inline-flex items-center text-sm text-indigo-600 hover:text-indigo-500"
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          Add Channel
        </button>
      )}

      {/* Channel Selection Dialog */}
      <Transition.Root show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={setIsOpen}>
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

          <div className="fixed inset-0 z-50 overflow-y-auto">
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
                      className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      onClick={() => setIsOpen(false)}
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>

                  <div>
                    <div className="mt-3 sm:mt-5">
                      <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                        Add Channel
                      </Dialog.Title>

                      <div className="mt-4">
                        {error ? (
                          <div className="rounded-md bg-red-50 p-4">
                            <div className="flex">
                              <div className="flex-shrink-0">
                                <InformationCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                              </div>
                              <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">{error}</h3>
                              </div>
                            </div>
                          </div>
                        ) : availableChannels.length === 0 ? (
                          <p className="text-sm text-gray-500">No available channels to add.</p>
                        ) : (
                          <div className="space-y-2">
                            {availableChannels.map((channel) => (
                              <ChannelCard
                                key={channel.id}
                                channel={channel}
                                onClick={() => handleAdd(channel.id)}
                                isButton
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </div>
  );
});

DeliveryChannelSelector.displayName = 'DeliveryChannelSelector';

export default DeliveryChannelSelector;
