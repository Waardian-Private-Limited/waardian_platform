'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, Package, MapPin, Calendar, Wrench, History as HistoryIcon, 
  CheckCircle2, Clock, AlertCircle, Info, Boxes, 
  Timer, ShieldCheck, Loader2, Activity, Edit2, User, DollarSign, Trash2, Shield, Calculator, FileText, Download, TrendingDown
} from 'lucide-react';
import { getAssetFullDetails, disposeAsset } from '@/lib/apiClient';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import clsx from 'clsx';

interface AssetDetailsModalProps {
  assetId: number;
  onClose: () => void;
  onEdit?: () => void;
  onUpdate?: () => void;
}

const InfoRow = ({ label, value, icon, fullWidth }: any) => (
  <div className={clsx("p-4 bg-gray-50 border border-gray-100 rounded-lg flex items-center gap-4 group hover:bg-white hover:shadow-sm transition-all", fullWidth ? 'col-span-1 md:col-span-2' : 'col-span-1')}>
     <div className="w-10 h-10 bg-white rounded-md flex items-center justify-center text-blue-600 shadow-sm transition-transform group-hover:scale-110">
        {icon}
     </div>
     <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">{label}</p>
        <p className="text-sm font-bold text-gray-800 truncate">{value || 'Not Specified'}</p>
     </div>
  </div>
);

