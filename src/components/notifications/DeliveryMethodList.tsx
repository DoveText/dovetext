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
  DOVEAPP: BellIcon,
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
        const Icon = methodIcons[method.type];
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
                  {method.type === 'SMS' && method.config.phone}
                  {method.type === 'VOICE' && method.config.phone}
                  {method.type === 'WEBHOOK' && method.config.webhookUrl}
                  {method.type === 'PLUGIN' && `Plugin ID: ${method.config.pluginId}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-x-4">
              <div className="hidden sm:flex sm:flex-col sm:items-end">
                <p className="flex items-center text-sm leading-6 text-gray-900">
                  {method.isVerified ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-400 mr-1" />
                  ) : (
                    <ExclamationCircleIcon className="h-5 w-5 text-yellow-400 mr-1" />
                  )}
                  {method.isVerified ? 'Verified' : 'Unverified'}
                </p>
                <p className={`mt-1 text-xs leading-5 ${getMethodStatusColor(method.status)}`}>
                  {method.status}
                </p>
              </div>
              
              {/* Action buttons */}
              <div className={`flex gap-x-2 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                {!method.isVerified && (
                  <button
                    onClick={() => onVerify(method)}
                    className="rounded-md bg-blue-50 p-2 text-blue-600 hover:bg-blue-100"
                  >
                    <CheckCircleIcon className="h-5 w-5" />
                  </button>
                )}
                {!method.isDefault && (
                  <button
                    onClick={() => onSetDefault(method)}
                    className="rounded-md bg-yellow-50 p-2 text-yellow-600 hover:bg-yellow-100"
                  >
                    <StarIconOutline className="h-5 w-5" />
                  </button>
                )}
                <button
                  onClick={() => onEdit(method)}
                  className="rounded-md bg-gray-50 p-2 text-gray-600 hover:bg-gray-100"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => onDelete(method)}
                  className="rounded-md bg-red-50 p-2 text-red-600 hover:bg-red-100"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
