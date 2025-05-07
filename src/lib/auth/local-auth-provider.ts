import { AuthProviderInterface, BaseUser, UserSettings, OAuthProviderType } from './types';

// Local auth user interface
export interface LocalAuthUser extends BaseUser {
  // Add any local-specific properties here
  roles?: string[];
  permissions?: string[];
}

// Simple in-memory auth state management
// In a real implementation, this would be handled by the backend
class LocalAuthState {
  private static instance: LocalAuthState;
  private currentUser: LocalAuthUser | null = null;
  private listeners: ((user: LocalAuthUser | null) => void)[] = [];
  private authToken: string | null = null;

  private constructor() {}

  static getInstance(): LocalAuthState {
    if (!LocalAuthState.instance) {
      LocalAuthState.instance = new LocalAuthState();
    }
    return LocalAuthState.instance;
  }

  getUser(): LocalAuthUser | null {
    return this.currentUser;
  }

  setUser(user: LocalAuthUser | null): void {
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
        localStorage.setItem('local_auth_token', token);
      } else {
        localStorage.removeItem('local_auth_token');
      }
    }
  }

  addListener(listener: (user: LocalAuthUser | null) => void): () => void {
    this.listeners.push(listener);
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Initialize auth state from localStorage
  init(): void {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('local_auth_token');
      if (token) {
        this.authToken = token;
        // Fetch user data using the token
        this.fetchUserData(token).catch(error => {
          console.error('Error initializing local auth state:', error);
          this.setToken(null);
        });
      }
    }
  }

  // Fetch user data from the backend
  async fetchUserData(token: string): Promise<void> {
    try {
      const response = await fetch('/api/v1/auth/local/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
      
      const userData = await response.json();
      
      // Create a properly typed LocalAuthUser object
      const user: LocalAuthUser = {
        uid: userData.id,
        email: userData.email,
        displayName: userData.displayName || userData.name || null,
        photoURL: userData.photoURL || userData.avatar || null,
        emailVerified: userData.emailVerified || false,
        isAnonymous: false,
        settings: userData.settings || {},
        is_active: userData.is_active || false,
        email_verified: userData.emailVerified || false,
        created_at: new Date(userData.created_at || Date.now()),
        updated_at: new Date(userData.updated_at || Date.now()),
        last_login_at: userData.last_login_at ? new Date(userData.last_login_at) : undefined,
        getIdToken: async () => this.authToken || '',
        
        // Local-specific properties
        roles: userData.roles || [],
        permissions: userData.permissions || []
      };
      
      this.setUser(user);
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw error;
    }
  }
}

export class LocalAuthProvider implements AuthProviderInterface<LocalAuthUser> {
  private authState: LocalAuthState;
  
  constructor() {
    this.authState = LocalAuthState.getInstance();
    // Initialize auth state
    this.authState.init();
  }

  // User management
  async getCurrentUser(): Promise<LocalAuthUser | null> {
    return this.authState.getUser();
  }

