'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  Calendar,
  ArrowUpCircle,
  ArrowDownCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  FileText,
  CreditCard,
  Receipt
} from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'react-hot-toast';

interface PassbookManagementProps {
  societyId: string;
}

interface PassbookEntry {
  id: string;
  title: string;
  description: string;
  category: string;
  entry_type: 'credit' | 'debit';
  gross_amount: number;
  fees: number;
  taxes: number;
  net_amount: number;
  created_at: string;
  source: string;
  status: string;
  reference_id: string;
}

interface FilterOptions {
  search: string;
  startDate: string;
  endDate: string;
  type: 'all' | 'credit' | 'debit';
  category: string;
  status: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalEntries: number;
  entriesPerPage: number;
}

const PassbookManagement: React.FC<PassbookManagementProps> = ({ societyId }) => {
  const [entries, setEntries] = useState<PassbookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    startDate: '',
    endDate: '',
    type: 'all',
    category: '',
    status: ''
  });
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalEntries: 0,
    entriesPerPage: 20
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Export modal state
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportEmails, setExportEmails] = useState<string[]>(['']);
  const [exportDateFrom, setExportDateFrom] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [exportDateTo, setExportDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [exportType, setExportType] = useState('all');
  const [exportCategory, setExportCategory] = useState('');
  const [exportStatus, setExportStatus] = useState('');

  const fetchPassbookEntries = async (page: number = 1) => {
    try {
      setLoading(true);
      const params: Record<string, string> = {
        page: page.toString(),
        limit: pagination.entriesPerPage.toString()
      };

      if (filters.search) params.search = filters.search;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.type !== 'all') params.type = filters.type;
      if (filters.category) params.category = filters.category;
      if (filters.status) params.status = filters.status;

      const response = await apiClient('/ledger/passbook/entries', {
        method: 'GET',
        params,
        withAuth: true
      });

      if (response.success) {
        setEntries(response.data.entries);
        setPagination({
          currentPage: response.data.pagination.currentPage,
          totalPages: response.data.pagination.totalPages,
          totalEntries: response.data.pagination.totalEntries,
          entriesPerPage: response.data.pagination.entriesPerPage
        });
      }
    } catch (error) {
      console.error('Error fetching passbook entries:', error);
      toast.error('Failed to fetch passbook entries');
    } finally {
      setLoading(false);
    }
  };

  // Export modal helper functions
  const resetExportModal = () => {
    setExportEmails(['']);
    setExportDateFrom(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
    setExportDateTo(new Date().toISOString().split('T')[0]);
    setExportType('all');
    setExportCategory('');
    setExportStatus('');
  };

  const addExportEmail = () => {
    setExportEmails([...exportEmails, '']);
  };

  const removeExportEmail = (index: number) => {
    if (exportEmails.length > 1) {
      setExportEmails(exportEmails.filter((_, i) => i !== index));
    }
  };

  const updateExportEmail = (index: number, value: string) => {
    const newEmails = [...exportEmails];
    newEmails[index] = value;
    setExportEmails(newEmails);
  };

  const handleExport = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    const validEmails = exportEmails.filter(email => email.trim() !== '');
    if (validEmails.length === 0) {
      toast.error('Please enter at least one email address');
      return;
    }

    if (!exportDateFrom || !exportDateTo) {
      toast.error('Please select date range');
      return;
    }

    const fromDate = new Date(exportDateFrom);
    const toDate = new Date(exportDateTo);
    if (fromDate > toDate) {
      toast.error('From date cannot be later than to date');
      return;
    }

    try {
      setExportLoading(true);

      const response = await apiClient('/ledger/analytics/export', {
        method: 'POST',
        body: {
          emails: validEmails,
          dateFrom: exportDateFrom,
          dateTo: exportDateTo,
          type: exportType,
          category: exportCategory,
          status: exportStatus
        },
        withAuth: true
      });

      if (response.success) {
        toast.success(`Export report sent successfully to ${validEmails.length} recipient(s)`);
        setShowExportModal(false);
        resetExportModal();
      } else {
        throw new Error(response.message || 'Export failed');
      }
    } catch (error) {
      console.error('Error exporting ledger:', error);
      toast.error('Error exporting ledger');
    } finally {
      setExportLoading(false);
    }
  };

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      startDate: '',
      endDate: '',
      type: 'all',
      category: '',
      status: ''
    });
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchPassbookEntries(page);
    }
  };

  useEffect(() => {
    fetchPassbookEntries(1);
  }, [societyId, filters]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };

      return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
        }`}
      >
        {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown'}
      </span>
    );
  };

  const getCategoryIcon = (category: string, entryType: 'credit' | 'debit') => {
    if (entryType === 'credit') {
      return <CreditCard className="h-4 w-4 text-green-600" />;
    } else {
      return <Receipt className="h-4 w-4 text-red-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Passbook Management</h1>
          <p className="text-gray-600">Complete transaction history with credits and debits</p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="h-4 w-4" />
            Filters
          </button>
          <button
            onClick={() => fetchPassbookEntries(pagination.currentPage)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Search transactions..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="credit">Credits</option>
                <option value="debit">Debits</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <input
                type="text"
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                placeholder="Category..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Summary Stats */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">Total Entries</p>
            <p className="text-2xl font-bold text-gray-900">{pagination.totalEntries}</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">Current Page</p>
            <p className="text-2xl font-bold text-blue-600">{pagination.currentPage} of {pagination.totalPages}</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">Entries Per Page</p>
            <p className="text-2xl font-bold text-gray-900">{pagination.entriesPerPage}</p>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transaction
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gross Amount
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fees
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Taxes
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Net Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  </td>
                </tr>
              ) : entries.length > 0 ? (
                entries.map((entry) => (
                  <motion.tr
                    key={entry.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-start space-x-3">
                        <div className={`mt-1 h-8 w-8 rounded-lg flex items-center justify-center ${
                          entry.entry_type === 'credit' 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-red-100 text-red-600'
                        }`}>
                          {getCategoryIcon(entry.category, entry.entry_type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 truncate">{entry.title}</p>
                          <p className="text-sm text-gray-600 truncate">{entry.description}</p>
                          <p className="text-xs text-gray-500">Ref: {entry.reference_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {entry.entry_type === 'credit' ? (
                          <ArrowUpCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <ArrowDownCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span className={`text-sm font-medium ${
                          entry.entry_type === 'credit' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {entry.entry_type === 'credit' ? 'Credit' : 'Debit'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">{entry.category}</span>
                      <p className="text-xs text-gray-500">{entry.source}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(entry.gross_amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm text-gray-600">
                        {entry.fees > 0 ? formatCurrency(entry.fees) : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm text-gray-600">
                        {entry.taxes > 0 ? formatCurrency(entry.taxes) : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-sm font-semibold ${
                        entry.entry_type === 'credit' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {entry.entry_type === 'credit' ? '+' : '-'}{formatCurrency(entry.net_amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(entry.status)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">{formatDate(entry.created_at)}</span>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((pagination.currentPage - 1) * pagination.entriesPerPage) + 1} to{' '}
                {Math.min(pagination.currentPage * pagination.entriesPerPage, pagination.totalEntries)} of{' '}
                {pagination.totalEntries} entries
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                
                {/* Page numbers */}
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const pageNumber = Math.max(1, pagination.currentPage - 2) + i;
                  if (pageNumber <= pagination.totalPages) {
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => handlePageChange(pageNumber)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium ${
                          pageNumber === pagination.currentPage
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  }
                  return null;
                })}
                
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Ledger Report</h3>
            <form onSubmit={handleExport}>
              {/* Email Recipients */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Recipients
                </label>
                {exportEmails.map((email, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => updateExportEmail(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter email address"
                      required
                    />
                    {exportEmails.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeExportEmail(index)}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addExportEmail}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  + Add another email
                </button>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={exportDateFrom}
                    onChange={(e) => setExportDateFrom(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={exportDateTo}
                    onChange={(e) => setExportDateTo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Type Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Entry Type
                </label>
                <select
                  value={exportType}
                  onChange={(e) => setExportType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="credit">Credit</option>
                  <option value="debit">Debit</option>
                </select>
              </div>

              {/* Category Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={exportCategory}
                  onChange={(e) => setExportCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter category (optional)"
                />
              </div>

              {/* Status Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={exportStatus}
                  onChange={(e) => setExportStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowExportModal(false);
                    resetExportModal();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={exportLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {exportLoading ? 'Exporting...' : 'Export & Send'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PassbookManagement;