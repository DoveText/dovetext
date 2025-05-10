'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import ResetPassword from '@/components/auth/ResetPassword';
import { useClientSearchParams } from '@/hooks/useClientSearchParams';

export default function ResetPasswordPage() {
  const { applyActionCode } = useAuth();
  const { get, isClient } = useClientSearchParams();
  const [codeVerified, setCodeVerified] = useState(false);
  
  // Use useEffect to handle client-side code verification
  useEffect(() => {
    // Only run on the client side
    if (!isClient || codeVerified) return;
    
    // Handle the action code if present
    const oobCode = get('oobCode');
    const mode = get('mode');

    if (oobCode && mode === 'resetPassword') {
      try {
        // Verify the action code
        applyActionCode(oobCode);
        setCodeVerified(true);
      } catch (error) {
        console.error('Error verifying reset code:', error);
      }
    }
  }, [isClient, codeVerified, get, applyActionCode]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <ResetPassword />
      </div>
    </div>
  );
}
