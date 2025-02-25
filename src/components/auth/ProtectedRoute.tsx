'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, needsValidation, isActive } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/signin');
      } else if (needsValidation) {
        router.push('/auth/validate-email');
      } else if (!isActive) {
        router.push('/auth/activate');
      }
    }
  }, [user, loading, needsValidation, isActive, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user || needsValidation || !isActive) {
    return null;
  }

  return <>{children}</>;
}
