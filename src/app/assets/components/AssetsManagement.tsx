'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  ArrowPathIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { Asset } from './AssetItem';
import AssetItem from './AssetItem';
import AssetDetails from './AssetDetails';
import TaggedListView from './TaggedListView';
import UploadAssetDialog from './UploadAssetDialog';
import { assetsApi, AssetDto } from '@/app/api/assets';
import { toast } from 'react-hot-toast';
import TaggedSelect from '@/components/common/TaggedSelect';

export default function AssetsManagement() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'document' | 'video' | 'audio'>('all');
  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'image', label: 'Images' },
    { value: 'document', label: 'Documents' },
    { value: 'video', label: 'Videos' },
    { value: 'audio', label: 'Audio' },
  ];
  
  // Source type filter
  const [filterSourceType, setFilterSourceType] = useState<'all' | 'file' | 'url'>('all');
  const sourceTypeOptions = [
    { value: 'all', label: 'All Sources' },
    { value: 'file', label: 'File' },
    { value: 'url', label: 'URL' },
  ];
  
  const [isEditing, setIsEditing] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  
  // Tag filtering
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  const getAssetType = (apiAsset => {
    let assetType = apiAsset.meta.assetType || '';
    const contentType = apiAsset.meta.contentType || '';
          
    // Validate the assetType is one of our valid types
    const validTypes = ['image', 'document', 'video', 'audio'];
    if (!validTypes.includes(assetType)) {
      // If assetType is not valid, try to determine it from contentType
      if (contentType.startsWith('image/')) {
        assetType = 'image';
      } else if (contentType.startsWith('video/')) {
        assetType = 'video';
      } else if (contentType.startsWith('audio/')) {
        assetType = 'audio';
      } else {
        assetType = 'document';
      }
    }
    
    // For URL assets, do additional checks if type is still not determined correctly
    if (apiAsset.type === 'url') {
      const url = apiAsset.meta.url || '';
      // Check for common video platforms in URL
      if (assetType !== 'video' && (url.includes('youtube.com') || url.includes('youtu.be') || 
          url.includes('vimeo.com') || url.includes('video'))) {
        assetType = 'video';
      }
    }

    return assetType;
  })

  // Load assets on component mount
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        setIsLoading(true);
        const apiAssets = await assetsApi.getAll();
        
        // Convert API assets to our Asset format
        const formattedAssets: Asset[] = apiAssets.map(apiAsset => {
          // Determine asset type from content type or explicit assetType in metadata
          let assetType = getAssetType(apiAsset);
          
          return {
            id: apiAsset.uuid,
            name: apiAsset.meta.filename || 'Untitled',
            contentType: assetType, // Changed from type to contentType
            size: formatFileSize(apiAsset.meta.size || 0),
            uploadedBy: 'You', // Could be enhanced with user info
            uploadDate: new Date(apiAsset.createdAt).toLocaleDateString(),
            description: apiAsset.meta.description || '',
            tags: apiAsset.meta.tags || [],
            url: assetsApi.getAssetContentUrl(apiAsset.uuid),
            originalAsset: apiAsset, // Store the original API asset for reference
            sourceType: apiAsset.type === 'url' ? 'url' : 'file' // Add source type (file or url)
          };
        });
        
        setAssets(formattedAssets);
        setFilteredAssets(formattedAssets);
      } catch (error) {
        console.error('Failed to fetch assets:', error);
        toast.error('Failed to load assets');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAssets();
  }, []);
  
  // Helper function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Extract all unique tags from assets
  useEffect(() => {
    const allTags = new Set<string>();
    assets.forEach(asset => {
      if (asset.tags && asset.tags.length > 0) {
        asset.tags.forEach(tag => allTags.add(tag));
      }
    });
    
    // Filter out tags that are already selected
    const availableTagsList = Array.from(allTags).filter(
      tag => !selectedTags.includes(tag)
    ).sort();
    
    setAvailableTags(availableTagsList);
  }, [assets, selectedTags]);

  // Filter assets based on selected tags and search query
  useEffect(() => {
    let result = [...assets];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(asset => 
        asset.name.toLowerCase().includes(query) ||
        (asset.description && asset.description.toLowerCase().includes(query)) ||
        getAssetTags(asset).some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    // Apply content type filtering
    if (filterType !== 'all') {
      result = result.filter(asset => asset.contentType === filterType);
    }
    
    // Apply source type filtering
    if (filterSourceType !== 'all') {
      result = result.filter(asset => asset.sourceType === filterSourceType);
    }
    
    setFilteredAssets(result);
  }, [assets, searchQuery, filterType, filterSourceType, selectedTags]);

  // Handle asset selection
  const handleAssetSelect = (assetToSelect: Asset) => {
    setSelectedAsset(assetToSelect);
    setIsEditing(false);
  };
  
  // Handle tag selection for filtering
  const handleFilterByTag = (tag: string) => {
    // If tag is already selected, remove it
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      // Otherwise, add it to the selection
      setSelectedTags([...selectedTags, tag]);
    }
  };
  
  // Ensure we have a safe access to asset.tags
  const getAssetTags = (asset: Asset): string[] => {
    return asset.tags || [];
  };

  // Handle tag removal from filter
  const handleRemoveTagFilter = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter(tag => tag !== tagToRemove));
  };

  // Handle upload dialog
  const handleOpenUploadDialog = () => {
    setShowUploadDialog(true);
  };

  const handleCloseUploadDialog = () => {
    setShowUploadDialog(false);
  };

  // Handle asset upload
  const handleUploadAsset = async (assetData: any, md5Hash?: string, forceDuplicate?: boolean) => {
    try {
      setIsLoading(true);
      
      // Check if we have the required data
      if (!assetData) {
        throw new Error('Missing asset data');
      }
      
      let uploadedAsset;

      if (!assetData.uuid) {
        throw new Error('Missing UUID for URL asset');
      }

      // For URL assets, we need to use the UUID from verification
      // Upload the URL asset using the correct API method
      uploadedAsset = await assetsApi.createAsset(
          assetData.uuid, assetData.md5, assetData.metadata, assetData.type
      );

      // Only proceed if we have a valid response with a UUID
      if (!uploadedAsset || !uploadedAsset.uuid) {
        throw new Error('Invalid response from server');
      }
      
      // Add the new asset to the assets list
      // First determine the correct asset type
      let assetType = getAssetType(uploadedAsset);
      
      const newAsset: Asset = {
        id: uploadedAsset.uuid,
        uuid: uploadedAsset.uuid,
        md5: uploadedAsset.md5,
        name: uploadedAsset.meta?.filename || '',
        description: uploadedAsset.meta?.description || '',
        tags: uploadedAsset.meta?.tags || [],
        contentType: assetType, // Use the properly determined assetType
        sourceType: uploadedAsset.type,
        size: formatFileSize(uploadedAsset.meta?.size || 0),
        uploadedBy: 'You',
        uploadDate: new Date().toISOString(),
        originalAsset: uploadedAsset
      };
      
      setAssets(prevAssets => [newAsset, ...prevAssets]);
      setFilteredAssets(prevFilteredAssets => [newAsset, ...prevFilteredAssets]);
      setShowUploadDialog(false);
      toast.success('Asset uploaded successfully');
      // Don't return the asset, just resolve the promise
    } catch (error: any) {
      console.error('Failed to upload asset:', error);
      if (error.status === 500) {
        toast.error('Failed to upload asset: Internal Server Error');
      } else {
        toast.error('Failed to upload asset: ' + (error.message || 'Unknown error'));
      }
      // Re-throw the error so the promise is rejected and the caller can handle it
      throw error;
    } finally {
      // Always reset loading state, whether the upload succeeded or failed
      setIsLoading(false);
    }
  };

  // Handle tag management for selected asset details
  const handleAddTagToSelectedAsset = async (tag: string) => {
    if (!selectedAsset) return;
    
    try {
      // Call API to add tag
      await assetsApi.addTagToAsset(selectedAsset.id, tag);
      
      const updatedAsset = { 
        ...selectedAsset,
        tags: [...(selectedAsset.tags || []), tag]
      };
      
      // Update the asset in the assets array
      setAssets(prevAssets => 
        prevAssets.map(asset => 
          asset.id === selectedAsset.id ? updatedAsset : asset
        )
      );
      
      // Update the selected asset
      setSelectedAsset(updatedAsset);
      toast.success(`Tag "${tag}" added`);
    } catch (error) {
      console.error('Failed to add tag:', error);
      toast.error('Failed to add tag');
    }
  };

  const handleRemoveTagFromSelectedAsset = async (tagToRemove: string) => {
    if (!selectedAsset || !selectedAsset.tags) return;
    
    try {
      // Call API to remove tag
      await assetsApi.removeTagFromAsset(selectedAsset.id, tagToRemove);
      
      const updatedAsset = { 
        ...selectedAsset,
        tags: selectedAsset.tags.filter(tag => tag !== tagToRemove)
      };
      
      // Update the asset in the assets array
      setAssets(prevAssets => 
        prevAssets.map(asset => 
          asset.id === selectedAsset.id ? updatedAsset : asset
        )
      );
      
      // Update the selected asset
      setSelectedAsset(updatedAsset);
      toast.success(`Tag "${tagToRemove}" removed`);
    } catch (error) {
      console.error('Failed to remove tag:', error);
      toast.error('Failed to remove tag');
    }
  };

  // Handle asset editing
  const handleStartEditing = () => {
    setShowEditDialog(true);
  };

  const handleSaveEdits = async (updatedAsset: Partial<Asset>, md5?: string, forceDuplicate?: boolean) => {
    if (!selectedAsset) return;
    
    try {
      // Update the asset metadata via API
      const updatedMeta = {
        filename: updatedAsset.name,
        description: updatedAsset.description,
        tags: updatedAsset.tags || [],
        // Preserve other metadata
        ...(selectedAsset.originalAsset?.meta || {})
      };
      
      await assetsApi.updateAsset(selectedAsset.id, { meta: updatedMeta });
      
      // Update the local asset state
      const updatedAssets = assets.map(asset => {
        if (asset.id === selectedAsset.id) {
          return {
            ...asset,
            name: updatedAsset.name || asset.name,
            description: updatedAsset.description || asset.description,
            tags: updatedAsset.tags || asset.tags,
            // Update the original asset metadata too
            originalAsset: {
              ...asset.originalAsset!,
              meta: updatedMeta
            }
          };
        }
        return asset;
      });
      
      setAssets(updatedAssets);
      setSelectedAsset(updatedAssets.find(a => a.id === selectedAsset.id) || null);
      setShowEditDialog(false);
      toast.success('Asset updated successfully');
    } catch (error) {
      console.error('Failed to update asset:', error);
      toast.error('Failed to update asset');
    }
  };

  const handleCancelEditing = () => {
    setShowEditDialog(false);
  };

  // Handle asset deletion
  const handleDeleteAsset = async (assetId: string) => {
    try {
      // Call API to delete the asset
      await assetsApi.deleteAsset(assetId);
      
      // Remove the asset from the assets array
      setAssets(prevAssets => 
        prevAssets.filter(asset => asset.id !== assetId)
      );
      
      // Clear the selected asset if it was deleted
      if (selectedAsset && selectedAsset.id === assetId) {
        setSelectedAsset(null);
      }
      
      toast.success('Asset deleted successfully');
    } catch (error) {
      console.error('Failed to delete asset:', error);
      toast.error('Failed to delete asset');
    }
  };

  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Assets Management</h1>
          <button
            onClick={handleOpenUploadDialog}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Upload Asset
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left sidebar - Asset list */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-700 mb-2">Filter Assets</div>
                <div className="flex space-x-4">
                  <div className="w-1/2">
                    <TaggedSelect
                      value={filterType}
                      onChange={(value) => setFilterType(value as 'all' | 'image' | 'document' | 'video' | 'audio')}
                      options={typeOptions}
                      placeholder="Select category"
                      className="w-full"
                    />
                  </div>
                  <div className="w-1/2">
                    <TaggedSelect
                      value={filterSourceType}
                      onChange={(value) => setFilterSourceType(value as 'all' | 'file' | 'url')}
                      options={sourceTypeOptions}
                      placeholder="Select source"
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-700 mb-2">Search by information</div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Search assets..."
                  />
                  {searchQuery && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Tag filter section */}
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-700 mb-2">Filter by Tags</div>
                <TaggedSelect
                  value={selectedTags}
                  onChange={(value) => setSelectedTags(value as string[])}
                  options={availableTags.map(tag => ({ value: tag, label: tag }))}
                  placeholder="Add a tag filter..."
                  className="w-full"
                  multiple={true}
                  editable={true}
                  onCreateOption={(label) => {
                    // Add the new tag to available tags if it doesn't exist
                    if (!availableTags.includes(label) && !selectedTags.includes(label)) {
                      setAvailableTags(prev => [...prev, label]);
                      handleFilterByTag(label);
                    }
                  }}
                />
              </div>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <ArrowPathIcon className="h-8 w-8 text-blue-500 animate-spin" />
              </div>
            ) : (
              <TaggedListView
                items={filteredAssets}
                onItemSelect={handleAssetSelect}
                selectedItem={selectedAsset}
                renderItemContent={(asset: Asset) => (
                  <AssetItem 
                    asset={asset} 
                    onTagClick={handleFilterByTag} 
                  />
                )}
                emptyMessage="No assets found. Try adjusting your filters or upload a new asset."
                className="h-[calc(100vh-300px)]"
              />
            )}
          </div>

          {/* Main content - Asset details */}
          <div className="lg:col-span-2">
            <AssetDetails
              asset={selectedAsset}
              isEditing={isEditing}
              onStartEditing={handleStartEditing}
              onSaveEdits={handleSaveEdits}
              onCancelEditing={handleCancelEditing}
              onDeleteAsset={handleDeleteAsset}
              onAddTag={handleAddTagToSelectedAsset}
              onRemoveTag={handleRemoveTagFromSelectedAsset}
            />
          </div>
        </div>

        {/* Upload dialog */}
        {showUploadDialog && (
          <UploadAssetDialog
            isOpen={showUploadDialog}
            onClose={handleCloseUploadDialog}
            onUpload={handleUploadAsset}
          />
        )}
        
        {/* Edit dialog */}
        {showEditDialog && selectedAsset && (
          <UploadAssetDialog
            isOpen={showEditDialog}
            onClose={handleCancelEditing}
            onUpload={handleSaveEdits}
            editMode={true}
            assetToEdit={selectedAsset}
          />
        )}
      </div>
    </div>
  );
}
