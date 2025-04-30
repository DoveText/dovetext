import React, { useState, useEffect } from 'react';
import { NotificationTemplate } from '@/app/admin-tools/api/notification-templates';

interface TemplateEditorProps {
  template?: NotificationTemplate;
  onSubmit: (values: any) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({
  template,
  onSubmit,
  onCancel,
  isSubmitting
}) => {
  const [formValues, setFormValues] = useState<Record<string, any>>({
    name: '',
    type: 'email',
    content: '',
    ...template
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [variables, setVariables] = useState<string[]>(template?.variables || []);

  // Extract variables from content when it changes
  useEffect(() => {
    if (formValues.content) {
      const extractedVars = extractVariables(formValues.content);
      setVariables(extractedVars);
    }
  }, [formValues.content]);

  const handleChange = (field: string, value: any) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: value
    }));

    // Clear error for this field if it exists
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Basic validation
    if (!formValues.name) {
      newErrors.name = 'Name is required';
    }
    
    if (!formValues.type) {
      newErrors.type = 'Type is required';
    }
    
    if (!formValues.content) {
      newErrors.content = 'Content is required';
    }
    
    // Type-specific validation
    if (formValues.type === 'email' && !formValues.subject) {
      newErrors.subject = 'Subject is required for email templates';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    await onSubmit(formValues);
  };

  // Helper function to extract variables from content
  const extractVariables = (content: string): string[] => {
    const regex = /{{([^}]+)}}/g;
    const vars: string[] = [];
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      if (!vars.includes(match[1])) {
        vars.push(match[1]);
      }
    }
    
    return vars;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="mb-4">
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Template Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formValues.name || ''}
          onChange={(e) => handleChange('name', e.target.value)}
          className="block w-full rounded-md border border-gray-500 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          placeholder="e.g., Welcome Email"
          required
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
      </div>

      <div className="mb-4">
        <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
          Template Type
        </label>
        <select
          id="type"
          name="type"
          value={formValues.type || 'email'}
          onChange={(e) => handleChange('type', e.target.value)}
          className="block w-full rounded-md border border-gray-500 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          required
          disabled={!!template} // Disable type change for existing templates
        >
          <option value="email">Email</option>
          <option value="sms">SMS</option>
          <option value="voice">Voice</option>
          <option value="webhook">Webhook</option>
          <option value="plugin">Plugin</option>
        </select>
        {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type}</p>}
      </div>

      {/* Render additional fields based on template type */}
      {formValues.type === 'email' && (
        <div className="mb-4">
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
            Subject
          </label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={formValues.subject || ''}
            onChange={(e) => handleChange('subject', e.target.value)}
            className="block w-full rounded-md border border-gray-500 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="e.g., Welcome to Dove Text!"
            required
          />
          {errors.subject && <p className="mt-1 text-sm text-red-600">{errors.subject}</p>}
        </div>
      )}

      <div className="mb-4">
        <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
          Content
        </label>
        <textarea
          id="content"
          name="content"
          value={formValues.content || ''}
          onChange={(e) => handleChange('content', e.target.value)}
          className="block w-full rounded-md border border-gray-500 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          rows={10}
          placeholder="Enter template content here. Use {{variable}} syntax for variables."
          required
        />
        {errors.content && <p className="mt-1 text-sm text-red-600">{errors.content}</p>}
        
        <div className="mt-2">
          <p className="text-sm font-medium text-gray-700">Variables:</p>
          <div className="flex flex-wrap gap-2 mt-1">
            {variables.length > 0 ? (
              variables.map((variable) => (
                <span key={variable} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {variable}
                </span>
              ))
            ) : (
              <span className="text-sm text-gray-500">No variables detected. Use {{variable}} syntax to add variables.</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-5">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : template ? 'Update Template' : 'Create Template'}
        </button>
      </div>
    </form>
  );
};

export default TemplateEditor;
