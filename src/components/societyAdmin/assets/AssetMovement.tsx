'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
   Truck, Package, CheckCircle, History, Plus, ShieldCheck, Activity,
   Layers, RefreshCw, ChevronRight, ChevronLeft, Boxes
} from 'lucide-react';
import { getMovementsList, getAllAssets, receiveMovement, Asset } from '@/lib/apiClient';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import AssetMovementModal from './AssetMovementModal';
import { format, isValid } from 'date-fns';
import clsx from 'clsx';

interface MovementRecord {
   id: number;
   asset_id: number;
   asset_name: string;
   from_block: string;
   to_block: string;
   to_location: string;
   status: 'in_transit' | 'completed';
   checkout_time: string;
   checkin_time?: string;
}

function formatDateSafe(date: string | Date | null | undefined) {
   if (!date) return '---';
   const d = new Date(date);
   if (!isValid(d)) return '---';
   return format(d, 'MMM dd, HH:mm');
}

export default function AssetMovement() {
   const [movements, setMovements] = useState<MovementRecord[]>([]);
   const [assets, setAssets] = useState<Asset[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [isProcessing, setIsProcessing] = useState<number | null>(null);
   const [activeTab, setActiveTab] = useState<'all' | 'in_transit' | 'completed'>('all');
   const [searchQuery] = useState('');
   const [currentPage, setCurrentPage] = useState(1);
   const itemsPerPage = 10;
   const router = useRouter();

   const fetchData = async () => {
      setIsLoading(true);
      try {
         const [moveRes, assetRes] = await Promise.all([
            getMovementsList(),
            getAllAssets()
         ]);
         if (moveRes.success) setMovements(moveRes.data || []);
         if (assetRes.success) setAssets(assetRes.data || []);
      } catch {
         toast.error('Failed to load movement history');
      } finally {
         setIsLoading(false);
      }
   };

   useEffect(() => {
      fetchData();
   }, []);

   const handleReceive = async (moveId: number) => {
      setIsProcessing(moveId);
      try {
         const res = await receiveMovement(moveId);
         if (res.success) {
            toast.success('Asset received successfully');
            fetchData();
         }
      } catch (err: any) {
         toast.error(err.message || 'Failed to confirm receipt');
      } finally {
         setIsProcessing(null);
      }
   };

   const processedMovements = useMemo(() => {
      return movements.filter(m => {
         const matchesTab = activeTab === 'all' || m.status === activeTab;
         const matchesSearch = (m.asset_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (m.to_location || '').toLowerCase().includes(searchQuery.toLowerCase());
         return matchesTab && matchesSearch;
      });
   }, [movements, activeTab, searchQuery]);

   const statsData = [
      { label: 'In Transit', value: movements.filter(m => m.status === 'in_transit').length, icon: <Truck size={18} />, color: 'blue' },
      { label: 'Completed', value: movements.filter(m => m.status === 'completed').length, icon: <CheckCircle size={18} />, color: 'emerald' },
      { label: 'Total Transfers', value: movements.length, icon: <Layers size={18} />, color: 'gray' },
      { label: 'Registry Audit', value: '100%', icon: <ShieldCheck size={18} />, color: 'blue' }
   ];

   const locations: Record<string, number> = {};
   assets.forEach(a => {
      const loc = a.block_wing || 'General Hub';
      locations[loc] = (locations[loc] || 0) + 1;
   });

   const paginatedMovements = useMemo(() => {
      const start = (currentPage - 1) * itemsPerPage;
      return processedMovements.slice(start, start + itemsPerPage);
   }, [processedMovements, currentPage]);

   const totalPages = Math.ceil(processedMovements.length / itemsPerPage);

   if (isLoading) {
      return (
         <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
            <RefreshCw className="animate-spin text-blue-600" size={40} />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">Synchronizing Transit Network...</p>
         </div>
      );
   }

   return (
      <div className="space-y-6 animate-in fade-in duration-500 pb-20 font-sans">
         {isModalOpen && <AssetMovementModal onClose={() => setIsModalOpen(false)} onSuccess={fetchData} />}

         {/* Header Section */}
         <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2">
            <div className="flex items-center gap-3">

               <div>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none mb-1">Logistic Transfers</h1>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">Protocol-Based Asset Relocation</p>
               </div>
            </div>


         </div>

         {/* Tactical Indicators */}
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statsData.map((s, idx) => (
               <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white p-5 rounded-none border border-slate-200 shadow-sm hover:shadow-md transition-all group"
               >
                  <div className="flex justify-between items-start mb-4">
                     <div className={clsx(
                        "p-3 rounded-none border shadow-sm transition-transform group-hover:scale-105",
                        s.color === 'blue' ? "bg-blue-50 text-blue-600 border-blue-100" :
                           s.color === 'emerald' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                              "bg-slate-50 text-slate-400 border-slate-100"
                     )}>
                        {s.icon}
                     </div>
                     <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{s.label}</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">{s.value}</p>
               </motion.div>
            ))}
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Logistics Sector Breakdown */}
            <div className="lg:col-span-4 space-y-6">
               <div className="bg-white p-8 rounded-none border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-50">
                     <Activity size={18} className="text-blue-600" />
                     <h3 className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Asset Density / Sector</h3>
                  </div>
                  <div className="space-y-6">
                     {Object.entries(locations).map(([loc, count], i) => (
                        <div key={i} className="flex flex-col gap-2 group">
                           <div className="flex justify-between items-center px-1">
                              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest group-hover:text-blue-600 transition-colors">{loc}</span>
                              <span className="text-[10px] font-bold text-slate-400 tabular-nums">{count} UNITS</span>
                           </div>
                           <div className="h-1 bg-slate-50 rounded-none overflow-hidden border border-slate-100">
                              <motion.div
                                 initial={{ width: 0 }}
                                 animate={{ width: `${(count / (assets.length || 1)) * 100}%` }}
                                 className="h-full bg-blue-500"
                              />
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>

            {/* Transit Intelligence Log */}
            <div className="lg:col-span-8 space-y-6">
               <div className="bg-white rounded-none border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
                  <div className="px-8 py-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/50">
                     <div className="flex gap-2 p-1 bg-white border border-slate-200 rounded-none shadow-sm">
                        {['all', 'in_transit', 'completed'].map((tab) => (
                           <button
                              key={tab}
                              onClick={() => { setActiveTab(tab as any); setCurrentPage(1); }}
                              className={clsx(
                                 "px-6 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-none transition-all",
                                 activeTab === tab ? "bg-slate-900 text-white shadow-md" : "text-slate-400 hover:text-slate-900"
                              )}
                           >
                              {tab.replace('_', ' ')}
                           </button>
                        ))}
                     </div>
                     <div className="flex items-center gap-4">
                        <span className="text-[9px] font-bold text-slate-400 tabular-nums uppercase tracking-widest">PAGE {currentPage} / {totalPages || 1}</span>
                        <div className="flex gap-2">
                           <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 bg-white border border-slate-200 rounded-none text-slate-400 hover:text-blue-600 disabled:opacity-30 shadow-sm transition-all"><ChevronLeft size={16} /></button>
                           <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="p-2 bg-white border border-slate-200 rounded-none text-slate-400 hover:text-blue-600 disabled:opacity-30 shadow-sm transition-all"><ChevronRight size={16} /></button>
                        </div>
                     </div>
                  </div>

                  <div className="overflow-x-auto flex-1">
                     <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 tracking-wider border-b border-slate-100">
                           <tr>
                              <th className="px-8 py-4">Transit Descriptor</th>
                              <th className="px-8 py-4">Destination Matrix</th>
                              <th className="px-8 py-4">Protocol Status</th>
                              <th className="px-8 py-4">Timeline Log</th>
                              <th className="px-8 py-4 text-right">Action Control</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                           {paginatedMovements.length > 0 ? paginatedMovements.map((m, i) => (
                              <motion.tr
                                 key={m.id}
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
                                          <p className="text-sm font-bold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">{m.asset_name}</p>
                                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">LOG: #MVT-{m.id.toString().padStart(4, '0')}</p>
                                       </div>
                                    </div>
                                 </td>
                                 <td className="px-8 py-5">
                                    <div className="flex flex-col gap-1">
                                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sector: {m.to_block}</p>
                                       <p className="text-xs font-bold text-slate-800 tracking-tight uppercase">{m.to_location || 'Main Precinct'}</p>
                                    </div>
                                 </td>
                                 <td className="px-8 py-5">
                                    <div className="flex items-center gap-3">
                                       <div className={clsx(
                                          "w-2 h-2 rounded-none",
                                          m.status === 'in_transit' ? "bg-blue-500 animate-pulse" : "bg-emerald-500"
                                       )} />
                                       <span className={clsx(
                                          "px-2 py-0.5 rounded-none text-[9px] font-bold uppercase tracking-wider border",
                                          m.status === 'in_transit' ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-emerald-50 text-emerald-700 border-emerald-100"
                                       )}>
                                          {m.status.replace('_', ' ')}
                                       </span>
                                    </div>
                                 </td>
                                 <td className="px-8 py-5">
                                    <div className="flex flex-col gap-1.5">
                                       <div className="flex items-center gap-2 text-[10px] font-bold text-slate-900 uppercase">
                                          <History size={12} className="text-blue-500" />
                                          {formatDateSafe(m.checkout_time)}
                                       </div>
                                       {m.checkin_time && (
                                          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                                             <CheckCircle size={12} className="text-emerald-500" />
                                             {formatDateSafe(m.checkin_time)}
                                          </div>
                                       )}
                                    </div>
                                 </td>
                                 <td className="px-8 py-5 text-right">
                                    {m.status === 'in_transit' ? (
                                       <button
                                          onClick={() => handleReceive(m.id)}
                                          disabled={isProcessing === m.id}
                                          className="px-6 py-2 bg-slate-900 text-white rounded-none text-[9px] font-bold uppercase tracking-widest shadow-lg hover:bg-black disabled:opacity-50 transition-all active:scale-95"
                                       >
                                          {isProcessing === m.id ? <RefreshCw className="animate-spin" size={14} /> : 'Secure Receipt'}
                                       </button>
                                    ) : (
                                       <button className="p-2 text-slate-300 hover:text-blue-600 transition-colors">
                                          <ChevronRight size={20} />
                                       </button>
                                    )}
                                 </td>
                              </motion.tr>
                           )) : (
                              <tr>
                                 <td colSpan={5} className="py-32 text-center">
                                    <Truck size={40} className="mx-auto mb-4 text-slate-100" />
                                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No Logistic Logs Found</p>
                                 </td>
                              </tr>
                           )}
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}
