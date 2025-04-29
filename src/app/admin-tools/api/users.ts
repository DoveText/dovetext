import { apiClient } from '@/app/api/client';

export interface UserDto {
  id: number;
  email: string;
  displayName: string | null;
  phoneNumber: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  firebaseUid?: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;  // Required for Firebase user creation
  displayName?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  isAdmin?: boolean;
}

export interface UpdateUserRequest {
  displayName?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  isAdmin?: boolean;
  password?: string;  // Optional for updating Firebase user password
}

export const usersApi = {
  /**
   * Get all users
   */
  async getAllUsers(): Promise<UserDto[]> {
    const { data } = await apiClient.get('/api/v1/admin/users');
    return data;
  },

  /**
   * Get user by ID
   */
  async getUserById(id: number): Promise<UserDto> {
    const { data } = await apiClient.get(`/api/v1/admin/users/${id}`);
    return data;
  },

  /**
   * Create a new user
   * This will create the user in Firebase first, then in our database
   */
  async createUser(user: CreateUserRequest): Promise<UserDto> {
    // Email and password are required for Firebase user creation
    if (!user.email || !user.password) {
      throw new Error('Email and password are required for user creation');
    }
    
    const { data } = await apiClient.post('/api/v1/admin/users', user);
    return data;
  },

  /**
   * Update an existing user
   * This will update the user in our database and in Firebase if possible
   */
  async updateUser(id: number, user: UpdateUserRequest): Promise<UserDto> {
    const { data } = await apiClient.put(`/api/v1/admin/users/${id}`, user);
    return data;
  },

  /**
   * Delete a user
   * This will delete the user from Firebase first, then from our database
   */
  async deleteUser(id: number): Promise<void> {
    await apiClient.delete(`/api/v1/admin/users/${id}`);
  },

  /**
   * Get the current user
   */
  async getCurrentUser(): Promise<UserDto> {
    const { data } = await apiClient.get('/api/v1/admin/users/me');
    return data;
  },

  /**
   * Set admin status for a user
   */
  async setAdminStatus(id: number, isAdmin: boolean): Promise<UserDto> {
    const { data } = await apiClient.put(`/api/v1/admin/users/${id}/admin?isAdmin=${isAdmin}`);
    return data;
  }
};

/**
 * Hook for users service
 */
export function useUsersService() {
  return {
    getAllUsers: usersApi.getAllUsers,
    getUserById: usersApi.getUserById,
    createUser: usersApi.createUser,
    updateUser: usersApi.updateUser,
    deleteUser: usersApi.deleteUser,
    getCurrentUser: usersApi.getCurrentUser,
    setAdminStatus: usersApi.setAdminStatus
  };
}
