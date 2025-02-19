'use client';

import { useState, useEffect, Fragment, forwardRef, useImperativeHandle } from 'react';
import { DeliveryMethod, DeliveryMethodType } from '@/types/delivery-method';
import { deliveryMethodsApi } from '@/api/delivery-methods';
import { Dialog, Transition } from '@headlessui/react';
import { 
  PlusIcon, 
  XMarkIcon, 
  TrashIcon,
  DevicePhoneMobileIcon,
  EnvelopeIcon,
  BellAlertIcon,
  GlobeAltIcon,
  PuzzlePieceIcon,
  ChatBubbleLeftRightIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

// Helper function to get icon for delivery method type
function getMethodIcon(type: DeliveryMethodType) {
  switch (type) {
    case 'DOVEAPP':
      return BellAlertIcon;
    case 'EMAIL':
      return EnvelopeIcon;
    case 'TEXT':
      return ChatBubbleLeftRightIcon;
    case 'VOICE':
      return DevicePhoneMobileIcon;
    case 'WEBHOOK':
      return GlobeAltIcon;
    case 'PLUGIN':
      return PuzzlePieceIcon;
    default:
      return BellAlertIcon;
  }
}

// Helper function to get descriptive text for delivery method
function getMethodDescription(method: DeliveryMethod): string {
  switch (method.type) {
    case 'DOVEAPP':
      return 'Deliver using DoveApp';
    case 'EMAIL':
      return `Deliver via email${method.config.email ? ` to ${method.config.email}` : ''}`;
    case 'TEXT':
      return `Deliver via SMS${method.config.phone ? ` to ${method.config.phone.phoneNumber}` : ''}`;
    case 'VOICE':
      return `Deliver via voice call${method.config.phone ? ` to ${method.config.phone.phoneNumber}` : ''}`;
    case 'WEBHOOK':
      return 'Deliver via webhook';
    case 'PLUGIN':
      if (method.config.plugin) {
        switch (method.config.plugin.type) {
          case 'SLACK':
            return `Deliver to Slack${method.config.plugin.slackChannel ? ` channel ${method.config.plugin.slackChannel}` : ''}`;
          case 'TELEGRAM':
            return 'Deliver via Telegram';
          case 'CUSTOM_WEBHOOK':
            return 'Deliver via custom webhook';
          default:
            return 'Deliver via plugin';
        }
      }
      return 'Deliver via plugin';
    default:
      return 'Deliver notification';
  }
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

// Method Card Component
function MethodCard({ method, onRemove, onClick, className = '', isButton = false }: { 
  method: DeliveryMethod; 
  onRemove?: () => void;
  onClick?: () => void;
  className?: string;
  isButton?: boolean;
}) {
  const Icon = getMethodIcon(method.type);
  const Component = isButton ? 'button' : 'div';
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
      className={`flex items-start space-x-3 bg-white rounded-lg border border-gray-200 ${isButton ? 'w-full text-left hover:bg-gray-50' : ''} ${containerStyles} ${className}`}
      onClick={onClick}
      {...(isButton ? { type: 'button' } : {})}
    >
      <div className="flex-shrink-0">
        <Icon className={`${iconStyles} text-gray-400`} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-col">
          <div className="flex items-baseline">
            <span className={`${nameStyles} font-medium text-gray-900`}>{method.name}</span>
            <span className={`${descriptionStyles} ml-1`}>{getMethodDescription(method)}</span>
          </div>
          {method.description ? (
            <div 
              className="relative mt-0.5"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              <p className={`${descriptionStyles} truncate max-w-[300px]`}>
                {method.description}
              </p>
              {showTooltip && method.description.length > 50 && (
                <div className="absolute z-10 px-2 py-1 text-sm text-white bg-gray-900 rounded shadow-lg -mt-1 transform -translate-y-full max-w-xs">
                  {method.description}
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

export interface DeliveryMethodSelectorRef {
  openDialog: () => void;
}

interface DeliveryMethodSelectorProps {
  value: DeliveryMethod[];
  onChange: (value: DeliveryMethod[]) => void;
  className?: string;
  hideAddButton?: boolean;
}

const DeliveryMethodSelector = forwardRef<DeliveryMethodSelectorRef, DeliveryMethodSelectorProps>(function DeliveryMethodSelector({
  value = [],
  onChange,
  className = '',
  hideAddButton = false,
}, ref) {
  const [isOpen, setIsOpen] = useState(false);
  const [methods, setMethods] = useState<DeliveryMethod[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Expose the openDialog method via ref
  useImperativeHandle(ref, () => ({
    openDialog: () => setIsOpen(true)
  }), []);

  useEffect(() => {
    const fetchMethods = async () => {
      try {
        const response = await deliveryMethodsApi.getAll();
        setMethods(response);
      } catch (error) {
        console.error('Failed to fetch delivery methods:', error);
      }
    };

    fetchMethods();
  }, []);

  const handleAdd = (methodId: string) => {
    const method = methods.find(m => m.id === methodId);
    if (method) {
      onChange([...value, method]);
      setIsOpen(false);
    }
  };

  const handleRemove = (methodId: string) => {
    onChange(value.filter(method => method.id !== methodId));
  };

  // Filter out already selected methods
  const availableMethods = methods.filter(method => !value.some(m => m.id === method.id));

  return (
    <div className={className}>
      {/* Selected Methods List */}
      <div className="space-y-2">
        {value.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-4">
            <p className="text-sm text-gray-500 text-center text-italic">No delivery method is selected</p>
          </div>
        ) : (
          value.map((method) => (
            <MethodCard
              key={method.id}
              method={method}
              onRemove={() => handleRemove(method.id)}
            />
          ))
        )}
      </div>

      {/* Add Button */}
      {!hideAddButton && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          disabled={availableMethods.length === 0}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Delivery Method
        </button>
      )}

      {/* Method Selection Dialog */}
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
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <Dialog.Title as="h3" className="text-lg font-medium text-gray-900">
                      Select Delivery Method
                    </Dialog.Title>
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="mt-4 space-y-2">
                    {availableMethods.length === 0 ? (
                      <p className="text-sm text-gray-500">No more delivery methods available.</p>
                    ) : (
                      availableMethods.map((method) => (
                        <MethodCard
                          key={method.id}
                          method={method}
                          isButton
                          onClick={() => handleAdd(method.id)}
                        />
                      ))
                    )}
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

export default DeliveryMethodSelector;
