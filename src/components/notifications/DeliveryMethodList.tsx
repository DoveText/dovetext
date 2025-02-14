import { useState } from 'react';
import { DeliveryMethod, DeliveryMethodType } from '@/types/delivery-method';
import { 
  BellIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  GlobeAltIcon, 
  PuzzlePieceIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  TrashIcon,
  PencilIcon,
  StarIcon as StarIconOutline
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface DeliveryMethodListProps {
  methods: DeliveryMethod[];
  onEdit: (method: DeliveryMethod) => void;
  onDelete: (method: DeliveryMethod) => void;
  onVerify: (method: DeliveryMethod) => void;
  onSetDefault: (method: DeliveryMethod) => void;
}

const methodIcons: Record<DeliveryMethodType, React.ComponentType<any>> = {
  DOVE_APP: BellIcon,
  EMAIL: EnvelopeIcon,
  SMS: PhoneIcon,
  VOICE: PhoneIcon,
  WEBHOOK: GlobeAltIcon,
  PLUGIN: PuzzlePieceIcon,
};

export default function DeliveryMethodList({
  methods,
  onEdit,
  onDelete,
  onVerify,
  onSetDefault,
}: DeliveryMethodListProps) {
  const [hoveredMethod, setHoveredMethod] = useState<string | null>(null);

  const getMethodStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'text-green-400';
      case 'INACTIVE':
        return 'text-gray-400';
      case 'PENDING':
        return 'text-yellow-400';
      case 'FAILED':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <ul role="list" className="divide-y divide-gray-100">
      {methods.map((method) => {
        const Icon = methodIcons[method.type as DeliveryMethodType];
        const isHovered = hoveredMethod === method.id;

        return (
          <li
            key={method.id}
            className="relative flex justify-between gap-x-6 py-5 hover:bg-gray-50"
            onMouseEnter={() => setHoveredMethod(method.id)}
            onMouseLeave={() => setHoveredMethod(null)}
          >
            <div className="flex min-w-0 gap-x-4">
              <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-gray-50">
                <Icon className="h-6 w-6 text-gray-600" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-auto">
                <p className="text-sm font-semibold leading-6 text-gray-900">
                  <span className="absolute inset-x-0 -top-px bottom-0" />
                  {method.name}
                  {method.isDefault && (
                    <StarIconSolid className="inline-block h-4 w-4 ml-1 text-yellow-400" aria-hidden="true" />
                  )}
                </p>
                <p className="mt-1 flex text-xs leading-5 text-gray-500">
                  {method.type === 'EMAIL' && method.config.email}
                  {method.type === 'SMS' && method.config.phoneNumber}
                  {method.type === 'VOICE' && method.config.phoneNumber}
                  {method.type === 'WEBHOOK' && method.config.webhookUrl}
                  {method.type === 'PLUGIN' && `Plugin ID: ${method.config.pluginId}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-x-4">
              <div className="hidden sm:flex sm:flex-col sm:items-end">
                <p className={`mt-1 text-xs leading-5 ${getMethodStatusColor(method.status)}`}>
                  {method.status}
                </p>
              </div>
              <div className="flex gap-x-2">
                {!method.isVerified && (
                  <button
                    type="button"
                    onClick={() => onVerify(method)}
                    className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                  >
                    Verify
                  </button>
                )}
                {!method.isDefault && (
                  <button
                    type="button"
                    onClick={() => onSetDefault(method)}
                    className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                  >
                    Set Default
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onEdit(method)}
                  className="rounded-full bg-white p-1 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(method)}
                  className="rounded-full bg-white p-1 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
