// Define our own icon type since we don't have access to the Icon component
export type IconName = 'mail' | 'chat' | 'phone' | 'code' | string;

export interface ConfigField {
  name: string;
  type: 'text' | 'email' | 'url' | 'phone' | 'password' | 'select' | 'boolean' | 'keyValuePairs';
  label: string;
  required?: boolean;
  defaultValue?: any;
  options?: string[];
  conditionalOn?: string | { field: string; value: any };
  placeholder?: string;
  description?: string;
}

export interface DeliveryMethodType {
  id: string;
  label: string;
  icon: IconName;
  configFields: ConfigField[];
  generateDescription: (config: any) => string;
}

export const DELIVERY_METHOD_TYPES: Record<string, DeliveryMethodType> = {
  // EMAIL
  EMAIL: {
    id: 'EMAIL',
    label: 'Email',
    icon: 'mail',
    configFields: [
      { name: 'email', type: 'email', required: true, label: 'Email Address', placeholder: 'recipient@example.com' },
      { name: 'format', type: 'select', options: ['html', 'text'], defaultValue: 'html', label: 'Format' },
      { name: 'enableReply', type: 'boolean', defaultValue: false, label: 'Enable Reply' },
      { name: 'replyToAddress', type: 'email', conditionalOn: 'enableReply', label: 'Reply-To Address', placeholder: 'replies@example.com' }
    ],
    generateDescription: (config) => `Email notification to ${config.email}`
  },
  
  // SLACK
  SLACK: {
    id: 'SLACK',
    label: 'Slack',
    icon: 'chat',
    configFields: [
      { name: 'webhookUrl', type: 'url', required: true, label: 'Webhook URL', placeholder: 'https://hooks.slack.com/services/...' },
      { name: 'channel', type: 'text', defaultValue: '#general', label: 'Channel', placeholder: '#channel or @username' },
      { name: 'username', type: 'text', defaultValue: 'Dove Text', label: 'Username' },
      { name: 'iconEmoji', type: 'text', defaultValue: ':dove:', label: 'Emoji Icon', placeholder: ':emoji:' }
    ],
    generateDescription: (config) => `Slack notification to ${config.channel || '#general'}`
  },
  
  // TEXT/SMS
  TEXT: {
    id: 'TEXT',
    label: 'Text Message (SMS)',
    icon: 'phone',
    configFields: [
      { name: 'phoneNumber', type: 'phone', required: true, label: 'Phone Number', placeholder: '+1234567890' },
      { name: 'provider', type: 'select', options: ['TWILIO', 'BANDWIDTH', 'AWS'], defaultValue: 'TWILIO', label: 'Provider' },
      { name: 'enableReply', type: 'boolean', defaultValue: false, label: 'Enable Reply' },
      { name: 'replyCallbackUrl', type: 'url', conditionalOn: 'enableReply', label: 'Reply Callback URL', placeholder: 'https://your-app.com/api/sms-replies' }
    ],
    generateDescription: (config) => `Text message to ${config.phoneNumber}`
  },
  
  // VOICE
  VOICE: {
    id: 'VOICE',
    label: 'Voice Call',
    icon: 'phone',
    configFields: [
      { name: 'phoneNumber', type: 'phone', required: true, label: 'Phone Number', placeholder: '+1234567890' },
      { name: 'provider', type: 'select', options: ['TWILIO', 'BANDWIDTH'], defaultValue: 'TWILIO', label: 'Provider' },
      { name: 'language', type: 'select', options: ['en-US', 'en-GB', 'es-ES', 'fr-FR', 'de-DE'], defaultValue: 'en-US', label: 'Language' },
      { name: 'voice', type: 'select', options: ['male', 'female'], defaultValue: 'female', label: 'Voice' },
      { name: 'enableActions', type: 'boolean', defaultValue: false, label: 'Enable User Actions' },
      { name: 'actionCallbackUrl', type: 'url', conditionalOn: 'enableActions', label: 'Action Callback URL', placeholder: 'https://your-app.com/api/voice-actions' }
    ],
    generateDescription: (config) => `Voice call to ${config.phoneNumber}`
  },
  
  // WEBHOOK
  WEBHOOK: {
    id: 'WEBHOOK',
    label: 'Webhook',
    icon: 'code',
    configFields: [
      { name: 'url', type: 'url', required: true, label: 'Webhook URL', placeholder: 'https://api.example.com/webhook' },
      { name: 'method', type: 'select', options: ['GET', 'POST', 'PUT'], defaultValue: 'POST', label: 'HTTP Method' },
      { name: 'contentType', type: 'select', options: ['application/json', 'application/x-www-form-urlencoded', 'text/plain'], defaultValue: 'application/json', label: 'Content Type' },
      { name: 'authType', type: 'select', options: ['none', 'basic', 'bearer', 'custom'], defaultValue: 'none', label: 'Authentication Type' },
      { name: 'username', type: 'text', conditionalOn: { field: 'authType', value: 'basic' }, label: 'Username' },
      { name: 'password', type: 'password', conditionalOn: { field: 'authType', value: 'basic' }, label: 'Password' },
      { name: 'bearerToken', type: 'password', conditionalOn: { field: 'authType', value: 'bearer' }, label: 'Bearer Token' }
    ],
    generateDescription: (config) => `Webhook notification to ${config.url}`
  }
};

// Helper function to format a request for any delivery method type
export function formatMethodRequest(type: string, request: any): any {
  const methodType = DELIVERY_METHOD_TYPES[type];
  if (!methodType) throw new Error(`Unsupported method type: ${type}`);
  
  // Base request structure
  const formattedRequest = {
    name: request.name || `${methodType.label} Notification`,
    type: type,
    description: methodType.generateDescription(request),
    config: {} as Record<string, any>
  };
  
  // Format config based on method type definition
  methodType.configFields.forEach(field => {
    if (request[field.name] !== undefined) {
      formattedRequest.config[field.name] = request[field.name];
    } else if (field.defaultValue !== undefined) {
      formattedRequest.config[field.name] = field.defaultValue;
    }
  });
  
  return formattedRequest;
}
