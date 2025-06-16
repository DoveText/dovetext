'use client';

import React, { useState, useRef } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import ArticlePlanningForm, { ArticlePlanningData, ArticlePlanningFormRef } from './ArticlePlanningForm';
import AIArticleSuggestions, { AIGeneratedArticle } from './AIArticleSuggestions';
import { articleAiApi } from '@/app/api/article-ai';
import { toast } from 'react-hot-toast';

interface ArticleWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (article: AIGeneratedArticle, formData: ArticlePlanningData) => void;
  initialFormData?: ArticlePlanningData;
  onFormDataChange?: (formData: ArticlePlanningData) => void;
}

type WizardStep = 'planning' | 'suggestions';

export default function ArticleWizardModal({
  isOpen,
  onClose,
  onComplete,
  initialFormData,
  onFormDataChange
}: ArticleWizardModalProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('planning');
  const [planningData, setPlanningData] = useState<ArticlePlanningData | null>(null);
  const [generatedArticle, setGeneratedArticle] = useState<AIGeneratedArticle | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const planningFormRef = useRef<ArticlePlanningFormRef>(null);

  // Handle form data changes and save them for persistence
  const handleFormDataChange = (data: ArticlePlanningData) => {
    // Save form data as user types/selects options
    setPlanningData(data);
    
    // Pass the form data changes to the parent component if the callback exists
    if (onFormDataChange) {
      onFormDataChange(data);
    }
  };

  // Handle completion of the planning form
  const handlePlanningComplete = (data: ArticlePlanningData) => {
    setPlanningData(data);
    setIsLoading(true);
    
    toast.loading('Generating article suggestions...', { id: 'generating' });
    
    articleAiApi.generateArticle(data)
      .then(article => {
        if (!article || !article.titles || !article.outline) throw new Error('Received invalid article structure from API');
      
      // Ensure a title is selected
      if (!article.selectedTitle && article.titles.length > 0) {
        article.selectedTitle = article.titles[0];
      }
      
      setGeneratedArticle(article);
      setCurrentStep('suggestions');
      toast.success('Article suggestions generated!', { id: 'generating' });
        
        // Save the generated article and form data immediately
        // This ensures the data is saved even if user doesn't click "Accept & Continue"
        onComplete(article, data);
      })
      .catch(error => {
        console.error('Error generating article:', error);
        
        let errorMessage = 'Failed to generate article suggestions. Please try again.';
        if (error.response) {
          // Handle specific HTTP error codes
          switch (error.response.status) {
            case 401:
              errorMessage = 'Authentication error. Please sign in again and retry.';
              break;
            case 403:
              errorMessage = 'You don\'t have permission to use this feature.';
              break;
            case 429:
              errorMessage = 'Too many requests. Please wait a moment and try again.';
              break;
            case 500:
              errorMessage = 'Server error. Our team has been notified.';
              break;
            case 404:
              errorMessage = 'API endpoint not found. Please check the configuration.';
              break;
            default:
              if (error.response.data?.error) {
                errorMessage = `Error: ${error.response.data.error}`;
              }
          }
        } else if (error.message) {
          console.error(error);
          errorMessage = 'Failed to generate article suggestions. Please try again.';
        }
        
        toast.error(errorMessage, { id: 'generating', duration: 5000 });
        
        // Reset the generating state in the planning form
        if (planningFormRef.current) {
          planningFormRef.current.resetGeneratingState();
        }
        
        // Stay on the planning form so the user can retry
        setCurrentStep('planning');
      })
      .finally(() => {
        setIsLoading(false);
      });
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
  const handleRegenerateRequest = () => {
    if (!planningData) return;
    
    setIsLoading(true);
    toast.loading('Regenerating article suggestions...', { id: 'regenerating' });
    
    articleAiApi.regenerateArticle(planningData)
      .then(article => {
        // Check if we received a valid article structure
        if (!article || !article.titles || !article.outline) {
          throw new Error('Received invalid article structure from API');
        }
        
        // Ensure a title is selected
        if (!article.selectedTitle && article.titles.length > 0) {
          article.selectedTitle = article.titles[0];
        }
        
        setGeneratedArticle(article);
        toast.success('Article suggestions regenerated!', { id: 'regenerating' });
      })
      .catch(error => {
        console.error('Error regenerating article:', error);
        
        // Provide more specific error messages based on the error type
        let errorMessage = 'Failed to regenerate article suggestions. Please try again.';
        
        if (error.response) {
          // Handle specific HTTP error codes
          switch (error.response.status) {
            case 401:
              errorMessage = 'Authentication error. Please sign in again and retry.';
              break;
            case 403:
              errorMessage = 'You don\'t have permission to use this feature.';
              break;
            case 429:
              errorMessage = 'Too many requests. Please wait a moment and try again.';
              break;
            case 500:
              errorMessage = 'Server error. Our team has been notified.';
              break;
            case 404:
              errorMessage = 'API endpoint not found. Please check the configuration.';
              break;
            default:
              if (error.response.data?.error) {
                errorMessage = `Error: ${error.response.data.error}`;
              }
          }
        } else if (error.message) {
          errorMessage = `Error: ${error.message}`;
        }
        
        toast.error(errorMessage, { id: 'regenerating', duration: 5000 });
        
        // Reset to planning form if we get a serious error
        if (error.response && [401, 403, 404].includes(error.response.status)) {
          setCurrentStep('planning');
          // Reset the generating state in the planning form
          if (planningFormRef.current) {
            planningFormRef.current.resetGeneratingState();
          }
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  // Handle acceptance of the AI suggestions
  const handleAcceptSuggestions = (article: AIGeneratedArticle) => {
    if (!planningData) return;
    
    // Pass both the generated article and the form data to the parent component
    onComplete(article, planningData);
  };

  return (
    <Dialog
      open={isOpen}
      onClose={() => {
        // Do nothing when clicking outside - modal can only be closed via buttons
        // This prevents accidental closing during article generation
      }}
      className="relative z-50"
    >
      {/* The backdrop, rendered as a fixed sibling to the panel container */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      {/* Full-screen container to center the panel */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-4xl w-full rounded-xl bg-white shadow-2xl overflow-hidden">
          {/* Modal header */}
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <Dialog.Title className="text-xl font-bold text-gray-900">
                AI Article Creation Wizard
              </Dialog.Title>
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {currentStep === 'planning' 
                ? 'Tell us about your article to get AI-powered suggestions'
                : 'Review and customize AI-generated suggestions'}
            </p>
          </div>

          {/* Modal content */}
          <div className="max-h-[80vh] overflow-y-auto">
            {currentStep === 'planning' ? (
              <ArticlePlanningForm
                ref={planningFormRef}
                onComplete={handlePlanningComplete}
                onCancel={onClose}
                initialData={initialFormData}
                onFormDataChange={handleFormDataChange}
              />
            ) : generatedArticle ? (
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
            ) : null}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
