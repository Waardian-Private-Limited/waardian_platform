'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, Building2, Shield, AlertCircle, CheckCircle, Loader2, X } from 'lucide-react';
import { getPaymentProvider, createPaymentOrder } from '@/lib/paymentProviderService';
import { toast } from 'react-hot-toast';

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  paymentData: {
    amount: number;
    currency?: string;
    flat_id?: number;
    purpose: string;
    payment_type: 'rent' | 'society';
    category: string;
    invoice_id?: number;
  };
  onSuccess?: (response: any) => void;
  onError?: (error: any) => void;
}

interface PaymentProvider {
  provider: 'waardian' | 'razorpay';
  isActive: boolean;
  razorpayKeyId?: string;
}

export default function PaymentDialog({
  isOpen,
  onClose,
  paymentData,
  onSuccess,
  onError,
}: PaymentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [providerInfo, setProviderInfo] = useState<PaymentProvider | null>(null);
  const [loadingProvider, setLoadingProvider] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchPaymentProvider();
    }
  }, [isOpen]);

  const fetchPaymentProvider = async () => {
    try {
      setLoadingProvider(true);
      const provider = await getPaymentProvider();
      setProviderInfo(provider);
    } catch (error) {
      console.error('Error fetching payment provider:', error);
      toast.error('Failed to load payment configuration');
    } finally {
      setLoadingProvider(false);
    }
  };

  const initiatePayment = async () => {
    if (!providerInfo) {
      toast.error('Payment provider not configured');
      return;
    }

    try {
      setLoading(true);
      
      // Create payment order
      const orderResponse = await createPaymentOrder(paymentData);
      
      if (!orderResponse.order_id) {
        throw new Error('Invalid order response');
      }

      // Configure Razorpay options
      const options: any = {
        key: providerInfo.razorpayKeyId,
        amount: orderResponse.amount,
        currency: orderResponse.currency || 'INR',
        name: 'Waardian',
        description: paymentData.purpose,
        order_id: orderResponse.order_id,
        handler: async (response: any) => {
          try {
            console.log('Payment successful:', response);
            toast.success('Payment completed successfully!');
            onSuccess?.(response);
            onClose();
          } catch (error: any) {
            console.error('Payment verification error:', error);
            toast.error(error.message || 'Payment verification failed');
            onError?.(error);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            toast.error('Payment cancelled');
            onClose();
          },
        },
        prefill: {
          email: 'user@example.com',
          contact: '1234567890',
        },
        notes: {
          payment_type: paymentData.payment_type,
          category: paymentData.category,
          flat_id: paymentData.flat_id,
          invoice_id: paymentData.invoice_id,
        },
        theme: {
          color: '#2563EB',
        },
      };

      // Initialize Razorpay
      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', (response: any) => {
        setLoading(false);
        toast.error(response.error?.description || 'Payment failed');
        onError?.(response.error);
      });
      rzp.open();
    } catch (error: any) {
      setLoading(false);
      toast.error(error.message || 'Failed to initiate payment');
      onError?.(error);
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'waardian':
        return <Building2 className="h-5 w-5" />;
      case 'razorpay':
        return <CreditCard className="h-5 w-5" />;
      default:
        return <Shield className="h-5 w-5" />;
    }
  };

  const getProviderName = (provider: string) => {
    switch (provider) {
      case 'waardian':
        return 'Waardian Gateway';
      case 'razorpay':
        return 'Self-Integrated Razorpay';
      default:
        return 'Payment Gateway';
    }
  };

  const getProviderDescription = (provider: string) => {
    switch (provider) {
      case 'waardian':
        return 'Secure payments through Waardian\'s integrated gateway with automatic fee handling';
      case 'razorpay':
        return 'Direct payments through your society\'s own Razorpay account';
      default:
        return 'Secure payment processing';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Details
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Complete your payment of ₹{paymentData.amount.toFixed(2)} for {paymentData.purpose}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Payment Amount */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  ₹{paymentData.amount.toFixed(2)}
                </div>
                <div className="text-sm text-gray-500">
                  {paymentData.purpose}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Provider */}
          {loadingProvider ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-gray-500">Loading payment configuration...</span>
                </div>
              </CardContent>
            </Card>
          ) : providerInfo ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  {getProviderIcon(providerInfo.provider)}
                  {getProviderName(providerInfo.provider)}
                  <Badge variant={providerInfo.isActive ? 'default' : 'secondary'}>
                    {providerInfo.isActive ? 'Active' : 'Default'}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  {getProviderDescription(providerInfo.provider)}
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2 text-amber-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">Unable to load payment configuration</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Actions */}
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={initiatePayment}
              className="flex-1"
              disabled={loading || !providerInfo}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pay Now
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}