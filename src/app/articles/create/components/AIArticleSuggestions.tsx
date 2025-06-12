'use client';

import React, { useState } from 'react';
import { 
  DocumentTextIcon,
  DocumentDuplicateIcon,
  CheckIcon,
  ArrowPathIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { ArticlePlanningData } from './ArticlePlanningForm';

export interface AIGeneratedArticle {
  titles: string[];
  selectedTitle: string;
  outline: {
    heading: string;
    level: number;
    content?: string;
  }[];
  introduction: string;
  conclusion: string;
  tags: string[];
}

interface AIArticleSuggestionsProps {
  planningData: ArticlePlanningData;
  generatedArticle: AIGeneratedArticle;
  isLoading: boolean;
  onTitleSelect: (title: string) => void;
  onOutlineEdit: (outline: AIGeneratedArticle['outline']) => void;
  onRegenerateRequest: () => void;
  onAccept: (article: AIGeneratedArticle) => void;
  onBack: () => void;
}

export default function AIArticleSuggestions({
  planningData,
  generatedArticle,
  isLoading,
  onTitleSelect,
  onOutlineEdit,
  onRegenerateRequest,
  onAccept,
  onBack
}: AIArticleSuggestionsProps) {
  const [editingOutline, setEditingOutline] = useState(false);
  const [workingOutline, setWorkingOutline] = useState<AIGeneratedArticle['outline']>(generatedArticle.outline);
  
  const handleOutlineChange = (index: number, value: string) => {
    const newOutline = [...workingOutline];
    newOutline[index] = { ...newOutline[index], heading: value };
    setWorkingOutline(newOutline);
  };
  
  const handleAddSection = (afterIndex: number) => {
    const newOutline = [...workingOutline];
    const level = newOutline[afterIndex]?.level || 2;
    newOutline.splice(afterIndex + 1, 0, {
      heading: 'New Section',
      level: level
    });
    setWorkingOutline(newOutline);
  };
  
  const handleRemoveSection = (index: number) => {
    const newOutline = [...workingOutline];
    newOutline.splice(index, 1);
    setWorkingOutline(newOutline);
  };
  
  const saveOutlineChanges = () => {
    onOutlineEdit(workingOutline);
    setEditingOutline(false);
  };
  
  const cancelOutlineChanges = () => {
    setWorkingOutline(generatedArticle.outline);
    setEditingOutline(false);
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">AI-Generated Article Suggestions</h2>
        <p className="text-gray-600">
          Review and customize the AI-generated article structure before proceeding
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <ArrowPathIcon className="h-12 w-12 text-blue-500 animate-spin mb-4" />
          <p className="text-lg text-gray-600">Generating article suggestions...</p>
          <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Title suggestions */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Suggested Titles</h3>
            <div className="space-y-3">
              {generatedArticle.titles.map((title, index) => (
                <div 
                  key={index}
                  className={`flex items-center p-3 rounded-md cursor-pointer ${
                    title === generatedArticle.selectedTitle 
                      ? 'bg-blue-50 border border-blue-200' 
                      : 'hover:bg-gray-50 border border-gray-200'
                  }`}
                  onClick={() => onTitleSelect(title)}
                >
                  <DocumentTextIcon className="h-5 w-5 text-gray-500 mr-3" />
                  <span className="flex-grow">{title}</span>
                  {title === generatedArticle.selectedTitle && (
                    <CheckIcon className="h-5 w-5 text-blue-500" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Article outline */}
          <div className="border-b border-gray-200 pb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Article Structure</h3>
              {!editingOutline ? (
                <button
                  type="button"
                  onClick={() => setEditingOutline(true)}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Edit Structure
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={cancelOutlineChanges}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveOutlineChanges}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              {editingOutline ? (
                // Editable outline
                workingOutline.map((section, index) => (
                  <div key={index} className="border border-gray-200 rounded-md p-3">
                    <div className="flex items-center">
                      <div className="w-12 text-center text-gray-500">
                        {section.level === 2 ? 'H2' : section.level === 3 ? 'H3' : 'H4'}
                      </div>
                      <input
                        type="text"
                        value={section.heading}
                        onChange={(e) => handleOutlineChange(index, e.target.value)}
                        className="flex-grow border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveSection(index)}
                        className="ml-2 text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="mt-2 ml-12">
                      <button
                        type="button"
                        onClick={() => handleAddSection(index)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        + Add section after
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                // Read-only outline
                workingOutline.map((section, index) => (
                  <div 
                    key={index} 
                    className="border border-gray-200 rounded-md p-3"
                    style={{ marginLeft: `${(section.level - 2) * 20}px` }}
                  >
                    <div className="font-medium">
                      {section.heading}
                    </div>
                    {section.content && (
                      <div className="text-sm text-gray-500 mt-1">
                        {section.content}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Introduction preview */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Introduction</h3>
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-gray-700">{generatedArticle.introduction}</p>
            </div>
          </div>

          {/* Conclusion preview */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Conclusion</h3>
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-gray-700">{generatedArticle.conclusion}</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-between pt-4">
            <div>
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Back to Planning
              </button>
              <button
                type="button"
                onClick={onRegenerateRequest}
                className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <ArrowPathIcon className="h-4 w-4 mr-1" />
                Regenerate
              </button>
            </div>
            <button
              type="button"
              onClick={() => onAccept({
                ...generatedArticle,
                outline: workingOutline
              })}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Accept & Continue to Editor
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
