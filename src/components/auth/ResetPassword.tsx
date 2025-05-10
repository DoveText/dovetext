'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Spinner } from '@/components/common/Spinner';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [email, setEmail] = useState('');
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(true);
  
  const { auth, checkActionCode, confirmPasswordReset } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const oobCode = searchParams?.get('oobCode') || '';
  const mode = searchParams?.get('mode');

  useEffect(() => {
    const verifyCode = async () => {
      if (!oobCode || mode !== 'resetPassword') {
        setError('Invalid or expired password reset link');
        setIsVerifyingEmail(false);
        return;
      }

      try {
        const info = await checkActionCode(oobCode);
        const email = info.data.email;
        if (!email) {
          setError('Invalid or expired password reset link');
          setIsVerifyingEmail(false);
          return;
        }
        setEmail(email);
      } catch (error) {
        setError('Invalid or expired password reset link');
      } finally {
        setIsVerifyingEmail(false);
      }
    };

    verifyCode();
  }, [oobCode, mode, auth]);

  const validatePassword = () => {
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!oobCode || mode !== 'resetPassword' || !email) {
      setError('Invalid or expired password reset link');
      return;
    }

    if (!validatePassword()) {
      return;
    }

    try {
      setError('');
      setIsLoading(true);
      
      await confirmPasswordReset(oobCode, password, email);
      
      const response = await fetch('/public/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          newPassword: password,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update local password');
      }

      setIsSuccess(true);
      
      setTimeout(() => {
        router.push('/signin');
      }, 3000);
    } catch (error) {
      setError('Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Reset your password
          </h2>
        </div>
        
        {isSuccess ? (
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  Password reset successful! Redirecting to sign in...
                </p>
              </div>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-500 bg-gray-50 leading-tight focus:outline-none focus:shadow-outline border-gray-300"
                    readOnly
                  />
                  {isVerifyingEmail && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <Spinner className="h-5 w-5 text-gray-400" />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
                  New Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline border-gray-300"
                  placeholder="Enter your new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-gray-700 text-sm font-bold mb-2">
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline border-gray-300"
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading || isVerifyingEmail}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isLoading ? 'Resetting...' : 'Reset password'}
              </button>
            </div>

            <div className="mt-4 text-center text-sm">
              <Link href="/signin" className="text-indigo-600 hover:text-indigo-500">
                Back to sign in
              </Link>
              <span className="mx-2 text-gray-500">•</span>
              <Link href="/signup" className="text-indigo-600 hover:text-indigo-500">
                Create an account
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
