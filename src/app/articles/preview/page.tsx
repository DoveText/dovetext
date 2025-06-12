'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { documentsApi } from '@/app/api/documents';
import { TagIcon, CalendarIcon, UserIcon, FolderIcon } from '@heroicons/react/24/outline';
import { MarkdownRenderer } from '@/components/markdown/MarkdownRenderer';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function ArticlePreviewPage() {
  const { user } = useAuth();
  
  return (
    <ProtectedRoute>
      <ArticlePreview />
    </ProtectedRoute>
  );
}

function ArticlePreview() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [lastModified, setLastModified] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get document ID from URL
  const searchParams = useSearchParams();
  const documentId = searchParams ? searchParams.get('id') : null;
  
  // Fetch document data
  useEffect(() => {
    const fetchDocumentData = async () => {
      if (!documentId) {
        setError('No document ID provided');
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        // Fetch document metadata
        const document = await documentsApi.getDocument(documentId);
        
        // Fetch document content
        const contentBlob = await documentsApi.getDocumentContent(documentId);
        const contentText = await contentBlob.text();
        
        // Fetch document tags
        const documentTags = await documentsApi.getDocumentTags(documentId);
        
        // Set state
        setTitle(document.meta?.title || '');
        setContent(contentText);
        setAuthor(document.meta?.author || '');
        setCategory(document.meta?.category || '');
        setTags(documentTags || []);
        setLastModified(document.updatedAt ? new Date(document.updatedAt) : null);
      } catch (error) {
        console.error('Error fetching document:', error);
        setError('Failed to load document. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDocumentData();
  }, [documentId]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-2">Loading article...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 w-full max-w-2xl">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
        <Link href="/articles" className="mt-4 text-blue-600 hover:text-blue-800">
          Return to Articles
        </Link>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg overflow-hidden">
        {/* Article Header */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{title}</h1>
          
          <div className="flex flex-wrap items-center text-sm text-gray-500 gap-4">
            {author && (
              <div className="flex items-center">
                <UserIcon className="h-4 w-4 mr-1" />
                <span>{author}</span>
              </div>
            )}
            
            {lastModified && (
              <div className="flex items-center">
                <CalendarIcon className="h-4 w-4 mr-1" />
                <span>
                  {lastModified.toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            )}
            
            {category && (
              <div className="flex items-center">
                <FolderIcon className="h-4 w-4 mr-1" />
                <span>{category}</span>
              </div>
            )}
          </div>
          
          {tags && tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <span 
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  <TagIcon className="h-3 w-3 mr-1" />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        
        {/* Article Content */}
        <div className="p-6">
          <div className="prose prose-blue max-w-none">
            <MarkdownRenderer content={content} />
          </div>
        </div>
        
        {/* Article Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <Link href="/articles" className="text-blue-600 hover:text-blue-800">
              ← Back to Articles
            </Link>
            <div className="flex space-x-2">
              <button 
                onClick={() => window.print()}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Print
              </button>
              <Link 
                href={`/articles/edit?id=${documentId}`}
                className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Edit Article
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
