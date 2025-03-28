export interface TimeRange {
  startTime: string | null;  // HH:mm format, null means start of day
  endTime: string | null;    // HH:mm format, null means end of day
  daysOfWeek: number[];  // 0-6, where 0 is Sunday, empty array means all days
  timezone: string;
}

// Constants for day values
export const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
] as const;

// Special values
export const ALL_DAYS = [] as number[]; // Empty array means all days
export const ALL_DAY_START = null; // null start time means 00:00
export const ALL_DAY_END = null; // null end time means 23:59

// Helper functions
export function isAllDays(daysOfWeek: number[]): boolean {
  return daysOfWeek.length === 0;
}

export function isAllDay(startTime: string | null, endTime: string | null): boolean {
  return startTime === null && endTime === null;
}

export function getEffectiveDays(daysOfWeek: number[]): number[] {
  return isAllDays(daysOfWeek) ? DAYS_OF_WEEK.map(d => d.value) : daysOfWeek;
}

export function getEffectiveTime(time: string | null, isStart: boolean): string {
  if (time === null) {
    return isStart ? '00:00' : '23:59';
  }
  return time;
}

export const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = (i % 2) * 30;
  const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  return {
    value: time,
    label: time,
  };
}) as const;

// Helper to create an "all time" range
export function createAllTimeRange(timezone: string = Intl.DateTimeFormat().resolvedOptions().timeZone): TimeRange {
  return {
    startTime: ALL_DAY_START,
    endTime: ALL_DAY_END,
    daysOfWeek: ALL_DAYS,
    timezone,
  };
}

// Helper to format time range for display
export function formatTimeRange(range: TimeRange): string {
  const days = isAllDays(range.daysOfWeek) 
    ? 'Every day' 
    : range.daysOfWeek.map(d => DAYS_OF_WEEK[d].label).join(', ');
    
  const times = isAllDay(range.startTime, range.endTime)
    ? 'All day'
    : `${getEffectiveTime(range.startTime, true)} - ${getEffectiveTime(range.endTime, false)}`;

  return `${days}, ${times}`;
}
