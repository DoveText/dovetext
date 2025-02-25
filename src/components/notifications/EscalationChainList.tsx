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
import { escalationChainsApi } from '@/app/api/escalation-chains';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import EscalationChainModal from './EscalationChainModal';

interface EscalationChainListProps {
  chains: EscalationChain[];
  onUpdate: () => void;
}

const EscalationChainList: React.FC<EscalationChainListProps> = ({
  chains,
  onUpdate,
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
      onUpdate();
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
      onUpdate();
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

  const renderChainStages = (chain: EscalationChain) => (
    <div className="mt-2 flex flex-wrap gap-2">
      {chain.stages?.map((stage, index) => (
        <div
          key={`${chain.id}-stage-${index}`}
          className="inline-flex items-center gap-x-1.5 rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset"
        >
          <BellIcon className="h-3 w-3" aria-hidden="true" />
          {stage.method?.name || 'Loading...'}
          {index < (chain.stages?.length || 0) - 1 && (
            <>
              <ChevronRightIcon className="h-3 w-3 text-gray-400" aria-hidden="true" />
              <ClockIcon className="h-3 w-3 text-gray-400" aria-hidden="true" />
              {formatDuration(stage.waitTime)}
            </>
          )}
        </div>
      ))}
      {!chain.stages?.length && (
        <div className="text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-md">
          No stages added yet. Click "Add Stage" to create your first escalation stage.
        </div>
      )}
    </div>
  );

  return (
    <div>
      <div className="mt-4 space-y-2">
        {chains.map((chain) => (
          <div
            key={chain.id}
            className="bg-white border rounded-lg shadow-sm hover:shadow transition-all duration-200"
          >
            <div className="relative flex justify-between gap-x-6 py-5 px-4">
              <div className="flex min-w-0 gap-x-4">
                <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-gray-50">
                  <ArrowPathIcon className="h-6 w-6 text-gray-600" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-auto">
                  <div className="flex items-center gap-x-2">
                    <p className="text-sm font-semibold leading-6 text-gray-900">{chain.name}</p>
                    {chain.isEnabled ? (
                      <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                        Enabled
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                        Disabled
                      </span>
                    )}
                  </div>
                  {chain.description && (
                    <p className="mt-1 text-sm leading-5 text-gray-500">{chain.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-x-4">
                <button
                  type="button"
                  onClick={() => handleEdit(chain)}
                  className="rounded-md bg-white p-2 text-gray-400 hover:text-gray-500"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(chain)}
                  className="rounded-md bg-white p-2 text-gray-400 hover:text-red-500"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="mt-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <PlusIcon className="h-5 w-5 mr-2" />
        Add Chain
      </button>

      <EscalationChainModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingChain(null);
        }}
        onSave={() => {
          onUpdate();
          setIsModalOpen(false);
          setEditingChain(null);
        }}
        chain={editingChain}
      />

      <ConfirmDialog
        isOpen={!!deletingChain}
        onClose={() => setDeletingChain(null)}
        onConfirm={confirmDelete}
        title="Delete Chain"
        message="Are you sure you want to delete this chain? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonClassName="bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500"
      />
    </div>
  );
};

export default EscalationChainList;
