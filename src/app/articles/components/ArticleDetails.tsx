'use client';

import React from 'react';
import { Article } from './ArticlesManagement';
import { 
  CalendarIcon, 
  UserIcon, 
  TagIcon, 
  DocumentTextIcon,
  EyeIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface ArticleDetailsProps {
  article: Article | null;
}

export default function ArticleDetails({ article }: ArticleDetailsProps) {
  if (!article) {
    return (
      <div className="h-full flex items-center justify-center p-8 bg-gray-50">
        <div className="text-center">
          <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No article selected</h3>
          <p className="mt-1 text-sm text-gray-500">
            Select an article to view its details
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full overflow-auto">
      <h2 className="text-xl font-bold text-gray-900 mb-4">{article.title}</h2>
      
      <div className="space-y-4">
        {/* Status */}
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
              ${article.status === 'published' ? 'bg-green-100 text-green-800' : 
                article.status === 'draft' ? 'bg-gray-100 text-gray-800' : 
                'bg-yellow-100 text-yellow-800'}`}>
              {article.status.charAt(0).toUpperCase() + article.status.slice(1)}
            </span>
          </div>
        </div>
        
        {/* Author */}
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <UserIcon className="h-5 w-5 text-gray-400" />
          </div>
          <div className="ml-3 text-sm text-gray-500">
            <span className="font-medium text-gray-900">Author:</span> {article.author}
          </div>
        </div>
        
        {/* Category */}
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <DocumentTextIcon className="h-5 w-5 text-gray-400" />
          </div>
          <div className="ml-3 text-sm text-gray-500">
            <span className="font-medium text-gray-900">Category:</span> {article.category}
          </div>
        </div>
        
        {/* Publish Date */}
        {article.publishDate && (
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <CalendarIcon className="h-5 w-5 text-gray-400" />
            </div>
            <div className="ml-3 text-sm text-gray-500">
              <span className="font-medium text-gray-900">Published:</span> {new Date(article.publishDate).toLocaleDateString()}
            </div>
          </div>
        )}
        
        {/* Views */}
        {article.views !== undefined && (
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <EyeIcon className="h-5 w-5 text-gray-400" />
            </div>
            <div className="ml-3 text-sm text-gray-500">
              <span className="font-medium text-gray-900">Views:</span> {article.views}
            </div>
          </div>
        )}
        
        {/* Last Modified */}
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <ClockIcon className="h-5 w-5 text-gray-400" />
          </div>
          <div className="ml-3 text-sm text-gray-500">
            <span className="font-medium text-gray-900">Last Modified:</span> {new Date(article.lastModified).toLocaleDateString()}
          </div>
        </div>
        
        {/* Tags */}
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <TagIcon className="h-5 w-5 text-gray-400" />
          </div>
          <div className="ml-3">
            <span className="text-sm font-medium text-gray-900">Tags:</span>
            <div className="mt-1 flex flex-wrap gap-2">
              {article.tags && article.tags.length > 0 ? (
                article.tags.map((tag, index) => (
                  <span 
                    key={index} 
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {tag}
                  </span>
                ))
              ) : (
                <span className="text-sm text-gray-500">No tags</span>
              )}
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="pt-4 border-t border-gray-200 mt-6">
          <div className="flex space-x-3">
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              View Content
            </button>
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
