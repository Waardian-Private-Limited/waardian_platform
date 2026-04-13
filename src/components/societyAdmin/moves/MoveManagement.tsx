'use client';

import { useState, useEffect } from 'react';
import { 
  Truck, 
  Calendar, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ArrowRight,
  AlertTriangle,
  ShieldCheck,
  FileText,
  User, 
  Phone, 
  Building 
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiClient } from '@/lib/apiClient';

interface MoveRequest {
  id: number;
  flat_id: number;
  flat_number: string;
  wing_name: string;
  type: 'move_in' | 'move_out';
  move_date: string;
  time_slot: string;
  resident_name: string;
  contact_number: string;
  lift_required: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'in_progress' | 'completed' | 'closed';
  vehicle_count: number;
  vehicle_details: string;
  heavy_items: boolean;
  admin_remarks?: string;
  entry_time?: string;
  exit_time?: string;
  damage_notes?: string;
  penalty_amount?: number;
  assets_cleared?: boolean;
  property_check?: boolean;
  clearance_pass_id?: string;
  held_assets?: number;
  asset_names?: string;
  pending_dues?: number;
  financial_cleared?: boolean;
  override_flag?: boolean;
  override_reason?: string;
  lift_number?: string;
}

export default function MoveManagement({ societyId }: { societyId: string }) {
  const [requests, setRequests] = useState<MoveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [view, setView] = useState<'list' | 'schedule'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<MoveRequest | null>(null);
  const [remarks, setRemarks] = useState('');
  const [assetsCleared, setAssetsCleared] = useState(false);
  const [propertyChecked, setPropertyChecked] = useState(false);
  const [financialCleared, setFinancialCleared] = useState(false);
  const [overrideFlag, setOverrideFlag] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [approving, setApproving] = useState(false);
  const [showDamageAssessment, setShowDamageAssessment] = useState(false);
  const [damageNotes, setDamageNotes] = useState('');
  const [penaltyAmount, setPenaltyAmount] = useState(0);
  const [liftNumber, setLiftNumber] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchRequests = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await apiClient('/move/list', { withAuth: true });
      if (data.success) {
        setRequests(data.data);
      }
    } catch (error) {
      if (!silent) toast.error('Failed to fetch move requests');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    
    // Auto-refresh interval (10s) optimized for real-time tracking
    const interval = setInterval(() => {
      fetchRequests(true);
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedRequest) {
      setAssetsCleared(selectedRequest.assets_cleared || false);
      setPropertyChecked(selectedRequest.property_check || false);
      setFinancialCleared(selectedRequest.financial_cleared || false);
      setOverrideFlag(selectedRequest.override_flag || false);
      setOverrideReason(selectedRequest.override_reason || '');
      setDamageNotes(selectedRequest.damage_notes || '');
      setPenaltyAmount(selectedRequest.penalty_amount || 0);
      setLiftNumber(selectedRequest.lift_number || '');
      setShowDamageAssessment(false);
    }
  }, [selectedRequest]);

  const handleStatusUpdate = async (id: number, status: string) => {
    try {
      const data = await apiClient(`/move/status/${id}`, {
        method: 'PUT',
        withAuth: true,
        body: { 
          status, 
          remarks,
          assets_cleared: assetsCleared,
          property_check: propertyChecked,
          financial_cleared: financialCleared,
          override_flag: overrideFlag,
          override_reason: overrideReason,
          lift_number: liftNumber
        }
      });
      if (data.success) {
        toast.success(`Request ${status} successfully`);
        fetchRequests();
        setSelectedRequest(null);
        setRemarks('');
      } else {
        toast.error(data.message || 'Action failed');
      }
    } catch (error) {
      toast.error('Backend connection error');
    }
  };

  const handleLogExecution = async (requestId: number, action: 'entry' | 'exit') => {
    try {
      const data = await apiClient(`/move/log/${requestId}`, {
        method: 'POST',
        withAuth: true,
        body: { action, lift_number: liftNumber }
      });
      if (data.success) {
        toast.success(`Movement ${action === 'entry' ? 'Started' : 'Completed'} successfully`);
        fetchRequests();
        setSelectedRequest(null);
      } else {
        toast.error(data.message || 'Log failed');
      }
    } catch (error) {
      toast.error('Failed to log execution');
    }
  };

  const handleCloseMove = async (id: number) => {
    try {
      const data = await apiClient(`/move/close/${id}`, {
        method: 'POST',
        withAuth: true
      });
      if (data.success) {
        toast.success('Move closed and resident status updated');
        fetchRequests();
        setSelectedRequest(null);
      } else {
        toast.error(data.message || 'Failed to close move');
      }
    } catch (error) {
      toast.error('Backend connection error');
    }
  };

  const handleSaveDamage = async () => {
    if (!selectedRequest) return;
    try {
      const data = await apiClient(`/move/damage/${selectedRequest.id}`, {
        method: 'PUT',
        withAuth: true,
        body: { notes: damageNotes, penalty: penaltyAmount }
      });
      if (data.success) {
        toast.success('Damage report updated');
        setShowDamageAssessment(false);
        fetchRequests();
        // Update local state to reflect change immediately
        setSelectedRequest(prev => prev ? { ...prev, damage_notes: damageNotes, penalty_amount: penaltyAmount } : null);
      }
    } catch (error) {
      toast.error('Failed to save damage report');
    }
  };

  const filteredRequests = requests.filter(req => {
    const matchesSearch = 
      req.resident_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      req.flat_number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || req.status === filter;
    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to first page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchQuery]);

  const getStatusColor = (status: string) => `status-${status}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Truck className="w-8 h-8 text-blue-600" />
            Move Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage shift requests, resource bookings, and clearances.</p>
        </div>
        
        <div className="flex bg-white rounded-lg p-1 border border-gray-200">
          <button
            onClick={() => setView('list')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              view === 'list' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            List View
          </button>
          <button
            onClick={() => setView('schedule')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              view === 'schedule' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Schedule Grid
          </button>
        </div>
      </div>
      {/* Active Move Advisory Panel */}
      {requests.some(r => r.status === 'in_progress') && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 shadow-sm animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-600 rounded-full flex items-center justify-center text-white">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-black text-amber-900 uppercase tracking-tight">Active Movement In-Progress</h3>
                <p className="text-xs text-amber-700 font-medium">
                  {requests.filter(r => r.status === 'in_progress').length} flat(s) currently shifting. Shared resources (lifts) may be occupied.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
               {requests.filter(r => r.status === 'in_progress').map(r => (
                 <span key={r.id} className="px-3 py-1 bg-white border border-amber-300 rounded-full text-[10px] font-black text-amber-900 shadow-sm">
                   {r.wing_name}-{r.flat_number} {r.lift_number ? `(Lift ${r.lift_number})` : ''}
                 </span>
               ))}
            </div>
          </div>
        </div>
      )}


      {view === 'list' ? (
        <>
          <div className="flex bg-white rounded-lg p-1 border border-gray-200 w-fit">
            {['all', 'pending', 'approved', 'in_progress', 'completed', 'closed', 'rejected'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  filter === f ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {f === 'in_progress' ? 'Running' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or flat number..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Fetching requests...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-200">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">No shift requests found</h3>
              <p className="text-gray-500">New requests from residents will appear here.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="p-4 text-[10px] font-black text-gray-400 uppercase">Resident / Flat</th>
                      <th className="p-4 text-[10px] font-black text-gray-400 uppercase text-center">Type</th>
                      <th className="p-4 text-[10px] font-black text-gray-400 uppercase">Scheduled Window</th>
                      <th className="p-4 text-[10px] font-black text-gray-400 uppercase">Status</th>
                      <th className="p-4 text-[10px] font-black text-gray-400 uppercase text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRequests.map((req) => (
                      <tr key={req.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all shadow-sm status-badge status-${req.status}`}>
                              <Building className="w-5 h-5 opacity-80" />
                            </div>
                            <div>
                               <p className="font-extrabold text-[#0F172A] text-sm tracking-tighter leading-none mb-1.5">{req.wing_name} - {req.flat_number}</p>
                               <div className="flex items-center gap-2">
                                 <User className="w-3 h-3 text-slate-400" />
                                 <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none">{req.resident_name}</p>
                               </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${req.type === 'move_in' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {req.type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-4">
                           <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              {req.move_date}
                           </div>
                           <p className="text-[10px] text-gray-500 ml-6">{req.time_slot}</p>
                        </td>
                        <td className="p-4">
                          <span className={`status-badge ${getStatusColor(req.status)}`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => setSelectedRequest(req)}
                            className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-black transition-all flex items-center gap-2 ml-auto"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            View Shifting Log
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination Controls */}
              <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <p className="text-xs text-gray-500 font-medium">
                  Showing {Math.min(filteredRequests.length, (currentPage - 1) * itemsPerPage + 1)} to {Math.min(filteredRequests.length, currentPage * itemsPerPage)} of {filteredRequests.length} requests
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-xs font-bold border border-gray-200 rounded bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Previous
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 text-xs font-bold rounded flex items-center justify-center transition-all ${currentPage === page ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-600'}`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-xs font-bold border border-gray-200 rounded bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-6 bg-gray-50 border-b border-gray-200">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Weekly Move Schedule
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-4 text-left text-[10px] font-black text-gray-400 uppercase border-b border-gray-200">Date</th>
                  {['08:00 AM - 12:00 PM', '10:00 AM - 02:00 PM', '02:00 PM - 06:00 PM', '04:00 PM - 08:00 PM'].map(slot => (
                    <th key={slot} className="p-4 text-left text-[10px] font-black text-gray-400 uppercase border-b border-gray-200">{slot}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...new Set(requests.map(r => r.move_date))].sort().map(date => (
                  <tr key={date} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 border-b border-gray-100 text-sm font-bold text-gray-700">{date}</td>
                    {['08:00 AM - 12:00 PM', '10:00 AM - 02:00 PM', '02:00 PM - 06:00 PM', '04:00 PM - 08:00 PM'].map(slot => {
                      const slotReqs = requests.filter(r => r.move_date === date && r.time_slot === slot);
                      return (
                        <td key={slot} className="p-4 border-b border-gray-100">
                          {slotReqs.map(r => (
                            <div 
                              key={r.id} 
                              onClick={() => setSelectedRequest(r)}
                              className={`mb-1 p-2 rounded text-[10px] font-bold cursor-pointer transition-all hover:scale-105 ${
                                r.status === 'approved' ? 'bg-blue-600 text-white' : 
                                r.status === 'pending' ? 'bg-gray-200 text-gray-600' : 
                                'bg-emerald-600 text-white'
                              }`}
                            >
                              {r.flat_number} ({r.type === 'move_in' ? 'IN' : 'OUT'})
                            </div>
                          ))}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 flex-shrink-0">
              <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tighter">
                  {selectedRequest.type === 'move_in' ? 'Move-In Authorization' : 'Move-Out Clearance'}
                </h2>
                <p className="text-[10px] text-blue-600 uppercase tracking-[0.2em] font-black flex items-center gap-1.5 mt-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {selectedRequest.type === 'move_in' ? 'RESIDENT ENTRY PERMIT AUTHORIZED' : 'UNIT EXIT CLEARANCE ISSUED'}
                </p>
              </div>
              <button onClick={() => setSelectedRequest(null)} className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                <XCircle className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
              {/* Resident Entry Permit Card Section */}
              <div className="mb-8 p-6 border-2 border-dashed border-blue-200 rounded-[2rem] bg-blue-50/50 relative overflow-hidden transition-all hover:shadow-xl hover:shadow-blue-50/50">
                <div className="absolute right-[-20px] top-[-20px] opacity-10 rotate-12">
                   <ShieldCheck className="w-48 h-48" />
                </div>
                
                <div className="flex justify-between items-start mb-6">
                   <div className="flex-1">
                     <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-1">Pass ID: #MOV-{selectedRequest.id}</p>
                     <h3 className="text-2xl font-black text-gray-900 leading-none">
                        {selectedRequest.type === 'move_in' ? 'RESIDENT ENTRY PERMIT' : 'UNIT EXIT CLEARANCE'}
                     </h3>
                   </div>
                   {/* Symbolic QR Code & Stamp */}
                   <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="w-16 h-16 bg-white border border-blue-100 rounded-xl flex items-center justify-center p-1.5 shadow-sm group-hover:border-blue-300 transition-all">
                         <div className="w-full h-full border-[1.5px] border-blue-900/10 rounded flex flex-wrap gap-[1px] p-[2px] opacity-40">
                            {Array.from({length: 49}).map((_, i) => (
                               <div key={i} className={`w-[5px] h-[5px] rounded-[1px] ${[0,1,5,6,7,12,13,20,27,34,42,48,47,43,35].includes(i) || Math.random() > 0.6 ? 'bg-blue-900' : 'bg-transparent'}`} />
                            ))}
                         </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] font-black text-gray-400 uppercase leading-none mb-1">Pass Validity</p>
                        <p className="text-[11px] font-black text-blue-900 tracking-tighter">{selectedRequest.move_date}</p>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4 relative z-10">
                   <div className="p-4 bg-white rounded-2xl shadow-sm border border-blue-100 group transition-all hover:border-blue-400">
                      <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Allocated Unit</p>
                      <p className="text-xl font-black text-blue-900">{selectedRequest.flat_number}</p>
                   </div>
                   <div className="p-4 bg-white rounded-2xl shadow-sm border border-blue-100 group transition-all hover:border-blue-400">
                      <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Authorized Individual</p>
                      <p className="text-xl font-black text-gray-900">{selectedRequest.resident_name}</p>
                   </div>
                </div>

                <div className="mt-6 pt-6 border-t border-blue-100/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full animate-pulse ${selectedRequest.status === 'approved' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                    <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest">
                      {selectedRequest.status === 'approved' ? 'VALD PASS ISSUED' : 
                       selectedRequest.status === 'in_progress' ? 'SESSION ACTIVE' : 
                       selectedRequest.status.toUpperCase()}
                    </p>
                  </div>
                  {['approved', 'in_progress'].includes(selectedRequest.status) && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-blue-200 rounded-full shadow-sm">
                      <Clock className="w-3 h-3 text-blue-600" />
                      <p className="text-[9px] font-black text-blue-900">{selectedRequest.time_slot}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-6 flex gap-3">
                <div className={`flex-1 p-3 rounded-xl border ${selectedRequest.status === 'approved' || selectedRequest.status === 'completed' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-gray-50 border-gray-100 text-gray-500'}`}>
                  <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Pass Status</p>
                  <p className="text-sm font-black flex items-center gap-2">
                    {['approved', 'in_progress', 'completed', 'closed'].includes(selectedRequest.status) ? <><CheckCircle2 className="w-4 h-4"/> PASS ISSUED</> : 'AWAITING APPROVAL'}
                  </p>
                </div>
                {selectedRequest.lift_required && (
                  <div className={`flex-1 p-3 rounded-xl border ${selectedRequest.status === 'approved' || selectedRequest.status === 'completed' || selectedRequest.status === 'closed' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-50 border-gray-100 text-gray-500'}`}>
                    <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Lift Allocation</p>
                    <p className="text-sm font-black flex items-center gap-2">
                      <Truck className="w-4 h-4"/> {['approved', 'in_progress', 'completed', 'closed'].includes(selectedRequest.status) ? 'RESERVED' : 'PENDING'}
                    </p>
                  </div>
                )}
              </div>

              {selectedRequest.override_flag && (
                <div className="mb-6 p-4 bg-purple-50 border border-purple-100 rounded-xl">
                  <div className="flex items-center gap-3">
                     <AlertTriangle className="w-5 h-5 text-purple-600" />
                     <div>
                        <p className="text-[10px] font-black text-purple-600 uppercase">Admin Override Active</p>
                        <p className="text-sm font-bold text-purple-900">{selectedRequest.override_reason || 'Urgent bypass granted'}</p>
                     </div>
                  </div>
                </div>
              )}
              {selectedRequest.type === 'move_out' && (
                <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 border ${
                  (selectedRequest as any).pending_dues > 0 
                    ? 'bg-red-50 border-red-200' 
                    : 'bg-emerald-50 border-emerald-200'
                }`}>
                  { (selectedRequest as any).pending_dues > 0 ? (
                    <>
                      <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-bold text-red-800">Move-Out Blocked: Outstanding Dues</h4>
                        <p className="text-xs text-red-700 mt-1">
                          This flat has <strong>₹{(selectedRequest as any).pending_dues}</strong> in pending maintenance invoices. 
                          Clearance is mandatory for move-out.
                        </p>
                        <a 
                          href="/societyadmin/billing" 
                          className="inline-block mt-3 text-[10px] font-black underline tracking-tighter hover:text-red-900 transition-colors"
                        >
                          VIEW DETAILS & SETTLE INVOICES
                        </a>
                      </div>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-bold text-emerald-800">Clearance OK</h4>
                        <p className="text-xs text-emerald-700 mt-1">No pending maintenance dues found for this flat. You may proceed with approval.</p>
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <section>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Resident Info</label>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                        {selectedRequest.resident_name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{selectedRequest.resident_name}</p>
                        <p className="text-xs text-gray-500">{selectedRequest.contact_number}</p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Schedule</label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <p className="text-sm font-bold text-gray-800 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        {selectedRequest.move_date}
                      </p>
                      <p className="text-xs text-gray-500 ml-6">{selectedRequest.time_slot}</p>
                    </div>
                  </section>

                  <section>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-4">Shifting Timeline</label>
                    <div className="space-y-0 pl-1">
                      {/* Request Stage */}
                      <div className="flex gap-4 min-h-[60px]">
                        <div className="flex flex-col items-center">
                          <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0">
                            <FileText className="w-3 h-3" />
                          </div>
                          <div className="w-0.5 flex-1 bg-gray-200 my-1"></div>
                        </div>
                        <div className="pb-4">
                           <p className="text-sm font-bold text-gray-900">Request Filed</p>
                           <p className="text-[10px] text-gray-400 mt-0.5">Move session successfully requested from Resident App</p>
                        </div>
                      </div>

                      {/* Approval Stage */}
                      <div className="flex gap-4 min-h-[60px]">
                        <div className="flex flex-col items-center">
                          <div className={`w-6 h-6 rounded-full ${selectedRequest.status !== 'pending' && selectedRequest.status !== 'rejected' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-300'} flex items-center justify-center shrink-0`}>
                            <CheckCircle2 className="w-3 h-3" />
                          </div>
                          <div className={`w-0.5 flex-1 ${selectedRequest.entry_time ? 'bg-emerald-600' : 'bg-gray-200'} my-1`}></div>
                        </div>
                        <div className="pb-4">
                           <p className={`text-sm font-bold ${selectedRequest.status !== 'pending' && selectedRequest.status !== 'rejected' ? 'text-gray-900' : 'text-gray-400'}`}>Admin Approval</p>
                           <p className="text-[10px] text-gray-400 mt-0.5">Pass Issued & Resource (Lift) Reserved</p>
                        </div>
                      </div>

                      {/* Entry Stage */}
                      <div className="flex gap-4 min-h-[60px]">
                        <div className="flex flex-col items-center">
                          <div className={`w-6 h-6 rounded-full ${selectedRequest.entry_time ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-300'} flex items-center justify-center shrink-0`}>
                            <Truck className="w-3 h-3" />
                          </div>
                          <div className={`w-0.5 flex-1 ${selectedRequest.exit_time ? 'bg-amber-600' : 'bg-gray-200'} my-1`}></div>
                        </div>
                        <div className="pb-4">
                           <p className={`text-sm font-bold ${selectedRequest.entry_time ? 'text-gray-900' : 'text-gray-400'}`}>
                             {selectedRequest.type === 'move_in' ? 'Move-In Started' : 'Move-Out Started'} (In-Progress)
                           </p>
                           <p className="text-[10px] text-gray-400 mt-0.5">
                             {selectedRequest.entry_time ? `Started at ${new Date(selectedRequest.entry_time).toLocaleTimeString()}` : 'Awaiting coordination start'}
                           </p>
                        </div>
                      </div>

                      {/* Exit Stage */}
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-6 h-6 rounded-full ${selectedRequest.exit_time ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-300'} flex items-center justify-center shrink-0`}>
                            <ArrowRight className="w-3 h-3" />
                          </div>
                        </div>
                        <div>
                           <p className={`text-sm font-bold ${selectedRequest.exit_time ? 'text-gray-900' : 'text-gray-400'}`}>
                             {selectedRequest.type === 'move_in' ? 'Move-In Finished' : 'Move-Out Finished'} (Completed)
                           </p>
                           <p className="text-[10px] text-gray-400 mt-0.5">
                             {selectedRequest.exit_time ? `Finalized at ${new Date(selectedRequest.exit_time).toLocaleTimeString()}` : 'Final security/audit pending'}
                           </p>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>

                <div className="space-y-6">
                  <section>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Logistics & Resources</label>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 border border-gray-100 rounded-lg">
                        <div>
                          <span className="text-sm font-medium text-gray-600 block">Lift Requirement</span>
                          {selectedRequest.lift_required && selectedRequest.lift_number && (
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-tighter">Assigned: {selectedRequest.lift_number}</span>
                          )}
                        </div>
                        {selectedRequest.lift_required ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <XCircle className="w-5 h-5 text-gray-300" />}
                      </div>
                      <div className="flex justify-between items-center p-3 border border-gray-100 rounded-lg">
                        <span className="text-sm font-medium text-gray-600">Vehicle Passes</span>
                        <div className="flex items-center gap-1">
                          <Truck className="w-4 h-4 text-gray-400" />
                          <span className="font-black text-gray-900">{selectedRequest.vehicle_count}</span>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Documents</label>
                    <button className="w-full flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                      <span className="flex items-center gap-2 text-sm font-medium text-gray-600">
                        <FileText className="w-4 h-4" /> ID Proof & Agreement
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </section>
                </div>
              </div>

              {selectedRequest.type === 'move_out' && (selectedRequest.status === 'pending' || selectedRequest.status === 'approved' || selectedRequest.status === 'in_progress') && (
                <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-200">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" /> 
                    {selectedRequest.status === 'pending' ? 'Pre-Approval Checklist' : 'Status Verification'}
                  </h3>
                  {selectedRequest.status === 'pending' && (
                    <div className="mb-4 p-3 bg-white rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
                       <div>
                          <p className="text-[10px] font-black text-purple-600 uppercase">Emergency Bypass (Admin Override)</p>
                          <p className="text-[9px] text-slate-400">Ignore checklist validation for urgent moves</p>
                       </div>
                       <input 
                         type="checkbox" 
                         checked={overrideFlag}
                         onChange={(e) => setOverrideFlag(e.target.checked)}
                         className="w-5 h-5 rounded border-slate-300 text-purple-600"
                       />
                    </div>
                  )}
                  {overrideFlag && selectedRequest.status === 'pending' && (
                    <textarea 
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      placeholder="Enter mandatory override reason..."
                      className="w-full p-2 text-xs border border-purple-200 rounded-lg mb-4 h-16 outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  )}
                  <div className="space-y-4">
                    <div className={`flex items-center justify-between p-3 rounded-xl border ${selectedRequest.pending_dues! > 0 && !financialCleared ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${selectedRequest.pending_dues! > 0 && !financialCleared ? 'bg-red-500' : 'bg-emerald-500'}`}>
                          <FileText className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <span className="text-sm font-bold text-slate-700 block">Financial Clearance</span>
                          <span className={`text-[10px] font-black uppercase ${selectedRequest.pending_dues! > 0 && !financialCleared ? 'text-red-500' : 'text-emerald-600'}`}>
                            {selectedRequest.pending_dues! > 0 && !financialCleared ? `₹${selectedRequest.pending_dues} Pending` : 'All Dues Cleared / Overridden'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                         <span className="text-[10px] font-bold text-slate-400 uppercase">Override?</span>
                         <input 
                           type="checkbox" 
                           checked={financialCleared} 
                           disabled={(selectedRequest.status === 'in_progress' || selectedRequest.status === 'approved') && selectedRequest.pending_dues! > 0}
                           onChange={(e) => setFinancialCleared(e.target.checked)}
                           className="w-4 h-4 rounded border-slate-300 text-blue-600 disabled:opacity-50"
                         />
                      </div>
                    </div>
                    <label className={`flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 ${selectedRequest.status === 'in_progress' && selectedRequest.held_assets! > 0 ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:border-blue-300'} transition-all`}>
                      <input 
                        type="checkbox" 
                        checked={assetsCleared} 
                        disabled={(selectedRequest.status === 'in_progress' || selectedRequest.status === 'approved') && selectedRequest.held_assets! > 0}
                        onChange={(e) => setAssetsCleared(e.target.checked)}
                        className="w-5 h-5 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50" 
                      />
                      <div>
                        <span className="text-sm font-bold text-slate-700 block">Society Assets Returned & Accounts Settled</span>
                         <span 
                           className={`text-[10px] font-black uppercase ${selectedRequest.held_assets! > 0 ? 'text-red-500' : 'text-slate-400'}`}
                           title={selectedRequest.asset_names || 'No assets'}
                         >
                           {selectedRequest.held_assets! > 0 ? `${selectedRequest.held_assets} Assets: ${selectedRequest.asset_names}` : 'No active assets found'}
                         </span>
                      </div>
                    </label>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 transition-all">
                        <label className="flex items-center gap-3 cursor-pointer flex-1">
                          <input 
                            type="checkbox" 
                            checked={propertyChecked} 
                            onChange={(e) => setPropertyChecked(e.target.checked)}
                            className="w-5 h-5 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500" 
                          />
                          <span className="text-sm font-bold text-slate-700">Property Inspection Passed (Damages Assessed)</span>
                        </label>
                        <button 
                          onClick={() => setShowDamageAssessment(!showDamageAssessment)}
                          className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider transition-all ${showDamageAssessment ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                          {showDamageAssessment ? 'Close Assessment' : (damageNotes ? 'Edit Damages' : 'Report Damages')}
                        </button>
                      </div>

                      {showDamageAssessment && (
                        <div className="p-4 bg-white rounded-xl border-2 border-slate-200 space-y-4 animate-in fade-in slide-in-from-top-1">
                           <div>
                              <label className="text-[10px] font-black text-slate-500 uppercase block mb-2">Damage Description</label>
                              <textarea 
                                value={damageNotes}
                                onChange={(e) => setDamageNotes(e.target.value)}
                                className="w-full p-3 bg-slate-50 border border-slate-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 h-20"
                                placeholder="Describe wall chips, floor scratches, or broken fixtures..."
                              />
                           </div>
                           <div className="flex items-center gap-4">
                              <div className="flex-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase block mb-2">Penalty / Deduction (₹)</label>
                                <input 
                                  type="number"
                                  value={penaltyAmount}
                                  onChange={(e) => setPenaltyAmount(Number(e.target.value))}
                                  className="w-full p-3 bg-slate-50 border border-slate-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                                />
                              </div>
                              <button 
                                onClick={handleSaveDamage}
                                className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-all"
                              >
                                Save Assessment
                              </button>
                           </div>
                        </div>
                      )}
                      
                      {selectedRequest.lift_required && (
                        <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100/50">
                           <label className="text-[10px] font-black text-blue-600/60 uppercase block mb-2">Assign Lift (Resource Block)</label>
                           <input 
                             type="text"
                             value={liftNumber}
                             onChange={(e) => setLiftNumber(e.target.value)}
                             className="w-full p-3 bg-white border border-blue-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 font-bold text-blue-900"
                             placeholder="e.g. Service Lift A, Wing 2 Main Lift..."
                           />
                           <p className="text-[10px] text-blue-400 mt-2 font-medium italic">Residents will see this in their Start Move confirmation</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {selectedRequest.clearance_pass_id && (
                <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-emerald-600 uppercase">Clearance Reference</p>
                      <p className="text-lg font-black text-emerald-800">{selectedRequest.clearance_pass_id}</p>
                    </div>
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 opacity-20" />
                  </div>
                </div>
              )}

              {selectedRequest.status === 'completed' && selectedRequest.damage_notes && (
                <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <h4 className="text-sm font-bold text-red-800 flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    Damage Reported
                  </h4>
                  <p className="text-xs text-red-700">{selectedRequest.damage_notes}</p>
                  {selectedRequest.penalty_amount! > 0 && (
                    <p className="text-sm font-black text-red-600 mt-2">Penalty: ₹{selectedRequest.penalty_amount}</p>
                  )}
                </div>
              )}

              {selectedRequest.status === 'pending' && (
                <div className="mt-8 pt-8 border-t border-gray-100">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">Admin Response</label>
                   <textarea 
                    className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm h-24 mb-6"
                    placeholder="Add approval notes or rejection reason..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                   />
                </div>
              )}

              {/* Resource Allocation Box (Only for Approved/In-Progress) */}
              {(selectedRequest.status === 'approved' || selectedRequest.status === 'in_progress') && (
                <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                   <h4 className="text-xs font-black text-blue-700 uppercase tracking-wider mb-3">Active Logistics Control</h4>
                   <div className="flex gap-4">
                      <div className="flex-1">
                         <label className="text-[9px] font-bold text-blue-600 uppercase block mb-1">Assigned Lift / Service Access</label>
                         <input 
                           type="text" 
                           value={liftNumber}
                           onChange={(e) => setLiftNumber(e.target.value)}
                           placeholder="e.g. Service Lift B1"
                           className="w-full p-3 bg-white border border-blue-200 rounded-lg text-sm font-bold text-blue-900 focus:ring-2 focus:ring-blue-500 outline-none"
                         />
                      </div>
                   </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-gray-50 flex gap-4">
              {selectedRequest.status === 'pending' ? (
                <>
                  <button 
                    onClick={() => handleStatusUpdate(selectedRequest.id, 'approved')}
                    disabled={selectedRequest.type === 'move_out' && (selectedRequest.pending_dues! > 0 && !financialCleared || !assetsCleared || !propertyChecked)}
                    className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    Approve & Issue Pass
                  </button>
                  <button 
                    onClick={() => handleStatusUpdate(selectedRequest.id, 'rejected')}
                    className="flex-1 py-3 bg-white border border-red-200 text-red-600 rounded-xl font-bold hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-5 h-5" />
                    Reject Request
                  </button>
                </>
              ) : (
                <div className="flex-1 flex flex-col gap-3">
                  <div className="flex gap-2">
                    {selectedRequest.status === 'approved' && (
                      <button 
                        onClick={() => handleLogExecution(selectedRequest.id, 'entry')}
                        className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
                      >
                        <Truck className="w-5 h-5" />
                        START {selectedRequest.type === 'move_in' ? 'MOVE-IN' : 'MOVE-OUT'}
                      </button>
                    )}
                    {selectedRequest.status === 'in_progress' && (
                      <button 
                        onClick={() => handleLogExecution(selectedRequest.id, 'exit')}
                        className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100 flex items-center justify-center gap-2"
                      >
                        <ArrowRight className="w-5 h-5" />
                        COMPLETE MOVE
                      </button>
                    )}
                  </div>

                  {(selectedRequest.status === 'approved' || selectedRequest.status === 'in_progress') && selectedRequest.type === 'move_out' && (
                    <button 
                      onClick={() => handleStatusUpdate(selectedRequest.id, selectedRequest.status)}
                      disabled={(selectedRequest.status === 'in_progress' || selectedRequest.status === 'approved') && 
                        ((selectedRequest.pending_dues! > 0 && !financialCleared) || 
                         (selectedRequest.held_assets! > 0 && !assetsCleared) || 
                         !propertyChecked)}
                      className={`flex-1 py-3 ${((selectedRequest.status === 'in_progress' || selectedRequest.status === 'approved') && 
                        ((selectedRequest.pending_dues! > 0 && !financialCleared) || 
                         (selectedRequest.held_assets! > 0 && !assetsCleared) || 
                         !propertyChecked)) ? 'bg-red-600' : 'bg-emerald-600'} text-white rounded-xl font-bold hover:opacity-90 disabled:bg-red-200 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-200 flex flex-col items-center justify-center px-4`}
                    >
                      <div className="flex items-center gap-2">
                        {((selectedRequest.status === 'in_progress' || selectedRequest.status === 'approved') && 
                          ((selectedRequest.pending_dues! > 0 && !financialCleared) || 
                           (selectedRequest.held_assets! > 0 && !assetsCleared) || 
                           !propertyChecked)) ? <XCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                        {((selectedRequest.status === 'in_progress' || selectedRequest.status === 'approved') && 
                          ((selectedRequest.pending_dues! > 0 && !financialCleared) || 
                           (selectedRequest.held_assets! > 0 && !assetsCleared) || 
                           !propertyChecked)) ? 'EXIT BLOCKED: PENDING DUES/ASSETS' : 'Update Audit Record'}
                      </div>
                      {((selectedRequest.status === 'in_progress' || selectedRequest.status === 'approved') && 
                        ((selectedRequest.pending_dues! > 0 && !financialCleared) || 
                         (selectedRequest.held_assets! > 0 && !assetsCleared) || 
                         !propertyChecked)) && (
                        <span className="text-[8px] font-black uppercase tracking-tighter mt-1 text-center">
                          Audit Failed: Resolve Dues / Assets / Property with Resident
                        </span>
                      )}
                    </button>
                  )}
                  {selectedRequest.status === 'completed' && (
                    <button 
                      onClick={() => handleCloseMove(selectedRequest.id)}
                      className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100 flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      Issue Final Clearance & Close
                    </button>
                  )}
                  <button 
                    onClick={() => setSelectedRequest(null)}
                    className="flex-1 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all"
                  >
                    Close View
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
