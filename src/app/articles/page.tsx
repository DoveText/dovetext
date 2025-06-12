'use client';

import React from 'react';
import ArticlesManagement from './components/ArticlesManagement';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useUserType } from '@/context/UserTypeContext';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function ArticlesPage() {
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
      <ArticlesManagement />
    </ProtectedRoute>
  );
}
