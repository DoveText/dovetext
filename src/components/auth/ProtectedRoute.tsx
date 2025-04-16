'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';
import TaskOrientedChat from '@/components/common/TaskOrientedChat';

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

  const pathname = usePathname();
  const contextType = pathname?.includes('/schedule') ? 'schedule' : pathname?.includes('/tasks') ? 'automation' : 'general';

  return (
    <>
      {children}
      <TaskOrientedChat contextType={contextType} />
    </>  
  );
}
