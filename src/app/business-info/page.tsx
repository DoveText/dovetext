'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { 
  ArrowPathIcon, 
  GlobeAltIcon, 
  BuildingOfficeIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  ArrowTopRightOnSquareIcon,
  PlusCircleIcon,
  TrashIcon,
  InformationCircleIcon,
  PencilIcon, // Added for edit
  CheckIcon, // Added for save
  XMarkIcon // Added for cancel
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useUserType } from '@/context/UserTypeContext';
import { useRouter } from 'next/navigation';
import { businessInfoApi, UserBusinessInfoDto } from '@/app/api/business-info';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/common/dialog/Dialog';

// Types for business information
interface KeyValuePair {
  key: string;
  value: string;
  id?: number;
}

interface BusinessInfo {
  name: string;
  description: string;
  website: string;
  industry: string;
  keywords: string;
  socialMedia: {
    facebook: string;
    twitter: string;
    instagram: string;
    linkedin: string;
  };
  otherInformation?: KeyValuePair[];
}

// Using types from the business-info API file

export default function BusinessInfoPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { userType } = useUserType();
  const [loading, setLoading] = useState(false);
  const [extractionStep, setExtractionStep] = useState<'idle' | 'retrieving' | 'extracting' | 'completed' | 'errorRetrieving' | 'errorExtracting'>('idle');
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [retrievedContent, setRetrievedContent] = useState<{content: string, contentType: string, url: string} | null>(null);
  const [extractedBusinessData, setExtractedBusinessData] = useState<Partial<BusinessInfo> | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const [tempEditValues, setTempEditValues] = useState<{key: string, value: string}>({key: '', value: ''});
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    name: '',
    description: '',
    website: '',
    industry: '',
    keywords: '',
    socialMedia: {
      facebook: '',
      twitter: '',
      instagram: '',
      linkedin: ''
    },
    otherInformation: []
  });
  
  const { register, handleSubmit, setValue, watch, control, getValues, formState: { errors } } = useForm<BusinessInfo & { websiteUrl: string }>({
    defaultValues: {
      name: '',
      description: '',
      website: '',
      industry: '',
      keywords: '',
      otherInformation: [],
      websiteUrl: ''
    }
  });

  const { fields: otherInfoFields, append: appendOtherInfo, remove: removeOtherInfo } = useFieldArray({
    control,
    name: 'otherInformation'
  });

  // API Base URL
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9090/api/v1/gen/business';
  
  const websiteUrl = watch('websiteUrl');
  
  const handleExtractFromUrl = async (url: string) => {
    if (!url) {
      setExtractionError('Please enter a valid website URL.');
      setExtractionStep('errorRetrieving');
      return;
    }

    setExtractionStep('retrieving');
    setExtractionError(null);
    toast.loading('Step 1: Retrieving website content...', { id: 'extraction' });

    try {
      const retrieveResponse = await fetch(`${API_BASE_URL}/retrieve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!retrieveResponse.ok) {
        const errorData = await retrieveResponse.json();
        throw new Error(errorData.error || `Failed to retrieve content (status: ${retrieveResponse.status})`);
      }

      const retrievedData = await retrieveResponse.json();
      setRetrievedContent({ content: retrievedData.content, contentType: retrievedData.content_type, url: retrievedData.url });
      toast.success('Step 1: Website content retrieved!', { id: 'extraction' });
      
      setExtractionStep('extracting');
      toast.loading('Step 2: Extracting business information...', { id: 'extraction' });

      const extractResponse = await fetch(`${API_BASE_URL}/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: retrievedData.content, 
          content_type: retrievedData.content_type,
          url: retrievedData.url 
        }),
      });

      if (!extractResponse.ok) {
        const errorData = await extractResponse.json();
        throw new Error(errorData.error || `Failed to extract information (status: ${extractResponse.status})`);
      }

      const extractedData = await extractResponse.json();
      setExtractedBusinessData(extractedData);
      setExtractionStep('completed');
      toast.success('Step 2: Business information extracted successfully!', { id: 'extraction' });

    } catch (error: any) {
      console.error('Extraction process failed:', error);
      setExtractionError(error.message || 'An unknown error occurred.');
      toast.error(error.message || 'Extraction failed.', { id: 'extraction' });
      if (extractionStep === 'retrieving') {
        setExtractionStep('errorRetrieving');
      } else {
        setExtractionStep('errorExtracting');
      }
    }
  };

  const applyExtractedDataToForm = () => {
    if (!extractedBusinessData) return;

    const { metadata, ...dataToApply } = extractedBusinessData as any; // metadata might be part of response

    const knownFormFields: (keyof BusinessInfo)[] = [
      'name', 'description', 'website', 'industry', 'keywords'
    ];
    
    const knownSocialFields: (keyof BusinessInfo['socialMedia'])[] = [
      'facebook', 'twitter', 'instagram', 'linkedin'
    ];
    
    const currentOtherInfo = getValues('otherInformation') || [];
    const newOtherInfoItems: KeyValuePair[] = [];

    Object.entries(dataToApply).forEach(([key, value]) => {

      if (knownFormFields.includes(key as keyof BusinessInfo)) {
        setValue(key as keyof BusinessInfo, value as string);
      } else if (key === 'socialMedia' && typeof value === 'object' && value !== null) {
        // Handle social media fields
        Object.entries(value as Record<string, any>).forEach(([socialKey, socialValue]) => {
          if (knownSocialFields.includes(socialKey as keyof BusinessInfo['socialMedia']) && 
              typeof socialValue === 'string' && socialValue.trim() !== '') {
            setValue(`socialMedia.${socialKey}` as any, socialValue as string);
          }
        });
      } else if (key === 'otherInformation' && Array.isArray(value)) {
        // Handle otherInformation array directly if it exists in the response
        value.forEach((item: KeyValuePair) => {
          if (item.key && item.value && typeof item.value === 'string' && item.value.trim() !== '') {
            newOtherInfoItems.push(item);
          }
        });
      } else {
        // For any other fields, add to otherInformation
        if (typeof value === 'string' && value.trim() !== '') {
          newOtherInfoItems.push({ key, value });
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          // Handle nested objects by flattening them
          Object.entries(value as Record<string, any>).forEach(([nestedKey, nestedValue]) => {
            if (typeof nestedValue === 'string' && nestedValue.trim() !== '') {
              newOtherInfoItems.push({ key: `${key}.${nestedKey}`, value: nestedValue });
            }
          });
        }
      }
    });

    const finalOtherInfo = [...currentOtherInfo];
    newOtherInfoItems.forEach(newItem => {
        const existingIndex = finalOtherInfo.findIndex(item => item.key === newItem.key);
        if (existingIndex > -1) {
            finalOtherInfo[existingIndex].value = newItem.value; // Update existing
        } else {
            finalOtherInfo.push(newItem); // Add new
        }
    });

    setValue('otherInformation', finalOtherInfo);
    setBusinessInfo(prev => ({ ...prev, ...getValues() })); // Update local state for rendering if needed
    toast.success('Extracted data applied to form.');
    setDialogOpen(false);
    resetDialogState();
  };

  const resetDialogState = () => {
    setExtractionStep('idle');
    setExtractionError(null);
    setRetrievedContent(null);
    setExtractedBusinessData(null);
    setValue('websiteUrl', ''); // Clear URL input in dialog
  };
  
  // Load business info from backend
  const loadBusinessInfo = useCallback(async () => {
    if (!user) return null;
    
    try {
      setLoading(true);
      const businessInfoData = await businessInfoApi.getAll();
      
      // Process the data into our BusinessInfo structure
      const formData: BusinessInfo = {
        name: '',
        description: '',
        website: '',
        industry: '',
        keywords: '',
        socialMedia: {
          facebook: '',
          twitter: '',
          instagram: '',
          linkedin: ''
        },
        otherInformation: []
      };
      
      // Map the flat key-value pairs to our structured form
      businessInfoData.forEach(item => {
        if (item.key === 'name') formData.name = item.value;
        else if (item.key === 'description') formData.description = item.value;
        else if (item.key === 'website') formData.website = item.value;
        else if (item.key === 'industry') formData.industry = item.value;
        else if (item.key === 'keywords') formData.keywords = item.value;
        else if (item.key === 'socialMedia.facebook') formData.socialMedia.facebook = item.value;
        else if (item.key === 'socialMedia.twitter') formData.socialMedia.twitter = item.value;
        else if (item.key === 'socialMedia.instagram') formData.socialMedia.instagram = item.value;
        else if (item.key === 'socialMedia.linkedin') formData.socialMedia.linkedin = item.value;
        else {
          // Add to otherInformation
          formData.otherInformation.push({
            key: item.key,
            value: item.value,
            id: item.id
          });
        }
      });
      
      // Update the form with loaded data
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== 'otherInformation' && key !== 'socialMedia') {
          setValue(key as keyof BusinessInfo, value as string);
        }
      });
      
      // Set social media fields
      Object.entries(formData.socialMedia).forEach(([key, value]) => {
        setValue(`socialMedia.${key}` as any, value);
      });
      
      // Set other information fields
      formData.otherInformation.forEach((item, index) => {
        if (index >= otherInfoFields.length) {
          appendOtherInfo(item);
        } else {
          setValue(`otherInformation.${index}.key` as any, item.key);
          setValue(`otherInformation.${index}.value` as any, item.value);
          if (item.id) {
            setValue(`otherInformation.${index}.id` as any, item.id);
          }
        }
      });
      
      setBusinessInfo(formData);
    } catch (error) {
      console.error('Error loading business info:', error);
      toast.error('Failed to load business information');
    } finally {
      setLoading(false);
    }
  }, [user, setValue, appendOtherInfo, otherInfoFields.length]);

  useEffect(() => {
    if (user) {
      loadBusinessInfo();
    }
  }, [user, loadBusinessInfo]);
  
  // Function to save business info
  const saveBusinessInfo = async (data: BusinessInfo) => {
    if (!user) {
      toast.error('You must be logged in to save business information');
      return;
    }
    
    setLoading(true);
    try {
      toast.loading('Saving business information...', { id: 'saving' });
      
      // Convert our structured data to flat key-value pairs for the API
      const batchItems: UserBusinessInfoDto[] = [
        { key: 'name', value: data.name },
        { key: 'description', value: data.description },
        { key: 'website', value: data.website },
        { key: 'industry', value: data.industry },
        { key: 'keywords', value: data.keywords },
      ];
      
      // Add social media fields if they have values
      if (data.socialMedia.facebook) {
        batchItems.push({ key: 'socialMedia.facebook', value: data.socialMedia.facebook });
      }
      if (data.socialMedia.twitter) {
        batchItems.push({ key: 'socialMedia.twitter', value: data.socialMedia.twitter });
      }
      if (data.socialMedia.instagram) {
        batchItems.push({ key: 'socialMedia.instagram', value: data.socialMedia.instagram });
      }
      if (data.socialMedia.linkedin) {
        batchItems.push({ key: 'socialMedia.linkedin', value: data.socialMedia.linkedin });
      }
      
      // Add other information items
      if (data.otherInformation && data.otherInformation.length > 0) {
        data.otherInformation.forEach(item => {
          if (item.key && item.value) {
            batchItems.push({
              id: item.id,
              key: item.key,
              value: item.value
            });
          }
        });
      }
      
      // Send batch update to backend using the API client
      await businessInfoApi.batchUpdate(batchItems);
      
      // Update state with form data
      setBusinessInfo(data);
      toast.success('Business information saved successfully!', { id: 'saving' });
      
      // Reload the data to get the updated IDs
      loadBusinessInfo();
    } catch (error: any) {
      console.error('Error saving business info:', error);
      toast.error(`Failed to save business information: ${error.message || 'Unknown error'}`, { id: 'saving' });
    } finally {
      setLoading(false);
    }
  };
  
  // Redirect personal users to dashboard using useEffect to avoid React warnings
  useEffect(() => {
    if (userType === 'personal') {
      router.push('/dashboard');
    }
  }, [userType, router]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Business Information</h1>
          </div>
          
          {/* Extract Business Info Dialog */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Refresh Business Information from Website</DialogTitle>
                {extractionStep !== 'completed' && (
                  <DialogDescription>
                    Enter the website URL to retrieve its content and extract business information.
                  </DialogDescription>
                )}
              </DialogHeader>
              
              {/* URL Input - visible in 'idle', 'errorRetrieving' states */}
                {(['idle', 'errorRetrieving'] as const).includes(extractionStep) && (
                  <div className="mt-4">
                    <label htmlFor="websiteUrlDialog" className="block text-sm font-medium text-gray-700">
                      Website URL
                    </label>
                    <input
                      type="url"
                      id="websiteUrlDialog"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="https://example.com"
                      {...register('websiteUrl', { required: 'Website URL is required' })}
                    />
                    {errors.websiteUrl && <p className="text-red-500 text-sm mt-1">{errors.websiteUrl.message}</p>}
                  </div>
                )}

                {/* Progress/Status Display */}
                <div className="mt-4 space-y-2">
                  {(extractionStep === 'retrieving') && (
                    <div className="flex items-center text-blue-600">
                      <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                      <span>Step 1: Retrieving website content...</span>
                    </div>
                  )}
                  {retrievedContent && ['extracting', 'completed', 'errorExtracting'].includes(extractionStep) && (
                  <div className="flex items-center text-green-600">
                    <InformationCircleIcon className="h-5 w-5 mr-2" />
                    <span>Step 1: Website content retrieved successfully.</span>
                  </div>
                )}
                {extractionStep === 'extracting' && (
                  <div className="flex items-center text-blue-600">
                    <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                    <span>Step 2: Extracting business information...</span>
                  </div>
                )}
                {extractionStep === 'completed' && extractedBusinessData && (
                  <div className="flex items-center text-green-600">
                    <InformationCircleIcon className="h-5 w-5 mr-2" />
                    <span>Step 2: Business information extracted successfully. Ready to apply.</span>
                  </div>
                )}
                {extractionError && (extractionStep === 'errorRetrieving' || extractionStep === 'errorExtracting') && (
                  <div className="text-red-500">
                    <p><strong>Error:</strong> {extractionError}</p>
                  </div>
                )}
              </div>

              <DialogFooter className="mt-6">
                <button
                  type="button"
                  onClick={() => { setDialogOpen(false); resetDialogState(); }}
                  className="mr-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>

                {/* Initial Extract Button */}
                {(['idle', 'errorRetrieving'] as const).includes(extractionStep) && (
                  <button
                    type="button"
                    disabled={!websiteUrl || ['retrieving', 'extracting'].includes(extractionStep as string)}
                    onClick={() => handleExtractFromUrl(websiteUrl)}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 disabled:bg-gray-400 flex items-center"
                  >
                    <GlobeAltIcon className="h-5 w-5 mr-2" />
                    Start Extraction
                  </button>
                )}

                {/* Retry Extract Button */}
                {extractionStep === 'errorExtracting' && retrievedContent && (
                  <button
                    type="button"
                    onClick={async () => {
                      setExtractionStep('extracting');
                      setExtractionError(null);
                      toast.loading('Step 2: Retrying extraction...', { id: 'extraction' });
                      try {
                        const extractResponse = await fetch(`${API_BASE_URL}/extract`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ 
                            content: retrievedContent.content, 
                            content_type: retrievedContent.contentType,
                            url: retrievedContent.url 
                          }),
                        });
                        if (!extractResponse.ok) {
                          const errorData = await extractResponse.json();
                          throw new Error(errorData.error || `Failed to extract information (status: ${extractResponse.status})`);
                        }
                        const extractedData = await extractResponse.json();
                        setExtractedBusinessData(extractedData);
                        setExtractionStep('completed');
                        toast.success('Step 2: Business information extracted successfully!', { id: 'extraction' });
                      } catch (error: any) {
                        setExtractionError(error.message || 'An unknown error occurred during extraction retry.');
                        toast.error(error.message || 'Extraction retry failed.', { id: 'extraction' });
                        setExtractionStep('errorExtracting');
                      }
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-orange-500 border border-transparent rounded-md shadow-sm hover:bg-orange-600 disabled:bg-gray-400 flex items-center"
                  >
                    <ArrowPathIcon className="h-5 w-5 mr-2" />
                    Retry Extraction (Step 2)
                  </button>
                )}

                {/* Apply to Form Button */}
                {extractionStep === 'completed' && (
                  <button
                    type="button"
                    onClick={applyExtractedDataToForm}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 flex items-center"
                  >
                    Apply to Form & Close
                  </button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <form onSubmit={handleSubmit(saveBusinessInfo)} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold flex items-center">
                <BuildingOfficeIcon className="h-5 w-5 mr-2 text-blue-500" />
                Business Details
              </h2>
              <button 
                type="button"
                onClick={() => setDialogOpen(true)}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-1" />
                Refresh From Website
              </button>
            </div>
            
            <div className="p-6">
        
              <div className="w-full">
                {/* Business Info */}
                <div className="w-full">
                  <h2 className="text-xl font-semibold mb-4">Business Info</h2>
                  
                  {/* Line 1: Website, Business Name, Industry */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 w-full">
                    {/* Website */}
                    <div>
                      <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                        <div className="flex items-center">
                          <GlobeAltIcon className="h-5 w-5 mr-1 text-gray-500" />
                          Website
                        </div>
                      </label>
                      <div className="flex">
                        <input
                          {...register('website')}
                          id="website"
                          type="url"
                          className="w-full border border-gray-300 rounded-l-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="https://example.com"
                        />
                        {watch('website') && (
                          <a 
                            href={watch('website')} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-gray-100 border border-gray-300 border-l-0 rounded-r-md px-3 flex items-center hover:bg-gray-200"
                          >
                            <ArrowTopRightOnSquareIcon className="h-5 w-5 text-gray-500" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Business Name */}
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        <div className="flex items-center">
                          <BuildingOfficeIcon className="h-5 w-5 mr-1 text-gray-500" />
                          Business Name
                        </div>
                      </label>
                      <input
                        {...register('name', { required: 'Business name is required' })}
                        id="name"
                        type="text"
                        className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter business name"
                      />
                      {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
                    </div>

                    {/* Industry */}
                    <div>
                      <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1">
                        <div className="flex items-center">
                          <InformationCircleIcon className="h-5 w-5 mr-1 text-gray-500" />
                          Industry
                        </div>
                      </label>
                      <input
                        {...register('industry')}
                        id="industry"
                        type="text"
                        className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter industry"
                      />
                    </div>
                  </div>
                  
                  {/* Line 2: Keywords */}
                  <div className="mb-4">
                    <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 mb-1">
                      <div className="flex items-center">
                        <InformationCircleIcon className="h-5 w-5 mr-1 text-gray-500" />
                        Keywords
                      </div>
                    </label>
                    <input
                      {...register('keywords')}
                      id="keywords"
                      type="text"
                      className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter keywords separated by commas"
                    />
                  </div>
                  
                  {/* Line 3: Description */}
                  <div className="mb-4">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                      Business Description
                    </label>
                    <textarea
                      {...register('description')}
                      id="description"
                      rows={4}
                      className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter a brief description of your business"
                    ></textarea>
                  </div>
                  
                  {/* Social Media */}
                  <div className="mt-6 pt-4 border-t border-gray-200 w-full">
                    <h3 className="text-md font-medium mb-3">Social Media</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                      <div>
                        <label htmlFor="facebook" className="block text-sm font-medium text-gray-700 mb-1">
                          Facebook
                        </label>
                        <input
                          {...register('socialMedia.facebook')}
                          id="facebook"
                          type="url"
                          className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="https://facebook.com/yourbusiness"
                        />
                      </div>
                      <div>
                        <label htmlFor="twitter" className="block text-sm font-medium text-gray-700 mb-1">
                          Twitter
                        </label>
                        <input
                          {...register('socialMedia.twitter')}
                          id="twitter"
                          type="url"
                          className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="https://twitter.com/yourbusiness"
                        />
                      </div>
                      <div>
                        <label htmlFor="instagram" className="block text-sm font-medium text-gray-700 mb-1">
                          Instagram
                        </label>
                        <input
                          {...register('socialMedia.instagram')}
                          id="instagram"
                          type="url"
                          className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="https://instagram.com/yourbusiness"
                        />
                      </div>
                      <div>
                        <label htmlFor="linkedin" className="block text-sm font-medium text-gray-700 mb-1">
                          LinkedIn
                        </label>
                        <input
                          {...register('socialMedia.linkedin')}
                          id="linkedin"
                          type="url"
                          className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="https://linkedin.com/company/yourbusiness"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Other Information Section */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-md font-medium mb-3">Other Information</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Key
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Value
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {otherInfoFields.map((field, index) => (
                        <tr key={field.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          {editingRowIndex === index ? (
                            // Editing mode
                            <>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                  value={tempEditValues.key}
                                  onChange={(e) => setTempEditValues({...tempEditValues, key: e.target.value})}
                                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                                  placeholder="e.g., VAT Number"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                  value={tempEditValues.value}
                                  onChange={(e) => setTempEditValues({...tempEditValues, value: e.target.value})}
                                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                                  placeholder="Enter value"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex space-x-2 justify-end">
                                  <button 
                                    type="button" 
                                    onClick={() => {
                                      // Save the edited values
                                      setValue(`otherInformation.${index}.key`, tempEditValues.key);
                                      setValue(`otherInformation.${index}.value`, tempEditValues.value);
                                      setEditingRowIndex(null);
                                    }}
                                    className="text-green-600 hover:text-green-800 p-1"
                                    aria-label="Save changes"
                                  >
                                    <CheckIcon className="h-5 w-5" />
                                  </button>
                                  <button 
                                    type="button" 
                                    onClick={() => {
                                      // Cancel editing
                                      setEditingRowIndex(null);
                                    }}
                                    className="text-gray-600 hover:text-gray-800 p-1"
                                    aria-label="Cancel editing"
                                  >
                                    <XMarkIcon className="h-5 w-5" />
                                  </button>
                                </div>
                              </td>
                            </>
                          ) : (
                            // Display mode
                            <>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {watch(`otherInformation.${index}.key`) || <span className="text-gray-400 italic">No key</span>}
                                  <input
                                    {...register(`otherInformation.${index}.key` as const, { required: 'Key is required' })}
                                    type="hidden"
                                  />
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {watch(`otherInformation.${index}.value`) || <span className="text-gray-400 italic">No value</span>}
                                  <input
                                    {...register(`otherInformation.${index}.value` as const, { required: 'Value is required' })}
                                    type="hidden"
                                  />
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex space-x-2 justify-end">
                                  <button 
                                    type="button" 
                                    onClick={() => {
                                      // Start editing this row
                                      setTempEditValues({
                                        key: watch(`otherInformation.${index}.key`) || '',
                                        value: watch(`otherInformation.${index}.value`) || ''
                                      });
                                      setEditingRowIndex(index);
                                    }}
                                    className="text-blue-600 hover:text-blue-800 p-1"
                                    aria-label="Edit item"
                                  >
                                    <PencilIcon className="h-5 w-5" />
                                  </button>
                                  <button 
                                    type="button" 
                                    onClick={() => removeOtherInfo(index)}
                                    className="text-red-600 hover:text-red-800 p-1"
                                    aria-label="Remove item"
                                  >
                                    <TrashIcon className="h-5 w-5" />
                                  </button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                      {otherInfoFields.length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                            No additional information available. Click "Add Row" to add some.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    appendOtherInfo({ key: '', value: '' });
                    // Start editing the newly added row
                    setTimeout(() => {
                      const newIndex = otherInfoFields.length;
                      setTempEditValues({ key: '', value: '' });
                      setEditingRowIndex(newIndex);
                    }, 0);
                  }}
                  className="mt-4 text-sm text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <PlusCircleIcon className="h-5 w-5 mr-1" />
                  Add Row
                </button>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-300 flex items-center"
                >
                  {loading ? (
                    <>
                      <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>Save Business Information</>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}
