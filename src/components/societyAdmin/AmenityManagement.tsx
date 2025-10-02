import React, { useState, useEffect, useRef } from 'react';
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
  ComposedChart,
  AreaChart,
  Area
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
  Paperclip,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  Filter,
  Download,
  RefreshCw,
  CalendarDays,
  Search,
  Eye,
  EyeOff,
  X,
  Receipt,
  Banknote
} from 'lucide-react';

interface AmenityBooking {
  id: string | number;
  booking_doc_id?: string;
  bookingDocId?: string;
  amenity_id?: string;
  amenityId?: string;
  amenity_name?: string;
  amenityName?: string;
  user_id?: string;
  userId?: string;
  user_name?: string;
  userName?: string;
  first_name?: string;
  firstName?: string;
  last_name?: string;
  lastName?: string;
  flat_id?: string;
  flatId?: string;
  flat_number?: string;
  flatNumber?: string;
  wing_name?: string;
  wingName?: string;
  slot_date?: string;
  slotDate?: string;
  slot_time?: string;
  slotTime?: string;
  booking_type?: string;
  bookingType?: string;
  amount: number | string;
  fees?: number | string;
  taxes?: number | string;
  actual_amount?: number | string;
  actualAmount?: number | string;
  payment_status?: string;
  paymentStatus?: string;
  booking_status?: string;
  bookingStatus?: string;
  transaction_id?: string;
  transactionId?: string;
  payment_id?: string;
  paymentId?: string;
  order_id?: string;
  orderId?: string;
  payment_date?: string;
  paymentDate?: string;
  currency?: string;
  method?: string;
  gateway_provider?: string;
  gatewayProvider?: string;
  refund_amount?: number | string;
  refundAmount?: number | string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
  cancellation_reason?: string;
  cancellationReason?: string;
  rejection_reason?: string;
  rejectionReason?: string;
}

interface Amenity {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'inactive';
  description?: string;
  location?: string;
  bookingConfig?: {
    isBookingRequired: boolean;
    isShared: boolean;
    slotType: string;
    slotDuration: number;
    maxUsersPerSlot: number;
  };
  charges?: {
    isPaid: boolean;
    chargeType: string;
    chargeAmount: number;
  };
}

interface AmenityAnalytics {
  totalBookings: number;
  totalRevenue: number;
  averageBookingValue: number;
  totalFees: number;
  totalTaxes: number;
  averageFees: number;
  averageTaxes: number;
  totalActualAmount: number;
  monthlyGrowth: number;
  topAmenities: Array<{
    name?: string;
    amenityName?: string;
    bookings?: number;
    bookingCount?: number;
    revenue: number | string;
    percentage: number | string;
    amenityId?: string;
    status?: string;
  }>;
  monthlyTrends: Array<{
    month: string;
    bookings: number;
    revenue: number;
  }>;
  bookingStatusBreakdown: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  paymentMethodBreakdown: Array<{
    method: string;
    count: number;
    revenue: number;
    percentage: number;
  }>;
  recentBookings: AmenityBooking[];
  peakHours: Array<{
    hour: string;
    bookings: number;
  }>;
  weeklyTrends: Array<{
    day: string;
    bookings: number;
  }>;
  feesAndTaxesTrends: Array<{
    month: string;
    totalFees: number;
    totalTaxes: number;
    actualAmount: number;
  }>;
  amenityWiseStats?: Array<{
    amenityId: string;
    amenityName: string;
    status: string;
    totalBookings: number;
    totalRevenue: number;
    averageBookingValue: number;
    confirmedBookings: number;
    cancelledBookings: number;
    pendingBookings: number;
    lastBookingDate?: string;
  }>;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];

