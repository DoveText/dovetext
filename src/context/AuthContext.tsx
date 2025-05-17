'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, OAuthProviderType, auth } from '@/lib/auth';

// Re-export auth object for compatibility
// This ensures existing code that imports auth from AuthContext continues to work
export { auth };

// Additional user-related types
// We're using the User interface directly from auth.ts

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
  refreshUser: () => Promise<void>; // New method to refresh user data
  // For backward compatibility with existing components
  auth: any; // Provider-specific auth instance
  onAuthStateChanged: (auth: any, nextOrObserver: any, error?: any, completed?: any) => () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Set up auth state listener
  useEffect(() => {
    setLoading(true);
    
    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      setUser(authUser);
      setLoading(false);
    });
    
    return () => {
      unsubscribe();
    };
  }, []);

  // Authentication methods delegated to the auth module
  const signIn = async (email: string, password: string) => {
    try {
      await auth.signIn(email, password);
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      return await auth.signUp(email, password);
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      return await auth.signInWithGoogle();
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await auth.logout();
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  };

  const sendVerificationEmail = async () => {
    try {
      // Pass undefined instead of null to match the expected type
      await auth.sendVerificationEmail(user || undefined);
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw error;
    }
  };

  const sendPasswordResetEmail = async (email: string) => {
    try {
      await auth.sendPasswordResetEmail(email);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  };

  const confirmPasswordReset = async (oobCode: string, newPassword: string, email: string) => {
    try {
      await auth.confirmPasswordReset(oobCode, newPassword, email);
    } catch (error) {
      console.error('Error confirming password reset:', error);
      throw error;
    }
  };

  const checkActionCode = async (oobCode: string) => {
    try {
      return await auth.checkActionCode(oobCode);
    } catch (error) {
      console.error('Error checking action code:', error);
      throw error;
    }
  };

  const applyActionCode = async (oobCode: string) => {
    try {
      await auth.applyActionCode(oobCode);
    } catch (error) {
      console.error('Error applying action code:', error);
      throw error;
    }
  };

  const getIdToken = async () => {
    try {
      return await auth.getIdToken();
    } catch (error) {
      console.error('Error getting ID token:', error);
      throw error;
    }
  };

  const refreshUserStatus = async () => {
    try {
      return await auth.refreshUserStatus();
    } catch (error) {
      console.error('Error refreshing user status:', error);
      throw error;
    }
  };
  
  // Method to refresh user data after profile changes
  const refreshUser = async () => {
    try {
      if (!user) return;
      
      const token = await user.getIdToken(true); // Force token refresh
      const response = await fetch('/api/v1/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        
        // Update the user object with fresh data
        if (user && userData) {
          user.displayName = userData.displayName || user.displayName;
          user.photoURL = userData.avatarUrl || userData.photoURL || user.photoURL;
          user.email = userData.email || user.email;
          
          // Force a re-render by setting the user state
          setUser({...user});
        }
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  // Determine if the user needs validation and is active
  const needsValidation = user ? !user.emailVerified || user.settings?.validated === false : false;
  const isActive = user ? user.is_active === true : false;

  // Simplified wrapper for onAuthStateChanged that works directly with our auth system
  const wrappedOnAuthStateChanged = (authObj: any, nextOrObserver: any, error?: any, completed?: any): (() => void) => {
    // Always use our centralized auth implementation regardless of the passed auth object
    if (typeof nextOrObserver === 'function') {
      return auth.onAuthStateChanged(nextOrObserver);
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
      return auth.onAuthStateChanged(callback);
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
    refreshUser,
    // For backward compatibility with existing components
    auth,
    onAuthStateChanged: wrappedOnAuthStateChanged,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
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
