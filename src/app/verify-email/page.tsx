'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { applyActionCode } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useAuth } from '@/context/AuthContext';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const verifyEmail = async () => {
      const oobCode = searchParams.get('oobCode');
      
      if (!oobCode) {
        setError('Invalid verification link. Please request a new verification email.');
        setIsVerifying(false);
        return;
      }

      try {
        await applyActionCode(auth, oobCode);
        // Force reload the user to get new token with email verified
        if (auth.currentUser) {
          await auth.currentUser.reload();
          if (auth.currentUser.emailVerified) {
            console.log('Email verified successfully');
            router.push('/auth/validate-email');
            return;
          }
        }
        setError('Failed to verify email. Please try again or request a new verification email.');
        setIsVerifying(false);
      } catch (error: any) {
        console.error('Error verifying email:', error);
        
        if (error.code === 'auth/invalid-action-code') {
          setError(
            'This verification link has expired or has already been used. ' +
            'Please request a new verification email.'
          );
        } else if (error.code === 'auth/user-not-found') {
          setError('User account not found. Please sign up again.');
        } else {
          setError('Failed to verify email. Please try again or request a new verification email.');
        }
        setIsVerifying(false);
      }
    };

    verifyEmail();
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="rounded-md bg-red-50 p-4 mb-6">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    {error}
                  </h3>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <button
                onClick={() => router.push('/auth/validate-email?action=resend')}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Request New Verification Email
              </button>
              <button
                onClick={() => router.push('/signin')}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
          <p className="mt-4 text-center text-sm text-gray-600">
            Verifying your email...
          </p>
        </div>
      </div>
    </div>
  );
}
