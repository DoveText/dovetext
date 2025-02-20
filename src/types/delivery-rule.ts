import { DeliveryMethod } from './delivery-method';
import { DeliveryChannel } from './delivery-channel';
import { EscalationChain } from './escalation-chain';

export interface DeliveryRule {
  id: string;
  name: string;
  description?: string;
  priority: number;
  methodIds: string[];  // Array of delivery method IDs
  channelIds: string[]; // Array of delivery channel IDs
  chainIds: string[];   // Array of escalation chain IDs
  methods?: DeliveryMethod[];    // Populated when loading
  channels?: DeliveryChannel[];  // Populated when loading
  chains?: EscalationChain[];    // Populated when loading
  timeslot: {
    startTime: string;  // HH:mm format
    endTime: string;    // HH:mm format
    daysOfWeek: number[];  // 0-6, where 0 is Sunday
    timezone: string;
  };
  conditions: Record<string, any>;  // Match conditions for notifications
  settings: {
    isActive: boolean;
    [key: string]: any;  // Other settings
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateDeliveryRuleRequest {
  name: string;
  description?: string;
  priority: number;
  methodIds: string[];
  channelIds: string[];
  chainIds: string[];
  timeslot: {
    startTime: string;
    endTime: string;
    daysOfWeek: number[];
    timezone: string;
  };
  conditions: Record<string, any>;
  settings?: {
    isActive?: boolean;
    [key: string]: any;
  };
}

export interface UpdateDeliveryRuleRequest {
  name?: string;
  description?: string;
  priority?: number;
  methodIds?: string[];
  channelIds?: string[];
  chainIds?: string[];
  timeslot?: {
    startTime: string;
    endTime: string;
    daysOfWeek: number[];
    timezone: string;
  };
  conditions?: Record<string, any>;
  settings?: {
    isActive?: boolean;
    [key: string]: any;
  };
}
