export type DeliveryMethodType = 'DOVEAPP' | 'EMAIL' | 'TEXT' | 'VOICE' | 'WEBHOOK' | 'PLUGIN';

export type DeliveryMethodStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'FAILED';

export type PluginType = 'SLACK' | 'TELEGRAM' | 'CUSTOM_WEBHOOK';

export interface WebhookConfig {
  url: string;
  method: string;
  headers: Record<string, string>;
  payload?: string;
}

export interface PluginConfig {
  type: PluginType;
  // Dove App specific
  doveNumber?: string;
  // Slack specific
  slackWebhookUrl?: string;
  slackChannel?: string;
  // Telegram specific
  telegramBotToken?: string;
  telegramChatId?: string;
  // Custom webhook
  webhook?: WebhookConfig;
}

export interface PhoneConfig {
  phoneNumber: string;
  countryCode: string;
  enableText: boolean;
  enableVoice: boolean;
}

export interface DeliveryMethod {
  id: string;
  type: DeliveryMethodType;
  name: string;
  description?: string;
  status: DeliveryMethodStatus;
  config: {
    email?: string;
    phone?: PhoneConfig;
    plugin?: PluginConfig;
  };
  createdAt: string;
  updatedAt: string;
  isDefault?: boolean;
  isVerified: boolean;
}

export interface CreateDeliveryMethodRequest {
  type: DeliveryMethodType;
  name: string;
  description?: string;
  config: {
    email?: string;
    phone?: PhoneConfig;
    plugin?: PluginConfig;
  };
}

export interface UpdateDeliveryMethodRequest {
  name?: string;
  description?: string;
  status?: DeliveryMethodStatus;
  config?: {
    email?: string;
    phone?: PhoneConfig;
    plugin?: PluginConfig;
  };
  isDefault?: boolean;
}
