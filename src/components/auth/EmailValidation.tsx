'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/common/Spinner';

const RESEND_COOLDOWN = 60; // seconds

export default function EmailValidation() {
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  const { user, sendVerificationEmail } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If user is null or already validated, redirect to dashboard
    if (!user || (user.settings?.validated && user.is_active)) {
      router.push('/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    // Set up cooldown timer if validationSentAt exists
    // Using type assertion since validationSentAt is not in the UserSettings interface
    if (user?.settings) {
      const userSettings = user.settings as (typeof user.settings & { validationSentAt?: string });
      if (userSettings.validationSentAt) {
        const lastSent = new Date(userSettings.validationSentAt).getTime();
        const now = new Date().getTime();
        const diff = Math.floor((now - lastSent) / 1000);
        
        if (diff < RESEND_COOLDOWN) {
          setCooldownTime(RESEND_COOLDOWN - diff);
        }
      }
    }
  }, [user]);

  useEffect(() => {
    // Countdown timer
    if (cooldownTime > 0) {
      const timer = setInterval(() => {
        setCooldownTime(time => time - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldownTime]);

  const handleResendEmail = async () => {
    if (cooldownTime > 0) return;
    
    try {
      setError('');
      setIsSending(true);

      await sendVerificationEmail();
      
      // Update validation sent timestamp
      const response = await fetch('/public/auth/update-validation-sent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to update validation timestamp');
      }

      setCooldownTime(RESEND_COOLDOWN);
    } catch (err) {
      console.error('Error sending verification email:', err);
      setError('Failed to send verification email. Please try again later.');
    } finally {
      setIsSending(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">
        Verify Your Email
      </h2>
      
      <div className="text-center mb-6">
        <p className="text-gray-600">
          We&apos;ve sent a verification link to <span className="font-semibold">{user.email}</span>.
          Please check your email and click the link to verify your account.
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div className="mt-6">
        <button
          onClick={handleResendEmail}
          disabled={isSending || cooldownTime > 0}
          className={`w-full flex items-center justify-center bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
            (isSending || cooldownTime > 0) ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isSending ? (
            <Spinner className="h-4 w-4" />
          ) : cooldownTime > 0 ? (
            `Resend available in ${cooldownTime}s`
          ) : (
            'Resend verification email'
          )}
        </button>
      </div>

      <div className="mt-4 text-center text-sm text-gray-500">
        <p>
          Didn&apos;t receive the email? Check your spam folder or request a new verification email.
        </p>
      </div>
    </div>
  );
}
