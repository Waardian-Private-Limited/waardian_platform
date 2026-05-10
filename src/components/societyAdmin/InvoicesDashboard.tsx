"use client";

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
  PieChart as PieChartIcon,
  Activity,
  Eye,
  Users,
  CheckCircle,
  Target,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  X,
  Plus,
  LayoutGrid,
  BarChart2
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, PieChart, Cell, Pie, Legend, AreaChart, Area
} from 'recharts';
import { apiClient } from '@/lib/apiClient';
import { getAllFlats, FlatWithLocation } from '@/lib/societyAdminClient';
import { toast } from 'react-hot-toast';
import clsx from 'clsx';

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
}

const InvoicesDashboard: React.FC<{ societyId: string }> = ({ societyId }) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAnalytics();
  }, [societyId]);

  const fetchAnalytics = async () => {
    try {
      setRefreshing(true);
      const response = await apiClient(`/billing/analytics`, { withAuth: true });
      if (response.success) setAnalytics(response.analytics);
    } catch (e) { toast.error('Analytics sync failed'); } finally { setLoading(false); setRefreshing(false); }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-pulse text-slate-400 font-bold uppercase tracking-widest text-xs">Synchronizing Financial Ledger...</div>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <main className="flex-1 bg-white text-[#0b1c30] antialiased p-8 font-['Manrope',_sans-serif]">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex justify-between items-end">
          <div>
            <nav className="flex gap-2 text-[12px] font-bold text-[#565e74] mb-2 uppercase tracking-wide">
              <span>Management</span>
              <span>/</span>
              <span className="text-[#004ac6]">Billing</span>
            </nav>
            <h2 className="text-[32px] font-bold leading-tight tracking-tight text-[#0b1c30]">Billing Analytics</h2>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => fetchAnalytics()}
              className="bg-white border border-slate-200 text-[#565e74] px-5 py-2 rounded-lg flex items-center gap-2 transition-all font-bold text-[14px] hover:bg-slate-50"
            >
              <RefreshCw className={clsx("w-4 h-4", refreshing && "animate-spin")} />
              Sync
            </button>
            <button className="bg-[#004ac6] hover:bg-[#003ea8] text-white px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all font-bold text-[14px]">
              <Download className="w-4 h-4" />
              Export Report
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Billed", value: analytics.summary.totalAmount, icon: DollarSign, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Collections", value: analytics.summary.paidAmount, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Outstanding", value: analytics.summary.dueAmount, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
            { label: "Overdue", value: analytics.summary.overdueAmount, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" }
          ].map((stat, idx) => (
            <div key={idx} className="bg-white rounded-xl border border-slate-100 p-6 group transition-all hover:border-slate-200">
              <div className="flex justify-between items-start mb-4">
                <div className={clsx("p-2 rounded-lg", stat.bg)}>
                  <stat.icon className={clsx("w-4 h-4", stat.color)} />
                </div>
                <ArrowUpRight className="w-3 h-3 text-slate-300 group-hover:text-slate-400" />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className="text-2xl font-bold text-[#0b1c30]">{formatCurrency(stat.value)}</h3>
            </div>
          ))}
        </div>

        {/* Secondary Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {/* Collection Velocity */}
           <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 p-6">
              <h3 className="text-[14px] font-bold text-[#0b1c30] mb-6 flex items-center gap-2 uppercase tracking-widest">
                <TrendingUp className="w-4 h-4 text-[#004ac6]" />
                Collection Velocity
              </h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={Object.entries(analytics.monthlyTrends).map(([month, d]) => ({ month, amount: d.paidAmount }))}>
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#004ac6" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#004ac6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      formatter={(v: number) => [formatCurrency(v), 'Collected']}
                    />
                    <Area type="monotone" dataKey="amount" stroke="#004ac6" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
           </div>

           {/* Status Breakdown */}
           <div className="bg-white rounded-xl border border-slate-100 p-6">
              <h3 className="text-[14px] font-bold text-[#0b1c30] mb-6 flex items-center gap-2 uppercase tracking-widest">
                <PieChartIcon className="w-4 h-4 text-[#004ac6]" />
                Settlement Status
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Paid', value: analytics.statusBreakdown.paid.amount, color: '#10B981' },
                        { name: 'Due', value: analytics.statusBreakdown.due.amount, color: '#3B82F6' },
                        { name: 'Overdue', value: analytics.statusBreakdown.overdue.amount, color: '#EF4444' }
                      ]}
                      innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"
                    >
                      { [0,1,2].map((_, i) => <Cell key={i} fill={['#10B981', '#3B82F6', '#EF4444'][i]} />) }
                    </Pie>
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Legend verticalAlign="bottom" height={36} formatter={(v) => <span className="text-[10px] font-bold uppercase text-slate-500">{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-50 space-y-3">
                 <div className="flex justify-between items-center text-[12px] font-bold">
                    <span className="text-slate-500">Collection Rate</span>
                    <span className="text-emerald-600">{analytics.summary.collectionRate}%</span>
                 </div>
                 <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${analytics.summary.collectionRate}%` }} className="h-full bg-emerald-500 rounded-full" />
                 </div>
              </div>
           </div>
        </div>

        {/* Wing-wise & Category-wise Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <div className="bg-white rounded-xl border border-slate-100 p-6">
              <h3 className="text-[14px] font-bold text-[#0b1c30] mb-6 flex items-center gap-2 uppercase tracking-widest">
                <Building2 className="w-4 h-4 text-[#004ac6]" />
                Wing Matrix
              </h3>
              <div className="space-y-4">
                 {Object.entries(analytics.wingWiseCollection).map(([wing, data], i) => (
                   <div key={i}>
                      <div className="flex justify-between text-[11px] font-bold mb-1.5 uppercase">
                         <span className="text-slate-500">Wing {wing}</span>
                         <span className="text-[#0b1c30]">{data.collectionRate}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden flex">
                         <div className="h-full bg-emerald-500" style={{ width: `${data.collectionRate}%` }} />
                         <div className="h-full bg-slate-200" style={{ width: `${100 - data.collectionRate}%` }} />
                      </div>
                      <div className="flex justify-between mt-1 text-[10px] font-medium text-slate-400">
                         <span>{formatCurrency(data.paidAmount)} Collected</span>
                         <span>{formatCurrency(data.totalAmount)} Target</span>
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           <div className="bg-white rounded-xl border border-slate-100 p-6">
              <h3 className="text-[14px] font-bold text-[#0b1c30] mb-6 flex items-center gap-2 uppercase tracking-widest">
                <BarChart2 className="w-4 h-4 text-[#004ac6]" />
                Classification Breakdown
              </h3>
              <div className="space-y-4">
                 {Object.entries(analytics.categoryWiseBreakdown).map(([cat, data], i) => (
                   <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div>
                         <p className="text-[12px] font-bold text-[#0b1c30] capitalize">{cat}</p>
                         <p className="text-[10px] text-slate-400 font-medium">{data.invoiceCount} Ledger Entries</p>
                      </div>
                      <div className="text-right">
                         <p className="text-[14px] font-bold text-[#0b1c30]">{formatCurrency(data.totalAmount)}</p>
                         <p className="text-[10px] text-emerald-600 font-bold">{((data.paidAmount/data.totalAmount)*100).toFixed(0)}% Clear</p>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </main>
  );
};

export default InvoicesDashboard;