'use client';

import React, { useState, useEffect } from 'react';
import { AlertDialog } from '@/components/common/AlertDialog';
import { useRouter } from 'next/navigation';
import { documentsApi } from '@/app/api/documents';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import ArticleEditor from '../components/ArticleEditor';
import { ArticleWizardModal, ArticlePlanningData, AIGeneratedArticle } from './components';
import { ArticleMeta, ArticleMetadata } from '../utils/article-meta';

export default function CreateArticlePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(true);
  
  // Alert dialog state
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertTitle, setAlertTitle] = useState('Error');
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});
  const [isConfirmDialog, setIsConfirmDialog] = useState(false);
  const [generatedArticle, setGeneratedArticle] = useState<AIGeneratedArticle | null>(null);
  
  // State to store wizard form data
  const [wizardFormData, setWizardFormData] = useState({
    purpose: '',
    targetAudience: 'potential',
    intent: 'growth',
    desiredLength: 'medium' as 'short' | 'medium' | 'long',
    tone: 'professional',
    keywords: [] as string[]
  });

  const handleSave = async (articleData: {
    title: string;
    content: string;
    status: string;
    category: string;
    tags: string[];
    meta?: {
      suggested_titles?: string[];
      [key: string]: any;
    };
  }) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
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
      
      // Create enhanced metadata with all planning data for AI context
      const metadata: ArticleMetadata = {
        // Basic metadata
        title: articleData.title,
        category: articleData.category || 'Uncategorized',
        filename: filename,
        contentType: 'text/markdown',
        suggested_titles: articleData.meta?.suggested_titles || generatedArticle?.titles || [],
        // AI planning data (standard tier context)
        aiContext: {
          // Planning data from wizard
          purpose: wizardFormData.purpose || '',
          targetAudience: wizardFormData.targetAudience || '',
          intent: wizardFormData.intent || '',
          desiredLength: wizardFormData.desiredLength || 'medium',
          tone: wizardFormData.tone || 'professional',
          keywords: wizardFormData.keywords || [],
          suggestedTags: generatedArticle?.tags || []
        }
      };
      
      // Create the document
      const newDocument = await documentsApi.createDocument(file, metadata, articleData.status);

      // Add tags if any - combine user tags with AI suggested tags for better context
      const allTags = [...new Set([...articleData.tags, ...(generatedArticle?.tags || [])])];
      if (allTags.length > 0) {
        await Promise.all(
          allTags.map(tag => documentsApi.addTagToDocument(newDocument.uuid, tag))
        );
      }
      
      // Navigate back to articles list
      router.push('/articles');
    } catch (error: any) {
      console.error('Error creating article:', error);
      setAlertTitle('Error Creating Article');
      setAlertMessage(`Failed to create article: ${error.message || 'Unknown error'}. Please try again.`);
      setAlertDialogOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setAlertTitle('Confirm Cancellation');
    setAlertMessage('Are you sure you want to cancel? Any unsaved changes will be lost.');
    setIsConfirmDialog(true);
    setConfirmAction(() => () => router.push('/articles'));
    setAlertDialogOpen(true);
  };

  // Save form data and close wizard when user explicitly closes it
  const handleWizardClose = () => {
    setIsWizardOpen(false);
  };
  
  // Handle when the wizard is completed with a generated article
  const handleWizardComplete = (article: AIGeneratedArticle, formData: ArticlePlanningData) => {
    // Create a copy of the article to avoid reference issues
    const articleCopy = { ...article };
    
    // Ensure the article has a selectedTitle set
    if (articleCopy && articleCopy.titles && articleCopy.titles.length > 0) {
      // If no selectedTitle is set or it's empty, use the first title
      if (!articleCopy.selectedTitle || articleCopy.selectedTitle.trim() === '') {
        articleCopy.selectedTitle = articleCopy.titles[0];
      }
    }
    
    // Make sure titles is an array
    if (!articleCopy.titles) {
      articleCopy.titles = [];
    }
    
    setGeneratedArticle(articleCopy);
    setWizardFormData(formData); // Save the form data when wizard completes
    setIsWizardOpen(false);
  };
  
  // Prepare suggested titles to pass to ArticleEditor
  const suggestedTitlesToPass = generatedArticle?.titles && Array.isArray(generatedArticle.titles) 
    ? [...generatedArticle.titles] 
    : [];
    
  return (
    <ProtectedRoute>
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
      
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ArticleEditor 
            mode="create"
            onSave={handleSave}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
            initialTitle={generatedArticle?.selectedTitle || ''}
            initialContent={generatedArticle ? generateMarkdownContent(generatedArticle) : ''}
            initialStatus="draft"
            initialCategory=""
            initialTags={[]}
            initialSuggestedTitles={suggestedTitlesToPass}
            onWizardOpen={() => setIsWizardOpen(true)}
          />
          
          {isWizardOpen && (
            <ArticleWizardModal
              isOpen={isWizardOpen}
              onClose={handleWizardClose}
              onComplete={handleWizardComplete}
              initialFormData={wizardFormData}
              onFormDataChange={setWizardFormData}
            />
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

// Function moved to /src/app/articles/utils/content-parser.ts

// Helper function to generate markdown content from AI article
function generateMarkdownContent(article: AIGeneratedArticle): string {
  let markdown = '';
  
  // Add introduction with a clear heading
  markdown += '## Introduction\n\n';
  markdown += article.introduction + '\n\n';
  
  // Add outline sections with proper hierarchy
  article.outline.forEach(section => {
    // Add 2 to level to ensure proper hierarchy (since we already used H1 for title and H2 for intro)
    const headingLevel = '#'.repeat(Math.min(section.level + 1, 6)); // Limit to H6
    markdown += `${headingLevel} ${section.heading}\n\n`;
    
    if (section.content) {
      // Format content as paragraph
      markdown += `${section.content}\n\n`;
      
      // Add placeholder for detailed content
      markdown += `_Expand on ${section.heading.toLowerCase()} here..._\n\n`;
    } else {
      markdown += `Write content for this section here...\n\n`;
    }
  });
  
  // Add conclusion
  markdown += '## Conclusion\n\n';
  markdown += article.conclusion + '\n\n';
  
  // Add metadata section for reference
  markdown += '---\n\n';
  markdown += '## Article Metadata\n\n';
  
  // Add alternative titles as bullet points
  if (article.titles && article.titles.length > 1) {
    markdown += '### Alternative Titles\n\n';
    article.titles.forEach(title => {
      if (title !== article.selectedTitle) {
        markdown += `- ${title}\n`;
      }
    });
    markdown += '\n';
  }
  
  // Add tags
  if (article.tags && article.tags.length > 0) {
    markdown += '### Tags\n\n';
    markdown += article.tags.map(tag => `#${tag.replace(/\s+/g, '')}`).join(' ') + '\n\n';
  }
  
  return markdown;
}
