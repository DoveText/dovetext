'use client';

import { useState, useEffect } from 'react';
import { emailsApi } from '../../api/emails';

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

type EmailTestDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  initialTemplateId?: number;
  initialRecipient?: string;
};

export function EmailTestDialog({ 
  isOpen, 
  onClose, 
  initialTemplateId, 
  initialRecipient 
}: EmailTestDialogProps) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [recipient, setRecipient] = useState<string>('');
  const [variables, setVariables] = useState<VariableInput[]>([]);
  const [isSending, setIsSending] = useState(false);
  // Hidden state for email type - automatically determined from template name
  const [emailType, setEmailType] = useState<string>('NOTIFICATION');
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Fetch templates on component mount
  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
      
      // Set initial values if provided
      if (initialTemplateId) {
        setSelectedTemplateId(initialTemplateId.toString());
      }
      
      if (initialRecipient) {
        setRecipient(initialRecipient);
      }
    } else {
      // Reset state when dialog closes
      setTestResult(null);
    }
  }, [isOpen, initialTemplateId, initialRecipient]);

  // Update variables and determine email type when template changes
  useEffect(() => {
    if (selectedTemplateId) {
      const template = templates.find(t => t.id.toString() === selectedTemplateId);
      if (template) {
        setVariables(template.variables.map(name => ({ name, value: '' })));
        
        // Determine the appropriate email type based on template name
        const templateName = template.name.toUpperCase();
        
        // Check if template name contains any of the valid email types
        const validTypes = ['SYSTEM', 'NOTIFICATION', 'VERIFICATION', 'PASSWORD_RESET', 'WELCOME', 'ALERT', 'MARKETING'];
        const matchedType = validTypes.find(type => templateName.includes(type));
        
        if (matchedType) {
          setEmailType(matchedType);
        } else if (templateName.includes('RESET')) {
          setEmailType('PASSWORD_RESET');
        } else if (templateName.includes('VERIFY') || templateName.includes('CONFIRM')) {
          setEmailType('VERIFICATION');
        } else if (templateName.includes('WELCOME') || templateName.includes('ONBOARD')) {
          setEmailType('WELCOME');
        } else if (templateName.includes('ALERT') || templateName.includes('WARN')) {
          setEmailType('ALERT');
        } else if (templateName.includes('MARKET') || templateName.includes('PROMO')) {
          setEmailType('MARKETING');
        } else {
          // Default to NOTIFICATION if no match
          setEmailType('NOTIFICATION');
        }
      }
    } else {
      setVariables([]);
    }
  }, [selectedTemplateId, templates]);

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

  // Simple toast function
  const showToast = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    console.log(`${title}: ${message}`);
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
    setTestResult(null);
    
    // Convert variables array to object
    const variablesObject = variables.reduce((obj, item) => {
      if (item.value) {
        obj[item.name] = item.value;
      }
      return obj;
    }, {} as Record<string, string>);

    try {
      // Make sure all required variables have values
      const missingVariables = variables.filter(v => !v.value && v.name.toLowerCase() !== 'unsubscribe_link');
      if (missingVariables.length > 0) {
        const missingNames = missingVariables.map(v => v.name).join(', ');
        setTestResult({
          success: false,
          message: `Please fill in all required variables: ${missingNames}`
        });
        showToast('Warning', `Missing required variables: ${missingNames}`, 'error');
        setIsSending(false);
        return;
      }

      // Use the new function that works around the EmailType limitation
      const result = await emailsApi.testTemplateWithType(
        parseInt(selectedTemplateId), 
        recipient,
        emailType,
        variablesObject
      );
      
      setTestResult({
        success: result.success,
        message: result.message
      });
      
      showToast(
        result.success ? 'Success' : 'Failed',
        result.message,
        result.success ? 'success' : 'error'
      );
    } catch (error: any) {
      console.error('Error sending test email:', error);
      
      // Check if it's a 500 error (likely due to template name not matching EmailType)
      let errorMessage = 'Unknown error';
      
      if (error.response && error.response.status === 500) {
        errorMessage = 'Server error: The template may have an invalid name format. Template names should match valid email types.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setTestResult({
        success: false,
        message: `Failed to send test email: ${errorMessage}`
      });
      
      showToast(
        'Error',
        `Failed to send test email: ${errorMessage}`,
        'error'
      );
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
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
                  Test Email Template
                </h3>
                <div className="mt-4 space-y-4">
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
                  
                  {/* Email type is now automatically determined based on template name */}
                  
                  {variables.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-700">Template Variables</h4>
                      
                      {variables.map((variable, index) => (
                        <div key={variable.name} className="space-y-1">
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
                  
                  {testResult && (
                    <div className={`mt-4 p-3 rounded-md ${testResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                      <h4 className="text-sm font-medium">{testResult.success ? 'Success' : 'Error'}</h4>
                      <p className="text-sm">{testResult.message}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleSendTest}
              disabled={isSending || !selectedTemplateId || !recipient}
              className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white sm:ml-3 sm:w-auto sm:text-sm ${
                isSending || !selectedTemplateId || !recipient
                  ? 'bg-blue-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
            >
              {isSending ? 'Sending...' : 'Send Test Email'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
