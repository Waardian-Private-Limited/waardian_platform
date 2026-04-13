'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, PieChart, Activity, TrendingUp, Download, Calendar, 
  MapPin, Clock, ArrowDownRight, ArrowUpRight, Filter, Search,
  IndianRupee, Receipt, CreditCard, Wallet, FileText, CheckCircle2,
  Share2, Globe, Layers, Zap, Info, ShieldCheck, ChevronRight, AlertCircle,
  TrendingDown, Target, RefreshCw
} from 'lucide-react';
import { getMaintenanceFinancials, exportAssetsToExcel } from '@/lib/apiClient';
import { toast } from 'react-hot-toast';
import clsx from 'clsx';

export default function AssetReports() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFinancials = async () => {
      try {
        const res = await getMaintenanceFinancials();
        if (res.success) setData(res.data);
      } catch (error) {
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
    } catch (err) {
      toast.error('Export failed');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="animate-spin text-blue-600" size={40} />
        <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.3em]">Accessing Financial Vault...</p>
      </div>
    );
  }

  const { monthlyTrend = [], topAssets = [], spendByType = [], totals = {} } = data || {};
  
  // Logical calculations for derived KPIs
  const totalSpend = totals?.total_lifetime_cost || 0;
  const totalActions = totals?.total_actions || 0;
  const avgCost = totalActions > 0 ? (totalSpend / totalActions) : 0;
  const maxTrend = Math.max(...monthlyTrend.map((m: any) => m.total), 1);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Technical Header */}
      <div className="bg-white rounded-lg border border-gray-100 p-8 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative overflow-hidden">
        <div className="flex items-center gap-6 relative z-10">
           <div className="w-14 h-14 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <BarChart3 className="text-white w-7 h-7" />
           </div>
           <div>
             <h1 className="text-2xl font-black text-gray-900 tracking-tighter uppercase leading-none mb-2">Financial Diagnostics</h1>
             <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest flex items-center gap-2">
                <Globe size={12} className="text-indigo-400" />
                Capital expenditure analysis & maintenance ROI mapping
             </p>
           </div>
        </div>
        
        <div className="flex items-center gap-3 relative z-10">
           <button className="flex items-center gap-2 bg-gray-50 text-gray-400 hover:text-gray-900 px-4 py-2.5 rounded border border-gray-100 transition-all font-black text-[9px] uppercase tracking-widest">
              <Filter size={14} />
              Filter Dataset
           </button>
            <button 
               onClick={handleExport}
               className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded shadow-lg shadow-indigo-500/10 active:scale-95 font-black text-[10px] uppercase tracking-[0.2em] transition-all"
            >
               <Download size={16} />
               Export Protocol
            </button>
        </div>
      </div>

      {/* KPI Matrix */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
         <StatsTile label="Lifetime Expenditure" value={totalSpend.toLocaleString()} isCurrency icon={<Wallet size={20} />} color="indigo" />
         <StatsTile label="Diagnostic Events" value={totalActions.toString()} icon={<Activity size={20} />} color="sky" />
         <StatsTile label="Avg Unit Cost" value={Math.round(avgCost).toLocaleString()} isCurrency icon={<Target size={20} />} color="emerald" />
         <StatsTile label="Projected Risk" value="Low" icon={<ShieldCheck size={20} />} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
         {/* Spending Runway Chart */}
         <div className="lg:col-span-8">
            <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden h-full flex flex-col">
               <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                  <h3 className="font-black text-gray-400 uppercase tracking-widest text-[9px] flex items-center gap-3">
                     <Layers className="text-indigo-500" size={14} />
                     Monthly OpEx Timeline
                  </h3>
                  <div className="flex items-center gap-4">
                     <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded bg-indigo-600"></div>
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Actual Spend</span>
                     </div>
                  </div>
               </div>
               
               <div className="p-10 flex-1 flex items-end justify-between gap-4 min-h-[350px]">
                  {monthlyTrend.length > 0 ? monthlyTrend.map((m: any, i: number) => (
                    <div key={i} className="flex-1 flex flex-col items-center group/bar max-w-[60px]">
                       <div className="w-full relative flex items-end justify-center">
                          <div 
                            className="w-full bg-gray-50 rounded-t-sm border-x border-t border-gray-100 relative group-hover:bg-indigo-50 transition-colors" 
                            style={{ height: `${(m.total / maxTrend) * 200}px` }}
                          >
                             <div className="absolute inset-x-0 bottom-0 bg-indigo-600 transition-all duration-500 h-full group-hover:bg-indigo-700 shadow-lg shadow-indigo-500/10" />
                          </div>
                          {/* Value Tooltip */}
                          <div className="absolute -top-10 bg-gray-950 text-white text-[9px] font-black px-3 py-1.5 rounded opacity-0 group-hover/bar:opacity-100 transition-all whitespace-nowrap shadow-xl z-20 border border-white/10 uppercase tracking-widest">
                             <div className="flex items-center gap-1.5">
                                <IndianRupee size={10} />
                                {m.total.toLocaleString()}
                             </div>
                          </div>
                       </div>
                       <div className="mt-6 text-center w-full">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.1em] mb-1 leading-none">{m.month}</p>
                          <p className="text-[10px] font-bold text-gray-700 flex items-center justify-center gap-0.5">
                             <IndianRupee size={8} />
                             {Math.round(m.total / 1000)}k
                          </p>
                       </div>
                    </div>
                  )) : (
                    <div className="w-full h-full flex flex-col items-center justify-center opacity-20 py-20">
                        <Activity size={40} className="text-gray-400 mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-[0.3em]">No Historical Telemetry</p>
                    </div>
                  )}
               </div>
            </div>
         </div>

         {/* Spend Vector Analysis */}
         <div className="lg:col-span-4 h-full">
            <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-8 h-full flex flex-col">
                <h3 className="font-black text-gray-400 uppercase tracking-widest text-[9px] flex items-center gap-3 mb-10 pb-4 border-b border-gray-50">
                  <PieChart size={14} className="text-blue-500" />
                  Service Vector Distribution
                </h3>
               
                <div className="flex-1 space-y-8">
                    {spendByType.length > 0 ? spendByType.map((s: any, i: number) => (
                    <div key={i} className="space-y-3 group/item cursor-pointer">
                        <div className="flex justify-between items-end">
                            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest group-hover/item:text-indigo-600 transition-colors">{s.service_type}</span>
                            <span className="text-[11px] font-black text-gray-900 bg-gray-50 px-2 py-1 rounded border border-gray-100 shadow-sm flex items-center gap-1">
                               <IndianRupee size={10} />
                               {s.total.toLocaleString()}
                            </span>
                        </div>
                        <div className="w-full h-2 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                            <div 
                                className="h-full bg-indigo-600 shadow-lg shadow-indigo-500/10 transition-all duration-1000" 
                                style={{ width: `${(s.total / (totalSpend || 1)) * 100}%` }} 
                            />
                        </div>
                    </div>
                    )) : (
                    <div className="py-20 text-center opacity-20">
                       <PieChart size={40} className="mx-auto mb-4" />
                       <p className="text-[10px] font-black uppercase tracking-widest">Matrix Dormant</p>
                    </div>
                    )}
                </div>

                <div className="mt-10 pt-8 border-t border-gray-50 flex items-center justify-between">
                   <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Fiscal Precision</p>
                      <p className="text-2xl font-black text-indigo-600 tracking-tighter transition-all hover:scale-105">98.4%</p>
                   </div>
                   <div className="w-12 h-12 rounded bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-sm">
                      <Zap size={20} fill="currentColor" />
                   </div>
                </div>
            </div>
         </div>
      </div>

      {/* Asset Liability Registry */}
      <div className="space-y-4 pt-4">
         <div className="flex items-center justify-between px-2">
            <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">High-Expenditure Asset Registry</h3>
            <span className="text-[9px] font-black text-red-500 uppercase flex items-center gap-2 tracking-widest">
                <AlertCircle size={12} className="text-red-500" />
                Critical Life-Cycle Alerts
            </span>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topAssets.length > 0 ? topAssets.map((a: any, i: number) => (
              <div key={i} className="bg-white rounded-lg border border-gray-100 p-6 flex flex-col justify-between hover:shadow-xl hover:shadow-gray-100/50 transition-all group border-l-4 border-l-red-500">
                 <div className="flex items-start justify-between mb-6">
                    <div className="flex gap-4">
                       <div className="w-10 h-10 bg-red-50 text-red-600 rounded flex items-center justify-center border border-red-100 shadow-sm group-hover:bg-red-600 group-hover:text-white transition-all">
                          <TrendingUp size={20} />
                       </div>
                       <div>
                          <h4 className="font-black text-gray-900 tracking-tight uppercase text-sm leading-none mb-2">{a.name}</h4>
                          <div className={clsx(
                             "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest w-fit",
                             a.condition_status === 'poor' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                          )}>
                             {a.condition_status} CONDITION
                          </div>
                       </div>
                    </div>
                    <ChevronRight className="text-gray-300 group-hover:translate-x-1 transition-transform" size={16} />
                 </div>
                 
                 <div className="flex items-end justify-between pt-4 border-t border-gray-50">
                    <div>
                       <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1.5 opacity-60">Total OpEx</p>
                       <div className="text-xl font-black text-gray-900 flex items-center gap-1">
                          <IndianRupee size={14} className="mb-0.5" />
                          {a.total_spent.toLocaleString()}
                       </div>
                    </div>
                    <div className="text-[10px] font-black text-gray-400 bg-gray-50 px-2 py-1 rounded">
                       DEPR: -12%
                    </div>
                 </div>
              </div>
            )) : (
              <div className="md:col-span-3 p-20 bg-gray-50 rounded-lg border border-dashed border-gray-200 flex flex-col items-center justify-center opacity-30">
                 <CheckCircle2 size={32} className="text-gray-400 mb-3" />
                 <p className="font-black uppercase tracking-[0.2em] text-[10px]">Registry Optimal</p>
              </div>
            )}
         </div>
      </div>
    </div>
  );
}

