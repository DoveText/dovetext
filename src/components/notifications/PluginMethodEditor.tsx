import { useState } from 'react';
import Select from '@/components/common/Select';
import EditableSelect, { EditableSelectOption } from '../common/EditableSelect';
import { PluginType, WebhookConfig, PluginConfig } from '@/types/delivery-method';
import { TrashIcon } from '@heroicons/react/24/outline';
import { FormField } from '@/components/common/form';

interface PluginEditorProps {
  config: PluginConfig;
  onChange: (config: PluginConfig) => void;
  isEditing?: boolean;
  validationErrors?: Record<string, string>;
}

const pluginTypes: { value: PluginType; label: string }[] = [
  { value: 'SLACK', label: 'Slack' },
  { value: 'TELEGRAM', label: 'Telegram' },
  { value: 'CUSTOM_WEBHOOK', label: 'Custom Webhook' },
];

const commonHeaderOptions: EditableSelectOption[] = [
  { value: 'Authorization', label: 'Authorization' },
  { value: 'Content-Type', label: 'Content-Type' },
  { value: 'Accept', label: 'Accept' },
  { value: 'User-Agent', label: 'User-Agent' },
  { value: 'X-API-Key', label: 'X-API-Key' },
  { value: 'X-Request-ID', label: 'X-Request-ID' },
];

