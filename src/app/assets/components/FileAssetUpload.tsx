import React, { useState, useRef } from 'react';
import { ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { assetsApi } from '@/app/api/assets';
import { AssetType, verifyUrlAsset, detectAssetTypeFromContentType } from '../../../utils/assetTypeDetection';

interface FileAssetUploadProps {
  onFileVerified: (data: {
    file: File;
    md5: string;
    uuid: string;
    size: number;
    contentType: string;
    isDuplicate: boolean;
    duplicateInfo?: { filename: string; uploadDate: string; uuid: string };
    filename?: string;
    assetType?: AssetType;
  }) => void;
  assetType?: AssetType;
  setAssetType: React.Dispatch<React.SetStateAction<AssetType>>;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  uploadProgress: number;
  setUploadProgress: (progress: number) => void;
  nameInput: string;
  setNameInput: (name: string) => void;
  errorMessage: string | null;
  setErrorMessage: (message: string | null) => void;
}

export default function FileAssetUpload({
  onFileVerified,
  isLoading,
  setIsLoading,
  uploadProgress,
  setUploadProgress,
  nameInput,
  setNameInput,
  errorMessage,
  setErrorMessage,
  assetType,
  setAssetType
}: FileAssetUploadProps) {
  const [fileInput, setFileInput] = useState<File | null>(null);
  const [isDuplicate, setIsDuplicate] = useState<boolean>(false);
  const [duplicateInfo, setDuplicateInfo] = useState<{ filename: string; uploadDate: string; uuid: string } | null>(null);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [verificationSuccessMessage, setVerificationSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileInput(file);
      if (!nameInput) {
        setNameInput(file.name);
      }
      setErrorMessage(null);
      setVerificationSuccessMessage(null);
    }
  };

  const handleVerifyFile = async () => {
    if (!fileInput) return;
    
    setIsLoading(true);
    setUploadProgress(10);
    
    try {
      // Verify file and calculate MD5 hash
      const verifyResponse = await assetsApi.verify(fileInput);
      
      // Store duplicate information locally
      setIsDuplicate(verifyResponse.isDuplicate);
      if (verifyResponse.isDuplicate && verifyResponse.duplicateInfo) {
        setDuplicateInfo(verifyResponse.duplicateInfo);
      }
      
      // Mark as verified
      setIsVerified(true);
      
      // Detect asset type from content type
      const detectedAssetType = detectAssetTypeFromContentType(verifyResponse.contentType);
      
      // Notify parent component with verification data
      onFileVerified({
        file: fileInput,
        md5: verifyResponse.md5,
        uuid: verifyResponse.uuid,
        size: verifyResponse.size,
        contentType: verifyResponse.contentType,
        isDuplicate: verifyResponse.isDuplicate,
        duplicateInfo: verifyResponse.duplicateInfo,
        filename: verifyResponse.filename,
        assetType: detectedAssetType
      });
      
      // Update asset type in parent component
      if (detectedAssetType) {
        setAssetType(detectedAssetType);
      } else {
        // Default to document if detection fails
        setAssetType('document');
      }
      
      // Update progress
      setUploadProgress(40);
      setUploadProgress(50);

      setErrorMessage(null); // Clear previous errors on new successful verification

      if (!verifyResponse.isDuplicate) {
        const assetType = detectAssetTypeFromContentType(verifyResponse.contentType);
        
        if (!detectedAssetType) {
          // If asset type couldn't be determined, show a message asking to select type
          setVerificationSuccessMessage(`Your file has been verified, but we couldn't determine its type. Please select an asset type below.`);
          setErrorMessage('Please select an asset type for this file');
        } else {
          setVerificationSuccessMessage(`Your ${detectedAssetType} has been verified. You can now submit to create the asset.`);
        }
      } else {
        setVerificationSuccessMessage(null); // Clear if it's a duplicate, as parent will show duplicate info
      }
    } catch (error) {
      console.error('Error during file validation:', error);
      setErrorMessage('Failed to validate file. Please try again.');
      setVerificationSuccessMessage(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mb-4">
      <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-1">Select File</label>
      <div className="flex flex-col space-y-2">
        <div className="flex items-center">
          <input
            type="file"
            id="file-upload"
            ref={fileInputRef}
            onChange={handleFileChange}
            required
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
        {fileInput && (
          <div className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
            <span className="text-sm text-gray-700 truncate max-w-xs">{fileInput.name}</span>
            <button
              type="button"
              onClick={handleVerifyFile}
              disabled={isLoading}
              className="px-3 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 flex items-center"
            >
              {isLoading ? <ArrowPathIcon className="h-4 w-4 animate-spin mr-1"/> : 'Upload'}
            </button>
          </div>
        )}
        {verificationSuccessMessage && (
          <div className="mt-2 text-sm text-green-700 p-3 bg-green-100 border border-green-300 rounded-md">
            {verificationSuccessMessage}
          </div>
        )}
        {isLoading && uploadProgress > 0 && uploadProgress < 50 && (
          <div className="mt-2">
            <div className="text-xs text-gray-500 mb-1">
              {uploadProgress < 30 ? 'Calculating MD5 hash...' : 'Checking for duplicates...'}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="bg-blue-600 h-1.5 rounded-full" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}
        {errorMessage && (
          <div className="text-sm text-red-600 mt-1">{errorMessage}</div>
        )}
        
        {/* Show duplicate warning inline */}
        {isDuplicate && duplicateInfo && isVerified && !isLoading && (
          <div className="mt-2 bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Duplicate asset detected</p>
                <p className="text-xs text-red-700 mt-1">
                  This file already exists in your library as "{duplicateInfo.filename}" 
                  (uploaded on {duplicateInfo.uploadDate ? new Date(duplicateInfo.uploadDate).toLocaleDateString() : 'Unknown'}).
                </p>
                <p className="text-xs text-red-700 mt-1">
                  Continuing with the upload will create a duplicate copy.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Asset type selection (shown when type is unknown or detection failed) */}
        {errorMessage && errorMessage.includes('select an asset type') && isVerified && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Asset Type
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {['image', 'audio', 'video', 'document'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setAssetType(type as AssetType)}
                  disabled={isLoading}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${assetType === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Show the detected asset type */}
        {isVerified && assetType && !errorMessage?.includes('select an asset type') && (
          <div className="flex items-center mt-2">
            <span className="text-sm text-gray-500 mr-2">Detected asset type:</span>
            <span className="text-sm font-medium capitalize">{assetType}</span>
          </div>
        )}
      </div>
    </div>
  );
}
