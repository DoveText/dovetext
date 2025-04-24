import { Schedule } from '@/types/schedule';

// In-memory storage for schedules (simulates a database)
// This is a singleton that persists between API calls during the server's lifetime
class ScheduleStore {
  private static instance: ScheduleStore;
  private schedules: Schedule[] = [];

  private constructor() {
    // Initialize with empty array
  }

  public static getInstance(): ScheduleStore {
    if (!ScheduleStore.instance) {
      ScheduleStore.instance = new ScheduleStore();
    }
    return ScheduleStore.instance;
  }

  // Get all schedules
  public getAll(): Schedule[] {
    return [...this.schedules];
  }

  // Get schedules by user ID
  public getByUserId(userId: string): Schedule[] {
    return this.schedules.filter(schedule => schedule.userId === userId);
  }

  // Get schedules by date range and user ID
  public getByDateRangeAndUserId(startDate: Date, endDate: Date, userId: string): Schedule[] {
    return this.schedules.filter(schedule => {
      const scheduleStart = new Date(schedule.start);
      const scheduleEnd = new Date(schedule.end);
      
      return (
        schedule.userId === userId &&
        scheduleStart <= endDate && 
        scheduleEnd >= startDate
      );
    });
  }

  // Get schedule by ID
  public getById(id: string): Schedule | undefined {
    return this.schedules.find(schedule => schedule.id === id);
  }

  // Create a new schedule
  public create(schedule: Schedule): Schedule {
    this.schedules.push(schedule);
    return schedule;
  }

  // Update a schedule
  public update(id: string, updatedSchedule: Partial<Schedule>): Schedule | null {
    const index = this.schedules.findIndex(schedule => schedule.id === id);
    if (index === -1) return null;
    
    this.schedules[index] = {
      ...this.schedules[index],
      ...updatedSchedule,
      updatedAt: new Date().toISOString()
    };
    
    return this.schedules[index];
  }

  // Delete a schedule
  public delete(id: string): boolean {
    const initialLength = this.schedules.length;
    this.schedules = this.schedules.filter(schedule => schedule.id !== id);
    return this.schedules.length < initialLength;
  }
}

// Export a singleton instance
export const scheduleStore = ScheduleStore.getInstance();
