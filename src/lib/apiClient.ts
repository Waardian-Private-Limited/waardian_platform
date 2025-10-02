const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface RequestOptions {
  method?: Method;
  body?: any; // JSON or FormData
  headers?: Record<string, string>;
  params?: Record<string, string>;
  withAuth?: boolean; // Adds Authorization header from localStorage
}

export async function apiClient<T = any>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    method = 'GET',
    body,
    headers = {},
    params,
    withAuth = false,
  } = options;

  const query = params ? `?${new URLSearchParams(params).toString()}` : '';
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  const allHeaders: Record<string, string> = {
    ...headers,
  };

  if (withAuth) {
    const token = localStorage.getItem('token');
    if (token) {
      allHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  if (!isFormData) {
    allHeaders['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${BASE_URL}${path}${query}`, {
    method,
    credentials: 'include', // ensures cookies work across domains
    headers: allHeaders,
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let errorMsg = 'Request failed';
    try {
      const errData = await res.json();
      errorMsg = errData.message || JSON.stringify(errData);
    } catch {
      errorMsg = await res.text();
    }
    throw new Error(errorMsg || `Request failed with status ${res.status}`);
  }

  return res.json();
}

// Multi-account interfaces
export interface Account {
  id: string;
  username: string;
  email: string;
  phone: string;
  userType: string;
  societyId: string;
  societyName: string | null;
  flatNumber: string | null;
  wingName: string | null;
  status: string;
}

export interface CheckAccountsResponse {
  message: string;
  accounts?: Account[];
  account?: Account;
  detail?: string;
  error?: string;
}

export interface OtpVerificationResponse {
  success: boolean;
  message?: string;
  detail?: string;
  role?: string;
  user?: {
    id: string;
    email: string;
    societyId: string;
    name?: string;
  };
  accounts?: Account[];
  error?: string;
}

// Check accounts for multi-account login
export async function checkAccounts(email?: string, phone?: string): Promise<CheckAccountsResponse> {
  try {
    const response = await apiClient<CheckAccountsResponse>('/auth/check-web-accounts', {
      method: 'POST',
      body: { email, phone },
    });
    return response;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to check accounts');
  }
}

// Login with selected account
export async function loginWithAccount(accountId: string, password: string): Promise<any> {
  try {
    const response = await apiClient('/auth/weblogin', {
      method: 'POST',
      body: { accountId, password },
    });
    return response;
  } catch (error: any) {
    throw new Error(error.message || 'Login failed');
  }
}

// Send OTP for selected account
export async function sendWebOtp(accountId: string): Promise<any> {
  try {
    const response = await apiClient('/auth/send-web-otp', {
      method: 'POST',
      body: { accountId },
    });
    return response;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to send OTP');
  }
}

// Amenity Management API Functions
export async function getAmenityBookingAnalytics(params?: {
  dateRange?: string;
  amenityId?: string;
}): Promise<any> {
  try {
    const response = await apiClient('/amenities/booking-analytics', {
      method: 'GET',
      params,
      withAuth: true,
    });
    return response;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch amenity analytics');
  }
}

export async function storeBookingInMySQL(bookingData: any): Promise<any> {
  try {
    const response = await apiClient('/amenities/store-booking-mysql', {
      method: 'POST',
      body: bookingData,
      withAuth: true,
    });
    return response;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to store booking in MySQL');
  }
}

export async function getAmenityBookings(params?: {
  page?: number;
  limit?: number;
  status?: string;
  amenityId?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<any> {
  try {
    const queryParams: Record<string, string> = {};
    if (params) {
      if (params.page !== undefined) queryParams.page = params.page.toString();
      if (params.limit !== undefined) queryParams.limit = params.limit.toString();
      if (params.status) queryParams.status = params.status;
      if (params.amenityId) queryParams.amenityId = params.amenityId;
      if (params.dateFrom) queryParams.dateFrom = params.dateFrom;
      if (params.dateTo) queryParams.dateTo = params.dateTo;
    }
    
    const response = await apiClient('/amenities/bookings', {
      method: 'GET',
      params: queryParams,
      withAuth: true,
    });
    return response;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch amenity bookings');
  }
}

// Ledger API Functions
export async function getLedgerDashboardStats(params?: {
  startDate?: string;
  endDate?: string;
  financialCycle?: string;
}): Promise<any> {
  try {
    const response = await apiClient('/ledger/dashboard/stats', {
      method: 'GET',
      params,
      withAuth: true,
    });
    return response;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch ledger dashboard stats');
  }
}

export async function getLedgerChartData(params?: {
  period?: string;
  type?: string;
}): Promise<any> {
  try {
    const response = await apiClient('/ledger/dashboard/charts', {
      method: 'GET',
      params,
      withAuth: true,
    });
    return response;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch ledger chart data');
  }
}

export async function getLedgerRecentTransactions(params?: {
  limit?: number;
}): Promise<any> {
  try {
    const queryParams: Record<string, string> = {};
    if (params?.limit !== undefined) queryParams.limit = params.limit.toString();
    
    const response = await apiClient('/ledger/dashboard/recent-transactions', {
      method: 'GET',
      params: queryParams,
      withAuth: true,
    });
    return response;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch recent transactions');
  }
}

export async function getLedgerFinancialSummary(params?: {
  financialCycle?: string;
}): Promise<any> {
  try {
    const response = await apiClient('/ledger/dashboard/financial-summary', {
      method: 'GET',
      params,
      withAuth: true,
    });
    return response;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch financial summary');
  }
}

export async function getAllLedgerTransactions(params?: {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
  type?: string;
  category?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  financialCycle?: string;
  paymentMethod?: string;
}): Promise<any> {
  try {
    const queryParams: Record<string, string> = {};
    if (params) {
      if (params.page !== undefined) queryParams.page = params.page.toString();
      if (params.limit !== undefined) queryParams.limit = params.limit.toString();
      if (params.sortBy) queryParams.sortBy = params.sortBy;
      if (params.sortOrder) queryParams.sortOrder = params.sortOrder;
      if (params.type) queryParams.type = params.type;
      if (params.category) queryParams.category = params.category;
      if (params.status) queryParams.status = params.status;
      if (params.startDate) queryParams.startDate = params.startDate;
      if (params.endDate) queryParams.endDate = params.endDate;
      if (params.financialCycle) queryParams.financialCycle = params.financialCycle;
      if (params.paymentMethod) queryParams.paymentMethod = params.paymentMethod;
    }
    
    const response = await apiClient('/ledger/transactions', {
      method: 'GET',
      params: queryParams,
      withAuth: true,
    });
    return response;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch ledger transactions');
  }
}

export async function searchLedgerTransactions(params: {
  query: string;
  limit?: number;
}): Promise<any> {
  try {
    const queryParams: Record<string, string> = { query: params.query };
    if (params.limit !== undefined) queryParams.limit = params.limit.toString();
    
    const response = await apiClient('/ledger/transactions/search', {
      method: 'GET',
      params: queryParams,
      withAuth: true,
    });
    return response;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to search transactions');
  }
}

export async function exportLedgerToPDF(filters: any): Promise<Blob> {
  try {
    const response = await fetch(`${BASE_URL}/ledger/export/pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      credentials: 'include',
      body: JSON.stringify({ filters }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to export PDF');
    }
    
    return response.blob();
  } catch (error: any) {
    throw new Error(error.message || 'Failed to export ledger to PDF');
  }
}

export async function exportLedgerToExcel(filters: any): Promise<Blob> {
  try {
    const response = await fetch(`${BASE_URL}/ledger/export/excel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      credentials: 'include',
      body: JSON.stringify({ filters }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to export Excel');
    }
    
    return response.blob();
  } catch (error: any) {
    throw new Error(error.message || 'Failed to export ledger to Excel');
  }
}

export async function exportLedgerToCSV(filters: any): Promise<Blob> {
  try {
    const response = await fetch(`${BASE_URL}/ledger/export/csv`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      credentials: 'include',
      body: JSON.stringify({ filters }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to export CSV');
    }
    
    return response.blob();
  } catch (error: any) {
    throw new Error(error.message || 'Failed to export ledger to CSV');
  }
}

export async function getLedgerCategories(): Promise<any> {
  try {
    const response = await apiClient('/ledger/filters/categories', {
      method: 'GET',
      withAuth: true,
    });
    return response;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch ledger categories');
  }
}

export async function getLedgerPaymentMethods(): Promise<any> {
  try {
    const response = await apiClient('/ledger/filters/payment-methods', {
      method: 'GET',
      withAuth: true,
    });
    return response;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch payment methods');
  }
}

export async function getLedgerAnalytics(type: string, params?: any): Promise<any> {
  try {
    const response = await apiClient(`/ledger/analytics/${type}`, {
      method: 'GET',
      params,
      withAuth: true,
    });
    return response;
  } catch (error: any) {
    throw new Error(error.message || `Failed to fetch ${type} analytics`);
  }
}

// Notice Management API Functions
export async function getNoticeAnalytics(params?: { timeRange?: string }): Promise<any> {
  try {
    const response = await apiClient('/notices/analytics', {
      method: 'GET',
      params,
      withAuth: true,
    });
    return response;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch notice analytics');
  }
}

export async function getRecentNotices(params?: { limit?: number; search?: string }): Promise<any> {
  try {
    const queryParams: Record<string, string> = {};
    if (params?.limit !== undefined) queryParams.limit = params.limit.toString();
    if (params?.search) queryParams.search = params.search;
    
    const response = await apiClient('/notices/recent', {
      method: 'GET',
      params: queryParams,
      withAuth: true,
    });
    return response;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch recent notices');
  }
}

export async function getAllNotices(params?: { 
  page?: number; 
  limit?: number; 
  search?: string; 
  status?: string; 
  type?: string; 
  priority?: string;
}): Promise<any> {
  try {
    const queryParams: Record<string, string> = {};
    if (params?.page !== undefined) queryParams.page = params.page.toString();
    if (params?.limit !== undefined) queryParams.limit = params.limit.toString();
    if (params?.search) queryParams.search = params.search;
    if (params?.status) queryParams.status = params.status;
    if (params?.type) queryParams.type = params.type;
    if (params?.priority) queryParams.priority = params.priority;
    
    const response = await apiClient('/notices', {
      method: 'GET',
      params: queryParams,
      withAuth: true,
    });
    return response;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch notices');
  }
}

export async function getNoticeById(id: string): Promise<any> {
  try {
    const response = await apiClient(`/notices/${id}`, {
      method: 'GET',
      withAuth: true,
    });
    return response;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch notice');
  }
}

export async function updateNoticeStatus(id: string, status: string): Promise<any> {
  try {
    const response = await apiClient(`/notices/${id}/status`, {
      method: 'PATCH',
      body: { status },
      withAuth: true,
    });
    return response;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to update notice status');
  }
}

export async function deleteNotice(id: string): Promise<any> {
  try {
    const response = await apiClient(`/notices/${id}`, {
      method: 'DELETE',
      withAuth: true,
    });
    return response;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to delete notice');
  }
}

export async function getNoticeAuditLog(id: string): Promise<any> {
  try {
    const response = await apiClient(`/notices/${id}/audit`, {
      method: 'GET',
      withAuth: true,
    });
    return response;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch notice audit log');
  }
}

export async function createNotice(formData: FormData): Promise<any> {
  try {
    const response = await apiClient('/notices', {
      method: 'POST',
      body: formData,
      withAuth: true,
    });
    return response;
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to create notice' };
  }
}

export async function updateNotice(id: string, formData: FormData): Promise<any> {
  try {
    const response = await apiClient(`/notices/${id}`, {
      method: 'PUT',
      body: formData,
      withAuth: true,
    });
    return response;
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update notice' };
  }
}

export async function getAudienceOptions(): Promise<any> {
  try {
    const response = await apiClient('/notices/audience-options', {
      method: 'GET',
      withAuth: true,
    });
    return response;
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message || 'Failed to fetch audience options',
      types: ['All Residents', 'Specific Wing(s)', 'Specific Flat(s)'],
      wings: [],
      flats: []
    };
  }
}

export async function exportNoticesPDF(email: string): Promise<any> {
  try {
    const response = await apiClient(`/notices/export/pdf?email=${encodeURIComponent(email)}`, {
      method: 'GET',
      withAuth: true,
    });
    return response;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to export notices to PDF');
  }
}

export async function exportNoticesExcel(email: string): Promise<any> {
  try {
    const response = await apiClient(`/notices/export/excel?email=${encodeURIComponent(email)}`, {
      method: 'GET',
      withAuth: true,
    });
    return response;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to export notices to Excel');
  }
}
