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

export const TIME_OPTIONS = [
  '00:00', '00:30', '01:00', '01:30', '02:00', '02:30', '03:00', '03:30',
  '04:00', '04:30', '05:00', '05:30', '06:00', '06:30', '07:00', '07:30',
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00', '23:30'
] as const;

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
