import { apiClient } from './client';

export interface DashboardStats {
  totalSchedules: number;
  missedSchedules: number;
  automationExecutions: number;
  failedExecutions: number;
  timeRange: string;
  dateRangeLabel: string;
}

export const dashboardApi = {
  /**
   * Get dashboard statistics for the current user
   * @param timeRange The time range to filter by ("today", "week", or "month")
   */
  async getStats(timeRange: string): Promise<DashboardStats> {
    const { data } = await apiClient.get<DashboardStats>(`/api/v1/dashboard/stats`, {
      params: { timeRange }
    });
    return data;
  }
};
