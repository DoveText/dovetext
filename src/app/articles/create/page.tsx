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

  const handleWizardComplete = (article: AIGeneratedArticle, formData: any) => {
    setGeneratedArticle(article);
    setWizardFormData(formData); // Save the form data when wizard completes
    setIsWizardOpen(false);
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
            initialTags={generatedArticle?.tags || []}
            onWizardOpen={() => setIsWizardOpen(true)}
          />
          
          {isWizardOpen && (
            <ArticleWizardModal
              isOpen={isWizardOpen}
              onClose={() => setIsWizardOpen(false)}
              onComplete={handleWizardComplete}
              initialFormData={wizardFormData}
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
  
  // Add introduction
  markdown += article.introduction + '\n\n';
  
  // Add outline sections
  article.outline.forEach(section => {
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
  markdown += article.conclusion + '\n';
  
  return markdown;
}
