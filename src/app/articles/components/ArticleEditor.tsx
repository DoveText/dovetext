'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { MarkdownEditor } from '@/components/markdown/MarkdownEditor';
import { documentsApi } from '@/app/api/documents';
import { articleAiApi } from '@/app/api/article-ai';
import { TagIcon, DocumentTextIcon, XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline';
import TaggedSelect from '@/components/common/TaggedSelect';
import { TitleGenerationDialog } from './TitleGenerationDialog';

interface ArticleEditorProps {
  mode: 'create' | 'edit';
  onSave: (articleData: {
    title: string;
    content: string;
    status: string;
    category: string;
    tags: string[];
    meta?: {
      suggested_titles?: string[];
      [key: string]: any;
    };
  }) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  initialTitle?: string;
  initialContent?: string;
  initialStatus?: string;
  initialCategory?: string;
  initialTags?: string[];
  onWizardOpen?: () => void;
}

export default function ArticleEditor({
  mode,
  onSave,
  onCancel,
  isSubmitting,
  initialTitle = '',
  initialContent = '',
  initialStatus = 'draft',
  initialCategory = '',
  initialTags = [],
  onWizardOpen
}: ArticleEditorProps) {
  // State for article data
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [status, setStatus] = useState(initialStatus);
  const [category, setCategory] = useState(initialCategory);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [suggestedTitles, setSuggestedTitles] = useState<string[]>([]);
  const [isTitleDialogOpen, setIsTitleDialogOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // State for available options
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  
  // State for loading and error
  const [isLoading, setIsLoading] = useState(mode === 'edit');
  const [error, setError] = useState<string | null>(null);

  // Get document ID from URL if in edit mode
  const searchParams = useSearchParams();
  const documentId = searchParams ? searchParams.get('id') : null;
  
  // Fetch document data if in edit mode
  useEffect(() => {
    const fetchDocumentData = async () => {
      if (mode === 'edit') {
        setIsLoading(true);
        
        // Check if document ID exists
        if (!documentId) {
          setError('No document ID provided. Please select a document to edit.');
          setIsLoading(false);
          return;
        }
        
        try {
          // Fetch document
          const document = await documentsApi.getDocument(documentId);
          
          // Fetch document content
          const contentBlob = await documentsApi.getDocumentContent(documentId);
          // Convert blob to text
          const content = await contentBlob.text();
          
          // Fetch document tags
          const tags = await documentsApi.getDocumentTags(documentId);
          
          // Set state
          setTitle(document.meta?.title || '');
          setContent(content);
          setStatus(document.state || 'draft');
          setCategory(document.meta?.category || '');
          setTags(tags || []);
          
          // Set suggested titles if available in document meta
          if (document.meta?.suggested_titles && Array.isArray(document.meta.suggested_titles)) {
            setSuggestedTitles(document.meta.suggested_titles);
          }
        } catch (error) {
          console.error('Error fetching document:', error);
          setError('Failed to load document. Please try again.');
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    fetchDocumentData();
  }, [mode, documentId]);
  
  // Fetch available tags and categories
  useEffect(() => {
    const fetchAvailableOptions = async () => {
      try {
        // In a real app, you would fetch these from the server
        // For now, we'll use some dummy data
        setAvailableTags(['technology', 'programming', 'design', 'business', 'marketing']);
        setAvailableCategories(['tutorial', 'blog', 'news', 'review', 'opinion']);
      } catch (error) {
        console.error('Error fetching available options:', error);
      }
    };
    
    fetchAvailableOptions();
  }, []);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Call onSave with article data
      await onSave({
        title,
        content,
        status,
        category,
        tags,
        meta: {
          suggested_titles: suggestedTitles
        }
      });
    } catch (error) {
      console.error('Error saving article:', error);
    }
  };
  
  // Handle title dropdown toggle
  const handleTitleDropdownToggle = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };
  
  // Handle title input change
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };
  
  // Handle title selection from dropdown
  const handleTitleSelect = (selectedTitle: string) => {
    setTitle(selectedTitle);
    setIsDropdownOpen(false);
  };
  
  // Handle new titles generated from dialog
  const handleNewTitlesGenerated = (newTitles: string[]) => {
    setSuggestedTitles([...newTitles]);
    if (newTitles.length > 0) {
      setTitle(newTitles[0]);
    }
  };
  
  // Handle tag selection
  const handleTagsChange = (value: string | string[]) => {
    if (Array.isArray(value)) {
      setTags(value);
    } else {
      setTags([value]);
    }
  };
  
  // Handle creating a new tag
  const handleCreateTag = (newTag: string) => {
    setAvailableTags([...availableTags, newTag]);
    setTags([...tags, newTag]);
  };
  
  // Handle generating titles with AI
  const handleGenerateTitles = useCallback(async (prompt: string) => {
    try {
      const generatedTitles = await articleAiApi.generateTitles(content, prompt);
      return generatedTitles;
    } catch (error) {
      console.error('Error generating titles:', error);
      return [];
    }
  }, [content]);
  
  // Convert available tags to TaggedSelect options
  const tagOptions = availableTags.map(tag => ({
    value: tag,
    label: tag
  }));

  // If there's an error (like no document ID), show an error message
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 p-6 bg-white rounded-lg shadow">
        <div className="text-center">
          <XMarkIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.href = '/articles'}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Return to Articles
          </button>
        </div>
      </div>
    );
  }

  // Show loading spinner while fetching document
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-2 text-gray-600">Loading document...</p>
        </div>
      </div>
    );
  }

  // Main editor form
  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title Input with Dropdown */}
        <div className="mb-6">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <div className="relative">
            <div className="flex">
              <input
                type="text"
                id="title"
                name="title"
                value={title}
                onChange={handleTitleChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Enter article title"
                required
              />
              <button
                type="button"
                className="ml-2 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={handleTitleDropdownToggle}
              >
                <DocumentTextIcon className="h-4 w-4 mr-1" />
                <span>Select</span>
              </button>
            </div>
            
            {/* Title dropdown */}
            <div
              id="titleDropdown"
              className={`absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm ${
                isDropdownOpen ? '' : 'hidden'
              }`}
            >
              <div className="py-1">
                {/* Suggested titles */}
                {suggestedTitles.map((suggestedTitle, index) => (
                  <div
                    key={index}
                    className="cursor-pointer select-none relative py-2 pl-3 pr-9 text-gray-900 hover:bg-gray-100"
                    onClick={() => handleTitleSelect(suggestedTitle)}
                  >
                    {suggestedTitle}
                    {title === suggestedTitle && (
                      <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-indigo-600">
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                        </svg>
                      </span>
                    )}
                  </div>
                ))}
                
                {/* Generate option */}
                <div
                  className="cursor-pointer select-none relative py-2 pl-3 pr-9 text-blue-600 hover:bg-gray-100 border-t border-gray-200"
                  onClick={() => {
                    setIsTitleDialogOpen(true);
                    setIsDropdownOpen(false);
                  }}
                >
                  <div className="flex items-center">
                    <SparklesIcon className="h-4 w-4 mr-2" />
                    <span>✨ Generate New Titles...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Title generation dialog */}
          {isTitleDialogOpen && (
            <TitleGenerationDialog
              isOpen={isTitleDialogOpen}
              onClose={() => setIsTitleDialogOpen(false)}
              onSelectTitle={(selectedTitle) => {
                setTitle(selectedTitle);
                // Add to suggested titles if not already there
                if (!suggestedTitles.includes(selectedTitle)) {
                  setSuggestedTitles([...suggestedTitles, selectedTitle]);
                }
                setIsTitleDialogOpen(false);
              }}
              onGenerateTitles={handleGenerateTitles}
            />
          )}
        </div>
        
        {/* Status and Category */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          
          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              id="category"
              name="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">Select a category</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Tags */}
        <div className="mb-6">
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
            Tags
          </label>
          <TaggedSelect
            options={tagOptions}
            value={tags}
            onChange={handleTagsChange}
            onCreateOption={handleCreateTag}
            placeholder="Select or create tags"
            isMulti
            className="w-full"
          />
        </div>
        
        {/* Content Editor */}
        <div className="mb-6">
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            Content
          </label>
          <div className="border border-gray-300 rounded-md overflow-hidden shadow-sm">
            <MarkdownEditor
              key={documentId || 'new'} /* Force re-render when documentId changes */
              initialContent={content}
              onChange={(newContent) => setContent(newContent)}
              placeholder="Write your article content here..."
              minHeight="500px"
              format="markdown"
            />
          </div>
        </div>
        
        {/* Form Actions */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center px-5 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center px-5 py-3 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                {mode === 'create' ? 'Creating...' : 'Saving...'}
              </>
            ) : (
              mode === 'create' ? 'Create Article' : 'Save Changes'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}