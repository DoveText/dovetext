import { TimeRange } from './time-range';

export interface EscalationStageSettings {
  waitDuration: number;
  maxAttempts: number;
  retryInterval: number;
  timeRange?: TimeRange | null;
}

export interface EscalationStage {
  id?: string;
  name: string;
  stageOrder: number;
  channelIds: string[];
  methodIds: string[];
  settings: EscalationStageSettings;
  createdAt?: string;
  updatedAt?: string;
}

export interface EscalationChain {
  id?: string;
  name: string;
  description?: string;
  type: 'staged' | 'timed';
  isActive?: boolean;
  stages: EscalationStage[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateEscalationChainRequest {
  name: string;
  description?: string;
  type: 'staged' | 'timed';
  stages: Omit<EscalationStage, 'id' | 'createdAt' | 'updatedAt'>[];
}

export interface UpdateEscalationChainRequest {
  name?: string;
  description?: string;
  type?: 'staged' | 'timed';
  isActive?: boolean;
  stages?: Omit<EscalationStage, 'id' | 'createdAt' | 'updatedAt'>[];
}
