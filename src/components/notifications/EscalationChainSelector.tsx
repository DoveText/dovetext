'use client';

import { useState, useEffect, Fragment, forwardRef, useImperativeHandle } from 'react';
import { EscalationChain } from '@/types/escalation-chain';
import { escalationChainsApi } from '@/app/api/escalation-chains';
import { Dialog, Transition } from '@headlessui/react';
import { 
  PlusIcon, 
  XMarkIcon, 
  TrashIcon,
  InformationCircleIcon,
  ChevronRightIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

// Helper function to get descriptive text for escalation chain
function getChainDescription(chain: EscalationChain): string {
  let description = '';
  if (chain.description) {
    description = chain.description;
  }

  return description || 'No description';
}

// Chain Card Component
function ChainCard({ 
  chain, 
  onRemove, 
  onClick, 
  className = '', 
  isButton = false 
}: { 
  chain: EscalationChain; 
  onRemove?: () => void;
  onClick?: () => void;
  className?: string;
  isButton?: boolean;
}) {
  const Component = isButton ? 'button' : 'div';
  const description = getChainDescription(chain);
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
        <ClockIcon className={`${iconStyles} text-gray-400`} aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-col">
          <div className="flex items-baseline">
            <span className={`${nameStyles} font-medium text-gray-900`}>{chain.name}</span>
            {chain.stages && chain.stages.length > 0 && (
              <span className={`${descriptionStyles} ml-1`}>
                (A chain with {chain.stages.length} stage{chain.stages.length !== 1 ? 's' : ''})
              </span>
            )}
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

export interface EscalationChainSelectorRef {
  openDialog: () => void;
}

export interface EscalationChainSelectorProps {
  value: EscalationChain[];
  onChange: (value: EscalationChain[]) => void;
  className?: string;
  hideAddButton?: boolean;
}

const EscalationChainSelector = forwardRef<EscalationChainSelectorRef, EscalationChainSelectorProps>(function EscalationChainSelector({
  value = [],
  onChange,
  className = '',
  hideAddButton = false,
}, ref) {
  const [chains, setChains] = useState<EscalationChain[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openDialog = () => setIsOpen(true);

  useImperativeHandle(ref, () => ({
    openDialog
  }), []);

  useEffect(() => {
    const fetchChains = async () => {
      try {
        const data = await escalationChainsApi.getAll();
        setChains(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch escalation chains:', err);
        setError('Failed to load escalation chains');
      }
    };

    fetchChains();
  }, []);

  const handleAdd = (chainId: string) => {
    const chain = chains.find(c => c.id === chainId);
    if (chain) {
      onChange([...value, chain]);
      setIsOpen(false);
    }
  };

  const handleRemove = (chainId: string) => {
    onChange(value.filter(chain => chain.id !== chainId));
  };

  // Filter out already selected chains
  const availableChains = chains.filter(chain => !value.some(c => c.id === chain.id));

  return (
    <div className={className}>
      <div className="space-y-2">
        {value.length > 0 ? (
          value.map((chain) => (
            <ChainCard
              key={chain.id}
              chain={chain}
              onRemove={() => handleRemove(chain.id)}
            />
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-gray-300 p-4">
            <p className="text-sm text-gray-500 text-center text-italic">No escalation chain is selected</p>
          </div>
        )}
      </div>

      {!hideAddButton && (
        <button
          type="button"
          onClick={openDialog}
          className="mt-2 inline-flex items-center text-sm text-indigo-600 hover:text-indigo-500"
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          Add Chain
        </button>
      )}

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setIsOpen(false)}>
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
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 flex justify-between items-center"
                  >
                    Select Escalation Chain
                    <button
                      type="button"
                      className="rounded-md text-gray-400 hover:text-gray-500"
                      onClick={() => setIsOpen(false)}
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </Dialog.Title>

                  {error && (
                    <div className="mt-2 rounded-md bg-red-50 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <InformationCircleIcon className="h-5 w-5 text-red-400" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800">{error}</h3>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 space-y-2">
                    {availableChains.map((chain) => (
                      <ChainCard
                        key={chain.id}
                        chain={chain}
                        onClick={() => handleAdd(chain.id)}
                        isButton
                      />
                    ))}
                    {availableChains.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No available escalation chains
                      </p>
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
});

EscalationChainSelector.displayName = 'EscalationChainSelector';

export default EscalationChainSelector;
