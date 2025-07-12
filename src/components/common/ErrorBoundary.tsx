'use client';

import { Component, ReactNode } from 'react';
import { motion } from 'framer-motion';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage?: string;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <motion.div
          className="min-h-screen flex items-center justify-center bg-gray-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          role="alert"
          aria-live="assertive"
        >
          <div className="bg-white rounded-xl shadow-sm p-6 max-w-md text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Something Went Wrong</h1>
            <p className="text-gray-600 mb-4">
              {this.state.errorMessage || 'An unexpected error occurred. Please try refreshing the page or contact support.'}
            </p>
            <motion.button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-blue-400"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Refresh page"
            >
              Refresh
            </motion.button>
          </div>
        </motion.div>
      );
    }
    return this.props.children;
  }
}