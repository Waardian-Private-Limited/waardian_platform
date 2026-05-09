"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import {
  Package, Clock, History, Calendar, RefreshCw,
  TrendingUp, TrendingDown, IndianRupee, MapPin,
  CheckCircle2, AlertCircle, Wrench, Boxes, ChevronRight,
  Zap, X, User, CheckCircle, Activity,
  FileText, ArrowDownRight, ArrowUpRight,
  PieChart as PieChartIcon
} from 'lucide-react';
import { getAllBookings, getDashboardSummary, AssetBooking } from '@/lib/apiClient';
import { toast } from 'react-hot-toast';
import { format, isValid } from 'date-fns';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';

const COLORS = ['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#65a30d', '#ea580c'];

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
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-none border border-slate-200 p-5 hover:border-blue-200 transition-colors group"
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
        {trend && trendValue && (
          <div className={`flex items-center mt-2 text-xs ${trend === 'up' ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trend === 'up' ? <TrendingUp className="w-3.5 h-3.5 mr-1" /> : <TrendingDown className="w-3.5 h-3.5 mr-1" />}
            <span className="font-medium">{trendValue}</span>
          </div>
        )}
      </div>
      <div className={clsx(
        "p-3 rounded-none transition-all group-hover:scale-105",
        color === 'blue' ? 'bg-blue-50 text-blue-600' :
          color === 'green' ? 'bg-emerald-50 text-emerald-600' :
            color === 'yellow' ? 'bg-amber-50 text-amber-600' :
              'bg-rose-50 text-rose-600'
      )}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  </motion.div>
);

export default function AssetDashboard() {
  const [bookings, setBookings] = useState<AssetBooking[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<AssetBooking | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const router = useRouter();

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [bookingsRes, summaryRes] = await Promise.all([
        getAllBookings(),
        getDashboardSummary()
      ]);
      if (bookingsRes.success) setBookings(bookingsRes.data || []);
      if (summaryRes.success) setSummary(summaryRes.data);
    } catch {
      toast.error('Dashboard synchronization failure');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const categoryData = useMemo(() => {
    if (!summary?.category_distribution) return [];
    return Object.entries(summary.category_distribution).map(([name, value]) => ({ name, value }));
  }, [summary]);

  const valueTrendData = useMemo(() => {
    if (!summary?.value_trend) return [];
    return summary.value_trend;
  }, [summary]);

  const statusData = useMemo(() => {
    if (!summary?.status_summary) return [];
    return [
      { name: 'Active', value: summary.status_summary.operational, color: '#10b981' },
      { name: 'Servicing', value: summary.status_summary.maintenance, color: '#f59e0b' },
      { name: 'Inoperative', value: summary.status_summary.damaged, color: '#ef4444' }
    ].filter(d => d.value > 0);
  }, [summary]);

  const totalPages = Math.ceil(bookings.length / itemsPerPage);
  const paginatedBookings = bookings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-6">
        <RefreshCw className="animate-spin text-blue-600" size={48} />
        <p className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em] animate-pulse">Syncing Intelligence Matrix...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 font-sans">
      {/* Strategic Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 rounded-none border border-slate-200">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">

            <h2 className="text-xl font-bold text-slate-900 tracking-tight">ASSET INTELLIGENCE</h2>
          </div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider pl-1">Consolidated Performance & Logistics Analytics</p>
        </div>
      </div>

      {/* Primary KPI Mesh */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Inventory" value={summary?.stats?.total_assets || 0} icon={Package} trend="up" trendValue="+4.2%" color="blue" />
        <StatCard title="Fiscal Net Value" value={`₹${((summary?.stats?.total_value || 0) / 100000).toFixed(1)}L`} icon={IndianRupee} trend="up" trendValue="+2.1%" color="green" />
        <StatCard title="Active Maintenance" value={summary?.stats?.pending_service || 0} icon={Wrench} trend="down" trendValue="-12%" color="yellow" />
        <StatCard title="Logistics Health" value="94.8%" icon={CheckCircle2} trend="up" trendValue="+0.4%" color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Resource Allocation Map */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white p-6 rounded-none border border-slate-200 min-h-[400px] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-blue-50 text-blue-600 rounded-none flex items-center justify-center">
                  <TrendingUp size={16} />
                </div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Acquisition Dynamics</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-blue-600 rounded-none" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Investment (₹)</span>
              </div>
            </div>
            <div className="h-[300px] w-full">
              {valueTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={valueTrendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }} />
                    <Tooltip
                      cursor={{ fill: '#f8fafc' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-3 rounded-none shadow-lg border border-slate-200 text-xs">
                              <p className="font-bold text-slate-500 mb-1">{payload[0].payload.month}</p>
                              <p className="font-bold text-slate-900">₹{payload[0].value?.toLocaleString()}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="value" fill="#2563eb" barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex items-center justify-center border border-dashed border-slate-200 bg-slate-50">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No investment data available</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-none border border-slate-200 min-h-[500px] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-blue-50 text-blue-600 rounded-none flex items-center justify-center">
                  <Calendar size={16} />
                </div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">RESERVATION LEDGER</h3>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{bookings.length} TOTAL ENTRIES</span>
            </div>

            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Asset Descriptor</th>
                    <th className="px-6 py-4">Occupant</th>
                    <th className="px-6 py-4">Timeline</th>
                    <th className="px-6 py-4">Protocol</th>
                    <th className="px-6 py-4 text-right">Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedBookings.map((booking, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-slate-50 rounded-none flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                            <Package size={16} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900 tracking-tight">{booking.asset_name}</p>
                            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{booking.asset_category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-semibold text-slate-700">{booking.resident_name || booking.user_name || `${booking.first_name || ''} ${booking.last_name || ''}`.trim() || 'N/A'}</p>
                        <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mt-0.5">U-{booking.unit_number || 'N/A'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-semibold text-slate-900 tabular-nums">{format(new Date(booking.start_time), 'MMM dd, HH:mm')}</p>
                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">START SEQUENCE</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={clsx(
                          "px-2 py-0.5 rounded-none text-[9px] font-bold uppercase tracking-wider border",
                          booking.status === 'confirmed' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
                        )}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => { setSelectedBooking(booking); setIsDrawerOpen(true); }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white border border-transparent hover:border-slate-200 rounded-none transition-all"
                        >
                          <ChevronRight size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Page {currentPage} of {totalPages}</p>
              <div className="flex gap-1.5">
                <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 bg-white border border-slate-200 rounded-none text-slate-400 hover:text-blue-600 disabled:opacity-30 transition-all">
                  <X size={16} className="rotate-180" />
                </button>
                <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 bg-white border border-slate-200 rounded-none text-slate-400 hover:text-blue-600 disabled:opacity-30 transition-all">
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Intelligence Side Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-none border border-slate-200 min-h-[380px] flex flex-col">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-7 h-7 bg-blue-50 text-blue-600 rounded-none flex items-center justify-center">
                <Boxes size={16} />
              </div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Classification Mesh</h3>
            </div>
            <div className="h-[220px] w-full">
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value">
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="white" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-3 rounded-none shadow-lg border border-slate-200 text-xs">
                              <p className="font-bold text-slate-500 mb-1">{payload[0].name}</p>
                              <p className="font-bold text-slate-900">{payload[0].value} UNITS</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex items-center justify-center border border-dashed border-slate-200 bg-slate-50">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No category data</p>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {categoryData.slice(0, 4).map((cat, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-none" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-[10px] font-bold text-slate-500 uppercase truncate tracking-tight">{cat.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-none border border-slate-200">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-7 h-7 bg-emerald-50 text-emerald-600 rounded-none flex items-center justify-center">
                <Activity size={16} />
              </div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Tactical Status</h3>
            </div>
            <div className="space-y-5">
              {statusData.length > 0 ? (
                statusData.map((s, i) => (
                  <div key={i} className="flex flex-col gap-2">
                    <div className="flex justify-between items-center px-0.5">
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">{s.name} Protocol</span>
                      <span className="text-[10px] font-bold tabular-nums" style={{ color: s.color }}>{s.value} UNITS</span>
                    </div>
                    <div className="h-1 bg-slate-100 rounded-none overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(s.value / (summary?.stats?.total_assets || Math.max(...statusData.map(d => d.value)) || 1)) * 100}%` }}
                        className="h-full"
                        style={{ backgroundColor: s.color }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 flex items-center justify-center border border-dashed border-slate-200 bg-slate-50">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No status data available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isDrawerOpen && selectedBooking && (
          <BookingDetailsDrawer
            booking={selectedBooking}
            onClose={() => { setIsDrawerOpen(false); setSelectedBooking(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function BookingDetailsDrawer({ booking, onClose }: { booking: AssetBooking; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="w-full max-w-lg bg-white h-full shadow-2xl relative flex flex-col border-l border-slate-200">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-none flex items-center justify-center text-white shadow-lg shadow-blue-500/10">
              <FileText size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">{booking.asset_name}</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">RESERVATION: RE-{booking.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-none transition-all border border-slate-100 text-slate-400"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          <div className="grid grid-cols-2 gap-6">
            <div className="p-5 bg-slate-50 rounded-none border border-slate-100">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-white border border-slate-200 rounded-none text-blue-600"><User size={12} /></div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Occupant</p>
              </div>
              <p className="text-sm font-bold text-slate-900 uppercase tracking-tight">{booking.resident_name || booking.user_name || `${booking.first_name || ''} ${booking.last_name || ''}`.trim() || 'N/A'}</p>
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">UNIT {booking.unit_number || 'N/A'}</p>
            </div>
            <div className="p-5 bg-slate-50 rounded-none border border-slate-100">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-white border border-slate-200 rounded-none text-blue-600"><MapPin size={12} /></div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sector</p>
              </div>
              <p className="text-sm font-bold text-slate-900 uppercase tracking-tight">{booking.block_wing || 'CENTRAL'}</p>
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">LOGISTICS HUB</p>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-3">Lifecycle Timeline</h3>
            <div className="space-y-4">
              <TimelineStep label="Activation" date={booking.start_time} icon={<ArrowDownRight size={14} />} color="blue" active />
              <TimelineStep label="Termination" date={booking.end_time} icon={<ArrowUpRight size={14} />} color="slate" />
            </div>
          </div>

          <div className="p-6 bg-slate-900 rounded-none text-white relative overflow-hidden group">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-white/10 rounded-none text-blue-400"><IndianRupee size={12} /></div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest">Fiscal Proceeds</h4>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tabular-nums">₹{Number(booking.charge_amount || booking.total_amount || 0).toLocaleString()}</span>
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Logistics Fee</span>
            </div>
          </div>
        </div>

        <div className="p-8 border-t border-slate-100 bg-slate-50/50">
          <button
            className="w-full bg-blue-600 text-white py-3.5 rounded-none font-bold uppercase text-[11px] tracking-wider transition-all hover:bg-slate-900 active:scale-[0.99]"
          >
            Download Manifest
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function TimelineStep({ label, date, icon, color, active = false }: { label: string; date: string; icon: any; color: string; active?: boolean }) {
  return (
    <div className="flex items-center gap-4 group">
      <div className={clsx(
        "w-9 h-9 rounded-none flex items-center justify-center transition-all border",
        active ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-400 border-slate-200"
      )}>
        {icon}
      </div>
      <div>
        <p className={clsx("text-[10px] font-bold uppercase tracking-widest mb-0.5", active ? "text-blue-600" : "text-slate-400")}>{label}</p>
        <p className="text-sm font-bold text-slate-900 tabular-nums">{format(new Date(date), 'dd MMM yyyy, HH:mm')}</p>
      </div>
    </div>
  );
}
