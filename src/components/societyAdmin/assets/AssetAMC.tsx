'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { format, isValid } from 'date-fns';
import {
   Plus, Calendar,
   ShieldCheck, Package,
   TrendingUp, Activity, Inbox, Timer, IndianRupee, X, Save,
   History, ArrowUpRight,
   RefreshCw, Loader2, Wrench, ChevronLeft, ChevronRight
} from 'lucide-react';
import { getAMCDashboard, createAMC, getAllAssets, getVendorsList } from '@/lib/apiClient';
import { toast } from 'react-hot-toast';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

interface AMCContract {
   id: number;
   status: 'active' | 'expiring_soon' | 'inactive';
   amc_cost: string;
   asset_name: string;
   vendor_name: string;
   end_date: string;
   completed_services: number;
   total_services: number;
   asset_id: number;
   contract_type: 'labor_only' | 'comprehensive';
}

interface UpcomingService {
   id: number;
   scheduled_date: string;
   asset_name: string;
   vendor_name: string;
}

interface UnprotectedAsset {
   id: number;
   name: string;
   category: string;
}

interface AMCDashboardData {
   contracts: AMCContract[];
   upcoming_services: UpcomingService[];
   unprotected_assets: UnprotectedAsset[];
}

function formatDateSafe(date: string | Date | null | undefined) {
   if (!date) return '---';
   const d = new Date(date);
   if (!isValid(d)) return '---';
   return format(d, 'MMM dd, yyyy');
}

