'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { BaseUser, OAuthProviderType } from '@/lib/auth/types';
import { authProvider, auth } from '@/lib/auth/provider';

// Re-export auth object for backward compatibility
// This ensures existing code that imports auth from AuthContext continues to work
export { auth };

// User type that will be used throughout the application
// We're extending the BaseUser from our auth provider interface
export interface User extends BaseUser {
  is_active: boolean;
  last_login_at?: Date;
  email_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

// Additional user-related types
export interface InvitationCode {
  code: string;
  max_uses: number;
  used_count: number;
  is_active: boolean;
  platform?: string;
  description?: string;
  created_by?: number;
  created_at: Date;
}

export interface InvitationCodeUse {
  id: number;
  code: string;
  user_id: number;
  user_email: string;
  used_at: Date;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<any>;
  signInWithGoogle: () => Promise<any>;
  logout: () => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<void>;
  confirmPasswordReset: (oobCode: string, newPassword: string, email: string) => Promise<void>;
  checkActionCode: (oobCode: string) => Promise<any>;
  applyActionCode: (oobCode: string) => Promise<void>;
  getIdToken: () => Promise<string | null>;
  needsValidation: boolean;
  isActive: boolean;
  refreshUserStatus: () => Promise<any>;
  // For backward compatibility with existing components
  auth: any; // Provider-specific auth instance
  onAuthStateChanged: (auth: any, nextOrObserver: any, error?: any, completed?: any) => () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Set up auth state listener when the provider changes
  useEffect(() => {
    setLoading(true);
    const unsubscribe = authProvider.onAuthStateChanged((authUser) => {
      // Cast to User type since we know our provider implementations ensure compatibility
      setUser(authUser as unknown as User);
      setLoading(false);
    });
    
    return unsubscribe;
  }, [authProvider]);

  // Authentication methods delegated to the provider
  const signIn = async (email: string, password: string) => {
    try {
      await authProvider.signIn(email, password);
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      return await authProvider.signUp(email, password);
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  const signInWithOAuth = async (provider: OAuthProviderType, options?: any) => {
    try {
      return await authProvider.signInWithOAuth(provider, options);
    } catch (error) {
      console.error(`Error signing in with ${provider}:`, error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      return await signInWithOAuth('google');
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authProvider.logout();
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const sendVerificationEmail = async () => {
    try {
      await authProvider.sendVerificationEmail();
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw error;
    }
  };

  const sendPasswordResetEmail = async (email: string) => {
    try {
      await authProvider.sendPasswordResetEmail(email);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  };

  const confirmPasswordReset = async (oobCode: string, newPassword: string, email: string) => {
    try {
      await authProvider.confirmPasswordReset(oobCode, newPassword, email);
    } catch (error) {
      console.error('Error confirming password reset:', error);
      throw error;
    }
  };

  const checkActionCode = async (oobCode: string) => {
    try {
      return await authProvider.checkActionCode(oobCode);
    } catch (error) {
      console.error('Error checking action code:', error);
      throw error;
    }
  };

  const applyActionCode = async (oobCode: string) => {
    try {
      await authProvider.applyActionCode(oobCode);
    } catch (error) {
      console.error('Error applying action code:', error);
      throw error;
    }
  };

  const getIdToken = async () => {
    try {
      return await authProvider.getIdToken();
    } catch (error) {
      console.error('Error getting ID token:', error);
      return null;
    }
  };

  const refreshUserStatus = async () => {
    try {
      return await authProvider.refreshUserStatus();
    } catch (error) {
      console.error('Error refreshing user status:', error);
      throw error;
    }
  };

  const needsValidation = user ? !user.emailVerified : false;
  const isActive = user ? user.settings?.validated !== false : false;

  // Create a wrapper for onAuthStateChanged that delegates to the provider
  // but maintains the same interface for backward compatibility with existing components
  const wrappedOnAuthStateChanged = (auth: any, nextOrObserver: any, error?: any, completed?: any): (() => void) => {
    // Ignore the auth parameter and use the provider's implementation
    // Handle both callback and observer pattern
    if (typeof nextOrObserver === 'function') {
      return authProvider.onAuthStateChanged(nextOrObserver);
    } else {
      // If it's an observer object with next/error/complete methods
      const callback = (user: User | null) => {
        if (user && nextOrObserver.next) {
          nextOrObserver.next(user);
        } else if (!user && error) {
          error(new Error('User is null'));
        } else if (completed) {
          completed();
        }
      };
      return authProvider.onAuthStateChanged(callback);
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    logout,
    sendVerificationEmail,
    sendPasswordResetEmail,
    confirmPasswordReset,
    checkActionCode,
    applyActionCode,
    getIdToken,
    needsValidation,
    isActive,
    refreshUserStatus,
    // For backward compatibility with existing components
    auth,
    onAuthStateChanged: wrappedOnAuthStateChanged,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

function getAuthErrorMessage(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'This email is already registered.';
    case 'auth/invalid-email':
      return 'Invalid email address.';
    case 'auth/operation-not-allowed':
      return 'Email/password accounts are not enabled.';
    case 'auth/weak-password':
      return 'Password is too weak.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Invalid email or password.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    default:
      return 'An error occurred. Please try again.';
  }
}