export default function AssetDetailsModal({ assetId, onClose, onEdit, onUpdate }: AssetDetailsModalProps) {
  const [asset, setAsset] = useState<any>(null);
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
    } catch (err) {
      toast.error('Failed to load asset details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
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
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white p-8 rounded-lg shadow-xl flex items-center gap-3">
          <Loader2 className="animate-spin text-blue-600" size={24} />
          <span className="font-medium text-gray-600">Loading details...</span>
        </div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-xs space-y-4">
           <AlertCircle size={40} className="mx-auto text-red-500" />
           <p className="font-bold text-gray-800">Record not found</p>
           <button onClick={onClose} className="w-full py-2 bg-gray-100 text-gray-600 rounded-md font-bold">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
           <div>
              <div className="flex items-center gap-2">
                 <h2 className="text-xl font-bold text-gray-800">{asset.name}</h2>
                 {asset.is_disposed && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-black uppercase rounded shadow-sm border border-red-200">
                       Disposed
                    </span>
                 )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5 font-bold uppercase tracking-tight">AST-{assetId.toString().padStart(4, '0')} • {asset.category}</p>
           </div>
           <div className="flex items-center gap-2">
              {asset.is_disposed && (
                 <div className="px-3 py-1.5 bg-gray-100 text-gray-500 rounded-lg text-[10px] font-bold uppercase tracking-wide border border-gray-200">
                    Sold on {format(new Date(asset.disposal_date), 'MMM dd, yyyy')}
                 </div>
              )}
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
                 <X size={20} />
              </button>
           </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-gray-100 px-6 bg-white shrink-0">
           <button
              onClick={() => setActiveTab('info')}
              className={clsx("px-4 py-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all", activeTab === 'info' ? "border-blue-600 text-blue-600" : "border-transparent text-gray-400 hover:text-gray-600")}
           >
              Overview
           </button>
           <button
              onClick={() => setActiveTab('maintenance')}
              className={clsx("px-4 py-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all", activeTab === 'maintenance' ? "border-blue-600 text-blue-600" : "border-transparent text-gray-400 hover:text-gray-600")}
           >
              Maintenance History
           </button>
           <button
              onClick={() => setActiveTab('movements')}
              className={clsx("px-4 py-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all", activeTab === 'movements' ? "border-blue-600 text-blue-600" : "border-transparent text-gray-400 hover:text-gray-600")}
           >
              Movements
           </button>
           <button
              onClick={() => setActiveTab('financials')}
              className={clsx("px-4 py-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all", activeTab === 'financials' ? "border-blue-600 text-blue-600" : "border-transparent text-gray-400 hover:text-gray-600")}
           >
              Financials
           </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto bg-white flex-1 animate-in fade-in duration-300">
           {activeTab === 'info' && (
              <div className="space-y-8 pb-10">
                 {/* Section: Core Identity */}
                 <div className="space-y-4">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1 leading-none">Identity & Status</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InfoRow label="Manufactured On" value={asset.installation_date ? format(new Date(asset.installation_date), 'MMM dd, yyyy') : 'N/A'} icon={<Calendar size={18} />} />
                        <InfoRow label="Warranty End" value={asset.warranty_expiry ? format(new Date(asset.warranty_expiry), 'MMM dd, yyyy') : 'N/A'} icon={<ShieldCheck size={18} />} />
                        <InfoRow label="Last Serviced" value={asset.last_service_date ? format(new Date(asset.last_service_date), 'MMM dd, yyyy') : 'Never'} icon={<Wrench size={18} />} />
                        <InfoRow label="Next Service" value={asset.next_service_date ? format(new Date(asset.next_service_date), 'MMM dd, yyyy') : 'Not Scheduled'} icon={<Clock size={18} />} />
                     </div>
                 </div>

                  {/* Section: Reservation Rules */}
                  {(asset.is_bookable) && (
                     <div className="space-y-4">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1 leading-none">Booking Policy</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <InfoRow label="Approval Workflow" value={asset.approval_required ? 'Mandatory Admin Review' : 'Auto-Confirmed'} icon={<ShieldCheck size={18} className={asset.approval_required ? "text-blue-500" : "text-gray-400"} />} />
                           <InfoRow label="Pricing Type" value={asset.pricing_model === 'paid' ? `Paid (₹${asset.price})` : 'Complimentary'} icon={<DollarSign size={18} />} />
                           <InfoRow label="Max Duration" value={`${asset.max_booking_hours || 4} Hours`} icon={<Timer size={18} />} />
                           <InfoRow label="Security Deposit" value={Number(asset.security_deposit || 0) > 0 ? `₹${asset.security_deposit}` : 'No Deposit'} icon={<Shield size={18} />} />
                        </div>
                     </div>
                  )}

                  {/* Section: Location */}
                 <div className="space-y-4">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1 leading-none">Station Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <InfoRow label="Zone / Wing" value={asset.block_wing} icon={<MapPin size={18} />} />
                       <InfoRow label="Exact Point" value={asset.exact_location} icon={<Boxes size={18} />} />
                    </div>
                 </div>

                 {/* Description */}
                 {asset.description && (
                    <div className="space-y-4">
                       <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1 leading-none">Asset Bio</h4>
                       <div className="p-4 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-600 leading-relaxed font-medium">
                          {asset.description}
                       </div>
                    </div>
                 )}
              </div>
           )}

           {activeTab === 'maintenance' && (
              <div className="space-y-4">
                 <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1 leading-none">Service Records</h4>
                 {asset.maintenance_history?.length > 0 ? (
                    <div className="space-y-3">
                       {asset.maintenance_history.map((log: any, idx: number) => (
                          <div key={idx} className="p-4 bg-white border border-gray-100 rounded-lg flex items-center justify-between group hover:border-blue-100 transition-all">
                             <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-gray-50 rounded-md flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                   <Wrench size={18} />
                                </div>
                                <div>
                                   <p className="text-sm font-bold text-gray-800">{log.service_type || 'General Maintenance'}</p>
                                   <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{format(new Date(log.service_date), 'MMM dd, yyyy')} • {log.vendor || 'Internal Team'}</p>
                                </div>
                             </div>
                             <div className="text-right">
                                <p className="text-sm font-bold text-gray-800">₹{Number(log.cost || 0).toLocaleString()}</p>
                                <p className="text-[9px] text-gray-400 font-bold uppercase">Settled</p>
                             </div>
                          </div>
                       ))}
                    </div>
                 ) : (
                    <div className="py-12 text-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
                       <Calendar size={32} className="mx-auto text-gray-300 mb-2" />
                       <p className="text-xs text-gray-400 font-bold uppercase">No service history found</p>
                    </div>
                 )}
              </div>
           )}

           {activeTab === 'movements' && (
              <div className="space-y-4">
                 <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1 leading-none">Asset Movements</h4>
                 {asset.movement_history?.length > 0 ? (
                    <div className="space-y-3">
                       {asset.movement_history.map((m: any, idx: number) => (
                          <div key={idx} className="p-4 bg-white border border-gray-100 rounded-lg flex items-center justify-between group hover:border-blue-100 transition-all">
                             <div className="flex items-center gap-4">
                                <div className={clsx("w-10 h-10 rounded-md flex items-center justify-center transition-all", m.status === 'out' ? 'bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white' : 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white')}>
                                   {m.status === 'out' ? <Clock size={18} /> : <CheckCircle2 size={18} />}
                                </div>
                                <div>
                                   <p className="text-sm font-bold text-gray-800">{m.status === 'out' ? `Deployed to ${m.to_location}` : 'Returned to Station'}</p>
                                   <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{format(new Date(m.checkout_time), 'MMM dd, hh:mm a')} • {m.user_name || 'Staff'}</p>
                                </div>
                             </div>
                             <div className="text-right">
                                <span className={clsx("text-[9px] font-black uppercase px-2 py-1 rounded-full", m.status === 'out' ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600')}>
                                   {m.status === 'out' ? 'IN-USE' : 'RETURNED'}
                                </span>
                             </div>
                          </div>
                       ))}
                    </div>
                 ) : (
                    <div className="py-12 text-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
                       <HistoryIcon size={32} className="mx-auto text-gray-300 mb-2" />
                       <p className="text-xs text-gray-400 font-bold uppercase">No movement logs recorded</p>
                    </div>
                 )}
              </div>
           )}

           {activeTab === 'financials' && (
              <div className="space-y-8 pb-10">
                 {/* Financial Overview Cards */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-600 p-5 rounded-xl text-white shadow-xl shadow-blue-100 space-y-3">
                       <div className="flex justify-between items-start">
                          <DollarSign size={24} className="text-blue-200" />
                          <span className="text-[9px] font-black uppercase tracking-[0.2em] bg-white/20 px-2 py-0.5 rounded">Asset Ledger</span>
                       </div>
                       <div>
                          <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest pl-1 mb-1 leading-none">Original Purchase Price</p>
                          <p className="text-2xl font-black tracking-tight leading-none">₹{Number(asset.purchase_cost || 0).toLocaleString()}</p>
                       </div>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-3">
                       <div className="flex justify-between items-start">
                          <TrendingDown size={24} className="text-orange-500" />
                          <span className="text-[9px] font-black uppercase tracking-[0.2em] bg-orange-50 text-orange-600 px-2 py-0.5 rounded border border-orange-100">SLM Valuation</span>
                       </div>
                       <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 mb-1 leading-none">Estimated Current Book Value</p>
                          <p className="text-2xl font-black text-gray-800 tracking-tight leading-none">
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
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1 leading-none">Valuation Metadata</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <InfoRow label="Estimated Useful Life" value={`${asset.useful_life_years || 10} Years`} icon={<Clock size={18} />} />
                       <InfoRow label="Scrap / Salvage Value" value={`₹${Number(asset.scrap_value || 0).toLocaleString()}`} icon={<Calculator size={18} />} />
                       <InfoRow label="Purchase Date" value={asset.purchase_date ? format(new Date(asset.purchase_date), 'MMM dd, yyyy') : 'N/A'} icon={<Calendar size={18} />} />
                       <InfoRow label="Invoice Path" value={asset.invoice_url ? 'E-Invoice Verified' : 'Paper Record Only'} icon={<FileText size={18} />} />
                    </div>
                 </div>

                 {/* Disposal Action Center */}
                 {!asset.is_disposed ? (
                    <div className="p-6 bg-red-50 border border-red-100 rounded-xl space-y-4">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-red-100 text-red-600 rounded-lg flex items-center justify-center">
                             <Trash2 size={24} />
                          </div>
                          <div>
                             <h4 className="font-black text-red-900 leading-tight">Liquidation Center</h4>
                             <p className="text-xs text-red-700/70 font-bold uppercase tracking-tight">Decommission this asset from society inventory</p>
                          </div>
                       </div>
                       <p className="text-xs text-red-600 leading-relaxed font-medium">Marking this asset as sold will automatically deactivate all future bookings and move the record to the <span className="font-bold">Liquidation Report</span> for financial auditing.</p>
                       <button 
                          onClick={() => setShowDisposeModal(true)}
                          className="w-full py-3 bg-red-600 text-white rounded-lg font-black text-xs uppercase tracking-widest hover:bg-red-700 shadow-lg shadow-red-200 transition-all active:scale-[0.98]"
                       >
                          Initialize Asset Disposal
                       </button>
                    </div>
                 ) : (
                    <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-xl space-y-4">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-emerald-600 text-white rounded-lg flex items-center justify-center shadow-lg">
                             <CheckCircle2 size={24} />
                          </div>
                          <div>
                             <h4 className="font-black text-emerald-900 leading-tight">Liquidation Finalized</h4>
                             <p className="text-xs text-emerald-700/70 font-bold uppercase tracking-tight">Asset has been officially decommissioned</p>
                          </div>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                             <p className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-widest leading-none">Sale Amount</p>
                             <p className="text-lg font-black text-emerald-900">₹{Number(asset.disposal_amount || 0).toLocaleString()}</p>
                          </div>
                          <div className="space-y-1">
                             <p className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-widest leading-none">Reason</p>
                             <p className="text-lg font-black text-emerald-900">{asset.disposal_reason}</p>
                          </div>
                       </div>
                    </div>
                 )}
              </div>
           )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 shrink-0">
           <button
              onClick={onClose}
              className="px-6 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors"
           >
              Dismiss
           </button>
           {!asset.is_disposed && onEdit && (
              <button
                 onClick={() => {
                    onEdit();
                    onClose();
                 }}
                 className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-md hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-2"
              >
                 <Edit2 size={14} />
                 <span>Edit Record</span>
              </button>
           )}
        </div>

        {/* Disposal Confirmation Modal (Nested) */}
        {showDisposeModal && (
           <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-sm rounded-xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                 <div className="text-center space-y-6">
                    <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                       <AlertCircle size={40} />
                    </div>
                    <div>
                       <h3 className="text-2xl font-black text-gray-900 leading-tight">Confirm Disposal</h3>
                       <p className="text-sm text-gray-400 font-medium mt-1">This action will permanently retire the asset.</p>
                    </div>

                    <div className="space-y-4 text-left">
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Sale Date</label>
                          <input 
                             type="date" 
                             value={disposalData.disposal_date}
                             onChange={(e) => setDisposalData({...disposalData, disposal_date: e.target.value})}
                             className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all outline-none" 
                          />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Liquidation Amount (₹)</label>
                          <input 
                             type="number" 
                             placeholder="0.00"
                             value={disposalData.disposal_amount}
                             onChange={(e) => setDisposalData({...disposalData, disposal_amount: e.target.value})}
                             className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all outline-none" 
                          />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Primary Reason</label>
                          <select 
                             value={disposalData.disposal_reason}
                             onChange={(e) => setDisposalData({...disposalData, disposal_reason: e.target.value})}
                             className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold focus:bg-white outline-none"
                          >
                             <option value="Sold">Direct Sale</option>
                             <option value="Scrap">Liquidation / Scrap</option>
                             <option value="Damage">Irreparable Damage</option>
                             <option value="Donation">Charity Donation</option>
                          </select>
                       </div>
                    </div>

                    <div className="flex flex-col gap-3 pt-4">
                       <button
                          onClick={() => setShowDisposeModal(false)}
                          className="w-full py-4 text-sm font-black text-gray-400 uppercase tracking-[0.2em] hover:text-gray-600 transition-colors"
                       >
                          Cancel
                       </button>
                       <button
                          onClick={handleDispose}
                          disabled={isDisposing}
                          className="flex-1 py-3.5 px-4 bg-red-600 text-white rounded-lg font-bold text-sm hover:bg-red-700 hover:shadow-lg hover:shadow-red-200 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                       >
                          {isDisposing ? <Loader2 size={18} className="animate-spin" /> : 'Confirm Disposal'}
                       </button>
                    </div>
                 </div>
              </div>
           </div>
        )}
      </div>
    </div>
  );
}
