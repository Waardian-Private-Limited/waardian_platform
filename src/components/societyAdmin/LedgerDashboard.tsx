'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  CreditCard,
  Calendar,
  Download,
  RefreshCw,
  Eye,
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet
} from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'react-hot-toast';

interface PassbookDashboardProps {
  societyId: string;
}

interface PassbookStats {
  totalCredits: number;
  totalDebits: number;
  netBalance: number;
  pendingAmount: number;
  totalFees: number;
  totalTaxes: number;
  totalGross: number;
  breakdown: {
    collections: number;
    billing: number;
    expenses: number;
  };
}

interface RecentTransaction {
  id: string;
  title: string;
  category: string;
  entry_type: 'credit' | 'debit';
  net_amount: number;
  created_at: string;
  source: string;
}

interface MonthlyTrend {
  month: string;
  credits: number;
  debits: number;
  net: number;
}

const PassbookDashboard: React.FC<PassbookDashboardProps> = ({ societyId }) => {
  const [stats, setStats] = useState<PassbookStats | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  const fetchPassbookStats = async () => {
    try {
      const params: Record<string, string> = {};
      if (dateRange.startDate) params.startDate = dateRange.startDate;
      if (dateRange.endDate) params.endDate = dateRange.endDate;

      const response = await apiClient('/ledger/passbook/stats', {
        method: 'GET',
        params,
        withAuth: true
      });
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching passbook stats:', error);
      toast.error('Failed to fetch passbook statistics');
    }
  };

  const fetchRecentTransactions = async () => {
    try {
      const response = await apiClient('/ledger/passbook/recent-transactions', {
        method: 'GET',
        params: { limit: '8' },
        withAuth: true
      });
      if (response.success) {
        setRecentTransactions(response.data);
      }
    } catch (error) {
      console.error('Error fetching recent transactions:', error);
      toast.error('Failed to fetch recent transactions');
    }
  };

  const fetchMonthlyTrend = async () => {
    try {
      const response = await apiClient('/ledger/passbook/monthly-trend', {
        method: 'GET',
        params: { months: '6' },
        withAuth: true
      });
      if (response.success) {
        setMonthlyTrend(response.data);
      }
    } catch (error) {
      console.error('Error fetching monthly trend:', error);
      toast.error('Failed to fetch monthly trend');
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchPassbookStats(),
      fetchRecentTransactions(),
      fetchMonthlyTrend()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAllData();
  }, [societyId, dateRange]);

  const handleDateRangeChange = (field: 'startDate' | 'endDate', value: string) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  const clearDateRange = () => {
    setDateRange({ startDate: '', endDate: '' });
  };

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
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Passbook Dashboard</h1>
          <p className="text-gray-600">Complete view of all credits and debits</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-2">
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="Start Date"
            />
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="End Date"
            />
            {(dateRange.startDate || dateRange.endDate) && (
              <button
                onClick={clearDateRange}
                className="px-3 py-2 text-gray-500 hover:text-gray-700"
                title="Clear filters"
              >
                ×
              </button>
            )}
          </div>
          <button
            onClick={fetchAllData}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Credits</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(stats?.totalCredits || 0)}
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <ArrowUpCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Debits</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(stats?.totalDebits || 0)}
              </p>
            </div>
            <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
              <ArrowDownCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Net Balance</p>
              <p className={`text-2xl font-bold ${(stats?.netBalance || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(stats?.netBalance || 0)}
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Wallet className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Amount</p>
              <p className="text-2xl font-bold text-orange-600">
                {formatCurrency(stats?.pendingAmount || 0)}
              </p>
            </div>
            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Receipt className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                 formatter={(value) => [formatCurrency(typeof value === 'number' ? value : 0), '']}
                 labelFormatter={(label) => `Month: ${label}`}
               />
              <Line 
                type="monotone" 
                dataKey="credits" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Credits"
              />
              <Line 
                type="monotone" 
                dataKey="debits" 
                stroke="#ef4444" 
                strokeWidth={2}
                name="Debits"
              />
              <Line 
                type="monotone" 
                dataKey="net" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Net"
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Breakdown Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Income Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Collections', value: stats?.breakdown.collections || 0, color: '#10b981' },
                  { name: 'Billing', value: stats?.breakdown.billing || 0, color: '#3b82f6' },
                ]}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, value }) => `${name}: ${formatCurrency(value || 0)}`}
              >
                {[
                  { name: 'Collections', value: stats?.breakdown.collections || 0, color: '#10b981' },
                  { name: 'Billing', value: stats?.breakdown.billing || 0, color: '#3b82f6' },
                ].map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(Number(value) || 0)} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Recent Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200"
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View All
            </button>
          </div>
        </div>
        
        <div className="divide-y divide-gray-200">
          {recentTransactions.length > 0 ? (
            recentTransactions.map((transaction) => (
              <div key={transaction.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                      transaction.entry_type === 'credit' 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {transaction.entry_type === 'credit' ? (
                        <ArrowUpCircle className="h-5 w-5" />
                      ) : (
                        <ArrowDownCircle className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{transaction.title}</p>
                      <p className="text-sm text-gray-600">{transaction.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      transaction.entry_type === 'credit' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.entry_type === 'credit' ? '+' : '-'}{formatCurrency(transaction.net_amount)}
                    </p>
                    <p className="text-sm text-gray-600">{formatDate(transaction.created_at)}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-gray-500">
              No recent transactions found
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default PassbookDashboard;