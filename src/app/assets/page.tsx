'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useUserType } from '@/context/UserTypeContext';
import { 
  PhotoIcon, 
  PlusIcon, 
  FunnelIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  DocumentIcon,
  VideoCameraIcon,
  MusicalNoteIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

// Mock asset data
interface Asset {
  id: string;
  name: string;
  type: 'image' | 'document' | 'video' | 'audio';
  size: string;
  uploadedBy: string;
  uploadDate: string;
  lastUsed?: string;
  thumbnail?: string;
}

// Helper function to get icon based on asset type
const getAssetIcon = (type: string) => {
  switch (type) {
    case 'image':
      return <PhotoIcon className="h-10 w-10 text-blue-500" />;
    case 'document':
      return <DocumentTextIcon className="h-10 w-10 text-green-500" />;
    case 'video':
      return <VideoCameraIcon className="h-10 w-10 text-red-500" />;
    case 'audio':
      return <MusicalNoteIcon className="h-10 w-10 text-purple-500" />;
    default:
      return <DocumentIcon className="h-10 w-10 text-gray-500" />;
  }
};

export default function AssetsPage() {
  const router = useRouter();
  const { userType } = useUserType();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Redirect personal users to dashboard
  if (userType === 'personal') {
    router.push('/dashboard');
    return null;
  }
  
  // Mock assets data
  const [assets, setAssets] = useState<Asset[]>([
    {
      id: '1',
      name: 'company-logo.png',
      type: 'image',
      size: '2.4 MB',
      uploadedBy: 'Jane Smith',
      uploadDate: '2023-05-15',
      lastUsed: '2023-05-20',
      thumbnail: 'https://via.placeholder.com/150'
    },
    {
      id: '2',
      name: 'quarterly-report-q1.pdf',
      type: 'document',
      size: '4.8 MB',
      uploadedBy: 'John Doe',
      uploadDate: '2023-05-10',
      lastUsed: '2023-05-18'
    },
    {
      id: '3',
      name: 'product-demo.mp4',
      type: 'video',
      size: '24.6 MB',
      uploadedBy: 'Sarah Johnson',
      uploadDate: '2023-05-08',
      lastUsed: '2023-05-12',
      thumbnail: 'https://via.placeholder.com/150'
    },
    {
      id: '4',
      name: 'brand-guidelines.pdf',
      type: 'document',
      size: '8.2 MB',
      uploadedBy: 'Michael Brown',
      uploadDate: '2023-04-28',
      lastUsed: '2023-05-15'
    },
    {
      id: '5',
      name: 'team-photo.jpg',
      type: 'image',
      size: '3.7 MB',
      uploadedBy: 'Emily Davis',
      uploadDate: '2023-04-22',
      lastUsed: '2023-05-05',
      thumbnail: 'https://via.placeholder.com/150'
    },
    {
      id: '6',
      name: 'podcast-episode-5.mp3',
      type: 'audio',
      size: '18.3 MB',
      uploadedBy: 'David Wilson',
      uploadDate: '2023-05-01',
      lastUsed: '2023-05-10'
    },
    {
      id: '7',
      name: 'marketing-strategy.pptx',
      type: 'document',
      size: '5.9 MB',
      uploadedBy: 'Lisa Johnson',
      uploadDate: '2023-05-05',
      lastUsed: '2023-05-19'
    },
    {
      id: '8',
      name: 'product-showcase.mp4',
      type: 'video',
      size: '32.1 MB',
      uploadedBy: 'Robert Chen',
      uploadDate: '2023-04-18',
      lastUsed: '2023-05-02',
      thumbnail: 'https://via.placeholder.com/150'
    }
  ]);
  
  // Filter assets based on search query
  const filteredAssets = assets.filter(asset => 
    asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset.type.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Handle refresh (simulated)
  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };
  
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex items-center">
                <PhotoIcon className="h-8 w-8 text-blue-600 mr-3" />
                <h1 className="text-2xl font-bold text-gray-900">Assets</h1>
              </div>
              <div className="mt-4 md:mt-0">
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Upload New Asset
                </button>
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Manage your business assets including images, documents, videos, and audio files
            </p>
          </div>
          
          {/* Filters and Search */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <FunnelIcon className="h-4 w-4 mr-1" />
                  Filter
                  <ChevronDownIcon className="h-4 w-4 ml-1" />
                </button>
                <button
                  type="button"
                  onClick={handleRefresh}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <ArrowPathIcon className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                <div className="border-l border-gray-300 h-6 mx-2" />
                <div className="flex space-x-1">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Search assets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          {/* Assets Display */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredAssets.length === 0 ? (
                <div className="col-span-full text-center py-10 bg-white rounded-lg shadow">
                  <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No assets found</h3>
                  <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter to find what you're looking for.</p>
                </div>
              ) : (
                filteredAssets.map((asset) => (
                  <div key={asset.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow duration-200">
                    <div className="h-40 bg-gray-100 flex items-center justify-center">
                      {asset.thumbnail ? (
                        <img src={asset.thumbnail} alt={asset.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center justify-center">
                          {getAssetIcon(asset.type)}
                          <span className="mt-2 text-xs font-medium text-gray-500 uppercase">{asset.type}</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-medium text-gray-900 truncate" title={asset.name}>{asset.name}</h3>
                      <div className="mt-1 flex justify-between text-xs text-gray-500">
                        <span>{asset.size}</span>
                        <span>{new Date(asset.uploadDate).toLocaleDateString()}</span>
                      </div>
                      <div className="mt-4 flex justify-between">
                        <button className="text-xs text-blue-600 hover:text-blue-800">Download</button>
                        <button className="text-xs text-gray-600 hover:text-gray-800">Details</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden rounded-lg">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Asset
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Size
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Uploaded By
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Upload Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Used
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAssets.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                          No assets found
                        </td>
                      </tr>
                    ) : (
                      filteredAssets.map((asset) => (
                        <tr key={asset.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center">
                                {getAssetIcon(asset.type)}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{asset.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              {asset.type.charAt(0).toUpperCase() + asset.type.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {asset.size}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {asset.uploadedBy}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(asset.uploadDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {asset.lastUsed ? new Date(asset.lastUsed).toLocaleDateString() : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button className="text-blue-600 hover:text-blue-900 mr-3">Download</button>
                            <button className="text-gray-600 hover:text-gray-900">Details</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-700">
                    Showing <span className="font-medium">{filteredAssets.length}</span> of <span className="font-medium">{assets.length}</span> assets
                  </div>
                  <div className="flex-1 flex justify-end">
                    <button
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <button
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
