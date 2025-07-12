'use client';

import { useRouter } from 'next/navigation';
import { logout } from '@/lib/superadmincontroller';

export default function SuperadminDashboard() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      console.log('Initiating logout');
      await logout();
      console.log('Logout successful, redirecting to /login');
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      router.push('/login');
    }
  };

  return (
    <main className="flex-1 bg-gray-50 min-h-[calc(100vh-8rem)] p-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Hello Superadmin</h1>
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Welcome, Superadmin!</h2>
        <p className="text-gray-600">
          Manage societies, view reports, and configure settings from this dashboard.
        </p>
      </div>
    </main>
  );
}