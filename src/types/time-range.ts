export interface TimeRange {
  startTime: string;  // HH:mm format
  endTime: string;    // HH:mm format
  daysOfWeek: number[];  // 0-6, where 0 is Sunday
  timezone: string;
}

export const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
] as const;

export const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = (i % 2) * 30;
  const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  const label = new Date(`2000-01-01T${time}:00`).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
  return { value: time, label };
});
