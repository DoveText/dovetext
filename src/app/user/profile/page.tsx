'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function ProfilePage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      // Update profile logic would go here
      // For now, just simulate a successful update
      setTimeout(() => {
        setIsEditing(false);
        setIsSaving(false);
      }, 1000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setIsSaving(false);
    }
  };

  if (!user) {
    return null; // or redirect to login
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
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
                      src={user.photoURL || `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/default-avatar.png`}
                      alt="Profile"
                      width={64}
                      height={64}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.src = `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/default-avatar.png`;
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    className="bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Change
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
                    <input
                      type="text"
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
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
                      {user.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'N/A'}
                    </dd>
                  </div>
                  <div className="py-3 flex justify-between text-sm">
                    <dt className="text-gray-500">Last sign in</dt>
                    <dd className="text-gray-900">
                      {user.metadata?.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleDateString() : 'N/A'}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </ProtectedRoute>
  );
}
