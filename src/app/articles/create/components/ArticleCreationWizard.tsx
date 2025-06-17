'use client';

import React, { useState } from 'react';
import { AlertDialog } from '../../../../components/common/AlertDialog';
import { useRouter } from 'next/navigation';
import ArticlePlanningForm, { ArticlePlanningData } from './ArticlePlanningForm';
import AIArticleSuggestions, { AIGeneratedArticle } from './AIArticleSuggestions';
import ArticleEditor from '../../components/ArticleEditor';
import { articleAiApi } from '@/app/api/article-ai';
import { documentsApi } from '@/app/api/documents';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';

interface ArticleCreationWizardProps {
  onCancel: () => void;
}

type WizardStep = 'planning' | 'suggestions' | 'editor';

export default function ArticleCreationWizard({ onCancel }: ArticleCreationWizardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<WizardStep>('planning');
  const [planningData, setPlanningData] = useState<ArticlePlanningData | null>(null);
  const [generatedArticle, setGeneratedArticle] = useState<AIGeneratedArticle | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle completion of the planning form
  const handlePlanningComplete = async (data: ArticlePlanningData) => {
    setPlanningData(data);
    setIsLoading(true);
    
    try {
      toast.loading('Generating article suggestions...', { id: 'generating' });
      const article = await articleAiApi.generateArticle(data);
      setGeneratedArticle(article);
      setCurrentStep('suggestions');
      toast.success('Article suggestions generated!', { id: 'generating' });
    } catch (error) {
      console.error('Error generating article:', error);
      toast.error('Failed to generate article suggestions. Please try again.', { id: 'generating' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle title selection in the suggestions view
  const handleTitleSelect = (title: string) => {
    if (!generatedArticle) return;
    setGeneratedArticle({
      ...generatedArticle,
      selectedTitle: title
    });
  };

  // Handle outline editing in the suggestions view
  const handleOutlineEdit = (outline: AIGeneratedArticle['outline']) => {
    if (!generatedArticle) return;
    setGeneratedArticle({
      ...generatedArticle,
      outline
    });
  };

  // Handle regeneration request
  const handleRegenerateRequest = async () => {
    if (!planningData) return;
    
    setIsLoading(true);
    try {
      toast.loading('Regenerating article suggestions...', { id: 'regenerating' });
      const article = await articleAiApi.regenerateArticle(planningData);
      setGeneratedArticle(article);
      toast.success('Article suggestions regenerated!', { id: 'regenerating' });
    } catch (error) {
      console.error('Error regenerating article:', error);
      toast.error('Failed to regenerate article suggestions. Please try again.', { id: 'regenerating' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle acceptance of the AI suggestions
  const handleAcceptSuggestions = (article: AIGeneratedArticle) => {
    setGeneratedArticle(article);
    setCurrentStep('editor');
  };

  // Generate markdown content from the AI-generated article
  const generateMarkdownContent = (): string => {
    if (!generatedArticle) return '';
    
    let markdown = '';
    
    // Add introduction
    markdown += generatedArticle.introduction + '\n\n';
    
    // Add outline sections
    generatedArticle.outline.forEach(section => {
      const headingLevel = '#'.repeat(section.level);
      markdown += `${headingLevel} ${section.heading}\n\n`;
      
      if (section.content) {
        markdown += `${section.content}\n\n`;
      } else {
        markdown += `Write content for this section here...\n\n`;
      }
    });
    
    // Add conclusion
    markdown += '## Conclusion\n\n';
    markdown += generatedArticle.conclusion + '\n';
    
    return markdown;
  };

  // Handle saving the final article
  const handleSaveArticle = async (articleData: {
    title: string;
    content: string;
    status: string;
    category: string;
    tags: string[];
  }) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      console.log('Creating article with data:', { ...articleData, content: articleData.content.substring(0, 50) + '...' });
      
      // Validate required fields
      if (!articleData.title) {
        throw new Error('Title is required');
      }
      
      if (!articleData.content) {
        throw new Error('Content is required');
      }
      
      // Create content blob
      const contentBlob = new Blob([articleData.content], { type: 'text/markdown' });
      
      // Create filename - ensure it's URL-safe
      const filename = `${articleData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.md`;
      
      // Create file from blob
      const file = new File([contentBlob], filename, { type: 'text/markdown' });
      
      // Create metadata
      const metadata = {
        title: articleData.title,
        author: user?.email || 'Unknown',
        category: articleData.category || 'Uncategorized',
        filename: filename
      };
      
      console.log('Sending to API:', { metadata, state: articleData.status });
      
      // Create the document
      const newDocument = await documentsApi.createDocument(file, metadata, articleData.status);
      console.log('Document created:', newDocument);
      
      // Add tags if any
      if (articleData.tags && articleData.tags.length > 0) {
        console.log('Adding tags:', articleData.tags);
        await Promise.all(
          articleData.tags.map(tag => documentsApi.addTagToDocument(newDocument.uuid, tag))
        );
      }
      
      toast.success('Article created successfully!');
      
      // Navigate back to articles list
      router.push('/articles');
      
    } catch (error: any) {
      console.error('Error creating article:', error);
      toast.error(`Failed to create article: ${error.message || 'Unknown error'}. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Alert dialog state
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertTitle, setAlertTitle] = useState('Error');
  const [isConfirmDialog, setIsConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});

  // Handle cancellation
  const handleCancelArticle = () => {
    setAlertTitle('Confirm Cancellation');
    setAlertMessage('Are you sure you want to cancel? Any unsaved changes will be lost.');
    setIsConfirmDialog(true);
    setConfirmAction(() => () => onCancel());
    setAlertDialogOpen(true);
  };

  // Render the current step
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'planning':
        return (
          <ArticlePlanningForm 
            onComplete={handlePlanningComplete}
            onCancel={onCancel}
          />
        );
      case 'suggestions':
        return generatedArticle ? (
          <AIArticleSuggestions
            planningData={planningData!}
            generatedArticle={generatedArticle}
            isLoading={isLoading}
            onTitleSelect={handleTitleSelect}
            onOutlineEdit={handleOutlineEdit}
            onRegenerateRequest={handleRegenerateRequest}
            onAccept={handleAcceptSuggestions}
            onBack={() => setCurrentStep('planning')}
          />
        ) : null;
      case 'editor':
        return (
          <ArticleEditor
            mode="create"
            onSave={handleSaveArticle}
            onCancel={handleCancelArticle}
            isSubmitting={isSubmitting}
            initialTitle={generatedArticle?.selectedTitle || ''}
            initialContent={generateMarkdownContent()}
            initialStatus="draft"
            initialCategory=""
            initialTags={planningData?.keywords || []}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Custom Alert Dialog */}
      <AlertDialog 
        isOpen={alertDialogOpen}
        onClose={() => setAlertDialogOpen(false)}
        title={alertTitle}
        message={alertMessage}
        isConfirmation={isConfirmDialog}
        onConfirm={confirmAction}
        confirmLabel={isConfirmDialog ? 'Yes' : 'OK'}
        cancelLabel="No"
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {renderCurrentStep()}
      </div>
    </div>
  );
}
