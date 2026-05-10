'use client';

import React, { useState, useEffect } from 'react';
import {
   Users, Plus, Search, ShieldCheck, Mail, Phone,
   Trash2, Edit,
   Briefcase, X, Save, Loader2,
   Inbox
} from 'lucide-react';
import { getVendorsList, onboardVendor, updateVendorStatus, updateVendor, deleteVendor } from '@/lib/apiClient';
import { toast } from 'react-hot-toast';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface Vendor {
   id: number;
   name: string;
   business_name: string;
   vendor_type: string;
   phone: string;
   email: string;
   status: 'active' | 'inactive' | 'blacklisted';
   pan_number?: string;
   gst_number?: string;
   address?: string;
   specialization?: string;
   service_rating?: number;
}

export default function AssetVendors() {
   const router = useRouter();
   const [vendors, setVendors] = useState<Vendor[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [filterType, setFilterType] = useState('All');
   const [searchQuery, setSearchQuery] = useState('');
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [editVendor, setEditVendor] = useState<Vendor | null>(null);
   const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

   const fetchVendors = async () => {
      setIsLoading(true);
      try {
         const res = await getVendorsList();
         if (res.success) setVendors(res.data || []);
      } catch {
         toast.error('Failed to load vendors');
      } finally {
         setIsLoading(false);
      }
   };

   useEffect(() => {
      fetchVendors();
   }, []);

   const filteredVendors = vendors.filter(v => {
      const matchesFilter = filterType === 'All' || v.vendor_type === filterType;
      const matchesSearch = v.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         v.business_name?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
   });

   const handleStatusChange = async (id: number, status: string) => {
      try {
         const res = await updateVendorStatus(id, status);
         if (res.success) {
            toast.success(`Partner marked as ${status}`);
            fetchVendors();
         }
      } catch {
         toast.error('Update failed');
      }
   };

   const handleDelete = async (id: number) => {
      if (!window.confirm('Are you sure you want to remove this partner record?')) return;
      try {
         const res = await deleteVendor(id);
         if (res.success) {
            toast.success('Partner removed');
            fetchVendors();
         }
      } catch (err: any) {
         toast.error(err.message || 'Delete failed');
      }
   };

   if (isLoading) {
      return (
         <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
            <RefreshCw className="animate-spin text-blue-600" size={40} />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">Syncing Partner Registry...</p>
         </div>
      );
   }

   return (
      <div className="space-y-6 animate-in fade-in duration-500 pb-20 font-sans">
         <AnimatePresence>
            {isModalOpen && (
               <VendorModal
                  onClose={() => { setIsModalOpen(false); setEditVendor(null); }}
                  onSuccess={() => { setIsModalOpen(false); setEditVendor(null); fetchVendors(); }}
                  initialData={editVendor}
               />
            )}
            {selectedVendor && (
               <VendorProfileDrawer
                  vendor={selectedVendor}
                  onClose={() => setSelectedVendor(null)}
                  onEdit={() => { setEditVendor(selectedVendor); setIsModalOpen(true); setSelectedVendor(null); }}
               />
            )}
         </AnimatePresence>

         {/* Header Section */}
         <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2">
            <div className="flex items-center gap-3">

               <div>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none mb-1">Partner Ecosystem</h1>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">Vendor & Service Network Management</p>
               </div>
            </div>


         </div>

         <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Operational Controls */}
            <div className="lg:col-span-3 space-y-6">
               <div className="bg-white p-8 rounded-none border border-slate-200 shadow-sm space-y-8">
                  <div className="space-y-4">
                     <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 leading-none">Global Search</h3>
                     <div className="relative group">
                        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                        <input
                           type="text"
                           placeholder="SEARCH PARTNERS..."
                           value={searchQuery}
                           onChange={e => setSearchQuery(e.target.value)}
                           className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-none text-[10px] font-bold tracking-widest focus:bg-white transition-all outline-none uppercase"
                        />
                     </div>
                  </div>

                  <div className="space-y-4">
                     <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 leading-none">Sector Filter</h3>
                     <div className="flex flex-col gap-2">
                        {['All', 'Service', 'Supply', 'Maintenance'].map(t => (
                           <button
                              key={t}
                              onClick={() => setFilterType(t)}
                              className={clsx(
                                 "w-full text-left px-5 py-2.5 rounded-none text-[10px] font-bold uppercase tracking-widest border transition-all shadow-sm",
                                 filterType === t ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-400 border-slate-100 hover:text-slate-900"
                              )}
                           >
                              {t} Partners
                           </button>
                        ))}
                     </div>
                  </div>


               </div>
            </div>

            {/* Partner Registry */}
            <div className="lg:col-span-9 space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredVendors.length > 0 ? filteredVendors.map((v, i) => (
                     <motion.div
                        key={v.id}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-white p-8 rounded-none border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all group relative overflow-hidden flex flex-col"
                     >
                        {/* Status Badge */}
                        <div className="absolute top-8 right-8">
                           <span className={clsx(
                              "px-2 py-0.5 rounded-none text-[9px] font-bold uppercase tracking-widest border shadow-sm",
                              v.status === 'active' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                 v.status === 'blacklisted' ? "bg-red-50 text-red-700 border-red-100" :
                                    "bg-slate-50 text-slate-400 border-slate-200"
                           )}>
                              {v.status}
                           </span>
                        </div>

                        <div className="flex-1 space-y-6">
                           <div className="flex items-center gap-5">
                              <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-none flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                 <Users size={24} />
                              </div>
                              <div>
                                 <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight group-hover:text-blue-600 transition-colors">{v.business_name}</h3>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Rep: {v.name}</p>
                              </div>
                           </div>

                           <div className="grid grid-cols-2 gap-4">
                              <div className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-none border border-slate-50">
                                 <Phone size={14} className="text-blue-600" />
                                 <span className="text-[10px] font-bold text-slate-600 tabular-nums uppercase">{v.phone}</span>
                              </div>
                              <div className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-none border border-slate-50 overflow-hidden">
                                 <Mail size={14} className="text-blue-600 shrink-0" />
                                 <span className="text-[10px] font-bold text-slate-600 truncate uppercase">{v.email}</span>
                              </div>
                           </div>

                           <div className="flex items-center gap-2">
                              <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-none border border-blue-100 uppercase tracking-widest">
                                 {v.vendor_type} Partner
                              </span>
                              {v.specialization && (
                                 <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-none border border-slate-100 uppercase tracking-widest">
                                    {v.specialization}
                                 </span>
                              )}
                           </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                           <button
                              onClick={() => setSelectedVendor(v)}
                              className="text-[9px] font-bold text-blue-600 uppercase tracking-widest hover:text-black transition-colors"
                           >
                              View Profile
                           </button>
                           <div className="flex items-center gap-1">
                              <button
                                 onClick={() => { setEditVendor(v); setIsModalOpen(true); }}
                                 className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white border border-transparent hover:border-slate-200 rounded-none transition-all"
                              ><Edit size={16} /></button>
                              <button
                                 onClick={() => handleStatusChange(v.id, v.status === 'active' ? 'inactive' : 'active')}
                                 className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-white border border-transparent hover:border-slate-200 rounded-none transition-all"
                              ><ShieldCheck size={16} /></button>
                              <button
                                 onClick={() => handleDelete(v.id)}
                                 className="p-2 text-slate-400 hover:text-red-600 hover:bg-white border border-transparent hover:border-slate-200 rounded-none transition-all"
                              ><Trash2 size={16} /></button>
                           </div>
                        </div>
                     </motion.div>
                  )) : (
                     <div className="col-span-2 py-32 text-center bg-white rounded-none border border-slate-200 shadow-sm border-dashed">
                        <Inbox size={40} className="mx-auto mb-4 text-slate-100" />
                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No Partner Intelligence Found</p>
                     </div>
                  )}
               </div>
            </div>
         </div>
      </div>
   );
}

