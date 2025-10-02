'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertTriangle, 
  Edit, 
  Eye, 
  EyeOff,
  CreditCard,
  Building2,
  RefreshCw
} from 'lucide-react';
import { apiClient } from '@/lib/apiClient';

interface GatewayStatusProps {
  onEdit: () => void;
}

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
  transactionStats?: {
    totalTransactions: number;
    totalAmount: number;
    successRate: number;
  };
}

export default function GatewayStatus({ onEdit }: GatewayStatusProps) {
  const [gatewayInfo, setGatewayInfo] = useState<GatewayInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSensitive, setShowSensitive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGatewayStatus = async () => {
    try {
      setRefreshing(true);
      const response = await apiClient('/gateway/gateway_status', {
        method: 'GET',
        withAuth: true,
      });

      if (response.status === 'success') {
        setGatewayInfo(response.data);
        setError(null);
      } else {
        setError(response.message || 'Failed to fetch gateway status');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to fetch gateway status');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchGatewayStatus();
  }, []);

  const getStatusBadge = (status: string) => {
  const statusConfig = {
    active: { text: 'Active', color: 'bg-green-100 text-green-700 border-green-200' },
    pending: { text: 'Pending', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    'in review': { text: 'In Review', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    blocked: { text: 'Blocked', color: 'bg-red-100 text-red-700 border-red-200' },
    rejected: { text: 'Rejected', color: 'bg-red-100 text-red-700 border-red-200' },
    inactive: { text: 'Inactive', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${config.color}`}
    >
      {config.text}
    </span>
  );
};


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2 text-gray-600">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Loading gateway status...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="py-12">
          <div className="text-center space-y-4">
            <XCircle className="h-12 w-12 text-red-500 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Error Loading Status</h3>
              <p className="text-gray-600 mt-1">{error}</p>
            </div>
            <Button onClick={fetchGatewayStatus} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!gatewayInfo) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="py-12">
          <div className="text-center space-y-4">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">No Gateway Configured</h3>
              <p className="text-gray-600 mt-1">Set up your payment gateway to start accepting payments.</p>
            </div>
            <Button onClick={onEdit}>
              Configure Gateway
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Main Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {gatewayInfo.type === 'waardian' ? (
                <Building2 className="h-6 w-6 text-blue-600" />
              ) : (
                <CreditCard className="h-6 w-6 text-green-600" />
              )}
              <div>
                <CardTitle>
                  {gatewayInfo.type === 'waardian' ? 'Waardian Gateway' : 'Self-Integrated Gateway'}
                </CardTitle>
                <CardDescription>
                  {gatewayInfo.type === 'waardian' 
                    ? 'Using Waardian\'s secure payment infrastructure'
                    : `Integrated with ${gatewayInfo.provider || 'External Provider'}`
                  }
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(gatewayInfo.status)}
              <Button
                variant="outline"
                size="sm"
                onClick={fetchGatewayStatus}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              {/* <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button> */}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Waardian Gateway Details */}
          {gatewayInfo.type === 'waardian' && gatewayInfo.accountDetails && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Account Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Business Name</label>
                    <p className="text-sm text-gray-900">{gatewayInfo.accountDetails.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Category</label>
                    <p className="text-sm text-gray-900">{gatewayInfo.accountDetails.category}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Contact Person</label>
                    <p className="text-sm text-gray-900">{gatewayInfo.accountDetails.contactPerson}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Account Number</label>
                    <p className="text-sm text-gray-900 font-mono">
                      {showSensitive 
                        ? gatewayInfo.accountDetails.accountNumber
                        : `****${gatewayInfo.accountDetails.accountNumber.slice(-4)}`
                      }
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">IFSC Code</label>
                    <p className="text-sm text-gray-900 font-mono">{gatewayInfo.accountDetails.ifsc}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Registration Date</label>
                    <p className="text-sm text-gray-900">{formatDate(gatewayInfo.accountDetails.registrationDate)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Self Gateway Details */}
          {gatewayInfo.type === 'self' && gatewayInfo.selfGatewayDetails && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Gateway Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Provider</label>
                    <p className="text-sm text-gray-900">{gatewayInfo.selfGatewayDetails.provider}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">API Key</label>
                    <p className="text-sm text-gray-900 font-mono">{gatewayInfo.selfGatewayDetails.apiKeyMasked}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Configured Date</label>
                    <p className="text-sm text-gray-900">{formatDate(gatewayInfo.selfGatewayDetails.configuredDate)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Last Used</label>
                    <p className="text-sm text-gray-900">{formatDate(gatewayInfo.selfGatewayDetails.lastUsed)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Show/Hide Sensitive Data Toggle */}
          {gatewayInfo.type === 'waardian' && (
            <div className="flex items-center justify-between pt-4 border-t">
              <span className="text-sm text-gray-600">Show sensitive information</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSensitive(!showSensitive)}
              >
                {showSensitive ? (
                  <><EyeOff className="h-4 w-4 mr-2" />Hide</>
                ) : (
                  <><Eye className="h-4 w-4 mr-2" />Show</>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Statistics
      {gatewayInfo.transactionStats && (
        <Card>
          <CardHeader>
            <CardTitle>Transaction Statistics</CardTitle>
            <CardDescription>Overview of your payment gateway performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {gatewayInfo.transactionStats.totalTransactions.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Total Transactions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(gatewayInfo.transactionStats.totalAmount)}
                </div>
                <div className="text-sm text-gray-600">Total Amount</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {gatewayInfo.transactionStats.successRate.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Success Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )} */}

      {/* Status-specific Messages */}
      {(gatewayInfo.status === 'pending' || gatewayInfo.status === 'in review') && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800">
                  {gatewayInfo.status === 'in review' ? 'Account In Review' : 'Account Under Review'}
                </h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Your account registration is being reviewed by our team. This process typically takes 1-2 business days.
                  You'll receive an email notification once the review is complete.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {gatewayInfo.status === 'blocked' && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-800">Account Blocked</h4>
                <p className="text-sm text-red-700 mt-1">
                  Your account has been temporarily blocked. Please contact support for assistance
                  or check your email for more information about the block reason.
                </p>
                <Button variant="outline" size="sm" className="mt-3" onClick={onEdit}>
                  Contact Support
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {gatewayInfo.status === 'rejected' && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-800">Account Rejected</h4>
                <p className="text-sm text-red-700 mt-1">
                  Your account registration was rejected. Please check your email for details about the rejection reason
                  and steps to resubmit your application.
                </p>
                <Button variant="outline" size="sm" className="mt-3" onClick={onEdit}>
                  Resubmit Application
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {gatewayInfo.status === 'inactive' && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-800">Gateway Inactive</h4>
                <p className="text-sm text-red-700 mt-1">
                  Your payment gateway is currently inactive. Contact support to reactivate your account
                  or update your gateway configuration.
                </p>
                <Button variant="outline" size="sm" className="mt-3" onClick={onEdit}>
                  Reactivate Gateway
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}