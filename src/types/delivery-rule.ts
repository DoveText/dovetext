import { DeliveryMethod } from './delivery-method';

export interface DeliveryRuleCondition {
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'matches';
  value: string;
}

export interface DeliveryRuleAction {
  methodId: string;
  method?: DeliveryMethod;  // Populated when loading
  priority: number;  // Lower number means higher priority
  retryCount?: number;
  retryInterval?: number;  // in seconds
}

export interface DeliveryRule {
  id: string;
  name: string;
  description?: string;
  isEnabled: boolean;
  conditions: DeliveryRuleCondition[];
  actions: DeliveryRuleAction[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateDeliveryRuleRequest {
  name: string;
  description?: string;
  conditions: DeliveryRuleCondition[];
  actions: Omit<DeliveryRuleAction, 'method'>[];
}

export interface UpdateDeliveryRuleRequest {
  name?: string;
  description?: string;
  isEnabled?: boolean;
  conditions?: DeliveryRuleCondition[];
  actions?: Omit<DeliveryRuleAction, 'method'>[];
}