function VendorModal({ onClose, onSuccess, initialData }: { onClose: () => void, onSuccess: () => void, initialData?: Vendor | null }) {
   const [formData, setFormData] = useState({
      name: initialData?.name || '',
      business_name: initialData?.business_name || '',
      vendor_type: initialData?.vendor_type || 'Service',
      phone: initialData?.phone || '',
      email: initialData?.email || '',
      pan_number: initialData?.pan_number || '',
      gst_number: initialData?.gst_number || '',
      address: initialData?.address || '',
      specialization: initialData?.specialization || ''
   });
   const [isSubmitting, setIsSubmitting] = useState(false);

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      try {
         const res = initialData
            ? await updateVendor(initialData.id, formData)
            : await onboardVendor(formData);
         if (res.success) {
            toast.success(initialData ? 'Profile Synchronized' : 'Partner Onboarded');
            onSuccess();
         }
      } catch (err: any) {
         toast.error(err.message || 'Transmission Failure');
      } finally {
         setIsSubmitting(false);
      }
   };

   return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
         <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white w-full max-w-2xl rounded-none shadow-2xl overflow-hidden border border-slate-200"
         >
            <div className="p-8 bg-slate-900 text-white flex justify-between items-center relative overflow-hidden">
               <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 bg-white/10 rounded-none flex items-center justify-center backdrop-blur-md border border-white/20">
                     <Plus size={24} />
                  </div>
                  <div>
                     <h2 className="text-xl font-bold tracking-tight uppercase leading-none">{initialData ? 'Update Profile' : 'Onboard Partner'}</h2>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Ecosystem Entry Protocol</p>
                  </div>
               </div>
               <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-none transition-all border border-white/10 active:scale-90 relative z-10"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-10 space-y-10">
               <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Legal Business Name *</label>
                     <input required value={formData.business_name} onChange={e => setFormData({ ...formData, business_name: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-none text-xs font-bold text-slate-900 focus:bg-white transition-all outline-none uppercase" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Primary Representative *</label>
                     <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-none text-xs font-bold text-slate-900 focus:bg-white transition-all outline-none uppercase" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Contact Protocol (Phone) *</label>
                     <input required value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-none text-xs font-bold text-slate-900 focus:bg-white transition-all outline-none uppercase" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Communications (Email) *</label>
                     <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-none text-xs font-bold text-slate-900 focus:bg-white transition-all outline-none uppercase" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Partner Sector</label>
                     <select value={formData.vendor_type} onChange={e => setFormData({ ...formData, vendor_type: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-none text-xs font-bold text-slate-900 outline-none uppercase">
                        <option value="Service">Service Partner</option>
                        <option value="Supply">Supply Chain</option>
                        <option value="Maintenance">Maintenance Crew</option>
                     </select>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Specialization Focus</label>
                     <input value={formData.specialization} onChange={e => setFormData({ ...formData, specialization: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-none text-xs font-bold text-slate-900 focus:bg-white transition-all outline-none uppercase" placeholder="E.G. HVAC, ELECTRICAL, SECURITY" />
                  </div>
               </div>

               <div className="pt-6 border-t border-slate-100 flex justify-end gap-4">
                  <button type="button" onClick={onClose} className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all">Abort Protocol</button>
                  <button
                     type="submit"
                     disabled={isSubmitting}
                     className="min-w-[180px] flex items-center justify-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-none text-[10px] font-bold uppercase tracking-widest shadow-lg hover:bg-blue-600 transition-all active:scale-95"
                  >
                     {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <><Save size={14} /> Finalize Entry</>}
                  </button>
               </div>
            </form>
         </motion.div>
      </div>
   );
}

function VendorProfileDrawer({ vendor, onClose, onEdit }: { vendor: Vendor, onClose: () => void, onEdit: () => void }) {
   return (
      <div className="fixed inset-0 z-[120] flex justify-end">
         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
         <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="w-full max-w-lg bg-white h-full shadow-2xl relative flex flex-col border-l border-slate-200 rounded-none"
         >
            <div className="p-8 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10 shrink-0">
               <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-slate-900 text-white rounded-none flex items-center justify-center shadow-xl border border-slate-800">
                     <Users size={24} />
                  </div>
                  <div>
                     <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight leading-none">{vendor.business_name}</h2>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Partner ID: #{vendor.id}</p>
                  </div>
               </div>
               <button onClick={onClose} className="p-2.5 hover:bg-slate-50 rounded-none transition-all border border-transparent hover:border-slate-100 text-slate-400"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar pb-32">
               <div className="space-y-6">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 leading-none border-b border-slate-100 pb-4">Intelligence Metadata</h3>
                  <div className="grid grid-cols-1 gap-6">
                     <div className="p-6 bg-slate-50 border border-slate-100 rounded-none space-y-6 hover:bg-white hover:shadow-lg transition-all">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <ShieldCheck size={18} className="text-blue-600" />
                              <p className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Compliance Logic</p>
                           </div>
                           <span className={clsx("px-2 py-0.5 rounded-none text-[9px] font-bold uppercase border tracking-wider", vendor.status === 'active' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-700 border-red-100")}>{vendor.status}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-200/50">
                           <div>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-2 opacity-70">PAN REGISTRY</p>
                              <p className="text-sm font-bold text-slate-900 tabular-nums uppercase">{vendor.pan_number || 'PENDING'}</p>
                           </div>
                           <div>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-2 opacity-70">GST PROTOCOL</p>
                              <p className="text-sm font-bold text-slate-900 tabular-nums uppercase">{vendor.gst_number || 'PENDING'}</p>
                           </div>
                        </div>
                     </div>

                     <div className="p-6 bg-slate-50 border border-slate-100 rounded-none space-y-4 hover:bg-white hover:shadow-lg transition-all">
                        <div className="flex items-center gap-3">
                           <Mail size={18} className="text-blue-600" />
                           <p className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Operations Address</p>
                        </div>
                        <p className="text-xs font-bold text-slate-500 leading-relaxed uppercase italic opacity-80">{vendor.address || 'NO PHYSICAL ADDRESS REGISTERED'}</p>
                     </div>
                  </div>
               </div>
            </div>

            <div className="p-8 border-t border-slate-100 bg-white sticky bottom-0 z-10 shrink-0">
               <button
                  onClick={onEdit}
                  className="w-full py-4 bg-slate-900 text-white rounded-none font-bold uppercase text-[10px] tracking-widest shadow-xl hover:bg-blue-600 transition-all active:scale-95"
               >
                  Modify Ecosystem Profile
               </button>
            </div>
         </motion.div>
      </div>
   );
}

function RefreshCw(props: any) {
   return (
      <svg
         {...props}
         xmlns="http://www.w3.org/2000/svg"
         width="24"
         height="24"
         viewBox="0 0 24 24"
         fill="none"
         stroke="currentColor"
         strokeWidth="2"
         strokeLinecap="round"
         strokeLinejoin="round"
      >
         <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
         <path d="M21 3v5h-5" />
         <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
         <path d="M3 21v-5h5" />
      </svg>
   )
}
