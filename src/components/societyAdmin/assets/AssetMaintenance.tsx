'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { format, isValid } from 'date-fns';
import { 
  Settings, Wrench, Search, Plus, Calendar, 
  MapPin, AlertTriangle, CheckCircle, Clock, ChevronRight,
  TrendingUp, Activity, Inbox, Timer,
  IndianRupee, User, X, Save, FileText, FilePlus, Loader2, History, Package,
  AlertCircle, RefreshCw, ChevronLeft, ArrowUpRight
} from 'lucide-react';
import { 
  getMaintenanceDashboard, markAssetAsServiced, createRepairRequest, 
  getVendorsList, getAssetFullDetails, getInventoryList,
  uploadFiles 
} from '@/lib/apiClient';
import { toast } from 'react-hot-toast';
import clsx from 'clsx';

export default function AssetMaintenance() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overdue' | 'upcoming' | 'completed'>('overdue');
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedAssetForHistory, setSelectedAssetForHistory] = useState<any>(null);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [selectedAssetForService, setSelectedAssetForService] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState<number | null>(null);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const maintenanceRes = await getMaintenanceDashboard();
      if (maintenanceRes.success) setData(maintenanceRes.data);
    } catch (error) {
      toast.error('Failed to sync maintenance ledger');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleMarkServiced = async (asset: any) => {
     setSelectedAssetForService(asset);
     setIsServiceModalOpen(true);
  };

  const handleViewHistory = (asset: any) => {
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

  const currentList = useMemo(() => {
    if (!data) return [];
    if (activeTab === 'overdue') return data.overdue || [];
    if (activeTab === 'upcoming') return data.upcoming || [];
    if (activeTab === 'completed') return data.completed || [];
    return [];
  }, [data, activeTab]);

  const totalPages = Math.ceil(currentList.length / itemsPerPage);
  const paginatedList = currentList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="animate-spin text-blue-600" size={40} />
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none">Accessing Maintenance Vault...</p>
      </div>
    );
  }

  const { overdue = [], upcoming = [], completed = [] } = data || {};

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {isServiceModalOpen && selectedAssetForService && (
        <ServiceActionModal 
          asset={selectedAssetForService}
          onClose={() => setIsServiceModalOpen(false)}
          onSuccess={() => {
            setIsServiceModalOpen(false);
            fetchData();
          }}
        />
      )}

      {isHistoryModalOpen && selectedAssetForHistory && (
         <MaintenanceHistoryModal 
           asset={selectedAssetForHistory} 
           onClose={() => setIsHistoryModalOpen(false)} 
         />
      )}

      {/* Header Area */}
      <div className="bg-white rounded-lg border border-gray-100 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/10">
              <Settings className="text-white w-6 h-6" />
           </div>
           <div>
             <h1 className="text-xl font-bold text-gray-900 tracking-tight leading-none mb-1 uppercase">Asset Maintenance</h1>
             <p className="text-xs text-gray-500 font-medium tracking-tight">Systematic tracking of AMC and service protocols</p>
           </div>
        </div>
        <button onClick={fetchData} className="flex hidden md:flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-600 px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border border-gray-100 active:scale-95">
           <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
           Sync Ledger
        </button>
      </div>

      {/* Analytics Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
         <MetricBox 
            label="Critical Status" 
            value={overdue.length} 
            icon={<AlertTriangle size={18} />} 
            color="red" 
            onClick={() => { setActiveTab('overdue'); setCurrentPage(1); }}
            active={activeTab === 'overdue'}
         />
         <MetricBox 
            label="Planned Events" 
            value={upcoming.length} 
            icon={<Timer size={18} />} 
            color="orange" 
            onClick={() => { setActiveTab('upcoming'); setCurrentPage(1); }}
            active={activeTab === 'upcoming'}
         />
         <MetricBox 
            label="Service Logs" 
            value={completed.length} 
            icon={<History size={18} />} 
            color="blue" 
            onClick={() => { setActiveTab('completed'); setCurrentPage(1); }}
            active={activeTab === 'completed'}
         />
         <MetricBox label="Reliability Index" value="98%" icon={<Activity size={18} />} color="emerald" />
      </div>

      {/* Main Ledger Section */}
      <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
         <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/30">
            <div className="flex bg-white p-1 rounded-lg border border-gray-100 shadow-sm">
               {[
                 { id: 'overdue', label: 'Overdue' },
                 { id: 'upcoming', label: 'Upcoming' },
                 { id: 'completed', label: 'History' }
               ].map((tab: any) => (
                  <button 
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); setCurrentPage(1); }}
                    className={clsx(
                       "px-6 py-2 rounded text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                       activeTab === tab.id ? "bg-blue-600 text-white shadow-md shadow-blue-500/10" : "text-gray-400 hover:text-gray-900"
                    )}
                  >
                     {tab.label}
                  </button>
               ))}
            </div>
            <div className="flex items-center gap-2 group cursor-pointer" onClick={fetchData}>
               <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-blue-600 transition-colors">Last Updated: {format(new Date(), 'hh:mm a')}</p>
            </div>
         </div>

         <div className="flex-1 divide-y divide-gray-50">
            {paginatedList.length > 0 ? paginatedList.map((item: any) => (
               activeTab === 'completed' 
                 ? <HistoryRow key={item.id} log={item} onViewHistory={handleViewHistory} />
                 : <PlanRow key={item.id} plan={item} type={activeTab} onService={handleMarkServiced} onRepair={handleRepairRequest} processing={isProcessing === item.asset_id} onViewHistory={handleViewHistory} router={router} />
            )) : (
               <NoData 
                 icon={activeTab === 'overdue' ? <Inbox size={48} /> : activeTab === 'upcoming' ? <Calendar size={48} /> : <History size={48} />} 
                 title={`No ${activeTab} records found`} 
               />
            )}
         </div>

         {/* Pagination Footer */}
         <div className="p-6 border-t border-gray-100 bg-white flex items-center justify-between">
            <div className="flex items-center gap-4">
               <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none">
                 Page <span className="text-gray-900">{currentPage}</span> of <span className="text-gray-900">{totalPages || 1}</span>
               </p>
               <div className="h-4 w-[1px] bg-gray-100" />
               <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest leading-none">
                  Viewing <span className="text-gray-500">{paginatedList.length}</span> of <span className="text-gray-500">{currentList.length}</span> Results
               </p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={clsx(
                  "px-4 py-2 border rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95",
                  currentPage === 1 ? "bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                )}
              >
                Previous
              </button>
              <button 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || totalPages === 0}
                className={clsx(
                  "px-4 py-2 border rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95",
                  currentPage === totalPages || totalPages === 0 ? "bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed" : "bg-blue-600 border-blue-600 text-white shadow-md hover:bg-blue-700"
                )}
              >
                Next {itemsPerPage} Records
              </button>
            </div>
          </div>
      </div>
    </div>
  );
}

