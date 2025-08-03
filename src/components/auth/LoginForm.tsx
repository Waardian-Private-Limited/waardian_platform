'use client';

import { useState } from 'react';
import { Mail, Lock, Smartphone, Key } from 'lucide-react';
import { login, verifyOtp } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/lib/store/userStore';

export default function LoginFormTabs() {
  const [tab, setTab] = useState<'password' | 'otp' | 'verify'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const setUser = useUserStore((state) => state.setUser);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      let response;

      if (tab === 'password') {
        if (!email || !password) throw new Error('Please enter both email and password');
        response = await login({ type: 'password', email, password });
      } else if (tab === 'otp') {
        if (!mobile) throw new Error('Please enter your mobile number');
        response = await login({ type: 'otp', mobile });
      } else {
        if (!otp) throw new Error('Please enter the OTP');
        response = await verifyOtp(mobile, otp);
      }

      if (response.success) {
        if (tab === 'otp') {
          setTab('verify');
          setError(response.message || 'OTP sent successfully to your mobile');
        } else {
          // Set user in store
          if (response.user) {
            const user = {
              ...response.user,
              role: response.role || '',
              name: response.user.name || '' // Ensure name is always a string
            };
            setUser(user);
          }

          // Redirect based on role
          const roleRoutes: { [key: string]: string } = {
            superadmin: '/superadmin',
            societyAdmin: '/societyAdmin',
            admin: '/admin',
            default: '/dashboard',
          };
          router.push(roleRoutes[response.role || 'default'] || roleRoutes.default);
        }
      } else {
        let parsedMessage: { message?: string; detail?: string } = {};
        try {
          parsedMessage = JSON.parse(response.message || '{}');
        } catch {
          parsedMessage.message = response.message;
        }

        const errorMessage: string = parsedMessage.message || 'An error occurred';
        const errorDetail: string = parsedMessage.detail || response.detail || '';
        setError(errorDetail ? `${errorMessage}: ${errorDetail}` : errorMessage);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setIsLoading(true);

    try {
      if (!mobile) throw new Error('Mobile number is required');

      const response = await login({ type: 'otp', mobile });

      if (response.success) {
        setError(response.message || 'OTP has been resent successfully');
      } else {
        const errorMessage = response.message || 'Failed to resend OTP';
        const errorDetail = response.detail ? `: ${response.detail}` : '';
        setError(`${errorMessage}${errorDetail}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto px-4">
      <div className="flex justify-center mb-6 bg-gray-100 rounded-xl p-1">
        <button
          onClick={() => setTab('password')}
          className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            tab === 'password'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          disabled={isLoading}
        >
          With Password
        </button>
        <button
          onClick={() => setTab('otp')}
          className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            tab === 'otp' || tab === 'verify'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          disabled={isLoading}
        >
          With OTP
        </button>
      </div>

      <div className="space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <form className="space-y-5" onSubmit={handleLogin}>
          {tab === 'password' && (
            <>
              <InputWithIcon
                label="Email"
                icon={<Mail className="w-5 h-5 text-gray-400" />}
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
              <InputWithIcon
                label="Password"
                icon={<Lock className="w-5 h-5 text-gray-400" />}
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </>
          )}

          {tab === 'otp' && (
            <InputWithIcon
              label="Mobile"
              icon={<Smartphone className="w-5 h-5 text-gray-400" />}
              type="tel"
              placeholder="+91 XXXXX-XXXXX"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              disabled={isLoading}
            />
          )}

          {tab === 'verify' && (
            <InputWithIcon
              label="OTP"
              icon={<Key className="w-5 h-5 text-gray-400" />}
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              disabled={isLoading}
            />
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:from-blue-400 disabled:to-blue-400 disabled:cursor-not-allowed text-sm shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
            disabled={isLoading}
          >
            {tab === 'password'
              ? isLoading
                ? 'Logging in...'
                : 'Login'
              : tab === 'otp'
              ? isLoading
                ? 'Sending...'
                : 'Send OTP'
              : isLoading
              ? 'Verifying...'
              : 'Verify OTP'}
          </button>

          {tab === 'verify' && (
            <button
              type="button"
              onClick={handleResendOtp}
              className="w-full text-blue-600 py-3 rounded-xl font-medium hover:text-blue-700 hover:bg-blue-50 transition-all duration-200 disabled:text-blue-400 text-sm"
              disabled={isLoading}
            >
              Resend OTP
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

type InputProps = {
  label: string;
  icon: React.ReactNode;
  type: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled: boolean;
};

function InputWithIcon({
  label,
  icon,
  type,
  placeholder,
  value,
  onChange,
  disabled,
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div
        className={`relative flex items-center px-3 py-1 bg-white rounded-lg border transition-all duration-200 ${
          isFocused
            ? 'border-blue-500 shadow-lg shadow-blue-500/10'
            : 'border-gray-200 hover:border-gray-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}`}
      >
        <span
          className={`mr-2.5 transition-colors duration-200 ${
            isFocused ? 'text-blue-500' : 'text-gray-400'
          }`}
        >
          {icon}
        </span>
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none border-none focus:ring-0 focus:outline-none"
        />
      </div>
    </div>
  );
}

