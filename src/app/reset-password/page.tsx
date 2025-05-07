'use client';

import { useAuth } from '@/context/AuthContext';
import ResetPassword from '@/components/auth/ResetPassword';

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const { applyActionCode } = useAuth();
  
  // Handle the action code if present
  const oobCode = searchParams.oobCode as string;
  const mode = searchParams.mode as string;

  if (oobCode && mode === 'resetPassword') {
    try {
      // Verify the action code
      applyActionCode(oobCode);
    } catch (error) {
      console.error('Error verifying reset code:', error);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <ResetPassword />
      </div>
    </div>
  );
}
