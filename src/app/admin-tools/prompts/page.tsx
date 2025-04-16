'use client';

import { useEffect, useState } from 'react';
import { usePromptService } from '@/lib/services/promptService';
import { FormEvent } from 'react';

// Helper function to format byte size to human-readable format
const formatByteSize = (bytes: number): string => {
  if (bytes < 1000) return `${bytes} bytes`;
  if (bytes < 1000000) return `${(bytes / 1000).toFixed(1)}k bytes`;
  return `${(bytes / 1000000).toFixed(1)}M bytes`;
};

// Define types for our component
interface LlmPromptDto {
  id?: number;
  name: string;
  description: string;
  prompt: string;
  createdBy?: number;
  updatedBy?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface PromptFormData {
  name: string;
  description: string;
  prompt: string;
}

export default function PromptsAdminPage() {
  const promptService = usePromptService();
  const [prompts, setPrompts] = useState<LlmPromptDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [editMode, setEditMode] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState<LlmPromptDto | null>(null);
  const [formData, setFormData] = useState<PromptFormData>({
    name: '',
    description: '',
    prompt: '',
  });

  // Load prompts on initial render
  useEffect(() => {
    fetchPrompts();
  }, []);

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
    setCurrentPrompt(null);
    setFormData({
      name: '',
      description: '',
      prompt: '',
    });
  };

  // Set form for editing existing prompt
  const handleEdit = (prompt: LlmPromptDto) => {
    setEditMode(true);
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
        await promptService.createPrompt(formData);
      }
      
      // Reset form and refresh list
      setFormData({
        name: '',
        description: '',
        prompt: '',
      });
      setCurrentPrompt(null);
      fetchPrompts();
    } catch (err) {
      setError(`Failed to ${editMode ? 'update' : 'create'} prompt. Please try again.`);
      console.error(err);
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="container mx-auto px-4 py-8">
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
                  onClick={() => handleEdit(prompt)}
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
        
        {/* Right content: Form */}
        <div className="md:w-3/4 bg-white shadow rounded-lg p-6 flex-1 overflow-y-auto">
          <h2 className="text-xl font-semibold mb-4">
            {editMode ? `Edit Prompt: ${currentPrompt?.name}` : 'Create New Prompt'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
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
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
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
              <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-1">
                Prompt Template
              </label>
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
              >
                {loading ? 'Processing...' : editMode ? 'Update Prompt' : 'Create Prompt'}
              </button>
              
              {editMode && (
                <button
                  type="button"
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
                  onClick={handleAddNew}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
