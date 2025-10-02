'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, CheckCircle, Loader2, Info, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';
import {
  validateToken,
  getSubscriptions,
  validatePromoCode,
  createRazorpayOrder,
  completeOnboarding,
} from '@/lib/onboardingClient';
import { getPaymentProvider } from '@/lib/paymentProviderService';
import { toast } from 'react-hot-toast';

interface FlatType {
  type: string;
  count: number;
  squareFootage: number;
}
interface Wing {
  wingName: string;
  numberOfFloors: number;
  flatTypes: FlatType[];
}
interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  pricePerFlat: number;
  numberOfMonths: number;
  modules: string[];
  isTrial: boolean;
  trial_days: number;
  discountPrice: number;
}
interface PincodeData {
  Message: string;
  Status: string;
  PostOffice: {
    Name: string;
    Circle: string;
    District: string;
    Division: string;
    Region: string;
    State: string;
    Country: string;
  }[];
}
interface Transaction {
  paymentId: string;
  orderId: string;
  subscriptionId?: string;
  amount: number;
  status: 'pending' | 'captured' | 'failed';
  createdAt: string;
}

const societyTypes = [
  'Apartment',
  'Condominium',
  'Housing Society',
  'Gated Community',
  'Cooperative Housing Society',
];
const flatTypes = ['1RK', '1BHK', '2BHK', '3BHK', '4BHK'];

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
  const [paymentType, setPaymentType] = useState<'one-time' | 'recurring'>('recurring');
  const [subscriptionAmount, setSubscriptionAmount] = useState(0);
  const [discountPrice, setDiscountPrice] = useState(0);
  const [promoCode, setPromoCode] = useState('');
  const [promoCodeError, setPromoCodeError] = useState('');
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [societyName, setSocietyName] = useState('');
  const [isFetchingPincode, setIsFetchingPincode] = useState(false);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [certificateError, setCertificateError] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form state
  const [societyForm, setSocietyForm] = useState({
    societyName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    country: '',
    pincode: '',
    societyType: '',
    registrationNumber: '',
    registrationDate: '',
    panNumber: '',
    gstNumber: '',
    societyContact: '',
    societyEmail: '',
    password: '',
    confirmPassword: '',
    totalWings: 0,
    wings: [] as Wing[],
  });

  const [errors, setErrors] = useState({
    societyName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    country: '',
    pincode: '',
    societyType: '',
    registrationNumber: '',
    registrationDate: '',
    panNumber: '',
    gstNumber: '',
    societyContact: '',
    societyEmail: '',
    password: '',
    confirmPassword: '',
    totalWings: '',
    wings: [] as { wingName: string; numberOfFloors: string; flatTypes: { type: string; count: string; squareFootage: string }[] }[],
  });

  // Validation functions
  const validateEmail = useCallback((email: string) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email), []);
  const validatePhone = useCallback((phone: string) => !phone || /^[6-9][0-9]{9}$/.test(phone), []);
  const validatePassword = useCallback(
    (password: string) => !password || /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password),
    []
  );
  const validatePincode = useCallback((pincode: string) => /^[1-9][0-9]{5}$/.test(pincode), []);
  const validatePanNumber = useCallback((pan: string) => !pan || /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan), []);
  const validateGstNumber = useCallback((gst: string) => !gst || /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gst), []);
  const validateRegistrationNumber = useCallback((reg: string) => /^[A-Z0-9-]{1,20}$/.test(reg), []);
  const validateSocietyName = useCallback((name: string) => /^[A-Za-z0-9\s\-,.&]{3,100}$/.test(name), []);
  const validateAddress = useCallback((address: string) => /^[A-Za-z0-9\s\-,.#\/]{5,200}$/.test(address), []);
  const validateCityState = useCallback((value: string) => /^[A-Za-z\s]{2,50}$/.test(value), []);
  const validateRegistrationDate = useCallback((date: string) => {
    if (!date) return false;
    const selectedDate = new Date(date);
    const today = new Date();
    return selectedDate <= today && selectedDate >= new Date('1900-01-01');
  }, []);
  const validateSquareFootage = useCallback((sqft: number | string) => {
    const num = Number(sqft);
    return !isNaN(num) && num >= 200 && num <= 5000;
  }, []);
  const validateFlatCount = useCallback((count: number | string) => {
    const num = Number(count);
    return !isNaN(num) && num >= 1 && num <= 50;
  }, []);
  const validateTotalWings = useCallback((wings: number | string) => {
    const num = Number(wings);
    return !isNaN(num) && num >= 1 && num <= 50;
  }, []);
  const validateNumberOfFloors = useCallback((floors: number | string) => {
    const num = Number(floors);
    return !isNaN(num) && num >= 1 && num <= 100;
  }, []);

  // Live validation handlers
  const handleSocietyNameChange = useCallback(
    (value: string) => {
      setSocietyForm((prev) => ({ ...prev, societyName: value }));
      setErrors((prev) => ({
        ...prev,
        societyName: value ? (validateSocietyName(value) ? '' : 'Invalid society name (3-100 chars, letters, numbers, spaces, -,.,&,)') : 'Society name is required',
      }));
    },
    [validateSocietyName]
  );

  const handleAddressLine1Change = useCallback(
    (value: string) => {
      setSocietyForm((prev) => ({ ...prev, addressLine1: value }));
      setErrors((prev) => ({
        ...prev,
        addressLine1: value ? (validateAddress(value) ? '' : 'Invalid address (5-200 chars, letters, numbers, spaces, -,.,#,/)') : 'Address Line 1 is required',
      }));
    },
    [validateAddress]
  );

  const handleAddressLine2Change = useCallback(
    (value: string) => {
      setSocietyForm((prev) => ({ ...prev, addressLine2: value }));
      setErrors((prev) => ({
        ...prev,
        addressLine2: value ? (validateAddress(value) ? '' : 'Invalid address (5-200 chars, letters, numbers, spaces, -,.,#,/)') : '',
      }));
    },
    [validateAddress]
  );

  const handleCityChange = useCallback(
    (value: string) => {
      setSocietyForm((prev) => ({ ...prev, city: value }));
      setErrors((prev) => ({
        ...prev,
        city: value ? (validateCityState(value) ? '' : 'Invalid city (2-50 chars, letters, spaces)') : 'City is required',
      }));
    },
    [validateCityState]
  );

  const handleStateChange = useCallback(
    (value: string) => {
      setSocietyForm((prev) => ({ ...prev, state: value }));
      setErrors((prev) => ({
        ...prev,
        state: value ? (validateCityState(value) ? '' : 'Invalid state (2-50 chars, letters, spaces)') : 'State is required',
      }));
    },
    [validateCityState]
  );

  const handleCountryChange = useCallback(
    (value: string) => {
      setSocietyForm((prev) => ({ ...prev, country: value }));
      setErrors((prev) => ({
        ...prev,
        country: value ? (validateCityState(value) ? '' : 'Invalid country (2-50 chars, letters, spaces)') : 'Country is required',
      }));
    },
    [validateCityState]
  );

  const handlePincodeChange = useCallback(
    (value: string) => {
      const numericValue = handleNumericInput(value);
      setSocietyForm((prev) => ({ ...prev, pincode: numericValue }));
      setErrors((prev) => ({
        ...prev,
        pincode: numericValue ? (validatePincode(numericValue) ? '' : 'Invalid 6-digit PIN code') : 'PIN code is required',
      }));
      
      // Auto-fetch pincode data when valid 6-digit pincode is entered
      if (numericValue && validatePincode(numericValue)) {
        // Use setTimeout to avoid dependency issues
        setTimeout(() => {
          fetchPincodeData(numericValue);
        }, 100);
      }
    },
    [validatePincode]
  );

  const handleSocietyTypeChange = useCallback(
    (value: string) => {
      setSocietyForm((prev) => ({ ...prev, societyType: value }));
      setErrors((prev) => ({ ...prev, societyType: value ? '' : 'Society type is required' }));
    },
    []
  );

  const handleRegistrationNumberChange = useCallback(
    (value: string) => {
      const upperValue = value.toUpperCase();
      setSocietyForm((prev) => ({ ...prev, registrationNumber: upperValue }));
      setErrors((prev) => ({
        ...prev,
        registrationNumber: value
          ? validateRegistrationNumber(upperValue)
            ? ''
            : 'Invalid registration number (1-20 chars, letters, numbers, -)'
          : 'Registration number is required',
      }));
    },
    [validateRegistrationNumber]
  );

  const handleRegistrationDateChange = useCallback(
    (value: string) => {
      setSocietyForm((prev) => ({ ...prev, registrationDate: value }));
      setErrors((prev) => ({
        ...prev,
        registrationDate: value ? (validateRegistrationDate(value) ? '' : 'Invalid date (must be between 1900 and today)') : 'Registration date is required',
      }));
    },
    [validateRegistrationDate]
  );

  const handlePanNumberChange = useCallback(
    (value: string) => {
      const upperValue = value.toUpperCase();
      setSocietyForm((prev) => ({ ...prev, panNumber: upperValue }));
      setErrors((prev) => ({
        ...prev,
        panNumber: validatePanNumber(upperValue) ? '' : 'Invalid PAN number (e.g., ABCDE1234F)',
      }));
    },
    [validatePanNumber]
  );

  const handleGstNumberChange = useCallback(
    (value: string) => {
      const upperValue = value.toUpperCase();
      setSocietyForm((prev) => ({ ...prev, gstNumber: upperValue }));
      setErrors((prev) => ({
        ...prev,
        gstNumber: validateGstNumber(upperValue) ? '' : 'Invalid GST number (e.g., 22AAAAA0000A1Z5)',
      }));
    },
    [validateGstNumber]
  );

  const handleSocietyContactChange = useCallback(
    (value: string) => {
      const numericValue = handleNumericInput(value);
      setSocietyForm((prev) => ({ ...prev, societyContact: numericValue }));
      setErrors((prev) => ({
        ...prev,
        societyContact: numericValue ? (validatePhone(numericValue) ? '' : 'Invalid 10-digit Indian mobile number') : '',
      }));
    },
    [validatePhone]
  );

  const handleSocietyEmailChange = useCallback(
    (value: string) => {
      setSocietyForm((prev) => ({ ...prev, societyEmail: value }));
      setErrors((prev) => ({
        ...prev,
        societyEmail: value ? (validateEmail(value) ? '' : 'Valid email required') : 'Email is required',
      }));
    },
    [validateEmail]
  );

  const handlePasswordChange = useCallback(
    (value: string) => {
      setSocietyForm((prev) => ({ ...prev, password: value }));
      setErrors((prev) => ({
        ...prev,
        password: value
          ? validatePassword(value)
            ? ''
            : 'Password must be 8+ chars with uppercase, lowercase, number, and special character'
          : 'Password is required',
        confirmPassword: societyForm.confirmPassword ? (value === societyForm.confirmPassword ? '' : 'Passwords do not match') : prev.confirmPassword,
      }));
    },
    [validatePassword, societyForm.confirmPassword]
  );

  const handleConfirmPasswordChange = useCallback(
    (value: string) => {
      setSocietyForm((prev) => ({ ...prev, confirmPassword: value }));
      setErrors((prev) => ({
        ...prev,
        confirmPassword: value ? (value === societyForm.password ? '' : 'Passwords do not match') : 'Confirm password is required',
      }));
    },
    [societyForm.password]
  );

  const handleTotalWingsChange = useCallback(
    (value: string) => {
      const numericValue = handleNumericInput(value);
      const numWings = Number(numericValue) || 0;
      setSocietyForm((prev) => ({ ...prev, totalWings: numWings }));
      setErrors((prev) => ({
        ...prev,
        totalWings: numWings ? (validateTotalWings(numWings) ? '' : 'Total wings must be between 1 and 50') : 'Total wings is required',
      }));
      updateWings(numWings);
    },
    [validateTotalWings]
  );

  const handleWingNameChange = useCallback(
    (wingIndex: number, value: string) => {
      const newWings = [...societyForm.wings];
      newWings[wingIndex].wingName = value;
      setSocietyForm((prev) => ({ ...prev, wings: newWings }));
      setErrors((prev) => {
        const newErrors = [...prev.wings];
        newErrors[wingIndex] = {
          ...newErrors[wingIndex],
          wingName: value ? '' : 'Wing name is required',
        };
        return { ...prev, wings: newErrors };
      });
    },
    [societyForm.wings]
  );

  const handleNumberOfFloorsChange = useCallback(
    (wingIndex: number, value: string) => {
      const numericValue = handleNumericInput(value);
      const numFloors = Number(numericValue) || 0;
      const newWings = [...societyForm.wings];
      newWings[wingIndex].numberOfFloors = numFloors;
      setSocietyForm((prev) => ({ ...prev, wings: newWings }));
      setErrors((prev) => {
        const newErrors = [...prev.wings];
        newErrors[wingIndex] = {
          ...newErrors[wingIndex],
          numberOfFloors: numFloors
            ? validateNumberOfFloors(numFloors)
              ? ''
              : 'Number of floors must be between 1 and 100'
            : 'Number of floors is required',
        };
        return { ...prev, wings: newErrors };
      });
    },
    [societyForm.wings, validateNumberOfFloors]
  );

  const handleFlatTypeChange = useCallback(
    (wingIndex: number, flatIndex: number, value: string) => {
      const newWings = [...societyForm.wings];
      newWings[wingIndex].flatTypes[flatIndex].type = value;
      setSocietyForm((prev) => ({ ...prev, wings: newWings }));
      setErrors((prev) => {
        const newErrors = [...prev.wings];
        newErrors[wingIndex].flatTypes[flatIndex] = {
          ...newErrors[wingIndex].flatTypes[flatIndex],
          type: value ? '' : 'Flat type is required',
        };
        return { ...prev, wings: newErrors };
      });
    },
    [societyForm.wings]
  );

  const handleFlatCountChange = useCallback(
    (wingIndex: number, flatIndex: number, value: string) => {
      const numericValue = handleNumericInput(value);
      const numCount = Number(numericValue) || 0;
      const newWings = [...societyForm.wings];
      newWings[wingIndex].flatTypes[flatIndex].count = numCount;
      setSocietyForm((prev) => ({ ...prev, wings: newWings }));
      setErrors((prev) => {
        const newErrors = [...prev.wings];
        newErrors[wingIndex].flatTypes[flatIndex] = {
          ...newErrors[wingIndex].flatTypes[flatIndex],
          count: numCount ? (validateFlatCount(numCount) ? '' : 'Number of flats must be between 1 and 50') : 'Number of flats is required',
        };
        return { ...prev, wings: newErrors };
      });
    },
    [societyForm.wings, validateFlatCount]
  );

  const handleSquareFootageChange = useCallback(
    (wingIndex: number, flatIndex: number, value: string) => {
      const numericValue = handleNumericInput(value);
      const numSqft = Number(numericValue) || 0;
      const newWings = [...societyForm.wings];
      newWings[wingIndex].flatTypes[flatIndex].squareFootage = numSqft;
      setSocietyForm((prev) => ({ ...prev, wings: newWings }));
      setErrors((prev) => {
        const newErrors = [...prev.wings];
        newErrors[wingIndex].flatTypes[flatIndex] = {
          ...newErrors[wingIndex].flatTypes[flatIndex],
          squareFootage: numSqft
            ? validateSquareFootage(numSqft)
              ? ''
              : 'Square footage must be between 200 and 5000'
            : 'Square footage is required',
        };
        return { ...prev, wings: newErrors };
      });
    },
    [societyForm.wings, validateSquareFootage]
  );

  const validateSocietyForm = useCallback(() => {
    const newErrors = {
      societyName: societyForm.societyName
        ? validateSocietyName(societyForm.societyName)
          ? ''
          : 'Invalid society name (3-100 chars, letters, numbers, spaces, -,.,&,)'
        : 'Society name is required',
      addressLine1: societyForm.addressLine1
        ? validateAddress(societyForm.addressLine1)
          ? ''
          : 'Invalid address (5-200 chars, letters, numbers, spaces, -,.,#,/)'
        : 'Address Line 1 is required',
      addressLine2: societyForm.addressLine2
        ? validateAddress(societyForm.addressLine2)
          ? ''
          : 'Invalid address (5-200 chars, letters, numbers, spaces, -,.,#,/)'
        : 'Address Line 2 is required',
      city: societyForm.city ? (validateCityState(societyForm.city) ? '' : 'Invalid city (2-50 chars, letters, spaces)') : 'City is required',
      state: societyForm.state ? (validateCityState(societyForm.state) ? '' : 'Invalid state (2-50 chars, letters, spaces)') : 'State is required',
      country: societyForm.country
        ? validateCityState(societyForm.country)
          ? ''
          : 'Invalid country (2-50 chars, letters, spaces)'
        : 'Country is required',
      pincode: societyForm.pincode ? (validatePincode(societyForm.pincode) ? '' : 'Invalid 6-digit PIN code') : 'PIN code is required',
      societyType: societyForm.societyType ? '' : 'Society type is required',
      registrationNumber: societyForm.registrationNumber
        ? validateRegistrationNumber(societyForm.registrationNumber)
          ? ''
          : 'Invalid registration number (1-20 chars, letters, numbers, -)'
        : 'Registration number is required',
      registrationDate: societyForm.registrationDate
        ? validateRegistrationDate(societyForm.registrationDate)
          ? ''
          : 'Invalid date (must be between 1900 and today)'
        : 'Registration date is required',
      panNumber: validatePanNumber(societyForm.panNumber) ? '' : 'Invalid PAN number (e.g., ABCDE1234F)',
      gstNumber: validateGstNumber(societyForm.gstNumber) ? '' : 'Invalid GST number (e.g., 22AAAAA0000A1Z5)',
      societyContact: societyForm.societyContact
        ? validatePhone(societyForm.societyContact)
          ? ''
          : 'Invalid 10-digit Indian mobile number'
        : 'Contact number is required',
      societyEmail: societyForm.societyEmail ? (validateEmail(societyForm.societyEmail) ? '' : 'Valid email required') : 'Email is required',
      password: societyForm.password
        ? validatePassword(societyForm.password)
          ? ''
          : 'Password must be 8+ chars with uppercase, lowercase, number, and special character'
        : 'Password is required',
      confirmPassword: societyForm.confirmPassword
        ? societyForm.password === societyForm.confirmPassword
          ? ''
          : 'Passwords do not match'
        : 'Confirm password is required',
      totalWings: societyForm.totalWings
        ? validateTotalWings(societyForm.totalWings)
          ? ''
          : 'Total wings must be between 1 and 50'
        : 'Total wings is required',
      wings: societyForm.wings.map((wing) => ({
        wingName: wing.wingName ? '' : 'Wing name is required',
        numberOfFloors: wing.numberOfFloors
          ? validateNumberOfFloors(wing.numberOfFloors)
            ? ''
            : 'Number of floors must be between 1 and 100'
          : 'Number of floors is required',
        flatTypes: wing.flatTypes.map((flat) => ({
          type: flat.type ? '' : 'Flat type is required',
          count: flat.count ? (validateFlatCount(flat.count) ? '' : 'Number of flats must be between 1 and 50') : 'Number of flats is required',
          squareFootage: flat.squareFootage
            ? validateSquareFootage(flat.squareFootage)
              ? ''
              : 'Square footage must be between 200 and 5000'
            : 'Square footage is required',
        })),
      })),
    };
    return newErrors;
  }, [
    societyForm,
    validateEmail,
    validatePhone,
    validatePassword,
    validatePincode,
    validatePanNumber,
    validateRegistrationNumber,
    validateSocietyName,
    validateAddress,
    validateCityState,
    validateRegistrationDate,
    validateSquareFootage,
    validateFlatCount,
    validateTotalWings,
    validateNumberOfFloors,
  ]);

  const isStepInvalid = useCallback(
    (step: number) => {
      if (step === 1) {
        const newErrors = validateSocietyForm();
        const hasErrors = Object.values(newErrors).some((error) => {
          if (Array.isArray(error)) {
            return error.some((wingError) =>
              Object.values(wingError).some((v) => {
                if (Array.isArray(v)) {
                  return v.some((flatError) => Object.values(flatError).some((fv) => fv !== ''));
                }
                return v !== '';
              })
            );
          }
          return error !== '';
        });
        return hasErrors;
      }
      return !selectedPlan;
    },
    [validateSocietyForm, selectedPlan]
  );

  const fetchPincodeData = useCallback(
    async (pincode: string) => {
      if (!pincode) {
        setErrors((prev) => ({ ...prev, pincode: 'PIN code is required' }));
        return;
      }
      if (!validatePincode(pincode)) {
        setErrors((prev) => ({ ...prev, pincode: 'Invalid 6-digit PIN code' }));
        return;
      }
      setIsFetchingPincode(true);
      try {
        const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
        const data: PincodeData[] = await response.json();
        if (data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
          const { District, State, Country } = data[0].PostOffice[0];
          setSocietyForm((prev) => ({
            ...prev,
            city: District || '',
            state: State || '',
            country: Country || '',
          }));
          setErrors((prev) => ({
            ...prev,
            pincode: '',
            city: '',
            state: '',
            country: '',
          }));
          toast.success('PIN code validated successfully');
        } else {
          setErrors((prev) => ({ ...prev, pincode: 'Invalid PIN code' }));
          toast.error('Invalid PIN code');
        }
      } catch (error) {
        console.error('Error fetching PIN code:', error);
        setErrors((prev) => ({ ...prev, pincode: 'Error fetching PIN code data' }));
        toast.error('Error fetching PIN code data');
      } finally {
        setIsFetchingPincode(false);
      }
    },
    [validatePincode]
  );

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (!token) {
      setInvalidToken(true);
      setErrorMessage('No token provided. Please use a valid onboarding link.');
      return;
    }
    validateToken(token as string)
      .then((response) => {
        if (!response.data) {
          throw new Error('Invalid response structure');
        }
        setSocietyName(response.data.societyName || 'Your Society');
        setSocietyForm((prev) => ({
          ...prev,
          societyName: response.data.societyName || '',
          addressLine1: response.data.societyAddress || '',
          societyEmail: response.data.email || '',
        }));
        if (response.data.userType !== 'societyAdmin') {
          setInvalidToken(true);
          setErrorMessage('Invalid Token. Please contact support at help@waardian.com');
        }
      })
      .catch((error) => {
        console.error('Token validation error:', error);
        setInvalidToken(true);
        setErrorMessage('Invalid Token. Please contact support at help@waardian.com');
      });
    getSubscriptions()
      .then((value: { plans: any; paymentCycles: any }) => {
        if (value.plans && Array.isArray(value.plans) && value.plans.length > 0) {
          const plans = value.plans.map((plan) => ({
            id: plan.id,
            name: plan.name,
            description: plan.description,
            pricePerFlat: parseFloat(plan.price_per_flat),
            numberOfMonths: plan.numberOfMonths,
            modules: plan.modules,
            isTrial: !!plan.is_trial,
            trial_days: plan.trial_days,
            discountPrice: parseFloat(plan.discount_price),
          }));
          setSubscriptionPlans(plans);
          setSelectedPlan(plans[0]);
        } else {
          setErrorMessage('Failed to load subscription plans. Please try again later.');
        }
      })
      .catch((error) => {
        console.error('Error loading subscriptions:', error);
        setErrorMessage('Failed to load subscription plans. Please try again later.');
      });
  }, [token]);

  const calculateTotalFlats = useCallback(() => {
    return societyForm.wings.reduce((total, wing) => total + wing.numberOfFloors * wing.flatTypes.reduce((sum, flat) => sum + flat.count, 0), 0);
  }, [societyForm.wings]);

  const calculateSubscriptionAmount = useCallback(
    (plan: SubscriptionPlan | null) => {
      if (!plan) {
        setSubscriptionAmount(0);
        setDiscountPrice(0);
        return;
      }
      const totalFlats = calculateTotalFlats();
      const amount = totalFlats * plan.pricePerFlat;
      setSubscriptionAmount(amount);
      setDiscountPrice(plan.discountPrice || 0);
    },
    [calculateTotalFlats, paymentType]
  );

  useEffect(() => {
    if (Date.now() > new Date('2025-10-08').getTime()) {
      setErrorMessage('Subscription offer expired. Please contact support.');
      return;
    }
    if (selectedPlan) {
      calculateSubscriptionAmount(selectedPlan);
    }
  }, [selectedPlan, calculateSubscriptionAmount]);

  // Real-time amount calculation when wings or payment type changes
  useEffect(() => {
    if (selectedPlan) {
      calculateSubscriptionAmount(selectedPlan);
    }
  }, [societyForm.wings, paymentType, selectedPlan, calculateSubscriptionAmount]);

  const updateWings = useCallback(
    (totalWings: number) => {
      const validTotalWings = Math.max(1, Math.min(50, totalWings));
      const newWings = Array(validTotalWings)
        .fill(null)
        .map((_, i) => societyForm.wings[i] || { wingName: '', numberOfFloors: 0, flatTypes: [] });
      setSocietyForm((prev) => ({ ...prev, totalWings: validTotalWings, wings: newWings }));
      setErrors((prev) => ({
        ...prev,
        totalWings: '',
        wings: newWings.map(() => ({
          wingName: '',
          numberOfFloors: '',
          flatTypes: [],
        })),
      }));
    },
    [societyForm.wings]
  );

  const addFlatType = useCallback(
    (wingIndex: number) => {
      const newWings = [...societyForm.wings];
      newWings[wingIndex].flatTypes.push({ type: '', count: 0, squareFootage: 0 });
      setSocietyForm((prev) => ({ ...prev, wings: newWings }));
      setErrors((prev) => {
        const newErrors = [...prev.wings];
        newErrors[wingIndex].flatTypes.push({ type: '', count: '', squareFootage: '' });
        return { ...prev, wings: newErrors };
      });
    },
    [societyForm.wings]
  );

  const removeFlatType = useCallback(
    (wingIndex: number, flatIndex: number) => {
      const newWings = [...societyForm.wings];
      if (newWings[wingIndex].flatTypes.length > 0) {
        newWings[wingIndex].flatTypes.splice(flatIndex, 1);
        setSocietyForm((prev) => ({ ...prev, wings: newWings }));
        setErrors((prev) => {
          const newErrors = [...prev.wings];
          newErrors[wingIndex].flatTypes.splice(flatIndex, 1);
          return { ...prev, wings: newErrors };
        });
      } else {
        toast.error('Each wing must have at least one flat type');
      }
    },
    [societyForm.wings]
  );

  const toggleEditEmail = useCallback(() => setIsEditingEmail((prev) => !prev), []);

  const saveEmail = useCallback(() => {
    if (!societyForm.societyEmail) {
      setErrors((prev) => ({ ...prev, societyEmail: 'Email is required' }));
      toast.error('Please enter an email');
      return;
    }
    if (validateEmail(societyForm.societyEmail)) {
      setIsEditingEmail(false);
      setErrors((prev) => ({ ...prev, societyEmail: '' }));
      toast.success('Email updated successfully');
    } else {
      setErrors((prev) => ({ ...prev, societyEmail: 'Valid email required' }));
      toast.error('Please enter a valid email');
    }
  }, [societyForm.societyEmail, validateEmail]);

  const handleCertificateUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (!validTypes.includes(file.type)) {
        setCertificateError('Only PDF, JPEG, or PNG files are allowed');
        setCertificateFile(null);
        toast.error('Invalid file type');
      } else if (file.size > maxSize) {
        setCertificateError('File size must not exceed 5MB');
        setCertificateFile(null);
        toast.error('File size exceeds 5MB');
      } else {
        setCertificateFile(file);
        setCertificateError('');
        toast.success('Certificate uploaded successfully');
      }
    }
  }, []);

  const skipCertificateUpload = useCallback(() => {
    setCertificateFile(null);
    setCertificateError('');
    toast.success('Certificate upload skipped');
  }, []);

  const handlePromoCode = useCallback(
    async () => {
      if (!promoCode) {
        setPromoCodeError('Please enter a promo code');
        toast.error('Please enter a promo code');
        return;
      }
      if (!/^[A-Z0-9-]{4,20}$/.test(promoCode)) {
        setPromoCodeError('Invalid promo code format');
        toast.error('Invalid promo code format');
        return;
      }
      setIsValidatingPromo(true);
      try {
        const response = await validatePromoCode(promoCode, societyForm.societyEmail);
        if (response.valid) {
          setPromoCodeError('');
          toast.success('Promo code applied successfully');
          calculateSubscriptionAmount(selectedPlan);
        } else {
          setPromoCodeError(response.message || 'Invalid or used promo code');
          toast.error(response.message || 'Invalid or used promo code');
        }
      } catch (error) {
        setPromoCodeError('Error validating promo code');
        toast.error('Error validating promo code');
      } finally {
        setIsValidatingPromo(false);
      }
    },
    [promoCode, societyForm.societyEmail, selectedPlan, calculateSubscriptionAmount]
  );

  const initiateRazorpayPayment = useCallback(
    async (order: {
      id: string;
      amount: number;
      currency: string;
      subscriptionId?: string;
      discountPrice: number;
      societyId: number;
    }) => {
      setDiscountPrice(order.discountPrice || 0);
      // Get payment provider information
      const providerInfo = await getPaymentProvider();
      
      const isSubscription = paymentType === 'recurring';
      const options: any = {
        key: providerInfo.razorpayKeyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'Waardian',
        description: `Subscription for ${societyForm.societyName} (${paymentType})`,
        handler: async (response: any) => {
          const transaction: Transaction = {
            paymentId: response.razorpay_payment_id,
            orderId: response.razorpay_order_id || '',
            subscriptionId: response.razorpay_subscription_id || '',
            amount: order.amount / 100,
            status: 'captured',
            createdAt: new Date().toISOString(),
          };
          setTransactions((prev) => [...prev, transaction]);
          const sampleFlatNumber = societyForm.wings[0]?.wingName ? `${societyForm.wings[0].wingName}-101` : '';
          const paymentData = {
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
            subscription_id: response.razorpay_subscription_id,
            societyName: societyForm.societyName,
            address: {
              line1: societyForm.addressLine1,
              line2: societyForm.addressLine2,
              city: societyForm.city,
              state: societyForm.state,
              country: societyForm.country,
              pincode: societyForm.pincode,
            },
            societyType: societyForm.societyType,
            registrationNumber: societyForm.registrationNumber,
            registrationDate: societyForm.registrationDate,
            panNumber: societyForm.panNumber || '',
            contactNumber: societyForm.societyContact || '',
            email: societyForm.societyEmail,
            password: societyForm.password,
            sampleFlatNumber,
            wings: societyForm.wings.map((wing) => ({
              name: wing.wingName,
              floors: wing.numberOfFloors,
              flatTypes: wing.flatTypes.map((flat) => ({
                type: flat.type,
                count: flat.count,
                squareFootage: flat.squareFootage,
              })),
            })),
            subscription: {
              planId: selectedPlan!.id,
              amount: subscriptionAmount,
              pricePerFlat: selectedPlan!.pricePerFlat,
              totalFlats: calculateTotalFlats(),
              modules: selectedPlan!.modules,
              billingMonths: isSubscription ? selectedPlan!.numberOfMonths : 1,
              paymentType,
              promoCode: promoCode || undefined,
            },
            token: token as string,
            certificateFile: undefined as string | undefined,
          };
          try {
            if (certificateFile) {
              const reader = new FileReader();
              reader.readAsDataURL(certificateFile);
              reader.onload = async () => {
                const base64File = reader.result?.toString().split(',')[1];
                await completeOnboarding({ ...paymentData, certificateFile: base64File });
                toast.success('Onboarding completed successfully!');
                router.push('/login');
              };
              reader.onerror = (error) => {
                console.error('Certificate file read error:', error);
                setErrorMessage('Failed to read certificate file. Please try again.');
                setIsSubmitting(false);
                toast.error('Failed to read certificate file');
              };
            } else {
              await completeOnboarding(paymentData);
              toast.success('Onboarding completed successfully!');
              router.push('/login');
            }
            localStorage.setItem('transactions', JSON.stringify([...transactions, transaction]));
          } catch (error: any) {
            console.error('Onboarding error:', error);
            setErrorMessage(error.message || 'Payment verification failed. Please try again.');
            setIsSubmitting(false);
            toast.error(error.message || 'Payment verification failed');
            setTransactions((prev) =>
              prev.map((t) => (t.paymentId === transaction.paymentId ? { ...t, status: 'failed' } : t))
            );
          }
        },
        modal: {
          ondismiss: () => {
            setIsSubmitting(false);
            setErrorMessage('Payment cancelled. Please try again.');
            toast.error('Payment cancelled');
          },
        },
        prefill: {
          email: societyForm.societyEmail,
          contact: societyForm.societyContact || '',
        },
        notes: {
          society_id: order.societyId,
          payment_type: paymentType,
        },
        theme: {
          color: '#2563EB',
        },
      };
      if (isSubscription) {
        options.subscription_id = order.id;
      } else {
        options.order_id = order.id;
      }
      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', (response: any) => {
        console.error('Payment failed:', response);
        setIsSubmitting(false);
        setErrorMessage(response.error.description || 'Payment failed. Please try again.');
        toast.error(response.error.description || 'Payment failed');
        setTransactions((prev) => [
          ...prev,
          {
            paymentId: response.error.metadata.payment_id,
            orderId: response.error.metadata.order_id,
            amount: order.amount / 100,
            status: 'failed',
            createdAt: new Date().toISOString(),
          },
        ]);
      });
      rzp.open();
    },
    [
      societyForm,
      selectedPlan,
      subscriptionAmount,
      promoCode,
      certificateFile,
      token,
      calculateTotalFlats,
      paymentType,
      transactions,
      router,
    ]
  );

  const handleSubmit = useCallback(async () => {
    const societyErrors = validateSocietyForm();
    setErrors((prev) => ({ ...prev, ...societyErrors }));
    if (isStepInvalid(2)) {
      setErrorMessage('Please correct the errors in the form before proceeding');
      setCurrentStep(1);
      toast.error('Please Fill All Required Fields');
      return;
    }
    if (!societyForm.wings.length || societyForm.wings.some((wing) => !wing.flatTypes.length)) {
      setErrorMessage('At least one wing with one flat type is required');
      setCurrentStep(1);
      toast.error('At least one wing with one flat type is required');
      return;
    }
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const wings = societyForm.wings.map((wing) => ({
        name: wing.wingName,
        floors: wing.numberOfFloors,
        flatTypes: wing.flatTypes.map((flat) => ({
          type: flat.type,
          count: flat.count,
          squareFootage: flat.squareFootage,
        })),
      }));
      const sampleFlatNumber = societyForm.wings[0]?.wingName ? `${societyForm.wings[0].wingName}-101` : '';
      const payload = {
        token: token as string,
        societyName: societyForm.societyName,
        address: {
          line1: societyForm.addressLine1,
          line2: societyForm.addressLine2,
          city: societyForm.city,
          state: societyForm.state,
          country: societyForm.country,
          pincode: societyForm.pincode,
        },
        societyType: societyForm.societyType,
        registrationNumber: societyForm.registrationNumber,
        registrationDate: societyForm.registrationDate,
        panNumber: societyForm.panNumber || '',
        gstNumber: societyForm.gstNumber || '',
        contactNumber: societyForm.societyContact || '',
        email: societyForm.societyEmail,
        password: societyForm.password,
        sampleFlatNumber,
        wings,
        subscription: {
          planId: selectedPlan!.id,
          amount: subscriptionAmount,
          pricePerFlat: selectedPlan!.pricePerFlat,
          totalFlats: calculateTotalFlats(),
          modules: selectedPlan!.modules,
          billingMonths: paymentType === 'recurring' ? selectedPlan!.numberOfMonths : 1,
          paymentType,
          promoCode: promoCode || undefined,
        },
      };
      const order = await createRazorpayOrder(payload);
      if (order.error) {
        setErrorMessage(order.error);
        setIsSubmitting(false);
        toast.error(order.error);
        return;
      }
      await initiateRazorpayPayment(order);
    } catch (error: any) {
      console.error('Onboarding error:', error);
      setErrorMessage(error.message || 'Failed to initiate payment. Please try again.');
      setIsSubmitting(false);
      toast.error(error.message || 'Failed to initiate payment');
    }
  }, [societyForm, selectedPlan, subscriptionAmount, token, promoCode, validateSocietyForm, isStepInvalid, calculateTotalFlats, initiateRazorpayPayment, paymentType]);

  const nextStep = useCallback(() => {
    if (currentStep === 1) {
      const societyErrors = validateSocietyForm();
      setErrors((prev) => ({ ...prev, ...societyErrors }));
      if (isStepInvalid(1)) {
        toast.error('Please correct the errors in the form');
        return;
      }
      if (!societyForm.wings.length || societyForm.wings.some((wing) => !wing.flatTypes.length)) {
        setErrorMessage('At least one wing with one flat type is required');
        toast.error('At least one wing with one flat type is required');
        return;
      }
      setCurrentStep(2);
      if (selectedPlan) calculateSubscriptionAmount(selectedPlan);
    }
  }, [currentStep, selectedPlan, validateSocietyForm, isStepInvalid, calculateSubscriptionAmount, societyForm.wings]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  }, [currentStep]);

  const parseModules = useCallback((modules: string | string[]): string[] => {
    if (!modules) return [];
    if (Array.isArray(modules)) return modules;
    try {
      const parsed = JSON.parse(modules);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Error parsing modules:', e);
      return [];
    }
  }, []);

  const handleNumericInput = (value: string) => {
    return value === '' || /^[0-9]+$/.test(value) ? value : value.replace(/[^0-9]/g, '');
  };

  const handlePromoCodeChange = useCallback(
    (value: string) => {
      const upperValue = value.toUpperCase();
      setPromoCode(upperValue);
      setPromoCodeError(upperValue ? (/^[A-Z0-9-]{4,20}$/.test(upperValue) ? '' : 'Invalid promo code format') : '');
    },
    []
  );

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
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Progress Steps */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            {[1, 2].map((step) => (
              <div
                key={step}
                className={`flex items-center space-x-2 text-sm font-medium transition-all ${
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
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Set Up Your Society Root Account</h2>
              <p className="text-gray-600 mb-6">
                Configure your society’s root account for administrative access. This account is for web portal management only.
              </p>
              <div className="space-y-6">
                {/* Society Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">Society Name *</label>
                    <input
                      type="text"
                      value={societyForm.societyName}
                      onChange={(e) => handleSocietyNameChange(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder-gray-400"
                      placeholder="Enter society name"
                      aria-invalid={!!errors.societyName}
                    />
                    {errors.societyName && <p className="text-red-500 text-xs mt-1">{errors.societyName}</p>}
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">Society Type *</label>
                    <select
                      value={societyForm.societyType}
                      onChange={(e) => handleSocietyTypeChange(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder-gray-400"
                      aria-invalid={!!errors.societyType}
                    >
                      <option value="" disabled>
                        Select society type
                      </option>
                      {societyTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    {errors.societyType && <p className="text-red-500 text-xs mt-1">{errors.societyType}</p>}
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">Registration Number *</label>
                    <input
                      type="text"
                      value={societyForm.registrationNumber}
                      onChange={(e) => handleRegistrationNumberChange(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder-gray-400"
                      placeholder="Enter registration number"
                      aria-invalid={!!errors.registrationNumber}
                    />
                    {errors.registrationNumber && <p className="text-red-500 text-xs mt-1">{errors.registrationNumber}</p>}
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">Registration Date *</label>
                    <input
                      type="date"
                      value={societyForm.registrationDate}
                      onChange={(e) => handleRegistrationDateChange(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder-gray-400"
                      max={new Date().toISOString().split('T')[0]}
                      min="1900-01-01"
                      aria-invalid={!!errors.registrationDate}
                    />
                    {errors.registrationDate && <p className="text-red-500 text-xs mt-1">{errors.registrationDate}</p>}
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">Society PAN Number</label>
                    <input
                      type="text"
                      value={societyForm.panNumber}
                      onChange={(e) => handlePanNumberChange(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder-gray-400"
                      placeholder="Enter PAN number (e.g., ABCDE1234F)"
                      aria-invalid={!!errors.panNumber}
                    />
                    {errors.panNumber && <p className="text-red-500 text-xs mt-1">{errors.panNumber}</p>}
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">Society GST Number</label>
                    <input
                      type="text"
                      value={societyForm.gstNumber}
                      onChange={(e) => handleGstNumberChange(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder-gray-400"
                      placeholder="Enter GST number (e.g., 22AAAAA0000A1Z5)"
                      aria-invalid={!!errors.gstNumber}
                    />
                    {errors.gstNumber && <p className="text-red-500 text-xs mt-1">{errors.gstNumber}</p>}
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">Address Line 1 *</label>
                    <input
                      type="text"
                      value={societyForm.addressLine1}
                      onChange={(e) => handleAddressLine1Change(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder-gray-400"
                      placeholder="Enter address line 1"
                      aria-invalid={!!errors.addressLine1}
                    />
                    {errors.addressLine1 && <p className="text-red-500 text-xs mt-1">{errors.addressLine1}</p>}
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">Address Line 2</label>
                    <input
                      type="text"
                      value={societyForm.addressLine2}
                      onChange={(e) => handleAddressLine2Change(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder-gray-400"
                      placeholder="Enter address line 2"
                      aria-invalid={!!errors.addressLine2}
                    />
                    {errors.addressLine2 && <p className="text-red-500 text-xs mt-1">{errors.addressLine2}</p>}
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">PIN Code *</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={societyForm.pincode}
                        onChange={(e) => handlePincodeChange(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder-gray-400 pr-10"
                        placeholder="Enter 6-digit PIN code (auto-fetch)"
                        aria-invalid={!!errors.pincode}
                        maxLength={6}
                      />
                      {isFetchingPincode && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                        </div>
                      )}
                    </div>
                    {errors.pincode && <p className="text-red-500 text-xs mt-1">{errors.pincode}</p>}
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">City *</label>
                    <input
                      type="text"
                      value={societyForm.city}
                      onChange={(e) => handleCityChange(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder-gray-400"
                      placeholder="Enter city"
                      aria-invalid={!!errors.city}
                    />
                    {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">State *</label>
                    <input
                      type="text"
                      value={societyForm.state}
                      onChange={(e) => handleStateChange(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder-gray-400"
                      placeholder="Enter state"
                      aria-invalid={!!errors.state}
                    />
                    {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">Country *</label>
                    <input
                      type="text"
                      value={societyForm.country}
                      onChange={(e) => handleCountryChange(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder-gray-400"
                      placeholder="Enter country"
                      aria-invalid={!!errors.country}
                    />
                    {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country}</p>}
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">Society Registration Certificate</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleCertificateUpload}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                        aria-invalid={!!certificateError}
                      />
                      <button
                        type="button"
                        onClick={skipCertificateUpload}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        Do it later
                      </button>
                    </div>
                    {certificateFile && <p className="text-sm text-gray-600 mt-1">Selected: {certificateFile.name}</p>}
                    {certificateError && <p className="text-red-500 text-xs mt-1">{certificateError}</p>}
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">Contact Number</label>
                    <input
                      type="text"
                      value={societyForm.societyContact}
                      onChange={(e) => handleSocietyContactChange(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder-gray-400"
                      placeholder="Enter 10-digit number"
                      aria-invalid={!!errors.societyContact}
                      maxLength={10}
                    />
                    {errors.societyContact && <p className="text-red-500 text-xs mt-1">{errors.societyContact}</p>}
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">Email *</label>
                    <div className="flex">
                      <input
                        type="email"
                        value={societyForm.societyEmail}
                        onChange={(e) => handleSocietyEmailChange(e.target.value)}
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
                  <div className="relative">
                    <label className="block text-gray-700 text-sm font-medium mb-1">Password *</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={societyForm.password}
                      onChange={(e) => handlePasswordChange(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder-gray-400 pr-10"
                      placeholder="Enter password (min 8 chars, mixed case, number, special char)"
                      aria-invalid={!!errors.password}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                    {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                  </div>
                  <div className="relative">
                    <label className="block text-gray-700 text-sm font-medium mb-1">Confirm Password *</label>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={societyForm.confirmPassword}
                      onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder-gray-400 pr-10"
                      placeholder="Confirm password"
                      aria-invalid={!!errors.confirmPassword}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                    {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
                  </div>
                </div>
                {/* Wing Configuration */}
                <div className="border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Wing Configuration</h3>
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-1">Total Wings *</label>
                      <input
                        type="text"
                        value={societyForm.totalWings || ''}
                        onChange={(e) => handleTotalWingsChange(e.target.value)}
                        className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder-gray-400"
                        placeholder="1-50"
                        aria-invalid={!!errors.totalWings}
                        maxLength={2}
                      />
                      {errors.totalWings && <p className="text-red-500 text-xs mt-1">{errors.totalWings}</p>}
                    </div>
                  </div>
                  <div className="space-y-4">
                    {societyForm.wings.map((wing, wingIndex) => (
                      <div key={wingIndex} className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">Wing {wingIndex + 1}</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-gray-700 text-sm font-medium mb-1">Wing Name *</label>
                            <input
                              type="text"
                              value={wing.wingName}
                              onChange={(e) => handleWingNameChange(wingIndex, e.target.value)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder-gray-400"
                              placeholder="Enter wing name (e.g., A)"
                              aria-invalid={!!errors.wings[wingIndex]?.wingName}
                            />
                            {errors.wings[wingIndex]?.wingName && (
                              <p className="text-red-500 text-xs mt-1">{errors.wings[wingIndex].wingName}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-gray-700 text-sm font-medium mb-1">Number of Floors *</label>
                            <input
                              type="text"
                              value={wing.numberOfFloors || ''}
                              onChange={(e) => handleNumberOfFloorsChange(wingIndex, e.target.value)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder-gray-400"
                              placeholder="1-100"
                              aria-invalid={!!errors.wings[wingIndex]?.numberOfFloors}
                              maxLength={3}
                            />
                            {errors.wings[wingIndex]?.numberOfFloors && (
                              <p className="text-red-500 text-xs mt-1">{errors.wings[wingIndex].numberOfFloors}</p>
                            )}
                          </div>
                        </div>
                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h5 className="text-sm font-medium text-gray-700">Flat Types (Per Floor) *</h5>
                              <p className="text-xs text-gray-500 mt-1">Define different types of flats on each floor with their count and square footage</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => addFlatType(wingIndex)}
                              className="flex items-center text-blue-600 hover:text-blue-800"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Add Flat Type
                            </button>
                          </div>
                          {wing.flatTypes.map((flat, flatIndex) => (
                            <div key={flatIndex} className="flex items-end space-x-4 mt-2">
                              <div className="flex-1">
                                <label className="block text-gray-700 text-sm font-medium mb-1">Flat Type *</label>
                                <select
                                  value={flat.type}
                                  onChange={(e) => handleFlatTypeChange(wingIndex, flatIndex, e.target.value)}
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder-gray-400"
                                  aria-invalid={!!errors.wings[wingIndex]?.flatTypes[flatIndex]?.type}
                                >
                                  <option value="" disabled>
                                    Select flat type
                                  </option>
                                  {flatTypes.map((type) => (
                                    <option key={type} value={type}>
                                      {type}
                                    </option>
                                  ))}
                                </select>
                                {errors.wings[wingIndex]?.flatTypes[flatIndex]?.type && (
                                  <p className="text-red-500 text-xs mt-1">{errors.wings[wingIndex].flatTypes[flatIndex].type}</p>
                                )}
                              </div>
                              <div className="flex-1">
                                <label className="block text-gray-700 text-sm font-medium mb-1">Count *</label>
                                <input
                                  type="text"
                                  value={flat.count || ''}
                                  onChange={(e) => handleFlatCountChange(wingIndex, flatIndex, e.target.value)}
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder-gray-400"
                                  placeholder="1-50"
                                  aria-invalid={!!errors.wings[wingIndex]?.flatTypes[flatIndex]?.count}
                                  maxLength={2}
                                />
                                {errors.wings[wingIndex]?.flatTypes[flatIndex]?.count && (
                                  <p className="text-red-500 text-xs mt-1">{errors.wings[wingIndex].flatTypes[flatIndex].count}</p>
                                )}
                              </div>
                              <div className="flex-1">
                                <label className="block text-gray-700 text-sm font-medium mb-1">Square Footage *</label>
                                <input
                                  type="text"
                                  value={flat.squareFootage || ''}
                                  onChange={(e) => handleSquareFootageChange(wingIndex, flatIndex, e.target.value)}
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder-gray-400"
                                  placeholder="200-5000"
                                  aria-invalid={!!errors.wings[wingIndex]?.flatTypes[flatIndex]?.squareFootage}
                                  maxLength={4}
                                />
                                {errors.wings[wingIndex]?.flatTypes[flatIndex]?.squareFootage && (
                                  <p className="text-red-500 text-xs mt-1">{errors.wings[wingIndex].flatTypes[flatIndex].squareFootage}</p>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => removeFlatType(wingIndex, flatIndex)}
                                className="p-2 text-red-600 hover:text-red-800"
                                disabled={wing.flatTypes.length <= 1}
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-8 flex justify-end">
                <button
                  type="button"
                  onClick={nextStep}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all flex items-center"
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
              <p className="text-gray-600 mb-6">Select a plan and payment type that best fits your society’s needs.</p>
              {/* Payment Type Selection */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Type</h3>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentType"
                      value="recurring"
                      checked={paymentType === 'recurring'}
                      onChange={() => setPaymentType('recurring')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-700">Recurring (Recommended)</span>
                    <div className="relative group">
                      <Info className="h-4 w-4 text-gray-400" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Automatic renewals, hassle-free management, and exclusive discounts
                      </div>
                    </div>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentType"
                      value="one-time"
                      checked={paymentType === 'one-time'}
                      onChange={() => setPaymentType('one-time')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-700">One-Time</span>
                    <div className="relative group">
                      <Info className="h-4 w-4 text-gray-400" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Single payment for the selected period
                      </div>
                    </div>
                  </label>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {paymentType === 'recurring'
                    ? 'Enjoy automatic renewals and exclusive discounts with recurring payments!'
                    : 'Make a one-time payment for the selected plan duration.'}
                </p>
              </div>
              {/* Subscription Plans */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {subscriptionPlans.map((plan) => (
                  <div
                    key={plan.id}
                    onClick={() => {
                      setSelectedPlan(plan);
                      setPromoCode('');
                      setPromoCodeError('');
                      calculateSubscriptionAmount(plan);
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
                    <div className="text-xl font-bold text-blue-600">
                      ₹{plan.pricePerFlat.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      {plan.discountPrice > 0 && (
                        <span className="text-sm text-gray-500 line-through ml-2">
                          ₹{plan.discountPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      )}
                      <span className="text-sm text-gray-600"> per Flat</span>
                    </div>
                    {plan.discountPrice > 0 && (
                      <span className="text-sm text-green-600">
                        (Save {((plan.discountPrice - plan.pricePerFlat) / plan.discountPrice * 100).toFixed(0)}%)
                      </span>
                    )}
                    {plan.isTrial && (
                      <div className="mt-2 text-sm text-blue-600 font-medium">{plan.trial_days} Days trial period</div>
                    )}
                    <div className="mt-4">
                      <h5 className="font-medium text-gray-900 mb-2">Included Modules:</h5>
                      <ul className="text-sm text-gray-600">
                        {parseModules(plan.modules).map((module, i) => (
                          <li key={i} className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                            {module}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
              {/* Promo Code */}
              {selectedPlan && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Apply Promo Code</h3>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => handlePromoCodeChange(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder-gray-400"
                      placeholder="Enter promo code"
                      disabled={isValidatingPromo}
                      aria-invalid={!!promoCodeError}
                      maxLength={20}
                    />
                    <button
                      type="button"
                      onClick={handlePromoCode}
                      disabled={isValidatingPromo || !promoCode}
                      className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center"
                    >
                      {isValidatingPromo ? (
                        <>
                          <Loader2 className="animate-spin h-5 w-5 mr-2" />
                          Validating...
                        </>
                      ) : (
                        'Apply'
                      )}
                    </button>
                  </div>
                  {promoCodeError && <p className="text-red-500 text-xs mt-1">{promoCodeError}</p>}
                </div>
              )}
              {/* Subscription Summary */}
              {selectedPlan && (
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl mb-6 border-2 border-blue-200 shadow-sm">
                  <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <CheckCircle className="h-6 w-6 mr-2 text-blue-500" />
                    Subscription Summary
                  </h4>
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between">
                      <div className="text-gray-600">Total Flats:</div>
                      <div className="font-medium text-gray-900">{calculateTotalFlats() || 'N/A'}</div>
                    </div>
                    <div className="flex justify-between">
                      <div className="text-gray-600">Selected Plan:</div>
                      <div className="font-medium text-gray-900">{selectedPlan?.name || 'No plan selected'}</div>
                    </div>
                    <div className="flex justify-between">
                      <div className="text-gray-600">Payment Type:</div>
                      <div className="font-medium text-gray-900">{paymentType === 'recurring' ? 'Recurring' : 'One-Time'}</div>
                    </div>
                    {promoCode && (
                      <div className="flex justify-between">
                        <div className="text-gray-600">Promo Code:</div>
                        <div className="font-medium text-gray-900">{promoCode}</div>
                      </div>
                    )}
                  </div>
                  <div className="border-t-2 border-blue-200 pt-4">
                    <div className="flex justify-between items-center mb-1">
                      <div className="text-gray-600">Original Cost:</div>
                      <div className="font-medium text-gray-900">
                        ₹{subscriptionAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                    {discountPrice > 0 && (
                      <div className="flex justify-between items-center text-green-600">
                        <div className="flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mr-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                          Your Savings ({((selectedPlan.discountPrice - selectedPlan.pricePerFlat) / selectedPlan.discountPrice * 100).toFixed(0)}%)
                        </div>
                        <div className="font-medium">
                          ₹{(calculateTotalFlats() * (selectedPlan.discountPrice - selectedPlan.pricePerFlat)).toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-lg font-bold text-blue-700 mt-3 pt-3 border-t-2 border-blue-200">
                      <div>Total Due:</div>
                      <div className="text-2xl">
                        ₹{subscriptionAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                    {discountPrice > 0 && (
                      <div className="mt-3 p-3 bg-green-50 rounded-lg text-green-700 text-sm flex items-center">
                        <CheckCircle className="h-5 w-5 mr-2" />
                        You're saving ₹
                        {((selectedPlan.discountPrice * calculateTotalFlats()) - subscriptionAmount).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{' '}
                        with this plan!
                      </div>
                    )}
                  </div>
                </div>
              )}
              {/* Transaction History */}
              {transactions.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction History</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    {transactions.map((transaction, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                        <div>
                          <p className="text-sm font-medium text-gray-900">Payment ID: {transaction.paymentId}</p>
                          <p className="text-xs text-gray-600">Date: {new Date(transaction.createdAt).toLocaleString()}</p>
                        </div>
                        <div className="text-sm">
                          <span className={`font-medium ${transaction.status === 'captured' ? 'text-green-600' : 'text-red-600'}`}>
                            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                          </span>
                          <p className="text-gray-600">
                            ₹{transaction.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Error Message */}
              {errorMessage && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{errorMessage}</div>
              )}
              {/* Navigation Buttons */}
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
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin h-5 w-5 mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Proceed to Payment
                      <CheckCircle className="h-5 w-5 ml-2" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SocietyOnboarding;