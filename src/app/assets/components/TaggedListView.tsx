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
