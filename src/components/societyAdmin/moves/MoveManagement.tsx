"use client";

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
  Building,
  RefreshCw,
  ArrowUpRight,
  ChevronRight,
  X,
  MoreVertical,
  CheckCircle,
  LayoutGrid,
  List
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiClient, ApiResponse } from '@/lib/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

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
  const [damageNotes, setDamageNotes] = useState('');
  const [penaltyAmount, setPenaltyAmount] = useState(0);
  const [liftNumber, setLiftNumber] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(() => fetchRequests(true), 10000);
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
    }
  }, [selectedRequest]);

  const fetchRequests = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await apiClient<ApiResponse<MoveRequest[]>>('/move/list', { withAuth: true });
      if (data.success && data.data) setRequests(data.data);
    } catch (error) {
      if (!silent) toast.error('Failed to sync move registry');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: number, status: string) => {
    try {
      const data = await apiClient(`/move/status/${id}`, {
        method: 'PUT',
        withAuth: true,
        body: { 
          status, remarks, assets_cleared: assetsCleared, property_check: propertyChecked, 
          financial_cleared: financialCleared, override_flag: overrideFlag, 
          override_reason: overrideReason, lift_number: liftNumber
        }
      });
      if (data.success) {
        toast.success(`Request ${status} successfully`);
        fetchRequests();
        setSelectedRequest(null);
      }
    } catch (e) { toast.error('Update failed'); }
  };

  const handleLogExecution = async (requestId: number, action: 'entry' | 'exit') => {
    try {
      const data = await apiClient(`/move/log/${requestId}`, {
        method: 'POST', withAuth: true, body: { action, lift_number: liftNumber }
      });
      if (data.success) {
        toast.success(`Movement ${action === 'entry' ? 'Started' : 'Finalized'}`);
        fetchRequests();
        setSelectedRequest(null);
      }
    } catch (e) { toast.error('Logging failed'); }
  };

  const filteredRequests = requests.filter(req => {
    const matchesSearch = req.resident_name.toLowerCase().includes(searchQuery.toLowerCase()) || req.flat_number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || req.status === filter;
    return matchesSearch && matchesFilter;
  });

  const paginatedRequests = filteredRequests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading && requests.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-pulse text-slate-400 font-bold uppercase tracking-widest text-xs">Syncing Movement Logistics...</div>
      </div>
    );
  }

  return (
    <main className="flex-1 bg-white text-[#0b1c30] antialiased p-8 font-['Manrope',_sans-serif]">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex justify-between items-end">
          <div>
            <nav className="flex gap-2 text-[12px] font-bold text-[#565e74] mb-2 uppercase tracking-wide">
              <span>Management</span>
              <span>/</span>
              <span className="text-[#004ac6]">Shift Logistics</span>
            </nav>
            <h2 className="text-[32px] font-bold leading-tight tracking-tight text-[#0b1c30]">Movement Terminal</h2>
          </div>
          <div className="flex gap-3">
             <div className="flex p-1 bg-slate-50 border border-slate-100 rounded-lg">
                <button 
                  onClick={() => setView('list')}
                  className={clsx("p-2 rounded-md transition-all", view === 'list' ? "bg-white text-[#004ac6] shadow-sm" : "text-slate-400 hover:text-[#004ac6]")}
                >
                  <List className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setView('schedule')}
                  className={clsx("p-2 rounded-md transition-all", view === 'schedule' ? "bg-white text-[#004ac6] shadow-sm" : "text-slate-400 hover:text-[#004ac6]")}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
             </div>
            <button 
              onClick={() => fetchRequests()}
              className="bg-white border border-slate-200 text-[#565e74] px-5 py-2 rounded-lg flex items-center gap-2 transition-all font-bold text-[14px] hover:bg-slate-50"
            >
              <RefreshCw className={clsx("w-4 h-4", loading && "animate-spin")} />
              Sync
            </button>
          </div>
        </div>

        {/* Advisory Panel */}
        <AnimatePresence>
          {requests.some(r => r.status === 'in_progress') && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-amber-50 border border-amber-100 rounded-2xl p-6 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-200">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-[14px] font-bold text-amber-900 uppercase tracking-tight">Active Shift Operations</h3>
                  <p className="text-[12px] text-amber-700/80 font-medium mt-0.5">
                    {requests.filter(r => r.status === 'in_progress').length} unit(s) currently in-transit. Service infrastructure load is high.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                 {requests.filter(r => r.status === 'in_progress').map(r => (
                   <span key={r.id} className="px-3 py-1 bg-white border border-amber-200 rounded-lg text-[11px] font-bold text-amber-900 shadow-sm">
                     {r.wing_name}-{r.flat_number} {r.lift_number ? `(Lift ${r.lift_number})` : ''}
                   </span>
                 ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {view === 'list' ? (
          <>
            {/* Control Bar */}
            <div className="bg-white rounded-xl border border-slate-100 p-3 flex flex-col md:flex-row items-center gap-4">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by resident name or flat number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-lg text-[13px] outline-none focus:bg-white focus:ring-1 focus:ring-[#004ac6] transition-all"
                />
              </div>
              <div className="flex items-center gap-1 p-1 bg-slate-50 border border-slate-100 rounded-lg">
                {['all', 'pending', 'approved', 'in_progress', 'completed', 'closed'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={clsx(
                      "px-4 py-1.5 text-[12px] font-bold rounded-md transition-all capitalize",
                      filter === f ? "bg-white text-[#004ac6] shadow-sm border border-slate-100" : "text-[#565e74] hover:text-[#004ac6]"
                    )}
                  >
                    {f === 'in_progress' ? 'Active' : f}
                  </button>
                ))}
              </div>
            </div>

            {/* Registry Table */}
            <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-50">
                  <thead className="bg-slate-50/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-[11px] font-bold text-[#565e74] uppercase tracking-wider">Unit / Resident</th>
                      <th className="px-6 py-4 text-left text-[11px] font-bold text-[#565e74] uppercase tracking-wider">Vector</th>
                      <th className="px-6 py-4 text-left text-[11px] font-bold text-[#565e74] uppercase tracking-wider">Scheduled Window</th>
                      <th className="px-6 py-4 text-left text-[11px] font-bold text-[#565e74] uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-right text-[11px] font-bold text-[#565e74] uppercase tracking-wider">Logistics</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {paginatedRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/50 transition-all group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={clsx(
                              "w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm",
                              req.status === 'in_progress' ? "bg-amber-500" : "bg-slate-50 text-slate-400 border border-slate-100"
                            )}>
                              <Building className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-[14px] font-bold text-[#0b1c30]">{req.wing_name} - {req.flat_number}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <User className="w-3 h-3 text-slate-400" />
                                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">{req.resident_name}</p>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={clsx(
                            "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase",
                            req.type === 'move_in' ? "bg-blue-50 text-blue-700" : "bg-emerald-50 text-emerald-700"
                          )}>
                            {req.type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-[13px] font-bold text-[#0b1c30] flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-[#004ac6]" />
                            {req.move_date}
                          </p>
                          <p className="text-[11px] text-slate-500 font-medium ml-5">{req.time_slot}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={clsx(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tighter",
                            req.status === 'pending' ? "bg-yellow-50 text-yellow-700" :
                            req.status === 'approved' ? "bg-blue-50 text-blue-700" :
                            req.status === 'in_progress' ? "bg-amber-50 text-amber-700 animate-pulse" :
                            req.status === 'completed' || req.status === 'closed' ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                          )}>
                            {req.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => setSelectedRequest(req)}
                            className="text-[12px] font-bold text-[#004ac6] flex items-center gap-2 ml-auto hover:bg-[#004ac6] hover:text-white px-3 py-1.5 rounded-lg transition-all"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            Audit Log
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="p-6 bg-slate-50/50 border-b border-slate-100">
              <h3 className="text-[14px] font-bold text-[#0b1c30] flex items-center gap-2 uppercase tracking-widest">
                <Calendar className="w-4 h-4 text-[#004ac6]" />
                Resource Allocation Grid
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50/30">
                    <th className="p-6 text-left text-[11px] font-bold text-[#565e74] uppercase border-b border-slate-100">Temporal Node</th>
                    {['08:00 AM - 12:00 PM', '10:00 AM - 02:00 PM', '02:00 PM - 06:00 PM', '04:00 PM - 08:00 PM'].map(slot => (
                      <th key={slot} className="p-6 text-left text-[11px] font-bold text-[#565e74] uppercase border-b border-slate-100">{slot}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...new Set(requests.map(r => r.move_date))].sort().map(date => (
                    <tr key={date} className="hover:bg-slate-50/20 transition-all">
                      <td className="p-6 border-b border-slate-50 text-[13px] font-bold text-[#0b1c30]">{date}</td>
                      {['08:00 AM - 12:00 PM', '10:00 AM - 02:00 PM', '02:00 PM - 06:00 PM', '04:00 PM - 08:00 PM'].map(slot => {
                        const slotReqs = requests.filter(r => r.move_date === date && r.time_slot === slot);
                        return (
                          <td key={slot} className="p-4 border-b border-slate-50 min-w-[200px]">
                            {slotReqs.map(r => (
                              <div 
                                key={r.id} 
                                onClick={() => setSelectedRequest(r)}
                                className={clsx(
                                  "mb-2 p-2.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all hover:scale-105 shadow-sm border",
                                  r.status === 'approved' ? "bg-blue-600 text-white border-blue-500" : 
                                  r.status === 'in_progress' ? "bg-amber-500 text-white border-amber-400" :
                                  r.status === 'pending' ? "bg-slate-100 text-slate-600 border-slate-200" : 
                                  "bg-emerald-600 text-white border-emerald-500"
                                )}
                              >
                                <div className="flex justify-between items-center">
                                  <span>{r.wing_name}-{r.flat_number}</span>
                                  <span className="opacity-70">{r.type === 'move_in' ? 'IN' : 'OUT'}</span>
                                </div>
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

        {/* Action / Detail Modal */}
        <AnimatePresence>
          {selectedRequest && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0b1c30]/10 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]"
              >
                <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                  <div>
                    <h3 className="text-[20px] font-bold text-[#0b1c30]">Logistics Clearance</h3>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#004ac6]" />
                      Pass ID: #MOV-{selectedRequest.id}
                    </p>
                  </div>
                  <button onClick={() => setSelectedRequest(null)} className="p-2 hover:bg-white rounded-lg transition-all"><X className="w-5 h-5 text-slate-300" /></button>
                </div>
                
                <div className="p-8 overflow-y-auto custom-scrollbar space-y-8">
                  {/* Digital Clearance Pass */}
                  <div className="p-8 bg-blue-600 rounded-3xl text-white relative overflow-hidden shadow-xl shadow-blue-200">
                    <div className="absolute right-[-40px] bottom-[-40px] opacity-10 rotate-12"><Truck className="w-64 h-64" /></div>
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-8">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70">Official Entry Permit</p>
                          <h4 className="text-3xl font-black tracking-tighter mt-1">{selectedRequest.type === 'move_in' ? 'UNIT ARRIVAL' : 'UNIT DEPARTURE'}</h4>
                        </div>
                        <div className="bg-white/10 p-2 rounded-xl backdrop-blur-md border border-white/20">
                           <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center p-1">
                              <div className="w-full h-full border border-blue-900/10 rounded flex flex-wrap gap-[1px] p-[2px] opacity-40">
                                 {[...Array(36)].map((_, i) => <div key={i} className={clsx("w-1 h-1 rounded-[1px]", Math.random() > 0.5 ? "bg-blue-900" : "bg-transparent")} />)}
                              </div>
                           </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-8">
                        <div>
                          <p className="text-[9px] font-bold uppercase opacity-60">Subscriber</p>
                          <p className="text-xl font-black">{selectedRequest.resident_name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] font-bold uppercase opacity-60">Terminal Code</p>
                          <p className="text-xl font-black">{selectedRequest.wing_name}-{selectedRequest.flat_number}</p>
                        </div>
                      </div>
                      <div className="mt-8 pt-6 border-t border-white/20 flex justify-between items-end">
                        <div>
                          <p className="text-[9px] font-bold uppercase opacity-60">Scheduled Window</p>
                          <p className="text-sm font-bold">{selectedRequest.move_date} • {selectedRequest.time_slot}</p>
                        </div>
                        <div className="px-4 py-1 bg-white/20 rounded-full border border-white/30 backdrop-blur-sm">
                          <p className="text-[10px] font-black uppercase">{selectedRequest.status}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Financial & Asset Audit */}
                  {selectedRequest.type === 'move_out' && (
                    <div className={clsx(
                      "p-6 rounded-2xl border flex gap-4 items-start",
                      (selectedRequest.pending_dues || 0) > 0 ? "bg-red-50 border-red-100" : "bg-emerald-50 border-emerald-100"
                    )}>
                      {(selectedRequest.pending_dues || 0) > 0 ? <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0" /> : <CheckCircle className="w-6 h-6 text-emerald-500 flex-shrink-0" />}
                      <div>
                        <h4 className={clsx("text-[14px] font-bold", (selectedRequest.pending_dues || 0) > 0 ? "text-red-900" : "text-emerald-900")}>
                          {(selectedRequest.pending_dues || 0) > 0 ? "Financial Block Active" : "Financial Clearance Verified"}
                        </h4>
                        <p className={clsx("text-[12px] mt-1 font-medium", (selectedRequest.pending_dues || 0) > 0 ? "text-red-700/80" : "text-emerald-700/80")}>
                          {(selectedRequest.pending_dues || 0) > 0 
                            ? `Maintenance ledger shows ₹${selectedRequest.pending_dues} outstanding. Serialization of move-out blocked.` 
                            : "No outstanding liabilities detected in the society maintenance ledger."}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Logistics Checklist */}
                  <div className="space-y-4">
                    <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Protocol Verification</h5>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { label: "Lift Reservation", active: selectedRequest.lift_required, sub: selectedRequest.lift_number ? `Assigned: ${selectedRequest.lift_number}` : 'No resource assigned' },
                        { label: "Vehicle Pass", active: selectedRequest.vehicle_count > 0, sub: `${selectedRequest.vehicle_count} Vector(s) Authorized` },
                        { label: "Asset Clearance", active: assetsCleared, sub: 'Society assets verified' },
                        { label: "Property Check", active: propertyChecked, sub: 'Infrastructure integrity OK' }
                      ].map((item, i) => (
                        <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-center group transition-all hover:border-[#004ac6]/20">
                          <div>
                            <p className="text-[13px] font-bold text-[#0b1c30]">{item.label}</p>
                            <p className="text-[10px] text-slate-400 font-medium">{item.sub}</p>
                          </div>
                          {item.active ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <XCircle className="w-5 h-5 text-slate-300" />}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Terminal */}
                  <div className="space-y-4">
                    <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Operation Controls</h5>
                    <div className="flex gap-3">
                      {selectedRequest.status === 'pending' && (
                        <>
                          <button onClick={() => handleStatusUpdate(selectedRequest.id, 'rejected')} className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl font-bold text-[13px] hover:bg-red-100 transition-all">Reject</button>
                          <button onClick={() => handleStatusUpdate(selectedRequest.id, 'approved')} className="flex-[2] py-3 bg-[#004ac6] text-white rounded-xl font-bold text-[13px] hover:bg-[#003ea8] transition-all">Approve & Issue Pass</button>
                        </>
                      )}
                      {selectedRequest.status === 'approved' && (
                        <button onClick={() => handleLogExecution(selectedRequest.id, 'entry')} className="w-full py-4 bg-[#0b1c30] text-white rounded-2xl font-bold text-[14px] flex items-center justify-center gap-2 shadow-xl shadow-slate-200">
                          <Truck className="w-5 h-5" />
                          Initialize Move Session
                        </button>
                      )}
                      {selectedRequest.status === 'in_progress' && (
                        <button onClick={() => handleLogExecution(selectedRequest.id, 'exit')} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold text-[14px] flex items-center justify-center gap-2 shadow-xl shadow-emerald-100">
                          <CheckCircle className="w-5 h-5" />
                          Finalize Movement & Close Session
                        </button>
                      )}
                      {['completed', 'closed'].includes(selectedRequest.status) && (
                        <div className="w-full py-4 bg-slate-50 border border-slate-100 rounded-2xl text-center text-[13px] font-bold text-slate-400 uppercase tracking-widest italic">
                          Session Successfully Finalized
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
