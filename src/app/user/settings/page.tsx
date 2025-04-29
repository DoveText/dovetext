'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Switch } from '@headlessui/react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Link from 'next/link';

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

interface AdminTool {
  id: string;
  name: string;
  description: string;
  path: string;
}

export default function SettingsPage() {
  const { user } = useAuth();
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

  // Admin tools available to users with admin role
  const adminTools: AdminTool[] = [
    {
      id: 'prompts-manager',
      name: 'LLM Prompts Manager',
      description: 'Create, edit, and delete LLM prompts used throughout the system',
      path: '/admin-tools/prompts',
    },
    {
      id: 'settings-manager',
      name: 'Settings Manager',
      description: 'Manage application settings and configurations',
      path: '/admin-tools/settings',
    },
    {
      id: 'notification-test',
      name: 'Notification Test Tools',
      description: 'Test notification delivery methods including email and Slack',
      path: '/admin-tools/test/notification',
    },
    // Add more admin tools here as needed
  ];

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
      // TODO: Implement settings save
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

          {/* Admin Tools Section - Only visible to admin users */}
          {isAdmin && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  Admin Tools
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Access administrator tools and settings
                </p>
              </div>
              <div className="border-t border-gray-200">
                <ul role="list" className="divide-y divide-gray-200">
                  {adminTools.map((tool) => (
                    <li key={tool.id} className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <p className="text-sm font-medium text-gray-900">{tool.name}</p>
                          <p className="text-sm text-gray-500">{tool.description}</p>
                        </div>
                        <Link 
                          href={tool.path}
                          className="px-4 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition-colors"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Access
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
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
