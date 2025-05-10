/**
 * Authentication module for Dove.text
 * 
 * This file handles all authentication-related functionality,
 * including user management, authentication, and token handling.
 */

import { apiConfig } from '@/config/api';
import { api } from '@/utils/api';

// Define user settings interface
export interface UserSettings {
  theme?: 'light' | 'dark' | 'system';
  notifications?: {
    email?: boolean;
    push?: boolean;
  };
  validated?: boolean;
  role?: 'user' | 'admin';
  [key: string]: any; // Allow for additional custom settings
}

// Define user interface
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  isAnonymous: boolean;
  settings: UserSettings;
  is_active: boolean;
  email_verified: boolean;
  created_at: Date;
  updated_at: Date;
  last_login_at?: Date;
  roles?: string[];
  permissions?: string[];
  getIdToken: (forceRefresh?: boolean) => Promise<string>;
}

// Supported OAuth providers
export type OAuthProviderType = 'google' | 'github';

/**
 * Auth state management
 * Handles the current user state and token storage
 */
class AuthState {
  private static instance: AuthState;
  private currentUser: User | null = null;
  private listeners: ((user: User | null) => void)[] = [];
  private authToken: string | null = null;

  private constructor() {}

  static getInstance(): AuthState {
    if (!AuthState.instance) {
      AuthState.instance = new AuthState();
    }
    return AuthState.instance;
  }

  getUser(): User | null {
    return this.currentUser;
  }

  setUser(user: User | null): void {
    this.currentUser = user;
    // Notify all listeners
    this.listeners.forEach(listener => listener(user));
  }

  getToken(): string | null {
    return this.authToken;
  }

  setToken(token: string | null): void {
    this.authToken = token;
    // Store token in localStorage for persistence
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token);
      } else {
        localStorage.removeItem('auth_token');
      }
    }
  }

  addListener(listener: (user: User | null) => void): () => void {
    this.listeners.push(listener);
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Initialize auth state from localStorage
  init(): void {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        this.authToken = token;
        // Fetch user data using the token
        this.fetchUserData(token).catch(error => {
          console.error('Error initializing auth state:', error);
          this.setToken(null);
          // Notify listeners that auth state is resolved (but no user)
          this.listeners.forEach(listener => listener(null));
        });
      } else {
        // No token found, notify listeners that auth state is resolved (no user)
        this.listeners.forEach(listener => listener(null));
      }
    } else {
      // Not in browser environment, notify listeners that auth state is resolved (no user)
      this.listeners.forEach(listener => listener(null));
    }
  }

  // Fetch user data from the backend
  async fetchUserData(token: string): Promise<void> {
    try {
      const { data, error, status } = await api.get('api/v1/profile', {
        token
      });
      
      if (error || !data) {
        throw new Error(error || 'Failed to fetch user data');
      }
      
      const userData = data;
      
      // Create a properly typed User object
      const user: User = {
        uid: userData.userUid || userData.id,
        email: userData.email,
        displayName: userData.displayName || userData.name || null,
        photoURL: userData.photoURL || userData.avatarUrl || null,
        emailVerified: userData.emailVerified || userData.email_verified || false,
        isAnonymous: false,
        is_active: userData.isActive || userData.is_active || false,
        email_verified: userData.emailVerified || userData.email_verified || false,
        settings: userData.settings || {},
        roles: userData.roles || [],
        permissions: userData.permissions || [],
        created_at: new Date(userData.createdAt || userData.created_at || Date.now()),
        updated_at: new Date(userData.updatedAt || userData.updated_at || Date.now()),
        last_login_at: userData.lastLoginAt || userData.last_login_at ? 
          new Date(userData.lastLoginAt || userData.last_login_at) : undefined,
        getIdToken: () => Promise.resolve(token)
      };
      
      this.setUser(user);
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw error;
    }
  }
}

/**
 * Main authentication class
 * Handles all authentication operations with the backend
 */
export class Auth {
  private authState: AuthState;
  
  constructor() {
    this.authState = AuthState.getInstance();
    // Initialize auth state
    this.authState.init();
  }

  // User management
  async getCurrentUser(): Promise<User | null> {
    return this.authState.getUser();
  }

