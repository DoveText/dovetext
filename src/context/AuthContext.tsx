'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  confirmPasswordReset as firebaseConfirmPasswordReset,
} from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { User } from '@/types/user';

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
  auth: any;
  getIdToken: () => Promise<string | null>;
  needsValidation: boolean;
  isActive: boolean;
  refreshUserStatus: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get the ID token without forcing refresh
          const token = await firebaseUser.getIdToken(false);
          
          // Fetch user data from our backend
          const response = await fetch('/api/auth/user', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          const userData = await response.json();
          
          // Combine Firebase user with our user data
          setUser({
            ...firebaseUser,
            settings: userData.settings || {},
            is_active: userData.is_active || false,
            email_verified: userData.email_verified || false,
            created_at: new Date(userData.created_at),
            updated_at: new Date(userData.updated_at)
          } as User);
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
  }, []);

  // Check if user needs validation
  const needsValidation = Boolean(user && 
    user.settings?.provider === 'email' && 
    !user.settings?.validated);

  // Check if user is active
  const isActive = user?.is_active ?? false;

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      throw new Error(getAuthErrorMessage(error.code));
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      if (result.user) {
        await sendEmailVerification(result.user);
      }
      return result;
    } catch (error: any) {
      throw new Error(getAuthErrorMessage(error.code));
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      return result;
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      throw new Error(getAuthErrorMessage(error.code) || 'Failed to sign in with Google');
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      throw new Error(getAuthErrorMessage(error.code));
    }
  };

  const sendVerificationEmail = async () => {
    if (!auth.currentUser) {
      throw new Error('No authenticated user');
    }
    await sendEmailVerification(auth.currentUser);
  };

  const sendPasswordResetEmail = async (email: string) => {
    await firebaseSendPasswordResetEmail(auth, email, {
      url: `${window.location.origin}/dashboard`, // After reset, redirect to dashboard
    });
  };

  const confirmPasswordReset = async (oobCode: string, newPassword: string, email: string) => {
    await firebaseConfirmPasswordReset(auth, oobCode, newPassword);
    
    // After successful reset, update the password in local DB using email
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          newPassword,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update local password');
      }
    } catch (error) {
      console.error('Error updating local password:', error);
      throw error;
    }
  };

  const getIdToken = async () => {
    if (!auth.currentUser) return null;
    return auth.currentUser.getIdToken(false);  // Don't force refresh
  };

  const refreshUserStatus = async () => {
    if (!auth.currentUser) return null;
    
    try {
      // Force refresh the token to get latest claims
      await auth.currentUser.reload();
      const token = await auth.currentUser.getIdToken(false);
      
      // If email is verified, update the database
      if (auth.currentUser.emailVerified) {
        const verifyResponse = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!verifyResponse.ok) {
          console.error('Failed to update email verification status in database');
        }
      }
      
      // Fetch latest user data
      const response = await fetch('/api/auth/user', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
      
      const userData = await response.json();
      setUser({
        ...auth.currentUser!,
        settings: userData.settings || {},
        is_active: userData.is_active || false,
        email_verified: userData.email_verified || false,
        created_at: new Date(userData.created_at),
        updated_at: new Date(userData.updated_at)
      } as User);
      
      return userData;
    } catch (error) {
      console.error('Error refreshing user status:', error);
      return null;
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
    auth,
    getIdToken,
    needsValidation,
    isActive,
    refreshUserStatus,
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
