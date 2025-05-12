'use client';

import { useState, useEffect } from 'react';
import { 
  Button, 
  Card, 
  CardContent, 
  Input, 
  Label, 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Textarea,
  toast
} from '@/components/ui';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { emailsApi, EmailTemplate, EmailTemplateCreateRequest, EmailTemplateUpdateRequest } from '../api/emails';

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
      toast({
        title: 'Error',
        description: 'Failed to load email templates',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
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

      toast({
        title: 'Success',
        description: currentTemplate ? 'Template updated successfully' : 'Template created successfully'
      });
      
      setIsDialogOpen(false);
      fetchTemplates();
    } catch (error: any) {
      console.error('Error saving template:', error);
      toast({
        title: 'Error',
        description: `Failed to ${currentTemplate ? 'update' : 'create'} template: ${error.message || 'Unknown error'}`,
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async () => {
    if (!currentTemplate) return;
    
    try {
      await emailsApi.deleteTemplate(currentTemplate.id);

      toast({
        title: 'Success',
        description: 'Template deleted successfully'
      });
      
      setIsDeleteDialogOpen(false);
      fetchTemplates();
    } catch (error: any) {
      console.error('Error deleting template:', error);
      toast({
        title: 'Error',
        description: `Failed to delete template: ${error.message || 'Unknown error'}`,
        variant: 'destructive'
      });
    }
  };

  const handleTestTemplate = async (templateId: number) => {
    const email = prompt('Enter email address to send test to:');
    if (!email) return;
    
    try {
      const result = await emailsApi.testTemplate(templateId, email);
      
      toast({
        title: result.success ? 'Success' : 'Error',
        description: result.success ? 'Test email sent successfully' : 'Failed to send test email',
        variant: result.success ? 'default' : 'destructive'
      });
    } catch (error: any) {
      console.error('Error testing template:', error);
      toast({
        title: 'Error',
        description: `Failed to test template: ${error.message || 'Unknown error'}`,
        variant: 'destructive'
      });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Email Templates</h2>
        <Button onClick={openCreateDialog}>
          <PlusIcon className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      {isLoading ? (
        <p>Loading templates...</p>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Variables</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      No templates found
                    </TableCell>
                  </TableRow>
                ) : (
                  templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell>{template.name}</TableCell>
                      <TableCell>{template.description}</TableCell>
                      <TableCell>{template.subject}</TableCell>
                      <TableCell>
                        {template.variables.join(', ')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleTestTemplate(template.id)}
                          >
                            Test
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openEditDialog(template)}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openDeleteDialog(template)}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Template Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {currentTemplate ? 'Edit Email Template' : 'Create Email Template'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="variables">
                  Variables (comma-separated)
                </Label>
                <Input
                  id="variables"
                  name="variables"
                  value={formData.variables}
                  onChange={handleInputChange}
                  placeholder="e.g. name, date, link"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bodyText">Plain Text Content</Label>
                <Textarea
                  id="bodyText"
                  name="bodyText"
                  value={formData.bodyText}
                  onChange={handleInputChange}
                  rows={5}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bodyHtml">HTML Content</Label>
                <Textarea
                  id="bodyHtml"
                  name="bodyHtml"
                  value={formData.bodyHtml}
                  onChange={handleInputChange}
                  rows={8}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {currentTemplate ? 'Update Template' : 'Create Template'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to delete the template "{currentTemplate?.name}"?
            This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
