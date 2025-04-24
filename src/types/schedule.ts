export interface Schedule {
  id: string;
  title: string;
  start: string; // ISO string format
  end: string;   // ISO string format
  isAllDay: boolean;
  type: 'event' | 'reminder' | 'all-day';
  location?: string;
  description?: string;
  color?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateScheduleRequest {
  title: string;
  start: string; // ISO string format
  end: string;   // ISO string format
  isAllDay: boolean;
  type: 'event' | 'reminder' | 'all-day';
  location?: string;
  description?: string;
  color?: string;
}

export interface UpdateScheduleRequest {
  title?: string;
  start?: string;
  end?: string;
  isAllDay?: boolean;
  type?: 'event' | 'reminder' | 'all-day';
  location?: string;
  description?: string;
  color?: string;
}
