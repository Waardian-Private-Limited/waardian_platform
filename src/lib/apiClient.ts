const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

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