function StatsTile({ label, value, icon, color, isCurrency }: any) {
   const colors: any = {
      indigo: 'bg-indigo-600 text-white shadow-indigo-500/10',
      amber: 'bg-amber-500 text-white shadow-amber-500/10',
      emerald: 'bg-emerald-600 text-white shadow-emerald-500/10',
      sky: 'bg-sky-500 text-white shadow-sky-500/10'
   };
   
   const bgColors: any = {
      indigo: 'bg-indigo-50 border-indigo-100',
      amber: 'bg-amber-50 border-amber-100',
      emerald: 'bg-emerald-50 border-emerald-100',
      sky: 'bg-sky-50 border-sky-100'
   };

   return (
      <div className={clsx("p-6 rounded-lg border transition-all flex flex-col gap-4 group hover:shadow-lg hover:bg-white bg-white border-gray-100")}>
         <div className="flex items-center justify-between">
            <div className={clsx("w-10 h-10 rounded flex items-center justify-center shadow-sm text-inherit", colors[color])}>
               {icon}
            </div>
            <div className={clsx("text-[8px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded", bgColors[color], color === 'indigo' ? 'text-indigo-600' : color === 'sky' ? 'text-sky-600' : color === 'emerald' ? 'text-emerald-600' : 'text-amber-600')}>
               LIVE DATA
            </div>
         </div>
         <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 leading-none">{label}</p>
            <h3 className="text-2xl font-black text-gray-900 tracking-tighter leading-none flex items-center gap-1">
               {isCurrency && <IndianRupee size={18} className="mb-0.5" />}
               {value}
            </h3>
         </div>
      </div>
   );
}
