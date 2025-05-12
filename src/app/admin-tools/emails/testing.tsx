'use client';

import { useState, useEffect } from 'react';
import { 
  Button, 
  Card, 
  CardContent, 
  Input, 
  Label, 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  toast
} from '@/components/ui';

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

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/v1/admin/emails/templates');
      if (!response.ok) throw new Error('Failed to fetch templates');
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load email templates',
        variant: 'destructive'
      });
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
      toast({
        title: 'Error',
        description: 'Please select a template and enter a recipient email',
        variant: 'destructive'
      });
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
      const response = await fetch(
        `/api/v1/admin/emails/templates/${selectedTemplateId}/test?recipient=${encodeURIComponent(recipient)}`, 
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(variablesObject)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Test failed');
      }

      const result = await response.json();
      
      toast({
        title: result.success ? 'Success' : 'Failed',
        description: result.message
      });
    } catch (error) {
      console.error('Error sending test email:', error);
      toast({
        title: 'Error',
        description: `Failed to send test email: ${error.message}`,
        variant: 'destructive'
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Test Email Templates</h2>
      
      <Card>
        <CardContent className="p-6">
          <div className="grid gap-6">
            <div className="space-y-2">
              <Label htmlFor="template">Select Template</Label>
              <Select 
                value={selectedTemplateId} 
                onValueChange={setSelectedTemplateId}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id.toString()}>
                      {template.name} - {template.subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient Email</Label>
              <Input
                id="recipient"
                type="email"
                value={recipient}
                onChange={e => setRecipient(e.target.value)}
                placeholder="Enter recipient email"
                required
              />
            </div>
            
            {variables.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Template Variables</h3>
                
                {variables.map((variable, index) => (
                  <div key={variable.name} className="space-y-2">
                    <Label htmlFor={`var-${variable.name}`}>{variable.name}</Label>
                    <Input
                      id={`var-${variable.name}`}
                      value={variable.value}
                      onChange={e => handleVariableChange(index, e.target.value)}
                      placeholder={`Value for ${variable.name}`}
                    />
                  </div>
                ))}
              </div>
            )}
            
            <Button 
              onClick={handleSendTest} 
              disabled={isSending || !selectedTemplateId || !recipient}
            >
              {isSending ? 'Sending...' : 'Send Test Email'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
