'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { format, isValid } from 'date-fns';
import { 
  FileSignature, Search, Plus, Calendar, 
  ShieldCheck, AlertCircle, Clock, ShieldAlert, Package, ChevronRight,
  TrendingUp, Activity, Inbox, Timer, IndianRupee, User, X, Save,
  CheckCircle, FileText, LayoutDashboard, History, Settings, ArrowUpRight,
  RefreshCw, Loader2
} from 'lucide-react';
import { getAMCDashboard, createAMC, getAllAssets, getVendorsList } from '@/lib/apiClient';
import { toast } from 'react-hot-toast';
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
    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all group"
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{title}</p>
        <p className="text-2xl font-black text-gray-900 mt-2 tracking-tighter group-hover:text-blue-600 transition-colors uppercase">{value}</p>
        {trendValue && (
          <div className="flex items-center mt-2 text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-lg w-fit">
            <TrendingUp size={10} className="mr-1" />
            {trendValue}
          </div>
        )}
      </div>
      <div className={clsx(
        "p-4 rounded-lg shadow-sm border transition-transform group-hover:scale-110",
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
     className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all group"
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

export default function AssetAMC() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'contracts' | 'gap'>('contracts');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAssetForAMC, setSelectedAssetForAMC] = useState<any>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await getAMCDashboard();
      if (res.success) setData(res.data);
    } catch (error) {
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
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none">Accessing AMC Vault...</p>
      </div>
    );
  }

  const { contracts = [], upcoming_services = [], unprotected_assets = [] } = data || {};

  const stats = {
    active: contracts.filter((c: any) => c.status === 'active').length,
    expiring: contracts.filter((c: any) => c.status === 'expiring_soon').length,
    gap: unprotected_assets.length,
    total_cost: contracts.reduce((acc: number, c: any) => acc + parseFloat(c.amc_cost), 0)
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {isModalOpen && (
        <CreateAMCModal 
          prefilledAsset={selectedAssetForAMC}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedAssetForAMC(null);
          }}
          onSuccess={() => {
            setIsModalOpen(false);
            setSelectedAssetForAMC(null);
            fetchData();
          }}
        />
      )}

      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-200">
         <div className="space-y-1">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">AMC Registry</h1>
            <p className="text-gray-500 font-medium tracking-tight">Governance and lifecycle oversight of maintenance protocols</p>
         </div>
         <div className="flex items-center gap-3">
            <div className="inline-flex p-1.5 bg-gray-200/50 rounded-lg border border-gray-200 backdrop-blur-sm">
               <button 
                 onClick={() => router.push('/societyadmin/asset-list')}
                 className="px-6 py-2.5 rounded-lg text-sm font-bold text-gray-600 hover:text-blue-600 hover:bg-white transition-all transform hover:scale-105 active:scale-95"
               >
                 Registry
               </button>
               <button 
                 onClick={() => router.push('/societyadmin/asset-dashboard')}
                 className="px-6 py-2.5 rounded-lg text-sm font-bold text-gray-600 hover:text-blue-600 hover:bg-white transition-all transform hover:scale-105 active:scale-95"
               >
                 Dashboard
               </button>
               <button 
                 onClick={() => router.push('/societyadmin/asset-bookings')}
                 className="px-6 py-2.5 rounded-lg text-sm font-bold text-gray-600 hover:text-blue-600 hover:bg-white transition-all transform hover:scale-105 active:scale-95"
               >
                 Bookings
               </button>
               <button 
                 className="px-6 py-2.5 rounded-lg text-sm font-bold bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25 transform hover:scale-105 active:scale-95 transition-all"
               >
                 AMC
               </button>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-90"
            >
              <Plus size={20} />
            </button>
         </div>
      </div>

      {/* Strategic KPI Grid */}
      <div className="bg-white/40 p-1.5 rounded-xl border border-gray-100 backdrop-blur-sm">
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            <StatCard title="Active Contracts" value={stats.active} icon={ShieldCheck} color="blue" trendValue="Operational" />
            <StatCard title="Planned Events" value={upcoming_services.length} icon={Timer} color="yellow" trendValue="SLA Intact" />
            <StatCard title="Security Gap" value={stats.gap} icon={ShieldAlert} color="red" trendValue="Action Required" />
            <FinancialStatCard title="Total Liabilities" value={`₹${stats.total_cost.toLocaleString()}`} label="Annual Governance Cost" icon={<IndianRupee size={22} />} color="emerald" />
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
         {/* Main Content Pane */}
         <div className="lg:col-span-8">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
               {/* Integrated Header */}
               <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2 p-1 bg-gray-200/50 rounded-lg border border-gray-200 w-fit backdrop-blur-sm">
                     <button 
                       onClick={() => setActiveTab('contracts')}
                       className={clsx(
                         "px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                         activeTab === 'contracts' ? "bg-white text-blue-600 shadow-sm border border-gray-200" : "text-gray-400 hover:text-gray-600"
                       )}
                     >
                        Contract Registry
                     </button>
                     <button 
                       onClick={() => setActiveTab('gap')}
                       className={clsx(
                        "px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                        activeTab === 'gap' ? "bg-white text-red-600 shadow-sm border border-red-100" : "text-gray-400 hover:text-red-500"
                       )}
                     >
                        Security Gap
                     </button>
                  </div>

                  <div className="relative">
                     <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                     <input 
                       type="text" 
                       placeholder="Quick Audit..." 
                       className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-[10px] font-bold uppercase tracking-widest outline-none focus:ring-2 focus:ring-blue-100 transition-all w-full sm:w-48 placeholder:text-gray-300"
                     />
                  </div>
               </div>

               {/* List Panels */}
               <div className="flex-1">
                  <AnimatePresence mode="wait">
                     <motion.div
                       key={activeTab}
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       exit={{ opacity: 0, y: -10 }}
                       transition={{ duration: 0.2 }}
                     >
                        {activeTab === 'contracts' && (
                           contracts.length > 0 ? (
                             <div className="divide-y divide-gray-100">
                               {contracts.map((c: any) => (
                                 <ContractRow key={c.id} contract={c} router={router} />
                               ))}
                             </div>
                           ) : (
                             <div className="p-32 text-center">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                  <Inbox size={32} className="text-gray-300" />
                                </div>
                                <p className="text-gray-500 font-black uppercase text-xs tracking-widest">No Active Governance</p>
                             </div>
                           )
                        )}
                        {activeTab === 'gap' && (
                           unprotected_assets.length > 0 ? (
                             <div className="divide-y divide-gray-100">
                               {unprotected_assets.map((a: any) => (
                                 <div key={a.id} className="p-6 flex items-center justify-between hover:bg-red-50/10 transition-all group border-l-4 border-l-transparent hover:border-l-red-500">
                                    <div className="flex items-center gap-5">
                                       <div className="w-12 h-12 bg-red-50 text-red-600 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 border border-red-100 shadow-sm">
                                          <Package size={22} />
                                       </div>
                                       <div>
                                          <h4 className="font-bold text-gray-900 tracking-tight uppercase text-sm mb-1">{a.name}</h4>
                                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.1em] leading-none">
                                             {a.category} • Vulnerable Profile
                                           </p>
                                       </div>
                                    </div>
                                    <button 
                                      onClick={() => {
                                         setSelectedAssetForAMC(a);
                                         setIsModalOpen(true);
                                      }}
                                      className="bg-gray-900 text-white px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95"
                                    >
                                       Provision Protection
                                    </button>
                                 </div>
                               ))}
                             </div>
                           ) : (
                             <div className="p-32 text-center">
                                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                                  <ShieldCheck size={32} className="text-emerald-500" />
                                </div>
                                <p className="text-gray-500 font-black uppercase text-xs tracking-widest">Full Perimeter Shielded</p>
                             </div>
                           )
                        )}
                     </motion.div>
                  </AnimatePresence>
               </div>
            </div>
         </div>

         {/* Sidebar: Upcoming Timeline */}
         <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-xl p-6 shadow-sm space-y-6 relative overflow-hidden group border border-gray-100">
                <div className="absolute top-[-20px] right-[-20px] p-6 opacity-[0.05] rotate-12 scale-150 group-hover:rotate-45 transition-transform duration-700">
                   <Timer size={100} className="text-blue-600" />
                </div>
                
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 flex items-center gap-3">
                   <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse shadow-[0_0_8px_rgba(37,99,235,0.4)]"></div>
                   Asset Schedule
                </h3>

                <div className="space-y-3 relative z-10">
                    {upcoming_services.length > 0 ? upcoming_services.map((s: any) => (
                      <motion.div 
                        key={s.id} 
                        whileHover={{ x: 5 }}
                        onClick={() => router.push('/societyadmin/asset-maintenance')}
                        className="p-4 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-between cursor-pointer hover:bg-blue-50 transition-all group"
                      >
                         <div>
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none mb-1.5">{formatDateSafe(s.scheduled_date)}</p>
                            <p className="font-bold text-gray-900 text-xs tracking-tight uppercase truncate max-w-[150px]">{s.asset_name}</p>
                            <p className="text-[9px] text-gray-400 font-bold uppercase mt-1 tracking-tight">Partner: {s.vendor_name || 'In-House'}</p>
                         </div>
                         <div className="w-8 h-8 bg-white border border-gray-100 rounded-lg flex items-center justify-center text-gray-300 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                            <ArrowUpRight size={14} />
                         </div>
                      </motion.div>
                    )) : (
                      <div className="py-12 text-center">
                         <p className="text-gray-300 font-black uppercase text-[10px] tracking-widest">No Imminent Ops</p>
                      </div>
                    )}
                </div>
                
                <div className="pt-6 border-t border-gray-50">
                   <div className="flex justify-between items-end mb-3">
                      <p className="text-[9px] text-gray-400 font-black uppercase tracking-[0.2em]">Governance Health</p>
                      <p className="text-[10px] text-blue-600 font-bold">85%</p>
                   </div>
                   <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 w-[85%] rounded-full shadow-[0_0_10px_rgba(37,99,235,0.2)]"></div>
                   </div>
                </div>
            </div>
         </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, icon, color, isCurrency }: any) {
   const colors: any = {
      blue: 'bg-blue-50 border-blue-100 text-blue-600',
      red: 'bg-red-50 border-red-100 text-red-600',
      orange: 'bg-orange-50 border-orange-100 text-orange-600',
      indigo: 'bg-indigo-50 border-indigo-100 text-indigo-600'
   };
   return (
      <div className={clsx("p-6 rounded-lg border transition-all flex items-center justify-between group hover:shadow-lg hover:bg-white", colors[color])}>
         <div>
            <p className="text-[9px] font-black uppercase tracking-widest mb-1.5 opacity-60 group-hover:opacity-100 transition-opacity">{label}</p>
            <h3 className="text-2xl font-bold tracking-tight leading-none flex items-center gap-1">
               {isCurrency && <IndianRupee size={16} className="mb-0.5" />}
               {value}
            </h3>
         </div>
         <div className="w-10 h-10 bg-white rounded flex items-center justify-center shadow-sm text-inherit transition-all group-hover:shadow-md">{icon}</div>
      </div>
   );
}

