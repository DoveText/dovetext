'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import { 
  ArrowPathIcon, 
  ArrowUpTrayIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Asset } from './AssetItem';
import { assetsApi, AssetDto } from '@/app/api/assets';
import FileAssetUpload from './FileAssetUpload';
import URLAssetUpload from './URLAssetUpload';
import TaggedSelect, { TaggedSelectOption } from '@/components/common/TaggedSelect';
import { AssetType, verifyUrlAsset } from '@/utils/assetTypeDetection';

interface UploadAssetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (assetData: Partial<Asset>, md5?: string, forceDuplicate?: boolean) => Promise<void>;
  editMode?: boolean;
  assetToEdit?: Asset | null;
}

// Define upload stages
type UploadStage = 'initial' | 'uploading' | 'duplicate-found' | 'complete' | 'error';

export default function UploadAssetDialog({
  isOpen,
  onClose,
  onUpload,
  editMode = false,
  assetToEdit = null
}: UploadAssetDialogProps) {
  // Basic form state
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('file');
  const [fileInput, setFileInput] = useState<File | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [tagsInput, setTagsInput] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [descriptionInput, setDescriptionInput] = useState('');
  const [assetType, setAssetType] = useState<AssetType>('unknown');
  
  // Upload progress state
  const [uploadStage, setUploadStage] = useState<UploadStage>('initial');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [md5Hash, setMd5Hash] = useState<string | null>(null);
  const [fileUuid, setFileUuid] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [contentType, setContentType] = useState<string | null>(null);
  const [duplicateInfo, setDuplicateInfo] = useState<{ filename: string; uploadDate: string; uuid: string } | null>(null);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  
  // Handle file verification callback
  const handleFileVerified = (data: {
    file: File;
    md5: string;
    uuid: string;
    size: number;
    contentType: string;
    isDuplicate: boolean;
    duplicateInfo?: { filename: string; uploadDate: string; uuid: string };
    filename?: string;
  }) => {
    setFileInput(data.file);
    setMd5Hash(data.md5);
    setFileUuid(data.uuid);
    setFileSize(data.size);
    setContentType(data.contentType);
    setIsDuplicate(data.isDuplicate);
    
    if (!nameInput && data.filename) {
      setNameInput(data.filename);
    }
    
    if (data.isDuplicate && data.duplicateInfo) {
      setDuplicateInfo(data.duplicateInfo);
    }
    
    // Mark as verified
    setIsVerified(true);
  };
  
  // Handle URL verification callback - similar to file verification
  const handleUrlVerified = (data: {
    url: string;
    md5: string;
    uuid: string;
    size: number;
    contentType: string;
    isDuplicate: boolean;
    duplicateInfo?: any;
    filename?: string;
    assetType?: AssetType;
  }) => {
    setUrlInput(data.url);
    setMd5Hash(data.md5);
    setFileUuid(data.uuid);
    setFileSize(data.size);
    setContentType(data.contentType);
    setIsDuplicate(data.isDuplicate);
    
    if (data.assetType) {
      setAssetType(data.assetType);
    }
    
    if (!nameInput && data.filename) {
      setNameInput(data.filename);
    }
    
    if (data.isDuplicate && data.duplicateInfo) {
      setDuplicateInfo(data.duplicateInfo);
    }
    
    // Mark as verified
    setIsVerified(true);
  };

  // Effect to reset form and fetch available tags when dialog opens
  useEffect(() => {
    if (isOpen) {
      // If in edit mode and we have an asset to edit, populate the form
      if (editMode && assetToEdit) {
        setNameInput(assetToEdit.name || '');
        setTagsInput(assetToEdit.tags || []);
        setDescriptionInput(assetToEdit.description || '');
        setIsVerified(true); // Skip verification for edit mode
      } else {
        resetForm();
      }
      
      // Fetch all available tags from existing assets
      const fetchAvailableTags = async () => {
        try {
          const assets = await assetsApi.getAll();
          const allTags = new Set<string>();
          
          // Collect all unique tags from assets
          assets.forEach(asset => {
            if (asset.meta.tags && Array.isArray(asset.meta.tags)) {
              asset.meta.tags.forEach(tag => allTags.add(tag));
            }
          });
          
          setAvailableTags(Array.from(allTags));
        } catch (error) {
          console.error('Failed to fetch tags:', error);
        }
      };
      
      fetchAvailableTags();
    }
  }, [isOpen]);
  
  // Reset form state
  const resetForm = () => {
    setUploadMethod('file');
    setFileInput(null);
    setUrlInput('');
    setNameInput('');
    setTagsInput([]);
    setDescriptionInput('');
    setUploadStage('initial');
    setUploadProgress(0);
    setMd5Hash(null);
    setFileUuid(null);
    setFileSize(null);
    setContentType(null);
    setDuplicateInfo(null);
    setIsDuplicate(false);
    setErrorMessage(null);
    setIsLoading(false);
    setIsVerified(false);
    setAssetType('unknown');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (isLoading) return;
    
    // Basic validation
    if (!nameInput.trim()) {
      setErrorMessage('Please provide a name for the asset');
      return;
    }
    
    // For file uploads, we need a verified file (only if not in edit mode)
    if (uploadMethod === 'file' && !isVerified && !editMode) {
      setErrorMessage('Please select and verify a file first');
      return;
    }
    
    // For URL uploads, we need a URL and asset type (only if not in edit mode)
    if (uploadMethod === 'url' && !urlInput.trim() && !editMode) {
      setErrorMessage('Please enter a valid URL');
      return;
    }
    
    // Make sure we have a valid asset type for URL uploads
    if (uploadMethod === 'url' && assetType === 'unknown' && !editMode) {
      setErrorMessage('Please select an asset type');
      return;
    }
    
    setIsLoading(true);
    let progressInterval: NodeJS.Timeout | undefined;
    
    // Only show upload progress if not in edit mode
    if (!editMode) {
      setUploadStage('uploading');
      setUploadProgress(0);
      
      // Simulate upload progress
      progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + Math.floor(Math.random() * 10);
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 300);
    }
    
    // Prepare asset data
    const assetData: Partial<Asset> = {
      type: uploadMethod || 'file',
      name: nameInput.trim(),
      uuid: fileUuid,
      md5: md5Hash,
      description: descriptionInput.trim(),
      metadata: {
        tags: tagsInput,
        filename: fileInput?.name || nameInput,
        contentType: contentType,
        description: descriptionInput,
        name: nameInput,
        // Include both raw size (in bytes) for backend compatibility
        size: fileSize,
      }
    };
    
    try {
      // Add file or URL based on upload method (only if not in edit mode)
      if (uploadMethod === 'file' && fileInput && !editMode) {
        assetData.file = fileInput;
      } else if (uploadMethod === 'url') {
        assetData.url = urlInput.trim();
        assetData.metadata.url = urlInput.trim();
      }
      
      // If we're in edit mode and have an asset to edit, include the ID
      if (editMode && assetToEdit) {
        assetData.id = assetToEdit.id;
      }
    } catch (error) {
      console.error('Error preparing asset data:', error);
      setErrorMessage('Failed to prepare asset data. Please try again.');
      setUploadStage('error');
      setIsLoading(false);
      if (progressInterval) clearInterval(progressInterval);
      return;
    }
    
    // Call the onUpload callback
    onUpload(assetData, md5Hash || undefined, isDuplicate)
      .then(() => {
        if (!editMode && progressInterval) {
          // Only clear interval if we're not in edit mode
          clearInterval(progressInterval);
          setUploadProgress(100);
          setUploadStage('complete');
        } else {
          // In edit mode, just close the dialog on success
          onClose();
        }
        // Don't reset form here as we show a success message first
      })
      .catch(error => {
        if (!editMode && progressInterval) {
          // Only clear interval if we're not in edit mode
          clearInterval(progressInterval);
        }
        
        // Extract more detailed error information
        let errorMsg = 'Failed to update asset';
        
        if (error.response) {
          // Server responded with an error status
          const status = error.response.status;
          errorMsg = `Server error (${status}): `;
          
          if (status === 500) {
            errorMsg += 'Internal server error. Please try again later.';
          } else if (status === 400) {
            errorMsg += 'Invalid data provided.';
          } else if (status === 401 || status === 403) {
            errorMsg += 'Not authorized to perform this action.';
          } else if (status === 404) {
            errorMsg += 'Asset not found.';
          } else {
            errorMsg += error.response.data?.message || 'Unknown error';
          }
        } else if (error.request) {
          // Request was made but no response received
          errorMsg = 'No response from server. Please check your network connection.';
        } else if (error.message) {
          // Error setting up the request
          errorMsg = error.message;
        }
        
        console.error('Asset update error:', error);
        setErrorMessage(errorMsg);
        setUploadStage('error');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  if (!isOpen) return null;

  // Render different content based on upload stage
  const renderContent = () => {
    switch (uploadStage) {
      case 'initial':
        return (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Upload method tabs - only show if not in edit mode */}
            {!editMode && (
              <div className="flex border-b border-gray-200">
                <button
                  type="button"
                  className={`py-2 px-4 text-center ${uploadMethod === 'file' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setUploadMethod('file')}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  className={`py-2 px-4 text-center ${uploadMethod === 'url' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setUploadMethod('url')}
                >
                  URL
                </button>
              </div>
            )}
            
            {/* Hide file selection section when in edit mode */}
            {!editMode && (
              uploadMethod === 'file' ? (
                <FileAssetUpload
                  onFileVerified={handleFileVerified}
                  isLoading={isLoading}
                  setIsLoading={setIsLoading}
                  uploadProgress={uploadProgress}
                  setUploadProgress={setUploadProgress}
                  nameInput={nameInput}
                  setNameInput={setNameInput}
                  errorMessage={errorMessage}
                  setErrorMessage={setErrorMessage}
                />
              ) : (
                <URLAssetUpload
                  urlInput={urlInput}
                  setUrlInput={setUrlInput}
                  isLoading={isLoading}
                  setIsLoading={setIsLoading}
                  uploadProgress={uploadProgress}
                  setUploadProgress={setUploadProgress}
                  nameInput={nameInput}
                  setNameInput={setNameInput}
                  errorMessage={errorMessage}
                  setErrorMessage={setErrorMessage}
                  assetType={assetType}
                  setAssetType={setAssetType}
                  setMd5Hash={setMd5Hash}
                  setFileUuid={setFileUuid}
                  setIsDuplicate={setIsDuplicate}
                  setDuplicateInfo={setDuplicateInfo}
                  setContentType={setContentType}
                  setFileSize={setFileSize}
                  onUrlVerified={handleUrlVerified}
                />
              )
            )}
            
            <div className="mb-4">
              <label htmlFor="upload-name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                id="upload-name"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="upload-tags" className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
              <TaggedSelect
                id="upload-tags"
                value={tagsInput}
                onChange={(value) => {
                  // Ensure no duplicates in the selected tags
                  if (Array.isArray(value)) {
                    // Create a case-insensitive Set to track unique tags
                    const uniqueTags = new Set<string>();
                    const uniqueTagsArray: string[] = [];
                    
                    // Process each tag to ensure uniqueness
                    (value as string[]).forEach(tag => {
                      const lowerTag = tag.toLowerCase();
                      if (!uniqueTags.has(lowerTag)) {
                        uniqueTags.add(lowerTag);
                        uniqueTagsArray.push(tag);
                      }
                    });
                    
                    setTagsInput(uniqueTagsArray);
                  } else if (value) {
                    // Handle single value case (should not happen with multiple=true)
                    setTagsInput([value as string]);
                  } else {
                    // Handle empty case
                    setTagsInput([]);
                  }
                }}
                options={availableTags.map(tag => ({ value: tag, label: tag }))} 
                multiple={true}
                editable={true}
                placeholder="Type and press Enter to add tags"
                onCreateOption={(label) => {
                  const normalizedLabel = label.trim();
                  if (!normalizedLabel) return;
                  
                  // Check if tag already exists in selected tags
                  if (tagsInput.some(tag => tag.toLowerCase() === normalizedLabel.toLowerCase())) {
                    return; // Tag already selected, do nothing
                  }
                  
                  // Check if tag exists in available tags but with different case
                  const existingTag = availableTags.find(
                    tag => tag.toLowerCase() === normalizedLabel.toLowerCase()
                  );
                  
                  if (existingTag) {
                    // Use the existing tag with its original casing
                    setTagsInput([...tagsInput, existingTag]);
                  } else {
                    // Add as a new tag
                    setTagsInput([...tagsInput, normalizedLabel]);
                    setAvailableTags([...availableTags, normalizedLabel]);
                  }
                }}
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="upload-description" className="block text-sm font-medium text-gray-700 mb-1">Description
                (Optional)</label>
              <textarea
                id="upload-description"
                value={descriptionInput}
                onChange={(e) => setDescriptionInput(e.target.value)}
                rows={3}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              ></textarea>
            </div>
            
            {/* Submit button */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  onClose();
                }}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!editMode && !isVerified}
                className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${(!editMode && !isVerified) ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'}`}
              >
                {editMode ? 'Save Changes' : isDuplicate ? 'Upload Anyway' : 'Upload Asset'}
              </button>
            </div>
          </form>
        );

      case 'uploading':
        return (
            <div className="py-6">
              <div className="flex items-center mb-4">
                <ArrowPathIcon className="h-8 w-8 animate-spin text-blue-500 mr-3"/>
                <h3 className="text-lg font-medium text-gray-900">
                  {uploadProgress < 50 ? 'Processing file...' : 'Uploading asset...'}
                </h3>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                    style={{width: `${uploadProgress}%`}}
                ></div>
              </div>
              <p className="text-sm text-gray-500">{uploadProgress}% complete</p>
              <p className="text-sm text-gray-500 mt-2">
                {uploadProgress < 30 ? 'Calculating MD5 hash...' :
                 uploadProgress < 50 ? 'Checking for duplicates...' :
                 uploadProgress < 80 ? 'Uploading asset content...' :
                 'Finalizing upload...'}
              </p>
            </div>
        );

      // Removed duplicate-found case as we now handle duplicates inline

      case 'error':
        return (
            <div className="text-center py-6">
              <XMarkIcon className="h-12 w-12 mx-auto text-red-500 mb-4"/>
              <h3 className="text-lg font-medium text-gray-900 mb-2">{editMode ? 'Update Failed' : 'Upload Failed'}</h3>
              <p className="text-sm text-gray-500 mb-6">{errorMessage || 'An error occurred. Please try again.'}</p>
              <div className="flex justify-center space-x-4">
                <button
                    type="button"
                    onClick={() => {
                      // Reset all verification and error states
                      setUploadStage('initial');
                      setErrorMessage(null);
                      setIsVerified(false);
                      setIsDuplicate(false);
                      setDuplicateInfo(null);
                      if (!editMode) {
                        setMd5Hash('');
                        setFileUuid('');
                        setUploadProgress(0);
                      }
                      // Don't reset the file input or other form fields
                    }}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Try Again
                </button>
                <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      onClose();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
              </div>
            </div>
        );

      case 'complete':
        return (
            <div className="text-center py-6">
              <CheckCircleIcon className="h-12 w-12 mx-auto text-green-500 mb-4"/>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Complete</h3>
              <p className="text-sm text-gray-500 mb-6">Your asset has been successfully uploaded.</p>
              <div className="flex justify-center">
                <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      onClose();
                    }}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Close
                </button>
              </div>
            </div>
        );

      default:
        return null;
    }
  };

  return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              {editMode ? 'Edit Asset' :
                uploadStage === 'initial' ? 'Upload Asset' :
                uploadStage === 'uploading' ? 'Processing...' :
                uploadStage === 'duplicate-found' ? 'Duplicate Detected' :
                uploadStage === 'error' ? 'Upload Error' :
                'Upload Complete'}
            </h2>
            {uploadStage !== 'uploading' && (
                <button
                    onClick={() => {
                      resetForm();
                      onClose();
                    }}
                    className="text-gray-500 hover:text-gray-700"
                >
                  <XMarkIcon className="h-5 w-5"/>
                </button>
            )}
          </div>

          {renderContent()}
        </div>
      </div>
  );
}
