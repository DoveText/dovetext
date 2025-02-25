import { useState } from 'react';
import { DeliveryChannel, DeliveryChannelType } from '@/types/delivery-channel';
import { 
  TrashIcon,
  PencilIcon,
  PlusIcon,
  BellAlertIcon,
  ClockIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import DeliveryChannelModal from './DeliveryChannelModal';
import { deliveryChannelsApi } from '@/app/api/delivery-channels';
import ConfirmDialog from '@/components/common/ConfirmDialog';

export interface DeliveryChannelListProps {
  channels: DeliveryChannel[];
  onChannelsChange: () => void;
}

export const channelIcons: Record<DeliveryChannelType, React.ComponentType<any>> = {
  SIMPLE: BellAlertIcon,
  TIME_BASED: ClockIcon,
};

// Helper function to get descriptive text for channel type
export function getChannelTypeDescription(type: DeliveryChannelType): string {
  return type === 'TIME_BASED' 
    ? 'A time-based channel'
    : 'A simple channel';
}

function ChannelCard({ 
  channel, 
  onEdit, 
  onDelete 
}: { 
  channel: DeliveryChannel;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const Icon = channelIcons[channel.type];

  return (
    <div className="bg-white border rounded-lg shadow-sm hover:shadow transition-all duration-200">
      <div className="relative flex justify-between gap-x-6 py-5 px-4">
        <div className="flex min-w-0 gap-x-4">
          <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-gray-50">
            {Icon && <Icon className="h-6 w-6 text-gray-600" aria-hidden="true" />}
          </div>
          <div className="min-w-0 flex-auto">
            <div className="flex items-center gap-x-2">
              <p className="text-sm font-semibold leading-6 text-gray-900">{channel.name}</p>
              <span className="text-xs text-gray-500">{getChannelTypeDescription(channel.type)}</span>
            </div>
            {channel.description && (
              <p className="mt-1 text-xs text-gray-500 line-clamp-2">{channel.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-x-4">
          <div className="flex gap-x-2">
            <button
              type="button"
              className="rounded p-1 hover:bg-gray-100 group relative"
            >
              <InformationCircleIcon className="h-5 w-5 text-gray-400" />
            </button>
            <button
              type="button"
              onClick={onEdit}
              className="rounded p-1 hover:bg-gray-100 group relative"
            >
              <PencilIcon className="h-5 w-5 text-gray-400" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="rounded p-1 hover:bg-gray-100 group relative"
            >
              <TrashIcon className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DeliveryChannelList({
  channels,
  onChannelsChange,
}: DeliveryChannelListProps) {
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
      <div className="mt-4 space-y-2">
        {channels.map((channel) => (
          <ChannelCard
            key={channel.id}
            channel={channel}
            onEdit={() => handleEdit(channel)}
            onDelete={() => {
              setChannelToDelete(channel);
              setShowDeleteConfirm(true);
            }}
          />
        ))}
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
