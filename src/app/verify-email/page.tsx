'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, refreshUserStatus, applyActionCode, auth } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);
  const verificationAttempted = useRef(false);

  useEffect(() => {
    const verifyEmail = async () => {
      // Only attempt verification once
      if (verificationAttempted.current) {
        return;
      }
      verificationAttempted.current = true;

      const oobCode = searchParams?.get('oobCode');
      
      if (!oobCode) {
        setError('Invalid verification link. Please request a new verification email.');
        setIsVerifying(false);
        return;
      }

      try {
        // Try to apply the action code
        await applyActionCode(oobCode);
      } catch (error: any) {
        console.error('Error applying action code:', error);
        // Don't set error yet - we'll check if verification succeeded anyway
      }

      // Check verification status regardless of applyActionCode result
      if (auth.currentUser) {
        await auth.currentUser.reload();
        if (auth.currentUser.emailVerified) {
          // Refresh user status to sync with backend
          await refreshUserStatus();
          router.push('/auth/validate-email');
          return;
        }
      }

      // Only show error if we actually failed to verify
      setError(
        'Failed to verify your email. The link may have expired or already been used. ' +
        'Please request a new verification email.'
      );
      setIsVerifying(false);
    };

    verifyEmail();
  }, [router, searchParams, refreshUserStatus]);

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
