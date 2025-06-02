'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  DocumentTextIcon, 
  FolderIcon, 
  ArrowRightIcon, 
  ChartBarIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';
import ChatInput from '@/components/common/ChatInput';

// Mock data interfaces
interface BusinessStats {
  totalArticles: number;
  publishedArticles: number;
  totalAssets: number;
  activeUsers: number;
  revenue: number;
}

interface Article {
  id: string;
  title: string;
  status: 'draft' | 'published' | 'scheduled';
  author: string;
  publishDate?: string;
  views?: number;
}

interface Asset {
  id: string;
  name: string;
  type: string;
  size: string;
  lastModified: string;
}

export default function BusinessDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  
  // Time range options for stats
  const timeRanges = [
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' }
  ];
  
  // Selected time range state
  const [selectedTimeRange, setSelectedTimeRange] = useState<'today' | 'week' | 'month'>('week');
  // Local state for date range label
  const [dateRangeLabel, setDateRangeLabel] = useState('');
  
  // Mock business stats
  const [businessStats, setBusinessStats] = useState<BusinessStats>({
    totalArticles: 24,
    publishedArticles: 18,
    totalAssets: 87,
    activeUsers: 12,
    revenue: 4250
  });
  
  // Mock recent articles
  const [recentArticles, setRecentArticles] = useState<Article[]>([
    {
      id: '1',
      title: 'How AI is Transforming Content Creation',
      status: 'published',
      author: 'Jane Smith',
      publishDate: '2023-05-15',
      views: 1245
    },
    {
      id: '2',
      title: 'The Future of Digital Marketing in 2024',
      status: 'published',
      author: 'John Doe',
      publishDate: '2023-05-10',
      views: 980
    },
    {
      id: '3',
      title: 'Best Practices for SEO Optimization',
      status: 'draft',
      author: 'Sarah Johnson'
    },
    {
      id: '4',
      title: 'Content Strategy for B2B Companies',
      status: 'scheduled',
      author: 'Michael Brown',
      publishDate: '2023-06-01'
    }
  ]);
  
  // Mock recent assets
  const [recentAssets, setRecentAssets] = useState<Asset[]>([
    {
      id: '1',
      name: 'Q1 Marketing Report.pdf',
      type: 'PDF',
      size: '2.4 MB',
      lastModified: '2023-05-12'
    },
    {
      id: '2',
      name: 'Company Logo.png',
      type: 'Image',
      size: '156 KB',
      lastModified: '2023-05-08'
    },
    {
      id: '3',
      name: 'Product Demo Video.mp4',
      type: 'Video',
      size: '18.7 MB',
      lastModified: '2023-05-05'
    }
  ]);
  
  // Simulate fetching data based on time range
  useEffect(() => {
    // Simulate API call with different data based on time range
    const fetchBusinessStats = () => {
      // Calculate date range for display
      const today = new Date();
      let startDate = new Date();
      let dateLabel = '';
      
      if (selectedTimeRange === 'today') {
        startDate = new Date(today.setHours(0, 0, 0, 0));
        dateLabel = `${startDate.toLocaleDateString()} - ${new Date().toLocaleDateString()}`;
        
        // Simulate lower numbers for "today" only
        setBusinessStats({
          totalArticles: 3,
          publishedArticles: 1,
          totalAssets: 5,
          activeUsers: 8,
          revenue: 450
        });
      } 
      else if (selectedTimeRange === 'week') {
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        dateLabel = `${startDate.toLocaleDateString()} - ${new Date().toLocaleDateString()}`;
        
        // Default stats for week
        setBusinessStats({
          totalArticles: 24,
          publishedArticles: 18,
          totalAssets: 87,
          activeUsers: 12,
          revenue: 4250
        });
      } 
      else if (selectedTimeRange === 'month') {
        startDate = new Date(today);
        startDate.setMonth(today.getMonth() - 1);
        dateLabel = `${startDate.toLocaleDateString()} - ${new Date().toLocaleDateString()}`;
        
        // Higher numbers for month view
        setBusinessStats({
          totalArticles: 42,
          publishedArticles: 36,
          totalAssets: 124,
          activeUsers: 18,
          revenue: 12750
        });
      }
      
      setDateRangeLabel(dateLabel);
    };
    
    fetchBusinessStats();
  }, [selectedTimeRange]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Section with Business Profile Status */}
        <div className="bg-white shadow rounded-lg p-4 sm:p-6 mb-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome to Business Dashboard, {user?.displayName || user?.email?.split('@')[0] || 'User'}
              </h1>
              <p className="text-gray-600 mt-2">Here&apos;s your business performance overview</p>
            </div>
            <div className="mt-4 md:mt-0">
              <div className="flex items-center space-x-4">
                <div className="bg-blue-50 p-2 rounded-md inline-block">
                  <p className="text-sm font-medium text-blue-800">Business Account</p>
                </div>
                <div className="flex space-x-2 text-sm">
                  {timeRanges.map(range => (
                    <button
                      key={range.id}
                      onClick={() => setSelectedTimeRange(range.id as 'today' | 'week' | 'month')}
                      className={`px-3 py-1 rounded-md ${
                        selectedTimeRange === range.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1 text-right">
                {dateRangeLabel}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 mt-4 sm:mt-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-500">Total Articles</p>
              <p className="text-2xl font-bold text-blue-600">{businessStats.totalArticles}</p>
              <p className="text-xs text-gray-500 mt-1">All content pieces</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-500">Published</p>
              <p className="text-2xl font-bold text-green-600">{businessStats.publishedArticles}</p>
              <p className="text-xs text-gray-500 mt-1">Live articles</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-500">Assets</p>
              <p className="text-2xl font-bold text-purple-600">{businessStats.totalAssets}</p>
              <p className="text-xs text-gray-500 mt-1">Files & media</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-500">Active Users</p>
              <p className="text-2xl font-bold text-yellow-600">{businessStats.activeUsers}</p>
              <p className="text-xs text-gray-500 mt-1">Team members</p>
            </div>
            <div className="bg-indigo-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-500">Revenue</p>
              <p className="text-2xl font-bold text-indigo-600">${businessStats.revenue}</p>
              <p className="text-xs text-gray-500 mt-1">Period total</p>
            </div>
          </div>
          
          {/* Business Performance Chart - Placeholder */}
          <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <div className="flex items-center mb-4">
              <ChartBarIcon className="h-5 w-5 text-gray-500 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Performance Overview</h3>
            </div>
            <div className="h-64 flex items-center justify-center">
              <p className="text-gray-500">Business performance chart would appear here</p>
            </div>
          </div>
          
          {/* Chat Input Box - After Stats */}
          <ChatInput 
            className="mt-6"
            placeholder="Ask about your business metrics or content performance..."
            hintText="Press Enter to submit"
            onSubmit={() => {}}
            dispatchEvent={true}
            eventName="triggerChatBubble"
          />
        </div>

        {/* Recent Articles Card */}
        <div className="bg-white shadow rounded-lg p-4 sm:p-6 mb-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <DocumentTextIcon className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold">Recent Articles</h2>
            </div>
            <Link 
              href="/articles"
              className="text-blue-600 hover:text-blue-800 flex items-center text-sm font-medium"
            >
              View All
              <ArrowRightIcon className="h-4 w-4 ml-1" />
            </Link>
          </div>
          
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
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Views
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentArticles.map((article) => (
                  <tr key={article.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <DocumentDuplicateIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <div className="text-sm font-medium text-gray-900">{article.title}</div>
                      </div>
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
                      {article.publishDate ? new Date(article.publishDate).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {article.views || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Recent Assets Card */}
        <div className="bg-white shadow rounded-lg p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <FolderIcon className="h-6 w-6 text-purple-600 mr-2" />
              <h2 className="text-xl font-semibold">Recent Assets</h2>
            </div>
            <Link 
              href="/assets"
              className="text-blue-600 hover:text-blue-800 flex items-center text-sm font-medium"
            >
              View All
              <ArrowRightIcon className="h-4 w-4 ml-1" />
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Modified
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">{asset.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        {asset.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {asset.size}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(asset.lastModified).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
