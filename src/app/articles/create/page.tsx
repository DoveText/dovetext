'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { documentsApi } from '@/app/api/documents';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import ArticleEditor from '../components/ArticleEditor';
import ArticleWizardModal from './components/ArticleWizardModal';
import { ArticlePlanningData } from './components/ArticlePlanningForm';
import { AIGeneratedArticle } from './components/AIArticleSuggestions';

export default function CreateArticlePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(true);
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
      
      // Navigate back to articles list
      router.push('/articles');
      
    } catch (error: any) {
      console.error('Error creating article:', error);
      alert(`Failed to create article: ${error.message || 'Unknown error'}. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      router.push('/articles');
    }
  };

  // Save form data and close wizard when user explicitly closes it
  const handleWizardClose = () => {
    // Form data is already saved via handleWizardFormDataChange
    setIsWizardOpen(false);
  };
  
  // Handle when the wizard is completed with a generated article
  const handleWizardComplete = (article: AIGeneratedArticle, formData: ArticlePlanningData) => {
    console.log('Wizard completed with article and form data:', { article, formData });
    setGeneratedArticle(article);
    setWizardFormData(formData); // Save the form data when wizard completes
    setIsWizardOpen(false);
  };
  
  // Handle form data changes from the wizard - this saves data as user types
  const handleWizardFormDataChange = (formData: ArticlePlanningData) => {
    console.log('Form data changed:', formData);
    // Save form data as it changes, so it persists even if the user cancels
    setWizardFormData(formData);
  };

  return (
    <ProtectedRoute>
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
            onWizardOpen={() => setIsWizardOpen(true)}
          />
          
          {isWizardOpen && (
            <ArticleWizardModal
              isOpen={isWizardOpen}
              onClose={handleWizardClose}
              onComplete={handleWizardComplete}
              initialFormData={wizardFormData}
              onFormDataChange={handleWizardFormDataChange}
            />
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

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