  // Authentication methods
  async signIn(email: string, password: string): Promise<LocalAuthUser> {
    try {
      const response = await fetch('/api/v1/auth/local/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to sign in');
      }
      
      const data = await response.json();
      
      // Store the token
      this.authState.setToken(data.token);
      
      // Fetch user data
      await this.authState.fetchUserData(data.token);
      
      const user = this.authState.getUser();
      if (!user) {
        throw new Error('Failed to get user after sign in');
      }
      
      return user;
    } catch (error: any) {
      console.error('Local sign in error:', error);
      throw error;
    }
  }

  async signInWithOAuth(providerType: OAuthProviderType, options?: any): Promise<LocalAuthUser> {
    try {
      // Call the backend API for OAuth
      const response = await fetch(`/api/v1/auth/local/oauth/${providerType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(options || {})
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to sign in with ${providerType}`);
      }
      
      const data = await response.json();
      
      // Set the auth token
      this.authState.setToken(data.token);
      
      // Set the user
      const user: LocalAuthUser = {
        uid: data.user.uid,
        email: data.user.email,
        displayName: data.user.displayName,
        photoURL: data.user.photoURL,
        emailVerified: data.user.emailVerified,
        isAnonymous: false,
        is_active: true,
        email_verified: data.user.emailVerified,
        settings: data.user.settings || {},
        roles: data.user.roles || [],
        permissions: data.user.permissions || [],
        created_at: new Date(data.user.created_at),
        updated_at: new Date(data.user.updated_at),
        getIdToken: () => Promise.resolve(this.authState.getToken() || '')
      };
      
      this.authState.setUser(user);
      
      return user;
    } catch (error: any) {
      console.error(`Local ${providerType} sign in error:`, error);
      throw error;
    }
  }

  // Keep for backward compatibility
  async signInWithGoogle(): Promise<LocalAuthUser> {
    return this.signInWithOAuth('google');
  }

  async signUp(email: string, password: string): Promise<LocalAuthUser> {
    try {
      const response = await fetch('/api/v1/auth/local/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to sign up');
      }
      
      const data = await response.json();
      
      // Store the token
      this.authState.setToken(data.token);
      
      // Fetch user data
      await this.authState.fetchUserData(data.token);
      
      const user = this.authState.getUser();
      if (!user) {
        throw new Error('Failed to get user after sign up');
      }
      
      return user;
    } catch (error: any) {
      console.error('Local sign up error:', error);
      throw error;
    }
  }

  // This method is now replaced by signInWithOAuth

  async logout(): Promise<void> {
    try {
      const token = this.authState.getToken();
      
      if (token) {
        // Call the logout endpoint
        await fetch('/api/v1/auth/local/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
      
      // Clear local state
      this.authState.setToken(null);
      this.authState.setUser(null);
    } catch (error: any) {
      console.error('Local logout error:', error);
      throw error;
    }
  }

  // Email verification
  async sendVerificationEmail(user?: LocalAuthUser): Promise<void> {
    try {
      const token = this.authState.getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      const response = await fetch('/api/v1/auth/local/send-verification', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send verification email');
      }
    } catch (error: any) {
      console.error('Local send verification email error:', error);
      throw error;
    }
  }

  async applyActionCode(oobCode: string): Promise<void> {
    try {
      const response = await fetch('/api/v1/auth/local/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code: oobCode })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to verify email');
      }
      
      // Refresh user data
      const token = this.authState.getToken();
      if (token) {
        await this.authState.fetchUserData(token);
      }
    } catch (error: any) {
      console.error('Local apply action code error:', error);
      throw error;
    }
  }

  // Password management
  async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      const response = await fetch('/api/v1/auth/local/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send password reset email');
      }
    } catch (error: any) {
      console.error('Local send password reset email error:', error);
      throw error;
    }
  }

  async confirmPasswordReset(oobCode: string, newPassword: string, email: string): Promise<void> {
    try {
      const response = await fetch('/api/v1/auth/local/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: oobCode,
          password: newPassword,
          email
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reset password');
      }
    } catch (error: any) {
      console.error('Local confirm password reset error:', error);
      throw error;
    }
  }

  async checkActionCode(oobCode: string): Promise<any> {
    try {
      const response = await fetch('/api/v1/auth/local/check-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code: oobCode })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Invalid code');
      }
      
      return await response.json();
    } catch (error: any) {
      console.error('Local check action code error:', error);
      throw error;
    }
  }

  // Token management
  async getIdToken(): Promise<string | null> {
    return this.authState.getToken();
  }

  // Auth state
  onAuthStateChanged(callback: (user: LocalAuthUser | null) => void): () => void {
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
      console.error('Local refresh user status error:', error);
      throw error;
    }
  }
  
  // For backward compatibility
  getAuthInstance() {
    // Return a minimal auth-like object
    return {
      currentUser: this.authState.getUser(),
      onAuthStateChanged: this.onAuthStateChanged.bind(this)
    };
  }
}
