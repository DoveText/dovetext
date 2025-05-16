'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { toast } from 'react-hot-toast';
import ReactCrop, { centerCrop, makeAspectCrop, Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { apiConfig } from '@/config/api';

// This function centers and creates an aspect crop
function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );
}

export default function ProfilePage() {
  // Maximum file size in bytes (2MB)
  const MAX_FILE_SIZE = 2 * 1024 * 1024;
  
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // We'll use the apiConfig.getPublicAssetsUrl utility function instead of a local one
  
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.photoURL || null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Image cropping state
  const [showCropModal, setShowCropModal] = useState(false);
  const [imgSrc, setImgSrc] = useState('');
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const aspect = 1; // Square crop for profile picture

  // Fetch profile data on component mount
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const token = await user?.getIdToken();
        const response = await fetch('/api/v1/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setProfileData(data);
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
      }
    };
    
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  const handleCancel = () => {
    // Reset to original display name and exit edit mode
    setDisplayName(user?.displayName || '');
    setIsEditing(false);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      handleCancel();
    } else if (e.key === 'Enter') {
      handleSave();
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/v1/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          displayName: displayName
        })
      });
      
      if (response.ok) {
        toast.success('Profile updated successfully');
        // Update the user object without page reload
        if (user) {
          // Update the local user object
          user.displayName = displayName;
          // Also update the profile data
          if (profileData) {
            setProfileData({
              ...profileData,
              displayName: displayName
            });
          }
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('An error occurred while updating your profile');
    } finally {
      setIsEditing(false);
      setIsSaving(false);
    }
  };
  
  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };
  
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`File size exceeds the maximum allowed size of 2MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`);
        return;
      }
      
      setSelectedFile(file);
      setShowCropModal(true);
      
      const reader = new FileReader();
      reader.onload = () => {
        setImgSrc(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, aspect));
  }, [aspect]);
  
  const handleCropCancel = () => {
    setShowCropModal(false);
    setImgSrc('');
    setSelectedFile(null);
  };
  
  const handleCropComplete = async () => {
    if (!completedCrop || !imgRef.current || !selectedFile || !user) {
      return;
    }
    
    setShowCropModal(false);
    setIsUploading(true);
    
    try {
      // Create a canvas to draw the cropped image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('No 2d context');
      }
      
      // Set canvas dimensions to the cropped size
      const pixelRatio = window.devicePixelRatio;
      canvas.width = completedCrop.width * pixelRatio;
      canvas.height = completedCrop.height * pixelRatio;
      
      // Scale the context to account for device pixel ratio
      ctx.scale(pixelRatio, pixelRatio);
      ctx.imageSmoothingQuality = 'high';
      
      // Draw the cropped image
      const image = imgRef.current;
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      
      ctx.drawImage(
        image,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0,
        0,
        completedCrop.width,
        completedCrop.height,
      );
      
      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => {
          if (b) resolve(b);
        }, selectedFile.type);
      });
      
      // Create a new file from the blob
      const croppedFile = new File([blob], selectedFile.name, {
        type: selectedFile.type,
        lastModified: Date.now(),
      });
      
      // Upload the cropped file
      const formData = new FormData();
      formData.append('avatar', croppedFile);
      
      const token = await user.getIdToken();
      const response = await fetch('/api/v1/profile/avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        // Use the avatar URL directly from the response
        setAvatarUrl(data.avatarUrl);
        toast.success('Profile photo updated');
        
        // Update user object without page reload
        if (user && data.avatarUrl) {
          // Update the local user photoURL
          user.photoURL = data.avatarUrl;
          
          // Also update the profile data
          if (profileData) {
            setProfileData({
              ...profileData,
              avatarUrl: data.avatarUrl
            });
          }
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to update profile photo');
      }
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      toast.error('An error occurred while uploading your photo');
    } finally {
      setIsUploading(false);
      setImgSrc('');
      setSelectedFile(null);
    }
  };

  if (!user) {
    return null; // or redirect to login
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Image Crop Modal */}
        {showCropModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Crop Your Profile Picture</h3>
              <div className="mb-4">
                {imgSrc && (
                  <ReactCrop
                    crop={crop}
                    onChange={(_, percentCrop) => setCrop(percentCrop)}
                    onComplete={(c) => setCompletedCrop(c)}
                    aspect={aspect}
                    circularCrop
                  >
                    <img
                      ref={imgRef}
                      alt="Crop me"
                      src={imgSrc}
                      onLoad={onImageLoad}
                      className="max-h-[400px] max-w-full"
                    />
                  </ReactCrop>
                )}
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCropCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCropComplete}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700"
                  disabled={!completedCrop}
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Main Content */}
        <div className="py-8">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white shadow rounded-lg">
              {/* Header */}
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Profile</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Manage your profile information
                </p>
              </div>
              
              {/* Profile Content */}
              <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                <div className="space-y-6">
              {/* Profile Picture */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Photo</label>
                <div className="mt-2 flex items-center space-x-5">
                  <div className="h-16 w-16 rounded-full overflow-hidden bg-gray-100">
                    <Image
                      src={apiConfig.getPublicAssetsUrl(avatarUrl || user.photoURL) || `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/default-avatar.png`}
                      alt="Profile"
                      width={64}
                      height={64}
                      priority
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.src = `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/default-avatar.png`;
                      }}
                    />
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
                    className="bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? 'Uploading...' : 'Change'}
                  </button>
                </div>
              </div>

              {/* Display Name */}
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                  Display Name
                </label>
                <div className="mt-2 flex items-center">
                  {isEditing ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        id="displayName"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md px-3 py-2"
                        placeholder="Enter your display name"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <span className="text-gray-900">{user.displayName || 'No display name set'}</span>
                  )}
                  <button
                    type="button"
                    onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                    disabled={isSaving}
                    className="ml-3 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {isEditing ? (isSaving ? 'Saving...' : 'Save') : 'Edit'}
                  </button>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="mt-2 flex items-center">
                  <span className="text-gray-900">{user.email}</span>
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Verified
                  </span>
                </div>
              </div>

              {/* Account Info */}
              <div>
                <h4 className="text-sm font-medium text-gray-700">Account Information</h4>
                <dl className="mt-2 divide-y divide-gray-200">
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
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
