"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ComposedChart
} from 'recharts';
import { apiClient } from '../../lib/apiClient';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  FileText,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  CreditCard,
  Home,
  Car,
  Utensils,
  ShoppingBag,
  Zap,
  Wifi,
  Phone,
  Gamepad2,
  Heart,
  GraduationCap,
  Plane,
  Gift,
  Coffee,
  Fuel,
  Wrench,
  Check,
  ArrowLeft,
  ArrowRight,
  Upload,
  Plus,
  Trash2,
  X
} from 'lucide-react';
import clsx from 'clsx';

interface ExpenseAnalytics {
  totalExpenses: number;
  totalAmount: number;
  averageExpense: number;
  monthlyGrowth: number;
  topCategories: Array<{
    category: string;
    amount: number;
    count: number;
    percentage: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    amount: number;
    count: number;
  }>;
  categoryWiseBreakdown: Record<string, {
    totalAmount: number;
    expenseCount: number;
    averageAmount: number;
    percentage: number;
  }>;
  paymentMethodBreakdown: Array<{
    method: string;
    amount: number;
    count: number;
    percentage: number;
  }>;
  recentExpenses: Array<{
    id: string;
    description: string;
    amount: number;
    category: string;
    paymentMethod: string;
    date: string;
    wing?: string;
    flatNumber?: string;
    attachments?: Array<{
      fileName: string;
      fileUrl: string;
    }>;
  }>;
}

