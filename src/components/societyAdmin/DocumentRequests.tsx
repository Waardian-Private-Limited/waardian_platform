"use client";

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  MoreVertical,
  Upload,
  ChevronRight,
  ChevronLeft,
  X,
  ArrowUpRight,
  RefreshCw,
  FileCheck
} from 'lucide-react';
import { useUserStore } from '@/lib/store/userStore';
import { 
  getDocumentRequests, 
  createDocumentRequest, 
  updateDocumentRequest, 
  getDocumentDownloadUrl,
  DocumentRequest 
} from '@/lib/documentRequestClient';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

const STATUS_ICONS = {
  pending: Clock,
  approved: AlertCircle,
  rejected: XCircle,
  processed: Upload,
  completed: CheckCircle,
  completed_by_admin: Upload,
  user_confirmed: CheckCircle,
  user_issue: AlertCircle,
};

export default function DocumentRequests({ role }: { role?: string }) {
  const [requests, setRequests] = useState<DocumentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState<DocumentRequest | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  const [newRequest, setNewRequest] = useState({ documentType: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<string>('');
  const [adminRemarks, setAdminRemarks] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentTypeInput, setDocumentTypeInput] = useState('');
  const [isOtherType, setIsOtherType] = useState(false);

  const roleFromStore = useUserStore(state => state.user?.role);
  const normalizedRole = (role || roleFromStore || 'member').toLowerCase().replace(/_/g, '');
  const isAdmin = ['societyadmin', 'superadmin', 'admin'].includes(normalizedRole);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await getDocumentRequests();
      if (res.success) setRequests(res.data || []);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await createDocumentRequest(newRequest);
      if (res.success) {
        toast.success('Document request submitted successfully');
        setShowCreateModal(false);
        setNewRequest({ documentType: '', description: '' });
        fetchRequests();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!showUpdateModal) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('status', updateStatus);
      formData.append('adminRemarks', adminRemarks);
      if (selectedFile) formData.append('file', selectedFile);

      const res = await updateDocumentRequest(showUpdateModal.id, formData);
      if (res.success) {
        toast.success('Request updated successfully');
        setShowUpdateModal(null);
        setSelectedFile(null);
        setUpdateStatus('');
        setAdminRemarks('');
        fetchRequests();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = async (id: number) => {
    try {
      const res = await getDocumentDownloadUrl(id);
      if (res.success && res.data?.url) {
        window.open(res.data.url, '_blank');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate download link');
    }
  };

  const filteredRequests = requests.filter(req => {
    const matchesSearch = 
      req.documentType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.requester?.username?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || req.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const documentTypes = [
    'NOC (No Objection Certificate)',
    'Payment Receipt',
    'Address Proof',
    'Membership Certificate',
    'Maintenance Certificate',
    'Other'
  ];

  return (
    <main className="flex-1 bg-white text-[#0b1c30] antialiased p-8 font-['Manrope',_sans-serif]">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex justify-between items-end">
          <div>
            <nav className="flex gap-2 text-[12px] font-bold text-[#565e74] mb-2 uppercase tracking-wide">
              <span>Management</span>
              <span>/</span>
              <span className="text-[#004ac6]">Document Requests</span>
            </nav>
            <h2 className="text-[32px] font-bold leading-tight tracking-tight text-[#0b1c30]">Request Registry</h2>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => fetchRequests()}
              className="bg-white border border-slate-200 text-[#565e74] px-5 py-2 rounded-lg flex items-center gap-2 transition-all font-bold text-[14px] hover:bg-slate-50"
            >
              <RefreshCw className={clsx("w-4 h-4", loading && "animate-spin")} />
              Sync
            </button>
            {!isAdmin && (
              <button 
                onClick={() => {
                  setShowCreateModal(true);
                  setIsOtherType(false);
                  setDocumentTypeInput('');
                }}
                className="bg-[#004ac6] hover:bg-[#003ea8] text-white px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all font-bold text-[14px]"
              >
                <Plus className="w-4 h-4" />
                New Request
              </button>
            )}
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-xl border border-slate-100 p-3 flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search requests by type or resident name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-lg text-[13px] outline-none focus:bg-white focus:ring-1 focus:ring-[#004ac6] transition-all"
            />
          </div>
          <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-lg">
            <Filter className="w-4 h-4 text-slate-400" />
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent text-[13px] font-bold text-[#565e74] outline-none border-none"
            >
              <option value="all">All Lifecycle Stages</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="completed_by_admin">Delivered</option>
              <option value="user_confirmed">Confirmed</option>
              <option value="user_issue">Issues Reported</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Request Table */}
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-50">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-[#565e74] uppercase tracking-wider">Document Identity</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-[#565e74] uppercase tracking-wider">Subscriber</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-[#565e74] uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-[#565e74] uppercase tracking-wider">Lifecycle Date</th>
                  <th className="px-6 py-4 text-right text-[11px] font-bold text-[#565e74] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="px-6 py-8"></td>
                    </tr>
                  ))
                ) : filteredRequests.length > 0 ? (
                  filteredRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/50 transition-all group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-[#004ac6]">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[14px] font-bold text-[#0b1c30]">{req.documentType}</p>
                            <p className="text-[11px] text-slate-500 font-medium truncate max-w-[200px]">{req.description || 'No description provided'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-[13px] font-bold text-[#0b1c30]">{req.requester?.username || 'Unknown User'}</p>
                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tighter">{req.requester?.email || 'No email available'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={clsx(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tighter",
                          req.status === 'pending' ? "bg-yellow-50 text-yellow-700" :
                          req.status === 'approved' ? "bg-blue-50 text-blue-700" :
                          req.status === 'completed' || req.status === 'user_confirmed' ? "bg-green-50 text-green-700" :
                          req.status === 'rejected' ? "bg-red-50 text-red-700" : "bg-indigo-50 text-indigo-700"
                        )}>
                          {req.status === 'user_confirmed' ? 'confirmed' : req.status?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[12px] text-slate-500 font-medium">
                        {new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isAdmin && !['user_confirmed', 'rejected'].includes(req.status) && (
                            <button 
                              onClick={() => {
                                setShowUpdateModal(req);
                                setUpdateStatus(req.status);
                                setAdminRemarks(req.adminRemarks || '');
                              }}
                              className="p-2 hover:bg-slate-100 rounded-lg transition-all text-slate-400 hover:text-[#004ac6]"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          )}
                          {(req.status === 'processed' || req.status === 'completed' || req.status === 'completed_by_admin' || req.status === 'user_confirmed' || req.status === 'user_issue') && (
                            <button 
                              onClick={() => handleDownload(req.id)}
                              className="p-2 hover:bg-green-50 rounded-lg transition-all text-green-600"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                          {!isAdmin && (req.status === 'processed' || req.status === 'completed_by_admin' || req.status === 'user_issue') && (
                            <div className="flex gap-2">
                              <button 
                                onClick={async () => {
                                  try {
                                    const formData = new FormData();
                                    formData.append('status', 'user_confirmed');
                                    const res = await updateDocumentRequest(req.id, formData);
                                    if (res.success) { toast.success('Document confirmed'); fetchRequests(); }
                                  } catch (err: any) { toast.error('Confirmation failed'); }
                                }}
                                className="text-[11px] font-bold text-green-600 hover:underline"
                              >
                                Confirm
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-slate-400 font-medium text-[13px]">No document requests found matching your current parameters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* New Request Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0b1c30]/10 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100"
            >
              <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center">
                <div>
                  <h3 className="text-[20px] font-bold text-[#0b1c30]">Submit Request</h3>
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Document Identification</p>
                </div>
                <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-slate-50 rounded-lg transition-all"><X className="w-5 h-5 text-slate-300" /></button>
              </div>
              <form onSubmit={handleCreateRequest} className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Document Category</label>
                    <select 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[13px] outline-none focus:bg-white focus:ring-1 focus:ring-[#004ac6] font-bold transition-all"
                      value={isOtherType ? 'Other' : documentTypeInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'Other') { setIsOtherType(true); setDocumentTypeInput(''); }
                        else { setIsOtherType(false); setDocumentTypeInput(val); setNewRequest({...newRequest, documentType: val}); }
                      }}
                      required
                    >
                      <option value="" disabled>Select document type...</option>
                      {documentTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  {isOtherType && (
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-400 uppercase">Custom Document Name</label>
                      <input 
                        type="text"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[13px] outline-none focus:bg-white focus:ring-1 focus:ring-[#004ac6] font-bold transition-all"
                        placeholder="E.g. Electricity Bill Copy..."
                        value={documentTypeInput}
                        onChange={(e) => { setDocumentTypeInput(e.target.value); setNewRequest({...newRequest, documentType: e.target.value}); }}
                        required
                      />
                    </div>
                  )}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Reason for Request</label>
                    <textarea 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[13px] outline-none focus:bg-white focus:ring-1 focus:ring-[#004ac6] font-medium transition-all min-h-[100px] resize-none"
                      placeholder="Briefly state why this document is required..."
                      value={newRequest.description}
                      onChange={(e) => setNewRequest({...newRequest, description: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-[13px] hover:bg-slate-200 transition-all">Cancel</button>
                  <button type="submit" disabled={submitting} className="flex-[2] py-3 bg-[#004ac6] text-white rounded-xl font-bold text-[13px] hover:bg-[#003ea8] transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                    {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4" />}
                    Initialize Request
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Update Modal */}
      <AnimatePresence>
        {showUpdateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0b1c30]/10 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-100"
            >
              <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                <div>
                  <h3 className="text-[20px] font-bold text-[#0b1c30]">Request Processing</h3>
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Case ID: #{showUpdateModal.id}</p>
                </div>
                <button onClick={() => setShowUpdateModal(null)} className="p-2 hover:bg-white rounded-lg transition-all"><X className="w-5 h-5 text-slate-300" /></button>
              </div>
              <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100/50 flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#004ac6] shadow-sm"><FileText className="w-5 h-5" /></div>
                  <div>
                    <p className="text-[14px] font-bold text-blue-900">{showUpdateModal.documentType}</p>
                    <p className="text-[12px] text-blue-700/70 mt-1 leading-relaxed">{showUpdateModal.description || 'No detailed description provided.'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Target Lifecycle State</label>
                    <select 
                      value={updateStatus}
                      onChange={(e) => setUpdateStatus(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[13px] outline-none focus:bg-white focus:ring-1 focus:ring-[#004ac6] font-bold transition-all"
                    >
                      {showUpdateModal.status === 'pending' && (
                        <>
                          <option value="pending">Keep Pending</option>
                          <option value="approved">Approve & Move Forward</option>
                          <option value="rejected">Reject Application</option>
                        </>
                      )}
                      {showUpdateModal.status === 'approved' && (
                        <>
                          <option value="approved">Stay Approved</option>
                          <option value="completed_by_admin">Upload & Complete</option>
                          <option value="rejected">Revoke & Reject</option>
                        </>
                      )}
                      {['completed_by_admin', 'user_issue', 'processed'].includes(showUpdateModal.status) && (
                        <>
                          <option value={showUpdateModal.status}>Maintain Status</option>
                          <option value="completed_by_admin">Re-upload Serialization</option>
                          <option value="user_confirmed">Force Confirmed</option>
                          <option value="approved">Reset to Approval Stage</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Internal Remarks</label>
                    <textarea 
                      value={adminRemarks}
                      onChange={(e) => setAdminRemarks(e.target.value)}
                      placeholder="Audit notes or messages for subscriber..."
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[13px] outline-none focus:bg-white focus:ring-1 focus:ring-[#004ac6] font-medium transition-all min-h-[80px] resize-none"
                    />
                  </div>
                </div>

                {(updateStatus === 'completed_by_admin' || showUpdateModal.status === 'user_issue') && (
                  <div className="space-y-3">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Artifact Attachment</label>
                    <div className="relative border-2 border-dashed border-slate-100 rounded-2xl p-8 flex flex-col items-center justify-center text-center group hover:border-[#004ac6]/30 transition-all bg-slate-50/50">
                      <input type="file" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
                      <Upload className="w-8 h-8 text-slate-300 mb-2 group-hover:text-[#004ac6] transition-all" />
                      <p className="text-[13px] font-bold text-slate-500">{selectedFile ? selectedFile.name : 'Select or drop official document'}</p>
                      <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-tighter">PDF / IMG Serialization Max 10MB</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-8 border-t border-slate-50 flex gap-3 bg-white">
                <button onClick={() => setShowUpdateModal(null)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-[13px] hover:bg-slate-200 transition-all">Cancel</button>
                <button 
                  onClick={handleUpdateStatus}
                  disabled={submitting}
                  className="flex-[2] py-3 bg-[#004ac6] text-white rounded-xl font-bold text-[13px] hover:bg-[#003ea8] transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4" />}
                  Finalize Transaction
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
