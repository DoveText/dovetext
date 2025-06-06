'use client';

import React, { useState } from 'react';
import { ArrowPathIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { Asset } from './AssetItem';

interface UploadAssetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (assetData: Partial<Asset>) => Promise<void>;
}

export default function UploadAssetDialog({
  isOpen,
  onClose,
  onUpload
}: UploadAssetDialogProps) {
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('file');
  const [fileInput, setFileInput] = useState<File | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [descriptionInput, setDescriptionInput] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = () => {
    setFileInput(null);
    setUrlInput('');
    setNameInput('');
    setDescriptionInput('');
    setTagsInput('');
    setUploadMethod('file');
    setIsLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileInput(file);
      if (!nameInput) {
        setNameInput(file.name);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Prepare the asset data
      const tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag);
      
      // Determine asset type based on file or URL
      let assetType: 'image' | 'document' | 'video' | 'audio' = 'document';
      let assetSize = '0 KB';
      
      if (uploadMethod === 'file' && fileInput) {
        const fileExt = fileInput.name.split('.').pop()?.toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt || '')) {
          assetType = 'image';
        } else if (['mp4', 'webm', 'mov'].includes(fileExt || '')) {
          assetType = 'video';
        } else if (['mp3', 'wav', 'ogg'].includes(fileExt || '')) {
          assetType = 'audio';
        }
        
        // Format file size
        assetSize = formatFileSize(fileInput.size);
      } else if (uploadMethod === 'url') {
        const urlExt = urlInput.split('.').pop()?.toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(urlExt || '')) {
          assetType = 'image';
        } else if (['mp4', 'webm', 'mov'].includes(urlExt || '')) {
          assetType = 'video';
        } else if (['mp3', 'wav', 'ogg'].includes(urlExt || '')) {
          assetType = 'audio';
        }
      }
      
      const assetData: Partial<Asset> = {
        name: nameInput,
        type: assetType,
        size: assetSize,
        description: descriptionInput,
        tags,
        uploadDate: new Date().toISOString().split('T')[0],
        url: uploadMethod === 'url' ? urlInput : undefined,
        // Include the file for API upload
        file: uploadMethod === 'file' && fileInput ? fileInput : undefined,
      };
      
      await onUpload(assetData);
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error uploading asset:', error);
      // Handle error (show toast, etc.)
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Upload New Asset</h3>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload Method</label>
            <div className="flex space-x-4">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="upload-file"
                  name="upload-method"
                  checked={uploadMethod === 'file'}
                  onChange={() => setUploadMethod('file')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor="upload-file" className="ml-2 text-sm text-gray-700">
                  Upload File
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="upload-url"
                  name="upload-method"
                  checked={uploadMethod === 'url'}
                  onChange={() => setUploadMethod('url')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor="upload-url" className="ml-2 text-sm text-gray-700">
                  Use URL
                </label>
              </div>
            </div>
          </div>

          {uploadMethod === 'file' ? (
            <div className="mb-4">
              <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-1">File</label>
              <input 
                type="file" 
                id="file-upload" 
                onChange={handleFileChange} 
                required={uploadMethod === 'file'}
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {fileInput && <p className="text-xs text-gray-500 mt-1">Selected: {fileInput.name}</p>}
            </div>
          ) : (
            <div className="mb-4">
              <label htmlFor="url-upload" className="block text-sm font-medium text-gray-700 mb-1">Asset URL</label>
              <input 
                type="url" 
                id="url-upload" 
                value={urlInput} 
                onChange={(e) => setUrlInput(e.target.value)} 
                placeholder="https://example.com/asset.jpg" 
                required={uploadMethod === 'url'}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="upload-name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input 
              type="text" 
              id="upload-name" 
              value={nameInput} 
              onChange={(e) => setNameInput(e.target.value)} 
              required 
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="upload-description" className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <textarea 
              id="upload-description" 
              value={descriptionInput} 
              onChange={(e) => setDescriptionInput(e.target.value)} 
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            ></textarea>
          </div>
          
          <div className="mb-6">
            <label htmlFor="upload-tags" className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
            <input 
              type="text" 
              id="upload-tags" 
              value={tagsInput} 
              onChange={(e) => setTagsInput(e.target.value)} 
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <button 
              type="button" 
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isLoading} 
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center"
            >
              {isLoading ? <ArrowPathIcon className="h-4 w-4 animate-spin mr-2"/> : <ArrowUpTrayIcon className="h-5 w-5 inline mr-1" />} 
              {isLoading ? 'Uploading...' : 'Upload Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
