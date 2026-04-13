'use client';

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
  ChevronLeft
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

const STATUS_COLORS = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  approved: 'bg-blue-50 text-blue-700 border-blue-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  processed: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
  completed_by_admin: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  user_confirmed: 'bg-green-100 text-green-800 border-green-200',
  user_issue: 'bg-orange-100 text-orange-800 border-orange-200 font-bold animate-pulse',
};

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
  
  // Create Request State
  const [newRequest, setNewRequest] = useState({ documentType: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  // Update Request State
  const [updateStatus, setUpdateStatus] = useState<string>('');
  const [adminRemarks, setAdminRemarks] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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
      if (res.success) {
        setRequests(res.data || []);
      }
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
      if (selectedFile) {
        formData.append('file', selectedFile);
      }

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

  const [documentTypeInput, setDocumentTypeInput] = useState('');
  const [isOtherType, setIsOtherType] = useState(false);

  const documentTypes = [
    'NOC (No Objection Certificate)',
    'Payment Receipt',
    'Address Proof',
    'Membership Certificate',
    'Maintenance Certificate',
    'Other'
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Document Requests</h1>
          <p className="text-gray-500 text-sm mt-1">Submit and track your official document requests</p>
        </div>
        {!isAdmin && (
          <button 
            onClick={() => {
              setShowCreateModal(true);
              setIsOtherType(false);
              setDocumentTypeInput('');
            }}
            className="flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-blue-100/50 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            New Request
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="md:col-span-8 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text"
            placeholder="Search by document type or user..."
            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="md:col-span-4 flex items-center gap-3">
          <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <select 
            className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer font-medium"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="completed_by_admin">Delivered</option>
            <option value="user_confirmed">Confirmed</option>
            <option value="user_issue">Issues Reported</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-[#64748B]">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Document Type</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Requester</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">User Feedback</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                      <p className="text-gray-400 font-medium animate-pulse">Synchronizing requests...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                        <FileText className="w-8 h-8 text-gray-200" />
                      </div>
                      <div className="max-w-xs mx-auto">
                        <h3 className="text-gray-900 font-semibold mb-1">No requests match</h3>
                        <p className="text-gray-500 text-sm">Try adjusting your filters or search term to find what you're looking for.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : filteredRequests.map((req) => {
                const StatusIcon = STATUS_ICONS[req.status];
                return (
                  <tr key={req.id} className="hover:bg-blue-50/10 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-[#0F172A] truncate">{req.documentType}</p>
                          <p className="text-xs text-[#64748B] truncate max-w-[200px] mt-0.5">{req.description || 'No description provided'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-[#1E293B]">{req.requester?.username || 'Unknown User'}</span>
                        <span className="text-xs text-[#94A3B8]">{req.requester?.email || 'No email available'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${STATUS_COLORS[req.status] || 'bg-gray-50'}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {req.status === 'user_confirmed' ? 'confirmed' : req.status?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 max-w-[200px]">
                      {req.userRemarks ? (
                        <div className="flex items-center gap-2 text-orange-600 bg-orange-50 px-2 py-1 rounded-lg border border-orange-100">
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          <span className="text-xs font-medium truncate">{req.userRemarks}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No feedback yet</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-[#475569] font-medium">
                        {new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {isAdmin && !['user_confirmed', 'rejected'].includes(req.status) && (
                          <button 
                            onClick={() => {
                              setShowUpdateModal(req);
                              setUpdateStatus(req.status);
                              setAdminRemarks(req.adminRemarks || '');
                            }}
                            className="p-2.5 bg-gray-50 hover:bg-white hover:border-blue-200 border border-transparent text-gray-500 hover:text-blue-600 rounded-xl transition-all"
                            title="Review Request"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>
                        )}
                        {(req.status === 'processed' || req.status === 'completed' || req.status === 'completed_by_admin' || req.status === 'user_confirmed' || req.status === 'user_issue') && (
                          <button 
                            onClick={() => handleDownload(req.id)}
                            className="bg-green-600 hover:bg-green-700 text-white p-2.5 rounded-xl transition-all shadow-md shadow-green-100 flex items-center justify-center group"
                            title="Download File"
                          >
                            <Download className="w-5 h-5 group-active:scale-90" />
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
                                  if (res.success) {
                                    toast.success('Document confirmed successfully');
                                    fetchRequests();
                                  }
                                } catch (err: any) {
                                  toast.error(err.message || 'Failed to confirm');
                                }
                              }}
                              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm"
                            >
                              Confirm
                            </button>
                            <button 
                              onClick={async () => {
                                const remark = prompt('Please describe the issue with the document:');
                                if (!remark) return;
                                try {
                                  const formData = new FormData();
                                  formData.append('status', 'user_issue');
                                  formData.append('userRemarks', remark);
                                  const res = await updateDocumentRequest(req.id, formData);
                                  if (res.success) {
                                    toast.success('Issue reported to admin');
                                    fetchRequests();
                                  }
                                } catch (err: any) {
                                  toast.error(err.message || 'Failed to report issue');
                                }
                              }}
                              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm"
                            >
                              Report Issue
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Request Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="absolute inset-0 bg-slate-900/60 z-40"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              className="relative z-50 bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between bg-blue-50/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Plus className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Request Document</h3>
                </div>
                <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-900 transition-colors p-2 hover:bg-white rounded-full">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const type = isOtherType ? documentTypeInput : documentTypeInput;
                  handleCreateRequest(e);
                }} 
                className="p-8 space-y-5"
              >
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Document Type</label>
                  <select 
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all font-medium appearance-none"
                    value={isOtherType ? 'Other' : documentTypeInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'Other') {
                        setIsOtherType(true);
                        setDocumentTypeInput('');
                      } else {
                        setIsOtherType(false);
                        setDocumentTypeInput(val);
                        setNewRequest({...newRequest, documentType: val});
                      }
                    }}
                    required
                  >
                    <option value="" disabled>Choose a document...</option>
                    {documentTypes.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {isOtherType && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }} 
                    animate={{ height: 'auto', opacity: 1 }}
                    className="space-y-2"
                  >
                    <label className="text-sm font-bold text-slate-700 ml-1">Specify Document Name</label>
                    <input 
                      type="text"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all font-medium"
                      placeholder="Enter document name..."
                      value={documentTypeInput}
                      onChange={(e) => {
                        setDocumentTypeInput(e.target.value);
                        setNewRequest({...newRequest, documentType: e.target.value});
                      }}
                      required
                    />
                  </motion.div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Request Description</label>
                  <textarea 
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all min-h-[120px] font-medium resize-none"
                    placeholder="Briefly explain why you need this document..."
                    value={newRequest.description}
                    onChange={(e) => setNewRequest({...newRequest, description: e.target.value})}
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-6 py-4 bg-slate-50 text-slate-600 rounded-2xl hover:bg-slate-100 font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-blue-200"
                  >
                    {submitting ? 'Processing...' : 'Send Request'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Update Request Modal (Admin) */}
      <AnimatePresence>
        {showUpdateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowUpdateModal(null)}
              className="absolute inset-0 bg-slate-900/60 z-40"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative z-50 bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Update Document Request</h3>
                  <p className="text-xs text-slate-500 mt-0.5">ID: #{showUpdateModal.id} • {showUpdateModal.documentType}</p>
                </div>
                <button 
                  onClick={() => setShowUpdateModal(null)}
                  className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6 overflow-y-auto">
                <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100/50">
                  <div className="flex gap-3">
                    <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-blue-900">{showUpdateModal.documentType}</p>
                      <p className="text-xs text-blue-700 mt-1 leading-relaxed">{showUpdateModal.description || 'No description provided'}</p>
                    </div>
                  </div>
                </div>

                {/* Layout Grid */}
                {showUpdateModal.status !== 'user_confirmed' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Status Selection */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Current status: {showUpdateModal.status?.replace(/_/g, ' ')}</label>
                        <select 
                          value={updateStatus}
                          onChange={(e) => setUpdateStatus(e.target.value as any)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none shadow-sm hover:border-slate-300"
                        >
                          {showUpdateModal.status === 'pending' && (
                            <>
                              <option value="pending">Keep as Pending</option>
                              <option value="approved">Approve Request</option>
                              <option value="rejected">Reject Request</option>
                            </>
                          )}
                          {showUpdateModal.status === 'approved' && (
                            <>
                              <option value="approved">Stay Approved</option>
                              <option value="completed_by_admin">Upload & Deliver</option>
                              <option value="rejected">Reject Request</option>
                            </>
                          )}
                          {(showUpdateModal.status === 'completed_by_admin' || showUpdateModal.status === 'user_issue' || showUpdateModal.status === 'processed') && (
                            <>
                              <option value={showUpdateModal.status}>Current Status</option>
                              <option value="completed_by_admin">Re-upload/Update File</option>
                              <option value="user_confirmed">Mark as Manually Confirmed</option>
                              <option value="approved">Reset to Approved</option>
                            </>
                          )}
                        </select>
                      </div>
                    </div>

                    {/* Admin Remarks */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Admin Remarks</label>
                        <textarea 
                          value={adminRemarks}
                          onChange={(e) => setAdminRemarks(e.target.value)}
                          placeholder="Enter internal notes or messages for resident..."
                          className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none resize-none h-24 shadow-sm hover:border-slate-300"
                        />
                      </div>
                    </div>
                  </div>
                )}

              {/* File Upload Section - Only when needed */}
              {(updateStatus === 'completed' || updateStatus === 'processed' || updateStatus === 'completed_by_admin' || showUpdateModal.status === 'user_issue') && showUpdateModal.status !== 'user_confirmed' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Document Attachment</label>
                    {showUpdateModal.fileUrl && (
                      <span className="text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-bold">Existing File Available</span>
                    )}
                  </div>
                  <div className="relative border-2 border-dashed border-slate-200 rounded-lg p-6 bg-slate-50/30 hover:bg-blue-50/30 hover:border-blue-300 transition-all group flex flex-col items-center justify-center text-center">
                    <input 
                      type="file" 
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setSelectedFile(file);
                        // Auto-select status if upload and current is issue
                        if (file && showUpdateModal.status === 'user_issue') {
                           setUpdateStatus('completed_by_admin');
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload className="w-8 h-8 text-slate-400 mb-2 group-hover:text-blue-500 transition-colors" />
                    <div className="text-sm font-medium">
                      {selectedFile ? (
                        <span className="text-blue-600 font-bold">{selectedFile.name}</span>
                      ) : (
                        <span className="text-slate-500">Click to upload {showUpdateModal.fileUrl ? 'new version' : 'document'} or drag and drop</span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">PDF, Image files up to 10MB</p>
                  </div>
                </div>
              )}
              
              {showUpdateModal.status === 'user_confirmed' && (
                <div className="flex flex-col items-center justify-center py-8 text-center bg-green-50 rounded-2xl border border-green-100">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                  <h4 className="text-lg font-bold text-green-800">Request Finished</h4>
                  <p className="text-sm text-green-600 mt-1">Resident has confirmed receipt of this document.</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              <button 
                onClick={() => setShowUpdateModal(null)}
                className="px-6 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
              <button 
                onClick={handleUpdateStatus}
                disabled={submitting || (showUpdateModal.status === 'completed' && updateStatus === 'completed')}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-8 py-2 rounded-lg text-sm font-bold transition-all shadow-md shadow-blue-200 flex items-center gap-2"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Save & Update
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </div>
  );
}
