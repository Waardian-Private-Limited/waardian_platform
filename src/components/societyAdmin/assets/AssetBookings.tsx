'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { format, isValid, startOfMonth, subMonths, startOfYear, isWithinInterval } from 'date-fns';
import {
   Calendar, Search, Clock, User, X,
   IndianRupee, History, ChevronRight,
   ShieldCheck, ArrowUpRight, Zap,
   RefreshCw, Package, AlertCircle, ChevronLeft,
   XCircle, CheckCircle, LogOut, LogIn, ClipboardCheck, ArrowDownRight,
   Download, ListFilter, Trash2, TrendingUp, Boxes
} from 'lucide-react';
import { getAllBookings, updateBookingStatus, AssetBooking, recordHandover } from '@/lib/apiClient';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

// --- Shared Design System Components ---

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
      className="bg-white rounded-none border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all group"
   >
      <div className="flex items-center justify-between">
         <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5">{title}</p>
            <p className="text-xl font-bold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">{value}</p>
            {trendValue && (
               <div className="flex items-center mt-2 text-[9px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-none border border-emerald-100 w-fit">
                  {trend === 'up' ? <TrendingUp size={10} className="mr-1" /> : <ArrowDownRight size={10} className="mr-1" />}
                  {trendValue}
               </div>
            )}
         </div>
         <div className={clsx(
            "p-3 rounded-none border shadow-sm transition-transform group-hover:scale-105",
            color === 'blue' ? 'bg-blue-50 text-blue-600 border-blue-100' :
               color === 'green' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                  color === 'yellow' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                     'bg-red-50 text-red-600 border-red-100'
         )}>
            <Icon className="w-5 h-5" />
         </div>
      </div>
   </motion.div>
);

const FinancialStatCard = ({ title, value, label, icon, color }: { title: string; value: string; label: string; icon: React.ReactNode; color: string }) => (
   <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-none border border-slate-200 shadow-sm hover:shadow-md transition-all group flex flex-col"
   >
      <div className="flex items-center justify-between mb-4">
         <div className={clsx(
            "w-10 h-10 rounded-none flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm border",
            color === 'blue' ? "bg-blue-50 text-blue-600 border-blue-100" :
               color === 'red' ? "bg-red-50 text-red-600 border-red-100" :
                  "bg-emerald-50 text-emerald-600 border-emerald-100"
         )}>
            {icon}
         </div>
         <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{title}</span>
      </div>
      <div className="mt-auto">
         <p className={clsx(
            "text-xl font-bold tracking-tight",
            color === 'red' ? "text-red-700" : color === 'emerald' ? "text-emerald-700" : "text-slate-900"
         )}>{value}</p>
         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 opacity-80">{label}</p>
      </div>
   </motion.div>
);

// --- Helper Components & Functions ---

function formatDateSafe(date: string | Date | null | undefined) {
   if (!date) return 'Awaiting...';
   const d = new Date(date);
   if (!isValid(d)) return 'Invalid Date';
   return format(d, 'MMM dd, HH:mm');
}