const getAmenityIcon = (amenityName: string) => {
  const iconMap: Record<string, any> = {
    'Swimming Pool': Activity,
    'Gym': Heart,
    'Clubhouse': Home,
    'Tennis Court': Activity,
    'Basketball Court': Activity,
    'Badminton Court': Activity,
    'Party Hall': Users,
    'Conference Room': Users,
    'Garden': MapPin,
    'Playground': Gamepad2,
    'Parking': Car,
    'Library': GraduationCap,
    'Spa': Heart,
    'Restaurant': Utensils,
    'Cafe': Coffee,
    'Other': FileText
  };
  return iconMap[amenityName] || FileText;
};

const getStatusIcon = (status: string) => {
  if (!status) return Clock;
  switch (status.toLowerCase()) {
    case 'confirmed':
    case 'completed':
      return CheckCircle;
    case 'cancelled':
    case 'rejected':
      return XCircle;
    case 'pending':
      return AlertCircle;
    default:
      return Clock;
  }
};

const getStatusColor = (status: string) => {
  if (!status) return 'text-gray-600';
  switch (status.toLowerCase()) {
    case 'confirmed':
    case 'completed':
      return 'text-green-600';
    case 'cancelled':
    case 'rejected':
      return 'text-red-600';
    case 'pending':
      return 'text-yellow-600';
    default:
      return 'text-gray-600';
  }
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

interface AmenityManagementProps {
  societyId?: string;
}

const AmenityManagement: React.FC<AmenityManagementProps> = ({ societyId }) => {
  const [analytics, setAnalytics] = useState<AmenityAnalytics>({
    totalBookings: 0,
    totalRevenue: 0,
    averageBookingValue: 0,
    totalFees: 0,
    totalTaxes: 0,
    averageFees: 0,
    averageTaxes: 0,
    totalActualAmount: 0,
    monthlyGrowth: 0,
    topAmenities: [],
    monthlyTrends: [],
    bookingStatusBreakdown: [],
    paymentMethodBreakdown: [],
    recentBookings: [],
    peakHours: [],
    weeklyTrends: [],
    feesAndTaxesTrends: [],
    amenityWiseStats: []
  });
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('30d');
  const [selectedAmenity, setSelectedAmenity] = useState('all');
  const [showInactive, setShowInactive] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportEmail, setExportEmail] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportDateFrom, setExportDateFrom] = useState('');
  const [exportDateTo, setExportDateTo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [mounted, setMounted] = useState(false);
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    setMounted(true);
    fetchAnalytics();
    fetchAmenities();
    
    // Set default date range (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
    setExportDateTo(today.toISOString().split('T')[0]);
    setExportDateFrom(thirtyDaysAgo.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchAnalytics();
    }
  }, [dateRange, selectedAmenity, mounted]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = { dateRange };
      if (selectedAmenity !== 'all') {
        params.amenityId = selectedAmenity;
      }
      
      const response = await apiClient('/amenities/booking-analytics', {
        method: 'GET',
        params,
        withAuth: true
      });
      
      if (response.success) {
        setAnalytics(response.data);
      }
    } catch (error) {
      console.error('Error fetching amenity analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAmenities = async () => {
    try {
      const response = await apiClient('/amenities', {
        method: 'GET',
        withAuth: true
      });
      
      if (response.success) {
        setAmenities(response.data);
      }
    } catch (error) {
      console.error('Error fetching amenities:', error);
    }
  };

  const handleExport = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!exportEmail) {
      console.warn('Please enter your email address');
      return;
    }
    
    if (!exportDateFrom || !exportDateTo) {
      console.warn('Please select both from and to dates');
      return;
    }
    
    // Validate date range (max 90 days)
    const fromDate = new Date(exportDateFrom);
    const toDate = new Date(exportDateTo);
    const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 90) {
      console.warn('Date range cannot exceed 90 days');
      return;
    }
    
    if (fromDate > toDate) {
      console.warn('From date cannot be later than to date');
      return;
    }
    
    try {
      setExportLoading(true);
      
      const response = await apiClient('/amenities/analytics/export', {
        method: 'POST',
        body: {
          email: exportEmail,
          dateFrom: exportDateFrom,
          dateTo: exportDateTo,
          includeExcel: true
        },
        withAuth: true
      });
      
      if (response.success) {
        console.log('Amenity analytics report with Excel attachment has been sent to your email!');
        setShowExportModal(false);
        setExportEmail('');
        setExportDateFrom('');
        setExportDateTo('');
      }
    } catch (error) {
      console.error('Error exporting analytics:', error);
    } finally {
      setExportLoading(false);
    }
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    trend,
    trendValue,
    color = 'blue'
  }: {
    title: string;
    value: string | number;
    icon: any;
    trend?: 'up' | 'down';
    trendValue?: string;
    color?: string;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
          {trend && trendValue && (
            <div className={`flex items-center mt-2 text-sm ${
              trend === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend === 'up' ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
              {trendValue}
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-${color}-50`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
      </div>
    </motion.div>
  );

  // Filter amenities based on search and status
  const filteredAmenities = amenities.filter(amenity => {
    const matchesSearch = amenity.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = showInactive ? true : amenity.status === 'active';
    return matchesSearch && matchesStatus;
  });

        {activeTab === 'amenities' && (
          <motion.div
            key="amenities"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Controls */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search amenities..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    onClick={() => setShowInactive(!showInactive)}
                    className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                      showInactive
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {showInactive ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                    {showInactive ? 'Hide Inactive' : 'Show Inactive'}
                  </button>
                </div>
                <button
                  onClick={() => setShowExportModal(true)}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Data
                </button>
              </div>
            </div>

            {/* Amenities Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAmenities.map((amenity) => {
                const Icon = getAmenityIcon(amenity.type);
                const statusColor = amenity.status === 'active' ? 'text-green-600' : 'text-red-600';
                const bgColor = amenity.status === 'active' ? 'bg-green-50' : 'bg-red-50';
                
                return (
                  <motion.div
                    key={amenity.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <Icon className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{amenity.name}</h3>
                          <p className="text-sm text-gray-500">{amenity.type}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${bgColor} ${statusColor}`}>
                        {amenity.status}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">{amenity.description}</p>
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPin className="w-4 h-4 mr-1" />
                        {amenity.location}
                      </div>
                      {amenity.charges && (
                        <div className="flex items-center text-sm text-gray-900 font-medium">
                          <DollarSign className="w-4 h-4 mr-1" />
                          {formatCurrency(amenity.charges.chargeAmount)} / {amenity.charges.chargeType}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {filteredAmenities.length === 0 && (
              <div className="text-center py-12">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No amenities found</h3>
                <p className="text-gray-500">
                  {searchTerm ? 'Try adjusting your search terms' : 'No amenities match the current filters'}
                </p>
              </div>
            )}
          </motion.div>
        )}

  const TabButton = ({ id, label, icon: Icon, isActive, onClick }: { 
    id: string; 
    label: string; 
    icon: any;
    isActive?: boolean;
    onClick?: () => void;
  }) => {
    const isTabActive = isActive !== undefined ? isActive : activeTab === id;
    
    return (
      <button
        onClick={onClick || (() => setActiveTab(id))}
        className={`relative flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
          isTabActive
            ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25 transform scale-105'
            : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50 hover:shadow-md hover:scale-102'
        }`}
      >
        <Icon className={`w-4 h-4 mr-2 transition-transform duration-200 ${
          isTabActive ? 'text-white' : 'text-gray-500'
        }`} />
        <span className="relative z-10">{label}</span>
        {isTabActive && (
          <motion.div
            layoutId="activeTab"
            className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg"
            style={{ zIndex: -1 }}
            initial={false}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        )}
      </button>
    );
  };

  // Get top performing amenities with status information
  const topPerformingAmenities = analytics.topAmenities.map(topAmenity => {
    const amenityDetails = amenities.find(a => a.id === topAmenity.amenityId || a.name === (topAmenity.name || topAmenity.amenityName));
    return {
      ...topAmenity,
      name: topAmenity.name || topAmenity.amenityName || 'Unknown',
      revenue: parseFloat(topAmenity.revenue?.toString() || '0'),
      percentage: parseFloat(topAmenity.percentage?.toString() || '0'),
      bookingCount: topAmenity.bookings || topAmenity.bookingCount || 0,
      status: amenityDetails?.status || 'active'
    };
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Amenity Management</h1>
          <p className="text-gray-600 mt-1">Track bookings, revenue, and amenity performance</p>
        </div>
        <div className="flex items-center space-x-4 mt-4 sm:mt-0">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <StatCard
          title="Total Bookings"
          value={analytics.totalBookings.toLocaleString()}
          icon={Calendar}
          trend={analytics.monthlyGrowth > 0 ? 'up' : 'down'}
          trendValue={`${Math.abs(analytics.monthlyGrowth)}%`}
          color="blue"
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(analytics.totalRevenue)}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Total Fees"
          value={formatCurrency(analytics.totalFees)}
          icon={CreditCard}
          color="yellow"
        />
        <StatCard
          title="Total Taxes"
          value={formatCurrency(analytics.totalTaxes)}
          icon={Receipt}
          color="red"
        />
        <StatCard
          title="Actual Amount"
          value={formatCurrency(analytics.totalActualAmount)}
          icon={Banknote}
          color="purple"
        />
        <StatCard
          title="Active Amenities"
          value={analytics.topAmenities.length}
          icon={MapPin}
          color="orange"
        />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
        <div className="flex space-x-1 relative">
          <TabButton
            id="overview"
            label="Overview"
            icon={BarChart3}
            isActive={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
          />
          <TabButton
            id="amenities"
            label="Amenities"
            icon={MapPin}
            isActive={activeTab === 'amenities'}
            onClick={() => setActiveTab('amenities')}
          />
          <TabButton
            id="bookings"
            label="Recent Bookings"
            icon={Clock}
            isActive={activeTab === 'bookings'}
            onClick={() => setActiveTab('bookings')}
          />
          <TabButton
            id="analytics"
            label="Analytics"
            icon={PieChartIcon}
            isActive={activeTab === 'analytics'}
            onClick={() => setActiveTab('analytics')}
          />
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Revenue Trends */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue & Booking Trends</h3>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={analytics.monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="revenue" fill="#3b82f6" name="Revenue (₹)" />
                  <Line yAxisId="right" type="monotone" dataKey="bookings" stroke="#10b981" strokeWidth={2} name="Bookings" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Fees and Taxes Breakdown */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Fees & Taxes Breakdown</h3>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={analytics.feesAndTaxesTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Bar dataKey="totalFees" fill="#f59e0b" name="Total Fees (₹)" />
                  <Bar dataKey="totalTaxes" fill="#ef4444" name="Total Taxes (₹)" />
                  <Bar dataKey="actualAmount" fill="#8b5cf6" name="Actual Amount (₹)" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Amenities */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Top Performing Amenities</h3>
                </div>
                {topPerformingAmenities.filter(amenity => showInactive || amenity.status === 'active').length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={topPerformingAmenities.filter(amenity => showInactive || amenity.status === 'active')}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage, status }) => {
                          const statusIndicator = status === 'inactive' ? ' (Inactive)' : '';
                          return `${name}${statusIndicator} (${percentage.toFixed(1)}%)`;
                        }}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="revenue"
                      >
                        {topPerformingAmenities
                          .filter(amenity => showInactive || amenity.status === 'active')
                          .map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.status === 'inactive' ? '#ef4444' : COLORS[index % COLORS.length]} 
                            />
                          ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <PieChartIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No amenity data available</p>
                      <p className="text-sm text-gray-400 mt-1">Try adjusting the date range or filters</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Booking Status */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Status Distribution</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={analytics.bookingStatusBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'amenities' && (
          <motion.div
            key="amenities"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Amenity Performance</h3>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={showInactive}
                      onChange={(e) => setShowInactive(e.target.checked)}
                      className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Show Inactive</span>
                  </label>
                  <button
                    onClick={() => setShowExportModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {topPerformingAmenities
                  .filter(amenity => showInactive || amenity.status === 'active')
                  .map((amenity, index) => {
                    const Icon = getAmenityIcon(amenity.amenityName || amenity.name || 'general');
                    const isInactive = amenity.status === 'inactive';
                    return (
                      <div key={index} className={`border rounded-lg p-4 ${
                        isInactive ? 'border-red-200 bg-red-50' : 'border-gray-200'
                      }`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <Icon className={`w-5 h-5 mr-2 ${
                              isInactive ? 'text-red-600' : 'text-blue-600'
                            }`} />
                            <h4 className={`font-medium ${
                              isInactive ? 'text-red-900' : 'text-gray-900'
                            }`}>{amenity.amenityName || amenity.name}</h4>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500">#{index + 1}</span>
                            {isInactive && (
                              <span className="px-2 py-1 text-xs font-medium text-red-800 bg-red-100 rounded-full">
                                Inactive
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Bookings:</span>
                            <span className="text-sm font-medium">{amenity.bookingCount || amenity.bookings || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Revenue:</span>
                            <span className="text-sm font-medium">{formatCurrency(typeof amenity.revenue === 'string' ? parseFloat(amenity.revenue) : amenity.revenue || 0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Share:</span>
                            <span className="text-sm font-medium">{typeof amenity.percentage === 'string' ? parseFloat(amenity.percentage) : amenity.percentage || 0}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
              {topPerformingAmenities.filter(amenity => showInactive || amenity.status === 'active').length === 0 && (
                <div className="text-center py-8">
                  <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No amenities found</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'bookings' && (
          <motion.div
            key="bookings"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Bookings</h3>
                <button
                  onClick={() => setShowExportModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amenity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User & Flat</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fees</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Taxes</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actual Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(() => {
                      const startIndex = (currentPage - 1) * itemsPerPage;
                      const endIndex = startIndex + itemsPerPage;
                      const paginatedBookings = analytics.recentBookings?.slice(startIndex, endIndex) || [];
                      
                      return paginatedBookings.map((booking) => {
                      const bookingStatus = booking.booking_status || booking.bookingStatus || 'pending';
                      const paymentStatus = booking.payment_status || booking.paymentStatus || 'pending';
                      const amenityName = booking.amenity_name || booking.amenityName || 'N/A';
                      const userName = booking.user_name || booking.userName || 
                        `${booking.first_name || booking.firstName || ''} ${booking.last_name || booking.lastName || ''}`.trim() || 'N/A';
                      const flatNumber = booking.flat_number || booking.flatNumber || 'N/A';
                      const wingName = booking.wing_name || booking.wingName || '';
                      const flatDisplay = wingName ? `${wingName}-${flatNumber}` : flatNumber;
                      const slotDate = booking.slot_date || booking.slotDate || '';
                      const slotTime = booking.slot_time || booking.slotTime || 'N/A';
                      const amount = typeof booking.amount === 'string' ? parseFloat(booking.amount) : (booking.amount || 0);
                      const fees = typeof booking.fees === 'string' ? parseFloat(booking.fees) : (booking.fees || 0);
                      const taxes = typeof booking.taxes === 'string' ? parseFloat(booking.taxes) : (booking.taxes || 0);
                      const rawActualAmount = booking.actual_amount || booking.actualAmount;
                      const actualAmount = rawActualAmount ? 
                        (typeof rawActualAmount === 'string' ? parseFloat(rawActualAmount) : rawActualAmount) : 
                        (amount - fees - taxes);
                      const StatusIcon = getStatusIcon(bookingStatus);
                      const bookingId = String(booking.id);
                      
                      return (
                        <React.Fragment key={booking.id}>
                          <tr>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="text-sm font-medium text-gray-900">{amenityName}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{userName}</div>
                              <div className="text-sm text-gray-500">Flat: {flatDisplay}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{slotDate ? formatDate(slotDate) : 'N/A'}</div>
                              <div className="text-sm text-gray-500">{slotTime}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{formatCurrency(amount)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{formatCurrency(fees)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{formatCurrency(taxes)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-green-600">{formatCurrency(actualAmount)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className={`flex items-center text-sm ${getStatusColor(bookingStatus)}`}>
                                <StatusIcon className="w-4 h-4 mr-1" />
                                {bookingStatus}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className={`text-sm ${getStatusColor(paymentStatus)}`}>
                                {paymentStatus}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() => setExpandedBooking(expandedBooking === bookingId ? null : bookingId)}
                                className="text-blue-600 hover:text-blue-800 transition-colors"
                              >
                                {expandedBooking === bookingId ? (
                                  <EyeOff className="w-4 h-4" />
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                              </button>
                            </td>
                          </tr>
                          {expandedBooking === bookingId && (
                            <tr>
                              <td colSpan={7} className="px-6 py-4 bg-gray-50">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <span className="font-medium text-gray-700">Booking ID:</span>
                                    <span className="ml-2 text-gray-900">{booking.booking_doc_id || booking.bookingDocId || 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-700">Booking Type:</span>
                                    <span className="ml-2 text-gray-900">{booking.booking_type || booking.bookingType || 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-700">Currency:</span>
                                    <span className="ml-2 text-gray-900">{booking.currency || 'INR'}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-700">Method:</span>
                                    <span className="ml-2 text-gray-900">{booking.method || 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-700">Gateway:</span>
                                    <span className="ml-2 text-gray-900">{booking.gateway_provider || booking.gatewayProvider || 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-700">Transaction ID:</span>
                                    <span className="ml-2 text-gray-900">{booking.transaction_id || booking.transactionId || 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-700">Payment ID:</span>
                                    <span className="ml-2 text-gray-900">{booking.payment_id || booking.paymentId || 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-700">Order ID:</span>
                                    <span className="ml-2 text-gray-900">{booking.order_id || booking.orderId || 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-700">Fees:</span>
                                    <span className="ml-2 text-gray-900">{formatCurrency(typeof booking.fees === 'string' ? parseFloat(booking.fees) : (booking.fees || 0))}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-700">Taxes:</span>
                                    <span className="ml-2 text-gray-900">{formatCurrency(typeof booking.taxes === 'string' ? parseFloat(booking.taxes) : (booking.taxes || 0))}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-700">Refund Amount:</span>
                                    <span className="ml-2 text-gray-900">{formatCurrency(typeof booking.refund_amount === 'string' ? parseFloat(booking.refund_amount) : typeof booking.refundAmount === 'string' ? parseFloat(booking.refundAmount) : (booking.refund_amount || booking.refundAmount || 0))}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-700">Created At:</span>
                                    <span className="ml-2 text-gray-900">{(booking.created_at || booking.createdAt) ? formatDate(booking.created_at || booking.createdAt || '') : 'N/A'}</span>
                                  </div>
                                  {(booking.payment_date || booking.paymentDate) && (
                                    <div>
                                      <span className="font-medium text-gray-700">Payment Date:</span>
                                      <span className="ml-2 text-gray-900">{formatDate(booking.payment_date || booking.paymentDate || '')}</span>
                                    </div>
                                  )}
                                  {(booking.cancellation_reason || booking.cancellationReason) && (
                                    <div className="col-span-full">
                                      <span className="font-medium text-gray-700">Cancellation Reason:</span>
                                      <span className="ml-2 text-gray-900">{booking.cancellation_reason || booking.cancellationReason}</span>
                                    </div>
                                  )}
                                  {(booking.rejection_reason || booking.rejectionReason) && (
                                    <div className="col-span-full">
                                      <span className="font-medium text-gray-700">Rejection Reason:</span>
                                      <span className="ml-2 text-gray-900">{booking.rejection_reason || booking.rejectionReason}</span>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                      });
                    })()} 
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {analytics.recentBookings && analytics.recentBookings.length > itemsPerPage && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-700">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, analytics.recentBookings.length)} of {analytics.recentBookings.length} results
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    {Array.from({ length: Math.ceil(analytics.recentBookings.length / itemsPerPage) }, (_, i) => i + 1)
                      .filter(page => {
                        const totalPages = Math.ceil(analytics.recentBookings.length / itemsPerPage);
                        return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
                      })
                      .map((page, index, array) => {
                        const showEllipsis = index > 0 && array[index - 1] !== page - 1;
                        return (
                          <React.Fragment key={page}>
                            {showEllipsis && <span className="px-2 text-gray-500">...</span>}
                            <button
                              onClick={() => setCurrentPage(page)}
                              className={`px-3 py-1 text-sm border rounded-md ${
                                currentPage === page
                                  ? 'bg-blue-500 text-white border-blue-500'
                                  : 'border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {page}
                            </button>
                          </React.Fragment>
                        );
                      })
                    }
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(analytics.recentBookings.length / itemsPerPage)))}
                      disabled={currentPage === Math.ceil(analytics.recentBookings.length / itemsPerPage)}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
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
            {/* Revenue Trends Over Last 30 Days */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Revenue Trends (Last 30 Days)</h3>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600">Revenue</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600">Bookings</span>
                  </div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={analytics.monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis yAxisId="left" stroke="#6b7280" />
                  <YAxis yAxisId="right" orientation="right" stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#ffffff', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value, name) => [
                      name === 'revenue' ? formatCurrency(Number(value)) : value,
                      name === 'revenue' ? 'Revenue' : 'Bookings'
                    ]}
                  />
                  <Legend />
                  <Area yAxisId="left" type="monotone" dataKey="revenue" fill="#3b82f6" fillOpacity={0.3} stroke="#3b82f6" strokeWidth={2} />
                  <Line yAxisId="right" type="monotone" dataKey="bookings" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Peak Hours */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Peak Booking Hours</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={analytics.peakHours}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="hour" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#ffffff', 
                        border: '1px solid #e5e7eb', 
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Area type="monotone" dataKey="bookings" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Weekly Trends */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Booking Trends</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={analytics.weeklyTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="day" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#ffffff', 
                        border: '1px solid #e5e7eb', 
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Bar dataKey="bookings" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Booking Status Trends */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Status Distribution</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.bookingStatusBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ status, percentage }) => `${status} (${percentage}%)`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analytics.bookingStatusBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3">
                  {analytics.bookingStatusBreakdown.map((status, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div 
                          className="w-4 h-4 rounded-full mr-3" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        ></div>
                        <span className="font-medium text-gray-900">{status.status}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">{status.count}</div>
                        <div className="text-sm text-gray-500">{status.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {analytics.paymentMethodBreakdown.map((method, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{method.method || 'Unknown'}</h4>
                      <CreditCard className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Count:</span>
                        <span className="text-sm font-medium">{method.count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Revenue:</span>
                        <span className="text-sm font-medium">{formatCurrency(method.revenue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Share:</span>
                        <span className="text-sm font-medium">{method.percentage}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Export Amenity Analytics</h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={exportEmail}
                  onChange={(e) => setExportEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <p className="text-sm text-gray-500">
                Maximum date range: 90 days. Excel file will be sent to your email.
              </p>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowExportModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={exportLoading || !exportEmail || !exportDateFrom || !exportDateTo}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {exportLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  'Export'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AmenityManagement;