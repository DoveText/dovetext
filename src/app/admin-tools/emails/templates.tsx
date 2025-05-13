'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { emailsApi, EmailTemplate, EmailTemplateCreateRequest, EmailTemplateUpdateRequest } from '../api/emails';
import { EmailTestDialog } from './components/EmailTestDialog';

// Using the EmailTemplate interface from the API file
type FormData = {
  name: string;
  description: string;
  subject: string;
  bodyText: string;
  bodyHtml: string;
  variables: string;
};

export function EmailTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<EmailTemplate | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    subject: '',
    bodyText: '',
    bodyHtml: '',
    variables: ''
  });

  // Fetch templates on component mount
  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const data = await emailsApi.getAllTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Error fetching templates:', error);
      showToast('Error', 'Failed to load email templates', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Simple toast function to replace the imported toast component
  const showToast = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    console.log(`${title}: ${message}`);
    // In a real implementation, you might want to use a proper toast notification library
    // or implement a custom toast component
    const toastClasses = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      info: 'bg-blue-500'
    };
    
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 p-4 rounded shadow-lg text-white ${toastClasses[type]} z-50`;
    toast.innerHTML = `<h4 class="font-bold">${title}</h4><p>${message}</p>`;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      subject: '',
      bodyText: '',
      bodyHtml: '',
      variables: ''
    });
    setCurrentTemplate(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (template: EmailTemplate) => {
    setCurrentTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
      subject: template.subject,
      bodyText: template.bodyText,
      bodyHtml: template.bodyHtml,
      variables: template.variables.join(', ')
    });
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (template: EmailTemplate) => {
    setCurrentTemplate(template);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const variables = formData.variables
      .split(',')
      .map(v => v.trim())
      .filter(v => v !== '');

    const templateData = {
      name: formData.name,
      description: formData.description,
      subject: formData.subject,
      bodyText: formData.bodyText,
      bodyHtml: formData.bodyHtml,
      variables
    };

    try {
      if (currentTemplate) {
        // Update existing template
        await emailsApi.updateTemplate({
          id: currentTemplate.id,
          ...templateData
        });
      } else {
        // Create new template
        await emailsApi.createTemplate(templateData);
      }

      showToast(
        'Success', 
        currentTemplate ? 'Template updated successfully' : 'Template created successfully',
        'success'
      );
      
      setIsDialogOpen(false);
      fetchTemplates();
    } catch (error: any) {
      console.error('Error saving template:', error);
      showToast(
        'Error',
        `Failed to ${currentTemplate ? 'update' : 'create'} template: ${error.message || 'Unknown error'}`,
        'error'
      );
    }
  };

  const handleDelete = async () => {
    if (!currentTemplate) return;
    
    try {
      await emailsApi.deleteTemplate(currentTemplate.id);
      
      showToast(
        'Success',
        'Template deleted successfully',
        'success'
      );
      
      setIsDeleteDialogOpen(false);
      setCurrentTemplate(null);
      fetchTemplates();
    } catch (error: any) {
      console.error('Error deleting template:', error);
      showToast(
        'Error',
        `Failed to delete template: ${error.message || 'Unknown error'}`,
        'error'
      );
    }
  };

  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [testTemplateId, setTestTemplateId] = useState<number | undefined>(undefined);

  const handleTestTemplate = (templateId: number) => {
    setTestTemplateId(templateId);
    setIsTestDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Email Templates</h2>
        <button 
          onClick={openCreateDialog} 
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-5 w-5 mr-1" />
          <span>Create Template</span>
        </button>
      </div>
      
      {isLoading ? (
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </div>
      ) : templates.length === 0 ? (
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <div className="py-8 text-center">
            <p className="text-gray-500">No email templates found. Create your first template to get started.</p>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[250px]">Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Description</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Subject</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Variables</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {templates.map((template) => (
                  <tr key={template.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{template.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 hidden md:table-cell">{template.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 hidden md:table-cell">{template.subject}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 hidden lg:table-cell">
                      {template.variables.join(', ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleTestTemplate(template.id)}
                          className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          title="Send test email"
                        >
                          Test
                        </button>
                        <button
                          onClick={() => openEditDialog(template)}
                          className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          title="Edit template"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openDeleteDialog(template)}
                          className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded shadow-sm text-red-600 hover:text-red-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          title="Delete template"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Template Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {currentTemplate ? 'Edit Email Template' : 'Create Email Template'}
                    </h3>
                    <form onSubmit={handleSubmit}>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Template Name</label>
                            <input
                              id="name"
                              name="name"
                              value={formData.name}
                              onChange={handleInputChange}
                              required
                              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <label htmlFor="subject" className="block text-sm font-medium text-gray-700">Subject</label>
                            <input
                              id="subject"
                              name="subject"
                              value={formData.subject}
                              onChange={handleInputChange}
                              required
                              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                          <input
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label htmlFor="variables" className="block text-sm font-medium text-gray-700">
                            Variables (comma-separated)
                          </label>
                          <input
                            id="variables"
                            name="variables"
                            value={formData.variables}
                            onChange={handleInputChange}
                            placeholder="e.g. name, date, link"
                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label htmlFor="bodyText" className="block text-sm font-medium text-gray-700">Plain Text Content</label>
                          <textarea
                            id="bodyText"
                            name="bodyText"
                            value={formData.bodyText}
                            onChange={handleInputChange}
                            rows={5}
                            required
                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label htmlFor="bodyHtml" className="block text-sm font-medium text-gray-700">HTML Content</label>
                          <textarea
                            id="bodyHtml"
                            name="bodyHtml"
                            value={formData.bodyHtml}
                            onChange={handleInputChange}
                            rows={8}
                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          />
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button
                          type="submit"
                          className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                          {currentTemplate ? 'Update Template' : 'Create Template'}
                        </button>
                        <button
                          type="button"
                          className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                          onClick={() => setIsDialogOpen(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {isDeleteDialogOpen && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Confirm Deletion</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete the template "{currentTemplate?.name}"? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleDelete}
                >
                  Delete
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setIsDeleteDialogOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Test Dialog */}
      <EmailTestDialog 
        isOpen={isTestDialogOpen}
        onClose={() => setIsTestDialogOpen(false)}
        initialTemplateId={testTemplateId}
      />
    </div>
  );
}
