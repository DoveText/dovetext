'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { MarkdownEditor } from '@/components/markdown/MarkdownEditor';
import { documentsApi } from '@/app/api/documents';
import { articleAiApi } from '@/app/api/article-ai';
import { tagsApi } from '@/app/api/tags';
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
  initialSuggestedTitles?: string[];
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
  initialSuggestedTitles = [],
  onWizardOpen
}: ArticleEditorProps) {
  // State for article data
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [status, setStatus] = useState(initialStatus);
  const [category, setCategory] = useState(initialCategory);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [suggestedTitles, setSuggestedTitles] = useState<string[]>(initialSuggestedTitles);
  
  // Update title when initialTitle changes
  useEffect(() => {
    if (initialTitle) {
      setTitle(initialTitle);
    }
  }, [initialTitle]);
  
  // Update content when initialContent changes
  useEffect(() => {
    if (initialContent) {
      setContent(initialContent);
    }
  }, [initialContent]);
  
  // Update suggestedTitles when initialSuggestedTitles changes
  useEffect(() => {
    if (initialSuggestedTitles && initialSuggestedTitles.length > 0) {
      setSuggestedTitles(initialSuggestedTitles);
    }
  }, [initialSuggestedTitles]);
  const [isTitleDialogOpen, setIsTitleDialogOpen] = useState(false);
  const [isTitleDropdownOpen, setIsTitleDropdownOpen] = useState(false);
  
  // References for click outside handling
  const titleDropdownRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const titleButtonRef = useRef<HTMLButtonElement>(null);
  
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
          
          // Set suggested titles if available in document meta
          if (document.meta?.suggested_titles && Array.isArray(document.meta.suggested_titles)) {
            setSuggestedTitles(document.meta.suggested_titles);
          }
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
  
  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (isTitleDropdownOpen && 
          titleDropdownRef.current && 
          titleInputRef.current && 
          titleButtonRef.current && 
          !titleDropdownRef.current.contains(event.target as Node) &&
          !titleInputRef.current.contains(event.target as Node) &&
          !titleButtonRef.current.contains(event.target as Node)) {
        setIsTitleDropdownOpen(false);
      }
    }
    
    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isTitleDropdownOpen]);
  
  // Fetch available tags and categories
  useEffect(() => {
    const fetchAvailableOptions = async () => {
      try {
        // Fetch document tags from the server using the tags API
        const documentTags = await tagsApi.getTagsByType('documents') as string[];
        setAvailableTags(documentTags);
        
        // For now, we'll still use mock data for categories
        // In a real app, you would fetch these from the server as well
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
    
    // Include suggested titles in the metadata
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
  };

  const handleContentChange = useCallback(async (content : string) => {
    setContent(content);

    // TODO: how to save to backend ...
  }, [setContent])

  // Handle title generation request
  const handleGenerateTitles = useCallback(async (direction: string) => {
    // Validate content length
    if (!content || content.trim().length < 50) {
      throw new Error('Content is too short for title generation. Please provide more content in your article first.');
    }
    
    try {
      const request = {
        content: content,
        keywords: tags,
        direction
      };
      
      const response = await articleAiApi.generateTitles(request);
      if (response.titles && response.titles.length > 0) {
        // Update suggested titles
        setSuggestedTitles(prev => {
          // Add new titles that don't already exist
          const newTitles = [...prev];
          response.titles.forEach(title => {
            if (!newTitles.includes(title)) {
              newTitles.push(title);
            }
          });
          return newTitles;
        });
        
        return response.titles;
      }
      return [];
    } catch (error) {
      console.error('Error generating titles:', error);
      throw error;
    }
  }, [content, tags]);
  
  // Handle selecting a title from the dropdown or dialog
  const handleTitleSelect = (selectedTitle: string) => {
    if (selectedTitle === "__generate_new__") {
      setIsTitleDialogOpen(true);
    } else {
      setTitle(selectedTitle);
    }
  };
  
  // Handle new titles generated from the dialog
  const handleNewTitlesGenerated = (newTitles: string[]) => {
    setSuggestedTitles(newTitles);
    if (newTitles.length > 0) {
      setTitle(newTitles[0]);
    }
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
  
  console.log('Render with initial titles:', suggestedTitles);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <DocumentTextIcon className="h-6 w-6 text-blue-600 mr-2" />
            <h1 className="text-xl font-bold text-gray-900">
              {mode === 'create' ? 'Create New Article' : 'Edit Article'}
            </h1>
          </div>
          <div className="flex items-center space-x-2">
            {mode === 'create' && onWizardOpen && (
              <button
                type="button"
                onClick={onWizardOpen}
                className="inline-flex items-center px-3 py-1.5 border border-blue-500 text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                AI Wizard
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Status and Category */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <div className="rounded-md shadow-sm">
              <TaggedSelect
                  value={status}
                  onChange={(value) => setStatus(Array.isArray(value) ? value[0] : value)}
                  options={[
                    {value: 'draft', label: 'Draft'},
                    {value: 'published', label: 'Published'},
                    {value: 'archived', label: 'Archived'}
                  ]}
                  placeholder="Select a status"
                  multiple={false}
                  editable={false}
                  className="min-h-[44px] py-1"
              />
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
                  options={availableCategories.map(cat => ({value: cat, label: cat}))}
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

        {/* Title */}
        <div className="mb-6">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <div className="relative">
            <div className="relative w-full">
              <input
                  type="text"
                  id="title"
                  ref={titleInputRef}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onFocus={() => setIsTitleDropdownOpen(true)}
                  className="block w-full rounded-md py-2 pl-3 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  placeholder="Enter article title"
              />
              {/* Dropdown toggle button */}
              <button
                  type="button"
                  ref={titleButtonRef}
                  onClick={() => setIsTitleDropdownOpen(!isTitleDropdownOpen)}
                  className="absolute inset-y-0 right-0 flex items-center pr-2"
              >
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                     fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"/>
                </svg>
              </button>

              <div 
                  ref={titleDropdownRef}
                  className={`${isTitleDropdownOpen ? '' : 'hidden'} absolute z-50 top-full mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm`}>
                {/* Current title if not in suggested titles */}
                {title && !suggestedTitles.includes(title) && (
                    <div
                        className="text-gray-900 cursor-pointer select-none relative py-2 pl-3 pr-9 bg-indigo-50 font-medium"
                        onClick={() => setIsTitleDropdownOpen(false)}
                    >
                      {title}
                    </div>
                )}

                {/* Suggested titles - filtered by current input */}
                {suggestedTitles
                  .filter(suggestedTitle => 
                    !title || suggestedTitle.toLowerCase().includes(title.toLowerCase())
                  )
                  .map((suggestedTitle, index) => (
                    <div
                        key={index}
                        className={`cursor-pointer select-none relative py-2 pl-3 pr-9 ${title === suggestedTitle ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-gray-900 hover:bg-gray-100'}`}
                        onClick={() => {
                          setTitle(suggestedTitle);
                          setIsTitleDropdownOpen(false);
                        }}
                    >
                      {suggestedTitle}
                      {title === suggestedTitle && (
                          <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-indigo-600">
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd"
                                d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                                clipRule="evenodd"/>
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
                      setIsTitleDropdownOpen(false);
                    }}
                >
                  <div className="flex items-center">
                    <SparklesIcon className="h-4 w-4 mr-2"/>
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
                  onClose={() => {
                    setIsTitleDialogOpen(false);
                  }}
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

        {/* Content Editor */}
        <div className="mb-6">
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            Content
          </label>
          <div className="border border-gray-300 rounded-md overflow-hidden shadow-sm">
            <MarkdownEditor
                key={`editor-${Date.now()}`} /* Force re-render with unique key */
                initialContent={content || initialContent}
                onChange={handleContentChange}
                placeholder="Write your article content here..."
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
              type="button"
              onClick={(e) : void => {
                // Call handleSubmit directly instead of relying on form submiss
                handleSubmit(e);
              }}
              className="inline-flex items-center px-5 py-3 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isSubmitting}
          >
            {isSubmitting ? (
                <>
                  <div
                      className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  {mode === 'create' ? 'Creating...' : 'Saving...'}
                </>
            ) : (
                mode === 'create' ? 'Create Article' : 'Update Article'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
