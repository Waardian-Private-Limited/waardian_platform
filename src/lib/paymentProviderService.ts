'use client';

import { apiClient } from './apiClient';

interface GatewayInfo {
  type: 'self' | 'waardian';
  status: 'active' | 'pending' | 'in review' | 'blocked' | 'rejected' | 'inactive';
  provider?: string;
  accountDetails?: {
    name: string;
    accountNumber: string;
    ifsc: string;
    category: string;
    contactPerson: string;
    email: string;
    registrationDate: string;
  };
  selfGatewayDetails?: {
    provider: string;
    apiKeyMasked: string;
    configuredDate: string;
    lastUsed: string;
  };
}

interface PaymentProvider {
  provider: 'waardian' | 'razorpay';
  isActive: boolean;
  razorpayKeyId?: string;
}

/**
 * Determines the payment provider for a society
 * @returns Payment provider information
 */
export const getPaymentProvider = async (): Promise<PaymentProvider> => {
  try {
    const response = await apiClient('/gateway/gateway_status', {
      method: 'GET',
      withAuth: true,
    });

    if (response.status === 'success') {
      const gatewayInfo: GatewayInfo = response.data;
      
      // If society has active self-integrated gateway, use it
      if (gatewayInfo.type === 'self' && gatewayInfo.status === 'active') {
        return {
          provider: 'razorpay', // For now, assuming self-integrated is Razorpay
          isActive: true,
          razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // Society's own key would be fetched separately
        };
      }
      
      // If society has active Waardian gateway, use Waardian
      if (gatewayInfo.type === 'waardian' && gatewayInfo.status === 'active') {
        return {
          provider: 'waardian',
          isActive: true,
          razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        };
      }
    }
    
    // Default to Waardian if no active gateway or error
    return {
      provider: 'waardian',
      isActive: false,
      razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    };
  } catch (error) {
    console.error('Error fetching payment provider:', error);
    // Default to Waardian on error
    return {
      provider: 'waardian',
      isActive: false,
      razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    };
  }
};

/**
 * Creates a payment order with the appropriate provider
 */
export const createPaymentOrder = async (paymentData: {
  amount: number;
  currency?: string;
  flat_id?: number;
  purpose: string;
  payment_type: 'rent' | 'society';
  category: string;
  invoice_id?: number;
}) => {
  try {
    // Get the payment provider for this society
    const providerInfo = await getPaymentProvider();
    
    // Create payment order with provider information
    const response = await apiClient('/payment/createPayment', {
      method: 'POST',
      body: {
        ...paymentData,
        provider: providerInfo.provider,
      },
      withAuth: true,
    });

    if (response.status === 'success') {
      return {
        ...response.data,
        provider: providerInfo.provider,
        razorpayKeyId: providerInfo.razorpayKeyId,
      };
    } else {
      throw new Error(response.message || 'Failed to create payment order');
    }
  } catch (error) {
    console.error('Error creating payment order:', error);
    throw error;
  }
};