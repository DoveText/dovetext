import { DeliveryMethod } from './delivery-method';
import { EscalationChain } from './escalation-chain';

export interface DeliveryRuleTarget {
  id?: string;
  methodId?: string;
  chainId?: string;
  method?: DeliveryMethod;  // Populated when loading
  chain?: EscalationChain;  // Populated when loading
  startTime: string;  // HH:mm format
  endTime: string;   // HH:mm format
  daysOfWeek: number[];  // 0-6, where 0 is Sunday
  timezone: string;
  priority: number;
}

export interface DeliveryRule {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  conditions: Record<string, any>;  // JSON object for conditions
  targets: DeliveryRuleTarget[];
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDeliveryRuleRequest {
  name: string;
  description?: string;
  conditions: Record<string, any>;
  targets: Omit<DeliveryRuleTarget, 'id' | 'method' | 'chain'>[];
  priority?: number;
}

export interface UpdateDeliveryRuleRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
  conditions?: Record<string, any>;
  targets?: Omit<DeliveryRuleTarget, 'id' | 'method' | 'chain'>[];
  priority?: number;
}
