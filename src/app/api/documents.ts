import { apiClient } from './client';

// Types for documents API
export interface DocumentDto {
  id: number;
  userId: number;
  uuid: string;
  meta: {
    filename?: string;
    contentType?: string;
    description?: string;
    [key: string]: any;
  };
  state: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Documents API client
 */
export const documentsApi = {
  /**
   * Get all documents for the current user
   * @param state Optional state to filter by (e.g., 'draft', 'published', etc.)
   * @returns Array of documents
   */
  getAll: async (state?: string): Promise<DocumentDto[]> => {
    const params = state ? { state } : {};
    const { data } = await apiClient.get<DocumentDto[]>('/api/v1/documents', { params });
    return data || [];
  },

  /**
   * Get a specific document by UUID
   * @param documentId The UUID of the document
   * @returns The document
   */
  getDocument: async (documentId: string): Promise<DocumentDto> => {
    const { data } = await apiClient.get<DocumentDto>(`/api/v1/documents/${encodeURIComponent(documentId)}`);
    return data;
  },

  /**
   * Create a new document
   * @param file The file to upload
   * @param metadata Optional metadata for the document
   * @param state Optional initial state for the document (defaults to 'draft')
   * @returns The created document
   */
  createDocument: async (
    file: File,
    metadata?: Record<string, any>,
    state: string = 'draft'
  ): Promise<DocumentDto> => {
    const formData = new FormData();
    formData.append('file', file);
    
    if (metadata) {
      formData.append('meta', JSON.stringify(metadata));
    }
    
    if (state) {
      formData.append('state', state);
    }
    
    const { data } = await apiClient.post<DocumentDto>(
      '/api/v1/documents',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    return data;
  },

  /**
   * Update an existing document
   * @param documentId The UUID of the document to update
   * @param updates The updates to apply (metadata, file, and/or state)
   * @returns The updated document
   */
  updateDocument: async (
    documentId: string, 
    updates: { meta?: Record<string, any>, file?: File, state?: string }
  ): Promise<DocumentDto> => {
    const formData = new FormData();
    
    // Add file if provided
    if (updates.file) {
      formData.append('file', updates.file);
    }
    
    // Add metadata if provided
    if (updates.meta) {
      formData.append('meta', JSON.stringify(updates.meta));
    }
    
    // Add state if provided
    if (updates.state) {
      formData.append('state', updates.state);
    }
    
    const { data } = await apiClient.put<DocumentDto>(
      `/api/v1/documents/${encodeURIComponent(documentId)}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    return data;
  },

  /**
   * Get the content of a document
   * @param documentId The UUID of the document
   * @returns The document content as a Blob
   */
  getDocumentContent: async (documentId: string): Promise<Blob> => {
    const { data } = await apiClient.get<Blob>(
      `/api/v1/documents/${encodeURIComponent(documentId)}/content`,
      { responseType: 'blob' }
    );
    return data;
  },

  /**
   * Get the content URL of a document
   * @param documentId The UUID of the document
   * @returns URL to the document content
   */
  getDocumentContentUrl: (documentId: string): string => {
    return `${apiClient.defaults.baseURL}/api/v1/documents/${encodeURIComponent(documentId)}/content`;
  },

  /**
   * Delete a document (soft delete)
   * @param documentId The UUID of the document to delete
   */
  deleteDocument: async (documentId: string): Promise<void> => {
    await apiClient.delete(`/api/v1/documents/${encodeURIComponent(documentId)}`);
  },

  /**
   * Get all tags for a document
   * @param documentId The UUID of the document
   * @returns Array of tags
   */
  getDocumentTags: async (documentId: string): Promise<string[]> => {
    const { data } = await apiClient.get<string[]>(`/api/v1/documents/${encodeURIComponent(documentId)}/tags`);
    return data || [];
  },

  /**
   * Add a tag to a document
   * @param documentId The UUID of the document
   * @param tag The tag to add
   */
  addTagToDocument: async (documentId: string, tag: string): Promise<void> => {
    await apiClient.post(`/api/v1/documents/${encodeURIComponent(documentId)}/tags/${encodeURIComponent(tag)}`);
  },

  /**
   * Remove a tag from a document
   * @param documentId The UUID of the document
   * @param tag The tag to remove
   */
  removeTagFromDocument: async (documentId: string, tag: string): Promise<void> => {
    await apiClient.delete(`/api/v1/documents/${encodeURIComponent(documentId)}/tags/${encodeURIComponent(tag)}`);
  }
};
