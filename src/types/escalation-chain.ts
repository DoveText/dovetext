import { DeliveryMethod } from './delivery-method';

export interface EscalationStep {
  id: string;
  methodId: string;
  method?: DeliveryMethod;  // Populated when loading
  waitTime: number;  // Time to wait before escalating to this step (in seconds)
  retryCount: number;  // Number of times to retry this step before escalating
  retryInterval: number;  // Time to wait between retries (in seconds)
}

export interface EscalationChain {
  id: string;
  name: string;
  description?: string;
  isEnabled: boolean;
  steps: EscalationStep[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateEscalationChainRequest {
  name: string;
  description?: string;
  steps: Omit<EscalationStep, 'id' | 'method'>[];
}

export interface UpdateEscalationChainRequest {
  name?: string;
  description?: string;
  isEnabled?: boolean;
  steps?: Omit<EscalationStep, 'id' | 'method'>[];
}
