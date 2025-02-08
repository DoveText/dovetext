'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/ui/Spinner';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [invitationCode, setInvitationCode] = useState('');
  const [error, setError] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isSigningUpWithGoogle, setIsSigningUpWithGoogle] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  
  // Field-specific states
  const [emailError, setEmailError] = useState('');
  const [emailChecking, setEmailChecking] = useState(false);
  const [invitationError, setInvitationError] = useState('');
  const [invitationChecking, setInvitationChecking] = useState(false);
  
  const { signUp, signInWithGoogle, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const validatePassword = () => {
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const completeSignup = async (email: string, firebaseUid: string, password: string | null, provider: 'email' | 'google') => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          firebaseUid,
          password,
          invitationCode,
          provider
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to complete signup');
      }

      return data;
    } catch (err) {
      console.error('Error in completeSignup:', err);
      throw err;
    }
  };

  const validateEmail = async (emailToValidate: string) => {
    if (!emailToValidate) return false;

    try {
      const response = await fetch(`/api/auth/check-email?email=${encodeURIComponent(emailToValidate)}`);
      const data = await response.json();
      
      if (!response.ok) {
        setEmailError(data.error || 'Failed to validate email');
        return false;
      }

      if (data.exists) {
        setEmailError('This email is already registered');
        return false;
      }

      setEmailError('');
      return true;
    } catch (error) {
      console.error('Error validating email:', error);
      setEmailError('Failed to validate email');
      return false;
    }
  };

  const handleEmailBlur = async (event: React.FocusEvent<HTMLInputElement>) => {
    const emailToValidate = event.target.value;
    await validateEmail(emailToValidate);
  };

  const handleInvitationBlur = async () => {
    if (!invitationCode) {
      setInvitationError('Invitation code is required');
      return false;
    }
    
    setInvitationChecking(true);
    setInvitationError('');
    
    try {
      const response = await fetch('/api/auth/check-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: invitationCode })
      });
      const data = await response.json();
      
      if (!response.ok) {
        setInvitationError(data.error || 'Invalid invitation code');
        return false;
      }

      return true;
    } catch (err) {
      setInvitationError('Failed to verify invitation code');
      return false;
    } finally {
      setInvitationChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check for validation errors
    if (emailError || invitationError) {
      setError('Please fix the errors before submitting');
      return;
    }
    
    if (!validatePassword()) {
      return;
    }

    try {
      setError('');
      setIsSigningUp(true);

      // Create Firebase user
      const userCredential = await signUp(email, password);
      if (!userCredential.user) throw new Error('Failed to create user account');

      // Complete signup in local database
      await completeSignup(email, userCredential.user.uid, password, 'email');
      
      setVerificationSent(true);
    } catch (err) {
      console.error('Sign up error:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to create an account');
      }
    } finally {
      setIsSigningUp(false);
    }
  };

  const handleGoogleSignUp = async () => {
    if (!invitationCode) {
      setInvitationError('Please enter an invitation code');
      setError('Please enter an invitation code');
      return;
    }

    try {
      setError('');
      setIsSigningUpWithGoogle(true);

      // Check invitation code first
      const isValidCode = await handleInvitationBlur();
      if (!isValidCode) {
        setError('Please fix the invitation code error before continuing');
        setIsSigningUpWithGoogle(false);
        return;
      }

      // Sign in with Google
      const result = await signInWithGoogle().catch(error => {
        console.error('Google sign-in error:', error);
        throw error;
      });
      
      if (!result?.user?.email) {
        throw new Error('Failed to get email from Google account');
      }

      // Complete signup in local database (no password for Google sign-in)
      await completeSignup(result.user.email, result.user.uid, null, 'google');
      
      router.push('/dashboard');
    } catch (err) {
      console.error('Google sign up error:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to sign up with Google');
      }
    } finally {
      setIsSigningUpWithGoogle(false);
    }
  };

  if (verificationSent) {
    return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">Verify Your Email</h2>
        <p className="text-gray-600 text-center">
          We've sent a verification link to {email}. Please check your email and verify your account.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Create an Account</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="invitationCode" className="block text-gray-700 text-sm font-bold mb-2">
            Invitation Code
          </label>
          <input
            id="invitationCode"
            type="text"
            value={invitationCode}
            onChange={(e) => {
              setInvitationCode(e.target.value.trim());
              setInvitationError('');
            }}
            onBlur={handleInvitationBlur}
            className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
              invitationError ? 'border-red-300' : 'border-gray-300'
            }`}
            required
          />
          {invitationChecking && (
            <p className="text-sm text-gray-500">Checking invitation code...</p>
          )}
          {invitationError && (
            <p className="text-sm text-red-600">{invitationError}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailError('');
            }}
            onBlur={handleEmailBlur}
            className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
              emailError ? 'border-red-300' : 'border-gray-300'
            }`}
            required
          />
          {emailError && (
            <p className="text-sm text-red-600">{emailError}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
            minLength={6}
          />
          <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters long</p>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-gray-700 text-sm font-bold mb-2">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
            minLength={6}
          />
        </div>

        <button
          type="submit"
          className={`w-full flex items-center justify-center bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
            isSigningUp || isSigningUpWithGoogle ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          disabled={isSigningUp || isSigningUpWithGoogle}
        >
          {isSigningUp && <Spinner />}
          {isSigningUp ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      <div className="mt-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignUp}
          className={`w-full flex items-center justify-center bg-white hover:bg-gray-50 text-gray-700 font-bold py-2 px-4 border border-gray-300 rounded focus:outline-none focus:shadow-outline ${
            isSigningUp || isSigningUpWithGoogle ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          disabled={isSigningUp || isSigningUpWithGoogle}
        >
          {isSigningUpWithGoogle && <Spinner className="text-gray-700" />}
          {isSigningUpWithGoogle ? 'Creating Account...' : 'Sign up with Google'}
        </button>
      </div>

      <p className="mt-4 text-center text-gray-600 text-sm">
        Already have an account?{' '}
        <Link href="/signin" className="text-blue-500 hover:text-blue-700">
          Sign in
        </Link>
      </p>
    </div>
  );
}