function ContractRow({ contract, router }: any) {
   const progress = (contract.completed_services / contract.total_services) * 100;
   return (
      <div className="px-8 py-6 flex items-center justify-between hover:bg-gray-50/50 transition-all border-l-4 border-l-transparent hover:border-l-blue-600 group">
         <div className="flex items-center gap-6 text-left flex-1">
            <div className="w-12 h-12 bg-gray-50 text-gray-400 rounded-lg flex items-center justify-center transition-all group-hover:bg-blue-600 group-hover:text-white border border-gray-100 shadow-sm shrink-0">
               <ShieldCheck size={24} />
            </div>
            <div className="min-w-0">
               <div className="flex items-center gap-3 mb-1.5">
                  <h4 className="font-bold text-gray-900 tracking-tight text-sm uppercase group-hover:text-blue-600 transition-colors leading-none truncate">{contract.asset_name}</h4>
                  <span className={clsx(
                     "px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest border shadow-sm shrink-0",
                     contract.contract_type === 'comprehensive' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-gray-50 text-gray-500 border-gray-200'
                  )}>
                     {contract.contract_type.replace('_', ' ')}
                  </span>
               </div>
               <div className="flex items-center gap-2">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none truncate">
                     Partner: <span className="text-gray-700">{contract.vendor_name}</span>
                  </p>
                  <span className="text-gray-200">•</span>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">
                     Ends: <span className="text-blue-600 font-black">{formatDateSafe(contract.end_date)}</span>
                  </p>
               </div>
            </div>
         </div>
         <div className="flex items-center gap-12 ml-6">
            <div className="text-right w-44 hidden xl:block">
               <div className="flex justify-between items-end mb-2">
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none">Cycle Coverage</p>
                  <p className="text-[9px] font-black text-gray-900 uppercase tracking-widest leading-none">{contract.completed_services}/{contract.total_services}</p>
               </div>
               <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 transition-all duration-1000 shadow-[0_0_8px_rgba(37,99,235,0.3)] rounded-full" 
                    style={{ width: `${progress}%` }} 
                  />
               </div>
            </div>
            <button 
               onClick={() => router.push('/societyadmin/asset-maintenance')}
               className="p-3 hover:bg-white rounded-lg transition-all text-blue-400 hover:text-blue-600 border border-transparent hover:border-blue-100 shadow-sm group-hover:translate-x-1"
            >
               <ChevronRight size={20} />
            </button>
         </div>
      </div>
   );
}

