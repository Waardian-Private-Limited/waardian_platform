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
  CalendarDays,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  XCircle,
  FileText
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  PieChart as RechartsPieChart, 
  Cell, 
  Pie, 
  AreaChart, 
  Area, 
  RadialBarChart, 
  RadialBar, 
  Legend 
} from 'recharts';
import { apiClient } from '../../lib/apiClient';
import clsx from 'clsx';

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

  const COLORS = ['#004ac6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  useEffect(() => {
    setMounted(true);
    fetchAnalytics();
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
    setExportDateTo(today.toISOString().split('T')[0]);
    setExportDateFrom(thirtyDaysAgo.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const timeoutId = setTimeout(() => {
      if (searchTerm !== '') {
        fetchAnalytics(1, searchTerm, filterType);
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
    }
    if (!exportEmail || !exportDateFrom || !exportDateTo) return;
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
        setShowExportModal(false);
        setExportEmail('');
      }
    } catch (error) {
      console.error('Error exporting analytics:', error);
    } finally {
      setExportLoading(false);
    }
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

  if (loading && !analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-pulse text-slate-400 font-medium">Synchronizing Visitor Logs...</div>
      </div>
    );
  }

  return (
    <main className="flex-1 bg-white text-[#0b1c30] antialiased p-8 font-['Manrope',_sans-serif]">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex justify-between items-end">
          <div>
            <nav className="flex gap-2 text-[12px] font-bold text-[#565e74] mb-2 uppercase tracking-wide">
              <span>Management</span>
              <span>/</span>
              <span className="text-[#004ac6]">Visitors</span>
            </nav>
            <h2 className="text-[32px] font-bold leading-tight tracking-tight text-[#0b1c30]">Gate Terminal</h2>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => fetchAnalytics()}
              className="bg-white border border-slate-200 text-[#565e74] px-5 py-2 rounded-lg flex items-center gap-2 transition-all font-bold text-[14px] hover:bg-slate-50"
            >
              <RefreshCw className={clsx("w-4 h-4", refreshing && "animate-spin")} />
              Sync
            </button>
            <button 
              onClick={() => setShowExportModal(true)}
              className="bg-[#004ac6] hover:bg-[#003ea8] text-white px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all font-bold text-[14px]"
            >
              <Download className="w-4 h-4" />
              Export Data
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: "Today's Entry", value: analytics?.summary.today, icon: Calendar, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Weekly Volume", value: analytics?.summary.week, icon: Activity, color: "text-green-600", bg: "bg-green-50" },
            { label: "Pending Approvals", value: analytics?.summary.pendingApprovals, icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50" },
            { label: "Currently Inside", value: analytics?.summary.currentlyInside, icon: Eye, color: "text-purple-600", bg: "bg-purple-50" },
            { label: "Total Approved", value: analytics?.summary.approved, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" }
          ].map((stat, idx) => (
            <div key={idx} className="bg-white rounded-xl border border-slate-100 p-5 group transition-all hover:border-slate-200">
              <div className="flex justify-between items-start mb-3">
                <div className={clsx("p-2 rounded-lg", stat.bg)}>
                  <stat.icon className={clsx("w-4 h-4", stat.color)} />
                </div>
                <ArrowUpRight className="w-3 h-3 text-slate-300 group-hover:text-slate-400 transition-all" />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className="text-2xl font-bold text-[#0b1c30]">{stat.value?.toLocaleString() || 0}</h3>
            </div>
          ))}
        </div>

        {/* Tabs Navigation */}
        <div className="flex gap-1 p-1 bg-slate-50 rounded-lg w-fit border border-slate-100">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'analytics', label: 'Deep Insights', icon: PieChart },
            { id: 'recent', label: 'Access Logs', icon: Users }
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-slate-100 p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-[14px] font-bold text-[#0b1c30]">Weekly Traffic Trend</h3>
                    <div className="flex items-center gap-2 text-[11px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                      <TrendingUp className="w-3 h-3" />
                      {analytics?.insights.weekly_growth}% Growth
                    </div>
                  </div>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analytics?.weeklyTrend || []}>
                        <defs>
                          <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#004ac6" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#004ac6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="date" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                          tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                        />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                          labelStyle={{ fontWeight: 800, color: '#0b1c30', marginBottom: '4px' }}
                        />
                        <Area type="monotone" dataKey="count" stroke="#004ac6" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-100 p-6">
                  <h3 className="text-[14px] font-bold text-[#0b1c30] mb-6">Today's Peak Hours</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics?.hourlyPattern || []}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="hour" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                          tickFormatter={(hour) => `${hour}:00`}
                        />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                        <Tooltip 
                           cursor={{ fill: '#f8fafc' }}
                           contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="count" fill="#004ac6" radius={[4, 4, 0, 0]} barSize={24} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl border border-slate-100 p-6 lg:col-span-2">
                  <h3 className="text-[14px] font-bold text-[#0b1c30] mb-6">Visitor Distribution by Wing</h3>
                  <div className="space-y-4">
                    {analytics?.wingWiseData.map((wing, idx) => {
                      const max = Math.max(...analytics.wingWiseData.map(w => w.visitCount)) || 1;
                      const pct = (wing.visitCount / max) * 100;
                      return (
                        <div key={idx} className="space-y-1.5">
                          <div className="flex justify-between text-[11px] font-bold">
                            <span className="text-slate-500 uppercase tracking-tight">Wing {wing.wing}</span>
                            <span className="text-[#0b1c30]">{wing.visitCount} Entries</span>
                          </div>
                          <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              className="h-full bg-[#004ac6] rounded-full"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-100 p-6">
                  <h3 className="text-[14px] font-bold text-[#0b1c30] mb-6">Top Visited Units</h3>
                  <div className="space-y-3">
                    {analytics?.flatWiseData.slice(0, 6).map((flat, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100 group hover:bg-white hover:border-[#004ac6]/20 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[11px] font-bold text-[#004ac6]">
                            {flat.flatNumber}
                          </div>
                          <div>
                            <p className="text-[12px] font-bold text-[#0b1c30]">Unit {flat.flatNumber}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Wing {flat.wing}</p>
                          </div>
                        </div>
                        <span className="text-[14px] font-bold text-[#0b1c30]">{flat.visitCount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              <div className="bg-white rounded-xl border border-slate-100 p-8 flex flex-col items-center">
                <h3 className="text-[14px] font-bold text-[#0b1c30] mb-8 self-start">Visitor Profiles</h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={analytics?.visitorTypes || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="count"
                      >
                        {analytics?.visitorTypes.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        align="center"
                        iconType="circle"
                        formatter={(value, entry: any) => <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tighter ml-2">{entry.payload.type}</span>}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-100 p-8">
                <h3 className="text-[14px] font-bold text-[#0b1c30] mb-8">System Performance</h3>
                <div className="grid grid-cols-2 gap-6">
                  {[
                    { label: "Approval Rate", value: `${analytics?.insights.approval_rate}%`, sub: "Daily Average", icon: CheckCircle, color: "text-green-600" },
                    { label: "Avg Response", value: `${analytics?.insights.avg_response_time}m`, sub: "Gate Latency", icon: Clock, color: "text-blue-600" },
                    { label: "Busiest Period", value: analytics?.insights.busiest_period, sub: "Peak Traffic", icon: Activity, color: "text-purple-600" },
                    { label: "Processing", value: analytics?.insights.processing_speed, sub: "Terminal Efficiency", icon: RefreshCw, color: "text-emerald-600" }
                  ].map((insight, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <insight.icon className={clsx("w-4 h-4 mb-3", insight.color)} />
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{insight.label}</p>
                      <h4 className="text-xl font-bold text-[#0b1c30] mb-1">{insight.value}</h4>
                      <p className="text-[10px] text-slate-500 font-medium">{insight.sub}</p>
                    </div>
                  ))}
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
              className="space-y-6"
            >
              <div className="bg-white rounded-xl border border-slate-100 p-3 flex flex-col md:flex-row items-center gap-4">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search entry logs by name, wing or unit..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-lg text-[13px] outline-none focus:bg-white focus:ring-1 focus:ring-[#004ac6] transition-all"
                  />
                </div>
                <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <select 
                    value={filterType} 
                    onChange={(e) => handleFilterChange(e.target.value)}
                    className="bg-transparent text-[13px] font-bold text-[#565e74] outline-none border-none"
                  >
                    <option value="all">All Visitors</option>
                    <option value="guest">Guests</option>
                    <option value="delivery">Deliveries</option>
                    <option value="service">Services</option>
                  </select>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-50">
                    <thead className="bg-slate-50/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-[11px] font-bold text-[#565e74] uppercase tracking-wider">Visitor Details</th>
                        <th className="px-6 py-4 text-left text-[11px] font-bold text-[#565e74] uppercase tracking-wider">Purpose</th>
                        <th className="px-6 py-4 text-left text-[11px] font-bold text-[#565e74] uppercase tracking-wider">Destination</th>
                        <th className="px-6 py-4 text-left text-[11px] font-bold text-[#565e74] uppercase tracking-wider">Approval</th>
                        <th className="px-6 py-4 text-left text-[11px] font-bold text-[#565e74] uppercase tracking-wider">Timeline</th>
                        <th className="px-6 py-4 text-right text-[11px] font-bold text-[#565e74] uppercase tracking-wider">Presence</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {analytics?.recentVisitors.data.map((visitor, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-all group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {visitor.image_url ? (
                                <img src={visitor.image_url} alt="" className="w-9 h-9 rounded-full object-cover border border-slate-100 shadow-sm" />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-[#004ac6] font-bold text-[11px]">
                                  {visitor.name[0].toUpperCase()}
                                </div>
                              )}
                              <div>
                                <p className="text-[14px] font-bold text-[#0b1c30]">{visitor.name}</p>
                                <p className="text-[11px] text-slate-500 font-medium">{visitor.phone}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-[11px] font-bold text-[#004ac6] bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                              {visitor.visitor_type}
                            </span>
                            <p className="text-[12px] text-slate-500 mt-1 max-w-[150px] truncate">{visitor.purpose_of_visit}</p>
                          </td>
                          <td className="px-6 py-4 text-[13px] font-bold text-[#0b1c30]">
                            {visitor.wing}-{visitor.flat_id}
                          </td>
                          <td className="px-6 py-4">
                            <span className={clsx(
                              "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                              visitor.approval_status === 'approved' ? "bg-green-50 text-green-700" :
                              visitor.approval_status === 'pending' ? "bg-yellow-50 text-yellow-700" : "bg-red-50 text-red-700"
                            )}>
                              {visitor.approval_status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-[12px] text-slate-500 font-medium">
                            {new Date(visitor.entry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-6 py-4 text-right">
                             <div className="flex items-center justify-end gap-1.5">
                               <span className={clsx("w-1.5 h-1.5 rounded-full", visitor.presence_status === 'inside' ? "bg-green-500" : "bg-slate-300")}></span>
                               <span className="text-[12px] font-bold text-[#565e74] uppercase tracking-tight">{visitor.presence_status}</span>
                             </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-[11px] text-[#565e74] font-bold uppercase tracking-wider">
                  <span>Showing {analytics?.recentVisitors.data.length} of {analytics?.recentVisitors.pagination.totalItems} Logs</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={!analytics?.recentVisitors.pagination.hasPrevPage}
                      className="p-1 hover:bg-white hover:shadow-sm rounded-md transition-all disabled:opacity-30"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={!analytics?.recentVisitors.pagination.hasNextPage}
                      className="p-1 hover:bg-white hover:shadow-sm rounded-md transition-all disabled:opacity-30"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
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
                    <h3 className="text-[20px] font-bold text-[#0b1c30]">Export Ledger</h3>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Analytics Serialization</p>
                  </div>
                  <button 
                    onClick={() => setShowExportModal(false)}
                    className="p-2 hover:bg-slate-50 rounded-lg transition-all"
                  >
                    <X className="w-5 h-5 text-slate-300" />
                  </button>
                </div>

                <form onSubmit={handleExport} className="p-8 space-y-6">
                   <div className="space-y-4">
                     <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-400 uppercase">Target Email</label>
                        <div className="relative">
                          <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                          <input 
                            type="email" 
                            required
                            value={exportEmail}
                            onChange={(e) => setExportEmail(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-lg text-[13px] outline-none focus:bg-white focus:ring-1 focus:ring-[#004ac6] font-medium"
                            placeholder="recipient@waardian.com"
                          />
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-400 uppercase">Start Date</label>
                          <input 
                            type="date" 
                            required
                            value={exportDateFrom}
                            onChange={(e) => setExportDateFrom(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-lg text-[13px] outline-none focus:bg-white focus:ring-1 focus:ring-[#004ac6] font-bold"
                          />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-400 uppercase">End Date</label>
                          <input 
                            type="date" 
                            required
                            value={exportDateTo}
                            onChange={(e) => setExportDateTo(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-lg text-[13px] outline-none focus:bg-white focus:ring-1 focus:ring-[#004ac6] font-bold"
                          />
                       </div>
                     </div>
                   </div>

                   <div className="p-4 bg-[#0b1c30] rounded-2xl text-white">
                      <div className="flex gap-3 items-start">
                        <CalendarDays className="w-5 h-5 text-blue-400 mt-0.5" />
                        <div>
                          <p className="text-[13px] font-bold">Serialization Policy</p>
                          <p className="text-[11px] text-white/50 font-medium leading-relaxed mt-1">
                            Reports are generated in .xlsx format and may take up to 2 minutes. Date range is restricted to 90 days.
                          </p>
                        </div>
                      </div>
                   </div>

                   <div className="flex gap-3 pt-2">
                     <button 
                       type="button"
                       onClick={() => setShowExportModal(false)}
                       className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-[13px] hover:bg-slate-200 transition-all"
                     >
                       Cancel
                     </button>
                     <button 
                       type="submit"
                       disabled={exportLoading}
                       className="flex-[2] py-3 bg-[#004ac6] text-white rounded-xl font-bold text-[13px] hover:bg-[#003ea8] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                     >
                       {exportLoading ? (
                         <RefreshCw className="w-4 h-4 animate-spin" />
                       ) : (
                         <Download className="w-4 h-4" />
                       )}
                       Begin Export
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

export default VisitorManagement;