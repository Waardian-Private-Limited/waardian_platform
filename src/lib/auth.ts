import { apiClient, checkAccounts as apiCheckAccounts, loginWithAccount as apiLoginWithAccount, Account, CheckAccountsResponse, OtpVerificationResponse } from './apiClient';
import { encryptPayload, decryptPayload } from './crypto';

interface User {
  id: string;
  email: string;
  societyId: string;
  role?: string;
  name?: string;
  societyName?: string;
  avatar?: string;
  token?: string; // JWT token from backend
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  detail?: string;
  role?: string;
  user?: User;
  token?: string; // Token might be at top level
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

export async function verifyOtp(mobile: string, otp: string, accountId?: string): Promise<OtpVerificationResponse> {
  const encrypted = encryptPayload({ mobile, otp, accountId });

  try {
    const encryptedResponse = await apiClient('/auth/verify-web-otp', {
      method: 'POST',
      body: { data: encrypted },
    });
    
    try {
      return decryptPayload(encryptedResponse) as OtpVerificationResponse;
    } catch (decryptError) {
      console.error('🔐 Failed to decrypt OTP verification response:', decryptError);
      return {
        success: false,
        message: 'Decryption failed',
        error: 'Could not decrypt the server response',
      };
    }
  } catch (error: any) {
    if (error.response?.data) {
      try {
        return decryptPayload(error.response.data) as OtpVerificationResponse;
      } catch (decryptError) {
        console.error('🔐 Failed to decrypt error response:', decryptError);
      }
    }

    return {
      success: false,
      message: error.message || 'OTP verification failed',
      error: 'An unexpected error occurred during OTP verification',
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

// Check accounts for multi-account login
export async function checkAccounts(email?: string, phone?: string): Promise<CheckAccountsResponse> {
  const encrypted = encryptPayload({ email, phone });
  
  try {
    const encryptedResponse = await apiClient('/auth/check-web-accounts', {
      method: 'POST',
      body: { data: encrypted },
    });
    
    try {
      return decryptPayload(encryptedResponse) as CheckAccountsResponse;
    } catch (decryptError) {
      console.error('🔐 Failed to decrypt check accounts response:', decryptError);
      return {
        message: 'Decryption failed',
        error: 'Could not decrypt the server response',
      };
    }
  } catch (error: any) {
    return {
      message: 'Failed to check accounts',
      error: error.message || 'An unexpected error occurred',
    };
  }
}

// Login with selected account
export async function loginWithAccount(accountId: string, password: string): Promise<AuthResponse> {
  const encrypted = encryptPayload({ accountId, password });

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

// Send OTP for selected account
export async function sendWebOtp(accountId: string): Promise<AuthResponse> {
  const encrypted = encryptPayload({ accountId });

  try {
    const encryptedResponse = await apiClient('/auth/send-web-otp', {
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
      message: error.message || 'Failed to send OTP',
      detail: 'An unexpected error occurred while sending OTP',
    };
  }
}
