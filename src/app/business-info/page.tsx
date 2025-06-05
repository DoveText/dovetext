'use client';

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { 
  ArrowPathIcon, 
  GlobeAltIcon, 
  BuildingOfficeIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  ArrowTopRightOnSquareIcon,
  PlusCircleIcon, // Added
  TrashIcon, // Added
  InformationCircleIcon // Added
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useUserType } from '@/context/UserTypeContext';
import { useRouter } from 'next/navigation';
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
}

interface BusinessInfo {
  name: string;
  description: string;
  logo: string;
  website: string;
  phone: string;
  email: string;
  address: string;
  socialMedia: {
    facebook: string;
    twitter: string;
    instagram: string;
    linkedin: string;
  };
  hours: string;
  industry: string;
  otherInformation?: KeyValuePair[];
}

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
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    name: '',
    description: '',
    logo: '',
    website: '',
    phone: '',
    email: '',
    address: '',
    socialMedia: {
      facebook: '',
      twitter: '',
      instagram: '',
      linkedin: '',
    },
    hours: '',
    industry: '',
  });
  
  const { register, handleSubmit, setValue, watch, control, getValues, formState: { errors } } = useForm<BusinessInfo & { websiteUrl: string }>({
    defaultValues: {
      name: '',
      description: '',
      logo: '',
      website: '',
      phone: '',
      email: '',
      address: '',
      socialMedia: {
        facebook: '',
        twitter: '',
        instagram: '',
        linkedin: '',
      },
      hours: '',
      industry: '',
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
      'name', 'description', 'logo', 'website', 'phone', 'email', 'address', 'hours', 'industry'
    ];
    const knownSocialFields: (keyof BusinessInfo['socialMedia'])[] = [
      'facebook', 'twitter', 'instagram', 'linkedin'
    ];
    
    const currentOtherInfo = getValues('otherInformation') || [];
    const newOtherInfoItems: KeyValuePair[] = [];

    for (const [key, value] of Object.entries(dataToApply)) {
      if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) continue;

      if (knownFormFields.includes(key as keyof BusinessInfo)) {
        setValue(key as keyof BusinessInfo, value as string);
      } else if (key === 'socialMedia' && typeof value === 'object' && value !== null) {
        for (const [socialKey, socialValue] of Object.entries(value as BusinessInfo['socialMedia'])) {
          if (socialValue && typeof socialValue === 'string' && socialValue.trim() !== '' && knownSocialFields.includes(socialKey as keyof BusinessInfo['socialMedia'])) {
            setValue(`socialMedia.${socialKey}` as `socialMedia.${keyof BusinessInfo['socialMedia']}`, socialValue as string);
          } else if (socialValue && typeof socialValue === 'string' && socialValue.trim() !== '') {
            newOtherInfoItems.push({ key: `socialMedia.${socialKey}`, value: socialValue as string });
          }
        }
      } else {
        if (typeof value === 'string' && value.trim() !== '') {
          newOtherInfoItems.push({ key, value });
        } else if (typeof value === 'object' && value !== null) {
          newOtherInfoItems.push({ key, value: JSON.stringify(value) });
        }
      }
    }
    
    // Merge newOtherInfoItems with existingOtherInfo, updating if key exists, else adding
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
  
  // Function to save business info
  const saveBusinessInfo = async (data: BusinessInfo) => {
    setLoading(true);
    try {
      // This would be an API call to your backend service
      // For now, we'll simulate a response after a delay
      toast.loading('Saving business information...', { id: 'saving' });
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update state with form data
      setBusinessInfo(data);
      toast.success('Business information saved successfully!', { id: 'saving' });
    } catch (error) {
      console.error('Error saving business info:', error);
      toast.error('Failed to save business information. Please try again.', { id: 'saving' });
    } finally {
      setLoading(false);
    }
  };
  
  // Redirect personal users to dashboard
  if (userType === 'personal') {
    router.push('/dashboard');
    return null;
  }

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
              {(extractionStep === 'idle' || extractionStep === 'errorRetrieving') && (
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
                {extractionStep === 'retrieving' && (
                  <div className="flex items-center text-blue-600">
                    <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                    <span>Step 1: Retrieving website content...</span>
                  </div>
                )}
                {retrievedContent && (extractionStep === 'extracting' || extractionStep === 'completed' || extractionStep === 'errorExtracting') && (
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
                {(extractionStep === 'idle' || extractionStep === 'errorRetrieving') && (
                  <button
                    type="button"
                    disabled={!websiteUrl || extractionStep === 'retrieving' || extractionStep === 'extracting'}
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
        
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      {...register('name', { required: 'Business name is required' })}
                    />
                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Description</label>
                    <textarea
                      rows={4}
                      className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      {...register('description')}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                    <input
                      type="url"
                      className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      {...register('logo')}
                    />
                    <p className="text-xs text-gray-500 mt-1">Enter the URL of your logo image. For best results, use a square image.</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      {...register('industry')}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Hours</label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Monday - Friday: 9AM - 5PM"
                      {...register('hours')}
                    />
                  </div>
                </div>
                
                {/* Contact Information */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                    <div className="flex items-center">
                      <GlobeAltIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <input
                        type="url"
                        className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        {...register('website')}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <div className="flex items-center">
                      <PhoneIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <input
                        type="tel"
                        className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        {...register('phone')}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <div className="flex items-center">
                      <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <input
                        type="email"
                        className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        {...register('email', {
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Invalid email address'
                          }
                        })}
                      />
                    </div>
                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Address</label>
                    <div className="flex items-center">
                      <MapPinIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        {...register('address')}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Social Media */}
              <div className="mt-6">
                <h3 className="text-md font-medium mb-3">Social Media Profiles</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Facebook</label>
                    <input
                      type="url"
                      className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://facebook.com/yourbusiness"
                      {...register('socialMedia.facebook')}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Twitter</label>
                    <input
                      type="url"
                      className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://twitter.com/yourbusiness"
                      {...register('socialMedia.twitter')}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
                    <input
                      type="url"
                      className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://instagram.com/yourbusiness"
                      {...register('socialMedia.instagram')}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
                    <input
                      type="url"
                      className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://linkedin.com/company/yourbusiness"
                      {...register('socialMedia.linkedin')}
                    />
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
                        <tr key={field.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              {...register(`otherInformation.${index}.key` as const, { required: 'Key is required' })}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                              placeholder="e.g., VAT Number"
                            />
                            {errors.otherInformation?.[index]?.key && 
                              <p className="text-red-500 text-xs mt-1">{errors.otherInformation[index]?.key?.message}</p>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              {...register(`otherInformation.${index}.value` as const, { required: 'Value is required' })}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                              placeholder="Enter value"
                            />
                            {errors.otherInformation?.[index]?.value && 
                              <p className="text-red-500 text-xs mt-1">{errors.otherInformation[index]?.value?.message}</p>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button 
                              type="button" 
                              onClick={() => removeOtherInfo(index)}
                              className="text-red-600 hover:text-red-800 p-1"
                              aria-label="Remove item"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button
                  type="button"
                  onClick={() => appendOtherInfo({ key: '', value: '' })}
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
