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

// --- Helper Components & Functions ---

function formatDateSafe(date: any) {
   if (!date) return 'Awaiting...';
   const d = new Date(date);
   if (!isValid(d)) return 'Invalid Date';
   return format(d, 'MMM dd, HH:mm');
}

function MetricCard({ label, value, icon, color, status }: any) {
   const colors: any = {
      indigo: 'bg-indigo-600 text-white shadow-indigo-500/20',
      blue: 'bg-blue-600 text-white shadow-blue-500/20',
      emerald: 'bg-emerald-600 text-white shadow-emerald-500/20',
      amber: 'bg-amber-600 text-white shadow-amber-500/20'
   };
   const badgeColors: any = {
      indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100',
      blue: 'text-blue-600 bg-blue-50 border-blue-100',
      emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
      amber: 'text-amber-600 bg-amber-50 border-amber-100'
   };
   return (
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-4 group hover:shadow-xl transition-all h-full">
         <div className="flex items-center justify-between">
            <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover:scale-110 shadow-lg", colors[color])}>
               {icon}
            </div>
            <div className={clsx("text-[8px] font-black uppercase tracking-[0.1em] px-2 py-1 rounded-md border", badgeColors[color])}>
               {status}
            </div>
         </div>
         <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 leading-none">{label}</p>
            <h3 className="text-xl font-bold text-gray-900 tracking-tight leading-none uppercase">{value}</h3>
         </div>
      </div>
   );
}

function HandoverInput({ label, value, onChange, color }: any) {
   const border = color === 'emerald' ? 'border-emerald-100 focus:ring-emerald-200' : 'border-blue-100 focus:ring-blue-200';
   const text = color === 'emerald' ? 'text-emerald-600' : 'text-blue-600';
   return (
      <div className="space-y-1">
         <label className={`text-[9px] font-black ${text} uppercase tracking-widest`}>{label}</label>
         <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} className={`w-full px-3 py-2 bg-white border rounded-lg text-sm font-bold shadow-sm outline-none focus:ring-2 ${border}`} />
      </div>
   );
}

const TabButton = ({ active, onClick, icon, label }: any) => (
   <button
      onClick={onClick}
      className={clsx(
         "flex items-center gap-2 px-6 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
         active ? "bg-white text-gray-900 shadow-lg border border-gray-100" : "text-gray-400 hover:text-gray-600"
      )}
   >
      {icon} {label}
   </button>
);

const RangeBtn = ({ onClick, label }: any) => (
   <button onClick={onClick} className="px-3 py-1.5 hover:bg-white hover:shadow-sm rounded-lg text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-blue-600 transition-all">{label}</button>
);

const RevenueStat = ({ label, value, color }: any) => {
   const colors: any = {
      blue: 'bg-blue-600 text-white shadow-blue-500/20',
      emerald: 'bg-emerald-600 text-white shadow-emerald-500/20',
      indigo: 'bg-indigo-600 text-white shadow-indigo-500/20'
   };
   return (
      <div className={clsx("p-5 rounded-2xl border flex flex-col items-end min-w-[150px] shadow-sm bg-white", colors[color])}>
         <p className="text-[9px] font-bold uppercase tracking-widest mb-1 opacity-70">{label}</p>
         <h4 className="text-xl font-bold leading-none uppercase tracking-tight">{value}</h4>
      </div>
   );
}

const MetricSquare = ({ label, value, color }: any) => {
   const colors: any = {
      blue: 'bg-blue-600 shadow-blue-500/30',
      amber: 'bg-amber-600 shadow-amber-500/30',
      emerald: 'bg-emerald-600 shadow-emerald-500/30'
   };
   return (
      <div className={clsx("p-5 rounded-2xl shadow-lg flex flex-col items-end min-w-[150px]", colors[color])}>
         <p className="text-[9px] font-bold text-white/70 uppercase tracking-widest mb-1">{label}</p>
         <h4 className="text-xl font-bold text-white leading-none uppercase tracking-tight">{value}</h4>
      </div>
   );
}

