'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * Client-side component that handles Firebase auth action URLs
 * This replaces the server-side route handler at /auth/action/route.ts
 */
export function ActionHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const mode = searchParams.get('mode');
    const oobCode = searchParams.get('oobCode');
    
    if (!mode || !oobCode) {
      router.push('/');
      return;
    }

    switch (mode) {
      case 'resetPassword':
        router.push(`/reset-password?mode=${mode}&oobCode=${oobCode}`);
        break;
      case 'verifyEmail':
        router.push(`/verify-email?mode=${mode}&oobCode=${oobCode}`);
        break;
      case 'recoverEmail':
        router.push(`/recover-email?mode=${mode}&oobCode=${oobCode}`);
        break;
      default:
        router.push('/');
        break;
    }
  }, [router, searchParams]);

  // Return null or a loading indicator while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}
