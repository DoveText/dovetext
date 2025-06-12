'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import ArticleCreationWizard from './components/ArticleCreationWizard';

export default function CreateArticlePage() {
  const router = useRouter();

  const handleCancel = () => {
    router.push('/articles');
  };

  return (
    <ProtectedRoute>
      <ArticleCreationWizard onCancel={handleCancel} />
    </ProtectedRoute>
  );
}
