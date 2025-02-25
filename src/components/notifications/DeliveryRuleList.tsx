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
import { deliveryRulesApi } from '@/app/api/delivery-rules';
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
      if (rule.settings.isActive) {
        await deliveryRulesApi.disable(rule.id);
      } else {
        await deliveryRulesApi.enable(rule.id);
      }
      onRulesChange();
    } catch (err) {
      setError('Failed to toggle rule status');
      console.error(err);
    }
  };

  const handleEdit = (rule: DeliveryRule) => {
    setEditingRule(rule);
    setIsModalOpen(true);
  };

  return (
    <div>
      <div className="mt-4 space-y-2">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className="bg-white border rounded-lg shadow-sm hover:shadow transition-all duration-200"
          >
            <div className="relative flex justify-between gap-x-6 py-5 px-4">
              <div className="flex min-w-0 gap-x-4">
                <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-gray-50">
                  <ClockIcon className="h-6 w-6 text-gray-600" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-auto">
                  <div className="flex items-center gap-x-2">
                    <p className="text-sm font-semibold leading-6 text-gray-900">{rule.name}</p>
                    <button
                      onClick={() => handleToggleEnabled(rule)}
                      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                        rule.settings.isActive
                          ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20'
                          : 'bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/10'
                      }`}
                    >
                      {rule.settings.isActive ? 'Active' : 'Inactive'}
                    </button>
                    {rule.settings.priority && (
                      <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                        Priority {rule.settings.priority}
                      </span>
                    )}
                  </div>
                  {rule.description && (
                    <p className="mt-1 text-sm leading-5 text-gray-500">{rule.description}</p>
                  )}
                  {rule.slots && rule.slots.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {rule.slots.map((slot, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10"
                        >
                          {slot.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-x-4">
                <button
                  type="button"
                  onClick={() => handleEdit(rule)}
                  className="rounded-md bg-white p-2 text-gray-400 hover:text-gray-500"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(rule)}
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
        onClick={() => {
          setEditingRule(null);
          setIsModalOpen(true);
        }}
        className="mt-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <PlusIcon className="h-5 w-5 mr-2" />
        Add Rule
      </button>

      <DeliveryRuleModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRule(null);
        }}
        onSave={() => {
          setIsModalOpen(false);
          setEditingRule(null);
          onRulesChange();
        }}
        rule={editingRule}
      />

      <ConfirmDialog
        isOpen={!!deletingRule}
        onClose={() => setDeletingRule(null)}
        onConfirm={confirmDelete}
        title="Delete Rule"
        message="Are you sure you want to delete this rule? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonClassName="bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500"
      />
    </div>
  );
}
