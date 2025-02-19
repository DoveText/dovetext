import { TimeRange, createAllTimeRange } from './time-range';

export interface DeliveryChannel {
  id: number;
  name: string;
  type: DeliveryChannelType;
  description: string;
  settings: string;
  isDefault: boolean;
  slots: DeliveryChannelSlot[];
  createdAt: string;
  updatedAt: string;
}

export type DeliveryChannelType = 'SIMPLE' | 'TIME_BASED';

export interface DeliveryChannelSlot {
  id?: number;
  channelId?: number;
  methodIds: number[];
  timeslot: TimeRange;
  settings: string;
}

export interface CreateDeliveryChannelRequest {
  name: string;
  type: DeliveryChannelType;
  description?: string;
  settings: string;
  slots: Omit<DeliveryChannelSlot, 'id' | 'channelId'>[];
}

// Helper function to create a fallback slot (for unselected time ranges)
export function createFallbackSlot(): DeliveryChannelSlot {
  return {
    methodIds: [],
    timeslot: createAllTimeRange(),
    settings: '{}',
  };
}

// Helper function to create an initial simple channel slot
export function createSimpleChannelSlot(): DeliveryChannelSlot {
  return {
    methodIds: [],
    timeslot: createAllTimeRange(),
    settings: '{}',
  };
}
