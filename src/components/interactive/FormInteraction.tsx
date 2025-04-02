'use client';

import React, { useState, useEffect } from 'react';
import { FormInteractionParams, FormField } from '@/types/interactive';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

interface FormInteractionProps {
  parameters: Record<string, any>;
  onResponse: (response: Record<string, any>) => void;
  isResponseSubmitted: boolean;
}

/**
 * Component for handling form interactions (collecting structured data)
 */
const FormInteraction: React.FC<FormInteractionProps> = ({
  parameters,
  onResponse,
  isResponseSubmitted
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [isExpanded, setIsExpanded] = useState(false);
  const params = parameters as FormInteractionParams;
  
  const { title, description, fields, submitText = 'Submit', cancelText = 'Cancel' } = params;
  
  // Initialize form values with default values
  useEffect(() => {
    const initialValues: Record<string, any> = {};
    fields.forEach(field => {
      if (field.defaultValue !== undefined) {
        initialValues[field.name] = field.defaultValue;
      } else if (field.type === 'checkbox') {
        initialValues[field.name] = false;
      } else {
        initialValues[field.name] = '';
      }
    });
    setFormValues(initialValues);
    
    // Automatically open the modal when the component mounts
    if (!isResponseSubmitted) {
      setIsModalOpen(true);
    }
  }, [fields, isResponseSubmitted]);
  
  const handleInputChange = (field: FormField, value: any) => {
    setFormValues(prev => ({
      ...prev,
      [field.name]: value
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onResponse(formValues);
    setIsModalOpen(false);
  };
  
  const renderField = (field: FormField) => {
    const { name, label, type, required, options, placeholder } = field;
    
    switch (type) {
      case 'text':
      case 'email':
      case 'number':
        return (
          <div className="mb-4" key={name}>
            <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
              {label}{required && <span className="text-red-500">*</span>}
            </label>
            <input
              type={type}
              id={name}
              name={name}
              value={formValues[name] || ''}
              onChange={(e) => handleInputChange(field, e.target.value)}
              placeholder={placeholder}
              required={required}
              disabled={isResponseSubmitted}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        );
      
      case 'textarea':
        return (
          <div className="mb-4" key={name}>
            <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
              {label}{required && <span className="text-red-500">*</span>}
            </label>
            <textarea
              id={name}
              name={name}
              value={formValues[name] || ''}
              onChange={(e) => handleInputChange(field, e.target.value)}
              placeholder={placeholder}
              required={required}
              disabled={isResponseSubmitted}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        );
      
      case 'select':
        return (
          <div className="mb-4" key={name}>
            <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
              {label}{required && <span className="text-red-500">*</span>}
            </label>
            <select
              id={name}
              name={name}
              value={formValues[name] || ''}
              onChange={(e) => handleInputChange(field, e.target.value)}
              required={required}
              disabled={isResponseSubmitted}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled>{placeholder || 'Select an option'}</option>
              {options?.map((option, index) => (
                <option key={index} value={option}>{option}</option>
              ))}
            </select>
          </div>
        );
      
      case 'checkbox':
        return (
          <div className="mb-4" key={name}>
            <div className="flex items-center">
              <input
                type="checkbox"
                id={name}
                name={name}
                checked={!!formValues[name]}
                onChange={(e) => handleInputChange(field, e.target.checked)}
                required={required}
                disabled={isResponseSubmitted}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor={name} className="ml-2 block text-sm text-gray-700">
                {label}{required && <span className="text-red-500">*</span>}
              </label>
            </div>
          </div>
        );
      
      case 'radio':
        return (
          <div className="mb-4" key={name}>
            <div className="block text-sm font-medium text-gray-700 mb-1">
              {label}{required && <span className="text-red-500">*</span>}
            </div>
            <div className="space-y-2">
              {options?.map((option, index) => (
                <div key={index} className="flex items-center">
                  <input
                    type="radio"
                    id={`${name}-${index}`}
                    name={name}
                    value={option}
                    checked={formValues[name] === option}
                    onChange={() => handleInputChange(field, option)}
                    required={required}
                    disabled={isResponseSubmitted}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor={`${name}-${index}`} className="ml-2 block text-sm text-gray-700">
                    {option}
                  </label>
                </div>
              ))}
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };
  
  // Form Modal
  const FormModal = () => (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black bg-opacity-30 transition-opacity" onClick={() => setIsModalOpen(false)}></div>
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-medium">{title}</h3>
            {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
          </div>
          
          <form onSubmit={handleSubmit} className="px-6 py-4">
            {fields.map(field => renderField(field))}
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {cancelText}
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {submitText}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
  
  // If the form has been submitted, show a summary
  if (isResponseSubmitted) {
    return (
      <div className="mt-2 mb-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center text-sm text-blue-600 hover:text-blue-800 focus:outline-none"
        >
          <span>Form values collected and submitted</span>
          {isExpanded ? (
            <ChevronUpIcon className="h-4 w-4 ml-1" />
          ) : (
            <ChevronDownIcon className="h-4 w-4 ml-1" />
          )}
        </button>
        
        {isExpanded && (
          <div className="mt-2 p-3 bg-gray-50 rounded-md text-sm">
            {Object.entries(formValues).map(([key, value]) => {
              const field = fields.find(f => f.name === key);
              return (
                <div key={key} className="flex py-1">
                  <span className="font-medium w-1/3">{field?.label || key}:</span>
                  <span className="w-2/3">
                    {typeof value === 'boolean' 
                      ? (value ? 'Yes' : 'No')
                      : (value || '-')}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className="mt-2 mb-4">
      <div className="text-sm text-gray-600 mb-2">
        Please fill out the form: <span className="font-medium">{title}</span>
      </div>
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Open Form
      </button>
      
      {isModalOpen && <FormModal />}
    </div>
  );
};

export default FormInteraction;
