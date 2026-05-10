'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, Package, MapPin, Calendar, Wrench, History as HistoryIcon, 
  CheckCircle2, Clock, AlertCircle, Info, Boxes, 
  Timer, ShieldCheck, Loader2, Edit2, User, DollarSign, Trash2, Shield, Calculator, FileText, TrendingDown,
  RefreshCw, TrendingUp
} from 'lucide-react';
import { getAssetFullDetails, disposeAsset, Asset } from '@/lib/apiClient';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

interface MaintenanceLog {
  service_type: string;
  service_date: string;
  vendor: string;
  cost: number;
}

interface MovementLog {
  status: 'out' | 'in';
  to_location: string;
  checkout_time: string;
  user_name: string;
}

interface AssetFullDetails extends Asset {
  maintenance_history?: MaintenanceLog[];
  movement_history?: MovementLog[];
  is_bookable: boolean;
  approval_required: boolean;
  pricing_model: 'free' | 'paid_hourly' | 'paid_daily';
  price: number;
  security_deposit: number;
  max_booking_hours: number | null;
  scrap_value?: number;
  useful_life_years?: number;
  purchase_date?: string;
  invoice_url?: string;
  description: string;
  disposal_date?: string;
  disposal_amount?: number;
  disposal_reason?: string;
}

interface AssetDetailsModalProps {
  assetId: number;
  onClose: () => void;
  onEdit?: () => void;
  onUpdate?: () => void;
}

const InfoRow = ({ label, value, icon, fullWidth }: { label: string; value: string; icon: React.ReactNode; fullWidth?: boolean }) => (
  <div className={clsx("p-4 bg-slate-50 border border-slate-100 rounded-none flex items-center gap-4 group hover:bg-white hover:border-blue-100 transition-all", fullWidth ? 'col-span-1 md:col-span-2' : 'col-span-1')}>
     <div className="w-10 h-10 bg-white border border-slate-100 rounded-none flex items-center justify-center text-blue-600 shadow-sm transition-transform group-hover:scale-105">
        {icon}
     </div>
     <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5">{label}</p>
        <p className="text-xs font-bold text-slate-900 truncate uppercase">{value || 'NOT SPECIFIED'}</p>
     </div>
  </div>
);

