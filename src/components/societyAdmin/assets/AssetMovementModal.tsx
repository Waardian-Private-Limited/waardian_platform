'use client';

import React, { useState, useEffect } from 'react';
import { X, Truck, MapPin, ClipboardList, Calendar, Save, Loader2, Package } from 'lucide-react';
import { getAllAssets, coordinateMovement, getPropertyWings, getPropertyFloors, getPropertyFlats, Asset } from '@/lib/apiClient';
import { toast } from 'react-hot-toast';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

interface AssetMovementModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AssetMovementModal({ onClose, onSuccess }: AssetMovementModalProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [wings, setWings] = useState<any[]>([]);
  const [floors, setFloors] = useState<any[]>([]);
  const [flats, setFlats] = useState<any[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  
  const [formData, setFormData] = useState({
    asset_id: '',
    to_block: '',
    to_floor: '',
    to_location: '',
    reason: '',
    movement_type: 'permanent',
    expected_return_time: '',
    assigned_to: ''
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [assetRes, wingRes] = await Promise.all([
          getAllAssets(),
          getPropertyWings()
        ]);
        if (assetRes.success) setAssets(assetRes.data || []);
        if (wingRes.success) setWings(wingRes.data || []);
      } catch {
        toast.error('Failed to load registry data');
      }
    };
    fetchInitialData();
  }, []);

  const handleAssetChange = (id: string) => {
    const asset = assets.find(a => a.id.toString() === id);
    setSelectedAsset(asset || null);
    setFormData(p => ({ ...p, asset_id: id }));
  };

  const handleWingChange = async (wingId: string) => {
    const wing = wings.find(w => w.wing_id.toString() === wingId);
    setFormData(p => ({ ...p, to_block: wing?.wing_name || '', to_floor: '', to_location: '' }));
    setFloors([]);
    setFlats([]);
    
    if (!wingId) return;
    try {
      const res = await getPropertyFloors(Number(wingId));
      if (res.success) setFloors(res.data || []);
    } catch {
      toast.error('Failed to load floors');
    }
  };

  const handleFloorChange = async (floorId: string) => {
    const floor = floors.find(f => f.floor_id.toString() === floorId);
    setFormData(p => ({ ...p, to_floor: floor?.floor_number?.toString() || '', to_location: '' }));
    setFlats([]);
    
    if (!floorId || !formData.to_block) return;
    const wing = wings.find(w => w.wing_name === formData.to_block);
    try {
      const res = await getPropertyFlats(wing.wing_id, Number(floorId));
      if (res.success) setFlats(res.data || []);
    } catch {
      toast.error('Failed to load flats');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.asset_id || !formData.to_location) {
      toast.error('Required fields are missing.');
      return;
    }

    if (selectedAsset?.status === 'in_transit') {
      toast.error('Asset currently in transit.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await coordinateMovement(formData);
      if (res.success) {
        toast.success('Movement successfully coordinated.');
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      toast.error(err.message || 'Transmission failure');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-2xl rounded-none shadow-2xl overflow-hidden border border-slate-200 flex flex-col"
      >
        {/* Header Section */}
        <div className="p-8 bg-slate-900 text-white flex justify-between items-center relative overflow-hidden">
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-white/10 rounded-none flex items-center justify-center backdrop-blur-md border border-white/20">
              <Truck size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight uppercase leading-none">Asset Movement</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Coordination Control</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-none transition-all border border-white/10 active:scale-90 relative z-10">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
          {/* Asset Section */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Primary Asset Information</h3>
            <div className="relative">
              <Package size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <select 
                required
                value={formData.asset_id}
                onChange={(e) => handleAssetChange(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-none text-xs font-bold text-slate-900 focus:bg-white transition-all outline-none uppercase h-12"
              >
                <option value="">Select Asset...</option>
                {assets.map(a => (
                  <option key={a.id} value={a.id}>{a.name.toUpperCase()} (CURRENT: {(a.location || 'DEPOT').toUpperCase()})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Logic Section */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Movement Protocol</label>
              <div className="flex bg-slate-50 p-1 rounded-none border border-slate-200">
                <button 
                  type="button"
                  onClick={() => setFormData(p => ({ ...p, movement_type: 'permanent' }))}
                  className={clsx(
                    "flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-none transition-all",
                    formData.movement_type === 'permanent' ? "bg-slate-900 text-white shadow-sm" : "text-slate-400 hover:text-slate-900"
                  )}
                >
                  Permanent
                </button>
                <button 
                  type="button"
                  onClick={() => setFormData(p => ({ ...p, movement_type: 'temporary' }))}
                  className={clsx(
                    "flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-none transition-all",
                    formData.movement_type === 'temporary' ? "bg-slate-900 text-white shadow-sm" : "text-slate-400 hover:text-slate-900"
                  )}
                >
                  Temporary
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Assigned Personnel</label>
              <input 
                value={formData.assigned_to}
                onChange={e => setFormData(p => ({ ...p, assigned_to: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-none text-xs font-bold text-slate-900 focus:bg-white transition-all outline-none uppercase h-12"
                placeholder="STAFF ID OR NAME"
              />
            </div>
          </div>

          {/* Deployment Matrix */}
          <div className="p-8 bg-slate-50 border border-slate-100 rounded-none space-y-8">
            <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2 border-b border-slate-200 pb-4">
              <MapPin size={16} className="text-blue-600" /> Destination Logic
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Sector / Wing</label>
                <select 
                  onChange={(e) => handleWingChange(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-none text-xs font-bold text-slate-900 outline-none uppercase h-12"
                >
                  <option value="">Select Wing...</option>
                  {wings.map(w => <option key={w.wing_id} value={w.wing_id}>{w.wing_name.toUpperCase()}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Level / Floor</label>
                <select 
                  onChange={(e) => handleFloorChange(e.target.value)}
                  disabled={!floors.length}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-none text-xs font-bold text-slate-900 outline-none disabled:bg-slate-50 disabled:text-slate-300 uppercase h-12"
                >
                  <option value="">Select Floor...</option>
                  {floors.map(f => <option key={f.floor_id} value={f.floor_id}>{(f.floor_name || `LEVEL ${f.floor_number}`).toUpperCase()}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Exact Coordinate / Unit</label>
              <div className="space-y-3">
                <select 
                  value={formData.to_location}
                  onChange={e => setFormData(p => ({ ...p, to_location: e.target.value }))}
                  disabled={!flats.length}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-none text-xs font-bold text-slate-900 outline-none disabled:bg-slate-50 disabled:text-slate-300 uppercase h-12"
                >
                  <option value="">Select Point...</option>
                  {flats.map(f => <option key={f.flat_id} value={f.flat_number}>{f.flat_number}</option>)}
                </select>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1 opacity-70 italic">Manual override: If destination is not a unit, enter below.</p>
                <input 
                  value={formData.to_location}
                  onChange={e => setFormData(p => ({ ...p, to_location: e.target.value }))}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-none text-xs font-bold text-slate-900 outline-none uppercase h-12"
                  placeholder="CUSTOM POINT (E.G. GARDEN HUB, MAIN GATE)"
                />
              </div>
            </div>
          </div>

          <AnimatePresence>
            {formData.movement_type === 'temporary' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 overflow-hidden"
              >
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Expected Operational Return</label>
                <div className="relative">
                  <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="datetime-local"
                    value={formData.expected_return_time}
                    onChange={e => setFormData(p => ({ ...p, expected_return_time: e.target.value }))}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-none text-xs font-bold text-slate-900 focus:bg-white transition-all outline-none h-12"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Movement Directive / Remarks</label>
            <div className="relative">
              <ClipboardList size={14} className="absolute left-4 top-5 text-slate-400" />
              <textarea 
                rows={3}
                value={formData.reason}
                onChange={e => setFormData(p => ({ ...p, reason: e.target.value }))}
                className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-none text-xs font-bold text-slate-900 focus:bg-white transition-all outline-none resize-none uppercase"
                placeholder="DOCUMENT REASON FOR TRANSIT..."
              />
            </div>
          </div>
        </form>

        <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-4">
          <button 
            type="button"
            onClick={onClose}
            className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all"
          >
            Abort Protocol
          </button>
          <button 
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="min-w-[180px] flex items-center justify-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-none text-[10px] font-bold uppercase tracking-widest shadow-lg hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <><Save size={14} /> Execute Movement</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
