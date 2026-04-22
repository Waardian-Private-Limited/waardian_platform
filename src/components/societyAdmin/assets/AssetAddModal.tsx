'use client';

import React, { useState, useEffect } from 'react';
import {
   Package, MapPin, DollarSign, Calendar, Shield,
   Settings, Clock, FileText, ChevronLeft, Save, Plus, Users, Target, Loader2, CheckCircle2,
   CloudUpload, Image as ImageIcon, Wrench, ShieldCheck, Info, TrendingDown, Calculator, X, ChevronRight, IndianRupee
} from 'lucide-react';
import { createAsset, updateAsset, getAssetFullDetails, getVendorsList, uploadFiles, getSocietyStructure } from '@/lib/apiClient';
import { toast } from 'react-hot-toast';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

interface AssetAddModalProps {
   isOpen: boolean;
   onClose: () => void;
   editAssetId?: number | null;
   onSuccess?: () => void;
}

const STEPS = [
   { id: 1, title: 'Identity', description: 'Core details' },
   { id: 2, title: 'Logistics', description: 'Deployment' },
   { id: 3, title: 'SLA & Health', description: 'Maintenance' },
   { id: 4, title: 'Financials', description: 'Value & Access' }
];

export default function AssetAddModal({ isOpen, onClose, editAssetId, onSuccess }: AssetAddModalProps) {
   const [currentStep, setCurrentStep] = useState(1);
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [isLoading, setIsLoading] = useState(false);
   const [uploadState, setUploadState] = useState({ invoice: false, image: false });
   const [vendors, setVendors] = useState<any[]>([]);
   const [structure, setStructure] = useState<{ wings: any[], floors: any[], amenities: any[] }>({ wings: [], floors: [], amenities: [] });
   
   const [isOtherWing, setIsOtherWing] = useState(false);
   const [isOtherFloor, setIsOtherFloor] = useState(false);

   const [formData, setFormData] = useState<any>({
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
      useful_life_years: '',
      scrap_value: '',
      depreciation_method: 'SLM',
      approval_required: false,
      penalty_grace_period: 15,
      penalty_rate_per_hour: 0,
      image_urls: []
   });

   useEffect(() => {
      if (!isOpen) {
         setCurrentStep(1);
         return;
      }

      const fetchData = async () => {
         try {
            setIsLoading(true);
            const [vendorRes, structureRes] = await Promise.all([
               getVendorsList(),
               getSocietyStructure()
            ]);

            if (vendorRes.success) setVendors(vendorRes.data || []);
            if (structureRes.success && structureRes.data) {
               setStructure(structureRes.data);
            }

            if (editAssetId) {
               const assetRes = await getAssetFullDetails(editAssetId);
               if (assetRes.success) {
                  const data = assetRes.data;
                  const formatDate = (date: string) => date ? new Date(date).toISOString().split('T')[0] : '';
                  const sanitizedData = Object.keys(data).reduce((acc: any, key: string) => {
                     acc[key] = data[key] === null ? '' : data[key];
                     return acc;
                  }, {});

                  setFormData((prev: any) => ({
                     ...prev,
                     ...sanitizedData,
                     is_bookable: Boolean(data.is_bookable),
                     approval_required: Boolean(data.approval_required),
                     purchase_date: formatDate(data.purchase_date),
                     installation_date: formatDate(data.installation_date),
                     warranty_expiry: formatDate(data.warranty_expiry),
                     last_service_date: formatDate(data.last_service_date),
                     next_service_date: formatDate(data.next_service_date),
                  }));
               }
            } else {
               // Reset form if opening for new asset
               setFormData({
                  name: '', category: 'Amenities', sub_type: '', description: '',
                  block_wing: '', floor: '', exact_location: '', owned_by: 'society',
                  vendor_id: '', assigned_staff_id: '', purchase_date: '', purchase_cost: '',
                  invoice_number: '', status: 'active', condition_status: 'good',
                  installation_date: '', expected_life_years: '', warranty_expiry: '',
                  maintenance_type_policy: 'none', maintenance_frequency: 'none',
                  last_service_date: '', next_service_date: '', is_bookable: false,
                  pricing_model: 'free', price: '', security_deposit: '',
                  max_booking_hours: '', rules: '', invoice_url: '', image_url: '',
                  useful_life_years: '', scrap_value: '', depreciation_method: 'SLM',
                  approval_required: false,
                  penalty_grace_period: 15,
                  penalty_rate_per_hour: 0,
                  image_urls: []
               });
            }
         } catch (error) {
            toast.error('Initialization failed');
         } finally {
            setIsLoading(false);
         }
      };
      fetchData();
   }, [isOpen, editAssetId]);

   const handleChange = (e: any) => {
      const { name, value, type, checked } = e.target;
      setFormData((prev: any) => {
         const newData = {
            ...prev,
            [name]: type === 'checkbox' ? checked : (value ?? '')
         };
         
         // Auto-sync pricing model
         if (name === 'price') {
            const priceVal = parseFloat(value);
            if (priceVal > 0) {
               newData.pricing_model = 'paid_hourly';
            } else {
               newData.pricing_model = 'free';
            }
         }
         
         return newData;
      });
   };

   const handleNext = () => {
      if (currentStep < 4) setCurrentStep(currentStep + 1);
   };

   const handleBack = () => {
      if (currentStep > 1) setCurrentStep(currentStep - 1);
   };

   const handleSubmit = async () => {
      if (isSubmitting) return;
      setIsSubmitting(true);
      try {
         const res = editAssetId
            ? await updateAsset(editAssetId, formData)
            : await createAsset(formData);

         if (res.success) {
            toast.success(editAssetId ? 'System Updated' : 'Asset Registered');
            onSuccess?.();
            onClose();
         }
      } catch (error) {
         toast.error('Operation failed');
      } finally {
         setIsSubmitting(false);
      }
   };

   const monthlyDepreciation = React.useMemo(() => {
      const cost = Number(formData.purchase_cost);
      const life = Number(formData.useful_life_years);
      const scrap = Number(formData.scrap_value) || 0;
      if (cost > 0 && life > 0) return (cost - scrap) / (life * 12);
      return 0;
   }, [formData.purchase_cost, formData.useful_life_years, formData.scrap_value]);

   if (!isOpen) return null;

   return (
      <AnimatePresence>
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={onClose}
               className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />

            <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
               {/* Modal Header */}
               <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100 shadow-sm">
                        <Package size={24} />
                     </div>
                     <div>
                        <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
                           {editAssetId ? 'Modify Strategy Asset' : 'Register Infrastructure'}
                        </h2>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                           {editAssetId ? `System ID: AST-${editAssetId.toString().padStart(4, '0')}` : 'Provisioning new society resource'}
                        </p>
                     </div>
                  </div>
                  <button 
                     onClick={onClose}
                     className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-all active:scale-90"
                  >
                     <X size={24} />
                  </button>
               </div>

               {/* Step Indicator */}
               <div className="px-8 py-4 bg-gray-50/50 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                     {STEPS.map((step) => (
                        <div key={step.id} className="flex items-center gap-3 relative flex-1">
                           <div className={clsx(
                              "w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs transition-all",
                              currentStep === step.id ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : 
                              currentStep > step.id ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-500"
                           )}>
                              {currentStep > step.id ? <CheckCircle2 size={16} /> : step.id}
                           </div>
                           <div className="hidden md:block">
                              <p className={clsx("text-[10px] font-black uppercase tracking-tight leading-none mb-1 text-gray-400", currentStep === step.id && "text-blue-600")}>
                                 {step.title}
                              </p>
                              <p className="text-[10px] text-gray-400 font-medium whitespace-nowrap">{step.description}</p>
                           </div>
                           {step.id < 4 && (
                              <div className="flex-1 h-0.5 mx-4 bg-gray-100" />
                           )}
                        </div>
                     ))}
                  </div>
               </div>

               {/* Modal Body */}
               <div className="flex-1 overflow-y-auto p-8">
                  {isLoading ? (
                     <div className="py-20 flex flex-col items-center justify-center space-y-4">
                        <Loader2 className="animate-spin text-blue-600" size={48} />
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Hydrating Core Data...</p>
                     </div>
                  ) : (
                     <form className="space-y-8 h-full">
                        <AnimatePresence mode="wait">
                           {currentStep === 1 && (
                              <motion.div 
                                 key="step1"
                                 initial={{ opacity: 0, x: 20 }}
                                 animate={{ opacity: 1, x: 0 }}
                                 exit={{ opacity: 0, x: -20 }}
                                 className="space-y-8"
                              >
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                       <Input label="Asset Name" name="name" required value={formData.name} onChange={handleChange} placeholder="e.g. Caterpillar DG Set" />
                                       <div className="space-y-1.5 flex flex-col">
                                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Primary Category</label>
                                          <select name="category" value={formData.category} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all outline-none">
                                             <option value="Electrical">Electrical</option>
                                             <option value="Mechanical">Mechanical</option>
                                             <option value="Amenities">Amenities</option>
                                             <option value="Infrastructure">Infrastructure</option>
                                          </select>
                                       </div>
                                       <Input label="Model / Sub-Type" name="sub_type" value={formData.sub_type} onChange={handleChange} placeholder="e.g. 500kVA Soundproof" />
                                    </div>
                                    <div className="space-y-1.5 h-full">
                                       <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1 mb-1 block">Operational Purpose</label>
                                       <textarea 
                                          name="description" 
                                          value={formData.description} 
                                          onChange={handleChange} 
                                          rows={7} 
                                          className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all outline-none resize-none" 
                                          placeholder="Technical specifications, serial numbers, critical usage notes..." 
                                       />
                                    </div>
                                 </div>
                              </motion.div>
                           )}

                           {currentStep === 2 && (
                              <motion.div 
                                 key="step2"
                                 initial={{ opacity: 0, x: 20 }}
                                 animate={{ opacity: 1, x: 0 }}
                                 exit={{ opacity: 0, x: -20 }}
                                 className="space-y-8"
                              >
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Deployment Details */}
                                    <div className="space-y-6">
                                       <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
                                          <div className="w-8 h-8 bg-red-50 text-red-500 rounded-lg flex items-center justify-center">
                                             <MapPin size={18} />
                                          </div>
                                          <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Deployment Sector</h3>
                                       </div>
                                       
                                       <div className="space-y-4">
                                          <div className="space-y-1.5 flex flex-col">
                                             <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Zone / Wing</label>
                                             {!isOtherWing ? (
                                                <select 
                                                   name="block_wing" 
                                                   value={formData.block_wing} 
                                                   onChange={(e) => {
                                                      if (e.target.value === 'other') {
                                                         setIsOtherWing(true);
                                                         setFormData({ ...formData, block_wing: '', floor: '' });
                                                      } else {
                                                         setFormData({ ...formData, block_wing: e.target.value, floor: '' });
                                                      }
                                                   }}
                                                   className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                                                >
                                                   <option value="">Select Zone...</option>
                                                   <optgroup label=" wings / Zones">
                                                      {structure.wings.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                                   </optgroup>
                                                   <optgroup label="Amenities">
                                                      {structure.amenities.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                                                   </optgroup>
                                                   <option value="other" className="text-blue-600 font-bold">+ Custom Zone</option>
                                                </select>
                                             ) : (
                                                <div className="relative">
                                                   <input 
                                                      type="text" name="block_wing" value={formData.block_wing} onChange={handleChange}
                                                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 outline-none pr-10"
                                                      placeholder="Enter zone..." autoFocus
                                                   />
                                                   <button type="button" onClick={() => setIsOtherWing(false)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-blue-600 uppercase">List</button>
                                                </div>
                                             )}
                                          </div>

                                          <div className="space-y-1.5 flex flex-col">
                                             <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Floor Level</label>
                                             {!isOtherFloor ? (
                                                <select 
                                                   name="floor" value={formData.floor} 
                                                   onChange={(e) => e.target.value === 'other' ? setIsOtherFloor(true) : handleChange(e)}
                                                   className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 outline-none disabled:opacity-50"
                                                   disabled={!formData.block_wing && !isOtherWing}
                                                >
                                                   <option value="">Select Floor...</option>
                                                   {structure.floors.filter(f => f.wing_id == formData.block_wing).map(f => <option key={f.id} value={f.level}>Floor {f.level}</option>)}
                                                   <option value="other" className="text-blue-600 font-bold">+ Custom Floor</option>
                                                </select>
                                             ) : (
                                                <div className="relative">
                                                   <input type="text" name="floor" value={formData.floor} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 outline-none pr-10" placeholder="Enter floor..." autoFocus />
                                                   <button type="button" onClick={() => setIsOtherFloor(false)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-blue-600 uppercase">List</button>
                                                </div>
                                             )}
                                          </div>
                                          <Input label="Exact Coordinates" name="exact_location" value={formData.exact_location} onChange={handleChange} placeholder="e.g. Near DG Exhaust pipe" />
                                       </div>
                                    </div>

                                    {/* Ownership & Custody */}
                                    <div className="space-y-6">
                                       <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
                                          <div className="w-8 h-8 bg-orange-50 text-orange-500 rounded-lg flex items-center justify-center">
                                             <Users size={18} />
                                          </div>
                                          <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Custody Layer</h3>
                                       </div>

                                       <div className="space-y-4">
                                          <div className="space-y-1.5">
                                             <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Ownership Model</label>
                                             <select name="owned_by" value={formData.owned_by} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 outline-none">
                                                <option value="society">Society Owned</option>
                                                <option value="vendor">Leased / Vendor</option>
                                             </select>
                                          </div>
                                          {formData.owned_by === 'vendor' && (
                                             <div className="space-y-1.5 animate-in slide-in-from-top-2">
                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Partner Entity</label>
                                                <select name="vendor_id" value={formData.vendor_id} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 outline-none">
                                                   <option value="">Select Vendor...</option>
                                                   {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                                </select>
                                             </div>
                                          )}
                                          <Input label="Custodian ID" name="assigned_staff_id" type="number" value={formData.assigned_staff_id} onChange={handleChange} placeholder="Employee ID of lead handler" />
                                       </div>
                                    </div>
                                 </div>
                              </motion.div>
                           )}

                           {currentStep === 3 && (
                              <motion.div 
                                 key="step3"
                                 initial={{ opacity: 0, x: 20 }}
                                 animate={{ opacity: 1, x: 0 }}
                                 exit={{ opacity: 0, x: -20 }}
                                 className="space-y-8"
                              >
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Lifecycle and Health */}
                                    <div className="space-y-6">
                                       <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
                                          <div className="w-8 h-8 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center">
                                             <Target size={18} />
                                          </div>
                                          <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">System Vitality</h3>
                                       </div>

                                       <div className="grid grid-cols-2 gap-4">
                                          <div className="space-y-1.5">
                                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Global Status</label>
                                             <select name="status" value={formData.status} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 outline-none">
                                                <option value="active">Active</option>
                                                <option value="under_maintenance">Maintenance</option>
                                                <option value="decommissioned">Retired</option>
                                             </select>
                                          </div>
                                          <div className="space-y-1.5">
                                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Core Condition</label>
                                             <select name="condition_status" value={formData.condition_status} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 outline-none">
                                                <option value="new">Factory New</option>
                                                <option value="good">Operative</option>
                                                <option value="fair">Aged</option>
                                                <option value="poor">Critically Worn</option>
                                             </select>
                                          </div>
                                          <Input label="Install Date" name="installation_date" type="date" value={formData.installation_date} onChange={handleChange} />
                                          <Input label="Warranty End" name="warranty_expiry" type="date" value={formData.warranty_expiry} onChange={handleChange} />
                                       </div>
                                    </div>

                                    {/* SLA and Maintenance */}
                                    <div className="space-y-6">
                                       <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
                                          <div className="w-8 h-8 bg-purple-50 text-purple-500 rounded-lg flex items-center justify-center">
                                             <Wrench size={18} />
                                          </div>
                                          <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">SLA Protocols</h3>
                                       </div>

                                       <div className="grid grid-cols-2 gap-4">
                                          <div className="space-y-1.5">
                                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Policy Type</label>
                                             <select name="maintenance_type_policy" value={formData.maintenance_type_policy} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 outline-none">
                                                <option value="none">Reactive</option>
                                                <option value="amc">AMC Periodic</option>
                                                <option value="on_demand">Incident Based</option>
                                             </select>
                                          </div>
                                          <div className="space-y-1.5">
                                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Audit Cycle</label>
                                             <select name="maintenance_frequency" value={formData.maintenance_frequency} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 outline-none">
                                                <option value="none">N/A</option>
                                                <option value="monthly">Monthly</option>
                                                <option value="quarterly">Quarterly</option>
                                                <option value="yearly">Annual</option>
                                             </select>
                                          </div>
                                          <Input label="Last Audit" name="last_service_date" type="date" value={formData.last_service_date} onChange={handleChange} />
                                          <Input label="Next Audit" name="next_service_date" type="date" value={formData.next_service_date} onChange={handleChange} />
                                       </div>
                                    </div>
                                 </div>
                              </motion.div>
                           )}

                           {currentStep === 4 && (
                              <motion.div 
                                 key="step4"
                                 initial={{ opacity: 0, x: 20 }}
                                 animate={{ opacity: 1, x: 0 }}
                                 exit={{ opacity: 0, x: -20 }}
                                 className="space-y-8"
                              >
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Financial Core */}
                                    <div className="space-y-6">
                                       <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
                                          <div className="w-8 h-8 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center">
                                             <IndianRupee size={18} />
                                          </div>
                                          <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Financial Audit</h3>
                                       </div>

                                       <div className="space-y-4">
                                          <div className="grid grid-cols-3 gap-4">
                                             <div className="col-span-2">
                                                <Input label="Purchase Cost (₹)" name="purchase_cost" type="number" required value={formData.purchase_cost} onChange={handleChange} placeholder="0.00" />
                                             </div>
                                             <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Useful Life</label>
                                                <input type="number" name="useful_life_years" value={formData.useful_life_years} onChange={handleChange} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-800 outline-none" placeholder="Years" />
                                             </div>
                                          </div>
                                          
                                          {monthlyDepreciation > 0 && (
                                             <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100 flex items-center gap-4 animate-in zoom-in duration-300">
                                                <Calculator size={20} className="text-emerald-600" />
                                                <div>
                                                   <p className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.1em]">Monthly Dep. Accrual</p>
                                                   <p className="text-lg font-black text-gray-900 tracking-tighter">₹{monthlyDepreciation.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                                                </div>
                                             </div>
                                          )}

                                          <div className="grid grid-cols-2 gap-4">
                                             <Input label="Purchase Date" name="purchase_date" type="date" value={formData.purchase_date} onChange={handleChange} />
                                             <Input label="Invoice #" name="invoice_number" value={formData.invoice_number} onChange={handleChange} placeholder="TXN-..." />
                                          </div>

                                          <div className="grid grid-cols-2 gap-4">
                                             <MediaUpload
                                                label="Invoice PDF"
                                                icon={<FileText size={16} />}
                                                isUploading={uploadState.invoice}
                                                isUploaded={!!formData.invoice_url}
                                                onFileSelect={async (file: File) => {
                                                   setUploadState(p => ({ ...p, invoice: true }));
                                                   try {
                                                      const res = await uploadFiles('asset-invoices', [file]);
                                                      if (res?.data?.files?.[0]?.url) setFormData((p: any) => ({ ...p, invoice_url: res.data.files[0].url }));
                                                   } catch (err) { toast.error('Upload failed'); }
                                                   finally { setUploadState(p => ({ ...p, invoice: false })); }
                                                }}
                                             />
                                             <div className="space-y-4">
                                                <MediaUpload
                                                   label="Asset Images (Upload multiple)"
                                                   icon={<ImageIcon size={16} />}
                                                   isUploading={uploadState.image}
                                                   onFileSelect={async (file: File) => {
                                                      setUploadState(p => ({ ...p, image: true }));
                                                      try {
                                                         const res = await uploadFiles('asset-images', [file]);
                                                         if (res?.data?.files?.[0]?.url) {
                                                            setFormData((p: any) => ({ 
                                                               ...p, 
                                                               image_urls: [...(p.image_urls || []), res.data.files[0].url],
                                                               // Fallback for legacy support
                                                               image_url: p.image_url || res.data.files[0].url
                                                            }));
                                                         }
                                                      } catch (err) { toast.error('Upload failed'); }
                                                      finally { setUploadState(p => ({ ...p, image: false })); }
                                                   }}
                                                />
                                                
                                                {/* Image Preview Gallery */}
                                                {formData.image_urls?.length > 0 && (
                                                   <div className="flex flex-wrap gap-2 animate-in fade-in zoom-in duration-300">
                                                      {formData.image_urls.map((url: string, idx: number) => (
                                                         <div key={idx} className="relative group w-16 h-16 rounded-lg overflow-hidden border border-gray-100 shadow-sm">
                                                            <img src={url} alt={`Asset ${idx}`} className="w-full h-full object-cover" />
                                                            <button 
                                                               type="button"
                                                               onClick={() => setFormData((p: any) => ({ ...p, image_urls: p.image_urls.filter((_: any, i: number) => i !== idx) }))}
                                                               className="absolute top-0.5 right-0.5 bg-red-500 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                               <X size={10} />
                                                            </button>
                                                         </div>
                                                      ))}
                                                   </div>
                                                )}
                                             </div>
                                          </div>
                                       </div>
                                    </div>

                                    {/* Access Logic */}
                                    <div className="space-y-6">
                                       <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
                                          <div className="w-8 h-8 bg-emerald-50 text-emerald-500 rounded-lg flex items-center justify-center">
                                             <ShieldCheck size={18} />
                                          </div>
                                          <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Access Protocol</h3>
                                       </div>

                                       <div className="space-y-4">
                                          <button
                                             type="button"
                                             onClick={() => setFormData({ ...formData, is_bookable: !formData.is_bookable })}
                                             className={clsx(
                                                "w-full p-4 rounded-lg flex items-center justify-between transition-all border",
                                                formData.is_bookable ? "bg-emerald-50 border-emerald-100 text-emerald-900" : "bg-gray-50 border-gray-100 text-gray-400"
                                             )}
                                          >
                                             <div className="text-left">
                                                <p className="text-sm font-bold">Resident Booking</p>
                                                <p className="text-[10px] uppercase font-bold tracking-tight opacity-60">Allows self-service via App</p>
                                             </div>
                                             {formData.is_bookable ? <CheckCircle2 size={20} className="text-emerald-500" /> : <div className="w-5 h-5 rounded-full border-2 border-gray-300" />}
                                          </button>

                                          {formData.is_bookable && (
                                             <div className="animate-in fade-in slide-in-from-top-2 space-y-4">
                                                <div className="flex gap-4">
                                                   <div className="flex-1">
                                                      <Input label="Utility Rate" name="price" type="number" value={formData.price} onChange={handleChange} placeholder="0.00" />
                                                   </div>
                                                   <div className="flex-1">
                                                      <Input label="Max Duration" name="max_booking_hours" type="number" value={formData.max_booking_hours} onChange={handleChange} placeholder="Hrs" />
                                                   </div>
                                                </div>
                                                <button
                                                   type="button"
                                                   onClick={() => setFormData({ ...formData, approval_required: !formData.approval_required })}
                                                   className={clsx(
                                                      "w-full px-4 py-3 rounded-lg flex items-center justify-between transition-all border",
                                                      formData.approval_required ? "bg-blue-50 border-blue-100 text-blue-900" : "bg-gray-50 border-gray-100 text-gray-400"
                                                   )}
                                                >
                                                   <span className="text-xs font-bold">Manual Admin Confirmation</span>
                                                   {formData.approval_required ? <Shield size={16} className="text-blue-500" /> : <div className="w-4 h-4 rounded-full border-2 border-gray-300" />}
                                                </button>

                                                {/* Dynamic Penalty Configuration */}
                                                <div className="p-4 bg-red-50/50 rounded-xl border border-red-100 space-y-4">
                                                   <div className="flex items-center gap-2 text-red-600 mb-1">
                                                      <Calculator size={16} />
                                                      <span className="text-[10px] font-black uppercase tracking-widest">Enforcement Policy</span>
                                                   </div>
                                                   <div className="grid grid-cols-2 gap-4">
                                                      <div className="space-y-1">
                                                         <label className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">Grace Period (Mins)</label>
                                                         <input 
                                                            type="number" 
                                                            name="penalty_grace_period" 
                                                            value={formData.penalty_grace_period} 
                                                            onChange={handleChange} 
                                                            className="w-full px-3 py-2 bg-white border border-red-200 rounded-lg text-sm font-bold text-gray-800 outline-none focus:ring-2 focus:ring-red-100 transition-all"
                                                            placeholder="e.g. 15"
                                                         />
                                                      </div>
                                                      <div className="space-y-1">
                                                         <label className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">Late Fee (₹/Hr)</label>
                                                         <input 
                                                            type="number" 
                                                            name="penalty_rate_per_hour" 
                                                            value={formData.penalty_rate_per_hour} 
                                                            onChange={handleChange} 
                                                            className="w-full px-3 py-2 bg-white border border-red-200 rounded-lg text-sm font-bold text-gray-800 outline-none focus:ring-2 focus:ring-red-100 transition-all"
                                                            placeholder="e.g. 50"
                                                         />
                                                      </div>
                                                   </div>
                                                   <p className="text-[9px] text-gray-400 font-medium italic">
                                                      Residents will be automatically notified of penalties if the return exceeds the grace duration.
                                                   </p>
                                                </div>
                                             </div>
                                          )}
                                       </div>
                                    </div>
                                 </div>
                              </motion.div>
                           )}
                        </AnimatePresence>
                     </form>
                  )}
               </div>

               {/* Modal Footer */}
               <div className="px-8 py-6 bg-white border-t border-gray-100 flex items-center justify-between sticky bottom-0 z-10">
                  <button 
                     onClick={handleBack}
                     disabled={currentStep === 1 || isSubmitting}
                     className="px-6 py-3 text-sm font-bold text-gray-400 hover:text-gray-900 disabled:opacity-0 transition-all flex items-center gap-2"
                  >
                     <ChevronLeft size={18} />
                     Back
                  </button>

                  <div className="flex items-center gap-4">
                     <button 
                        onClick={onClose}
                        className="px-6 py-3 text-sm font-bold text-gray-400 hover:text-gray-600 transition-all"
                     >
                        Cancel
                     </button>
                     {currentStep < 4 ? (
                        <button 
                           onClick={handleNext}
                           className="bg-gray-900 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-3 shadow-xl active:scale-95 transition-all"
                        >
                           Next Step
                           <ChevronRight size={18} />
                        </button>
                     ) : (
                        <button 
                           onClick={handleSubmit}
                           disabled={isSubmitting}
                           className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-3 rounded-lg font-bold flex items-center gap-3 shadow-xl shadow-blue-200 active:scale-95 transition-all disabled:opacity-50"
                        >
                           {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                           {editAssetId ? 'Update Asset' : 'Finalize Infrastructure'}
                        </button>
                     )}
                  </div>
               </div>
            </motion.div>
         </div>
      </AnimatePresence>
   );
}

function Input({ label, name, type = "text", required, value, onChange, placeholder }: any) {
   return (
      <div className="space-y-1.5 flex flex-col">
         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
            {label} {required && <span className="text-red-400">*</span>}
         </label>
         <input
            name={name} type={type} required={required} value={value} onChange={onChange} placeholder={placeholder}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 placeholder:text-gray-300 placeholder:font-medium focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all outline-none"
         />
      </div>
   );
}

function MediaUpload({ label, icon, isUploading, isUploaded, onFileSelect }: any) {
   return (
      <label className="relative flex items-center justify-between p-4 bg-gray-50 hover:bg-white border border-gray-200 rounded-lg cursor-pointer transition-all group overflow-hidden">
         <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => e.target.files?.[0] && onFileSelect(e.target.files[0])} />
         <div className="flex items-center gap-3">
            <div className="text-gray-400 group-hover:text-blue-600 transition-colors">{icon}</div>
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{label}</span>
         </div>
         {isUploading ? <Loader2 size={16} className="animate-spin text-blue-600" /> : isUploaded ? <CheckCircle2 size={18} className="text-emerald-500" /> : <CloudUpload size={18} className="text-gray-300" />}
      </label>
   );
}
