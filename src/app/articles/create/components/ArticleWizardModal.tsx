'use client';

import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import ArticlePlanningForm, { ArticlePlanningData } from './ArticlePlanningForm';
import AIArticleSuggestions, { AIGeneratedArticle } from './AIArticleSuggestions';
import { articleAiApi } from '@/app/api/article-ai';
import { toast } from 'react-hot-toast';

interface ArticleWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (article: AIGeneratedArticle, formData: ArticlePlanningData) => void;
  initialFormData?: ArticlePlanningData;
}

type WizardStep = 'planning' | 'suggestions';

export default function ArticleWizardModal({
  isOpen,
  onClose,
  onComplete,
  initialFormData
}: ArticleWizardModalProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('planning');
  const [planningData, setPlanningData] = useState<ArticlePlanningData | null>(null);
  const [generatedArticle, setGeneratedArticle] = useState<AIGeneratedArticle | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
    // Pass both the generated article and the form data to the parent component
    onComplete(article, planningData!);
  };

  return (
    <Dialog
      open={isOpen}
      onClose={() => {
        if (!isLoading) onClose();
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
                onComplete={handlePlanningComplete}
                onCancel={onClose}
                initialData={initialFormData}
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
