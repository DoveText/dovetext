import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { DeliveryChannel, DeliveryChannelType } from '@/types/delivery-channel';
import { deliveryChannelsApi } from '@/api/delivery-channels';
import Select from '@/components/common/Select';
import { FormField, FormInput, FormTextArea } from '@/components/common/form';

interface DeliveryChannelModalProps {
  channel?: DeliveryChannel | null;
  onClose: () => void;
  onSave: () => void;
}

const channelTypeOptions = [
  { value: 'EMAIL' as DeliveryChannelType, label: 'Email' },
  { value: 'SLACK' as DeliveryChannelType, label: 'Slack' },
  { value: 'WEBHOOK' as DeliveryChannelType, label: 'Webhook' },
  { value: 'SMS' as DeliveryChannelType, label: 'SMS' },
];

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
    <Transition.Root show={true} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={() => {}}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden bg-white px-4 pb-4 pt-5 text-left transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <form onSubmit={handleSubmit}>
                  <div>
                    <div className="mt-3 sm:mt-5">
                      <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                        {channel ? 'Edit Channel' : 'Add Channel'}
                      </Dialog.Title>

                      <div className="mt-4 space-y-6">
                        <FormField label="Name" htmlFor="name">
                          <FormInput
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter a name for this channel"
                            required
                          />
                        </FormField>

                        <FormField label="Type" htmlFor="type">
                          <Select
                            id="type"
                            value={type}
                            onChange={setType}
                            options={channelTypeOptions}
                          />
                        </FormField>

                        <FormField label="Description" htmlFor="description">
                          <FormTextArea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            placeholder="Enter a description for this channel"
                          />
                        </FormField>

                        <FormField label="Settings (JSON)" htmlFor="settings" error={error}>
                          <FormTextArea
                            id="settings"
                            value={settings}
                            onChange={(e) => setSettings(e.target.value)}
                            rows={6}
                            className="font-mono"
                            placeholder="{}"
                            required
                          />
                        </FormField>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-end gap-x-6">
                    <button
                      type="button"
                      onClick={onClose}
                      className="text-sm font-semibold leading-6 text-gray-900"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="inline-flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                      {channel ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
