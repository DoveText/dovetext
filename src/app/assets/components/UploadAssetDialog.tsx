'use client';

import React, { useState, useRef, FormEvent } from 'react';
import { 
  ArrowPathIcon, 
  ArrowUpTrayIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Asset } from './AssetItem';
import { assetsApi, AssetDto } from '@/app/api/assets';

interface UploadAssetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (assetData: Partial<Asset>, md5?: string, forceDuplicate?: boolean) => Promise<void>;
}

// Define upload stages
type UploadStage = 'initial' | 'uploading' | 'duplicate-found' | 'complete' | 'error';

export default function UploadAssetDialog({
  isOpen,
  onClose,
  onUpload
}: UploadAssetDialogProps) {
  // Basic form state
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('file');
  const [fileInput, setFileInput] = useState<File | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [descriptionInput, setDescriptionInput] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  
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
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form state
  const resetForm = () => {
    setUploadMethod('file');
    setFileInput(null);
    setUrlInput('');
    setNameInput('');
    setDescriptionInput('');
    setTagsInput('');
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
  };

  // Check if the form is ready to submit
  const isFormReadyToSubmit = () => {
    if (uploadMethod === 'file') {
      return fileInput && md5Hash && nameInput && !isLoading;
    } else {
      return urlInput && nameInput && !isLoading;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileInput(file);
      if (!nameInput) {
        setNameInput(file.name);
      }
    }
  };

  // Helper function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (uploadMethod === 'file' && !fileInput) {
      return;
    }
    
    if (uploadMethod === 'url' && !urlInput) {
      return;
    }
    
    // Check if file has been verified
    if (uploadMethod === 'file' && (!isVerified || !fileUuid || !md5Hash)) {
      setErrorMessage('Please verify the file first before uploading.');
      setUploadStage('error');
      return;
    }
    
    setIsLoading(true);
    setUploadStage('uploading');
    setUploadProgress(50); // Start at 50% since verification is already done
    
    try {
      if (uploadMethod === 'file') {
        // Determine asset type based on content type
        let assetType: 'image' | 'document' | 'video' | 'audio' = 'document';
        
        if (contentType?.startsWith('image/')) {
          assetType = 'image';
        } else if (contentType?.startsWith('video/')) {
          assetType = 'video';
        } else if (contentType?.startsWith('audio/')) {
          assetType = 'audio';
        }
        
        // Prepare metadata for the asset
        const metadata = {
          filename: fileInput!.name,
          contentType: contentType || fileInput!.type,
          description: descriptionInput,
          name: nameInput,
          type: assetType,
          tags: tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
          // Include both raw size (in bytes) for backend compatibility
          size: fileSize || fileInput!.size,
          // And formatted size for display
          fileSize: formatFileSize(fileSize || fileInput!.size),
        };
        
        setUploadProgress(75);
        
        // Create the asset using the UUID and MD5 from verification step
        // Pass forceDuplicate=true if it's a duplicate
        const createdAsset = await assetsApi.createAsset(
          fileUuid!,
          md5Hash!,
          metadata,
          isDuplicate // Automatically pass true if it's a duplicate
        );
        
        
        setUploadProgress(100);
        setUploadStage('complete');
        
        // Call the onUpload callback with the created asset
        if (onUpload) {
          // Pass the complete asset data to the parent component
          onUpload({
            // Include the original file for compatibility with AssetsManagement.handleUploadAsset
            file: fileInput!, // Non-null assertion is safe here because we've verified file exists
            // Include all the metadata from the API response
            originalAsset: createdAsset,
            // Map the API response to the expected Asset format
            id: createdAsset.uuid,
            name: createdAsset.meta.filename || metadata.name,
            type: assetType,
            size: createdAsset.meta.fileSize || formatFileSize(fileSize || fileInput!.size),
            description: createdAsset.meta.description || descriptionInput,
            tags: createdAsset.meta.tags || [],
            uploadedBy: 'You',
            uploadDate: new Date(createdAsset.createdAt).toLocaleDateString(),
            url: assetsApi.getAssetContentUrl(createdAsset.uuid)
          });
        }
        
        // Auto-close after successful upload with a short delay to show completion
        setTimeout(() => {
          resetForm();
          onClose();
        }, 1500);
      } else if (uploadMethod === 'url') {
        // URL upload logic here (if implemented)
        setUploadProgress(100);
        setUploadStage('complete');
        
        // Auto-close after successful upload
        setTimeout(() => {
          resetForm();
          onClose();
        }, 1500);
      }
      
    } catch (error) {
      console.error('Upload error:', error);
      setErrorMessage('Failed to upload asset. Please try again.');
      setUploadStage('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle force upload of a duplicate asset
  const handleForceDuplicate = async () => {
    if (!fileInput || !md5Hash || !fileUuid) return;
    
    setIsLoading(true);
    setUploadStage('uploading');
    setUploadProgress(50);
    
    try {
      // Determine asset type based on content type
      let assetType: 'image' | 'document' | 'video' | 'audio' = 'document';
      
      if (contentType?.startsWith('image/')) {
        assetType = 'image';
      } else if (contentType?.startsWith('video/')) {
        assetType = 'video';
      } else if (contentType?.startsWith('audio/')) {
        assetType = 'audio';
      }
      
      // Prepare metadata for the asset
      const metadata = {
        filename: fileInput.name,
        contentType: contentType || fileInput.type,
        description: descriptionInput,
        name: nameInput || fileInput.name,
        type: assetType,
        tags: tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
        // Include both raw size (in bytes) for backend compatibility
        size: fileSize || fileInput.size,
        // And formatted size for display
        fileSize: formatFileSize(fileSize || fileInput.size),
      };
      
      setUploadProgress(75);
      
      // Create the asset using the UUID and MD5 from verification step with force flag
      const asset = await assetsApi.createAsset(
        fileUuid,
        md5Hash,
        metadata,
        true // Force duplicate upload
      );
      
      setUploadProgress(100);
      setUploadStage('complete');
      
      // Call the onUpload callback with the created asset
      if (onUpload) {
        // Pass the complete asset data to the parent component
        onUpload({
          // Include the original file for compatibility with AssetsManagement.handleUploadAsset
          file: fileInput, 
          // Include all the metadata from the API response
          originalAsset: asset,
          // Map the API response to the expected Asset format
          id: asset.uuid,
          name: asset.meta.filename || nameInput || fileInput.name,
          type: assetType,
          size: asset.meta.fileSize || formatFileSize(fileSize || fileInput.size),
          description: asset.meta.description || descriptionInput,
          tags: asset.meta.tags || tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
          uploadedBy: 'You',
          uploadDate: new Date(asset.createdAt).toLocaleDateString(),
          url: assetsApi.getAssetContentUrl(asset.uuid)
        });
      }
      
      // Auto-close after successful upload with a short delay to show completion
      setTimeout(() => {
        resetForm();
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error during force upload:', error);
      setErrorMessage('Failed to upload asset. Please try again.');
      setUploadStage('error');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle cancellation of duplicate upload
  const handleCancelDuplicate = () => {
    setUploadStage('initial');
    setDuplicateInfo(null);
    setIsDuplicate(false);
  };

  if (!isOpen) return null;

// Render different content based on upload stage
  const renderContent = () => {
    switch (uploadStage) {
      case 'initial':
        return (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <div className="flex space-x-4 mb-4">
                  <button
                      type="button"
                      onClick={() => setUploadMethod('file')}
                      className={`px-4 py-2 rounded-md ${uploadMethod === 'file' ? 'bg-blue-100 text-blue-700 font-medium' : 'bg-gray-100 text-gray-700'}`}
                  >
                    Upload File
                  </button>
                  <button
                      type="button"
                      onClick={() => setUploadMethod('url')}
                      className={`px-4 py-2 rounded-md ${uploadMethod === 'url' ? 'bg-blue-100 text-blue-700 font-medium' : 'bg-gray-100 text-gray-700'}`}
                  >
                    From URL
                  </button>
                </div>
              </div>

              {uploadMethod === 'file' ? (
                  <div className="mb-4">
                    <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-1">Select File</label>
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center">
                        <input
                          type="file"
                          id="file-upload"
                          onChange={handleFileChange}
                          required={uploadMethod === 'file'}
                          className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                      </div>
                      {fileInput && (
                        <div className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                          <span className="text-sm text-gray-700 truncate max-w-xs">{fileInput.name}</span>
                          <button
                            type="button"
                            onClick={async () => {
                              if (!fileInput) return;
                              
                              setIsLoading(true);
                              setUploadProgress(10);
                              
                              try {
                                // Verify file and calculate MD5 hash
                                const verifyResponse = await assetsApi.verify(fileInput);
                                
                                // Store all the verification data
                                setMd5Hash(verifyResponse.md5);
                                setFileUuid(verifyResponse.uuid);
                                setFileSize(verifyResponse.size);
                                setContentType(verifyResponse.contentType);
                                setIsDuplicate(verifyResponse.isDuplicate);
                                
                                if (!nameInput && verifyResponse.filename) {
                                  setNameInput(verifyResponse.filename);
                                }
                                
                                setUploadProgress(40);
                                
                                // Check for duplicates
                                if (verifyResponse.isDuplicate && verifyResponse.duplicateInfo) {
                                  setDuplicateInfo(verifyResponse.duplicateInfo);
                                  // Instead of changing stage, just set the duplicate flag
                                  setIsDuplicate(true);
                                  setUploadProgress(50);
                                } else {
                                  setUploadProgress(50);
                                }
                                
                                // Mark as verified
                                setIsVerified(true);
                              } catch (error) {
                                console.error('Error during file validation:', error);
                                setErrorMessage('Failed to validate file. Please try again.');
                                setUploadStage('error');
                              } finally {
                                setIsLoading(false);
                              }
                            }}
                            disabled={isLoading}
                            className="px-3 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 flex items-center"
                          >
                            {isLoading ? <ArrowPathIcon className="h-4 w-4 animate-spin mr-1"/> : 'Validate'}
                          </button>
                        </div>
                      )}
                      {isLoading && uploadProgress > 0 && uploadProgress < 50 && (
                        <div className="mt-2">
                          <div className="text-xs text-gray-500 mb-1">
                            {uploadProgress < 30 ? 'Calculating MD5 hash...' : 'Checking for duplicates...'}
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div 
                              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300 ease-out" 
                              style={{width: `${uploadProgress}%`}}
                            ></div>
                          </div>
                        </div>
                      )}
                      
                      {/* Show duplicate warning inline */}
                      {isDuplicate && duplicateInfo && isVerified && !isLoading && (
                        <div className="mt-2 bg-red-50 border border-red-200 rounded-md p-3">
                          <div className="flex items-start">
                            <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-red-800">Duplicate asset detected</p>
                              <p className="text-xs text-red-700 mt-1">
                                This file already exists in your library as "{duplicateInfo.filename}" (uploaded on {duplicateInfo.uploadDate ? new Date(duplicateInfo.uploadDate).toLocaleDateString() : 'Unknown'}).
                              </p>
                              <p className="text-xs text-red-700 mt-1">
                                Continuing with the upload will create a duplicate copy.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
              ) : (
                  <div className="mb-4">
                    <label htmlFor="url-upload" className="block text-sm font-medium text-gray-700 mb-1">Asset
                      URL</label>
                    <input
                        type="url"
                        id="url-upload"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder="https://example.com/asset.jpg"
                        required={uploadMethod === 'url'}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
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

              <div className="mb-6">
                <label htmlFor="upload-tags" className="block text-sm font-medium text-gray-700 mb-1">Tags
                  (comma-separated)</label>
                <input
                    type="text"
                    id="upload-tags"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      onClose();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center"
                >
                  {isLoading ? <ArrowPathIcon className="h-4 w-4 animate-spin mr-2"/> :
                      <ArrowUpTrayIcon className="h-5 w-5 inline mr-1"/>}
                  {isLoading ? 'Adding...' : 'Add Asset'}
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Failed</h3>
              <p className="text-sm text-gray-500 mb-6">{errorMessage || 'An error occurred during upload. Please try again.'}</p>
              <div className="flex justify-center">
                <button
                    type="button"
                    onClick={() => {
                      // Reset all verification and error states
                      setUploadStage('initial');
                      setErrorMessage(null);
                      setIsVerified(false);
                      setIsDuplicate(false);
                      setDuplicateInfo(null);
                      setMd5Hash('');
                      setFileUuid('');
                      setUploadProgress(0);
                      // Don't reset the file input or other form fields
                    }}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Try Again
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
              {uploadStage === 'initial' ? 'Upload Asset' :
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
