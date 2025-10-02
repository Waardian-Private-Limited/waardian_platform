'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Receipt, 
  AlertTriangle, 
  TrendingUp, 
  Calendar, 
  Building2, 
  Clock, 
  DollarSign, 
  BarChart3, 
  Filter,
  RefreshCw,
  PieChart,
  Activity,
  Eye,
  Users,
  CheckCircle,
  Target
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  ComposedChart, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  PieChart as RechartsPieChart, 
  Cell, 
  Pie, 
  AreaChart, 
  Area,
  Legend
} from 'recharts';
import { apiClient } from '@/lib/apiClient';
import { getAllFlats, FlatWithLocation } from '@/lib/societyAdminClient';
import { toast } from 'react-hot-toast';

interface InvoicesDashboardProps {
  societyId: string;
}

interface AnalyticsData {
  summary: {
    totalInvoices: number;
    totalAmount: number;
    paidAmount: number;
    dueAmount: number;
    overdueAmount: number;
    waivedAmount: number;
    collectionRate: number;
  };
  wingWiseCollection: Record<string, {
    totalAmount: number;
    paidAmount: number;
    dueAmount: number;
    overdueAmount: number;
    collectionRate: number;
    invoiceCount: number;
  }>;
  categoryWiseBreakdown: Record<string, {
    totalAmount: number;
    paidAmount: number;
    dueAmount: number;
    overdueAmount: number;
    invoiceCount: number;
  }>;
  monthlyTrends: Record<string, {
    totalAmount: number;
    paidAmount: number;
    dueAmount: number;
    overdueAmount: number;
    invoiceCount: number;
  }>;
  statusBreakdown: {
    paid: { count: number; amount: number };
    due: { count: number; amount: number };
    overdue: { count: number; amount: number };
    waived: { count: number; amount: number };
  };
  overdueAnalysis: {
    totalOverdue: number;
    averageDaysOverdue: number;
    overdueByRange: Record<string, { count: number; amount: number }>;
  };
  recentActivity: Array<{
    id: number;
    flatNumber: string;
    wingName: string;
    amount: number;
    status: string;
    category: string;
    billDate: string;
    dueDate: string;
  }>;
  amenityAnalytics?: {
    summary: {
      totalBookings: number;
      totalAmount: number;
      paidAmount: number;
      pendingAmount: number;
      failedAmount: number;
    };
    amenityWiseBreakdown: Record<string, {
      totalAmount: number;
      paidAmount: number;
      pendingAmount: number;
      failedAmount: number;
      bookingCount: number;
    }>;
    monthlyTrends: Record<string, {
      totalAmount: number;
      paidAmount: number;
      pendingAmount: number;
      failedAmount: number;
      bookingCount: number;
    }>;
    wingWiseBreakdown: Record<string, {
      totalAmount: number;
      paidAmount: number;
      pendingAmount: number;
      failedAmount: number;
      bookingCount: number;
    }>;
    statusBreakdown: {
      paid: { count: number; amount: number };
      pending: { count: number; amount: number };
      failed: { count: number; amount: number };
    };
    recentActivity: Array<{
      id: string;
      amenityName: string;
      amount: number;
      status: string;
      bookingDate: string;
      flatNumber: string;
      wingName: string;
    }>;
  };
}

interface Filters {
  wingId: string;
  floorId: string;
  flatId: string;
  fromDate: string;
  toDate: string;
  category: string;
}

