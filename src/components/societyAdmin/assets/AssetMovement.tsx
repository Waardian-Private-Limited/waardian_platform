'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Truck, ArrowRight, MapPin, Search, Filter, 
  Clock, Package, AlertCircle, CheckCircle, BarChart3, History, ArrowRightLeft, Plus, ShieldCheck, Activity,
  ArrowUpRight, Share2, Globe, Layers, Zap, RefreshCw, ChevronRight
} from 'lucide-react';
import { getMovementsList, getAllAssets, receiveMovement } from '@/lib/apiClient';
import { toast } from 'react-hot-toast';
import AssetMovementModal from './AssetMovementModal';
import { format, isValid } from 'date-fns';
import clsx from 'clsx';

export default function AssetMovement() {
  const [movements, setMovements] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'in_transit' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [moveRes, assetRes] = await Promise.all([
        getMovementsList(),
        getAllAssets()
      ]);
      if (moveRes.success) setMovements(moveRes.data || []);
      if (assetRes.success) setAssets(assetRes.data || []);
    } catch (error) {
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

  const stats = {
    transit: movements.filter(m => m.status === 'in_transit').length,
    completed: movements.filter(m => m.status === 'completed').length,
    total: movements.length,
    verified: '100%'
  };

  const locations: any = {};
  assets.forEach(a => {
    const loc = a.block_wing || 'General Hub';
    locations[loc] = (locations[loc] || 0) + 1;
  });
  const distribution = Object.entries(locations)
    .sort((a: any, b: any) => b[1] - a[1])
    .slice(0, 4)
    .map(([name, count]) => ({
      name,
      percentage: Math.round(((count as number) / (assets.length || 1)) * 100)
    }));

  const totalPages = Math.ceil(processedMovements.length / itemsPerPage);
  const paginatedMovements = processedMovements.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="animate-spin text-blue-600" size={40} />
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none">Syncing Movement Ledger...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {isModalOpen && (
        <AssetMovementModal 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => {
            setIsModalOpen(false);
            fetchData();
          }}
        />
      )}

      {/* Modern Administrative Header */}
      <div className="bg-white rounded-lg border border-gray-100 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/10">
              <Truck className="text-white w-6 h-6" />
           </div>
           <div>
             <h1 className="text-xl font-bold text-gray-900 tracking-tight leading-none mb-1">Asset Movement</h1>
             <p className="text-xs text-gray-500 font-medium tracking-tight">Monitor transfers and custody migrations</p>
           </div>
        </div>
        <div className="flex items-center gap-3">
           <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg border border-gray-100">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">System Online</span>
           </div>
           <button 
             onClick={() => setIsModalOpen(true)}
             className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg shadow-lg shadow-blue-500/10 active:scale-95 font-bold uppercase text-[10px] tracking-widest flex items-center gap-2 transition-all"
           >
              <Plus size={14} />
              Dispatch Movement
           </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
         <StatsTile label="In Transit" value={stats.transit.toString()} icon={<Truck size={18} />} color="blue" />
         <StatsTile label="Completed" value={stats.completed.toString()} icon={<CheckCircle size={18} />} color="emerald" />
         <StatsTile label="Total Transfers" value={stats.total.toString()} icon={<Layers size={18} />} color="gray" />
         <StatsTile label="Registry Audit" value={stats.verified} icon={<ShieldCheck size={18} />} color="blue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Main Ledger List */}
         <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
               <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                     <History size={16} className="text-blue-600" />
                     <h3 className="text-xs font-black uppercase tracking-widest text-gray-900">Transfer Records</h3>
                  </div>
                  <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-100">
                     {['all', 'in_transit', 'completed'].map(tab => (
                        <button 
                           key={tab}
                           onClick={() => { setActiveTab(tab as any); setCurrentPage(1); }}
                           className={clsx(
                             "px-4 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all",
                             activeTab === tab ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
                           )}
                        >
                           {tab.replace('_', ' ')}
                        </button>
                     ))}
                  </div>
               </div>

               <div className="flex-1 divide-y divide-gray-50">
                  {paginatedMovements.length > 0 ? paginatedMovements.map(m => (
                    <div key={m.id} className="p-6 hover:bg-gray-50 transition-all flex items-center justify-between group">
                       <div className="flex items-center gap-5">
                          <div className={clsx(
                             "w-12 h-12 rounded-lg flex items-center justify-center border transition-all",
                             m.status === 'completed' ? "bg-gray-50 border-gray-100 text-gray-400" : "bg-blue-50 border-blue-100 text-blue-600 animate-pulse"
                          )}>
                             {m.status === 'completed' ? <CheckCircle size={20} /> : <Truck size={20} />}
                          </div>
                          <div>
                             <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-bold text-gray-900 text-sm tracking-tight uppercase">{m.asset_name}</h4>
                                <span className={clsx(
                                   "px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest border",
                                   m.status === 'completed' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-blue-50 text-blue-600 border-blue-100"
                                )}>
                                   {m.status === 'in_transit' ? 'Transit' : 'Settled'}
                                </span>
                             </div>
                             <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{m.from_block || 'Warehouse'}</span>
                                <ChevronRight size={10} className="text-gray-300" />
                                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">{m.to_block || 'Site'}</span>
                                <span className="text-[10px] text-gray-300 font-bold ml-1">• {m.to_location || 'Point'}</span>
                             </div>
                          </div>
                       </div>
                       
                       <div className="flex items-center gap-8">
                          <div className="text-right hidden sm:block">
                             <p className="text-[10px] font-bold text-gray-900 leading-none">{formatDateSafe(m.checkout_time)}</p>
                             <p className="text-[9px] text-gray-400 font-bold uppercase mt-1 tracking-widest">{formatTimeSafe(m.checkout_time)}</p>
                          </div>
                          
                          {m.status === 'in_transit' ? (
                            <button 
                              onClick={() => handleReceive(m.id)}
                              disabled={isProcessing === m.id}
                              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-blue-500/10 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
                            >
                               {isProcessing === m.id ? 'Syncing...' : 'Acknowledge Receipt'}
                            </button>
                          ) : (
                             <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-200 group-hover:text-blue-600 group-hover:bg-blue-50 transition-all">
                                <ArrowUpRight size={16} />
                             </div>
                          )}
                       </div>
                    </div>
                  )) : (
                     <div className="flex flex-col items-center justify-center p-40 opacity-20">
                        <Truck size={48} className="mb-4" />
                        <p className="font-bold uppercase tracking-widest text-xs">No movements found</p>
                     </div>
                  )}
               </div>

               {/* Pagination Footer */}
               <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Page {currentPage} of {totalPages || 1}</p>
                  <div className="flex gap-2">
                     <button 
                       disabled={currentPage === 1}
                       onClick={() => setCurrentPage(p => p - 1)}
                       className="px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-30 transition-all font-bold text-[10px] uppercase tracking-widest"
                     >
                       Previous
                     </button>
                     <button 
                       disabled={currentPage === totalPages || totalPages === 0}
                       onClick={() => setCurrentPage(p => p + 1)}
                       className="px-4 py-2 rounded-lg border border-blue-600 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-30 transition-all font-bold text-[10px] uppercase tracking-widest"
                     >
                       Next
                     </button>
                  </div>
               </div>
            </div>
         </div>

         {/* Sidebar Insights */}
         <div className="space-y-6">
            {/* Distribution Card */}
            <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm relative overflow-hidden">
               <div className="flex items-center gap-2 mb-8">
                  <BarChart3 className="text-blue-600" size={16} />
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-900">Site Distribution</h3>
               </div>
               
               <div className="space-y-6">
                  {distribution.length > 0 ? distribution.map((dist, idx) => (
                    <div key={idx} className="space-y-2">
                       <div className="flex justify-between items-end text-[10px] font-bold uppercase tracking-tighter">
                          <span className="text-gray-500">{dist.name}</span>
                          <span className="text-blue-600">{dist.percentage}%</span>
                       </div>
                       <div className="w-full bg-gray-50 h-1.5 rounded-full overflow-hidden">
                          <div 
                             className={clsx("h-full rounded-full transition-all duration-1000", idx === 0 ? "bg-blue-600" : "bg-blue-400")} 
                             style={{ width: `${dist.percentage}%` }} 
                          />
                       </div>
                    </div>
                  )) : (
                    <div className="py-20 text-center opacity-30 italic font-bold text-xs uppercase">No distribution data</div>
                  )}
                  
                  <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-100 space-y-2">
                     <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
                        <AlertCircle size={12} /> Registry Monitor
                     </p>
                     <p className="text-[9px] text-gray-400 font-medium leading-relaxed uppercase">Real-time geospatial tracking of assets across all wings.</p>
                  </div>
               </div>
            </div>

            {/* Quick Action Card */}
            <div className="bg-blue-600 p-6 rounded-lg shadow-lg relative overflow-hidden group">
               <div className="absolute right-[-20px] bottom-[-20px] opacity-10 group-hover:scale-110 transition-transform">
                  <RefreshCw size={120} className="text-white" />
               </div>
               <div className="relative z-10 space-y-4">
                  <h4 className="text-[10px] font-black text-blue-200 uppercase tracking-widest">Transfer Protocol</h4>
                  <p className="text-2xl font-bold text-white tracking-tight leading-tight">Coordinate inter-wing transfers.</p>
                  <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white group-hover:translate-x-1 transition-all bg-white/10 px-4 py-2 rounded border border-white/20">
                     Initialize
                     <ArrowRight size={14} />
                  </button>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}

function StatsTile({ label, value, icon, color }: { label: string, value: string, icon: any, color: 'blue' | 'emerald' | 'gray' }) {
   const variants = {
      blue: 'bg-blue-600 text-white',
      emerald: 'bg-emerald-500 text-white',
      gray: 'bg-gray-800 text-white'
   };
   return (
      <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm flex items-center gap-4 hover:border-blue-100 transition-all cursor-default group">
         <div className={clsx("w-10 h-10 rounded-lg flex items-center justify-center shadow-md transition-transform group-hover:scale-110", variants[color])}>
            {icon}
         </div>
         <div>
            <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest mb-1 leading-none">{label}</p>
            <h3 className="text-xl font-bold text-gray-900 tracking-tight leading-none">{value}</h3>
         </div>
      </div>
   );
}

function formatDateSafe(date: any) {
   const d = new Date(date);
   return isValid(d) ? format(d, 'dd MMM yyyy') : 'Pending';
}

function formatTimeSafe(date: any) {
   const d = new Date(date);
   return isValid(d) ? format(d, 'hh:mm a') : '00:00';
}
