import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Calendar,
  Eye,
  Phone,
  MapPin,
  Activity,
  BarChart3,
  PieChart,
  Filter,
  Search,
  Download,
  RefreshCw,
  Building,
  Home,
  CalendarDays
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Cell, Pie, AreaChart, Area, RadialBarChart, RadialBar, Legend, ComposedChart } from 'recharts';
import { apiClient } from '../../lib/apiClient';

interface VisitorAnalytics {
  summary: {
    today: number;
    week: number;
    month: number;
    year: number;
    pendingApprovals: number;
    currentlyInside: number;
    approved: number;
    rejected: number;
    avgDuration: number;
    peakHour: number;
  };
  visitorTypes: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  wingWiseData: Array<{
    wing: string;
    visitCount: number;
  }>;
  flatWiseData: Array<{
    flatNumber: string;
    wing: string;
    flatId: string;
    visitCount: number;
  }>;
  recentVisitors: {
    data: Array<{
      name: string;
      visitor_type: string;
      entry_time: string;
      approval_status: string;
      presence_status: string;
      wing: string;
      floor: string;
      flat_id: string;
      image_url?: string;
      phone: string;
      purpose_of_visit: string;
    }>;
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
  hourlyPattern: Array<{
    hour: number;
    count: number;
  }>;
  weeklyTrend: Array<{
    date: string;
    count: number;
    approved: number;
    pending: number;
  }>;
  monthlyComparison: Array<{
    label: string;
    count: number;
  }>;
  insights: {
    approval_rate: number;
    avg_daily_visitors: number;
    monthly_growth: number;
    weekly_growth: number;
    peak_day: string;
    busiest_period: string;
    avg_response_time: number;
    processing_speed: string;
    trend: string;
  };
}

const VisitorManagement: React.FC = () => {
  const [analytics, setAnalytics] = useState<VisitorAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportEmail, setExportEmail] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportDateFrom, setExportDateFrom] = useState('');
  const [exportDateTo, setExportDateTo] = useState('');
  const [mounted, setMounted] = useState(false);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  useEffect(() => {
    setMounted(true);
    fetchAnalytics();
    
    // Set default date range (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
    setExportDateTo(today.toISOString().split('T')[0]);
    setExportDateFrom(thirtyDaysAgo.toISOString().split('T')[0]);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!mounted) return;
    const timeoutId = setTimeout(() => {
      if (searchTerm !== '') {
        handleSearch(searchTerm);
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, mounted]);

  const fetchAnalytics = async (page = 1, search = '', filter = 'all') => {
    try {
      setRefreshing(true);
      const params = {
        page: page.toString(),
        limit: '10',
        search,
        filterType: filter,
        sortBy: 'entry_time',
        sortOrder: 'DESC'
      };
      
      const data = await apiClient<VisitorAnalytics>('/visitor/analytics', {
        method: 'GET',
        params,
        withAuth: true
      });
      
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
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
      
      const response = await apiClient('/visitor/analytics/export', {
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
        console.log('Analytics report with Excel attachment has been sent to your email!');
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

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
    fetchAnalytics(1, term, filterType);
  };

  const handleFilterChange = (filter: string) => {
    setFilterType(filter);
    setCurrentPage(1);
    fetchAnalytics(1, searchTerm, filter);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchAnalytics(page, searchTerm, filterType);
  };

  const AnimatedCounter = ({ value, duration = 1500, delay = 0 }: { value: number; duration?: number; delay?: number }) => {
    const [count, setCount] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const countRef = useRef(0);
    
    useEffect(() => {
      const timer = setTimeout(() => {
        setIsVisible(true);
        const startTime = Date.now();
        const startValue = countRef.current;
        const endValue = value;
        
        const updateCount = () => {
          const now = Date.now();
          const progress = Math.min((now - startTime) / duration, 1);
          // Enhanced easing function for smoother animation
          const easeOutCubic = 1 - Math.pow(1 - progress, 3);
          const currentValue = Math.floor(startValue + (endValue - startValue) * easeOutCubic);
          
          setCount(currentValue);
          countRef.current = currentValue;
          
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

  const StatCard = ({ icon: Icon, title, value, change, color, delay = 0 }: any) => (
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
            <AnimatedCounter value={value || 0} delay={delay + 0.3} />
          </p>
          {change && (
            <motion.p 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + 0.5 }}
              className="text-green-600 text-xs mt-1 flex items-center"
            >
              <TrendingUp className="w-3 h-3 mr-1" />
              {change}
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

  const VisitorCard = ({ visitor, index }: any) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200"
    >
      <div className="flex items-center space-x-4">
        <div className="relative">
          {visitor.image_url ? (
            <img 
              src={visitor.image_url} 
              alt={visitor.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
              {(visitor.name || 'U').charAt(0).toUpperCase()}
            </div>
          )}
          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
            visitor.presence_status === 'inside' || visitor.presence_status === 'Present' ? 'bg-green-500' : 'bg-gray-400'
          }`} />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">{visitor.name || 'Unknown'}</h4>
          <p className="text-sm text-gray-600">{visitor.visitor_type || 'General'}</p>
          <div className="flex items-center space-x-4 mt-1">
            <span className="text-xs text-gray-500 flex items-center">
              <MapPin className="w-3 h-3 mr-1" />
              {visitor.wing || 'N/A'}-{visitor.floor || 'N/A'}-{visitor.flat_id || 'N/A'}
            </span>
            <span className="text-xs text-gray-500 flex items-center">
              <Phone className="w-3 h-3 mr-1" />
              {visitor.phone || 'N/A'}
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
            visitor.approval_status === 'approved' ? 'bg-green-100 text-green-800' :
            visitor.approval_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {visitor.approval_status || 'Unknown'}
          </span>
          <p className="text-xs text-gray-500 mt-1">
            {visitor.entry_time ? new Date(visitor.entry_time).toLocaleTimeString() : 'N/A'}
          </p>
        </div>
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
              <Users className="w-8 h-8 mr-3 text-blue-600" />
              Visitor Management
            </h1>
            <p className="text-gray-600 mt-1">Monitor and manage visitor activities</p>
          </div>
          <div className="flex space-x-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => fetchAnalytics()}
              disabled={refreshing}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowExportModal(true)}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </motion.button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <StatCard
            icon={Calendar}
            title="Today's Visitors"
            value={analytics?.summary.today || 0}
            change="+12% from yesterday"
            color="text-blue-600"
            delay={0.1}
          />
          <StatCard
            icon={Clock}
            title="This Week"
            value={analytics?.summary.week || 0}
            change="+8% from last week"
            color="text-green-600"
            delay={0.2}
          />
          <StatCard
            icon={AlertCircle}
            title="Pending Approvals"
            value={analytics?.summary.pendingApprovals || 0}
            color="text-yellow-600"
            delay={0.3}
          />
          <StatCard
            icon={Eye}
            title="Currently Inside"
            value={analytics?.summary.currentlyInside || 0}
            color="text-purple-600"
            delay={0.4}
          />
          <StatCard
            icon={TrendingUp}
            title="This Month"
            value={analytics?.summary.month || 0}
            change="+15% from last month"
            color="text-indigo-600"
            delay={0.5}
          />
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'analytics', label: 'Analytics', icon: PieChart },
            { id: 'recent', label: 'Recent Visitors', icon: Users }
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
              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Weekly Trend Chart */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-blue-600" />
                    Weekly Visitor Trend
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analytics?.weeklyTrend || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#6b7280" 
                        tickFormatter={(date) => {
                          const d = new Date(date);
                          return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        }}
                      />
                      <YAxis stroke="#6b7280" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="count" 
                        stroke="#3B82F6" 
                        strokeWidth={3}
                        dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Hourly Pattern */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-green-600" />
                    Today's Hourly Pattern
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={analytics?.hourlyPattern || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="hour" stroke="#6b7280" tickFormatter={(hour) => `${hour}:00`} />
                      <YAxis stroke="#6b7280" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        labelFormatter={(hour) => `${hour}:00`}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="count" 
                        stroke="#10B981" 
                        fill="#10B981" 
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Wing-wise Analytics Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Wing-wise Visitor Distribution */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Building className="w-5 h-5 mr-2 text-purple-600" />
                    Wing-wise Distribution
                  </h3>
                  {analytics?.wingWiseData && analytics.wingWiseData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analytics.wingWiseData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="wing" stroke="#6b7280" fontSize={12} />
                        <YAxis stroke="#6b7280" fontSize={12} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'white', 
                            border: '1px solid #e5e7eb', 
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }} 
                        />
                        <Bar dataKey="visitCount" fill="#8b5cf6" name="Visitors" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-gray-500">
                      <div className="text-center">
                        <Building className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm">No wing-wise data available</p>
                      </div>
                    </div>
                  )}
                </motion.div>

                {/* Flat-wise Top Visitors */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Home className="w-5 h-5 mr-2 text-indigo-600" />
                    Top Visited Flats
                  </h3>
                  <div className="space-y-4">
                    {analytics?.flatWiseData && analytics.flatWiseData.length > 0 ? (
                      analytics.flatWiseData.slice(0, 5).map((flat, index) => (
                        <motion.div
                          key={flat.flatNumber}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.7 + index * 0.1 }}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                              <span className="text-indigo-600 font-semibold text-sm">{index + 1}</span>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800">{flat.flatNumber}</p>
                              <p className="text-sm text-gray-600">{flat.wing}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-indigo-600">{flat.visitCount}</p>
                            <p className="text-xs text-gray-500">visits</p>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="flex items-center justify-center h-[200px] text-gray-500">
                        <div className="text-center">
                          <Home className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p className="text-sm">No flat-wise data available</p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {/* Visitor Types Pie Chart */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <PieChart className="w-5 h-5 mr-2 text-purple-600" />
                  Visitor Types Distribution
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={analytics?.visitorTypes || []}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                      label={({ type, percent }) => `${type} ${((percent || 0) * 100).toFixed(0)}%`}
                    >
                      {analytics?.visitorTypes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name, props) => [value, props.payload?.type || name]} />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>

              {/* Advanced Analytics */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Advanced Analytics</h3>
                <div className="space-y-6">
                  {/* Visitor Status Radial Chart */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Status Distribution</h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" data={[
                        { name: 'Approved', value: analytics?.summary?.today || 0, fill: '#10B981' },
                        { name: 'Pending', value: analytics?.summary?.pendingApprovals || 0, fill: '#F59E0B' },
                        { name: 'Inside', value: analytics?.summary?.currentlyInside || 0, fill: '#3B82F6' }
                      ]}>
                        <RadialBar dataKey="value" cornerRadius={10} fill="#8884d8" />
                        <Tooltip />
                      </RadialBarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Quick Stats */}
                  <div className="space-y-3">
                    {analytics?.visitorTypes.map((type, index) => (
                      <motion.div
                        key={type.type}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center">
                          <div 
                            className="w-4 h-4 rounded-full mr-3"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="font-medium text-gray-700">{type.type}</span>
                        </div>
                        <span className="text-lg font-bold text-gray-900">{type.count}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'recent' && (
            <motion.div
              key="recent"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Search and Filter */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search visitors..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <select
                      value={filterType}
                      onChange={(e) => handleFilterChange(e.target.value)}
                      className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                    >
                      <option value="all">All Types</option>
                      <option value="guest">Guest</option>
                      <option value="delivery">Delivery</option>
                      <option value="service">Service</option>
                      <option value="vendor">Vendor</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Recent Visitors List */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-blue-600" />
                  Recent Visitors
                </h3>
                <div className="space-y-4">
            {analytics?.recentVisitors?.data && analytics.recentVisitors.data.length > 0 ? (
              analytics.recentVisitors.data.map((visitor: any, index: number) => (
                <VisitorCard key={index} visitor={visitor} index={index} />
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>{loading ? 'Loading visitors...' : 'No visitors found'}</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {analytics?.recentVisitors?.pagination && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Showing {((analytics.recentVisitors.pagination.currentPage - 1) * analytics.recentVisitors.pagination.itemsPerPage) + 1} to {Math.min(analytics.recentVisitors.pagination.currentPage * analytics.recentVisitors.pagination.itemsPerPage, analytics.recentVisitors.pagination.totalItems)} of {analytics.recentVisitors.pagination.totalItems} visitors
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!analytics.recentVisitors.pagination.hasPrevPage}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm text-gray-600">
                  Page {analytics.recentVisitors.pagination.currentPage} of {analytics.recentVisitors.pagination.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!analytics.recentVisitors.pagination.hasNextPage}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Export Modal */}
        {showExportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl p-6 w-96 max-w-md mx-4"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Download className="w-5 h-5 mr-2 text-blue-600" />
                Export Visitor Data
              </h3>
              <form onSubmit={handleExport} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={exportEmail}
                    onChange={(e) => setExportEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter email address"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      From Date
                    </label>
                    <input
                      type="date"
                      value={exportDateFrom}
                      onChange={(e) => setExportDateFrom(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      To Date
                    </label>
                    <input
                      type="date"
                      value={exportDateTo}
                      onChange={(e) => setExportDateTo(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <CalendarDays className="w-4 h-4 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium">Export Information</p>
                      <p className="text-xs mt-1">• Maximum 90 days date range allowed</p>
                      <p className="text-xs">• Excel file will be sent to your email</p>
                      <p className="text-xs">• Includes all visitor details and analytics</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowExportModal(false);
                      setExportEmail('');
                    }}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={exportLoading || !exportEmail || !exportDateFrom || !exportDateTo}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    {exportLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Export Excel
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default VisitorManagement;