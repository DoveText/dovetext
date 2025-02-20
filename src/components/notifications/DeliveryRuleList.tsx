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

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h2 className="text-xl font-semibold text-gray-900">Delivery Rules</h2>
            <p className="mt-2 text-sm text-gray-700">
              Configure rules to determine how notifications are delivered
            </p>
          </div>
          <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
            <button
              type="button"
              onClick={() => {
                setEditingRule(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Rule
            </button>
          </div>
        </div>

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
              <table className="min-w-full divide-y divide-gray-300">
                <thead>
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                      Name
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Priority
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Slots
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {rules.map((rule) => (
                    <tr
                      key={rule.id}
                      onMouseEnter={() => setHoveredRule(rule.id)}
                      onMouseLeave={() => setHoveredRule(null)}
                      className="hover:bg-gray-50"
                    >
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                        <div>
                          <div className="font-medium text-gray-900">{rule.name}</div>
                          {rule.description && (
                            <div className="text-gray-500">{rule.description}</div>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <button
                          onClick={() => handleToggleEnabled(rule)}
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            rule.settings.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {rule.settings.isActive ? (
                            <>
                              <PauseIcon className="mr-1 h-4 w-4" />
                              Active
                            </>
                          ) : (
                            <>
                              <PlayIcon className="mr-1 h-4 w-4" />
                              Inactive
                            </>
                          )}
                        </button>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {rule.settings.priority === 2 ? (
                          <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                            High
                          </span>
                        ) : rule.settings.priority === 1 ? (
                          <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                            Medium
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                            Low
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {rule.slots.map((slot, index) => (
                          <div key={index} className="flex items-center space-x-1 text-xs">
                            <ClockIcon className="h-4 w-4 text-gray-400" />
                            <span>
                              {slot.timeslot.startTime} - {slot.timeslot.endTime}
                            </span>
                            <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                            <span>
                              {[
                                slot.methodIds.length > 0 && `${slot.methodIds.length} methods`,
                                slot.channelIds.length > 0 && `${slot.channelIds.length} channels`,
                                slot.chainIds.length > 0 && `${slot.chainIds.length} chains`
                              ]
                                .filter(Boolean)
                                .join(', ')}
                            </span>
                          </div>
                        ))}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                        <div
                          className={`absolute right-0 flex space-x-2 ${
                            hoveredRule === rule.id ? 'opacity-100' : 'opacity-0'
                          } transition-opacity duration-200`}
                        >
                          <button
                            onClick={() => {
                              setEditingRule(rule);
                              setIsModalOpen(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(rule)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <DeliveryRuleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
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
    </div>
  );
}
