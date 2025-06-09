'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  TagIcon,
  LinkIcon,
  TrashIcon,
  PencilIcon,
  XMarkIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { Asset, getAssetIcon } from './AssetItem';
import { createAuthenticatedBlobUrl, revokeBlobUrls } from '@/app/api/proxy';

interface AssetDetailsProps {
  asset: Asset | null;
  isEditing: boolean;
  onStartEditing: () => void;
  onSaveEdits: (updatedAsset: Asset) => void;
  onCancelEditing: () => void;
  onDeleteAsset: (assetId: string) => void;
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
}

export default function AssetDetails({
  asset,
  isEditing,
  onStartEditing,
  onSaveEdits,
  onCancelEditing,
  onDeleteAsset,
  onAddTag,
  onRemoveTag
}: AssetDetailsProps) {
  const [newTag, setNewTag] = useState('');
  const [imageBlobUrl, setImageBlobUrl] = useState<string | null>(null);
  
  // No longer need to initialize edited asset as we're using a dialog
  
  // Load authenticated image when asset changes
  useEffect(() => {
    let isMounted = true;
    
    const loadImage = async () => {
      if (asset && asset.contentType === 'image') {
        try {
          // For URL-type assets, use the URL directly from meta.url
          if (asset.sourceType === 'url' && asset.originalAsset?.meta?.url) {
            if (isMounted) {
              setImageBlobUrl(asset.originalAsset.meta.url);
            }
          } else {
            // For file-type assets, use the authenticated blob URL
            const blobUrl = await createAuthenticatedBlobUrl(asset.id);
            if (isMounted) {
              setImageBlobUrl(blobUrl);
            }
          }
        } catch (error) {
          console.error('Error loading image:', error);
        }
      } else {
        setImageBlobUrl(null);
      }
    };
    
    loadImage();
    
    // Only set isMounted to false, don't revoke URLs here
    // This prevents the URL from being revoked while still in the cache
    return () => {
      isMounted = false;
    };
  }, [asset]);  
  
  // Cleanup all blob URLs when component unmounts
  useEffect(() => {
    return () => {
      revokeBlobUrls();
    };
  }, []);
  
  // No longer need handleInputChange or handleSave as we're using a dialog
  
  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTag.trim()) {
      onAddTag(newTag.trim());
      setNewTag('');
    }
  };
  
  if (!asset) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 p-8 rounded-lg">
        <p className="text-gray-500 text-center">Select an asset to view details</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow p-6 h-full flex flex-col">
      {/* Header with actions */}
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-medium text-gray-900">Asset Details</h3>
        <div className="flex space-x-2">
          <>
            <button
              onClick={onStartEditing}
              className="inline-flex items-center p-1 border border-transparent rounded-full text-blue-600 hover:bg-blue-50 focus:outline-none"
              aria-label="Edit asset"
            >
              <PencilIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => onDeleteAsset(asset.id)}
              className="inline-flex items-center p-1 border border-transparent rounded-full text-red-600 hover:bg-red-50 focus:outline-none"
              aria-label="Delete asset"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </>
        </div>
      </div>
      
      {/* Asset preview */}
      <div className="mb-6 flex justify-center">
        {asset.contentType === 'image' && imageBlobUrl ? (
          <div className="relative h-48 w-full max-w-md">
            <Image
              src={imageBlobUrl}
              alt={asset.name}
              fill
              sizes="(max-width: 768px) 100vw, 400px"
              style={{ objectFit: 'contain' }}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-48 w-full bg-gray-100 rounded">
            {getAssetIcon(asset.contentType)}
          </div>
        )}
      </div>
      
      {/* Asset details */}
      <div className="space-y-4 flex-1 overflow-y-auto">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <p className="text-gray-900">{asset.name}</p>
        </div>
        
        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <p className="text-gray-600">{asset.description || 'No description provided'}</p>
        </div>
        
        {/* Metadata */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <p className="text-sm text-gray-900 capitalize">{asset.contentType}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
            <p className="text-sm text-gray-900">{asset.size}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Uploaded By</label>
            <p className="text-sm text-gray-900">{asset.uploadedBy}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Upload Date</label>
            <p className="text-sm text-gray-900">{asset.uploadDate}</p>
          </div>
          {asset.lastUsed && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Used</label>
              <p className="text-sm text-gray-900">{asset.lastUsed}</p>
            </div>
          )}
        </div>
        
        {/* URL */}
        {(asset.url || (asset.sourceType === 'url' && asset.originalAsset?.meta?.url)) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
            <div className="flex items-center">
              <LinkIcon className="h-4 w-4 text-gray-400 mr-1" />
              <a 
                href={asset.sourceType === 'url' && asset.originalAsset?.meta?.url ? asset.originalAsset.meta.url : asset.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 truncate"
              >
                {asset.sourceType === 'url' && asset.originalAsset?.meta?.url ? asset.originalAsset.meta.url : asset.url}
              </a>
            </div>
          </div>
        )}
        
        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
            <TagIcon className="h-4 w-4 text-gray-400 mr-1" />
            Tags
          </label>
          
          <div className="flex flex-wrap gap-2 mb-2">
            {asset.tags && asset.tags.length > 0 ? (
              asset.tags.map((tag) => (
                <span 
                  key={tag} 
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => onRemoveTag(tag)}
                    className="ml-1 inline-flex items-center justify-center h-4 w-4 rounded-full text-blue-400 hover:text-blue-600 focus:outline-none"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              ))
            ) : (
              <span className="text-sm text-gray-500">No tags</span>
            )}
          </div>
          
          <form onSubmit={handleAddTag} className="flex mt-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add a tag"
              className="block w-full px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
            <button
              type="submit"
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-r-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