  // Authentication methods
  async signIn(email: string, password: string): Promise<User> {
    try {
      const { data, error, status } = await api.post('public/auth/signin', { 
        email, 
        password 
      });
      
      if (error || !data) {
        throw new Error(error || 'Failed to sign in');
      }
      
      // Store the token
      this.authState.setToken(data.token);
      
      // Create user from response data
      const user: User = {
        uid: data.user.userUid || data.user.id,
        email: data.user.email,
        displayName: data.user.displayName || data.user.name || null,
        photoURL: data.user.photoURL || data.user.avatarUrl || null,
        emailVerified: data.user.emailVerified || data.user.email_verified || false,
        isAnonymous: false,
        is_active: data.user.isActive || data.user.is_active || false,
        email_verified: data.user.emailVerified || data.user.email_verified || false,
        settings: data.user.settings || {},
        roles: data.user.roles || [],
        permissions: data.user.permissions || [],
        created_at: new Date(data.user.createdAt || data.user.created_at || Date.now()),
        updated_at: new Date(data.user.updatedAt || data.user.updated_at || Date.now()),
        last_login_at: data.user.lastLoginAt || data.user.last_login_at ? 
          new Date(data.user.lastLoginAt || data.user.last_login_at) : undefined,
        getIdToken: () => Promise.resolve(data.token)
      };
      this.authState.setUser(user);
      
      return user;
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  async signInWithOAuth(providerType: OAuthProviderType, options?: any): Promise<User> {
    return new Promise((resolve, reject) => {
      try {
        // Open the OAuth popup
        const width = 500;
        const height = 600;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2.5;
        const popup = window.open(
          `/api/v1/auth/oauth/${providerType}`,
          `${providerType}-auth`,
          `width=${width},height=${height},left=${left},top=${top}`
        );
        
        if (!popup) {
          throw new Error('Popup blocked. Please allow popups for this site.');
        }
        
        // Listen for messages from the popup
        const handleMessage = (event: MessageEvent) => {
          // Verify origin for security
          if (event.origin !== window.location.origin) return;
          
          if (event.data?.type === 'oauth-success' && event.data?.token) {
            window.removeEventListener('message', handleMessage);
            
            // Set the token
            this.authState.setToken(event.data.token);
            
            // Create user from response data
            const user: User = {
              uid: event.data.user.userUid || event.data.user.id,
              email: event.data.user.email,
              displayName: event.data.user.displayName || event.data.user.name || null,
              photoURL: event.data.user.photoURL || event.data.user.avatarUrl || null,
              emailVerified: event.data.user.emailVerified || event.data.user.email_verified || false,
              isAnonymous: false,
              is_active: event.data.user.isActive || event.data.user.is_active || false,
              email_verified: event.data.user.emailVerified || event.data.user.email_verified || false,
              settings: event.data.user.settings || {},
              roles: event.data.user.roles || [],
              permissions: event.data.user.permissions || [],
              created_at: new Date(event.data.user.createdAt || event.data.user.created_at || Date.now()),
              updated_at: new Date(event.data.user.updatedAt || event.data.user.updated_at || Date.now()),
              last_login_at: event.data.user.lastLoginAt || event.data.user.last_login_at ? 
                new Date(event.data.user.lastLoginAt || event.data.user.last_login_at) : undefined,
              getIdToken: () => Promise.resolve(event.data.token)
            };
            this.authState.setUser(user);
            
            resolve(user);
          } else if (event.data?.type === 'oauth-error') {
            window.removeEventListener('message', handleMessage);
            reject(new Error(event.data.error || `Failed to sign in with ${providerType}`));
          }
        };
        
        window.addEventListener('message', handleMessage);
        
        // Set a timeout to reject the promise if the popup is closed without a response
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            window.removeEventListener('message', handleMessage);
            reject(new Error('Authentication cancelled'));
          }
        }, 1000);
      } catch (e) {
        reject(e);
      }
    });
  }

  // Convenience method for Google sign-in
  async signInWithGoogle(): Promise<User> {
    return this.signInWithOAuth('google');
  }

  // Convenience method for GitHub sign-in
  async signInWithGithub(): Promise<User> {
    return this.signInWithOAuth('github');
  }

  async signUp(email: string, password: string, displayName?: string): Promise<User> {
    try {
      const { data, error, status } = await api.post('public/auth/signup', { 
        email, 
        password,
        displayName: displayName || email.split('@')[0]
      });
      
      if (error || !data) {
        throw new Error(error || 'Failed to sign up');
      }
      
      // Store the token
      this.authState.setToken(data.token);
      
      // Create user from response data
      const user: User = {
        uid: data.user.userUid || data.user.id,
        email: data.user.email,
        displayName: data.user.displayName || data.user.name || null,
        photoURL: data.user.photoURL || data.user.avatarUrl || null,
        emailVerified: data.user.emailVerified || data.user.email_verified || false,
        isAnonymous: false,
        is_active: data.user.isActive || data.user.is_active || false,
        email_verified: data.user.emailVerified || data.user.email_verified || false,
        settings: data.user.settings || {},
        roles: data.user.roles || [],
        permissions: data.user.permissions || [],
        created_at: new Date(data.user.createdAt || data.user.created_at || Date.now()),
        updated_at: new Date(data.user.updatedAt || data.user.updated_at || Date.now()),
        last_login_at: data.user.lastLoginAt || data.user.last_login_at ? 
          new Date(data.user.lastLoginAt || data.user.last_login_at) : undefined,
        getIdToken: () => Promise.resolve(data.token)
      };
      this.authState.setUser(user);
      
      return user;
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      // Clear local auth state first
      this.authState.setUser(null);
      this.authState.setToken(null);
      
      // Then notify the server
      if (typeof window !== 'undefined') {
        try {
          await api.post('public/auth/logout', {}, {
            token: this.authState.getToken()
          });
        } catch (e) {
          console.warn('Logout endpoint error:', e);
        }
      }
    } catch (error: any) {
      console.error('Logout error:', error);
      // Still clear the local state even if the server request failed
      this.authState.setToken(null);
      this.authState.setUser(null);
    }
  }

  // Email verification
  async sendVerificationEmail(user?: User): Promise<void> {
    try {
      const currentUser = user || this.authState.getUser();
      if (!currentUser || !currentUser.email) throw new Error('User email not available');
      
      const response = await fetch('/api/v1/auth/send-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: currentUser.email })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send verification email');
      }
    } catch (error: any) {
      console.error('Send verification email error:', error);
      throw error;
    }
  }

  async applyActionCode(oobCode: string): Promise<void> {
    try {
      const response = await fetch('/api/v1/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code: oobCode })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to verify email');
      }
      
      // Refresh user data
      const token = this.authState.getToken();
      if (token) {
        await this.authState.fetchUserData(token);
      }
    } catch (error: any) {
      console.error('Apply action code error:', error);
      throw error;
    }
  }

  // Password management
  async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      const response = await fetch('/public/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send password reset email');
      }
    } catch (error: any) {
      console.error('Send password reset email error:', error);
      throw error;
    }
  }

  async confirmPasswordReset(oobCode: string, newPassword: string, email: string): Promise<void> {
    try {
      const response = await fetch('/public/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: oobCode,
          newPassword,
          email
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reset password');
      }
    } catch (error: any) {
      console.error('Confirm password reset error:', error);
      throw error;
    }
  }

  async checkActionCode(oobCode: string): Promise<any> {
    try {
      const response = await fetch('/public/auth/check-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code: oobCode })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Invalid code');
      }
      
      return await response.json();
    } catch (error: any) {
      console.error('Check action code error:', error);
      throw error;
    }
  }

  // Token management
  async getIdToken(): Promise<string | null> {
    return this.authState.getToken();
  }

  // Auth state
  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return this.authState.addListener(callback);
  }

  // User status
  async refreshUserStatus(): Promise<any> {
    try {
      const token = this.authState.getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      // Fetch user data
      await this.authState.fetchUserData(token);
      
      return this.authState.getUser();
    } catch (error: any) {
      console.error('Refresh user status error:', error);
      throw error;
    }
  }
  
  // Check if email exists
  async checkEmailExists(email: string): Promise<boolean> {
    try {
      const response = await fetch(`/public/auth/check-email?email=${encodeURIComponent(email)}`);
      
      if (!response.ok) {
        throw new Error('Failed to check email');
      }
      
      const data = await response.json();
      return data.exists === true;
    } catch (error) {
      console.error('Error checking email:', error);
      throw error;
    }
  }
  
  // Check if invitation code is valid
  async checkInvitationCode(code: string): Promise<any> {
    try {
      const response = await fetch('/public/auth/check-invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Invalid invitation code');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error checking invitation code:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
export const auth = new Auth();
