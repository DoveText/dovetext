'use client';

import { useState } from 'react';
import { HomeIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { EmailTemplates } from './templates';
import { EmailStatus } from './status';
import { EmailTesting } from './testing';

export default function EmailManagement() {
  const [activeTab, setActiveTab] = useState('templates');

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb Navigation */}
      <nav className="flex mb-6" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link href="/admin-tools" className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600">
              <HomeIcon className="w-4 h-4 mr-2" />
              Admin Tools
            </Link>
          </li>
          <li>
            <div className="flex items-center">
              <ChevronRightIcon className="w-4 h-4 text-gray-400" />
              <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">Email Management</span>
            </div>
          </li>
        </ol>
      </nav>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Email Management</h1>
      </div>
      
      {/* Tabs Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('templates')}
            className={`${activeTab === 'templates'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            aria-current={activeTab === 'templates' ? 'page' : undefined}
          >
            Email Templates
          </button>
          <button
            onClick={() => setActiveTab('status')}
            className={`${activeTab === 'status'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            aria-current={activeTab === 'status' ? 'page' : undefined}
          >
            Email Status
          </button>
          <button
            onClick={() => setActiveTab('testing')}
            className={`${activeTab === 'testing'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            aria-current={activeTab === 'testing' ? 'page' : undefined}
          >
            Email Testing
          </button>
        </nav>
      </div>
      
      {/* Tab Content */}
      <div className="bg-white shadow overflow-hidden rounded-lg">
        {activeTab === 'templates' && (
          <div className="p-0">
            <EmailTemplates />
          </div>
        )}
        
        {activeTab === 'status' && (
          <div className="p-0">
            <EmailStatus />
          </div>
        )}

        {activeTab === 'testing' && (
          <div className="p-0">
            <EmailTesting />
          </div>
        )}
      </div>
    </div>
  );
}
