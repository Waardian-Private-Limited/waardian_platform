import { apiClient } from './apiClient';
import { encryptPayload } from './crypto';

export async function login({
  type,
  email,
  password,
  mobile,
}: {
  type: 'password' | 'otp';
  email?: string;
  password?: string;
  mobile?: string;
}) {
  const payload = type === 'password' ? { email, password } : { mobile };
  const encrypted = encryptPayload(payload);
  return await apiClient('/auth/weblogin', {
    method: 'POST',
    body: { data: encrypted },
  });
}

export async function verifyOtp(mobile: string, otp: string) {
  const encrypted = encryptPayload({ mobile, otp });
  return await apiClient('/auth/verify-otp', {
    method: 'POST',
    body: { data: encrypted },
  });
}

export async function checkSession() {
  return await apiClient('/auth/session', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export async function logout() {
  return await apiClient('/auth/logout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export async function fetchSocieties() {
  try {
    const response = await apiClient('/superadmin/societies', {
      method: 'GET',
    });
    console.log('Fetched societies response:', response);
    // Handle both direct array and { societies: [] } response
    const societies = Array.isArray(response) ? response : response.societies || [];
    console.log('Processed societies:', societies);
    return societies;
  } catch (error) {
    console.error('Error fetching societies:', error);
    throw error;
  }
}

export async function createSociety(data: { name: string; address: string; adminEmail: string; status: string }) {
  try {
    const response = await apiClient('/superadmin/societies', {
      method: 'POST',
      body: data,
    });
    return response;
  } catch (error) {
    console.error('Error creating society:', error);
    throw error;
  }
}

export async function updateSociety(id: number, data: { name: string; address: string; adminEmail: string; status: string }) {
  try {
    const response = await apiClient(`/superadmin/societies/${id}`, {
      method: 'PUT',
      body: data,
    });
    return response;
  } catch (error) {
    console.error('Error updating society:', error);
    throw error;
  }
}

export async function deleteSociety(id: number) {
  try {
    const response = await apiClient(`/superadmin/societies/${id}`, {
      method: 'DELETE',
    });
    return response;
  } catch (error) {
    console.error('Error deleting society:', error);
    throw error;
  }
}