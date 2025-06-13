'use client';

import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
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
  onCancel?: () => void;
  initialData?: ArticlePlanningData;
  ref?: React.ForwardedRef<ArticlePlanningFormRef>;
  onFormDataChange?: (data: ArticlePlanningData) => void;
}

export interface ArticlePlanningFormRef {
  resetGeneratingState: () => void;
}

const ArticlePlanningForm = forwardRef<ArticlePlanningFormRef, ArticlePlanningFormProps>(
  ({ onComplete, onCancel, initialData, onFormDataChange }, ref) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const totalSteps = 2; // Reduced from 3 to 2 steps
  const [loading, setLoading] = useState(false);
  const [businessKeywords, setBusinessKeywords] = useState<string[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>(initialData?.keywords || []);
  const [selectedTone, setSelectedTone] = useState<string>(initialData?.tone || 'professional');
  const [selectedLength, setSelectedLength] = useState<'short' | 'medium' | 'long'>(initialData?.desiredLength || 'medium');
  const [selectedIntents, setSelectedIntents] = useState<string[]>(initialData?.intent ? initialData.intent.split(',') : []);
  const [selectedAudiences, setSelectedAudiences] = useState<string[]>(initialData?.targetAudience ? initialData.targetAudience.split(',') : []);
  const [isGenerating, setIsGenerating] = useState(false);
  const [wordCount, setWordCount] = useState<number>(initialData?.purpose ? initialData.purpose.trim().split(/\s+/).filter(Boolean).length : 0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    resetGeneratingState: () => {
      console.log('Resetting generating state from parent');
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setIsGenerating(false);
    }
  }));

  
  // Define options for dropdowns
  const intentOptions = [
    { value: 'growth', label: 'Growth - Drive business growth' },
    { value: 'educate', label: 'Educate - Share knowledge' },
    { value: 'inform', label: 'Inform - Provide updates' },
    { value: 'analyze', label: 'Analyze - Examine a topic' },
    { value: 'instruct', label: 'Instruct - Teach a process' },
    { value: 'persuade', label: 'Persuade - Change opinions' },
    { value: 'entertain', label: 'Entertain - Engage readers' },
  ];
  
  const audienceOptions = [
    { value: 'potential', label: 'Potential Customers' },
    { value: 'customers', label: 'Existing Customers' },
    { value: 'beginners', label: 'Beginners' },
    { value: 'intermediate', label: 'Intermediate Knowledge' },
    { value: 'experts', label: 'Industry Experts' },
    { value: 'general', label: 'General Public' },
  ];
  
  const toneOptions = [
    { value: 'professional', label: 'Professional' },
    { value: 'conversational', label: 'Conversational' },
    { value: 'technical', label: 'Technical' },
    { value: 'friendly', label: 'Friendly' },
    { value: 'authoritative', label: 'Authoritative' },
    { value: 'humorous', label: 'Humorous' }
  ];
  
  const lengthOptions = [
    { value: 'short', label: 'Short (300-500 words)' },
    { value: 'medium', label: 'Medium (500-1000 words)' },
    { value: 'long', label: 'Long (1000+ words)' }
  ];
  
  const { register, handleSubmit, setValue, watch, formState: { errors }, trigger } = useForm<ArticlePlanningData>({
    defaultValues: initialData || {
      purpose: '',
      intent: 'growth',
      targetAudience: 'potential',
      keywords: [],
      desiredLength: 'medium',
      tone: 'professional'
    }
  });

  // Load business keywords from business info
  // Initialize form state values
  useEffect(() => {
    // Initialize intent and audience from default values
    const intentValue = watch('intent');
    if (typeof intentValue === 'string' && intentValue) {
      setSelectedIntents(intentValue.split(','));
    }
    
    const audienceValue = watch('targetAudience');
    if (typeof audienceValue === 'string' && audienceValue) {
      setSelectedAudiences(audienceValue.split(','));
    }
    
    // Initialize tone and length from default values
    const toneValue = watch('tone');
    if (toneValue) {
      setSelectedTone(toneValue);
    }
    
    const lengthValue = watch('desiredLength');
    if (lengthValue) {
      setSelectedLength(lengthValue);
    }
  }, [watch]);

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

  const nextStep = async () => {
    // Validate fields based on current step
    if (step === 1) {
      // Validate purpose field
      const purposeValid = await trigger('purpose');
      const purposeText = watch('purpose') || '';
      
      // Check if purpose has at least 20 words
      const wordCount = purposeText.trim().split(/\s+/).length;
      if (wordCount < 20) {
        setValue('purpose', purposeText); // Keep the current text
        // Set custom error
        errors.purpose = {
          type: 'manual',
          message: 'Please provide a more detailed description (at least 20 words)'
        };
        return; // Don't proceed to next step
      }
      
      if (!purposeValid) {
        return; // Don't proceed if validation fails
      }
    } else if (step === 2) {
      // Validate tone and length on the second step
      if (!selectedTone) {
        // Set error for tone
        errors.tone = {
          type: 'manual',
          message: 'Please select a tone of voice'
        };
        return;
      }
      
      if (!selectedLength) {
        // Set error for length
        errors.desiredLength = {
          type: 'manual',
          message: 'Please select a desired article length'
        };
        return;
      }
    }
    
    setStep(step + 1);
  };

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  // Use a ref to track the previous form data to avoid unnecessary updates
  const prevFormDataRef = useRef<string>('');
  
  // Notify parent of form data changes when relevant state changes
  useEffect(() => {
    if (!onFormDataChange) return;
    
    // Create current form data object
    const currentData: ArticlePlanningData = {
      purpose: watch('purpose') || '',
      targetAudience: selectedAudiences.join(','),
      intent: selectedIntents.join(','),
      desiredLength: selectedLength as 'short' | 'medium' | 'long',
      tone: selectedTone,
      keywords: selectedKeywords || []
    };
    
    // Convert to string for comparison to avoid unnecessary updates
    const currentDataString = JSON.stringify(currentData);
    
    // Only notify if data actually changed
    if (currentDataString !== prevFormDataRef.current) {
      prevFormDataRef.current = currentDataString;
      
      // Use a debounced update to prevent too many updates
      const timeoutId = setTimeout(() => {
        onFormDataChange(currentData);
      }, 300);
      
      return () => clearTimeout(timeoutId);
    }
  }, [
    // Only trigger when these values change
    watch('purpose'),
    selectedAudiences.join(','),
    selectedIntents.join(','),
    selectedLength,
    selectedTone,
    selectedKeywords?.join(','),
    onFormDataChange
  ]);

  const onSubmit = (data: ArticlePlanningData) => {
    // Set loading state
    setIsGenerating(true);
    
    // Get full labels for better LLM understanding
    const getFullLabel = (options: { value: string, label: string }[], value: string) => {
      const option = options.find(opt => opt.value === value);
      return option ? option.label : value;
    };
    
    // Add selected keywords to form data with full labels
    const finalData = {
      ...data,
      // Use the selected values from state
      keywords: selectedKeywords || [],
      tone: getFullLabel(toneOptions, selectedTone),
      desiredLength: getFullLabel(lengthOptions, selectedLength) as any, // Cast to any to avoid type error
      intent: selectedIntents.map(intent => getFullLabel(intentOptions, intent)).join(', '),
      targetAudience: selectedAudiences.map(audience => getFullLabel(audienceOptions, audience)).join(', ')
    };
    
    console.log('Sending article generation data with full labels:', finalData);
    
    // Only complete when on the final step and Generate Article button is clicked
    // This prevents automatic transition to the summary page
    onComplete(finalData);
    
    // Set up a timeout to reset the generating state if it's still active after 30 seconds
    // This prevents the button from being stuck in loading state if the API call fails silently
    const timeout = setTimeout(() => {
      setIsGenerating(false);
    }, 30000);
    
    // Store the timeout ID in a ref so we can clear it if needed
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = timeout;
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
              <div className="flex flex-col w-full cursor-text rounded-md bg-white py-1.5 pl-3 pr-3 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-indigo-600 sm:text-sm sm:leading-6">                
                <textarea
                  id="purpose"
                  {...register('purpose', { 
                    required: 'Please describe what you want to write about',
                    validate: value => {
                      const wordCount = (value || '').trim().split(/\s+/).filter(Boolean).length;
                      return wordCount >= 20 || 'Please provide a more detailed description (at least 20 words)';
                    },
                    onChange: (e) => {
                      const text = e.target.value || '';
                      const count = text.trim().split(/\s+/).filter(Boolean).length;
                      setWordCount(count);
                    }
                  })}
                  rows={5}
                  className="block w-full border-none focus:ring-0 focus:outline-none text-base py-1 px-1 resize-none"
                  placeholder="Describe the topic and main points you want to cover in your article..."
                  style={{ width: '100%' }}
                />
              </div>
              {errors.purpose && (
                <p className="mt-1 text-sm text-red-600">{errors.purpose.message}</p>
              )}
              <div className="flex justify-between items-center">
                <p className="mt-1 text-sm text-gray-500">
                  Be specific about your topic and what you want readers to learn or understand
                </p>
                <p className={`text-sm ${wordCount >= 20 ? 'text-green-600' : 'text-amber-600'}`}>
                  {wordCount} / 20 words {wordCount >= 20 ? '✓' : ''}
                </p>
              </div>
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
                  value={selectedIntents}
                  onChange={(value) => {
                    const intents = Array.isArray(value) ? value : [];
                    setSelectedIntents(intents);
                    setValue('intent', intents.join(','));
                  }}
                  options={intentOptions}
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
                  value={selectedAudiences}
                  onChange={(value) => {
                    const audiences = Array.isArray(value) ? value : [];
                    setSelectedAudiences(audiences);
                    setValue('targetAudience', audiences.join(','));
                  }}
                  options={audienceOptions}
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
                  value={selectedTone}
                  error={errors.tone?.message}
                  onChange={(value) => {
                    if (Array.isArray(value)) {
                      if (value.length === 0) {
                        setSelectedTone('');
                        setValue('tone', '');
                      } else {
                        setSelectedTone(value[0]);
                        setValue('tone', value[0]);
                      }
                    } else if (typeof value === 'string') {
                      setSelectedTone(value);
                      setValue('tone', value);
                    }
                  }}
                  options={toneOptions}
                  placeholder="Select tone of voice..."
                  multiple={false}
                  editable={false}
                  className="min-h-[44px] py-1"
                />
              </div>
              {errors.tone && (
                <p className="mt-1 text-sm text-red-600">{errors.tone.message}</p>
              )}
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
                  value={selectedLength}
                  error={errors.desiredLength?.message}
                  onChange={(value) => {
                    if (Array.isArray(value)) {
                      if (value.length === 0) {
                        setSelectedLength('' as 'short' | 'medium' | 'long');
                        setValue('desiredLength', '' as 'short' | 'medium' | 'long');
                      } else {
                        const length = value[0] as 'short' | 'medium' | 'long';
                        setSelectedLength(length);
                        setValue('desiredLength', length);
                      }
                    } else if (typeof value === 'string') {
                      const length = value as 'short' | 'medium' | 'long';
                      setSelectedLength(length);
                      setValue('desiredLength', length);
                    }
                  }}
                  options={lengthOptions}
                  placeholder="Select article length..."
                  multiple={false}
                  editable={false}
                  className="min-h-[44px] py-1"
                />
              </div>
              {errors.desiredLength && (
                <p className="mt-1 text-sm text-red-600">{errors.desiredLength.message}</p>
              )}
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
});

export default ArticlePlanningForm;
