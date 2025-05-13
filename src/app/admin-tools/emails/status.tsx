'use client';

import { useState, useEffect } from 'react';
import { ArrowPathIcon, EnvelopeIcon, XMarkIcon, MagnifyingGlassIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { emailsApi, EmailStatus as EmailStatusType, EmailStatusParams } from '../api/emails';
import { EmailTestDialog } from './components/EmailTestDialog';

// Using the EmailStatus interface from the API file

export function EmailStatus() {
  const [emails, setEmails] = useState<EmailStatusType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [recipientFilter, setRecipientFilter] = useState<string>('');
  const [subjectFilter, setSubjectFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [testTemplateId, setTestTemplateId] = useState<number | undefined>(undefined);
  const [testRecipient, setTestRecipient] = useState<string>('');

  // Fetch emails on component mount and when filters or pagination changes
  useEffect(() => {
    fetchEmails();
  }, [statusFilter, recipientFilter, subjectFilter, currentPage, pageSize]);

  const fetchEmails = async () => {
    setIsLoading(true);
    try {
      const params: EmailStatusParams = {
        page: currentPage,
        size: pageSize,
        status: statusFilter || undefined,
        recipient: recipientFilter || undefined,
        subject: subjectFilter || undefined
      };
      
      const response = await emailsApi.getEmailStatus(params);
      setEmails(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (error) {
      console.error('Error fetching emails:', error);
      showToast('Error', 'Failed to load emails', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Simple toast function to replace the imported toast component
  const showToast = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    console.log(`${title}: ${message}`);
    // In a real implementation, you might want to use a proper toast notification library
    // or implement a custom toast component
    const toastClasses = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      info: 'bg-blue-500'
    };
    
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 p-4 rounded shadow-lg text-white ${toastClasses[type]} z-50`;
    toast.innerHTML = `<h4 class="font-bold">${title}</h4><p>${message}</p>`;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  };

  const handleResendEmail = async (email: EmailStatusType) => {
    // Find the template ID for this email
    const templateId = email.templateId;
    
    // Set the test dialog parameters
    setTestTemplateId(templateId);
    setTestRecipient(email.recipient);
    setIsTestDialogOpen(true);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  // Handle filter change
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'recipient') {
      setRecipientFilter(value);
    } else if (name === 'subject') {
      setSubjectFilter(value);
    }
    // Reset to first page when filters change
    setCurrentPage(0);
  };

  // Handle status filter change
  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setCurrentPage(0);
  };
  
  // Clear all filters
  const clearFilters = () => {
    setStatusFilter('');
    setRecipientFilter('');
    setSubjectFilter('');
    setCurrentPage(0);
  };

  // Generate pagination items
  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    
    // Calculate range of pages to show
    let startPage = Math.max(0, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 1);
    
    // Adjust if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(0, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <li key={i} className="inline-block">
          <button
            onClick={() => handlePageChange(i)}
            className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
              i === currentPage
                ? 'bg-blue-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
            }`}
          >
            {i + 1}
          </button>
        </li>
      );
    }
    
    return items;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      sent: 'bg-blue-100 text-blue-800',
      delivered: 'bg-green-100 text-green-800',
      opened: 'bg-purple-100 text-purple-800',
      clicked: 'bg-indigo-100 text-indigo-800',
      bounced: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      default: 'bg-gray-100 text-gray-800'
    };
    
    const badgeClass = statusClasses[status as keyof typeof statusClasses] || statusClasses.default;
    
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeClass}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Email Status</h2>
      </div>
      
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label htmlFor="recipient" className="block text-sm font-medium text-gray-700">
              Recipient
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <EnvelopeIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="recipient"
                name="recipient"
                value={recipientFilter}
                onChange={handleFilterChange}
                placeholder="Filter by recipient"
                className="pl-10 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
              Subject
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="subject"
                name="subject"
                value={subjectFilter}
                onChange={handleFilterChange}
                placeholder="Filter by subject"
                className="pl-10 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={statusFilter}
              onChange={handleStatusFilterChange}
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
            >
              <option value="">All Statuses</option>
              <option value="sent">Sent</option>
              <option value="delivered">Delivered</option>
              <option value="opened">Opened</option>
              <option value="clicked">Clicked</option>
              <option value="bounced">Bounced</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
        
        <div className="flex justify-end space-x-2">
          <button 
            onClick={clearFilters}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Template</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipient</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sent At</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {emails.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                      No emails found
                    </td>
                  </tr>
                ) : (
                  emails.map((email) => (
                    <tr key={email.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{email.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{email.templateName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{email.recipient}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{email.subject}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {getStatusBadge(email.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {email.sentAt ? formatDate(email.sentAt) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          {email.status === 'failed' && (
                            <button 
                              onClick={() => handleResendEmail(email)}
                              className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              title="Resend Email"
                            >
                              <ArrowPathIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            
            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{emails.length}</span> of{' '}
                    <span className="font-medium">{totalElements}</span> emails
                  </p>
                </div>
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(Math.max(0, currentPage - 1))}
                      disabled={currentPage === 0}
                      className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                        currentPage === 0 ? 'cursor-not-allowed opacity-50' : ''
                      }`}
                    >
                      <span className="sr-only">Previous</span>
                      <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                    
                    {renderPaginationItems()}
                    
                    <button
                      onClick={() => handlePageChange(Math.min(totalPages - 1, currentPage + 1))}
                      disabled={currentPage === totalPages - 1}
                      className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                        currentPage === totalPages - 1 ? 'cursor-not-allowed opacity-50' : ''
                      }`}
                    >
                      <span className="sr-only">Next</span>
                      <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Test Dialog */}
      <EmailTestDialog 
        isOpen={isTestDialogOpen}
        onClose={() => setIsTestDialogOpen(false)}
        initialTemplateId={testTemplateId}
        initialRecipient={testRecipient}
      />
    </div>
  );
}
