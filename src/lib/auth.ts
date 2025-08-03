import { apiClient } from './apiClient';
import { encryptPayload, decryptPayload } from './crypto';

interface User {
  id: string;
  email: string;
  societyId: string;
  role?: string;
  name?: string;
  societyName?: string;
  avatar?: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  detail?: string;
  role?: string;
  user?: User;
}

// 🧠 Helper to decrypt response safely
function tryDecrypt(responseData: any): AuthResponse {
  try {
    return decryptPayload(responseData) as AuthResponse;
  } catch (error) {
    console.error('🔐 Failed to decrypt response:', error);
    return {
      success: false,
      message: 'Decryption failed',
      detail: 'Could not decrypt the server response',
    };
  }
}

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
}): Promise<AuthResponse> {
  const payload = type === 'password' ? { email, password } : { mobile };
  const encrypted = encryptPayload(payload);

  try {
    const encryptedResponse = await apiClient('/auth/weblogin', {
      method: 'POST',
      body: { data: encrypted },
    });
    return tryDecrypt(encryptedResponse);
  } catch (error: any) {
    if (error.response?.data) {
      return tryDecrypt(error.response.data);
    }

    return {
      success: false,
      message: error.message || 'Login failed',
      detail: 'An unexpected error occurred during login',
    };
  }
}

export async function verifyOtp(mobile: string, otp: string): Promise<AuthResponse> {
  const encrypted = encryptPayload({ mobile, otp });

  try {
    const encryptedResponse = await apiClient('/auth/verify-web-otp', {
      method: 'POST',
      body: { data: encrypted },
    });
    return tryDecrypt(encryptedResponse);
  } catch (error: any) {
    if (error.response?.data) {
      return tryDecrypt(error.response.data);
    }

    return {
      success: false,
      message: error.message || 'OTP verification failed',
      detail: 'An unexpected error occurred during OTP verification',
    };
  }
}

export async function checkSession(): Promise<AuthResponse> {
  try {
    const response = await apiClient('/auth/session', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response as AuthResponse;
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Session check failed',
      detail: 'An unexpected error occurred during session check',
    };
  }
}

export async function logout(): Promise<AuthResponse> {
  try {
    const response = await apiClient('/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response as AuthResponse;
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Logout failed',
      detail: 'An unexpected error occurred during logout',
    };
  }
}