export default function PluginEditor({ config, onChange, isEditing, validationErrors = {} }: PluginEditorProps) {
  const [headerKeys, setHeaderKeys] = useState<string[]>(Object.keys(config.webhook?.headers || {}));
  
  // Ensure webhook property is initialized
  const ensuredWebhook: WebhookConfig = config.webhook || {
    url: '',
    method: 'POST',
    headers: {},
    payload: ''
  };

  return (
    <div className="space-y-4">
      <FormField label="Plugin Type" error={validationErrors.type}>
        <Select
          value={config.type}
          onChange={(value) => onChange({
            ...config,
            type: value as PluginType,
            // Reset other fields when type changes
            slackWebhookUrl: '',
            slackChannel: '',
            telegramBotToken: '',
            telegramChatId: '',
            webhook: {
              url: '',
              method: 'POST',
              headers: {},
              payload: ''
            }
          })}
          options={pluginTypes}
          disabled={isEditing}
          className="mt-2"
        />
      </FormField>

      {config.type === 'SLACK' && (
        <div className="space-y-4 rounded-md bg-gray-50 px-4 py-4">
          <div>
            <label className="block text-sm font-medium leading-6 text-gray-900">Webhook URL</label>
            <input
              type="url"
              required
              value={config.slackWebhookUrl}
              onChange={(e) => onChange({
                ...config,
                slackWebhookUrl: e.target.value
              })}
              className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              placeholder="https://hooks.slack.com/services/..."
            />
            {validationErrors.webhook && (
              <p className="mt-2 text-sm text-red-500">{validationErrors.webhook}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium leading-6 text-gray-900">Channel (Optional)</label>
            <input
              type="text"
              value={config.slackChannel || ''}
              onChange={(e) => onChange({
                ...config,
                slackChannel: e.target.value
              })}
              className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              placeholder="#general"
            />
          </div>
        </div>
      )}

      {config.type === 'TELEGRAM' && (
        <div className="space-y-4 rounded-md bg-gray-50 px-4 py-4">
          <div>
            <label className="block text-sm font-medium leading-6 text-gray-900">Bot Token</label>
            <input
              type="text"
              required
              value={config.telegramBotToken}
              onChange={(e) => onChange({
                ...config,
                telegramBotToken: e.target.value
              })}
              className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
            />
            <p className="mt-2 text-sm text-gray-500">
              Create a bot and get the token from @BotFather
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium leading-6 text-gray-900">Chat ID</label>
            <input
              type="text"
              required
              value={config.telegramChatId}
              onChange={(e) => onChange({
                ...config,
                telegramChatId: e.target.value
              })}
              className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              placeholder="-100123456789"
            />
            <p className="mt-2 text-sm text-gray-500">
              Add the bot to a group/channel and get the chat ID
            </p>
          </div>
        </div>
      )}

      {config.type === 'CUSTOM_WEBHOOK' && (
        <div className="space-y-4">
          <FormField label="Webhook URL" error={validationErrors.webhookUrl}>
            <input
              type="text"
              value={config.webhook?.url || ''}
              onChange={(e) => onChange({
                ...config,
                webhook: {
                  url: e.target.value,
                  method: config.webhook?.method || 'POST',
                  headers: config.webhook?.headers || {},
                  payload: config.webhook?.payload || ''
                }
              })}
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              placeholder="https://example.com/webhook"
            />
          </FormField>

          <FormField label="HTTP Method" error={validationErrors.webhookMethod}>
            <Select
              value={config.webhook?.method || 'POST'}
              onChange={(value) => onChange({
                ...config,
                webhook: {
                  url: config.webhook?.url || '',
                  method: value,
                  headers: config.webhook?.headers || {},
                  payload: config.webhook?.payload || ''
                }
              })}
              options={[
                { value: 'GET', label: 'GET' },
                { value: 'POST', label: 'POST' },
                { value: 'PUT', label: 'PUT' },
                { value: 'DELETE', label: 'DELETE' }
              ]}
            />
          </FormField>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium leading-6 text-gray-900">Headers</label>
            </div>
            <div className="mt-2 space-y-2">
              {headerKeys.map((headerKey) => {
                const value = config.webhook?.headers?.[headerKey] || '';
                return (
                  <div key={headerKey} className="flex gap-x-2 items-center">
                    <div className="w-1/3">
                      <EditableSelect
                        options={commonHeaderOptions}
                        value={headerKey}
                        onChange={(newKey) => {
                          if (newKey === headerKey) return;
                          
                          const currentHeaders = { ...config.webhook?.headers };
                          const currentValue = currentHeaders[headerKey];
                          delete currentHeaders[headerKey];
                          currentHeaders[newKey] = currentValue;

                          setHeaderKeys(prev => {
                            const index = prev.indexOf(headerKey);
                            const newKeys = [...prev];
                            newKeys[index] = newKey;
                            return newKeys;
                          });

                          onChange({
                            ...config,
                            webhook: {
                              ...config.webhook!,
                              headers: currentHeaders
                            }
                          });
                        }}
                        placeholder="Header name"
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => onChange({
                          ...config,
                          webhook: {
                            ...config.webhook!,
                            headers: {
                              ...config.webhook?.headers,
                              [headerKey]: e.target.value
                            }
                          }
                        })}
                        className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        placeholder="Header value"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newHeaders = { ...config.webhook?.headers };
                        delete newHeaders[headerKey];

                        setHeaderKeys(prev => prev.filter(key => key !== headerKey));
                        onChange({
                          ...config,
                          webhook: {
                            ...config.webhook!,
                            headers: newHeaders
                          }
                        });
                      }}
                      className="inline-flex items-center rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
                    >
                      <TrashIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>
                );
              })}
              {headerKeys.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No headers added yet. Click &quot;Add Header&quot; to add one.
                </p>
              )}
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => {
                    const newKey = '';  // Empty key by default
                    setHeaderKeys(prev => [...prev, newKey]);
                    
                    onChange({
                      ...config,
                      webhook: {
                        ...config.webhook || {
                          url: '',
                          method: 'POST',
                          headers: {},
                          payload: '',
                        },
                        headers: {
                          ...(config.webhook?.headers || {}),
                          [newKey]: ''
                        }
                      }
                    });
                  }}
                  className="w-full rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                  Add Header
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium leading-6 text-gray-900">Payload Template (JSON)</label>
            <textarea
              value={config.webhook?.payload}
              onChange={(e) => onChange({
                ...config,
                webhook: { ...config.webhook!, payload: e.target.value }
              })}
              placeholder="{}"
              rows={4}
              className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 font-mono"
            />
          </div>
        </div>
      )}
    </div>
  );
}
