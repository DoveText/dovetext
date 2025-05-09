// Define generic user settings interface that all providers will use
export interface UserSettings {
  theme?: 'light' | 'dark' | 'system';
  notifications?: {
    email?: boolean;
    push?: boolean;
  };
  provider?: 'email' | 'google' | 'github';
  validated?: boolean;
  role?: 'user' | 'admin'; // Role for permission management
  // Add more settings as needed
}

// Define generic user interface that all providers will implement
export interface BaseUser {
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
  getIdToken: (forceRefresh?: boolean) => Promise<string>;
}

export type AuthProviderType = 'firebase' | 'local';

// Supported OAuth providers
export type OAuthProviderType = 'google' | 'github' | 'facebook' | 'twitter' | 'microsoft' | 'apple';

export interface AuthProviderInterface<UserType extends BaseUser = BaseUser> {
  // User management
  getCurrentUser: () => Promise<UserType | null>;
  
  // Authentication methods
  signIn: (email: string, password: string) => Promise<UserType>;
  signUp: (email: string, password: string) => Promise<UserType>;
  // Generic OAuth sign-in method
  signInWithOAuth: (provider: OAuthProviderType, options?: any) => Promise<UserType>;
  // Keep for backward compatibility
  signInWithGoogle: () => Promise<UserType>;
  logout: () => Promise<void>;
  
  // Email verification
  sendVerificationEmail: (user?: UserType) => Promise<void>;
  applyActionCode: (oobCode: string) => Promise<void>;
  
  // Password management
  sendPasswordResetEmail: (email: string) => Promise<void>;
  confirmPasswordReset: (oobCode: string, newPassword: string, email: string) => Promise<void>;
  checkActionCode: (oobCode: string) => Promise<any>;
  
  // Token management
  getIdToken: () => Promise<string | null>;
  
  // Auth state
  onAuthStateChanged: (callback: (user: UserType | null) => void) => () => void;
  
  // User status
  refreshUserStatus: () => Promise<any>;
  
  // For backward compatibility with existing code
  // Returns the provider-specific auth instance
  getAuthInstance: () => any;
}
