                    'use client';

import { useState, useEffect, useCallback } from 'react';
import { CreditCard, Download, Calendar, Users, Package, CheckCircle, AlertCircle, XCircle, Clock, TrendingUp, Zap, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiClient } from '@/lib/apiClient';

interface SubscriptionRecord {
  id: string;
  society_id: string;
  plan_id: string;
  payment_cycle: string;
  amount: number;
  discount: number;
  total_flats: number;
  modules: string[];
  billing_months: number;
  razorpay_subscription_id: string | null;
  status: 'active' | 'inactive' | 'cancelled';
  created_at: string;
  start_date: string;
  end_date: string;
  trial_ends_at: string | null;
  updated_at: string;
}

interface Plan {
  id: number;
  name: string;
  description: string;
  price_per_flat: number;
  number_of_months: number;
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
  const [subscriptionRecords, setSubscriptionRecords] = useState<SubscriptionRecord[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [showPlanModal, setShowPlanModal] = useState<string | null>(null);

  const fetchData = useCallback(async (retryCount = 3) => {
    setLoading(true);
    setError(null);
    try {
      // Fetch subscriptions
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

      // Fetch plans
      const plansData = await apiClient('/onboarding/getSubscriptionPlans', { withAuth: true });
      setPlans(plansData.plans || []);
    } catch (err: any) {
      if (retryCount > 0) {
        // console.log(`Retrying fetchData, attempts left: ${retryCount}`);
        setTimeout(() => fetchData(retryCount - 1), 1000);
      } else {
        console.error('Failed to fetch data:', err.message);
        setError(err.message || 'Failed to load data');
      }
    } finally {
      setLoading(false);
    }
  }, [societyId]);

  useEffect(() => {
    const loadRazorpayScript = () => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
      return () => document.body.removeChild(script);
    };
    loadRazorpayScript();
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

  const downloadInvoice = useCallback((recordId: string) => {
    if (isProcessing) return; // Prevent concurrent actions
    setIsProcessing(recordId);
    // console.log(`Downloading invoice for subscription ${recordId}`);
    toast('Invoice download not yet implemented', {
      icon: 'ℹ️',
    });
    setIsProcessing(null);
  }, [isProcessing]);

  const initiatePayment = useCallback(async (record: SubscriptionRecord) => {
    if (isProcessing) return; // Prevent concurrent actions
    setIsProcessing(record.id);
    try {
      const [plan] = plans.filter((p) => p.id === parseInt(record.plan_id));
      if (!plan) throw new Error('Plan not found');

      const payload = {
        societyId,
        planId: record.plan_id,
        paymentType: record.payment_cycle,
        billingMonths: record.billing_months,
        totalFlats: record.total_flats,
        amount: record.amount,
        promoCode: '',
      };

      const order = await apiClient('/create-order', {
        method: 'POST',
        body: payload,
        withAuth: true,
      });

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'Waardian',
        description: `Payment for Subscription #${record.id}`,
        handler: async (response: any) => {
          toast.success('Payment successful!');
          await fetchData();
          setIsProcessing(null);
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(null);
            toast.error('Payment cancelled');
          },
        },
        prefill: {
          email: 'society@example.com', // Replace with actual society email
          contact: '1234567890', // Replace with actual contact
        },
        notes: {
          society_id: societyId,
          plan_id: record.plan_id,
          payment_type: record.payment_cycle,
          billing_months: record.billing_months,
        },
        theme: {
          color: '#2563EB',
        },
      };

      if (record.payment_cycle === 'recurring') {
        (options as any).subscription_id = order.id;
      } else {
        (options as any).order_id = order.id;
      }

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', (response: any) => {
        setIsProcessing(null);
        toast.error(response.error.description || 'Payment failed');
      });
      rzp.open();
    } catch (err: any) {
      setIsProcessing(null);
      toast.error(err.message || 'Failed to initiate payment');
    }
  }, [fetchData, isProcessing, plans, societyId]);

  const changePlan = useCallback(async (subscriptionId: string, newPlanId: number, newPaymentType: string) => {
    if (isProcessing) return; // Prevent concurrent actions
    setIsProcessing(subscriptionId);
    try {
      const [plan] = plans.filter((p) => p.id === newPlanId);
      if (!plan) throw new Error('Plan not found');

      const payload = {
        subscriptionId,
        newPlanId,
        paymentType: newPaymentType,
        billingMonths: newPaymentType === 'recurring' ? plan.number_of_months : 1,
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

  const cancelSubscription = useCallback(async (subscriptionId: string) => {
    if (isProcessing) return; // Prevent concurrent actions
    setIsProcessing(subscriptionId);
    try {
      await apiClient('/cancel-subscription', {
        method: 'POST',
        body: { subscriptionId },
        withAuth: true,
      });

      toast.success('Subscription cancelled successfully!');
      await fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel subscription');
    } finally {
      setIsProcessing(null);
    }
  }, [fetchData, isProcessing]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 animate-spin rounded-full border-3 border-gray-300 border-t-blue-600"></div>
          <div className="text-gray-600 font-medium">Loading billing details...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-sm border p-6 max-w-md text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Data</h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Billing Overview</h1>
          </div>
          <p className="text-gray-600">Manage your subscription and billing information</p>
        </div>

        {subscriptionRecords.length > 0 && (
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {subscriptionRecords.map((record) => {
                const daysRemaining = calculateDaysRemaining(record.end_date);
                const progress = calculateProgress(record.start_date, record.end_date);
                const monthlyAmount = record.amount / record.billing_months;

                return [
                  <div key={`${record.id}-days`} className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <Clock className="w-5 h-5 text-orange-500" />
                      <span className="text-xs text-gray-500">DAYS LEFT</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      <AnimatedCounter value={daysRemaining} />
                    </div>
                    <div className="text-sm text-gray-600">Until renewal</div>
                  </div>,
                  <div key={`${record.id}-flats`} className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <Users className="w-5 h-5 text-blue-500" />
                      <span className="text-xs text-gray-500">TOTAL FLATS</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      <AnimatedCounter value={record.total_flats} />
                    </div>
                    <div className="text-sm text-gray-600">Managed units</div>
                  </div>,
                  <div key={`${record.id}-modules`} className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <Package className="w-5 h-5 text-green-500" />
                      <span className="text-xs text-gray-500">MODULES</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      <AnimatedCounter value={record.modules.length} />
                    </div>
                    <div className="text-sm text-gray-600">Active features</div>
                  </div>,
                  <div key={`${record.id}-monthly`} className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <TrendingUp className="w-5 h-5 text-purple-500" />
                      <span className="text-xs text-gray-500">MONTHLY</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      ₹<AnimatedCounter value={Math.round(monthlyAmount)} />
                    </div>
                    <div className="text-sm text-gray-600">Per month</div>
                  </div>,
                ];
              })}
            </div>

            {/* Main Subscription Cards */}
            <div className="space-y-6">
              {subscriptionRecords.map((record) => {
                const daysRemaining = calculateDaysRemaining(record.end_date);
                const progress = calculateProgress(record.start_date, record.end_date);
                const StatusIcon = record.status === 'active' ? CheckCircle :
                                  record.status === 'inactive' ? AlertCircle : XCircle;

                return (
                  <div
                    key={record.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <StatusIcon
                          className={`w-6 h-6 ${
                            record.status === 'active'
                              ? 'text-green-500'
                              : record.status === 'inactive'
                              ? 'text-yellow-500'
                              : 'text-red-500'
                          }`}
                        />
                        <h2 className="text-xl font-semibold text-gray-900">
                          Subscription #{record.id}
                        </h2>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          record.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : record.status === 'inactive'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Subscription Details */}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-3">Details</h3>
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

                      {/* Progress and Actions */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-medium text-gray-900">Progress</h3>
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
                          <button
                            onClick={() => downloadInvoice(record.id)}
                            disabled={isProcessing === record.id}
                            className="w-full flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:bg-gray-300"
                          >
                            {isProcessing === record.id ? (
                              <Loader2 className="animate-spin h-5 w-5 mr-2" />
                            ) : (
                              <Download className="h-5 w-5 mr-2" />
                            )}
                            Download Invoice
                          </button>
                          {record.status === 'active' && (
                            <>
                              <button
                                onClick={() => setShowPlanModal(record.id)}
                                disabled={isProcessing === record.id}
                                className="w-full flex items-center justify-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:bg-gray-300"
                              >
                                <Zap className="h-5 w-5 mr-2" />
                                Change Plan
                              </button>
                              <button
                                onClick={() => initiatePayment(record)}
                                disabled={isProcessing === record.id || daysRemaining > 30}
                                className="w-full flex items-center justify-center px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:bg-gray-300"
                              >
                                <Calendar className="h-5 w-5 mr-2" />
                                Renew Subscription
                              </button>
                              {record.payment_cycle === 'recurring' && (
                                <button
                                  onClick={() => cancelSubscription(record.id)}
                                  disabled={isProcessing === record.id}
                                  className="w-full flex items-center justify-center px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:bg-gray-300"
                                >
                                  <XCircle className="h-5 w-5 mr-2" />
                                  Cancel Subscription
                                </button>
                              )}
                            </>
                          )}
                          {record.status === 'inactive' && (
                            <button
                              onClick={() => initiatePayment(record)}
                              disabled={isProcessing === record.id}
                              className="w-full flex items-center justify-center px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:bg-gray-300"
                            >
                              <Zap className="h-5 w-5 mr-2" />
                              Reactivate Subscription
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Change Plan Modal */}
                    {showPlanModal === record.id && (
                      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-lg w-full">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Change Subscription Plan
                          </h3>
                          <div className="space-y-4">
                            {plans.map((plan) => (
                              <div
                                key={plan.id}
                                className={`p-4 border rounded-lg cursor-pointer hover:border-blue-300 transition-all ${
                                  parseInt(record.plan_id) === plan.id
                                    ? 'border-blue-500'
                                    : 'border-gray-200'
                                }`}
                                onClick={() =>
                                  changePlan(
                                    record.id,
                                    plan.id,
                                    record.payment_cycle
                                  )
                                }
                              >
                                <h4 className="font-medium text-gray-900">{plan.name}</h4>
                                <p className="text-sm text-gray-600">{plan.description}</p>
                                <p className="text-sm text-gray-600">
                                  ₹{plan.price_per_flat.toLocaleString()} per flat
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
                  </div>
                );
              })}
            </div>
          </>
        )}

        {subscriptionRecords.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Subscriptions Found
            </h3>
            <p className="text-gray-600 mb-4">
              It looks like you don’t have any active subscriptions. Start by selecting a plan.
            </p>
            <button
              onClick={() => initiatePayment({} as SubscriptionRecord)} // Placeholder for new subscription
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Start Subscription
            </button>
          </div>
        )}
      </div>
    </main>
  );
};

export default BillingPage;