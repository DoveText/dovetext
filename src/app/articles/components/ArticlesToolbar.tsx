'use client';

import React from 'react';
import { 
  MagnifyingGlassIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import TaggedSelect, { TaggedSelectOption } from '@/components/common/TaggedSelect';

interface ArticlesToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterState: string | undefined;
  onFilterStateChange: (state: string | undefined) => void;
  availableTags: string[];
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export default function ArticlesToolbar({
  searchQuery,
  onSearchChange,
  filterState,
  onFilterStateChange,
  availableTags,
  selectedTags,
  onTagsChange,
  onRefresh,
  isLoading
}: ArticlesToolbarProps) {
  // Define state filter options
  const stateOptions: TaggedSelectOption<string>[] = [
    { value: 'all', label: 'All' },
    { value: 'draft', label: 'Draft' },
    { value: 'published', label: 'Published' },
    { value: 'archived', label: 'Archived' }
  ];

  // Convert available tags to TaggedSelectOption format
  const tagOptions: TaggedSelectOption<string>[] = availableTags.map(tag => ({
    value: tag,
    label: tag
  }));

  // Handle state filter change
  const handleStateChange = (value: string | string[]) => {
    const state = Array.isArray(value) ? value[0] : value;
    onFilterStateChange(state === 'all' ? undefined : state);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-center md:space-x-4 w-full">
          {/* State filter */}
          <div className="w-full md:w-48 flex-shrink-0">
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <TaggedSelect
              value={filterState || 'all'}
              onChange={handleStateChange}
              options={stateOptions}
              placeholder="Select status"
              multiple={false}
            />
          </div>
          
          {/* Tags filter */}
          <div className="w-full md:w-64 flex-shrink-0">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
            <TaggedSelect
              value={selectedTags}
              onChange={onTagsChange}
              options={tagOptions}
              placeholder="Filter by tags"
              multiple={true}
              editable={true}
            />
          </div>
          
          {/* Search box - takes all remaining space */}
          <div className="w-full flex-grow">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type="text"
                name="search"
                id="search"
                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md h-10"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
          </div>
        </div>
        
        {/* Refresh button */}
        <div className="flex-shrink-0 ml-4">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed h-10"
          >
            <ArrowPathIcon className={`h-5 w-5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}
