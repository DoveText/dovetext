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
  const [parsedFields, setParsedFields] = useState<FormField[]>([]);

  // Parse parameters to handle both array and object-based fields
  const parseParameters = () => {
    const { prompt, title, description, submitText = 'Submit', cancelText = 'Cancel' } = parameters;
    
    // Handle fields that might come as an array of stringified JSON
    let fieldsArray: FormField[] = [];
    
    if (parameters.fields) {
      // If fields is an array, parse each item if it's a string
      if (Array.isArray(parameters.fields)) {
        fieldsArray = parameters.fields.map(field => {
          if (typeof field === 'string') {
            try {
              const fieldData = JSON.parse(field);

              const name = fieldData.name;

              return {
                name,
                label: fieldData.label || name,
                type: fieldData.type || 'string',
                required: fieldData.required || false,
                options: fieldData.options || [],
                placeholder: fieldData.description || fieldData.label || name,
                defaultValue: fieldData.defaultValue
              } as FormField;
            } catch (error) {
              console.error(`Error parsing field:`, error);
              return null;
            }
          }
          return field;
        }).filter(field => field !== null) as FormField[];
      } 
      // If fields is an object with stringified JSON values
      else if (typeof parameters.fields === 'object') {
        fieldsArray = Object.entries(parameters.fields).map(([name, fieldDataStr]) => {
          let fieldData: Record<string, any> = {};
          
          // Try to parse the stringified JSON
          try {
            if (typeof fieldDataStr === 'string') {
              fieldData = JSON.parse(fieldDataStr);
            } else {
              fieldData = fieldDataStr as Record<string, any>;
            }
          } catch (error) {
            console.error(`Error parsing field data for ${name}:`, error);
          }

          return {
            name,
            label: fieldData.label || name,
            type: fieldData.type || 'string',
            required: fieldData.required || false,
            options: fieldData.options || [],
            placeholder: fieldData.description || fieldData.label || name,
            defaultValue: fieldData.defaultValue
          } as FormField;
        });

        console.log('Field arrays: ', fieldsArray)
      }
    }
    
    return {
      title: title || prompt || 'Please fill out this form',
      description,
      fields: fieldsArray,
      submitText,
      cancelText
    };
  };
  
  const params = parseParameters();
  
  // Initialize form values with default values
  useEffect(() => {
    const processedParams = parseParameters();
    setParsedFields(processedParams.fields);
    
    const initialValues: Record<string, any> = {};
    processedParams.fields.forEach(field => {
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
  }, [parameters, isResponseSubmitted]);
  
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

  const handleCancel = () => {
    onResponse({ });
    setIsModalOpen(false);
  };
  
  const renderField = (field: FormField) => {
    const { name, label, type, required, options, placeholder } = field;
    
    switch (type) {
      case 'string':
      case 'email':
      case 'number':
      case 'password':
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
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
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
            <fieldset>
              <legend className="text-sm font-medium text-gray-700">
                {label}{required && <span className="text-red-500">*</span>}
              </legend>
              <div className="mt-2 space-y-2">
                {options?.map((option, index) => (
                  <div key={index} className="flex items-center">
                    <input
                      id={`${name}-${index}`}
                      name={name}
                      type="radio"
                      value={option}
                      checked={formValues[name] === option}
                      onChange={() => handleInputChange(field, option)}
                      required={required}
                      disabled={isResponseSubmitted}
                      className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <label htmlFor={`${name}-${index}`} className="ml-2 block text-sm text-gray-700">
                      {option}
                    </label>
                  </div>
                ))}
              </div>
            </fieldset>
          </div>
        );
      
      default:
        return null;
    }
  };
  
  if (isResponseSubmitted) {
    // For submitted forms, show a summary of the responses
    return (
      <div className="mt-2 bg-gray-50 p-3 rounded-md border border-gray-200">
        <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <span className="font-medium text-gray-700">{isExpanded ? 'Hide' : 'Show'} Form Responses</span>
          {isExpanded ? 
            <ChevronUpIcon className="h-5 w-5 text-gray-500" /> : 
            <ChevronDownIcon className="h-5 w-5 text-gray-500" />
          }
        </div>
        
        {isExpanded && (
          <div className="mt-2 space-y-2">
            {parsedFields.map((field) => (
              <div key={field.name} className="flex">
                <span className="text-sm font-medium text-gray-600 mr-2">{field.label}:</span>
                <span className="text-sm text-gray-800">
                  {typeof formValues[field.name] === 'boolean' 
                    ? (formValues[field.name] ? 'Yes' : 'No')
                    : formValues[field.name] || 'Not provided'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
  
  // For new forms, show the modal
  return (
    <div className="mt-2">
      {isModalOpen && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-md">
          <div className="p-4">
            <h3 className="text-lg font-medium text-gray-900">{params.title}</h3>
            {params.description && <p className="mt-1 text-sm text-gray-600">{params.description}</p>}
            
            <form onSubmit={handleSubmit} className="mt-4">
              {parsedFields.map(field => renderField(field))}
              
              <div className="flex justify-end mt-4 space-x-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isResponseSubmitted}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {params.cancelText}
                </button>
                <button
                  type="submit"
                  disabled={isResponseSubmitted}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {params.submitText}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormInteraction;
