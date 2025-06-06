'use client';

import { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  FunnelIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { Asset } from './AssetItem';
import AssetItem from './AssetItem';
import AssetDetails from './AssetDetails';
import TaggedListView from './TaggedListView';
import UploadAssetDialog from './UploadAssetDialog';
import { assetsApi, AssetDto } from '@/app/api/assets';
import { toast } from 'react-hot-toast';

export default function AssetsManagement() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isEditing, setIsEditing] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  // Load assets on component mount
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        setIsLoading(true);
        const apiAssets = await assetsApi.getAll();
        
        // Convert API assets to our Asset format
        const formattedAssets: Asset[] = apiAssets.map(apiAsset => {
          // Determine asset type from content type
          const contentType = apiAsset.meta.contentType || '';
          let assetType: 'image' | 'document' | 'video' | 'audio' = 'document';
          
          if (contentType.startsWith('image/')) {
            assetType = 'image';
          } else if (contentType.startsWith('video/')) {
            assetType = 'video';
          } else if (contentType.startsWith('audio/')) {
            assetType = 'audio';
          }
          
          return {
            id: apiAsset.uuid,
            name: apiAsset.meta.filename || 'Untitled',
            type: assetType,
            size: formatFileSize(apiAsset.meta.size || 0),
            uploadedBy: 'You', // Could be enhanced with user info
            uploadDate: new Date(apiAsset.createdAt).toLocaleDateString(),
            description: apiAsset.meta.description || '',
            tags: apiAsset.meta.tags || [],
            url: assetsApi.getAssetContentUrl(apiAsset.uuid),
            originalAsset: apiAsset // Store the original API asset for reference
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
  
  // Helper function to determine asset type from content type
  const getAssetType = (contentType: string): 'image' | 'document' | 'video' | 'audio' => {
    if (contentType.startsWith('image/')) return 'image';
    if (contentType.startsWith('video/')) return 'video';
    if (contentType.startsWith('audio/')) return 'audio';
    if (contentType.includes('pdf') || contentType.includes('document') || 
        contentType.includes('text/') || contentType.includes('application/')) {
      return 'document';
    }
    return 'document'; // Default type
  };
  
  // Helper function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Filter assets when search query or filter type changes
  useEffect(() => {
    let result = [...assets];
    
    // Apply type filter
    if (filterType !== 'all') {
      result = result.filter(asset => asset.type === filterType);
    }
    
    // Apply search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(asset => 
        asset.name.toLowerCase().includes(query) || 
        asset.description?.toLowerCase().includes(query) || 
        asset.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    setFilteredAssets(result);
  }, [assets, searchQuery, filterType]);

  // Handle asset selection
  const handleAssetSelect = (assetToSelect: Asset) => {
    setSelectedAsset(assetToSelect);
    setIsEditing(false);
  };

  // Handle upload dialog
  const handleOpenUploadDialog = () => {
    setShowUploadDialog(true);
  };

  const handleCloseUploadDialog = () => {
    setShowUploadDialog(false);
  };

  // Handle asset upload
  const handleUploadAsset = async (assetData: Partial<Asset>) => {
    try {
      setIsLoading(true);
      
      // Handle file upload
      if (assetData.file) {
        // Create metadata object
        const metadata = {
          filename: assetData.name || assetData.file.name,
          contentType: assetData.file.type,
          description: assetData.description || '',
          size: assetData.file.size,
          tags: assetData.tags || []
        };
        
        // Upload the file with metadata
        const uploadedAsset = await assetsApi.uploadAsset(assetData.file, metadata);
        
        // Convert API asset to our Asset format
        const newAsset: Asset = {
          id: uploadedAsset.uuid,
          name: metadata.filename,
          type: getAssetType(metadata.contentType),
          size: formatFileSize(metadata.size),
          uploadedBy: 'You',
          uploadDate: new Date(uploadedAsset.createdAt).toLocaleDateString(),
          description: metadata.description,
          tags: metadata.tags,
          url: assetsApi.getAssetContentUrl(uploadedAsset.uuid),
          originalAsset: uploadedAsset
        };
        
        // Add to assets array
        setAssets(prevAssets => [newAsset, ...prevAssets]);
        
        // Select the new asset
        setSelectedAsset(newAsset);
        toast.success('Asset uploaded successfully');
      } else if (assetData.url) {
        // Handle URL-based asset (would need backend support)
        toast.error('URL-based uploads not implemented yet');
      }
    } catch (error) {
      console.error('Failed to upload asset:', error);
      toast.error('Failed to upload asset');
    } finally {
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
    setIsEditing(true);
  };

  const handleSaveEdits = async (updatedAsset: Asset) => {
    try {
      // Extract metadata from the updated asset
      const metadata = {
        filename: updatedAsset.name,
        description: updatedAsset.description,
        tags: updatedAsset.tags || [],
        // Preserve other metadata from the original asset
        ...(selectedAsset?.originalAsset?.meta || {})
      };
      
      // Call API to update the asset
      await assetsApi.updateAsset(updatedAsset.id, { meta: metadata });
      
      // Update the asset in the assets array
      setAssets(prevAssets => 
        prevAssets.map(asset => 
          asset.id === updatedAsset.id ? updatedAsset : asset
        )
      );
      
      // Update the selected asset and exit edit mode
      setSelectedAsset(updatedAsset);
      setIsEditing(false);
      toast.success('Asset updated successfully');
    } catch (error) {
      console.error('Failed to update asset:', error);
      toast.error('Failed to update asset');
    }
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
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
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                    placeholder="Search assets..."
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <FunnelIcon className="h-5 w-5 text-gray-400" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="all">All Types</option>
                  <option value="image">Images</option>
                  <option value="document">Documents</option>
                  <option value="video">Videos</option>
                  <option value="audio">Audio</option>
                </select>
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
                renderItemContent={(asset) => <AssetItem asset={asset} />}
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
      </div>
    </div>
  );
}
