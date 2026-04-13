import React, { useState, useEffect } from 'react';
import { 
  Paintbrush, 
  Calendar, 
  User, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  MoreVertical,
  Search,
  Users,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { apiClient } from '@/lib/apiClient';

interface RenovationRequest {
  id: number;
  resident_name: string;
  flat_number: string;
  wing_name: string;
  work_type: 'Interior' | 'Painting' | 'Electrical' | 'Civil';
  description: string;
  start_date: string;
  end_date: string;
  contractor_name: string;
  contractor_contact: string;
  worker_count: number;
  status: 'pending' | 'approved' | 'in_progress' | 'completed' | 'rejected';
  admin_remarks?: string;
}

export default function RenovationManagement() {
  const [requests, setRequests] = useState<RenovationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<RenovationRequest | null>(null);
  const [filter, setFilter] = useState('all');
  const [remarks, setRemarks] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await apiClient('/work/renovation/list', { method: 'GET', withAuth: true });
      if (response.success) setRequests(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      const response = await apiClient(`/work/renovation/status/${id}`, {
        method: 'PUT',
        body: { status, remarks },
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

  const filtered = requests.filter(r => 
    filter === 'all' ? true : r.status === filter
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Paintbrush className="w-8 h-8 text-blue-600" />
            Renovation Approvals
          </h1>
          <p className="text-gray-500 text-sm mt-1">Review and manage flat renovation permissions.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex bg-white rounded-lg p-1 border border-gray-200">
            {['all', 'pending', 'approved', 'in_progress', 'completed'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  filter === f ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl font-black text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
          >
            <Clock className="w-5 h-5" />
            Add Renovation Request
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((request) => (
          <div 
            key={request.id}
            onClick={() => setSelectedRequest(request)}
            className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-xl transition-all cursor-pointer group"
          >
            <div className="flex justify-between items-start mb-6">
              <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                request.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                request.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                request.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                'bg-red-100 text-red-700'
              }`}>
                {request.status}
              </div>
              <p className="text-xs font-bold text-gray-400">#{request.id}</p>
            </div>

            <h3 className="text-lg font-black text-gray-900 mb-1">{request.work_type} Work</h3>
            <p className="text-sm text-gray-500 mb-6">{request.wing_name} - {request.flat_number} • {request.resident_name}</p>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mb-1">Duration</p>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                  <Calendar className="w-3 h-3 text-blue-500" />
                  {new Date(request.start_date).toLocaleDateString('en-IN', {month: 'short', day: 'numeric'})} - {new Date(request.end_date).toLocaleDateString('en-IN', {month: 'short', day: 'numeric'})}
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mb-1">Contractor</p>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-700 italic">
                   {request.contractor_name}
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-50 flex items-center justify-between">
               <span className="text-xs font-medium text-gray-400 flex items-center gap-1">
                 <Users className="w-3 h-3" /> {request.worker_count} Workers
               </span>
               <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-all" />
            </div>
          </div>
        ))}
      </div>

      {selectedRequest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-[32px] w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
              <div className="p-8 border-b border-gray-100 flex justify-between items-start">
                 <div>
                    <h2 className="text-2xl font-black text-gray-900">{selectedRequest.work_type} Renovation Request</h2>
                    <p className="text-sm font-black text-gray-400 uppercase tracking-widest mt-1">Permission #{selectedRequest.id} • Flat {selectedRequest.wing_name}-{selectedRequest.flat_number}</p>
                 </div>
                 <button onClick={() => setSelectedRequest(null)} className="p-2 hover:bg-gray-100 rounded-full transition-all">
                    <XCircle className="w-8 h-8 text-gray-300" />
                 </button>
              </div>

              <div className="p-8 max-h-[60vh] overflow-y-auto space-y-8">
                 <section className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block border-l-4 border-blue-600 pl-4">Work Description</label>
                    <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 text-gray-700 text-sm leading-relaxed italic">
                       "{selectedRequest.description}"
                    </div>
                 </section>

                 <div className="grid grid-cols-2 gap-8">
                    <section className="space-y-4">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block border-l-4 border-blue-600 pl-4">Schedule</label>
                       <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100/50 space-y-3">
                          <p className="text-xs font-bold text-blue-700 flex items-center gap-2">
                             <Calendar className="w-4 h-4" />
                             Start: {new Date(selectedRequest.start_date).toDateString()}
                          </p>
                          <p className="text-xs font-bold text-blue-700 flex items-center gap-2">
                             <Clock className="w-4 h-4" />
                             End: {new Date(selectedRequest.end_date).toDateString()}
                          </p>
                       </div>
                    </section>
                    <section className="space-y-4">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block border-l-4 border-blue-600 pl-4">Contractor Team</label>
                       <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 space-y-1">
                          <p className="text-sm font-black text-gray-800">{selectedRequest.contractor_name}</p>
                          <p className="text-xs font-bold text-indigo-600">{selectedRequest.contractor_contact}</p>
                          <p className="text-xs font-black text-gray-400 mt-2 uppercase tracking-tight">{selectedRequest.worker_count} Experts Assigned</p>
                       </div>
                    </section>
                 </div>

                 {selectedRequest.status === 'pending' && (
                    <section className="space-y-4 pt-4 border-t border-gray-100">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block border-l-4 border-amber-600 pl-4">Admin Remarks & Guidelines</label>
                       <textarea 
                         className="w-full p-5 border border-gray-200 rounded-2xl bg-gray-50 focus:bg-white outline-none focus:ring-4 focus:ring-blue-50 transition-all text-sm h-28"
                         placeholder="Add specific rules or duration changes for this renovation..."
                         value={remarks}
                         onChange={(e) => setRemarks(e.target.value)}
                       />
                    </section>
                 )}
              </div>

              <div className="p-8 bg-gray-50 flex gap-4">
                 {selectedRequest.status === 'pending' ? (
                    <>
                       <button 
                         onClick={() => handleUpdateStatus(selectedRequest.id, 'approved')}
                         className="flex-1 py-5 bg-blue-600 text-white rounded-[24px] font-black uppercase tracking-widest text-xs hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all flex items-center justify-center gap-2"
                       >
                          <CheckCircle2 className="w-5 h-5" />
                          Approve
                       </button>
                       <button 
                         onClick={() => handleUpdateStatus(selectedRequest.id, 'rejected')}
                         className="flex-1 py-5 bg-white border-2 border-red-100 text-red-600 rounded-[24px] font-black uppercase tracking-widest text-xs hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                       >
                          <XCircle className="w-5 h-5" />
                          Reject
                       </button>
                    </>
                 ) : (
                    <button onClick={() => setSelectedRequest(null)} className="w-full py-5 bg-gray-900 text-white rounded-[24px] font-black uppercase tracking-widest text-xs">
                       Close Details
                    </button>
                 )}
              </div>
           </div>
        </div>
      )}

      {isCreateModalOpen && (
        <CreateRenovationModal 
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

interface CreateRenovationModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function CreateRenovationModal({ onClose, onSuccess }: CreateRenovationModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wings, setWings] = useState<any[]>([]);
  const [floors, setFloors] = useState<any[]>([]);
  const [flats, setFlats] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    wing_id: '',
    floor_id: '',
    flat_id: '',
    work_type: 'Interior',
    description: '',
    start_date: '',
    end_date: '',
    contractor_name: '',
    contractor_contact: '',
    worker_count: 1,
    structural_changes: false
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
    if (!formData.description) newErrors.description = 'Description is required';
    if (!formData.start_date) newErrors.start_date = 'Start date is required';
    if (!formData.end_date) newErrors.end_date = 'End date is required';
    if (!formData.contractor_name) newErrors.contractor_name = 'Contractor name is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const res = await apiClient('/work/renovation', {
        method: 'POST',
        body: formData,
        withAuth: true
      });
      if (res.success) {
        onSuccess();
      }
    } catch (error) {
      alert('Failed to create renovation request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-[32px] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-8 py-6 flex justify-between items-center z-10">
          <div>
            <h3 className="text-2xl font-black text-gray-900">Create Renovation Request</h3>
            <p className="text-sm text-gray-500 font-medium">Register a structural or interior modification</p>
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
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] border-l-4 border-blue-600 pl-4">Work Scope</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-xs font-black text-gray-700 mb-2 uppercase tracking-wide">Major Work Type *</label>
                <select
                  value={formData.work_type}
                  onChange={(e) => handleInputChange('work_type', e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl shadow-sm focus:ring-4 focus:ring-blue-50 outline-none transition-all text-sm font-bold"
                >
                  <option value="Interior">Interior</option>
                  <option value="Painting">Painting</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Civil">Civil</option>
                </select>
              </div>
              <div className="flex items-center">
                <label className="flex items-center gap-4 cursor-pointer group">
                  <div className={`w-12 h-6 rounded-full transition-all flex items-center p-1 ${formData.structural_changes ? 'bg-red-500' : 'bg-gray-200'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-all ${formData.structural_changes ? 'translate-x-6' : 'translate-x-0'}`} />
                  </div>
                  <input 
                    type="checkbox" 
                    className="hidden" 
                    checked={formData.structural_changes}
                    onChange={(e) => handleInputChange('structural_changes', e.target.checked)}
                  />
                  <span className="text-sm font-black text-gray-700 uppercase tracking-tight group-hover:text-red-600 transition-colors">Structural Changes Involved</span>
                </label>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-black text-gray-700 mb-2 uppercase tracking-wide">Detailed Description *</label>
                <textarea
                  rows={4}
                  placeholder="Detail all plan modifications..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className={`w-full px-5 py-4 bg-gray-50 border ${errors.description ? 'border-red-400' : 'border-gray-100'} rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-400 outline-none transition-all text-sm font-medium`}
                />
              </div>
            </div>
          </section>

          {/* Timing */}
          <section className="space-y-6">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] border-l-4 border-blue-600 pl-4">Duration</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-xs font-black text-gray-700 mb-2 uppercase tracking-wide">Project Start Date *</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleInputChange('start_date', e.target.value)}
                  className={`w-full px-5 py-4 bg-gray-50 border ${errors.start_date ? 'border-red-400' : 'border-gray-100'} rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-400 outline-none transition-all text-sm font-bold`}
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-700 mb-2 uppercase tracking-wide">Project End Date *</label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => handleInputChange('end_date', e.target.value)}
                  className={`w-full px-5 py-4 bg-gray-50 border ${errors.end_date ? 'border-red-400' : 'border-gray-100'} rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-400 outline-none transition-all text-sm font-bold`}
                />
              </div>
            </div>
          </section>

          {/* Contractor Info */}
          <section className="space-y-6">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] border-l-4 border-blue-600 pl-4">Contractor Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="md:col-span-2">
                <label className="block text-xs font-black text-gray-700 mb-2 uppercase tracking-wide">Company / Contractor Name *</label>
                <input
                  type="text"
                  placeholder="Full name or company name"
                  value={formData.contractor_name}
                  onChange={(e) => handleInputChange('contractor_name', e.target.value)}
                  className={`w-full px-5 py-4 bg-gray-50 border ${errors.contractor_name ? 'border-red-400' : 'border-gray-100'} rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-400 outline-none transition-all text-sm font-bold`}
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-700 mb-2 uppercase tracking-wide">Contact Number</label>
                <input
                  type="tel"
                  placeholder="Primary contact"
                  value={formData.contractor_contact}
                  onChange={(e) => handleInputChange('contractor_contact', e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-400 outline-none transition-all text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-700 mb-2 uppercase tracking-wide">Worker Team Strength</label>
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
                 <Paintbrush className="w-5 h-5" />
               )}
               Apply for Renovation
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}
