'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function EmailValidationPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [cooldownTime, setCooldownTime] = useState(0);

  useEffect(() => {
    // If user is already validated, redirect to dashboard
    if (user?.settings?.validated && user?.is_active) {
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
    }
    return () => clearInterval(timer);
  }, [cooldownTime]);

  const handleResendEmail = async () => {
    if (cooldownTime > 0 || !user) return;

    try {
      // Send verification email
      await user.sendEmailVerification();
      
      // Update last sent timestamp
      const token = await user.getIdToken();
      await fetch('/api/auth/update-validation-sent', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setCooldownTime(60); // 60 second cooldown
    } catch (error) {
      console.error('Error sending verification email:', error);
    }
  };

  if (!user) {
    return null;
  }

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
            <div>
              <button
                onClick={handleResendEmail}
                disabled={cooldownTime > 0}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                  ${cooldownTime > 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
              >
                {cooldownTime > 0 ? `Resend in ${cooldownTime}s` : 'Resend Verification Email'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
