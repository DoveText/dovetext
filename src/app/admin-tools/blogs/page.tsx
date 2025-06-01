'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Spinner } from '@/components/common/Spinner';
import { Blog, BlogCreateRequest, BlogUpdateRequest, blogsApi } from '../api/blogs';
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
  XMarkIcon
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
  
  // Track if the editor has unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load blogs on component mount
  useEffect(() => {
    loadBlogs();
  }, [filterTab]);

  // Effect to initialize form data when a blog is selected for editing
  useEffect(() => {
    if (selectedBlog) {
      console.log('selected blog - ' + selectedBlog.slug)
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
      setInitialContent('')
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



  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Blogs Management</h1>
  
  {error && (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      {error}
      <button 
        onClick={() => setError(null)} 
        className="float-right font-bold"
      >
        &times;
      </button>
    </div>
  )}

  {/* Two-panel layout */}
  <div className="flex flex-col md:flex-row gap-6">
    {/* Left panel - Blog list */}
    <div className="w-full md:w-1/3 lg:w-1/4">
      {/* Tabs for filtering blogs */}
      <div className="mb-4">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-4">
            <button
              onClick={() => setFilterTab('all')}
              className={`${filterTab === 'all' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
            >
              All
            </button>
            <button
              onClick={() => setFilterTab('published')}
              className={`${filterTab === 'published' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
            >
              Published
            </button>
            <button
              onClick={() => setFilterTab('draft')}
              className={`${filterTab === 'draft' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
            >
              Drafts
            </button>
            <button
              onClick={() => setFilterTab('archived')}
              className={`${filterTab === 'archived' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
            >
              Archived
            </button>
          </nav>
        </div>
      </div>

      {/* Create new blog button */}
      <div className="mb-4">
        <button
          onClick={handleCreateNew}
          className="w-full bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 flex items-center justify-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Create New Blog
        </button>
      </div>

      {/* Blogs list */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : blogs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No blogs found. Create your first blog!
        </div>
      ) : (
        <div className="overflow-y-auto max-h-[calc(100vh-250px)] border border-gray-200 rounded-md">
          <ul className="divide-y divide-gray-200">
            {blogs.map((blog) => (
              <li 
                key={blog.id} 
                className={`hover:bg-gray-50 cursor-pointer ${selectedBlog?.id === blog.id ? 'bg-indigo-50' : ''}`}
                onClick={() => handleSelectBlog(blog)}
              >
                <div className="px-4 py-4">
                  <div className="flex justify-between">
                    <div className="text-sm font-medium text-gray-900 truncate max-w-[70%]">{blog.title}</div>
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      blog.status === 'published' ? 'bg-green-100 text-green-800' :
                      blog.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {blog.status.charAt(0).toUpperCase() + blog.status.slice(1)}
                    </span>
                  </div>
                  <div className="mt-1 flex justify-between">
                    <div className="text-xs text-gray-500">
                      {new Date(blog.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex space-x-1">
                      {blog.status !== 'published' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); publishBlog(blog.id); }}
                          className="text-green-600 hover:text-green-900"
                          title="Publish"
                        >
                          <CheckIcon className="h-4 w-4" />
                        </button>
                      )}
                      {blog.status !== 'archived' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); archiveBlog(blog.id); }}
                          className="text-gray-600 hover:text-gray-900"
                          title="Archive"
                        >
                          <ArchiveBoxIcon className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteBlog(blog.id); }}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>

    {/* Right panel - Blog editor */}
    <div className="w-full md:w-2/3 lg:w-3/4">
      {(selectedBlog || isCreatingNew) ? (
        <div className="bg-white shadow-md rounded p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              {isCreatingNew ? 'Create New Blog' : `Edit Blog: ${selectedBlog?.title}`}
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={handleSave}
                disabled={formSubmitting}
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 flex items-center"
              >
                {formSubmitting ? (
                  <>
                    <Spinner className="h-4 w-4 mr-2" />
                    Saving...
                  </>
                ) : (
                  <>Save</>  
                )}
              </button>
              <button
                onClick={() => {
                  if (hasUnsavedChanges && !confirm('You have unsaved changes. Discard them?')) {
                    return;
                  }
                  setSelectedBlog(null);
                  setIsCreatingNew(false);
                }}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 flex items-center"
              >
                <XMarkIcon className="h-4 w-4 mr-1" />
                Close
              </button>
            </div>
          </div>
          
          {/* Tabs for Blog Info and Blog Content */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setEditorTab('info')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    editorTab === 'info'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Blog Info
                </button>
                <button
                  onClick={() => setEditorTab('content')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    editorTab === 'content'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Blog Content
                </button>
              </nav>
            </div>
          </div>

          {/* Blog Info Tab */}
          {editorTab === 'info' && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleFormChange('title', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Blog title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slug
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => handleFormChange('slug', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="blog-post-slug"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Author
                  </label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => handleFormChange('author', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Author name"
                  />
                </div>
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
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Excerpt
                </label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => handleFormChange('excerpt', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                  placeholder="Brief excerpt of the blog post"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => handleFormChange('tags', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="tag1, tag2, tag3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleFormChange('status', e.target.value as 'draft' | 'published' | 'archived')}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Blog Content Tab */}
          {editorTab === 'content' && (
            <div>
              <div className="border border-gray-300 rounded-md">
                <MarkdownEditor
                  initialContent={initialContent}
                  // onChange={(value: string) => handleFormChange('content', value)}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 bg-white shadow-md rounded p-6">
          <DocumentTextIcon className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500 mb-4">Select a blog to edit or create a new one</p>
          <button
            onClick={handleCreateNew}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create New Blog
          </button>
        </div>
      )}
    </div>
  </div>
</div>
);
}
