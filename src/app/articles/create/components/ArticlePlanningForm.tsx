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
  ChevronLeftIcon
} from '@heroicons/react/24/outline';

// Types for article planning
export interface ArticlePlanningData {
  purpose: string;
  targetAudience: string;
  intent: string;
  keywords: string[];
  desiredLength: 'short' | 'medium' | 'long';
  tone: string;
}

interface ArticlePlanningFormProps {
  onComplete: (data: ArticlePlanningData) => void;
  onCancel: () => void;
}

export default function ArticlePlanningForm({ onComplete, onCancel }: ArticlePlanningFormProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [businessKeywords, setBusinessKeywords] = useState<string[]>([]);
  
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ArticlePlanningData>({
    defaultValues: {
      purpose: '',
      targetAudience: 'general',
      intent: 'educate',
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
        const businessInfoItems = await businessInfoApi.getBusinessInfo();
        
        // Find keywords in business info
        const keywordsItem = businessInfoItems.find(item => item.key === 'keywords');
        if (keywordsItem && keywordsItem.value) {
          try {
            const parsedKeywords = JSON.parse(keywordsItem.value);
            if (Array.isArray(parsedKeywords)) {
              setBusinessKeywords(parsedKeywords);
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
  }, [user]);

  const handleKeywordsChange = (value: string | string[]) => {
    const newKeywords = Array.isArray(value) ? value : [];
    setValue('keywords', newKeywords);
  };

  const handleCreateKeyword = (newKeyword: string) => {
    const currentKeywords = watch('keywords') || [];
    if (!currentKeywords.includes(newKeyword)) {
      setValue('keywords', [...currentKeywords, newKeyword]);
    }
  };

  const nextStep = () => {
    setStep(prev => Math.min(prev + 1, 3));
  };

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const onSubmit = (data: ArticlePlanningData) => {
    onComplete(data);
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Plan Your Article</h2>
        <p className="text-gray-600">
          Let AI help you create a well-structured article by providing some information
        </p>
      </div>

      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className={`flex-1 h-2 ${step >= 1 ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
          <div className={`flex-1 h-2 ${step >= 2 ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
          <div className={`flex-1 h-2 ${step >= 3 ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
        </div>
        <div className="flex justify-between mt-2">
          <span className={`text-sm ${step === 1 ? 'font-bold text-blue-500' : 'text-gray-500'}`}>Purpose</span>
          <span className={`text-sm ${step === 2 ? 'font-bold text-blue-500' : 'text-gray-500'}`}>Audience & Intent</span>
          <span className={`text-sm ${step === 3 ? 'font-bold text-blue-500' : 'text-gray-500'}`}>Style & Keywords</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Step 1: Purpose */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center mb-2">
                <DocumentTextIcon className="h-5 w-5 text-blue-500 mr-2" />
                <label htmlFor="purpose" className="block text-sm font-medium text-gray-700">
                  What do you want to write about?
                </label>
              </div>
              <textarea
                id="purpose"
                {...register('purpose', { required: 'Please describe what you want to write about' })}
                rows={5}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full text-base px-4 py-3 border border-gray-300 rounded-md"
                placeholder="Describe the topic and main points you want to cover in your article..."
              />
              {errors.purpose && (
                <p className="mt-1 text-sm text-red-600">{errors.purpose.message}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Be specific about your topic and what you want readers to learn or understand
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Audience & Intent */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center mb-2">
                <UserGroupIcon className="h-5 w-5 text-blue-500 mr-2" />
                <label htmlFor="targetAudience" className="block text-sm font-medium text-gray-700">
                  Who is your target audience?
                </label>
              </div>
              <select
                id="targetAudience"
                {...register('targetAudience', { required: true })}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full text-base px-4 py-3 border border-gray-300 rounded-md"
              >
                <option value="general">General Public</option>
                <option value="beginners">Beginners</option>
                <option value="intermediate">Intermediate Knowledge</option>
                <option value="experts">Industry Experts</option>
                <option value="customers">Existing Customers</option>
                <option value="potential">Potential Customers</option>
              </select>
            </div>

            <div>
              <div className="flex items-center mb-2">
                <LightBulbIcon className="h-5 w-5 text-blue-500 mr-2" />
                <label htmlFor="intent" className="block text-sm font-medium text-gray-700">
                  What is your primary intent?
                </label>
              </div>
              <select
                id="intent"
                {...register('intent', { required: true })}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full text-base px-4 py-3 border border-gray-300 rounded-md"
              >
                <option value="educate">Educate - Share knowledge</option>
                <option value="persuade">Persuade - Change opinions</option>
                <option value="entertain">Entertain - Engage readers</option>
                <option value="inform">Inform - Provide updates</option>
                <option value="analyze">Analyze - Examine a topic</option>
                <option value="instruct">Instruct - Teach a process</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 3: Style & Keywords */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center mb-2">
                <ClockIcon className="h-5 w-5 text-blue-500 mr-2" />
                <label htmlFor="desiredLength" className="block text-sm font-medium text-gray-700">
                  Desired article length
                </label>
              </div>
              <select
                id="desiredLength"
                {...register('desiredLength', { required: true })}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full text-base px-4 py-3 border border-gray-300 rounded-md"
              >
                <option value="short">Short (300-500 words)</option>
                <option value="medium">Medium (500-1000 words)</option>
                <option value="long">Long (1000+ words)</option>
              </select>
            </div>

            <div>
              <div className="flex items-center mb-2">
                <SpeakerWaveIcon className="h-5 w-5 text-blue-500 mr-2" />
                <label htmlFor="tone" className="block text-sm font-medium text-gray-700">
                  Tone of voice
                </label>
              </div>
              <select
                id="tone"
                {...register('tone', { required: true })}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full text-base px-4 py-3 border border-gray-300 rounded-md"
              >
                <option value="professional">Professional</option>
                <option value="conversational">Conversational</option>
                <option value="technical">Technical</option>
                <option value="friendly">Friendly</option>
                <option value="authoritative">Authoritative</option>
                <option value="humorous">Humorous</option>
              </select>
            </div>

            <div>
              <div className="flex items-center mb-2">
                <label htmlFor="keywords" className="block text-sm font-medium text-gray-700">
                  Keywords
                </label>
              </div>
              <TaggedSelect
                value={watch('keywords')}
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

          {step < 3 ? (
            <button
              type="button"
              onClick={nextStep}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Next
              <ChevronRightIcon className="h-5 w-5 ml-1" />
            </button>
          ) : (
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>Generate Article</>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