const InvoicesDashboard: React.FC<InvoicesDashboardProps> = ({ societyId }) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [wings, setWings] = useState<any[]>([]);
  const [floors, setFloors] = useState<any[]>([]);
  const [flats, setFlats] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportEmails, setExportEmails] = useState<string[]>(['']);
  const [exportDateFrom, setExportDateFrom] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [exportDateTo, setExportDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [exportCategories, setExportCategories] = useState<string[]>([]);
  const [exportStatus, setExportStatus] = useState('all');
  const [exportWingId, setExportWingId] = useState('');
  const [exportFloorId, setExportFloorId] = useState('');
  const [exportFlatIds, setExportFlatIds] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [exportFloors, setExportFloors] = useState<any[]>([]);
  const [exportFlats, setExportFlats] = useState<any[]>([]);
  const [allFlats, setAllFlats] = useState<FlatWithLocation[]>([]);
  const [selectedFlats, setSelectedFlats] = useState<string[]>([]);
  const [flatSearchQuery, setFlatSearchQuery] = useState('');
  const [filters, setFilters] = useState<Filters>({
    wingId: '',
    floorId: '',
    flatId: '',
    fromDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    category: ''
  });

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  useEffect(() => {
    fetchAnalytics();
    fetchWings();
    fetchAvailableCategories();
    fetchAllFlats();
  }, [societyId]);

  useEffect(() => {
    if (exportWingId) {
      fetchExportFloors(exportWingId);
    } else {
      setExportFloors([]);
      setExportFlats([]);
    }
  }, [exportWingId]);

  useEffect(() => {
    if (exportFloorId) {
      fetchExportFlats(exportFloorId);
    } else {
      setExportFlats([]);
    }
  }, [exportFloorId]);

  useEffect(() => {
    if (filters.wingId) {
      fetchFloors(filters.wingId);
    } else {
      setFloors([]);
      setFlats([]);
    }
  }, [filters.wingId]);

  useEffect(() => {
    if (filters.floorId) {
      fetchFlats(filters.floorId);
    } else {
      setFlats([]);
    }
  }, [filters.floorId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      // Fetch regular billing analytics
      const billingResponse = await apiClient(`/billing/analytics?${queryParams.toString()}`, { 
        withAuth: true 
      });
      
      // Fetch amenity booking analytics
      const amenityResponse = await apiClient(`/amenities/booking-analytics?${queryParams.toString()}`, { 
        withAuth: true 
      });
      
      if (billingResponse.success) {
        let combinedAnalytics = billingResponse.analytics;
        
        // If amenity analytics are available, merge them
        if (amenityResponse.success && amenityResponse.analytics) {
          const amenityData = amenityResponse.analytics;
          
          // Add amenity category to categoryWiseBreakdown
          if (!combinedAnalytics.categoryWiseBreakdown) {
            combinedAnalytics.categoryWiseBreakdown = {};
          }
          
          combinedAnalytics.categoryWiseBreakdown.amenity = {
            totalAmount: amenityData.summary.totalAmount,
            paidAmount: amenityData.summary.paidAmount,
            dueAmount: amenityData.summary.pendingAmount,
            overdueAmount: amenityData.summary.failedAmount,
            invoiceCount: amenityData.summary.totalBookings
          };
          
          // Update summary totals
          combinedAnalytics.summary.totalInvoices += amenityData.summary.totalBookings;
          combinedAnalytics.summary.totalAmount += amenityData.summary.totalAmount;
          combinedAnalytics.summary.paidAmount += amenityData.summary.paidAmount;
          combinedAnalytics.summary.dueAmount += amenityData.summary.pendingAmount;
          combinedAnalytics.summary.overdueAmount += amenityData.summary.failedAmount;
          
          // Recalculate collection rate
          if (combinedAnalytics.summary.totalAmount > 0) {
            combinedAnalytics.summary.collectionRate = 
              ((combinedAnalytics.summary.paidAmount / combinedAnalytics.summary.totalAmount) * 100).toFixed(2);
          }
          
          // Add amenity-specific data for detailed view
          combinedAnalytics.amenityAnalytics = amenityData;
        }
        
        setAnalytics(combinedAnalytics);
      } else {
        throw new Error(billingResponse.error || 'Failed to fetch analytics');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchWings = async () => {
    try {
      const response = await apiClient('/billing/wings', { withAuth: true });
      setWings(response.data || []);
    } catch (error) {
      console.error('Error fetching wings:', error);
    }
  };

  const fetchFloors = async (wingId: string) => {
    try {
      const response = await apiClient(`/billing/floors?wingId=${wingId}`, {
        method: 'GET',
        withAuth: true
      });
      console.log('Floors response:', response);
      setFloors(response.data || []);
    } catch (error) {
      console.error('Error fetching floors:', error);
      setFloors([]);
    }
  };

  const fetchFlats = async (floorId: string) => {
    try {
      const response = await apiClient(`/billing/flats?wingId=${filters.wingId}&floorId=${floorId}`, { withAuth: true });
      setFlats(response.data || []);
    } catch (error) {
      console.error('Error fetching flats:', error);
      setFlats([]);
    }
  };

  const fetchAllFlats = async () => {
    try {
      const flats = await getAllFlats();
      setAllFlats(flats);
    } catch (error) {
      console.error('Error fetching all flats:', error);
      toast.error('Failed to fetch flats');
    }
  };

  const fetchAvailableCategories = async () => {
    try {
      const response = await apiClient('/billing/analytics', { withAuth: true });
      if (response.success && response.analytics?.categoryWiseBreakdown) {
        const categories = Object.keys(response.analytics.categoryWiseBreakdown);
        setAvailableCategories(categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchExportFloors = async (wingId: string) => {
    try {
      const response = await apiClient(`/billing/floors?wingId=${wingId}`, {
        method: 'GET',
        withAuth: true
      });
      setExportFloors(response.data || []);
    } catch (error) {
      console.error('Error fetching export floors:', error);
      setExportFloors([]);
    }
  };

  const fetchExportFlats = async (floorId: string) => {
    try {
      const response = await apiClient(`/billing/flats?wingId=${exportWingId}&floorId=${floorId}`, {
        method: 'GET',
        withAuth: true
      });
      setExportFlats(response.data || []);
    } catch (error) {
      console.error('Error fetching export flats:', error);
      setExportFlats([]);
    }
  };

  const resetExportModal = () => {
    setExportEmails(['']);
    setExportDateFrom(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
    setExportDateTo(new Date().toISOString().split('T')[0]);
    setExportCategories([]);
    setExportStatus('all');
    setSelectedFlats([]);
    setFlatSearchQuery('');
    setExportWingId('');
    setExportFloorId('');
    setExportFlatIds([]);
    setExportFloors([]);
    setExportFlats([]);
  };

  const addEmailField = () => {
    setExportEmails([...exportEmails, '']);
  };

  const removeEmailField = (index: number) => {
    if (exportEmails.length > 1) {
      setExportEmails(exportEmails.filter((_, i) => i !== index));
    }
  };

  const updateEmail = (index: number, value: string) => {
    const newEmails = [...exportEmails];
    newEmails[index] = value;
    setExportEmails(newEmails);
  };

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      
      // Reset dependent filters
      if (key === 'wingId') {
        newFilters.floorId = '';
        newFilters.flatId = '';
      } else if (key === 'floorId') {
        newFilters.flatId = '';
      }
      
      return newFilters;
    });
  };

  const applyFilters = () => {
    fetchAnalytics();
  };

  const resetFilters = () => {
    setFilters({
      wingId: '',
      floorId: '',
      flatId: '',
      fromDate: '',
      toDate: '',
      category: ''
    });
    setTimeout(() => fetchAnalytics(), 100);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const AnimatedCounter = ({ value, duration = 1500, delay = 0 }: { value: number; duration?: number; delay?: number }) => {
    const [count, setCount] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    
    useEffect(() => {
      const timer = setTimeout(() => {
        setIsVisible(true);
        const startTime = Date.now();
        const startValue = 0;
        const endValue = value;
        
        const updateCount = () => {
          const now = Date.now();
          const progress = Math.min((now - startTime) / duration, 1);
          const easeOutCubic = 1 - Math.pow(1 - progress, 3);
          const currentValue = Math.floor(startValue + (endValue - startValue) * easeOutCubic);
          
          setCount(currentValue);
          
          if (progress < 1) {
            requestAnimationFrame(updateCount);
          }
        };
        
        requestAnimationFrame(updateCount);
      }, delay);
      
      return () => clearTimeout(timer);
    }, [value, duration, delay]);
    
    return (
      <motion.span
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: isVisible ? 1 : 0, scale: isVisible ? 1 : 0.5 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {count.toLocaleString()}
      </motion.span>
    );
  };

  const handleExport = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    const validEmails = exportEmails.filter(email => email.trim() !== '');
    if (validEmails.length === 0) {
      toast.error('Please enter at least one email address');
      return;
    }
    
    if (!exportDateFrom || !exportDateTo) {
      toast.error('Please select both from and to dates');
      return;
    }
    
    // Validate date range (max 90 days)
    const fromDate = new Date(exportDateFrom);
    const toDate = new Date(exportDateTo);
    const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 90) {
      toast.error('Date range cannot exceed 90 days');
      return;
    }
    
    if (fromDate > toDate) {
      toast.error('From date cannot be later than to date');
      return;
    }
    
    try {
      setExportLoading(true);
      
      const response = await apiClient('/billing/analytics/export', {
        method: 'POST',
        body: {
          emails: validEmails,
          dateFrom: exportDateFrom,
          dateTo: exportDateTo,
          categories: exportCategories,
          status: exportStatus,
          wingId: '',
          floorId: '',
          flatIds: selectedFlats,
          includeExcel: true
        },
        withAuth: true
      });
      
      if (response.success) {
          const emailCount = validEmails.length;
          const message = emailCount === 1 
            ? 'Analytics report with Excel attachment has been sent to your email!' 
            : `Analytics report with Excel attachment has been sent to ${emailCount} email addresses!`;
          toast.success(message);
          setShowExportModal(false);
          resetExportModal();
      } else {
        toast.error('Failed to send analytics report');
      }
    } catch (error) {
      console.error('Error exporting analytics:', error);
      toast.error('Error exporting analytics');
    } finally {
      setExportLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, trend, color, delay = 0 }: {
    icon: any;
    title: string;
    value: number;
    trend?: { value: number; isPositive: boolean; period: string };
    color: string;
    delay?: number;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      whileHover={{ 
        scale: 1.03, 
        boxShadow: '0 15px 35px rgba(0,0,0,0.12)',
        transition: { duration: 0.2 }
      }}
      className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-transparent to-gray-50 rounded-bl-full group-hover:from-blue-50 group-hover:to-blue-100 transition-colors duration-300" />
      <div className="flex items-center justify-between">
        <div>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.2 }}
            className="text-gray-600 text-sm font-medium"
          >
            {title}
          </motion.p>
          <p className={`text-3xl font-bold ${color} mt-1`}>
            {formatCurrency(value || 0)}
          </p>
          {trend && (
            <motion.p 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + 0.5 }}
              className={`text-xs mt-1 flex items-center ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}
            >
              <TrendingUp className={`w-3 h-3 mr-1 ${
                trend.isPositive ? '' : 'rotate-180'
              }`} />
              {trend.isPositive ? '+' : ''}{trend.value}% {trend.period}
            </motion.p>
          )}
        </div>
        <motion.div 
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: delay + 0.4, duration: 0.5, ease: "easeOut" }}
          className={`p-3 rounded-full bg-gradient-to-br ${color === 'text-blue-600' ? 'from-blue-100 to-blue-200' : 
            color === 'text-green-600' ? 'from-green-100 to-green-200' :
            color === 'text-yellow-600' ? 'from-yellow-100 to-yellow-200' :
            color === 'text-purple-600' ? 'from-purple-100 to-purple-200' :
            color === 'text-indigo-600' ? 'from-indigo-100 to-indigo-200' :
            'from-red-100 to-red-200'} group-hover:scale-110 transition-transform duration-200`}
        >
          <Icon className={`w-6 h-6 ${color}`} />
        </motion.div>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">No analytics data available</p>
      </div>
    );
  }

  // Prepare chart data
  const statusPieData = [
    { name: 'Paid', value: analytics.statusBreakdown.paid.amount, count: analytics.statusBreakdown.paid.count },
    { name: 'Due', value: analytics.statusBreakdown.due.amount, count: analytics.statusBreakdown.due.count },
    { name: 'Overdue', value: analytics.statusBreakdown.overdue.amount, count: analytics.statusBreakdown.overdue.count },
    { name: 'Waived', value: analytics.statusBreakdown.waived.amount, count: analytics.statusBreakdown.waived.count }
  ];

  const wingBarData = Object.entries(analytics.wingWiseCollection).map(([wing, data]) => ({
    wing,
    total: data.totalAmount,
    paid: data.paidAmount,
    due: data.dueAmount,
    overdue: data.overdueAmount
  }));

  const categoryBarData = Object.entries(analytics.categoryWiseBreakdown).map(([category, data]) => ({
    category: category.charAt(0).toUpperCase() + category.slice(1),
    total: data.totalAmount,
    paid: data.paidAmount,
    due: data.dueAmount,
    overdue: data.overdueAmount
  }));

  const monthlyTrendData = Object.entries(analytics.monthlyTrends).map(([month, data]) => ({
    month,
    open: data.totalAmount * 0.95, // Simulated opening value
    high: Math.max(data.totalAmount, data.paidAmount + data.dueAmount),
    low: Math.min(data.paidAmount, data.dueAmount * 0.8),
    close: data.totalAmount,
    paid: data.paidAmount,
    due: data.dueAmount,
    overdue: data.overdueAmount,
    volume: data.invoiceCount
  }));

  // Prepare amenity analytics data if available
  const amenityTrendData = analytics.amenityAnalytics && analytics.amenityAnalytics.monthlyTrends ? 
    (Array.isArray(analytics.amenityAnalytics.monthlyTrends) ? 
      analytics.amenityAnalytics.monthlyTrends.map((data: any) => ({
        month: data.month,
        bookings: data.bookingCount,
        totalAmount: data.totalAmount,
        actualRevenue: data.actualRevenue || 0,
        paid: data.paidAmount,
        pending: data.pendingAmount,
        confirmed: data.confirmedBookings || 0,
        cancelled: data.cancelledBookings || 0
      })) : 
      Object.entries(analytics.amenityAnalytics.monthlyTrends).map(([month, data]: [string, any]) => ({
        month,
        bookings: data.bookingCount,
        totalAmount: data.totalAmount,
        actualRevenue: data.actualRevenue || 0,
        paid: data.paidAmount,
        pending: data.pendingAmount,
        confirmed: data.confirmedBookings || 0,
        cancelled: data.cancelledBookings || 0
      }))
    ) : [];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <BarChart3 className="w-8 h-8 mr-3 text-blue-600" />
              Billing Analytics Dashboard
            </h1>
            <p className="text-gray-600 mt-1">Comprehensive analytics for invoices, collections, and financial metrics</p>
          </div>
          <div className="flex space-x-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                resetExportModal();
                setShowExportModal(true);
              }}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <FileText className="w-4 h-4 mr-2" />
              Export Report
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={resetFilters}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Filter className="w-4 h-4 mr-2" />
              Reset Filters
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={fetchAnalytics}
              disabled={refreshing}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </motion.button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={DollarSign}
            title="Total Amount"
            value={analytics.summary.totalAmount}
            trend={{ value: 12, isPositive: true, period: 'from last month' }}
            color="text-blue-600"
            delay={0.1}
          />
          <StatCard
            icon={Receipt}
            title="Paid Amount"
            value={analytics.summary.paidAmount}
            trend={{ value: 8, isPositive: true, period: 'from last month' }}
            color="text-green-600"
            delay={0.2}
          />
          <StatCard
            icon={Clock}
            title="Due Amount"
            value={analytics.summary.dueAmount}
            color="text-orange-600"
            delay={0.3}
          />
          <StatCard
            icon={AlertTriangle}
            title="Overdue Amount"
            value={analytics.summary.overdueAmount}
            trend={{ value: 5, isPositive: false, period: 'from last month' }}
            color="text-red-600"
            delay={0.4}
          />
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'analytics', label: 'Analytics', icon: PieChart },
            { id: 'trends', label: 'Trends', icon: Activity },
            { id: 'recent', label: 'Recent Activity', icon: Eye }
          ].map((tab) => (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-2 rounded-md transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </motion.button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Collection Rate */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Collection Rate</h3>
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex-1 bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-green-500 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(parseFloat(analytics.summary.collectionRate.toString()), 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-lg font-semibold text-gray-900">
                    {analytics.summary.collectionRate}%
                  </span>
                </div>
              </div>

              {/* Filters */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filters
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Wing</label>
                    <select
                      value={filters.wingId}
                      onChange={(e) => handleFilterChange('wingId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Wings</option>
                      {wings.map((wing) => (
                        <option key={wing.wing_id} value={wing.wing_id}>
                          {wing.wing_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
                    <select
                      value={filters.floorId}
                      onChange={(e) => handleFilterChange('floorId', e.target.value)}
                      disabled={!filters.wingId}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    >
                      <option value="">All Floors</option>
                      {floors.map((floor) => (
                        <option key={floor.floor_id} value={floor.floor_id}>
                          Floor {floor.floor_number}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Flat</label>
                    <select
                      value={filters.flatId}
                      onChange={(e) => handleFilterChange('flatId', e.target.value)}
                      disabled={!filters.floorId}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    >
                      <option value="">All Flats</option>
                      {flats.map((flat) => (
                        <option key={flat.flat_id} value={flat.flat_id}>
                          {flat.flat_number}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={filters.category}
                      onChange={(e) => handleFilterChange('category', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Categories</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="utility">Utility</option>
                      <option value="amenity">Amenity</option>
                      <option value="penalty">Penalty</option>
                      <option value="event">Event</option>
                      <option value="donations">Donations</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                    <input
                      type="date"
                      value={filters.fromDate}
                      onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                    <input
                      type="date"
                      value={filters.toDate}
                      onChange={(e) => handleFilterChange('toDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div className="mt-4">
                  <button
                    onClick={applyFilters}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Status Breakdown Pie Chart */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <PieChart className="w-5 h-5 mr-2 text-blue-600" />
                    Status Breakdown
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={statusPieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>

                {/* Wing-wise Collection Bar Chart */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Building2 className="w-5 h-5 mr-2 text-green-600" />
                    Wing-wise Collection
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={wingBarData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="wing" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`} />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Bar dataKey="paid" stackId="a" fill="#10B981" />
                      <Bar dataKey="due" stackId="a" fill="#F59E0B" />
                      <Bar dataKey="overdue" stackId="a" fill="#EF4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Category-wise Breakdown */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-purple-600" />
                  Category-wise Breakdown
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryBarData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="category" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Bar dataKey="paid" fill="#10B981" />
                    <Bar dataKey="due" fill="#F59E0B" />
                    <Bar dataKey="overdue" fill="#EF4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Additional Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Enhanced Collection Analytics */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-indigo-600" />
                    Collection Performance Analytics
                  </h3>
                  <div className="space-y-4">
                    {/* Key Metrics Row */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-green-600 font-medium">Collection Rate</p>
                            <p className="text-2xl font-bold text-green-700">
                              {((monthlyTrendData.reduce((sum, month) => sum + month.paid, 0) / 
                                monthlyTrendData.reduce((sum, month) => sum + month.close, 0)) * 100).toFixed(1)}%
                            </p>
                          </div>
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-green-600" />
                          </div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-blue-600 font-medium">Avg Monthly</p>
                            <p className="text-2xl font-bold text-blue-700">
                              {formatCurrency(monthlyTrendData.reduce((sum, month) => sum + month.paid, 0) / monthlyTrendData.length)}
                            </p>
                          </div>
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <BarChart3 className="w-5 h-5 text-blue-600" />
                          </div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-lg border border-purple-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-purple-600 font-medium">Peak Month</p>
                            <p className="text-lg font-bold text-purple-700">
                              {monthlyTrendData.reduce((max, month) => month.paid > max.paid ? month : max, monthlyTrendData[0])?.month}
                            </p>
                          </div>
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <Activity className="w-5 h-5 text-purple-600" />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Area Chart */}
                    <ResponsiveContainer width="100%" height={280}>
                      <AreaChart data={monthlyTrendData}>
                        <defs>
                          <linearGradient id="paidGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                          </linearGradient>
                          <linearGradient id="dueGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                        <YAxis stroke="#6b7280" tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`} />
                        <Tooltip 
                          formatter={(value) => formatCurrency(Number(value))}
                          contentStyle={{ 
                            backgroundColor: '#ffffff', 
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Legend />
                        <Area 
                          type="monotone" 
                          dataKey="paid" 
                          stroke="#10B981" 
                          fillOpacity={1}
                          fill="url(#paidGradient)"
                          strokeWidth={2}
                          name="Collected Amount"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="due" 
                          stroke="#F59E0B" 
                          fillOpacity={1}
                          fill="url(#dueGradient)"
                          strokeWidth={2}
                          name="Pending Amount"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Wing-wise Stacked Bar Chart */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Building2 className="w-5 h-5 mr-2 text-emerald-600" />
                    Wing-wise Stacked Analysis
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={wingBarData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="wing" stroke="#6b7280" fontSize={12} />
                      <YAxis stroke="#6b7280" tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`} />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Legend />
                      <Bar dataKey="paid" stackId="a" fill="#10B981" name="Paid" />
                      <Bar dataKey="due" stackId="a" fill="#F59E0B" name="Due" />
                      <Bar dataKey="overdue" stackId="a" fill="#EF4444" name="Overdue" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'trends' && (
            <motion.div
              key="trends"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Enhanced Invoice Status Analytics */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                  Invoice Status & Performance Analytics
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Status Distribution Donut Chart */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-gray-700">Status Distribution</h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Paid', value: monthlyTrendData.reduce((sum, month) => sum + month.paid, 0), fill: '#10B981' },
                            { name: 'Due', value: monthlyTrendData.reduce((sum, month) => sum + month.due, 0), fill: '#F59E0B' },
                            { name: 'Overdue', value: monthlyTrendData.reduce((sum, month) => sum + month.overdue, 0), fill: '#EF4444' }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {[
                            { name: 'Paid', value: monthlyTrendData.reduce((sum, month) => sum + month.paid, 0), fill: '#10B981' },
                            { name: 'Due', value: monthlyTrendData.reduce((sum, month) => sum + month.due, 0), fill: '#F59E0B' },
                            { name: 'Overdue', value: monthlyTrendData.reduce((sum, month) => sum + month.overdue, 0), fill: '#EF4444' }
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Legend 
                          verticalAlign="bottom" 
                          height={36}
                          formatter={(value, entry) => (
                            <span style={{ color: entry.color, fontWeight: 500 }}>{value}</span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    
                    {/* Status Summary Cards */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                          <span className="text-sm font-medium text-green-700">Paid Invoices</span>
                        </div>
                        <span className="text-sm font-bold text-green-800">
                          {monthlyTrendData.reduce((sum, month) => sum + (month.paid + month.due + month.overdue), 0) > 0 ? 
                            Math.round((monthlyTrendData.filter(m => m.paid > 0).length / monthlyTrendData.length) * 100) : 0}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-amber-500 rounded-full mr-2"></div>
                          <span className="text-sm font-medium text-amber-700">Pending</span>
                        </div>
                        <span className="text-sm font-bold text-amber-800">
                          {monthlyTrendData.reduce((sum, month) => sum + (month.paid + month.due + month.overdue), 0) > 0 ? 
                            Math.round((monthlyTrendData.filter(m => m.due > 0).length / monthlyTrendData.length) * 100) : 0}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                          <span className="text-sm font-medium text-red-700">Overdue</span>
                        </div>
                        <span className="text-sm font-bold text-red-800">
                          {monthlyTrendData.reduce((sum, month) => sum + (month.paid + month.due + month.overdue), 0) > 0 ? 
                            Math.round((monthlyTrendData.filter(m => m.overdue > 0).length / monthlyTrendData.length) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Monthly Performance Stacked Bar */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-gray-700">Monthly Performance</h4>
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={monthlyTrendData.slice(-6)} layout="horizontal">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis type="number" stroke="#6b7280" tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`} />
                        <YAxis type="category" dataKey="month" stroke="#6b7280" fontSize={11} width={60} />
                        <Tooltip 
                          formatter={(value) => formatCurrency(Number(value))}
                          contentStyle={{ 
                            backgroundColor: '#ffffff', 
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Legend />
                        <Bar dataKey="paid" stackId="a" fill="#10B981" name="Paid" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="due" stackId="a" fill="#F59E0B" name="Due" />
                        <Bar dataKey="overdue" stackId="a" fill="#EF4444" name="Overdue" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              
              {/* Collection Progress Chart */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-green-600" />
                  Monthly Collection Progress
                </h3>
                <div className="space-y-6">
                  {monthlyTrendData.slice(-6).map((month, index) => {
                    const target = analytics.summary.totalAmount / 12; // Monthly target
                    const actual = month.paid;
                    const percentage = (actual / target) * 100;
                    const collectionRate = (month.paid / month.close) * 100;
                    
                    return (
                      <div key={month.month} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">{month.month}</span>
                          <div className="text-right">
                            <span className="text-sm text-gray-600">
                              {formatCurrency(actual)} / {formatCurrency(target)}
                            </span>
                            <div className="text-xs text-gray-500">
                              Collection Rate: {collectionRate.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                        <div className="relative">
                          {/* Background bar */}
                          <div className="w-full h-8 bg-gray-200 rounded-full overflow-hidden">
                            {/* Target line */}
                            <div className="absolute top-0 left-0 w-full h-full">
                              <div 
                                className="absolute top-0 w-1 h-full bg-gray-600 z-10"
                                style={{ left: '100%' }}
                              />
                            </div>
                            {/* Progress bar */}
                            <div 
                              className={`h-full transition-all duration-500 ${
                                collectionRate > 90 ? 'bg-green-500' : 
                                collectionRate > 70 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                            {/* Collection rate overlay */}
                            <div 
                              className="absolute top-0 left-0 h-full bg-blue-400 opacity-50"
                              style={{ width: `${Math.min(collectionRate, 100)}%` }}
                            />
                          </div>
                          {/* Labels */}
                          <div className="absolute top-0 left-2 h-full flex items-center">
                            <span className="text-xs font-medium text-white">
                              {percentage.toFixed(0)}%
                            </span>
                          </div>
                          <div className="absolute top-0 right-2 h-full flex items-center">
                            <span className="text-xs font-medium text-gray-700">
                              {collectionRate.toFixed(0)}% collected
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Amenity Analytics Section */}
              {analytics.amenityAnalytics && (
                <>
                  {/* Amenity Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-purple-100 text-sm font-medium">Total Bookings</p>
                          <p className="text-2xl font-bold">{analytics.amenityAnalytics.summary.totalBookings}</p>
                        </div>
                        <div className="w-12 h-12 bg-purple-400 rounded-lg flex items-center justify-center">
                          <Activity className="w-6 h-6" />
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl p-6 text-white"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-emerald-100 text-sm font-medium">Actual Revenue</p>
                          <p className="text-2xl font-bold">{formatCurrency((analytics.amenityAnalytics.summary as any).actualRevenue || analytics.amenityAnalytics.summary.totalAmount || 0)}</p>
                        </div>
                        <div className="w-12 h-12 bg-emerald-400 rounded-lg flex items-center justify-center">
                          <TrendingUp className="w-6 h-6" />
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-100 text-sm font-medium">Confirmed</p>
                          <p className="text-2xl font-bold">{(analytics.amenityAnalytics.summary as any).confirmedBookings || analytics.amenityAnalytics.summary.totalBookings || 0}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-400 rounded-lg flex items-center justify-center">
                          <CheckCircle className="w-6 h-6" />
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-orange-100 text-sm font-medium">Cancelled</p>
                          <p className="text-2xl font-bold">{(analytics.amenityAnalytics.summary as any).cancelledBookings || 0}</p>
                        </div>
                        <div className="w-12 h-12 bg-orange-400 rounded-lg flex items-center justify-center">
                          <Clock className="w-6 h-6" />
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Amenity Booking Trends Dual-Axis Line Chart */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Activity className="w-5 h-5 mr-2 text-purple-600" />
                      Amenity Booking Trends (Dual Axis)
                    </h3>
                    <div className="h-96">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={amenityTrendData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis 
                            dataKey="month" 
                            stroke="#6b7280"
                            fontSize={12}
                          />
                          <YAxis 
                            yAxisId="bookings"
                            orientation="left"
                            stroke="#8b5cf6"
                            fontSize={12}
                          />
                          <YAxis 
                            yAxisId="revenue"
                            orientation="right"
                            stroke="#10b981"
                            fontSize={12}
                            tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
                          />
                          <Tooltip 
                             formatter={(value, name) => [
                               String(name).includes('Revenue') ? formatCurrency(value as number) : value,
                               name
                             ]}
                             labelStyle={{ color: '#374151' }}
                             contentStyle={{ 
                               backgroundColor: '#ffffff', 
                               border: '1px solid #e5e7eb',
                               borderRadius: '8px',
                               boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                             }}
                           />
                          <Legend />
                          <Line 
                            yAxisId="bookings"
                            type="monotone" 
                            dataKey="confirmed" 
                            stroke="#10b981" 
                            strokeWidth={3}
                            dot={{ fill: '#10b981', strokeWidth: 2, r: 5 }}
                            activeDot={{ r: 7, stroke: '#10b981', strokeWidth: 2 }}
                            name="Confirmed Bookings"
                          />
                          <Line 
                            yAxisId="bookings"
                            type="monotone" 
                            dataKey="cancelled" 
                            stroke="#ef4444" 
                            strokeWidth={3}
                            dot={{ fill: '#ef4444', strokeWidth: 2, r: 5 }}
                            activeDot={{ r: 7, stroke: '#ef4444', strokeWidth: 2 }}
                            name="Cancelled Bookings"
                          />
                          <Line 
                            yAxisId="revenue"
                            type="monotone" 
                            dataKey="actualRevenue" 
                            stroke="#8b5cf6" 
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, stroke: '#8b5cf6', strokeWidth: 2 }}
                            name="Actual Revenue"
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  {/* Amenity Performance Bullets */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Target className="w-5 h-5 mr-2 text-indigo-600" />
                      Monthly Amenity Performance
                    </h3>
                    <div className="space-y-4">
                      {amenityTrendData.slice(0, 6).map((month, index) => {
                        const totalBookings = month.confirmed + month.cancelled;
                        const confirmationRate = (month.confirmed / totalBookings) * 100;
                        const revenueTarget = 50000; // Example target
                        const revenuePercentage = (month.actualRevenue / revenueTarget) * 100;
                        
                        return (
                          <div key={month.month} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-700">{month.month}</span>
                              <div className="text-right text-xs text-gray-600">
                                <div>Revenue: {formatCurrency(month.actualRevenue)}</div>
                                <div>Bookings: {totalBookings} ({confirmationRate.toFixed(1)}% confirmed)</div>
                              </div>
                            </div>
                            
                            {/* Revenue Progress */}
                            <div className="relative">
                              <div className="text-xs text-gray-500 mb-1">Revenue Target</div>
                              <div className="w-full h-6 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full transition-all duration-500 ${
                                    revenuePercentage > 80 ? 'bg-green-500' : 
                                    revenuePercentage > 60 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${Math.min(revenuePercentage, 100)}%` }}
                                />
                                <div className="absolute top-0 left-2 h-full flex items-center">
                                  <span className="text-xs font-medium text-white">
                                    {revenuePercentage.toFixed(0)}%
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Confirmation Rate */}
                            <div className="relative">
                              <div className="text-xs text-gray-500 mb-1">Confirmation Rate</div>
                              <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full transition-all duration-500 ${
                                    confirmationRate > 85 ? 'bg-blue-500' : 
                                    confirmationRate > 70 ? 'bg-indigo-500' : 'bg-purple-500'
                                  }`}
                                  style={{ width: `${confirmationRate}%` }}
                                />
                                <div className="absolute top-0 right-2 h-full flex items-center">
                                  <span className="text-xs font-medium text-gray-700">
                                    {confirmationRate.toFixed(1)}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {activeTab === 'recent' && (
            <motion.div
              key="recent"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Recent Activity */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Recent Activity
                </h3>
                {analytics.recentActivity && analytics.recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {analytics.recentActivity.map((invoice, index) => (
                      <motion.div
                        key={invoice.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <FileText className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {invoice.wingName}-{invoice.flatNumber}
                            </p>
                            <p className="text-sm text-gray-600 capitalize">
                              {invoice.category} • {new Date(invoice.billDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">
                            {formatCurrency(invoice.amount)}
                          </p>
                          <p className={`text-xs capitalize ${
                            invoice.status === 'paid' ? 'text-green-600' : 
                            invoice.status === 'due' ? 'text-orange-600' : 
                            invoice.status === 'overdue' ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {invoice.status}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No recent activity found</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Export Modal */}
        <AnimatePresence>
          {showExportModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
              onClick={() => {
                setShowExportModal(false);
                resetExportModal();
              }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Analytics Report</h3>
                <form onSubmit={handleExport} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Addresses
                    </label>
                    {exportEmails.map((email, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => updateEmail(index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter email address"
                        />
                        {exportEmails.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeEmailField(index)}
                            className="px-3 py-2 text-red-600 border border-red-300 rounded-md hover:bg-red-50"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addEmailField}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      + Add another email
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
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
                  
                  {/* Categories Filter */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Categories (Optional)
                      </label>
                      {availableCategories.length > 0 && (
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={() => setExportCategories([...availableCategories])}
                            className="text-xs text-blue-600 hover:text-blue-700"
                          >
                            Select All
                          </button>
                          <button
                            type="button"
                            onClick={() => setExportCategories([])}
                            className="text-xs text-gray-600 hover:text-gray-700"
                          >
                            Clear All
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                      {availableCategories.map((category) => (
                        <label key={category} className="flex items-center space-x-2 mb-1">
                          <input
                            type="checkbox"
                            checked={exportCategories.includes(category)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setExportCategories([...exportCategories, category]);
                              } else {
                                setExportCategories(exportCategories.filter(c => c !== category));
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{category}</span>
                        </label>
                      ))}
                    </div>
                    {availableCategories.length === 0 && (
                      <p className="text-sm text-gray-500 mt-1">No categories available</p>
                    )}
                    {exportCategories.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">{exportCategories.length} categor{exportCategories.length === 1 ? 'y' : 'ies'} selected</p>
                    )}
                  </div>
                  
                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status (Optional)
                    </label>
                    <select
                      value={exportStatus}
                      onChange={(e) => setExportStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Status</option>
                      <option value="unpaid">Unpaid</option>
                      <option value="partial">Partial</option>
                      <option value="paid">Paid</option>
                      <option value="reversed">Reversed</option>
                    </select>
                  </div>
                  
                  {/* Flat Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Flats (Optional)
                    </label>
                    <div className="mb-3">
                      <input
                        type="text"
                        placeholder="Search flats by wing, floor, or flat number..."
                        value={flatSearchQuery}
                        onChange={(e) => setFlatSearchQuery(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md p-3 space-y-2">
                      {allFlats
                        .filter((flat) => {
                          if (!flatSearchQuery) return true;
                          const searchLower = flatSearchQuery.toLowerCase();
                          return (
                            flat.wing_name.toLowerCase().includes(searchLower) ||
                            flat.floor_number.toString().includes(searchLower) ||
                            flat.flat_number.toLowerCase().includes(searchLower)
                          );
                        })
                        .map((flat) => (
                        <label key={flat.flat_id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={selectedFlats.includes(flat.flat_id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedFlats([...selectedFlats, flat.flat_id]);
                              } else {
                                setSelectedFlats(selectedFlats.filter(id => id !== flat.flat_id));
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">
                            {flat.wing_name} - Floor {flat.floor_number} - {flat.flat_number}
                          </span>
                        </label>
                      ))}
                    </div>
                    {allFlats.length === 0 && (
                      <p className="text-sm text-gray-500 mt-1">No flats available</p>
                    )}
                    {allFlats.filter((flat) => {
                      if (!flatSearchQuery) return true;
                      const searchLower = flatSearchQuery.toLowerCase();
                      return (
                        flat.wing_name.toLowerCase().includes(searchLower) ||
                        flat.floor_number.toString().includes(searchLower) ||
                        flat.flat_number.toLowerCase().includes(searchLower)
                      );
                    }).length === 0 && flatSearchQuery && (
                      <p className="text-sm text-gray-500 mt-1">No flats match your search</p>
                    )}
                    {selectedFlats.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">{selectedFlats.length} flat(s) selected</p>
                    )}
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowExportModal(false);
                        resetExportModal();
                      }}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={exportLoading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
                    >
                      {exportLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <FileText className="w-4 h-4 mr-2" />
                          Send Report
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default InvoicesDashboard;