'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import LoginFormTabs from '@/components/auth/LoginForm';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    const checkSession = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/v1/auth/session', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        if (data.isAuthenticated) {
          router.push(data.role === 'admin' ? '/admin' : '/dashboard');
        }
      } catch (error) {
        console.error('Session check failed:', error);
      }
    };
    checkSession();
  }, [router]);

  return (
    <section className="relative min-h-screen bg-black flex flex-col items-center justify-center px-4 py-10 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-5xl bg-white rounded-2xl shadow-2xl grid grid-cols-1 md:grid-cols-2 overflow-hidden"
      >
        <div className="px-6 py-8 sm:p-12 flex flex-col justify-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
            Welcome to Waardian
          </h2>
          <p className="text-gray-600 mb-6 text-sm sm:text-base max-w-md">
            Simplify your society management — from visitors to staff, bookings to bills. Everything secured and digitized.
          </p>
          <Image
            src="/assets/connect_users.svg"
            alt="Illustration"
            width={320}
            height={320}
            className="w-full h-auto object-contain mt-4"
            priority
          />
        </div>

        <div className="px-6 py-8 sm:p-12 border-t md:border-t-0 md:border-l border-gray-100 flex flex-col">
          <div className="flex items-center justify-center gap-3 mb-8">
            <Image src="/assets/waardian_ai_logo.svg" alt="Logo" width={40} height={40} className="w-10 h-10" />
            <h1 className="text-xl font-bold text-gray-800">Waardian</h1>
          </div>
          <LoginFormTabs />
        </div>
      </motion.div>

      <footer className="relative z-10 mt-8 text-center text-xs text-gray-400 space-x-4">
        <a href="/about" className="hover:text-white">About Us</a>
        <a href="/terms" className="hover:text-white">Terms & Conditions</a>
        <span className="block mt-2 text-gray-500">
          © {new Date().getFullYear()} Waardian. All rights reserved.
        </span>
      </footer>
    </section>
  );
}