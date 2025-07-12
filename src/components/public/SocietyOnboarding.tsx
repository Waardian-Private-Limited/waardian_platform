'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, CheckCircle, Download } from 'lucide-react';
import Image from 'next/image';
import { Tooltip } from 'react-tooltip';
import { validateToken, getSubscriptions, completeOnboarding } from '@/lib/onboardingClient';
import qs from 'query-string';

interface Wing {
  wingName: string;
  numberOfFloors: number;
  numberOfFlats: number;
}

interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  pricePerFlat: number;
  modules: string[];
  isTrial?: boolean;
}

const SocietyOnboarding = () => {
  const router = useRouter();
  const { token } = useParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [invalidToken, setInvalidToken] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [paymentCycle, setPaymentCycle] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [subscriptionAmount, setSubscriptionAmount] = useState(0);
  const [societyName, setSocietyName] = useState('');

  // Form state
  const [societyForm, setSocietyForm] = useState({
    societyName: '',
    societyAddress: '',
    societyContact: '',
    societyEmail: '',
    password: '',
    confirmPassword: '',
    totalWings: 1,
    sampleFlatNumber: '',
    wings: [{ wingName: '', numberOfFloors: 1, numberOfFlats: 1 }],
  });
  const [errors, setErrors] = useState({
    societyName: '',
    societyAddress: '',
    societyContact: '',
    societyEmail: '',
    password: '',
    confirmPassword: '',
    totalWings: '',
    sampleFlatNumber: '',
    wings: [{ wingName: '', numberOfFloors: '', numberOfFlats: '' }],
  });

  const paymentCycles = [
    { value: 'monthly', label: 'Monthly', discount: 0 },
    { value: 'quarterly', label: 'Quarterly', discount: 20 },
    { value: 'yearly', label: 'Yearly', discount: 40 },
  ];

  // Validation functions
  const validateEmail = useCallback((email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), []);
  const validatePhone = useCallback((phone: string) => /^[0-9]{10}$/.test(phone), []);
  const validatePassword = useCallback((password: string) => password.length >= 8, []);

  const validateSocietyForm = useCallback(() => {
    const newErrors = {
      societyName: societyForm.societyName ? '' : 'Society name is required',
      societyAddress: societyForm.societyAddress ? '' : 'Address is required',
      societyContact: societyForm.societyContact ? (validatePhone(societyForm.societyContact) ? '' : '10-digit number required') : '',
      societyEmail: validateEmail(societyForm.societyEmail) ? '' : 'Valid email required',
      password: validatePassword(societyForm.password) ? '' : 'Password must be at least 8 characters',
      confirmPassword: societyForm.password === societyForm.confirmPassword ? '' : 'Passwords do not match',
      totalWings: societyForm.totalWings >= 1 ? '' : 'At least 1 wing required',
      sampleFlatNumber: societyForm.sampleFlatNumber ? '' : 'Sample flat number is required',
      wings: societyForm.wings.map((wing) => ({
        wingName: wing.wingName ? '' : 'Required',
        numberOfFloors: wing.numberOfFloors >= 1 ? '' : 'Min 1 floor',
        numberOfFlats: wing.numberOfFlats >= 1 ? '' : 'Min 1 flat',
      })),
    };
    return newErrors;
  }, [societyForm, validateEmail, validatePhone, validatePassword]);

  // Check if step is invalid
  const isStepInvalid = useCallback(
    (step: number) => {
      if (step === 1) {
        const newErrors = validateSocietyForm();
        const hasErrors = Object.values(newErrors).some((error) => {
          if (Array.isArray(error)) {
            return error.some((wingError) => Object.values(wingError).some((v) => v !== ''));
          }
          return error !== '';
        });
        console.log('Step 1 validation:', { hasErrors, errors: newErrors });
        return hasErrors;
      }
      return !selectedPlan;
    },
    [validateSocietyForm, selectedPlan]
  );

  // Update errors in real-time
  useEffect(() => {
    setErrors((prev) => ({ ...prev, ...validateSocietyForm() }));
  }, [societyForm, validateSocietyForm]);

  // Effect to validate token and load plans
  useEffect(() => {
    validateToken(token as string)
      .then((response) => {
        setSocietyName(response.societyName || 'Your Society');
        setSocietyForm((prev) => ({
          ...prev,
          societyName: response.societyName || '',
          societyAddress: response.societyAddress || '',
          societyEmail: response.email || '',
        }));
        if (response.userType !== 'societyAdmin') {
          setInvalidToken(true);
          setErrorMessage('Invalid Token. Please contact your administrator or reach us at help@waardian.com');
        }
      })
      .catch((error) => {
        console.error('Token validation error:', error);
        setInvalidToken(true);
        setErrorMessage('Invalid Token. Please contact your administrator or reach us at help@waardian.com');
      });

    getSubscriptions()
      .then((plans) => {
        if (plans && Array.isArray(plans) && plans.length > 0) {
          // Include trial plan
          const trialPlan = {
            id: 0,
            name: 'Trial Plan',
            description: 'Try all features free for 14 days',
            pricePerFlat: 0,
            modules: ['billing', 'notices'],
            isTrial: true,
          };
          setSubscriptionPlans([trialPlan, ...plans]);
          // Do not auto-select trial plan; let user choose
          // setSelectedPlan(trialPlan); // Removed to prevent auto-selection
          // calculateSubscriptionAmount(trialPlan, paymentCycle); // Removed to avoid immediate calculation
        } else {
          setErrorMessage('Failed to load subscription plans. Please try again later.');
        }
      })
      .catch((error) => {
        console.error('Error loading subscription plans:', error);
        setErrorMessage('Failed to load subscription plans. Please try again later.');
      });
  }, [token]); // Removed paymentCycle dependency to avoid unnecessary re-runs

  // Effect to recalculate subscription amount when selectedPlan or paymentCycle changes
  useEffect(() => {
    if (selectedPlan) {
      calculateSubscriptionAmount(selectedPlan, paymentCycle);
    }
  }, [selectedPlan, paymentCycle]);

  // Update wings based on totalWings
  const updateWings = useCallback(
    (totalWings: number) => {
      const newWings = Array(totalWings)
        .fill(null)
        .map((_, i) => societyForm.wings[i] || { wingName: '', numberOfFloors: 1, numberOfFlats: 1 });
      setSocietyForm((prev) => ({ ...prev, totalWings, wings: newWings }));
      setErrors((prev) => ({
        ...prev,
        wings: newWings.map(() => ({ wingName: '', numberOfFloors: '', numberOfFlats: '' })),
      }));
    },
    [societyForm.wings]
  );

  // Subscription calculations
  const calculateTotalFlats = useCallback(() => {
    return societyForm.wings.reduce((total, wing) => total + wing.numberOfFloors * wing.numberOfFlats, 0);
  }, [societyForm.wings]);

  const getCurrentDiscount = useCallback(() => {
    if (selectedPlan?.isTrial) return 100; // 100% discount for trial
    return paymentCycles.find((c) => c.value === paymentCycle)?.discount || 0;
  }, [paymentCycle, selectedPlan]);

  const calculateBaseAmount = useCallback(() => {
    if (!selectedPlan || selectedPlan.isTrial) return 0;
    const totalFlats = calculateTotalFlats();
    const months = paymentCycle === 'monthly' ? 1 : paymentCycle === 'quarterly' ? 3 : 12;
    return totalFlats * selectedPlan.pricePerFlat * months;
  }, [selectedPlan, paymentCycle, calculateTotalFlats]);

  const calculateDiscountAmount = useCallback(() => {
    const baseAmount = calculateBaseAmount();
    const discount = getCurrentDiscount() / 100;
    return baseAmount * discount;
  }, [calculateBaseAmount, getCurrentDiscount]);

  const calculateSubscriptionAmount = useCallback(
    (plan: SubscriptionPlan | null, cycle: string) => {
      if (!plan || plan.isTrial) {
        setSubscriptionAmount(0);
        return;
      }
      const totalFlats = calculateTotalFlats();
      const months = cycle === 'monthly' ? 1 : cycle === 'quarterly' ? 3 : 12;
      const multiplier = cycle === 'monthly' ? 1 : cycle === 'quarterly' ? 0.8 : 0.6;
      setSubscriptionAmount(totalFlats * plan.pricePerFlat * months * multiplier);
    },
    [calculateTotalFlats]
  );

  // Form handlers
  const toggleEditEmail = useCallback(() => setIsEditingEmail((prev) => !prev), []);

  const saveEmail = useCallback(() => {
    if (validateEmail(societyForm.societyEmail)) {
      setIsEditingEmail(false);
      setErrors((prev) => ({ ...prev, societyEmail: '' }));
    } else {
      setErrors((prev) => ({ ...prev, societyEmail: 'Valid email required' }));
    }
  }, [societyForm.societyEmail, validateEmail]);

  const nextStep = useCallback(() => {
    if (currentStep === 1) {
      const societyErrors = validateSocietyForm();
      setErrors((prev) => ({ ...prev, ...societyErrors }));
      if (isStepInvalid(1)) return;
      setCurrentStep(2);
      if (selectedPlan) calculateSubscriptionAmount(selectedPlan, paymentCycle);
    }
  }, [currentStep, selectedPlan, paymentCycle, validateSocietyForm, isStepInvalid, calculateSubscriptionAmount]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  }, [currentStep]);

  const handleSubmit = useCallback(async () => {
    const societyErrors = validateSocietyForm();
    setErrors((prev) => ({ ...prev, ...societyErrors }));
    if (isStepInvalid(2)) {
      setErrorMessage('Please complete all required fields and select a subscription plan');
      setCurrentStep(1);
      return;
    }

    const wings = societyForm.wings.map((wing) => ({
      name: wing.wingName,
      floors: wing.numberOfFloors,
      flatsPerFloor: wing.numberOfFlats,
    }));

    const payload = {
      token,
      password: societyForm.password,
      societyName: societyForm.societyName,
      address: societyForm.societyAddress,
      contactNumber: societyForm.societyContact || null,
      email: societyForm.societyEmail,
      totalWings: societyForm.totalWings,
      sampleFlatNumber: societyForm.sampleFlatNumber,
      wings,
      subscription: {
        planId: selectedPlan!.id,
        paymentCycle: selectedPlan!.isTrial ? 'trial' : paymentCycle,
        amount: subscriptionAmount,
        discount: getCurrentDiscount(),
        pricePerFlat: selectedPlan!.pricePerFlat,
        totalFlats: calculateTotalFlats(),
        modules: selectedPlan!.modules,
        billingMonths: selectedPlan!.isTrial ? 0 : paymentCycle === 'monthly' ? 1 : paymentCycle === 'quarterly' ? 3 : 12,
        isTrial: selectedPlan!.isTrial || false,
      },
    };

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await completeOnboarding(payload);
      // Redirect to /login instead of /dashboard with query
      router.push('/login');
    } catch (error: any) {
      console.error('Onboarding error:', error);
      setErrorMessage(error.message || 'Onboarding failed. Please try again or contact support.');
      setIsSubmitting(false);
      setTimeout(() => document.getElementById('error-message')?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [
    societyForm,
    selectedPlan,
    paymentCycle,
    subscriptionAmount,
    token,
    validateSocietyForm,
    isStepInvalid,
    calculateTotalFlats,
    getCurrentDiscount,
    router,
  ]);

  const parseModules = useCallback((modules: string | string[]): string[] => {
    if (Array.isArray(modules)) return modules;
    try {
      const parsed = JSON.parse(modules);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Error parsing modules:', e);
      return [];
    }
  }, []);

  if (invalidToken) {
    return (
      <div className="max-w-md mx-auto mt-12 bg-white rounded-lg shadow-md p-8 text-center">
        <Image src="/assets/ghost.svg" alt="Invalid Token" width={128} height={128} className="mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Onboarding Link</h2>
        <p className="text-gray-600 mb-6">{errorMessage}</p>
        <button
          onClick={() => router.push('/login')}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
        >
          Return to Login
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Progress Steps */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            {[1, 2].map((step) => (
              <div
                key={step}
                className={`flex items-center space-x-2 text-sm font-medium ${
                  currentStep === step ? 'text-blue-600 font-bold' : currentStep > step ? 'text-green-600' : 'text-gray-400'
                }`}
              >
                {currentStep > step && <CheckCircle className="w-5 h-5" />}
                <span>Step {step}</span>
              </div>
            ))}
          </div>

          {/* Step 1: Society Configuration */}
          {currentStep === 1 && (
            <div className="p-6 sm:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Set Up Your Society</h2>
              <p className="text-gray-600 mb-6">Enter your society details to create your account.</p>
              <div className="space-y-6">
                {/* Society Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">Society Name</label>
                    <input
                      type="text"
                      value={societyForm.societyName}
                      onChange={(e) => setSocietyForm((prev) => ({ ...prev, societyName: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder-gray-400"
                      placeholder="Enter society name"
                      aria-invalid={!!errors.societyName}
                    />
                    {errors.societyName && <p className="text-red-500 text-xs mt-1">{errors.societyName}</p>}
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">Address</label>
                    <input
                      type="text"
                      value={societyForm.societyAddress}
                      onChange={(e) => setSocietyForm((prev) => ({ ...prev, societyAddress: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder-gray-400"
                      placeholder="Enter society address"
                      aria-invalid={!!errors.societyAddress}
                    />
                    {errors.societyAddress && <p className="text-red-500 text-xs mt-1">{errors.societyAddress}</p>}
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">Contact Number (Optional)</label>
                    <input
                      type="text"
                      value={societyForm.societyContact}
                      onChange={(e) => setSocietyForm((prev) => ({ ...prev, societyContact: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder-gray-400"
                      placeholder="Enter 10-digit number (optional)"
                      aria-invalid={!!errors.societyContact}
                    />
                    {errors.societyContact && <p className="text-red-500 text-xs mt-1">{errors.societyContact}</p>}
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">Email</label>
                    <div className="flex">
                      <input
                        type="email"
                        value={societyForm.societyEmail}
                        onChange={(e) => setSocietyForm((prev) => ({ ...prev, societyEmail: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder-gray-400"
                        placeholder="Enter society email"
                        readOnly={!isEditingEmail}
                        aria-invalid={!!errors.societyEmail}
                      />
                      <button
                        type="button"
                        onClick={isEditingEmail ? saveEmail : toggleEditEmail}
                        className={`px-4 rounded-r-lg transition-colors ${
                          isEditingEmail ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {isEditingEmail ? 'Save' : 'Edit'}
                      </button>
                    </div>
                    {errors.societyEmail && <p className="text-red-500 text-xs mt-1">{errors.societyEmail}</p>}
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">Password</label>
                    <input
                      type="password"
                      value={societyForm.password}
                      onChange={(e) => setSocietyForm((prev) => ({ ...prev, password: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder-gray-400"
                      placeholder="Enter password (min 8 characters)"
                      aria-invalid={!!errors.password}
                    />
                    {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">Confirm Password</label>
                    <input
                      type="password"
                      value={societyForm.confirmPassword}
                      onChange={(e) => setSocietyForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder-gray-400"
                      placeholder="Confirm password"
                      aria-invalid={!!errors.confirmPassword}
                    />
                    {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
                  </div>
                </div>

                {/* Wing Configuration */}
                <div className="border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Wing Configuration</h3>
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-1">Total Wings</label>
                      <input
                        type="number"
                        min="1"
                        value={societyForm.totalWings}
                        onChange={(e) => {
                          const value = Number(e.target.value) || 1;
                          updateWings(value);
                        }}
                        className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder-gray-400"
                        aria-invalid={!!errors.totalWings}
                      />
                      {errors.totalWings && <p className="text-red-500 text-xs mt-1">{errors.totalWings}</p>}
                    </div>
                  </div>
                  <div className="space-y-4">
                    {societyForm.wings.map((wing, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">Wing {index + 1}</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-gray-700 text-sm font-medium mb-1">Wing Name</label>
                            <input
                              type="text"
                              value={wing.wingName}
                              onChange={(e) => {
                                const newWings = [...societyForm.wings];
                                newWings[index].wingName = e.target.value;
                                setSocietyForm((prev) => ({ ...prev, wings: newWings }));
                              }}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder-gray-400"
                              placeholder="Enter wing name (e.g., A)"
                              aria-invalid={!!errors.wings[index]?.wingName}
                            />
                            {errors.wings[index]?.wingName && (
                              <p className="text-red-500 text-xs mt-1">{errors.wings[index].wingName}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-gray-700 text-sm font-medium mb-1">Number of Floors</label>
                            <input
                              type="number"
                              min="1"
                              value={wing.numberOfFloors}
                              onChange={(e) => {
                                const newWings = [...societyForm.wings];
                                newWings[index].numberOfFloors = Number(e.target.value) || 1;
                                setSocietyForm((prev) => ({ ...prev, wings: newWings }));
                              }}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder-gray-400"
                              placeholder="Enter number of floors"
                              aria-invalid={!!errors.wings[index]?.numberOfFloors}
                            />
                            {errors.wings[index]?.numberOfFloors && (
                              <p className="text-red-500 text-xs mt-1">{errors.wings[index].numberOfFloors}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-gray-700 text-sm font-medium mb-1">Flats per Floor</label>
                            <input
                              type="number"
                              min="1"
                              value={wing.numberOfFlats}
                              onChange={(e) => {
                                const newWings = [...societyForm.wings];
                                newWings[index].numberOfFlats = Number(e.target.value) || 1;
                                setSocietyForm((prev) => ({ ...prev, wings: newWings }));
                              }}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder-gray-400"
                              placeholder="Enter flats per floor"
                              aria-invalid={!!errors.wings[index]?.numberOfFlats}
                            />
                            {errors.wings[index]?.numberOfFlats && (
                              <p className="text-red-500 text-xs mt-1">{errors.wings[index].numberOfFlats}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <label className="block text-gray-700 text-sm font-medium mb-1">How do you spell your flat?</label>
                    <input
                      type="text"
                      value={societyForm.sampleFlatNumber}
                      onChange={(e) => setSocietyForm((prev) => ({ ...prev, sampleFlatNumber: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder-gray-400"
                      placeholder="Just enter a sample flat number (e.g., A-101 or 101)"
                      aria-invalid={!!errors.sampleFlatNumber}
                    />
                    {errors.sampleFlatNumber && <p className="text-red-500 text-xs mt-1">{errors.sampleFlatNumber}</p>}
                  </div>
                </div>
              </div>
              <div className="mt-8 flex justify-end">
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={isStepInvalid(1)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-all flex items-center"
                >
                  Next <ArrowRight className="w-5 h-5 ml-2" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Subscription Plan */}
          {currentStep === 2 && (
            <div className="p-6 sm:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Subscription Plan</h2>
              <p className="text-gray-600 mb-6">Select a plan that best fits your society’s needs, or try for free.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {subscriptionPlans.map((plan) => (
                  <div
                    key={plan.id}
                    onClick={() => {
                      setSelectedPlan(plan);
                      calculateSubscriptionAmount(plan, paymentCycle);
                    }}
                    className={`p-6 border-2 rounded-xl cursor-pointer hover:border-blue-300 transition-all duration-300 ${
                      selectedPlan?.id === plan.id ? 'ring-4 ring-blue-500 shadow-lg scale-[1.02]' : 'border-gray-200'
                    } relative`}
                  >
                    {selectedPlan?.id === plan.id && (
                      <div className="absolute -top-3 -right-3 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                        SELECTED
                      </div>
                    )}
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{plan.name}</h3>
                    <p className="text-gray-600 mb-4">{plan.description}</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {plan.isTrial ? 'Free for 14 days' : `₹${plan.pricePerFlat} per flat/month`}
                    </p>
                    <div className="mt-4">
                      <h5 className="font-medium text-gray-900 mb-2">Included Modules:</h5>
                      <ul className="text-sm text-gray-600">
                        {parseModules(plan.modules).map((module, i) => (
                          <li key={i}>• {module}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
              {!selectedPlan?.isTrial && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Cycle</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {paymentCycles.map((cycle) => (
                      <label
                        key={cycle.value}
                        className={`p-4 border-2 rounded-xl cursor-pointer hover:border-blue-300 transition-all duration-300 relative ${
                          cycle.value === paymentCycle ? 'ring-4 ring-blue-500 shadow-lg' : 'border-gray-200'
                        }`}
                      >
                        {cycle.value === paymentCycle && (
                          <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            ✓
                          </div>
                        )}
                        <input
                          type="radio"
                          name="paymentCycle"
                          value={cycle.value}
                          checked={cycle.value === paymentCycle}
                          onChange={() => {
                            setPaymentCycle(cycle.value as 'monthly' | 'quarterly' | 'yearly');
                            calculateSubscriptionAmount(selectedPlan, cycle.value);
                          }}
                          className="hidden"
                        />
                        <div className="font-medium text-gray-900">{cycle.label}</div>
                        <div className="text-sm text-gray-600">{cycle.discount}% discount</div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl mb-6 border-2 border-blue-200 shadow-sm">
                <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <CheckCircle className="h-6 w-6 mr-2 text-blue-500" />
                  Subscription Summary
                </h4>
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between">
                    <div className="text-gray-600">Total Flats:</div>
                    <div className="font-medium text-gray-900">{calculateTotalFlats()}</div>
                  </div>
                  <div className="flex justify-between">
                    <div className="text-gray-600">Selected Plan:</div>
                    <div className="font-medium text-gray-900">{selectedPlan?.name}</div>
                  </div>
                  {!selectedPlan?.isTrial && (
                    <div className="flex justify-between">
                      <div className="text-gray-600">Billing Cycle:</div>
                      <div className="font-medium text-gray-900">
                        {paymentCycle.charAt(0).toUpperCase() + paymentCycle.slice(1)}
                      </div>
                    </div>
                  )}
                </div>
                <div className="border-t-2 border-blue-200 pt-4">
                  <div className="flex justify-between items-center mb-1">
                    <div className="text-gray-600">Subtotal:</div>
                    <div className="font-medium text-gray-900">
                      {selectedPlan?.isTrial ? 'Free' : `₹${calculateBaseAmount().toLocaleString()}`}
                    </div>
                  </div>
                  {getCurrentDiscount() > 0 && (
                    <div className="flex justify-between items-center text-green-600">
                      <div className="flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 mr-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                          />
                        </svg>
                        {getCurrentDiscount()}% Discount
                      </div>
                      <div className="font-medium">
                        {selectedPlan?.isTrial ? 'Free for 14 days' : `-₹${calculateDiscountAmount().toLocaleString()}`}
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-lg font-bold text-blue-700 mt-3 pt-3 border-t-2 border-blue-200">
                    <div>Total Due:</div>
                    <div className="text-2xl">{selectedPlan?.isTrial ? 'Free' : `₹${subscriptionAmount.toLocaleString()}`}</div>
                  </div>
                  {getCurrentDiscount() > 0 && !selectedPlan?.isTrial && (
                    <div className="mt-3 p-3 bg-green-50 rounded-lg text-green-700 text-sm flex items-center">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      You're saving ₹{calculateDiscountAmount().toLocaleString()} with {paymentCycle} billing!
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={prevStep}
                  className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-all flex items-center"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !selectedPlan}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-all flex items-center"
                >
                  Complete Onboarding
                  <CheckCircle className="h-5 h-5 ml-2" />
                </button>
              </div>
            </div>
          )}
        </div>
        {errorMessage && (
          <div id="error-message" className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg text-sm flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            {errorMessage}
          </div>
        )}
        {/* Next Steps Summary */}
        <div className="mt-8 bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">What Happens Next?</h3>
          <ul className="list-disc pl-5 text-gray-600 space-y-2">
            <li>
              <strong>Step 1: Society Configuration</strong>: Enter your society’s details, including name, address, email, and password. The
              contact number is optional. Specify wing details and a sample flat number (e.g., {societyForm.sampleFlatNumber || 'A-101'}).
            </li>
            <li>
              <strong>Step 2: Subscription Plan</strong>: Choose a subscription plan, including a free 14-day trial option, or a paid plan with
              your preferred payment cycle.
            </li>
            <li>
              <strong>Create Society Account</strong>: This process creates your society account using the email (
              {societyForm.societyEmail || 'your society email'}) and password you provided. After onboarding, you’ll be redirected to the
              login page to sign in and add at least one admin account (e.g., super admin) to manage your society.
            </li>
            <li>
              <strong>Access on Mobile</strong>: Download our mobile app to manage your society on the go. Available on:
              <div className="flex space-x-4 mt-2">
                <a
                  href="https://play.google.com/store/apps/details?id=com.xai.grok"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-blue-600 hover:underline"
                >
                  <Download className="w-5 h-5 mr-1" />
                  Google Play Store
                </a>
                <a
                  href="https://www.apple.com/app-store/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-blue-600 hover:underline"
                >
                  <Download className="w-5 h-5 mr-1" />
                  Apple App Store
                </a>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SocietyOnboarding;