function BookingDetailDrawer({
   booking, onClose, onUpdate, onHandover, rejectionReason, setRejectionReason, handoverRemarks, setHandoverRemarks,
   manualPenaltyRate, setManualPenaltyRate, manualGracePeriod, setManualGracePeriod, waivePenalty, setWaivePenalty,
   collectedPenalty, setCollectedPenalty
}: any) {
   const timeline = [
      { id: 'requested', label: 'Reservation Requested', date: booking.created_at, icon: <Clock size={14} />, status: 'completed' },
      {
         id: 'approved',
         label: booking.status === 'cancelled' ? 'User Cancellation' : booking.status === 'rejected' ? 'Admin Rejection' : 'Admin Approval',
         date: booking.updated_at,
         icon: <ShieldCheck size={14} />,
         status: ['confirmed', 'completed', 'approved'].includes(booking.status) ? 'completed' : ['rejected', 'cancelled'].includes(booking.status) ? 'failed' : 'pending'
      },
      { id: 'outbound', label: 'Asset Handover (Checkout)', date: booking.checked_out_at, icon: <LogOut size={14} />, status: booking.checked_out_at ? 'completed' : (booking.status === 'cancelled' || booking.status === 'rejected') ? 'failed' : 'pending' },
      { id: 'inbound', label: 'Asset Return (Checkin)', date: booking.checked_in_at, icon: <LogIn size={14} />, status: booking.checked_in_at ? 'completed' : (booking.status === 'cancelled' || booking.status === 'rejected') ? 'failed' : 'pending' }
   ];

   const currentTime = new Date();
   const endTime = new Date(booking.end_time);
   const diffMins = Math.max(0, Math.floor((currentTime.getTime() - endTime.getTime()) / (1000 * 60)));
   const calculatedPenalty = (diffMins > manualGracePeriod) ? Math.ceil((diffMins - manualGracePeriod) / 60) * manualPenaltyRate : 0;

   return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex justify-end overflow-hidden">
         <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
               <div>
                  <h3 className="text-xl font-bold text-gray-900 uppercase tracking-tighter">Reservation Control</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-widest">System Identifier: {booking.booking_id}</p>
               </div>
               <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-all"><X size={20} className="text-gray-400" /></button>
            </div>

            <div className="p-8 flex-1 overflow-y-auto space-y-8 custom-scrollbar">
               <div className="flex items-center gap-6 p-6 bg-blue-50 rounded-2xl border border-blue-100 shadow-sm">
                  <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                     <Package size={32} />
                  </div>
                  <div>
                     <h4 className="text-2xl font-black text-gray-900 uppercase tracking-tight leading-none mb-2">{booking.asset_name}</h4>
                     <p className="text-[10px] text-blue-600 font-black bg-white px-2 py-0.5 rounded shadow-sm w-fit uppercase tracking-tighter">Status: {(booking.status || 'Pending').toUpperCase()}</p>
                  </div>
               </div>

               <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Logistical Duty Operations</h4>

                  {booking.status === 'confirmed' && !booking.checked_out_at && (
                     <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-6 shadow-lg">
                        <p className="text-xs font-black text-emerald-900 uppercase tracking-tight flex items-center gap-2"><LogOut size={16} /> Handover Protocol</p>
                        <div className="grid grid-cols-2 gap-4">
                           <HandoverInput label="Late Rate (₹/hr)" value={manualPenaltyRate} onChange={setManualPenaltyRate} color="emerald" />
                           <HandoverInput label="Grace Window (min)" value={manualGracePeriod} onChange={setManualGracePeriod} color="emerald" />
                        </div>
                        <textarea placeholder="Enter handover remarks..." value={handoverRemarks} onChange={(e) => setHandoverRemarks(e.target.value)} className="w-full px-4 py-3 bg-white border border-emerald-100 rounded-xl text-sm outline-none resize-none h-24" />
                        <button onClick={() => onHandover(booking.id, 'checkout')} className="w-full py-4 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 transition-all">Record Asset Outflow</button>
                     </div>
                  )}

                  {booking.checked_out_at && !booking.checked_in_at && (
                     <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 space-y-6 shadow-lg">
                        <p className="text-xs font-black text-blue-900 uppercase tracking-tight flex items-center gap-2"><LogIn size={16} /> Return & Settle Account</p>
                        <div className="bg-white p-6 rounded-2xl border border-blue-200 shadow-inner">
                           <div className="flex justify-between items-center mb-6">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Calculated Late Liability</p>
                              <p className="text-xl font-bold text-red-600 font-mono">₹{calculatedPenalty}</p>
                           </div>
                           <label className="flex items-center gap-3 cursor-pointer bg-gray-50 p-3 rounded-xl border border-gray-100">
                              <input type="checkbox" checked={waivePenalty} onChange={(e) => {
                                 setWaivePenalty(e.target.checked);
                                 setCollectedPenalty(e.target.checked ? 0 : calculatedPenalty);
                              }} className="w-5 h-5 rounded-lg border-gray-300 text-blue-600 focus:ring-blue-500" />
                              <span className="text-xs font-black text-gray-700 uppercase">Waive Final Penalty Protocol</span>
                           </label>
                           {!waivePenalty && (
                              <div className="mt-6 space-y-2">
                                 <label className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Adjusted Settlement (₹)</label>
                                 <input type="number" value={collectedPenalty} onChange={(e) => setCollectedPenalty(Number(e.target.value))} className="w-full px-4 py-3 bg-white border-2 border-blue-600 rounded-xl text-lg font-black text-blue-600 shadow-sm outline-none" />
                              </div>
                           )}
                        </div>
                        <textarea placeholder="Enter return condition remarks..." value={handoverRemarks} onChange={(e) => setHandoverRemarks(e.target.value)} className="w-full px-4 py-3 bg-white border border-blue-100 rounded-xl text-sm outline-none resize-none h-24" />
                        <button onClick={() => onHandover(booking.id, 'checkin')} className="w-full py-4 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-all">Record Asset Return</button>
                     </div>
                  )}

                  {booking.status === 'pending' && (
                     <div className="pt-4 space-y-6">
                        <button onClick={() => onUpdate(booking.id, 'confirmed')} className="w-full py-4 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-all">Authorize Reservation Protocol</button>
                        <div className="p-6 bg-red-50 rounded-2xl border border-red-100 space-y-4">
                           <label className="text-[9px] font-black text-red-500 uppercase tracking-widest">Formal Denial Justification</label>
                           <textarea placeholder="State reason..." value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} className="w-full px-4 py-3 bg-white border border-red-200 rounded-xl text-sm font-bold outline-none h-24 focus:ring-4 focus:ring-red-100 transition-all uppercase" />
                           <button disabled={!rejectionReason} onClick={() => onUpdate(booking.id, 'rejected', rejectionReason)} className="w-full py-3 bg-red-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all">Execute Denial</button>
                        </div>
                     </div>
                  )}
               </div>

               {/* Full Timeline Restoration */}
               <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Reservation Lifecycle Audit</h4>
                  <div className="relative pl-6 space-y-8 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-100">
                     {timeline.map((item, idx) => (
                        <div key={idx} className="relative">
                           <div className={clsx(
                              "absolute left-[-21px] top-1 w-[12px] h-[12px] rounded-full border-2 border-white shadow-sm ring-4 ring-white z-10",
                              item.status === 'completed' ? "bg-blue-600" : item.status === 'failed' ? "bg-red-500" : "bg-gray-200"
                           )} />
                           <div className="flex justify-between items-start">
                              <div>
                                 <p className="text-xs font-black text-gray-900 uppercase leading-none">{item.label}</p>
                                 <p className="text-[10px] text-gray-400 font-bold mt-1 tracking-tight">{formatDateSafe(item.date)}</p>
                                 {item.id === 'approved' && booking.checked_out_at && (
                                    <div className="mt-2 p-3 bg-gray-50 rounded-xl border border-gray-100 flex gap-4">
                                       <div>
                                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Late Rate (₹/hr)</p>
                                          <p className="text-[11px] font-black text-blue-600 uppercase tracking-tight leading-none">{booking.manual_penalty_rate || 10}</p>
                                       </div>
                                       <div className="w-[1px] bg-gray-200" />
                                       <div>
                                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Grace Window (min)</p>
                                          <p className="text-[11px] font-black text-blue-600 uppercase tracking-tight leading-none">{booking.manual_grace_period || 15}</p>
                                       </div>
                                    </div>
                                 )}
                              </div>
                              <div className={clsx("p-1.5 rounded-lg", item.status === 'completed' ? "bg-blue-50 text-blue-600" : "bg-gray-50 text-gray-300")}>
                                 {item.icon}
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>

               {/* Member/Financial Breakdown Restoration */}
               <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Fiscal Components</h4>
                  <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
                     <div className="flex justify-between">
                        <span className="text-xs font-bold text-gray-500 uppercase">Base Fare</span>
                        <span className="text-xs font-black text-gray-900">₹{booking.total_amount}</span>
                     </div>
                     <div className="flex justify-between">
                        <span className="text-xs font-bold text-gray-500 uppercase">Security Deposit</span>
                        <span className="text-xs font-black text-gray-900">₹{booking.deposit_amount}</span>
                     </div>
                     {booking.final_penalty_amount > 0 && (
                        <div className="flex justify-between">
                           <span className="text-xs font-bold text-red-500 uppercase">Late Penalty</span>
                           <span className="text-xs font-black text-red-600">₹{booking.final_penalty_amount}</span>
                        </div>
                     )}
                     <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                        <span className="text-[10px] font-black text-gray-900 uppercase">Gross Audit Value</span>
                        <span className="text-lg font-black text-blue-600">₹{Number(booking.total_amount) + Number(booking.final_penalty_amount || 0)}</span>
                     </div>
                  </div>
               </div>

               <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Member Identification</h4>
                  <div className="flex items-center gap-4 p-4 border border-gray-100 rounded-2xl">
                     <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-white font-black text-sm">
                        {(booking.user_name || 'U').charAt(0)}
                     </div>
                     <div>
                        <p className="text-sm font-black text-gray-900 uppercase leading-none">{booking.user_name || 'Resident Member'}</p>
                        <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">Role: Community Participant</p>
                     </div>
                  </div>
               </div>
            </div>
         </div>
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
      <div className="p-8 space-y-10 max-w-[1600px] mx-auto min-h-screen bg-[#F8FAFC]">
         {/* Header Section */}
         <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 shrink-0">
            <div className="space-y-4">
               <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-600 rounded-2xl shadow-xl shadow-blue-500/20 text-white">
                     <Package size={28} strokeWidth={2.5} />
                  </div>
                  <div>
                     <h1 className="text-2xl font-bold text-gray-900 tracking-tight uppercase leading-none">Asset Booking Management</h1>
                     <p className="text-[10px] text-blue-600 font-bold uppercase mt-1 tracking-widest flex items-center gap-2">
                        <ShieldCheck size={12} /> Audit-Ready Cashflow & Deposit Reconciliation
                     </p>
                  </div>
               </div>

               <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl w-fit border border-gray-200">
                  <TabButton active={activeTab === 'roster'} onClick={() => setActiveTab('roster')} icon={<LogOut size={14} />} label="Duty Roster" />
                  <TabButton active={activeTab === 'pending'} onClick={() => setActiveTab('pending')} icon={<Zap size={14} />} label="Pending Authorizations" />
                  <TabButton active={activeTab === 'revenue'} onClick={() => setActiveTab('revenue')} icon={<IndianRupee size={14} />} label="Revenue Ledger" />
               </div>
            </div>

            <div className="flex items-center gap-4">
               <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={16} />
                  <input
                     type="text"
                     placeholder="Search registry indices..."
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="pl-12 pr-6 py-4 bg-white border border-gray-100 rounded-2xl text-xs font-bold uppercase tracking-widest shadow-sm focus:ring-4 focus:ring-blue-100 outline-none transition-all w-full md:w-[320px] placeholder:text-gray-300"
                  />
               </div>
            </div>
         </div>

         <div className="space-y-6">
            {(activeTab === 'revenue' || activeTab === 'pending' || activeTab === 'roster') && (
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm animate-in slide-in-from-top duration-500">
                  <div className="flex flex-wrap items-center gap-4">
                     {(activeTab === 'revenue' || activeTab === 'roster') && (
                        <>
                           <div className="flex items-center gap-2">
                              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">From</label>
                              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="px-3 py-1.5 bg-gray-50 border rounded-lg text-xs font-bold outline-none" />
                           </div>
                           <div className="flex items-center gap-2">
                              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">To</label>
                              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="px-3 py-1.5 bg-gray-50 border rounded-lg text-xs font-bold outline-none" />
                           </div>
                           <div className="flex gap-1 ml-4">
                              <RangeBtn onClick={() => setRange('month')} label="This Month" />
                              <RangeBtn onClick={() => setRange('3months')} label="3 Months" />
                              <RangeBtn onClick={() => setRange('year')} label="This Year" />
                              <button onClick={() => { setStartDate(''); setEndDate(''); }} className="p-2 hover:bg-red-50 text-red-400 rounded-lg transition-all"><Trash2 size={14} /></button>
                           </div>
                        </>
                     )}
                     {activeTab === 'pending' && <h2 className="text-xs font-black text-amber-600 uppercase tracking-widest flex items-center gap-2"><Zap size={14} /> High Priority: Authorizations Queue</h2>}
                  </div>

                  <button
                     onClick={() => handleExport(filteredData, activeTab === 'revenue' ? 'Asset Financial Ledger' : 'Asset Booking Report')}
                     className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                  >
                     <Download size={14} /> Generate Export
                  </button>
               </div>
            )}

            {activeTab === 'roster' && (
               <div className="space-y-6 animate-in fade-in duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                     <MetricCard label="Total Inflow" value={`₹${totals.paid + totals.penalty}`} icon={<IndianRupee size={18} />} color="indigo" status="Audit Sum" />
                     <MetricCard label="Field Status" value={bookings.filter(b => b.checked_out_at && !b.checked_in_at).length} icon={<Activity size={18} />} color="blue" status="In-Session" />
                     <MetricCard label="Risk Assessment" value={bookings.filter(b => b.status !== 'completed' && isPast(new Date(b.end_time))).length} icon={<AlertCircle size={18} />} color="amber" status="Overdue" />
                     <MetricCard label="Completed Duty" value={bookings.filter(b => b.status === 'completed').length} icon={<ClipboardCheck size={18} />} color="emerald" status="Archive" />
                  </div>

                  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
                     <div className="p-4 border-b border-gray-50 flex gap-2 overflow-x-auto bg-gray-50/20">
                        {['all', 'uncompleted', 'overdue', 'completed'].map((tab) => (
                           <button key={tab} onClick={() => { setActiveSubTab(tab as any); setCurrentPage(1); }} className={clsx("px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap", activeSubTab === tab ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "text-gray-400 hover:bg-gray-100")}>
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
               <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden animate-in fade-in zoom-in duration-500">
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
               <div className="space-y-10 animate-in fade-in duration-500">
                  <div className="p-10 border-b border-gray-100 bg-white rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/50">
                     <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
                        <div>
                           <h3 className="text-xl font-bold text-gray-900 uppercase tracking-tight">Asset Financial Ledger</h3>
                           <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">Audit-Ready Cashflow & Deposit Reconciliation</p>
                        </div>
                        <div className="flex flex-wrap gap-4">
                           <RevenueStat label="Gross Collection" value={`₹${(totals.paid + totals.penalty).toLocaleString()}`} color="blue" />
                           <MetricSquare label="Security Held" value={`₹${totals.deposit.toLocaleString()}`} color="amber" />
                           <RevenueStat label="Net Liquidity" value={`₹${(totals.paid + totals.penalty).toLocaleString()}`} color="emerald" />
                        </div>
                     </div>
                  </div>

                  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
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
                              <tr key={booking.id} className="hover:bg-gray-50 transition-colors group">
                                 <td className="px-8 py-5">
                                    <span className="text-[10px] font-black text-gray-400 group-hover:text-blue-600 transition-colors uppercase tracking-widest">{booking.booking_id}</span>
                                 </td>
                                 <td className="px-8 py-5">
                                    <p className="text-xs font-black text-gray-900 uppercase tracking-tight">{booking.asset_name}</p>
                                    <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">Ref: {booking.user_name}</p>
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
               </div>
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
      <tr className="hover:bg-blue-50/30 transition-all group cursor-pointer" onClick={onClick}>
         <td className="px-8 py-5">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg group-hover:scale-110 transition-transform">
                  {(booking.user_name || 'U').charAt(0)}
               </div>
               <div>
                  <p className="text-sm font-black text-gray-900 uppercase leading-none">{booking.user_name || 'Resident Member'}</p>
                  <p className="text-[9px] text-gray-400 font-bold uppercase mt-1.5 tracking-widest flex items-center gap-1.5">
                     <Globe size={10} /> Community Node
                  </p>
               </div>
            </div>
         </td>
         <td className="px-8 py-5">
            <div className="flex flex-col">
               <span className="text-xs font-black text-gray-900 uppercase tracking-tight">{booking.asset_name}</span>
               <span className="text-[9px] font-bold text-gray-400 uppercase mt-1 tracking-widest">{booking.booking_id}</span>
            </div>
         </td>
         <td className="px-8 py-5">
            <div className="flex flex-col items-center">
               <div className="flex items-center gap-2 text-[10px] font-black text-gray-900 uppercase tracking-tighter">
                  <span>{booking.start_time ? format(new Date(booking.start_time), 'HH:mm') : '--:--'}</span>
                  <ChevronRight size={10} className="text-gray-300" />
                  <span>{booking.end_time ? format(new Date(booking.end_time), 'HH:mm') : '--:--'}</span>
               </div>
               <span className="text-[9px] text-gray-400 font-bold uppercase mt-1 tracking-widest">{booking.start_time ? format(new Date(booking.start_time), 'MMM dd') : '---'}</span>
            </div>
         </td>
         {mode === 'roster' ? (
            <>
               <td className="px-8 py-5">
                  <div className="flex items-center gap-3">
                     <StatusPill status={isInSession ? 'IN-SESSION' : booking.status} isOverdue={isOverdue} />
                  </div>
               </td>
               <td className="px-8 py-5 text-right">
                  <p className="text-sm font-black text-gray-900 leading-none uppercase">₹{booking.total_amount}</p>
                  <p className={clsx("text-[9px] font-black uppercase mt-1 tracking-widest", booking.payment_status === 'paid' || booking.payment_status === 'free' ? 'text-emerald-500' : 'text-amber-500')}>
                     {booking.payment_status}
                  </p>
               </td>
            </>
         ) : (
            <td className="px-8 py-5 text-right">
               <span className="text-sm font-black text-gray-900 uppercase tracking-tight">₹{booking.deposit_amount}</span>
            </td>
         )}
         <td className="px-8 py-5">
            <div className="flex justify-center">
               <button className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-[9px] font-bold uppercase tracking-widest hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/20 active:scale-95 transition-all">Execute Control</button>
            </div>
         </td>
      </tr>
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
