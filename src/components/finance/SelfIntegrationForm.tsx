'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';

interface SelfIntegrationFormProps {
  onSuccess: () => void;
}

export default function SelfIntegrationForm({ onSuccess }: SelfIntegrationFormProps) {
  const [formData, setFormData] = useState({
    gateway_provider: 'razorpay',
    api_key: '',
    secret_key: '',
    webhook_secret: '',
  });
  const [showSecrets, setShowSecrets] = useState({
    secret_key: false,
    webhook_secret: false,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const toggleSecretVisibility = (field: 'secret_key' | 'webhook_secret') => {
    setShowSecrets(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.api_key.trim()) {
      newErrors.api_key = 'API Key is required';
    }

    if (!formData.secret_key.trim()) {
      newErrors.secret_key = 'Secret Key is required';
    }

    if (!formData.webhook_secret.trim()) {
      newErrors.webhook_secret = 'Webhook Secret is required';
    }

    if (formData.gateway_provider === 'razorpay') {
      if (!formData.api_key.startsWith('rzp_')) {
        newErrors.api_key = 'Razorpay API Key should start with "rzp_"';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const response = await apiClient('/gateway/configure_gateway', {
        method: 'POST',
        body: formData,
        withAuth: true,
      });

      if (response.status === 'success') {
        onSuccess();
      } else {
        setErrors({ submit: response.message || 'Failed to configure gateway' });
      }
    } catch (error: any) {
      setErrors({ submit: error.message || 'Failed to configure gateway' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          Configure Your Payment Gateway
        </CardTitle>
        <CardDescription>
          Enter your payment gateway credentials. All information is encrypted and stored securely.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Gateway Provider */}
          <div className="space-y-2">
            <label htmlFor="gateway_provider" className="text-sm font-medium text-gray-700">
              Gateway Provider
            </label>
            <select
              id="gateway_provider"
              name="gateway_provider"
              value={formData.gateway_provider}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="razorpay">Razorpay</option>
            </select>
          </div>

          {/* API Key */}
          <div className="space-y-2">
            <label htmlFor="api_key" className="text-sm font-medium text-gray-700">
              API Key *
            </label>
            <input
              type="text"
              id="api_key"
              name="api_key"
              value={formData.api_key}
              onChange={handleInputChange}
              placeholder={formData.gateway_provider === 'razorpay' ? 'rzp_test_...' : 'Enter your API key'}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.api_key ? 'border-red-500' : 'border-gray-300'
                }`}
            />
            {errors.api_key && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.api_key}
              </p>
            )}
          </div>

          {/* Secret Key */}
          <div className="space-y-2">
            <label htmlFor="secret_key" className="text-sm font-medium text-gray-700">
              Secret Key *
            </label>
            <div className="relative">
              <input
                type={showSecrets.secret_key ? 'text' : 'password'}
                id="secret_key"
                name="secret_key"
                value={formData.secret_key}
                onChange={handleInputChange}
                placeholder="Enter your secret key"
                className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.secret_key ? 'border-red-500' : 'border-gray-300'
                  }`}
              />
              <button
                type="button"
                onClick={() => toggleSecretVisibility('secret_key')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showSecrets.secret_key ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.secret_key && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.secret_key}
              </p>
            )}
          </div>

          {/* Webhook Secret */}
          <div className="space-y-2">
            <label htmlFor="webhook_secret" className="text-sm font-medium text-gray-700">
              Webhook Secret *
            </label>
            <div className="relative">
              <input
                type={showSecrets.webhook_secret ? 'text' : 'password'}
                id="webhook_secret"
                name="webhook_secret"
                value={formData.webhook_secret}
                onChange={handleInputChange}
                placeholder="Enter webhook secret for enhanced security"
                className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.webhook_secret ? 'border-red-500' : 'border-gray-300'
                  }`}
              />
              <button
                type="button"
                onClick={() => toggleSecretVisibility('webhook_secret')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showSecrets.webhook_secret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.webhook_secret && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.webhook_secret}
              </p>
            )}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h5 className="font-medium text-blue-800 text-sm mb-2">How to Generate Webhook Secret:</h5>
              <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                <li>Go to your {formData.gateway_provider === 'razorpay' ? 'Razorpay' : 'payment gateway'} dashboard</li>
                <li>Navigate to Webhooks section</li>
                <li>Create a new webhook with URL: <code className="bg-blue-100 px-1 rounded text-xs">https://api.waardian.com/api/v1/webhook/razorpay</code></li>
                <li>Generate a strong secret key (recommended: 32+ characters)</li>
                <li>Copy the secret and paste it above</li>
              </ol>
              <p className="text-xs text-blue-600 mt-2">
                💡 <strong>Tip:</strong> Use a password generator to create a secure webhook secret
              </p>
            </div>
          </div>

          {/* Security Notice */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-800">Security Guarantee</h4>
                <ul className="text-sm text-green-700 mt-1 space-y-1">
                  <li>• All credentials are encrypted using AES-256 encryption</li>
                  <li>• Keys are stored securely and never logged or exposed</li>
                  <li>• Only authorized personnel can access encrypted data</li>
                  <li>• Regular security audits ensure data protection</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {errors.submit}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Configuring Gateway...
              </div>
            ) : (
              'Configure Gateway'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}