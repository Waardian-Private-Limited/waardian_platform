'use client';

import React, { useState, useEffect } from 'react';
import { X, Settings, Save, Loader2, Calendar, User, ClipboardList, Target } from 'lucide-react';
import { getAllAssets, getVendorsList, scheduleMaintenance } from '@/lib/apiClient';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

interface MaintenanceScheduleModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function MaintenanceScheduleModal({ onClose, onSuccess }: MaintenanceScheduleModalProps) {
  const [assets, setAssets] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    asset_id: '',
    maintenance_type: 'routine',
    scheduled_date: '',
    remarks: '',
    vendor_id: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [assetRes, vendorRes] = await Promise.all([
          getAllAssets(),
          getVendorsList()
        ]);
        if (assetRes.success) setAssets(assetRes.data || []);
        if (vendorRes.success) setVendors(vendorRes.data || []);
      } catch {
        toast.error('Failed to load assets/vendors');
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.asset_id || !formData.scheduled_date) {
      toast.error('Please fill required fields');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const res = await scheduleMaintenance(formData);
      if (res.success) {
        toast.success('Maintenance task scheduled');
        onSuccess();
        onClose();
      }
    } catch {
      toast.error('Failed to schedule task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-xl rounded-none shadow-2xl overflow-hidden border border-slate-200"
      >
        <div className="p-8 bg-slate-900 text-white flex justify-between items-center relative overflow-hidden">
           <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 bg-white/10 rounded-none flex items-center justify-center backdrop-blur-md border border-white/20">
                 <Settings size={24} />
              </div>
              <div>
                 <h2 className="text-xl font-bold tracking-tight uppercase leading-none">Schedule Service</h2>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Registry Alignment</p>
              </div>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-none transition-all border border-white/10 active:scale-90 relative z-10">
              <X size={20} />
           </button>
           <Settings size={120} className="absolute -right-10 -bottom-10 opacity-5 rotate-12" />
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-10">
           <div className="space-y-10">
              <div className="space-y-2">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Target Asset *</label>
                 <div className="relative">
                    <Target size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select 
                      required
                      value={formData.asset_id}
                      onChange={e => setFormData(p => ({...p, asset_id: e.target.value}))}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-none text-xs font-bold text-slate-900 focus:bg-white transition-all outline-none uppercase h-12"
                    >
                       <option value="">Select Asset...</option>
                       {assets.map(a => (
                         <option key={a.id} value={a.id}>{a.name.toUpperCase()} (AST-{a.id.toString().padStart(4, '0')})</option>
                       ))}
                    </select>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Service Protocol</label>
                    <select 
                      value={formData.maintenance_type}
                      onChange={e => setFormData(p => ({...p, maintenance_type: e.target.value}))}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-none text-xs font-bold text-slate-900 focus:bg-white transition-all outline-none uppercase h-12"
                    >
                       <option value="routine">Routine Check</option>
                       <option value="repair">Breakdown Repair</option>
                       <option value="amc">AMC Service</option>
                       <option value="certification">Certification</option>
                    </select>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Execution Date *</label>
                    <div className="relative">
                       <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                       <input 
                         required
                         type="date"
                         value={formData.scheduled_date}
                         onChange={e => setFormData(p => ({...p, scheduled_date: e.target.value}))}
                         className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-none text-xs font-bold text-slate-900 focus:bg-white transition-all outline-none h-12"
                       />
                    </div>
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Primary Vendor Partner</label>
                 <div className="relative">
                    <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select 
                      value={formData.vendor_id}
                      onChange={e => setFormData(p => ({...p, vendor_id: e.target.value}))}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-none text-xs font-bold text-slate-900 focus:bg-white transition-all outline-none uppercase h-12"
                    >
                       <option value="">Select Partner...</option>
                       {vendors.map(v => <option key={v.id} value={v.id}>{v.business_name.toUpperCase()}</option>)}
                    </select>
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Operational Remarks</label>
                 <div className="relative">
                    <ClipboardList size={14} className="absolute left-4 top-5 text-slate-400" />
                    <textarea 
                      rows={3}
                      value={formData.remarks}
                      onChange={e => setFormData(p => ({...p, remarks: e.target.value}))}
                      className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-none text-xs font-bold text-slate-900 focus:bg-white transition-all outline-none resize-none uppercase"
                      placeholder="ENTER SERVICE DIRECTIVES..."
                    />
                 </div>
              </div>
           </div>

           <div className="pt-6 border-t border-slate-100 flex justify-end gap-4">
              <button type="button" onClick={onClose} className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all">Abort Protocol</button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="min-w-[180px] flex items-center justify-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-none text-[10px] font-bold uppercase tracking-widest shadow-lg hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50"
              >
                 {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <><Save size={14} /> Schedule Task</>}
              </button>
           </div>
        </form>
      </motion.div>
    </div>
  );
}