function CreateAMCModal({ prefilledAsset, onClose, onSuccess }: any) {
   const [assets, setAssets] = useState<any[]>([]);
   const [vendors, setVendors] = useState<any[]>([]);
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [formData, setFormData] = useState({
      asset_id: prefilledAsset?.id || '',
      vendor_id: '',
      contract_type: 'non_comprehensive',
      start_date: '',
      end_date: '',
      service_frequency: 'quarterly',
      amc_cost: '',
      payment_status: 'pending'
   });

   useEffect(() => {
     Promise.all([getAllAssets(), getVendorsList()]).then(([a, v]) => {
        if (a.success) setAssets(a.data || []);
        if (v.success) setVendors(v.data || []);
     });
   }, []);

   const handleSubmit = async (e: any) => {
      e.preventDefault();
      setIsSubmitting(true);
      try {
         const res = await createAMC(formData);
         if (res.success) {
            toast.success('Governance Protocol Committed');
            onSuccess();
         }
      } catch (err: any) {
         toast.error(err.message || 'Verification Failed');
      } finally {
         setIsSubmitting(false);
      }
   };

   return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
         <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white w-full max-w-xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
         >
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center border border-blue-100 shadow-sm">
                     <FileSignature size={24} />
                  </div>
                  <div>
                     <h2 className="text-xl font-bold text-gray-900 tracking-tight">Provision AMC</h2>
                     <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Enroll asset into maintenance protocol</p>
                  </div>
               </div>
               <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-all active:scale-90"><X size={24} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
               <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="space-y-6">
                     <div className="space-y-1.5 flex flex-col">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Target Asset Registry *</label>
                        <select 
                          required 
                          value={formData.asset_id}
                          onChange={e => setFormData(p => ({ ...p, asset_id: e.target.value }))}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                        >
                           <option value="">Choose Asset...</option>
                           {assets.map(a => <option key={a.id} value={a.id}>{a.name} ({a.category})</option>)}
                        </select>
                     </div>

                     <div className="space-y-1.5 flex flex-col">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Vendor Partner *</label>
                        <select 
                          required 
                          value={formData.vendor_id}
                          onChange={e => setFormData(p => ({ ...p, vendor_id: e.target.value }))}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                        >
                           <option value="">Choose Supplier...</option>
                           {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </select>
                     </div>

                     <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1.5 flex flex-col">
                           <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Activation Date</label>
                           <input required type="date" value={formData.start_date} onChange={e => setFormData(p => ({...p, start_date: e.target.value}))} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all" />
                        </div>
                        <div className="space-y-1.5 flex flex-col">
                           <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Termination Date</label>
                           <input required type="date" value={formData.end_date} onChange={e => setFormData(p => ({...p, end_date: e.target.value}))} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all" />
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1.5 flex flex-col">
                           <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Coverage Scope</label>
                           <select value={formData.contract_type} onChange={e => setFormData(p => ({...p, contract_type: e.target.value}))} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 outline-none focus:bg-white transition-all uppercase">
                              <option value="non_comprehensive">Operations Only</option>
                              <option value="comprehensive">Comprehensive</option>
                           </select>
                        </div>
                        <div className="space-y-1.5 flex flex-col">
                           <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Annual Liabilities (INR)</label>
                           <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><IndianRupee size={14} /></span>
                              <input required type="number" value={formData.amc_cost} onChange={e => setFormData(p => ({...p, amc_cost: e.target.value}))} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 outline-none focus:bg-white transition-all" placeholder="0.00" />
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="flex gap-4 pt-8 sticky bottom-0 bg-white">
                     <button type="button" onClick={onClose} className="px-6 py-3 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors">Abort Provisioning</button>
                     <button 
                       type="submit" 
                       disabled={isSubmitting}
                       className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-bold text-sm shadow-xl shadow-blue-200 flex items-center justify-center gap-3 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
                     >
                        {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        Commit Governance
                     </button>
                  </div>
               </form>
            </div>
         </motion.div>
      </div>
   );
}

function formatDateSafe(date: any) {
   if (!date) return 'N/A';
   const d = new Date(date);
   return isValid(d) ? format(d, 'dd MMM yyyy') : 'INVALID';
}
