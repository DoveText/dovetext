'use client';

import { useState } from 'react';
import { EscalationChain } from '@/types/escalation-chain';
import { 
  PencilIcon,
  TrashIcon,
  PlayIcon,
  PauseIcon,
  PlusIcon,
  ChevronRightIcon,
  ClockIcon,
  BellIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { escalationChainsApi } from '@/api/escalation-chains';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import EscalationChainModal from './EscalationChainModal';

interface EscalationChainListProps {
  chains: EscalationChain[];
  onChainsChange: () => void;
}

const EscalationChainList: React.FC<EscalationChainListProps> = ({
  chains,
  onChainsChange,
}) => {
  const [hoveredChain, setHoveredChain] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChain, setEditingChain] = useState<EscalationChain | null>(null);
  const [deletingChain, setDeletingChain] = useState<EscalationChain | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = (chain: EscalationChain) => {
    setDeletingChain(chain);
  };

  const confirmDelete = async () => {
    if (!deletingChain) return;

    try {
      await escalationChainsApi.delete(deletingChain.id);
      onChainsChange();
      setDeletingChain(null);
    } catch (err) {
      setError('Failed to delete escalation chain');
      console.error(err);
    }
  };

  const handleToggleEnabled = async (chain: EscalationChain) => {
    try {
      if (chain.isEnabled) {
        await escalationChainsApi.disable(chain.id);
      } else {
        await escalationChainsApi.enable(chain.id);
      }
      onChainsChange();
    } catch (err) {
      setError('Failed to toggle escalation chain');
      console.error(err);
    }
  };

  const handleEdit = (chain: EscalationChain) => {
    setEditingChain(chain);
    setIsModalOpen(true);
  };

  const handleCreateNew = () => {
    setEditingChain(null);
    setIsModalOpen(true);
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    if (seconds < 3600) {
      return `${Math.floor(seconds / 60)}m`;
    }
    return `${Math.floor(seconds / 3600)}h`;
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-gray-900">Escalation Chains</h1>
          <p className="mt-2 text-sm text-gray-700">
            Define escalation paths for notifications with multiple steps and retry policies.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            onClick={handleCreateNew}
            className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Add Chain
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              {chains.length === 0 ? (
                <div className="text-center py-12 bg-white">
                  <PlusIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-semibold text-gray-900">No escalation chains</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by creating a new escalation chain.</p>
                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={handleCreateNew}
                      className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                      <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                      Create Chain
                    </button>
                  </div>
                </div>
              ) : (
                <ul role="list" className="divide-y divide-gray-200 bg-white">
                  {chains.map((chain) => (
                    <li
                      key={chain.id}
                      className={`relative flex justify-between gap-x-6 px-4 py-5 hover:bg-gray-50 sm:px-6 ${
                        hoveredChain === chain.id ? 'bg-gray-50' : ''
                      }`}
                      onMouseEnter={() => setHoveredChain(chain.id)}
                      onMouseLeave={() => setHoveredChain(null)}
                    >
                      <div className="flex min-w-0 gap-x-4">
                        <div className="min-w-0 flex-auto">
                          <div className="flex items-center gap-x-3">
                            <p className="text-sm font-semibold leading-6 text-gray-900">
                              {chain.name}
                            </p>
                            <div className={`rounded-full px-2 py-1 text-xs font-medium ${
                              chain.isEnabled
                                ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20'
                                : 'bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/10'
                            }`}>
                              {chain.isEnabled ? 'Enabled' : 'Disabled'}
                            </div>
                          </div>
                          {chain.description && (
                            <p className="mt-1 text-sm leading-5 text-gray-500">
                              {chain.description}
                            </p>
                          )}
                          <div className="mt-2 flex flex-wrap gap-2">
                            {chain.steps.map((step, index) => (
                              <div
                                key={step.id}
                                className="inline-flex items-center gap-x-1.5 rounded-md px-2 py-1 text-xs font-medium text-gray-900 ring-1 ring-inset ring-gray-200"
                              >
                                <span className="text-gray-400">{index + 1}.</span>
                                {step.method?.name || 'Unknown Method'}
                                <span className="text-gray-400 ml-1 flex items-center gap-x-1">
                                  <ClockIcon className="h-3 w-3" />
                                  {formatDuration(step.waitTime)}
                                  {step.retryCount > 0 && (
                                    <>
                                      <ArrowPathIcon className="h-3 w-3" />
                                      {step.retryCount}×{formatDuration(step.retryInterval)}
                                    </>
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-x-4">
                        <button
                          type="button"
                          onClick={() => handleToggleEnabled(chain)}
                          className="rounded p-2 hover:bg-gray-100"
                        >
                          {chain.isEnabled ? (
                            <PauseIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                          ) : (
                            <PlayIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEdit(chain)}
                          className="rounded p-2 hover:bg-gray-100"
                        >
                          <PencilIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(chain)}
                          className="rounded p-2 hover:bg-gray-100"
                        >
                          <TrashIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </button>
                        <ChevronRightIcon
                          className="h-5 w-5 text-gray-400"
                          aria-hidden="true"
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingChain}
        onClose={() => setDeletingChain(null)}
        onConfirm={confirmDelete}
        title="Delete escalation chain"
        message={`Are you sure you want to delete "${deletingChain?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmStyle="danger"
      />

      {/* Chain Editor Modal */}
      {isModalOpen && (
        <EscalationChainModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingChain(null);
          }}
          editingChain={editingChain}
          onSubmit={onChainsChange}
        />
      )}
    </div>
  );
};

export default EscalationChainList;
