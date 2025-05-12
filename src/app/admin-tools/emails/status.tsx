'use client';

import { useState, useEffect } from 'react';
import { 
  Button, 
  Card, 
  CardContent, 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow,
  Badge,
  Input,
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  toast
} from '@/components/ui';
import { ArrowPathIcon, EnvelopeIcon, XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { emailsApi, EmailStatus as EmailStatusType, EmailStatusParams, PaginatedResponse } from '../api/emails';

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
      toast({
        title: 'Error',
        description: 'Failed to load emails',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async (id: number) => {
    try {
      const result = await emailsApi.resendEmail(id);
      
      toast({
        title: result.success ? 'Success' : 'Error',
        description: result.message,
        variant: result.success ? 'default' : 'destructive'
      });
      
      fetchEmails();
    } catch (error: any) {
      console.error('Error resending email:', error);
      toast({
        title: 'Error',
        description: `Failed to resend email: ${error.message || 'Unknown error'}`,
        variant: 'destructive'
      });
    }
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
        <PaginationItem key={i}>
          <PaginationLink 
            isActive={currentPage === i}
            onClick={() => handlePageChange(i)}
          >
            {i + 1}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    return items;
  };



  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'sent':
        return <Badge variant="outline">Sent</Badge>;
      case 'delivered':
        return <Badge variant="success">Delivered</Badge>;
      case 'opened':
        return <Badge variant="success">Opened</Badge>;
      case 'clicked':
        return <Badge variant="success">Clicked</Badge>;
      case 'bounced':
        return <Badge variant="destructive">Bounced</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div>
      <div className="flex flex-col space-y-4 mb-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Email Status</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Input
              name="recipient"
              placeholder="Filter by recipient"
              value={recipientFilter}
              onChange={handleFilterChange}
              className="w-full"
            />
          </div>
          
          <div>
            <Input
              name="subject"
              placeholder="Filter by subject"
              value={subjectFilter}
              onChange={handleFilterChange}
              className="w-full"
            />
          </div>
          
          <div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="opened">Opened</SelectItem>
                <SelectItem value="clicked">Clicked</SelectItem>
                <SelectItem value="bounced">Bounced</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={clearFilters}>
            Clear Filters
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p>Loading emails...</p>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emails.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      No emails found
                    </TableCell>
                  </TableRow>
                ) : (
                  emails.map((email) => (
                    <TableRow key={email.id}>
                      <TableCell>{email.id}</TableCell>
                      <TableCell>{email.templateName}</TableCell>
                      <TableCell>{email.recipient}</TableCell>
                      <TableCell>{email.subject}</TableCell>
                      <TableCell>{getStatusBadge(email.status)}</TableCell>
                      <TableCell>{email.sentAt ? formatDate(email.sentAt) : '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          {email.status === 'failed' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleResendEmail(email.id)}
                              title="Resend Email"
                            >
                              <ArrowPathIcon className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            
            {/* Pagination */}
            <div className="flex items-center justify-between space-x-6 py-4">
              <div className="text-sm text-muted-foreground">
                Showing {emails.length} of {totalElements} emails
              </div>
              
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => handlePageChange(Math.max(0, currentPage - 1))}
                      disabled={currentPage === 0} 
                    />
                  </PaginationItem>
                  
                  {renderPaginationItems()}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => handlePageChange(Math.min(totalPages - 1, currentPage + 1))}
                      disabled={currentPage === totalPages - 1} 
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
