import { useState } from 'react';
import { DeliveryMethod, DeliveryMethodType, CreateDeliveryMethodRequest } from '@/types/delivery-method';
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
  StarIcon as StarIconOutline,
  ClipboardIcon,
  ClipboardDocumentCheckIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import DeliveryMethodModal from './DeliveryMethodModal';
import { deliveryMethodsApi } from '@/api/delivery-methods';
import CopyButton from '@/components/common/CopyButton';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { Dialog } from '@headlessui/react';

interface DeliveryMethodListProps {
  methods: DeliveryMethod[];
  onMethodsChange: () => void;
}

interface MethodGroup {
  name: string;
  types: DeliveryMethodType[];
  description: string;
  methods: DeliveryMethod[];
  canCreate: boolean;
}

interface PhoneMethodGroup {
  phoneNumber: string;
  method: DeliveryMethod;
}

const methodIcons: Record<DeliveryMethodType, React.ComponentType<any>> = {
  DOVEAPP: BellIcon,
  EMAIL: EnvelopeIcon,
  TEXT: PhoneIcon,
  VOICE: PhoneIcon,
  WEBHOOK: GlobeAltIcon,
  PLUGIN: PuzzlePieceIcon,
};

const groupDefinitions: Omit<MethodGroup, 'methods'>[] = [
  {
    name: 'DoveApp',
    types: ['DOVEAPP'],
    description: 'Using DoveApp to receive and manage notifications',
    canCreate: false
  },
  {
    name: 'Email',
    types: ['EMAIL'],
    description: 'Receive notifications via email',
    canCreate: true
  },
  {
    name: 'Phone & Text',
    types: ['TEXT', 'VOICE'],
    description: 'Get notified through text or voice calls',
    canCreate: true
  },
  {
    name: 'Integrations',
    types: ['WEBHOOK', 'PLUGIN'],
    description: 'Connect with external services using webhooks or plugins',
    canCreate: true
  }
];

const getMethodConfig = (method: DeliveryMethod) => {
  try {
    const parsed = JSON.parse(method.config);
    return parsed;
  } catch (e) {
    console.error('Failed to parse method config for method:', method.name, e);
    return {};
  }
};

const groupPhoneMethods = (methods: DeliveryMethod[]): PhoneMethodGroup[] => {
  const phoneGroups = new Map<string, PhoneMethodGroup>();
  const phoneNumberOrder: string[] = [];
  
  methods.forEach(method => {
    if (method.type !== 'TEXT' && method.type !== 'VOICE') return;
    
    const config = getMethodConfig(method);
    const phoneNumber = config.phoneNumber;
    if (!phoneNumber) return;
    
    if (!phoneGroups.has(phoneNumber)) {
      // happens to be the first method for the #, we would use this method
      // as placeholder for maintain the phone # attributes
      phoneGroups.set(phoneNumber, {
        phoneNumber,
        method: {...method, config: {...config}, isDefault: false},
      });
      phoneNumberOrder.push(phoneNumber);
    }
    
    const group = phoneGroups.get(phoneNumber)!;
    if (method.type === 'TEXT') {
      group.method.config.textMethodId = method.id;
    } else {
      group.method.config.voiceMethodId = method.id;
    }
  });
  
  return phoneNumberOrder.map(phoneNumber => phoneGroups.get(phoneNumber)!);
};

