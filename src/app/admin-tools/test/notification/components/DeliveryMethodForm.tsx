import React, { useState } from 'react';
import { DELIVERY_METHOD_TYPES } from '@/app/admin-tools/api/delivery-method-types';
import { DeliveryMethod } from '@/app/admin-tools/api/notification-delivery';

interface DeliveryMethodFormProps {
  type: string;
  initialValues?: any;
  onSubmit: (values: any) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

const DeliveryMethodForm: React.FC<DeliveryMethodFormProps> = ({
  type,
  initialValues = {},
  onSubmit,
  onCancel,
  isSubmitting
}) => {
  const methodType = DELIVERY_METHOD_TYPES[type];
  const [formValues, setFormValues] = useState<Record<string, any>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!methodType) {
    return <div className="text-red-500">Unknown method type: {type}</div>;
  }

  const handleChange = (field: string, value: any) => {
    setFormValues((prev: Record<string, any>) => ({
      ...prev,
      [field]: value
    }));

    // Clear error for this field if it exists
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Check required fields
    methodType.configFields.forEach(field => {
      if (field.required && !formValues[field.name]) {
        newErrors[field.name] = `${field.label} is required`;
      }
    });

    // Special validations
    if (formValues.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValues.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formValues.phoneNumber && !/^\+?[1-9]\d{1,14}$/.test(formValues.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number (E.164 format)';
    }

    if (formValues.url && !/^https?:\/\//.test(formValues.url)) {
      newErrors.url = 'Please enter a valid URL (starting with http:// or https://)';
    }

    if (formValues.webhookUrl && !/^https?:\/\//.test(formValues.webhookUrl)) {
      newErrors.webhookUrl = 'Please enter a valid webhook URL (starting with http:// or https://)';
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

  // Check if a field should be shown based on conditional logic
  const shouldShowField = (field: any) => {
    if (!field.conditionalOn) return true;
    
    if (typeof field.conditionalOn === 'string') {
      return !!formValues[field.conditionalOn];
    } else {
      const { field: condField, value } = field.conditionalOn;
      return formValues[condField] === value;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="mb-4">
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formValues.name || ''}
          onChange={(e) => handleChange('name', e.target.value)}
          className="block w-full rounded-md border border-gray-500 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          placeholder={`${methodType.label} Notification`}
          required
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
      </div>

      {methodType.configFields.map(field => {
        if (!shouldShowField(field)) return null;

        return (
          <div key={field.name} className="mb-4">
            <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-1">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            
            {field.type === 'select' && (
              <select
                id={field.name}
                name={field.name}
                value={formValues[field.name] || field.defaultValue || ''}
                onChange={(e) => handleChange(field.name, e.target.value)}
                className="block w-full rounded-md border border-gray-500 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required={field.required}
              >
                {field.options?.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            )}

            {field.type === 'boolean' && (
              <div className="mt-2">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border border-gray-500 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    checked={!!formValues[field.name]}
                    onChange={(e) => handleChange(field.name, e.target.checked)}
                  />
                  <span className="ml-2 text-sm text-gray-600">{field.label}</span>
                </label>
              </div>
            )}

            {(field.type === 'text' || field.type === 'email' || field.type === 'url' || field.type === 'phone') && (
              <input
                type={field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : 'text'}
                id={field.name}
                name={field.name}
                value={formValues[field.name] || ''}
                onChange={(e) => handleChange(field.name, e.target.value)}
                className="block w-full rounded-md border border-gray-500 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder={field.placeholder}
                required={field.required}
              />
            )}

            {field.type === 'password' && (
              <input
                type="password"
                id={field.name}
                name={field.name}
                value={formValues[field.name] || ''}
                onChange={(e) => handleChange(field.name, e.target.value)}
                className="block w-full rounded-md border border-gray-500 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder={field.placeholder}
                required={field.required}
              />
            )}

            {field.type === 'keyValuePairs' && (
              <div className="mt-2 space-y-2">
                {/* This would be a more complex component for key-value pairs */}
                <p className="text-sm text-gray-500">Key-value pair editor (not implemented in this example)</p>
              </div>
            )}

            {errors[field.name] && <p className="mt-1 text-sm text-red-600">{errors[field.name]}</p>}
            
            {field.description && (
              <p className="mt-1 text-sm text-gray-500">{field.description}</p>
            )}
          </div>
        );
      })}

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
          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
};

export default DeliveryMethodForm;
