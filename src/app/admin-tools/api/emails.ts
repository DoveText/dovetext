/**
 * Emails API
 * Handles all API calls related to email management, including templates and status
 */
import { apiClient } from '@/app/api/client';

// Email template interfaces
export interface EmailTemplate {
  id: number;
  name: string;
  description: string;
  subject: string;
  bodyText: string;
  bodyHtml: string;
  variables: string[];
  createdAt: string;
  updatedAt: string;
}

export interface EmailTemplateCreateRequest {
  name: string;
  description: string;
  subject: string;
  bodyText: string;
  bodyHtml: string;
  variables: string[];
}

export interface EmailTemplateUpdateRequest extends Partial<EmailTemplateCreateRequest> {
  id: number;
}

// Email status interfaces
export interface EmailStatus {
  id: number;
  templateId: number;
  templateName: string;
  recipient: string;
  subject: string;
  status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed';
  sentAt: string;
  deliveredAt?: string;
  openedAt?: string;
  clickedAt?: string;
  bouncedAt?: string;
  failedAt?: string;
  failureReason?: string;
}

// Pagination and filter parameters
export interface EmailStatusParams {
  page?: number;
  size?: number;
  recipient?: string;
  subject?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

// Paginated response
export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number; // current page
  first: boolean;
  last: boolean;
}

// Emails API implementation
export const emailsApi = {
  /**
   * Get all email templates
   */
  async getAllTemplates(): Promise<EmailTemplate[]> {
    const { data } = await apiClient.get<EmailTemplate[]>('/api/v1/admin/emails/templates');
    return data;
  },

  /**
   * Get a template by ID
   */
  async getTemplateById(id: number): Promise<EmailTemplate> {
    const { data } = await apiClient.get<EmailTemplate>(`/api/v1/admin/emails/templates/${id}`);
    return data;
  },

  /**
   * Create a new template
   */
  async createTemplate(request: EmailTemplateCreateRequest): Promise<EmailTemplate> {
    const { data } = await apiClient.post<EmailTemplate>('/api/v1/admin/emails/templates', request);
    return data;
  },

  /**
   * Update an existing template
   */
  async updateTemplate(request: EmailTemplateUpdateRequest): Promise<EmailTemplate> {
    const { data } = await apiClient.put<EmailTemplate>(`/api/v1/admin/emails/templates/${request.id}`, request);
    return data;
  },

  /**
   * Delete a template
   */
  async deleteTemplate(id: number): Promise<void> {
    await apiClient.delete(`/api/v1/admin/emails/templates/${id}`);
  },

  /**
   * Test a template by sending a test email
   */
  async testTemplate(id: number, recipient: string, testData: Record<string, string> = {}): Promise<{ success: boolean; message: string }> {
    const { data } = await apiClient.post<{ success: boolean; message: string }>(
      `/api/v1/admin/emails/templates/${id}/test?recipient=${encodeURIComponent(recipient)}`, 
      testData
    );
    return data;
  },

  /**
   * Get email status with pagination and filtering
   */
  async getEmailStatus(params: EmailStatusParams = {}): Promise<PaginatedResponse<EmailStatus>> {
    // Build query string
    const queryParams = new URLSearchParams();
    
    if (params.page !== undefined) queryParams.append('page', params.page.toString());
    if (params.size !== undefined) queryParams.append('size', params.size.toString());
    if (params.recipient) queryParams.append('recipient', params.recipient);
    if (params.subject) queryParams.append('subject', params.subject);
    if (params.status) queryParams.append('status', params.status);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    
    const queryString = queryParams.toString();
    const url = `/api/v1/admin/emails/status${queryString ? `?${queryString}` : ''}`;
    
    const { data } = await apiClient.get<PaginatedResponse<EmailStatus>>(url);
    return data;
  },

  /**
   * Get email status details by ID
   */
  async getEmailStatusById(id: number): Promise<EmailStatus> {
    const { data } = await apiClient.get<EmailStatus>(`/api/v1/admin/emails/status/${id}`);
    return data;
  },

  /**
   * Resend a failed email
   */
  async resendEmail(id: number): Promise<{ success: boolean; message: string }> {
    const { data } = await apiClient.post<{ success: boolean; message: string }>(
      `/api/v1/admin/emails/status/${id}/resend`
    );
    return data;
  }
};
