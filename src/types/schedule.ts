export interface Schedule {
  id: string;
  title: string;
  start: number; // Epoch time in seconds (long)
  end: number;   // Epoch time in seconds (long)
  isAllDay: boolean;
  type: 'event' | 'reminder' | 'all-day';
  location?: string;
  description?: string;
  color?: string;
  userId: string;
  createdAt: number; // Epoch time in seconds (long)
  updatedAt: number; // Epoch time in seconds (long)
}

export interface CreateScheduleRequest {
  title: string;
  start: number; // Epoch time in seconds (long)
  end: number;   // Epoch time in seconds (long)
  isAllDay: boolean;
  type: 'event' | 'reminder' | 'all-day';
  location?: string;
  description?: string;
  color?: string;
}

export interface UpdateScheduleRequest {
  title?: string;
  start?: number; // Epoch time in seconds (long)
  end?: number;   // Epoch time in seconds (long)
  isAllDay?: boolean;
  type?: 'event' | 'reminder' | 'all-day';
  location?: string;
  description?: string;
  color?: string;
}
