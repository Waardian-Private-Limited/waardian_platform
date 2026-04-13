'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Search, Filter, ShieldCheck, Mail, Phone, 
  MapPin, CreditCard, Wrench, Calendar, FileText, 
  Trash2, Edit, CheckCircle2, AlertCircle, MoreVertical,
  Briefcase, Globe, Star, ChevronRight, X, Save, FilePlus, Loader2,
  History as HistoryIcon, Clock, ArrowUpRight
} from 'lucide-react';
import { getVendorsList, onboardVendor, updateVendorStatus, getVendorDetails, updateVendor, deleteVendor } from '@/lib/apiClient';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

export default function AssetVendors() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editVendor, setEditVendor] = useState<any>(null);
  const [selectedVendor, setSelectedVendor] = useState<any>(null);

  const fetchVendors = async () => {
    setIsLoading(true);
    try {
      const res = await getVendorsList();
      if (res.success) setVendors(res.data || []);
    } catch (err) {
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
    } catch (err) {
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
      <div className="min-h-[60vh] flex items-center justify-center bg-transparent">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-500 font-medium">Loading Partners...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {(isModalOpen || editVendor) && (
        <VendorOnboardingModal 
          vendor={editVendor}
          onClose={() => { setIsModalOpen(false); setEditVendor(null); }} 
          onSuccess={() => { setIsModalOpen(false); setEditVendor(null); fetchVendors(); }}
        />
      )}

      {/* Header Area */}
      <div className="bg-white rounded-lg border border-gray-100 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/10">
              <ShieldCheck className="text-white w-6 h-6" />
           </div>
           <div>
             <h1 className="text-xl font-bold text-gray-900 tracking-tight leading-none mb-1">Vendors & Partners</h1>
             <p className="text-xs text-gray-500 font-medium tracking-tight">Manage your trusted service providers and maintenance teams</p>
           </div>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold shadow-md active:scale-95 transition-all flex items-center gap-2 text-sm"
        >
          <Plus size={18} /> Enroll Partner
        </button>
      </div>

      {/* Controls Bar */}
      <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
           <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-600 transition-colors" size={18} />
              <input 
                type="text"
                placeholder="Locate partner by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-6 py-2.5 bg-gray-50 border-none rounded-lg text-sm font-medium text-gray-900 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-400"
              />
           </div>
           <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {['All', 'AMC', 'Electrical', 'Plumbing', 'Security', 'Cleaning', 'DG'].map(type => (
                 <button
                   key={type}
                   onClick={() => setFilterType(type)}
                   className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                      filterType === type ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                   }`}
                 >
                   {type}
                 </button>
              ))}
           </div>
        </div>
      </div>

      {/* Grid Container */}
      {filteredVendors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          {filteredVendors.map(vendor => (
            <VendorCard 
              key={vendor.id} 
              vendor={vendor} 
              onStatusChange={handleStatusChange} 
              onEdit={() => setEditVendor(vendor)}
              onDelete={() => handleDelete(vendor.id)}
              onView={() => setSelectedVendor(vendor)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-100 py-32 text-center shadow-sm">
           <Briefcase size={60} className="mx-auto text-gray-100 mb-6" />
           <h3 className="font-bold text-gray-900 text-lg">No Partners Found</h3>
           <p className="text-sm text-gray-400 font-medium mt-2">Add service providers to track maintenance cycles.</p>
        </div>
      )}

      {selectedVendor && (
         <VendorDetailModal 
            vendor={selectedVendor} 
            onClose={() => setSelectedVendor(null)} 
         />
      )}
    </div>
  );
}

function VendorCard({ vendor, onStatusChange, onView, onEdit, onDelete }: any) {
  const statusColors: any = {
    active: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    inactive: 'text-gray-400 bg-gray-50 border-gray-100',
    blacklisted: 'text-red-600 bg-red-50 border-red-100'
  };

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all group flex flex-col h-full relative overflow-hidden">
      
      <div className="flex justify-between items-start mb-6">
        <div className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${statusColors[vendor.status || 'active']}`}>
           {vendor.status || 'Active'}
        </div>
        <div className="flex items-center gap-2">
           <button onClick={onEdit} className="p-2 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-lg transition-all">
              <Edit size={16} />
           </button>
           <button onClick={onDelete} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-all">
              <Trash2 size={16} />
           </button>
        </div>
      </div>

      <div className="space-y-4 flex-1">
        <div onClick={onView} className="cursor-pointer">
           <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors uppercase truncate">{vendor.name}</h3>
           <p className="text-xs text-gray-400 font-medium truncate">{vendor.business_name || 'Partner Specialist'}</p>
        </div>

        <div className="flex items-center gap-3 py-4 border-y border-gray-50">
           <div className="w-10 h-10 bg-gray-50 text-gray-400 rounded-lg flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
              <Briefcase size={20} />
           </div>
           <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Domain</p>
              <p className="text-xs font-bold text-gray-800">{vendor.vendor_type || 'Generalist'}</p>
           </div>
        </div>

        <div className="space-y-2.5">
           <div className="flex items-center gap-3 text-gray-500 font-medium text-xs">
              <Phone size={14} className="text-gray-300" />
              <span>{vendor.phone}</span>
           </div>
           <div className="flex items-center gap-3 text-gray-500 font-medium text-xs">
              <Mail size={14} className="text-gray-300" />
              <span className="truncate">{vendor.email || 'No Public Email'}</span>
           </div>
        </div>
      </div>

      <div className="mt-8 flex gap-2">
         <button 
            onClick={onView}
            className="flex-1 py-2.5 bg-gray-50 text-gray-700 hover:bg-blue-600 hover:text-white rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2"
          >
            Performance Records
            <ArrowUpRight size={14} />
         </button>
         <button 
           onClick={() => onStatusChange(vendor.id, vendor.status === 'active' ? 'inactive' : 'active')}
           className={`px-3 flex items-center justify-center rounded-lg border transition-all ${
              vendor.status === 'active' ? 'bg-white border-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500 hover:border-red-100' : 'bg-emerald-50 border-emerald-100 text-emerald-600'
           }`}
           title={vendor.status === 'active' ? 'Deactivate' : 'Activate'}
         >
           <ShieldCheck size={18} />
         </button>
      </div>
    </div>
  );
}