export default function AssetDetailsModal({ assetId, onClose, onEdit, onUpdate }: AssetDetailsModalProps) {
  const [asset, setAsset] = useState<AssetFullDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'maintenance' | 'movements' | 'financials'>('info');
  const [showDisposeModal, setShowDisposeModal] = useState(false);
  const [disposalData, setDisposalData] = useState({
    disposal_date: format(new Date(), 'yyyy-MM-dd'),
    disposal_amount: '',
    disposal_reason: 'Sold'
  });
  const [isDisposing, setIsDisposing] = useState(false);

  const fetchDetails = async () => {
    setIsLoading(true);
    try {
      const res = await getAssetFullDetails(assetId);
      if (res.success) setAsset(res.data);
    } catch {
      toast.error('Failed to load asset details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetId]);

  const handleDispose = async () => {
    if (!disposalData.disposal_amount || Number(disposalData.disposal_amount) < 0) {
      return toast.error('Please enter a valid sale amount');
    }
    
    setIsDisposing(true);
    try {
      const res = await disposeAsset(assetId, {
        ...disposalData,
        disposal_amount: Number(disposalData.disposal_amount)
      });
      if (res.success) {
        toast.success('Asset marked as disposed');
        setShowDisposeModal(false);
        fetchDetails();
        onUpdate?.();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to dispose asset');
    } finally {
      setIsDisposing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md">
        <div className="bg-white p-8 rounded-none shadow-2xl flex items-center gap-4 border border-slate-200">
          <RefreshCw className="animate-spin text-blue-600" size={24} />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest animate-pulse">Syncing Entity Matrix...</span>
        </div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md">
        <div className="bg-white p-8 rounded-none shadow-2xl text-center max-w-xs space-y-4 border border-slate-200">
           <AlertCircle size={40} className="mx-auto text-red-500" />
           <p className="text-xs font-bold text-slate-900 uppercase tracking-widest">Protocol Record Not Found</p>
           <button onClick={onClose} className="w-full py-3 bg-slate-900 text-white rounded-none font-bold text-[10px] uppercase tracking-widest">Dismiss</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-2xl rounded-none shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200"
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
           <div>
              <div className="flex items-center gap-3">
                 <h2 className="text-lg font-bold text-slate-900 tracking-tight uppercase">{asset.name}</h2>
                 {asset.is_disposed && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[9px] font-bold uppercase rounded-none border border-red-200 tracking-wider">
                       Disposed
                    </span>
                 )}
              </div>
              <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-widest">AST-{assetId.toString().padStart(4, '0')} • {asset.category}</p>
           </div>
           <div className="flex items-center gap-2">
              <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-none text-slate-400 transition-colors border border-transparent hover:border-slate-100 active:scale-90">
                 <X size={20} />
              </button>
           </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-100 px-8 bg-slate-50/30 shrink-0 overflow-x-auto no-scrollbar">
           {[
             { id: 'info', label: 'Overview' },
             { id: 'maintenance', label: 'Service Timeline' },
             { id: 'movements', label: 'Logistics' },
             { id: 'financials', label: 'Fiscal' }
           ].map(tab => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id as any)}
               className={clsx(
                 "px-4 py-3 text-[10px] font-bold uppercase tracking-[0.2em] border-b-2 transition-all whitespace-nowrap",
                 activeTab === tab.id ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-600"
               )}
             >
               {tab.label}
             </button>
           ))}
        </div>

        {/* Body Content */}
        <div className="p-8 overflow-y-auto bg-white flex-1 custom-scrollbar">
           <AnimatePresence mode="wait">
              {activeTab === 'info' && (
                 <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-10 pb-4">
                    {/* Section: Core Identity */}
                    <div className="space-y-4">
                       <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] pl-1 leading-none border-l-2 border-blue-600">Identity & Status</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <InfoRow label="Installation Date" value={asset.installation_date ? format(new Date(asset.installation_date), 'MMM dd, yyyy') : 'N/A'} icon={<Calendar size={18} />} />
                           <InfoRow label="Warranty Protocol" value={asset.warranty_expiry ? format(new Date(asset.warranty_expiry), 'MMM dd, yyyy') : 'N/A'} icon={<ShieldCheck size={18} />} />
                           <InfoRow label="Last Inspection" value={asset.last_service_date ? format(new Date(asset.last_service_date), 'MMM dd, yyyy') : 'NO DATA'} icon={<Wrench size={18} />} />
                           <InfoRow label="Scheduled Service" value={asset.next_service_date ? format(new Date(asset.next_service_date), 'MMM dd, yyyy') : 'NONE'} icon={<Clock size={18} />} />
                        </div>
                    </div>

                     {/* Section: Reservation Rules */}
                     {(asset.is_bookable) && (
                        <div className="space-y-4">
                           <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] pl-1 leading-none border-l-2 border-emerald-500">Booking Policy</h4>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <InfoRow label="Approval Logic" value={asset.approval_required ? 'MANDATORY ADMIN REVIEW' : 'AUTO-MANIFEST'} icon={<ShieldCheck size={18} className={asset.approval_required ? "text-blue-500" : "text-slate-400"} />} />
                              <InfoRow label="Pricing Strategy" value={asset.pricing_model !== 'free' ? `PAID (₹${asset.price})` : 'COMPLIMENTARY'} icon={<DollarSign size={18} />} />
                              <InfoRow label="Operational Window" value={asset.max_booking_hours ? `${asset.max_booking_hours} HOURS` : 'UNLIMITED'} icon={<Timer size={18} />} />
                              <InfoRow label="Reserve Deposit" value={Number(asset.security_deposit || 0) > 0 ? `₹${asset.security_deposit}` : 'NONE'} icon={<Shield size={18} />} />
                           </div>
                        </div>
                     )}

                     {/* Section: Location */}
                    <div className="space-y-4">
                       <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] pl-1 leading-none border-l-2 border-amber-500">Station Logistics</h4>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <InfoRow label="Tactical Zone" value={asset.block_wing} icon={<MapPin size={18} />} />
                          <InfoRow label="Pinpoint Coordinates" value={asset.exact_location} icon={<Boxes size={18} />} />
                       </div>
                    </div>

                    {/* Description */}
                    {asset.description && (
                       <div className="space-y-4">
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] pl-1 leading-none border-l-2 border-slate-900">Entity Directive</h4>
                          <div className="p-5 bg-slate-50 border border-slate-100 rounded-none text-xs text-slate-600 leading-relaxed font-bold uppercase">
                             {asset.description}
                          </div>
                       </div>
                    )}
                 </motion.div>
              )}

              {activeTab === 'maintenance' && (
                 <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-4">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] pl-1 leading-none">Service Records</h4>
                    {asset.maintenance_history && asset.maintenance_history.length > 0 ? (
                       <div className="space-y-3">
                          {asset.maintenance_history.map((log, idx) => (
                             <div key={idx} className="p-4 bg-white border border-slate-100 rounded-none flex items-center justify-between group hover:border-blue-100 hover:shadow-md transition-all">
                                <div className="flex items-center gap-4">
                                   <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-none flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                      <Wrench size={18} />
                                   </div>
                                   <div className="flex-1">
                                      <p className="text-sm font-bold text-slate-900 uppercase tracking-tight">{log.service_type || 'General Maintenance'}</p>
                                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{format(new Date(log.service_date), 'MMM dd, yyyy')} • {log.vendor || 'CENTRAL TEAM'}</p>
                                   </div>
                                </div>
                                <div className="text-right">
                                   <p className="text-sm font-bold text-slate-900 tabular-nums">₹{Number(log.cost || 0).toLocaleString()}</p>
                                   <p className="text-[9px] text-emerald-600 font-black uppercase tracking-widest">Processed</p>
                                </div>
                             </div>
                          ))}
                       </div>
                    ) : (
                       <div className="py-20 text-center bg-slate-50 border border-dashed border-slate-200 rounded-none">
                          <Calendar size={32} className="mx-auto text-slate-200 mb-3" />
                          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No service protocols logged</p>
                       </div>
                    )}
                 </motion.div>
              )}

              {activeTab === 'movements' && (
                 <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-4">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] pl-1 leading-none">Resource Logistics</h4>
                    {asset.movement_history && asset.movement_history.length > 0 ? (
                       <div className="space-y-3">
                          {asset.movement_history.map((m, idx) => (
                             <div key={idx} className="p-4 bg-white border border-slate-100 rounded-none flex items-center justify-between group hover:border-blue-100 hover:shadow-md transition-all">
                                <div className="flex items-center gap-4">
                                   <div className={clsx("w-10 h-10 rounded-none flex items-center justify-center transition-all border", m.status === 'out' ? 'bg-amber-50 text-amber-600 border-amber-100 group-hover:bg-amber-500 group-hover:text-white' : 'bg-emerald-50 text-emerald-600 border-emerald-100 group-hover:bg-emerald-500 group-hover:text-white')}>
                                      {m.status === 'out' ? <Clock size={18} /> : <CheckCircle2 size={18} />}
                                   </div>
                                   <div>
                                      <p className="text-sm font-bold text-slate-900 uppercase tracking-tight">{m.status === 'out' ? `Deployed: ${m.to_location}` : 'Returned To Base'}</p>
                                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{format(new Date(m.checkout_time), 'MMM dd, hh:mm a')} • {m.user_name || 'STAFF'}</p>
                                   </div>
                                </div>
                                <div className="text-right">
                                   <span className={clsx("text-[9px] font-black uppercase px-2 py-0.5 rounded-none border", m.status === 'out' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100')}>
                                      {m.status === 'out' ? 'ACTIVE FIELD' : 'STORAGE'}
                                   </span>
                                </div>
                             </div>
                          ))}
                       </div>
                    ) : (
                       <div className="py-20 text-center bg-slate-50 border border-dashed border-slate-200 rounded-none">
                          <HistoryIcon size={32} className="mx-auto text-slate-200 mb-3" />
                          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No logistics telemetry</p>
                       </div>
                    )}
                 </motion.div>
              )}

              {activeTab === 'financials' && (
                 <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-10 pb-4">
                    {/* Financial Overview Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="bg-slate-900 p-6 rounded-none text-white shadow-xl space-y-4">
                          <div className="flex justify-between items-start">
                             <DollarSign size={20} className="text-blue-400" />
                             <span className="text-[9px] font-black uppercase tracking-[0.2em] bg-white/10 px-2 py-0.5 rounded-none border border-white/10">Entity Asset</span>
                          </div>
                          <div>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 mb-1.5 leading-none">Gross Acquisition</p>
                             <p className="text-2xl font-bold tracking-tight leading-none">₹{Number(asset.purchase_cost || 0).toLocaleString()}</p>
                          </div>
                       </div>
                       <div className="bg-white p-6 rounded-none border border-slate-200 shadow-sm space-y-4">
                          <div className="flex justify-between items-start">
                             <TrendingDown size={20} className="text-amber-500" />
                             <span className="text-[9px] font-black uppercase tracking-[0.2em] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-none border border-amber-100">SLM Protocol</span>
                          </div>
                          <div>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 mb-1.5 leading-none">Current Net Book Value</p>
                             <p className="text-2xl font-bold text-slate-900 tracking-tight leading-none">
                                {(() => {
                                   const cost = Number(asset.purchase_cost || 0);
                                   const scrap = Number(asset.scrap_value || 0);
                                   const life = Number(asset.useful_life_years || 10);
                                   const pDate = asset.purchase_date ? new Date(asset.purchase_date) : new Date();
                                   const yearsPassed = (new Date().getFullYear() - pDate.getFullYear());
                                   const annualDep = (cost - scrap) / life;
                                   const totalDep = Math.min(cost - scrap, Math.max(0, annualDep * yearsPassed));
                                   return `₹${(cost - totalDep).toLocaleString()}`;
                                })()}
                             </p>
                          </div>
                       </div>
                    </div>

                    {/* Acquisition & Life Meta */}
                    <div className="space-y-4">
                       <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] pl-1 leading-none">Valuation Parameters</h4>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <InfoRow label="Useful Life Expectancy" value={`${asset.useful_life_years || 10} YEARS`} icon={<Clock size={18} />} />
                          <InfoRow label="Liquidation Scrap Value" value={`₹${Number(asset.scrap_value || 0).toLocaleString()}`} icon={<Calculator size={18} />} />
                          <InfoRow label="Purchase Timeline" value={asset.purchase_date ? format(new Date(asset.purchase_date), 'MMM dd, yyyy') : 'N/A'} icon={<Calendar size={18} />} />
                          <InfoRow label="Verification Status" value={asset.invoice_url ? 'E-INVOICE VALIDATED' : 'ANALOG RECORD ONLY'} icon={<FileText size={18} />} />
                       </div>
                    </div>

                    {/* Disposal Action Center */}
                    {!asset.is_disposed ? (
                       <div className="p-6 bg-red-50 border border-red-100 rounded-none space-y-4">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 bg-red-100 text-red-600 rounded-none border border-red-200 flex items-center justify-center">
                                <Trash2 size={24} />
                             </div>
                             <div>
                                <h4 className="text-sm font-bold text-red-900 uppercase tracking-tight">Liquidation Interface</h4>
                                <p className="text-[10px] text-red-700/70 font-bold uppercase tracking-widest mt-1">Initialize decommission sequence</p>
                             </div>
                          </div>
                          <p className="text-[11px] text-red-600 leading-relaxed font-bold uppercase italic opacity-80">Marking this asset as sold will terminate all future operations and move the record to the audit vault.</p>
                          <button 
                             onClick={() => setShowDisposeModal(true)}
                             className="w-full py-4 bg-red-600 text-white rounded-none font-bold text-[10px] uppercase tracking-widest hover:bg-red-700 shadow-xl shadow-red-200/50 transition-all active:scale-95"
                          >
                             Initialize Decommissioning
                          </button>
                       </div>
                    ) : (
                       <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-none space-y-5">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 bg-emerald-600 text-white rounded-none flex items-center justify-center shadow-lg">
                                <CheckCircle2 size={24} />
                             </div>
                             <div>
                                <h4 className="text-sm font-bold text-emerald-900 uppercase tracking-tight">Protocol Finalized</h4>
                                <p className="text-[10px] text-emerald-700/70 font-bold uppercase tracking-widest mt-1">Asset successfully decommissioned</p>
                             </div>
                          </div>
                          <div className="grid grid-cols-2 gap-6 bg-white/50 p-4 border border-emerald-100">
                             <div className="space-y-1">
                                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest leading-none">Net Proceeds</p>
                                <p className="text-xl font-bold text-emerald-900 tabular-nums">₹{Number(asset.disposal_amount || 0).toLocaleString()}</p>
                             </div>
                             <div className="space-y-1">
                                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest leading-none">Disposal Reason</p>
                                <p className="text-sm font-bold text-emerald-900 uppercase">{asset.disposal_reason}</p>
                             </div>
                          </div>
                       </div>
                    )}
                 </motion.div>
              )}
           </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-4 shrink-0">
           <button
              onClick={onClose}
              className="px-6 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors"
           >
              Dismiss
           </button>
           {!asset.is_disposed && onEdit && (
              <button
                 onClick={() => {
                    onEdit();
                    onClose();
                 }}
                 className="px-6 py-3 bg-slate-900 text-white rounded-none text-[10px] font-bold uppercase tracking-widest shadow-lg hover:bg-blue-600 transition-all active:scale-95 flex items-center gap-2"
              >
                 <Edit2 size={14} />
                 <span>Refactor Record</span>
              </button>
           )}
        </div>

        {/* Disposal Confirmation Modal (Nested) */}
        <AnimatePresence>
          {showDisposeModal && (
             <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white w-full max-w-sm rounded-none p-10 shadow-2xl border border-slate-200"
                >
                   <div className="text-center space-y-8">
                      <div className="w-16 h-16 bg-red-50 text-red-600 rounded-none border border-red-100 flex items-center justify-center mx-auto shadow-inner">
                         <AlertCircle size={32} />
                      </div>
                      <div>
                         <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Final Confirmation</h3>
                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">This action is permanent and irreversible.</p>
                      </div>

                      <div className="space-y-6 text-left">
                         <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Liquidation Date</label>
                            <input 
                               type="date" 
                               value={disposalData.disposal_date}
                               onChange={(e) => setDisposalData({...disposalData, disposal_date: e.target.value})}
                               className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-none text-xs font-bold focus:bg-white focus:ring-1 focus:ring-blue-100 transition-all outline-none" 
                            />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Final Sale Amount (₹)</label>
                            <input 
                               type="number" 
                               placeholder="0.00"
                               value={disposalData.disposal_amount}
                               onChange={(e) => setDisposalData({...disposalData, disposal_amount: e.target.value})}
                               className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-none text-xs font-bold focus:bg-white focus:ring-1 focus:ring-blue-100 transition-all outline-none" 
                            />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Liquidation Channel</label>
                            <select 
                               value={disposalData.disposal_reason}
                               onChange={(e) => setDisposalData({...disposalData, disposal_reason: e.target.value})}
                               className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-none text-xs font-bold focus:bg-white outline-none uppercase"
                            >
                               <option value="Sold">Direct Sale</option>
                               <option value="Scrap">Liquidation / Scrap</option>
                               <option value="Damage">Irreparable Damage</option>
                               <option value="Donation">Charity Donation</option>
                            </select>
                         </div>
                      </div>

                      <div className="flex flex-col gap-3 pt-6 border-t border-slate-100">
                         <button
                            onClick={handleDispose}
                            disabled={isDisposing}
                            className="w-full py-4 bg-red-600 text-white rounded-none font-bold text-[10px] uppercase tracking-widest shadow-xl shadow-red-200/50 hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                         >
                            {isDisposing ? <Loader2 size={16} className="animate-spin" /> : 'Confirm Decommission'}
                         </button>
                         <button
                            onClick={() => setShowDisposeModal(false)}
                            className="w-full py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors"
                         >
                            Cancel
                         </button>
                      </div>
                   </div>
                </motion.div>
             </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
