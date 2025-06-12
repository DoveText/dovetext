'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { MarkdownEditor } from '@/components/markdown/MarkdownEditor';
import { documentsApi } from '@/app/api/documents';
import { TagIcon, DocumentTextIcon, XMarkIcon } from '@heroicons/react/24/outline';
import TaggedSelect from '@/components/common/TaggedSelect';

interface ArticleEditorProps {
  mode: 'create' | 'edit';
  onSave: (articleData: {
    title: string;
    content: string;
    status: string;
    category: string;
    tags: string[];
  }) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export default function ArticleEditor({
  mode,
  onSave,
  onCancel,
  isSubmitting
}: ArticleEditorProps) {
  // State for article data
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('draft');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(mode === 'edit');
  
  // Get document ID from URL if in edit mode
  const searchParams = useSearchParams();
  const documentId = searchParams ? searchParams.get('id') : null;
  
  // Fetch document data if in edit mode
  useEffect(() => {
    const fetchDocumentData = async () => {
      if (mode === 'edit' && documentId) {
        setIsLoading(true);
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
        } catch (error) {
          console.error('Error fetching document:', error);
          alert('Failed to load document. Please try again.');
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
        // For now, we'll use some mock data
        setAvailableTags(['technology', 'business', 'marketing', 'design', 'development']);
        setAvailableCategories(['Technology', 'Business', 'Marketing', 'Design', 'Development']);
      } catch (error) {
        console.error('Error fetching available options:', error);
      }
    };
    
    fetchAvailableOptions();
  }, []);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!title.trim()) {
      alert('Please enter a title');
      return;
    }
    
    if (!content.trim()) {
      alert('Please enter content');
      return;
    }
    
    // Save article
    await onSave({
      title,
      content,
      status,
      category,
      tags
    });
  };
  
  // Handle tag selection
  const handleTagsChange = (value: string | string[]) => {
    const newTags = Array.isArray(value) ? value : [];
    setTags(newTags);
    
    // Add any new tags to the available tags list
    const newAvailableTags = [...availableTags];
    newTags.forEach(tag => {
      if (!availableTags.includes(tag)) {
        newAvailableTags.push(tag);
      }
    });
    
    if (newAvailableTags.length !== availableTags.length) {
      setAvailableTags(newAvailableTags);
    }
  };
  
  // Handle creating a new tag
  const handleCreateTag = (newTag: string) => {
    // Add the new tag to both selected tags and available tags
    setTags([...tags, newTag]);
    if (!availableTags.includes(newTag)) {
      setAvailableTags([...availableTags, newTag]);
    }
  };
  
  // Convert available tags to TaggedSelect options
  const tagOptions = availableTags.map(tag => ({
    value: tag,
    label: tag
  }));
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-2 text-gray-500">Loading document...</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <DocumentTextIcon className="h-6 w-6 text-blue-600 mr-2" />
            <h1 className="text-xl font-bold text-gray-900">
              {mode === 'create' ? 'Create New Article' : 'Edit Article'}
            </h1>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
      </div>
      
      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6">
        {/* Title */}
        <div className="mb-6">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full text-base px-4 py-3 border-gray-300 rounded-md"
            placeholder="Enter article title"
            required
          />
        </div>
        
        {/* Status and Category */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <div className="relative">
              <select
                id="status"
                name="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full text-base px-4 py-3 border-gray-300 rounded-md appearance-none"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>
          
          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <div className="rounded-md shadow-sm">
              <TaggedSelect
                value={category}
                onChange={(value) => setCategory(Array.isArray(value) ? value[0] : value)}
                options={availableCategories.map(cat => ({ value: cat, label: cat }))}
                placeholder="Select a category"
                multiple={false}
                editable={false}
                className="min-h-[44px] py-1"
              />
            </div>
          </div>
        </div>
        
        {/* Tags */}
        <div className="mb-6">
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
            Tags
          </label>
          <div className="rounded-md shadow-sm">
            <TaggedSelect
              value={tags}
              onChange={handleTagsChange}
              options={tagOptions}
              placeholder="Add tags..."
              multiple={true}
              editable={true}
              className="min-h-[44px] py-1"
              onCreateOption={handleCreateTag}
            />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Tags help categorize your article and make it more discoverable
          </p>
        </div>
        
        {/* Content Editor */}
        <div className="mb-6">
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            Content
          </label>
          <div className="border border-gray-300 rounded-md overflow-hidden shadow-sm">
            <MarkdownEditor
              initialContent={content}
              onChange={setContent}
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
