const BASE_URL = 'http://localhost:3000/api/v1';

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface RequestOptions {
  method?: Method;
  body?: any; // Can be JSON object or FormData
  headers?: Record<string, string>;
  params?: Record<string, string>;
  withAuth?: boolean; // Optional: Adds Authorization header
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

  const query = params ? '?' + new URLSearchParams(params).toString() : '';

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  // Build headers
  const allHeaders: Record<string, string> = {
    ...headers,
  };

  if (withAuth) {
    const token = localStorage.getItem('token');
    if (token) {
      allHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  // Only set Content-Type manually if it's not FormData
  if (!isFormData) {
    allHeaders['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${BASE_URL}${path}${query}`, {
    method,
    credentials: 'include',
    headers: allHeaders,
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || `Request failed with status ${res.status}`);
  }

  return res.json();
}
