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
  Calendar,
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
  Paperclip
} from 'lucide-react';

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

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];

const getCategoryIcon = (category: string) => {
  const iconMap: Record<string, any> = {
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
      const response = await apiClient<{success: boolean, data: any}>('/expenses/analytics', {
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
          monthlyTrends: Object.entries(apiData.monthlyTrends || {}).map(([month, data]: [string, any]) => ({
            month,
            amount: data.totalAmount || 0,
            count: data.expenseCount || 0
          })),
          categoryWiseBreakdown: apiData.categoryWiseBreakdown || {},
          paymentMethodBreakdown: Object.entries(apiData.paymentMethodBreakdown || {}).map(([method, data]: [string, any]) => ({
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Expense Dashboard</h1>
        <button
          onClick={fetchAnalytics}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh Data
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Expenses</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalExpenses}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(analytics.totalAmount)}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Expense</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(analytics.averageExpense)}</p>
            </div>
            <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Growth</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.monthlyGrowth > 0 ? '+' : ''}{analytics.monthlyGrowth.toFixed(1)}%
              </p>
            </div>
            <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
              analytics.monthlyGrowth >= 0 ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {analytics.monthlyGrowth >= 0 ? (
                <TrendingUp className="h-6 w-6 text-green-600" />
              ) : (
                <TrendingDown className="h-6 w-6 text-red-600" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'categories', label: 'Categories', icon: PieChartIcon },
              { id: 'trends', label: 'Trends', icon: TrendingUp },
              { id: 'recent', label: 'Recent', icon: Activity }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Monthly Trends Chart */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Expense Trends</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={monthlyTrendData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                          <YAxis stroke="#6b7280" tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`} />
                          <Tooltip formatter={(value) => formatCurrency(value as number)} />
                          <Line 
                            type="monotone" 
                            dataKey="amount" 
                            stroke="#3b82f6" 
                            strokeWidth={3}
                            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
                            activeDot={{ r: 7, stroke: '#3b82f6', strokeWidth: 2 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Category Distribution */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Category Distribution</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                             data={categoryData}
                             cx="50%"
                             cy="50%"
                             labelLine={false}
                             label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                             outerRadius={80}
                             fill="#8884d8"
                             dataKey="value"
                           >
                            {categoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => formatCurrency(value as number)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Payment Methods Chart */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Method Breakdown</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={paymentMethodData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="method" stroke="#6b7280" fontSize={12} />
                        <YAxis stroke="#6b7280" tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`} />
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                        <Bar dataKey="amount" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Additional Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Monthly Expense Line Chart */}
                  <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                      Monthly Expense Trends
                    </h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={monthlyTrendData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                          <YAxis stroke="#6b7280" tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`} />
                          <Tooltip formatter={(value) => formatCurrency(value as number)} />
                          <Line 
                            type="monotone" 
                            dataKey="amount" 
                            stroke="#3b82f6" 
                            strokeWidth={3}
                            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
                            activeDot={{ r: 7, stroke: '#3b82f6', strokeWidth: 2 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Category Stacked Bar Chart */}
                  <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <BarChart3 className="h-5 w-5 mr-2 text-green-600" />
                      Category Analysis
                    </h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={categoryData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis 
                            dataKey="name" 
                            stroke="#6b7280" 
                            fontSize={12}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis stroke="#6b7280" tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`} />
                          <Tooltip formatter={(value) => formatCurrency(value as number)} />
                          <Legend />
                          <Bar dataKey="value" stackId="a" fill="#10b981" name="Amount" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'categories' && (
              <motion.div
                key="categories"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Top Categories */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Top Expense Categories</h3>
                  <div className="space-y-3">
                    {analytics.topCategories.map((category, index) => {
                      const Icon = getCategoryIcon(category.category);
                      return (
                        <div key={category.category} className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-lg flex items-center justify-center`} style={{ backgroundColor: COLORS[index % COLORS.length] + '20' }}>
                              <Icon className="h-5 w-5" style={{ color: COLORS[index % COLORS.length] }} />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{category.category}</p>
                              <p className="text-sm text-gray-500">{category.count} expenses</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">{formatCurrency(category.amount)}</p>
                            <p className="text-sm text-gray-500">{category.percentage.toFixed(1)}%</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(analytics.categoryWiseBreakdown).map(([category, data]) => {
                    const Icon = getCategoryIcon(category);
                    return (
                      <div key={category} className="bg-gray-50 p-6 rounded-lg">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Icon className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{category}</h3>
                            <p className="text-sm text-gray-500">{data.expenseCount} expenses</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Total Amount</span>
                            <span className="font-medium">{formatCurrency(data.totalAmount)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Average</span>
                            <span className="font-medium">{formatCurrency(data.averageAmount)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Percentage</span>
                            <span className="font-medium">{data.percentage.toFixed(1)}%</span>
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
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Dual-Axis Line Chart - Monthly Trends */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Expense Trends - Dual Axis</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={monthlyTrendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="month" 
                          stroke="#6b7280"
                          fontSize={12}
                        />
                        <YAxis 
                          yAxisId="amount"
                          orientation="left"
                          stroke="#3b82f6"
                          fontSize={12}
                          tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
                        />
                        <YAxis 
                          yAxisId="count"
                          orientation="right"
                          stroke="#10b981"
                          fontSize={12}
                        />
                        <Tooltip 
                          formatter={(value, name) => [
                            name === 'amount' ? formatCurrency(value as number) : value,
                            name === 'amount' ? 'Amount' : 'Count'
                          ]}
                        />
                        <Legend />
                        <Line 
                          yAxisId="amount"
                          type="monotone" 
                          dataKey="amount" 
                          stroke="#3b82f6" 
                          strokeWidth={3}
                          dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
                          activeDot={{ r: 7, stroke: '#3b82f6', strokeWidth: 2 }}
                          name="Amount"
                        />
                        <Line 
                          yAxisId="count"
                          type="monotone" 
                          dataKey="count" 
                          stroke="#10b981" 
                          strokeWidth={3}
                          dot={{ fill: '#10b981', strokeWidth: 2, r: 5 }}
                          activeDot={{ r: 7, stroke: '#10b981', strokeWidth: 2 }}
                          name="Count"
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Category Performance - Dual Axis */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Category Performance - Dual Axis</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={categoryData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="name" 
                          stroke="#6b7280" 
                          fontSize={12}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis 
                          yAxisId="amount"
                          orientation="left"
                          stroke="#3b82f6"
                          fontSize={12}
                          tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
                        />
                        <YAxis 
                          yAxisId="count"
                          orientation="right"
                          stroke="#10b981"
                          fontSize={12}
                        />
                        <Tooltip 
                          formatter={(value, name) => [
                            name === 'value' ? formatCurrency(value as number) : value,
                            name === 'value' ? 'Amount' : 'Count'
                          ]}
                        />
                        <Legend />
                        <Line 
                          yAxisId="amount"
                          type="monotone" 
                          dataKey="value" 
                          stroke="#3b82f6" 
                          strokeWidth={3}
                          dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
                          activeDot={{ r: 7, stroke: '#3b82f6', strokeWidth: 2 }}
                          name="Amount"
                        />
                        <Line 
                          yAxisId="count"
                          type="monotone" 
                          dataKey="count" 
                          stroke="#10b981" 
                          strokeWidth={3}
                          dot={{ fill: '#10b981', strokeWidth: 2, r: 5 }}
                          activeDot={{ r: 7, stroke: '#10b981', strokeWidth: 2 }}
                          name="Count"
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Monthly Expense Amount Trend */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Expense Amount Trend</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyTrendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                        <YAxis stroke="#6b7280" tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`} />
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                        <Line 
                          type="monotone" 
                          dataKey="amount" 
                          stroke="#8b5cf6" 
                          strokeWidth={3}
                          dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 5 }}
                          activeDot={{ r: 7, stroke: '#8b5cf6', strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Payment Method Distribution - Stacked Bar Chart */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Method Distribution</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={paymentMethodData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="method" stroke="#6b7280" fontSize={12} />
                        <YAxis stroke="#6b7280" tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`} />
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                        <Legend />
                        <Bar dataKey="amount" stackId="a" fill="#3b82f6" name="Amount" />
                        <Bar dataKey="count" stackId="b" fill="#10b981" name="Count" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'recent' && (
              <motion.div
                key="recent"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Expenses</h3>
                  <div className="space-y-4">
                    {analytics.recentExpenses.map((expense) => {
                      const Icon = getCategoryIcon(expense.category);
                      return (
                        <div key={expense.id} className="bg-white p-4 rounded-lg border">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Icon className="h-5 w-5 text-blue-600" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">{expense.description}</h4>
                                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <FileText className="h-4 w-4" />
                                    {expense.category}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <CreditCard className="h-4 w-4" />
                                    {expense.paymentMethod}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    {new Date(expense.date).toLocaleDateString()}
                                  </span>
                                  {expense.wing && expense.flatNumber && (
                                    <span className="flex items-center gap-1">
                                      <Home className="h-4 w-4" />
                                      {expense.wing}-{expense.flatNumber}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">{formatCurrency(expense.amount)}</p>
                            </div>
                          </div>
                          {expense.attachments && expense.attachments.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <p className="text-sm text-gray-600 mb-2 flex items-center gap-1">
                                <Paperclip className="h-4 w-4" />
                                Attachments ({expense.attachments.length})
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {expense.attachments.map((attachment, index) => (
                                  <a
                                    key={index}
                                    href={attachment.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                                  >
                                    {attachment.fileName}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
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