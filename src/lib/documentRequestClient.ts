import { apiClient, ApiResponse } from './apiClient';

export interface DocumentRequest {
  id: number;
  userId: number;
  societyId: number;
  documentType: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'processed' | 'completed' | 'completed_by_admin' | 'user_confirmed' | 'user_issue';
  adminRemarks: string;
  userRemarks?: string;
  fileUrl: string;
  fileKey: string;
  created_at: string;
  updated_at: string;
  requester?: {
    username: string;
    email: string;
    phone: string;
  };
}

export async function createDocumentRequest(data: { documentType: string; description?: string }): Promise<ApiResponse<DocumentRequest>> {
  return apiClient('/document-requests', {
    method: 'POST',
    body: data,
    withAuth: true,
  });
}

export async function getDocumentRequests(): Promise<ApiResponse<DocumentRequest[]>> {
  return apiClient('/document-requests', {
    method: 'GET',
    withAuth: true,
  });
}

export async function updateDocumentRequest(id: number, data: FormData): Promise<ApiResponse<DocumentRequest>> {
  return apiClient(`/document-requests/${id}/status`, {
    method: 'PUT',
    body: data,
    withAuth: true,
  });
}

export async function getDocumentDownloadUrl(id: number): Promise<ApiResponse<{ url: string }>> {
  return apiClient(`/document-requests/${id}/download`, {
    method: 'GET',
    withAuth: true,
  });
}
