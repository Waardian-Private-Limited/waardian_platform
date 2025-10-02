'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  Clock,
  DollarSign,
  Lock,
  Eye,
  EyeOff,
  Upload,
  X,
} from 'lucide-react';
import { apiClient } from '@/lib/apiClient';

type StaffData = {
  id: number;
  name: string;
  email: string;
  phone: string;
  gender: string;
  designation: string;
  category: string;
  role: string;
  staffType: string;
  flexibleTiming: boolean;
  startTime: string;
  endTime: string;
  joiningDate: string;
  upiId: string;
  allowAppAccess: boolean;
  workingDays: { [key: string]: boolean };
  leavePolicy: {
    id: number;
    financial_year_cycle: string;
    total_leaves: number;
    carry_forward_limit: number;
  } | null;
  salaryInfo: {
    salary: string;
    salary_date: string;
    upi_id: string;
  };
  salaryBreakdowns: { type: string; amount: number; is_addition: boolean }[];
};

type OnboardingFormData = {
  password: string;
  confirmPassword: string;
  profilePic?: File;
  documents: File[];
};

async function validateStaffOnboardingToken(token: string): Promise<StaffData> {
  try {
    const response = await apiClient(`/staffonboarding/validate/${token}`);
    // console.log('Staff onboarding data:', response);
    const data = response.data ? response.data : (await response.json()).data;
    if (data.salaryInfo?.salary) {
      data.salaryInfo.salary = data.salaryInfo.salary;
    }
    data.allowAppAccess = !!data.allowAppAccess;
    data.flexibleTiming = !!data.flexibleTiming;
    // console.log('Parsed staff onboarding data:', data);
    return data;
  } catch (error) {
    console.error('Token validation failed:', error);
    throw new Error('Invalid or expired token');
  }
}

async function uploadFile(token: string, file: File, context: string = 'staffDocs'): Promise<{ url: string; name: string }> {
  const formData = new FormData();
  formData.append('token', token); // Send token for authentication
  formData.append('files', file);  // Use 'files' key to match backend

  const response = await apiClient(`/files/upload/${context}`, {
    method: 'POST',
    body: formData,
  });

  // console.log('response', response);

  const result = response; // No `.json()` needed
  if (result.status !== 'success') {
    throw new Error(result.message || `Error uploading file: ${file.name}`);
  }

  return { url: result.data.files[0].url, name: file.name };
}


async function completeStaffOnboarding(payload: {
  token: string;
  password: string;
  documentUrls: { url: string; name: string }[];
}) {
  const response = await apiClient('/staffonboarding/complete-onboarding', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: {
      token: payload.token,
      password: payload.password,
      documents: payload.documentUrls.map((doc) => ({ url: doc.url, name: doc.name })),
    },
  });

  // ✅ Correct success check based on your actual response structure
  if (response.success !== true) {
    throw new Error(response.message || 'Error completing onboarding');
  }

  return response;
}

