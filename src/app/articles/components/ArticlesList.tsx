'use client';

import React, { useState } from 'react';
import { Article } from './ArticlesManagement';
import { documentsApi } from '@/app/api/documents';
import { 
  TagIcon, 
  EyeIcon, 
  PencilIcon, 
  TrashIcon, 
  ArrowUpCircleIcon,
  ArchiveBoxIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

interface ArticlesListProps {
  articles: Article[];
  selectedArticle: Article | null;
  onArticleSelect: (article: Article) => void;
  onEditArticle: (id: string) => void;
  onDeleteArticle: (id: string) => void;
  isLoading: boolean;
  // Add a refresh function to reload articles after state changes
  onRefresh?: () => void;
}

// Mock function to simulate AI summary generation
const generateAISummary = (content: string = '') => {
  // In a real implementation, this would call an AI service
  return 'This is an AI-generated summary of the article content. It provides a brief overview of the key points covered in the article, helping readers quickly understand what the article is about without reading the entire content.';
};

export default function ArticlesList({
  articles,
  selectedArticle,
  onArticleSelect,
  onEditArticle,
  onDeleteArticle,
  isLoading,
  onRefresh
}: ArticlesListProps) {
  // Track expanded rows and local loading state
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [localLoading, setLocalLoading] = useState<Record<string, boolean>>({});
  
  // Toggle row expansion
  const toggleRowExpansion = (articleId: string, event?: React.MouseEvent) => {
    // If event is provided, stop propagation
    if (event) {
      event.stopPropagation();
    }
    
    setExpandedRows(prev => ({
      ...prev,
      [articleId]: !prev[articleId]
    }));
  };
  
  // Handle state change actions
  const handlePublish = async (articleId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (confirm('Are you sure you want to publish this article?')) {
      try {
        setLocalLoading(prev => ({ ...prev, [articleId]: true }));
        await documentsApi.updateDocument(articleId, { state: 'published' });
        alert('Article published successfully!');
        // Refresh the list using the provided refresh function or fallback to page reload
        if (onRefresh) {
          onRefresh();
        } else {
          window.location.reload();
        }
      } catch (error) {
        console.error('Error publishing article:', error);
        alert('Failed to publish article. Please try again.');
        setLocalLoading(prev => ({ ...prev, [articleId]: false }));
      }
    }
  };
  
  const handleArchive = async (articleId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (confirm('Are you sure you want to archive this article?')) {
      try {
        setLocalLoading(prev => ({ ...prev, [articleId]: true }));
        await documentsApi.updateDocument(articleId, { state: 'archived' });
        alert('Article archived successfully!');
        // Refresh the list using the provided refresh function or fallback to page reload
        if (onRefresh) {
          onRefresh();
        } else {
          window.location.reload();
        }
      } catch (error) {
        console.error('Error archiving article:', error);
        alert('Failed to archive article. Please try again.');
        setLocalLoading(prev => ({ ...prev, [articleId]: false }));
      }
    }
  };
  
  const handleRestore = async (articleId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (confirm('Are you sure you want to restore this article to draft?')) {
      try {
        setLocalLoading(prev => ({ ...prev, [articleId]: true }));
        await documentsApi.updateDocument(articleId, { state: 'draft' });
        alert('Article restored to draft successfully!');
        // Refresh the list using the provided refresh function or fallback to page reload
        if (onRefresh) {
          onRefresh();
        } else {
          window.location.reload();
        }
      } catch (error) {
        console.error('Error restoring article:', error);
        alert('Failed to restore article. Please try again.');
        setLocalLoading(prev => ({ ...prev, [articleId]: false }));
      }
    }
  };
  
  const handlePreview = (articleId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    // Open preview in a new tab
    window.open(`/articles/preview?id=${articleId}`, `preview-${articleId}`);
  };
  // Function to get status badge color
  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'archived':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="overflow-x-auto">
      {isLoading ? (
        <div className="py-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-500">Loading articles...</p>
        </div>
      ) : articles.length === 0 ? (
        <div className="py-12 text-center text-gray-500">
          No articles found
        </div>
      ) : (
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-full">
                Title
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>

              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tags
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Modified
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {articles.map(article => (
              <React.Fragment key={article.id}>
                <tr 
                  className={`bg-white border-b hover:bg-gray-50 ${selectedArticle?.id === article.id ? 'bg-blue-50' : ''} cursor-pointer`}
                  onClick={() => {
                    onArticleSelect(article);
                    toggleRowExpansion(article.id);
                  }}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-start">
                      <div className="text-gray-400 mt-1 flex-shrink-0 mr-2">
                        {expandedRows[article.id] ? (
                          <ChevronUpIcon className="h-5 w-5" />
                        ) : (
                          <ChevronDownIcon className="h-5 w-5" />
                        )}
                      </div>
                      <div className="text-sm font-medium text-gray-900 break-words">{article.title}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(article.status)}`}>
                      {article.status.charAt(0).toUpperCase() + article.status.slice(1)}
                    </span>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {article.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {article.tags && article.tags.length > 0 ? (
                        article.tags.slice(0, 3).map((tag, index) => (
                          <span 
                            key={index} 
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            <TagIcon className="h-3 w-3 mr-1" />
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400">No tags</span>
                      )}
                      {article.tags && article.tags.length > 3 && (
                        <span className="text-xs text-gray-500">+{article.tags.length - 3} more</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(article.lastModified).toLocaleDateString()}
                    <br/>
                    {new Date(article.lastModified).toLocaleTimeString()}
                  </td>
                </tr>
                
                {/* Expanded row with AI summary and actions */}
                {expandedRows[article.id] && (
                  <tr className="bg-gray-50">
                    <td colSpan={7} className="px-6 py-4">
                      <div className="flex flex-col">
                        {/* AI Summary */}
                        <div className="mb-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                          <div className="flex items-center mb-2">
                            <DocumentTextIcon className="h-5 w-5 text-blue-500 mr-2" />
                            <h3 className="text-sm font-medium text-gray-700">AI Summary</h3>
                          </div>
                          <p className="text-sm text-gray-600">{generateAISummary()}</p>
                        </div>
                        
                        {/* Action buttons */}
                        <div className="flex flex-wrap gap-2">
                          {/* Preview button */}
                          <button
                            onClick={(e) => handlePreview(article.id, e)}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            <EyeIcon className="h-4 w-4 mr-1" />
                            Preview
                          </button>
                          
                          {/* Edit button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditArticle(article.id);
                            }}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            <PencilIcon className="h-4 w-4 mr-1" />
                            Edit
                          </button>
                          
                          {/* Publish - only for draft */}
                          {article.status === 'draft' && (
                            <button
                              onClick={(e) => handlePublish(article.id, e)}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                              disabled={localLoading[article.id] || isLoading}
                            >
                              {localLoading[article.id] ? (
                                <>
                                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                                  Publishing...
                                </>
                              ) : (
                                <>
                                  <ArrowUpCircleIcon className="h-4 w-4 mr-1" />
                                  Publish
                                </>
                              )}
                            </button>
                          )}
                          
                          {/* Archive - only for published */}
                          {article.status === 'published' && (
                            <button
                              onClick={(e) => handleArchive(article.id, e)}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                              disabled={localLoading[article.id] || isLoading}
                            >
                              {localLoading[article.id] ? (
                                <>
                                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                                  Archiving...
                                </>
                              ) : (
                                <>
                                  <ArchiveBoxIcon className="h-4 w-4 mr-1" />
                                  Archive
                                </>
                              )}
                            </button>
                          )}
                          
                          {/* Restore - only for archived */}
                          {article.status === 'archived' && (
                            <button
                              onClick={(e) => handleRestore(article.id, e)}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              disabled={localLoading[article.id] || isLoading}
                            >
                              {localLoading[article.id] ? (
                                <>
                                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                                  Restoring...
                                </>
                              ) : (
                                <>
                                  <ArrowPathIcon className="h-4 w-4 mr-1" />
                                  Restore to Draft
                                </>
                              )}
                            </button>
                          )}
                          
                          {/* Delete - available for all states */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteArticle(article.id);
                            }}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            <TrashIcon className="h-4 w-4 mr-1" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
