'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useUserType } from '@/context/UserTypeContext';
import { useAuth } from '@/context/AuthContext';
import { documentsApi, DocumentDto } from '@/app/api/documents';
import { 
  DocumentTextIcon, 
  PlusIcon, 
  FunnelIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
// Article interface that maps to DocumentDto from the backend
interface Article {
  id: string; // uuid from DocumentDto
  title: string; // from meta.filename or meta.title
  status: string; // state from DocumentDto
  author: string; // from meta.author or user info
  category: string; // from meta.category or tags
  publishDate?: string; // from meta.publishDate
  views?: number; // from meta.views
  lastModified: string; // from updatedAt
}

export default function ArticlesPage() {
  const router = useRouter();
  const { userType } = useUserType();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [filterState, setFilterState] = useState<string | undefined>(undefined);

  // Redirect personal users to dashboard
  if (!authLoading && user && userType === 'personal') {
    router.push('/dashboard');
    return null;
  }
  
  // Fetch articles from the backend
  useEffect(() => {
    fetchArticles();
  }, [filterState]);
  
  // Function to fetch articles from the backend
  const fetchArticles = async () => {
    setIsLoading(true);
    try {
      const documents = await documentsApi.getAll(filterState);
      
      // Map DocumentDto to Article interface
      const mappedArticles = documents.map(doc => {
        const meta = doc.meta || {};
        return {
          id: doc.uuid,
          title: meta.title || meta.filename || 'Untitled Document',
          status: doc.state || 'draft',
          author: meta.author || (user ? user.email : 'Unknown'),
          category: meta.category || 'Uncategorized',
          publishDate: meta.publishDate,
          views: meta.views,
          lastModified: doc.updatedAt
        };
      });
      
      setArticles(mappedArticles);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Filter articles based on search query
  const filteredArticles = articles.filter(article => 
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.category.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Handle refresh - fetch articles from backend
  const handleRefresh = () => {
    fetchArticles();
  };
  
  // Handle filter change
  const handleFilterChange = (state?: string) => {
    setFilterState(state);
  };
  
  // Handle create new article
  const handleCreateArticle = () => {
    router.push('/articles/create');
  };
  
  // Handle edit article
  const handleEditArticle = (id: string) => {
    router.push(`/articles/edit/${id}`);
  };
  
  // Handle delete article
  const handleDeleteArticle = async (id: string) => {
    if (confirm('Are you sure you want to delete this article?')) {
      setIsLoading(true);
      try {
        await documentsApi.deleteDocument(id);
        // Refresh the list after deletion
        fetchArticles();
      } catch (error) {
        console.error('Error deleting document:', error);
        setIsLoading(false);
      }
    }
  };
  
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex items-center">
                <DocumentTextIcon className="h-8 w-8 text-blue-600 mr-3" />
                <h1 className="text-2xl font-bold text-gray-900">Articles</h1>
              </div>
              <div className="mt-4 md:mt-0">
                <button
                  type="button"
                  onClick={handleCreateArticle}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Create New Article
                </button>
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Manage your business articles and content
            </p>
          </div>
          
          {/* Filters and Search */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="relative inline-block text-left">
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => handleFilterChange(undefined)}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${!filterState ? 'bg-blue-100 text-blue-800' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFilterChange('draft')}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${filterState === 'draft' ? 'bg-blue-100 text-blue-800' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                  >
                    Drafts
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFilterChange('published')}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${filterState === 'published' ? 'bg-blue-100 text-blue-800' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                  >
                    Published
                  </button>
                </div>
              </div>
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  name="search"
                  id="search"
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowPathIcon className={`h-5 w-5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
          
          {/* Articles Table */}
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Author
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Views
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Modified
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredArticles.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                        No articles found
                      </td>
                    </tr>
                  ) : (
                    filteredArticles.map((article) => (
                      <tr key={article.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{article.title}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${article.status === 'published' ? 'bg-green-100 text-green-800' : 
                              article.status === 'draft' ? 'bg-gray-100 text-gray-800' : 
                              'bg-yellow-100 text-yellow-800'}`}>
                            {article.status.charAt(0).toUpperCase() + article.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {article.author}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {article.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {article.publishDate ? new Date(article.publishDate).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {article.views || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(article.lastModified).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button 
                            onClick={() => handleEditArticle(article.id)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteArticle(article.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
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
                  Showing <span className="font-medium">{filteredArticles.length}</span> of <span className="font-medium">{articles.length}</span> articles
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
        </div>
      </div>
    </ProtectedRoute>
  );
}