export default function StaffOnboarding() {
  const { token } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isTokenInvalid, setIsTokenInvalid] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [staffData, setStaffData] = useState<StaffData | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [hidePassword, setHidePassword] = useState(true);
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<OnboardingFormData>({
    defaultValues: {
      password: '',
      confirmPassword: '',
      profilePic: undefined,
      documents: [],
    },
    mode: 'onChange',
  });

  useEffect(() => {
    if (token) {
      validateStaffOnboardingToken(token as string)
        .then((data) => {
          if (data.id) {
            setStaffData(data);
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
  }, [token]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatWorkingDays = (days: { [key: string]: boolean }) => {
    const activeDays = Object.keys(days)
      .filter((day) => days[day])
      .map((day) => day.charAt(0).toUpperCase() + day.slice(1));
    return activeDays.length > 0 ? activeDays.join(', ') : 'N/A';
  };

  const formatFinancialYearCycle = (cycle: string | null) => {
    if (!cycle) return 'N/A';
    return cycle === 'jan-dec' ? 'January - December' : 'April - March';
  };

  const checkPasswordsMatch = () => {
    return watch('password') === watch('confirmPassword');
  };

  const validatePassword = (password: string) => ({
    minLength: password.length >= 8,
    hasNumber: /\d/.test(password),
    hasUpperCase: /[A-Z]/.test(password),
  });

  const handleProfilePicSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setProfilePicUrl(URL.createObjectURL(file));
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      setSelectedFiles((prev) => [
        ...prev,
        ...files.filter((file) =>
          file.size <= 10 * 1024 * 1024 &&
          ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)
        ),
      ]);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0) {
      setSelectedFiles((prev) => [
        ...prev,
        ...files.filter((file) =>
          file.size <= 10 * 1024 * 1024 &&
          ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)
        ),
      ]);
    }
  };

  const removeFile = (fileToRemove: File) => {
    setSelectedFiles((prev) => prev.filter((file) => file !== fileToRemove));
    if (fileToRemove === watch('profilePic')) {
      setProfilePicUrl(null);
    }
  };

  const onSubmit = async (formData: OnboardingFormData) => {
  if (!isValid) {
    toast.error('Please fix the form errors', { autoClose: 3000 });
    return;
  }

  if (!checkPasswordsMatch()) {
    toast.error('Passwords do not match', { autoClose: 3000 });
    return;
  }

  if (selectedFiles.length === 0) {
    toast.error('Please upload at least one document', { autoClose: 3000 });
    return;
  }

  setLoading(true);
  try {
    const documentUrls: { url: string; name: string }[] = [];

    for (const file of selectedFiles) {
      try {
        const result = await uploadFile(token as string, file);
        documentUrls.push(result);
      } catch (error: any) {
        toast.error(`Failed to upload ${file.name}: ${error.message}`, { autoClose: 5000 });
        throw error; // Stop the submission
      }
    }

    const payload = {
      token: token as string,
      password: formData.password,
      documentUrls,
    };

    const result = await completeStaffOnboarding(payload);

    toast.success(result.message || 'Onboarding completed successfully!', { autoClose: 3000 });
    setIsSubmitted(true);

  } catch (error: any) {
    console.error('Onboarding error:', error);
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

  if (!staffData) return null;

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

  const passwordValidations = validatePassword(watch('password'));

  return (
    <div className="min-h-screen py-4 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="px-6 py-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Complete Your Onboarding</h2>
            <p className="mt-2 text-sm text-gray-600">
              Welcome to the team! Please complete your account setup.
            </p>
          </div>

          <div className="px-6 py-6">
            <h3 className="text-lg font-medium text-gray-700 flex items-center mb-4">
              <User className="mr-2 text-blue-600" />
              Staff Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <p className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100">{staffData.name || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <p className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100">{staffData.email || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <p className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100">{staffData.phone || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <p className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100">{staffData.gender || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                <p className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100">{staffData.designation || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <p className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100">{staffData.category || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <p className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100">{staffData.role || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Staff Type</label>
                <p className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100">{staffData.staffType || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Joining Date</label>
                <p className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100">{formatDate(staffData.joiningDate)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Working Hours</label>
                <p className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100">
                  {staffData.startTime} - {staffData.endTime} ({staffData.flexibleTiming ? 'Flexible' : 'Fixed'})
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Working Days</label>
                <p className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100">{formatWorkingDays(staffData.workingDays)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">UPI ID</label>
                <p className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100">{staffData.upiId || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Allow App Access</label>
                <p className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100">{staffData.allowAppAccess ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Base Salary</label>
                <p className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100">
                  ₹{staffData.salaryInfo?.salary ? parseFloat(staffData.salaryInfo.salary).toLocaleString() : 'N/A'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Salary Date</label>
                <p className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100">{staffData.salaryInfo?.salary_date || 'N/A'}</p>
              </div>
            </div>
            {staffData.salaryBreakdowns.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-700 flex items-center mb-4">
                  <DollarSign className="mr-2 text-blue-600" />
                  Salary Breakdown
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {staffData.salaryBreakdowns.map((breakdown, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">{breakdown.type}</span>
                      <span className={`text-sm ${breakdown.is_addition ? 'text-green-600' : 'text-red-600'}`}>
                        {breakdown.is_addition ? '+' : '-'} ₹{breakdown.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-6 space-y-8">
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
                        validate: {
                          minLength: (value) => value.length >= 8 || 'Password must be at least 8 characters',
                          hasNumber: (value) => /\d/.test(value) || 'Password must contain at least one number',
                          hasUpperCase: (value) => /[A-Z]/.test(value) || 'Password must contain at least one uppercase letter',
                        },
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
                  <div className="mt-2 space-y-1 text-xs text-gray-500">
                    <p>Password requirements:</p>
                    <ul className="list-disc list-inside text-xs text-gray-500">
                      <li className={passwordValidations.minLength ? 'text-green-600' : ''}>Minimum 8 characters</li>
                      <li className={passwordValidations.hasNumber ? 'text-green-600' : ''}>At least one number</li>
                      <li className={passwordValidations.hasUpperCase ? 'text-green-600' : ''}>At least one uppercase letter</li>
                    </ul>
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

            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-700 flex items-center">
                <Upload className="mr-2 text-blue-600" />
                Upload Documents (Required)
              </h3>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  isDragging ? 'border-blue-500 bg-blue-50' : ''
                }`}
              >
                <input
                  type="file"
                  hidden
                  ref={fileInputRef}
                  multiple
                  accept=".pdf,.docx"
                  onChange={handleFileSelect}
                />
                <div className="space-y-3">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="text-sm text-gray-600">
                    <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
                  </div>
                  <p className="text-xs text-gray-500">PDF, DOCX up to 10MB</p>
                </div>
              </div>
              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Upload className="w-5 h-5 text-gray-400" />
                        <span className="text-sm font-medium">{file.name}</span>
                        <span className="text-xs text-gray-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                      </div>
                      <button type="button" onClick={() => removeFile(file)} className="text-red-500 hover:text-red-700">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {selectedFiles.length === 0 && watch('documents') && (
                <p className="text-red-500 text-sm">At least one document is required</p>
              )}
            </div>

            <div className="bg-gray-50 flex justify-end">
              <button
                type="submit"
                disabled={loading || !isValid || !checkPasswordsMatch() || selectedFiles.length === 0}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
              >
                <span>{loading ? 'Processing...' : 'Complete Onboarding'}</span>
                {loading && (
                  <div className="ml-2 w-5 h-5">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>


      </div>
    </div>
  );
}