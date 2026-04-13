'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  MoreVertical,
  Calendar,
  User,
  Clock,
  AlertCircle,
  CheckCircle,
  Archive,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  History,
  Settings,
  X,
} from 'lucide-react';
import { getAllNotices, updateNoticeStatus, deleteNotice, getNoticeAuditLog, getNoticeById, exportNoticesPDF, exportNoticesExcel } from '@/lib/apiClient';
import NoticeForm from './NoticeForm';

interface NoticeManagementProps {
  societyId: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role?: string;
    societyId?: string;
    societyName?: string;
  };
}

interface Notice {
  id: number;
  title: string;
  description: string;
  category: string;
  audience_type: string;
  status: 'draft' | 'published' | 'archived';
  views: number;
  created_at: string;
  updated_at: string;
  created_by_id: string | null;
  created_by_name: string | null;
  created_by_role: string | null;
  createdBy: string | null;
  createdByName: string;
  is_scheduled: number;
  scheduled_datetime: string | null;
  attachments?: Array<{
    id: number;
    file_name: string;
    file_type: string;
    file_url: string;
    file_size: number;
  }>;
}

interface AuditEntry {
  id: string;
  action: string;
  performedBy: string;
  performedByName: string;
  timestamp: string;
  details: string;
}

const NoticeManagement = ({ societyId, user }: NoticeManagementProps) => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // State for modals
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // State for export functionality
  const [exporting, setExporting] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  const itemsPerPage = 10;

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchNotices();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Effect for other filters (immediate)
  useEffect(() => {
    fetchNotices();
  }, [societyId, currentPage, statusFilter, typeFilter, priorityFilter]);

  // Click outside handler for export dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.export-dropdown-container')) {
        setShowExportDropdown(false);
      }
    };

    if (showExportDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportDropdown]);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const response = await getAllNotices({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        priority: priorityFilter !== 'all' ? priorityFilter : undefined,
      });
      
      setNotices(response.notices || []);
      setTotalPages(Math.ceil((response.total || 0) / itemsPerPage));
    } catch (error) {
      console.error('Failed to fetch notices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (noticeId: string, newStatus: string) => {
    try {
      setActionLoading(noticeId);
      await updateNoticeStatus(noticeId, newStatus);
      await fetchNotices();
    } catch (error) {
      console.error('Failed to update notice status:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (noticeId: string) => {
    if (!confirm('Are you sure you want to delete this notice? This action cannot be undone.')) {
      return;
    }
    
    try {
      setActionLoading(noticeId);
      const isLocalStorageAvailable = typeof window !== 'undefined' && 
                                     typeof window.localStorage !== 'undefined' && 
                                     typeof window.localStorage.getItem === 'function';
      const token = isLocalStorageAvailable ? localStorage.getItem('token') : null;
      await deleteNotice(noticeId);
      await fetchNotices();
      
      // Modern notification instead of alert
      const notificationContainer = document.getElementById('notification-container') || createNotificationContainer();
      showNotification(notificationContainer, 'Notice deleted successfully', 'success');
    } catch (error: any) {
      console.error('Failed to delete notice:', error);
      
      // Modern notification with error details
      const notificationContainer = document.getElementById('notification-container') || createNotificationContainer();
      const errorMessage = error.response?.data?.error || 'Failed to delete notice. Please try again.';
      showNotification(notificationContainer, errorMessage, 'error');
    } finally {
      setActionLoading(null);
    }
  };
  
  // Helper functions for modern notifications
  const createNotificationContainer = () => {
    const container = document.createElement('div');
    container.id = 'notification-container';
    container.style.position = 'fixed';
    container.style.top = '20px';
    container.style.right = '20px';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
    return container;
  };
  
  const showNotification = (container: HTMLElement, message: string, type: 'success' | 'error') => {
    const notification = document.createElement('div');
    notification.className = `p-4 mb-3 rounded-lg shadow-lg flex items-center space-x-3 ${
      type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
    }`;
    
    const icon = document.createElement('div');
    icon.className = `p-2 rounded-full ${type === 'success' ? 'bg-green-100' : 'bg-red-100'}`;
    icon.innerHTML = type === 'success' 
      ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-600"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>'
      : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-red-600"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
    
    const content = document.createElement('div');
    content.className = 'flex-1';
    content.innerHTML = `<p class="${type === 'success' ? 'text-green-800' : 'text-red-800'} font-medium">${message}</p>`;
    
    notification.appendChild(icon);
    notification.appendChild(content);
    container.appendChild(notification);
    
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transition = 'opacity 0.5s ease';
      setTimeout(() => container.removeChild(notification), 500);
    }, 5000);
  };

  const handleViewAudit = async (notice: Notice) => {
    try {
      setSelectedNotice(notice);
      const isLocalStorageAvailable = typeof window !== 'undefined' && 
                                     typeof window.localStorage !== 'undefined' && 
                                     typeof window.localStorage.getItem === 'function';
      const token = isLocalStorageAvailable ? localStorage.getItem('token') : null;
      const response = await getNoticeAuditLog(String(notice.id));
      setAuditLog(response.auditLog || []);
      setShowAuditModal(true);
    } catch (error: any) {
      console.error('Failed to fetch audit log:', error);
      const notificationContainer = document.getElementById('notification-container') || createNotificationContainer();
      const errorMessage = error.response?.data?.error || 'Failed to fetch audit log. Please try again.';
      showNotification(notificationContainer, errorMessage, 'error');
    }
  };

  const handleExport = async (format: 'pdf' | 'excel') => {
    try {
      setShowExportDropdown(false);
      
      // Prompt for email address
      const email = prompt('Please enter your email address to receive the exported file:');
      if (!email) {
        return; // User cancelled or didn't provide email
      }
      
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        const notificationContainer = document.getElementById('notification-container') || createNotificationContainer();
        showNotification(notificationContainer, 'Please enter a valid email address.', 'error');
        return;
      }
      
      setExporting(true);
      
      const notificationContainer = document.getElementById('notification-container') || createNotificationContainer();
      showNotification(notificationContainer, `Exporting notices to ${format.toUpperCase()}...`, 'success');
      
      if (format === 'pdf') {
        await exportNoticesPDF(email);
      } else {
        await exportNoticesExcel(email);
      }
      
      showNotification(notificationContainer, `Notices exported to ${format.toUpperCase()} successfully! Check your email (${email}) for the file.`, 'success');
    } catch (error: any) {
      console.error(`Failed to export notices to ${format}:`, error);
      const notificationContainer = document.getElementById('notification-container') || createNotificationContainer();
      const errorMessage = error.response?.data?.error || `Failed to export notices to ${format.toUpperCase()}. Please try again.`;
      showNotification(notificationContainer, errorMessage, 'error');
    } finally {
      setExporting(false);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Emergency': return 'text-red-600 bg-red-50 border-red-200';
      case 'Maintenance': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'General': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Events': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'draft': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'archived': return <Archive className="w-4 h-4 text-gray-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'text-green-600 bg-green-50';
      case 'draft': return 'text-yellow-600 bg-yellow-50';
      case 'archived': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const ActionDropdown = ({ notice }: { notice: Notice }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);

    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
          disabled={actionLoading === String(notice.id)}
        >
          {actionLoading === String(notice.id) ? (
            <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
          ) : (
            <MoreVertical className="w-4 h-4 text-gray-600" />
          )}
        </button>
        
        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
              <div className="py-1">
                <button
                  onClick={async () => {
                    try {
                      setActionLoading(String(notice.id));
                      const response = await getNoticeById(String(notice.id));
                      const fullNotice = response.notice || response;
                      setSelectedNotice(fullNotice);
                      setShowViewModal(true);
                      setIsOpen(false);
                    } catch (error) {
                      console.error('Error fetching notice details:', error);
                      setSelectedNotice(notice);
                      setShowViewModal(true);
                      setIsOpen(false);
                    } finally {
                      setActionLoading(null);
                    }
                  }}
                  className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Eye className="w-4 h-4" />
                  <span>View Details</span>
                </button>
                
                <button
                  onClick={async () => {
                    try {
                      setActionLoading(String(notice.id));
                      const response = await getNoticeById(String(notice.id));
                      const fullNotice = response.notice || response;
                      setSelectedNotice(fullNotice);
                      setShowEditModal(true);
                      setIsOpen(false);
                    } catch (error) {
                      console.error('Error fetching notice details:', error);
                      setSelectedNotice(notice);
                      setShowEditModal(true);
                      setIsOpen(false);
                    } finally {
                      setActionLoading(null);
                    }
                  }}
                  className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                
                <button
                  onClick={() => {
                    handleViewAudit(notice);
                    setIsOpen(false);
                  }}
                  className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <History className="w-4 h-4" />
                  <span>View Audit Log</span>
                </button>
                
                <div className="border-t border-gray-100 my-1" />
                
                {notice.status === 'draft' && (
                  <button
                    onClick={() => {
                      handleStatusChange(String(notice.id), 'published');
                    setIsOpen(false);
                    }}
                    className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-green-700 hover:bg-green-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Publish</span>
                  </button>
                )}
                
                {notice.status === 'published' && (
                  <button
                    onClick={() => {
                      handleStatusChange(String(notice.id), 'archived');
                      setIsOpen(false);
                    }}
                    className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Archive className="w-4 h-4" />
                    <span>Archive</span>
                  </button>
                )}
                
                <button
                  onClick={() => {
                    handleDelete(String(notice.id));
                    setIsOpen(false);
                  }}
                  className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  const AuditModal = () => {
    if (!showAuditModal || !selectedNotice) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Audit Log</h3>
                <p className="text-sm text-gray-600 mt-1">{selectedNotice.title}</p>
              </div>
              <button
                onClick={() => setShowAuditModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-96">
            {auditLog.length > 0 ? (
              <div className="space-y-4">
                {auditLog.map((entry) => (
                  <div key={entry.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <History className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">{entry.action}</p>
                        <span className="text-xs text-gray-500">
                          {new Date(entry.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{entry.details}</p>
                      <p className="text-xs text-gray-500 mt-1">by {entry.performedByName}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No audit log entries found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Notice Management</h1>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // View Notice Modal
  const ViewNoticeModal = () => {
    if (!showViewModal || !selectedNotice) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Notice Details</h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Title</h4>
                <p className="text-lg font-medium mt-1">{selectedNotice.title}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500">Description</h4>
                <div className="mt-1 prose max-w-none" dangerouslySetInnerHTML={{ __html: selectedNotice.description }} />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Category</h4>
                  <p className="mt-1">{selectedNotice.category}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Audience</h4>
                  <p className="mt-1">{selectedNotice.audience_type}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Status</h4>
                  <div className="mt-1 flex items-center space-x-2">
                    {getStatusIcon(selectedNotice.status)}
                    <span className="capitalize">{selectedNotice.status}</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Created By</h4>
                  <p className="mt-1">{selectedNotice.createdByName || 'Unknown'}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Created At</h4>
                  <p className="mt-1">{new Date(selectedNotice.created_at).toLocaleString()}</p>
                </div>
              </div>
              
              {selectedNotice.is_scheduled === 1 && selectedNotice.scheduled_datetime && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Scheduled For</h4>
                  <p className="mt-1">{new Date(selectedNotice.scheduled_datetime).toLocaleString()}</p>
                </div>
              )}
              
              {selectedNotice.attachments && selectedNotice.attachments.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-3">Attachments ({selectedNotice.attachments.length})</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {selectedNotice.attachments.map((attachment: any, index: number) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            {attachment.file_type?.startsWith('image/') ? (
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            ) : attachment.file_type?.includes('pdf') ? (
                              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                              </div>
                            ) : (
                              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {attachment.file_name || `Attachment ${index + 1}`}
                            </p>
                            <p className="text-xs text-gray-500">
                              {attachment.file_type || 'Unknown type'}
                            </p>
                          </div>
                          {attachment.file_url && (
                            <a
                              href={attachment.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-shrink-0 p-1 text-blue-600 hover:text-blue-800 transition-colors"
                              title="Open attachment"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
            <button
              onClick={() => {
                setShowViewModal(false);
                setSelectedNotice(selectedNotice);
                setShowEditModal(true);
              }}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Edit Notice
            </button>
            <button
              onClick={() => setShowViewModal(false)}
              className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  // Edit Notice Modal - This would include the NoticeForm component
  const EditNoticeModal = () => {
    if (!showEditModal || !selectedNotice) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Edit Notice</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            <NoticeForm 
              societyId={societyId}
              editMode={true}
              noticeId={String(selectedNotice.id)}
              initialData={selectedNotice}
              onSuccess={() => {
                setShowEditModal(false);
                fetchNotices();
              }}
              onCancel={() => setShowEditModal(false)}
            />
          </div>
        </div>
      </div>
    );
  };
  
  // Create Notice Modal - This would include the NoticeForm component
  const CreateNoticeModal = () => {
    if (!showCreateModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Create Notice</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            <NoticeForm 
              societyId={societyId}
              onSuccess={() => {
                setShowCreateModal(false);
                fetchNotices();
              }}
              onCancel={() => setShowCreateModal(false)}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Render modals */}
      <ViewNoticeModal />
      <EditNoticeModal />
      <CreateNoticeModal />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notice Management</h1>
          <p className="text-gray-600 mt-1">Manage and monitor all society notices</p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Export Button with Dropdown */}
          <div className="relative export-dropdown-container">
            <button
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              disabled={exporting}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              <span>{exporting ? 'Exporting...' : 'Export'}</span>
            </button>
            
            {showExportDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <div className="py-1">
                  <button
                    onClick={() => handleExport('pdf')}
                    disabled={exporting}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <span>📄</span>
                    <span>Export as PDF</span>
                  </button>
                  <button
                    onClick={() => handleExport('excel')}
                    disabled={exporting}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <span>📊</span>
                    <span>Export as Excel</span>
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <button 
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Create Notice</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search notices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
          
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="general">General</option>
            <option value="maintenance">Maintenance</option>
            <option value="event">Event</option>
            <option value="emergency">Emergency</option>
          </select>
          
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>

      {/* Notices Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notice</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Audience</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {notices.map((notice) => (
                <tr key={notice.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900 line-clamp-1">{notice.title}</div>
                      <div className="text-sm text-gray-500">by {notice.createdByName || 'Unknown'}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(notice.category)} capitalize`}>
                      {notice.category || 'General'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {notice.audience_type || 'All Residents'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(notice.status)}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(notice.status)} capitalize`}>
                        {notice.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{notice.created_at ? new Date(notice.created_at).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <ActionDropdown notice={notice} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {notices.length === 0 && (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notices found</h3>
            <p className="text-gray-500 mb-4">No notices match your current filters.</p>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 mx-auto">
              <Plus className="w-4 h-4" />
              <span>Create First Notice</span>
            </button>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="flex items-center space-x-1">
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <AuditModal />
    </div>
  );
};

export default NoticeManagement;