'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { documentsApi } from '@/app/api/documents';
import { useAuth } from '@/context/AuthContext';
import ArticleEditor from '../components/ArticleEditor';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function EditArticlePage() {
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
    
    // Get document ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const documentId = urlParams.get('id');
    
    if (!documentId) {
      alert('Document ID not found');
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Create content blob
      const contentBlob = new Blob([articleData.content], { type: 'text/markdown' });
      
      // Create file from blob
      const file = new File(
        [contentBlob], 
        `${articleData.title.toLowerCase().replace(/\s+/g, '-')}.md`, 
        { type: 'text/markdown' }
      );
      
      // Create metadata
      const meta = {
        title: articleData.title,
        author: user?.email || 'Unknown',
        category: articleData.category,
        filename: file.name
      };
      
      // Update the document
      await documentsApi.updateDocument(documentId, {
        meta,
        file,
        state: articleData.status
      });
      
      // Get current tags
      const currentTags = await documentsApi.getDocumentTags(documentId);
      
      // Remove tags that are no longer present
      const tagsToRemove = currentTags.filter(tag => !articleData.tags.includes(tag));
      await Promise.all(
        tagsToRemove.map(tag => documentsApi.removeTagFromDocument(documentId, tag))
      );
      
      // Add new tags
      const tagsToAdd = articleData.tags.filter(tag => !currentTags.includes(tag));
      await Promise.all(
        tagsToAdd.map(tag => documentsApi.addTagToDocument(documentId, tag))
      );
      
      // Navigate back to articles list
      router.push('/articles');
      
    } catch (error) {
      console.error('Error updating article:', error);
      alert('Failed to update article. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      router.push('/articles');
    }
  };

  console.log('Rendering EditArticlePage')

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ArticleEditor 
            mode="edit"
            onSave={handleSave}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    </ProtectedRoute>
  );
}
