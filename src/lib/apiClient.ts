const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3003/api/v1";

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface RequestOptions {
  method?: Method;
  body?: any; // JSON or FormData
  headers?: Record<string, string>;
  params?: Record<string, string>;
  withAuth?: boolean; // Adds Authorization header from localStorage
}

export const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  // 1. Check primary token key
  const localToken = localStorage.getItem('token');
  if (localToken && localToken !== 'undefined' && localToken !== 'null') return localToken;

  // 2. Check Zustand store (Primary source of truth for this app)
  try {
    const userStorage = localStorage.getItem('user-storage');
    if (userStorage) {
      const parsed = JSON.parse(userStorage);
      const storeToken = parsed.state?.user?.token || parsed.state?.token;
      if (storeToken && storeToken !== 'undefined' && storeToken !== 'null') return storeToken;
    }
  } catch (err) { }
  return null;
};

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
    const token = getAuthToken();
    if (token) {
      allHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  if (!isFormData) {
    allHeaders['Content-Type'] = 'application/json';
  }

  console.log(`🌐 Calling API: ${method} ${path}${query}`);
  const res = await fetch(`${BASE_URL}${path}${query}`, {
    method,
    credentials: 'include', // ensures cookies work across domains
    headers: allHeaders,
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 304) {
    return null as any; // Or handle as successful cached response
  }

  if (!res.ok) {
    let errorMsg = '';
    try {
      const errData = await res.json();
      errorMsg = errData.message || errData.error || JSON.stringify(errData);
    } catch {
      try {
        errorMsg = await res.text();
      } catch {
        errorMsg = `Request failed with status ${res.status}`;
      }
    }
    
    const finalMsg = errorMsg || `Request failed with status ${res.status}`;
    console.error(`❌ API Error [${method} ${path}]:`, finalMsg);
    throw new Error(finalMsg);
  }

  return res.json();
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  total?: number;
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
    token?: string;
  };
  accounts?: Account[];
  error?: string;
  token?: string;
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

// Subscriptions API
export interface SubscriptionRecord {
  id: number;
  society_id: number;
  plan_id: number | null;
  payment_cycle: string;
  amount: string;
  discount: string;
  total_flats: number;
  modules: string | string[];
  billing_months: number | null;
  razorpay_subscription_id?: string | null;
  status: string;
  created_at?: string; // snake_case variant
  updated_at?: string; // snake_case variant
  createdAt?: string;  // camelCase variant
  updatedAt?: string;  // camelCase variant
  start_date: string | null;
  end_date: string | null;
  trial_ends_at: string | null;
  invoice_link?: string | null;
  payment_ids?: string | null;
  razorpay_customer_id?: string | null;
  renewal_reminder_sent?: number | boolean | string | null;
}

export async function getOptedSubscriptions(): Promise<{ success: boolean; data: SubscriptionRecord[] }> {
  try {
    const response = await apiClient<{ success: boolean; data: SubscriptionRecord[] }>(`/superadmin/subscriptions`, {
      method: 'GET',
    });
    return response;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch subscriptions');
  }
}

export type EditSubscriptionPayload = Partial<{
  society_id: number;
  plan_id: number | null;
  payment_cycle: string;
  amount: string;
  discount: string;
  total_flats: number;
  modules: string | string[];
  billing_months: number | null;
  razorpay_subscription_id?: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  trial_ends_at: string | null;
  invoice_link?: string | null;
  payment_ids?: string | null;
  razorpay_customer_id?: string | null;
  renewal_reminder_sent?: number | boolean | string | null;
}>;

export async function updateOptedSubscription(id: number, payload: EditSubscriptionPayload): Promise<{ success: boolean; data: SubscriptionRecord }> {
  try {
    const response = await apiClient<{ success: boolean; data: SubscriptionRecord }>(`/superadmin/subscriptions/${id}`, {
      method: 'PUT',
      body: payload,
    });
    return response;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to update subscription');
  }
}

// Expenses API
export async function getExpenseInvoiceUrl(id: string): Promise<{ success: boolean; data: { url: string; filename: string } }> {
  try {
    const response = await apiClient<{ success: boolean; message?: string; data: { url: string; filename: string } }>(`/expenses/${id}/invoice`, {
      method: 'GET',
      withAuth: true,
    });
    return response;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to generate expense invoice');
  }
}

export async function getSocietyDetailsForExpenses(): Promise<{ success: boolean; data: { id: number; name: string; email?: string; contact_number?: string; gst_number?: string; pan_number?: string; address?: string } }> {
  try {
    const response = await apiClient<{ success: boolean; data: { id: number; name: string; email?: string; contact_number?: string; gst_number?: string; pan_number?: string; address?: string } }>(`/expenses/society/details`, {
      method: 'GET',
      withAuth: true,
    });
    return response;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch society details');
  }
}

export interface SocietyDetails {
  id: number;
  name: string;
  address_line1?: string | null;
  address_line2?: string | null;
  status: string;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  pincode?: string | null;
  type?: string | null;
  registration_number?: string | null;
  registration_date?: string | null;
  pan_number?: string | null;
  gst_number?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  email?: string | null;
  certificate_url?: string | null;
  contact_number?: string | null;
}

export type UpdateSocietyPayload = Partial<{
  name: string;
  address_line1: string | null;
  address_line2: string | null;
  status: string;
  city: string | null;
  state: string | null;
  country: string | null;
  pincode: string | null;
  type: string | null;
  registration_number: string | null;
  registration_date: string | null;
  pan_number: string | null;
  gst_number: string | null;
  email: string | null;
  certificate_url: string | null;
  contact_number: string | null;
}>;

export async function getSocietyProfile(): Promise<{ success: boolean; data: SocietyDetails }> {
  try {
    const response = await apiClient<{ success: boolean; data: SocietyDetails }>(
      '/society-admin/society/details',
      { method: 'GET', withAuth: true }
    );
    return response;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch society profile');
  }
}

export async function updateSocietyProfile(payload: UpdateSocietyPayload): Promise<{ success: boolean; data: SocietyDetails }> {
  try {
    const response = await apiClient<{ success: boolean; data: SocietyDetails }>(
      '/society-admin/society/details',
      { method: 'PATCH', body: payload, withAuth: true }
    );
    return response;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to update society profile');
  }
}

export async function uploadFiles(context: string, files: File[]): Promise<{ status: string; data: { files: { url: string }[] } }> {
  const fd = new FormData();
  files.forEach((f) => fd.append('files', f));
  const response = await apiClient<{ status: string; data: { files: { url: string }[] } }>(
    `/files/upload/${encodeURIComponent(context)}`,
    { method: 'POST', body: fd, withAuth: true }
  );
  return response;
}

export interface Asset {
  id: number;
  society_id: number;
  name: string;
  description: string;
  category: string;
  image_url: string;
  status: 'active' | 'in_use' | 'under_maintenance' | 'missing' | 'decommissioned' | 'available' | 'operational' | 'maintenance';
  is_bookable: boolean;
  pricing_model: 'free' | 'paid_hourly' | 'paid_daily';
  price: number;
  security_deposit: number;
  max_booking_hours: number | null;
  advance_booking_days: number | null;
  approval_required: boolean;
  rules: string;
  location?: string;
  location_name?: string;
  location_id?: number;
  current_holder_id?: number;
  last_seen_at?: string;
  created_at?: string;
  updated_at?: string;

  // New fields
  sub_type?: string;
  block_wing?: string;
  floor?: string;
  exact_location?: string;
  owned_by?: 'society' | 'vendor';
  vendor_id?: number;
  assigned_staff_id?: number;
  purchase_date?: string;
  purchase_cost?: number;
  invoice_number?: string;
  condition_status?: string;
  installation_date?: string;
  expected_life_years?: number;
  warranty_expiry?: string;
  maintenance_type_policy?: string;
  maintenance_frequency?: string;
  last_service_date?: string;
  next_service_date?: string;
  invoice_url?: string;
  // Financial fields
  useful_life_years?: number;
  scrap_value?: number;
  depreciation_method?: string;
  // Disposal fields
  is_disposed?: boolean;
  disposal_date?: string;
  disposal_amount?: number;
  disposal_reason?: string;
}

export interface AssetBooking {
  id: number;
  user_id: number;
  asset_id: number;
  society_id: number;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed';
  approval_status: 'not_required' | 'pending' | 'approved' | 'rejected';
  payment_status: 'free' | 'pending' | 'paid' | 'refunded' | 'failed';
  total_amount: number;
  deposit_amount: number;
  booking_id: string;
  first_name?: string;
  last_name?: string;
  asset_name?: string;
  resident_name?: string;
  asset_category?: string;
  block_wing?: string;
  unit_number?: string;
  charge_amount?: number;
  rejection_reason?: string;
  checked_out_at?: string;
  checked_in_at?: string;
  taken_from?: string;
  submitted_to?: string;
  qr_code?: string;
  user_name?: string;
  created_at?: string;
  updated_at?: string;
  manual_penalty_rate?: number;
  manual_grace_period?: number;
  final_penalty_amount?: number;
}

export const getAllAssets = async (): Promise<ApiResponse<Asset[]>> => {
  return apiClient('/assets', { withAuth: true });
};

export const createAsset = async (asset: Partial<Asset>): Promise<ApiResponse<{ id: number }>> => {
  return apiClient('/assets/admin/create', {
    method: 'POST',
    withAuth: true,
    body: asset,
  });
};

export const updateAsset = async (assetId: number, asset: Partial<Asset>): Promise<ApiResponse<any>> => {
  return apiClient(`/assets/admin/update/${assetId}`, {
    method: 'PATCH',
    withAuth: true,
    body: asset,
  });
};

export const createBooking = async (booking: {
  asset_id: number;
  start_time: string;
  end_time: string;
  total_amount: number;
  deposit_amount: number;
}): Promise<ApiResponse<any>> => {
  return apiClient('/assets/book', {
    method: 'POST',
    withAuth: true,
    body: booking,
  });
};

export const getAllBookings = async (): Promise<ApiResponse<AssetBooking[]>> => {
  return apiClient('/assets/admin/bookings', { withAuth: true });
};

export const updateBookingStatus = async (
  id: number,
  status: 'confirmed' | 'rejected',
  remarks?: string
): Promise<ApiResponse<any>> => {
  return apiClient(`/assets/admin/bookings/${id}/status`, {
    method: 'PATCH',
    withAuth: true,
    body: { status, remarks },
  });
};

export const recordHandover = async (params: {
  bookingId: number;
  type: 'checkout' | 'checkin';
  remarks?: string;
  manualPenaltyRate?: number;
  manualGracePeriod?: number;
  waivePenalty?: boolean;
  collectedPenalty?: number;
}): Promise<ApiResponse<any>> => {
  return apiClient(`/assets/admin/bookings/handover`, {
    method: 'POST',
    withAuth: true,
    body: params,
  });
};

export const verifyBooking = async (bookingId: string): Promise<ApiResponse<AssetBooking>> => {
  return apiClient(`/assets/admin/verify-booking/${bookingId}`, { withAuth: true });
};

export const getMyBookings = async (): Promise<ApiResponse<AssetBooking[]>> => {
  return apiClient('/assets/my-bookings', { withAuth: true });
};

// Tracking & Movement
export const checkOutAsset = async (data: any) => {
  return apiClient('/assets/admin/move/checkout', { method: 'POST', body: data, withAuth: true });
};

export const checkInAsset = async (data: any) => {
  return apiClient('/assets/admin/move/checkin', { method: 'POST', body: data, withAuth: true });
};

export const getAssetLifecycle = async (assetId: number) => {
  return apiClient(`/assets/admin/${assetId}/lifecycle`, { withAuth: true });
};

export const markAssetMissing = async (assetId: number) => {
  return apiClient(`/assets/admin/${assetId}/missing`, { method: 'POST', withAuth: true });
};

export const getDashboardSummary = async (): Promise<ApiResponse<any>> => {
  return apiClient('/assets/admin/dashboard-summary', { withAuth: true });
};

export const getMaintenanceDashboard = async (): Promise<ApiResponse<any>> => {
  return apiClient('/assets/admin/maintenance/dashboard', { withAuth: true });
};

export const getMaintenanceFinancials = async (): Promise<ApiResponse<any>> => {
  return apiClient('/assets/admin/maintenance/financials', { withAuth: true });
};

export const markAssetAsServiced = async (data: any): Promise<ApiResponse<any>> => {
  return apiClient('/assets/admin/maintenance/service', {
    method: 'POST',
    withAuth: true,
    body: data,
  });
};

export const scheduleMaintenance = async (data: any): Promise<ApiResponse<any>> => {
  return apiClient('/assets/admin/maintenance/schedule', {
    method: 'POST',
    withAuth: true,
    body: data,
  });
};

export const createRepairRequest = async (assetId: number, remarks?: string): Promise<ApiResponse<any>> => {
  return apiClient('/assets/admin/maintenance/repair', {
    method: 'POST',
    withAuth: true,
    body: { assetId, remarks },
  });
};

export const getAMCDashboard = async (): Promise<ApiResponse<any>> => {
  return apiClient('/assets/admin/amc/dashboard', { withAuth: true });
};

export const createAMC = async (data: any): Promise<ApiResponse<any>> => {
  return apiClient('/assets/admin/amc/create', {
    method: 'POST',
    withAuth: true,
    body: data,
  });
};

export const getInventoryList = async (): Promise<ApiResponse<any[]>> => {
  return apiClient('/inventory/items', { withAuth: true });
};

export const createInventoryItem = async (data: any): Promise<ApiResponse<any>> => {
  return apiClient('/inventory/items', { method: 'POST', body: data, withAuth: true });
};

export const updateInventoryStock = async (data: any): Promise<ApiResponse<any>> => {
  return apiClient('/inventory/stock/update', { method: 'POST', body: data, withAuth: true });
};

export const getInventoryDashboard = async (): Promise<ApiResponse<any>> => {
  return apiClient('/inventory/dashboard', { withAuth: true });
};

export const getInventoryLogs = async (itemId: number): Promise<ApiResponse<any>> => {
  return apiClient(`/inventory/items/${itemId}`, { withAuth: true });
};

export const getStaffList = async (isAdmin: boolean = true): Promise<ApiResponse<any[]>> => {
  return apiClient(`/staff/list?isAdminMode=${isAdmin}`, { withAuth: true });
};

export const getVendorsList = async (): Promise<ApiResponse<any[]>> => {
  return apiClient('/assets/admin/vendors', { withAuth: true });
};

export const getVendorDetails = async (vendorId: number): Promise<ApiResponse<any>> => {
  return apiClient(`/assets/admin/vendors/${vendorId}`, { withAuth: true });
};

export const onboardVendor = async (data: any): Promise<ApiResponse<any>> => {
  return apiClient('/assets/admin/vendors/onboard', {
    method: 'POST',
    withAuth: true,
    body: data,
  });
};

export const updateVendorStatus = async (vendorId: number, status: string, notes?: string): Promise<ApiResponse<any>> => {
  return apiClient('/assets/admin/vendors/status', {
    method: 'PATCH',
    withAuth: true,
    body: { vendorId, status, notes },
  });
};

export const updateVendor = async (vendorId: number, data: any): Promise<ApiResponse<any>> => {
  return apiClient(`/assets/admin/vendors/${vendorId}`, {
    method: 'PATCH',
    withAuth: true,
    body: data,
  });
};

export const deleteVendor = async (vendorId: number): Promise<ApiResponse<any>> => {
  return apiClient(`/assets/admin/vendors/${vendorId}`, {
    method: 'DELETE',
    withAuth: true,
  });
};

export const getMovementsList = async (): Promise<ApiResponse<any[]>> => {
  return apiClient('/assets/admin/movements', { withAuth: true });
};

export const coordinateMovement = async (data: any): Promise<ApiResponse<any>> => {
  return apiClient('/assets/admin/movements/coord', {
    method: 'POST',
    withAuth: true,
    body: data,
  });
};

export const receiveMovement = async (movementId: number): Promise<ApiResponse<any>> => {
  return apiClient('/assets/admin/movements/receive', {
    method: 'POST',
    withAuth: true,
    body: { movementId },
  });
};

export const getAssetFullDetails = async (assetId: number): Promise<ApiResponse<any>> => {
  return apiClient(`/assets/admin/details/${assetId}`, { withAuth: true });
};

export const deleteAsset = async (assetId: number): Promise<ApiResponse<any>> => {
  return apiClient(`/assets/admin/${assetId}`, { method: 'DELETE', withAuth: true });
};

export const disposeAsset = async (assetId: number, data: {
  disposal_date: string;
  disposal_amount: number;
  disposal_reason: string;
}): Promise<ApiResponse<any>> => {
  return apiClient(`/assets/admin/dispose/${assetId}`, {
    method: 'PUT',
    withAuth: true,
    body: data,
  });
};

export const exportAssetsToExcel = async (filters: any): Promise<Blob> => {
  const query = new URLSearchParams(filters).toString();
  const token = getAuthToken();
  const res = await fetch(`${BASE_URL}/assets/admin/export-assets?${query}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!res.ok) {
    throw new Error(`Export failed (${res.status})`);
  }
  return res.blob();
};

// Building Structure
export const getPropertyWings = async (): Promise<ApiResponse<any[]>> => {
  return apiClient('/useronboarding/wings', { withAuth: true });
};

export const getPropertyFloors = async (wingId: number): Promise<ApiResponse<any[]>> => {
  return apiClient(`/useronboarding/floors?wingId=${wingId}`, { withAuth: true });
};

export const getPropertyFlats = async (wingId: number, floorId: number): Promise<ApiResponse<any[]>> => {
  return apiClient(`/useronboarding/flats?wingId=${wingId}&floorId=${floorId}`, { withAuth: true });
};

export const getSocietyStructure = async (): Promise<ApiResponse<{ wings: any[]; floors: any[]; amenities: any[] }>> => {
   return apiClient('/onboarding/getSocietyStructure', {
      method: 'GET',
      withAuth: true,
      headers: { 'Content-Type': 'application/json' },
   });
};
