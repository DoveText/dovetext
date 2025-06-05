'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Spinner } from '@/components/common/Spinner';
import { Blog, BlogCreateRequest, BlogUpdateRequest, blogsApi } from '../api/blogs';
import { aiApi } from '../api/ai';
import MarkdownEditor from '@/components/markdown/MarkdownEditor';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  CheckIcon, 
  ArchiveBoxIcon,
  DocumentTextIcon,
  DocumentDuplicateIcon,
  DocumentIcon,
  ArrowPathIcon,
  XMarkIcon,
  SparklesIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';

export default function BlogsPage() {
  return (
    <ProtectedRoute>
      <BlogsManager />
    </ProtectedRoute>
  );
}

function BlogsManager() {
  const { user } = useAuth();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<'all' | 'published' | 'draft' | 'archived'>('all');
  const [editorTab, setEditorTab] = useState<'info' | 'content'>('info');
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [initialContent, setInitialContent] = useState('');
  
  // Form data state
  const [formData, setFormData] = useState<{
    title: string;
    slug: string;
    content: string;
    excerpt: string;
    author: string;
    coverImage: string;
    tags: string;
    status: 'draft' | 'published' | 'archived';
  }>({    
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    author: user?.displayName || '',
    coverImage: '',
    tags: '',
    status: 'draft'
  });
  
  // AI generation states
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [showAiPromptModal, setShowAiPromptModal] = useState(false);
  const [aiAction, setAiAction] = useState<'generate' | 'refine' | 'schema'>('generate');
  const [aiInstructions, setAiInstructions] = useState('');
  
  // Track if the editor has unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load blogs on component mount
  useEffect(() => {
    loadBlogs();
  }, [filterTab]);

  // Effect to initialize form data when a blog is selected for editing
  useEffect(() => {
    if (selectedBlog) {
      setFormData({
        title: selectedBlog.title,
        slug: selectedBlog.slug,
        content: selectedBlog.content,
        excerpt: selectedBlog.excerpt,
        author: selectedBlog.author,
        coverImage: selectedBlog.coverImage || '',
        tags: selectedBlog.tags.join(', '),
        status: selectedBlog.status
      });
      setInitialContent(selectedBlog.content);
      setIsCreatingNew(false);
    } else if (isCreatingNew) {
      // Reset form for new blog
      setFormData({
        title: '',
        slug: '',
        content: '',
        excerpt: '',
        author: user?.displayName || '',
        coverImage: '',
        tags: '',
        status: 'draft'
      });
      setInitialContent('');
    }
    setHasUnsavedChanges(false);
  }, [selectedBlog, isCreatingNew, user]);

  // Load blogs based on active tab
  const loadBlogs = async () => {
    setLoading(true);
    setError(null);
    try {
      let loadedBlogs: Blog[];
      if (filterTab === 'all') {
        loadedBlogs = await blogsApi.getAllBlogs();
      } else {
        loadedBlogs = await blogsApi.getBlogsByStatus(filterTab);
      }
      setBlogs(loadedBlogs);
      
      // If we had a selected blog, update it with the latest data
      if (selectedBlog) {
        const updatedSelectedBlog = loadedBlogs.find(blog => blog.id === selectedBlog.id);
        if (updatedSelectedBlog) {
          setSelectedBlog(updatedSelectedBlog);
        }
      }
    } catch (err) {
      console.error('Error loading blogs:', err);
      setError('Failed to load blogs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Create a new blog
  const createBlog = async () => {
    if (!validateForm()) return false;
    
    setFormSubmitting(true);
    try {
      const blogData: BlogCreateRequest = {
        title: formData.title,
        slug: formData.slug || undefined,
        content: formData.content,
        excerpt: formData.excerpt || undefined,
        author: formData.author || user?.displayName || 'Anonymous',
        coverImage: formData.coverImage || undefined,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
        status: formData.status
      };
      
      const newBlog = await blogsApi.createBlog(blogData);
      setBlogs(prevBlogs => [...prevBlogs, newBlog]);
      setSelectedBlog(newBlog);
      setIsCreatingNew(false);
      setHasUnsavedChanges(false);
      return true;
    } catch (err) {
      console.error('Error creating blog:', err);
      setError('Failed to create blog. Please try again.');
      return false;
    } finally {
      setFormSubmitting(false);
    }
  };

  // Update an existing blog
  const updateBlog = async () => {
    if (!selectedBlog || !validateForm()) return false;
    
    setFormSubmitting(true);
    try {
      const blogData: BlogUpdateRequest = {
        id: selectedBlog.id,
        title: formData.title,
        slug: formData.slug || undefined,
        content: formData.content,
        excerpt: formData.excerpt || undefined,
        author: formData.author || user?.displayName || 'Anonymous',
        coverImage: formData.coverImage || undefined,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
        status: formData.status
      };
      
      const updatedBlog = await blogsApi.updateBlog(blogData);
      setBlogs(prevBlogs => 
        prevBlogs.map(blog => blog.id === updatedBlog.id ? updatedBlog : blog)
      );
      setSelectedBlog(updatedBlog);
      setHasUnsavedChanges(false);
      return true;
    } catch (err) {
      console.error('Error updating blog:', err);
      setError('Failed to update blog. Please try again.');
      return false;
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete a blog
  const deleteBlog = async (id: number) => {
    if (!confirm('Are you sure you want to delete this blog?')) return;
    
    try {
      await blogsApi.deleteBlog(id);
      setBlogs(prevBlogs => prevBlogs.filter(blog => blog.id !== id));
      
      // If the deleted blog was selected, clear the selection
      if (selectedBlog?.id === id) {
        setSelectedBlog(null);
        setIsCreatingNew(false);
      }
    } catch (err) {
      console.error('Error deleting blog:', err);
      setError('Failed to delete blog. Please try again.');
    }
  };

  // Publish a blog
  const publishBlog = async (id: number) => {
    try {
      const updatedBlog = await blogsApi.publishBlog(id);
      setBlogs(prevBlogs => 
        prevBlogs.map(blog => blog.id === updatedBlog.id ? updatedBlog : blog)
      );
      
      // If the published blog was selected, update the selection
      if (selectedBlog?.id === id) {
        setSelectedBlog(updatedBlog);
      }
    } catch (err) {
      console.error('Error publishing blog:', err);
      setError('Failed to publish blog. Please try again.');
    }
  };

  // Archive a blog
  const archiveBlog = async (id: number) => {
    try {
      const updatedBlog = await blogsApi.archiveBlog(id);
      setBlogs(prevBlogs => 
        prevBlogs.map(blog => blog.id === updatedBlog.id ? updatedBlog : blog)
      );
      
      // If the archived blog was selected, update the selection
      if (selectedBlog?.id === id) {
        setSelectedBlog(updatedBlog);
      }
    } catch (err) {
      console.error('Error archiving blog:', err);
      setError('Failed to archive blog. Please try again.');
    }
  };
  
  // Validate form data
  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Title is required');
      return false;
    }
    if (!formData.content.trim()) {
      setError('Content is required');
      return false;
    }
    if (!formData.author.trim()) {
      setError('Author is required');
      return false;
    }
    return true;
  };
  
  // Handle form field changes
  const handleFormChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };
  
  // AI content generation
  const generateAiContent = async () => {
    if (!aiPrompt.trim()) {
      setError('Please enter a prompt for AI generation');
      return;
    }
    
    setAiGenerating(true);
    setError(null);
    
    try {
      let result;
      
      if (aiAction === 'generate') {
        // Generate new content
        result = await aiApi.generateContent({ prompt: aiPrompt });
        handleFormChange('content', result.content);
        setInitialContent(result.content);
      } else if (aiAction === 'refine') {
        // Refine existing content
        result = await aiApi.refineContent({ 
          content: formData.content, 
          instructions: aiInstructions 
        });
        handleFormChange('content', result.refined_content);
        setInitialContent(result.refined_content);
      } else if (aiAction === 'schema') {
        // Generate document schema/outline
        result = await aiApi.generateSchema({ 
          topic: aiPrompt,
          description: aiInstructions 
        });
        handleFormChange('content', result.schema);
        setInitialContent(result.schema);
      }
      
      setShowAiPromptModal(false);
      setAiPrompt('');
      setAiInstructions('');
      
      // Switch to content tab to show the generated content
      setEditorTab('content');
    } catch (err) {
      console.error('Error generating AI content:', err);
      setError('Failed to generate AI content. Please try again.');
    } finally {
      setAiGenerating(false);
    }
  };
  
  // Open AI prompt modal
  const openAiPromptModal = (action: 'generate' | 'refine' | 'schema') => {
    setAiAction(action);
    setAiPrompt('');
    setAiInstructions('');
    setShowAiPromptModal(true);
  };
  
  // Handle creating a new blog
  const handleCreateNew = () => {
    // Check for unsaved changes
    if (hasUnsavedChanges && !confirm('You have unsaved changes. Discard them?')) {
      return;
    }
    
    setSelectedBlog(null);
    setIsCreatingNew(true);
  };
  
  // Handle selecting a blog to edit
  const handleSelectBlog = (blog: Blog) => {
    // Check for unsaved changes
    if (hasUnsavedChanges && !confirm('You have unsaved changes. Discard them?')) {
      return;
    }
    
    setSelectedBlog(blog);
    setIsCreatingNew(false);
  };
  
  // Handle save button click
  const handleSave = async () => {
    if (isCreatingNew) {
      await createBlog();
    } else if (selectedBlog) {
      await updateBlog();
    }
  };
  console.log('Selected blog', selectedBlog, initialContent)
  // Render the component UI
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b">
        <h1 className="text-2xl font-bold">Blog Management</h1>
        <button
          onClick={handleCreateNew}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-1" />
          New Blog
        </button>
      </div>

      {/* Error message display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mx-4 mt-4">
          <span className="block sm:inline">{error}</span>
          <button
            onClick={() => setError(null)}
            className="float-right"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Blog list sidebar */}
        <div className="w-1/4 border-r overflow-auto">
          {/* Filter tabs */}
          <div className="flex border-b">
            <button
              onClick={() => setFilterTab('all')}
              className={`flex-1 py-2 ${filterTab === 'all' ? 'border-b-2 border-indigo-500 font-medium' : ''}`}
            >
              All
            </button>
            <button
              onClick={() => setFilterTab('published')}
              className={`flex-1 py-2 ${filterTab === 'published' ? 'border-b-2 border-indigo-500 font-medium' : ''}`}
            >
              Published
            </button>
            <button
              onClick={() => setFilterTab('draft')}
              className={`flex-1 py-2 ${filterTab === 'draft' ? 'border-b-2 border-indigo-500 font-medium' : ''}`}
            >
              Drafts
            </button>
            <button
              onClick={() => setFilterTab('archived')}
              className={`flex-1 py-2 ${filterTab === 'archived' ? 'border-b-2 border-indigo-500 font-medium' : ''}`}
            >
              Archived
            </button>
          </div>

          {/* Blog list */}
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <Spinner className="h-8 w-8 text-indigo-500" />
            </div>
          ) : blogs.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No blogs found
            </div>
          ) : (
            <ul className="divide-y">
              {blogs.map(blog => (
                <li 
                  key={blog.id}
                  onClick={() => handleSelectBlog(blog)}
                  className={`p-3 hover:bg-gray-50 cursor-pointer ${selectedBlog?.id === blog.id ? 'bg-indigo-50' : ''}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium truncate">{blog.title}</h3>
                      <p className="text-sm text-gray-500 truncate">
                        {new Date(blog.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      {blog.status === 'published' && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                          Published
                        </span>
                      )}
                      {blog.status === 'draft' && (
                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                          Draft
                        </span>
                      )}
                      {blog.status === 'archived' && (
                        <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                          Archived
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Editor area */}
        <div className="flex-1 overflow-auto">
          {!selectedBlog && !isCreatingNew ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <DocumentTextIcon className="h-16 w-16 mb-4" />
              <p>Select a blog to edit or create a new one</p>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              {/* Editor tabs */}
              <div className="flex border-b">
                <button
                  onClick={() => setEditorTab('info')}
                  className={`px-4 py-2 ${editorTab === 'info' ? 'border-b-2 border-indigo-500 font-medium' : ''}`}
                >
                  Info
                </button>
                <button
                  onClick={() => setEditorTab('content')}
                  className={`px-4 py-2 ${editorTab === 'content' ? 'border-b-2 border-indigo-500 font-medium' : ''}`}
                >
                  Content
                </button>
                
                {/* Spacer */}
                <div className="flex-1"></div>
                
                {/* AI Actions */}
                <div className="flex items-center px-2">
                  <button
                    onClick={() => openAiPromptModal('generate')}
                    title="Generate new content with AI"
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full"
                  >
                    <SparklesIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => openAiPromptModal('refine')}
                    title="Refine content with AI"
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full"
                    disabled={!formData.content.trim()}
                  >
                    <ArrowPathIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => openAiPromptModal('schema')}
                    title="Generate document outline with AI"
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full"
                  >
                    <LightBulbIcon className="h-5 w-5" />
                  </button>
                </div>
                
                {/* Save button */}
                <button
                  onClick={handleSave}
                  disabled={formSubmitting || !hasUnsavedChanges}
                  className={`px-4 py-2 flex items-center ${hasUnsavedChanges ? 'text-indigo-600' : 'text-gray-400'}`}
                >
                  {formSubmitting ? (
                    <>
                      <Spinner className="h-4 w-4 mr-1" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckIcon className="h-5 w-5 mr-1" />
                      Save
                    </>
                  )}
                </button>
              </div>

              {/* Editor content */}
              <div className="flex-1 overflow-auto">
                {editorTab === 'info' ? (
                  <div className="p-4 space-y-4">
                    {/* Title */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title *
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => handleFormChange('title', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Blog title"
                      />
                    </div>
                    
                    {/* Slug */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Slug
                      </label>
                      <input
                        type="text"
                        value={formData.slug}
                        onChange={(e) => handleFormChange('slug', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="blog-slug (leave empty for auto-generation)"
                      />
                    </div>
                    
                    {/* Author */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Author *
                      </label>
                      <input
                        type="text"
                        value={formData.author}
                        onChange={(e) => handleFormChange('author', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Author name"
                      />
                    </div>
                    
                    {/* Excerpt */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Excerpt
                      </label>
                      <textarea
                        value={formData.excerpt}
                        onChange={(e) => handleFormChange('excerpt', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        rows={3}
                        placeholder="Brief excerpt or summary"
                      />
                    </div>
                    
                    {/* Cover Image */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cover Image URL
                      </label>
                      <input
                        type="text"
                        value={formData.coverImage}
                        onChange={(e) => handleFormChange('coverImage', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                    
                    {/* Tags */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tags
                      </label>
                      <input
                        type="text"
                        value={formData.tags}
                        onChange={(e) => handleFormChange('tags', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="tag1, tag2, tag3"
                      />
                    </div>
                    
                    {/* Status */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => handleFormChange('status', e.target.value as any)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                    
                    {/* Blog actions */}
                    {selectedBlog && (
                      <div className="flex space-x-2 pt-4 border-t">
                        {selectedBlog.status === 'draft' && (
                          <button
                            onClick={() => publishBlog(selectedBlog.id)}
                            className="px-3 py-1 bg-green-100 text-green-800 rounded flex items-center"
                          >
                            <DocumentTextIcon className="h-4 w-4 mr-1" />
                            Publish
                          </button>
                        )}
                        {selectedBlog.status !== 'archived' && (
                          <button
                            onClick={() => archiveBlog(selectedBlog.id)}
                            className="px-3 py-1 bg-gray-100 text-gray-800 rounded flex items-center"
                          >
                            <ArchiveBoxIcon className="h-4 w-4 mr-1" />
                            Archive
                          </button>
                        )}
                        <button
                          onClick={() => deleteBlog(selectedBlog.id)}
                          className="px-3 py-1 bg-red-100 text-red-800 rounded flex items-center"
                        >
                          <TrashIcon className="h-4 w-4 mr-1" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full">
                    <MarkdownEditor
                      key={selectedBlog ? `blog-content-${selectedBlog.id}` : 'new-blog-content'}
                      initialContent={initialContent}
                      onChange={(content) => handleFormChange('content', content)}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Prompt Modal */}
      {showAiPromptModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">
                  {aiAction === 'generate' ? 'Generate New Content' : 
                   aiAction === 'refine' ? 'Refine Existing Content' : 
                   'Generate Document Outline'}
                </h3>
                <button
                  onClick={() => setShowAiPromptModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {aiAction === 'generate' ? 'What would you like to write about?' : 
                   aiAction === 'refine' ? 'How would you like to improve the content?' : 
                   'What topic would you like an outline for?'}
                </label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                  placeholder={aiAction === 'generate' ? 'Enter a topic or prompt for the AI to write about' : 
                              aiAction === 'refine' ? 'Enter instructions for refining the content' : 
                              'Enter the main topic for the document outline'}
                />
              </div>
              
              {(aiAction === 'refine' || aiAction === 'schema') && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {aiAction === 'refine' ? 'Additional Instructions (Optional)' : 'Description (Optional)'}
                  </label>
                  <textarea
                    value={aiInstructions}
                    onChange={(e) => setAiInstructions(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows={2}
                    placeholder={aiAction === 'refine' ? 'Add specific instructions for refinement' : 
                                'Add a brief description of what the document should cover'}
                  />
                </div>
              )}
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowAiPromptModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={generateAiContent}
                  disabled={aiGenerating || !aiPrompt.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center"
                >
                  {aiGenerating ? (
                    <>
                      <Spinner className="h-4 w-4 mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>Generate</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
