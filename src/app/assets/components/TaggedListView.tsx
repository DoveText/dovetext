'use client';

import React from 'react';
import { TagIcon } from '@heroicons/react/24/outline';

interface TaggedItem {
  id: string;
  tags?: string[];
  [key: string]: any;
}

interface TaggedListViewProps<T extends TaggedItem> {
  items: T[];
  onItemSelect: (item: T) => void;
  selectedItem?: T | null;
  renderItemContent: (item: T) => React.ReactNode;
  emptyMessage?: string;
  className?: string;
}

export default function TaggedListView<T extends TaggedItem>({
  items,
  onItemSelect,
  selectedItem,
  renderItemContent,
  emptyMessage = "No items available",
  className = ""
}: TaggedListViewProps<T>) {
  return (
    <div className={`overflow-y-auto ${className}`}>
      {items.length > 0 ? (
        <ul className="divide-y divide-gray-200">
          {items.map((item) => (
            <li 
              key={item.id}
              onClick={() => onItemSelect(item)}
              className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                selectedItem?.id === item.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
              }`}
            >
              {renderItemContent(item)}
              
              {/* Tags section */}
              {item.tags && item.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  <TagIcon className="h-4 w-4 text-gray-400 mr-1" />
                  {item.tags.map((tag) => (
                    <span 
                      key={tag} 
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="py-8 text-center text-gray-500">
          {emptyMessage}
        </div>
      )}
    </div>
  );
}
