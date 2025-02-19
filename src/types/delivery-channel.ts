export interface DeliveryChannel {
  id: number;
  name: string;
  type: DeliveryChannelType;
  description: string;
  settings: string;
  createdAt: string;
  updatedAt: string;
}

export type DeliveryChannelType = 'EMAIL' | 'SLACK' | 'WEBHOOK' | 'SMS';

export interface CreateDeliveryChannelRequest {
  name: string;
  type: DeliveryChannelType;
  description?: string;
  settings: string;
}
