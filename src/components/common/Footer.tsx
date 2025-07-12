// Footer.tsx
'use client';

import { motion } from 'framer-motion';

export default function Footer() {
  return (
    <motion.footer
      className="bg-white shadow-sm p-4 text-center text-sm text-gray-600 mt-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      role="contentinfo"
      aria-label="Application Footer"
    >
      <p>&copy; {new Date().getFullYear()} Waardian Society Management. All rights reserved. v1.0.0</p>
    </motion.footer>
  );
}