'use client';

import React, { useState, useEffect } from 'react';
import { detectAssetTypeFromUrl, verifyUrlAsset } from '@/utils/assetTypeDetection';
import { AssetType } from '@/types';
import { RadioGroup } from '@headlessui/react';
import { CheckCircleIcon, ArrowPathIcon } from '@heroicons/react/24/solid';

export interface URLAssetUploadProps {
  urlInput: string;
  setUrlInput: (url: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  uploadProgress: number;
  setUploadProgress: (progress: number) => void;
  nameInput: string;
  setNameInput: (name: string) => void;
  errorMessage: string;
  setErrorMessage: (error: string) => void;
  assetType: AssetType | null;
  setAssetType: (type: AssetType | null) => void;
  setMd5Hash: (hash: string) => void;
  setFileUuid: (uuid: string) => void;
  setIsDuplicate: (isDuplicate: boolean) => void;
  setDuplicateInfo: (info: any) => void;
  setIsVerified: (isVerified: boolean) => void;
}

export default function URLAssetUpload({
  urlInput,
  setUrlInput,
  isLoading,
  setIsLoading,
  uploadProgress,
  setUploadProgress,
  nameInput,
  setNameInput,
  errorMessage,
  setErrorMessage,
  assetType,
  setAssetType,
  setMd5Hash,
  setFileUuid,
  setIsDuplicate,
  setDuplicateInfo,
  setIsVerified,
}: URLAssetUploadProps) {
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionError, setDetectionError] = useState<string | null>(null);
  const [isVerifiedLocal, setIsVerifiedLocal] = useState(false);

  // Handle URL verification
  const handleVerifyUrl = async () => {
    if (!urlInput || !urlInput.trim() || !urlInput.startsWith('http')) {
      setDetectionError('Please enter a valid URL');
      return;
    }

    setIsLoading(true);
    setUploadProgress(10); // Start progress indication
    setDetectionError(null);

    try {
      // Call backend to verify URL and get metadata
      const result = await verifyUrlAsset(urlInput);

      // Update verification status and metadata
      setIsVerifiedLocal(true);
      setIsVerified(true);
      setUploadProgress(40); // Update progress

      // Set asset metadata from verification result
      if (result.contentType) {
        // Update asset type based on content type from backend
        const detectedType = result.assetType || await detectAssetTypeFromUrl(urlInput);
        setAssetType(detectedType);
      }

      // Set metadata for parent component
      if (result.md5) setMd5Hash(result.md5);
      if (result.uuid) setFileUuid(result.uuid);

      // Handle duplicate detection
      if (result.isDuplicate) {
        setIsDuplicate(true);
        setDuplicateInfo(result.duplicateInfo || {});
        setDetectionError('This URL asset already exists in the system.');
      } else {
        setIsDuplicate(false);
        setDuplicateInfo(null);
      }

      // If name is not set and we have a filename from the URL, use it
      if (!nameInput && result.filename) {
        setNameInput(result.filename);
      }
      
      // Show size information if available
      if (result.size) {
        console.log(`Asset size: ${result.size} bytes`);
      }
    } catch (error: any) {
      console.error('Error verifying URL asset:', error);
      setDetectionError(error.message || 'Failed to verify URL. Please check the URL and try again.');
      setIsVerifiedLocal(false);
      setIsVerified(false);
    } finally {
      setIsLoading(false);
      setUploadProgress(0); // Reset progress
    }
  };

  // Detect asset type when URL changes (lightweight detection based on extension)
  useEffect(() => {
    const detectType = async () => {
      if (!urlInput || !urlInput.trim() || !urlInput.startsWith('http')) {
        setAssetType(null);
        return;
      }

      setIsDetecting(true);
      setDetectionError(null);

      try {
        // Try to detect asset type from URL extension only (lightweight)
        const detectedType = await detectAssetTypeFromUrl(urlInput);
        setAssetType(detectedType);
      } catch (error) {
        console.error('Error detecting asset type:', error);
        setDetectionError('Could not detect asset type. Please select manually or use the Check button.');
        setAssetType(null);
      } finally {
        setIsDetecting(false);
      }
    };

    detectType();
    // Reset verification status when URL changes
    setIsVerifiedLocal(false);
    setIsVerified(false);
  }, [urlInput, setAssetType, setIsVerified]);

  // Try to extract a name from the URL if no name is provided
  useEffect(() => {
    if (urlInput && !nameInput) {
      try {
        const url = new URL(urlInput);
        const pathSegments = url.pathname.split('/');
        const filename = pathSegments[pathSegments.length - 1];
        
        if (filename) {
          // Remove extension and replace hyphens/underscores with spaces
          const nameWithoutExt = filename.split('.')[0];
          const cleanName = nameWithoutExt
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase()); // Capitalize first letter of each word
          
          setNameInput(cleanName);
        }
      } catch (error) {
        // Invalid URL, do nothing
      }
    }
  }, [urlInput, nameInput, setNameInput]);
  
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="url-upload" className="block text-sm font-medium text-gray-700 mb-1">
          Asset URL
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="url"
            id="url-upload"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://example.com/asset.jpg"
            required
            disabled={isLoading}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          <button
            type="button"
            onClick={handleVerifyUrl}
            disabled={isLoading || !urlInput || !urlInput.trim() || !urlInput.startsWith('http')}
            className="mt-1 px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 flex items-center whitespace-nowrap"
          >
            {isLoading ? (
              <>
                <ArrowPathIcon className="h-4 w-4 animate-spin mr-1"/>
                Checking
              </>
            ) : isVerifiedLocal ? (
              <>
                <CheckCircleIcon className="h-4 w-4 mr-1"/>
                Verified
              </>
            ) : (
              'Check'
            )}
          </button>
        </div>
        {isDetecting && (
          <p className="mt-1 text-sm text-gray-500">Detecting asset type...</p>
        )}
        {detectionError && (
          <p className="mt-1 text-sm text-red-500">{detectionError}</p>
        )}
        {isLoading && uploadProgress > 0 && uploadProgress < 50 && (
          <div className="mt-2">
            <div className="text-xs text-gray-500 mb-1">
              {uploadProgress < 30 ? 'Verifying URL...' : 'Checking for duplicates...'}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="bg-blue-600 h-1.5 rounded-full" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
      
      {/* Asset type selection (shown when type is unknown or detection failed) */}
      {(assetType === 'unknown' || detectionError) && urlInput && (
        <div>
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
      {assetType !== 'unknown' && !detectionError && urlInput && (
        <div className="flex items-center">
          <span className="text-sm text-gray-500 mr-2">Detected asset type:</span>
          <span className="text-sm font-medium capitalize">{assetType}</span>
        </div>
      )}
    </div>
  );
}
