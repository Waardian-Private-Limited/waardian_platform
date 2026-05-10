import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  Calendar, 
  User, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search,
  Users,
  AlertTriangle,
  ArrowRight,
  PlusCircle,
  Hash,
  ChevronRight,
  HardHat,
  Smartphone
} from 'lucide-react';
import { apiClient } from '@/lib/apiClient';

interface WorkPermissionRequest {
  id: number;
  resident_name: string;
  flat_number: string;
  wing_name: string;
  work_type: 'Plumbing' | 'Electrical' | 'Interior' | 'Furniture' | 'Other';
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  time_slot: string;
  worker_name: string;
  worker_contact: string;
  worker_count: number;
  noise_involved: boolean;
  status: 'pending' | 'approved' | 'in_progress' | 'completed' | 'rejected';
  admin_remarks?: string;
}

export default function WorkPermissionManagement() {
  const [requests, setRequests] = useState<WorkPermissionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<WorkPermissionRequest | null>(null);
  const [filter, setFilter] = useState('all');
  const [remarks, setRemarks] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await apiClient('/work/maintenance/list', { method: 'GET', withAuth: true });
      if (res.success) setRequests(res.data);
    } catch (error) {
       console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAdmin = async (id: number, status: string) => {
    try {
      const response = await apiClient(`/work/maintenance/admin/${id}`, {
        method: 'PUT',
        body: {
          status,
          remarks
        },
        withAuth: true
      });
      if (response.success) {
        fetchRequests();
        setSelectedRequest(null);
        setRemarks('');
      }
    } catch (error) {
      alert('Error updating status');
    }
  };

  const handleInProgress = async (id: number) => {
    try {
      const response = await apiClient(`/work/maintenance/admin/${id}`, {
        method: 'PUT',
        body: { status: 'in_progress', remarks: 'Work started' },
        withAuth: true
      });
      if (response.success) {
        fetchRequests();
        setSelectedRequest(null);
      }
    } catch (error) {
      alert('Error updating status');
    }
  };

  const handleComplete = async (id: number) => {
    try {
      const response = await apiClient(`/work/maintenance/complete/${id}`, {
        method: 'PUT',
        body: {
          status: 'completed',
          notes: remarks
        },
        withAuth: true
      });
      if (response.success) {
        fetchRequests();
        setSelectedRequest(null);
        setRemarks('');
      }
    } catch (error) {
      alert('Error completing request');
    }
  };

  const filtered = requests.filter(r => 
    filter === 'all' ? true : r.status === filter
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Wrench className="w-8 h-8 text-blue-600" />
            Work Permissions
          </h1>
          <p className="text-gray-500 text-sm mt-1">Single approval system for all flat work and fixes.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex bg-white rounded-lg p-1 border border-gray-200 w-fit">
            {['all', 'pending', 'approved', 'in_progress', 'completed'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  filter === f ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1).replace('_', ' ')}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl font-black text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
          >
            <PlusCircle className="w-5 h-5" />
            Add Work Permission
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
         <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
               <tr>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Request Details</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Worker Info</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Action</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
               {filtered.map(request => (
                  <tr key={request.id} className="hover:bg-gray-50 transition-all group">
                     <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                              <Hash className="w-5 h-5" />
                           </div>
                           <div>
                              <p className="text-sm font-black text-gray-900 mb-0.5">{request.title}</p>
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-tight">{request.work_type} • Flat {request.wing_name}-{request.flat_number}</p>
                           </div>
                        </div>
                     </td>
                     <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                           request.status === 'pending' ? 'bg-amber-100 text-amber-600' :
                           request.status === 'completed' ? 'bg-emerald-100 text-emerald-600' :
                           request.status === 'in_progress' ? 'bg-amber-500 text-white' :
                           'bg-blue-100 text-blue-600'
                        }`}>
                           {request.status.replace('_', ' ')}
                        </span>
                     </td>
                     <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-[10px] font-bold text-blue-600 uppercase">
                             {request.worker_name ? request.worker_name[0] : '?'}
                           </div>
                           <div>
                              <p className="text-xs font-bold text-gray-700">{request.worker_name || 'No worker'}</p>
                              <p className="text-[10px] font-medium text-gray-400">{request.worker_count} Workers • {request.time_slot}</p>
                           </div>
                        </div>
                     </td>
                     <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => setSelectedRequest(request)}
                          className="p-2 border border-gray-100 rounded-xl hover:bg-white hover:border-blue-300 transition-all shadow-sm bg-white"
                        >
                           <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                        </button>
                     </td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>

      {selectedRequest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-[32px] w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
              <div className="p-8 border-b border-gray-100 flex justify-between items-start">
                 <div>
                    <h2 className="text-2xl font-black text-gray-900">{selectedRequest.title}</h2>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mt-1">Permission #{selectedRequest.id} • {selectedRequest.work_type}</p>
                 </div>
                 <button onClick={() => setSelectedRequest(null)} className="p-2 hover:bg-gray-100 rounded-full transition-all">
                    <XCircle className="w-8 h-8 text-gray-300" />
                 </button>
              </div>

              <div className="p-8 space-y-8 overflow-y-auto max-h-[70vh]">
                 <section>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">Work Summary</label>
                    <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 text-sm font-medium text-gray-600 leading-relaxed italic">
                       "{selectedRequest.description}"
                    </div>
                 </section>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                       <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">Location</p>
                       <p className="text-sm font-bold text-gray-800">{selectedRequest.wing_name} - {selectedRequest.flat_number}</p>
                       <p className="text-xs font-medium text-gray-500 mt-1">{selectedRequest.resident_name}</p>
                    </div>
                    <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                       <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">Schedule</p>
                       <p className="text-sm font-bold text-gray-800">
                          {new Date(selectedRequest.start_date).toLocaleDateString()} - {new Date(selectedRequest.end_date).toLocaleDateString()}
                       </p>
                       <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase mt-2 inline-block bg-white text-indigo-600 tracking-wider shadow-sm border border-indigo-100">
                         Slot: {selectedRequest.time_slot}
                       </span>
                    </div>
                 </div>

                 <section className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex justify-between items-center mb-5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Contractor / Worker Info</label>
                        {selectedRequest.noise_involved && (
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 rounded-full">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                                <span className="text-[10px] font-black text-amber-600 uppercase tracking-tight">Noise Involved</span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-5">
                        <div className="flex-1">
                            <p className="text-base font-black text-gray-800">{selectedRequest.worker_name}</p>
                            <p className="text-sm font-bold text-gray-400 mt-1 flex items-center gap-2">
                                <Smartphone className="w-3.5 h-3.5" />
                                {selectedRequest.worker_contact}
                            </p>
                        </div>
                        <div className="p-4 bg-white rounded-2xl border border-slate-200 text-center shadow-sm min-w-[70px]">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Workers</p>
                            <p className="text-lg font-black text-slate-800">{selectedRequest.worker_count}</p>
                        </div>
                    </div>
                 </section>

                 {selectedRequest.status === 'pending' ? (
                    <div className="space-y-4 pt-6 border-t border-gray-100">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Administrative Guidance</label>
                      <textarea 
                        className="w-full p-5 border border-gray-200 rounded-2xl bg-gray-50 text-sm h-28 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                        placeholder="Add guidance or rules for this work..."
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                      />
                      <div className="flex gap-4">
                         <button 
                           onClick={() => handleUpdateAdmin(selectedRequest.id, 'approved')}
                           className="flex-1 py-5 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-100"
                         >
                           Approve Work
                         </button>
                         <button 
                           onClick={() => handleUpdateAdmin(selectedRequest.id, 'rejected')}
                           className="flex-1 py-5 bg-white border border-red-200 text-red-600 rounded-2xl font-black text-sm hover:bg-red-50 transition-all"
                         >
                           Reject
                         </button>
                      </div>
                    </div>
                  ) : selectedRequest.status === 'approved' ? (
                    <div className="pt-6 border-t border-gray-100">
                       <button 
                         onClick={() => handleInProgress(selectedRequest.id)}
                         className="w-full py-5 bg-amber-500 text-white rounded-2xl font-black text-sm hover:bg-amber-600 transition-all shadow-lg shadow-amber-100"
                       >
                         Mark as In Progress
                       </button>
                       <p className="text-xs font-bold text-gray-400 mt-5 text-center uppercase tracking-widest italic animate-pulse">Awaiting worker arrival or activity start</p>
                    </div>
                  ) : selectedRequest.status === 'in_progress' ? (
                    <div className="space-y-6 pt-6 border-t border-gray-100">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-4">Complete Permission</label>
                       <textarea 
                          className="w-full p-5 border border-gray-200 rounded-2xl bg-gray-50 text-sm h-28 mb-4 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                          placeholder="Final completion notes..."
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                        />
                       <button onClick={() => handleComplete(selectedRequest.id)} className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black hover:bg-emerald-700 shadow-xl shadow-emerald-100 transition-all">
                          Finalize & Complete
                       </button>
                    </div>
                 ) : (
                    <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between shadow-sm">
                       <div>
                          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Permission Finalized</p>
                          <p className="text-base font-black text-emerald-800">Closed Safe & Secure</p>
                       </div>
                       <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                    </div>
                 )}
              </div>
           </div>
        </div>
      )}

      {isCreateModalOpen && (
        <CreateWorkPermissionModal 
          onClose={() => setIsCreateModalOpen(false)} 
          onSuccess={() => {
            setIsCreateModalOpen(false);
            fetchRequests();
          }}
        />
      )}
    </div>
  );
}

interface CreateWorkPermissionModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function CreateWorkPermissionModal({ onClose, onSuccess }: CreateWorkPermissionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wings, setWings] = useState<any[]>([]);
  const [floors, setFloors] = useState<any[]>([]);
  const [flats, setFlats] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    wing_id: '',
    floor_id: '',
    flat_id: '',
    work_type: 'Other',
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    time_slot: 'Anytime',
    worker_name: '',
    worker_contact: '',
    worker_count: 1,
    noise_involved: false,
    priority: 'low'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchWings();
  }, []);

  const fetchWings = async () => {
    try {
      const res = await apiClient('/society-admin/members/wings', { withAuth: true });
      if (res.success) setWings(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchFloors = async (wingId: string) => {
    try {
      const res = await apiClient('/society-admin/members/floors', { 
        withAuth: true,
        params: { wingId }
      });
      if (res.success) setFloors(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchFlats = async (floorId: string) => {
    try {
      const res = await apiClient('/society-admin/members/flats', { 
        withAuth: true,
        params: { wingId: formData.wing_id, floorId }
      });
      if (res.success) setFlats(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));

    if (field === 'wing_id') {
      setFormData(prev => ({ ...prev, wing_id: value, floor_id: '', flat_id: '' }));
      fetchFloors(value);
    } else if (field === 'floor_id') {
      setFormData(prev => ({ ...prev, floor_id: value, flat_id: '' }));
      fetchFlats(value);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.flat_id) newErrors.flat_id = 'Flat selection is required';
    if (!formData.title) newErrors.title = 'Work title is required';
    if (!formData.description) newErrors.description = 'Description is required';
    if (!formData.start_date) newErrors.start_date = 'Start date is required';
    if (!formData.end_date) newErrors.end_date = 'End date is required';
    if (!formData.worker_name) newErrors.worker_name = 'Worker name is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const res = await apiClient('/work/maintenance', {
        method: 'POST',
        body: formData,
        withAuth: true
      });
      if (res.success) {
        onSuccess();
      }
    } catch (error) {
      alert('Failed to create work permission');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-[32px] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-8 py-6 flex justify-between items-center z-10">
          <div>
            <h3 className="text-2xl font-black text-gray-900">Create New Work Permission</h3>
            <p className="text-sm text-gray-500 font-medium">Issue a digital pass for flat activity</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-all">
            <XCircle className="w-8 h-8 text-gray-300" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-12 overflow-y-auto max-h-[calc(90vh-100px)]">
          {/* Flat Selection */}
          <section className="space-y-6">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] border-l-4 border-blue-600 pl-4">Audience (Flat Selection)</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-black text-gray-700 mb-2 uppercase tracking-wide">Wing *</label>
                <select
                  value={formData.wing_id}
                  onChange={(e) => handleInputChange('wing_id', e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-400 outline-none transition-all text-sm font-bold"
                >
                  <option value="">Select Wing</option>
                  {wings.map(w => <option key={w.wing_id} value={w.wing_id}>{w.wing_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-700 mb-2 uppercase tracking-wide">Floor *</label>
                <select
                  value={formData.floor_id}
                  disabled={!formData.wing_id}
                  onChange={(e) => handleInputChange('floor_id', e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-400 outline-none transition-all text-sm font-bold disabled:opacity-50"
                >
                  <option value="">Select Floor</option>
                  {floors.map(f => <option key={f.floor_id} value={f.floor_id}>Floor {f.floor_number}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-700 mb-2 uppercase tracking-wide">Flat *</label>
                <select
                  value={formData.flat_id}
                  disabled={!formData.floor_id}
                  onChange={(e) => handleInputChange('flat_id', e.target.value)}
                  className={`w-full px-5 py-4 bg-gray-50 border ${errors.flat_id ? 'border-red-400' : 'border-gray-100'} rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-400 outline-none transition-all text-sm font-bold disabled:opacity-50`}
                >
                  <option value="">Select Flat</option>
                  {flats.map(f => <option key={f.flat_id} value={f.flat_id}>{f.flat_number}</option>)}
                </select>
              </div>
            </div>
          </section>

          {/* Basic Information */}
          <section className="space-y-6">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] border-l-4 border-blue-600 pl-4">Basic Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="md:col-span-2">
                <label className="block text-xs font-black text-gray-700 mb-2 uppercase tracking-wide">Work Title *</label>
                <input
                  type="text"
                  placeholder="e.g. AC Installation, Pipe Repair"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className={`w-full px-5 py-4 bg-gray-50 border ${errors.title ? 'border-red-400' : 'border-gray-100'} rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-400 outline-none transition-all text-sm font-bold`}
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-700 mb-2 uppercase tracking-wide">Work Type *</label>
                <select
                  value={formData.work_type}
                  onChange={(e) => handleInputChange('work_type', e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl shadow-sm focus:ring-4 focus:ring-blue-50 outline-none transition-all text-sm font-bold"
                >
                  <option value="Plumbing">Plumbing</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Interior">Interior</option>
                  <option value="Furniture">Furniture</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-700 mb-2 uppercase tracking-wide">Priority</label>
                <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
                  {['low', 'medium', 'high'].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handleInputChange('priority', p)}
                      className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${formData.priority === p ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-black text-gray-700 mb-2 uppercase tracking-wide">Description *</label>
                <textarea
                  rows={4}
                  placeholder="Detail the scope of work..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className={`w-full px-5 py-4 bg-gray-50 border ${errors.description ? 'border-red-400' : 'border-gray-100'} rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-400 outline-none transition-all text-sm font-medium`}
                />
              </div>
            </div>
          </section>

          {/* Timing & Noise */}
          <section className="space-y-6">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] border-l-4 border-blue-600 pl-4">Timing & Compliance</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-xs font-black text-gray-700 mb-2 uppercase tracking-wide">Start Date *</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleInputChange('start_date', e.target.value)}
                  className={`w-full px-5 py-4 bg-gray-50 border ${errors.start_date ? 'border-red-400' : 'border-gray-100'} rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-400 outline-none transition-all text-sm font-bold`}
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-700 mb-2 uppercase tracking-wide">End Date *</label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => handleInputChange('end_date', e.target.value)}
                  className={`w-full px-5 py-4 bg-gray-50 border ${errors.end_date ? 'border-red-400' : 'border-gray-100'} rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-400 outline-none transition-all text-sm font-bold`}
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-700 mb-2 uppercase tracking-wide">Preferred Time Slot</label>
                <select
                  value={formData.time_slot}
                  onChange={(e) => handleInputChange('time_slot', e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl shadow-sm focus:ring-4 focus:ring-blue-50 outline-none transition-all text-sm font-bold"
                >
                  <option value="Anytime">Anytime (09:00 AM - 06:00 PM)</option>
                  <option value="Morning">Morning (09:00 AM - 01:00 PM)</option>
                  <option value="Afternoon">Afternoon (02:00 PM - 06:00 PM)</option>
                </select>
              </div>
              <div className="flex items-center">
                <label className="flex items-center gap-4 cursor-pointer group">
                  <div className={`w-12 h-6 rounded-full transition-all flex items-center p-1 ${formData.noise_involved ? 'bg-amber-500' : 'bg-gray-200'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-all ${formData.noise_involved ? 'translate-x-6' : 'translate-x-0'}`} />
                  </div>
                  <input 
                    type="checkbox" 
                    className="hidden" 
                    checked={formData.noise_involved}
                    onChange={(e) => handleInputChange('noise_involved', e.target.checked)}
                  />
                  <span className="text-sm font-black text-gray-700 uppercase tracking-tight group-hover:text-amber-600 transition-colors">Noise / Drilling Involved</span>
                </label>
              </div>
            </div>
          </section>

          {/* Worker Info */}
          <section className="space-y-6">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] border-l-4 border-blue-600 pl-4">Worker Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="md:col-span-2">
                <label className="block text-xs font-black text-gray-700 mb-2 uppercase tracking-wide">Main Worker / Supervison Name *</label>
                <input
                  type="text"
                  placeholder="Full name of worker"
                  value={formData.worker_name}
                  onChange={(e) => handleInputChange('worker_name', e.target.value)}
                  className={`w-full px-5 py-4 bg-gray-50 border ${errors.worker_name ? 'border-red-400' : 'border-gray-100'} rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-400 outline-none transition-all text-sm font-bold`}
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-700 mb-2 uppercase tracking-wide">Contact Number</label>
                <input
                  type="tel"
                  placeholder="Primary contact"
                  value={formData.worker_contact}
                  onChange={(e) => handleInputChange('worker_contact', e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-400 outline-none transition-all text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-700 mb-2 uppercase tracking-wide">Total Worker Count</label>
                <input
                  type="number"
                  min={1}
                  value={formData.worker_count}
                  onChange={(e) => handleInputChange('worker_count', parseInt(e.target.value))}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-400 outline-none transition-all text-sm font-bold"
                />
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="flex gap-4 pt-8 border-t border-gray-100">
             <button
               type="button"
               onClick={onClose}
               className="flex-1 py-5 bg-white border-2 border-gray-100 text-gray-400 rounded-[24px] font-black uppercase tracking-widest text-xs hover:bg-gray-50 hover:text-gray-600 transition-all"
             >
               Cancel
             </button>
             <button
               type="submit"
               disabled={isSubmitting}
               className="flex-[2] py-5 bg-blue-600 text-white rounded-[24px] font-black uppercase tracking-widest text-xs hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
             >
               {isSubmitting ? (
                 <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
               ) : (
                 <PlusCircle className="w-5 h-5" />
               )}
               Submit Digital Permission
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}
