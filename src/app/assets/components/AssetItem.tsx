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
  type: 'image' | 'document' | 'video' | 'audio';
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
}

// Helper function to get icon based on asset type
export const getAssetIcon = (type: string) => {
  switch (type) {
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
}

export default function AssetItem({ asset, compact = false }: AssetItemProps) {
  const { name, type, size, uploadedBy, uploadDate, thumbnail } = asset;
  
  return (
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
            {getAssetIcon(type)}
          </div>
        )}
      </div>
      
      {/* Asset details */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-gray-900 truncate">{name}</h4>
        <div className="flex items-center text-xs text-gray-500 mt-1">
          <span className="capitalize">{type}</span>
          <span className="mx-1">•</span>
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
  );
}
