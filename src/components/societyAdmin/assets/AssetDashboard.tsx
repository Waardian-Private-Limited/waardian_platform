'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Package, Clock, History, Calendar, RefreshCw, 
  TrendingUp, TrendingDown, IndianRupee, CreditCard, Receipt, MapPin,
  CheckCircle2, AlertCircle, Wrench, Boxes, ChevronRight,
  LayoutGrid, Activity, ShieldCheck, Zap, X, Map, User, Info, CheckCircle,
  FileText, ArrowDownRight, ArrowUpRight
} from 'lucide-react';
import { getAllBookings, getDashboardSummary, AssetBooking } from '@/lib/apiClient';
import { toast } from 'react-hot-toast';
import { format, isValid } from 'date-fns';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';

export default function AssetDashboard() {
  const [bookings, setBookings] = useState<AssetBooking[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<AssetBooking | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const router = useRouter();

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [bookingsRes, summaryRes] = await Promise.all([
        getAllBookings(),
        getDashboardSummary()
      ]);
      if (bookingsRes.success) setBookings(bookingsRes.data || []);
      if (summaryRes.success) setSummary(summaryRes.data);
    } catch (error) {
      toast.error('Dashboard synchronization failure');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return bookings.slice(start, start + itemsPerPage);
  }, [bookings, currentPage]);

  const totalPages = Math.ceil(bookings.length / itemsPerPage);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="animate-spin text-blue-600" size={40} />
        <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.3em]">Accessing Resource Metrics...</p>
      </div>
    );
  }

  const inventory = summary?.inventory || {};
  const totalAssets = inventory.total || 1;
  const stats = [
    { label: 'Total Inventory', value: inventory.total || 0, color: 'indigo', icon: <Package size={20} />, progress: 100 },
    { label: 'Operational', value: inventory.available || 0, color: 'emerald', icon: <CheckCircle2 size={20} />, progress: (inventory.available / totalAssets) * 100 },
    { label: 'Diagnostic', value: inventory.maintenance || 0, color: 'amber', icon: <Wrench size={20} />, progress: (inventory.maintenance / totalAssets) * 100 },
    { label: 'Offline / Lost', value: inventory.missing || 0, color: 'red', icon: <AlertCircle size={20} />, progress: (inventory.missing / totalAssets) * 100 },
  ];

  const categories = summary?.categories || [];
  const locations = summary?.locations || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Detail Drawer */}
      {isDrawerOpen && selectedBooking && (
        <BookingDetailDrawer 
           booking={selectedBooking} 
           onClose={() => { setIsDrawerOpen(false); setSelectedBooking(null); }} 
        />
      )}

      {/* Header & Navigation */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-gray-100">
         <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tighter uppercase leading-none mb-3">Resource Dashboard</h1>
            <div className="inline-flex p-1 bg-gray-50 border border-gray-100 rounded-lg">
               <button 
                 onClick={() => router.push('/societyadmin/asset-list')}
                 className="px-6 py-2 rounded text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-all"
               >
                 Registry View
               </button>
               <button 
                 className="px-6 py-2 rounded text-[10px] font-black uppercase tracking-widest bg-blue-600 text-white shadow-lg shadow-blue-500/10 transition-all"
               >
                 Diagnostic Center
               </button>
            </div>
         </div>
         <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-lg text-blue-600">
            <Activity size={14} className="animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest leading-none">Telemetry Linked</span>
         </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
        {stats.map((s, idx) => (
          <MetricCard key={idx} {...s} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-12 xl:col-span-5">
           <div className="bg-white p-8 rounded-lg border border-gray-100 shadow-sm h-full flex flex-col">
              <div className="flex items-center justify-between mb-10 pb-4 border-b border-gray-50">
                 <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-3">
                    <LayoutGrid size={14} className="text-blue-600" />
                    Asset Distribution Matrix
                 </h3>
                 <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded">CATEGORICAL</span>
              </div>
              <div className="grid grid-cols-2 gap-4 flex-1">
                {categories.length > 0 ? categories.slice(0, 4).map((cat: any, i: number) => (
                  <div key={i} className={clsx(
                    "p-6 rounded border flex flex-col gap-2 transition-all group cursor-default",
                    i === 0 ? "bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-500/10" : "bg-white border-gray-100 text-gray-400 hover:border-blue-600 hover:bg-blue-50 hover:text-blue-600"
                  )}>
                    <span className={clsx("text-[9px] font-black uppercase tracking-widest leading-none mb-2", i === 0 ? "opacity-60" : "opacity-40 group-hover:opacity-100 transition-opacity")}>{cat.category || 'GENERAL'}</span>
                    <span className={clsx("text-4xl font-black tracking-tighter flex items-end gap-2", i === 0 ? "text-white" : "text-gray-900 group-hover:text-blue-600 transition-colors")}>
                       {cat.count}
                       <span className="text-[10px] mb-2 font-black opacity-40 uppercase tracking-widest">Units</span>
                    </span>
                  </div>
                )) : (
                  <div className="col-span-2 py-20 text-center opacity-20">
                     <Boxes size={40} className="mx-auto mb-4" />
                     <p className="text-[10px] font-black uppercase tracking-widest">No Categories Defined</p>
                  </div>
                )}
              </div>
           </div>
        </div>

        <div className="lg:col-span-12 xl:col-span-7">
           <div className="bg-white p-8 rounded-lg border border-gray-100 shadow-sm h-full flex flex-col">
              <div className="flex items-center justify-between mb-10 pb-4 border-b border-gray-50">
                 <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-3">
                    <MapPin size={14} className="text-emerald-500" />
                    Tactical Resource Mapping
                 </h3>
                 <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">By Sector</span>
              </div>
              <div className="space-y-8 flex-1">
                {locations.length > 0 ? locations.slice(0, 4).map((loc: any, i: number) => {
                  const percentage = Math.round((loc.count / (summary?.inventory?.total || 1)) * 100);
                  return (
                    <div key={i} className="space-y-4 group">
                      <div className="flex justify-between items-end">
                        <div className="flex items-center gap-3">
                           <div className="w-6 h-6 bg-gray-50 rounded flex items-center justify-center text-[10px] font-black text-gray-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">0{i+1}</div>
                           <span className="text-[11px] font-black text-gray-900 uppercase tracking-tight">{loc.location || 'GLOBAL DEPOT'}</span>
                        </div>
                        <span className="text-[10px] font-black text-emerald-600 px-2 py-1 bg-emerald-50 rounded border border-emerald-100 leading-none">{percentage}% Ops Capacity</span>
                      </div>
                      <div className="w-full bg-gray-50 h-2 rounded-full overflow-hidden border border-gray-100 relative group-hover:h-3 transition-all duration-300">
                        <div 
                          className="absolute inset-y-0 left-0 bg-emerald-500 h-full shadow-lg shadow-emerald-500/10 transition-all duration-1000 group-hover:bg-emerald-600" 
                          style={{ width: `${percentage}%` }} 
                        />
                      </div>
                    </div>
                  );
                }) : (
                  <div className="py-20 text-center opacity-20">
                     <MapPin size={40} className="mx-auto mb-4" />
                     <p className="text-[10px] font-black uppercase tracking-widest">Location Telemetry Offline</p>
                  </div>
                )}
              </div>
           </div>
        </div>
      </div>

      {/* Reservation Log */}
      <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden mb-10">
        <div className="p-8 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/20">
           <div>
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 leading-none">Confirmed Reservations Log</h3>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest opacity-60">High-priority operational scheduling</p>
           </div>
           
           <div className="flex items-center gap-3">
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mr-4">
                 Page <span className="text-gray-900">{currentPage}</span> of <span className="text-gray-900">{totalPages || 1}</span>
              </p>
              <button 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={clsx(
                   "p-2 rounded border transition-all active:scale-95",
                   currentPage === 1 ? "bg-gray-50 border-gray-100 text-gray-200 cursor-not-allowed" : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-blue-600"
                )}
              >
                 <ArrowDownRight className="rotate-45" size={16} />
              </button>
              <button 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || totalPages === 0}
                className={clsx(
                   "p-2 rounded border transition-all active:scale-95",
                   currentPage === totalPages || totalPages === 0 ? "bg-gray-50 border-gray-100 text-gray-200 cursor-not-allowed" : "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/10 hover:bg-blue-700"
                )}
              >
                 <ArrowUpRight className="rotate-45" size={16} />
              </button>
           </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left">
            <thead className="bg-white text-[9px] font-black uppercase text-gray-400 tracking-[0.2em] border-b border-gray-100">
              <tr>
                <th className="px-8 py-5">Resident Profile</th>
                <th className="px-8 py-5">Target Asset</th>
                <th className="px-8 py-5">Transaction Status</th>
                <th className="px-8 py-5">Schedule</th>
                <th className="px-8 py-5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedBookings.length > 0 ? paginatedBookings.map((b, i) => (
                <tr 
                  key={i} 
                  className="hover:bg-gray-50 transition-all cursor-pointer group"
                  onClick={() => { setSelectedBooking(b); setIsDrawerOpen(true); }}
                >
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 border border-blue-100 rounded bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] font-black uppercase shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                        {b.user_name?.charAt(0) || 'U'}
                      </div>
                      <span className="text-[11px] font-black text-gray-900 uppercase tracking-tight">{b.user_name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-50 rounded border border-gray-100 group-hover:border-blue-200 transition-colors">
                        <Package size={14} className="text-gray-400 group-hover:text-blue-600" />
                      </div>
                      <span className="text-[11px] font-bold text-gray-700 uppercase leading-none">{b.asset_name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className={clsx(
                      "px-3 py-1.5 rounded text-[9px] font-black border flex items-center w-fit gap-2 uppercase tracking-widest shadow-sm",
                      b.status === 'confirmed' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                      b.status === 'pending' ? "bg-amber-50 text-amber-600 border-amber-100" :
                      "bg-gray-50 text-gray-500 border-gray-200"
                    )}>
                      <div className={clsx("w-1.5 h-1.5 rounded-full animate-pulse", 
                        b.status === 'confirmed' ? "bg-emerald-500" :
                        b.status === 'pending' ? "bg-amber-500" : "bg-gray-400"
                      )} />
                      {b.status}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                     <span className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2">
                        <Calendar size={12} className="text-gray-300" />
                        {isValid(new Date(b.start_time)) ? format(new Date(b.start_time), 'dd MMM, HH:mm') : 'N/A'}
                     </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button className="p-2 hover:bg-white border border-transparent hover:border-blue-100 rounded shadow-sm transition-all text-gray-300 hover:text-blue-600">
                      <ChevronRight size={18} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr className="opacity-30">
                  <td colSpan={5} className="py-20 text-center">
                     <History size={40} className="mx-auto mb-4" />
                     <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 font-medium">No Historical Logs Detected</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function BookingDetailDrawer({ booking, onClose }: { booking: AssetBooking, onClose: () => void }) {
   return (
      <div className="fixed inset-0 z-[120] flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
         <div className="w-full max-w-lg bg-gray-50 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
             {/* Drawer Header */}
             <div className="bg-white p-8 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                      <Calendar size={24} />
                   </div>
                   <div>
                      <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter leading-none mb-1">Reservation Protocol</h2>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Transaction ID: #{booking.id}</p>
                   </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-all active:scale-90 text-gray-400"><X size={24} /></button>
             </div>

             <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                {/* Status Strip */}
                <div className={clsx(
                   "p-4 rounded-lg border flex items-center justify-between shadow-sm",
                   booking.status === 'confirmed' ? "bg-emerald-50 border-emerald-100" : "bg-amber-50 border-amber-100"
                )}>
                   <div className="flex items-center gap-3">
                      <CheckCircle className={booking.status === 'confirmed' ? "text-emerald-600" : "text-amber-600"} size={20} />
                      <span className="text-[11px] font-black uppercase tracking-widest text-gray-900">Current State: {booking.status}</span>
                   </div>
                   <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest opacity-60">Verified Alpha</span>
                </div>

                {/* Primary Intelligence */}
                <div className="grid grid-cols-2 gap-4">
                   <InfoCard label="Asset Entity" value={booking.asset_name} icon={<Package size={16} />} color="blue" />
                   <InfoCard label="Resident Profile" value={booking.user_name} icon={<User size={16} />} color="indigo" />
                </div>

                {/* Logistics */}
                <div className="bg-white rounded-lg border border-gray-100 p-6 space-y-6 shadow-sm">
                   <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-50 pb-4">Logistical Timeline</h3>
                   
                   <div className="space-y-6">
                      <div className="flex items-start gap-4 group">
                         <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded flex items-center justify-center border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-all">
                            <Clock size={16} />
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Check-In Event</p>
                            <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{isValid(new Date(booking.start_time)) ? format(new Date(booking.start_time), 'EEEE, dd MMM yyyy @ HH:mm') : 'UNSCHEDULED'}</p>
                         </div>
                      </div>

                      <div className="flex items-start gap-4 group">
                         <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded flex items-center justify-center border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                            <ArrowDownRight size={16} />
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Check-Out Event</p>
                            <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{isValid(new Date(booking.end_time)) ? format(new Date(booking.end_time), 'EEEE, dd MMM yyyy @ HH:mm') : 'UNSCHEDULED'}</p>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Financial Meta */}
                <div className="bg-white rounded-lg border border-gray-100 p-6 shadow-sm">
                   <div className="flex items-center justify-between mb-6">
                      <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Financial Clearance</h3>
                      <div className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[8px] font-black rounded uppercase tracking-widest border border-emerald-100">Settled</div>
                   </div>
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-gray-50 rounded flex items-center justify-center border border-gray-100">
                            <IndianRupee size={18} className="text-gray-400" />
                         </div>
                         <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest opacity-60">Gross Liability</p>
                            <p className="text-xl font-black text-gray-900 tracking-tighter">₹{Number(booking.total_amount).toLocaleString()}</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest opacity-60 mb-1">Security Bond</p>
                         <p className="text-xs font-black text-emerald-600 uppercase tracking-tight">₹{Number(booking.deposit_amount).toLocaleString()}</p>
                      </div>
                   </div>
                </div>

                {/* Technical Diagnostics */}
                {booking.notes && (
                  <div className="bg-gray-950 p-6 rounded-lg text-white shadow-2xl relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-4 opacity-10">
                        <FileText size={40} />
                     </div>
                     <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Zap size={14} fill="currentColor" />
                        Administrator Directives
                     </p>
                     <p className="text-xs font-bold text-gray-300 italic leading-relaxed uppercase tracking-tight">"{booking.notes}"</p>
                  </div>
                )}
             </div>

             {/* Actions */}
             <div className="p-8 bg-white border-t border-gray-100 flex gap-3 shrink-0">
                <button 
                  onClick={onClose}
                  className="flex-1 py-4 bg-gray-50 text-gray-400 rounded-lg font-black uppercase text-[10px] tracking-widest hover:text-gray-900 transition-all border border-gray-100"
                >
                   Close Protocol
                </button>
                <button 
                  className="flex-[2] py-4 bg-blue-600 text-white rounded-lg font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all hover:bg-blue-700 flex items-center justify-center gap-3"
                >
                   <CheckCircle size={16} />
                   Validate Handover
                </button>
             </div>
         </div>
      </div>
   );
}

function InfoCard({ label, value, icon, color }: any) {
   return (
      <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm flex flex-col gap-3 group hover:border-blue-200 transition-all">
         <div className={clsx(
            "w-8 h-8 rounded flex items-center justify-center transition-all",
            color === 'blue' ? "bg-blue-50 text-blue-600" : "bg-indigo-50 text-indigo-600"
         )}>
            {icon}
         </div>
         <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 opacity-60">{label}</p>
            <p className="text-xs font-black text-gray-900 uppercase tracking-tight truncate">{value}</p>
         </div>
      </div>
   );
}

function MetricCard({ label, value, color, icon, progress }: any) {
  const colors: any = {
    indigo: 'bg-indigo-600 text-white shadow-indigo-500/10',
    emerald: 'bg-emerald-500 text-white shadow-emerald-500/10',
    amber: 'bg-amber-500 text-white shadow-amber-500/10',
    red: 'bg-red-500 text-white shadow-red-500/10',
  };

  const textColors: any = {
    indigo: 'text-indigo-600',
    emerald: 'text-emerald-500',
    amber: 'text-amber-500',
    red: 'text-red-500',
  };

  const ringColors: any = {
    indigo: 'ring-indigo-50 border-indigo-100',
    emerald: 'ring-emerald-50 border-emerald-100',
    amber: 'ring-amber-50 border-amber-100',
    red: 'ring-red-50 border-red-100',
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm flex flex-col gap-5 group hover:shadow-lg transition-all group overflow-hidden relative">
      <div className="flex items-center justify-between">
         <div className={clsx("w-10 h-10 rounded flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm", colors[color])}>
           {icon}
         </div>
         <div className={clsx("text-[8px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded shadow-sm border", ringColors[color], textColors[color])}>
            PROTOCOL STATUS
         </div>
      </div>
      
      <div className="relative z-10 space-y-2">
         <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2">{label}</p>
         <h2 className={clsx("text-3xl font-black tracking-tighter leading-none", textColors[color])}>
           {value}
           <span className="text-[10px] font-black ml-2 opacity-30 text-gray-900">SYSTEM COUNT</span>
         </h2>
      </div>

      <div className="w-full bg-gray-50 h-[3px] rounded-full overflow-hidden border border-gray-100 mt-2">
        <div 
          className={clsx("h-full transition-all duration-1000 ease-out", 
            color === 'indigo' ? 'bg-indigo-600' : 
            color === 'emerald' ? 'bg-emerald-500' : 
            color === 'amber' ? 'bg-amber-500' : 'bg-red-500'
          )} 
          style={{ width: `${progress}%` }} 
        />
      </div>
    </div>
  );
}
