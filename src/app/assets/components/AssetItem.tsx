'use client';

import React from 'react';
import Image from 'next/image';
import { 
  PhotoIcon, 
  DocumentTextIcon,
  VideoCameraIcon,
  MusicalNoteIcon,
  DocumentIcon
} from '@heroicons/react/24/outline';

import { AssetDto } from '@/app/api/assets';

export interface Asset {
  id: string;
  name: string;
  contentType: 'image' | 'document' | 'video' | 'audio'; // Renamed from 'type' to 'contentType'
  size: string;
  uploadedBy: string;
  uploadDate: string;
  lastUsed?: string;
  thumbnail?: string;
  url?: string;
  tags?: string[];
  description?: string;
  file?: File;  // For file uploads
  originalAsset?: AssetDto; // Original asset data from API
  sourceType?: 'file' | 'url'; // Source type (file or URL)
  metadata?: {
    externalUrl?: string; // For URL-based assets that don't upload the actual file
    assetType?: string;   // Type of asset detected or selected by user
    [key: string]: any;   // Allow for additional metadata properties
  };
}

// Helper function to get icon based on content type
export const getAssetIcon = (contentType: string) => {
  switch (contentType) {
    case 'image':
      return <PhotoIcon className="h-10 w-10 text-blue-500" />;
    case 'document':
      return <DocumentTextIcon className="h-10 w-10 text-green-500" />;
    case 'video':
      return <VideoCameraIcon className="h-10 w-10 text-red-500" />;
    case 'audio':
      return <MusicalNoteIcon className="h-10 w-10 text-purple-500" />;
    default:
      return <DocumentIcon className="h-10 w-10 text-gray-500" />;
  }
};

interface AssetItemProps {
  asset: Asset;
  compact?: boolean;
  onTagClick?: (tag: string) => void;
}

export default function AssetItem({ asset, compact = false, onTagClick }: AssetItemProps) {
  const { name, contentType, size, uploadedBy, uploadDate, thumbnail, tags, sourceType } = asset;
  
  return (
    <div className="flex flex-col">
      <div className="flex items-start">
        {/* Thumbnail or icon */}
        <div className="flex-shrink-0 mr-4">
          {thumbnail ? (
            <div className="relative h-12 w-12 rounded overflow-hidden border border-gray-200">
              <Image 
                src={thumbnail} 
                alt={name}
                fill
                sizes="48px"
                style={{ objectFit: 'cover' }}
                className="rounded"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-12 w-12 rounded bg-gray-100">
              {getAssetIcon(contentType)}
            </div>
          )}
        </div>
        
        {/* Asset details */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-medium text-gray-900 truncate">{name}</h4>
            <div className="flex space-x-2">
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 capitalize">
                {contentType}
              </span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-800">
                {sourceType === 'url' ? 'URL' : 'File'}
              </span>
            </div>
          </div>
          <div className="flex items-center text-xs text-gray-500 mt-1">
            <span>{size}</span>
            
            {!compact && (
              <>
                <span className="mx-1">•</span>
                <span>Uploaded by {uploadedBy}</span>
                <span className="mx-1">•</span>
                <span>on {uploadDate}</span>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Tags */}
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2 ml-16">
          {tags.map(tag => (
            <button
              key={tag}
              onClick={() => onTagClick && onTagClick(tag)}
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 hover:bg-blue-100 hover:text-blue-800 transition-colors cursor-pointer"
            >
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
