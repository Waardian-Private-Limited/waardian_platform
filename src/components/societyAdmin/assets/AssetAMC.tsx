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
      <div className="bg-white rounded-lg border border-gray-100 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/10">
              <FileSignature className="text-white w-6 h-6" />
           </div>
           <div>
             <h1 className="text-xl font-bold text-gray-900 tracking-tight leading-none mb-1 uppercase">AMC Management</h1>
             <p className="text-xs text-gray-500 font-medium tracking-tight">Governance of Annual Maintenance Contracts</p>
           </div>
        </div>
        
        <button 
           onClick={() => setIsModalOpen(true)}
           className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-all shadow-lg shadow-blue-500/10 active:scale-95 font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"
        >
           <Plus size={16} />
           Authorize AMC
        </button>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
         <StatBox label="Active Contracts" value={stats.active} icon={<ShieldCheck size={20} />} color="blue" />
         <StatBox label="Planned Events" value={upcoming_services.length} icon={<Timer size={20} />} color="orange" />
         <StatBox label="Uncovered Gap" value={stats.gap} icon={<ShieldAlert size={20} />} color="red" />
         <StatBox label="Total Liabilities" value={stats.total_cost.toLocaleString()} isCurrency icon={<Activity size={20} />} color="indigo" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
         {/* Main Content Pane */}
         <div className="lg:col-span-8 space-y-4">
            {/* Tab Switcher */}
            <div className="bg-white p-1 rounded-lg border border-gray-100 shadow-sm flex gap-1 w-fit">
               <button 
                 onClick={() => setActiveTab('contracts')}
                 className={clsx(
                   "px-6 py-2 rounded text-[10px] font-black uppercase tracking-widest transition-all",
                   activeTab === 'contracts' ? "bg-blue-600 text-white shadow-md shadow-blue-500/10" : "text-gray-400 hover:text-gray-900"
                 )}
               >
                  Contract Registry
               </button>
               <button 
                 onClick={() => setActiveTab('gap')}
                 className={clsx(
                  "px-6 py-2 rounded text-[10px] font-black uppercase tracking-widest transition-all",
                  activeTab === 'gap' ? "bg-red-600 text-white shadow-md shadow-red-500/10" : "text-gray-400 hover:text-gray-900 hover:bg-red-50"
                 )}
               >
                  Security Gap
               </button>
            </div>

            {/* List Panels */}
            <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50 min-h-[500px]">
               {activeTab === 'contracts' && (
                  contracts.length > 0 ? (
                    <div className="divide-y divide-gray-50">
                      {contracts.map((c: any) => (
                        <ContractRow key={c.id} contract={c} router={router} />
                      ))}
                    </div>
                  ) : (
                    <div className="p-32 text-center opacity-20">
                       <Inbox size={60} className="text-gray-200 mx-auto mb-4" />
                       <p className="text-gray-500 font-black uppercase text-xs tracking-widest">No Active Governance</p>
                    </div>
                  )
               )}
               {activeTab === 'gap' && (
                  unprotected_assets.length > 0 ? (
                    <div className="divide-y divide-gray-50">
                      {unprotected_assets.map((a: any) => (
                        <div key={a.id} className="p-6 flex items-center justify-between hover:bg-red-50/10 transition-all group">
                           <div className="flex items-center gap-5">
                              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 border border-red-100">
                                 <Package size={22} />
                              </div>
                              <div>
                                 <h4 className="font-bold text-gray-900 tracking-tight uppercase text-sm mb-1">{a.name}</h4>
                                 <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">
                                    Cat: {a.category} <span className="text-gray-100 mx-2">|</span> Vulnerable Profile
                                  </p>
                              </div>
                           </div>
                           <button 
                             onClick={() => {
                                setSelectedAssetForAMC(a);
                                setIsModalOpen(true);
                             }}
                             className="bg-gray-900 text-white px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg active:scale-95"
                           >
                              Fix Vulnerability
                           </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-32 text-center opacity-20">
                       <ShieldCheck size={60} className="text-emerald-500 mx-auto mb-4" />
                       <p className="text-gray-500 font-black uppercase text-xs tracking-widest">Full Perimeter Shielded</p>
                    </div>
                  )
               )}
            </div>
         </div>

         {/* Sidebar: Upcoming Timeline */}
         <div className="lg:col-span-4 space-y-4">
            <div className="bg-gray-950 rounded-lg p-6 shadow-xl space-y-6 relative overflow-hidden group border border-gray-800">
                <div className="absolute top-[-20px] right-[-20px] p-6 opacity-[0.03] rotate-12 scale-150">
                   <Timer size={100} className="text-white" />
                </div>
                
                <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-400 flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
                   Asset Schedule
                </h3>

                <div className="space-y-3 relative z-10">
                    {upcoming_services.length > 0 ? upcoming_services.map((s: any) => (
                      <div 
                        key={s.id} 
                        onClick={() => router.push('/societyadmin/asset-maintenance')}
                        className="p-4 bg-white/5 rounded-lg border border-white/5 flex items-center justify-between cursor-pointer hover:bg-white/10 transition-all group"
                      >
                         <div>
                            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest leading-none mb-1.5">{formatDateSafe(s.scheduled_date)}</p>
                            <p className="font-bold text-white text-xs tracking-tight uppercase truncate max-w-[150px]">{s.asset_name}</p>
                            <p className="text-[9px] text-white/30 font-bold uppercase mt-1 tracking-tight">Partner: {s.vendor_name || 'In-House'}</p>
                         </div>
                         <div className="w-8 h-8 bg-white/5 rounded flex items-center justify-center text-white/30 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                            <ArrowUpRight size={14} />
                         </div>
                      </div>
                    )) : (
                      <div className="py-10 text-center opacity-20">
                         <p className="text-white font-black uppercase text-[10px] tracking-widest">No Imminent Ops</p>
                      </div>
                    )}
                </div>
                
                <div className="pt-6 border-t border-white/5">
                   <p className="text-[9px] text-white/30 font-black uppercase tracking-[0.2em] mb-3">Governance Health</p>
                   <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 w-[85%] rounded-full shadow-[0_0_10px_rgba(59,130,246,0.3)]"></div>
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
      <div className="p-6 flex items-center justify-between hover:bg-gray-50/50 transition-all border-l-4 border-l-transparent hover:border-l-blue-600 group">
         <div className="flex items-center gap-5 text-left">
            <div className="w-12 h-12 bg-gray-50 text-gray-400 rounded-lg flex items-center justify-center transition-all group-hover:bg-blue-600 group-hover:text-white border border-gray-100 shadow-sm">
               <ShieldCheck size={22} />
            </div>
            <div>
               <div className="flex items-center gap-3 mb-1">
                  <h4 className="font-bold text-gray-900 tracking-tight text-sm uppercase group-hover:text-blue-600 transition-colors">{contract.asset_name}</h4>
                  <span className={clsx(
                     "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border",
                     contract.contract_type === 'comprehensive' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-gray-50 text-gray-500 border-gray-200'
                  )}>
                     {contract.contract_type}
                  </span>
               </div>
               <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">
                  Partner: <span className="text-gray-900">{contract.vendor_name}</span> <span className="mx-2 text-gray-100">|</span> Ends: <span className="text-blue-600 font-black">{formatDateSafe(contract.end_date)}</span>
               </p>
            </div>
         </div>
         <div className="flex items-center gap-10">
            <div className="text-right w-44 hidden sm:block">
               <div className="flex justify-between items-end mb-1.5">
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none">Cycle Coverage</p>
                  <p className="text-[9px] font-black text-gray-900 uppercase tracking-widest leading-none">{contract.completed_services}/{contract.total_services}</p>
               </div>
               <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 transition-all duration-1000 shadow-[0_0_8px_rgba(37,99,235,0.2)]" 
                    style={{ width: `${progress}%` }} 
                  />
               </div>
            </div>
            <button 
               onClick={() => router.push('/societyadmin/asset-maintenance')}
               className="w-8 h-8 rounded bg-gray-50 text-gray-300 group-hover:bg-blue-600 group-hover:text-white transition-all flex items-center justify-center shadow-sm"
            >
               <ArrowUpRight size={16} />
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
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
         <div className="bg-white w-full max-w-xl rounded-lg shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-500 border border-gray-100 flex flex-col max-h-[90vh]">
            <div className="p-6 bg-blue-600 text-white flex justify-between items-center shrink-0">
               <div className="flex items-center gap-3">
                  <FileSignature size={20} />
                  <h2 className="text-xl font-bold tracking-tight uppercase leading-none">Provision AMC</h2>
               </div>
               <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-all active:scale-90"><X size={20} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
               <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="p-5 bg-gray-50 border border-gray-100 rounded-lg space-y-4">
                     <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block pl-1">Target Asset Registry *</label>
                        <select 
                          required 
                          value={formData.asset_id}
                          onChange={e => setFormData(p => ({ ...p, asset_id: e.target.value }))}
                          className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 font-bold text-xs h-10 uppercase outline-none"
                        >
                           <option value="">Choose Asset...</option>
                           {assets.map(a => <option key={a.id} value={a.id}>{a.name} ({a.category})</option>)}
                        </select>
                     </div>

                     <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block pl-1">Vendor Partner *</label>
                        <select 
                          required 
                          value={formData.vendor_id}
                          onChange={e => setFormData(p => ({ ...p, vendor_id: e.target.value }))}
                          className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 font-bold text-xs h-10 uppercase outline-none"
                        >
                           <option value="">Choose Supplier...</option>
                           {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </select>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block pl-1">Activation Date</label>
                        <input required type="date" value={formData.start_date} onChange={e => setFormData(p => ({...p, start_date: e.target.value}))} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg font-bold text-xs h-10 outline-none focus:ring-2 focus:ring-blue-100" />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block pl-1">Termination Date</label>
                        <input required type="date" value={formData.end_date} onChange={e => setFormData(p => ({...p, end_date: e.target.value}))} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg font-bold text-xs h-10 outline-none focus:ring-2 focus:ring-blue-100" />
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block pl-1">Coverage Scope</label>
                        <select value={formData.contract_type} onChange={e => setFormData(p => ({...p, contract_type: e.target.value}))} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg font-bold text-xs h-10 uppercase outline-none">
                           <option value="non_comprehensive">Operations Only</option>
                           <option value="comprehensive">Comprehensive</option>
                        </select>
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block pl-1">Annual Liabilities (INR)</label>
                        <div className="relative">
                           <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><IndianRupee size={10} /></span>
                           <input required type="number" value={formData.amc_cost} onChange={e => setFormData(p => ({...p, amc_cost: e.target.value}))} className="w-full pl-8 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg font-bold text-xs h-10 outline-none placeholder:text-gray-300" placeholder="0.00" />
                        </div>
                     </div>
                  </div>

                  <div className="flex gap-4 pt-6 mt-4 border-t border-gray-100">
                     <button type="button" onClick={onClose} className="flex-1 py-3 text-[10px] font-black uppercase text-gray-400 hover:text-gray-900 transition-all tracking-widest">Abort Provisioning</button>
                     <button 
                       type="submit" 
                       disabled={isSubmitting}
                       className="flex-[2] py-4 bg-blue-600 text-white rounded-lg font-black uppercase text-xs tracking-[0.2em] shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2 hover:bg-blue-700 transition-all active:scale-95 disabled:bg-gray-100 disabled:text-gray-400"
                     >
                        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Commit Governance
                     </button>
                  </div>
               </form>
            </div>
         </div>
      </div>
   );
}

function formatDateSafe(date: any) {
   if (!date) return 'N/A';
   const d = new Date(date);
   return isValid(d) ? format(d, 'dd MMM yyyy') : 'INVALID';
}
