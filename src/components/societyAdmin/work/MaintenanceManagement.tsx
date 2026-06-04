import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Smartphone,
  MapPin,
  Building2,
  Activity,
  Filter,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  FileText,
  ShieldCheck,
  ShieldPlus,
  RefreshCw,
  Key,
  Database,
  Edit,
  Trash2,
  ChevronLeft,
  Eye,
  MoreVertical
} from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import clsx from 'clsx';

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
  priority?: 'low' | 'medium' | 'high';
}

export default function WorkPermissionManagement() {
  const [requests, setRequests] = useState<WorkPermissionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<WorkPermissionRequest | null>(null);
  const [filter, setFilter] = useState('all');
  const [remarks, setRemarks] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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

  const filtered = requests.filter(r => {
    const matchesFilter = filter === 'all' ? true : r.status === filter;
    const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         r.resident_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         r.flat_number.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-white text-[#0b1c30] antialiased p-8 font-['Manrope',_sans-serif]">
      {/* Header Section */}
      <div className="flex justify-between items-end mb-8 max-w-7xl mx-auto">
        <div>
          <nav className="flex gap-2 text-[12px] font-medium text-[#565e74] mb-2 uppercase tracking-wide">
            <span>Management</span>
            <span>/</span>
            <span className="text-[#004ac6] font-semibold">Permissions</span>
          </nav>
          <h2 className="text-[32px] font-bold leading-tight tracking-tight text-[#0b1c30]">Work Permissions</h2>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-[#004ac6] hover:bg-[#003ea8] text-white px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all font-semibold text-[14px]"
        >
          <ShieldPlus className="w-4 h-4" />
          New Permission
        </button>
      </div>

      {/* Filter Section */}
      <div className="max-w-7xl mx-auto bg-white rounded-xl border border-slate-100 p-3 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex gap-1 p-1 bg-slate-50 rounded-lg w-fit">
          {['all', 'pending', 'approved', 'in_progress', 'completed', 'rejected'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={clsx(
                "px-4 py-1.5 text-[13px] font-semibold rounded-md transition-all",
                filter === f 
                  ? "bg-white text-[#004ac6] shadow-sm border border-slate-100" 
                  : "text-[#565e74] hover:text-[#004ac6]"
              )}
            >
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1).replace('_', ' ')}
            </button>
          ))}
        </div>
        <div className="relative min-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text"
            placeholder="Search permissions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-lg text-[13px] focus:bg-white focus:ring-1 focus:ring-[#004ac6] focus:border-[#004ac6] transition-all outline-none"
          />
        </div>
      </div>

      {/* Data Table Card */}
      <div className="max-w-7xl mx-auto bg-white rounded-xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-semibold text-[#565e74] uppercase tracking-wider text-[11px]">Resident / Property</th>
                <th className="px-6 py-4 font-semibold text-[#565e74] uppercase tracking-wider text-[11px]">Category</th>
                <th className="px-6 py-4 font-semibold text-[#565e74] uppercase tracking-wider text-[11px]">Status</th>
                <th className="px-6 py-4 font-semibold text-[#565e74] uppercase tracking-wider text-[11px]">Date</th>
                <th className="px-6 py-4 font-semibold text-[#565e74] uppercase tracking-wider text-[11px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-8"></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-[#565e74] text-sm">No maintenance requests found</td>
                </tr>
              ) : (
                filtered.map((request) => (
                  <tr key={request.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-[#004ac6] font-bold text-xs">
                          {request.resident_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-[#0b1c30] text-[14px]">{request.resident_name}</p>
                          <p className="text-[12px] text-[#565e74] font-medium">{request.wing_name} - {request.flat_number}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-[#0b1c30] text-[13px]">{request.work_type || 'General'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={clsx(
                        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold text-[11px] uppercase tracking-tighter",
                        request.status === 'completed' ? 'bg-green-50 text-green-700' :
                        request.status === 'pending' ? 'bg-yellow-50 text-yellow-700' :
                        request.status === 'rejected' ? 'bg-red-50 text-red-700' :
                        'bg-blue-50 text-blue-700'
                      )}>
                        <span className={clsx(
                          "w-1 h-1 rounded-full",
                          request.status === 'completed' ? 'bg-green-500' :
                          request.status === 'pending' ? 'bg-yellow-500' :
                          request.status === 'rejected' ? 'bg-red-500' :
                          'bg-blue-500'
                        )}></span>
                        {request.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[13px] text-[#565e74] font-medium">
                      {new Date(request.start_date).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-4">
                        <button 
                          onClick={() => setSelectedRequest(request)}
                          className="text-[12px] font-bold text-[#004ac6] hover:underline"
                        >
                          View Details
                        </button>
                        <div className="flex gap-1">
                          <button className="p-1.5 text-slate-400 hover:text-[#004ac6] hover:bg-slate-100 rounded-md transition-all">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between text-[11px] text-[#565e74] font-bold uppercase tracking-wider">
          <p>Page 1 of 1 • {filtered.length} Results</p>
          <div className="flex gap-2">
            <button className="p-1 hover:bg-white disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
            <button className="p-1 hover:bg-white"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedRequest && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRequest(null)}
              className="absolute inset-0 bg-[#0b1c30]/10 backdrop-blur-[2px]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-xl relative z-10 border border-slate-100"
            >
              <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-white">
                <div>
                  <p className="text-[10px] font-bold text-[#565e74] uppercase tracking-[2px] mb-1">Permission Details</p>
                  <h2 className="text-[20px] font-bold text-[#0b1c30] tracking-tight">{selectedRequest.title}</h2>
                </div>
                <button onClick={() => setSelectedRequest(null)} className="p-1.5 hover:bg-slate-50 rounded-lg transition-all">
                  <XCircle className="w-5 h-5 text-slate-300" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Location</p>
                    <p className="text-[14px] font-semibold text-[#0b1c30]">{selectedRequest.wing_name} - {selectedRequest.flat_number}</p>
                    <p className="text-[12px] text-slate-500">{selectedRequest.resident_name}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Schedule</p>
                    <p className="text-[14px] font-semibold text-[#0b1c30]">
                      {new Date(selectedRequest.start_date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                    </p>
                    <p className="text-[12px] text-slate-500">{selectedRequest.time_slot}</p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Description</p>
                  <p className="text-[13px] text-[#434655] leading-relaxed italic font-medium">
                    {selectedRequest.description}
                  </p>
                </div>

                <div className="flex items-center justify-between py-4 border-t border-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-[#004ac6]">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-[#0b1c30]">{selectedRequest.worker_name}</p>
                      <p className="text-[11px] text-slate-500 font-medium">{selectedRequest.worker_contact}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Workers</p>
                    <p className="text-[16px] font-bold text-[#0b1c30]">{selectedRequest.worker_count}</p>
                  </div>
                </div>

                <div className="space-y-3 pt-4">
                  {selectedRequest.status === 'pending' ? (
                    <div className="flex gap-3">
                      <button 
                        onClick={() => handleUpdateAdmin(selectedRequest!.id, 'approved')}
                        className="flex-1 py-2.5 bg-[#004ac6] text-white rounded-lg font-bold text-[13px] hover:bg-[#003ea8] transition-all shadow-sm"
                      >
                        Approve Request
                      </button>
                      <button 
                        onClick={() => handleUpdateAdmin(selectedRequest!.id, 'rejected')}
                        className="flex-1 py-2.5 bg-white border border-slate-200 text-red-600 rounded-lg font-bold text-[13px] hover:bg-red-50 transition-all"
                      >
                        Reject
                      </button>
                    </div>
                  ) : selectedRequest.status === 'approved' ? (
                    <button 
                      onClick={() => handleInProgress(selectedRequest!.id)}
                      className="w-full py-2.5 bg-[#004ac6] text-white rounded-lg font-bold text-[13px] hover:bg-[#003ea8] transition-all shadow-sm"
                    >
                      Start Work (Mark In Progress)
                    </button>
                  ) : selectedRequest.status === 'in_progress' ? (
                    <button 
                      onClick={() => handleComplete(selectedRequest!.id)} 
                      className="w-full py-2.5 bg-[#004ac6] text-white rounded-lg font-bold text-[13px] hover:bg-[#003ea8] transition-all shadow-sm"
                    >
                      Complete & Close Permission
                    </button>
                  ) : (
                    <div className="w-full py-2.5 bg-green-50 text-green-700 rounded-lg font-bold text-[13px] text-center border border-green-100">
                      Permission Finalized
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
    if (!formData.flat_id) newErrors.flat_id = 'Required';
    if (!formData.title) newErrors.title = 'Required';
    if (!formData.description) newErrors.description = 'Required';
    if (!formData.start_date) newErrors.start_date = 'Required';
    if (!formData.end_date) newErrors.end_date = 'Required';
    if (!formData.worker_name) newErrors.worker_name = 'Required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const res = await apiClient('/work/maintenance/create', {
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-[#0b1c30]/10 backdrop-blur-[2px]"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 10 }}
        className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-xl relative z-10 border border-slate-100"
      >
        <div className="sticky top-0 bg-white border-b border-slate-50 px-8 py-5 flex justify-between items-center z-10">
          <div>
            <h3 className="text-[20px] font-bold text-[#0b1c30]">New Work Permission</h3>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Entry Specification</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-50 rounded-lg transition-all">
            <XCircle className="w-5 h-5 text-slate-200" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8 overflow-y-auto max-h-[calc(90vh-100px)]">
          <section className="space-y-4">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Location Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500">WING</label>
                <select
                  value={formData.wing_id}
                  onChange={(e) => handleInputChange('wing_id', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-lg focus:bg-white focus:ring-1 focus:ring-[#004ac6] outline-none transition-all text-[13px] font-medium"
                >
                  <option value="">Select Wing</option>
                  {wings.map(w => <option key={w.wing_id} value={w.wing_id}>{w.wing_name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500">FLOOR</label>
                <select
                  value={formData.floor_id}
                  disabled={!formData.wing_id}
                  onChange={(e) => handleInputChange('floor_id', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-lg focus:bg-white focus:ring-1 focus:ring-[#004ac6] outline-none transition-all text-[13px] font-medium disabled:opacity-50"
                >
                  <option value="">Select Floor</option>
                  {floors.map(f => <option key={f.floor_id} value={f.floor_id}>Floor {f.floor_number}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500">FLAT</label>
                <select
                  value={formData.flat_id}
                  disabled={!formData.floor_id}
                  onChange={(e) => handleInputChange('flat_id', e.target.value)}
                  className={clsx(
                    "w-full px-4 py-2.5 bg-slate-50 border rounded-lg focus:bg-white focus:ring-1 focus:ring-[#004ac6] outline-none transition-all text-[13px] font-medium disabled:opacity-50",
                    errors.flat_id ? 'border-red-200' : 'border-slate-100'
                  )}
                >
                  <option value="">Select Flat</option>
                  {flats.map(f => <option key={f.flat_id} value={f.flat_id}>{f.flat_number}</option>)}
                </select>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Work Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 space-y-1">
                <label className="block text-[11px] font-bold text-slate-500">TITLE</label>
                <input
                  type="text"
                  placeholder="e.g. Bathroom Renovations"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className={clsx(
                    "w-full px-4 py-2.5 bg-slate-50 border rounded-lg focus:bg-white focus:ring-1 focus:ring-[#004ac6] outline-none transition-all text-[13px] font-medium",
                    errors.title ? 'border-red-200' : 'border-slate-100'
                  )}
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500">CATEGORY</label>
                <select
                  value={formData.work_type}
                  onChange={(e) => handleInputChange('work_type', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-lg focus:ring-1 focus:ring-[#004ac6] outline-none transition-all text-[13px] font-medium"
                >
                  <option value="Plumbing">Plumbing</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Interior">Interior</option>
                  <option value="Furniture">Furniture</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500">PRIORITY</label>
                <div className="flex bg-slate-50 p-0.5 rounded-lg border border-slate-100">
                  {['low', 'medium', 'high'].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handleInputChange('priority', p)}
                      className={clsx(
                        "flex-1 py-1.5 text-[11px] font-bold uppercase tracking-widest rounded-md transition-all",
                        formData.priority === p ? 'bg-white shadow-sm text-[#004ac6] border border-slate-100' : 'text-slate-400 hover:text-slate-600'
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className="block text-[11px] font-bold text-slate-500">DESCRIPTION</label>
                <textarea
                  rows={3}
                  placeholder="Details of the work scope..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className={clsx(
                    "w-full px-4 py-2.5 bg-slate-50 border rounded-lg focus:bg-white focus:ring-1 focus:ring-[#004ac6] outline-none transition-all text-[13px] font-medium",
                    errors.description ? 'border-red-200' : 'border-slate-100'
                  )}
                />
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <section className="space-y-4">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Timing</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-500">START</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => handleInputChange('start_date', e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-lg focus:ring-1 focus:ring-[#004ac6] outline-none transition-all text-[13px] font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-500">END</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => handleInputChange('end_date', e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-lg focus:ring-1 focus:ring-[#004ac6] outline-none transition-all text-[13px] font-medium"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Personnel</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1">
                  <label className="block text-[11px] font-bold text-slate-500">WORKER NAME</label>
                  <input
                    type="text"
                    placeholder="Supervisor Name"
                    value={formData.worker_name}
                    onChange={(e) => handleInputChange('worker_name', e.target.value)}
                    className={clsx(
                      "w-full px-4 py-2.5 bg-slate-50 border rounded-lg focus:bg-white focus:ring-1 focus:ring-[#004ac6] outline-none transition-all text-[13px] font-medium",
                      errors.worker_name ? 'border-red-200' : 'border-slate-100'
                    )}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-500">PHONE</label>
                  <input
                    type="tel"
                    placeholder="Contact"
                    value={formData.worker_contact}
                    onChange={(e) => handleInputChange('worker_contact', e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-lg focus:ring-1 focus:ring-[#004ac6] outline-none transition-all text-[13px] font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-500">COUNT</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.worker_count}
                    onChange={(e) => handleInputChange('worker_count', parseInt(e.target.value))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-lg focus:ring-1 focus:ring-[#004ac6] outline-none transition-all text-[13px] font-medium"
                  />
                </div>
              </div>
            </section>
          </div>

          <div className="flex gap-3 pt-6 border-t border-slate-50">
             <button
               type="button"
               onClick={onClose}
               className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-500 rounded-lg font-bold text-[13px] hover:bg-slate-50 transition-all"
             >
               Cancel
             </button>
             <button
               type="submit"
               disabled={isSubmitting}
               className="flex-[2] py-2.5 bg-[#004ac6] text-white rounded-lg font-bold text-[13px] hover:bg-[#003ea8] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
             >
               {isSubmitting ? (
                 <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
               ) : (
                 <ShieldPlus className="w-4 h-4" />
               )}
               Issue Permission
             </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
