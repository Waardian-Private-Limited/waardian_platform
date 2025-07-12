'use client';

import { useState } from 'react';
import { Mail, Lock, Smartphone, Key } from 'lucide-react';
import { login, verifyOtp } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export default function LoginFormTabs() {
  const [tab, setTab] = useState<'password' | 'otp' | 'verify'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (tab === 'password') {
        const response = await login({ type: 'password', email, password });
        console.log('Login response:', response);
        if (response.success) {
          const targetRoute =
            response.role === 'superadmin'
              ? '/superadmin'
              : response.role === 'societyAdmin'
              ? '/societyAdmin'
              : response.role === 'admin'
              ? '/admin'
              : '/dashboard';
          console.log(`Redirecting to: ${targetRoute}`);
          router.push(targetRoute);
          await new Promise((resolve) => setTimeout(resolve, 100));
        } else {
          setError(response.message || 'Invalid credentials');
        }
      } else if (tab === 'otp') {
        const response = await login({ type: 'otp', mobile });
        console.log('OTP request response:', response);
        if (response.success) {
          setTab('verify');
        } else {
          setError(response.message || 'Failed to send OTP');
        }
      } else if (tab === 'verify') {
        const response = await verifyOtp(mobile, otp);
        console.log('OTP verify response:', response);
        if (response.success) {
          const targetRoute =
            response.role === 'superadmin'
              ? '/superadmin'
              : response.role === 'societyAdmin'
              ? '/societyAdmin'
              : response.role === 'admin'
              ? '/admin'
              : '/dashboard';
          console.log(`Redirecting to: ${targetRoute}`);
          router.push(targetRoute);
          await new Promise((resolve) => setTimeout(resolve, 100));
        } else {
          setError(response.message || 'Invalid OTP');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setIsLoading(true);
    try {
      const response = await login({ type: 'otp', mobile });
      console.log('Resend OTP response:', response);
      if (response.success) {
        setError('OTP resent successfully');
      } else {
        setError(response.message || 'Failed to resend OTP');
      }
    } catch (err) {
      console.error('Resend OTP error:', err);
      setError('Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-center mb-6 space-x-4">
        <button
          onClick={() => setTab('password')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${
            tab === 'password' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-800'
          }`}
          disabled={isLoading}
        >
          With Password
        </button>
        <button
          onClick={() => setTab('otp')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${
            tab === 'otp' || tab === 'verify' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-800'
          }`}
          disabled={isLoading}
        >
          With OTP
        </button>
      </div>

      <div className="space-y-4">
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {tab === 'password' ? (
          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="text-sm text-gray-700 mb-1 block">Email</label>
              <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 bg-white">
                <Mail className="w-4 h-4 mr-2 text-gray-500" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent outline-none text-gray-800 placeholder-gray-400"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-700 mb-1 block">Password</label>
              <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 bg-white">
                <Lock className="w-4 h-4 mr-2 text-gray-500" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent outline-none text-gray-800 placeholder-gray-400"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:bg-blue-400"
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        ) : tab === 'otp' ? (
          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="text-sm text-gray-700 mb-1 block">Mobile</label>
              <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 bg-white">
                <Smartphone className="w-4 h-4 mr-2 text-gray-500" />
                <input
                  type="tel"
                  placeholder="+91 XXXXX-XXXXX"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full bg-transparent outline-none text-gray-800 placeholder-gray-400"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:bg-blue-400"
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="text-sm text-gray-700 mb-1 block">OTP</label>
              <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 bg-white">
                <Key className="w-4 h-4 mr-2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full bg-transparent outline-none text-gray-800 placeholder-gray-400"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:bg-blue-400"
              disabled={isLoading}
            >
              {isLoading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <button
              type="button"
              onClick={handleResendOtp}
              className="w-full text-blue-600 py-2 rounded-lg font-medium hover:text-blue-700 transition disabled:text-blue-400"
              disabled={isLoading}
            >
              Resend OTP
            </button>
          </form>
        )}
      </div>
    </div>
  );
}