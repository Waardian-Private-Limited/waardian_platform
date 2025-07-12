'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Home } from 'lucide-react';
import { getSocietyMembers, addSocietyMember, updateSocietyMember, deleteSocietyMember } from '@/lib/societyAdminClient';

interface SocietyMember {
  id: number;
  name: string;
  email: string;
  flatNumber: string;
  role: 'admin' | 'resident';
  createdAt: string;
}

export default function SocietyAdminDashboard() {
  return (
    <main className="flex-1 bg-gray-50 min-h-[calc(100vh-8rem)] p-4" role="main" aria-label="Society Admin Dashboard">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Hello Society Admin!</h1>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Welcome to your dashboard</h2>
          <p className="text-gray-600">
            We're glad to have you here. This is a simplified welcome message.
          </p>
        </div>
      </div>
    </main>
  );
}