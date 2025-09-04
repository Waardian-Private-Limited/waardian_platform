'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, Download, Calendar, Users, Package, CheckCircle, AlertCircle, XCircle, Clock, TrendingUp, Zap, Loader2, RotateCcw, Ban, Share2, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiClient } from '@/lib/apiClient';

interface SubscriptionRecord {
  id: string;
  society_id: string;
  plan_id: string;
  payment_cycle: 'recurring' | 'one-time';
  amount: number;
  discount: number;
  total_flats: number;
  modules: string[];
  billing_months: number;
  razorpay_subscription_id: string | null;
  status: 'active' | 'inactive' | 'cancelled' | 'expired' | 'trial' | 'authenticated';
  created_at: string;
  start_date: string;
  end_date: string;
  trial_ends_at: string | null;
  updated_at: string;
  payment_ids: string[];
}

interface Plan {
  id: number;
  name: string;
  description: string;
  price_per_flat: number;
  numberOfMonths: number;
  modules: string[];
  is_trial: boolean;
  discount_price: number;
}

interface Props {
  societyId: string;
}

const AnimatedCounter = ({ value, duration = 1500 }: { value: number; duration?: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(Math.floor(progress * value));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value, duration]);

  return <span>{count}</span>;
};

const CircularProgress = ({ percentage, size = 80, strokeWidth = 6, color = '#3B82F6' }: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#F3F4F6"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-semibold text-gray-700">{Math.round(percentage)}%</span>
      </div>
    </div>
  );
};

