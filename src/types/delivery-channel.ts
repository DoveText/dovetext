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
  timeslot: TimeSlot;
  settings: string;
}

export interface TimeSlot {
  ranges: TimeRange[];
}

export interface TimeRange {
  dayOfWeek: number; // 0-6 (Sunday to Saturday)
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
}

export interface CreateDeliveryChannelRequest {
  name: string;
  type: DeliveryChannelType;
  description?: string;
  settings: string;
  slots: Omit<DeliveryChannelSlot, 'id' | 'channelId'>[];
}

// Helper function to create an empty time slot (24/7)
export function createEmptyTimeSlot(): TimeSlot {
  const ranges: TimeRange[] = [];
  for (let day = 0; day < 7; day++) {
    ranges.push({
      dayOfWeek: day,
      startTime: '00:00',
      endTime: '23:59',
    });
  }
  return { ranges };
}

// Helper function to create a fallback slot (for unselected time ranges)
export function createFallbackSlot(): DeliveryChannelSlot {
  return {
    methodIds: [],
    timeslot: createEmptyTimeSlot(),
    settings: '{}',
  };
}

// Helper function to create an initial simple channel slot
export function createSimpleChannelSlot(): DeliveryChannelSlot {
  return {
    methodIds: [],
    timeslot: createEmptyTimeSlot(),
    settings: '{}',
  };
}
