'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, AlertCircle, CheckCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';

interface WaardianGatewayFormProps {
  onSuccess: () => void;
  onCancel?: () => void;
}

interface BankDetails {
  BANK?: string;
  BRANCH?: string;
  ADDRESS?: string;
  CITY?: string;
  STATE?: string;
  CONTACT?: string;
  name?: string;
}

export default function WaardianGatewayForm({ onSuccess, onCancel }: WaardianGatewayFormProps) {
  const [formData, setFormData] = useState({
    businessType: 'Society',
    authorizedPersonRole: '',
    authorizedPersonName: '',
    street1: '',
    street2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'IN',
    accountCategory: 'Housing',
    subCategory: 'RWA (Society)',
    accountHolderName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifsc: '',
    email: '',
    phone: '',
    // panNumber removed
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAccountNumber, setShowAccountNumber] = useState(false);
  const [showConfirmAccountNumber, setShowConfirmAccountNumber] = useState(false);
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);
  const [verifyingIFSC, setVerifyingIFSC] = useState(false);

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Real-time account number validation
    if (name === 'confirmAccountNumber' || name === 'accountNumber') {
      const accountNumber = name === 'accountNumber' ? value : formData.accountNumber;
      const confirmAccountNumber = name === 'confirmAccountNumber' ? value : formData.confirmAccountNumber;
      
      if (confirmAccountNumber && accountNumber !== confirmAccountNumber) {
        setErrors(prev => ({ ...prev, confirmAccountNumber: 'Account numbers do not match' }));
      } else {
        setErrors(prev => ({ ...prev, confirmAccountNumber: '' }));
      }
    }

    // IFSC verification
    if (name === 'ifsc' && value.length === 11) {
      await verifyIFSC(value);
    }
  };

  const verifyIFSC = async (ifscCode: string) => {
    if (!ifscCode || ifscCode.length < 11) return;
    
    setVerifyingIFSC(true);
    setBankDetails(null);
    
    try {
      const response = await apiClient('/payment/verify_ifsc', {
        method: 'GET',
        params: { ifsc: ifscCode },
        withAuth: true
      });
      
      if (response.status === 'success') {
        setBankDetails({
          ...response.data,
          name: response.data.BANK
        });
      }
    } catch (error) {
      console.error('IFSC verification failed:', error);
    } finally {
      setVerifyingIFSC(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.businessType) newErrors.businessType = 'Business type is required';
    if (!formData.authorizedPersonRole) newErrors.authorizedPersonRole = 'Authorized person role is required';
    if (!formData.authorizedPersonName) newErrors.authorizedPersonName = 'Authorized person name is required';
    if (!formData.street1) newErrors.street1 = 'Street 1 is required';
    if (!formData.city) newErrors.city = 'City is required';
    if (!formData.state) newErrors.state = 'State is required';
    if (!formData.postalCode) newErrors.postalCode = 'Postal code is required';
    if (!formData.country) newErrors.country = 'Country is required';
    if (!formData.accountCategory) newErrors.accountCategory = 'Account category is required';
    if (!formData.subCategory) newErrors.subCategory = 'Sub category is required';
    if (!formData.accountHolderName) newErrors.accountHolderName = 'Account holder name is required';
    if (!formData.accountNumber) newErrors.accountNumber = 'Account number is required';
    if (!formData.confirmAccountNumber) newErrors.confirmAccountNumber = 'Please confirm account number';
    if (formData.accountNumber !== formData.confirmAccountNumber) {
      newErrors.confirmAccountNumber = 'Account numbers do not match';
    }
    if (!formData.ifsc) newErrors.ifsc = 'IFSC code is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.phone) newErrors.phone = 'Phone number is required';
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Phone validation
    const phoneRegex = /^[6-9]\d{9}$/;
    if (formData.phone && !phoneRegex.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }
    
    // IFSC validation
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (formData.ifsc && !ifscRegex.test(formData.ifsc)) {
      newErrors.ifsc = 'Please enter a valid IFSC code';
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
      
      const response = await apiClient('/payment/register_account', {
        method: 'POST',
        body: {
          name: formData.accountHolderName, 
          email: formData.email,
          phone: formData.phone,
          account_number: formData.accountNumber, 
          ifsc: formData.ifsc,
          // pan_number removed
          account_type: 'society',
          business_category: formData.accountCategory, 
          business_sub_category: formData.subCategory, 
          business_type: formData.businessType, 
          contact_name: `${formData.authorizedPersonName} (${formData.authorizedPersonRole})`, 
          street1: formData.street1,
          street2: formData.street2,
          city: formData.city,
          state: formData.state,
          postal_code: formData.postalCode,
          country: formData.country,
        },
        withAuth: true
      });

      
      if (response.status === 'success') {
        onSuccess?.();
      }
    } catch (error: any) {
      console.error('Registration failed:', error);
      setErrors({ submit: error.message || 'Registration failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-blue-600" />
          Register with Waardian Gateway
        </CardTitle>
        <CardDescription>
          Complete your society registration to use Waardian's secure payment gateway.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Business Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Business Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="businessType" className="text-sm font-medium text-gray-700">
                  Business Type *
                </label>
                <select
                  id="businessType"
                  name="businessType"
                  value={formData.businessType}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.businessType ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="Society">Society</option>
                  <option value="Individual">Individual</option>
                  <option value="Partnership">Partnership</option>
                  <option value="Private Limited Company">Private Limited Company</option>
                  <option value="Proprietorship">Proprietorship</option>
                </select>
                {errors.businessType && <p className="text-sm text-red-600">{errors.businessType}</p>}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="accountCategory" className="text-sm font-medium text-gray-700">
                  Account Category *
                </label>
                <select
                  id="accountCategory"
                  name="accountCategory"
                  value={formData.accountCategory}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.accountCategory ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="Housing">Housing</option>
                </select>
                {errors.accountCategory && <p className="text-sm text-red-600">{errors.accountCategory}</p>}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="subCategory" className="text-sm font-medium text-gray-700">
                  Sub Category *
                </label>
                <select
                  id="subCategory"
                  name="subCategory"
                  value={formData.subCategory}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.subCategory ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Sub Category</option>
                  <option value="RWA (Society)">RWA (Society)</option>
                  <option value="Space Rental">Space Rental</option>
                </select>
                {errors.subCategory && <p className="text-sm text-red-600">{errors.subCategory}</p>}
              </div>
            </div>
          </div>

          {/* Authorized Person Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Authorized Person Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="authorizedPersonRole" className="text-sm font-medium text-gray-700">
                  Authorized Person Role *
                </label>
                <select
                  id="authorizedPersonRole"
                  name="authorizedPersonRole"
                  value={formData.authorizedPersonRole}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.authorizedPersonRole ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Role</option>
                  <option value="Secretary">Secretary</option>
                  <option value="President">President</option>
                  <option value="Treasurer">Treasurer</option>
                </select>
                {errors.authorizedPersonRole && <p className="text-sm text-red-600">{errors.authorizedPersonRole}</p>}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="authorizedPersonName" className="text-sm font-medium text-gray-700">
                  Authorized Person Name *
                </label>
                <input
                  type="text"
                  id="authorizedPersonName"
                  name="authorizedPersonName"
                  value={formData.authorizedPersonName}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.authorizedPersonName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.authorizedPersonName && <p className="text-sm text-red-600">{errors.authorizedPersonName}</p>}
              </div>
            </div>
          </div>

          {/* Society Address */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Society Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="street1" className="text-sm font-medium text-gray-700">
                  Street 1 *
                </label>
                <input
                  type="text"
                  id="street1"
                  name="street1"
                  value={formData.street1}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.street1 ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.street1 && <p className="text-sm text-red-600">{errors.street1}</p>}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="street2" className="text-sm font-medium text-gray-700">
                  Street 2 *
                </label>
                <input
                  type="text"
                  id="street2"
                  name="street2"
                  value={formData.street2}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.street2 ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.street2 && <p className="text-sm text-red-600">{errors.street2}</p>}
              </div>
              <div className="space-y-2">
                <label htmlFor="city" className="text-sm font-medium text-gray-700">
                  City *
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.city ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.city && <p className="text-sm text-red-600">{errors.city}</p>}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="state" className="text-sm font-medium text-gray-700">
                  State *
                </label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.state ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.state && <p className="text-sm text-red-600">{errors.state}</p>}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="postalCode" className="text-sm font-medium text-gray-700">
                  Postal Code *
                </label>
                <input
                  type="text"
                  id="postalCode"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.postalCode ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.postalCode && <p className="text-sm text-red-600">{errors.postalCode}</p>}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="country" className="text-sm font-medium text-gray-700">
                  Country *
                </label>
                <select
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.country ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="IN">India</option>
                </select>
                {errors.country && <p className="text-sm text-red-600">{errors.country}</p>}
              </div>
            </div>
          </div>

          {/* Banking Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Banking Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="accountHolderName" className="text-sm font-medium text-gray-700">
                  Account Holder Name *
                </label>
                <input
                  type="text"
                  id="accountHolderName"
                  name="accountHolderName"
                  value={formData.accountHolderName}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.accountHolderName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.accountHolderName && <p className="text-sm text-red-600">{errors.accountHolderName}</p>}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="accountNumber" className="text-sm font-medium text-gray-700">
                  Account Number *
                </label>
                <input
                  type="password"
                  id="accountNumber"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.accountNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.accountNumber && <p className="text-sm text-red-600">{errors.accountNumber}</p>}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="confirmAccountNumber" className="text-sm font-medium text-gray-700">
                  Confirm Account Number *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmAccountNumber ? "text" : "password"}
                    id="confirmAccountNumber"
                    name="confirmAccountNumber"
                    value={formData.confirmAccountNumber}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.confirmAccountNumber ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmAccountNumber(!showConfirmAccountNumber)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmAccountNumber ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.confirmAccountNumber && <p className="text-sm text-red-600">{errors.confirmAccountNumber}</p>}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="ifsc" className="text-sm font-medium text-gray-700">
                  IFSC Code *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="ifsc"
                    name="ifsc"
                    value={formData.ifsc}
                    onChange={handleInputChange}
                    placeholder="e.g., SBIN0001234"
                    className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.ifsc ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {verifyingIFSC && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                  {bankDetails && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                  )}
                </div>
                {errors.ifsc && <p className="text-sm text-red-600">{errors.ifsc}</p>}
                {bankDetails && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                    <p className="font-medium text-green-800">{bankDetails.BANK}</p>
                    {bankDetails.BRANCH && <p className="text-green-700">{bankDetails.BRANCH}</p>}
                    {bankDetails.CITY && <p className="text-green-700">{bankDetails.CITY}</p>}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium text-gray-700">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="9876543210"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.phone && <p className="text-sm text-red-600">{errors.phone}</p>}
              </div>
            </div>
          </div>

          {/* Important Notes */}
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-900">Document Upload Notice</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    If upload is required, we will notify you as per provider requirement for KYC.
                  </p>
                </div>
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
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                'Register Account'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}