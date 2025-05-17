'use client';

import { useEffect } from 'react';
import FormInput from '@/components/common/form/FormInput';
import FormField from '@/components/common/form/FormField';
import PasswordRequirements from './PasswordRequirements';

interface PasswordErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

interface PasswordSectionProps {
  showPasswordSection: boolean;
  setShowPasswordSection: (show: boolean) => void;
  currentPassword: string;
  setCurrentPassword: (password: string) => void;
  newPassword: string;
  setNewPassword: (password: string) => void;
  confirmPassword: string;
  setConfirmPassword: (password: string) => void;
  passwordErrors: PasswordErrors;
  setPasswordErrors: React.Dispatch<React.SetStateAction<PasswordErrors>>;
  isChangingPassword: boolean;
  handleChangePassword: () => void;
}

export default function PasswordSection({
  showPasswordSection,
  setShowPasswordSection,
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  passwordErrors,
  setPasswordErrors,
  isChangingPassword,
  handleChangePassword
}: PasswordSectionProps) {
  // Use useEffect to validate password in real-time
  useEffect(() => {
    if (newPassword) {
      // Check if passwords match in real-time
      if (confirmPassword && confirmPassword !== newPassword) {
        setPasswordErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      } else if (confirmPassword && confirmPassword === newPassword) {
        setPasswordErrors(prev => ({ ...prev, confirmPassword: undefined }));
      }
      
      // Check if new password is different from current password
      if (currentPassword && currentPassword === newPassword) {
        setPasswordErrors(prev => ({ ...prev, newPassword: 'New password must be different from current password' }));
      }
    }
  }, [newPassword, confirmPassword, currentPassword, setPasswordErrors]);
  
  return (
    <>
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-500">
            {showPasswordSection ? 
              'Enter your current password and choose a new one' : 
              'Change your password to keep your account secure'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowPasswordSection(!showPasswordSection)}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          {showPasswordSection ? 'Cancel' : 'Change Password'}
        </button>
      </div>
      
      {showPasswordSection && (
        <div className="mt-4 space-y-4">
          {/* Current Password Field */}
          <FormField
            label="Current Password"
            htmlFor="current-password"
            error={passwordErrors.currentPassword}
          >
            <FormInput
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                // Clear errors when typing
                if (passwordErrors.currentPassword) {
                  setPasswordErrors(prev => ({ ...prev, currentPassword: undefined }));
                }
              }}
              placeholder="Enter your current password"
              disabled={isChangingPassword}
              required
            />
          </FormField>
          
          {/* New Password Field */}
          <FormField
            label="New Password"
            htmlFor="new-password"
            error={passwordErrors.newPassword}
          >
            <FormInput
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                // Clear errors when typing
                if (passwordErrors.newPassword) {
                  setPasswordErrors(prev => ({ ...prev, newPassword: undefined }));
                }
                // Also clear confirm password error if it matches now
                if (passwordErrors.confirmPassword && e.target.value === confirmPassword) {
                  setPasswordErrors(prev => ({ ...prev, confirmPassword: undefined }));
                }
              }}
              placeholder="Enter your new password"
              disabled={isChangingPassword}
              required
            />
          </FormField>
          
          {/* Confirm Password Field */}
          <FormField
            label="Confirm New Password"
            htmlFor="confirm-password"
            error={passwordErrors.confirmPassword}
          >
            <FormInput
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                // Clear errors when typing
                if (passwordErrors.confirmPassword) {
                  setPasswordErrors(prev => ({ ...prev, confirmPassword: undefined }));
                }
                // Check if passwords match in real-time
                if (e.target.value !== newPassword && e.target.value !== '') {
                  setPasswordErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
                }
              }}
              placeholder="Confirm your new password"
              disabled={isChangingPassword}
              required
            />
          </FormField>
          
          {/* Password Requirements */}
          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Password Requirements</h4>
            <PasswordRequirements 
              password={newPassword} 
              currentPassword={currentPassword}
              confirmPassword={confirmPassword}
            />
          </div>
          
          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleChangePassword}
              disabled={isChangingPassword}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isChangingPassword ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Changing Password...
                </>
              ) : (
                'Change Password'
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
