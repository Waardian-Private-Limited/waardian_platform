'use client';

import React, { useState, useEffect } from 'react';
import { X, Truck, MapPin, ClipboardList, User, Calendar, Save, Loader2, AlertCircle, ChevronRight, Package, ArrowRight } from 'lucide-react';
import { getAllAssets, coordinateMovement, getPropertyWings, getPropertyFloors, getPropertyFlats } from '@/lib/apiClient';
import { toast } from 'react-hot-toast';
import clsx from 'clsx';

interface AssetMovementModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AssetMovementModal({ onClose, onSuccess }: AssetMovementModalProps) {
  const [assets, setAssets] = useState<any[]>([]);
  const [wings, setWings] = useState<any[]>([]);
  const [floors, setFloors] = useState<any[]>([]);
  const [flats, setFlats] = useState<any[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  
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
      } catch (err) {
        toast.error('Failed to load registry data');
      }
    };
    fetchInitialData();
  }, []);

  const handleAssetChange = (id: string) => {
    const asset = assets.find(a => a.id.toString() === id);
    setSelectedAsset(asset);
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
    } catch (err) {
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
    } catch (err) {
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
        toast.success(formData.movement_type === 'permanent' ? 'Relocation recorded' : 'Dispatch complete');
        onSuccess();
      }
    } catch (err: any) {
      toast.error(err.message || 'Coordinate failure');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-lg shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-500 border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-blue-600 text-white flex justify-between items-center shrink-0">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-lg">
                 <Truck size={20} />
              </div>
              <h2 className="text-xl font-bold tracking-tight uppercase leading-none">Initialize Asset Transfer</h2>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-all active:scale-90">
              <X size={20} />
           </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
           <form onSubmit={handleSubmit} className="space-y-8">
              {/* Asset Selection Segment */}
              <div className="space-y-4">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Registry Selection *</label>
                 <select 
                   required
                   value={formData.asset_id}
                   onChange={e => handleAssetChange(e.target.value)}
                   className={clsx(
                     "w-full px-4 py-3 bg-gray-50 border rounded-lg outline-none focus:ring-2 focus:ring-blue-100 transition-all font-bold text-sm h-12 uppercase tracking-tight",
                     selectedAsset?.status === 'in_transit' ? 'text-red-600 border-red-200' : 'border-gray-200 text-gray-900 group-hover:bg-white'
                   )}
                 >
                    <option value="">Search Assets in Database...</option>
                    {assets.map(a => (
                      <option key={a.id} value={a.id} disabled={a.status === 'in_transit'}>
                        ({a.status === 'in_transit' ? 'TRANSIT' : 'ACTIVE'}) {a.name} • AST-{a.id.toString().padStart(4, '0')}
                      </option>
                    ))}
                 </select>
                 
                 {selectedAsset && (
                    <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-lg flex items-center justify-between group">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
                             <Package size={18} />
                          </div>
                          <div>
                             <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Current Registered Source</p>
                             <p className="text-xs font-bold text-gray-900 uppercase">
                                {selectedAsset.block_wing || 'HUB'} | FLOOR {selectedAsset.floor || 'N/A'} | {selectedAsset.exact_location || 'DEFAULT'}
                             </p>
                          </div>
                       </div>
                    </div>
                 )}
              </div>

              {/* Destination Matrix */}
              <div className="space-y-6 pt-4 border-t border-gray-100">
                 <div className="flex items-center gap-3">
                    <MapPin size={16} className="text-blue-600" />
                    <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Destination Matrix</h4>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Target Wing *</label>
                       <select 
                         required
                         value={wings.find(w => w.wing_name === formData.to_block)?.wing_id || ''}
                         onChange={e => handleWingChange(e.target.value)}
                         className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 transition-all font-bold text-xs h-10 uppercase"
                       >
                          <option value="">Select Target Wing</option>
                          {wings.map(w => (
                            <option key={w.wing_id} value={w.wing_id}>{w.wing_name}</option>
                          ))}
                       </select>
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Target Floor</label>
                       <select 
                         value={floors.find(f => f.floor_number?.toString() === formData.to_floor)?.floor_id || ''}
                         onChange={e => handleFloorChange(e.target.value)}
                         disabled={!formData.to_block}
                         className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 transition-all font-bold text-xs h-10 uppercase disabled:opacity-30"
                       >
                          <option value="">Select Target Floor</option>
                          {floors.map(f => (
                            <option key={f.floor_id} value={f.floor_id}>Floor {f.floor_number}</option>
                          ))}
                       </select>
                    </div>
                    <div className="md:col-span-2 space-y-1.5">
                       <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Specific Location / Unit *</label>
                       <div className="flex gap-2">
                          <select 
                            value={flats.find(f => f.flat_number === formData.to_location)?.flat_id || ''}
                            onChange={e => {
                              const flat = flats.find(f => f.flat_id.toString() === e.target.value);
                              setFormData(p => ({ ...p, to_location: flat?.flat_number || '' }));
                            }}
                            disabled={!formData.to_floor}
                            className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 transition-all font-bold text-xs h-10 uppercase disabled:opacity-30"
                          >
                             <option value="">Select Unit</option>
                             {flats.map(f => (
                               <option key={f.flat_id} value={f.flat_id}>Flat {f.flat_number}</option>
                             ))}
                          </select>
                          <input 
                            placeholder="OR TYPE CUSTOM DESTINATION..."
                            value={formData.to_location}
                            onChange={e => setFormData(p => ({ ...p, to_location: e.target.value.toUpperCase() }))}
                            className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 transition-all font-bold text-xs h-10 uppercase placeholder:text-gray-300" 
                          />
                       </div>
                    </div>
                 </div>
              </div>

              {/* Transfer Parameters */}
              <div className="space-y-6 pt-4 border-t border-gray-100">
                 <div className="flex items-center gap-3">
                    <ClipboardList size={16} className="text-blue-600" />
                    <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Transfer Protocol</h4>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Movement Nature *</label>
                       <select 
                         required
                         value={formData.movement_type}
                         onChange={e => setFormData(p => ({ ...p, movement_type: e.target.value }))}
                         className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 transition-all font-bold text-xs h-10 uppercase"
                       >
                          <option value="permanent">Permanent Relocation</option>
                          <option value="temporary">Temporary Out-flow</option>
                       </select>
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Effective Date</label>
                       <div className="relative">
                         <input 
                           type="date"
                           required={formData.movement_type === 'temporary'}
                           value={formData.expected_return_time}
                           onChange={e => setFormData(p => ({ ...p, expected_return_time: e.target.value }))}
                           className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 transition-all font-bold text-xs h-10 uppercase" 
                         />
                         <Calendar size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                       </div>
                    </div>
                    <div className="md:col-span-2 space-y-1.5">
                       <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Administrative Remarks</label>
                       <textarea 
                         rows={2}
                         placeholder="E.G. ASSET SENT FOR SITE RESTORATION, SCHEDULED MAINTENANCE RELOCATION..."
                         value={formData.reason}
                         onChange={e => setFormData(p => ({ ...p, reason: e.target.value }))}
                         className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 transition-all font-bold text-xs uppercase resize-none placeholder:text-gray-300"
                       />
                    </div>
                 </div>
              </div>

              {/* Footer Actions */}
              <div className="flex gap-4 pt-8 border-t border-gray-100">
                 <button type="button" onClick={onClose} className="flex-1 py-3 text-[10px] font-black uppercase text-gray-400 hover:text-gray-900 transition-all tracking-widest">Abort Dispatch</button>
                 <button 
                   type="submit" 
                   disabled={isSubmitting || (selectedAsset && selectedAsset.status === 'in_transit')}
                   className="flex-[2] py-4 bg-blue-600 text-white rounded-lg font-black uppercase text-xs tracking-[0.2em] shadow-lg shadow-blue-500/10 flex items-center justify-center gap-3 hover:bg-blue-700 transition-all active:scale-95 disabled:bg-gray-100 disabled:text-gray-400"
                 >
                    {isSubmitting ? <Loader2 className="animate-spin w-4 h-4" /> : <Save size={16} />}
                    Authorize Dispatch Protocol
                 </button>
              </div>
           </form>
        </div>
      </div>
    </div>
  );
}