const groupMethods = (methods: DeliveryMethod[]): MethodGroup[] => {
  // Sort methods by creation time or ID to maintain stable order
  const sortedMethods = [...methods].sort((a, b) => {
    // First by createdAt if available
    if (a.createdAt && b.createdAt) {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    // Then by ID as fallback
    return a.id.localeCompare(b.id);
  });

  return groupDefinitions.map(group => ({
    ...group,
    methods: sortedMethods.filter(method => group.types.includes(method.type as DeliveryMethodType))
  }));
};

const MethodItem = ({ 
  method, 
  icon: Icon, 
  name, 
  description, 
  isDefault,
  details,
  badges,
  isHovered,
  isEditing,
  onMouseEnter,
  onMouseLeave,
  handleVerify,
  handleSetDefault,
  handleEdit,
  handleDelete,
  getMethodStatusColor,
}: {
  method: DeliveryMethod;
  icon: React.ComponentType<any>;
  name: string;
  description?: string;
  isDefault: boolean;
  details?: React.ReactNode;
  badges?: React.ReactNode;
  isHovered: boolean;
  isEditing: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  handleVerify: (method: DeliveryMethod) => void;
  handleSetDefault: (method: DeliveryMethod) => void;
  handleEdit: (method: DeliveryMethod) => void;
  handleDelete: (method: DeliveryMethod) => void;
  getMethodStatusColor: (status: string) => string;
}) => (
  <li
    className={`relative flex justify-between gap-x-6 py-5 px-4 transition-colors duration-200
      ${isHovered || isEditing ? 'bg-gray-50 rounded-lg' : 'hover:bg-gray-50 hover:rounded-lg'}
      ${isEditing ? 'ring-2 ring-indigo-500 rounded-lg' : ''}
    `}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
  >
    <div className="flex min-w-0 gap-x-4">
      <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-gray-50">
        <Icon className="h-6 w-6 text-gray-600" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-auto">
        <div className="flex items-center gap-x-2">
          <p className="text-sm font-semibold leading-6 text-gray-900">{name}</p>
          {isDefault && <StarIconSolid className="h-4 w-4 text-yellow-400" aria-hidden="true" />}
        </div>
        <div className="mt-1 flex items-center gap-x-2 text-xs leading-5 text-gray-500">
          {details}
          {badges}
        </div>
        {description && (
          <p className="mt-1 text-xs text-gray-500 line-clamp-2">{description}</p>
        )}
      </div>
    </div>
    <div className="flex items-center gap-x-4">
      <div className="flex gap-x-2">
        <button
          type="button"
          onClick={() => handleVerify(method)}
          className="rounded p-1 hover:bg-gray-100 group relative"
        >
          <CheckCircleIcon className={`h-5 w-5 ${getMethodStatusColor(method.status)}`} />
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity">
            {method.isVerified ? 'Verified' : 'Verify'}
          </span>
        </button>
        <button
          type="button"
          onClick={() => handleSetDefault(method)}
          className="rounded p-1 hover:bg-gray-100 group relative"
        >
          {method.isDefault ? (
            <>
              <StarIconSolid className="h-5 w-5 text-yellow-400" />
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity">
                Default Method
              </span>
            </>
          ) : (
            <>
              <StarIconOutline className="h-5 w-5 text-gray-400" />
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity">
                Set as Default
              </span>
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => handleEdit(method)}
          className="rounded p-1 hover:bg-gray-100 group relative"
        >
          <PencilIcon className="h-5 w-5 text-gray-400" />
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity">
            Edit
          </span>
        </button>
        <button
          type="button"
          onClick={() => handleDelete(method)}
          className="rounded p-1 hover:bg-gray-100 group relative"
        >
          <TrashIcon className="h-5 w-5 text-gray-400" />
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity">
            Delete
          </span>
        </button>
      </div>
    </div>
  </li>
);

const MethodList = ({
  methods,
  group,
  hoveredMethod,
  editingMethod,
  onMouseEnter,
  onMouseLeave,
  handleVerify,
  handleSetDefault,
  handleEdit,
  handleDelete,
  getMethodStatusColor,
}: {
  methods: DeliveryMethod[];
  group: MethodGroup;
  hoveredMethod: string | null;
  editingMethod: DeliveryMethod | null;
  onMouseEnter: (methodId: string) => void;
  onMouseLeave: () => void;
  handleVerify: (method: DeliveryMethod) => void;
  handleSetDefault: (method: DeliveryMethod) => void;
  handleEdit: (method: DeliveryMethod) => void;
  handleDelete: (method: DeliveryMethod) => void;
  getMethodStatusColor: (status: string) => string;
}) => {
  if (methods.length === 0) {
    if (!group.canCreate) return null;

    return (
      <div className="text-center py-6">
        <div className="mx-auto h-12 w-12 text-gray-400">
          {group.name === 'Phone & Text' ? (
            <PhoneIcon className="h-12 w-12" />
          ) : (
            <PuzzlePieceIcon className="h-12 w-12" />
          )}
        </div>
        <h3 className="mt-2 text-sm font-semibold text-gray-900">No {group.name.toLowerCase()} methods</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by creating a new {group.name.toLowerCase()} method.</p>
        <div className="mt-6">
          <button
            type="button"
            onClick={() => handleAddClick(group)}
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
            Create {group.name} Method
          </button>
        </div>
      </div>
    );
  }

  const methodsToRender = group.name === 'Phone & Text' 
    ? groupPhoneMethods(methods)
    : methods.map(method => ({ method, config: getMethodConfig(method) }));

  return (
    <ul role="list" className="space-y-4">
      {methodsToRender.map(({ method, phoneNumber }) => {
        const Icon = methodIcons[method.type as DeliveryMethodType];
        const isHovered = hoveredMethod === method.id;
        const isEditing = editingMethod?.id === method.id;
        const config = method.config;

        let details = null;
        if (phoneNumber) {
          details = (
            <>
              <PhoneIcon className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{phoneNumber}</span>
              <CopyButton text={phoneNumber} methodId={method.id} />
              <div className="flex items-center gap-x-2 ml-2">
                {config.textMethodId && (
                  <span className="inline-flex items-center rounded-md bg-green-50 px-1.5 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                    Text
                  </span>
                )}
                {config.voiceMethodId && (
                  <span className="inline-flex items-center rounded-md bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                    Voice
                  </span>
                )}
              </div>
            </>
          );
        } else if (method.type === 'EMAIL') {
          details = (
            <>
              <EnvelopeIcon className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="truncate">{config.email}</span>
              <CopyButton text={config.email} methodId={method.id} />
            </>
          );
        } else if (method.type === 'DOVEAPP' && config.doveNumber) {
          details = (
            <>
              <BellIcon className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="truncate">Dove #: {config.doveNumber}</span>
              <CopyButton text={config.doveNumber} methodId={method.id} />
            </>
          );
        }

        return (
          <MethodItem
            key={phoneNumber || method.id}
            method={method}
            icon={Icon}
            name={method.name}
            description={method.description}
            isDefault={method.isDefault}
            details={details}
            isHovered={isHovered}
            isEditing={isEditing}
            onMouseEnter={() => onMouseEnter(method.id)}
            onMouseLeave={onMouseLeave}
            handleVerify={handleVerify}
            handleSetDefault={handleSetDefault}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
            getMethodStatusColor={getMethodStatusColor}
          />
        );
      })}
    </ul>
  );
};

export default function DeliveryMethodList({
  methods,
  onMethodsChange,
}: DeliveryMethodListProps) {
  const [hoveredMethod, setHoveredMethod] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<DeliveryMethod | null>(null);
  const [methodGroup, setMethodGroup] = useState<'DOVEAPP' | 'EMAIL' | 'PHONE' | 'PLUGIN'>('EMAIL');
  const [error, setError] = useState<string | null>(null);
  const [deletingMethod, setDeletingMethod] = useState<DeliveryMethod | null>(null);

  const handleDelete = (method: DeliveryMethod) => {
    setDeletingMethod(method);
  };

  const confirmDelete = async () => {
    if (!deletingMethod) return;

    try {
      if (deletingMethod.type === 'TEXT' || deletingMethod.type === 'VOICE') {
        const config = deletingMethod.config;

        const deleteIds = [];
        if (config.textMethodId) {
          deleteIds.push(config.textMethodId);
        }
        if (config.voiceMethodId) {
          deleteIds.push(config.voiceMethodId);
        }

        await Promise.all(deleteIds.map(id => deliveryMethodsApi.delete(id)));
      } else {
        await deliveryMethodsApi.delete(deletingMethod.id);
      }
      
      onMethodsChange();
      setDeletingMethod(null);
    } catch (err) {
      setError('Failed to delete delivery method');
      console.error(err);
    }
  };

  const handleVerify = async (method: DeliveryMethod) => {
    try {
      await deliveryMethodsApi.verify(method.id);
      onMethodsChange();
    } catch (err) {
      setError('Failed to verify delivery method');
      console.error(err);
    }
  };

  const handleSetDefault = async (method: DeliveryMethod) => {
    try {
      await deliveryMethodsApi.setDefault(method.id);
      onMethodsChange();
    } catch (err) {
      setError('Failed to set default delivery method');
      console.error(err);
    }
  };

  const handleSubmit = async (data: CreateDeliveryMethodRequest) => {
    try {
      if (data.id) {
        await deliveryMethodsApi.update(data.id, data);
      } else {
        await deliveryMethodsApi.create(data);
      }
      onMethodsChange();
      setEditingMethod(null);
      setIsModalOpen(false);
    } catch (err) {
      setError('Failed to save delivery method');
      console.error(err);
    }
  };

  const handleModalSubmit = async (data: CreateDeliveryMethodRequest) => {
    try {
      await handleSubmit(data);
    } catch (err) {
      setError('Failed to save delivery method');
      console.error(err);
    }
  };

  const handleModalDelete = async (id: string) => {
    try {
      await deliveryMethodsApi.delete(id);
      onMethodsChange();
    } catch (err) {
      setError('Failed to delete delivery method');
      console.error(err);
    }
  };

  const groupMethods = (methods: DeliveryMethod[]): MethodGroup[] => {
    // Sort methods by creation time or ID to maintain stable order
    const sortedMethods = [...methods].sort((a, b) => {
      // First by createdAt if available
      if (a.createdAt && b.createdAt) {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      // Then by ID as fallback
      return a.id.localeCompare(b.id);
    });

    return groupDefinitions.map(group => ({
      ...group,
      methods: sortedMethods.filter(method => group.types.includes(method.type as DeliveryMethodType))
    }));
  };

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

  const copyToClipboard = (text: string, methodId: string) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // Make the textarea out of viewport
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    
    try {
      textArea.select();
      document.execCommand('copy');
    } catch (err) {
      console.error('Failed to copy text:', err);
    } finally {
      textArea.remove();
    }
  };

  const handleCreateNew = (group: 'DOVEAPP' | 'EMAIL' | 'PHONE' | 'PLUGIN') => {
    setMethodGroup(group);
    setEditingMethod(null);
    setIsModalOpen(true);
  };

  const handleEdit = (method: DeliveryMethod) => {
    const groupMap: Record<DeliveryMethodType, 'DOVEAPP' | 'EMAIL' | 'PHONE' | 'PLUGIN'> = {
      'DOVEAPP': 'DOVEAPP',
      'EMAIL': 'EMAIL',
      'TEXT': 'PHONE',
      'VOICE': 'PHONE',
      'WEBHOOK': 'PLUGIN',
      'PLUGIN': 'PLUGIN',
    };
    setMethodGroup(groupMap[method.type]);
    setEditingMethod(method);
    setIsModalOpen(true);
  };

  const handleAddClick = (group: MethodGroup) => {
    const groupMap: Record<string, 'DOVEAPP' | 'EMAIL' | 'PHONE' | 'PLUGIN'> = {
      'DoveApp': 'DOVEAPP',
      'Email': 'EMAIL',
      'Phone & Text': 'PHONE',
      'Integrations': 'PLUGIN',
    };
    handleCreateNew(groupMap[group.name]);
  };

  const groupedMethods = groupMethods(methods);

  return (
    <>
      <div className="divide-y divide-gray-100">
        {groupedMethods.map((group) => (
          <div key={group.name} className="space-y-4 py-6 px-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">{group.name}</h3>
                <p className="mt-1 text-sm text-gray-500 line-clamp-2">{group.description}</p>
              </div>
              {group.canCreate && (
                <button
                  type="button"
                  onClick={() => handleAddClick(group)}
                  className="inline-flex items-center gap-x-1.5 rounded-md bg-indigo-600 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  <PlusIcon className="-ml-0.5 h-4 w-4" aria-hidden="true" />
                  Create New
                </button>
              )}
            </div>
            <MethodList
              methods={group.methods}
              group={group}
              hoveredMethod={hoveredMethod}
              editingMethod={editingMethod}
              onMouseEnter={setHoveredMethod}
              onMouseLeave={() => setHoveredMethod(null)}
              handleVerify={handleVerify}
              handleSetDefault={handleSetDefault}
              handleEdit={handleEdit}
              handleDelete={handleDelete}
              getMethodStatusColor={getMethodStatusColor}
            />
          </div>
        ))}
      </div>

      <DeliveryMethodModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingMethod(null);
        }}
        onSubmit={handleModalSubmit}
        onDelete={handleModalDelete}
        editingMethod={editingMethod}
        group={methodGroup}
      />
      <ConfirmDialog
        isOpen={Boolean(deletingMethod)}
        onClose={() => setDeletingMethod(null)}
        onConfirm={confirmDelete}
        title="Delete Delivery Method"
        message="Are you sure you want to delete this delivery method? This action cannot be undone."
        confirmText="Delete"
      />
      {error && (
        <div className="mt-4 text-sm text-red-500">{error}</div>
      )}
    </>
  );
}