function VendorOnboardingModal({ vendor, onClose, onSuccess }: any) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: vendor?.name || '', 
    business_name: vendor?.business_name || '', 
    vendor_type: vendor?.vendor_type || '', 
    contact_person: vendor?.contact_person || '', 
    phone: vendor?.phone || '', 
    email: vendor?.email || '',
    address: vendor?.address || '', 
    city: vendor?.city || 'Pune', 
    state: vendor?.state || 'Maharashtra', 
    pincode: vendor?.pincode || '',
    gst_number: vendor?.gst_number || '', 
    pan_number: vendor?.pan_number || '', 
    license_number: vendor?.license_number || '',
    bank_name: vendor?.bank_name || '', 
    account_number: vendor?.account_number || '', 
    ifsc_code: vendor?.ifsc_code || '', 
    upi_id: vendor?.upi_id || '',
    services_provided: vendor?.services_provided || '', 
    availability: vendor?.availability || 'working_hours', 
    response_time: vendor?.response_time || 'within 4 hours',
    provides_amc: vendor?.provides_amc || false, 
    amc_types: vendor?.amc_types || '', 
    notes: vendor?.notes || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = vendor 
        ? await updateVendor(vendor.id, formData)
        : await onboardVendor(formData);
        
      if (res.success) {
        toast.success(vendor ? 'Partner Details Updated' : 'Partner Enrolled');
        onSuccess();
      }
    } catch (err: any) {
      toast.error(err.message || 'Operation Failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-lg shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
          <h2 className="text-xl font-bold text-gray-800">{vendor ? 'Modify Partner' : 'Enroll Partner'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"><X size={20} /></button>
        </div>

        <form id="onboard-vendor-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
           {/* Section 1: Identity */}
           <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400">Identity & Domain</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <Input label="Partner Name" placeholder="e.g. Acme Tech Solutions" required value={formData.name} onChange={(v: string) => setFormData({...formData, name: v})} />
                 <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Specialization</label>
                    <select 
                      required
                      value={formData.vendor_type}
                      onChange={e => setFormData({...formData, vendor_type: e.target.value})}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md font-medium text-gray-700 focus:ring-2 focus:ring-blue-500 transition-all shadow-sm outline-none"
                    >
                       <option value="">Select Domain...</option>
                       <option value="AMC">AMC Specialist</option>
                       <option value="Electrical">Power Systems</option>
                       <option value="Plumbing">Fluid Dynamics</option>
                       <option value="Security">Asset Security</option>
                       <option value="DG">Lift/DG Response</option>
                    </select>
                 </div>
              </div>
           </div>

           {/* Section 2: Contact */}
           <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400">Communication Channels</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <Input label="Primary Mobile" placeholder="+91..." required value={formData.phone} onChange={(v: string) => setFormData({...formData, phone: v})} />
                 <Input label="Business Email" placeholder="partner@domain.com" value={formData.email} onChange={(v: string) => setFormData({...formData, email: v})} />
              </div>
           </div>

           {/* Section 3: SLA */}
           <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400">Operational SLA</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-1.5 flex flex-col justify-end">
                    <label className="text-sm font-medium text-gray-700">Availability Range</label>
                    <select 
                      value={formData.availability}
                      onChange={e => setFormData({...formData, availability: e.target.value})}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md font-medium text-gray-700 focus:ring-2 focus:ring-blue-500 shadow-sm outline-none"
                    >
                       <option value="working_hours">Standard Ops (9-6)</option>
                       <option value="24_7">Emergency Rapid Response</option>
                       <option value="on_call">Flexible / Incident Based</option>
                    </select>
                 </div>
                 <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100 shadow-sm">
                    <div className="flex-1">
                       <p className="text-sm font-bold text-gray-800 tracking-tight">AMC Authorized?</p>
                       <p className="text-[10px] text-gray-400 font-medium">Can handle periodic maintenance</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, provides_amc: !formData.provides_amc})}
                      className={`w-12 h-7 rounded-full transition-all relative ${formData.provides_amc ? 'bg-blue-600' : 'bg-gray-200'}`}
                    >
                       <div className={`absolute top-1 w-5 h-5 rounded-full shadow-sm transition-all ${formData.provides_amc ? 'right-1 bg-white' : 'left-1 bg-white'}`} />
                    </button>
                 </div>
              </div>
           </div>
        </form>

        <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
           <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Cancel</button>
           <button 
             form="onboard-vendor-form"
             type="submit"
             disabled={isSubmitting}
             className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold shadow-md flex items-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
           >
             {isSubmitting && <Loader2 size={18} className="animate-spin" />}
             {vendor ? 'Update Details' : 'Verify & Enroll'}
           </button>
        </div>
      </div>
    </div>
  );
}

