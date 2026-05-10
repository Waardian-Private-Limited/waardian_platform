'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Smartphone, Landmark, CreditCard, Save, RefreshCw, CheckCircle2 } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'react-hot-toast';

interface PaymentMethods {
  upi: boolean;
  nb: boolean;
  dc: boolean;
  cc: boolean;
}

export default function PaymentMethodRestrictions() {
  const [methods, setMethods] = useState<PaymentMethods>({
    upi: true,
    nb: true,
    dc: true,
    cc: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await apiClient('/societyadmin/society/payment-settings', {
        method: 'GET',
        withAuth: true,
      });

      if (response.success && response.data) {
        setMethods(response.data);
      }
    } catch (error) {
      console.error('Error fetching payment settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleToggle = (key: keyof PaymentMethods) => {
    setMethods(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await apiClient('/societyadmin/society/payment-settings', {
        method: 'POST',
        withAuth: true,
        body: JSON.stringify({ settings: methods }),
      });

      if (response.success) {
        toast.success('Payment methods updated successfully');
      } else {
        toast.error(response.message || 'Failed to update settings');
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="h-48 flex items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  const MethodToggle = ({ 
    id, 
    label, 
    icon: Icon, 
    description, 
    enabled 
  }: { 
    id: keyof PaymentMethods, 
    label: string, 
    icon: any, 
    description: string, 
    enabled: boolean 
  }) => (
    <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-blue-100 transition-all duration-200 bg-white shadow-sm">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${enabled ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-400'}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h4 className="font-semibold text-gray-900">{label}</h4>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>
      <button
        onClick={() => handleToggle(id)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          enabled ? 'bg-blue-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  return (
    <Card className="overflow-hidden border-none shadow-xl bg-gradient-to-b from-white to-gray-50/50">
      <CardHeader className="bg-white border-b border-gray-100 pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-200">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-gray-900">Payment Controls</CardTitle>
              <CardDescription className="text-sm font-medium text-gray-500">
                Choose which payment methods residents can use
              </CardDescription>
            </div>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-100 transition-all duration-200 active:scale-95"
          >
            {saving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Configuration
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-8 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MethodToggle 
            id="upi"
            label="UPI Payments"
            icon={Smartphone}
            description="GPay, PhonePe, Paytm (Recommended)"
            enabled={methods.upi}
          />
          <MethodToggle 
            id="nb"
            label="Net Banking"
            icon={Landmark}
            description="Direct bank account transfers"
            enabled={methods.nb}
          />
          <MethodToggle 
            id="dc"
            label="Debit Card"
            icon={CreditCard}
            description="Visa, Mastercard, RuPay"
            enabled={methods.dc}
          />
          <MethodToggle 
            id="cc"
            label="Credit Card"
            icon={CreditCard}
            description="All major credit cards"
            enabled={methods.cc}
          />
        </div>

        <div className="mt-8 p-4 rounded-xl bg-blue-50 border border-blue-100">
          <div className="flex gap-3">
            <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0" />
            <p className="text-sm text-blue-800 leading-relaxed">
              <strong>Tip:</strong> Disabling high-surcharge methods like Credit Cards can help reduce processing fees for the society or residents. Changes take effect immediately for all new transactions.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
