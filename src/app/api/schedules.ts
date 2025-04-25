import { apiClient } from './client';
import { Schedule, CreateScheduleRequest, UpdateScheduleRequest } from '@/types/schedule';

export const schedulesApi = {
  /**
   * Get all schedules for the current user
   */
  async getAll(): Promise<Schedule[]> {
    const { data } = await apiClient.get<Schedule[]>('/api/v1/schedules');
    return data;
  },

  /**
   * Get schedules for a specific date range using epoch seconds
   * @param startTime Start time in epoch seconds
   * @param endTime End time in epoch seconds
   */
  async getByDateRange(startTime: number, endTime: number): Promise<Schedule[]> {
    const { data } = await apiClient.get<Schedule[]>(`/api/v1/schedules`, {
      params: { startTime, endTime }
    });
    return data;
  },

  /**
   * Get a specific schedule by ID
   */
  async getById(id: string): Promise<Schedule> {
    const { data } = await apiClient.get<Schedule>(`/api/v1/schedules/${id}`);
    return data;
  },

  /**
   * Create a new schedule
   */
  async create(request: CreateScheduleRequest): Promise<Schedule> {
    const { data } = await apiClient.post<Schedule>('/api/v1/schedules', request);
    return data;
  },

  /**
   * Update an existing schedule
   */
  async update(id: string, request: UpdateScheduleRequest): Promise<Schedule> {
    const { data } = await apiClient.put<Schedule>(`/api/v1/schedules/${id}`, request);
    return data;
  },

  /**
   * Delete a schedule
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/api/v1/schedules/${id}`);
  },
};
