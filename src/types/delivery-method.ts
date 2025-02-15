export type DeliveryMethodType = 'DOVEAPP' | 'EMAIL' | 'TEXT' | 'VOICE' | 'WEBHOOK' | 'PLUGIN';

export type DeliveryMethodStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'FAILED';

export interface DeliveryMethod {
  id: string;
  type: DeliveryMethodType;
  name: string;
  status: DeliveryMethodStatus;
  config: {
    email?: string;
    phone?: string;
    webhookUrl?: string;
    pluginId?: string;
  };
  createdAt: string;
  updatedAt: string;
  isDefault?: boolean;
  isVerified: boolean;
}

export interface CreateDeliveryMethodRequest {
  type: DeliveryMethodType;
  name: string;
  config: {
    email?: string;
    phone?: string;
    webhookUrl?: string;
    pluginId?: string;
  };
}

export interface UpdateDeliveryMethodRequest {
  name?: string;
  status?: DeliveryMethodStatus;
  config?: {
    email?: string;
    phone?: string;
    webhookUrl?: string;
    pluginId?: string;
  };
  isDefault?: boolean;
}
