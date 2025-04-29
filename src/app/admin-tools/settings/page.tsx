'use client';

import { useEffect, useState } from 'react';
import { useSettingsService, FunctionRegistry, SettingItem, SettingsByCategory } from '@/app/admin-tools/api/settings';
import Link from 'next/link';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';

export default function SettingsAdminPage() {
  const settingsService = useSettingsService();
  const [functions, setFunctions] = useState<FunctionRegistry[]>([]);
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null);
  const [settings, setSettings] = useState<SettingsByCategory>({});
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingSetting, setEditingSetting] = useState<SettingItem | null>(null);
  const [editValue, setEditValue] = useState('');
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [previousTabState, setPreviousTabState] = useState<{functionId: string | null, tabName: string | null}>({
    functionId: null,
    tabName: null
  });

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
    setEditingSetting(null);
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
    setEditingSetting(setting);
    setEditValue(setting.value);
  };

  const handleCancelEdit = () => {
    setEditingSetting(null);
  };

  // Optimistically update the UI without showing loading state
  const handleSave = async () => {
    if (!editingSetting || !selectedFunction || !activeTab) return;

    try {
      setIsSaving(true);
      setError(null);
      
      // Save the current tab and function info
      const currentTab = activeTab;
      const currentFunction = selectedFunction;
      
      // Optimistically update the UI
      const updatedSettings = { ...settings };
      if (updatedSettings[activeTab]) {
        updatedSettings[activeTab] = updatedSettings[activeTab].map(setting => 
          setting.key === editingSetting.key 
            ? { ...setting, value: editValue } 
            : setting
        );
        setSettings(updatedSettings);
      }
      
      // Clear editing state immediately for better UX
      setEditingSetting(null);
      
      // Preserve tab state
      setPreviousTabState({
        functionId: currentFunction,
        tabName: currentTab
      });
      
      // Make the API call in the background
      await settingsService.updateSetting(currentFunction, editingSetting.key, editValue);
      
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
    <div className="container mx-auto px-4 py-8 max-w-7xl">
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
                  
                  {/* Tab Content */}
                  <div className="p-6">
                    {activeTab && settings[activeTab] && (
                      <div className="space-y-6">
                        {settings[activeTab].map((setting) => (
                          <div key={setting.key} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors duration-150">
                            <div className="flex justify-between items-start">
                              <div className="flex-grow">
                                <h4 className="font-medium text-gray-900">{setting.name}</h4>
                                <p className="text-sm text-gray-600 mt-1">{setting.description}</p>
                              </div>
                              <div className="flex space-x-2 ml-4">
                                <button
                                  onClick={() => handleEdit(setting)}
                                  disabled={isSaving}
                                  className={`px-3 py-1 text-sm text-blue-600 hover:text-blue-800 rounded border border-blue-200 hover:border-blue-400 transition-colors duration-150 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleReset(setting)}
                                  disabled={isSaving || setting.value === setting.defaultValue}
                                  className={`px-3 py-1 text-sm text-gray-600 hover:text-gray-800 rounded border border-gray-200 hover:border-gray-400 transition-colors duration-150 ${(isSaving || setting.value === setting.defaultValue) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                  Reset
                                </button>
                              </div>
                            </div>
                            
                            {editingSetting?.key === setting.key ? (
                              <div className="mt-4 bg-gray-50 p-4 rounded-md border border-gray-200">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Value
                                </label>
                                {setting.allowedValues ? (
                                  <select
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    disabled={isSaving}
                                  >
                                    {setting.allowedValues.map((value) => (
                                      <option key={value} value={value}>
                                        {value}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <input
                                    type="text"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    disabled={isSaving}
                                  />
                                )}
                                <div className="mt-4 flex justify-end space-x-3">
                                  <button
                                    onClick={handleCancelEdit}
                                    className="px-4 py-2 text-sm text-gray-700 bg-white hover:bg-gray-50 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150"
                                    disabled={isSaving}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={handleSave}
                                    className={`px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md border border-transparent shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150 ${isSaving ? 'opacity-75 cursor-wait' : ''}`}
                                    disabled={isSaving}
                                  >
                                    {isSaving ? 'Saving...' : 'Save'}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                                <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                                  <span className="font-medium text-gray-700 block mb-1">Current Value:</span>
                                  <span className="text-gray-900">{setting.value || '(empty)'}</span>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                                  <span className="font-medium text-gray-700 block mb-1">Default Value:</span>
                                  <span className="text-gray-500">{setting.defaultValue || '(empty)'}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
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