'use client';

import { useEffect, useState, useRef } from 'react';
import { useSettingsService, FunctionRegistry, SettingItem, SettingsByCategory } from '@/app/admin-tools/api/settings';
import Link from 'next/link';
import { ChevronRightIcon, HomeIcon, PencilIcon, ArrowPathIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export default function SettingsAdminPage() {
  const settingsService = useSettingsService();
  const [functions, setFunctions] = useState<FunctionRegistry[]>([]);
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null);
  const [settings, setSettings] = useState<SettingsByCategory>({});
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [previousTabState, setPreviousTabState] = useState<{functionId: string | null, tabName: string | null}>({
    functionId: null,
    tabName: null
  });
  const inputRef = useRef<HTMLInputElement>(null);

  // Load functions on initial render
  useEffect(() => {
    fetchFunctions();
  }, []);

  // Load settings when function is selected
  useEffect(() => {
    if (selectedFunction) {
      fetchSettings(selectedFunction);
    }
  }, [selectedFunction]);

  // Set the first category as active tab when settings change
  // Only set the active tab if we're loading a new function
  useEffect(() => {
    const categories = Object.keys(settings);
    if (categories.length > 0) {
      // If we're returning to the same function, try to restore the previous tab
      if (selectedFunction === previousTabState.functionId && previousTabState.tabName && categories.includes(previousTabState.tabName)) {
        setActiveTab(previousTabState.tabName);
      } else {
        // Otherwise, select the first tab
        setActiveTab(categories[0]);
      }
    } else {
      setActiveTab(null);
    }
  }, [settings, selectedFunction, previousTabState]);

  // Focus the input when editing starts
  useEffect(() => {
    if (editingKey && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingKey]);

  // Helper function to determine if a setting is a secure item (password, token, etc.)
  const isSecureItem = (setting: SettingItem): boolean => {
    if (!setting) return false;
    // Use the sensitive flag from the server response
    return !!setting.sensitive;
  };

  // Helper function to mask secure values
  const maskSecureValue = (value: string): string => {
    if (!value) return '';
    return '•'.repeat(Math.min(value.length, 8));
  };

  // Helper function to check if a setting has boolean values only
  const isBooleanSetting = (setting: SettingItem): boolean => {
    return setting.allowedValues?.length === 2 && 
           setting.allowedValues.includes('true') && 
           setting.allowedValues.includes('false');
  };

  // Helper function to convert string "true"/"false" to boolean
  const stringToBoolean = (value: string): boolean => {
    return value.toLowerCase() === 'true';
  };

  const fetchFunctions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await settingsService.getFunctions();
      setFunctions(data);
      if (data.length > 0) {
        setSelectedFunction(data[0].id);
      }
    } catch (err) {
      setError('Failed to load functions. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async (functionId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await settingsService.getSettingsByCategory(functionId);
      setSettings(data);
    } catch (err) {
      setError('Failed to load settings. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFunctionChange = (functionId: string) => {
    // Save current tab state before changing function
    if (selectedFunction && activeTab) {
      setPreviousTabState({
        functionId: selectedFunction,
        tabName: activeTab
      });
    }
    setSelectedFunction(functionId);
    setEditingKey(null);
  };

  const handleTabChange = (tabName: string) => {
    setActiveTab(tabName);
    // Update the previous tab state
    setPreviousTabState({
      functionId: selectedFunction,
      tabName: tabName
    });
  };

  const handleEdit = (setting: SettingItem) => {
    setEditingKey(setting.key);
    setEditValue(setting.value);
  };

  const handleCancelEdit = () => {
    setEditingKey(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, setting: SettingItem) => {
    if (e.key === 'Enter') {
      handleSave(setting);
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  // Optimistically update the UI without showing loading state
  const handleSave = async (setting: SettingItem) => {
    if (!selectedFunction || !activeTab) return;

    try {
      setIsSaving(true);
      setError(null);
      
      // Save the current tab and function info
      const currentTab = activeTab;
      const currentFunction = selectedFunction;
      
      // Optimistically update the UI
      const updatedSettings = { ...settings };
      if (updatedSettings[activeTab]) {
        updatedSettings[activeTab] = updatedSettings[activeTab].map(s => 
          s.key === setting.key 
            ? { ...s, value: editValue } 
            : s
        );
        setSettings(updatedSettings);
      }
      
      // Clear editing state immediately for better UX
      setEditingKey(null);
      
      // Preserve tab state
      setPreviousTabState({
        functionId: currentFunction,
        tabName: currentTab
      });
      
      // Make the API call in the background
      await settingsService.updateSetting(currentFunction, setting.key, editValue);
      
      // Silently refresh the data to ensure consistency
      const data = await settingsService.getSettingsByCategory(currentFunction);
      setSettings(data);
    } catch (err) {
      setError('Failed to update setting. Please try again.');
      console.error(err);
      // If there was an error, refresh the data to ensure UI is in sync
      if (selectedFunction) {
        await fetchSettings(selectedFunction);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Optimistically update the UI without showing loading state
  const handleReset = async (setting: SettingItem) => {
    if (!selectedFunction || !activeTab) return;

    try {
      setIsSaving(true);
      setError(null);
      
      // Save the current tab and function info
      const currentTab = activeTab;
      const currentFunction = selectedFunction;
      
      // Optimistically update the UI
      const updatedSettings = { ...settings };
      if (updatedSettings[activeTab]) {
        updatedSettings[activeTab] = updatedSettings[activeTab].map(s => 
          s.key === setting.key 
            ? { ...s, value: s.defaultValue } 
            : s
        );
        setSettings(updatedSettings);
      }
      
      // Preserve tab state
      setPreviousTabState({
        functionId: currentFunction,
        tabName: currentTab
      });
      
      // Make the API call in the background
      await settingsService.resetSetting(currentFunction, setting.key);
      
      // Silently refresh the data to ensure consistency
      const data = await settingsService.getSettingsByCategory(currentFunction);
      setSettings(data);
    } catch (err) {
      setError('Failed to reset setting. Please try again.');
      console.error(err);
      // If there was an error, refresh the data to ensure UI is in sync
      if (selectedFunction) {
        await fetchSettings(selectedFunction);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb Navigation */}
      <nav className="flex mb-6" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link href="/admin-tools" className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600">
              <HomeIcon className="w-4 h-4 mr-2" />
              Admin Tools
            </Link>
          </li>
          <li>
            <div className="flex items-center">
              <ChevronRightIcon className="w-4 h-4 text-gray-400" />
              <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">Settings Management</span>
            </div>
          </li>
        </ol>
      </nav>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Settings Management</h1>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Function Selection Sidebar */}
        <div className="lg:w-1/4">
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-800">Functions</h2>
            </div>
            {loading && functions.length === 0 ? (
              <div className="p-4 text-center">
                <div className="animate-pulse flex justify-center">
                  <div className="h-4 w-28 bg-gray-200 rounded"></div>
                </div>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {functions.map((func) => (
                  <li
                    key={func.id}
                    className={`py-3 px-4 cursor-pointer transition-colors duration-150 ${
                      selectedFunction === func.id 
                        ? 'bg-blue-50 border-l-4 border-blue-500' 
                        : 'hover:bg-gray-50 border-l-4 border-transparent'
                    }`}
                    onClick={() => handleFunctionChange(func.id)}
                  >
                    <div className="font-medium text-gray-900">{func.name}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:w-3/4">
          {selectedFunction ? (
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-800">
                  {functions.find(f => f.id === selectedFunction)?.name} Settings
                </h2>
              </div>
              
              {loading ? (
                <div className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              ) : Object.keys(settings).length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No settings found for this function.
                </div>
              ) : (
                <div>
                  {/* Tabs Navigation */}
                  <div className="border-b border-gray-200">
                    <nav className="flex overflow-x-auto" aria-label="Tabs">
                      {Object.keys(settings).map((category) => (
                        <button
                          key={category}
                          onClick={() => handleTabChange(category)}
                          className={`
                            whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm
                            ${activeTab === category
                              ? 'border-blue-500 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }
                          `}
                          aria-current={activeTab === category ? 'page' : undefined}
                        >
                          {category}
                        </button>
                      ))}
                    </nav>
                  </div>
                  
                  {/* Tab Content - Table Layout */}
                  <div className="p-6">
                    {activeTab && settings[activeTab] && (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">
                                Setting
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/2">
                                Value
                              </th>
                              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {settings[activeTab].map((setting) => (
                              <tr key={setting.key} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">{setting.name}</div>
                                  <div className="text-xs text-gray-500 mt-1">{setting.description}</div>
                                </td>
                                <td className="px-6 py-4">
                                  {editingKey === setting.key ? (
                                    isBooleanSetting(setting) ? (
                                      <div className="flex items-center">
                                        <button
                                          type="button"
                                          onClick={() => setEditValue('true')}
                                          className={`px-3 py-2 text-sm font-medium rounded-l-md ${
                                            editValue === 'true'
                                              ? 'bg-blue-600 text-white'
                                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                          }`}
                                        >
                                          Enabled
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setEditValue('false')}
                                          className={`px-3 py-2 text-sm font-medium rounded-r-md ${
                                            editValue === 'false'
                                              ? 'bg-blue-600 text-white'
                                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                          }`}
                                        >
                                          Disabled
                                        </button>
                                      </div>
                                    ) : setting.allowedValues ? (
                                      <select
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        className="block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white"
                                        disabled={isSaving}
                                        onKeyDown={(e) => handleKeyDown(e, setting)}
                                        onBlur={() => handleSave(setting)}
                                      >
                                        {setting.allowedValues.map((value) => (
                                          <option key={value} value={value}>
                                            {value}
                                          </option>
                                        ))}
                                      </select>
                                    ) : (
                                      <input
                                        ref={inputRef}
                                        type={isSecureItem(setting) ? "password" : "text"}
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        className="block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                        disabled={isSaving}
                                        onKeyDown={(e) => handleKeyDown(e, setting)}
                                        onBlur={() => handleSave(setting)}
                                        placeholder={setting.defaultValue || '(empty)'}
                                        autoComplete={isSecureItem(setting) ? "new-password" : "off"}
                                      />
                                    )
                                  ) : (
                                    <div className="text-sm text-gray-900">
                                      {setting.value ? (
                                        isSecureItem(setting) ? (
                                          <span className="text-gray-700">{maskSecureValue(setting.value)}</span>
                                        ) : isBooleanSetting(setting) ? (
                                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            stringToBoolean(setting.value) 
                                              ? 'bg-green-100 text-green-800' 
                                              : 'bg-red-100 text-red-800'
                                          }`}>
                                            {stringToBoolean(setting.value) ? 'Enabled' : 'Disabled'}
                                          </span>
                                        ) : (
                                          setting.value
                                        )
                                      ) : (
                                        <span className="text-gray-400 italic">{isSecureItem(setting) ? '(secured)' : (setting.defaultValue || '(empty)')}</span>
                                      )}
                                    </div>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  {editingKey === setting.key ? (
                                    <div className="flex justify-end space-x-3">
                                      <button
                                        onClick={handleCancelEdit}
                                        className="text-gray-600 hover:text-gray-800"
                                        disabled={isSaving}
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        onClick={() => handleSave(setting)}
                                        className="text-blue-600 hover:text-blue-800"
                                        disabled={isSaving}
                                      >
                                        {isSaving ? 'Saving...' : 'Save'}
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex justify-end space-x-3">
                                      <button
                                        onClick={() => handleEdit(setting)}
                                        disabled={isSaving}
                                        className={`text-blue-600 hover:text-blue-800 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        title="Edit"
                                      >
                                        <PencilIcon className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => handleReset(setting)}
                                        disabled={isSaving || setting.value === setting.defaultValue}
                                        className={`text-gray-600 hover:text-gray-800 ${(isSaving || setting.value === setting.defaultValue) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        title="Reset to default"
                                      >
                                        <ArrowPathIcon className="h-4 w-4" />
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white shadow-md rounded-lg p-6 text-center text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <p className="mt-2">Select a function to view its settings.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}