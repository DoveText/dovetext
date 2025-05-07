'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';

export default function EmailValidationPage() {
  const { user, sendVerificationEmail, getIdToken, refreshUserStatus } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cooldownTime, setCooldownTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshCooldown, setRefreshCooldown] = useState(0);
  const [hasTriedResend, setHasTriedResend] = useState(false);
  const resendAttempted = useRef(false);

  const handleResendEmail = useCallback(async () => {
    if (cooldownTime > 0 || !user) return;

    try {
      setError(null);
      setSuccess(null);
      // Send verification email using AuthContext function
      await sendVerificationEmail();
      
      // Update last sent timestamp
      const token = await getIdToken();
      await fetch('/api/v1/auth/update-validation-sent', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setSuccess('Verification email sent! Please check your inbox.');
      setCooldownTime(60); // 60 second cooldown
    } catch (error: any) {
      console.error('Error sending verification email:', error);
      if (error.code === 'auth/too-many-requests') {
        setError('Too many attempts. Please wait a few minutes before trying again.');
        setCooldownTime(300); // 5 minute cooldown on rate limit
      } else {
        setError('Failed to send verification email. Please try again later.');
      }
    }
  }, [cooldownTime, user, sendVerificationEmail, getIdToken]);

  // Handle automatic resend when coming from verify page
  useEffect(() => {
    const action = searchParams?.get('action');
    if (action === 'resend' && !cooldownTime && !resendAttempted.current) {
      resendAttempted.current = true;
      handleResendEmail();
    }
  }, [searchParams, cooldownTime, handleResendEmail]);

  useEffect(() => {
    // If user is already validated, redirect to dashboard
    if (user?.settings?.validated) {
      router.push('/dashboard');
    }
    // If no user, redirect to signin
    if (!user) {
      router.push('/signin');
    }
  }, [user, router]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldownTime > 0) {
      timer = setInterval(() => {
        setCooldownTime((prev) => prev - 1);
      }, 1000);
    } else {
      // Clear success message when cooldown ends
      setSuccess(null);
    }
    return () => clearInterval(timer);
  }, [cooldownTime]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (refreshCooldown > 0) {
      timer = setInterval(() => {
        setRefreshCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [refreshCooldown]);

  const handleRefreshStatus = async () => {
    if (refreshCooldown > 0 || !user) return;
    
    try {
      setIsRefreshing(true);
      setError(null);
      setSuccess(null);
      const userData = await refreshUserStatus();
      // Use type assertion to access custom properties on userData
      const typedUserData = userData as { settings?: { validated?: boolean } };
      
      if (typedUserData?.settings?.validated) {
        router.push('/dashboard');
      } else {
        setError('Email is not verified yet. Please check your inbox and click the verification link.');
        setRefreshCooldown(5); // 5 second cooldown for refresh
      }
    } catch (error) {
      console.error('Error refreshing status:', error);
      setError('Failed to check verification status. Please try again.');
      setRefreshCooldown(5);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Verify Your Email
        </h2>
        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            <div>
              <p className="text-sm text-gray-500">
                We sent a verification email to <span className="font-medium">{user.email}</span>.
                Please check your inbox and click the verification link.
              </p>
            </div>
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      {error}
                    </h3>
                  </div>
                </div>
              </div>
            )}
            {success && (
              <div className="rounded-md bg-green-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">
                      {success}
                    </h3>
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-3">
              <button
                onClick={handleResendEmail}
                disabled={cooldownTime > 0}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                  ${cooldownTime > 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
              >
                {cooldownTime > 0 ? `Wait ${cooldownTime}s to resend` : 'Resend Verification Email'}
              </button>
              
              <button
                onClick={handleRefreshStatus}
                disabled={refreshCooldown > 0 || isRefreshing}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                  ${refreshCooldown > 0 || isRefreshing ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
              >
                {isRefreshing ? 'Checking...' : refreshCooldown > 0 ? `Wait ${refreshCooldown}s to check again` : `I've Verified My Email`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
