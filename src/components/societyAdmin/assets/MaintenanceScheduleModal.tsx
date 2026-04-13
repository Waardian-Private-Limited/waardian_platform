'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, Settings, User, AlertCircle, Save, Loader2 } from 'lucide-react';
import { getAllAssets, getVendorsList, scheduleMaintenance } from '@/lib/apiClient';
import { toast } from 'react-hot-toast';

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
      } catch (err) {
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
      }
    } catch (err) {
      toast.error('Failed to schedule task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
        <div className="p-6 bg-purple-700 text-white flex justify-between items-center">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-xl">
                 <Settings size={20} />
              </div>
              <h2 className="text-xl font-black tracking-tight uppercase">Schedule Service Task</h2>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
              <X size={20} />
           </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
           <div className="space-y-4">
              <div>
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 mb-1 block">Target Asset *</label>
                 <select 
                   required
                   value={formData.asset_id}
                   onChange={e => setFormData(p => ({...p, asset_id: e.target.value}))}
                   className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 transition-all font-bold text-sm"
                 >
                    <option value="">Select Asset from Registry</option>
                    {assets.map(a => (
                      <option key={a.id} value={a.id}>{a.name} (AST-{a.id.toString().padStart(4, '0')})</option>
                    ))}
                 </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 mb-1 block">Service Type</label>
                    <select 
                      value={formData.maintenance_type}
                      onChange={e => setFormData(p => ({...p, maintenance_type: e.target.value}))}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 transition-all font-bold text-sm"
                    >
                       <option value="routine">Routine Check</option>
                       <option value="repair">Breakdown Repair</option>
                       <option value="preventive">Preventive</option>
                       <option value="inspection">Safety Audit</option>
                    </select>
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 mb-1 block">Scheduled Date *</label>
                    <input 
                      type="date" 
                      required
                      value={formData.scheduled_date}
                      onChange={e => setFormData(p => ({...p, scheduled_date: e.target.value}))}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 transition-all font-bold text-sm" 
                    />
                 </div>
              </div>

              <div>
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 mb-1 block">Service Partner / Vendor</label>
                 <select 
                   value={formData.vendor_id}
                   onChange={e => setFormData(p => ({...p, vendor_id: e.target.value}))}
                   className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 transition-all font-bold text-sm"
                 >
                    <option value="">Choose Registry Partner</option>
                    {vendors.map(v => (
                      <option key={v.id} value={v.id}>{v.name} ({v.category})</option>
                    ))}
                 </select>
              </div>

              <div>
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 mb-1 block">Brief Remarks / Scope</label>
                 <textarea 
                   rows={3}
                   value={formData.remarks}
                   onChange={e => setFormData(p => ({...p, remarks: e.target.value}))}
                   placeholder="Describe what needs to be checked or repaired..."
                   className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 transition-all font-bold text-sm resize-none"
                 />
              </div>
           </div>

           <div className="flex gap-4 pt-4">
              <button type="button" onClick={onClose} className="flex-1 py-3 text-sm font-black uppercase text-gray-400 hover:text-gray-600 transition-all">Cancel</button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="flex-1 py-3 bg-purple-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-purple-100 flex items-center justify-center gap-2 hover:bg-purple-800 transition-all active:scale-95 disabled:bg-gray-400"
              >
                 {isSubmitting ? <Loader2 className="animate-spin w-4 h-4" /> : <Save size={16} />}
                 Schedule Task
              </button>
           </div>
        </form>
      </div>
    </div>
  );
}
