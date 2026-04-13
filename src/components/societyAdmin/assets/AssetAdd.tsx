'use client';

import React, { useState, useEffect } from 'react';
import {
   Package, MapPin, DollarSign, Calendar, Shield,
   Settings, Clock, FileText, ChevronLeft, Save, Plus, Users, Target, Loader2, CheckCircle2,
   CloudUpload, Image as ImageIcon, Wrench, ShieldCheck, Info, TrendingDown, Calculator
} from 'lucide-react';
import { createAsset, updateAsset, getAssetFullDetails, getVendorsList, uploadFiles } from '@/lib/apiClient';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import clsx from 'clsx';

interface AssetAddProps {
   editAssetId?: string;
}

export default function AssetAdd({ editAssetId }: AssetAddProps) {
   const router = useRouter();
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [isLoading, setIsLoading] = useState(!!editAssetId);
   const [uploadState, setUploadState] = useState({ invoice: false, image: false });
   const [vendors, setVendors] = useState<any[]>([]);
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
      approval_required: false
   });

   const monthlyDepreciation = React.useMemo(() => {
      const cost = Number(formData.purchase_cost);
      const life = Number(formData.useful_life_years);
      const scrap = Number(formData.scrap_value) || 0;

      if (cost > 0 && life > 0) {
         return (cost - scrap) / (life * 12);
      }
      return 0;
   }, [formData.purchase_cost, formData.useful_life_years, formData.scrap_value]);

   useEffect(() => {
      const fetchData = async () => {
         try {
            const vendorRes = await getVendorsList();
            if (vendorRes.success) setVendors(vendorRes.data || []);

            if (editAssetId) {
               const assetRes = await getAssetFullDetails(Number(editAssetId));
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
             }
         } catch (error) {
            toast.error('Failed to load asset metadata');
         } finally {
            setIsLoading(false);
         }
      };
      fetchData();
   }, [editAssetId]);

   const handleChange = (e: any) => {
      const { name, value, type, checked } = e.target;
      setFormData((prev: any) => ({
         ...prev,
         [name]: type === 'checkbox' ? checked : (value ?? '')
      }));
   };

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      try {
         const res = editAssetId
            ? await updateAsset(Number(editAssetId), formData)
            : await createAsset(formData);

         if (res.success) {
            toast.success(editAssetId ? 'Asset updated successfully' : 'Asset registered successfully');
            router.push('/societyadmin/asset-list');
         }
      } catch (error) {
         toast.error('Operation failed. Please try again.');
      } finally {
         setIsSubmitting(false);
      }
   };

   if (isLoading) {
      return (
         <div className="min-h-[60vh] flex flex-col items-center justify-center p-20">
            <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Syncing Registry...</p>
         </div>
      );
   }

   return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">

         {/* Header Area */}
         <div className="bg-white rounded-lg border border-gray-100 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
               <button
                  onClick={() => router.back()}
                  className="w-10 h-10 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-400 rounded-lg transition-all active:scale-90"
               >
                  <ChevronLeft size={20} />
               </button>
               <div className="h-10 w-[1px] bg-gray-100 mx-1 hidden sm:block"></div>
               <div>
                  <h1 className="text-xl font-bold text-gray-900 tracking-tight leading-none mb-1">
                     {editAssetId ? 'Modify System Asset' : 'Register New Asset'}
                  </h1>
                  <p className="text-xs text-gray-500 font-medium tracking-tight">
                     {editAssetId ? `Updating record for AST-${editAssetId.padStart(4, '0')}` : 'Provision and track a new community resource'}
                  </p>
               </div>
            </div>
            <div className="flex items-center gap-3">
               <button
                  type="button"
                  onClick={() => router.push('/societyadmin/asset-list')}
                  className="px-5 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors"
               >
                  Cancel
               </button>
               <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-md active:scale-95 transition-all flex items-center gap-2 text-xs"
               >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  <span>{editAssetId ? 'Commit Changes' : 'Initialize Asset'}</span>
               </button>
            </div>
         </div>

         <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Main Content Column */}
            <div className="lg:col-span-2 space-y-6">

               {/* Identity & Domain */}
               <Section icon={<Package size={18} />} title="Core Identity" color="blue">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <Input label="Asset Name" name="name" required value={formData.name} onChange={handleChange} placeholder="e.g. Cummins Generator 500kVA" />
                     <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Primary Category</label>
                        <select name="category" value={formData.category} onChange={handleChange} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-800 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all outline-none">
                           <option value="Electrical">Electrical</option>
                           <option value="Mechanical">Mechanical</option>
                           <option value="Amenities">Amenities</option>
                           <option value="Infrastructure">Infrastructure</option>
                        </select>
                     </div>
                     <Input label="Sub-Type / Model" name="sub_type" value={formData.sub_type} onChange={handleChange} placeholder="e.g. Diesel Silent Series" />
                     <div className="md:col-span-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1 mb-1 block">Description</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all outline-none" placeholder="Technical specifications, serial numbers..." />
                     </div>
                  </div>
               </Section>

               {/* Location Details */}
               <Section icon={<MapPin size={18} />} title="Deployment Station" color="red">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <Input label="Zone / Wing" name="block_wing" value={formData.block_wing} onChange={handleChange} placeholder="e.g. Utility Block A" />
                     <Input label="Floor Level" name="floor" value={formData.floor} onChange={handleChange} placeholder="e.g. Basement 1" />
                     <div className="md:col-span-2">
                        <Input label="Exact Coordinates" name="exact_location" value={formData.exact_location} onChange={handleChange} placeholder="e.g. Next to fire exit pump #4" />
                     </div>
                  </div>
               </Section>

               {/* Custody */}
               <Section icon={<Users size={18} />} title="Custody & Ownership" color="orange">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Ownership Model</label>
                        <select name="owned_by" value={formData.owned_by} onChange={handleChange} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-800 outline-none">
                           <option value="society">Society Managed</option>
                           <option value="vendor">Partner Leased</option>
                        </select>
                     </div>
                     {formData.owned_by === 'vendor' && (
                        <div className="space-y-1.5">
                           <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Service Partner</label>
                           <select name="vendor_id" value={formData.vendor_id} onChange={handleChange} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-800 outline-none">
                              <option value="">Select Partner...</option>
                              {vendors.map(v => (
                                 <option key={v.id} value={v.id}>{v.name}</option>
                              ))}
                           </select>
                        </div>
                     )}
                     <Input label="Assigned Staff ID" name="assigned_staff_id" type="number" value={formData.assigned_staff_id} onChange={handleChange} placeholder="Employee ID of custodian" />
                  </div>
               </Section>

               {/* Maintenance Policy */}
               <Section icon={<Wrench size={18} />} title="SLA & Maintenance" color="purple">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Maintenance Type</label>
                        <select name="maintenance_type_policy" value={formData.maintenance_type_policy} onChange={handleChange} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-800 outline-none">
                           <option value="none">None / Reactive</option>
                           <option value="amc">AMC (Periodic Contract)</option>
                           <option value="on_demand">Incident Based</option>
                        </select>
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Check-up Frequency</label>
                        <select name="maintenance_frequency" value={formData.maintenance_frequency} onChange={handleChange} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-800 outline-none">
                           <option value="none">N/A</option>
                           <option value="monthly">Monthly Audit</option>
                           <option value="quarterly">Quarterly Tune-up</option>
                           <option value="yearly">Annual Overhaul</option>
                        </select>
                     </div>
                     <Input label="Last Service Date" name="last_service_date" type="date" value={formData.last_service_date} onChange={handleChange} />
                     <Input label="Next Planned Audit" name="next_service_date" type="date" value={formData.next_service_date} onChange={handleChange} />
                  </div>
               </Section>

               {/* Accounting & Financials */}
               <Section icon={<DollarSign size={18} />} title="Accounting & Financials" color="blue">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <Input label="Purchase Cost (₹)" name="purchase_cost" type="number" required value={formData.purchase_cost} onChange={handleChange} placeholder="₹ 0.00" />
                     <Input label="Purchase Date" name="purchase_date" type="date" value={formData.purchase_date} onChange={handleChange} />
                     <Input label="Invoice Number" name="invoice_number" value={formData.invoice_number} onChange={handleChange} placeholder="e.g. INV/2024/001" />
                  </div>
               </Section>

               {/* Depreciation & Valuation (Conditional) */}
               {Number(formData.purchase_cost) > 0 && (
                  <Section icon={<TrendingDown size={18} />} title="Depreciation & Valuation" color="emerald">
                     <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                           <Input label="Useful Life (Years)" name="useful_life_years" type="number" value={formData.useful_life_years} onChange={handleChange} placeholder="e.g. 5" />
                           <Input label="Scrap Value (₹)" name="scrap_value" type="number" value={formData.scrap_value} onChange={handleChange} placeholder="₹ 0.00" />
                           <div className="space-y-1.5">
                              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Depreciation Method</label>
                              <select name="depreciation_method" value={formData.depreciation_method} onChange={handleChange} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-800 outline-none">
                                 <option value="SLM">Straight Line (SLM)</option>
                              </select>
                           </div>
                        </div>

                        {/* Inline Validation & Preview */}
                        <div className="flex flex-col md:flex-row gap-4">
                           {monthlyDepreciation > 0 ? (
                              <div className="flex-1 p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center gap-4 animate-in zoom-in duration-300">
                                 <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white shadow-lg">
                                    <Calculator size={20} />
                                 </div>
                                 <div>
                                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1">Estimated Monthly Depreciation</p>
                                    <p className="text-lg font-black text-gray-900 tracking-tighter leading-none">₹{monthlyDepreciation.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                                 </div>
                              </div>
                           ) : (
                              <div className="flex-1 p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-4">
                                 <Info size={20} className="text-gray-400" />
                                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Enter Useful Life to calculate depreciation</p>
                              </div>
                           )}

                           {Number(formData.scrap_value) > Number(formData.purchase_cost) && (
                              <div className="flex-1 p-4 bg-red-50 rounded-xl border border-red-100 flex items-center gap-4 text-red-600 animate-pulse">
                                 <Info size={20} />
                                 <p className="text-[10px] font-black uppercase tracking-widest leading-tight">Scrap value cannot exceed purchase cost</p>
                              </div>
                           )}
                        </div>
                     </div>
                  </Section>
               )}
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">

               {/* Booking Controls */}
               <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden p-6 space-y-6">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-md flex items-center justify-center">
                        <Shield size={16} />
                     </div>
                     <h3 className="font-bold text-gray-900">Reservation Logic</h3>
                  </div>

                  <div className="space-y-4">
                     <button
                        type="button"
                        onClick={() => setFormData({ ...formData, is_bookable: !formData.is_bookable })}
                        className={clsx(
                           "w-full p-4 rounded-lg flex items-center justify-between transition-all border",
                           formData.is_bookable ? "bg-emerald-50 border-emerald-100 text-emerald-900" : "bg-gray-50 border-gray-100 text-gray-500"
                        )}
                     >
                        <div className="text-left">
                           <p className="text-sm font-bold">Resident Access</p>
                           <p className="text-[10px] uppercase font-bold tracking-tight opacity-60">Allows self-booking via app</p>
                        </div>
                        {formData.is_bookable ? <CheckCircle2 size={24} className="text-emerald-500" /> : <Plus size={24} className="text-gray-300" />}
                     </button>

                     {formData.is_bookable && (
                        <div className="space-y-4 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-2">
                           <div className="grid grid-cols-2 gap-2 bg-gray-50 p-1 rounded-lg">
                              <button type="button" onClick={() => setFormData({ ...formData, pricing_model: 'free' })} className={clsx("py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all", formData.pricing_model === 'free' ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600")}>Free</button>
                              <button type="button" onClick={() => setFormData({ ...formData, pricing_model: 'paid' })} className={clsx("py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all", formData.pricing_model === 'paid' ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600")}>Paid</button>
                           </div>

                           {formData.pricing_model === 'paid' && (
                              <div className="grid grid-cols-2 gap-3">
                                 <Input label="Utility Rate" name="price" type="number" value={formData.price} onChange={handleChange} placeholder="₹ 0.00" />
                                 <Input label="Deposit" name="security_deposit" type="number" value={formData.security_deposit} onChange={handleChange} placeholder="₹ 0.00" />
                              </div>
                           )}

                           <Input label="Max Slot (Hrs)" name="max_booking_hours" type="number" value={formData.max_booking_hours} onChange={handleChange} />
                           
                           <button
                              type="button"
                              onClick={() => setFormData({ ...formData, approval_required: !formData.approval_required })}
                              className={clsx(
                                 "w-full p-3 rounded-lg flex items-center justify-between transition-all border",
                                 formData.approval_required ? "bg-blue-50 border-blue-100 text-blue-900" : "bg-gray-50 border-gray-100 text-gray-500"
                              )}
                           >
                              <div className="text-left">
                                 <p className="text-[11px] font-bold">Approval Workflow</p>
                                 <p className="text-[9px] uppercase font-bold tracking-tight opacity-60">Admin must confirm request</p>
                              </div>
                              <ShieldCheck size={20} className={formData.approval_required ? "text-blue-500" : "text-gray-300"} />
                           </button>
                        </div>
                     )}
                  </div>
               </div>

               {/* Lifecycle Status */}
               <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6 space-y-4">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-md flex items-center justify-center">
                        <Target size={16} />
                     </div>
                     <h3 className="font-bold text-gray-900">Health & Lifecycle</h3>
                  </div>
                  <div className="space-y-4">
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Global Status</label>
                        <select name="status" value={formData.status} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 outline-none">
                           <option value="active">Operational</option>
                           <option value="under_maintenance">Technical Hold</option>
                           <option value="decommissioned">Decommissioned</option>
                        </select>
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Material Condition</label>
                        <select name="condition_status" value={formData.condition_status} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 outline-none">
                           <option value="new">Factory New</option>
                           <option value="good">Optimal</option>
                           <option value="fair">Aged / Functional</option>
                           <option value="poor">Critical / Damaged</option>
                        </select>
                     </div>
                     <Input label="Instal. Date" name="installation_date" type="date" value={formData.installation_date} onChange={handleChange} />
                     <Input label="Warranty End" name="warranty_expiry" type="date" value={formData.warranty_expiry} onChange={handleChange} />
                  </div>
               </div>

               {/* Media & Docs */}
               <div className="bg-blue-600 rounded-lg p-6 text-white shadow-xl shadow-blue-200">
                  <div className="flex items-center gap-2 mb-4">
                     <ImageIcon size={20} className="text-blue-200" />
                     <h3 className="font-bold text-sm">Media & Compliance</h3>
                  </div>
                  <div className="space-y-3">
                     <MediaUpload
                        label="Proof of Purchase"
                        icon={<FileText size={18} />}
                        isUploading={uploadState.invoice}
                        isUploaded={!!formData.invoice_url}
                        onFileSelect={async (file) => {
                           setUploadState(p => ({ ...p, invoice: true }));
                           try {
                              const res = await uploadFiles('asset-invoices', [file]);
                              if (res?.data?.files?.[0]?.url) {
                                 setFormData((p: any) => ({ ...p, invoice_url: res.data.files[0].url }));
                                 toast.success('Invoiced sync success');
                              }
                           } catch (err) { toast.error('Upload failed'); }
                           finally { setUploadState(p => ({ ...p, invoice: false })); }
                        }}
                     />
                     <MediaUpload
                        label="Asset Visual Identity"
                        icon={<ImageIcon size={18} />}
                        isUploading={uploadState.image}
                        isUploaded={!!formData.image_url}
                        onFileSelect={async (file) => {
                           setUploadState(p => ({ ...p, image: true }));
                           try {
                              const res = await uploadFiles('asset-images', [file]);
                              if (res?.data?.files?.[0]?.url) {
                                 setFormData((p: any) => ({ ...p, image_url: res.data.files[0].url }));
                                 toast.success('Asset visual updated');
                              }
                           } catch (err) { toast.error('Upload failed'); }
                           finally { setUploadState(p => ({ ...p, image: false })); }
                        }}
                     />
                  </div>
               </div>
            </div>
         </form>
      </div>
   );
}

function Section({ icon, title, children, color }: any) {
   const colors: any = {
      blue: 'bg-blue-50 text-blue-600',
      red: 'bg-red-50 text-red-600',
      orange: 'bg-orange-50 text-orange-600',
      purple: 'bg-purple-50 text-purple-600',
      emerald: 'bg-emerald-50 text-emerald-600'
   };

   return (
      <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
         <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-3">
            <div className={clsx("w-9 h-9 flex items-center justify-center rounded-lg shadow-sm border", colors[color])}>
               {icon}
            </div>
            <h2 className="font-bold text-gray-900 tracking-tight">{title}</h2>
         </div>
         <div className="p-6">
            {children}
         </div>
      </div>
   );
}

function Input({ label, name, type = "text", required, value, onChange, placeholder }: any) {
   return (
      <div className="space-y-1.5 flex flex-col">
         <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">
            {label} {required && <span className="text-red-400">*</span>}
         </label>
         <input
            name={name}
            type={type}
            required={required}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-800 placeholder:text-gray-300 placeholder:font-medium focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all outline-none"
         />
      </div>
   );
}

function MediaUpload({ label, icon, isUploading, isUploaded, onFileSelect }: any) {
   return (
      <label className="relative flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg cursor-pointer transition-all group overflow-hidden">
         <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => e.target.files?.[0] && onFileSelect(e.target.files[0])} />
         <div className="flex items-center gap-3">
            <div className="text-blue-200 group-hover:scale-110 transition-transform">{icon}</div>
            <span className="text-[11px] font-bold text-white/90">{label}</span>
         </div>
         <div className="flex items-center gap-2">
            {isUploading ? (
               <Loader2 size={16} className="animate-spin text-white/50" />
            ) : isUploaded ? (
               <CheckCircle2 size={16} className="text-emerald-400" />
            ) : (
               <CloudUpload size={16} className="text-white/40 group-hover:text-white transition-colors" />
            )}
         </div>
         {isUploaded && <div className="absolute bottom-0 left-0 h-0.5 bg-emerald-400 animate-in slide-in-from-left duration-1000" style={{ width: '100%' }} />}
      </label>
   );
}