function MetricBox({ label, value, icon, color, onClick, active }: any) {
   const variants: any = {
      blue: active ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-100 text-gray-900',
      red: active ? 'bg-red-600 border-red-600 text-white' : 'bg-white border-gray-100 text-gray-900 hover:border-red-100',
      orange: active ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white border-gray-100 text-gray-900 hover:border-orange-100',
      emerald: 'bg-white border-gray-100 text-gray-900'
   };
   
   const iconColors: any = {
      blue: active ? 'text-white' : 'text-blue-600',
      red: active ? 'text-white' : 'text-red-500',
      orange: active ? 'text-white' : 'text-orange-500',
      emerald: 'text-emerald-600'
   };

   return (
      <button 
        onClick={onClick}
        className={clsx(
           "p-6 rounded-lg border transition-all text-left flex items-center justify-between group",
           variants[color],
           active && "shadow-xl shadow-blue-500/10 scale-95"
        )}
      >
         <div>
            <p className={clsx("text-[8px] font-black uppercase tracking-[0.2em] mb-1 leading-none", active ? "text-white/70" : "text-gray-400")}>{label}</p>
            <h3 className="text-2xl font-bold tracking-tight leading-none">{value}</h3>
         </div>
         <div className={clsx("transition-transform group-hover:scale-110", iconColors[color])}>{icon}</div>
      </button>
   );
}