export default function AssetBookings() {
   const [bookings, setBookings] = useState<AssetBooking[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [searchQuery, setSearchQuery] = useState('');
   const [statusFilter, setStatusFilter] = useState('All');
   const [selectedBooking, setSelectedBooking] = useState<AssetBooking | null>(null);
   const [isDrawerOpen, setIsDrawerOpen] = useState(false);
   const [activeView, setActiveView] = useState<'log' | 'financials'>('log');
   const [reportPeriod, setReportPeriod] = useState<'month' | 'quarter' | 'year'>('month');
   const router = useRouter();

   const [currentPage, setCurrentPage] = useState(1);
   const itemsPerPage = 10;

   const fetchBookings = async () => {
      setIsLoading(true);
      try {
         const res = await getAllBookings();
         if (res.success) setBookings(res.data || []);
      } catch {
         toast.error('Registry Access Denied');
      } finally {
         setIsLoading(false);
      }
   };

   useEffect(() => {
      fetchBookings();
   }, []);

   const metrics = useMemo(() => {
      const active = bookings.filter(b => b.status === 'confirmed').length;
      const pending = bookings.filter(b => b.status === 'pending').length;
      const canceled = bookings.filter(b => b.status === 'cancelled').length;
      const totalRevenue = bookings.filter(b => b.status === 'confirmed').reduce((s, b) => s + Number(b.total_amount || 0), 0);
      return { total: bookings.length, active, pending, canceled, totalRevenue };
   }, [bookings]);

   const filteredBookings = useMemo(() => {
      return bookings.filter(b => {
         const matchesSearch = b.asset_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.user_name?.toLowerCase().includes(searchQuery.toLowerCase());
         const matchesStatus = statusFilter === 'All' || b.status === statusFilter.toLowerCase();
         return matchesSearch && matchesStatus;
      });
   }, [bookings, searchQuery, statusFilter]);

   const paginatedBookings = useMemo(() => {
      const start = (currentPage - 1) * itemsPerPage;
      return filteredBookings.slice(start, start + itemsPerPage);
   }, [filteredBookings, currentPage]);

   const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);

   const financialData = useMemo(() => {
      const now = new Date();
      let start: Date;
      if (reportPeriod === 'month') start = startOfMonth(now);
      else if (reportPeriod === 'quarter') start = subMonths(now, 3);
      else start = startOfYear(now);

      const periodBookings = bookings.filter(b => {
         if (!b.created_at) return false;
         const d = new Date(b.created_at);
         return isValid(d) && isWithinInterval(d, { start, end: now });
      });

      const revenue = periodBookings.filter(b => b.status === 'confirmed').reduce((s, b) => s + Number(b.total_amount || 0), 0);
      const deposits = periodBookings.filter(b => b.status === 'confirmed').reduce((s, b) => s + Number(b.deposit_amount || 0), 0);
      const losses = periodBookings.filter(b => b.status === 'cancelled').reduce((s, b) => s + (Number(b.total_amount || 0) * 0.1), 0);

      return { revenue, deposits, losses, count: periodBookings.length };
   }, [bookings, reportPeriod]);

   const handleStatusAction = async (id: number, status: 'confirmed' | 'rejected') => {
      try {
         const res = await updateBookingStatus(id, status);
         if (res.success) {
            toast.success(`Protocol: Reservation ${status.toUpperCase()}`);
            fetchBookings();
            setIsDrawerOpen(false);
         }
      } catch {
         toast.error('System Transmission Error');
      }
   };

   if (isLoading) {
      return (
         <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
            <RefreshCw className="animate-spin text-blue-600" size={40} />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">Syncing Allocation Matrix...</p>
         </div>
      );
   }

   return (
      <div className="space-y-6 animate-in fade-in duration-500 pb-20 font-sans">
         <AnimatePresence>
            {isDrawerOpen && selectedBooking && (
               <ReservationDrawer
                  booking={selectedBooking}
                  onClose={() => setIsDrawerOpen(false)}
                  onAction={handleStatusAction}
                  onRefresh={fetchBookings}
               />
            )}
         </AnimatePresence>

         {/* Header Section */}
         <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2">
            <div className="flex items-center gap-3">

               <div>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none mb-1">Resource Allocations</h1>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">Reservation & Utilization Logs</p>
               </div>
            </div>


         </div>

         {/* Tactical Switcher */}
         <div className="flex gap-6 border-b border-slate-100">
            <button
               onClick={() => setActiveView('log')}
               className={clsx("text-[10px] font-bold uppercase tracking-widest pb-3 border-b-2 transition-all px-4", activeView === 'log' ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-600")}
            >
               Allocation Log
            </button>
            <button
               onClick={() => setActiveView('financials')}
               className={clsx("text-[10px] font-bold uppercase tracking-widest pb-3 border-b-2 transition-all px-4", activeView === 'financials' ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-600")}
            >
               Revenue Audit
            </button>
         </div>

         {activeView === 'log' ? (
            <div className="space-y-6 animate-in fade-in duration-500">
               {/* Performance Indicators */}
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard title="Total Requests" value={metrics.total} color="blue" icon={History} />
                  <StatCard title="Confirmed" value={metrics.active} color="green" icon={CheckCircle} trend="up" trendValue={`${Math.round((metrics.active / (metrics.total || 1)) * 100)}% SUCCESS`} />
                  <StatCard title="Pending Review" value={metrics.pending} color="yellow" icon={Clock} />
                  <StatCard title="Total Proceeds" value={`₹${metrics.totalRevenue.toLocaleString()}`} color="red" icon={IndianRupee} />
               </div>

               {/* Table Module */}
               <div className="bg-white rounded-none border border-slate-200 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
                  {/* Integrated Header */}
                  <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/50">
                     <div className="flex gap-2 p-1 bg-white rounded-none border border-slate-200 shadow-sm overflow-x-auto no-scrollbar">
                        {['All', 'Confirmed', 'Pending', 'Cancelled'].map((s) => (
                           <button
                              key={s}
                              onClick={() => { setStatusFilter(s); setCurrentPage(1); }}
                              className={clsx(
                                 "px-5 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-none transition-all whitespace-nowrap",
                                 statusFilter === s ? "bg-slate-900 text-white" : "text-slate-400 hover:text-slate-900"
                              )}
                           >
                              {s}
                           </button>
                        ))}
                     </div>

                     <div className="flex items-center gap-4">
                        <div className="relative group">
                           <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                           <input
                              type="text"
                              placeholder="SEARCH ALLOCATIONS..."
                              value={searchQuery}
                              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-none text-[10px] font-bold uppercase tracking-widest outline-none focus:ring-1 focus:ring-blue-100 transition-all w-full md:w-56"
                           />
                        </div>
                        <button className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 rounded-none transition-all shadow-sm active:scale-95"><Download size={16} /></button>
                     </div>
                  </div>

                  <div className="overflow-x-auto flex-1">
                     <table className="w-full text-left">
                        <thead>
                           <tr className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 tracking-wider border-b border-slate-100">
                              <th className="px-8 py-4">Resident Descriptor</th>
                              <th className="px-8 py-4">Resource Class</th>
                              <th className="px-8 py-4">Protocol Status</th>
                              <th className="px-8 py-4">Allocation Span</th>
                              <th className="px-8 py-4 text-right">Operations</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                           {paginatedBookings.length > 0 ? paginatedBookings.map((b, i) => (
                              <motion.tr
                                 key={b.id}
                                 initial={{ opacity: 0 }}
                                 animate={{ opacity: 1 }}
                                 transition={{ delay: i * 0.02 }}
                                 className="hover:bg-slate-50 transition-all cursor-pointer group"
                                 onClick={() => { setSelectedBooking(b); setIsDrawerOpen(true); }}
                              >
                                 <td className="px-8 py-5">
                                    <div className="flex items-center gap-4">
                                       <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-none flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                          <User size={18} />
                                       </div>
                                       <div>
                                          <p className="text-sm font-bold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">{b.user_name}</p>
                                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">#ALC-{b.id.toString().padStart(4, '0')}</p>
                                       </div>
                                    </div>
                                 </td>
                                 <td className="px-8 py-5">
                                    <div className="flex items-center gap-3">
                                       <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-none group-hover:bg-white transition-colors shadow-sm">
                                          <Package size={14} className="text-slate-400" />
                                       </div>
                                       <p className="text-xs font-bold text-slate-700 tracking-tight uppercase">{b.asset_name}</p>
                                    </div>
                                 </td>
                                 <td className="px-8 py-5">
                                    <div className="flex items-center gap-3">
                                       <div className={clsx(
                                          "w-2 h-2 rounded-none",
                                          b.status === 'confirmed' ? "bg-emerald-500" :
                                             b.status === 'pending' ? "bg-amber-500" :
                                                "bg-slate-400"
                                       )} />
                                       <span className={clsx(
                                          "px-2 py-0.5 rounded-none text-[9px] font-bold border uppercase tracking-wider",
                                          b.status === 'confirmed' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                             b.status === 'pending' ? "bg-amber-50 text-amber-700 border-amber-100" :
                                                "bg-slate-50 text-slate-600 border-slate-100"
                                       )}>
                                          {b.status}
                                       </span>
                                    </div>
                                 </td>
                                 <td className="px-8 py-5">
                                    <div className="flex flex-col gap-1.5">
                                       <div className="flex items-center gap-2 text-[10px] font-bold text-slate-900 uppercase">
                                          <LogIn size={12} className="text-emerald-500" />
                                          {formatDateSafe(b.start_time)}
                                       </div>
                                       <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                                          <LogOut size={12} className="text-red-400" />
                                          {formatDateSafe(b.end_time)}
                                       </div>
                                    </div>
                                 </td>
                                 <td className="px-8 py-5 text-right">
                                    <button className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-white border border-transparent hover:border-slate-200 rounded-none transition-all active:scale-95">
                                       <ChevronRight size={18} />
                                    </button>
                                 </td>
                              </motion.tr>
                           )) : (
                              <tr>
                                 <td colSpan={5} className="py-32 text-center">
                                    <History size={40} className="mx-auto mb-4 text-slate-100" />
                                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No Allocation Intelligence Found</p>
                                 </td>
                              </tr>
                           )}
                        </tbody>
                     </table>
                  </div>

                  <div className="px-8 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Page {currentPage} / {totalPages || 1} • {filteredBookings.length} TELEMETRY RECORDS</p>
                     <div className="flex gap-2">
                        <button
                           onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                           disabled={currentPage === 1}
                           className="p-2 bg-white border border-slate-200 rounded-none text-slate-400 hover:text-blue-600 disabled:opacity-30 transition-all shadow-sm"
                        ><ChevronLeft size={16} /></button>
                        <button
                           onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                           disabled={currentPage === totalPages || totalPages === 0}
                           className="p-2 bg-white border border-slate-200 rounded-none text-slate-400 hover:text-blue-600 disabled:opacity-30 transition-all shadow-sm"
                        ><ChevronRight size={16} /></button>
                     </div>
                  </div>
               </div>
            </div>
         ) : (
            <div className="space-y-8 animate-in fade-in duration-700">
               {/* Financial Controls */}
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex gap-1 p-1 bg-slate-100 rounded-none border border-slate-200">
                     {['month', 'quarter', 'year'].map((p) => (
                        <button
                           key={p}
                           onClick={() => setReportPeriod(p as any)}
                           className={clsx(
                              "px-6 py-2 text-[10px] font-bold uppercase tracking-widest rounded-none transition-all",
                              reportPeriod === p ? "bg-white text-blue-600 shadow-sm border border-slate-200" : "text-slate-500 hover:text-blue-600"
                           )}
                        >
                           {p}ly Audit
                        </button>
                     ))}
                  </div>
                  <button className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-none text-[10px] font-bold uppercase tracking-widest shadow-lg hover:bg-black transition-all active:scale-95">
                     <Download size={14} />
                     Export Fiscal Ledger
                  </button>
               </div>

               {/* Financial Stats */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FinancialStatCard
                     title="Gross Yield"
                     value={`₹${financialData.revenue.toLocaleString()}`}
                     label={`CONFIRMED REVENUE / ${reportPeriod.toUpperCase()}`}
                     icon={<IndianRupee size={20} />}
                     color="blue"
                  />
                  <FinancialStatCard
                     title="Escrowed Bonds"
                     value={`₹${financialData.deposits.toLocaleString()}`}
                     label="SECURITY DEPOSITS IN CUSTODY"
                     icon={<ShieldCheck size={20} />}
                     color="emerald"
                  />
                  <FinancialStatCard
                     title="CXL Penalties"
                     value={`₹${financialData.losses.toLocaleString()}`}
                     label="RECOVERED FROM CANCELLATIONS"
                     icon={<TrendingUp size={20} />}
                     color="red"
                  />
               </div>

               {/* Transaction Ledger */}
               <div className="bg-white rounded-none border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                     <div>
                        <h3 className="text-sm font-bold text-slate-900 tracking-tight uppercase mb-1">Fiscal Transaction Ledger</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Audited financial events for selected lifecycle</p>
                     </div>
                     <div className="flex items-center gap-3">
                        <span className="text-[9px] font-bold text-blue-600 bg-white border border-blue-100 px-3 py-1 rounded-none uppercase tracking-widest shadow-sm">
                           {financialData.count} TELEMETRY EVENTS
                        </span>
                     </div>
                  </div>
                  <div className="overflow-x-auto">
                     <table className="w-full text-left">
                        <thead>
                           <tr className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 tracking-widest border-b border-slate-100">
                              <th className="px-8 py-5">Transaction ID</th>
                              <th className="px-8 py-5">Allocation Identity</th>
                              <th className="px-8 py-5">Resident</th>
                              <th className="px-8 py-5 text-right">Net Proceeds</th>
                              <th className="px-8 py-5 text-right">Audit Status</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                           {bookings.slice(0, 10).map((b, i) => (
                              <tr key={b.id} className="hover:bg-slate-50 transition-all group">
                                 <td className="px-8 py-5">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest tabular-nums">#TX-{b.id.toString().padStart(6, '0')}</span>
                                 </td>
                                 <td className="px-8 py-5 font-bold text-xs text-slate-900 uppercase tracking-tight">{b.asset_name}</td>
                                 <td className="px-8 py-5 font-bold text-xs text-slate-500 uppercase tracking-tight opacity-70 group-hover:opacity-100">{b.user_name}</td>
                                 <td className="px-8 py-5 text-right font-bold text-xs text-slate-900 tabular-nums">₹{Number(b.total_amount).toLocaleString()}</td>
                                 <td className="px-8 py-5 text-right">
                                    <span className={clsx(
                                       "px-2 py-0.5 rounded-none text-[9px] font-bold uppercase border tracking-widest",
                                       b.status === 'confirmed' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"
                                    )}>
                                       {b.status === 'confirmed' ? 'SETTLED' : 'VOIDED'}
                                    </span>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
}

function ReservationDrawer({ booking, onClose, onAction, onRefresh }: { booking: AssetBooking, onClose: () => void, onAction: (id: number, status: 'confirmed' | 'rejected') => void, onRefresh: () => void }) {
   const [isProcessing, setIsProcessing] = useState(false);

   const handleHandoverAction = async (type: 'checkout' | 'checkin') => {
      setIsProcessing(true);
      try {
         const res = await recordHandover({
            bookingId: booking.id,
            type: type,
            remarks: 'Protocol condition assessment: Optimal'
         });
         if (res.success) {
            toast.success(`Protocol: Asset ${type === 'checkout' ? 'Deployed' : 'Secured'}`);
            onRefresh();
            onClose();
         }
      } catch {
         toast.error('Handover Transmission Failure');
      } finally {
         setIsProcessing(false);
      }
   };

   return (
      <div className="fixed inset-0 z-[120] flex justify-end">
         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
         <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} className="w-full max-w-xl bg-white h-full shadow-2xl relative flex flex-col border-l border-slate-200">
            {/* Drawer Header */}
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-900 text-white rounded-none flex items-center justify-center border border-slate-800 shadow-xl">
                     <Calendar size={24} />
                  </div>
                  <div>
                     <h2 className="text-lg font-bold text-slate-900 tracking-tight uppercase">Reservation Audit</h2>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">PROTOCOL ID: #{booking.id}</p>
                  </div>
               </div>
               <button onClick={onClose} className="p-2.5 hover:bg-slate-50 rounded-none transition-all active:scale-90 border border-transparent hover:border-slate-100 text-slate-400"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar pb-32">
               {/* Status Module */}
               <div className={clsx(
                  "p-6 rounded-none border flex items-center justify-between shadow-sm relative overflow-hidden group",
                  booking.status === 'confirmed' ? "bg-emerald-50 border-emerald-100" :
                     booking.status === 'pending' ? "bg-amber-50 border-amber-100" : "bg-red-50 border-red-100"
               )}>
                  <div className="flex items-center gap-5 relative z-10">
                     <div className={clsx(
                        "w-10 h-10 rounded-none flex items-center justify-center border shadow-sm transition-transform group-hover:scale-105",
                        booking.status === 'confirmed' ? "bg-white text-emerald-600 border-emerald-100" :
                           booking.status === 'pending' ? "bg-white text-amber-600 border-amber-100" : "bg-white text-red-600 border-red-100"
                     )}>
                        {booking.status === 'confirmed' ? <CheckCircle size={22} /> : booking.status === 'pending' ? <Clock size={22} /> : <XCircle size={22} />}
                     </div>
                     <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">ALLOCATION PROTOCOL</p>
                        <p className={clsx("text-lg font-bold uppercase tracking-tight",
                           booking.status === 'confirmed' ? "text-emerald-700" :
                              booking.status === 'pending' ? "text-amber-700" : "text-red-700")}>{booking.status}</p>
                     </div>
                  </div>
                  <Zap size={64} className="absolute -right-4 -bottom-4 opacity-5 rotate-12" />
               </div>

               {/* Primary Attributes */}
               <div className="grid grid-cols-2 gap-6">
                  <div className="p-6 bg-slate-50 border border-slate-100 rounded-none space-y-4 hover:bg-white hover:border-blue-100 transition-all group">
                     <div className="w-10 h-10 bg-white border border-slate-100 rounded-none flex items-center justify-center text-blue-600 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <Package size={18} />
                     </div>
                     <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">RESOURCE</p>
                        <p className="text-xs font-bold text-slate-900 uppercase tracking-tight truncate">{booking.asset_name}</p>
                     </div>
                  </div>
                  <div className="p-6 bg-slate-50 border border-slate-100 rounded-none space-y-4 hover:bg-white hover:border-blue-100 transition-all group">
                     <div className="w-10 h-10 bg-white border border-slate-100 rounded-none flex items-center justify-center text-indigo-600 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <User size={18} />
                     </div>
                     <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">RESIDENT</p>
                        <p className="text-xs font-bold text-slate-900 uppercase tracking-tight truncate">{booking.user_name}</p>
                     </div>
                  </div>
               </div>

               {/* Chrono Timeline */}
               <div className="bg-white rounded-none border border-slate-200 p-8 space-y-8 shadow-sm">
                  <div className="flex items-center gap-3 pb-6 border-b border-slate-100">
                     <Clock size={16} className="text-blue-600" />
                     <h3 className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Allocation Timeline</h3>
                  </div>

                  <div className="space-y-12 relative">
                     <div className="absolute left-5 top-2 bottom-2 w-px bg-slate-100" />

                     <div className="flex items-start gap-6 relative group">
                        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-none flex items-center justify-center border border-emerald-100 z-10 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-sm">
                           <LogIn size={18} />
                        </div>
                        <div>
                           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">CHECK-IN PROTOCOL</p>
                           <p className="text-sm font-bold text-slate-900 uppercase tracking-tight">{formatDateSafe(booking.start_time)}</p>
                        </div>
                     </div>

                     <div className="flex items-start gap-6 relative group">
                        <div className="w-10 h-10 bg-red-50 text-red-400 rounded-none flex items-center justify-center border border-red-100 z-10 group-hover:bg-red-500 group-hover:text-white transition-all shadow-sm">
                           <LogOut size={18} />
                        </div>
                        <div>
                           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">CHECK-OUT PROTOCOL</p>
                           <p className="text-sm font-bold text-slate-900 uppercase tracking-tight">{formatDateSafe(booking.end_time)}</p>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Financial Audit */}
               <div className="bg-slate-900 p-10 rounded-none text-white shadow-2xl relative overflow-hidden group border border-slate-800">
                  <div className="absolute -right-10 -top-10 p-12 opacity-5 transform group-hover:scale-110 group-hover:rotate-12 transition-transform">
                     <IndianRupee size={120} />
                  </div>
                  <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-6">
                     <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">FINANCIAL LEDGER</p>
                     <Zap size={16} className="text-amber-400 fill-amber-400" />
                  </div>
                  <div className="grid grid-cols-2 gap-10">
                     <div className="space-y-2">
                        <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest leading-none">Net Proceeds</p>
                        <p className="text-2xl font-bold tracking-tight tabular-nums text-white group-hover:text-blue-400 transition-colors">₹{Number(booking.total_amount).toLocaleString()}</p>
                     </div>
                     <div className="space-y-2">
                        <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest leading-none">Security Bond</p>
                        <p className="text-2xl font-bold tracking-tight tabular-nums text-emerald-400">₹{Number(booking.deposit_amount).toLocaleString()}</p>
                     </div>
                  </div>
               </div>

               {/* Operational Actions */}
               <div className="space-y-4">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Strategic Operations</h3>
                  <div className="grid grid-cols-2 gap-4">
                     {booking.status === 'confirmed' && !booking.checked_out_at && (
                        <button
                           onClick={() => handleHandoverAction('checkout')}
                           disabled={isProcessing}
                           className="flex flex-col items-center justify-center p-6 bg-white border border-slate-200 rounded-none hover:border-blue-600 hover:shadow-xl transition-all group"
                        >
                           <ArrowUpRight size={20} className="text-slate-400 group-hover:text-blue-600 mb-2.5" />
                           <p className="text-[9px] font-bold text-slate-900 uppercase tracking-widest">Mark Deployed</p>
                        </button>
                     )}
                     {booking.status === 'confirmed' && booking.checked_out_at && !booking.checked_in_at && (
                        <button
                           onClick={() => handleHandoverAction('checkin')}
                           disabled={isProcessing}
                           className="flex flex-col items-center justify-center p-6 bg-white border border-slate-200 rounded-none hover:border-emerald-600 hover:shadow-xl transition-all group"
                        >
                           <ClipboardCheck size={20} className="text-slate-400 group-hover:text-emerald-600 mb-2.5" />
                           <p className="text-[9px] font-bold text-slate-900 uppercase tracking-widest">Secure Return</p>
                        </button>
                     )}
                     <button className="flex flex-col items-center justify-center p-6 bg-white border border-slate-200 rounded-none hover:border-slate-900 hover:shadow-xl transition-all group col-span-1">
                        <ListFilter size={20} className="text-slate-400 group-hover:text-slate-900 mb-2.5" />
                        <p className="text-[9px] font-bold text-slate-900 uppercase tracking-widest">Audit Trails</p>
                     </button>
                  </div>
               </div>
            </div>

            {/* Strategy Controls */}
            <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-4 absolute bottom-0 left-0 right-0">
               {booking.status === 'pending' ? (
                  <>
                     <button
                        onClick={() => onAction(booking.id, 'rejected')}
                        className="flex-1 py-3 bg-white text-red-500 rounded-none font-bold uppercase text-[10px] tracking-widest border border-red-100 hover:bg-red-50 transition-all shadow-sm active:scale-95"
                     >
                        Abort Request
                     </button>
                     <button
                        onClick={() => onAction(booking.id, 'confirmed')}
                        className="flex-[2] py-3 bg-slate-900 text-white rounded-none font-bold uppercase text-[10px] tracking-widest shadow-xl hover:bg-blue-600 active:scale-95 transition-all flex items-center justify-center gap-2"
                     >
                        <CheckCircle size={16} />
                        Authorize Allocation
                     </button>
                  </>
               ) : (
                  <button
                     onClick={onClose}
                     className="w-full py-3 bg-white text-slate-900 rounded-none font-bold uppercase text-[10px] tracking-widest border border-slate-200 hover:bg-slate-50 transition-all active:scale-95"
                  >
                     Close Audit
                  </button>
               )}
            </div>
         </motion.div>
      </div>
   );
}
