'use client';

import React, { useState, useEffect } from 'react';
import { AssetType, verifyUrlAsset, detectAssetTypeFromContentType, AssetType as UtilAssetType } from '../../../utils/assetTypeDetection';
import { RadioGroup } from '@headlessui/react';
import { CheckCircleIcon, ArrowPathIcon } from '@heroicons/react/24/solid';

export interface URLAssetUploadProps {
  urlInput: string;
  setUrlInput: (url: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  uploadProgress: number;
  setUploadProgress: (progress: number) => void;
  errorMessage: string;
  setErrorMessage: (error: string) => void;
  assetType: AssetType | null;
  setAssetType: (type: AssetType | null) => void;
  onUrlVerified?: (data: {
    url: string;
    md5: string;
    uuid: string;
    size: number;
    contentType: string;
    isDuplicate: boolean;
    duplicateInfo?: any;
    filename?: string;
    assetType?: AssetType;
  }) => void;
}

export default function URLAssetUpload({
  urlInput,
  setUrlInput,
  isLoading,
  setIsLoading,
  uploadProgress,
  setUploadProgress,
  errorMessage,
  setErrorMessage, assetType, setAssetType, onUrlVerified,
}: URLAssetUploadProps) {
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionError, setDetectionError] = useState<string | null>(null);
  const [isVerifiedLocal, setIsVerifiedLocal] = useState(false);
  const [verificationSuccessMessage, setVerificationSuccessMessage] = useState<string | null>(null);

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

      setIsVerifiedLocal(true)

      // Notify parent component with verification data (similar to FileAssetUpload)
      if (onUrlVerified) {
        onUrlVerified({
          url: urlInput,
          md5: result.md5,
          uuid: result.uuid,
          size: result.size || 0,
          contentType: result.contentType || '',
          isDuplicate: result.isDuplicate,
          duplicateInfo: result.duplicateInfo,
          filename: result.filename,
        });
      }
    } catch (error: any) {
      console.error('Error verifying URL asset:', error);
      setDetectionError(error.message || 'Failed to verify URL. Please check the URL and try again.');
      setVerificationSuccessMessage(null);
      setIsVerifiedLocal(false);
    } finally {
      setIsLoading(false);
      setUploadProgress(0); // Reset progress
    }
  };
  
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
        {verificationSuccessMessage && (
          <div className="mt-2 text-sm text-green-700 p-3 bg-green-100 border border-green-300 rounded-md">
            {verificationSuccessMessage}
          </div>
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
      {detectionError && urlInput && (
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
      {!detectionError && urlInput && (
        <div className="flex items-center">
          <span className="text-sm text-gray-500 mr-2">Detected asset type:</span>
          <span className="text-sm font-medium capitalize">{assetType}</span>
        </div>
      )}
    </div>
  );
}
