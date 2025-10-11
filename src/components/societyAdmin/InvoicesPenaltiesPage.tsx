'use client';

import React, { useState, useEffect } from 'react';
import { FileText, AlertTriangle, Receipt, Plus, Eye, ToggleLeft, ToggleRight, X } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'react-hot-toast';

interface InvoicesPenaltiesPageProps {
  societyId: string;
}

interface TabItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const InvoicesPenaltiesPage: React.FC<InvoicesPenaltiesPageProps> = ({ societyId }) => {
  const [activeTab, setActiveTab] = useState('invoices');

  const tabs: TabItem[] = [
    {
      id: 'invoices',
      label: 'Invoices',
      icon: FileText,
    },
    {
      id: 'templates',
      label: 'Recurring Invoices',
      icon: Receipt,
    },
    {
      id: 'raised-invoices',
      label: 'Raised Invoices',
      icon: Plus,
    },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'invoices':
        return <InvoicesTab societyId={societyId} />;
      case 'templates':
        return <TemplatesTab societyId={societyId} />;
      case 'raised-invoices':
        return <RaisedInvoicesTab societyId={societyId} />;
      default:
        return <InvoicesTab societyId={societyId} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices & Collection</h1>
          <p className="text-gray-600 mt-1">Manage invoices and recurring invoice templates</p>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon
                  className={`mr-2 h-4 w-4 ${
                    isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>
      

    </div>
  );
};

// Invoices Tab Component
interface Invoice {
  id: string;
  society_id: number;
  template_id: number;
  bill_name: string;
  bill_description: string;
  category: string;
  payment_provider: string;
  razorpay_key: string;
  flat_id: number;
  owner_id: number | null;
  owner_name: string;
  owner_phone: string;
  flat_number: string;
  wing_name: string;
  owner_email: string;
  allowed_payment_modes: string[];
  period: string;
  bill_generation_date: string;
  due_date: string;
  base_amount: string;
  charges: Array<{
    name: string;
    sqft: number;
    charge_id: number;
    unit_rate: number;
    description: string;
    is_per_sq_feet: boolean;
    calculated_amount: number;
  }>;
  discount_amount: string;
  total_payable: string;
  penalty_amount: string;
  payable: string;
  fees?: string;
  taxes?: string;
  actual_amount?: string;
  status: string;
  waiver_status: string;
  payment_invoice_id: string | null;
  waiver_chat_log: string | null;
  invoice_link: string | null;
  payment_mode: string;
  method: string;
  online_method: string;
  transaction_id: string | null;
  owner_submerchant_id: string | null;
  payment_date: string | null;
  created_by_id: number | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
  grace_days: number;
  action_logs: string | null;
  floor_id: number;
  floor_number: number;
}

const InvoicesTab: React.FC<{ societyId: string }> = ({ societyId }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [activeCategory, setActiveCategory] = useState('maintenance');
  const [wings, setWings] = useState<any[]>([]);
  const [floors, setFloors] = useState<any[]>([]);
  const [flats, setFlats] = useState<any[]>([]);
  const [selectedWing, setSelectedWing] = useState('all');
  const [selectedFloor, setSelectedFloor] = useState('all');
  const [selectedFlat, setSelectedFlat] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  const categoryTabs = [
    { id: 'maintenance', label: 'Maintenance' },
    { id: 'utility', label: 'Utility' },
    { id: 'amenity', label: 'Amenity' },
    { id: 'penalty', label: 'Penalty' },
    { id: 'event', label: 'Event' },
    { id: 'donations', label: 'Donations' }
  ];

  useEffect(() => {
    // Set default date range to current month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    setFromDate(firstDay.toISOString().split('T')[0]);
    setToDate(lastDay.toISOString().split('T')[0]);
    
    fetchWings();
    fetchInvoices();
  }, [societyId]);

  useEffect(() => {
    fetchInvoices();
  }, [activeCategory, selectedWing, selectedFloor, selectedFlat, statusFilter, fromDate, toDate, currentPage]);

  useEffect(() => {
    if (selectedWing !== 'all') {
      fetchFloors(selectedWing);
    } else {
      setFloors([]);
      setSelectedFloor('all');
      setSelectedFlat('all');
    }
  }, [selectedWing]);

  useEffect(() => {
    if (selectedWing !== 'all' && selectedFloor !== 'all') {
      fetchFlats(selectedWing, selectedFloor);
    } else {
      setFlats([]);
      setSelectedFlat('all');
    }
  }, [selectedFloor]);

  const fetchWings = async () => {
    try {
      const response = await apiClient('/billing/wings', {
        withAuth: true,
      });
      setWings(response.data || []);
    } catch (error) {
      console.error('Error fetching wings:', error);
    }
  };

  const fetchFloors = async (wingId: string) => {
    try {
      const response = await apiClient('/billing/floors', {
        withAuth: true,
        params: { wingId },
      });
      setFloors(response.data || []);
    } catch (error) {
      console.error('Error fetching floors:', error);
    }
  };

  const fetchFlats = async (wingId: string, floorId: string) => {
    try {
      const response = await apiClient('/billing/flats', {
        withAuth: true,
        params: { wingId, floorId },
      });
      setFlats(response.data || []);
    } catch (error) {
      console.error('Error fetching flats:', error);
    }
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {
        page: currentPage.toString(),
        limit: limit.toString(),
      };
      
      // Add category for non-amenity invoices
      if (activeCategory !== 'amenity') {
        params.category = activeCategory;
      }
      
      if (searchTerm) params.search = searchTerm;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (selectedWing !== 'all') params.wingId = selectedWing;
      if (selectedFloor !== 'all') params.floorId = selectedFloor;
      if (selectedFlat !== 'all') params.flatId = selectedFlat;
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;
       
      // Use different endpoint for amenity bookings
      const endpoint = activeCategory === 'amenity' 
        ? '/amenities/booking-invoices' 
        : '/billing/invoices';
        
      const response = await apiClient(endpoint, {
        withAuth: true,
        params,
      });
      
      setInvoices(response.data || []);
      setTotalPages(Math.ceil((response.count || 0) / limit));
      setTotalCount(response.count || 0);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      case 'unpaid': return 'bg-red-100 text-red-800';
      case 'reversed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      {/* Category Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {categoryTabs.map((tab) => {
            const isActive = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveCategory(tab.id);
                  setCurrentPage(1);
                }}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <div className="col-span-1 md:col-span-2">
          <input
            type="text"
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Status</option>
          <option value="unpaid">Unpaid</option>
          <option value="partial">Partial</option>
          <option value="paid">Paid</option>
          <option value="reversed">Reversed</option>
        </select>

        <select
          value={selectedWing}
          onChange={(e) => {
            setSelectedWing(e.target.value);
            setSelectedFloor('all');
            setSelectedFlat('all');
          }}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Wings</option>
          {wings.map((wing) => (
            <option key={wing.wing_id} value={wing.wing_id}>
              {wing.wing_name}
            </option>
          ))}
        </select>

        <select
          value={selectedFloor}
          onChange={(e) => {
            setSelectedFloor(e.target.value);
            setSelectedFlat('all');
          }}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={selectedWing === 'all'}
        >
          <option value="all">All Floors</option>
          {floors.map((floor) => (
            <option key={floor.floor_id} value={floor.floor_id}>
              Floor {floor.floor_number}
            </option>
          ))}
        </select>

        <select
          value={selectedFlat}
          onChange={(e) => setSelectedFlat(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={selectedFloor === 'all'}
        >
          <option value="all">All Flats</option>
          {flats.map((flat) => (
            <option key={flat.flat_id} value={flat.flat_id}>
              {flat.flat_number}
            </option>
          ))}
        </select>
      </div>

      {/* Date Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={() => {
              setCurrentPage(1);
              fetchInvoices();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Search
          </button>
        </div>
      </div>

      {/* Invoices List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-gray-200 animate-pulse h-16 rounded-lg"></div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {invoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Flat
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Owner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fees
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Taxes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actual Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoices.map((invoice) => {
                    const totalAmount = parseFloat(invoice.total_payable);
                    const fees = parseFloat(invoice.fees || '0');
                    const taxes = parseFloat(invoice.taxes || '0');
                    const actualAmount = invoice.actual_amount ? parseFloat(invoice.actual_amount) : totalAmount - fees - taxes;
                    
                    // Check if fees and taxes are empty/zero for display
                    const displayFees = !invoice.fees || parseFloat(invoice.fees) === 0 ? '-' : formatCurrency(fees);
                    const displayTaxes = !invoice.taxes || parseFloat(invoice.taxes) === 0 ? '-' : formatCurrency(taxes);
                    
                    return (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {invoice.bill_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(invoice.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {invoice.flat_number}
                        </div>
                        <div className="text-sm text-gray-500">
                          {invoice.wing_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {invoice.owner_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(totalAmount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-md inline-block">
                          {displayFees}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-md inline-block">
                          {displayTaxes}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-green-700 bg-green-50 px-2 py-1 rounded-md inline-block">
                          {formatCurrency(actualAmount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          getStatusColor(invoice.status)
                        }`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(invoice.due_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            setShowDetailsModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          View Details
                        </button>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No {activeCategory} invoices found</p>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{((currentPage - 1) * limit) + 1}</span> to{' '}
                <span className="font-medium">{Math.min(currentPage * limit, totalCount)}</span> of{' '}
                <span className="font-medium">{totalCount}</span> results
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                        currentPage === pageNum
                          ? 'z-10 bg-blue-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                          : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Details Modal */}
      {showDetailsModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Invoice Details</h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Invoice Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Name</label>
                    <p className="text-gray-900">{selectedInvoice.bill_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <p className="text-gray-900">{selectedInvoice.bill_description}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <p className="text-gray-900 capitalize">{selectedInvoice.category}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
                    <p className="text-gray-900">{selectedInvoice.period}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Invoice ID</label>
                    <p className="text-gray-900 font-mono text-sm">{selectedInvoice.id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Template ID</label>
                    <p className="text-gray-900">{selectedInvoice.template_id}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Flat Details</label>
                    <p className="text-gray-900">{selectedInvoice.flat_number} - {selectedInvoice.wing_name}</p>
                    <p className="text-sm text-gray-600">Floor {selectedInvoice.floor_number}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Owner Details</label>
                    <p className="text-gray-900">{selectedInvoice.owner_name}</p>
                    <p className="text-sm text-gray-600">{selectedInvoice.owner_phone}</p>
                    <p className="text-sm text-gray-600">{selectedInvoice.owner_email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      getStatusColor(selectedInvoice.status)
                    }`}>
                      {selectedInvoice.status}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                    <p className="text-gray-900">{new Date(selectedInvoice.due_date).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Payment Configuration */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Configuration</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Provider</label>
                      <p className="text-gray-900 capitalize">{selectedInvoice.payment_provider}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Allowed Payment Modes</label>
                      <div className="flex flex-wrap gap-1">
                        {selectedInvoice.allowed_payment_modes.map((mode, index) => (
                          <span key={index} className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            {mode.toUpperCase()}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Waiver Status</label>
                      <p className="text-gray-900 capitalize">{selectedInvoice.waiver_status}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Grace Days</label>
                      <p className="text-gray-900">{selectedInvoice.grace_days} days</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Charges Breakdown */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Charges Breakdown</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  {selectedInvoice.charges && selectedInvoice.charges.length > 0 ? (
                    <div className="space-y-3">
                      {selectedInvoice.charges.map((charge, index) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                          <div>
                            <p className="font-medium text-gray-900">{charge.name}</p>
                            <p className="text-sm text-gray-600">{charge.description}</p>
                            <div className="flex gap-4 text-xs text-gray-500 mt-1">
                              <span>Rate: {formatCurrency(charge.unit_rate)}</span>
                              {charge.is_per_sq_feet && charge.sqft > 0 && (
                                <span>Area: {charge.sqft} sq ft</span>
                              )}
                              <span>Charge ID: {charge.charge_id}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">
                              {formatCurrency(charge.calculated_amount)}
                            </p>
                            {charge.is_per_sq_feet && (
                              <p className="text-xs text-gray-500">Per sq ft</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No charges available</p>
                  )}
                </div>
              </div>

              {/* Payment Summary */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  Payment Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Base Amount:</span>
                      <span className="font-medium">{formatCurrency(parseFloat(selectedInvoice.base_amount))}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Discount:</span>
                      <span className="font-medium text-green-600">-{formatCurrency(parseFloat(selectedInvoice.discount_amount))}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Penalty:</span>
                      <span className="font-medium text-red-600">{formatCurrency(parseFloat(selectedInvoice.penalty_amount))}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 flex items-center">
                        <span className="w-2 h-2 bg-orange-400 rounded-full mr-2"></span>
                        Fees:
                      </span>
                      <span className="font-medium text-orange-600 bg-orange-100 px-2 py-1 rounded-md">
                        {!selectedInvoice.fees || parseFloat(selectedInvoice.fees) === 0 ? '-' : formatCurrency(parseFloat(selectedInvoice.fees))}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 flex items-center">
                        <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
                        Taxes:
                      </span>
                      <span className="font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded-md">
                        {!selectedInvoice.taxes || parseFloat(selectedInvoice.taxes) === 0 ? '-' : formatCurrency(parseFloat(selectedInvoice.taxes))}
                      </span>
                    </div>
                    <div className="border-t border-blue-200 pt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-900 font-semibold">Total Payable:</span>
                        <span className="font-bold text-lg">{formatCurrency(parseFloat(selectedInvoice.total_payable))}</span>
                      </div>
                    </div>
                    <div className="bg-green-100 border border-green-200 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-green-800 font-semibold flex items-center">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                          Actual Amount:
                        </span>
                        <span className="font-bold text-lg text-green-700">
                          {formatCurrency(
                            selectedInvoice.actual_amount 
                              ? parseFloat(selectedInvoice.actual_amount)
                              : parseFloat(selectedInvoice.total_payable) - parseFloat(selectedInvoice.fees || '0') - parseFloat(selectedInvoice.taxes || '0')
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Mode:</span>
                      <span className="font-medium capitalize">{selectedInvoice.payment_mode}</span>
                    </div>
                    {selectedInvoice.method && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Method:</span>
                        <span className="font-medium capitalize">{selectedInvoice.method}</span>
                      </div>
                    )}
                    {selectedInvoice.transaction_id && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Transaction ID:</span>
                        <span className="font-medium font-mono text-sm">{selectedInvoice.transaction_id}</span>
                      </div>
                    )}
                    {selectedInvoice.payment_date && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment Date:</span>
                        <span className="font-medium">{new Date(selectedInvoice.payment_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bill Generated:</span>
                    <span className="font-medium">{new Date(selectedInvoice.bill_generation_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created On:</span>
                    <span className="font-medium">{new Date(selectedInvoice.created_at).toLocaleDateString()}</span>
                  </div>
                  {selectedInvoice.created_by_name && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created By:</span>
                      <span className="font-medium">{selectedInvoice.created_by_name}</span>
                    </div>
                  )}
                  {selectedInvoice.invoice_link && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Invoice PDF:</span>
                      <a 
                        href={selectedInvoice.invoice_link.trim()} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        Download PDF
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Close Button */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Penalties Tab Component
interface Penalty {
  id: string;
  flat_number: string;
  wing_name: string;
  owner_name: string;
  penalty_type: string;
  amount: number;
  status: 'active' | 'waived' | 'paid';
  applied_on: string;
  due_date: string;
}

const PenaltiesTab: React.FC<{ societyId: string }> = ({ societyId }) => {
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPenalties();
  }, [societyId]);

  const fetchPenalties = async () => {
    try {
      setLoading(true);
      const response = await apiClient(`/api/penalties/society/${societyId}`, {
        withAuth: true,
      });
      setPenalties(response.penalties || []);
    } catch (error) {
      console.error('Error fetching penalties:', error);
      toast.error('Failed to load penalties');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'waived': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Penalties Management</h3>
        <button
          onClick={fetchPenalties}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-gray-200 animate-pulse h-16 rounded-lg"></div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {penalties.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Flat
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Owner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applied On
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {penalties.map((penalty) => (
                    <tr key={penalty.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {penalty.flat_number}
                        </div>
                        <div className="text-sm text-gray-500">
                          {penalty.wing_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {penalty.owner_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {penalty.penalty_type}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(penalty.amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          getStatusColor(penalty.status)
                        }`}>
                          {penalty.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(penalty.applied_on).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No penalties found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Invoice Template Interface
interface InvoiceTemplate {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  isRecurring: boolean;
  recurrenceType: 'monthly' | 'quarterly' | 'yearly';
  charges: Array<{
    name: string;
    description: string;
    amount: number;
    mode: 'fixed' | 'per_sqft';
    category: string;
  }>;
  penalty: {
    graceDays: number;
    penaltyType: string;
    amount: number;
    isPercentage: boolean;
  };
  target: {
    type: 'all_flats' | 'specific_wings' | 'specific_flats';
    wingIds: string[];
    flatIds: string[];
  };
  paymentModes: string[];
  createdAt: string;
  updatedAt: string;
}

// Multi-step Invoice Creation Modal
const InvoiceCreationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  societyId: string;
  onSuccess: () => void;
}> = ({ isOpen, onClose, societyId, onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [wings, setWings] = useState<Array<{id: string, name: string}>>([]);
  const [floors, setFloors] = useState<Array<{id: string, name: string}>>([]);
  const [flats, setFlats] = useState<Array<{id: string, name: string, wing_id: string, floor_id: string}>>([]);
  const [selectedWingId, setSelectedWingId] = useState<string>('');
  const [selectedFloorId, setSelectedFloorId] = useState<string>('');
  const [selectedFlatDetails, setSelectedFlatDetails] = useState<Array<{id: string, name: string, wingName: string}>>([]);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    category: 'maintenance' | 'utility' | 'amenity' | 'penalty' | 'event' | 'donations';
    isRecurring: boolean;
    recurrenceType: 'monthly' | 'quarterly' | 'yearly';
    billGenerationDate: string;
    dueDate: string;
    generationDay: number;
    dueDay: number;
    charges: Array<{
      name: string;
      description: string;
      amount: number;
      priceType: 'fixed' | 'per_sqft';
    }>;
    penalty: {
      graceDays: number;
      penaltyType: string;
      amount: number;
      isPercentage: boolean;
    };
    target: {
      type: 'all_flats' | 'specific_wings' | 'specific_flats';
      wingIds: string[];
      flatIds: string[];
    };
    paymentModes: string[];
    firstBillMonth: number;
    firstBillYear: number;
    firstBillQuarter: number;
  }>({
    name: '',
    description: '',
    category: 'maintenance',
    isRecurring: false,
    recurrenceType: 'monthly',
    billGenerationDate: '',
    dueDate: '',
    generationDay: 1,
    dueDay: 30,
    charges: [],
    penalty: {
      graceDays: 0,
      penaltyType: 'no_penalty',
      amount: 0,
      isPercentage: false
    },
    target: {
      type: 'all_flats',
      wingIds: [],
      flatIds: []
    },
    paymentModes: [],
    firstBillMonth: new Date().getMonth() + 1,
    firstBillYear: new Date().getFullYear(),
    firstBillQuarter: Math.floor(new Date().getMonth() / 3) + 1
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  const steps = [
    { title: 'Basic Details', description: 'Invoice name, category and billing schedule' },
    { title: 'Charges', description: 'Add charges and amounts' },
    { title: 'Penalties', description: 'Configure penalty settings' },
    { title: 'Target & Payment', description: 'Select flats/wings and payment modes' },
    { title: 'Review', description: 'Review and create invoice' }
  ];

  const categories = [
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'utility', label: 'Utility' },
    { value: 'amenity', label: 'Amenity' },
    { value: 'penalty', label: 'Penalty' },
    { value: 'event', label: 'Event' },
    { value: 'donations', label: 'Donations' }
  ];

  const paymentModeOptions = [
    { value: 'upi', label: 'UPI' },
    { value: 'card', label: 'Card' },
    { value: 'netbanking', label: 'Net Banking' },
    { value: 'wallet', label: 'Wallet' },
    { value: 'emi', label: 'EMI' },
    { value: 'paylater', label: 'Pay Later' }
  ];

  const initialFormData = {
    name: '',
    description: '',
    category: 'maintenance' as const,
    isRecurring: false,
    recurrenceType: 'monthly' as const,
    billGenerationDate: '',
    dueDate: '',
    generationDay: 1,
    dueDay: 30,
    charges: [],
    penalty: {
      graceDays: 0,
      penaltyType: 'no_penalty',
      amount: 0,
      isPercentage: false
    },
    target: {
      type: 'all_flats' as const,
      wingIds: [],
      flatIds: []
    },
    paymentModes: [],
    firstBillMonth: new Date().getMonth() + 1,
    firstBillYear: new Date().getFullYear(),
    firstBillQuarter: Math.floor(new Date().getMonth() / 3) + 1
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setCurrentStep(0);
    setSelectedWingId('');
    setSelectedFloorId('');
    setFloors([]);
    setFlats([]);
    setSelectedFlatDetails([]);
  };

  const hasUnsavedChanges = () => {
    return JSON.stringify(formData) !== JSON.stringify(initialFormData) || currentStep > 0;
  };

  useEffect(() => {
    if (isOpen) {
      fetchWings();
      resetForm();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen && !showConfirmClose) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => {
        document.removeEventListener('keydown', handleEscapeKey);
      };
    }
  }, [isOpen, showConfirmClose]);

  const fetchWings = async () => {
    try {
      const response = await apiClient('/billing/wings', {
        withAuth: true,
      });
      const wingsData = (response.data || []).map((wing: any) => ({
        id: wing.wing_id.toString(),
        name: wing.wing_name
      }));
      setWings(wingsData);
    } catch (error) {
      console.error('Error fetching wings:', error);
    }
  };

  const fetchFloors = async (wingId: string) => {
    try {
      const response = await apiClient('/billing/floors', {
        withAuth: true,
        params: { wingId }
      });
      const floorsData = (response.data || []).map((floor: any) => ({
        id: floor.floor_id.toString(),
        name: `Floor ${floor.floor_number}`
      }));
      setFloors(floorsData);
    } catch (error) {
      console.error('Error fetching floors:', error);
    }
  };

  const fetchFlats = async (wingId: string, floorId: string) => {
    try {
      const response = await apiClient('/billing/flats', {
        withAuth: true,
        params: { wingId, floorId }
      });
      const flatsData = (response.data || []).map((flat: any) => ({
        id: flat.flat_id.toString(),
        name: flat.flat_number,
        wing_id: flat.wing_id.toString(),
        floor_id: flat.floor_id.toString()
      }));
      setFlats(flatsData);
    } catch (error) {
      console.error('Error fetching flats:', error);
    }
  };

  const addCharge = () => {
    setFormData(prev => ({
      ...prev,
      charges: [...prev.charges, {
        name: '',
        description: '',
        amount: 0,
        priceType: 'fixed'
      }]
    }));
  };

  const removeCharge = (index: number) => {
    setFormData(prev => ({
      ...prev,
      charges: prev.charges.filter((_, i) => i !== index)
    }));
  };

  const updateCharge = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      charges: prev.charges.map((charge, i) => 
        i === index ? { ...charge, [field]: value } : charge
      )
    }));
  };

  const togglePaymentMode = (mode: string) => {
    setFormData(prev => ({
      ...prev,
      paymentModes: prev.paymentModes.includes(mode)
        ? prev.paymentModes.filter(m => m !== mode)
        : [...prev.paymentModes, mode]
    }));
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 0:
        return formData.name && formData.description && formData.category &&
               (formData.isRecurring ? (formData.recurrenceType && formData.generationDay && formData.dueDay) : 
                (formData.billGenerationDate && formData.dueDate));
      case 1:
        return formData.charges.length > 0 && formData.charges.every(charge => 
          charge.name && charge.description && charge.amount > 0 && charge.priceType
        );
      case 2:
        return true; // Penalty is optional
      case 3:
        return formData.paymentModes.length > 0;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges()) {
      setShowConfirmClose(true);
    } else {
      onClose();
    }
  };

  const handleConfirmClose = () => {
    resetForm();
    setShowConfirmClose(false);
    onClose();
  };

  const handleCancelClose = () => {
    setShowConfirmClose(false);
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const response = await apiClient('/billing', {
        method: 'POST',
        withAuth: true,
        body: {
          name: formData.name,
          description: formData.description,
          category: formData.category,
          billGenerationDate: formData.isRecurring ? 
            new Date(formData.firstBillYear, formData.firstBillMonth - 1, formData.generationDay).toISOString() :
            new Date(formData.billGenerationDate).toISOString(),
          dueDate: formData.isRecurring ?
            new Date(formData.firstBillYear, formData.firstBillMonth - 1, formData.dueDay).toISOString() :
            new Date(formData.dueDate).toISOString(),
          isRecurring: formData.isRecurring,
          recurrenceType: formData.isRecurring ? formData.recurrenceType : null,
          period: formData.isRecurring ? `${formData.firstBillYear}-${formData.firstBillMonth}` : formData.billGenerationDate.split('T')[0],
          charges: formData.charges.map(charge => ({
            name: charge.name,
            description: charge.description,
            amount: charge.amount,
            priceType: charge.priceType
          })),
          penalty: {
            graceDays: formData.penalty.graceDays,
            penaltyType: formData.penalty.penaltyType,
            amount: formData.penalty.amount,
            isPercentage: formData.penalty.isPercentage
          },
          target: formData.target,
          paymentModes: formData.paymentModes,
          status: 'active'
        },
        headers: {
          'Content-Type': 'application/json'
        }
      });
      toast.success('Invoice created successfully');
      resetForm();
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error('Failed to create invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Create Invoice</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              {steps.map((step, index) => (
                <div key={index} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {index + 1}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-1 mx-2 ${
                      index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900">{steps[currentStep].title}</h3>
              <p className="text-sm text-gray-500">{steps[currentStep].description}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
          {currentStep === 0 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Invoice Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter template name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Enter description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.isRecurring}
                    onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Is Recurring Bill</span>
                </label>
              </div>
              {formData.isRecurring ? (
                <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Recurrence Type *
                    </label>
                    <select
                      value={formData.recurrenceType}
                      onChange={(e) => setFormData({ ...formData, recurrenceType: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {formData.recurrenceType === 'monthly' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Starting Month *
                        </label>
                        <select
                          value={formData.firstBillMonth}
                          onChange={(e) => setFormData({ ...formData, firstBillMonth: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {(() => {
                            const currentMonth = new Date().getMonth();
                            const months = [
                              'January', 'February', 'March', 'April', 'May', 'June',
                              'July', 'August', 'September', 'October', 'November', 'December'
                            ];
                            const options = [];
                            
                            // Show previous month to December
                             for (let i = currentMonth - 1; i < 12; i++) {
                              options.push(
                                <option key={i + 1} value={i + 1}>
                                  {months[i]}
                                </option>
                              );
                            }
                            
                            return options;
                          })()}
                        </select>
                        <div className="mt-1 text-xs text-blue-600">
                          {(() => {
                            const months = [
                              'January', 'February', 'March', 'April', 'May', 'June',
                              'July', 'August', 'September', 'October', 'November', 'December'
                            ];
                            const selectedMonth = months[formData.firstBillMonth - 1];
                            const nextMonth = months[formData.firstBillMonth % 12];
                            return `Bill will be generated in ${nextMonth} for ${selectedMonth}`;
                          })()}
                        </div>
                      </div>
                    )}
                    
                    {formData.recurrenceType === 'quarterly' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Starting Quarter *
                        </label>
                        <select
                          value={formData.firstBillQuarter || 1}
                          onChange={(e) => setFormData({ ...formData, firstBillQuarter: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {(() => {
                            const currentQuarter = Math.floor(new Date().getMonth() / 3) + 1;
                            const quarters = ['Q1 (Jan-Mar)', 'Q2 (Apr-Jun)', 'Q3 (Jul-Sep)', 'Q4 (Oct-Dec)'];
                            const options = [];
                            
                            // Show current quarter to Q4
                            for (let i = currentQuarter; i <= 4; i++) {
                              options.push(
                                <option key={i} value={i}>
                                  {quarters[i - 1]}
                                </option>
                              );
                            }
                            
                            return options;
                          })()}
                        </select>
                        <div className="mt-1 text-xs text-blue-600">
                          {(() => {
                            const currentQuarter = Math.floor(new Date().getMonth() / 3) + 1;
                            const selectedQuarter = formData.firstBillQuarter || 1;
                            if (selectedQuarter <= currentQuarter) {
                              return `Bill will be generated in next quarter cycle`;
                            } else {
                              return `Bill will be generated for Q${selectedQuarter}`;
                            }
                          })()}
                        </div>
                      </div>
                    )}
                    
                    {formData.recurrenceType === 'yearly' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Starting Month *
                        </label>
                        <select
                          value={formData.firstBillMonth}
                          onChange={(e) => setFormData({ ...formData, firstBillMonth: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {(() => {
                            const months = [
                              'January', 'February', 'March', 'April', 'May', 'June',
                              'July', 'August', 'September', 'October', 'November', 'December'
                            ];
                            return months.map((month, index) => (
                              <option key={index + 1} value={index + 1}>
                                {month}
                              </option>
                            ));
                          })()}
                        </select>
                        <div className="mt-1 text-xs text-blue-600">
                          {(() => {
                             const months = [
                               'January', 'February', 'March', 'April', 'May', 'June',
                               'July', 'August', 'September', 'October', 'November', 'December'
                             ];
                             const selectedMonth = months[formData.firstBillMonth - 1];
                             const selectedYear = formData.firstBillYear;
                             return `Bill will be generated each ${selectedMonth} every year starting from ${selectedMonth} ${selectedYear}`;
                           })()}
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Starting Year *
                      </label>
                      <select
                        value={formData.firstBillYear}
                        onChange={(e) => setFormData({ ...formData, firstBillYear: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {[new Date().getFullYear(), new Date().getFullYear() + 1].map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Generation Day *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={formData.generationDay}
                        onChange={(e) => setFormData({ ...formData, generationDay: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Due Day *
                      </label>
                      <input
                        type="number"
                        min={formData.generationDay + 1}
                        max="31"
                        value={formData.dueDay}
                        onChange={(e) => {
                          const dueDay = parseInt(e.target.value);
                          if (dueDay > formData.generationDay) {
                            setFormData({ ...formData, dueDay });
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bill Generation Date *
                      </label>
                      <input
                        type="date"
                        value={formData.billGenerationDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setFormData({ ...formData, billGenerationDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Due Date *
                      </label>
                      <input
                        type="date"
                        value={formData.dueDate}
                        min={formData.billGenerationDate ? new Date(new Date(formData.billGenerationDate).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] : ''}
                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-medium text-gray-900">Charges *</h4>
                <button
                  type="button"
                  onClick={addCharge}
                  className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Add Charge
                </button>
              </div>
              <div className="text-sm text-gray-500">
                Add at least one charge for this invoice template.
              </div>
              {formData.charges.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <p className="text-gray-500">No charges added yet. Click "Add Charge" to get started.</p>
                </div>
              )}
              {formData.charges.map((charge, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-gray-900">Charge {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeCharge(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Charge Name *
                    </label>
                    <input
                      type="text"
                      value={charge.name}
                      onChange={(e) => updateCharge(index, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Maintenance Fee"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description *
                    </label>
                    <textarea
                      value={charge.description}
                      onChange={(e) => updateCharge(index, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={2}
                      placeholder="Describe this charge"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Amount *
                      </label>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={charge.amount || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          const numValue = parseFloat(value);
                          if (value === '' || (numValue > 0 && !isNaN(numValue))) {
                            updateCharge(index, 'amount', numValue || 0);
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter amount (must be > 0)"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Price Type *
                      </label>
                      <select
                        value={charge.priceType}
                        onChange={(e) => updateCharge(index, 'priceType', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="fixed">Fixed Amount</option>
                        <option value="per_sqft">Per Sq Ft</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-900">Penalty Configuration</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Penalty Type
                </label>
                <select
                  value={formData.penalty.penaltyType}
                  onChange={(e) => setFormData({
                    ...formData,
                    penalty: { ...formData.penalty, penaltyType: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="no_penalty">No Penalty</option>
                  <option value="fixed_amount">Fixed Amount</option>
                  <option value="percentage">Percentage</option>
                </select>
              </div>
              {formData.penalty.penaltyType !== 'no_penalty' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Grace Days
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.penalty.graceDays}
                        onChange={(e) => setFormData({
                          ...formData,
                          penalty: { ...formData.penalty, graceDays: parseInt(e.target.value) || 0 }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Penalty Amount
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.penalty.amount}
                        onChange={(e) => setFormData({
                          ...formData,
                          penalty: { ...formData.penalty, amount: parseFloat(e.target.value) || 0 }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Target Selection</h4>
                <div className="space-y-3">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="targetType"
                      value="all_flats"
                      checked={formData.target.type === 'all_flats'}
                      onChange={(e) => setFormData({
                        ...formData,
                        target: { ...formData.target, type: e.target.value as any }
                      })}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">All Flats</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="targetType"
                      value="specific_wings"
                      checked={formData.target.type === 'specific_wings'}
                      onChange={(e) => setFormData({
                        ...formData,
                        target: { ...formData.target, type: e.target.value as any }
                      })}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Specific Wings</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="targetType"
                      value="specific_flats"
                      checked={formData.target.type === 'specific_flats'}
                      onChange={(e) => setFormData({
                        ...formData,
                        target: { ...formData.target, type: e.target.value as any }
                      })}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Specific Flats</span>
                  </label>
                </div>
                {formData.target.type === 'specific_wings' && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Wings
                    </label>
                    <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3">
                      {wings.map(wing => (
                        <label key={wing.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={formData.target.wingIds.includes(wing.id)}
                            onChange={(e) => {
                              const wingIds = e.target.checked
                                ? [...formData.target.wingIds, wing.id]
                                : formData.target.wingIds.filter(id => id !== wing.id);
                              setFormData(prev => ({
                                ...prev,
                                target: { ...prev.target, wingIds }
                              }));
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{wing.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                {formData.target.type === 'specific_flats' && (
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Wing First
                      </label>
                      <select
                        value={selectedWingId}
                        onChange={(e) => {
                          const wingId = e.target.value;
                          setSelectedWingId(wingId);
                          setSelectedFloorId('');
                          setFloors([]);
                          setFlats([]);
                          if (wingId) fetchFloors(wingId);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Wing</option>
                        {wings.map(wing => (
                          <option key={wing.id} value={wing.id}>{wing.name}</option>
                        ))}
                      </select>
                    </div>
                    {floors.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Floor
                        </label>
                        <select
                          value={selectedFloorId}
                          disabled={!selectedWingId}
                          onChange={(e) => {
                            const floorId = e.target.value;
                            setSelectedFloorId(floorId);
                            setFlats([]);
                            if (selectedWingId && floorId) {
                              fetchFlats(selectedWingId, floorId);
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                          <option value="">Select Floor</option>
                          {floors.map(floor => (
                            <option key={floor.id} value={floor.id}>{floor.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    {selectedWingId && selectedFloorId && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Flats
                        </label>
                        <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3">
                          {flats.map(flat => (
                            <label key={flat.id} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={formData.target.flatIds.includes(flat.id)}
                                onChange={(e) => {
                                  const flatIds = e.target.checked
                                    ? [...formData.target.flatIds, flat.id]
                                    : formData.target.flatIds.filter(id => id !== flat.id);
                                  
                                  // Update selected flat details
                                  const wingName = wings.find(w => w.id === flat.wing_id)?.name || 'Unknown Wing';
                                  const updatedFlatDetails = e.target.checked
                                    ? [...selectedFlatDetails, { id: flat.id, name: flat.name, wingName }]
                                    : selectedFlatDetails.filter(detail => detail.id !== flat.id);
                                  
                                  setSelectedFlatDetails(updatedFlatDetails);
                                  setFormData(prev => ({
                                    ...prev,
                                    target: { ...prev.target, flatIds }
                                  }));
                                }}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700">
                                {flat.name} - {wings.find(w => w.id === flat.wing_id)?.name || 'Unknown Wing'}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Selection Summary */}
                {(formData.target.type === 'specific_wings' && formData.target.wingIds.length > 0) || 
                 (formData.target.type === 'specific_flats' && formData.target.flatIds.length > 0) ? (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <h5 className="font-medium text-blue-900 mb-2">Selection Summary</h5>
                    {formData.target.type === 'specific_wings' && (
                      <div className="text-sm text-blue-800">
                        <p className="font-medium">Selected Wings ({formData.target.wingIds.length}):</p>
                        <p>{formData.target.wingIds.map(wingId => 
                          wings.find(w => w.id === wingId)?.name
                        ).filter(Boolean).join(', ')}</p>
                      </div>
                    )}
                    {formData.target.type === 'specific_flats' && (
                      <div className="text-sm text-blue-800">
                        <p className="font-medium">Selected Flats ({formData.target.flatIds.length}):</p>
                        <div className="max-h-20 overflow-y-auto">
                          <div className="text-xs space-y-1">
                            {selectedFlatDetails.map(flatDetail => (
                              <div key={flatDetail.id} className="text-gray-700">
                                {flatDetail.name} - {flatDetail.wingName}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Payment Modes *</h4>
                <div className="grid grid-cols-2 gap-3">
                  {paymentModeOptions.map(mode => (
                    <label key={mode.value} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.paymentModes.includes(mode.value)}
                        onChange={() => togglePaymentMode(mode.value)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{mode.label}</span>
                    </label>
                  ))}
                </div>
                {formData.paymentModes.length === 0 && (
                  <p className="text-sm text-red-600 mt-2">Please select at least one payment mode</p>
                )}
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <h4 className="text-lg font-medium text-gray-900">Review & Confirm</h4>
              <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Basic Information</h5>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Name:</span> {formData.name}</p>
                      <p><span className="font-medium">Description:</span> {formData.description}</p>
                      <p><span className="font-medium">Category:</span> {categories.find(c => c.value === formData.category)?.label}</p>
                      <p><span className="font-medium">Recurring:</span> {formData.isRecurring ? 'Yes' : 'No'}</p>
                      {formData.isRecurring ? (
                        <>
                          <p><span className="font-medium">Recurrence:</span> {formData.recurrenceType}</p>
                          <p><span className="font-medium">Generation Day:</span> {formData.generationDay}</p>
                          <p><span className="font-medium">Due Day:</span> {formData.dueDay}</p>
                        </>
                      ) : (
                        <>
                          <p><span className="font-medium">Generation Date:</span> {formData.billGenerationDate}</p>
                          <p><span className="font-medium">Due Date:</span> {formData.dueDate}</p>
                        </>
                      )}
                    </div>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Target & Payment</h5>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Target:</span> {formData.target.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                      {formData.target.type === 'specific_wings' && formData.target.wingIds.length > 0 && (
                        <div>
                          <p><span className="font-medium">Wings ({formData.target.wingIds.length}):</span></p>
                          <p className="text-xs text-gray-600 ml-2">{formData.target.wingIds.map(wingId => 
                            wings.find(w => w.id === wingId)?.name
                          ).filter(Boolean).join(', ')}</p>
                        </div>
                      )}
                      {formData.target.type === 'specific_flats' && formData.target.flatIds.length > 0 && (
                        <div>
                          <p><span className="font-medium">Flats ({formData.target.flatIds.length}):</span></p>
                          <div className="text-xs text-gray-600 ml-2 max-h-16 overflow-y-auto">
                             <div className="space-y-1">
                               {selectedFlatDetails.map(flatDetail => (
                                 <div key={flatDetail.id}>
                                   {flatDetail.name} - {flatDetail.wingName}
                                 </div>
                               ))}
                             </div>
                           </div>
                        </div>
                      )}
                      <p><span className="font-medium">Payment Modes:</span> {formData.paymentModes.map(mode => paymentModeOptions.find(p => p.value === mode)?.label).join(', ')}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Charges ({formData.charges.length})</h5>
                  <div className="space-y-2">
                    {formData.charges.map((charge, index) => (
                      <div key={index} className="bg-white p-3 rounded border">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm">{charge.name}</p>
                            <p className="text-xs text-gray-600">{charge.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-sm">₹{charge.amount}</p>
                            <p className="text-xs text-gray-500">{charge.priceType === 'per_sqft' ? 'Per Sq Ft' : 'Fixed'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Total Charges:</strong> ₹{formData.charges.reduce((sum, charge) => sum + charge.amount, 0).toFixed(2)}
                    {formData.charges.some(c => c.priceType === 'per_sqft') && ' (+ per sq ft charges)'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
          <div className="flex space-x-3">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
          {currentStep < steps.length - 1 ? (
            <button
              onClick={handleNext}
              disabled={!canProceedToNext()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !canProceedToNext()}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Creating...' : 'Create Invoice'}
            </button>
          )}
        </div>
      </div>
      
      {/* Confirmation Dialog */}
      {showConfirmClose && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Discard Changes?</h3>
            <p className="text-gray-600 mb-6">
              You have unsaved changes. Are you sure you want to close this dialog? All your progress will be lost.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelClose}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Keep Editing
              </button>
              <button
                onClick={handleConfirmClose}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Template Detail Modal Component
interface TemplateDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: InvoiceTemplate;
}

const TemplateDetailModal: React.FC<TemplateDetailModalProps> = ({ isOpen, onClose, template }) => {
  if (!isOpen) return null;

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(numAmount);
  };

  const getTotalAmount = () => {
    return template.charges?.reduce((total, charge) => total + (charge.amount || 0), 0) || 0;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{template.name}</h2>
            <p className="text-sm text-gray-600 mt-1">{template.description}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(template.status)}`}>
                {template.status}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recurrence</label>
              <p className="text-sm text-gray-900">{template.recurrenceType}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
              <p className="text-sm text-gray-900">{new Date(template.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Updated</label>
              <p className="text-sm text-gray-900">{new Date(template.updatedAt).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Target & Payment Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Type</label>
              <p className="text-sm text-gray-900">{template.target?.type?.replace('_', ' ') || 'All flats'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Modes</label>
              <div className="flex flex-wrap gap-1">
                {template.paymentModes?.map((mode, index) => (
                  <span key={index} className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                    {mode}
                  </span>
                )) || <span className="text-sm text-gray-500">Not specified</span>}
              </div>
            </div>
          </div>

          {/* Charges */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Charges</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mode</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {template.charges?.map((charge, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 text-sm text-gray-900">{charge.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{charge.description}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(charge.amount)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{charge.mode}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{charge.category}</td>
                    </tr>
                  )) || (
                    <tr>
                      <td colSpan={5} className="px-4 py-3 text-sm text-gray-500 text-center">No charges defined</td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={2} className="px-4 py-3 text-sm font-medium text-gray-900">Total</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatCurrency(getTotalAmount())}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Penalty Settings */}
          {template.penalty && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Penalty Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grace Days</label>
                  <p className="text-sm text-gray-900">{template.penalty.graceDays || 0} days</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Penalty Type</label>
                  <p className="text-sm text-gray-900">{template.penalty.penaltyType}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Penalty Amount</label>
                  <p className="text-sm text-gray-900">
                    {template.penalty.penaltyType === 'percentage' 
                      ? `${template.penalty.amount}%` 
                      : formatCurrency(template.penalty.amount)}
                  </p>
                </div>

              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Templates Tab Component
const TemplatesTab: React.FC<{ societyId: string }> = ({ societyId }) => {
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplate | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [wings, setWings] = useState<any[]>([]);
  const [floors, setFloors] = useState<any[]>([]);
  const [flats, setFlats] = useState<any[]>([]);
  const [selectedWing, setSelectedWing] = useState('all');
  const [selectedFloor, setSelectedFloor] = useState('all');
  const [selectedFlat, setSelectedFlat] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchTemplates();
    fetchWings();
  }, [societyId, statusFilter, selectedWing, selectedFlat, currentPage]);

  useEffect(() => {
    if (selectedWing !== 'all') {
      fetchFloors(selectedWing);
    } else {
      setFloors([]);
      setSelectedFloor('all');
      setFlats([]);
      setSelectedFlat('all');
    }
  }, [selectedWing]);

  useEffect(() => {
    if (selectedFloor !== 'all') {
      fetchFlats(selectedWing, selectedFloor);
    } else {
      setFlats([]);
      setSelectedFlat('all');
    }
  }, [selectedFloor]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {
        page: currentPage.toString(),
        limit: '10'
      };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (searchTerm) params.search = searchTerm;
      if (selectedWing !== 'all') params.selectedWing = selectedWing;
      if (selectedFloor !== 'all') params.selectedFloor = selectedFloor;
      if (selectedFlat !== 'all') params.selectedFlat = selectedFlat;
      
      const response = await apiClient(`/billing/templates/recurring`, {
        withAuth: true,
        params
      });
      
      setTemplates(response?.templates || []);
      if (response?.pagination) {
        setTotalPages(response.pagination.totalPages);
        setTotalCount(response.pagination.totalCount);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const fetchWings = async () => {
    try {
      const response = await apiClient('/billing/wings', {
        withAuth: true,
      });
      setWings(response?.wings || response?.data || response || []);
    } catch (error) {
      console.error('Error fetching wings:', error);
      setWings([]);
    }
  };

  const fetchFloors = async (wingId: string) => {
    try {
      const response = await apiClient(`/billing/floors?wingId=${wingId}`, {
        withAuth: true,
      });
      setFloors(response?.floors || response?.data || response || []);
    } catch (error) {
      console.error('Error fetching floors:', error);
      setFloors([]);
    }
  };

  const fetchFlats = async (wingId: string, floorId?: string) => {
    try {
      let url = `/billing/flats?wingId=${wingId}`;
      if (floorId) {
        url += `&floorId=${floorId}`;
      }
      const response = await apiClient(url, {
        withAuth: true,
      });
      setFlats(response?.flats || response?.data || response || []);
    } catch (error) {
      console.error('Error fetching flats:', error);
      setFlats([]);
    }
  };

  const toggleTemplateStatus = async (templateId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await apiClient(`/billing/${templateId}/status`, {
        method: 'PATCH' as any,
        withAuth: true,
        body: JSON.stringify({ status: newStatus }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      toast.success(`Template ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
      fetchTemplates();
    } catch (error) {
      console.error('Error updating template status:', error);
      toast.error('Failed to update template status');
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || template.status === statusFilter;
    
    // Wing, floor and flat filtering
    let matchesWingFloorFlat = true;
    if (selectedWing !== 'all' || selectedFloor !== 'all' || selectedFlat !== 'all') {
      const target = template.target;
      if (target?.type === 'specific_wings' && selectedWing !== 'all') {
        matchesWingFloorFlat = target.wingIds?.includes(selectedWing) || false;
      } else if (target?.type === 'specific_flats' && (selectedWing !== 'all' || selectedFloor !== 'all' || selectedFlat !== 'all')) {
        if (selectedFlat !== 'all') {
          matchesWingFloorFlat = target.flatIds?.includes(selectedFlat) || false;
        } else {
          // If wing or floor is selected but not flat, check if any flats in the target match the criteria
          matchesWingFloorFlat = true; // This would need backend support to filter properly
        }
      } else if (selectedWing !== 'all' || selectedFloor !== 'all' || selectedFlat !== 'all') {
        // If filters are applied but template targets all flats, don't show it
        matchesWingFloorFlat = target?.type !== 'all_flats';
      }
    }
    
    return matchesSearch && matchesStatus && matchesWingFloorFlat;
  });

  return (
    <div className="space-y-4">
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-lg font-semibold text-gray-900">Recurring Invoices</h3>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create Invoice
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <select
          value={selectedWing}
          onChange={(e) => {
            setSelectedWing(e.target.value);
            setSelectedFloor('all');
            setSelectedFlat('all');
          }}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Wings</option>
          {wings.map((wing) => (
            <option key={wing.wing_id} value={wing.wing_id.toString()}>
              {wing.wing_name}
            </option>
          ))}
        </select>
        <select
          value={selectedFloor}
          onChange={(e) => {
            setSelectedFloor(e.target.value);
            setSelectedFlat('all');
          }}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={selectedWing === 'all'}
        >
          <option value="all">All Floors</option>
          {floors.map((floor) => (
            <option key={floor.floor_id} value={floor.floor_id.toString()}>
              {floor.floor_name}
            </option>
          ))}
        </select>
        <select
          value={selectedFlat}
          onChange={(e) => setSelectedFlat(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={selectedFloor === 'all'}
        >
          <option value="all">All Flats</option>
          {flats.map((flat) => (
            <option key={flat.flat_id} value={flat.flat_id.toString()}>
              {flat.flat_number}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button
          onClick={fetchTemplates}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Search
        </button>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-200 animate-pulse h-20 rounded-lg"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.length > 0 ? (
            filteredTemplates.map((template) => (
              <div key={template.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {template.name}
                  </h4>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      template.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {template.status}
                    </span>
                    <Receipt className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                  {template.description || 'No description available'}
                </p>
                <div className="text-xs text-gray-400 mb-3">
                  <div>Recurrence: {template.recurrenceType}</div>
                  <div>Charges: {template.charges?.length || 0}</div>
                  <div>Target: {template.target?.type?.replace('_', ' ') || 'All flats'}</div>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => {
                      setSelectedTemplate(template);
                      setShowDetailModal(true);
                    }}
                    className="flex-1 px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    View Details
                  </button>
                  <button
                    onClick={() => toggleTemplateStatus(template.id, template.status)}
                    className={`flex-1 px-3 py-1 text-xs rounded transition-colors flex items-center justify-center gap-1 ${
                      template.status === 'active'
                        ? 'bg-red-50 text-red-600 hover:bg-red-100'
                        : 'bg-green-50 text-green-600 hover:bg-green-100'
                    }`}
                  >
                    {template.status === 'active' ? (
                      <><ToggleRight className="w-3 h-3" />Deactivate</>
                    ) : (
                      <><ToggleLeft className="w-3 h-3" />Activate</>
                    )}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-8">
              <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No invoices found</p>
              <p className="text-sm text-gray-400 mt-1">
                {statusFilter !== 'all' ? `No ${statusFilter} invoices found` : 'Create your first recurring invoice to get started'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{((currentPage - 1) * 10) + 1}</span> to{' '}
                <span className="font-medium">{Math.min(currentPage * 10, totalCount)}</span> of{' '}
                <span className="font-medium">{totalCount}</span> results
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                  </svg>
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(currentPage - 2 + i, totalPages - 4 + i));
                  if (pageNum > totalPages) return null;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                        currentPage === pageNum
                          ? 'z-10 bg-blue-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                          : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Create Invoice Modal */}
      <InvoiceCreationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        societyId={societyId}
        onSuccess={fetchTemplates}
      />

      {/* Template Detail Modal */}
      {selectedTemplate && (
        <TemplateDetailModal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedTemplate(null);
          }}
          template={selectedTemplate}
        />
      )}
    </div>
  );
};

// Raised Invoices Tab Component
interface RaisedInvoice {
  id: string;
  name: string;
  description: string;
  billGenerationDate: string;
  dueDate: string;
  isRecurring: boolean;
  recurrenceType: string | null;
  charges: Array<{
    name: string;
    description: string;
    amount: string;
    isPerSqFeet: number;
    category: string | null;
  }>;
  penalty: {
    grace_days: number;
    penalty_type: string;
    amount: string;
    isPercentage: number;
  };
  target: {
    type: string;
    wingIds: string[];
    flatIds: string[];
  };
  period: string;
  paymentModes: string[];
  status: string;
  createdByName: string | null;
  createdAt: string;
}

const RaisedInvoicesTab: React.FC<{ societyId: string }> = ({ societyId }) => {
  const [raisedInvoices, setRaisedInvoices] = useState<RaisedInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState<RaisedInvoice | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [wings, setWings] = useState<any[]>([]);
  const [floors, setFloors] = useState<any[]>([]);
  const [flats, setFlats] = useState<any[]>([]);
  const [selectedWing, setSelectedWing] = useState('all');
  const [selectedFloor, setSelectedFloor] = useState('all');
  const [selectedFlat, setSelectedFlat] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchRaisedInvoices();
    fetchWings();
  }, [societyId, statusFilter, selectedWing, selectedFloor, selectedFlat, currentPage]);

  useEffect(() => {
    if (selectedWing !== 'all') {
      fetchFloors(selectedWing);
    } else {
      setFloors([]);
      setSelectedFloor('all');
      setFlats([]);
      setSelectedFlat('all');
    }
  }, [selectedWing]);

  useEffect(() => {
    if (selectedFloor !== 'all') {
      fetchFlats(selectedWing, selectedFloor);
    } else {
      setFlats([]);
      setSelectedFlat('all');
    }
  }, [selectedFloor]);

  const fetchRaisedInvoices = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {
        page: currentPage.toString(),
        limit: '10'
      };
      if (searchTerm) params.search = searchTerm;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (selectedWing !== 'all') params.selectedWing = selectedWing;
      if (selectedFloor !== 'all') params.selectedFloor = selectedFloor;
      if (selectedFlat !== 'all') params.selectedFlat = selectedFlat;
      
      const response = await apiClient('/billing/templates/raised', {
        withAuth: true,
        params,
      });
      
      setRaisedInvoices(response?.templates || []);
      if (response?.pagination) {
        setTotalPages(response.pagination.totalPages);
        setTotalCount(response.pagination.totalCount);
      }
    } catch (error) {
      console.error('Error fetching raised invoices:', error);
      toast.error('Failed to load raised invoices');
    } finally {
      setLoading(false);
    }
  };

  const fetchWings = async () => {
    try {
      const response = await apiClient('/billing/wings', {
        withAuth: true,
      });
      setWings(response?.wings || response?.data || response || []);
    } catch (error) {
      console.error('Error fetching wings:', error);
      setWings([]);
    }
  };

  const fetchFloors = async (wingId: string) => {
    try {
      const response = await apiClient(`/billing/floors?wingId=${wingId}`, {
        withAuth: true,
      });
      setFloors(response?.floors || response?.data || response || []);
    } catch (error) {
      console.error('Error fetching floors:', error);
      setFloors([]);
    }
  };

  const fetchFlats = async (wingId: string, floorId?: string) => {
    try {
      let url = `/billing/flats?wingId=${wingId}`;
      if (floorId) {
        url += `&floorId=${floorId}`;
      }
      const response = await apiClient(url, {
        withAuth: true,
      });
      setFlats(response?.flats || response?.data || response || []);
    } catch (error) {
      console.error('Error fetching flats:', error);
      setFlats([]);
    }
  };





  const filteredInvoices = raisedInvoices.filter(invoice => {
    const matchesSearch = !searchTerm || 
      invoice.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    
    // Wing, floor and flat filtering for templates
    let matchesWingFloorFlat = true;
    if (selectedWing !== 'all' || selectedFloor !== 'all' || selectedFlat !== 'all') {
      if (invoice.target.type === 'all_flats') {
        matchesWingFloorFlat = true;
      } else if (invoice.target.type === 'specific_wings' && selectedWing !== 'all') {
        matchesWingFloorFlat = invoice.target.wingIds.includes(selectedWing);
      } else if (invoice.target.type === 'specific_flats') {
        if (selectedFlat !== 'all') {
          matchesWingFloorFlat = invoice.target.flatIds.includes(selectedFlat);
        } else if (selectedWing !== 'all' || selectedFloor !== 'all') {
          // For specific flats, check if any of the target flats belong to the selected wing/floor
          const selectedFlatData = flats.filter(f => invoice.target.flatIds.includes(f.flat_id.toString()));
          if (selectedWing !== 'all') {
            matchesWingFloorFlat = selectedFlatData.some(f => f.wing_id.toString() === selectedWing);
          }
          if (selectedFloor !== 'all' && matchesWingFloorFlat) {
            matchesWingFloorFlat = selectedFlatData.some(f => f.floor_id?.toString() === selectedFloor);
          }
        }
      }
    }
    
    return matchesSearch && matchesStatus && matchesWingFloorFlat;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getTotalAmount = (charges: RaisedInvoice['charges']) => {
    return charges.reduce((total, charge) => total + parseFloat(charge.amount || '0'), 0);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h3 className="text-lg font-semibold text-gray-900">Raised Invoices</h3>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Invoice
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <select
          value={selectedWing}
          onChange={(e) => {
            setSelectedWing(e.target.value);
            setSelectedFloor('all');
            setSelectedFlat('all');
          }}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Wings</option>
          {wings.map((wing) => (
            <option key={wing.wing_id} value={wing.wing_id.toString()}>
              {wing.wing_name}
            </option>
          ))}
        </select>
        <select
          value={selectedFloor}
          onChange={(e) => {
            setSelectedFloor(e.target.value);
            setSelectedFlat('all');
          }}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={selectedWing === 'all'}
        >
          <option value="all">All Floors</option>
          {floors.map((floor) => (
            <option key={floor.floor_id} value={floor.floor_id.toString()}>
              {floor.floor_name}
            </option>
          ))}
        </select>
        <select
          value={selectedFlat}
          onChange={(e) => setSelectedFlat(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={selectedFloor === 'all'}
        >
          <option value="all">All Flats</option>
          {flats.map((flat) => (
            <option key={flat.flat_id} value={flat.flat_id.toString()}>
              {flat.flat_number}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button
          onClick={fetchRaisedInvoices}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Search
        </button>
      </div>

      {/* Invoices Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-gray-200 animate-pulse h-48 rounded-lg"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInvoices.length > 0 ? (
            filteredInvoices.map((invoice) => (
              <div key={invoice.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 truncate">{invoice.name}</h4>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{invoice.description}</p>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    invoice.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : invoice.status === 'inactive'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {invoice.status}
                  </span>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Target:</span>
                    <span className="font-medium">
                      {invoice.target.type === 'all_flats' ? 'All Flats' : 
                       invoice.target.type === 'specific_wings' ? `${invoice.target.wingIds.length} Wings` :
                       `${invoice.target.flatIds.length} Flats`}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Total Amount:</span>
                    <span className="font-medium">{formatCurrency(getTotalAmount(invoice.charges))}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Due Date:</span>
                    <span className="font-medium">{new Date(invoice.dueDate).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedInvoice(invoice);
                      setShowDetailModal(true);
                    }}
                    className="w-full px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    View Details
                  </button>
                </div>
                

              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-8">
              <Plus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No raised invoices found</p>
              <p className="text-sm text-gray-400 mt-1">
                {statusFilter !== 'all' ? `No ${statusFilter} invoices found` : 'Create your first invoice to get started'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 px-4 py-3 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center text-sm text-gray-700">
            <span>
              Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalCount)} of {totalCount} results
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                if (pageNum > totalPages) return null;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 text-sm border rounded-md ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedInvoice(null);
          }}
        />
      )}

      {/* Create Invoice Modal */}
      <InvoiceCreationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        societyId={societyId}
        onSuccess={() => {
          setShowCreateModal(false);
          fetchRaisedInvoices();
        }}
      />
    </div>
  );
};

// Invoice Detail Modal Component
const InvoiceDetailModal: React.FC<{
  invoice: RaisedInvoice;
  isOpen: boolean;
  onClose: () => void;
}> = ({ invoice, isOpen, onClose }) => {
  if (!isOpen) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getTotalAmount = (charges: RaisedInvoice['charges']) => {
    return charges.reduce((total, charge) => total + parseFloat(charge.amount || '0'), 0);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{invoice.name}</h2>
              <p className="text-gray-600 mt-1">{invoice.description}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Status:</span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    invoice.status === 'paid'
                      ? 'bg-green-100 text-green-800'
                      : invoice.status === 'due'
                      ? 'bg-yellow-100 text-yellow-800'
                      : invoice.status === 'overdue'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {invoice.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Target:</span>
                  <span className="font-medium">
                    {invoice.target.type === 'all_flats' ? 'All Flats' : 
                     invoice.target.type === 'specific_wings' ? `Wings: ${invoice.target.wingIds.length}` :
                     `Flats: ${invoice.target.flatIds.length}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Period:</span>
                  <span className="font-medium">{invoice.period}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Created:</span>
                  <span className="font-medium">{new Date(invoice.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Due Date:</span>
                  <span className="font-medium">{new Date(invoice.dueDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Payment & Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Created By:</span>
                  <span className="font-medium">{invoice.createdByName || 'System'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment Modes:</span>
                  <span className="font-medium">{invoice.paymentModes.length}</span>
                </div>
                {invoice.paymentModes.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {invoice.paymentModes.map((mode: string, index: number) => (
                      <span key={index} className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                        {mode.toUpperCase()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Charges */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Charges</h3>
            <div className="bg-gray-50 rounded-lg overflow-hidden">
              <table className="min-w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Rate</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoice.charges.map((charge, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{charge.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{charge.description}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatCurrency(parseFloat(charge.amount || '0'))}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 capitalize">{charge.isPerSqFeet === 1 ? 'Per Sq Ft' : 'Fixed'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">₹{charge.amount}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50">
                    <td colSpan={2} className="px-4 py-3 text-sm font-medium text-gray-900">Total</td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-900">{formatCurrency(getTotalAmount(invoice.charges))}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Penalty */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Details</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">Grace Days:</span>
                  <span className="font-medium">{invoice.penalty?.grace_days || 0} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Penalty Type:</span>
                  <span className="font-medium">{invoice.penalty?.penalty_type || 'None'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Penalty Amount:</span>
                  <span className="font-medium">
                    {invoice.penalty?.isPercentage === 1 ? 
                      `${invoice.penalty.amount}%` : 
                      formatCurrency(parseFloat(invoice.penalty?.amount || '0'))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Payable:</span>
                  <span className="font-medium text-lg">{formatCurrency(getTotalAmount(invoice.charges))}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicesPenaltiesPage;