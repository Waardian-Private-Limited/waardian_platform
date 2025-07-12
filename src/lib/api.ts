import { apiClient } from './apiClient';
import { encryptPayload } from './crypto';

export async function sendLoginRequest(encryptedData: string) {
  return apiClient('/auth/weblogin', {
    method: 'POST',
    body: { data: encryptedData },
  });
}

export async function sendOtpVerification(encryptedData: string) {
  return apiClient('/auth/verify-otp', {
    method: 'POST',
    body: { data: encryptedData },
  });
}

export async function handleAuth({
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
  return await sendLoginRequest(encrypted);
}

export async function handleOtpVerify(mobile: string, otp: string) {
  const encrypted = encryptPayload({ mobile, otp });
  return await sendOtpVerification(encrypted);
}