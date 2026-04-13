'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import {
  Users,
  Mail,
  Phone,
  Badge,
  LocateIcon as Location,
  Calendar,
  IndianRupee,
  Banknote,
  CreditCard,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { validateUserOnboardingToken, completeUserOnboarding } from '@/lib/onboardingClient';

type OnboardingFormData = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  flatType: string;
  squareFeet: number;
  password: string;
  confirmPassword: string;
};

type MemberData = {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  relationship: string;
  flat_id: string | null;
  flat_type: string | null;
  square_feet: number | null;
  agreement_start_date: string | null;
  agreement_end_date: string | null;
  rent_amount: number | null;
  rent_due_date: number | null;
  security_deposit: number | null;
  is_security_deposit_paid: boolean;
  security_deposit_due_date: string | null;
  maintenance_responsibility: string | null;
  penalty: {
    type: string;
    sub_type: string | null;
    amount: number;
    grace_days: number;
  };
  fee_payer: string | null;
  payment_methods: string[];
  gstin: string | null;
  bank_details: {
    bank_name: string | null;
    account_number: string | null;
    ifsc_code: string | null;
  } | null;
  collect_via_app: boolean;
};

type ValidationResponse = {
  userId: string;
  userType: string;
  username: string;
  email: string;
  societyId: string;
  societyStatus: string;
  memberData: MemberData;
  flatId: string | null;
  flatNumber: string | null;
  wingName: string | null;
  floorNumber: number | null;
  onboardingStatus: string;
  nextStep?: string;
  isTenant: boolean;
};

