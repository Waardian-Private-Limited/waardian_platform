'use client';

import React, { useState, useEffect } from 'react';
import {
   Package, MapPin, Shield,
   Settings, FileText, ChevronLeft, Save, Target, Loader2,
   CloudUpload, Image as ImageIcon, Wrench, ShieldCheck, X, ChevronRight, IndianRupee,
   RefreshCw
} from 'lucide-react';
import { createAsset, updateAsset, getAssetFullDetails, getVendorsList, uploadFiles, getSocietyStructure } from '@/lib/apiClient';
import { toast } from 'react-hot-toast';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

interface AssetAddModalProps {
   isOpen?: boolean;
   assetId?: number | null;
   onClose: () => void;
   onSuccess?: () => void;
}

interface AssetFormData {
  name: string;
  category: string;
  sub_type: string;
  description: string;
  block_wing: string;
  floor: string;
  exact_location: string;
  owned_by: string;
  vendor_id: string;
  assigned_staff_id: string;
  purchase_date: string;
  purchase_cost: string;
  invoice_number: string;
  status: string;
  condition_status: string;
  installation_date: string;
  expected_life_years: string;
  warranty_expiry: string;
  maintenance_type_policy: string;
  maintenance_frequency: string;
  last_service_date: string;
  next_service_date: string;
  is_bookable: boolean;
  pricing_model: string;
  price: string;
  security_deposit: string;
  max_booking_hours: string;
  rules: string;
  invoice_url: string;
  image_url: string;
  useful_life_years: string;
  scrap_value: string;
  depreciation_method: string;
  approval_required: boolean;
  penalty_grace_period: number;
  penalty_rate_per_hour: number;
  utility_rate: number;
  image_urls: string[];
}

const STEPS = [
   { id: 1, title: 'Identity', description: 'Core details' },
   { id: 2, title: 'Logistics', description: 'Deployment' },
   { id: 3, title: 'SLA & Health', description: 'Maintenance' },
   { id: 4, title: 'Financials', description: 'Value & Access' }
];

