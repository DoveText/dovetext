import { DeliveryMethod } from './delivery-method';

export interface StageDeliveryMethod {
  id?: string;
  methodId: string;
  methodName?: string;
}

export interface EscalationStage {
  id?: string;
  name: string;
  stageOrder: number;
  waitDurationSeconds: number;
  maxAttempts: number;
  retryIntervalSeconds: number;
  deliveryMethods: StageDeliveryMethod[];
  createdAt?: string;
  updatedAt?: string;
}

export interface EscalationChain {
  id?: string;
  name: string;
  description?: string;
  isActive: boolean;
  stages: EscalationStage[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateEscalationChainRequest {
  name: string;
  description?: string;
  stages: Omit<EscalationStage, 'id' | 'createdAt' | 'updatedAt'>[];
}

export interface UpdateEscalationChainRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
  stages?: Omit<EscalationStage, 'id' | 'createdAt' | 'updatedAt'>[];
}