function Input({ label, required, value, onChange, placeholder }: any) {
  return (
    <div className="space-y-1.5">
       <label className="text-sm font-medium text-gray-700">{label} {required && '*'}</label>
       <input 
         required={required}
         value={value}
         onChange={e => onChange(e.target.value)}
         placeholder={placeholder}
         className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md font-medium text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-400 shadow-sm"
       />
    </div>
  );
}

function VendorDetailModal({ vendor: baseVendor, onClose }: any) {
   const [vendor, setVendor] = useState<any>(baseVendor);
   const [isLoading, setIsLoading] = useState(true);

   useEffect(() => {
     const fetchDetails = async () => {
        try {
           const res = await getVendorDetails(baseVendor.id);
           if (res.success) setVendor(res.data);
        } catch (err) {
           toast.error('Sync Failed');
        } finally {
           setIsLoading(false);
        }
     };
     fetchDetails();
   }, [baseVendor.id]);

   return (
      <div className="fixed inset-0 z-[110] bg-black/50 backdrop-blur-sm flex items-center justify-end p-4">
         <div className="bg-white h-full w-full max-w-xl rounded-lg shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-500 border-l border-gray-100">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-start bg-white sticky top-0 z-10">
               <div>
                  <h2 className="text-xl font-bold text-gray-900 uppercase truncate max-w-[300px]">{vendor.name}</h2>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-0.5">{vendor.business_name || 'Individual Partner'}</p>
               </div>
               <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-all"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
               {/* Metrics */}
               <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 border border-gray-100 rounded-lg">
                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Services</p>
                     <p className="text-xl font-bold text-gray-900">{vendor.service_history?.length || 0}</p>
                  </div>
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                     <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Active Contracts</p>
                     <p className="text-xl font-bold text-blue-600">{vendor.active_contracts?.length || 0}</p>
                  </div>
               </div>

               {/* History */}
               <div className="space-y-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1 leading-none">Service History</h4>
                  {vendor.service_history?.length > 0 ? (
                     <div className="space-y-3">
                        {vendor.service_history.map((log: any, idx: number) => (
                           <div key={idx} className="p-4 border border-gray-100 rounded-lg flex items-center justify-between">
                              <div>
                                 <p className="text-sm font-bold text-gray-800">{log.asset_name}</p>
                                 <p className="text-[10px] text-gray-400 font-bold uppercase">{format(new Date(log.service_date), 'MMM dd, yyyy')}</p>
                              </div>
                              <p className="text-sm font-bold text-gray-900">₹{log.cost}</p>
                           </div>
                        ))}
                     </div>
                  ) : (
                     <div className="py-12 text-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        <HistoryIcon size={32} className="mx-auto text-gray-300 mb-2" />
                        <p className="text-xs text-gray-400 font-bold uppercase">No history</p>
                     </div>
                  )}
               </div>
            </div>
         </div>
      </div>
   );
}
