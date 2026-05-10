"use client";

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Calendar,
  Users,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  TrendingUp,
  Vote,
  AlertCircle,
  Play,
  Pause,
  Settings,
  Download,
  Share2,
  Target,
  PieChart as PieChartIcon,
  Activity,
  X,
  Upload,
  LineChart as LineChartIcon,
  RefreshCw,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Zap,
  LayoutGrid,
  List
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { toast } from 'react-hot-toast';

interface Poll {
  id: number;
  title: string;
  description: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  startDate: string;
  endDate: string;
  totalVotes: number;
  totalEligible: number;
  audience: {
    type: string;
    totalEligible: number;
  };
  options: Array<{
    id: string;
    title: string;
    votes: number;
    percentage: number;
  }>;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  resultVisibility: string;
  resultRevealTime?: string | null;
  isAnonymous?: boolean;
  canViewResults?: boolean;
}

export default function VotingDashboard({ societyId }: { societyId: string }) {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'polls' | 'analytics'>('polls');
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchPolls();
  }, [societyId, statusFilter, page, pageSize]);

  useEffect(() => {
    if (activeTab === 'analytics') fetchAnalyticsData();
  }, [activeTab, societyId]);

  const fetchPolls = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await apiClient('/poll', {
        method: 'GET', withAuth: true, params: { page: String(page), limit: String(pageSize), status: statusFilter }
      });
      if (response.status === 'success') {
        const pagination = response.data?.pagination || {};
        setTotalPages(pagination.totalPages || 1);
        setTotalCount(pagination.total || 0);
        const transformed = (response.data?.polls || []).map((poll: any) => ({
          id: poll.id,
          title: poll.title,
          description: poll.description,
          status: poll.computed_status || poll.status,
          startDate: poll.start_date,
          endDate: poll.end_date,
          totalVotes: Number(poll.total_votes || 0),
          totalEligible: poll.total_eligible || 0,
          audience: { type: poll.audience_type || 'Universal', totalEligible: poll.total_eligible || 0 },
          options: (poll.options || []).map((o: any) => ({ ...o, percentage: Number(o.percentage || 0) })),
          createdByName: poll.created_by_name,
          canViewResults: !!poll.can_view_results
        }));
        setPolls(transformed);
      }
    } catch (e) { toast.error('Failed to sync voting records'); } finally { setLoading(false); }
  };

  const fetchAnalyticsData = async () => {
    try {
      setAnalyticsLoading(true);
      const response = await apiClient('/poll/analytics', { method: 'GET', withAuth: true });
      if (response.status === 'success') setAnalyticsData(response.data.analytics);
    } catch (e) { toast.error('Analytics sync failed'); } finally { setAnalyticsLoading(false); }
  };

  if (loading && polls.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-pulse text-slate-400 font-bold uppercase tracking-widest text-xs">Accessing Voting Vault...</div>
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
              <span className="text-[#004ac6]">Democracy</span>
            </nav>
            <h2 className="text-[32px] font-bold leading-tight tracking-tight text-[#0b1c30]">Voting & Polls</h2>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => fetchPolls()}
              className="bg-white border border-slate-200 text-[#565e74] px-5 py-2 rounded-lg flex items-center gap-2 transition-all font-bold text-[14px] hover:bg-slate-50"
            >
              <RefreshCw className={clsx("w-4 h-4", loading && "animate-spin")} />
              Sync
            </button>
            <button className="bg-[#004ac6] hover:bg-[#003ea8] text-white px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all font-bold text-[14px]">
              <Plus className="w-4 h-4" />
              New Poll
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 p-1 bg-slate-50 border border-slate-100 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('polls')}
            className={clsx(
              "px-6 py-2 text-[13px] font-bold rounded-lg transition-all flex items-center gap-2",
              activeTab === 'polls' ? "bg-white text-[#004ac6] shadow-sm" : "text-[#565e74] hover:text-[#004ac6]"
            )}
          >
            <Vote className="w-4 h-4" />
            Polls Registry
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={clsx(
              "px-6 py-2 text-[13px] font-bold rounded-lg transition-all flex items-center gap-2",
              activeTab === 'analytics' ? "bg-white text-[#004ac6] shadow-sm" : "text-[#565e74] hover:text-[#004ac6]"
            )}
          >
            <BarChart3 className="w-4 h-4" />
            Voter Insights
          </button>
        </div>

        {activeTab === 'polls' ? (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Polls", value: totalCount, icon: Vote, color: "text-blue-600", bg: "bg-blue-50" },
                { label: "Active Sessions", value: polls.filter(p => p.status === 'active').length, icon: Activity, color: "text-green-600", bg: "bg-green-50" },
                { label: "Finalized", value: polls.filter(p => p.status === 'completed').length, icon: CheckCircle, color: "text-slate-600", bg: "bg-slate-50" },
                { label: "Scheduled", value: polls.filter(p => p.status === 'scheduled').length, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" }
              ].map((stat, idx) => (
                <div key={idx} className="bg-white rounded-xl border border-slate-100 p-6 group transition-all hover:border-slate-200">
                  <div className="flex justify-between items-start mb-4">
                    <div className={clsx("p-2 rounded-lg", stat.bg)}>
                      <stat.icon className={clsx("w-4 h-4", stat.color)} />
                    </div>
                    <ArrowUpRight className="w-3 h-3 text-slate-300 group-hover:text-slate-400" />
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                  <h3 className="text-2xl font-bold text-[#0b1c30]">{stat.value}</h3>
                </div>
              ))}
            </div>

            {/* Control Bar */}
            <div className="bg-white rounded-xl border border-slate-100 p-3 flex flex-col md:flex-row items-center gap-4">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by poll title or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-lg text-[13px] outline-none focus:bg-white focus:ring-1 focus:ring-[#004ac6] transition-all"
                />
              </div>
              <div className="flex items-center gap-1 p-1 bg-slate-50 border border-slate-100 rounded-lg">
                {['all', 'active', 'completed', 'scheduled', 'cancelled'].map((f) => (
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

            {/* Poll Registry Table */}
            <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-50">
                  <thead className="bg-slate-50/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-[11px] font-bold text-[#565e74] uppercase tracking-wider">Poll Initiative</th>
                      <th className="px-6 py-4 text-left text-[11px] font-bold text-[#565e74] uppercase tracking-wider">Participation</th>
                      <th className="px-6 py-4 text-left text-[11px] font-bold text-[#565e74] uppercase tracking-wider">Timeline</th>
                      <th className="px-6 py-4 text-left text-[11px] font-bold text-[#565e74] uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-right text-[11px] font-bold text-[#565e74] uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {polls.map((poll) => {
                      const participationPct = poll.totalEligible > 0 ? (poll.totalVotes / poll.totalEligible) * 100 : 0;
                      return (
                        <tr key={poll.id} className="hover:bg-slate-50/50 transition-all group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-[#004ac6]">
                                <Vote className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[14px] font-bold text-[#0b1c30] truncate max-w-[250px]">{poll.title}</p>
                                <p className="text-[11px] text-slate-500 font-medium uppercase tracking-tighter italic">{poll.audience.type}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                               <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <motion.div 
                                    initial={{ width: 0 }} animate={{ width: `${participationPct}%` }}
                                    className={clsx("h-full rounded-full", participationPct > 70 ? "bg-emerald-500" : participationPct > 30 ? "bg-blue-500" : "bg-slate-400")} 
                                  />
                               </div>
                               <p className="text-[12px] font-bold text-[#0b1c30]">{participationPct.toFixed(0)}%</p>
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium tracking-tighter mt-1">{poll.totalVotes} / {poll.totalEligible} Ballots</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-[12px] font-bold text-[#0b1c30]">{new Date(poll.startDate).toLocaleDateString()} - {new Date(poll.endDate).toLocaleDateString()}</p>
                            <p className="text-[10px] text-slate-400 font-medium tracking-tighter uppercase">Closing in {Math.ceil((new Date(poll.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} Days</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className={clsx(
                              "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tighter",
                              poll.status === 'active' ? "bg-green-50 text-green-700 animate-pulse" :
                              poll.status === 'completed' ? "bg-blue-50 text-blue-700" :
                              poll.status === 'scheduled' ? "bg-yellow-50 text-yellow-700" : "bg-red-50 text-red-700"
                            )}>
                              {poll.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button className="p-2 hover:bg-slate-100 rounded-lg transition-all text-slate-400 hover:text-[#004ac6]"><Eye className="w-4 h-4" /></button>
                              <button className="p-2 hover:bg-slate-100 rounded-lg transition-all text-slate-400 hover:text-[#004ac6]"><Edit className="w-4 h-4" /></button>
                              <button className="p-2 hover:bg-red-50 rounded-lg transition-all text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              <div className="px-6 py-4 bg-slate-50/50 flex items-center justify-between border-t border-slate-50">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Page {page} of {totalPages}</p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"><ChevronLeft className="w-4 h-4 text-slate-600" /></button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"><ChevronRight className="w-4 h-4 text-slate-600" /></button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Analytics Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <div className="bg-white rounded-xl border border-slate-100 p-6">
                  <h3 className="text-[14px] font-bold text-[#0b1c30] mb-6 flex items-center gap-2 uppercase tracking-widest">
                    <TrendingUp className="w-4 h-4 text-[#004ac6]" />
                    Participation Velocity
                  </h3>
                  <div className="h-64">
                    {analyticsData?.participationTrends ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={analyticsData.participationTrends}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            itemStyle={{ fontSize: '12px', fontWeight: 700 }}
                          />
                          <Line type="monotone" dataKey="participants" stroke="#004ac6" strokeWidth={3} dot={{ r: 4, fill: '#004ac6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : <div className="h-full flex items-center justify-center text-slate-300 font-bold uppercase text-[10px]">Insufficient Data for Trend Analysis</div>}
                  </div>
               </div>

               <div className="bg-white rounded-xl border border-slate-100 p-6">
                  <h3 className="text-[14px] font-bold text-[#0b1c30] mb-6 flex items-center gap-2 uppercase tracking-widest">
                    <PieChartIcon className="w-4 h-4 text-[#004ac6]" />
                    Status Distribution
                  </h3>
                  <div className="h-64">
                    {analyticsData?.statusDistribution ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={Object.entries(analyticsData.statusDistribution).map(([name, value]) => ({ name, value }))}
                            innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"
                          >
                            {Object.entries(analyticsData.statusDistribution).map(([status], i) => (
                              <Cell key={i} fill={status === 'active' ? '#10B981' : status === 'completed' ? '#3B82F6' : '#F59E0B'} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend verticalAlign="bottom" height={36} formatter={(value) => <span className="text-[11px] font-bold uppercase text-slate-500">{value}</span>} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : <div className="h-full flex items-center justify-center text-slate-300 font-bold uppercase text-[10px]">Matrix Serialization Pending</div>}
                  </div>
               </div>
            </div>
            
            {/* Top Engagement Polls */}
            <div className="bg-white rounded-xl border border-slate-100 p-6">
               <h3 className="text-[14px] font-bold text-[#0b1c30] mb-6 flex items-center gap-2 uppercase tracking-widest">
                 <Zap className="w-4 h-4 text-amber-500" />
                 High Engagement Polls
               </h3>
               <div className="space-y-4">
                  {polls.slice(0, 3).map((poll, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-100 font-black text-[#0b1c30] text-[14px]">#{i+1}</div>
                          <div>
                             <p className="text-[14px] font-bold text-[#0b1c30]">{poll.title}</p>
                             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{poll.totalVotes} Verified Ballots Cast</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-[16px] font-black text-[#004ac6]">{((poll.totalVotes / poll.totalEligible) * 100).toFixed(1)}%</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase">Turnout</p>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}