export default function AssetAddModal({ assetId, onClose, onSuccess }: AssetAddModalProps) {
   const [currentStep, setCurrentStep] = useState(1);
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [isLoading, setIsLoading] = useState(false);
   const [uploadState, setUploadState] = useState({ invoice: false, image: false });
   const [vendors, setVendors] = useState<{ id: number; business_name: string }[]>([]);
   const [structure, setStructure] = useState<{ wings: { id: number; name: string }[], floors: string[], amenities: { id: number; name: string }[] }>({ wings: [], floors: [], amenities: [] });
   
   const [isOtherWing, setIsOtherWing] = useState(false);
   const [isOtherFloor, setIsOtherFloor] = useState(false);

   const [formData, setFormData] = useState<AssetFormData>({
      name: '',
      category: 'Amenities',
      sub_type: '',
      description: '',
      block_wing: '',
      floor: '',
      exact_location: '',
      owned_by: 'society',
      vendor_id: '',
      assigned_staff_id: '',
      purchase_date: '',
      purchase_cost: '',
      invoice_number: '',
      status: 'active',
      condition_status: 'good',
      installation_date: '',
      expected_life_years: '',
      warranty_expiry: '',
      maintenance_type_policy: 'none',
      maintenance_frequency: 'none',
      last_service_date: '',
      next_service_date: '',
      is_bookable: false,
      pricing_model: 'free',
      price: '',
      security_deposit: '',
      max_booking_hours: '',
      rules: '',
      invoice_url: '',
      image_url: '',
      useful_life_years: '10',
      scrap_value: '0',
      depreciation_method: 'SLM',
      approval_required: false,
      penalty_grace_period: 0,
      penalty_rate_per_hour: 0,
      utility_rate: 0,
      image_urls: []
   });

   useEffect(() => {
      const init = async () => {
         setIsLoading(true);
         try {
            const [vRes, sRes] = await Promise.all([getVendorsList(), getSocietyStructure()]);
            if (vRes.success) setVendors(vRes.data || []);
            if (sRes.success) setStructure(sRes.data || { wings: [], floors: [], amenities: [] });

            if (assetId) {
               const aRes = await getAssetFullDetails(assetId);
               if (aRes.success && aRes.data) {
                  const asset = aRes.data;
                  setFormData(prev => ({
                     ...prev,
                     ...asset,
                     vendor_id: asset.vendor_id?.toString() || '',
                     purchase_cost: asset.purchase_cost?.toString() || '',
                     expected_life_years: asset.expected_life_years?.toString() || '',
                     price: asset.price?.toString() || '',
                     security_deposit: asset.security_deposit?.toString() || '',
                     max_booking_hours: asset.max_booking_hours?.toString() || '',
                     useful_life_years: asset.useful_life_years?.toString() || '10',
                     scrap_value: asset.scrap_value?.toString() || '0'
                  }));
               }
            }
         } catch {
            toast.error('System synchronization failure');
         } finally {
            setIsLoading(false);
         }
      };
      init();
   }, [assetId]);

   const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'invoice' | 'image') => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      setUploadState(p => ({ ...p, [type]: true }));
      try {
         const res = await uploadFiles('assets', [file]);
         if (res.status === 'success' && res.data?.files?.[0]?.url) {
            setFormData(p => ({ ...p, [type === 'invoice' ? 'invoice_url' : 'image_url']: res.data.files[0].url }));
            toast.success(`${type.toUpperCase()} Protocol Committed`);
         }
      } catch {
         toast.error('Transmission failure');
      } finally {
         setUploadState(p => ({ ...p, [type]: false }));
      }
   };

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (currentStep < 4) return setCurrentStep(s => s + 1);

      setIsSubmitting(true);
      try {
         const payload = {
            ...formData,
            purchase_cost: parseFloat(formData.purchase_cost) || 0,
            price: parseFloat(formData.price) || 0,
            security_deposit: parseFloat(formData.security_deposit) || 0,
            max_booking_hours: parseInt(formData.max_booking_hours) || 0,
            useful_life_years: parseInt(formData.useful_life_years) || 10,
            scrap_value: parseFloat(formData.scrap_value) || 0
         };

         const res = assetId ? await updateAsset(assetId, payload) : await createAsset(payload);
         if (res.success) {
            toast.success(assetId ? 'Entity Updated' : 'Entity Manifested');
            onSuccess?.();
            onClose();
         }
      } catch (err: any) {
         toast.error(err.message || 'Transmision Failure');
      } finally {
         setIsSubmitting(false);
      }
   };

   return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
         <motion.div 
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white w-full max-w-4xl rounded-none shadow-2xl overflow-hidden border border-slate-200 flex h-[85vh]"
         >
            {/* Sidebar Controls */}
            <div className="w-1/3 bg-slate-900 p-10 flex flex-col justify-between relative overflow-hidden">
               <div className="relative z-10">
                  <div className="w-14 h-14 bg-white/10 rounded-none flex items-center justify-center backdrop-blur-md border border-white/20 mb-8">
                     <Package size={28} className="text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white uppercase tracking-tight mb-2">{assetId ? 'Update' : 'Initialize'} Asset</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-12">Registry Alignment Protocol</p>

                  <div className="space-y-8">
                     {STEPS.map((step) => (
                        <div key={step.id} className="flex gap-5 items-center group cursor-pointer" onClick={() => step.id < currentStep && setCurrentStep(step.id)}>
                           <div className={clsx(
                              "w-9 h-9 rounded-none flex items-center justify-center font-bold text-xs transition-all border",
                              currentStep === step.id ? "bg-blue-600 text-white border-blue-500 scale-105 shadow-lg shadow-blue-500/20" : 
                              currentStep > step.id ? "bg-emerald-500 text-white border-emerald-400" : "bg-white/5 text-slate-500 border-white/10"
                           )}>
                              {currentStep > step.id ? <ShieldCheck size={16} /> : step.id}
                           </div>
                           <div>
                              <p className={clsx("text-[10px] font-bold uppercase tracking-widest leading-none mb-1.5", currentStep === step.id ? "text-white" : "text-slate-500")}>{step.title}</p>
                              <p className="text-[9px] font-medium text-slate-600 uppercase tracking-tight">{step.description}</p>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>

               <div className="relative z-10 pt-10 border-t border-white/5">
                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-none border border-white/10">
                     <div className="w-8 h-8 bg-blue-500/20 rounded-none flex items-center justify-center text-blue-400">
                        <Target size={18} />
                     </div>
                     <p className="text-[9px] font-bold text-slate-400 uppercase leading-relaxed tracking-tight">System validation active. Ensure all parameters align with society SLA.</p>
                  </div>
               </div>
               
               <Package size={200} className="absolute -left-10 -bottom-10 opacity-5 -rotate-12" />
            </div>

            {/* Main Form Space */}
            <div className="flex-1 flex flex-col bg-white">
               <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                  <div className="flex items-center gap-3">
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Protocol Phase</span>
                     <span className="px-3 py-1 bg-white border border-slate-200 rounded-none text-[10px] font-bold text-slate-900 tabular-nums shadow-sm">{currentStep} / 4</span>
                  </div>
                  <button onClick={onClose} className="p-2 hover:bg-white rounded-none transition-all border border-transparent hover:border-slate-200 active:scale-90"><X size={20} className="text-slate-400" /></button>
               </div>

               <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                  {isLoading ? (
                     <div className="h-full flex flex-col items-center justify-center gap-4">
                        <RefreshCw size={32} className="animate-spin text-blue-600" />
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Retrieving Entity Records...</p>
                     </div>
                  ) : (
                     <AnimatePresence mode="wait">
                        {currentStep === 1 && (
                           <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-8">
                              <FormSection icon={<FileText size={16} />} title="Identity Matrix">
                                 <div className="grid grid-cols-2 gap-6">
                                    <FormInput label="Entity Name *" required value={formData.name} onChange={v => setFormData({...formData, name: v})} placeholder="CENTRAL CHILLER A-1" />
                                    <FormSelect label="Classification" value={formData.category} options={['Amenities', 'Infrastructure', 'Security', 'Maintenance', 'Vehicle', 'Equipment']} onChange={v => setFormData({...formData, category: v})} />
                                    <FormInput label="Sub-Classification" value={formData.sub_type} onChange={v => setFormData({...formData, sub_type: v})} placeholder="HVAC SYSTEM" />
                                    <FormSelect label="Condition Status" value={formData.condition_status} options={['good', 'damaged', 'maintenance', 'scrapped']} onChange={v => setFormData({...formData, condition_status: v})} />
                                 </div>
                                 <FormTextarea label="Tactical Directive / Description" value={formData.description} onChange={v => setFormData({...formData, description: v})} placeholder="Enter operational directives..." />
                              </FormSection>
                           </motion.div>
                        )}

                        {currentStep === 2 && (
                           <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-8">
                              <FormSection icon={<MapPin size={16} />} title="Logistic Mesh">
                                 <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Deployment Wing</label>
                                       <select 
                                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-none text-xs font-bold text-slate-900 outline-none focus:bg-white focus:ring-1 focus:ring-blue-100 transition-all uppercase"
                                          value={isOtherWing ? 'other' : formData.block_wing}
                                          onChange={e => {
                                             if (e.target.value === 'other') setIsOtherWing(true);
                                             else { setIsOtherWing(false); setFormData({...formData, block_wing: e.target.value}); }
                                          }}
                                       >
                                          <option value="">Select Wing...</option>
                                          {structure.wings.map(w => <option key={w.id} value={w.name}>{w.name}</option>)}
                                          <option value="other">OTHER / EXTERNAL</option>
                                       </select>
                                       {isOtherWing && <input className="w-full px-4 py-3 bg-white border border-blue-200 rounded-none text-xs font-bold text-slate-900 outline-none mt-2 uppercase" placeholder="ENTER WING..." value={formData.block_wing} onChange={e => setFormData({...formData, block_wing: e.target.value})} />}
                                    </div>

                                    <div className="space-y-2">
                                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Floor Level</label>
                                       <select 
                                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-none text-xs font-bold text-slate-900 outline-none focus:bg-white focus:ring-1 focus:ring-blue-100 transition-all uppercase"
                                          value={isOtherFloor ? 'other' : formData.floor}
                                          onChange={e => {
                                             if (e.target.value === 'other') setIsOtherFloor(true);
                                             else { setIsOtherFloor(false); setFormData({...formData, floor: e.target.value}); }
                                          }}
                                       >
                                          <option value="">Select Floor...</option>
                                          {structure.floors.map(f => <option key={f} value={f}>{f}</option>)}
                                          <option value="other">OTHER</option>
                                       </select>
                                       {isOtherFloor && <input className="w-full px-4 py-3 bg-white border border-blue-200 rounded-none text-xs font-bold text-slate-900 outline-none mt-2 uppercase" placeholder="ENTER FLOOR..." value={formData.floor} onChange={e => setFormData({...formData, floor: e.target.value})} />}
                                    </div>
                                 </div>
                                 <FormInput label="Pinpoint Location" value={formData.exact_location} onChange={v => setFormData({...formData, exact_location: v})} placeholder="CENTRAL HVAC HUB - B1" />
                              </FormSection>
                           </motion.div>
                        )}

                        {currentStep === 3 && (
                           <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-8">
                              <FormSection icon={<Wrench size={16} />} title="SLA & Service Protocol">
                                 <div className="grid grid-cols-2 gap-6">
                                    <FormSelect label="Service Strategy" value={formData.maintenance_type_policy} options={['none', 'predictive', 'scheduled', 'reactive']} onChange={v => setFormData({...formData, maintenance_type_policy: v})} />
                                    <FormSelect label="Service Frequency" value={formData.maintenance_frequency} options={['none', 'weekly', 'bi-weekly', 'monthly', 'quarterly', 'half-yearly', 'annually']} onChange={v => setFormData({...formData, maintenance_frequency: v})} />
                                    <FormInput label="Warranty Termination" type="date" value={formData.warranty_expiry} onChange={v => setFormData({...formData, warranty_expiry: v})} />
                                    <FormInput label="Planned Service" type="date" value={formData.next_service_date} onChange={v => setFormData({...formData, next_service_date: v})} />
                                 </div>
                              </FormSection>
                           </motion.div>
                        )}

                        {currentStep === 4 && (
                           <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-8">
                              <FormSection icon={<IndianRupee size={16} />} title="Fiscal Registry">
                                 <div className="grid grid-cols-2 gap-6">
                                    <FormInput label="Acquisition Cost (₹)" type="number" value={formData.purchase_cost} onChange={v => setFormData({...formData, purchase_cost: v})} placeholder="0.00" />
                                    <FormInput label="Acquisition Date" type="date" value={formData.purchase_date} onChange={v => setFormData({...formData, purchase_date: v})} />
                                    <FormSelect label="Supply Partner" value={formData.vendor_id} options={vendors.map(v => ({ label: v.business_name, value: v.id.toString() }))} onChange={v => setFormData({...formData, vendor_id: v})} />
                                    <FormInput label="Invoice Number" value={formData.invoice_number} onChange={v => setFormData({...formData, invoice_number: v})} placeholder="INV-0000" />
                                 </div>
                                 <div className="p-6 bg-slate-50 rounded-none border border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                       <div className={clsx("w-10 h-10 rounded-none flex items-center justify-center transition-all border", formData.is_bookable ? "bg-blue-600 text-white shadow-md border-blue-500" : "bg-white text-slate-300 border-slate-200")}>
                                          <Target size={20} />
                                       </div>
                                       <div>
                                          <p className="text-[11px] font-bold text-slate-900 uppercase tracking-tight">Booking Access</p>
                                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Enable resident reservations</p>
                                       </div>
                                    </div>
                                    <button 
                                       type="button"
                                       onClick={() => setFormData({...formData, is_bookable: !formData.is_bookable})}
                                       className={clsx("w-12 h-6 rounded-none relative transition-all duration-300 border", formData.is_bookable ? "bg-blue-600 border-blue-500" : "bg-slate-200 border-slate-300")}
                                    >
                                       <div className={clsx("absolute top-0.5 w-5 h-4.5 bg-white rounded-none transition-all duration-300 shadow-sm", formData.is_bookable ? "left-6.5" : "left-0.5")} />
                                    </button>
                                 </div>
                              </FormSection>

                              <FormSection icon={<ImageIcon size={16} />} title="Documentation">
                                 <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Primary Imagery</p>
                                       <label className="flex flex-col items-center justify-center w-full h-32 border border-dashed border-slate-200 rounded-none bg-slate-50/50 cursor-pointer hover:bg-white hover:border-blue-300 transition-all group overflow-hidden relative">
                                          {formData.image_url ? (
                                             <img src={formData.image_url} alt="asset" className="w-full h-full object-cover" />
                                          ) : (
                                             <div className="flex flex-col items-center">
                                                <ImageIcon size={28} className="text-slate-300 group-hover:text-blue-500 mb-2 transition-colors" />
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Upload Resource Image</p>
                                             </div>
                                          )}
                                          <input type="file" className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'image')} />
                                          {uploadState.image && <div className="absolute inset-0 bg-white/80 flex items-center justify-center backdrop-blur-sm"><Loader2 size={24} className="animate-spin text-blue-600" /></div>}
                                       </label>
                                    </div>
                                    <div className="space-y-2">
                                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Fiscal Invoice</p>
                                       <label className="flex flex-col items-center justify-center w-full h-32 border border-dashed border-slate-200 rounded-none bg-slate-50/50 cursor-pointer hover:bg-white hover:border-blue-300 transition-all group overflow-hidden relative">
                                          <div className="flex flex-col items-center">
                                             <CloudUpload size={28} className="text-slate-300 group-hover:text-blue-500 mb-2 transition-colors" />
                                             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center px-4">
                                                {formData.invoice_url ? 'INVOICE ATTACHED' : 'Upload Invoice PDF/JPG'}
                                             </p>
                                          </div>
                                          <input type="file" className="hidden" onChange={e => handleFileUpload(e, 'invoice')} />
                                          {uploadState.invoice && <div className="absolute inset-0 bg-white/80 flex items-center justify-center backdrop-blur-sm"><Loader2 size={24} className="animate-spin text-blue-600" /></div>}
                                       </label>
                                    </div>
                                 </div>
                              </FormSection>
                           </motion.div>
                        )}
                     </AnimatePresence>
                  )}
               </form>

               {/* Footer Navigation */}
               <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <button 
                     type="button"
                     onClick={() => currentStep > 1 ? setCurrentStep(s => s - 1) : onClose()}
                     className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all flex items-center gap-2"
                  >
                     <ChevronLeft size={16} />
                     {currentStep === 1 ? 'Abort' : 'Back'}
                  </button>
                  <button 
                     onClick={handleSubmit}
                     disabled={isSubmitting}
                     className="min-w-[180px] px-8 py-3 bg-slate-900 text-white rounded-none text-[10px] font-bold uppercase tracking-widest shadow-lg hover:bg-blue-600 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                     {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : (
                        <>
                           {currentStep === 4 ? (assetId ? 'Commit Updates' : 'Manifest Entity') : 'Continue Phase'}
                           <ChevronRight size={16} />
                        </>
                     )}
                  </button>
               </div>
            </div>
         </motion.div>
      </div>
   );
}

