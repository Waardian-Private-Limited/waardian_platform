'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { format, isValid } from 'date-fns';
import {
   Settings, Wrench, Search, Plus,
   AlertTriangle, CheckCircle, Clock,
   TrendingUp, Activity, Inbox, Timer,
   IndianRupee, User, X, Save, Loader2, History, Package, ChevronLeft, ChevronRight,
   AlertCircle, RefreshCw
} from 'lucide-react';
import {
   getMaintenanceDashboard, markAssetAsServiced, createRepairRequest,
   getVendorsList, getAssetFullDetails, getInventoryList
} from '@/lib/apiClient';
import { toast } from 'react-hot-toast';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

interface MaintenanceAsset {
   id: number;
   asset_name: string;
   next_service_date?: string;
   last_service_date?: string;
   condition_status: string;
   block_wing?: string;
   asset_code?: string;
}

interface MaintenanceDashboardData {
   overdue: MaintenanceAsset[];
   upcoming: MaintenanceAsset[];
   completed: MaintenanceAsset[];
}

function formatDateSafe(date: string | Date | null | undefined) {
   if (!date) return '---';
   const d = new Date(date);
   if (!isValid(d)) return '---';
   return format(d, 'MMM dd, yyyy');
}

export default function AssetMaintenance() {
   const router = useRouter();
   const [activeTab, setActiveTab] = useState<'overdue' | 'upcoming' | 'completed'>('overdue');
   const [data, setData] = useState<MaintenanceDashboardData | null>(null);
   const [isLoading, setIsLoading] = useState(true);
   const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
   const [selectedAssetForHistory, setSelectedAssetForHistory] = useState<MaintenanceAsset | null>(null);
   const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
   const [selectedAssetForService, setSelectedAssetForService] = useState<MaintenanceAsset | null>(null);
   const [isProcessing, setIsProcessing] = useState<number | null>(null);
   const [searchQuery, setSearchQuery] = useState('');

   // Pagination State
   const [currentPage, setCurrentPage] = useState(1);
   const itemsPerPage = 10;

   const fetchData = async () => {
      setIsLoading(true);
      try {
         const maintenanceRes = await getMaintenanceDashboard();
         if (maintenanceRes.success) setData(maintenanceRes.data);
      } catch {
         toast.error('Failed to sync maintenance ledger');
      } finally {
         setIsLoading(false);
      }
   };

   useEffect(() => {
      fetchData();
   }, []);

   const handleMarkServiced = (asset: MaintenanceAsset) => {
      setSelectedAssetForService(asset);
      setIsServiceModalOpen(true);
   };

   const handleViewHistory = (asset: MaintenanceAsset) => {
      setSelectedAssetForHistory(asset);
      setIsHistoryModalOpen(true);
   };

   const handleRepairRequest = async (assetId: number) => {
      if (!confirm('Flag this asset for immediate repair? (Status: Down)')) return;
      setIsProcessing(assetId);
      try {
         const res = await createRepairRequest(assetId, 'Breakdown flagged via maintenance control center');
         if (res.success) {
            toast.success('Asset status updated: UNDER MAINTENANCE');
            fetchData();
         }
      } catch (err: any) {
         toast.error(err.message || 'Operation failure');
      } finally {
         setIsProcessing(null);
      }
   };

   const activeList = useMemo(() => {
      if (!data) return [];
      const list = data[activeTab] || [];
      return list.filter(a =>
         a.asset_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
         (a.asset_code || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
   }, [data, activeTab, searchQuery]);

   const paginatedList = activeList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
   const totalPages = Math.ceil(activeList.length / itemsPerPage);

   if (isLoading) {
      return (
         <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
            <RefreshCw className="animate-spin text-blue-600" size={40} />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">Syncing Maintenance Protocols...</p>
         </div>
      );
   }

   const kpis = [
      { label: 'Critical / Overdue', value: data?.overdue.length ?? 0, icon: <AlertTriangle size={18} />, color: 'red' },
      { label: 'Upcoming Services', value: data?.upcoming.length ?? 0, icon: <Clock size={18} />, color: 'blue' },
      { label: 'Cycles Completed', value: data?.completed.length ?? 0, icon: <CheckCircle size={18} />, color: 'emerald' },
      { label: 'Service Reliability', value: '98%', icon: <TrendingUp size={18} />, color: 'blue' }
   ];

   return (
      <div className="space-y-6 animate-in fade-in duration-500 pb-20 font-sans">
         <AnimatePresence>
            {isServiceModalOpen && (
               <ServiceCompletionModal
                  asset={selectedAssetForService}
                  onClose={() => { setIsServiceModalOpen(false); setSelectedAssetForService(null); }}
                  onSuccess={() => { setIsServiceModalOpen(false); setSelectedAssetForService(null); fetchData(); }}
               />
            )}
            {isHistoryModalOpen && (
               <MaintenanceHistoryModal
                  asset={selectedAssetForHistory}
                  onClose={() => { setIsHistoryModalOpen(false); setSelectedAssetForHistory(null); }}
               />
            )}
         </AnimatePresence>

         {/* Header Section */}
         <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2">
            <div className="flex items-center gap-3">

               <div>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none mb-1">Maintenance Ops</h1>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">Service Protocols & Health Audit</p>
               </div>
            </div>


         </div>

         {/* KPI Dashboard */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi, i) => (
               <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-white p-5 rounded-none border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex justify-between items-start mb-4">
                     <div className={clsx("p-3 rounded-none border shadow-sm transition-transform group-hover:scale-105",
                        kpi.color === 'red' ? "bg-red-50 text-red-600 border-red-100" :
                           kpi.color === 'emerald' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                              "bg-blue-50 text-blue-600 border-blue-100"
                     )}>{kpi.icon}</div>
                     <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Protocol</span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{kpi.label}</p>
                  <p className="text-2xl font-bold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">{kpi.value}</p>
               </motion.div>
            ))}
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Tactical List */}
            <div className="lg:col-span-8 bg-white rounded-none border border-slate-200 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
               <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/50">
                  <div className="flex gap-2 p-1 bg-white border border-slate-200 rounded-none shadow-sm overflow-x-auto no-scrollbar">
                     {['overdue', 'upcoming', 'completed'].map((tab) => (
                        <button
                           key={tab}
                           onClick={() => { setActiveTab(tab as any); setCurrentPage(1); }}
                           className={clsx("px-5 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-none transition-all whitespace-nowrap", activeTab === tab ? "bg-slate-900 text-white" : "text-slate-400 hover:text-slate-900")}
                        >
                           {tab}
                        </button>
                     ))}
                  </div>
                  <div className="flex items-center gap-4">
                     <div className="relative group">
                        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                        <input
                           type="text"
                           placeholder="FILTER ASSETS..."
                           value={searchQuery}
                           onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                           className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-none text-[10px] font-bold uppercase tracking-widest outline-none focus:ring-1 focus:ring-blue-100 transition-all w-48"
                        />
                     </div>
                  </div>
               </div>

               <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left">
                     <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 tracking-wider border-b border-slate-100">
                        <tr>
                           <th className="px-8 py-4">Asset Descriptor</th>
                           <th className="px-8 py-4">Condition Matrix</th>
                           <th className="px-8 py-4">Target Service</th>
                           <th className="px-8 py-4 text-right">Operations</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {paginatedList.length > 0 ? paginatedList.map((asset, i) => (
                           <motion.tr
                              key={asset.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: i * 0.02 }}
                              className="hover:bg-slate-50 transition-all group"
                           >
                              <td className="px-8 py-5">
                                 <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-none flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                       <Package size={18} />
                                    </div>
                                    <div>
                                       <p className="text-sm font-bold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">{asset.asset_name}</p>
                                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{asset.block_wing} • {asset.asset_code}</p>
                                    </div>
                                 </div>
                              </td>
                              <td className="px-8 py-5">
                                 <span className={clsx(
                                    "px-2 py-0.5 rounded-none text-[9px] font-bold uppercase tracking-wider border",
                                    asset.condition_status === 'good' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                       asset.condition_status === 'damaged' ? "bg-red-50 text-red-700 border-red-100" :
                                          "bg-amber-50 text-amber-700 border-amber-100"
                                 )}>
                                    {asset.condition_status}
                                 </span>
                              </td>
                              <td className="px-8 py-5">
                                 <div className="flex flex-col gap-1">
                                    <p className="text-xs font-bold text-slate-900 tracking-tight">{formatDateSafe(asset.next_service_date)}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Scheduled Date</p>
                                 </div>
                              </td>
                              <td className="px-8 py-5 text-right">
                                 <div className="flex items-center justify-end gap-2">
                                    {activeTab !== 'completed' && (
                                       <button
                                          onClick={() => handleMarkServiced(asset)}
                                          className="px-4 py-1.5 bg-slate-900 text-white text-[9px] font-bold uppercase tracking-widest rounded-none shadow-sm hover:bg-black transition-all active:scale-95"
                                       >
                                          Commit Service
                                       </button>
                                    )}
                                    <button
                                       onClick={() => handleViewHistory(asset)}
                                       className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white border border-transparent hover:border-slate-200 rounded-none transition-all"
                                    >
                                       <History size={16} />
                                    </button>
                                    <button
                                       onClick={() => handleRepairRequest(asset.id)}
                                       disabled={isProcessing === asset.id}
                                       className="p-2 text-slate-400 hover:text-red-600 hover:bg-white border border-transparent hover:border-slate-200 rounded-none transition-all disabled:opacity-30"
                                    >
                                       {isProcessing === asset.id ? <RefreshCw className="animate-spin" size={16} /> : <AlertTriangle size={16} />}
                                    </button>
                                 </div>
                              </td>
                           </motion.tr>
                        )) : (
                           <tr>
                              <td colSpan={4} className="py-32 text-center">
                                 <Inbox size={40} className="mx-auto mb-4 text-slate-100" />
                                 <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No Operational Records Found</p>
                              </td>
                           </tr>
                        )}
                     </tbody>
                  </table>
               </div>

               {/* Pagination Footer */}
               <div className="px-8 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Page {currentPage} / {totalPages || 1} • {activeList.length} ASSETS LOGGED</p>
                  <div className="flex gap-2">
                     <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 bg-white border border-slate-200 rounded-none text-slate-400 hover:text-blue-600 disabled:opacity-30 shadow-sm transition-all"><ChevronLeft size={16} /></button>
                     <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="p-2 bg-white border border-slate-200 rounded-none text-slate-400 hover:text-blue-600 disabled:opacity-30 shadow-sm transition-all"><ChevronRight size={16} /></button>
                  </div>
               </div>
            </div>


         </div>
      </div>
   );
}

