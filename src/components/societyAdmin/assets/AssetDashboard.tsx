"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  Package, Clock, History, Calendar, RefreshCw, 
  TrendingUp, TrendingDown, IndianRupee, CreditCard, Receipt, MapPin,
  CheckCircle2, AlertCircle, Wrench, Boxes, ChevronRight,
  LayoutGrid, Activity, ShieldCheck, Zap, X, Map, User, Info, CheckCircle,
  FileText, ArrowDownRight, ArrowUpRight, Search, Filter, Download,
  PieChart as PieChartIcon
} from 'lucide-react';
import { getAllBookings, getDashboardSummary, AssetBooking } from '@/lib/apiClient';
import { toast } from 'react-hot-toast';
import { format, isValid } from 'date-fns';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];

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
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{title}</p>
        <p className="text-3xl font-black text-gray-900 mt-2 tracking-tighter group-hover:text-blue-600 transition-colors tracking-tight">{value}</p>
        {trend && trendValue && (
          <div className={`flex items-center mt-2 text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            {trend === 'up' ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
            <span className="font-bold tracking-tight">{trendValue}</span>
          </div>
        )}
      </div>
      <div className={clsx(
        "p-4 rounded-xl transition-transform group-hover:scale-110",
        color === 'blue' ? 'bg-blue-50 text-blue-600' :
        color === 'green' ? 'bg-green-50 text-green-600' :
        color === 'yellow' ? 'bg-yellow-50 text-yellow-600' :
        'bg-red-50 text-red-600'
      )}>
        <Icon className="w-6 h-6" />
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
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-6">
        <RefreshCw className="animate-spin text-blue-600" size={48} />
        <p className="text-sm font-bold text-gray-400 animate-pulse uppercase tracking-[0.2em]">Synchronizing Asset Network...</p>
      </div>
    );
  }

  const inventory = summary?.inventory || {};
  const totalAssets = inventory.total || 1;
  const stats = [
    { title: 'Total Inventory', value: inventory.total || 0, color: 'blue', icon: Package },
    { title: 'Operational', value: inventory.available || 0, color: 'green', icon: CheckCircle2, trend: 'up' as const, trendValue: `${Math.round((inventory.available / totalAssets) * 100)}% Capacity` },
    { title: 'In Maintenance', value: inventory.maintenance || 0, color: 'yellow', icon: Wrench },
    { title: 'Offline / Lost', value: inventory.missing || 0, color: 'red', icon: AlertCircle },
  ];

  const categoriesData = (summary?.categories || []).map((cat: any) => ({
    name: cat.category || 'General',
    value: cat.count
  }));

  const locationsData = (summary?.locations || []).slice(0, 5).map((loc: any) => ({
    name: loc.location || 'Main Depot',
    count: loc.count,
    percentage: Math.round((loc.count / totalAssets) * 100)
  }));

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 pb-24 px-4 sm:px-6 lg:px-8 bg-gray-50/50 min-h-screen">
      {/* Detail Drawer */}
      <AnimatePresence>
        {isDrawerOpen && selectedBooking && (
          <BookingDetailDrawer 
             booking={selectedBooking} 
             onClose={() => { setIsDrawerOpen(false); setSelectedBooking(null); }} 
          />
        )}
      </AnimatePresence>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-200 pt-8">
         <div className="space-y-1">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Diagnostic Center</h1>
            <p className="text-gray-500 font-medium tracking-tight">Real-time oversight of society physical assets and logistical flow</p>
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
                 className="px-6 py-2.5 rounded-lg text-sm font-bold bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25 transform hover:scale-105 active:scale-95 transition-all"
               >
                 Diagnostic Center
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

      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, idx) => (
          <StatCard key={idx} {...s} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Categorical Distribution Pie Chart */}
        <div className="lg:col-span-5">
           <motion.div 
             initial={{ opacity: 0, x: -20 }}
             animate={{ opacity: 1, x: 0 }}
             className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm h-full hover:shadow-md transition-shadow"
           >
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
                 <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest flex items-center gap-3">
                    <PieChartIcon size={18} className="text-blue-600" />
                    Asset Distribution
                 </h3>
                 <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">CATEGORICAL</span>
              </div>
              
              <div className="flex flex-col gap-6">
                {categoriesData.length > 0 ? (
                  <>
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoriesData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {categoriesData.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                            itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {categoriesData.slice(0, 4).map((cat: any, i: number) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                           <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                           <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{cat.name}</p>
                              <p className="text-sm font-black text-gray-900">{cat.value} Units</p>
                           </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="h-[300px] flex flex-col items-center justify-center text-gray-300">
                    <Boxes size={48} className="mb-4 opacity-20" />
                    <p className="text-sm font-bold uppercase tracking-widest opacity-40">Telemetry Offline</p>
                  </div>
                )}
              </div>
           </motion.div>
        </div>

        {/* Resource Deployment Bar Chart */}
        <div className="lg:col-span-7">
           <motion.div 
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm h-full hover:shadow-md transition-shadow"
           >
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
                 <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest flex items-center gap-3">
                    <MapPin size={18} className="text-green-600" />
                    Deployment Stats
                 </h3>
                 <span className="text-[10px] font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100">LOCATION WISE</span>
              </div>
              
              <div className="space-y-6">
                {locationsData.length > 0 ? (
                  <>
                    <div className="h-[180px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={locationsData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#64748b' }} />
                          <Tooltip 
                            cursor={{ fill: '#f8fafc' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                          />
                          <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} barSize={16} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-gray-50">
                      {locationsData.slice(0, 3).map((loc: any, i: number) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-[10px] font-bold text-green-600 border border-green-100">{i+1}</div>
                            <span className="text-xs font-bold text-gray-700 uppercase tracking-tight">{loc.name}</span>
                          </div>
                          <div className="flex items-center gap-4 min-w-[120px]">
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <motion.div 
                                className="h-full bg-green-500" 
                                initial={{ width: 0 }}
                                animate={{ width: `${loc.percentage}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-black text-gray-900 w-10 text-right">{loc.percentage}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="h-[300px] flex flex-col items-center justify-center text-gray-300">
                    <Map size={48} className="mb-4 opacity-20" />
                    <p className="text-sm font-bold uppercase tracking-widest opacity-40">No Location Data</p>
                  </div>
                )}
              </div>
           </motion.div>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, idx) => (
          <StatCard key={idx} {...s} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Distribution Matrix */}
        <div className="lg:col-span-5">
           <motion.div 
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm h-full hover:shadow-md transition-shadow"
           >
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
                 <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-3">
                    <LayoutGrid size={18} className="text-blue-600" />
                    Categorical Distribution
                 </h3>
                 <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">DASHBOARD</span>
              </div>
              <div className="space-y-6">
                {categoriesData.length > 0 ? (
                  categoriesData.slice(0, 5).map((category: any, i: number) => (
                    <div key={i} className="flex flex-col gap-2 group">
                       <div className="flex justify-between items-center px-1">
                          <span className="text-[10px] font-bold text-gray-700 uppercase tracking-tight">{category.name}</span>
                          <span className="text-[10px] font-black text-blue-600">{category.value} <span className="text-gray-400">UNITS</span></span>
                       </div>
                       <div className="h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-100">
                          <motion.div 
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                            initial={{ width: 0 }}
                            animate={{ width: `${(category.value / totalAssets) * 100}%` }}
                          />
                       </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-300 font-bold uppercase tracking-widest text-xs">Awaiting Data Sync...</div>
                )}
              </div>
           </motion.div>
        </div>

        {/* Tactical Mapping */}
        <div className="lg:col-span-7">
           <motion.div 
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm h-full hover:shadow-md transition-shadow"
           >
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
                 <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-3">
                    <MapPin size={18} className="text-green-600" />
                    Resource Deployment Logic
                 </h3>
                 <span className="text-[10px] font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100">ACTIVE SECTORS</span>
              </div>
              <div className="space-y-6">
                 {locationsData.length > 0 ? (
                    locationsData.slice(0, 5).map((loc: any, i: number) => (
                       <div key={i} className="flex items-center gap-5 p-4 rounded-xl border border-gray-100 hover:bg-white hover:shadow-md transition-all group">
                          <div className="w-12 h-12 bg-gray-50 text-gray-400 rounded-lg flex items-center justify-center border border-gray-200 group-hover:bg-green-600 group-hover:text-white group-hover:border-green-600 transition-all shadow-sm">
                             <MapPin size={22} className="group-hover:scale-110 transition-transform" />
                          </div>
                          <div className="flex-1">
                             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{loc.name || 'External Site'}</p>
                             <div className="flex items-center gap-4">
                                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden border border-gray-100">
                                   <motion.div 
                                     className="h-full bg-green-500" 
                                     initial={{ width: 0 }}
                                     animate={{ width: `${loc.percentage}%` }}
                                   />
                                </div>
                                <span className="text-[10px] font-black text-gray-900 w-12 text-right">{loc.percentage}%</span>
                             </div>
                          </div>
                       </div>
                    ))
                 ) : (
                    <div className="text-center py-20 text-gray-300 font-bold uppercase tracking-widest text-xs">Mapping Unavailable</div>
                 )}
              </div>
           </motion.div>
        </div>
      </div>

      {/* Reservation Log Table */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
      >
        <div className="p-8 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-gray-50/30">
           <div className="space-y-1">
              <h3 className="text-lg font-bold text-gray-900">Historical Activity Log</h3>
              <p className="text-sm text-gray-500 font-medium">Monitoring finalized and ongoing resource allocations</p>
           </div>
           
           <div className="flex items-center gap-4">
              <div className="text-sm font-bold text-gray-400 tabular-nums">
                 PAGE <span className="text-gray-900">{currentPage}</span> / <span className="text-gray-900">{totalPages || 1}</span>
              </div>
              <div className="flex items-center gap-2 p-1 bg-white border border-gray-200 rounded-lg shadow-sm">
                <button 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90"
                >
                   <ArrowDownRight className="rotate-45" size={20} />
                </button>
                <div className="w-[1px] h-6 bg-gray-100" />
                <button 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90"
                >
                   <ArrowUpRight className="rotate-45" size={20} />
                </button>
              </div>
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/50 text-[11px] font-bold uppercase text-gray-400 tracking-wider border-b border-gray-100">
                <th className="px-8 py-5 text-left">Resident Profile</th>
                <th className="px-8 py-5 text-left">Allocated Asset</th>
                <th className="px-8 py-5 text-left">Protocol Status</th>
                <th className="px-8 py-5 text-left">Timestamp</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedBookings.length > 0 ? paginatedBookings.map((b, i) => (
                <tr 
                  key={i} 
                  className="hover:bg-blue-50/30 transition-all cursor-pointer group"
                  onClick={() => { setSelectedBooking(b); setIsDrawerOpen(true); }}
                >
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center text-sm font-bold shadow-lg shadow-blue-500/10 group-hover:scale-110 transition-transform">
                        {b.user_name?.charAt(0) || 'U'}
                      </div>
                      <span className="text-sm font-bold text-gray-900 tracking-tight">{b.user_name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-gray-100 rounded-lg group-hover:bg-blue-100 transition-colors">
                        <Package size={16} className="text-gray-500 group-hover:text-blue-600" />
                      </div>
                      <span className="text-sm font-semibold text-gray-700 tracking-tight">{b.asset_name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={clsx(
                      "px-4 py-1.5 rounded-full text-[10px] font-bold border flex items-center w-fit gap-2 uppercase tracking-widest shadow-sm",
                      b.status === 'confirmed' ? "bg-green-50 text-green-700 border-green-100" :
                      b.status === 'pending' ? "bg-yellow-50 text-yellow-700 border-yellow-100" :
                      "bg-gray-100 text-gray-600 border-gray-200"
                    )}>
                      <div className={clsx("w-2 h-2 rounded-full", 
                        b.status === 'confirmed' ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" :
                        b.status === 'pending' ? "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]" : "bg-gray-400"
                      )} />
                      {b.status}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                     <span className="text-xs font-bold text-gray-50 flex items-center gap-2">
                        <Clock size={14} className="text-gray-300" />
                        {isValid(new Date(b.start_time)) ? format(new Date(b.start_time), 'dd MMM, HH:mm') : 'N/A'}
                     </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button className="p-2 hover:bg-white border border-transparent hover:border-blue-200 rounded-lg shadow-sm transition-all text-gray-400 hover:text-blue-600 group-hover:translate-x-1">
                      <ChevronRight size={20} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                     <History size={48} className="mx-auto mb-4 text-gray-200" />
                     <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No Historical Intelligence Found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

function BookingDetailDrawer({ booking, onClose }: { booking: AssetBooking, onClose: () => void }) {
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
                   <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
                      <Calendar size={28} />
                   </div>
                   <div>
                      <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">Reservation Detail</h2>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Transaction ID: #{booking.id}</p>
                   </div>
                </div>
                <button 
                  onClick={onClose} 
                  className="p-3 hover:bg-gray-100 rounded-lg transition-all active:scale-90 text-gray-400 hover:text-gray-900"
                >
                  <X size={28} />
                </button>
             </div>

             <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {/* Status Strip */}
                <div className={clsx(
                   "p-5 rounded-xl border flex items-center justify-between shadow-sm",
                   booking.status === 'confirmed' ? "bg-green-50 border-green-100" : "bg-yellow-50 border-yellow-100"
                )}>
                   <div className="flex items-center gap-4">
                      <div className={clsx(
                        "w-10 h-10 rounded-lg flex items-center justify-center border",
                        booking.status === 'confirmed' ? "bg-green-100 text-green-700 border-green-200" : "bg-yellow-100 text-yellow-700 border-yellow-200"
                      )}>
                        <CheckCircle size={22} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Status</p>
                        <p className="text-sm font-extrabold uppercase tracking-tight text-gray-900">{booking.status}</p>
                      </div>
                   </div>
                </div>

                {/* Primary Info */}
                <div className="grid grid-cols-2 gap-6">
                   <InfoCard label="Asset Name" value={booking.asset_name} icon={<Package size={18} />} color="blue" />
                   <InfoCard label="Resident Profile" value={booking.user_name} icon={<User size={18} />} color="indigo" />
                </div>

                {/* Logistics */}
                <div className="bg-white rounded-xl border border-gray-200 p-8 space-y-8 shadow-sm">
                   <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-4 flex items-center gap-2">
                      <Clock size={16} />
                      Schedule Analytics
                   </h3>
                   
                   <div className="grid gap-8">
                      <div className="flex items-start gap-5 group">
                         <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                            <Clock size={20} />
                         </div>
                         <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Check-In Protocol</p>
                            <p className="text-base font-extrabold text-gray-900 tracking-tight">
                              {isValid(new Date(booking.start_time)) ? format(new Date(booking.start_time), 'EEEE, dd MMM yyyy @ HH:mm') : 'PENDING'}
                            </p>
                         </div>
                      </div>

                      <div className="flex items-start gap-5 group">
                         <div className="w-10 h-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center border border-green-100 group-hover:bg-green-600 group-hover:text-white transition-all shadow-sm">
                            <ArrowDownRight size={20} />
                         </div>
                         <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Check-Out Protocol</p>
                            <p className="text-base font-extrabold text-gray-900 tracking-tight">
                              {isValid(new Date(booking.end_time)) ? format(new Date(booking.end_time), 'EEEE, dd MMM yyyy @ HH:mm') : 'PENDING'}
                            </p>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Financial Summary */}
                <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
                   <div className="flex items-center justify-between mb-8">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-4 w-full">Financial Audit</h3>
                   </div>
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                            <IndianRupee size={22} className="text-gray-500" />
                         </div>
                         <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Payable</p>
                            <p className="text-2xl font-black text-gray-900 tracking-tighter">₹{Number(booking.total_amount).toLocaleString()}</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Security Bond</p>
                         <p className="text-lg font-extrabold text-green-600 tracking-tight">₹{Number(booking.deposit_amount).toLocaleString()}</p>
                      </div>
                   </div>
                </div>

                {/* Remarks Section */}
                {booking.rejection_reason && (
                  <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-xl text-white shadow-xl relative overflow-hidden group border border-gray-700">
                     <div className="absolute top-0 right-0 p-6 opacity-5 transform group-hover:scale-125 transition-transform">
                        <FileText size={64} />
                     </div>
                     <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Zap size={16} className="fill-blue-400" />
                        Admin Remarks
                     </p>
                     <p className="text-sm font-medium text-gray-300 leading-relaxed tracking-tight group-hover:text-white transition-colors uppercase">
                       {booking.rejection_reason}
                     </p>
                  </div>
                )}
             </div>

             {/* Actions */}
             <div className="p-8 bg-white border-t border-gray-200 flex gap-4">
                <button 
                  onClick={onClose}
                  className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-xl font-bold uppercase text-[11px] tracking-widest hover:bg-gray-200 transition-all border border-gray-200 active:scale-95"
                >
                   Cancel
                </button>
                <button 
                  className="flex-[2] py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold uppercase text-[11px] tracking-widest shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                   <CheckCircle size={18} />
                   Finalize Handover
                </button>
             </div>
         </motion.div>
      </div>
   );
}

function InfoCard({ label, value, icon, color }: any) {
   return (
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-4 group hover:border-blue-300 hover:shadow-md transition-all">
         <div className={clsx(
            "w-10 h-10 rounded-lg flex items-center justify-center transition-all shadow-sm",
            color === 'blue' ? "bg-blue-50 text-blue-600 border border-blue-100" : "bg-indigo-50 text-indigo-600 border border-indigo-100"
         )}>
            {icon}
         </div>
         <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-sm font-bold text-gray-900 uppercase tracking-tight truncate">{value}</p>
         </div>
      </div>
   );
}
