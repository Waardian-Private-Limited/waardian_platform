// Header.tsx
'use client';

import { motion } from 'framer-motion';
import { LogOut } from 'lucide-react';

interface HeaderProps {
  user: { role: string; email: string } | null;
  handleLogout: () => void;
}

export default function Header({ user, handleLogout }: HeaderProps) {
  return (
    <motion.header
      className="bg-white shadow-sm p-4 flex justify-between items-center sticky top-0 z-30"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      role="banner"
      aria-label="Application Header"
    >
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          {user?.role === 'superadmin' ? 'Superadmin Portal' : 'Society Admin Portal'}
        </h1>
      </div>
      <div className="flex items-center space-x-4">
        <span className="hidden md:inline text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
          {user?.email}
        </span>
        <motion.button
          onClick={handleLogout}
          className="flex items-center p-2 text-white bg-gradient-to-r from-red-500 to-red-600 rounded-lg transition-all shadow hover:shadow-md"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Logout"
        >
          <LogOut className="w-5 h-5 mr-1" />
          <span className="hidden sm:inline text-sm font-medium">Logout</span>
        </motion.button>
      </div>
    </motion.header>
  );
}