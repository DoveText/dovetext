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
      if (rule.isEnabled) {
        await deliveryRulesApi.disable(rule.id);
      } else {
        await deliveryRulesApi.enable(rule.id);
      }
      onRulesChange();
    } catch (err) {
      setError('Failed to toggle delivery rule');
      console.error(err);
    }
  };

  const handleEdit = (rule: DeliveryRule) => {
    setEditingRule(rule);
    setIsModalOpen(true);
  };

  const handleCreateNew = () => {
    setEditingRule(null);
    setIsModalOpen(true);
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-gray-900">Delivery Rules</h1>
          <p className="mt-2 text-sm text-gray-700">
            Configure rules to determine how notifications are delivered through different methods.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            onClick={handleCreateNew}
            className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Add Rule
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
              {rules.length === 0 ? (
                <div className="text-center py-12 bg-white">
                  <PlusIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-semibold text-gray-900">No rules</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by creating a new delivery rule.</p>
                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={handleCreateNew}
                      className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                      <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                      Create Rule
                    </button>
                  </div>
                </div>
              ) : (
                <ul role="list" className="divide-y divide-gray-200 bg-white">
                  {rules.map((rule) => (
                    <li
                      key={rule.id}
                      className={`relative flex justify-between gap-x-6 px-4 py-5 hover:bg-gray-50 sm:px-6 ${
                        hoveredRule === rule.id ? 'bg-gray-50' : ''
                      }`}
                      onMouseEnter={() => setHoveredRule(rule.id)}
                      onMouseLeave={() => setHoveredRule(null)}
                    >
                      <div className="flex min-w-0 gap-x-4">
                        <div className="min-w-0 flex-auto">
                          <div className="flex items-center gap-x-3">
                            <p className="text-sm font-semibold leading-6 text-gray-900">
                              {rule.name}
                            </p>
                            <div className={`rounded-full px-2 py-1 text-xs font-medium ${
                              rule.isEnabled
                                ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20'
                                : 'bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/10'
                            }`}>
                              {rule.isEnabled ? 'Enabled' : 'Disabled'}
                            </div>
                          </div>
                          {rule.description && (
                            <p className="mt-1 text-sm leading-5 text-gray-500">
                              {rule.description}
                            </p>
                          )}
                          <div className="mt-1 flex items-center gap-x-2 text-xs text-gray-500">
                            <span>
                              {rule.conditions.length} condition{rule.conditions.length !== 1 ? 's' : ''}
                            </span>
                            <span>•</span>
                            <span>
                              {rule.actions.length} action{rule.actions.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-x-4">
                        <button
                          type="button"
                          onClick={() => handleToggleEnabled(rule)}
                          className="rounded p-2 hover:bg-gray-100"
                        >
                          {rule.isEnabled ? (
                            <PauseIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                          ) : (
                            <PlayIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEdit(rule)}
                          className="rounded p-2 hover:bg-gray-100"
                        >
                          <PencilIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(rule)}
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
        isOpen={!!deletingRule}
        onClose={() => setDeletingRule(null)}
        onConfirm={confirmDelete}
        title="Delete delivery rule"
        message={`Are you sure you want to delete "${deletingRule?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmStyle="danger"
      />

      {/* Rule Editor Modal */}
      {isModalOpen && (
        <DeliveryRuleModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingRule(null);
          }}
          editingRule={editingRule}
          onSubmit={onRulesChange}
        />
      )}
    </div>
  );
}
