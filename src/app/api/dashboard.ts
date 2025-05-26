import { apiClient } from './client';

export interface DashboardStats {
  totalSchedules: number;
  missedSchedules: number;
  automationExecutions: number;
  failedExecutions: number;
}

export interface DateRange {
  startTime: number;
  endTime: number;
  dateRangeLabel: string;
}

export interface UpcomingSchedule {
  id: number;
  title: string;
  startTime: string;
  endTime: string;
  type: string;  // "EVENT" or "REMINDER"
  color?: string;
  location?: string;
  description?: string;
  isAllDay: boolean;
}

export const dashboardApi = {
  /**
   * Get dashboard statistics for the current user
   * @param startTime Start time in UTC (epoch milliseconds)
   * @param endTime End time in UTC (epoch milliseconds)
   */
  async getStats(startTime: number, endTime: number): Promise<DashboardStats> {
    const { data } = await apiClient.get<DashboardStats>(`/api/v1/dashboard/stats`, {
      params: { startTime, endTime }
    });
    return data;
  },
  
  /**
   * Get upcoming schedules for the current user
   * @param limit Maximum number of schedules to return (default: 5)
   */
  async getUpcomingSchedules(limit: number = 5): Promise<UpcomingSchedule[]> {
    const { data } = await apiClient.get<UpcomingSchedule[]>(`/api/v1/dashboard/upcoming-schedules`, {
      params: { limit }
    });
    return data;
  },
  
  /**
   * Calculate date range for a specific time range in the user's local timezone
   * @param timeRange The time range to calculate ("today", "week", or "month")
   * @returns Date range with start/end timestamps and formatted label
   */
  calculateDateRange(timeRange: string): DateRange {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    let startDate: Date;
    let endDate: Date;
    let dateRangeLabel: string;
    
    switch (timeRange) {
      case 'today':
        // Today (in local timezone)
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        dateRangeLabel = formatter.format(startDate);
        break;
        
      case 'month':
        // This month (in local timezone)
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        dateRangeLabel = `${formatter.format(startDate)} - ${formatter.format(endDate)}`;
        break;
        
      case 'week':
      default:
        // This week (Sunday to Saturday in local timezone)
        const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
        startDate = new Date(now);
        startDate.setDate(now.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);
        
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        
        dateRangeLabel = `${formatter.format(startDate)} - ${formatter.format(endDate)}`;
        break;
    }
    
    return {
      startTime: startDate.getTime(),
      endTime: endDate.getTime(),
      dateRangeLabel
    };
  }
};