export default function MemberOnboarding() {
  const { token } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isTokenInvalid, setIsTokenInvalid] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [data, setData] = useState<ValidationResponse | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [hidePassword, setHidePassword] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    reset,
  } = useForm<OnboardingFormData>({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      flatType: '',
      squareFeet: 0,
      password: '',
      confirmPassword: '',
    },
    mode: 'onChange',
  });

  useEffect(() => {
    if (token) {
      validateUserOnboardingToken(token as string)
        .then((response) => {
          if (response.userId && response.memberData) {
            setData(response);
            reset({
              firstName: response.memberData.first_name || '',
              lastName: response.memberData.last_name || '',
              email: response.memberData.email || '',
              phoneNumber: response.memberData.phone_number || '',
              flatType: response.memberData.flat_type || '',
              squareFeet: response.memberData.square_feet || 0,
              password: '',
              confirmPassword: '',
            });
          } else {
            setErrorMessage('Invalid or expired token. Please contact your administrator.');
            setIsTokenInvalid(true);
          }
          setLoading(false);
        })
        .catch((error) => {
          console.error('Token validation error:', error);
          setErrorMessage('Invalid or expired token. Please contact your administrator.');
          setIsTokenInvalid(true);
          setLoading(false);
        });
    }
  }, [token, reset]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatPenaltyType = (type: string) => {
    if (type === 'per_day') return 'Per Day';
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const checkPasswordsMatch = () => {
    return watch('password') === watch('confirmPassword');
  };

  const onSubmit = async (formData: OnboardingFormData) => {
    if (!isValid) {
      toast.error('Please fix the form errors (e.g., required fields)', { autoClose: 3000 });
      return;
    }
    if (!checkPasswordsMatch()) {
      toast.error('Passwords do not match', { autoClose: 3000 });
      return;
    }
    if (!data?.memberData.flat_id || !data?.memberData.relationship) {
      toast.error('Missing flat ID or member type information', { autoClose: 5000 });
      return;
    }
    setLoading(true);
    try {
      const payload: {
        token: string;
        firstName: string;
        lastName: string;
        email: string;
        phoneNumber: string;
        flatId: string;
        memberType: string;
        password: string;
        flatType?: string;
        squareFeet?: number;
      } = {
        token: token as string,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        flatId: data.memberData.flat_id,
        memberType: data.memberData.relationship,
        password: formData.password,
      };
      if (data.memberData.relationship === 'owner') {
        payload.flatType = formData.flatType;
        payload.squareFeet = formData.squareFeet;
      }
      const response = await completeUserOnboarding(payload);
      if (response.success || response.message === 'Member onboarding completed successfully') {
        toast.success('Onboarding completed successfully!', { autoClose: 3000 });
        setIsSubmitted(true);
      } else {
        toast.error(response.message || 'Error completing onboarding', { autoClose: 5000 });
      }
    } catch (error: any) {
      console.error('Onboarding API error:', error);
      toast.error(error.message || 'Error processing request. Please try again.', { autoClose: 5000 });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (isTokenInvalid) {
    return (
      <div className="text-center p-8 bg-white rounded-lg shadow-lg">
        <svg
          className="text-red-500 mb-4 mx-auto"
          width={40}
          height={40}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Invalid Token</h2>
        <p className="text-gray-600">{errorMessage}</p>
        <button
          onClick={() => router.push('/login')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Login
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { memberData, isTenant, flatNumber, wingName, floorNumber } = data;
  const showFlatDetails = memberData.relationship === 'owner';

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-4 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-xl rounded-xl p-8 max-w-md mx-auto text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Download Our App</h2>
          <p className="text-gray-600 mb-6">Manage your account easily with our mobile app.</p>
          <div className="flex justify-center items-center gap-4">
            <a href="https://apps.apple.com/in/app/waardian/id6749545666" target="_blank" rel="noopener noreferrer">
              <img
                src="/assets/AppleAppStore.svg"
                alt="Download on the App Store"
                className="h-120"
              />
            </a>
            <a href="https://play.google.com/store/apps/details?id=com.waardian.app&hl=en" target="_blank" rel="noopener noreferrer">
              <img
                src="/assets/GooglePlayStore.svg"
                alt="Get it on Google Play"
                className="h-120"
              />
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-4 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="px-6 py-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Review and Update Your Details</h2>
            <p className="mt-2 text-sm text-gray-600">
              Please review and update your details as needed, then set your password to complete onboarding. Contact your administrator if any other information needs correction.
            </p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-6 space-y-8">
            {/* Personal Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-700 flex items-center">
                <Users className="mr-2 text-blue-600" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    {...register('firstName', { required: 'First Name is required' })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.firstName && <p className="text-red-500 text-sm">{errors.firstName.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    {...register('lastName', { required: 'Last Name is required' })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.lastName && <p className="text-red-500 text-sm">{errors.lastName.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                        message: 'Invalid email address',
                      },
                    })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    {...register('phoneNumber', {
                      required: 'Phone Number is required',
                      pattern: {
                        value: /^[6-9]\d{9}$/,
                        message: 'Invalid phone number (must be 10 digits, starting with 6-9)',
                      },
                    })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.phoneNumber && <p className="text-red-500 text-sm">{errors.phoneNumber.message}</p>}
                </div>
              </div>
            </div>
            {/* Member Type */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-700 flex items-center">
                <Badge className="mr-2 text-blue-600" />
                Member Type
              </h3>
              <p className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100">{memberData.relationship || 'N/A'}</p>
            </div>
            {/* Location Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-700 flex items-center">
                <Location className="mr-2 text-blue-600" />
                Location Details
              </h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Wing</label>
                  <p className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100">{wingName || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
                  <p className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100">{floorNumber || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Flat</label>
                  <p className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100">{flatNumber || 'N/A'}</p>
                </div>
                {showFlatDetails && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Flat Type</label>
                      <p className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100">{memberData.flat_type || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Square Feet</label>
                      <p className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100">{memberData.square_feet || 'N/A'}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
            {/* Tenant-Specific Fields */}
            {isTenant && (
              <>
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-700 flex items-center">
                    <Calendar className="mr-2 text-blue-600" />
                    Rental Agreement Details
                  </h3>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Agreement Start Date</label>
                      <p className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100">
                        {formatDate(memberData.agreement_start_date)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Agreement End Date</label>
                      <p className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100">
                        {formatDate(memberData.agreement_end_date)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Rent Amount</label>
                      <p className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100">
                        {memberData.rent_amount ? `₹${memberData.rent_amount}` : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Rent Due Date</label>
                      <p className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100">
                        {memberData.rent_due_date
                          ? `${memberData.rent_due_date}${getDayOfMonthSuffix(memberData.rent_due_date)} of every month`
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Security Deposit</label>
                      <p className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100">
                        {memberData.security_deposit ? `₹${memberData.security_deposit}` : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Security Deposit Status</label>
                      <p className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100">
                        {memberData.is_security_deposit_paid
                          ? 'Paid'
                          : memberData.security_deposit_due_date
                            ? `Due on ${formatDate(memberData.security_deposit_due_date)}`
                            : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Maintenance Responsibility</label>
                      <p className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100">
                        {memberData.maintenance_responsibility || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-700 flex items-center">
                    <IndianRupee className="mr-2 text-blue-600" />
                    Penalty Details
                  </h3>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Penalty Type</label>
                      <p className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100">
                        {formatPenaltyType(memberData.penalty.type)}
                      </p>
                    </div>
                    {memberData.penalty.type !== 'none' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Penalty Calculation</label>
                          <p className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100">
                            {memberData.penalty.sub_type || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Penalty Amount</label>
                          <p className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100">
                            {memberData.penalty.amount
                              ? memberData.penalty.sub_type === 'percentage'
                                ? `${memberData.penalty.amount}%`
                                : `₹${memberData.penalty.amount}`
                              : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Grace Days</label>
                          <p className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100">
                            {memberData.penalty.grace_days || '0'}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-700 flex items-center">
                    <Banknote className="mr-2 text-blue-600" />
                    Payment Collection Details
                  </h3>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Methods Allowed
                        <span className="text-gray-500 text-xs ml-1">(Modes accepted for rent)</span>
                      </label>
                      <p className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100">
                        {memberData.payment_methods?.length > 0 ? memberData.payment_methods.join(', ') : 'N/A'}
                      </p>
                    </div>
                    {memberData.gstin && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          GSTIN
                          <span className="text-gray-500 text-xs ml-1">(Government-issued GST identification number)</span>
                        </label>
                        <p className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100">{memberData.gstin}</p>
                      </div>
                    )}

                  </div>
                </div>
                {memberData.bank_details && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium text-gray-700 flex items-center">
                      <CreditCard className="mr-2 text-blue-600" />
                      Bank Details
                    </h3>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                        <p className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100">
                          {memberData.bank_details.bank_name || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                        <p className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100">
                          {memberData.bank_details.account_number || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                        <p className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100">
                          {memberData.bank_details.ifsc_code || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            {/* Password Fields */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-700 flex items-center">
                <Lock className="mr-2 text-blue-600" />
                Set Password
              </h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <div className="relative">
                    <input
                      {...register('password', {
                        required: 'Password is required',
                        minLength: { value: 6, message: 'Password must be at least 6 characters' },
                      })}
                      type={hidePassword ? 'password' : 'text'}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setHidePassword(!hidePassword)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500"
                    >
                      {hidePassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                  <div className="relative">
                    <input
                      {...register('confirmPassword', { required: 'Confirm Password is required' })}
                      type={hidePassword ? 'password' : 'text'}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setHidePassword(!hidePassword)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500"
                    >
                      {hidePassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {!checkPasswordsMatch() && watch('confirmPassword') && (
                    <p className="text-red-500 text-sm">Passwords do not match</p>
                  )}
                </div>
              </div>
            </div>
            <div className="bg-gray-50 flex justify-end space-x-4">
              <button
                type="submit"
                disabled={loading || !isValid || !checkPasswordsMatch()}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
              >
                <span>Complete Onboarding</span>
                <div className="ml-2 w-5 h-5">
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function getDayOfMonthSuffix(day: number): string {
  if (day >= 11 && day <= 13) return 'th';
  switch (day % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
}