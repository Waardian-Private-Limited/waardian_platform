'use client';

import React, { useState, useEffect } from 'react';
import {
   BarChart3, PieChart, Activity, Download, Wallet,
   Layers, ShieldCheck, RefreshCw, Inbox,
   Target, ChevronLeft, ChevronRight
} from 'lucide-react';
import { getMaintenanceFinancials, exportAssetsToExcel } from '@/lib/apiClient';
import { toast } from 'react-hot-toast';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface MonthlyTrend {
   month: string;
   total: number;
}

interface TopAsset {
   name: string;
   total_spent: number;
   condition_status: string;
}

interface SpendByType {
   service_type: string;
   total: number;
}

interface FinancialData {
   monthlyTrend: MonthlyTrend[];
   topAssets: TopAsset[];
   spendByType: SpendByType[];
   totals: {
      total_lifetime_cost: number;
      total_actions: number;
   };
}

function StatsTile({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) {
   return (
      <motion.div
         initial={{ opacity: 0, y: 10 }}
         animate={{ opacity: 1, y: 0 }}
         className="bg-white p-5 rounded-none border border-slate-200 shadow-sm hover:shadow-md transition-all group"
      >
         <div className="flex justify-between items-start mb-4">
            <div className={clsx(
               "p-3 rounded-none border shadow-sm transition-transform group-hover:scale-105",
               color === 'blue' ? "bg-blue-50 text-blue-600 border-blue-100" :
                  color === 'red' ? "bg-red-50 text-red-600 border-red-100" :
                     color === 'emerald' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                        "bg-slate-50 text-slate-400 border-slate-100"
            )}>
               {icon}
            </div>
            <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Fiscal</div>
         </div>
         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{label}</p>
         <h3 className="text-2xl font-bold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">{value}</h3>
      </motion.div>
   );
}

export default function AssetReports() {
   const router = useRouter();
   const [data, setData] = useState<FinancialData | null>(null);
   const [isLoading, setIsLoading] = useState(true);

   useEffect(() => {
      const fetchFinancials = async () => {
         try {
            const res = await getMaintenanceFinancials();
            if (res.success) setData(res.data);
         } catch {
            toast.error('Failed to load financial reports');
         } finally {
            setIsLoading(false);
         }
      };
      fetchFinancials();
   }, []);

   const handleExport = async () => {
      try {
         const blob = await exportAssetsToExcel({});
         const url = window.URL.createObjectURL(blob);
         const a = document.createElement('a');
         a.href = url;
         a.download = `Financial_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
         document.body.appendChild(a);
         a.click();
         window.URL.revokeObjectURL(url);
      } catch {
         toast.error('Export failed');
      }
   };

   if (isLoading) {
      return (
         <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
            <RefreshCw className="animate-spin text-blue-600" size={40} />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">Generating Fiscal Intelligence...</p>
         </div>
      );
   }

   const totals = data?.totals || { total_lifetime_cost: 0, total_actions: 0 };
   const maxTrend = Math.max(...(data?.monthlyTrend.map(t => t.total) || [1]));
   const maxSpend = Math.max(...(data?.spendByType.map(t => t.total) || [1]));

   return (
      <div className="space-y-6 animate-in fade-in duration-500 pb-20 font-sans">
         {/* Header Section */}
         <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2">
            <div className="flex items-center gap-3">

               <div>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none mb-1">Expenditure Intelligence</h1>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">Asset Fiscal Audit & Analysis</p>
               </div>
            </div>


         </div>

         {/* Financial KPI Grid */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsTile label="Lifetime Expenditure" value={`₹${(totals.total_lifetime_cost || 0).toLocaleString()}`} icon={<Wallet size={18} />} color="blue" />
            <StatsTile label="Service Cycles" value={totals.total_actions} icon={<Layers size={18} />} color="emerald" />
            <StatsTile label="Registry Precision" value="100%" icon={<ShieldCheck size={18} />} color="blue" />
            <StatsTile label="Strategic Accuracy" value="High" icon={<Target size={18} />} color="red" />
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Monthly Trend Visualization */}
            <div className="lg:col-span-8 bg-white p-8 rounded-none border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col min-h-[400px]">
               <div className="flex items-center justify-between mb-10 pb-4 border-b border-slate-50">
                  <div className="flex items-center gap-3">
                     <BarChart3 size={18} className="text-blue-600" />
                     <h3 className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Maintenance Spending Cycle</h3>
                  </div>
                  <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-none border border-blue-100 uppercase tracking-widest">Annual Trend</span>
               </div>

               <div className="flex-1 flex items-end justify-between gap-2 md:gap-4 px-4 pb-4">
                  {data?.monthlyTrend.map((t, i) => (
                     <div key={i} className="flex-1 flex flex-col items-center gap-4 group h-full justify-end">
                        <div className="relative w-full flex flex-col items-center justify-end h-full">
                           <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-all bg-slate-900 text-white text-[9px] font-bold px-2 py-1 rounded-none shadow-xl z-10 whitespace-nowrap">
                              ₹{(t.total || 0).toLocaleString()}
                           </div>
                           <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: `${(t.total / maxTrend) * 90}%` }}
                              className="w-full max-w-[40px] bg-blue-600 rounded-none shadow-sm group-hover:bg-black transition-colors"
                           />
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate w-full text-center">{t.month}</span>
                     </div>
                  ))}
               </div>
            </div>

            {/* Spend Segmentation */}
            <div className="lg:col-span-4 bg-white p-8 rounded-none border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col min-h-[400px]">
               <div className="flex items-center justify-between mb-10 pb-4 border-b border-slate-50">
                  <div className="flex items-center gap-3">
                     <PieChart size={18} className="text-emerald-600" />
                     <h3 className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Service Segmentation</h3>
                  </div>
               </div>

               <div className="space-y-8 flex-1 overflow-y-auto">
                  {data?.spendByType.map((s, i) => (
                     <div key={i} className="space-y-3 group">
                        <div className="flex justify-between items-center px-1">
                           <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest group-hover:text-blue-600 transition-colors">{s.service_type}</span>
                           <span className="text-[10px] font-bold text-slate-900 tabular-nums">₹{(s.total || 0).toLocaleString()}</span>
                        </div>
                        <div className="h-1 bg-slate-50 rounded-none overflow-hidden border border-slate-100">
                           <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(s.total / maxSpend) * 100}%` }}
                              className="h-full bg-emerald-500"
                           />
                        </div>
                     </div>
                  ))}
                  {!data?.spendByType.length && (
                     <div className="py-20 text-center">
                        <Inbox size={40} className="mx-auto mb-4 text-slate-100" />
                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No segmentation intelligence</p>
                     </div>
                  )}
               </div>
            </div>

            {/* High-Value Asset Audit */}
            <div className="lg:col-span-12 bg-white rounded-none border border-slate-200 shadow-sm overflow-hidden flex flex-col">
               <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                     <h3 className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Strategic Asset Expenditure Audit</h3>
                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 opacity-80 italic">Top assets by cumulative service expenditure</p>
                  </div>
                  <div className="p-2.5 bg-slate-900 text-white rounded-none">
                     <Activity size={18} />
                  </div>
               </div>

               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 tracking-wider border-b border-slate-100">
                        <tr>
                           <th className="px-8 py-4">Asset Descriptor</th>
                           <th className="px-8 py-4">Operational Health</th>
                           <th className="px-8 py-4">Cumulative Spend</th>
                           <th className="px-8 py-4 text-right">Fiscal Weight</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {data?.topAssets.map((asset, i) => (
                           <motion.tr
                              key={i}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: i * 0.02 }}
                              className="hover:bg-slate-50 transition-all group"
                           >
                              <td className="px-8 py-5">
                                 <p className="text-sm font-bold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors uppercase">{asset.name}</p>
                              </td>
                              <td className="px-8 py-5">
                                 <span className={clsx(
                                    "px-2 py-0.5 rounded-none text-[9px] font-bold uppercase tracking-wider border",
                                    asset.condition_status === 'good' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-700 border-red-100"
                                 )}>
                                    {asset.condition_status}
                                 </span>
                              </td>
                              <td className="px-8 py-5 font-bold text-xs text-slate-900 tabular-nums uppercase">₹{(asset.total_spent || 0).toLocaleString()}</td>
                              <td className="px-8 py-5 text-right">
                                 <div className="flex flex-col items-end gap-2">
                                    <span className="text-[10px] font-bold text-blue-600 tabular-nums leading-none">{Math.round((asset.total_spent / (totals.total_lifetime_cost || 1)) * 100)}%</span>
                                    <div className="w-24 h-1 bg-slate-50 rounded-none overflow-hidden border border-slate-100">
                                       <motion.div
                                          initial={{ width: 0 }}
                                          animate={{ width: `${(asset.total_spent / (totals.total_lifetime_cost || 1)) * 100}%` }}
                                          className="h-full bg-blue-600"
                                       />
                                    </div>
                                 </div>
                              </td>
                           </motion.tr>
                        ))}
                        {!data?.topAssets.length && (
                           <tr>
                              <td colSpan={4} className="py-24 text-center">
                                 <Inbox size={40} className="mx-auto mb-4 text-slate-100" />
                                 <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No Fiscal Data Logged</p>
                              </td>
                           </tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </div>
         </div>
      </div>
   );
}