const BillingPage = ({ societyId }: Props) => {
  const router = useRouter();
  const [subscriptionRecords, setSubscriptionRecords] = useState<SubscriptionRecord[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [showPlanModal, setShowPlanModal] = useState<string | null>(null);
  const [showExtendModal, setShowExtendModal] = useState<string | null>(null);
  const [showReferralModal, setShowReferralModal] = useState<string | null>(null);
  const [showExpirationPopup, setShowExpirationPopup] = useState<SubscriptionRecord | null>(null);
  const [referralLink, setReferralLink] = useState<string>('');
  const [showPaymentTypeModal, setShowPaymentTypeModal] = useState<string | null>(null);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<'extend' | 'renew' | null>(null);
  const [selectedPaymentType, setSelectedPaymentType] = useState<'recurring' | 'one-time' | null>(null);
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState<string | null>(null);
  const isFetching = useRef(false);

  const fetchData = useCallback(async (retryCount = 3) => {
    if (isFetching.current) return;
    isFetching.current = true;
    setLoading(true);
    setError(null);
    try {
      const subscriptions = await apiClient(`/billing/subscriptions/${societyId}`, { withAuth: true });
      const formattedSubscriptions = subscriptions.map((sub: any) => ({
        ...sub,
        id: String(sub.id),
        society_id: String(sub.society_id),
        plan_id: String(sub.plan_id),
        amount: parseFloat(sub.amount),
        discount: parseFloat(sub.discount),
        total_flats: parseInt(sub.total_flats, 10),
        billing_months: parseInt(sub.billing_months, 10),
        modules: Array.isArray(sub.modules) ? sub.modules : JSON.parse(sub.modules || '[]'),
        payment_ids: Array.isArray(sub.payment_ids) ? sub.payment_ids : JSON.parse(sub.payment_ids || '[]'),
      }));
      setSubscriptionRecords(formattedSubscriptions);

      const nearingEnd = formattedSubscriptions.find((sub: SubscriptionRecord) => {
        const daysRemaining = calculateDaysRemaining(sub.end_date);
        return sub.status === 'active' && daysRemaining < 15 && daysRemaining >= 0;
      });
      if (nearingEnd) {
        setShowExpirationPopup(nearingEnd);
      }

      const plansData = await apiClient('/onboarding/getSubscriptionPlans', { withAuth: true });
      const plansArray = Array.isArray(plansData) ? plansData :
                        plansData.plans && Array.isArray(plansData.plans) ? plansData.plans :
                        plansData.data && Array.isArray(plansData.data) ? plansData.data : null;

      if (!plansArray) {
        console.error('Unexpected plans data structure:', plansData);
        throw new Error('Invalid plans data');
      }

      const formattedPlans = plansArray.map((plan: any) => ({
        ...plan,
        price_per_flat: parseFloat(plan.price_per_flat),
        discount_price: parseFloat(plan.discount_price),
        numberOfMonths: plan.numberOfMonths,
        is_trial: Boolean(plan.is_trial),
        modules: Array.isArray(plan.modules) ? plan.modules : JSON.parse(plan.modules || '[]'),
      }));
      setPlans(formattedPlans);
    } catch (err: any) {
      if (retryCount > 0) {
        setTimeout(() => {
          isFetching.current = false;
          fetchData(retryCount - 1);
        }, 1000);
      } else {
        console.error('Failed to fetch data:', err.message);
        setError(err.message || 'Failed to load data');
      }
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, [societyId]);

  useEffect(() => {
    const loadRazorpayScript = () => {
      if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
        return () => {};
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
      return () => document.body.removeChild(script);
    };
    const cleanup = loadRazorpayScript();
    return cleanup;
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const calculateDaysRemaining = useCallback((endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, []);

  const calculateProgress = useCallback((startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();
    const total = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    return Math.min(Math.max((elapsed / total) * 100, 0), 100);
  }, []);

  const downloadInvoice = useCallback(async (recordId: string, sendEmail = false) => {
    if (isProcessing) return;
    setIsProcessing(recordId);
    try {
      const record = subscriptionRecords.find(r => r.id === recordId);
      if (!record) {
        throw new Error('Subscription record not found');
      }

      const paymentId = record.payment_ids && record.payment_ids.length > 0
        ? record.payment_ids[record.payment_ids.length - 1]
        : null;

      if (!paymentId) {
        throw new Error('No payment found for this subscription');
      }

      const token = localStorage.getItem('token') || '';
      const response = await fetch(`/api/billing/invoice/${recordId}/${paymentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch invoice');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${recordId}.pdf`);
      document.body.appendChild(link);
      link.click();

      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);

      if (sendEmail) {
        const society = await apiClient(`/society/${societyId}`, { withAuth: true });
        if (!society.email || !society.name) {
          throw new Error('Society details not found');
        }

        const invoiceNumber = `INV-${recordId.slice(-6)}-${paymentId.slice(-4)}`;

        await apiClient('/billing/email/invoice', {
          method: 'POST',
          withAuth: true,
          body: {
            to: society.email,
            societyName: society.name,
            subscriptionId: recordId,
            paymentId,
            invoiceNumber,
            amount: record.amount
          }
        });

        toast.success('Invoice downloaded and sent to your email');
      } else {
        toast.success('Invoice downloaded successfully');
      }
    } catch (err: any) {
      console.error('Failed to download invoice:', err);
      toast.error(err.message || 'Failed to download invoice');
    } finally {
      setIsProcessing(null);
    }
  }, [isProcessing, subscriptionRecords, societyId]);

  const initiatePayment = useCallback(
  async (
    record: SubscriptionRecord,
    isExtend = false,
    newPaymentType: 'recurring' | 'one-time'
  ) => {
    if (isProcessing) return;
    setIsProcessing(record.id || 'new');

    try {
      if (!plans.length) throw new Error('No plans available');
      const [plan] = record.plan_id
        ? plans.filter((p) => p.id === parseInt(record.plan_id))
        : plans;
      if (!plan) throw new Error('Plan not found');

      const payload = {
        societyId,
        planId: record.plan_id || String(plan.id),
        paymentType: newPaymentType,
        billingMonths: newPaymentType === 'recurring' ? plan.numberOfMonths : 1,
        totalFlats: record.total_flats || 1,
        amount: plan.price_per_flat * (record.total_flats || 1),
        promoCode: '',
        isExtend,
      };

      console.log('initiatePayment payload:', payload);

      const orderdata = await apiClient('/payment/renew-subscription', {
        method: 'POST',
        body: payload,
        withAuth: true,
      });

      const order = orderdata.data;

      // For recurring: we expect subscription_id, not order_id
      if (newPaymentType === 'recurring') {
        if (!order.id) throw new Error('Invalid subscription response');
      } else {
        if (!order.id || !order.amount || !order.currency) {
          throw new Error('Invalid order response');
        }
      }

      const options: any = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'Waardian',
        description: `Payment for Subscription #${record.id || 'new'}${
          isExtend ? ' (Extension)' : ''
        }`,
        handler: async (response: any) => {
          console.log('Razorpay response:', response);

          try {
            if (newPaymentType === 'recurring') {
              // Subscription flow
              if (
                !response.razorpay_payment_id ||
                !response.razorpay_subscription_id
              ) {
                throw new Error('Invalid subscription response');
              }

              if (isExtend) {
                const extendPayload = {
                  subscriptionId: record.id,
                  newPlanId: plan.id,
                  paymentType: newPaymentType,
                  billingMonths: plan.numberOfMonths,
                  totalFlats: record.total_flats,
                  amount: plan.price_per_flat * record.total_flats,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_subscription_id: response.razorpay_subscription_id,
                  razorpay_signature: response.razorpay_signature || null,
                  response,
                };
                console.log('extendPayload:', extendPayload);

                await apiClient('/payment/extend-subscription', {
                  method: 'POST',
                  body: extendPayload,
                  withAuth: true,
                });
                toast.success('Subscription extended successfully!');
              } else {
                toast.success('Recurring subscription started successfully!');
              }
            } else {
              // One-time payment flow
              if (
                !response.razorpay_payment_id ||
                !response.razorpay_order_id ||
                !response.razorpay_signature
              ) {
                throw new Error('Invalid payment response');
              }

              if (isExtend) {
                const extendPayload = {
                  subscriptionId: record.id,
                  newPlanId: plan.id,
                  paymentType: newPaymentType,
                  billingMonths: 1,
                  totalFlats: record.total_flats,
                  amount: plan.price_per_flat * record.total_flats,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                  response,
                };
                console.log('extendPayload:', extendPayload);

                await apiClient('/payment/extend-subscription', {
                  method: 'POST',
                  body: extendPayload,
                  withAuth: true,
                });
                toast.success('Subscription extended successfully!');
              } else {
                toast.success('Payment successful!');
              }
            }

            await fetchData();
            setIsProcessing(null);
            if (!record.id) router.push(`/billing/${societyId}`);
          } catch (err: any) {
            setIsProcessing(null);
            toast.error(err.message || 'Failed to handle payment');
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(null);
            toast.error('Payment cancelled');
          },
        },
        prefill: {
          email: 'society@example.com',
          contact: '1234567890',
        },
        notes: {
          society_id: societyId,
          plan_id: record.plan_id || String(plan.id),
          payment_type: newPaymentType,
          billing_months:
            newPaymentType === 'recurring' ? plan.numberOfMonths : 1,
        },
        theme: {
          color: '#2563EB',
        },
      };

      if (newPaymentType === 'recurring') {
        options.subscription_id = order.id; // subscription id
      } else {
        options.order_id = order.id; // one-time order id
      }

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', (response: any) => {
        setIsProcessing(null);
        toast.error(response.error?.description || 'Payment failed');
      });
      rzp.open();
    } catch (err: any) {
      setIsProcessing(null);
      toast.error(err.message || 'Failed to initiate payment');
    }
  },
  [fetchData, isProcessing, plans, societyId, router]
);

  const changePlan = useCallback(async (subscriptionId: string, newPlanId: number, newPaymentType: string) => {
    if (isProcessing) return;
    setIsProcessing(subscriptionId);
    try {
      const [plan] = plans.filter((p) => p.id === newPlanId);
      if (!plan) throw new Error('Plan not found');

      const payload = {
        subscriptionId,
        newPlanId,
        paymentType: newPaymentType,
        billingMonths: newPaymentType === 'recurring' ? plan.numberOfMonths : 1,
      };

      await apiClient('/change-plan', {
        method: 'POST',
        body: payload,
        withAuth: true,
      });

      toast.success('Plan changed successfully!');
      await fetchData();
      setShowPlanModal(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to change plan');
    } finally {
      setIsProcessing(null);
    }
  }, [fetchData, isProcessing, plans]);

  const extendSubscription = useCallback(
    async (subscriptionId: string, newPlanId: number, newPaymentType: 'recurring' | 'one-time') => {
      console.log('extendSubscription:', { subscriptionId, newPlanId, newPaymentType });
      if (isProcessing) return;
      setIsProcessing(subscriptionId);
      try {
        const [plan] = plans.filter((p) => p.id === newPlanId);
        if (!plan) throw new Error('Plan not found');

        const [subscription] = subscriptionRecords.filter((s) => s.id === subscriptionId);
        if (!subscription) throw new Error('Subscription not found');

        const record: SubscriptionRecord = {
          ...subscription,
          plan_id: String(newPlanId),
          payment_cycle: newPaymentType,
          amount: plan.price_per_flat * subscription.total_flats,
        };
        await initiatePayment(record, true, newPaymentType);
        setShowExtendModal(null);
        setSelectedPaymentType(null);
      } catch (err: any) {
        toast.error(err.message || 'Failed to extend subscription');
      } finally {
        setIsProcessing(null);
      }
    },
    [initiatePayment, isProcessing, plans, subscriptionRecords]
  );

  const showCancelConfirmation = useCallback((subscriptionId: string) => {
    setShowCancelConfirmModal(subscriptionId);
  }, []);

  const cancelSubscription = useCallback(async (subscriptionId: string) => {
    if (isProcessing) return;
    setIsProcessing(subscriptionId);
    try {
      await apiClient('/payment/cancel-subscription', {
        method: 'POST',
        body: { subscriptionId },
        withAuth: true,
      });

      toast.success('Subscription cancelled successfully!');
      await fetchData();
      setShowCancelConfirmModal(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel subscription');
    } finally {
      setIsProcessing(null);
    }
  }, [fetchData, isProcessing]);

  const renewSubscription = useCallback(
    async (subscriptionId: string, newPlanId: number, newPaymentType: 'recurring' | 'one-time') => {
      console.log('renewSubscription:', { subscriptionId, newPlanId, newPaymentType });
      if (isProcessing) return;
      setIsProcessing(subscriptionId);
      try {
        const [plan] = plans.filter((p) => p.id === newPlanId);
        if (!plan) throw new Error('Plan not found');

        const [subscription] = subscriptionRecords.filter((s) => s.id === subscriptionId);
        if (!subscription) throw new Error('Subscription not found');

        const record: SubscriptionRecord = {
          ...subscription,
          plan_id: String(newPlanId),
          payment_cycle: newPaymentType,
          amount: plan.price_per_flat * subscription.total_flats,
        };
        await initiatePayment(record, false, newPaymentType);
        toast.success('Subscription renewed successfully!');
        await fetchData();
      } catch (err: any) {
        toast.error(err.message || 'Failed to renew subscription');
      } finally {
        setIsProcessing(null);
      }
    },
    [fetchData, initiatePayment, isProcessing, plans, subscriptionRecords]
  );

  const createSubscription = useCallback(
    async (planId: number, paymentType: 'recurring' | 'one-time', totalFlats: number) => {
      if (isProcessing) return;
      setIsProcessing('new');
      try {
        const [plan] = plans.filter((p) => p.id === planId);
        if (!plan) throw new Error('Plan not found');

        const payload = {
          societyId,
          planId,
          paymentType,
          billingMonths: paymentType === 'recurring' ? plan.numberOfMonths : 1,
          totalFlats,
          amount: plan.price_per_flat * totalFlats,
          promoCode: '',
        };

        const getresponse = await apiClient('/payment/renew-subscription', {
          method: 'POST',
          body: payload,
          withAuth: true,
        });

        const response = getresponse.data;

        if (!response.id) {
          throw new Error('Invalid subscription creation response');
        }

        await initiatePayment(
          {
            id: response.subscriptionId,
            society_id: societyId,
            plan_id: String(planId),
            payment_cycle: paymentType,
            amount: payload.amount,
            discount: plan.discount_price || 0,
            total_flats: totalFlats,
            modules: plan.modules,
            billing_months: payload.billingMonths,
            razorpay_subscription_id: response.razorpay_subscription_id || null,
            status: 'active',
            created_at: new Date().toISOString(),
            start_date: new Date().toISOString(),
            end_date: new Date(new Date().setMonth(new Date().getMonth() + payload.billingMonths)).toISOString(),
            trial_ends_at: plan.is_trial
              ? new Date(new Date().setDate(new Date().getDate() + 14)).toISOString()
              : null,
            updated_at: new Date().toISOString(),
            payment_ids: [],
          },
          true,              
          paymentType 
        );
      } catch (err: any) {
        toast.error(err.message || 'Failed to create subscription');
      } finally {
        setIsProcessing(null);
      }
    },
    [initiatePayment, isProcessing, plans, societyId]
  );

  const generateReferralLink = useCallback(async (subscriptionId: string) => {
    if (isProcessing) return;
    setIsProcessing(subscriptionId);
    try {
      const response = await apiClient('/generate-referral', {
        method: 'POST',
        body: { societyId, subscriptionId },
        withAuth: true,
      });
      setReferralLink(response.referralLink || `https://waardian.com/refer?society=${societyId}&sub=${subscriptionId}`);
      setShowReferralModal(subscriptionId);
      toast.success('Referral link generated successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate referral link');
    } finally {
      setIsProcessing(null);
    }
  }, [isProcessing, societyId]);

  const copyReferralLink = useCallback(() => {
    navigator.clipboard.writeText(referralLink).then(() => {
      toast.success('Referral link copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy referral link');
    });
  }, [referralLink]);

  const handleExtendClick = (subscriptionId: string) => {
    console.log('handleExtendClick:', { subscriptionId });
    setSelectedSubscriptionId(subscriptionId);
    setSelectedAction('extend');
    setShowPaymentTypeModal('true');
  };

  const handleRenewClick = (subscriptionId: string) => {
    console.log('handleRenewClick:', { subscriptionId });
    setSelectedSubscriptionId(subscriptionId);
    setSelectedAction('renew');
    setShowPaymentTypeModal('true');
  };

  const handlePaymentTypeSelect = (type: 'recurring' | 'one-time') => {
    console.log('handlePaymentTypeSelect:', { selectedSubscriptionId, selectedAction, type });
    if (selectedSubscriptionId) {
      const subscription = subscriptionRecords.find((s) => s.id === selectedSubscriptionId);
      if (!subscription) {
        toast.error('Subscription not found');
        setShowPaymentTypeModal(null);
        setSelectedSubscriptionId(null);
        setSelectedAction(null);
        setSelectedPaymentType(null);
        return;
      }
      const planId = parseInt(subscription.plan_id);
      if (selectedAction === 'extend') {
        setSelectedPaymentType(type);
        setShowExtendModal(selectedSubscriptionId);
        setShowPaymentTypeModal(null);
      } else if (selectedAction === 'renew') {
        console.log('Calling renewSubscription:', { subscriptionId: selectedSubscriptionId, planId, type });
        renewSubscription(selectedSubscriptionId, planId, type);
        setShowPaymentTypeModal(null);
      }
    } else {
      toast.error('No subscription selected');
    }
    setSelectedSubscriptionId(null);
    setSelectedAction(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-blue-600" />
          <div className="text-gray-700 font-semibold">Loading your billing details...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
        <div className="bg-white rounded-xl shadow-lg border p-8 max-w-md text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Something Went Wrong</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => fetchData()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-6 sm:p-8">
      <div className="max-w-6xl mx-auto">
        {subscriptionRecords.some(record => calculateDaysRemaining(record.end_date) < 15 && record.status === 'active') && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-8 rounded-md shadow-sm animate-pulse">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-amber-500 mr-2 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-800">Subscription Ending Soon!</h3>
                <p className="text-amber-700 text-sm">One or more subscriptions will expire soon. Renew or extend now to avoid service interruption.</p>
              </div>
            </div>
          </div>
        )}

        {subscriptionRecords.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {subscriptionRecords.map((record) => {
                const daysRemaining = calculateDaysRemaining(record.end_date);
                const progress = calculateProgress(record.start_date, record.end_date);

                return (
                  <React.Fragment key={record.id}>
                    <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all transform hover:scale-105">
                      <div className="flex items-center justify-between mb-2">
                        <Clock className="w-5 h-5 text-orange-500" />
                        <span className="text-xs text-gray-500">DAYS LEFT</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        <AnimatedCounter value={daysRemaining} />
                      </div>
                      <div className="text-sm text-gray-600">Until renewal</div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all transform hover:scale-105">
                      <div className="flex items-center justify-between mb-2">
                        <Users className="w-5 h-5 text-blue-500" />
                        <span className="text-xs text-gray-500">TOTAL FLATS</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        <AnimatedCounter value={record.total_flats} />
                      </div>
                      <div className="text-sm text-gray-600">Managed units</div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all transform hover:scale-105">
                      <div className="flex items-center justify-between mb-2">
                        <Package className="w-5 h-5 text-green-500" />
                        <span className="text-xs text-gray-500">MODULES</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        <AnimatedCounter value={record.modules.length} />
                      </div>
                      <div className="text-sm text-gray-600">Active features</div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all transform hover:scale-105">
                      <div className="flex items-center justify-between mb-2">
                        <TrendingUp className="w-5 h-5 text-purple-500" />
                        <span className="text-xs text-gray-500">MONTHLY</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        ₹<AnimatedCounter value={Math.round(record.amount / record.billing_months)} />
                      </div>
                      <div className="text-sm text-gray-600">Per month</div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>

            <div className="space-y-6">
              {subscriptionRecords.map((record) => {
                const daysRemaining = calculateDaysRemaining(record.end_date);
                const progress = calculateProgress(record.start_date, record.end_date);
                const StatusIcon = record.status === 'active' ? CheckCircle :
                                  record.status === 'inactive' ? AlertCircle :
                                  record.status === 'cancelled' ? XCircle :
                                  record.status === 'expired' ? Clock : AlertCircle;

                return (
                  <div
                    key={record.id}
                    className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all transform hover:scale-[1.01]"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <StatusIcon
                          className={`w-6 h-6 ${
                            record.status === 'active' ? 'text-green-500' :
                            record.status === 'inactive' ? 'text-yellow-500' :
                            record.status === 'cancelled' ? 'text-red-500' :
                            record.status === 'expired' ? 'text-orange-500' : 'text-gray-500'
                          }`}
                        />
                        <h2 className="text-xl font-bold text-gray-900">
                          Subscription #{record.id}
                        </h2>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          record.status === 'active' ? 'bg-green-100 text-green-700' :
                          record.status === 'inactive' ? 'bg-yellow-100 text-yellow-700' :
                          record.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                          record.status === 'expired' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Subscription Details</h3>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex justify-between">
                            <span>Plan:</span>
                            <span className="font-medium text-gray-900">
                              {plans.find((p) => p.id === parseInt(record.plan_id))?.name || 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Payment Cycle:</span>
                            <span className="font-medium text-gray-900">
                              {record.payment_cycle === 'recurring' ? 'Recurring' : 'One-Time'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total Flats:</span>
                            <span className="font-medium text-gray-900">{record.total_flats}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Amount:</span>
                            <span className="font-medium text-gray-900">
                              ₹{record.amount.toLocaleString()}
                            </span>
                          </div>
                          {record.discount > 0 && (
                            <div className="flex justify-between">
                              <span>Discount:</span>
                              <span className="font-medium text-green-600">
                                -₹{record.discount.toLocaleString()}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span>Start Date:</span>
                            <span className="font-medium text-gray-900">
                              {new Date(record.start_date).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>End Date:</span>
                            <span className="font-medium text-gray-900">
                              {new Date(record.end_date).toLocaleDateString()}
                            </span>
                          </div>
                          {record.trial_ends_at && (
                            <div className="flex justify-between">
                              <span>Trial Ends:</span>
                              <span className="font-medium text-gray-900">
                                {new Date(record.trial_ends_at).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">Subscription Progress</h3>
                          <CircularProgress percentage={progress} />
                        </div>
                        <div className="text-sm text-gray-600 mb-4">
                          <p>
                            {daysRemaining > 0
                              ? `${daysRemaining} days remaining`
                              : 'Subscription expired'}
                          </p>
                        </div>
                        <div className="space-y-3">
                          {record.payment_ids.length > 0 && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => downloadInvoice(record.id)}
                                disabled={isProcessing === record.id}
                                className="flex-1 flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all disabled:bg-gray-300"
                              >
                                {isProcessing === record.id ? (
                                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                                ) : (
                                  <Download className="h-5 w-5 mr-2" />
                                )}
                                Download
                              </button>
                              <button
                                onClick={() => downloadInvoice(record.id, true)}
                                disabled={isProcessing === record.id}
                                className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all disabled:bg-gray-300"
                              >
                                {isProcessing === record.id ? (
                                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                                ) : (
                                  <Share2 className="h-5 w-5 mr-2" />
                                )}
                                Email
                              </button>
                            </div>
                          )}
                          {record.status === 'active' && record.payment_cycle === 'one-time' && (
                            <>
                              <button
                                onClick={() => setShowPlanModal(record.id)}
                                disabled={isProcessing === record.id}
                                className="w-full flex items-center justify-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all disabled:bg-gray-300"
                              >
                                <Zap className="h-5 w-5 mr-2" />
                                Change Plan
                              </button>
                              <button
                                onClick={() => handleExtendClick(record.id)}
                                disabled={isProcessing === record.id}
                                className="w-full flex items-center justify-center px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-all disabled:bg-gray-300"
                              >
                                <Calendar className="h-5 w-5 mr-2" />
                                Extend Subscription
                              </button>
                              <button
                                onClick={() => generateReferralLink(record.id)}
                                disabled={isProcessing === record.id}
                                className="w-full flex items-center justify-center px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-all disabled:bg-gray-300"
                              >
                                <Share2 className="h-5 w-5 mr-2" />
                                Refer & Earn
                              </button>
                            </>
                          )}
                          {( (record.status === 'active' || record.status === 'authenticated') 
                              && record.payment_cycle === 'recurring') && (
                                <button
                                  onClick={() => showCancelConfirmation(record.id)}
                                  disabled={isProcessing === record.id}
                                  className="w-full flex items-center justify-center px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all disabled:bg-gray-300"
                                >
                                  <Ban className="h-5 w-5 mr-2" />
                                  Cancel Subscription
                                </button>
                            )}
                          {(record.status === 'inactive' || record.status === 'expired') && (
                            <button
                              onClick={() => initiatePayment({
                                ...record,
                                payment_cycle: 'one-time',
                              }, false, 'one-time')}
                              disabled={isProcessing === record.id}
                              className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all disabled:bg-gray-300"
                            >
                              <RotateCcw className="h-5 w-5 mr-2" />
                              Make Payment
                            </button>
                          )}
                          {(record.status === 'cancelled' || record.status === 'expired') && (
                            <button
                              onClick={() => handleRenewClick(record.id)}
                              disabled={isProcessing === record.id}
                              className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:bg-gray-300"
                            >
                              <RefreshCw className="h-5 w-5 mr-2" />
                              Renew Subscription
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {showPaymentTypeModal && selectedSubscriptionId === record.id && (
                      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl border border-gray-200">
                          <h3 className="text-2xl font-bold text-gray-900 mb-4">
                            {selectedAction === 'extend' ? 'Extend Subscription' : 'Renew Subscription'}
                          </h3>
                          <p className="text-gray-600 mb-6">Choose your preferred payment method. You can cancel anytime.</p>
                          <div className="space-y-4">
                            <div
                              className="p-4 border border-green-200 rounded-lg cursor-pointer hover:border-green-500 transition-all"
                              onClick={() => handlePaymentTypeSelect('recurring')}
                            >
                              <h4 className="font-semibold text-gray-900 mb-2">Switch to Recurring (Recommended)</h4>
                              <ul className="text-sm text-gray-600 space-y-1">
                                <li className="flex items-center">
                                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                                  Automatic renewals
                                </li>
                                <li className="flex items-center">
                                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                                  Exclusive discounts
                                </li>
                                <li className="flex items-center">
                                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                                  Hassle-free management
                                </li>
                                <li className="flex items-center">
                                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                                  Cancel anytime
                                </li>
                              </ul>
                            </div>
                            <div
                              className="p-4 border border-blue-200 rounded-lg cursor-pointer hover:border-blue-500 transition-all"
                              onClick={() => handlePaymentTypeSelect('one-time')}
                            >
                              <h4 className="font-semibold text-gray-900 mb-2">Continue with One-Time Payment</h4>
                              <p className="text-sm text-gray-600">Single payment, no automatic renewal.</p>
                            </div>
                          </div>
                          <div className="mt-6 flex justify-end">
                            <button
                              onClick={() => {
                                setShowPaymentTypeModal(null);
                                setSelectedSubscriptionId(null);
                                setSelectedAction(null);
                                setSelectedPaymentType(null);
                              }}
                              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {showPlanModal === record.id && (
                      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-6 max-w-lg w-full shadow-2xl">
                          <h3 className="text-xl font-bold text-gray-900 mb-4">Choose a New Plan</h3>
                          <div className="space-y-4">
                            {plans.map((plan) => (
                              <div
                                key={plan.id}
                                className={`p-4 border rounded-lg cursor-pointer hover:border-blue-300 transition-all ${
                                  parseInt(record.plan_id) === plan.id ? 'border-blue-500' : 'border-gray-200'
                                }`}
                                onClick={() => changePlan(record.id, plan.id, record.payment_cycle)}
                              >
                                <h4 className="font-medium text-gray-900">{plan.name}</h4>
                                <p className="text-sm text-gray-600">{plan.description}</p>
                                <p className="text-sm text-gray-600">
                                  ₹{plan.price_per_flat.toLocaleString('en-IN')} per flat for {plan.numberOfMonths} months
                                </p>
                              </div>
                            ))}
                          </div>
                          <div className="mt-6 flex justify-end">
                            <button
                              onClick={() => setShowPlanModal(null)}
                              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {showExtendModal === record.id && (
                      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-6 max-w-lg w-full shadow-2xl">
                          <h3 className="text-xl font-bold text-gray-900 mb-4">Extend Your Subscription</h3>
                          <div className="space-y-4">
                            {plans.map((plan) => (
                              <div
                                key={plan.id}
                                className={`p-4 border rounded-lg cursor-pointer hover:border-blue-300 transition-all ${
                                  parseInt(record.plan_id) === plan.id ? 'border-blue-500' : 'border-gray-200'
                                }`}
                                onClick={() => {
                                  if (selectedPaymentType) {
                                    extendSubscription(record.id, plan.id, selectedPaymentType);
                                  } else {
                                    toast.error('Please select a payment type first');
                                  }
                                }}
                              >
                                <h4 className="font-medium text-gray-900">{plan.name}</h4>
                                <p className="text-sm text-gray-600">{plan.description}</p>
                                <p className="text-sm text-gray-600">
                                  ₹{plan.price_per_flat.toLocaleString('en-IN')} per flat for {plan.numberOfMonths} months
                                </p>
                              </div>
                            ))}
                          </div>
                          <div className="mt-6 flex justify-end">
                            <button
                              onClick={() => {
                                setShowExtendModal(null);
                                setSelectedSubscriptionId(null);
                                setSelectedAction(null);
                                setSelectedPaymentType(null);
                              }}
                              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {subscriptionRecords.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Subscriptions Found</h3>
            <p className="text-gray-600 mb-6">
              It looks like you don’t have any active subscriptions. Start by selecting a plan.
            </p>
            <div className="space-y-4">
              {plans.map((plan) => (
                <div key={plan.id} className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900">{plan.name}</h4>
                  <p className="text-sm text-gray-600">{plan.description}</p>
                  <p className="text-sm text-gray-600">
                    ₹{plan.price_per_flat.toLocaleString('en-IN')} per flat
                  </p>
                  <div className="mt-4 flex space-x-4 justify-center">
                    <button
                      onClick={() => createSubscription(plan.id, 'one-time', 1)}
                      disabled={isProcessing === 'new'}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                    >
                      One-Time
                    </button>
                    <button
                      onClick={() => createSubscription(plan.id, 'recurring', 1)}
                      disabled={isProcessing === 'new'}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
                    >
                      Recurring
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {showExpirationPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Subscription Expiration Warning
              </h3>
              <p className="text-gray-600 mb-4">
                Your subscription expires in {calculateDaysRemaining(showExpirationPopup.end_date)} days. Renew now to avoid interruption.
              </p>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowExpirationPopup(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setSelectedSubscriptionId(showExpirationPopup.id);
                    setSelectedAction('renew');
                    setShowPaymentTypeModal('true');
                    setShowExpirationPopup(null);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Renew Now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Subscription Confirmation Modal */}
        {showCancelConfirmModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Cancel Subscription
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to cancel this subscription? This action cannot be undone and your subscription will be cancelled immediately.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowCancelConfirmModal(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => cancelSubscription(showCancelConfirmModal)}
                  disabled={isProcessing === showCancelConfirmModal}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-red-400 flex items-center"
                >
                  {isProcessing === showCancelConfirmModal && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Yes, Cancel Subscription
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default BillingPage;