export default function AssetAMC() {
   const router = useRouter();
   const [data, setData] = useState<AMCDashboardData | null>(null);
   const [isLoading, setIsLoading] = useState(true);
   const [activeTab, setActiveTab] = useState<'contracts' | 'gap'>('contracts');
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [selectedAssetForAMC, setSelectedAssetForAMC] = useState<UnprotectedAsset | null>(null);

   const fetchData = async () => {
      setIsLoading(true);
      try {
         const res = await getAMCDashboard();
         if (res.success) setData(res.data);
      } catch {
         toast.error('Failed to sync AMC register');
      } finally {
         setIsLoading(false);
      }
   };

   useEffect(() => {
      fetchData();
   }, []);

   if (isLoading) {
      return (
         <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
            <RefreshCw className="animate-spin text-blue-600" size={40} />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">Accessing AMC Vault...</p>
         </div>
      );
   }

   const { contracts = [], upcoming_services = [], unprotected_assets = [] } = data || {};

   const stats = {
      active: contracts.filter((c: AMCContract) => c.status === 'active').length,
      expiring: contracts.filter((c: AMCContract) => c.status === 'expiring_soon').length,
      gap: unprotected_assets.length,
      total_cost: contracts.reduce((acc: number, c: AMCContract) => acc + parseFloat(c.amc_cost || '0'), 0)
   };

   return (
      <div className="space-y-6 animate-in fade-in duration-500 pb-20 font-sans">
         <AnimatePresence>
            {isModalOpen && (
               <CreateAMCModal
                  onClose={() => { setIsModalOpen(false); setSelectedAssetForAMC(null); }}
                  onSuccess={() => { setIsModalOpen(false); setSelectedAssetForAMC(null); fetchData(); }}
                  initialAsset={selectedAssetForAMC}
               />
            )}
         </AnimatePresence>

         {/* Header Section */}
         <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2">
            <div className="flex items-center gap-3">

               <div>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none mb-1">AMC Registry</h1>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">Maintenance Protocol Control</p>
               </div>
            </div>


         </div>

         {/* Tactical KPI Tiles */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <AMCKPI label="Active Protections" value={stats.active} icon={<ShieldCheck size={18} />} color="blue" />
            <AMCKPI label="Expiring Threshold" value={stats.expiring} icon={<Timer size={18} />} color="amber" />
            <AMCKPI label="Protection Gap" value={stats.gap} icon={<Activity size={18} />} color="red" />
            <AMCKPI label="Fiscal Commitment" value={`₹${(stats.total_cost || 0).toLocaleString()}`} icon={<IndianRupee size={18} />} color="emerald" />
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Operations Panel */}
            <div className="lg:col-span-4 space-y-6">
               {/* Upcoming Services Section */}
               <div className="bg-white p-8 rounded-none border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-50">
                     <Calendar size={18} className="text-blue-600" />
                     <h3 className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Next-Gen Scheduler</h3>
                  </div>
                  <div className="space-y-4">
                     {upcoming_services.length > 0 ? upcoming_services.map((s, i) => (
                        <div key={i} className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-none border border-slate-100 group hover:bg-white hover:border-blue-100 hover:shadow-lg transition-all">
                           <div className="w-10 h-10 bg-white border border-slate-100 rounded-none flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                              <Wrench size={16} />
                           </div>
                           <div className="flex-1">
                              <p className="text-xs font-bold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">{s.asset_name}</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 opacity-80">{formatDateSafe(s.scheduled_date)} • {s.vendor_name}</p>
                           </div>
                           <ArrowUpRight size={14} className="text-slate-300 group-hover:text-blue-600" />
                        </div>
                     )) : (
                        <div className="py-12 text-center">
                           <History size={32} className="mx-auto mb-3 text-slate-100" />
                           <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No cycles scheduled</p>
                        </div>
                     )}
                  </div>
               </div>


            </div>

            {/* Ledger Panel */}
            <div className="lg:col-span-8 space-y-6">
               <div className="bg-white rounded-none border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
                  <div className="px-8 py-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/50">
                     <div className="flex gap-2 p-1 bg-white border border-slate-200 rounded-none shadow-sm">
                        <button
                           onClick={() => setActiveTab('contracts')}
                           className={clsx("px-6 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-none transition-all", activeTab === 'contracts' ? "bg-slate-900 text-white shadow-md" : "text-slate-400 hover:text-slate-900")}
                        >
                           Protection Ledger
                        </button>
                        <button
                           onClick={() => setActiveTab('gap')}
                           className={clsx("px-6 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-none transition-all", activeTab === 'gap' ? "bg-red-600 text-white shadow-md" : "text-slate-400 hover:text-red-900")}
                        >
                           Security Gaps
                        </button>
                     </div>
                     <span className="text-[9px] font-bold text-slate-400 tabular-nums uppercase tracking-widest">{activeTab === 'contracts' ? contracts.length : unprotected_assets.length} ENTRIES LOGGED</span>
                  </div>

                  <div className="flex-1">
                     {activeTab === 'contracts' ? (
                        <div className="overflow-x-auto">
                           <table className="w-full text-left">
                              <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 tracking-wider border-b border-slate-100">
                                 <tr>
                                    <th className="px-8 py-4">Contract Ref</th>
                                    <th className="px-8 py-4">Service Lifecycle</th>
                                    <th className="px-8 py-4">Audit Status</th>
                                    <th className="px-8 py-4 text-right">Proceeds</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                 {contracts.length > 0 ? contracts.map((c, i) => (
                                    <motion.tr
                                       key={c.id}
                                       initial={{ opacity: 0 }}
                                       animate={{ opacity: 1 }}
                                       transition={{ delay: i * 0.02 }}
                                       className="hover:bg-slate-50 transition-all group"
                                    >
                                       <td className="px-8 py-5">
                                          <div className="flex items-center gap-4">
                                             <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-none flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                                <ShieldCheck size={18} />
                                             </div>
                                             <div>
                                                <p className="text-sm font-bold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">{c.asset_name}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Exp: {formatDateSafe(c.end_date)}</p>
                                             </div>
                                          </div>
                                       </td>
                                       <td className="px-8 py-5">
                                          <div className="flex flex-col gap-2 w-32">
                                             <div className="flex justify-between text-[9px] font-bold uppercase text-slate-400 tracking-widest">
                                                <span>Cycles</span>
                                                <span>{c.completed_services}/{c.total_services}</span>
                                             </div>
                                             <div className="h-1 bg-slate-100 rounded-none overflow-hidden">
                                                <motion.div
                                                   initial={{ width: 0 }}
                                                   animate={{ width: `${(c.completed_services / c.total_services) * 100}%` }}
                                                   className="h-full bg-blue-500"
                                                />
                                             </div>
                                          </div>
                                       </td>
                                       <td className="px-8 py-5">
                                          <div className="flex items-center gap-3">
                                             <div className={clsx(
                                                "w-2 h-2 rounded-none",
                                                c.status === 'active' ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                                             )} />
                                             <span className={clsx(
                                                "px-2 py-0.5 rounded-none text-[9px] font-bold border uppercase tracking-wider",
                                                c.status === 'active' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-100"
                                             )}>
                                                {c.status.replace('_', ' ')}
                                             </span>
                                          </div>
                                       </td>
                                       <td className="px-8 py-5 text-right font-bold text-xs text-slate-900 tabular-nums uppercase">
                                          ₹{Number(c.amc_cost || 0).toLocaleString()}
                                       </td>
                                    </motion.tr>
                                 )) : (
                                    <tr>
                                       <td colSpan={4} className="py-32 text-center">
                                          <Inbox size={40} className="mx-auto mb-4 text-slate-100" />
                                          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No Contracts Identified</p>
                                       </td>
                                    </tr>
                                 )}
                              </tbody>
                           </table>
                        </div>
                     ) : (
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                           {unprotected_assets.length > 0 ? unprotected_assets.map((a, i) => (
                              <motion.div
                                 key={a.id}
                                 initial={{ opacity: 0, scale: 0.98 }}
                                 animate={{ opacity: 1, scale: 1 }}
                                 transition={{ delay: i * 0.05 }}
                                 className="p-6 bg-slate-50 border border-slate-100 rounded-none flex items-center justify-between group hover:bg-white hover:border-red-200 hover:shadow-lg transition-all"
                              >
                                 <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white border border-slate-100 rounded-none flex items-center justify-center text-red-400 shadow-sm group-hover:bg-red-600 group-hover:text-white transition-all">
                                       <Package size={22} />
                                    </div>
                                    <div>
                                       <p className="text-sm font-bold text-slate-900 tracking-tight group-hover:text-red-600 transition-colors uppercase">{a.name}</p>
                                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 opacity-80">{a.category}</p>
                                    </div>
                                 </div>
                                 <button
                                    onClick={() => { setSelectedAssetForAMC(a); setIsModalOpen(true); }}
                                    className="px-4 py-2 bg-slate-900 text-white text-[9px] font-bold uppercase tracking-widest rounded-none hover:bg-red-600 transition-all shadow-sm active:scale-95"
                                 >
                                    Secure Now
                                 </button>
                              </motion.div>
                           )) : (
                              <div className="col-span-2 py-32 text-center">
                                 <ShieldCheck size={40} className="mx-auto mb-4 text-emerald-100" />
                                 <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">All Assets Fully Protected</p>
                              </div>
                           )}
                        </div>
                     )}
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}

function AMCKPI({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) {
   return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-5 rounded-none border border-slate-200 shadow-sm hover:shadow-md transition-all group">
         <div className="flex justify-between items-start mb-4">
            <div className={clsx("p-3 rounded-none border shadow-sm transition-transform group-hover:scale-105",
               color === 'blue' ? "bg-blue-50 text-blue-600 border-blue-100" :
                  color === 'amber' ? "bg-amber-50 text-amber-600 border-amber-100" :
                     color === 'red' ? "bg-red-50 text-red-600 border-red-100" :
                        "bg-emerald-50 text-emerald-600 border-emerald-100"
            )}>{icon}</div>
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Protocol</span>
         </div>
         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{label}</p>
         <p className="text-2xl font-bold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">{value}</p>
      </motion.div>
   );
}

function CreateAMCModal({ onClose, onSuccess, initialAsset }: { onClose: () => void, onSuccess: () => void, initialAsset?: UnprotectedAsset | null }) {
   const [assets, setAssets] = useState<any[]>([]);
   const [vendors, setVendors] = useState<any[]>([]);
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [formData, setFormData] = useState({
      asset_id: initialAsset?.id || '',
      vendor_id: '',
      contract_number: `AMC-${Date.now()}`,
      start_date: format(new Date(), 'yyyy-MM-dd'),
      end_date: format(new Date(new Date().setFullYear(new Date().getFullYear() + 1)), 'yyyy-MM-dd'),
      amc_cost: '',
      contract_type: 'labor_only',
      total_services: '4',
      remarks: ''
   });

   useEffect(() => {
      const fetchData = async () => {
         const [a, v] = await Promise.all([getAllAssets(), getVendorsList()]);
         if (a.success) setAssets(a.data);
         if (v.success) setVendors(v.data);
      };
      fetchData();
   }, []);

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      try {
         const res = await createAMC(formData);
         if (res.success) {
            toast.success('Contract Deployed');
            onSuccess();
         }
      } catch (err: any) {
         toast.error(err.message || 'Transmision Failure');
      } finally {
         setIsSubmitting(false);
      }
   };

   return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
         <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white w-full max-w-2xl rounded-none shadow-2xl overflow-hidden border border-slate-200"
         >
            <div className="p-8 bg-slate-900 text-white flex justify-between items-center relative overflow-hidden">
               <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 bg-white/10 rounded-none flex items-center justify-center backdrop-blur-md border border-white/20">
                     <ShieldCheck size={24} />
                  </div>
                  <div>
                     <h2 className="text-xl font-bold tracking-tight uppercase leading-none">Initialize AMC</h2>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Contract Deployment Protocol</p>
                  </div>
               </div>
               <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-none transition-all border border-white/10 active:scale-90 relative z-10"><X size={20} /></button>
               <TrendingUp size={120} className="absolute -right-10 -bottom-10 opacity-5 rotate-12" />
            </div>

            <form onSubmit={handleSubmit} className="p-10 space-y-10">
               <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Target Asset *</label>
                     <select required value={formData.asset_id} onChange={e => setFormData({ ...formData, asset_id: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-none text-xs font-bold text-slate-900 focus:bg-white transition-all outline-none uppercase">
                        <option value="">Select Asset...</option>
                        {assets.map(a => <option key={a.id} value={a.id}>{a.name.toUpperCase()}</option>)}
                     </select>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Partner Vendor *</label>
                     <select required value={formData.vendor_id} onChange={e => setFormData({ ...formData, vendor_id: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-none text-xs font-bold text-slate-900 focus:bg-white transition-all outline-none uppercase">
                        <option value="">Select Partner...</option>
                        {vendors.map(v => <option key={v.id} value={v.id}>{v.business_name.toUpperCase()}</option>)}
                     </select>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Activation Date</label>
                     <input type="date" value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-none text-xs font-bold text-slate-900 focus:bg-white outline-none uppercase" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Termination Date</label>
                     <input type="date" value={formData.end_date} onChange={e => setFormData({ ...formData, end_date: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-none text-xs font-bold text-slate-900 focus:bg-white outline-none uppercase" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Fiscal Value (₹)</label>
                     <input required type="number" value={formData.amc_cost} onChange={e => setFormData({ ...formData, amc_cost: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-none text-xs font-bold text-slate-900 focus:bg-white outline-none uppercase" placeholder="0.00" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Total Cycles</label>
                     <input type="number" value={formData.total_services} onChange={e => setFormData({ ...formData, total_services: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-none text-xs font-bold text-slate-900 focus:bg-white outline-none uppercase" />
                  </div>
               </div>

               <div className="pt-6 border-t border-slate-100 flex justify-end gap-4">
                  <button type="button" onClick={onClose} className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all">Abort Protocol</button>
                  <button
                     type="submit"
                     disabled={isSubmitting}
                     className="min-w-[180px] flex items-center justify-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-none text-[10px] font-bold uppercase tracking-widest shadow-lg hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50"
                  >
                     {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <><Save size={14} /> Deploy Contract</>}
                  </button>
               </div>
            </form>
         </motion.div>
      </div>
   );
}
