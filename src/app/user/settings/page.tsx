'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Switch } from '@headlessui/react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Link from 'next/link';
import { ArrowRightIcon, UserIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { useUserType } from '@/context/UserTypeContext';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

interface NotificationSetting {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

interface SecuritySetting {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { userType } = useUserType();
  const [isSaving, setIsSaving] = useState(false);

  const [notificationSettings, setNotificationSettings] = useState<NotificationSetting[]>([
    {
      id: 'email-notifications',
      name: 'Email Notifications',
      description: 'Receive email notifications for important updates',
      enabled: true,
    },
    {
      id: 'browser-notifications',
      name: 'Browser Notifications',
      description: 'Receive browser notifications when in the app',
      enabled: false,
    },
    {
      id: 'digest',
      name: 'Daily Digest',
      description: 'Receive a daily summary of your notifications',
      enabled: true,
    },
  ]);

  const [securitySettings, setSecuritySettings] = useState<SecuritySetting[]>([
    {
      id: '2fa',
      name: 'Two-Factor Authentication',
      description: 'Add an extra layer of security to your account',
      enabled: false,
    },
    {
      id: 'login-alerts',
      name: 'Login Alerts',
      description: 'Get notified of new sign-ins to your account',
      enabled: true,
    },
  ]);

  const handleNotificationToggle = (settingId: string) => {
    setNotificationSettings(settings =>
      settings.map(setting =>
        setting.id === settingId
          ? { ...setting, enabled: !setting.enabled }
          : setting
      )
    );
  };

  const handleSecurityToggle = (settingId: string) => {
    setSecuritySettings(settings =>
      settings.map(setting =>
        setting.id === settingId
          ? { ...setting, enabled: !setting.enabled }
          : setting
      )
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // TODO: Save settings
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const isAdmin = user?.settings?.role === 'admin';

  if (!user) {
    return null; // or redirect to login
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Notification Settings */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Notification Settings
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Manage how you receive notifications
              </p>
            </div>
            <div className="border-t border-gray-200">
              <ul role="list" className="divide-y divide-gray-200">
                {notificationSettings.map((setting) => (
                  <li key={setting.id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <p className="text-sm font-medium text-gray-900">{setting.name}</p>
                        <p className="text-sm text-gray-500">{setting.description}</p>
                      </div>
                      <Switch
                        checked={setting.enabled}
                        onChange={() => handleNotificationToggle(setting.id)}
                        className={classNames(
                          setting.enabled ? 'bg-blue-600' : 'bg-gray-200',
                          'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                        )}
                      >
                        <span
                          className={classNames(
                            setting.enabled ? 'translate-x-5' : 'translate-x-0',
                            'pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
                          )}
                        />
                      </Switch>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* User Type Information */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                User Type
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Your current account type
              </p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              <div className="flex items-center p-4 border rounded-lg bg-gray-50">
                <div className="flex-shrink-0 mr-4">
                  <div className={`p-2 rounded-full ${userType === 'personal' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                    {userType === 'personal' ? (
                      <UserIcon className="h-6 w-6" />
                    ) : (
                      <BuildingOfficeIcon className="h-6 w-6" />
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900">
                    {userType === 'personal' ? 'Personal Account' : 'Business Account'}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {userType === 'personal' 
                      ? 'Your account is set up for personal content and scheduling needs.' 
                      : 'Your account is set up for business content and asset management.'}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Contact an administrator if you need to change your account type.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Security Settings */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Security Settings
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Manage your account security preferences
              </p>
            </div>
            <div className="border-t border-gray-200">
              <ul role="list" className="divide-y divide-gray-200">
                {securitySettings.map((setting) => (
                  <li key={setting.id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <p className="text-sm font-medium text-gray-900">{setting.name}</p>
                        <p className="text-sm text-gray-500">{setting.description}</p>
                      </div>
                      <Switch
                        checked={setting.enabled}
                        onChange={() => handleSecurityToggle(setting.id)}
                        className={classNames(
                          setting.enabled ? 'bg-blue-600' : 'bg-gray-200',
                          'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                        )}
                      >
                        <span
                          className={classNames(
                            setting.enabled ? 'translate-x-5' : 'translate-x-0',
                            'pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
                          )}
                        />
                      </Switch>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Admin Tools Link - Only visible to admin users */}
          {isAdmin && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  Administrator Access
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  You have administrator privileges
                </p>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                <Link 
                  href="/admin-tools"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Access Admin Tools
                  <ArrowRightIcon className="ml-2 -mr-1 h-4 w-4" aria-hidden="true" />
                </Link>
                <p className="mt-3 text-xs text-gray-500">
                  The admin tools dashboard provides access to system settings, user management, and other administrative functions.
                </p>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
