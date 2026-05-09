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
  ComposedChart,
  AreaChart,
  Area
} from 'recharts';
import { apiClient, ApiResponse } from '../../lib/apiClient';
import {
  TrendingUp,
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
  Coffee,
  Heart,
  GraduationCap,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  Download,
  RefreshCw,
  CalendarDays,
  Search,
  Eye,
  X,
  Receipt,
  Banknote,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  EyeOff
} from 'lucide-react';
import clsx from 'clsx';

interface AmenityBooking {
  id: string | number;
  amenity_name?: string;
  amenityName?: string;
  user_name?: string;
  userName?: string;
  flat_number?: string;
  flatNumber?: string;
  wing_name?: string;
  wingName?: string;
  slot_date?: string;
  slotDate?: string;
  slot_time?: string;
  slotTime?: string;
  amount: number | string;
  payment_status?: string;
  paymentStatus?: string;
  booking_status?: string;
  bookingStatus?: string;
}

interface Amenity {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'inactive';
  description?: string;
  location?: string;
}

interface AmenityAnalytics {
  totalBookings: number;
  totalRevenue: number;
  totalFees: number;
  totalTaxes: number;
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
  }>;
}

const COLORS = ['#004ac6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];

const AmenityManagement: React.FC<{ societyId?: string }> = ({ societyId }) => {
  const [analytics, setAnalytics] = useState<AmenityAnalytics | null>(null);
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

  useEffect(() => {
    setMounted(true);
    fetchData();
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
    setExportDateTo(today.toISOString().split('T')[0]);
    setExportDateFrom(thirtyDaysAgo.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (mounted) fetchAnalytics();
  }, [dateRange, selectedAmenity, mounted]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchAnalytics(), fetchAmenities()]);
    setLoading(false);
  };

  const fetchAnalytics = async () => {
    try {
      const params: Record<string, string> = { dateRange };
      if (selectedAmenity !== 'all') params.amenityId = selectedAmenity;
      const response = await apiClient<ApiResponse<AmenityAnalytics>>('/amenities/booking-analytics', { method: 'GET', params, withAuth: true });
      if (response.success && response.data) setAnalytics(response.data);
    } catch (e) { console.error(e); }
  };

  const fetchAmenities = async () => {
    try {
      const response = await apiClient<ApiResponse<Amenity[]>>('/amenities', { method: 'GET', withAuth: true });
      if (response.success && response.data) setAmenities(response.data);
    } catch (e) { console.error(e); }
  };

  const handleExport = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!exportEmail || !exportDateFrom || !exportDateTo) return;
    try {
      setExportLoading(true);
      const response = await apiClient('/amenities/analytics/export', {
        method: 'POST',
        body: { email: exportEmail, dateFrom: exportDateFrom, dateTo: exportDateTo, includeExcel: true },
        withAuth: true
      });
      if (response.success) {
        setShowExportModal(false);
        setExportEmail('');
      }
    } catch (e) { console.error(e); } finally { setExportLoading(false); }
  };

  if (loading && !analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-pulse text-slate-400 font-bold uppercase tracking-widest text-xs">Syncing Amenity Ecosystem...</div>
      </div>
    );
  }

  const formatCurrency = (amt: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(amt || 0));

  return (
    <main className="flex-1 bg-white text-[#0b1c30] antialiased p-8 font-['Manrope',_sans-serif]">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex justify-between items-end">
          <div>
            <nav className="flex gap-2 text-[12px] font-bold text-[#565e74] mb-2 uppercase tracking-wide">
              <span>Management</span>
              <span>/</span>
              <span className="text-[#004ac6]">Amenity Hub</span>
            </nav>
            <h2 className="text-[32px] font-bold leading-tight tracking-tight text-[#0b1c30]">Facility Insights</h2>
          </div>
          <div className="flex gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-white border border-slate-200 text-[#565e74] px-4 py-2 rounded-lg font-bold text-[13px] outline-none hover:border-slate-300 transition-all cursor-pointer"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="1y">Last Year</option>
            </select>
            <button
              onClick={() => fetchData()}
              className="bg-white border border-slate-200 text-[#565e74] px-5 py-2 rounded-lg flex items-center gap-2 transition-all font-bold text-[14px] hover:bg-slate-50"
            >
              <RefreshCw className="w-4 h-4" />
              Sync
            </button>
            <button
              onClick={() => setShowExportModal(true)}
              className="bg-[#004ac6] hover:bg-[#003ea8] text-white px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all font-bold text-[14px]"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          {[
            { label: "Total Bookings", value: analytics?.totalBookings, icon: Calendar, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Gross Revenue", value: formatCurrency(analytics?.totalRevenue), icon: DollarSign, color: "text-green-600", bg: "bg-green-50" },
            { label: "Amenity Fees", value: formatCurrency(analytics?.totalFees), icon: CreditCard, color: "text-amber-600", bg: "bg-amber-50" },
            { label: "Service Tax", value: formatCurrency(analytics?.totalTaxes), icon: Receipt, color: "text-red-600", bg: "bg-red-50" },
            { label: "Net Realized", value: formatCurrency(analytics?.totalActualAmount), icon: Banknote, color: "text-purple-600", bg: "bg-purple-50" },
            { label: "Active Nodes", value: analytics?.topAmenities.length, icon: Activity, color: "text-indigo-600", bg: "bg-indigo-50" }
          ].map((stat, idx) => (
            <div key={idx} className="bg-white rounded-xl border border-slate-100 p-5 group transition-all hover:border-slate-200">
              <div className="flex justify-between items-start mb-3">
                <div className={clsx("p-2 rounded-lg", stat.bg)}>
                  <stat.icon className={clsx("w-4 h-4", stat.color)} />
                </div>
                <ArrowUpRight className="w-3 h-3 text-slate-300 group-hover:text-slate-400 transition-all" />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className="text-xl font-bold text-[#0b1c30] truncate">{stat.value}</h3>
            </div>
          ))}
        </div>

        {/* Tabs Navigation */}
        <div className="flex gap-1 p-1 bg-slate-50 rounded-lg w-fit border border-slate-100">
          {[
            { id: 'overview', label: 'Ecosystem', icon: BarChart3 },
            { id: 'amenities', label: 'Facilities', icon: MapPin },
            { id: 'bookings', label: 'Bookings', icon: Clock },
            { id: 'analytics', label: 'Performance', icon: PieChartIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "px-6 py-1.5 text-[13px] font-bold rounded-md transition-all flex items-center gap-2",
                activeTab === tab.id
                  ? "bg-white text-[#004ac6] shadow-sm border border-slate-100"
                  : "text-[#565e74] hover:text-[#004ac6]"
              )}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-xl border border-slate-100 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-[14px] font-bold text-[#0b1c30]">Revenue & Utilization Vectors</h3>
                </div>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={analytics?.monthlyTrends || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                      <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                      <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                      <Bar yAxisId="left" dataKey="revenue" fill="#004ac6" radius={[4, 4, 0, 0]} barSize={40} name="Revenue (₹)" />
                      <Line yAxisId="right" type="monotone" dataKey="bookings" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} name="Volume" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-slate-100 p-6">
                  <h3 className="text-[14px] font-bold text-[#0b1c30] mb-6">Revenue Partitioning</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics?.topAmenities || []}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="revenue"
                        >
                          {(analytics?.topAmenities || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                        <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-100 p-6">
                  <h3 className="text-[14px] font-bold text-[#0b1c30] mb-6">Allocation Status</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics?.bookingStatusBreakdown || []}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="status" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                        <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                        <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} barSize={32} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'amenities' && (
            <motion.div
              key="amenities"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-xl border border-slate-100 p-3 flex flex-col md:flex-row items-center gap-4">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search facilities by name or type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-lg text-[13px] outline-none focus:bg-white focus:ring-1 focus:ring-[#004ac6] transition-all"
                  />
                </div>
                <button
                  onClick={() => setShowInactive(!showInactive)}
                  className={clsx(
                    "flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-[13px] transition-all border",
                    showInactive ? "bg-[#0b1c30] text-white border-[#0b1c30]" : "bg-white text-slate-500 border-slate-100 hover:border-slate-200"
                  )}
                >
                  {showInactive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showInactive ? 'Hide Inactive' : 'Show Inactive'}
                </button>
              </div>

              <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-50">
                    <thead className="bg-slate-50/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-[11px] font-bold text-[#565e74] uppercase tracking-wider">Facility Name</th>
                        <th className="px-6 py-4 text-left text-[11px] font-bold text-[#565e74] uppercase tracking-wider">Type</th>
                        <th className="px-6 py-4 text-left text-[11px] font-bold text-[#565e74] uppercase tracking-wider">Location</th>
                        <th className="px-6 py-4 text-left text-[11px] font-bold text-[#565e74] uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-right text-[11px] font-bold text-[#565e74] uppercase tracking-wider">Volume</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {(amenities || []).filter(a => showInactive || a.status === 'active').filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase())).map((a) => (
                        <tr key={a.id} className="hover:bg-slate-50/50 transition-all group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <p className="text-[14px] font-bold text-[#0b1c30]">{a.name}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-[11px] font-bold text-[#565e74] uppercase tracking-tighter bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                              {a.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-[13px] text-[#565e74] font-medium">
                            {a.location || 'Main Complex'}
                          </td>
                          <td className="px-6 py-4">
                            <span className={clsx(
                              "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                              a.status === 'active' ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                            )}>
                              {a.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right text-[13px] font-bold text-[#0b1c30]">
                            12 Entries
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'bookings' && (
            <motion.div
              key="bookings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm"
            >
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-50">
                  <thead className="bg-slate-50/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-[11px] font-bold text-[#565e74] uppercase tracking-wider">Subscriber</th>
                      <th className="px-6 py-4 text-left text-[11px] font-bold text-[#565e74] uppercase tracking-wider">Facility</th>
                      <th className="px-6 py-4 text-left text-[11px] font-bold text-[#565e74] uppercase tracking-wider">Timeline</th>
                      <th className="px-6 py-4 text-left text-[11px] font-bold text-[#565e74] uppercase tracking-wider">Financials</th>
                      <th className="px-6 py-4 text-left text-[11px] font-bold text-[#565e74] uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-right text-[11px] font-bold text-[#565e74] uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {(analytics?.recentBookings || []).map((b, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-all group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-[#004ac6] font-bold text-[11px]">
                              {(b.userName || b.user_name || 'U')[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="text-[14px] font-bold text-[#0b1c30]">{b.userName || b.user_name}</p>
                              <p className="text-[11px] text-slate-500 font-medium">Unit {b.flatNumber || b.flat_number || 'N/A'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-[13px] font-bold text-[#0b1c30]">{b.amenityName || b.amenity_name}</p>
                          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tighter">On-Site Facility</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-[12px] font-bold text-[#0b1c30]">{b.slotDate || b.slot_date}</p>
                          <p className="text-[11px] text-slate-500">{b.slotTime || b.slot_time}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-[13px] font-bold text-[#0b1c30]">{formatCurrency(b.amount)}</p>
                          <span className={clsx(
                            "text-[10px] font-bold uppercase",
                            (b.paymentStatus || b.payment_status) === 'paid' ? "text-green-600" : "text-amber-600"
                          )}>
                            {(b.paymentStatus || b.payment_status) || 'Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={clsx(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                            (b.bookingStatus || b.booking_status) === 'confirmed' ? "bg-green-50 text-green-700" :
                              (b.bookingStatus || b.booking_status) === 'pending' ? "bg-yellow-50 text-yellow-700" : "bg-red-50 text-red-700"
                          )}>
                            {(b.bookingStatus || b.booking_status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {/* Non-actionable placeholders removed */}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-xl border border-slate-100 p-8">
                <h3 className="text-[14px] font-bold text-[#0b1c30] mb-8">Facility Revenue Matrices</h3>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics?.topAmenities || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="amenityName" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                      <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                      <Bar dataKey="revenue" fill="#004ac6" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-slate-100 p-8">
                  <h3 className="text-[14px] font-bold text-[#0b1c30] mb-8">Weekly Utilization Cycle</h3>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analytics?.weeklyTrends || []}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                        <Tooltip />
                        <Area type="monotone" dataKey="bookings" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-100 p-8">
                  <h3 className="text-[14px] font-bold text-[#0b1c30] mb-8">Peak Load Pattern</h3>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analytics?.peakHours || []}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                        <Tooltip />
                        <Line type="stepAfter" dataKey="bookings" stroke="#ef4444" strokeWidth={3} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modern Export Modal */}
        <AnimatePresence>
          {showExportModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0b1c30]/10 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100"
              >
                <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-10">
                  <div>
                    <h3 className="text-[20px] font-bold text-[#0b1c30]">Facility Audit</h3>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Revenue Serialization</p>
                  </div>
                  <button onClick={() => setShowExportModal(false)} className="p-2 hover:bg-slate-50 rounded-lg transition-all"><X className="w-5 h-5 text-slate-300" /></button>
                </div>
                <form onSubmit={handleExport} className="p-8 space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-400 uppercase">Audit Recipient</label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input type="email" required value={exportEmail} onChange={(e) => setExportEmail(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-lg text-[13px] outline-none focus:bg-white focus:ring-1 focus:ring-[#004ac6] font-medium" placeholder="admin@waardian.com" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-400 uppercase">From Date</label>
                        <input type="date" required value={exportDateFrom} onChange={(e) => setExportDateFrom(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-lg text-[13px] outline-none focus:bg-white focus:ring-1 focus:ring-[#004ac6] font-bold" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-400 uppercase">To Date</label>
                        <input type="date" required value={exportDateTo} onChange={(e) => setExportDateTo(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-lg text-[13px] outline-none focus:bg-white focus:ring-1 focus:ring-[#004ac6] font-bold" />
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-[#0b1c30] rounded-2xl text-white">
                    <div className="flex gap-3 items-start">
                      <CalendarDays className="w-5 h-5 text-blue-400 mt-0.5" />
                      <div>
                        <p className="text-[13px] font-bold">Policy Notification</p>
                        <p className="text-[11px] text-white/50 font-medium leading-relaxed mt-1">Audit logs include transaction IDs and gateway metadata. Processing window: 90 days maximum.</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowExportModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-[13px] hover:bg-slate-200 transition-all">Cancel</button>
                    <button type="submit" disabled={exportLoading} className="flex-[2] py-3 bg-[#004ac6] text-white rounded-xl font-bold text-[13px] hover:bg-[#003ea8] transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                      {exportLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      Start Export
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
};

export default AmenityManagement;