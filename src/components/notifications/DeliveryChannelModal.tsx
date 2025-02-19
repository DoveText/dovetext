import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { DeliveryChannel, DeliveryChannelType } from '@/types/delivery-channel';
import { deliveryChannelsApi } from '@/api/delivery-channels';

interface DeliveryChannelModalProps {
  channel?: DeliveryChannel | null;
  onClose: () => void;
  onSave: () => void;
}

export default function DeliveryChannelModal({
  channel,
  onClose,
  onSave,
}: DeliveryChannelModalProps) {
  const [name, setName] = useState(channel?.name || '');
  const [type, setType] = useState<DeliveryChannelType>(channel?.type || 'EMAIL');
  const [description, setDescription] = useState(channel?.description || '');
  const [settings, setSettings] = useState(channel?.settings || '{}');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      // Validate settings JSON
      JSON.parse(settings);

      if (channel) {
        await deliveryChannelsApi.update(channel.id, {
          name,
          type,
          description,
          settings,
        });
      } else {
        await deliveryChannelsApi.create({
          name,
          type,
          description,
          settings,
        });
      }
      onSave();
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError('Invalid JSON format in settings');
      } else {
        setError('Failed to save channel');
        console.error(err);
      }
    }
  };

  return (
    <Dialog
      open={true}
      onClose={onClose}
      className="fixed inset-0 z-10 overflow-y-auto"
    >
      <div className="min-h-screen px-4 text-center">
        <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
        <span className="inline-block h-screen align-middle" aria-hidden="true">
          &#8203;
        </span>
        <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          <Dialog.Title
            as="h3"
            className="text-lg font-medium leading-6 text-gray-900"
          >
            {channel ? 'Edit Channel' : 'Create Channel'}
          </Dialog.Title>

          <form onSubmit={handleSubmit} className="mt-4">
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
              </div>

              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                  Type
                </label>
                <select
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value as DeliveryChannelType)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="EMAIL">Email</option>
                  <option value="SLACK">Slack</option>
                  <option value="WEBHOOK">Webhook</option>
                  <option value="SMS">SMS</option>
                </select>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="settings" className="block text-sm font-medium text-gray-700">
                  Settings (JSON)
                </label>
                <textarea
                  id="settings"
                  value={settings}
                  onChange={(e) => setSettings(e.target.value)}
                  rows={6}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm font-mono"
                  required
                />
              </div>

              {error && (
                <div className="text-sm text-red-600">
                  {error}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {channel ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Dialog>
  );
}
