export interface RecurrencePattern {
  daysOfWeek?: number[];  // For weekly (0-6, where 0 is Sunday)
  dayOfMonth?: number;    // For monthly (1-31)
  dayOfWeek?: number;     // For monthly (0-6)
  weekOfMonth?: number;   // For monthly (1-5, where 5 means "last")
  month?: number;         // For yearly (0-11)
  day?: number;           // For yearly (1-31)
}

export interface RecurrenceRule {
  type: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  interval: number;
  pattern?: RecurrencePattern;
  count?: number;
  until?: number; // Epoch time in seconds (long)
}

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
  isRecurring?: boolean;
  recurrenceRule?: RecurrenceRule;
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
  isRecurring?: boolean;
  recurrenceRule?: RecurrenceRule;
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
  isRecurring?: boolean;
  recurrenceRule?: RecurrenceRule;
}
