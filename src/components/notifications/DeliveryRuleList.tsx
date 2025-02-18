'use client';

import { useState } from 'react';
import { DeliveryRule } from '@/types/delivery-rule';
import { 
  PencilIcon,
  TrashIcon,
  PlayIcon,
  PauseIcon,
  PlusIcon,
  ChevronRightIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { deliveryRulesApi } from '@/api/delivery-rules';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { Dialog } from '@headlessui/react';
import DeliveryRuleModal from './DeliveryRuleModal';

interface DeliveryRuleListProps {
  rules: DeliveryRule[];
  onRulesChange: () => void;
}

export default function DeliveryRuleList({
  rules,
  onRulesChange,
}: DeliveryRuleListProps) {
  const [hoveredRule, setHoveredRule] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<DeliveryRule | null>(null);
  const [deletingRule, setDeletingRule] = useState<DeliveryRule | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = (rule: DeliveryRule) => {
    setDeletingRule(rule);
  };

  const confirmDelete = async () => {
    if (!deletingRule) return;

    try {
      await deliveryRulesApi.delete(deletingRule.id);
      onRulesChange();
      setDeletingRule(null);
    } catch (err) {
      setError('Failed to delete delivery rule');
      console.error(err);
    }
  };

  const handleToggleEnabled = async (rule: DeliveryRule) => {
    try {
      await deliveryRulesApi.update(rule.id, {
        isActive: !rule.isActive,
      });
      onRulesChange();
    } catch (err) {
      setError('Failed to update delivery rule');
      console.error(err);
    }
  };

  const renderRuleCard = (rule: DeliveryRule) => {
    const isHovered = hoveredRule === rule.id;

    return (
      <div
        key={rule.id}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4 hover:shadow-md transition-shadow duration-200"
        onMouseEnter={() => setHoveredRule(rule.id)}
        onMouseLeave={() => setHoveredRule(null)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-medium text-gray-900">{rule.name}</h3>
            {!rule.isActive && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                Disabled
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {isHovered && (
              <>
                <button
                  onClick={() => handleToggleEnabled(rule)}
                  className="p-1 rounded-full hover:bg-gray-100"
                  title={rule.isActive ? 'Disable' : 'Enable'}
                >
                  {rule.isActive ? (
                    <PauseIcon className="h-5 w-5 text-gray-500" />
                  ) : (
                    <PlayIcon className="h-5 w-5 text-gray-500" />
                  )}
                </button>
                <button
                  onClick={() => {
                    setEditingRule(rule);
                    setIsModalOpen(true);
                  }}
                  className="p-1 rounded-full hover:bg-gray-100"
                  title="Edit"
                >
                  <PencilIcon className="h-5 w-5 text-gray-500" />
                </button>
                <button
                  onClick={() => handleDelete(rule)}
                  className="p-1 rounded-full hover:bg-gray-100"
                  title="Delete"
                >
                  <TrashIcon className="h-5 w-5 text-gray-500" />
                </button>
              </>
            )}
            <ChevronRightIcon
              className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
                isHovered ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </div>
        </div>

        {rule.description && (
          <p className="mt-1 text-sm text-gray-500">{rule.description}</p>
        )}

        <div className="mt-2 flex items-center text-sm text-gray-500 space-x-4">
          <div className="flex items-center space-x-1">
            <ClockIcon className="h-4 w-4" />
            <span>{rule.targets.length} target{rule.targets.length !== 1 ? 's' : ''}</span>
          </div>
          {rule.priority !== 0 && (
            <>
              <span>•</span>
              <span>Priority: {rule.priority}</span>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Delivery Rules</h2>
        <button
          onClick={() => {
            setEditingRule(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          New Rule
        </button>
      </div>

      <div className="space-y-4">
        {rules.map(renderRuleCard)}
        {rules.length === 0 && (
          <p className="text-gray-500 text-center py-8">
            No delivery rules yet. Create one to get started!
          </p>
        )}
      </div>

      <DeliveryRuleModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRule(null);
        }}
        rule={editingRule}
        onSave={onRulesChange}
      />

      <ConfirmDialog
        isOpen={!!deletingRule}
        onClose={() => setDeletingRule(null)}
        onConfirm={confirmDelete}
        title="Delete Delivery Rule"
        message={`Are you sure you want to delete "${deletingRule?.name}"? This action cannot be undone.`}
      />

      {error && (
        <Dialog
          open={!!error}
          onClose={() => setError(null)}
          className="fixed z-10 inset-0 overflow-y-auto"
        >
          <div className="flex items-center justify-center min-h-screen">
            <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
            <div className="relative bg-white rounded-lg p-4">
              <p className="text-red-600">{error}</p>
              <button
                onClick={() => setError(null)}
                className="mt-4 px-4 py-2 bg-gray-100 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
