'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/context/AuthContext';
import { businessInfoApi } from '@/app/api/business-info';
import TaggedSelect from '@/components/common/TaggedSelect';
import { 
  ArrowPathIcon,
  DocumentTextIcon,
  UserGroupIcon,
  LightBulbIcon,
  ClockIcon,
  SpeakerWaveIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

// Types for article planning
export interface ArticlePlanningData {
  purpose: string;
  targetAudience: string;
  intent: string;
  desiredLength: 'short' | 'medium' | 'long';
  tone: string;
  keywords: string[];
}

interface ArticlePlanningFormProps {
  onComplete: (data: ArticlePlanningData) => void;
  onCancel: () => void;
}

export default function ArticlePlanningForm({ onComplete, onCancel }: ArticlePlanningFormProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const totalSteps = 2; // Reduced from 3 to 2 steps
  const [loading, setLoading] = useState(false);
  const [businessKeywords, setBusinessKeywords] = useState<string[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ArticlePlanningData>({
    defaultValues: {
      purpose: '',
      intent: 'growth',
      targetAudience: 'potential',
      keywords: [],
      desiredLength: 'medium',
      tone: 'professional'
    }
  });

  // Load business keywords from business info
  useEffect(() => {
    const loadBusinessKeywords = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const businessInfoItems = await businessInfoApi.getAll();
        
        // Find keywords in business info
        const keywordsItem = businessInfoItems.find((item: { key: string }) => item.key === 'keywords');
        if (keywordsItem && keywordsItem.value) {
          try {
            const parsedKeywords = JSON.parse(keywordsItem.value);
            if (Array.isArray(parsedKeywords)) {
              // Create business keywords with proper value/label pairs
              setBusinessKeywords(parsedKeywords);
              
              // Initialize selected keywords from form data if any
              const formKeywords = watch('keywords');
              if (formKeywords && Array.isArray(formKeywords) && formKeywords.length > 0) {
                setSelectedKeywords(formKeywords);
              }
            }
          } catch (e) {
            console.error('Error parsing business keywords:', e);
          }
        }
      } catch (error) {
        console.error('Error loading business info:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadBusinessKeywords();
  }, [user, watch]);

  const handleKeywordsChange = (value: string | string[]) => {
    const newKeywords = Array.isArray(value) ? value : [];
    setSelectedKeywords(newKeywords);
    setValue('keywords', newKeywords);
  };

  const handleCreateKeyword = (newKeyword: string) => {
    if (!selectedKeywords.includes(newKeyword)) {
      const newKeywords = [...selectedKeywords, newKeyword];
      setSelectedKeywords(newKeywords);
      setValue('keywords', newKeywords);
    }
  };

  const nextStep = () => {
    // Prevent automatic transition beyond the last step
    setStep(prev => Math.min(prev + 1, totalSteps));
  };

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const onSubmit = (data: ArticlePlanningData) => {
    // Set loading state
    setIsGenerating(true);
    
    // Add selected keywords to form data
    const finalData = {
      ...data,
      // Use the selected keywords
      keywords: selectedKeywords || []
    };
    
    // Only complete when on the final step and Generate Article button is clicked
    // This prevents automatic transition to the summary page
    onComplete(finalData);
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      {/* Progress indicator */}
      <div className="mb-8">
      <div className="flex justify-between mt-2">
          <span className={`text-sm ${step === 1 ? 'font-bold text-blue-500' : 'text-gray-500'}`}>Purpose & Audience</span>
          <span className={`text-sm ${step === 2 ? 'font-bold text-blue-500' : 'text-gray-500'}`}>Style & Keywords</span>
        </div>
        <div className="flex items-center justify-between">
          <div className={`flex-1 h-2 ${step >= 1 ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
          <div className={`flex-1 h-2 ${step >= 2 ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
        </div>
      </div>

      <form onSubmit={(e) => {
          // Only allow form submission on the final step
          if (step !== totalSteps) {
            e.preventDefault();
            return false;
          }
          return handleSubmit(onSubmit)(e);
        }}>
        {/* Step 1: Purpose & Audience */}
        {step === 1 && (
          <div className="space-y-6">
            <p className="text-gray-600">
              Tell us what you want to write, what is the purpose and who is your audience
            </p>

            <div>
              <div className="flex items-center mb-2">
                <DocumentTextIcon className="h-5 w-5 text-blue-500 mr-2" />
                <label htmlFor="purpose" className="block text-sm font-medium text-gray-700">
                  What do you want to write about?
                </label>
              </div>
              <div className="flex items-center min-h-[44px] w-full cursor-text rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-indigo-600 sm:text-sm sm:leading-6">                
                <textarea
                  id="purpose"
                  {...register('purpose', { required: 'Please describe what you want to write about' })}
                  rows={5}
                  className="block w-full border-none focus:ring-0 focus:outline-none text-base py-1 px-1"
                  placeholder="Describe the topic and main points you want to cover in your article..."
                />
              </div>
              {errors.purpose && (
                <p className="mt-1 text-sm text-red-600">{errors.purpose.message}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Be specific about your topic and what you want readers to learn or understand
              </p>
            </div>

            <div>
              <div className="flex items-center mb-2">
                <LightBulbIcon className="h-5 w-5 text-blue-500 mr-2" />
                <label htmlFor="intent" className="block text-sm font-medium text-gray-700">
                  What purpose does this article serve?
                </label>
              </div>
              <div className="rounded-md shadow-sm">
                <TaggedSelect
                  value={typeof watch('intent') === 'string' ? watch('intent').split(',') : []}
                  onChange={(value) => {
                    const intents = Array.isArray(value) ? value : [];
                    setValue('intent', intents.join(','));
                  }}
                  options={[
                    { value: 'growth', label: 'Growth - Drive business growth' },
                    { value: 'educate', label: 'Educate - Share knowledge' },
                    { value: 'inform', label: 'Inform - Provide updates' },
                    { value: 'analyze', label: 'Analyze - Examine a topic' },
                    { value: 'instruct', label: 'Instruct - Teach a process' },
                    { value: 'persuade', label: 'Persuade - Change opinions' },
                    { value: 'entertain', label: 'Entertain - Engage readers' },
                  ]}
                  placeholder="Select your primary intent..."
                  multiple={true}
                  editable={false}
                  className="min-h-[44px] py-1"
                />
                <p className="mt-1 text-sm text-gray-500">
                  We recommend selecting at most 3 purposes
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center mb-2">
                <UserGroupIcon className="h-5 w-5 text-blue-500 mr-2" />
                <label htmlFor="targetAudience" className="block text-sm font-medium text-gray-700">
                  Who is your target audience?
                </label>
              </div>
              <div className="rounded-md shadow-sm">
                <TaggedSelect
                  value={typeof watch('targetAudience') === 'string' ? watch('targetAudience').split(',') : []}
                  onChange={(value) => {
                    const audiences = Array.isArray(value) ? value : [];
                    setValue('targetAudience', audiences.join(','));
                  }}
                  options={[
                    { value: 'potential', label: 'Potential Customers' },
                    { value: 'customers', label: 'Existing Customers' },
                    { value: 'beginners', label: 'Beginners' },
                    { value: 'intermediate', label: 'Intermediate Knowledge' },
                    { value: 'experts', label: 'Industry Experts' },
                    { value: 'general', label: 'General Public' },
                  ]}
                  placeholder="Select your target audience..."
                  multiple={true}
                  editable={false}
                  className="min-h-[44px] py-1"
                />
                <p className="mt-1 text-sm text-gray-500">
                  We recommend selecting at most 3 audience categories
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Style & Keywords */}
        {step === 2 && (
          <div className="space-y-6">
            <p className="text-gray-600">
              Further customize your article, like the keywords you want to cover and the styles!
            </p>
            <div>
              <div className="flex items-center mb-2">
                <label htmlFor="keywords" className="block text-sm font-medium text-gray-700">
                  Select keywords you want to cover in this article:
                </label>
              </div>
              <TaggedSelect
                value={selectedKeywords}
                onChange={handleKeywordsChange}
                options={businessKeywords.map(kw => ({ value: kw, label: kw }))}
                placeholder="Select or add keywords..."
                multiple={true}
                editable={true}
                className="min-h-[44px] py-1"
                onCreateOption={handleCreateKeyword}
              />
              <p className="mt-1 text-sm text-gray-500">
                Select from your business keywords or add new ones specific to this article
              </p>
            </div>

            <div>
              <div className="flex items-center mb-2">
                <SpeakerWaveIcon className="h-5 w-5 text-blue-500 mr-2" />
                <label htmlFor="tone" className="block text-sm font-medium text-gray-700">
                  Set the tone of voice for this article:
                </label>
              </div>
              <div className="rounded-md shadow-sm">
                <TaggedSelect
                  value={[watch('tone') || 'professional']}
                  onChange={(value) => {
                    const tone = Array.isArray(value) && value.length > 0 ? value[0] : 'professional';
                    setValue('tone', tone as string);
                  }}
                  options={[
                    { value: 'professional', label: 'Professional' },
                    { value: 'conversational', label: 'Conversational' },
                    { value: 'technical', label: 'Technical' },
                    { value: 'friendly', label: 'Friendly' },
                    { value: 'authoritative', label: 'Authoritative' },
                    { value: 'humorous', label: 'Humorous' }
                  ]}
                  placeholder="Select tone of voice..."
                  multiple={false}
                  editable={false}
                  className="min-h-[44px] py-1"
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                You can customize the tone of voice for this article
              </p>
            </div>

            <div>
              <div className="flex items-center mb-2">
                <ClockIcon className="h-5 w-5 text-blue-500 mr-2" />
                <label htmlFor="desiredLength" className="block text-sm font-medium text-gray-700">
                  Desired article length
                </label>
              </div>
              <div className="rounded-md shadow-sm">
                <TaggedSelect
                  value={[watch('desiredLength') || 'medium']}
                  onChange={(value) => {
                    const length = Array.isArray(value) && value.length > 0 ? value[0] : 'medium';
                    setValue('desiredLength', length as 'short' | 'medium' | 'long');
                  }}
                  options={[
                    { value: 'short', label: 'Short (300-500 words)' },
                    { value: 'medium', label: 'Medium (500-1000 words)' },
                    { value: 'long', label: 'Long (1000+ words)' }
                  ]}
                  placeholder="Select article length..."
                  multiple={false}
                  editable={false}
                  className="min-h-[44px] py-1"
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Select the desired article length. You need to decide this according to your audiences!
              </p>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="mt-8 flex justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={prevStep}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <ChevronLeftIcon className="h-5 w-5 mr-1" />
              Previous
            </button>
          ) : (
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
          )}

          {step < totalSteps ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault(); // Prevent form submission
                nextStep();
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Next
              <ChevronRightIcon className="h-5 w-5 ml-1" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isGenerating}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  Generate Article
                  <SparklesIcon className="h-5 w-5 ml-1" />
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