function PlanRow({ plan, type, onService, onRepair, processing, onViewHistory, router }: any) {
   return (
      <div className="p-6 flex items-center justify-between hover:bg-gray-50 transition-all group">
         <div className="flex items-center gap-5">
            <div 
               onClick={() => onViewHistory({ asset_id: plan.asset_id, asset_name: plan.asset_name })}
               className={clsx(
                  "w-12 h-12 rounded-lg flex items-center justify-center cursor-pointer transition-all border shadow-sm",
                  type === 'overdue' ? 'bg-red-50 text-red-600 border-red-100 hover:bg-red-600 hover:text-white' : 'bg-orange-50 text-orange-600 border-orange-100 hover:bg-orange-600 hover:text-white'
               )}
            >
               <Settings size={20} className={type === 'overdue' ? 'animate-pulse' : ''} />
            </div>
            <div>
               <div className="flex items-center gap-3 mb-1">
                  <h4 className="font-bold text-gray-900 text-sm tracking-tight uppercase cursor-pointer hover:text-blue-600 transition-colors"
                      onClick={() => onViewHistory({ asset_id: plan.asset_id, asset_name: plan.asset_name })}>{plan.asset_name}</h4>
                  <span className={clsx(
                     "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border",
                     type === 'overdue' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-orange-50 text-orange-600 border-orange-200'
                  )}>
                     {type} Protocol
                  </span>
               </div>
               <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                  <span className="flex items-center gap-1"><MapPin size={10} className="text-gray-300" /> {plan.block_wing || 'HQ'} | {plan.exact_location || 'Point'}</span>
                  <span className="text-gray-200">•</span>
                  <span className="flex items-center gap-1"><History size={10} className="text-gray-300" /> Last: {formatDateSafe(plan.last_service_date)}</span>
                  <span className="text-gray-200">•</span>
                  <span className="flex items-center gap-1 text-blue-600"><Timer size={10} /> Plan: {plan.maintenance_type || 'Custom'}</span>
               </div>
            </div>
         </div>

         <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block pr-4 border-r border-gray-100">
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 leading-none">Schedule Target</p>
               <p className={clsx("text-xs font-bold leading-none", type === 'overdue' ? 'text-red-600' : 'text-orange-600')}>
                  {formatDateSafe(plan.next_service_date)}
               </p>
            </div>
            
            <div className="flex items-center gap-2">
               <button 
                  onClick={() => onRepair(plan.asset_id)}
                  disabled={processing}
                  className="p-2.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all border border-transparent hover:border-red-100"
                  title="Flag Breakdown"
               >
                  {processing ? <Loader2 size={16} className="animate-spin" /> : <AlertCircle size={18} />}
               </button>
               <button 
                  onClick={() => onService(plan)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/10 transition-all active:scale-95"
               >
                  Authorize Service
               </button>
            </div>
         </div>
      </div>
   );
}

function HistoryRow({ log, onViewHistory }: any) {
   return (
      <div 
        onClick={() => onViewHistory({ asset_id: log.asset_id, asset_name: log.asset_name })}
        className="p-6 flex items-center justify-between hover:bg-gray-50 transition-all cursor-pointer border-l-4 border-l-transparent hover:border-l-blue-600 group"
      >
         <div className="flex items-center gap-5">
            <div className="w-10 h-10 bg-gray-50 text-gray-400 rounded-lg flex items-center justify-center border border-gray-100 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all shadow-sm">
               <CheckCircle size={18} />
            </div>
            <div>
               <h4 className="font-bold text-gray-900 text-sm tracking-tight uppercase group-hover:text-blue-600 transition-colors">{log.asset_name}</h4>
               <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-1">
                  <span className="text-blue-600">{log.service_type} Protocol</span>
                  <span className="text-gray-200">•</span>
                  <span>Partner: {log.vendor || 'In-House'}</span>
                  <span className="text-gray-200">•</span>
                  <span className="flex items-center gap-0.5 text-gray-900 font-black"><IndianRupee size={9} /> {log.cost}</span>
               </div>
            </div>
         </div>
         <div className="flex items-center gap-8">
            <div className="text-right">
               <p className="text-[10px] font-bold text-gray-900 leading-none">{formatDateSafe(log.service_date)}</p>
               <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1 opacity-60">Verified Entry</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-300 group-hover:text-blue-600 group-hover:bg-blue-50 transition-all">
               <ArrowUpRight size={16} />
            </div>
         </div>
      </div>
   );
}

function NoData({ icon, title }: any) {
   return (
      <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-4 opacity-20">
         <div className="text-gray-400">{icon}</div>
         <h4 className="font-bold uppercase tracking-widest text-[10px] text-gray-500">{title}</h4>
      </div>
   );
}

function ServiceActionModal({ asset, onClose, onSuccess }: any) {
   const [vendors, setVendors] = useState<any[]>([]);
   const [inventory, setInventory] = useState<any[]>([]);
   const [partsUsed, setPartsUsed] = useState<{itemId: number, quantity: number, name: string}[]>([]);
   const [selectedPartId, setSelectedPartId] = useState('');
   const [partQuant, setPartQuant] = useState('1');
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [uploading, setUploading] = useState(false);

   const [formData, setFormData] = useState({
      asset_id: asset.asset_id,
      service_type: 'scheduled',
      vendor: '',
      vendor_id: '',
      cost: '',
      remarks: '',
      condition_status: 'good',
      invoice_url: '',
      next_service_date: '' // New field
   });

   useEffect(() => {
      Promise.all([getVendorsList(), getInventoryList()]).then(([v, i]) => {
         if (v.success) setVendors(v.data || []);
         if (i.success) setInventory(i.data || []);
      });
   }, []);

   const addPart = () => {
      const p = inventory.find(inv => inv.id.toString() === selectedPartId);
      if (!p) return;
      if (p.quantity < Number(partQuant)) return toast.error('Insufficient stock in inventory');
      setPartsUsed([...partsUsed, { itemId: p.id, quantity: Number(partQuant), name: p.item_name }]);
      setSelectedPartId('');
   };

   const removePart = (idx: number) => setPartsUsed(partsUsed.filter((_, i) => i !== idx));

   const handleSubmit = async (e: any) => {
      e.preventDefault();
      setIsSubmitting(true);
      try {
         const res = await markAssetAsServiced({
            ...formData,
            parts_used: partsUsed.map(p => ({ itemId: p.itemId, quantity: p.quantity }))
         });
         if (res.success) {
            toast.success('Service log committed to ledger');
            onSuccess();
         }
      } catch (err: any) {
         toast.error(err.message || 'Operation failure');
      } finally {
         setIsSubmitting(false);
      }
   };

   return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
         <div className="bg-white w-full max-w-lg rounded-lg shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-500 border border-gray-100 flex flex-col max-h-[90vh]">
            <div className="p-6 bg-blue-600 text-white flex justify-between items-center shrink-0">
               <div className="flex items-center gap-3">
                  <Wrench size={20} />
                  <h2 className="text-xl font-bold tracking-tight uppercase leading-none">Acknowledge Service</h2>
               </div>
               <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-all active:scale-90"><X size={20} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
               <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Context Card */}
                  <div className="p-5 bg-gray-50 border border-gray-100 rounded-lg grid grid-cols-2 gap-6 relative overflow-hidden group hover:bg-white hover:border-blue-100 transition-all shadow-sm">
                     <div className="absolute right-[-10px] top-[-10px] opacity-[0.03] group-hover:scale-125 transition-transform">
                        <Package size={80} className="text-blue-600" />
                     </div>
                     <div className="relative z-10">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Target Asset</p>
                        <p className="text-sm font-bold text-gray-900 uppercase tracking-tight">{asset.asset_name}</p>
                     </div>
                     <div className="relative z-10 text-right">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Expected Next Due</p>
                        <p className="text-xs font-bold text-blue-600">
                          {formatDateSafe(asset.next_service_date)}
                        </p>
                     </div>
                     <div className="relative z-10 col-span-2 pt-4 border-t border-gray-100 flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-500">
                        <span>Nature: <span className="text-gray-900">{asset.maintenance_type || 'STANDARD'}</span></span>
                        <span>Frequency: <span className="text-gray-900">{asset.frequency || 'N/A'}</span></span>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block pl-1">Service Nature *</label>
                        <select 
                          required 
                          value={formData.service_type}
                          onChange={e => setFormData(p => ({ ...p, service_type: e.target.value }))}
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 font-bold text-xs h-10 uppercase outline-none"
                        >
                           <option value="scheduled">Scheduled Refurbishment</option>
                           <option value="repair">Ad-hoc Reconstruction</option>
                           <option value="inspection">Compliance Audit</option>
                        </select>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5 block pl-1">Partner Resource</label>
                           <select 
                             value={formData.vendor_id}
                             onChange={e => {
                                 const v = vendors.find(vend => vend.id.toString() === e.target.value);
                                 setFormData(p => ({ ...p, vendor_id: e.target.value, vendor: v ? v.name : '' }));
                              }}
                             className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg font-bold text-xs h-10 uppercase outline-none"
                           >
                              <option value="">INTERNAL TEAM</option>
                              {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                           </select>
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5 block pl-1">Financial Inflow (INR)</label>
                           <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><IndianRupee size={10} /></span>
                              <input 
                                type="number" 
                                placeholder="0.00"
                                value={formData.cost}
                                onChange={e => setFormData(p => ({ ...p, cost: e.target.value }))}
                                className="w-full pl-8 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg font-bold text-xs h-10 outline-none" 
                              />
                           </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5 block pl-1">Action Condition</label>
                           <select 
                             value={formData.condition_status}
                             onChange={e => setFormData(p => ({ ...p, condition_status: e.target.value }))}
                             className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg font-bold text-xs h-10 uppercase outline-none"
                           >
                              <option value="new">Pristine</option>
                              <option value="good">Operational</option>
                              <option value="fair">Functional</option>
                              <option value="poor">Compromised</option>
                           </select>
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-0.5 block pl-1 font-bold">Reschedule Next Due</label>
                           <div className="relative">
                              <input 
                                type="date" 
                                value={formData.next_service_date}
                                onChange={e => setFormData(p => ({ ...p, next_service_date: e.target.value }))}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg font-bold text-xs h-10 outline-none focus:ring-2 focus:ring-blue-100" 
                              />
                              <Calendar size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                           </div>
                        </div>
                     </div>

                     {/* Spare Parts Utilization */}
                     <div className="p-5 bg-gray-50 border border-gray-100 rounded-lg space-y-4">
                        <div className="flex items-center gap-2 mb-1">
                           <Package size={14} className="text-blue-600" />
                           <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Inventory Integration</h4>
                        </div>
                        <div className="flex gap-2">
                           <select 
                             className="flex-[3] bg-white border border-gray-200 rounded-lg px-3 py-2 text-[10px] font-bold uppercase h-10 outline-none"
                             value={selectedPartId}
                             onChange={e => setSelectedPartId(e.target.value)}
                           >
                              <option value="">SELECT SPARE RESOURCE...</option>
                              {inventory.map(inv => <option key={inv.id} value={inv.id}>{inv.item_name} (STK: {inv.quantity})</option>)}
                           </select>
                           <input 
                             type="number" 
                             placeholder="QTY"
                             className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-[10px] font-bold h-10 outline-none" 
                             value={partQuant}
                             onChange={e => setPartQuant(e.target.value)}
                           />
                           <button type="button" onClick={addPart} className="w-10 h-10 bg-gray-900 text-white rounded-lg flex items-center justify-center active:scale-90 transition-all"><Plus size={16} /></button>
                        </div>
                        
                        <div className="space-y-2">
                           {partsUsed.map((p, i) => (
                             <div key={i} className="flex items-center justify-between text-[10px] font-bold text-gray-700 bg-white p-2.5 px-4 rounded-lg border border-gray-100 shadow-sm animate-in slide-in-from-right-2">
                                <span className="uppercase tracking-tight">{p.name} <span className="text-blue-600 ml-2">x {p.quantity}</span></span>
                                <button type="button" onClick={() => removePart(i)} className="text-red-400 hover:text-red-600"><X size={14} /></button>
                             </div>
                           ))}
                        </div>
                     </div>

                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block pl-1">Technical Disposition / Notes</label>
                        <textarea 
                          rows={2}
                          value={formData.remarks}
                          onChange={e => setFormData(p => ({ ...p, remarks: e.target.value }))}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg font-bold text-xs uppercase resize-none outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-gray-300"
                          placeholder="SUMMARY OF REPLACEMENTS AND ADJUSTMENTS..."
                        />
                     </div>
                  </div>

                  <div className="flex gap-4 pt-6 mt-4 border-t border-gray-100">
                     <button type="button" onClick={onClose} className="flex-1 py-3 text-[10px] font-black uppercase text-gray-400 hover:text-gray-900 transition-all tracking-widest">Abort protocol</button>
                     <button 
                       type="submit" 
                       disabled={isSubmitting}
                       className="flex-[2] py-4 bg-blue-600 text-white rounded-lg font-black uppercase text-xs tracking-[0.2em] shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2 hover:bg-blue-700 transition-all active:scale-95 disabled:bg-gray-100 disabled:text-gray-400"
                     >
                        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Commit Service Log
                     </button>
                  </div>
               </form>
            </div>
         </div>
      </div>
   );
}

