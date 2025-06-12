'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { DocumentDto } from '@/app/api/documents';
import { documentsApi } from '@/app/api/documents';
import { PlusIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import ArticlesList from './ArticlesList';
import ArticlesToolbar from './ArticlesToolbar';

// Article interface that maps to DocumentDto from the backend
export interface Article {
  id: string; // uuid from DocumentDto
  title: string; // from meta.filename or meta.title
  status: string; // state from DocumentDto
  author: string; // from meta.author or user info
  category: string; // from meta.category or tags
  publishDate?: string; // from meta.publishDate
  views?: number; // from meta.views
  lastModified: string; // from updatedAt
  tags?: string[]; // document tags
}

export default function ArticlesManagement() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState<string | undefined>(undefined);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const { user } = useAuth();

  // Apply filters (search query and tags)
  const applyFilters = useCallback((
    articlesToFilter: Article[], 
    query: string, 
    tags: string[]
  ) => {
    let filtered = articlesToFilter;
    
    // Apply search query filter
    if (query) {
      filtered = filtered.filter(article => 
        article.title.toLowerCase().includes(query.toLowerCase()) ||
        article.author.toLowerCase().includes(query.toLowerCase()) ||
        article.category.toLowerCase().includes(query.toLowerCase())
      );
    }
    
    // Apply tags filter
    if (tags.length > 0) {
      filtered = filtered.filter(article => 
        tags.every(tag => article.tags?.includes(tag))
      );
    }
    
    setFilteredArticles(filtered);
  }, []);

  // Function to fetch articles from the backend
  const fetchArticles = useCallback(async () => {
    setIsLoading(true);
    try {
      const documents = await documentsApi.getAll(filterState);
      
      // Map DocumentDto to Article interface
      const mappedArticles = await Promise.all(documents.map(async (doc) => {
        const meta = doc.meta || {};
        // Fetch tags for each document
        const tags = await documentsApi.getDocumentTags(doc.uuid);
        
        return {
          id: doc.uuid,
          title: meta.title || meta.filename || 'Untitled Document',
          status: doc.state || 'draft',
          author: meta.author || (user ? user.email : 'Unknown'),
          category: meta.category || 'Uncategorized',
          publishDate: meta.publishDate,
          views: meta.views,
          lastModified: doc.updatedAt,
          tags: tags
        };
      }));
      
      setArticles(mappedArticles);
      
      // Extract all unique tags
      const allTags = Array.from(
        new Set(
          mappedArticles.flatMap(article => article.tags || [])
        )
      );
      setAvailableTags(allTags);
      
      // Apply filters
      applyFilters(mappedArticles, searchQuery, selectedTags);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filterState, searchQuery, selectedTags, user, applyFilters]);
  
  // Fetch articles on component mount and when filters change
  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  // Handle search query change
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    applyFilters(articles, query, selectedTags);
  };

  // Handle tag selection change
  const handleTagsChange = (tags: string[]) => {
    setSelectedTags(tags);
    applyFilters(articles, searchQuery, tags);
  };

  // Handle state filter change
  const handleStateFilterChange = (state: string | undefined) => {
    setFilterState(state);
  };

  // Handle refresh - fetch articles from backend
  const handleRefresh = () => {
    fetchArticles();
  };

  // Handle create new article
  const handleCreateArticle = () => {
    // Open in a new tab/window
    window.open('/articles/create', '_blank');
  };

  // Handle edit article
  const handleEditArticle = (id: string) => {
    // Open in a new tab/window
    window.open(`/articles/edit?id=${id}`, id || '_blank');
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

  // Handle article selection
  const handleArticleSelect = (article: Article) => {
    setSelectedArticle(article);
  };

  return (
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
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create New Article
              </button>
            </div>
          </div>
        </div>

        {/* Toolbar with filters */}
        <ArticlesToolbar 
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          filterState={filterState}
          onFilterStateChange={handleStateFilterChange}
          availableTags={availableTags}
          selectedTags={selectedTags}
          onTagsChange={handleTagsChange}
          onRefresh={handleRefresh}
          isLoading={isLoading}
        />

        {/* Main content */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <ArticlesList 
            articles={filteredArticles}
            selectedArticle={selectedArticle}
            onArticleSelect={handleArticleSelect}
            onEditArticle={handleEditArticle}
            onDeleteArticle={handleDeleteArticle}
            isLoading={isLoading}
            onRefresh={fetchArticles}
          />
        </div>
      </div>
    </div>
  );
}
