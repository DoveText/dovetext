'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, needsValidation } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/signin');
      } else if (needsValidation) {
        console.log('User needs validation');
        router.push('/auth/validate-email');
      }
    }
  }, [user, loading, needsValidation, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user || needsValidation) {
    return null;
  }

  return <>{children}</>;
}
