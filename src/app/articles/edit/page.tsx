'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { documentsApi } from '@/app/api/documents';
import { useAuth } from '@/context/AuthContext';
import ArticleEditor from '../components/ArticleEditor';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { ArticleMeta, ArticleMetadata } from '../utils/article-meta';
// Use a simple loading indicator instead of importing a component that might not exist
// We'll create a simple inline loading component

export default function EditArticlePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [documentData, setDocumentData] = useState<{
    id: string;
    title: string;
    content: string;
    status: string;
    category: string;
    tags: string[];
    suggestedTitles: string[];
  } | null>(null);

  // Fetch document data when component mounts
  useEffect(() => {
    const fetchDocumentData = async () => {
      setIsLoading(true);
      
      // Get document ID from URL
      const urlParams = new URLSearchParams(window.location.search);
      const documentId = urlParams.get('id');
      
      if (!documentId) {
        alert('Document ID not found');
        router.push('/articles');
        return;
      }
      
      try {
        // Fetch document metadata
        const document = await documentsApi.getDocument(documentId);
        
        // Fetch document content
        const contentBlob = await documentsApi.getDocumentContent(documentId);
        const content = await contentBlob.text();
        
        // Fetch document tags
        const tags = await documentsApi.getDocumentTags(documentId);
        
        // Extract suggested titles from metadata using ArticleMeta
        const suggestedTitles = ArticleMeta.getSuggestedTitles(document.meta);
        
        // Set document data
        setDocumentData({
          id: documentId,
          title: document.meta?.title || '',
          content,
          status: document.state || 'draft',
          category: document.meta?.category || '',
          tags: tags || [],
          suggestedTitles
        });
      } catch (error) {
        console.error('Error fetching document:', error);
        alert('Failed to load document. Please try again.');
        router.push('/articles');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDocumentData();
  }, [router]);

  const handleSave = async (articleData: {
    title: string;
    content: string;
    status: string;
    category: string;
    tags: string[];
    meta?: {
      suggested_titles?: string[];
      [key: string]: any;
    };
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
      
      // Get the document again to ensure we have the latest metadata
      const document = await documentsApi.getDocument(documentId);
      // Create metadata using MetadataManager to ensure consistency
      const originalMeta = document.meta || {};
      const updatedMeta: ArticleMetadata = {
        title: articleData.title,
        author: user?.email || 'Unknown',
        category: articleData.category,
        filename: file.name,
        ...(articleData.meta || {})
      };
      
      // Merge and normalize metadata to preserve important fields
      const meta = ArticleMeta.normalizeMetadata(
        ArticleMeta.mergeMetadata(originalMeta, updatedMeta)
      );
      
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

  // Simple loading component
  const LoadingIndicator = () => (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      <span className="ml-3 text-lg">Loading document...</span>
    </div>
  );

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <LoadingIndicator />
          ) : documentData ? (
            <ArticleEditor 
              mode="edit"
              onSave={handleSave}
              onCancel={handleCancel}
              isSubmitting={isSubmitting}
              initialTitle={documentData.title}
              initialContent={documentData.content}
              initialStatus={documentData.status}
              initialCategory={documentData.category}
              initialTags={documentData.tags}
              initialSuggestedTitles={documentData.suggestedTitles}
            />
          ) : (
            <div className="text-center py-10">
              <p className="text-red-500">Failed to load document. Please try again.</p>
              <button 
                onClick={() => router.push('/articles')} 
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Return to Articles
              </button>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