function HealthMetric({ label, health }: { label: string, health: number }) {
   return (
      <div className="flex flex-col gap-2 group">
         <div className="flex justify-between items-center px-1">
            <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest group-hover:text-blue-600 transition-colors">{label}</span>
            <span className={clsx("text-[10px] font-bold tabular-nums", health > 90 ? 'text-emerald-600' : health > 80 ? 'text-blue-600' : 'text-amber-600')}>{health}% OPS</span>
         </div>
         <div className="h-1 bg-slate-50 rounded-none overflow-hidden border border-slate-100">
            <motion.div initial={{ width: 0 }} animate={{ width: `${health}%` }} className={clsx("h-full", health > 90 ? 'bg-emerald-500' : health > 80 ? 'bg-blue-500' : 'bg-amber-500')} />
         </div>
      </div>
   );
}

function ServiceCompletionModal({ asset, onClose, onSuccess }: { asset: MaintenanceAsset | null, onClose: () => void, onSuccess: () => void }) {
   const [vendors, setVendors] = useState<any[]>([]);
   const [inventory, setInventory] = useState<any[]>([]);
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [formData, setFormData] = useState({
      service_date: format(new Date(), 'yyyy-MM-dd'),
      cost: '',
      remarks: '',
      vendor_id: '',
      service_type: 'Routine',
      used_spares: [] as any[]
   });

   useEffect(() => {
      Promise.all([getVendorsList(), getInventoryList()]).then(([v, i]) => {
         if (v.success) setVendors(v.data || []);
         if (i.success) setInventory(i.data || []);
      });
   }, []);

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!asset) return;
      setIsSubmitting(true);
      try {
         const res = await markAssetAsServiced({
            asset_id: asset.id,
            ...formData
         });
         if (res.success) {
            toast.success('Protocol Finalized: Service Logged');
            onSuccess();
         }
      } catch (err: any) {
         toast.error(err.message || 'Operation failure');
      } finally {
         setIsSubmitting(false);
      }
   };

   return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
         <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white w-full max-w-xl rounded-none shadow-2xl overflow-hidden border border-slate-200"
         >
            <div className="p-8 bg-slate-900 text-white flex justify-between items-center relative overflow-hidden">
               <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 bg-white/10 rounded-none flex items-center justify-center backdrop-blur-md border border-white/20">
                     <CheckCircle size={24} />
                  </div>
                  <div>
                     <h2 className="text-xl font-bold tracking-tight uppercase leading-none">Service Commitment</h2>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Target: {asset?.asset_name}</p>
                  </div>
               </div>
               <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-none transition-all border border-white/10 active:scale-90 relative z-10"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-10 space-y-10">
               <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Execution Date</label>
                     <input type="date" value={formData.service_date} onChange={e => setFormData({ ...formData, service_date: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-none text-xs font-bold text-slate-900 focus:bg-white outline-none uppercase" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Fiscal Cost (₹)</label>
                     <input required type="number" placeholder="0.00" value={formData.cost} onChange={e => setFormData({ ...formData, cost: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-none text-xs font-bold text-slate-900 focus:bg-white outline-none uppercase" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Service Protocol</label>
                     <select value={formData.service_type} onChange={e => setFormData({ ...formData, service_type: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-none text-xs font-bold text-slate-900 outline-none uppercase">
                        <option value="Routine">Routine Service</option>
                        <option value="Repair">Breakdown Repair</option>
                        <option value="Replacement">Part Replacement</option>
                     </select>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Service Partner</label>
                     <select value={formData.vendor_id} onChange={e => setFormData({ ...formData, vendor_id: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-none text-xs font-bold text-slate-900 outline-none uppercase">
                        <option value="">Select Vendor...</option>
                        {vendors.map(v => <option key={v.id} value={v.id}>{v.business_name.toUpperCase()}</option>)}
                     </select>
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Operational Remarks</label>
                  <textarea rows={3} placeholder="SERVICE DIRECTIVES & NOTES..." value={formData.remarks} onChange={e => setFormData({ ...formData, remarks: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-none text-xs font-bold text-slate-900 focus:bg-white transition-all outline-none resize-none uppercase" />
               </div>

               <div className="pt-6 border-t border-slate-100 flex justify-end gap-4">
                  <button type="button" onClick={onClose} className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all">Abort</button>
                  <button
                     type="submit"
                     disabled={isSubmitting}
                     className="min-w-[180px] flex items-center justify-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-none text-[10px] font-bold uppercase tracking-widest shadow-lg hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50"
                  >
                     {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <><Save size={14} /> Log Completion</>}
                  </button>
               </div>
            </form>
         </motion.div>
      </div>
   );
}

function MaintenanceHistoryModal({ asset, onClose }: { asset: MaintenanceAsset | null, onClose: () => void }) {
   const [history, setHistory] = useState<any[]>([]);
   const [isLoading, setIsLoading] = useState(true);

   useEffect(() => {
      if (!asset) return;
      getAssetFullDetails(asset.id).then(res => {
         if (res.success) setHistory(res.data.maintenance_history || []);
         setIsLoading(false);
      });
   }, [asset]);

   return (
      <div className="fixed inset-0 z-[120] flex justify-end">
         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
         <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} className="w-full max-w-lg bg-white h-full shadow-2xl relative flex flex-col border-l border-slate-200">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-900 text-white rounded-none flex items-center justify-center border border-slate-800 shadow-xl">
                     <History size={24} />
                  </div>
                  <div>
                     <h2 className="text-lg font-bold text-slate-900 uppercase tracking-tight leading-none">{asset?.asset_name}</h2>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Historical Service Ledger</p>
                  </div>
               </div>
               <button onClick={onClose} className="p-2.5 hover:bg-slate-50 rounded-none transition-all border border-transparent hover:border-slate-100 text-slate-400"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar pb-32">
               {isLoading ? (
                  <div className="py-20 text-center"><RefreshCw className="animate-spin mx-auto text-blue-600" size={32} /></div>
               ) : history.length > 0 ? history.map((log, i) => (
                  <div key={i} className="p-6 bg-slate-50 border border-slate-100 rounded-none space-y-4 hover:bg-white hover:border-blue-100 hover:shadow-lg transition-all group">
                     <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 bg-white border border-slate-100 text-slate-400 rounded-none flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all"><Wrench size={14} /></div>
                           <p className="text-xs font-bold text-slate-900 uppercase tracking-tight">{log.service_type}</p>
                        </div>
                        <p className="text-xs font-bold text-slate-900 tabular-nums">₹{Number(log.cost).toLocaleString()}</p>
                     </div>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{formatDateSafe(log.service_date)} • {log.vendor}</p>
                     <p className="text-xs text-slate-600 font-bold uppercase leading-relaxed italic border-l-2 border-blue-100 pl-4 opacity-80">"{log.remarks || 'NO REMARKS LOGGED'}"</p>
                  </div>
               )) : (
                  <div className="py-20 text-center">
                     <Inbox size={40} className="mx-auto mb-4 text-slate-100" />
                     <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No Service History Found</p>
                  </div>
               )}
            </div>
         </motion.div>
      </div>
   );
}
