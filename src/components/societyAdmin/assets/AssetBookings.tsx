'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { format, isPast, isValid, startOfMonth, subMonths, startOfYear, isWithinInterval } from 'date-fns';
import {
   Calendar, Search, Clock, User, Check, X,
   MapPin, IndianRupee, Info, Activity, History, ChevronRight,
   ShieldCheck, ArrowUpRight, Globe, Layers, Zap, MoreHorizontal,
   RefreshCw, Filter, Package, AlertCircle, FileText, ChevronLeft,
   XCircle, CheckCircle, Clock4, LogOut, LogIn, ClipboardCheck, ArrowDownRight,
   Download, FileSpreadsheet, ListFilter, Trash2, TrendingUp
} from 'lucide-react';
import { getAllBookings, updateBookingStatus, AssetBooking, recordHandover, verifyBooking, ApiResponse } from '@/lib/apiClient';
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
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all group"
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{title}</p>
        <p className="text-2xl font-black text-gray-900 mt-2 tracking-tighter group-hover:text-blue-600 transition-colors">{value}</p>
        {trendValue && (
          <div className="flex items-center mt-2 text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-full w-fit">
            {trend === 'up' ? <TrendingUp size={10} className="mr-1" /> : <ArrowDownRight size={10} className="mr-1" />}
            {trendValue}
          </div>
        )}
      </div>
      <div className={clsx(
        "p-4 rounded-xl shadow-sm border transition-transform group-hover:scale-110",
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

const FinancialStatCard = ({ title, value, label, icon, color }: any) => (
   <motion.div 
     initial={{ opacity: 0, scale: 0.95 }}
     animate={{ opacity: 1, scale: 1 }}
     className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all group"
   >
     <div className="flex items-center justify-between mb-4">
       <div className={clsx(
         "w-12 h-12 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm border",
         color === 'blue' ? "bg-blue-50 text-blue-600 border-blue-100" : 
         color === 'red' ? "bg-red-50 text-red-600 border-red-100" :
         "bg-emerald-50 text-emerald-600 border-emerald-100"
       )}>
         {icon}
       </div>
       <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">{title}</span>
     </div>
     <div>
       <p className={clsx(
         "text-2xl font-black tracking-tighter",
         color === 'red' ? "text-red-600" : color === 'emerald' ? "text-emerald-600" : "text-gray-900"
       )}>{value}</p>
       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 opacity-70">{label}</p>
     </div>
   </motion.div>
);

// --- Helper Components & Functions ---

function formatDateSafe(date: any) {
   if (!date) return 'Awaiting...';
   const d = new Date(date);
   if (!isValid(d)) return 'Invalid Date';
   return format(d, 'MMM dd, HH:mm');
}

function HandoverInput({ label, value, onChange, color }: any) {
   const border = color === 'emerald' ? 'border-emerald-100 focus:ring-emerald-200' : 'border-blue-100 focus:ring-blue-200';
   const text = color === 'emerald' ? 'text-emerald-600' : 'text-blue-600';
   return (
      <div className="space-y-1.5 flex flex-col">
         <label className={`text-[10px] font-black ${text} uppercase tracking-widest pl-1`}>{label}</label>
         <input 
            type="number" 
            value={value} 
            onChange={(e) => onChange(Number(e.target.value))} 
            className={`w-full px-4 py-2.5 bg-gray-50 border rounded-lg text-sm font-bold shadow-sm outline-none focus:bg-white focus:ring-4 transition-all ${border}`} 
         />
      </div>
   );
}

function BookingDetailDrawer({
   booking, onClose, onUpdate, onHandover, rejectionReason, setRejectionReason, handoverRemarks, setHandoverRemarks,
   manualPenaltyRate, setManualPenaltyRate, manualGracePeriod, setManualGracePeriod, waivePenalty, setWaivePenalty,
   collectedPenalty, setCollectedPenalty
}: any) {
   const timeline = [
      { id: 'requested', label: 'Reservation Requested', date: booking.created_at, icon: <Clock size={16} />, status: 'completed' },
      {
         id: 'approved',
         label: booking.status === 'cancelled' ? 'User Cancellation' : booking.status === 'rejected' ? 'Admin Rejection' : 'Admin Approval',
         date: booking.updated_at,
         icon: <ShieldCheck size={16} />,
         status: ['confirmed', 'completed', 'approved'].includes(booking.status) ? 'completed' : ['rejected', 'cancelled'].includes(booking.status) ? 'failed' : 'pending'
      },
      { id: 'outbound', label: 'Asset Handover (Checkout)', date: booking.checked_out_at, icon: <LogOut size={16} />, status: booking.checked_out_at ? 'completed' : (booking.status === 'cancelled' || booking.status === 'rejected') ? 'failed' : 'pending' },
      { id: 'inbound', label: 'Asset Return (Checkin)', date: booking.checked_in_at, icon: <LogIn size={16} />, status: booking.checked_in_at ? 'completed' : (booking.status === 'cancelled' || booking.status === 'rejected') ? 'failed' : 'pending' }
   ];

   const currentTime = new Date();
   const endTime = new Date(booking.end_time);
   const diffMins = Math.max(0, Math.floor((currentTime.getTime() - endTime.getTime()) / (1000 * 60)));
   const calculatedPenalty = (diffMins > manualGracePeriod) ? Math.ceil((diffMins - manualGracePeriod) / 60) * manualPenaltyRate : 0;

   return (
      <div className="fixed inset-0 z-[120] flex justify-end">
         <motion.div 
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           onClick={onClose}
           className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
         />
         <motion.div 
           initial={{ x: '100%' }}
           animate={{ x: 0 }}
           exit={{ x: '100%' }}
           transition={{ type: 'spring', damping: 25, stiffness: 200 }}
           className="w-full max-w-lg bg-gray-50 h-full shadow-2xl relative flex flex-col"
         >
            {/* Drawer Header */}
            <div className="bg-white p-8 border-b border-gray-200 flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
                     <Calendar size={28} />
                  </div>
                  <div>
                     <h2 className="text-xl font-extrabold text-gray-900 tracking-tight leading-none uppercase">Reservation Control</h2>
                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Identifier: #{booking.booking_id}</p>
                  </div>
               </div>
               <button 
                 onClick={onClose} 
                 className="p-3 hover:bg-gray-100 rounded-lg transition-all active:scale-90 text-gray-400 hover:text-gray-900"
               >
                 <X size={24} />
               </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
               {/* Asset Status Strip */}
               <div className="flex items-center gap-6 p-6 bg-white rounded-lg border border-gray-200 md:shadow-sm">
                  <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center border border-blue-100">
                     <Package size={32} />
                  </div>
                  <div>
                     <h4 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-1">{booking.asset_name}</h4>
                     <p className={clsx(
                       "px-3 py-1 rounded-lg text-[10px] font-black w-fit uppercase tracking-widest border",
                       booking.status === 'confirmed' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                       booking.status === 'pending' ? "bg-amber-50 text-amber-600 border-amber-100" :
                       "bg-gray-100 text-gray-400 border-gray-200"
                     )}>
                       Current Status: {booking.status}
                     </p>
                  </div>
               </div>

               {/* Logistical Actions */}
               <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Logistical Duty Operations</h4>

                  {booking.status === 'confirmed' && !booking.checked_out_at && (
                     <div className="p-6 bg-emerald-50 rounded-lg border border-emerald-100 space-y-6 shadow-sm">
                        <p className="text-xs font-black text-emerald-900 uppercase tracking-tight flex items-center gap-2"><LogOut size={16} /> Handover Protocol</p>
                        <div className="grid grid-cols-2 gap-4">
                           <HandoverInput label="Late Rate (₹/hr)" value={manualPenaltyRate} onChange={setManualPenaltyRate} color="emerald" />
                           <HandoverInput label="Grace Window (min)" value={manualGracePeriod} onChange={setManualGracePeriod} color="emerald" />
                        </div>
                        <textarea placeholder="Enter handover remarks..." value={handoverRemarks} onChange={(e) => setHandoverRemarks(e.target.value)} className="w-full px-4 py-3 bg-white border border-emerald-100 rounded-lg text-sm outline-none resize-none h-24 focus:ring-4 focus:ring-emerald-100 transition-all" />
                        <button onClick={() => onHandover(booking.id, 'checkout')} className="w-full py-4 bg-emerald-600 text-white rounded-lg font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 active:scale-95 transition-all">Record Asset Outflow</button>
                     </div>
                  )}

                  {booking.checked_out_at && !booking.checked_in_at && (
                     <div className="space-y-6 animate-in slide-in-from-top-4">
                        <p className="text-xs font-black text-blue-900 uppercase tracking-tight flex items-center gap-2"><LogIn size={16} /> Return & Settle Account</p>
                        <div className="bg-white p-6 rounded-lg border border-blue-200 shadow-sm space-y-6">
                           <div className="flex justify-between items-center">
                              <div>
                                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Calculated Late Liability</p>
                                 <p className="text-2xl font-black text-red-600 tracking-tighter">₹{calculatedPenalty}</p>
                              </div>
                              <label className="flex items-center gap-3 cursor-pointer bg-gray-50 p-3 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                                 <input type="checkbox" checked={waivePenalty} onChange={(e) => {
                                    setWaivePenalty(e.target.checked);
                                    setCollectedPenalty(e.target.checked ? 0 : calculatedPenalty);
                                 }} className="w-5 h-5 rounded-lg border-gray-300 text-blue-600 focus:ring-blue-500" />
                                 <span className="text-[10px] font-black text-gray-700 uppercase tracking-tight">Waive Penalty</span>
                              </label>
                           </div>
                           
                           {!waivePenalty && (
                              <div className="pt-4 border-t border-gray-100 space-y-2">
                                 <label className="text-[9px] font-black text-blue-600 uppercase tracking-widest pl-1">Adjusted Settlement (₹)</label>
                                 <input type="number" value={collectedPenalty} onChange={(e) => setCollectedPenalty(Number(e.target.value))} className="w-full px-5 py-3 bg-gray-50 border-2 border-blue-600 rounded-lg text-xl font-black text-blue-600 shadow-sm outline-none focus:bg-white transition-all" />
                              </div>
                           )}
                        </div>
                        <textarea placeholder="Enter return condition remarks..." value={handoverRemarks} onChange={(e) => setHandoverRemarks(e.target.value)} className="w-full px-4 py-3 bg-white border border-blue-100 rounded-lg text-sm outline-none resize-none h-24 focus:ring-4 focus:ring-blue-100 transition-all" />
                        <button onClick={() => onHandover(booking.id, 'checkin')} className="w-full py-4 bg-blue-600 text-white rounded-lg font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all">Record Asset Return</button>
                     </div>
                  )}

                  {booking.status === 'pending' && (
                     <div className="pt-4 space-y-6">
                        <button onClick={() => onUpdate(booking.id, 'confirmed')} className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/25 active:scale-95 transition-all">Authorize Reservation</button>
                        <div className="p-6 bg-red-50 rounded-lg border border-red-100 space-y-4">
                           <label className="text-[10px] font-black text-red-500 uppercase tracking-widest pl-1">Formal Denial Justification</label>
                           <textarea placeholder="State reason..." value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} className="w-full px-4 py-3 bg-white border border-red-200 rounded-lg text-sm font-bold outline-none h-24 focus:ring-4 focus:ring-red-100 transition-all" />
                           <button disabled={!rejectionReason} onClick={() => onUpdate(booking.id, 'rejected', rejectionReason)} className="w-full py-3 bg-red-600 text-white rounded-lg font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-500/20 active:scale-95 transition-all disabled:opacity-50">Execute Denial</button>
                        </div>
                     </div>
                  )}
               </div>

               {/* Timeline Restored with premium style */}
               <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Reservation Lifecycle Audit</h4>
                  <div className="relative space-y-8 pl-4">
                     <div className="absolute left-[23px] top-2 bottom-2 w-[2px] bg-gray-200" />
                     {timeline.map((item, idx) => (
                        <div key={idx} className="relative flex items-start gap-6">
                           <div className={clsx(
                               "w-5 h-5 rounded-full border-4 border-white shadow-sm ring-2 z-10 shrink-0",
                               item.status === 'completed' ? "bg-emerald-500 ring-emerald-100" : 
                               item.status === 'failed' ? "bg-red-500 ring-red-100" : 
                               "bg-gray-300 ring-gray-100"
                           )} />
                           <div className="flex-1 bg-white p-4 rounded-lg border border-gray-100 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all">
                              <div>
                                 <p className="text-[11px] font-black text-gray-900 uppercase leading-none mb-1">{item.label}</p>
                                 <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{formatDateSafe(item.date)}</p>
                              </div>
                              <div className={clsx(
                                "p-2 rounded-lg",
                                item.status === 'completed' ? "bg-emerald-50 text-emerald-600" : "bg-gray-50 text-gray-400"
                              )}>
                                 {item.icon}
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>

               {/* Fiscal Breakdown */}
               <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm space-y-6">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-4 w-full flex items-center gap-2">
                     <IndianRupee size={14} /> Fiscal Components
                  </h3>
                  <div className="space-y-4">
                     <div className="flex justify-between items-center text-xs font-bold uppercase tracking-tight text-gray-500">
                        <span>Base Fare Protocol</span>
                        <span className="text-gray-900">₹{booking.total_amount}</span>
                     </div>
                     <div className="flex justify-between items-center text-xs font-bold uppercase tracking-tight text-gray-500">
                        <span>Security Deposit Bond</span>
                        <span className="text-gray-900">₹{booking.deposit_amount}</span>
                     </div>
                     {booking.final_penalty_amount > 0 && (
                        <div className="flex justify-between items-center text-xs font-bold uppercase tracking-tight text-red-500">
                           <span>Late Return Liability</span>
                           <span className="font-black">₹{booking.final_penalty_amount}</span>
                        </div>
                     )}
                     <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                        <span className="text-xs font-black text-gray-900 uppercase tracking-widest">Gross Settlement</span>
                        <span className="text-2xl font-black text-blue-600 tracking-tighter">₹{Number(booking.total_amount) + Number(booking.final_penalty_amount || 0)}</span>
                     </div>
                  </div>
               </div>

               {/* Member Info */}
               <div className="flex items-center gap-4 p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
                  <div className="w-12 h-12 bg-gray-900 text-white rounded-lg flex items-center justify-center font-black text-lg">
                     {(booking.user_name || 'U').charAt(0)}
                  </div>
                  <div>
                     <p className="text-sm font-black text-gray-900 uppercase leading-none tracking-tight">{booking.user_name || 'Resident Member'}</p>
                     <p className="text-[10px] text-gray-400 font-bold uppercase mt-1.5 tracking-widest">Community Participant Pool</p>
                  </div>
               </div>
            </div>
         </motion.div>
      </div>
   );
}

// --- Main Component ---

export default function AssetBookings() {
   const [bookings, setBookings] = useState<AssetBooking[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [searchQuery, setSearchQuery] = useState('');
   const [activeSubTab, setActiveSubTab] = useState<'all' | 'uncompleted' | 'overdue' | 'completed'>('all');
   const [filterStatus, setFilterStatus] = useState('all');
   const [currentPage, setCurrentPage] = useState(1);
   const itemsPerPage = 10;

   const [selectedBooking, setSelectedBooking] = useState<AssetBooking | null>(null);
   const [rejectionReason, setRejectionReason] = useState('');
   const [handoverRemarks, setHandoverRemarks] = useState('');

   // Financial Filters
   const [startDate, setStartDate] = useState<string>('');
   const [endDate, setEndDate] = useState<string>('');

   // Handover Overrides
   const [manualPenaltyRate, setManualPenaltyRate] = useState(10);
   const [manualGracePeriod, setManualGracePeriod] = useState(15);
   const [waivePenalty, setWaivePenalty] = useState(false);
   const [collectedPenalty, setCollectedPenalty] = useState(0);

   const [activeTab, setActiveTab] = useState<'roster' | 'pending' | 'revenue'>('roster');
   const router = useRouter();

   const fetchData = async () => {
      setIsLoading(true);
      try {
         const res = await getAllBookings();
         if (res.success) setBookings(res.data || []);
      } catch (error) {
         toast.error('Failed to load bookings');
      } finally {
         setIsLoading(false);
      }
   };

   useEffect(() => {
      fetchData();
   }, []);

   const handleUpdateStatus = async (bookingId: number, status: 'confirmed' | 'rejected', reason?: string) => {
      try {
         const res = await updateBookingStatus(bookingId, status, reason);
         if (res.success) {
            toast.success(`Booking ${status}`);
            fetchData();
            setSelectedBooking(null);
            setRejectionReason('');
         } else {
            toast.error(res.message || 'Update failed');
         }
      } catch (error) {
         toast.error('Operation failed');
      }
   };

   const handleHandover = async (bookingId: number, type: 'checkout' | 'checkin') => {
      try {
         const res = await recordHandover({
            bookingId,
            type,
            remarks: handoverRemarks,
            manualPenaltyRate,
            manualGracePeriod,
            waivePenalty,
            collectedPenalty
         });
         if (res.success) {
            toast.success(`Handover ${type} recorded`);
            fetchData();
            setSelectedBooking(null);
            setHandoverRemarks('');
         } else {
            toast.error(res.message || 'Logistical record failed');
         }
      } catch (error) {
         toast.error('Handover failed');
      }
   };

   const setRange = (type: 'month' | '3months' | 'year') => {
      const end = new Date();
      let start = new Date();
      if (type === 'month') start = startOfMonth(end);
      else if (type === '3months') start = subMonths(end, 3);
      else if (type === 'year') start = startOfYear(end);

      setStartDate(format(start, 'yyyy-MM-dd'));
      setEndDate(format(end, 'yyyy-MM-dd'));
   };

   const filteredData = useMemo(() => {
      let data = bookings;

      // Status Filter (Tabs)
      if (activeTab === 'pending') data = data.filter(b => b.status === 'pending');

      // Search
      if (searchQuery) {
         const q = searchQuery.toLowerCase();
         data = data.filter(b =>
            b.booking_id.toLowerCase().includes(q) ||
            b.user_name?.toLowerCase().includes(q) ||
            (b.asset_name || '').toLowerCase().includes(q)
         );
      }

      // Date Range (Financial)
      if (startDate && endDate) {
         const start = new Date(startDate);
         const end = new Date(endDate);
         data = data.filter(b => b.created_at ? isWithinInterval(new Date(b.created_at), { start, end }) : false);
      }

      // Sub-Tabs for Roster
      if (activeTab === 'roster') {
         if (activeSubTab === 'uncompleted') data = data.filter(b => b.status !== 'completed' && b.status !== 'cancelled' && b.status !== 'rejected');
         else if (activeSubTab === 'overdue') data = data.filter(b => b.status !== 'completed' && isPast(new Date(b.end_time)));
         else if (activeSubTab === 'completed') data = data.filter(b => b.status === 'completed');
      }

      return data.sort((a, b) => (b.id || 0) - (a.id || 0));
   }, [bookings, activeTab, activeSubTab, searchQuery, startDate, endDate]);

   const totals = useMemo(() => {
      return filteredData.reduce((acc, b) => ({
         paid: acc.paid + Number(b.total_amount),
         deposit: acc.deposit + Number(b.deposit_amount),
         penalty: acc.penalty + (b.final_penalty_amount || 0)
      }), { paid: 0, deposit: 0, penalty: 0 });
   }, [filteredData]);

   const handleExport = (data: any[], title: string) => {
      const headers = ['Booking ID', 'Asset', 'Member', 'Date', 'Start', 'End', 'Status', 'Fee', 'Deposit', 'Penalty', 'Total'];
      const csvData = data.map(b => [
         b.booking_id,
         b.asset_name || 'Unnamed Asset',
         b.user_name || 'N/A',
         b.created_at ? format(new Date(b.created_at), 'yyyy-MM-dd') : 'N/A',
         b.start_time ? format(new Date(b.start_time), 'HH:mm') : 'N/A',
         b.end_time ? format(new Date(b.end_time), 'HH:mm') : 'N/A',
         b.status,
         b.total_amount,
         b.deposit_amount,
         b.final_penalty_amount || 0,
         Number(b.total_amount) + Number(b.final_penalty_amount || 0)
      ]);

      const rangeInfo = startDate && endDate ? ` Range: ${startDate} to ${endDate}` : '';
      const fileHeader = `${title}\nAudit-Ready Cashflow & Deposit Reconciliation\nGenerated on: ${format(new Date(), 'yyyy-MM-dd HH:mm')}${rangeInfo}\n\n`;
      const csvRows = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n');
      const blob = new Blob([fileHeader + csvRows], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.csv`;
      a.click();
   };

   return (
      <div className="p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto min-h-screen bg-gray-50/50">
         {/* Header Section */}
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-200">
            <div className="space-y-1">
               <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Booking Management</h1>
               <p className="text-gray-500 font-medium tracking-tight">Audit-ready asset logistical oversight</p>
            </div>
            <div className="flex items-center gap-3">
               <div className="inline-flex p-1.5 bg-gray-200/50 rounded-lg border border-gray-200 backdrop-blur-sm">
                  <button 
                    onClick={() => router.push('/societyadmin/asset-list')}
                    className="px-6 py-2.5 rounded-lg text-sm font-bold text-gray-600 hover:text-blue-600 hover:bg-white transition-all transform hover:scale-105 active:scale-95"
                  >
                    Registry View
                  </button>
                  <button 
                    onClick={() => router.push('/societyadmin/asset-dashboard')}
                    className="px-6 py-2.5 rounded-lg text-sm font-bold text-gray-600 hover:text-blue-600 hover:bg-white transition-all transform hover:scale-105 active:scale-95"
                  >
                    Diagnostic Center
                  </button>
                  <button 
                    className="px-6 py-2.5 rounded-lg text-sm font-bold bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25 transform hover:scale-105 active:scale-95 transition-all"
                  >
                    Bookings
                  </button>
               </div>
               <button 
                  onClick={fetchData}
                  className="p-2.5 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-blue-600 hover:border-blue-200 shadow-sm transition-all active:scale-90"
               >
                  <RefreshCw size={20} />
               </button>
            </div>
         </div>

         {/* Internal Navigation Tabs */}
         <div className="flex items-center gap-4 bg-white p-2 rounded-lg border border-gray-100 shadow-sm w-fit">
            {[
               { id: 'roster', label: 'Duty Roster', icon: ListFilter },
               { id: 'pending', label: 'Authorizations', icon: Zap },
               { id: 'revenue', label: 'Ledger', icon: IndianRupee }
            ].map(tab => (
               <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={clsx(
                     "px-6 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all",
                     activeTab === tab.id ? "bg-gray-900 text-white shadow-lg" : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                  )}
               >
                  <tab.icon size={14} />
                  {tab.label}
               </button>
            ))}
         </div>

         {/* Search Bar */}
         <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="relative group flex-1 max-w-md">
               <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 bg-gray-50 rounded-lg group-focus-within:bg-blue-50 transition-colors">
                  <Search className="text-gray-400 group-focus-within:text-blue-500" size={16} />
               </div>
               <input
                  type="text"
                  placeholder="Search by ID, Resident, or Asset..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-14 pr-4 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-gray-400"
               />
            </div>

            <div className="flex items-center gap-3">
               <button
                  onClick={() => handleExport(filteredData, activeTab === 'revenue' ? 'Asset Financial Ledger' : 'Asset Booking Report')}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-lg active:scale-95 transition-all"
               >
                  <Download size={16} /> Export CSV
               </button>
            </div>
         </div>

         <div className="space-y-6">
            {(activeTab === 'revenue' || activeTab === 'roster') && (
               <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-wrap items-center gap-6 p-4 bg-white rounded-lg border border-gray-200 shadow-sm"
               >
                  <div className="flex items-center gap-3">
                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Range Filter</span>
                     <div className="flex items-center gap-2">
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold outline-none" />
                        <span className="text-gray-300">to</span>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold outline-none" />
                     </div>
                  </div>
                  <div className="h-6 w-[1px] bg-gray-200" />
                  <div className="flex gap-2">
                     {['month', '3months', 'year'].map(r => (
                        <button key={r} onClick={() => setRange(r as any)} className="px-4 py-1.5 hover:bg-gray-50 rounded-lg text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-blue-600 border border-transparent hover:border-blue-100 transition-all capitalize">{r === '3months' ? '90 Days' : r}</button>
                     ))}
                     <button onClick={() => { setStartDate(''); setEndDate(''); }} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={14} /></button>
                  </div>
               </motion.div>
            )}

            {activeTab === 'roster' && (
               <div className="space-y-8 animate-in fade-in duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                     <StatCard title="Total Cashflow" value={`₹${(totals.paid + totals.penalty).toLocaleString()}`} icon={IndianRupee} color="blue" trend="up" trendValue="Accumulated Inflow" />
                     <StatCard title="Active Handovers" value={bookings.filter(b => b.checked_out_at && !b.checked_in_at).length} icon={Activity} color="green" trendValue="Currently Dispatched" />
                     <StatCard title="Overdue Returns" value={bookings.filter(b => b.status !== 'completed' && isPast(new Date(b.end_time))).length} icon={AlertCircle} color="red" trendValue="SLA Breach Risks" />
                     <StatCard title="Completed Duties" value={bookings.filter(b => b.status === 'completed').length} icon={ClipboardCheck} color="blue" trendValue="Archived History" />
                  </div>

                  <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
                     <div className="p-4 border-b border-gray-50 flex gap-2 overflow-x-auto bg-gray-50/20">
                        {['all', 'uncompleted', 'overdue', 'completed'].map((tab) => (
                           <button key={tab} onClick={() => { setActiveSubTab(tab as any); setCurrentPage(1); }} className={clsx("px-5 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap", activeSubTab === tab ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "text-gray-400 hover:bg-gray-100")}>
                              {tab}
                           </button>
                        ))}
                     </div>
                     <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left min-w-[900px]">
                           <thead className="bg-gray-50/50 text-[10px] uppercase font-black text-gray-400 tracking-wider">
                              <tr>
                                 <th className="px-8 py-5">Resident/User</th>
                                 <th className="px-8 py-5">Particulars</th>
                                 <th className="px-8 py-5 text-center">Operational Window</th>
                                 <th className="px-8 py-5">Internal Status</th>
                                 <th className="px-8 py-5 text-right">Settlement</th>
                                 <th className="px-8 py-5 text-center">Protocol</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-50">
                              {filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((booking) => (
                                 <RegistryRow key={booking.id} booking={booking} onClick={() => setSelectedBooking(booking)} />
                              ))}
                           </tbody>
                        </table>
                     </div>
                     <Pagination total={filteredData.length} current={currentPage} itemsPerPage={itemsPerPage} onChange={setCurrentPage} />
                  </div>
               </div>
            )}

            {activeTab === 'pending' && (
               <div className="bg-white rounded-lg border border-gray-100 shadow-xl overflow-hidden animate-in fade-in zoom-in duration-500">
                  <div className="overflow-x-auto">
                     <table className="w-full text-left min-w-[900px]">
                        <thead className="bg-gray-50 text-[10px] uppercase font-black text-gray-400 tracking-wider">
                           <tr>
                              <th className="px-8 py-5">Resident/User</th>
                              <th className="px-8 py-5">Particulars</th>
                              <th className="px-8 py-5 text-center">Proposed Window</th>
                              <th className="px-8 py-5 text-right">Security Bond</th>
                              <th className="px-8 py-5 text-center">Protocol</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                           {filteredData.map((booking) => (
                              <RegistryRow key={booking.id} booking={booking} onClick={() => setSelectedBooking(booking)} mode="authorization" />
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
            )}

            {activeTab === 'revenue' && (
               <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                     <FinancialStatCard 
                       title="Gross Revenue" 
                       value={`₹${(totals.paid + totals.penalty).toLocaleString()}`} 
                       label="Total Collected Liquidity"
                       icon={<IndianRupee size={22} />}
                       color="blue"
                     />
                     <FinancialStatCard 
                       title="Security Bond Assets" 
                       value={`₹${totals.deposit.toLocaleString()}`} 
                       label="Currently Held Deposits"
                       icon={<ShieldCheck size={22} />}
                       color="emerald"
                     />
                     <FinancialStatCard 
                       title="Accrued Penalties" 
                       value={`₹${totals.penalty.toLocaleString()}`} 
                       label="SLA Violation Inflow"
                       icon={<TrendingUp size={22} />}
                       color="red"
                     />
                     <FinancialStatCard 
                       title="Net Settlement" 
                       value={`₹${(totals.paid + totals.penalty).toLocaleString()}`} 
                       label="Auditable Balance"
                       icon={<Activity size={22} />}
                       color="blue"
                     />
                  </div>

                  <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                     <table className="w-full text-left">
                        <thead className="bg-gray-50 text-[10px] uppercase font-black text-gray-400 tracking-wider">
                           <tr>
                              <th className="px-8 py-5">Registry ID</th>
                              <th className="px-8 py-5">Particulars</th>
                              <th className="px-8 py-5 text-right">Booking Fee</th>
                              <th className="px-8 py-5 text-right">Late Penalty</th>
                              <th className="px-8 py-5 text-right">Total Collection</th>
                              <th className="px-8 py-5 text-center">Payment Status</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                           {filteredData.map((booking) => (
                              <tr key={booking.id} className="hover:bg-blue-50/30 transition-colors group">
                                 <td className="px-8 py-5">
                                    <span className="text-[10px] font-black text-gray-400 group-hover:text-blue-600 transition-colors uppercase tracking-widest">{booking.booking_id}</span>
                                 </td>
                                 <td className="px-8 py-5">
                                    <p className="text-xs font-black text-gray-900 uppercase tracking-tight">{booking.asset_name}</p>
                                    <p className="text-[9px] text-gray-400 font-bold uppercase mt-1 tracking-widest">Ref: {booking.user_name}</p>
                                 </td>
                                 <td className="px-8 py-5 text-right text-xs font-bold text-gray-600">₹{booking.total_amount}</td>
                                 <td className="px-8 py-5 text-right text-xs font-bold text-red-500">₹{booking.final_penalty_amount || 0}</td>
                                 <td className="px-8 py-5 text-right text-sm font-black text-gray-900 font-mono">₹{Number(booking.total_amount) + Number(booking.final_penalty_amount || 0)}</td>
                                 <td className="px-8 py-5 text-center">
                                    <StatusPill status={booking.payment_status} type="payment" />
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </>
            )}
         </div>

         {/* Booking Detail Drawer */}
         {selectedBooking && (
            <BookingDetailDrawer
               booking={selectedBooking}
               onClose={() => setSelectedBooking(null)}
               onUpdate={handleUpdateStatus}
               onHandover={handleHandover}
               rejectionReason={rejectionReason}
               setRejectionReason={setRejectionReason}
               handoverRemarks={handoverRemarks}
               setHandoverRemarks={setHandoverRemarks}
               manualPenaltyRate={manualPenaltyRate}
               setManualPenaltyRate={setManualPenaltyRate}
               manualGracePeriod={manualGracePeriod}
               setManualGracePeriod={setManualGracePeriod}
               waivePenalty={waivePenalty}
               setWaivePenalty={setWaivePenalty}
               collectedPenalty={collectedPenalty}
               setCollectedPenalty={setCollectedPenalty}
            />
         )}
      </div>
   );
}

// --- Specific Table/List Components ---

function RegistryRow({ booking, onClick, mode = 'roster' }: any) {
   const isOverdue = booking.status !== 'completed' && isPast(new Date(booking.end_time));
   const isInSession = booking.checked_out_at && !booking.checked_in_at;

   return (
      <motion.tr 
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         className="hover:bg-blue-50/30 transition-all group cursor-pointer" 
         onClick={onClick}
      >
         <td className="px-8 py-5">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-gray-900 text-white rounded-lg flex items-center justify-center font-bold text-sm group-hover:scale-110 transition-transform shadow-sm">
                  {(booking.user_name || 'U').charAt(0)}
               </div>
               <div>
                  <p className="text-sm font-black text-gray-900 uppercase leading-none tracking-tight">{booking.user_name || 'Resident Member'}</p>
                  <p className="text-[9px] text-gray-400 font-bold uppercase mt-1.5 tracking-widest flex items-center gap-1.5">
                     <MapPin size={10} className="text-blue-500" /> Community Sector
                  </p>
               </div>
            </div>
         </td>
         <td className="px-8 py-5">
            <div className="flex flex-col">
               <span className="text-xs font-black text-gray-900 uppercase tracking-tight">{booking.asset_name}</span>
               <span className="text-[9px] font-bold text-gray-400 uppercase mt-1 tracking-widest leading-none">#{booking.booking_id}</span>
            </div>
         </td>
         <td className="px-8 py-5">
            <div className="flex flex-col items-center">
               <div className="flex items-center gap-2 text-[10px] font-black text-gray-900 uppercase tracking-tighter bg-gray-50 px-2 py-0.5 rounded-lg border border-gray-100">
                  <span>{booking.start_time ? format(new Date(booking.start_time), 'HH:mm') : '--:--'}</span>
                  <ChevronRight size={10} className="text-gray-300" />
                  <span>{booking.end_time ? format(new Date(booking.end_time), 'HH:mm') : '--:--'}</span>
               </div>
               <span className="text-[9px] text-gray-400 font-bold uppercase mt-1.5 tracking-widest">{booking.start_time ? format(new Date(booking.start_time), 'MMM dd, yyyy') : '---'}</span>
            </div>
         </td>
         {mode === 'roster' ? (
            <>
               <td className="px-8 py-5">
                  <StatusPill status={isInSession ? 'IN-SESSION' : booking.status} isOverdue={isOverdue} />
               </td>
               <td className="px-8 py-5 text-right">
                  <p className="text-sm font-black text-gray-900 leading-none tracking-tighter">₹{booking.total_amount}</p>
                  <p className={clsx(
                    "text-[9px] font-black uppercase mt-1 tracking-widest", 
                    booking.payment_status === 'paid' || booking.payment_status === 'free' ? 'text-emerald-500' : 'text-amber-500'
                  )}>
                     {booking.payment_status}
                  </p>
               </td>
            </>
         ) : (
            <td className="px-8 py-5 text-right">
               <span className="text-sm font-black text-gray-900 uppercase tracking-tight">₹{booking.deposit_amount}</span>
            </td>
         )}
         <td className="px-8 py-5 text-right">
            <button className="p-2 hover:bg-white border border-transparent hover:border-blue-200 rounded-xl shadow-sm transition-all text-gray-400 hover:text-blue-600 group-hover:translate-x-1">
               <ChevronRight size={20} />
            </button>
         </td>
      </motion.tr>
   );
}

function StatusPill({ status, isOverdue, type = 'booking' }: any) {
   const getStyles = () => {
      const s = status?.toLowerCase();
      if (type === 'payment') {
         if (s === 'paid' || s === 'free') return 'bg-emerald-50 text-emerald-600 border-emerald-100';
         return 'bg-amber-50 text-amber-600 border-amber-100';
      }

      if (isOverdue) return 'bg-red-50 text-red-600 border-red-100 shadow-sm shadow-red-100';
      if (s === 'in-session') return 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20';
      if (s === 'confirmed' || s === 'approved') return 'bg-blue-50 text-blue-600 border-blue-100';
      if (s === 'completed') return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      if (s === 'pending') return 'bg-amber-50 text-amber-600 border-amber-100';
      return 'bg-gray-50 text-gray-400 border-gray-100';
   };

   return (
      <div className={clsx("px-3 py-1.5 rounded-lg text-[9px] font-black uppercase border tracking-widest flex items-center gap-1.5", getStyles())}>
         {isOverdue && <AlertCircle size={10} />}
         {status?.toUpperCase()}
      </div>
   );
}

function Pagination({ total, current, itemsPerPage, onChange }: any) {
   const totalPages = Math.ceil(total / itemsPerPage);
   if (totalPages <= 1) return null;
   return (
      <div className="p-8 border-t border-gray-50 flex items-center justify-between bg-gray-50/30">
         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Displaying {Math.min(itemsPerPage, total)} of {total} Records</p>
         <div className="flex items-center gap-3">
            <button onClick={() => onChange(Math.max(1, current - 1))} disabled={current === 1} className="p-2 border rounded-lg bg-white disabled:opacity-30 transition-all"><ChevronLeft size={16} /></button>
            <span className="text-[10px] font-black text-gray-900 uppercase">Page {current} / {totalPages}</span>
            <button onClick={() => onChange(Math.min(total, current + 1))} disabled={current >= totalPages} className="p-2 border rounded-lg bg-white disabled:opacity-30 transition-all"><ChevronRight size={16} /></button>
         </div>
      </div>
   );
}
