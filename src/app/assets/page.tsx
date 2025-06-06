'use client';

import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useUserType } from '@/context/UserTypeContext';
import { useAuth } from '@/context/AuthContext';
import AssetsManagement from '@/app/assets/components/AssetsManagement';

export default function AssetsPage() {
  const router = useRouter();
  const { userType } = useUserType();
  const { user, loading: authLoading } = useAuth();

  // Redirect personal users to dashboard
  if (!authLoading && user && userType === 'personal') {
    router.push('/dashboard');
    return null;
  }

  return (
    <ProtectedRoute>
      <AssetsManagement />
    </ProtectedRoute>
  );
}
