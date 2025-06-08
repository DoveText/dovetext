import React from 'react';

interface URLAssetUploadProps {
  urlInput: string;
  setUrlInput: (url: string) => void;
  isLoading?: boolean;
  setIsLoading?: (loading: boolean) => void;
  uploadProgress?: number;
  setUploadProgress?: (progress: number) => void;
  nameInput?: string;
  setNameInput?: (name: string) => void;
  errorMessage?: string | null;
  setErrorMessage?: (message: string | null) => void;
}

export default function URLAssetUpload({
  urlInput,
  setUrlInput,
  isLoading,
  setIsLoading,
  uploadProgress,
  setUploadProgress,
  nameInput,
  setNameInput,
  errorMessage,
  setErrorMessage
}: URLAssetUploadProps) {
  return (
    <div className="mb-4">
      <label htmlFor="url-upload" className="block text-sm font-medium text-gray-700 mb-1">
        Asset URL
      </label>
      <input
        type="url"
        id="url-upload"
        value={urlInput}
        onChange={(e) => setUrlInput(e.target.value)}
        placeholder="https://example.com/asset.jpg"
        required
        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      />
    </div>
  );
}