const COLORS = ['#004ac6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];

const getCategoryIcon = (category: string): React.ElementType => {
  const iconMap: Record<string, React.ElementType> = {
    'Maintenance': Wrench,
    'Utilities': Zap,
    'Security': Users,
    'Cleaning': Home,
    'Transportation': Car,
    'Food': Utensils,
    'Shopping': ShoppingBag,
    'Internet': Wifi,
    'Phone': Phone,
    'Entertainment': Gamepad2,
    'Healthcare': Heart,
    'Education': GraduationCap,
    'Travel': Plane,
    'Gifts': Gift,
    'Coffee': Coffee,
    'Fuel': Fuel,
    'Other': FileText
  };
  return iconMap[category] || FileText;
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

interface ExpenseDashboardProps {
  societyId?: string;
}

const ExpenseDashboard: React.FC<ExpenseDashboardProps> = ({ societyId }) => {
  const [analytics, setAnalytics] = useState<ExpenseAnalytics>({
    totalExpenses: 0,
    totalAmount: 0,
    averageExpense: 0,
    monthlyGrowth: 0,
    topCategories: [],
    monthlyTrends: [],
    categoryWiseBreakdown: {},
    paymentMethodBreakdown: [],
    recentExpenses: []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAnalytics();
  }, []);
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await apiClient<{ success: boolean, data: any }>('/expenses/analytics', {
        withAuth: true
      });

      if (response.success && response.data) {
        const apiData = response.data;

        // Transform the API response to match our interface
        const transformedData: ExpenseAnalytics = {
          totalExpenses: apiData.summary?.totalExpenses || 0,
          totalAmount: apiData.summary?.totalAmount || 0,
          averageExpense: apiData.summary?.averageMonthlyExpense || 0,
          monthlyGrowth: apiData.summary?.thisMonthAmount && apiData.summary?.lastMonthAmount
            ? ((apiData.summary.thisMonthAmount - apiData.summary.lastMonthAmount) / apiData.summary.lastMonthAmount) * 100
            : 0,
          topCategories: apiData.topCategories || [],
          monthlyTrends: Object.entries(apiData.monthlyTrends || {}).map(([month, data]: any) => ({
            month,
            amount: data.totalAmount || 0,
            count: data.expenseCount || 0
          })),
          categoryWiseBreakdown: apiData.categoryWiseBreakdown || {},
          paymentMethodBreakdown: Object.entries(apiData.paymentMethodBreakdown || {}).map(([method, data]: any) => ({
            method,
            amount: data.totalAmount || 0,
            count: data.expenseCount || 0,
            percentage: data.percentage || 0
          })),
          recentExpenses: (apiData.recentExpenses || []).map((expense: any, index: number) => ({
            id: expense.id || `expense-${index}`,
            description: expense.description || `${expense.category} Expense`,
            amount: expense.amount || 0,
            category: expense.category || 'Other',
            paymentMethod: expense.paymentMethod || 'N/A',
            date: expense.date || new Date().toISOString(),
            wing: expense.wingName,
            flatNumber: expense.flatNumber,
            attachments: expense.attachments || []
          }))
        };

        setAnalytics(transformedData);
      }
    } catch (error) {
      console.error('Error fetching expense analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const monthlyTrendData = analytics.monthlyTrends.map(trend => ({
    month: trend.month,
    amount: trend.amount,
    count: trend.count
  }));

  const categoryData = analytics.topCategories.map(category => ({
    name: category.category,
    value: category.amount,
    count: category.count
  }));

  const paymentMethodData = analytics.paymentMethodBreakdown.map(method => ({
    method: method.method,
    amount: method.amount,
    count: method.count
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <nav className="flex gap-2 text-[12px] font-bold text-[#565e74] mb-2 uppercase tracking-wide">
            <span>Management</span>
            <span>/</span>
            <span className="text-[#004ac6]">Expenses</span>
          </nav>
          <h2 className="text-[32px] font-bold leading-tight tracking-tight text-[#0b1c30]">Expense Analytics</h2>
        </div>
        <button
          onClick={fetchAnalytics}
          className="bg-white border border-slate-200 text-[#565e74] px-5 py-2 rounded-lg flex items-center gap-2 transition-all font-bold text-[14px] hover:bg-slate-50 shadow-sm"
        >
          <Activity className="w-4 h-4" /> Refresh Data
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Expenses', value: analytics.totalExpenses, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-500' },
          { label: 'Total Amount', value: formatCurrency(analytics.totalAmount), icon: DollarSign, color: 'text-green-600', bg: 'bg-green-500' },
          { label: 'Average Expense', value: formatCurrency(analytics.averageExpense), icon: BarChart3, color: 'text-orange-600', bg: 'bg-orange-500' },
          { label: 'Monthly Growth', value: `${analytics.monthlyGrowth > 0 ? '+' : ''}${analytics.monthlyGrowth.toFixed(1)}%`, icon: analytics.monthlyGrowth >= 0 ? TrendingUp : TrendingDown, color: analytics.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600', bg: analytics.monthlyGrowth >= 0 ? 'bg-green-500' : 'bg-red-500' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg", stat.bg)}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div className={clsx("text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider", stat.bg.replace('bg-', 'bg-').replace('500', '50'))}>
                <span className={stat.color}>{stat.label === 'Monthly Growth' ? 'Growth' : 'Live'}</span>
              </div>
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{stat.label}</p>
              <h3 className="text-2xl font-bold text-[#0b1c30] tracking-tight">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="bg-slate-50/50 p-1 flex gap-1 border-b border-slate-100">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'categories', label: 'Categories', icon: PieChartIcon },
            { id: 'trends', label: 'Trends', icon: TrendingUp },
            { id: 'recent', label: 'Recent', icon: Activity }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "flex items-center gap-2 px-6 py-2 text-[13px] font-bold rounded-lg transition-all",
                activeTab === tab.id ? "bg-white text-[#004ac6] shadow-sm border border-slate-100" : "text-slate-500 hover:bg-white/50"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Main Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                    <h3 className="text-[14px] font-bold text-[#0b1c30] mb-6 flex items-center gap-2 uppercase tracking-wider">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      Monthly Expense Trends
                    </h3>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={monthlyTrendData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                          <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} fontWeight={700} axisLine={false} tickLine={false} dy={10} />
                          <YAxis stroke="#94a3b8" fontSize={11} fontWeight={700} axisLine={false} tickLine={false} tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            labelStyle={{ fontWeight: 800, color: '#0b1c30', marginBottom: '4px' }}
                            formatter={(value) => [formatCurrency(value as number), 'Amount']}
                          />
                          <Line
                            type="monotone"
                            dataKey="amount"
                            stroke="#004ac6"
                            strokeWidth={4}
                            dot={{ fill: '#004ac6', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, stroke: '#fff', strokeWidth: 3 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                    <h3 className="text-[14px] font-bold text-[#0b1c30] mb-6 flex items-center gap-2 uppercase tracking-wider">
                      <PieChartIcon className="w-4 h-4 text-green-600" />
                      Category Distribution
                    </h3>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            cornerRadius={4}
                            dataKey="value"
                          >
                            {categoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                            formatter={(value) => formatCurrency(value as number)}
                          />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                  <h3 className="text-[14px] font-bold text-[#0b1c30] mb-6 flex items-center gap-2 uppercase tracking-wider">
                    <CreditCard className="w-4 h-4 text-orange-600" />
                    Payment Method Breakdown
                  </h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={paymentMethodData} barGap={8}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis dataKey="method" stroke="#94a3b8" fontSize={11} fontWeight={700} axisLine={false} tickLine={false} dy={10} />
                        <YAxis stroke="#94a3b8" fontSize={11} fontWeight={700} axisLine={false} tickLine={false} tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                          formatter={(value) => formatCurrency(value as number)}
                        />
                        <Bar dataKey="amount" fill="#004ac6" radius={[6, 6, 0, 0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'categories' && (
              <motion.div
                key="categories"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(analytics.categoryWiseBreakdown).map(([category, data], index) => {
                    const Icon = getCategoryIcon(category);
                    return (
                      <div key={category} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center gap-4 mb-6">
                          <div className={clsx("w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg", `bg-[${COLORS[index % COLORS.length]}]`)} style={{ backgroundColor: COLORS[index % COLORS.length] }}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="font-bold text-[#0b1c30] text-[15px]">{category}</h3>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{data.expenseCount} Transactions</p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center py-2 border-b border-slate-50">
                            <span className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">Total</span>
                            <span className="text-[14px] font-bold text-[#0b1c30]">{formatCurrency(data.totalAmount)}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-slate-50">
                            <span className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">Average</span>
                            <span className="text-[14px] font-bold text-[#0b1c30]">{formatCurrency(data.averageAmount)}</span>
                          </div>
                          <div className="flex justify-between items-center pt-2">
                            <span className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">Share</span>
                            <span className="text-[14px] font-bold text-blue-600">{data.percentage.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {activeTab === 'trends' && (
              <motion.div
                key="trends"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="bg-slate-50/50 p-8 rounded-2xl border border-slate-100">
                  <h3 className="text-[14px] font-bold text-[#0b1c30] mb-8 flex items-center gap-2 uppercase tracking-wider">
                    <Activity className="w-4 h-4 text-purple-600" />
                    Growth Analysis
                  </h3>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={monthlyTrendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} fontWeight={700} axisLine={false} tickLine={false} dy={10} />
                        <YAxis yAxisId="left" stroke="#94a3b8" fontSize={11} fontWeight={700} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}K`} />
                        <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={11} fontWeight={700} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                        <Bar yAxisId="left" dataKey="amount" fill="#004ac6" radius={[4, 4, 0, 0]} barSize={30} />
                        <Line yAxisId="right" type="monotone" dataKey="count" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'recent' && (
              <motion.div
                key="recent"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                  <table className="min-w-full divide-y divide-slate-50">
                    <thead className="bg-slate-50/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-[11px] font-bold text-[#565e74] uppercase tracking-wider">Description</th>
                        <th className="px-6 py-4 text-left text-[11px] font-bold text-[#565e74] uppercase tracking-wider">Category</th>
                        <th className="px-6 py-4 text-left text-[11px] font-bold text-[#565e74] uppercase tracking-wider">Date</th>
                        <th className="px-6 py-4 text-right text-[11px] font-bold text-[#565e74] uppercase tracking-wider">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {analytics.recentExpenses.map((expense) => (
                        <tr key={expense.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-bold text-[#0b1c30] text-[13px]">{expense.description}</p>
                            <p className="text-[11px] text-slate-400 font-medium">{expense.paymentMethod}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase">
                              {expense.category}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-[12px] font-bold text-slate-600">{new Date(expense.date).toLocaleDateString()}</p>
                          </td>
                          <td className="px-6 py-4 text-right text-[14px] font-bold text-[#0b1c30]">
                            {formatCurrency(expense.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ExpenseDashboard;