function FormSection({ icon, title, children }: { icon: any, title: string, children: React.ReactNode }) {
   return (
      <div className="space-y-6">
         <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-none border border-blue-100">{icon}</div>
            <h3 className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">{title}</h3>
         </div>
         <div className="space-y-6">
            {children}
         </div>
      </div>
   );
}

function FormInput({ label, type = 'text', value, onChange, placeholder, required }: { label: string, type?: string, value: string, onChange: (v: string) => void, placeholder?: string, required?: boolean }) {
   return (
      <div className="space-y-2">
         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">{label}</label>
         <input 
            required={required}
            type={type}
            value={value}
            onChange={e => onChange(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-none text-xs font-bold text-slate-900 outline-none focus:bg-white focus:ring-1 focus:ring-blue-100 transition-all placeholder:text-slate-300 uppercase"
            placeholder={placeholder}
         />
      </div>
   );
}

function FormSelect({ label, value, options, onChange }: { label: string, value: string, options: (string | { label: string, value: string })[], onChange: (v: string) => void }) {
   return (
      <div className="space-y-2">
         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">{label}</label>
         <select 
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-none text-xs font-bold text-slate-900 outline-none focus:bg-white focus:ring-1 focus:ring-blue-100 transition-all uppercase"
            value={value}
            onChange={e => onChange(e.target.value)}
         >
            {options.map(opt => {
               const val = typeof opt === 'string' ? opt : opt.value;
               const lbl = typeof opt === 'string' ? opt : opt.label;
               return <option key={val} value={val}>{lbl.toUpperCase()}</option>;
            })}
         </select>
      </div>
   );
}

function FormTextarea({ label, value, onChange, placeholder }: { label: string, value: string, onChange: (v: string) => void, placeholder?: string }) {
   return (
      <div className="space-y-2">
         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">{label}</label>
         <textarea 
            rows={4}
            value={value}
            onChange={e => onChange(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-none text-xs font-bold text-slate-900 outline-none focus:bg-white focus:ring-1 focus:ring-blue-100 transition-all placeholder:text-slate-300 resize-none uppercase"
            placeholder={placeholder}
         />
      </div>
   );
}
