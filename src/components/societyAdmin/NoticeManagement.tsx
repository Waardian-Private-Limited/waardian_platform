"use client";

import React, { useState, useEffect } from 'react';
import {
  Bell,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Clock,
  CheckCircle,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  FileText,
  ArrowUpRight,
  Activity,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';
import { 
  getAllNotices, 
  updateNoticeStatus, 
  deleteNotice, 
  exportNoticesPDF, 
  exportNoticesExcel,
  getNoticeAnalytics 
} from '@/lib/apiClient';
import NoticeForm from './NoticeForm';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { toast } from 'react-hot-toast';

interface Notice {
  id: number;
  title: string;
  description: string;
  category: string;
  audience_type: string;
  status: 'draft' | 'published' | 'archived' | 'scheduled';
  views: number;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  createdByName: string;
  is_scheduled: number;
  scheduled_datetime: string | null;
  attachments?: Array<{
    id: number;
    file_name: string;
    file_type: string;
    file_url: string;
  }>;
}

interface NoticeStats {
  totalNotices: number;
  activeNotices: number;
  totalViews: number;
  avgEngagement: number;
  monthlyGrowth: number;
  categoryDistribution?: Array<{ label: string; pct: number; count: number }>;
  audienceDistribution?: Array<{ label: string; pct: number; count: number }>;
}

const NoticeManagement = ({ societyId, user }: { societyId: string, user?: any }) => {
  // Navigation & UI State
  const [activeTab, setActiveTab] = useState<'insights' | 'broadcaster'>('insights');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Dashboard State
  const [stats, setStats] = useState<NoticeStats>({
    totalNotices: 0,
    activeNotices: 0,
    totalViews: 0,
    avgEngagement: 0,
    monthlyGrowth: 0,
  });
  const [timeRange, setTimeRange] = useState('30d');

  // Management State
  const [notices, setNotices] = useState<Notice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [exporting, setExporting] = useState(false);

  const itemsPerPage = 10;

  // Effects
  useEffect(() => {
    if (activeTab === 'insights') {
      fetchDashboardData();
    } else {
      const timeoutId = setTimeout(() => fetchNotices(), 500);
      return () => clearTimeout(timeoutId);
    }
  }, [activeTab, societyId, timeRange, searchTerm, statusFilter, currentPage]);

  // Data Fetching
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await getNoticeAnalytics({ timeRange });
      if (response.success) {
        setStats(response.stats);
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const response = await getAllNotices({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      if (response.success) {
        setNotices(response.notices || []);
        setTotalPages(Math.ceil((response.total || 0) / itemsPerPage));
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  // Actions
  const handleDelete = async (id: string) => {
    if (!confirm('Permanent deletion of this bulletin?')) return;
    try {
      setActionLoading(id);
      await deleteNotice(id);
      toast.success('Bulletin purged');
      fetchNotices();
    } catch (e) { toast.error('Purge failed'); } finally { setActionLoading(null); }
  };

  const handleExport = async (format: 'pdf' | 'excel') => {
    const email = prompt('Enter recipient email for serialization:');
    if (!email) return;
    try {
      setExporting(true);
      toast.loading(`Serializing registry to ${format.toUpperCase()}...`);
      if (format === 'pdf') await exportNoticesPDF(email);
      else await exportNoticesExcel(email);
      toast.dismiss();
      toast.success('Serialization finalized. Check email.');
    } catch (e) { toast.dismiss(); toast.error('Serialization failed'); } finally { setExporting(false); }
  };

  if (loading && stats.totalNotices === 0 && notices.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-pulse text-slate-400 font-bold uppercase tracking-widest text-xs">Syncing Communication Hub...</div>
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
              <span className="text-[#004ac6]">Notice Hub</span>
            </nav>
            <div className="flex items-center gap-4">
              <h2 className="text-[32px] font-bold leading-tight tracking-tight text-[#0b1c30]">Communication Center</h2>
              <div className="flex items-center gap-1 p-1 bg-slate-50 border border-slate-100 rounded-xl">
                <button
                  onClick={() => setActiveTab('insights')}
                  className={clsx(
                    "px-4 py-1.5 text-[12px] font-bold rounded-lg transition-all flex items-center gap-2",
                    activeTab === 'insights' ? "bg-white text-[#004ac6] shadow-sm border border-slate-100" : "text-[#565e74] hover:text-[#004ac6]"
                  )}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  Insights
                </button>
                <button
                  onClick={() => setActiveTab('broadcaster')}
                  className={clsx(
                    "px-4 py-1.5 text-[12px] font-bold rounded-lg transition-all flex items-center gap-2",
                    activeTab === 'broadcaster' ? "bg-white text-[#004ac6] shadow-sm border border-slate-100" : "text-[#565e74] hover:text-[#004ac6]"
                  )}
                >
                  <Bell className="w-3.5 h-3.5" />
                  Broadcaster
                </button>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            {activeTab === 'insights' ? (
              <>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="bg-white border border-slate-200 text-[#565e74] px-4 py-2 rounded-lg font-bold text-[13px] outline-none hover:border-slate-300 transition-all cursor-pointer"
                >
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="90d">Last 3 Months</option>
                  <option value="1y">Last Year</option>
                </select>
                <button 
                  onClick={() => fetchDashboardData()}
                  className="bg-white border border-slate-200 text-[#565e74] px-5 py-2 rounded-lg flex items-center gap-2 transition-all font-bold text-[14px] hover:bg-slate-50"
                >
                  <RefreshCw className={clsx("w-4 h-4", loading && "animate-spin")} />
                  Sync
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => handleExport('pdf')}
                  className="bg-white border border-slate-200 text-[#565e74] px-5 py-2 rounded-lg flex items-center gap-2 transition-all font-bold text-[14px] hover:bg-slate-50"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="bg-[#004ac6] hover:bg-[#003ea8] text-white px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all font-bold text-[14px]"
                >
                  <Plus className="w-4 h-4" />
                  New Notice
                </button>
              </>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'insights' ? (
            <motion.div
              key="insights"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Total Notices", value: stats.totalNotices, icon: Bell, color: "text-blue-600", bg: "bg-blue-50", trend: stats.monthlyGrowth },
                  { label: "Active Notices", value: stats.activeNotices, icon: Activity, color: "text-green-600", bg: "bg-green-50" },
                  { label: "Total Reach", value: stats.totalViews.toLocaleString(), icon: Eye, color: "text-amber-600", bg: "bg-amber-50" },
                  { label: "Engagement Velocity", value: `${stats.avgEngagement}%`, icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50" }
                ].map((stat, idx) => (
                  <div key={idx} className="bg-white rounded-xl border border-slate-100 p-6 group transition-all hover:border-slate-200">
                    <div className="flex justify-between items-start mb-4">
                      <div className={clsx("p-2 rounded-lg", stat.bg)}>
                        <stat.icon className={clsx("w-4 h-4", stat.color)} />
                      </div>
                      <ArrowUpRight className="w-3 h-3 text-slate-300 group-hover:text-slate-400" />
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-2xl font-bold text-[#0b1c30]">{stat.value}</h3>
                      {stat.trend !== undefined && (
                        <span className={clsx("text-[10px] font-bold", stat.trend > 0 ? "text-green-600" : "text-red-600")}>
                          {stat.trend > 0 ? "+" : ""}{stat.trend}%
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Analytics Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-slate-100 p-6">
                  <h3 className="text-[14px] font-bold text-[#0b1c30] mb-6 flex items-center gap-2">
                    <PieChartIcon className="w-4 h-4 text-[#004ac6]" />
                    Distribution Matrix
                  </h3>
                  <div className="space-y-4">
                    {(stats.categoryDistribution && stats.categoryDistribution.length > 0) ? (
                      stats.categoryDistribution.map((item, i) => {
                        const colors = [
                          'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-slate-500',
                          'bg-pink-500', 'bg-indigo-500', 'bg-cyan-500', 'bg-emerald-500', 'bg-orange-500'
                        ];
                        const color = colors[i % colors.length];
                        return (
                          <div key={i}>
                            <div className="flex justify-between text-[12px] font-bold mb-1.5">
                              <span className="text-slate-500">{item.label}</span>
                              <span className="text-[#0b1c30]">{item.pct}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }} animate={{ width: `${item.pct}%` }}
                                className={clsx("h-full rounded-full", color)} 
                              />
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8 text-slate-400 text-xs font-bold uppercase tracking-widest">No Category Data</div>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-100 p-6">
                  <h3 className="text-[14px] font-bold text-[#0b1c30] mb-6 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-[#004ac6]" />
                    Audience Segment Analytics
                  </h3>
                  <div className="space-y-6">
                    {(stats.audienceDistribution && stats.audienceDistribution.length > 0) ? (
                      stats.audienceDistribution.map((item, i) => {
                        const colors = ['bg-[#004ac6]', 'bg-emerald-600', 'bg-amber-500', 'bg-purple-600', 'bg-rose-500'];
                        const color = colors[i % colors.length];
                        return (
                          <div key={i}>
                            <div className="flex justify-between text-[12px] font-bold mb-2">
                              <span className="text-slate-500 uppercase tracking-tight">{item.label}</span>
                              <span className="text-[#0b1c30]">{item.pct}%</span>
                            </div>
                            <div className="h-2 w-full bg-slate-50 rounded-lg overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }} animate={{ width: `${item.pct}%` }}
                                className={clsx("h-full rounded-lg", color)} 
                              />
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8 text-slate-400 text-xs font-bold uppercase tracking-widest">No Audience Data</div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="broadcaster"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Control Bar */}
              <div className="bg-white rounded-xl border border-slate-100 p-3 flex flex-col md:flex-row items-center gap-4">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search by title, category or audience segment..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-lg text-[13px] outline-none focus:bg-white focus:ring-1 focus:ring-[#004ac6] transition-all"
                  />
                </div>
                <div className="flex items-center gap-1 p-1 bg-slate-50 border border-slate-100 rounded-lg">
                  {['all', 'draft', 'published', 'scheduled', 'archived'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setStatusFilter(f)}
                      className={clsx(
                        "px-4 py-1.5 text-[12px] font-bold rounded-md transition-all capitalize",
                        statusFilter === f ? "bg-white text-[#004ac6] shadow-sm border border-slate-100" : "text-[#565e74] hover:text-[#004ac6]"
                      )}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Registry Table */}
              <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-50">
                    <thead className="bg-slate-50/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-[11px] font-bold text-[#565e74] uppercase tracking-wider">Bulletin Information</th>
                        <th className="px-6 py-4 text-left text-[11px] font-bold text-[#565e74] uppercase tracking-wider">Targeting</th>
                        <th className="px-6 py-4 text-left text-[11px] font-bold text-[#565e74] uppercase tracking-wider">Node Status</th>
                        <th className="px-6 py-4 text-left text-[11px] font-bold text-[#565e74] uppercase tracking-wider">Temporal Data</th>
                        <th className="px-6 py-4 text-right text-[11px] font-bold text-[#565e74] uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {notices.map((notice) => (
                        <tr key={notice.id} className="hover:bg-slate-50/50 transition-all group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-[#004ac6]">
                                <Bell className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[14px] font-bold text-[#0b1c30] truncate max-w-[300px]">{notice.title}</p>
                                <p className="text-[11px] text-slate-500 font-medium uppercase tracking-tighter">{notice.category}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-0.5 bg-slate-50 text-slate-600 rounded text-[10px] font-bold uppercase tracking-tighter border border-slate-100">
                              {notice.audience_type}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={clsx(
                              "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tighter",
                              notice.status === 'published' ? "bg-green-50 text-green-700" :
                              notice.status === 'scheduled' ? "bg-blue-50 text-blue-700" :
                              notice.status === 'draft' ? "bg-yellow-50 text-yellow-700" : "bg-slate-50 text-slate-500"
                            )}>
                              {notice.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-[12px] font-bold text-[#0b1c30]">{new Date(notice.created_at).toLocaleDateString()}</p>
                            <p className="text-[10px] text-slate-400 font-medium tracking-tighter">Verified by {notice.createdByName}</p>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => { setSelectedNotice(notice); setShowViewModal(true); }}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-all text-slate-400 hover:text-[#004ac6]"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => { setSelectedNotice(notice); setShowEditModal(true); }}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-all text-slate-400 hover:text-[#004ac6]"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDelete(String(notice.id))}
                                className="p-2 hover:bg-red-50 rounded-lg transition-all text-slate-400 hover:text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Pagination */}
                <div className="px-6 py-4 bg-slate-50/50 flex items-center justify-between border-t border-slate-50">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Page {currentPage} of {totalPages}</p>
                  <div className="flex gap-2">
                    <button 
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
                    >
                      <ChevronLeft className="w-4 h-4 text-slate-600" />
                    </button>
                    <button 
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
                    >
                      <ChevronRight className="w-4 h-4 text-slate-600" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals Pattern */}
      <AnimatePresence>
        {(showViewModal || showEditModal || showCreateModal) && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0b1c30]/10 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]"
            >
              <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                <div>
                  <h3 className="text-[20px] font-bold text-[#0b1c30]">
                    {showCreateModal ? 'Create Notice' : showEditModal ? 'Edit Notice' : 'Notice Details'}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">
                    {selectedNotice ? `Notice ID: #${selectedNotice.id}` : 'Draft Protocol'}
                  </p>
                </div>
                <button 
                  onClick={() => { setShowViewModal(false); setShowEditModal(false); setShowCreateModal(false); }} 
                  className="p-2 hover:bg-white rounded-lg transition-all"
                >
                  <X className="w-5 h-5 text-slate-300" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto custom-scrollbar">
                {showViewModal && selectedNotice && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-3 gap-6">
                       <div className="col-span-2 space-y-6">
                         <div>
                            <h4 className="text-[24px] font-black text-[#0b1c30] tracking-tight">{selectedNotice.title}</h4>
                            <div className="flex gap-2 mt-2">
                               <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded uppercase border border-blue-100">{selectedNotice.category}</span>
                               <span className="px-2 py-0.5 bg-slate-50 text-slate-600 text-[10px] font-bold rounded uppercase border border-slate-100">{selectedNotice.audience_type}</span>
                               {selectedNotice.priority && (
                                 <span className={clsx(
                                   "px-2 py-0.5 rounded text-[10px] font-bold uppercase border",
                                   selectedNotice.priority === 'urgent' ? "bg-red-50 text-red-700 border-red-100" :
                                   selectedNotice.priority === 'high' ? "bg-amber-50 text-amber-700 border-amber-100" :
                                   selectedNotice.priority === 'medium' ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-green-50 text-green-700 border-green-100"
                                 )}>
                                   {selectedNotice.priority}
                                 </span>
                               )}
                            </div>
                         </div>
                         <div className="prose prose-slate max-w-none text-[14px] leading-relaxed text-slate-600 font-medium" dangerouslySetInnerHTML={{ __html: selectedNotice.description }} />
                       </div>
                       <div className="space-y-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-100 h-fit">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Metrics</p>
                            <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100">
                               <Eye className="w-4 h-4 text-blue-600" />
                               <div>
                                  <p className="text-[14px] font-bold text-[#0b1c30]">{selectedNotice.views}</p>
                                  <p className="text-[9px] text-slate-400 font-bold uppercase">Subscriber Reach</p>
                               </div>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Authorization</p>
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-[11px]">{selectedNotice.createdByName?.[0]}</div>
                               <div>
                                  <p className="text-[12px] font-bold text-[#0b1c30]">{selectedNotice.createdByName}</p>
                                  <p className="text-[10px] text-slate-400 font-medium">{new Date(selectedNotice.created_at).toLocaleDateString()}</p>
                               </div>
                            </div>
                          </div>
                       </div>
                    </div>
                    {selectedNotice.attachments && selectedNotice.attachments.length > 0 && (
                      <div className="space-y-4">
                        <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Artifacts ({selectedNotice.attachments.length})</h5>
                        <div className="grid grid-cols-2 gap-4">
                          {selectedNotice.attachments.map((file, i) => (
                            <a key={i} href={file.file_url} target="_blank" className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between group hover:border-[#004ac6]/20 transition-all shadow-sm">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-blue-50 transition-all"><FileText className="w-4 h-4 text-[#004ac6]" /></div>
                                <p className="text-[13px] font-bold text-slate-700 truncate max-w-[200px]">{file.file_name}</p>
                              </div>
                              <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-[#004ac6]" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {(showEditModal || showCreateModal) && (
                  <NoticeForm 
                    societyId={societyId}
                    editMode={showEditModal}
                    noticeId={selectedNotice ? String(selectedNotice.id) : undefined}
                    initialData={selectedNotice}
                    onSuccess={() => { setShowEditModal(false); setShowCreateModal(false); fetchNotices(); }}
                    onCancel={() => { setShowEditModal(false); setShowCreateModal(false); }}
                  />
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
};

export default NoticeManagement;