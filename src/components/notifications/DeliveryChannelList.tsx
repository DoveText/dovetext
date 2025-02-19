import { useState } from 'react';
import { DeliveryChannel, DeliveryChannelType } from '@/types/delivery-channel';
import { 
  EnvelopeIcon, 
  GlobeAltIcon,
  PhoneIcon,
  ChatBubbleLeftIcon,
  TrashIcon,
  PencilIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import DeliveryChannelModal from './DeliveryChannelModal';
import { deliveryChannelsApi } from '@/api/delivery-channels';
import ConfirmDialog from '@/components/common/ConfirmDialog';

interface DeliveryChannelListProps {
  channels: DeliveryChannel[];
  onChannelsChange: () => void;
}

const channelIcons: Record<DeliveryChannelType, React.ComponentType<any>> = {
  EMAIL: EnvelopeIcon,
  SLACK: ChatBubbleLeftIcon,
  WEBHOOK: GlobeAltIcon,
  SMS: PhoneIcon,
};

export default function DeliveryChannelList({
  channels,
  onChannelsChange,
}: DeliveryChannelListProps) {
  const [hoveredChannel, setHoveredChannel] = useState<string | null>(null);
  const [editingChannel, setEditingChannel] = useState<DeliveryChannel | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [channelToDelete, setChannelToDelete] = useState<DeliveryChannel | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleEdit = (channel: DeliveryChannel) => {
    setEditingChannel(channel);
    setShowModal(true);
  };

  const handleDelete = async (channel: DeliveryChannel) => {
    try {
      await deliveryChannelsApi.delete(channel.id);
      onChannelsChange();
    } catch (error) {
      console.error('Failed to delete channel:', error);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingChannel(null);
  };

  const handleModalSave = async () => {
    onChannelsChange();
    handleModalClose();
  };

  const handleConfirmDelete = () => {
    if (channelToDelete) {
      handleDelete(channelToDelete);
    }
    setShowDeleteConfirm(false);
    setChannelToDelete(null);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setChannelToDelete(null);
  };

  return (
    <div>
      <div className="mt-4 divide-y divide-gray-200">
        {channels.map((channel) => {
          const Icon = channelIcons[channel.type];
          const isHovered = hoveredChannel === channel.id.toString();

          return (
            <div
              key={channel.id}
              className="flex items-center py-4 hover:bg-gray-50"
              onMouseEnter={() => setHoveredChannel(channel.id.toString())}
              onMouseLeave={() => setHoveredChannel(null)}
            >
              <div className="flex-shrink-0 mr-4">
                <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-gray-100">
                  <Icon className="h-6 w-6 text-gray-600" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      {channel.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {channel.description || 'No description'}
                    </p>
                  </div>
                  <div className={`flex space-x-2 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                    <button
                      type="button"
                      onClick={() => handleEdit(channel)}
                      className="p-1 rounded-md hover:bg-gray-200"
                    >
                      <PencilIcon className="h-5 w-5 text-gray-500" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setChannelToDelete(channel);
                        setShowDeleteConfirm(true);
                      }}
                      className="p-1 rounded-md hover:bg-gray-200"
                    >
                      <TrashIcon className="h-5 w-5 text-gray-500" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="mt-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <PlusIcon className="h-5 w-5 mr-2" />
        Add Channel
      </button>

      {showModal && (
        <DeliveryChannelModal
          channel={editingChannel}
          onClose={handleModalClose}
          onSave={handleModalSave}
        />
      )}

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Channel"
        message="Are you sure you want to delete this channel? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonClassName="bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500"
      />
    </div>
  );
}
