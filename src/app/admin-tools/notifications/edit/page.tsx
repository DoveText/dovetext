'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ChevronRightIcon,
  HomeIcon,
} from '@heroicons/react/24/outline';
import TemplateEditor from '../components/TemplateEditor';
import { notificationTemplatesApi, NotificationTemplate, TemplateUpdateRequest } from '@/app/admin-tools/api/notification-templates';

export default function EditTemplatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams?.get('id') || '';
  
  const [template, setTemplate] = useState<NotificationTemplate | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchTemplate();
    } else {
      setError('No template ID provided');
      setIsLoading(false);
    }
  }, [id]);

  const fetchTemplate = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!id) {
        setError('Invalid template ID');
        return;
      }
      
      const templateId = parseInt(id);
      if (isNaN(templateId)) {
        setError('Invalid template ID');
        return;
      }
      
      const data = await notificationTemplatesApi.getTemplateById(templateId);
      setTemplate(data);
    } catch (err) {
      console.error('Error fetching template:', err);
      setError('Failed to load template. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (values: TemplateUpdateRequest) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      if (!id) {
        setError('Invalid template ID');
        return;
      }
      
      const templateId = parseInt(id);
      if (isNaN(templateId)) {
        setError('Invalid template ID');
        return;
      }
      
      await notificationTemplatesApi.updateTemplate({
        ...values,
        id: templateId
      });
      
      router.push('/admin-tools/notifications');
    } catch (err) {
      console.error('Error updating template:', err);
      setError('Failed to update template. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin-tools/notifications');
  };

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
              <Link href="/admin-tools/notifications" className="ml-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ml-2">
                Notification Templates
              </Link>
            </div>
          </li>
          <li>
            <div className="flex items-center">
              <ChevronRightIcon className="w-4 h-4 text-gray-400" />
              <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">Edit Template</span>
            </div>
          </li>
        </ol>
      </nav>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {isLoading ? 'Loading Template...' : `Edit Template: ${template?.name}`}
        </h1>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="bg-white shadow rounded-lg p-6 flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      ) : template ? (
        <div className="bg-white shadow rounded-lg p-6">
          <TemplateEditor
            template={template}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
          />
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg p-6 text-center py-12">
          <p className="text-gray-500">Template not found.</p>
          <Link 
            href="/admin-tools/notifications" 
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Back to Templates
          </Link>
        </div>
      )}
    </div>
  );
}
