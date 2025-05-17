'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { toast } from 'react-hot-toast';
import { centerCrop, makeAspectCrop, Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import {
  ProfileSection,
  PersonalInfoSection,
  PasswordSection,
  TimezoneSection,
  ImageCropModal
} from './components';

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
  
  const { user, refreshUser } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  
  // Basic profile state
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isSaving, setIsSaving] = useState(false);
  
  // Avatar state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.photoURL || null);
  const [isUploading, setIsUploading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  
  // Timezone state
  const [timezone, setTimezone] = useState<string>('');
  const [isSavingTimezone, setIsSavingTimezone] = useState(false);
  
  // Password change state
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});
  
  // Image cropping state
  const [showCropModal, setShowCropModal] = useState(false);
  const [imgSrc, setImgSrc] = useState('');
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const aspect = 1; // Square crop for profile picture
  
  // Password validation functions
  const validatePasswordStrength = (password: string): boolean => {
    // Password must be at least 8 characters long
    if (password.length < 8) {
      setPasswordErrors(prev => ({ ...prev, newPassword: 'Password must be at least 8 characters long' }));
      return false;
    }
    
    // Password must contain at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      setPasswordErrors(prev => ({ ...prev, newPassword: 'Password must contain at least one uppercase letter' }));
      return false;
    }
    
    // Password must contain at least one lowercase letter
    if (!/[a-z]/.test(password)) {
      setPasswordErrors(prev => ({ ...prev, newPassword: 'Password must contain at least one lowercase letter' }));
      return false;
    }
    
    // Password must contain at least one number
    if (!/\d/.test(password)) {
      setPasswordErrors(prev => ({ ...prev, newPassword: 'Password must contain at least one number' }));
      return false;
    }
    
    // Password must contain at least one special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      setPasswordErrors(prev => ({ ...prev, newPassword: 'Password must contain at least one special character' }));
      return false;
    }
    
    return true;
  };
  
  const validatePasswordMatch = (): boolean => {
    if (newPassword !== confirmPassword) {
      setPasswordErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      return false;
    }
    return true;
  };
  
  const validateNewPasswordDifferent = (): boolean => {
    if (currentPassword === newPassword) {
      setPasswordErrors(prev => ({ ...prev, newPassword: 'New password must be different from current password' }));
      return false;
    }
    return true;
  };
  
  // Handle password change
  const handleChangePassword = async () => {
    // Reset previous errors
    setPasswordErrors({});
    
    // Validate all fields are filled
    if (!currentPassword) {
      setPasswordErrors(prev => ({ ...prev, currentPassword: 'Current password is required' }));
      return;
    }
    
    if (!newPassword) {
      setPasswordErrors(prev => ({ ...prev, newPassword: 'New password is required' }));
      return;
    }
    
    if (!confirmPassword) {
      setPasswordErrors(prev => ({ ...prev, confirmPassword: 'Please confirm your new password' }));
      return;
    }
    
    // Validate password strength, match, and difference
    const isStrong = validatePasswordStrength(newPassword);
    const isMatching = validatePasswordMatch();
    const isDifferent = validateNewPasswordDifferent();
    
    if (!isStrong || !isMatching || !isDifferent) {
      return;
    }
    
    setIsChangingPassword(true);
    
    try {
      const token = await user?.getIdToken();
      
      // Call the API to change the password
      const response = await fetch('/api/v1/profile/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });
      
      if (response.ok) {
        toast.success('Password changed successfully');
        // Reset form
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowPasswordSection(false);
      } else {
        const errorData = await response.json();
        
        // Handle specific error cases
        if (errorData.code === 'auth/wrong-password') {
          setPasswordErrors(prev => ({ ...prev, currentPassword: 'Current password is incorrect' }));
        } else {
          toast.error(errorData.message || 'Failed to change password');
        }
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('An error occurred while changing your password');
    } finally {
      setIsChangingPassword(false);
    }
  };

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
          
          // Fetch user settings to get timezone
          const settingsResponse = await fetch('/api/v1/profile/settings', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (settingsResponse.ok) {
            const settings = await settingsResponse.json();
            // Set timezone from settings or use browser timezone as fallback
            if (settings && settings.timezone) {
              setTimezone(settings.timezone);
            } else {
              // Use browser timezone as default
              const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
              setTimezone(browserTimezone);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
      }
    };
    
    if (user) {
      fetchProfileData();
    }
  }, [user]);
  
  // Save timezone setting
  const handleSaveTimezone = async (newTimezone: string) => {
    if (!user || isSavingTimezone) return;
    
    setIsSavingTimezone(true);
    try {
      const token = await user.getIdToken();
      
      // Get current settings first
      const settingsResponse = await fetch('/api/v1/profile/settings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      let currentSettings = {};
      if (settingsResponse.ok) {
        currentSettings = await settingsResponse.json() || {};
      }
      
      // Update settings with new timezone
      const updatedSettings = {
        ...currentSettings,
        timezone: newTimezone
      };
      
      // Save updated settings
      const response = await fetch('/api/v1/profile/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedSettings)
      });
      
      if (response.ok) {
        setTimezone(newTimezone);
        toast.success('Timezone updated successfully');
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to update timezone');
      }
    } catch (error) {
      console.error('Error updating timezone:', error);
      toast.error('An error occurred while updating your timezone');
    } finally {
      setIsSavingTimezone(false);
    }
  };

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
          
          // Refresh user data in AuthContext to update the navigation bar
          await refreshUser();
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
    setAvatarLoading(true); // Set avatar as loading before starting the upload
    
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
          
          // Refresh user data in AuthContext to update the navigation bar
          await refreshUser();
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
      // Add a small delay before setting avatar loading to false to ensure the new image is loaded
      setTimeout(() => {
        setAvatarLoading(false);
      }, 500);
    }
  };

  if (!user) {
    return null; // or redirect to login
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
            <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
          </div>
          
          {/* Personal Information Section */}
          <ProfileSection title="Personal Information" description="Your basic profile information">
            <PersonalInfoSection 
              user={user}
              profileData={profileData}
              displayName={displayName}
              setDisplayName={setDisplayName}
              isEditing={isEditing}
              setIsEditing={setIsEditing}
              isSaving={isSaving}
              avatarLoading={avatarLoading}
              avatarUrl={avatarUrl}
              isUploading={isUploading}
              fileInputRef={fileInputRef}
              handlePhotoClick={handlePhotoClick}
              handlePhotoChange={handlePhotoChange}
              handleSave={handleSave}
              handleCancel={handleCancel}
              handleKeyDown={handleKeyDown}
            />
          </ProfileSection>
          
          {/* Password Section */}
          <ProfileSection title="Password" description="Update your password">
            <PasswordSection 
              showPasswordSection={showPasswordSection}
              setShowPasswordSection={setShowPasswordSection}
              currentPassword={currentPassword}
              setCurrentPassword={setCurrentPassword}
              newPassword={newPassword}
              setNewPassword={setNewPassword}
              confirmPassword={confirmPassword}
              setConfirmPassword={setConfirmPassword}
              passwordErrors={passwordErrors}
              setPasswordErrors={setPasswordErrors}
              isChangingPassword={isChangingPassword}
              handleChangePassword={handleChangePassword}
            />
          </ProfileSection>
          
          {/* Timezone Section */}
          <ProfileSection title="Timezone" description="Set your preferred timezone">
            <TimezoneSection 
              timezone={timezone}
              isSavingTimezone={isSavingTimezone}
              handleSaveTimezone={handleSaveTimezone}
            />
          </ProfileSection>
          
          {/* Account Information has been merged into Personal Information section */}
          
          {/* Image Crop Modal */}
          <ImageCropModal 
            showCropModal={showCropModal}
            imgSrc={imgSrc}
            imgRef={imgRef}
            crop={crop || { unit: '%', width: 90, height: 90, x: 5, y: 5 }}
            setCrop={setCrop}
            completedCrop={completedCrop || null}
            setCompletedCrop={setCompletedCrop}
            aspect={aspect}
            onImageLoad={onImageLoad}
            handleCropCancel={handleCropCancel}
            handleCropComplete={handleCropComplete}
          />
        </div>
      </div>
    </ProtectedRoute>
  );
}
