'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { documentsApi } from '@/app/api/documents';
import { useAuth } from '@/context/AuthContext';
import ArticleEditor from '../components/ArticleEditor';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function CreateArticlePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async (articleData: {
    title: string;
    content: string;
    status: string;
    category: string;
    tags: string[];
  }) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      // Create content blob
      const contentBlob = new Blob([articleData.content], { type: 'text/markdown' });
      
      // Create filename
      const filename = `${articleData.title.toLowerCase().replace(/\s+/g, '-')}.md`;
      
      // Create file from blob
      const file = new File([contentBlob], filename, { type: 'text/markdown' });
      
      // Create metadata
      const metadata = {
        title: articleData.title,
        author: user?.email || 'Unknown',
        category: articleData.category,
        filename: filename
      };
      
      // Create the document
      const newDocument = await documentsApi.createDocument(file, metadata, articleData.status);
      
      // Add tags if any
      if (articleData.tags && articleData.tags.length > 0) {
        await Promise.all(
          articleData.tags.map(tag => documentsApi.addDocumentTag(newDocument.uuid, tag))
        );
      }
      
      // Navigate back to articles list
      router.push('/articles');
      
    } catch (error) {
      console.error('Error creating article:', error);
      alert('Failed to create article. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      router.push('/articles');
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ArticleEditor 
            mode="create"
            onSave={handleSave}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    </ProtectedRoute>
  );
}
