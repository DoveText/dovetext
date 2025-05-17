'use client';

import { useState } from 'react';
import Image from 'next/image';
import { apiConfig } from '@/config/api';
import FormInput from '@/components/common/form/FormInput';
import FormField from '@/components/common/form/FormField';

interface PersonalInfoSectionProps {
  user: any;
  profileData: any;
  displayName: string;
  setDisplayName: (name: string) => void;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  isSaving: boolean;
  avatarLoading: boolean;
  avatarUrl: string | null;
  isUploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handlePhotoClick: () => void;
  handlePhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSave: () => void;
  handleCancel: () => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export default function PersonalInfoSection({
  user,
  profileData,
  displayName,
  setDisplayName,
  isEditing,
  setIsEditing,
  isSaving,
  avatarLoading,
  avatarUrl,
  isUploading,
  fileInputRef,
  handlePhotoClick,
  handlePhotoChange,
  handleSave,
  handleCancel,
  handleKeyDown
}: PersonalInfoSectionProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-8">
      {/* Avatar Section */}
      <div className="flex-shrink-0">
        <div className="relative">
          <div className="h-32 w-32 rounded-full overflow-hidden bg-gray-100 relative">
            {avatarLoading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <Image
                src={apiConfig.getPublicAssetsUrl(avatarUrl || user.photoURL) || `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/default-avatar.png`}
                alt="Profile"
                width={128}
                height={128}
                priority
                className="h-full w-full object-cover"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.src = `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/default-avatar.png`;
                }}
              />
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={handlePhotoChange}
          />
          <button
            type="button"
            onClick={handlePhotoClick}
            disabled={isUploading}
            className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
        {isUploading && (
          <p className="text-sm text-blue-600 mt-2 text-center">Uploading...</p>
        )}
      </div>
      
      {/* Display Name Section */}
      <div className="flex-grow">
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium text-gray-700">Display Name</label>
            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Edit
              </button>
            )}
          </div>
          
          {isEditing ? (
            <div>
              <div className="flex items-center">
                <FormInput
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Your display name"
                  autoFocus
                />
              </div>
              <div className="mt-2 flex space-x-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-lg font-medium">{displayName || user?.displayName || 'Not set'}</p>
          )}
        </div>
        
        <div>
          <p className="text-sm text-gray-500 mb-1">Email Address</p>
          <p className="text-base">{user?.email || 'Not available'}</p>
        </div>
        
        {/* Account Information */}
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Account Information</h4>
          <dl className="divide-y divide-gray-200">
            <div className="py-3 flex justify-between text-sm">
              <dt className="text-gray-500">Member since</dt>
              <dd className="text-gray-900">
                {profileData?.createdAt ? new Date(profileData.createdAt).toLocaleString() : 'N/A'}
              </dd>
            </div>
            <div className="py-3 flex justify-between text-sm">
              <dt className="text-gray-500">Last sign in</dt>
              <dd className="text-gray-900">
                {profileData?.lastLoginAt ? new Date(profileData.lastLoginAt).toLocaleString() : 'N/A'}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
