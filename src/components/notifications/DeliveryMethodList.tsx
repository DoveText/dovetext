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

interface DeliveryMethodListProps {
  methods: DeliveryMethod[];
  onMethodsChange: () => void;
}

const methodIcons: Record<DeliveryMethodType, React.ComponentType<any>> = {
  DOVEAPP: BellIcon,
  EMAIL: EnvelopeIcon,
  TEXT: PhoneIcon,
  VOICE: PhoneIcon,
  WEBHOOK: GlobeAltIcon,
  PLUGIN: PuzzlePieceIcon,
};

type MethodGroup = {
  name: string;
  types: DeliveryMethodType[];
  description: string;
  methods: DeliveryMethod[];
  canCreate: boolean;
};

type PhoneMethodGroup = {
  phoneNumber: string;
  textMethod?: DeliveryMethod;
  voiceMethod?: DeliveryMethod;
  description: string;
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

const groupPhoneMethods = (methods: DeliveryMethod[]): PhoneMethodGroup[] => {
  const phoneGroups = new Map<string, PhoneMethodGroup>();
  
  methods.forEach(method => {
    if (method.type !== 'TEXT' && method.type !== 'VOICE') return;
    
    const config = getMethodConfig(method);
    const phoneNumber = config.phoneNumber;
    if (!phoneNumber) return;
    
    if (!phoneGroups.has(phoneNumber)) {
      phoneGroups.set(phoneNumber, {
        phoneNumber,
        description: method.description || '',
      });
    }
    
    const group = phoneGroups.get(phoneNumber)!;
    if (method.type === 'TEXT') {
      group.textMethod = method;
    } else {
      group.voiceMethod = method;
    }
  });
  
  return Array.from(phoneGroups.values());
};

export default function DeliveryMethodList({
  methods,
  onMethodsChange,
}: DeliveryMethodListProps) {
  const [hoveredMethod, setHoveredMethod] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<DeliveryMethod | null>(null);
  const [methodGroup, setMethodGroup] = useState<'DOVEAPP' | 'EMAIL' | 'PHONE' | 'PLUGIN'>('EMAIL');
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (method: DeliveryMethod) => {
    if (!confirm('Are you sure you want to delete this delivery method?')) {
      return;
    }

    try {
      await deliveryMethodsApi.delete(method.id);
      onMethodsChange();
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
      if (editingMethod) {
        await deliveryMethodsApi.update(editingMethod.id, data);
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

  const groupMethods = (methods: DeliveryMethod[]): MethodGroup[] => {
    return groupDefinitions.map(group => ({
      ...group,
      methods: methods.filter(method => group.types.includes(method.type as DeliveryMethodType))
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

  const getMethodConfig = (method: DeliveryMethod) => {
    try {
      const parsed = JSON.parse(method.config);
      return parsed;
    } catch (e) {
      console.error('Failed to parse method config for method:', method.name, e);
      return {};
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
      setCopiedId(methodId);
      setTimeout(() => {
        setCopiedId(null);
      }, 2000);
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

  const CopyButton = ({ text, methodId }: { text: string; methodId: string }) => {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          copyToClipboard(text, methodId);
        }}
        className="relative inline-flex items-center justify-center p-1.5 ml-1 rounded-md 
          hover:bg-gray-100 active:bg-gray-200 
          cursor-pointer transition-all duration-200 
          ring-1 ring-transparent hover:ring-gray-200
          z-10"
        style={{ WebkitTapHighlightColor: 'transparent' }}
        title="Copy to clipboard"
      >
        <div className="relative">
          {copiedId === methodId ? (
            <ClipboardDocumentCheckIcon className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <ClipboardIcon className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600" />
          )}
        </div>
      </button>
    );
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
            {group.name === 'Phone & Text' ? (
              group.methods.length > 0 ? (
                <ul role="list" className="space-y-4">
                  {groupPhoneMethods(group.methods).map(({ phoneNumber, textMethod, voiceMethod, description }) => {
                    const isTextHovered = hoveredMethod === textMethod?.id;
                    const isVoiceHovered = hoveredMethod === voiceMethod?.id;
                    const isTextEditing = editingMethod?.id === textMethod?.id;
                    const isVoiceEditing = editingMethod?.id === voiceMethod?.id;
                    const isHovered = isTextHovered || isVoiceHovered;
                    const isEditing = isTextEditing || isVoiceEditing;

                    return (
                      <li
                        key={phoneNumber}
                        className={`relative flex justify-between gap-x-6 py-5 px-4 transition-colors duration-200
                          ${isHovered || isEditing ? 'bg-gray-50 rounded-lg' : 'hover:bg-gray-50 hover:rounded-lg'}
                          ${isEditing ? 'ring-2 ring-indigo-500 rounded-lg' : ''}
                        `}
                        onMouseEnter={() => {
                          if (textMethod) setHoveredMethod(textMethod.id);
                          if (voiceMethod) setHoveredMethod(voiceMethod.id);
                        }}
                        onMouseLeave={() => setHoveredMethod(null)}
                      >
                        <div className="flex min-w-0 gap-x-4">
                          <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-gray-50">
                            <PhoneIcon className="h-6 w-6 text-gray-600" aria-hidden="true" />
                          </div>
                          <div className="min-w-0 flex-auto">
                            <div className="flex items-center gap-x-2">
                              <p className="text-sm font-semibold leading-6 text-gray-900">
                                {textMethod?.name || voiceMethod?.name || phoneNumber}
                              </p>
                              {(textMethod?.isDefault || voiceMethod?.isDefault) && (
                                <StarIconSolid className="h-4 w-4 text-yellow-400" aria-hidden="true" />
                              )}
                            </div>
                            <div className="mt-1 flex items-center gap-x-2 text-xs leading-5 text-gray-500">
                              <PhoneIcon className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{phoneNumber}</span>
                              <CopyButton text={phoneNumber} methodId={textMethod?.id || voiceMethod?.id || ''} />
                              <div className="flex items-center gap-x-2 ml-2">
                                {textMethod && (
                                  <span className="inline-flex items-center rounded-md bg-green-50 px-1.5 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                                    Text
                                  </span>
                                )}
                                {voiceMethod && (
                                  <span className="inline-flex items-center rounded-md bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                                    Voice
                                  </span>
                                )}
                              </div>
                            </div>
                            {description && (
                              <p className="mt-1 text-xs text-gray-500 line-clamp-2">{description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-x-4">
                          <div className="flex -space-x-1">
                            {textMethod && (
                              <button
                                type="button"
                                onClick={() => handleEdit(textMethod)}
                                className="relative inline-flex h-6 w-6 items-center justify-center rounded-full bg-white hover:bg-gray-50 ring-1 ring-gray-300"
                                title="Edit Text Settings"
                              >
                                <span className="text-xs font-medium text-gray-700">T</span>
                              </button>
                            )}
                            {voiceMethod && (
                              <button
                                type="button"
                                onClick={() => handleEdit(voiceMethod)}
                                className="relative inline-flex h-6 w-6 items-center justify-center rounded-full bg-white hover:bg-gray-50 ring-1 ring-gray-300"
                                title="Edit Voice Settings"
                              >
                                <span className="text-xs font-medium text-gray-700">V</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : group.canCreate ? (
                <div className="text-center py-6">
                  <div className="mx-auto h-12 w-12 text-gray-400">
                    <PhoneIcon className="h-12 w-12" />
                  </div>
                  <h3 className="mt-2 text-sm font-semibold text-gray-900">No phone methods</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by creating a new phone method.</p>
                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={() => handleAddClick(group)}
                      className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                      <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                      Create Phone Method
                    </button>
                  </div>
                </div>
              ) : null
            ) : (
              group.methods.length > 0 ? (
                <ul role="list" className="space-y-4">
                  {group.methods.map((method) => {
                    const Icon = methodIcons[method.type as DeliveryMethodType];
                    const isHovered = hoveredMethod === method.id;
                    const isEditing = editingMethod?.id === method.id;
                    const config = getMethodConfig(method);

                    return (
                      <li
                        key={method.id}
                        className={`relative flex justify-between gap-x-6 py-5 px-4 transition-colors duration-200
                          ${isHovered || isEditing ? 'bg-gray-50 rounded-lg' : 'hover:bg-gray-50 hover:rounded-lg'}
                          ${isEditing ? 'ring-2 ring-indigo-500 rounded-lg' : ''}
                        `}
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
                            <div className="mt-1 flex items-center text-xs leading-5 text-gray-500 relative">
                              {method.type === 'EMAIL' && (
                                <>
                                  <EnvelopeIcon className="inline-block h-3 w-3 mr-1 flex-shrink-0" />
                                  <span className="truncate">{config.email}</span>
                                  <CopyButton text={config.email} methodId={method.id} />
                                </>
                              )}
                              {method.type === 'DOVEAPP' && config.doveNumber && (
                                <>
                                  <BellIcon className="inline-block h-3 w-3 mr-1 flex-shrink-0" />
                                  <span className="truncate">
                                    Dove #: {config.doveNumber}
                                  </span>
                                  <CopyButton text={config.doveNumber} methodId={method.id} />
                                </>
                              )}
                              {method.type === 'TEXT' && (
                                <>
                                  <PhoneIcon className="inline-block h-3 w-3 mr-1 flex-shrink-0" />
                                  <span className="truncate">{config.phoneNumber}</span>
                                  <CopyButton text={config.phoneNumber} methodId={method.id} />
                                </>
                              )}
                              {method.type === 'VOICE' && (
                                <>
                                  <PhoneIcon className="inline-block h-3 w-3 mr-1 flex-shrink-0" />
                                  <span className="truncate">{config.phoneNumber}</span>
                                  <CopyButton text={config.phoneNumber} methodId={method.id} />
                                </>
                              )}
                              {method.type === 'WEBHOOK' && (
                                <>
                                  <GlobeAltIcon className="inline-block h-3 w-3 mr-1 flex-shrink-0" />
                                  <span className="truncate">{config.webhookUrl}</span>
                                  <CopyButton text={config.webhookUrl} methodId={method.id} />
                                </>
                              )}
                              {method.type === 'PLUGIN' && (
                                <>
                                  <PuzzlePieceIcon className="inline-block h-3 w-3 mr-1 flex-shrink-0" />
                                  <span className="truncate">Plugin ID: {config.pluginId}</span>
                                  <CopyButton text={config.pluginId} methodId={method.id} />
                                </>
                              )}
                            </div>
                            {method.description && (
                              <p className="mt-1 text-xs text-gray-500 line-clamp-2">{method.description}</p>
                            )}
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
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleVerify(method);
                                }}
                                className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-gray-900 shadow-sm 
                                  ring-1 ring-inset ring-gray-300 hover:bg-gray-50
                                  relative z-10 transition-all duration-200"
                              >
                                Verify
                              </button>
                            )}
                            {!method.isDefault && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleSetDefault(method);
                                }}
                                className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-gray-900 shadow-sm 
                                  ring-1 ring-inset ring-gray-300 hover:bg-gray-50
                                  relative z-10 transition-all duration-200"
                              >
                                Set Default
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleEdit(method);
                              }}
                              className={`rounded-full bg-white p-1 text-gray-900 shadow-sm ring-1 ring-inset 
                                ${isEditing ? 'ring-indigo-500 text-indigo-600' : 'ring-gray-300 hover:bg-gray-50'}
                                relative z-10 transition-all duration-200`}
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              disabled={method.type === 'DOVEAPP'}
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDelete(method);
                              }}
                              className={`rounded-full bg-white p-1 shadow-sm ring-1 ring-inset
                                relative z-10 transition-all duration-200
                                ${method.type === 'DOVEAPP' 
                                  ? 'text-gray-300 ring-gray-200 cursor-not-allowed' 
                                  : 'text-gray-900 ring-gray-300 hover:bg-gray-50'}`}
                              title={method.type === 'DOVEAPP' ? 'DoveApp methods cannot be deleted' : 'Delete delivery method'}
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : group.canCreate ? (
                <div className="text-center py-6">
                  <div className="mx-auto h-12 w-12 text-gray-400">
                    {(() => {
                      const Icon = methodIcons[group.types[0]];
                      return <Icon className="h-12 w-12" />;
                    })()}
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
              ) : null
            )}
          </div>
        ))}
      </div>

      <DeliveryMethodModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingMethod(null);
        }}
        onSubmit={handleSubmit}
        editingMethod={editingMethod}
        group={methodGroup}
      />
      {error && (
        <div className="mt-4 text-sm text-red-500">{error}</div>
      )}
    </>
  );
}
