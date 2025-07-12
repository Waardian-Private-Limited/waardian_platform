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
