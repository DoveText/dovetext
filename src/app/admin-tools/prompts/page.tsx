'use client';

import { useEffect, useState } from 'react';
import { usePromptService, LlmPromptDto, PromptFormData } from '@/app/admin-tools/api/prompts';
import { FormEvent } from 'react';
import PromptTestChat from '@/components/common/PromptTestChat';
import CopyButton from '@/components/common/CopyButton';
import Link from 'next/link';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';

// Helper function to format byte size to human-readable format
const formatByteSize = (bytes: number): string => {
  if (bytes < 1000) return `${bytes} bytes`;
  if (bytes < 1000000) return `${(bytes / 1000).toFixed(1)}k bytes`;
  return `${(bytes / 1000000).toFixed(1)}M bytes`;
};

export default function PromptsAdminPage() {
  const promptService = usePromptService();
  const [prompts, setPrompts] = useState<LlmPromptDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [editMode, setEditMode] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState<LlmPromptDto | null>(null);
  const [formData, setFormData] = useState<PromptFormData>({
    name: '',
    description: '',
    prompt: '',
  });

  const [testChatOpen, setTestChatOpen] = useState(false);

  // Load prompts on initial render
  useEffect(() => {
    fetchPrompts();
  }, []);

  // Auto-select first prompt if available when prompts change
  useEffect(() => {
    if (prompts.length > 0) {
      // Only select if nothing is selected and not editing/creating
      if (!currentPrompt && !editMode) {
        handlePreview(prompts[0]);
      }
    } else {
      // No prompts: show create prompt page
      setEditMode(false);
      setPreviewMode(false);
      setCurrentPrompt(null);
      setFormData({ name: '', description: '', prompt: '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompts]);

  // Fetch all prompts
  const fetchPrompts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await promptService.getAllPrompts();
      setPrompts(data);
    } catch (err) {
      setError('Failed to load prompts. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Set form for creating new prompt
  const handleAddNew = () => {
    setEditMode(false);
    setPreviewMode(false);
    setCurrentPrompt(null);
    setFormData({
      name: '',
      description: '',
      prompt: '',
    });
  };

  // Set preview for selected prompt
  const handlePreview = (prompt: LlmPromptDto) => {
    setEditMode(false);
    setPreviewMode(true);
    setCurrentPrompt(prompt);
    setFormData({
      name: prompt.name,
      description: prompt.description,
      prompt: prompt.prompt,
    });
  };

  // Set form for editing existing prompt
  const handleEdit = (prompt: LlmPromptDto) => {
    setEditMode(true);
    setPreviewMode(false);
    setCurrentPrompt(prompt);
    setFormData({
      name: prompt.name,
      description: prompt.description,
      prompt: prompt.prompt,
    });
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Submit form for create/update
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      if (editMode && currentPrompt?.id) {
        // Update existing prompt
        await promptService.updatePrompt(currentPrompt.id, formData);
      } else {
        // Create new prompt
        const created = await promptService.createPrompt(formData);
        // Immediately select the new prompt for review
        fetchPrompts();
        setTimeout(() => {
          // Find the prompt by id or name
          setCurrentPrompt(created);
          setFormData({
            name: created.name,
            description: created.description,
            prompt: created.prompt,
          });
          setEditMode(false);
          setPreviewMode(true);
        }, 0);
        setLoading(false);
        return;
      }
      setFormData({
        name: '',
        description: '',
        prompt: '',
      });
      setCurrentPrompt(null);
      fetchPrompts();
      // After edit, return to preview if editing existing prompt
      if (editMode && currentPrompt?.id) {
        setEditMode(false);
        setPreviewMode(true);
        setCurrentPrompt({ ...currentPrompt, ...formData });
      }
    } catch (err) {
      setError(`Failed to ${editMode ? 'update' : 'create'} prompt. Please try again.`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Cancel edit returns to preview
  const handleCancelEdit = () => {
    setEditMode(false);
    setPreviewMode(true);
  };

  // Delete prompt
  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this prompt?')) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      await promptService.deletePrompt(id);
      
      // If we're editing the prompt that was just deleted, reset the form
      if (currentPrompt?.id === id) {
        setCurrentPrompt(null);
        setFormData({
          name: '',
          description: '',
          prompt: '',
        });
      }
      
      fetchPrompts();
    } catch (err) {
      setError('Failed to delete prompt. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Open chat for testing current prompt
  const handleTestPrompt = () => {
    setTestChatOpen(true);
  };

  const handleCloseTestChat = () => {
    setTestChatOpen(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb Navigation */}
      <nav className="flex mb-6" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link href="/admin-tools" className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600">
              <HomeIcon className="w-4 h-4 mr-2" />
              Admin Tools
            </Link>
          </li>
          <li>
            <div className="flex items-center">
              <ChevronRightIcon className="w-4 h-4 text-gray-400" />
              <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">Prompt Testing</span>
            </div>
          </li>
        </ol>
      </nav>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">LLM Prompts Management</h1>
        <button
          onClick={handleAddNew}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Add New Prompt
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="flex flex-col md:flex-row h-[calc(100vh-200px)]">
        {/* Left sidebar: Prompt List */}
        <div className="md:w-1/4 bg-white shadow rounded-lg p-4 mb-4 md:mb-0 md:mr-4 overflow-y-auto">
          <h2 className="text-xl font-semibold mb-4">Prompts</h2>
          
          {loading && prompts.length === 0 ? (
            <p className="text-gray-500">Loading prompts...</p>
          ) : prompts.length === 0 ? (
            <p className="text-gray-500">No prompts found. Create your first one!</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {prompts.map((prompt) => (
                <li 
                  key={prompt.id} 
                  className={`py-3 px-2 cursor-pointer hover:bg-gray-50 ${
                    currentPrompt?.id === prompt.id ? 'bg-blue-50 border-l-4 border-blue-500 pl-1' : ''
                  }`}
                  onClick={() => handlePreview(prompt)}
                >
                  <div className="flex justify-between items-center">
                    <div className="font-medium text-gray-900 truncate">{prompt.name}</div>
                    <div className="text-xs text-gray-400 ml-2 whitespace-nowrap">
                      {formatByteSize(new TextEncoder().encode(prompt.prompt).length)}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 truncate">{prompt.description}</div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-400">
                      {prompt.createdAt ? new Date(prompt.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        prompt.id && handleDelete(prompt.id);
                      }}
                      className="text-xs text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        {/* Right content: Preview, Edit, or Create */}
        <div className="md:w-3/4 bg-white shadow rounded-lg p-6 flex-1 overflow-y-auto">
          {/* Preview mode */}
          {previewMode && currentPrompt && !editMode && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-semibold">{currentPrompt.name}</h2>
                  <div className="text-gray-500 mb-2">{currentPrompt.description}</div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                    onClick={handleTestPrompt}
                  >Test</button>
                  <button
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                    onClick={() => handleEdit(currentPrompt)}
                  >Edit</button>
                </div>
              </div>
              <pre className="bg-gray-100 rounded p-4 font-mono whitespace-pre-wrap text-sm max-h-[60vh] overflow-auto border flex items-start">
                {currentPrompt.prompt}
                <CopyButton text={currentPrompt.prompt} className="ml-2 mt-1" size="md" />
              </pre>
            </div>
          )}
          {/* Edit mode (form) */}
          {editMode && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Edit Prompt: {currentPrompt?.name}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-1">Prompt Template</label>
                  <textarea
                    id="prompt"
                    name="prompt"
                    value={formData.prompt}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded px-3 py-2 h-80 font-mono"
                    required
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                    disabled={loading}
                  >{loading ? 'Processing...' : 'Update Prompt'}</button>
                  <button
                    type="button"
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
                    onClick={handleCancelEdit}
                  >Cancel</button>
                </div>
              </form>
            </div>
          )}
          {/* Create mode (no prompt selected) */}
          {!editMode && !previewMode && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Create New Prompt</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-1">Prompt Template</label>
                  <textarea
                    id="prompt"
                    name="prompt"
                    value={formData.prompt}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded px-3 py-2 h-80 font-mono"
                    required
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                    disabled={loading}
                  >{loading ? 'Processing...' : 'Create Prompt'}</button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
      
      {/* PromptTestChat dialog */}
      {currentPrompt && (
        <PromptTestChat
          systemPrompt={currentPrompt.prompt}
          open={testChatOpen}
          onClose={handleCloseTestChat}
        />
      )}
    </div>
  );
}
