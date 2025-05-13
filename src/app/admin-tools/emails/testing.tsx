'use client';

import { useState, useEffect } from 'react';
import { emailsApi } from '../api/emails';

type EmailTemplate = {
  id: number;
  name: string;
  description: string;
  subject: string;
  variables: string[];
};

type VariableInput = {
  name: string;
  value: string;
};

export function EmailTesting() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [recipient, setRecipient] = useState<string>('');
  const [variables, setVariables] = useState<VariableInput[]>([]);
  const [isSending, setIsSending] = useState(false);

  // Fetch templates on component mount
  useEffect(() => {
    fetchTemplates();
  }, []);

  // Update variables when template changes
  useEffect(() => {
    if (selectedTemplateId) {
      const template = templates.find(t => t.id.toString() === selectedTemplateId);
      if (template) {
        setVariables(template.variables.map(name => ({ name, value: '' })));
      }
    } else {
      setVariables([]);
    }
  }, [selectedTemplateId, templates]);

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

  const handleVariableChange = (index: number, value: string) => {
    const newVariables = [...variables];
    newVariables[index].value = value;
    setVariables(newVariables);
  };

  const handleSendTest = async () => {
    if (!selectedTemplateId || !recipient) {
      showToast('Error', 'Please select a template and enter a recipient email', 'error');
      return;
    }

    setIsSending(true);
    
    // Convert variables array to object
    const variablesObject = variables.reduce((obj, item) => {
      if (item.value) {
        obj[item.name] = item.value;
      }
      return obj;
    }, {} as Record<string, string>);

    try {
      const result = await emailsApi.testTemplate(
        parseInt(selectedTemplateId), 
        recipient, 
        variablesObject
      );
      
      showToast(
        result.success ? 'Success' : 'Failed',
        result.message,
        result.success ? 'success' : 'error'
      );
    } catch (error: any) {
      console.error('Error sending test email:', error);
      showToast(
        'Error',
        `Failed to send test email: ${error.message || 'Unknown error'}`,
        'error'
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Test Email Templates</h2>
      
      <div className="bg-white shadow overflow-hidden rounded-lg">
        <div className="p-6">
          <div className="grid gap-6">
            <div className="space-y-2">
              <label htmlFor="template" className="block text-sm font-medium text-gray-700">
                Select Template
              </label>
              <select 
                id="template"
                value={selectedTemplateId} 
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                disabled={isLoading}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              >
                <option value="">Select a template</option>
                {templates.map(template => (
                  <option key={template.id} value={template.id.toString()}>
                    {template.name} - {template.subject}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="recipient" className="block text-sm font-medium text-gray-700">
                Recipient Email
              </label>
              <input
                id="recipient"
                type="email"
                value={recipient}
                onChange={e => setRecipient(e.target.value)}
                placeholder="Enter recipient email"
                required
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              />
            </div>
            
            {variables.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Template Variables</h3>
                
                {variables.map((variable, index) => (
                  <div key={variable.name} className="space-y-2">
                    <label 
                      htmlFor={`var-${variable.name}`}
                      className="block text-sm font-medium text-gray-700"
                    >
                      {variable.name}
                    </label>
                    <input
                      id={`var-${variable.name}`}
                      value={variable.value}
                      onChange={e => handleVariableChange(index, e.target.value)}
                      placeholder={`Value for ${variable.name}`}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                    />
                  </div>
                ))}
              </div>
            )}
            
            <div>
              <button 
                onClick={handleSendTest} 
                disabled={isSending || !selectedTemplateId || !recipient}
                className={`inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm ${
                  isSending || !selectedTemplateId || !recipient
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                }`}
              >
                {isSending ? 'Sending...' : 'Send Test Email'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