function MaintenanceHistoryModal({ asset, onClose }: any) {
   const [history, setHistory] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const [activePlan, setActivePlan] = useState<any>(null);

   useEffect(() => {
      const fetchHistory = async () => {
         try {
            const res = await getAssetFullDetails(asset.asset_id);
            if (res.success) {
               setHistory(res.data.maintenance_history || []);
               setActivePlan(res.data.maintenance_plan);
            }
         } catch (error) {
            toast.error('History retrieval failure');
         } finally {
            setLoading(false);
         }
      };
      fetchHistory();
   }, [asset.asset_id]);

   return (
      <div className="fixed inset-0 z-[100] flex items-center justify-end bg-black/50 backdrop-blur-sm">
         <div className="bg-white h-full w-full max-w-xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-500 border-l border-gray-100">
            {/* Header */}
            <div className="p-8 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
               <div>
                  <h3 className="text-xl font-bold text-gray-900 tracking-tight uppercase leading-none">{asset.asset_name}</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase mt-2 tracking-widest leading-none">Maintenance Performance History</p>
               </div>
               <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-all active:scale-90"><X size={20} className="text-gray-400" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar pb-32">
               {loading ? (
                  <div className="flex flex-col items-center justify-center h-full space-y-4 opacity-30 p-20">
                     <RefreshCw className="animate-spin text-blue-600" size={32} />
                     <p className="text-[10px] font-black uppercase tracking-widest">Retrieving Timeline...</p>
                  </div>
               ) : (
                  <div className="space-y-10">
                     {/* Monitoring Summary */}
                     {activePlan && (
                        <div className="p-6 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-between group hover:bg-white transition-all shadow-sm">
                           <div>
                              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none mb-2">Protocol Monitoring</p>
                              <h4 className="text-lg font-bold text-gray-900 leading-none">SERVICE CYCLE</h4>
                           </div>
                           <div className="text-right">
                              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none mb-2">Next Milestone</p>
                              <p className="text-lg font-black text-blue-600 leading-none">{formatDateSafe(activePlan.next_service_date)}</p>
                           </div>
                        </div>
                     )}

                     {/* Timeline Points */}
                     <div className="relative pl-6 space-y-12 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-gray-100">
                        {history.length > 0 ? history.map((h: any) => (
                           <div key={h.id} className="relative transition-all hover:translate-x-1">
                              <div className="absolute -left-[22px] top-1.5 w-4 h-4 rounded-full border-2 border-white bg-blue-600 shadow-sm z-10" />
                              <div className="p-6 bg-white border border-gray-100 rounded-lg shadow-sm hover:border-blue-100 transition-all">
                                 <div className="flex justify-between items-start mb-5">
                                    <div>
                                       <span className="px-2 py-0.5 bg-gray-900 text-white text-[9px] font-black uppercase tracking-widest rounded leading-none">{h.service_type}</span>
                                       <h5 className="mt-3 font-bold text-gray-900 text-base leading-none uppercase">{formatDateSafe(h.service_date)}</h5>
                                    </div>
                                    <div className="text-right">
                                       <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none mb-1">Financials</p>
                                       <p className="font-bold text-gray-900 flex items-center justify-end gap-1"><IndianRupee size={12} /> {h.cost.toLocaleString()}</p>
                                    </div>
                                 </div>
                                 <div className="space-y-4">
                                    <div className="flex items-center gap-3 bg-gray-50 p-3 rounded border border-gray-50">
                                       <User size={14} className="text-gray-400" />
                                       <p className="text-[11px] font-bold text-gray-600 uppercase tracking-tight">{h.vendor || 'INTERNAL REPAIR TEAM'}</p>
                                    </div>
                                    <p className="text-xs text-gray-500 font-medium leading-relaxed italic border-l-2 border-blue-50 pl-4 bg-gray-50/30 py-2">
                                       "{h.remarks || 'NO DETAILED LOGS CAPTURED FOR THIS PROTOCOL EVENT.'}"
                                    </p>
                                 </div>
                                 {h.invoice_url && (
                                    <a href={h.invoice_url} target="_blank" className="mt-6 flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-widest hover:underline w-fit">
                                       <FileText size={14} /> View Verified Document
                                    </a>
                                 )}
                              </div>
                           </div>
                        )) : (
                           <div className="py-20 text-center opacity-20">
                              <History size={48} className="mx-auto mb-4" />
                              <p className="font-black uppercase text-xs tracking-widest italic">Timeline Dormant</p>
                           </div>
                        )}
                     </div>
                  </div>
               )}
            </div>
         </div>
      </div>
   );
}

function formatDateSafe(date: any) {
   if (!date) return 'UNSCHEDULED';
   const d = new Date(date);
   return isValid(d) ? format(d, 'dd MMM yyyy') : 'INVALID DATA';
}
