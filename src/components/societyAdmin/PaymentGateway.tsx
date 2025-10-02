'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Settings, CreditCard, CheckCircle, Shield, AlertCircle } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';

// Import finance components
import { SelfIntegrationForm, WaardianGatewayForm, GatewayStatus } from '@/components/finance';

export default function PaymentGatewayPage() {
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<'self' | 'waardian' | null>(null);

  useEffect(() => {
    checkGatewayStatus();
  }, []);

  const checkGatewayStatus = async () => {
    try {
      setLoading(true);
      const response = await apiClient('/gateway/gateway_status', {
        method: 'GET',
        withAuth: true,
      });

      if (response.status === 'success' && response.data) {
        // Check if gateway data exists (either self or waardian type)
        const hasGatewayData = response.data.type && 
          (response.data.selfGatewayDetails || response.data.accountDetails);
        setIsRegistered(!!hasGatewayData);
      } else {
        setIsRegistered(false);
      }
    } catch (error) {
      console.error('Error checking gateway status:', error);
      setIsRegistered(false);
    } finally {
      setLoading(false);
    }
  };

  const handleGatewaySelect = (gateway: 'self' | 'waardian') => {
    setSelectedGateway(gateway);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setIsRegistered(true);
    setShowForm(false);
    setSelectedGateway(null);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isRegistered) {
    return (
      <div className="container mx-auto p-6">
        <div className="max-w-4xl mx-auto">
          <GatewayStatus onEdit={() => setShowForm(true)} />
        </div>
      </div>
    );
  }

  if (showForm && selectedGateway) {
    return (
      <div className="container mx-auto p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Button 
              variant="outline" 
              onClick={() => setShowForm(false)}
              className="mb-4"
            >
              ← Back to Gateway Selection
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {selectedGateway === 'self' ? 'Integrate Your Gateway' : 'Waardian\'s Razorpay Setup'}
            </h1>
            <p className="text-gray-600">
              {selectedGateway === 'self' 
                ? 'Configure your own payment gateway credentials'
                : 'Set up your account with Waardian\'s Razorpay integration via routes'
              }
            </p>
          </div>
          
          {selectedGateway === 'self' ? (
            <SelfIntegrationForm onSuccess={handleFormSuccess} />
          ) : (
            <WaardianGatewayForm onSuccess={handleFormSuccess} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Gateway</h1>
          <p className="text-gray-600">Choose how you want to handle payments for your society</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Self Integration Option */}
          <Card className="cursor-pointer transition-all duration-200 hover:shadow-lg border-2 hover:border-blue-200">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
                <Settings className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-xl font-semibold">Integrate Your Gateway</CardTitle>
              <CardDescription className="text-sm text-gray-600">
                Use your own payment gateway credentials
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Full control over your payments
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Direct settlement to your account
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Your existing gateway rates
                </div>
              </div>
              
              <Separator />
              
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="flex items-center text-sm text-green-700">
                  <Shield className="h-4 w-4 mr-2" />
                  <span className="font-medium">100% Secure & Encrypted</span>
                </div>
                <p className="text-xs text-green-600 mt-1">
                  Your API keys are encrypted and stored securely
                </p>
              </div>
              
              <Button 
                onClick={() => handleGatewaySelect('self')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Configure Your Gateway
              </Button>
            </CardContent>
          </Card>

          {/* Waardian Gateway Option */}
          <Card className="cursor-pointer transition-all duration-200 hover:shadow-lg border-2 hover:border-purple-200">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-3 bg-purple-100 rounded-full w-fit">
                <CreditCard className="h-8 w-8 text-purple-600" />
              </div>
              <CardTitle className="text-xl font-semibold">Waardian's Razorpay</CardTitle>
              <CardDescription className="text-sm text-gray-600">
                Use Waardian's Razorpay integration via routes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Quick setup and onboarding
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Competitive transaction rates
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  24/7 support and maintenance
                </div>
              </div>
              
              <Separator />
              
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="flex items-center text-sm text-purple-700">
                  <Shield className="h-4 w-4 mr-2" />
                  <span className="font-medium">100% Secure & Encrypted</span>
                </div>
                <p className="text-xs text-purple-600 mt-1">
                  Hassle-free integration with full compliance
                </p>
              </div>
              
              <Button 
                onClick={() => handleGatewaySelect('waardian')}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                Setup Waardian's Razorpay
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-gray-900">Need Help Choosing?</h3>
              <p className="text-sm text-gray-600 mt-1">
                If you already have a payment gateway account with competitive rates, choose "Integrate Your Gateway". 
                For new setups or if you want a hassle-free experience, "Waardian Gateway" is recommended.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}