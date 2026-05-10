import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  X, 
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Calendar,
  DollarSign,
  FileText,
  Upload,
  ExternalLink,
  Receipt,
  Check,
  Activity,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import clsx from 'clsx';
import { apiClient, getExpenseInvoiceUrl, getSocietyDetailsForExpenses } from '@/lib/apiClient';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

// Types
interface Attachment {
  filename: string;
  url: string;
  size: number;
  mimetype: string;
}

interface ExpenseRecord {
  id: string;
  invoice_name: string;
  invoice_id: string;
  category: string;
  subcategory: string;
  type: 'society' | 'flat';
  credit_debit: 'credit' | 'debit';
  gross_amount: number;
  fees: number;
  tax_percentage: number;
  tax_amount: number;
  gst_percentage?: number;
  gst_amount?: number;
  net_amount: number;
  total_amount?: number;
  payment_method: string;
  payment_details_specific: string;
  payment_details?: Record<string, any>;
  transaction_id?: string;
  cheque_number?: string;
  bank_name?: string;
  transaction_date: string;
  clearing_date?: string;
  receipt_no?: string;
  receipt_number?: string;
  wing_id?: string;
  floor_id?: string;
  flat_id?: string;
  wing_names?: string[];
  flat_names?: string[];
  is_flat_specific?: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  created_at: string;
  updated_at: string;
  created_by_name?: string;
  paid_by?: string;
  paid_by_contact?: string;
  collected_by?: string;
  collected_by_contact?: string;
  collected_by_gst_number?: string;
  paid_by_gst_number?: string;
  charges?: Charge[];
  attachments?: Attachment[];
  notes?: string;
  description?: string;
}

interface ExpenseFormData {
  invoice_name: string;
  invoice_id: string;
  category: string;
  subcategory: string;
  type: 'society' | 'flat';
  credit_debit: 'credit' | 'debit';
  gross_amount: string;
  fees: string;
  tax_percentage: string;
  tax_amount: string;
  net_amount: string;
  payment_method: string;
  payment_details_specific: string;
  cheque_number: string;
  bank_name: string;
  transaction_date: string;
  clearing_date: string;
  receipt_no: string;
  wing_id: string;
  floor_id: string;
  flat_id: string;
  collected_by_name: string;
  collected_by_phone: string;
  collected_by_email: string;
  collected_by_gst_number: string;
  paid_by_name: string;
  paid_by_phone: string;
  paid_by_email: string;
  paid_by_gst_number: string;
  transaction_id: string;
  gst_percentage: string;
  gst_amount: string;
  attachments: File[];
  charges: Charge[];
  notes: string;
  description: string;
}

interface Charge {
  charge_name: string;
  quantity: number;
  rate: number;
  tax_percentage: number;
  tax_amount?: number;
  total: number;
}

interface Wing {
  id: string;
  name: string;
}

interface Floor {
  id: string;
  name: string;
  wing_id: string;
}

interface Flat {
  id: string;
  name: string;
  floor_id: string;
}

interface ExpenseManagementProps {
  societyId: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

const ExpenseManagement: React.FC<ExpenseManagementProps> = ({ societyId, user }) => {
  // State
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(null);
  const [viewingExpense, setViewingExpense] = useState<ExpenseRecord | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterType, setFilterType] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Tab state
  const [activeTab, setActiveTab] = useState('expenses');
  
  // Export state
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportEmails, setExportEmails] = useState<string[]>(['']);
  const [exportDateFrom, setExportDateFrom] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [exportDateTo, setExportDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [exportCategories, setExportCategories] = useState<string[]>([]);
  const [exportStatus, setExportStatus] = useState('all');
  const [exportWingId, setExportWingId] = useState('');
  const [exportFloorId, setExportFloorId] = useState('');
  const [exportFlatIds, setExportFlatIds] = useState<string[]>([]);
  const [exportFloors, setExportFloors] = useState<any[]>([]);
  const [exportFlats, setExportFlats] = useState<any[]>([]);
  
  // Form change tracking state
  const [hasFormChanges, setHasFormChanges] = useState(false);
  const [originalFormData, setOriginalFormData] = useState<ExpenseFormData | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  // Multi-step form state
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  
  // Form data
  const [formData, setFormData] = useState<ExpenseFormData>({
    invoice_name: '',
    invoice_id: '',
    category: '',
    subcategory: '',
    type: 'society',
    credit_debit: 'debit',
    gross_amount: '',
    fees: '',
    tax_percentage: '',
    tax_amount: '',
    net_amount: '',
    payment_method: '',
    payment_details_specific: '',
    cheque_number: '',
    bank_name: '',
    transaction_date: '',
    clearing_date: '',
    receipt_no: '',
    wing_id: '',
    floor_id: '',
    flat_id: '',
    collected_by_name: '',
    collected_by_phone: '',
    collected_by_email: '',
    collected_by_gst_number: '',
    paid_by_name: '',
    paid_by_phone: '',
    paid_by_email: '',
    paid_by_gst_number: '',
    transaction_id: '',
    gst_percentage: '0',
    gst_amount: '',
    attachments: [],
    charges: [],
    notes: '',
    description: ''
  });
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [wings, setWings] = useState<Wing[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [flats, setFlats] = useState<Flat[]>([]);
  
  // Available options
  const availableCategories = ['Maintenance', 'Utilities', 'Security', 'Cleaning', 'Repairs', 'Administration', 'Promotion', 'Other'];
  const availablePaymentMethods = ['Cash', 'Bank Transfer', 'Cheque', 'UPI', 'Card'];
  
  // Subcategory mapping
  const subcategoryMapping: Record<string, string[]> = {
    'Maintenance': ['General Maintenance', 'Elevator Maintenance', 'Generator Maintenance', 'Pump Maintenance', 'CCTV Maintenance'],
    'Utilities': ['Electricity', 'Water', 'Gas', 'Internet', 'Cable TV'],
    'Security': ['Security Guard Salary', 'Security Equipment', 'CCTV Installation', 'Access Control'],
    'Cleaning': ['Housekeeping Salary', 'Cleaning Supplies', 'Waste Management', 'Pest Control'],
    'Repairs': ['Plumbing', 'Electrical', 'Painting', 'Carpentry', 'Masonry'],
    'Administration': ['Office Supplies', 'Legal Fees', 'Audit Fees', 'Insurance', 'Registration'],
    'Promotion': ['Marketing Materials', 'Advertising', 'Community Events', 'Branding', 'Website Development', 'Social Media', 'Other'],
    'Other': ['Miscellaneous', 'Emergency Expenses', 'Festival Expenses', 'Community Events', 'Other']
  };
  
  const availableSubcategories = formData.category ? subcategoryMapping[formData.category] || [] : [];
  
  // Helper functions
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };
  
  // Modal closing functions
  const handleModalClose = () => {
    if (hasFormChanges) {
      setShowConfirmDialog(true);
    } else {
      setIsModalOpen(false);
      resetForm();
    }
  };
  
  const confirmCloseModal = () => {
    setShowConfirmDialog(false);
    setIsModalOpen(false);
    resetForm();
  };
  
  const cancelCloseModal = () => {
    setShowConfirmDialog(false);
  };

  // Auto-fill society details into Collected By / Paid By
  const autoFillSocietyDetails = async () => {
    try {
      setModalLoading(true);
      const res = await getSocietyDetailsForExpenses();
      const s = res.data;
      setFormData(prev => ({
        ...prev,
        collected_by_name: s.name || prev.collected_by_name,
        collected_by_email: s.email || prev.collected_by_email,
        collected_by_phone: s.contact_number || prev.collected_by_phone,
        collected_by_gst_number: s.gst_number || prev.collected_by_gst_number,
        paid_by_name: s.name || prev.paid_by_name,
        paid_by_email: s.email || prev.paid_by_email,
        paid_by_phone: s.contact_number || prev.paid_by_phone,
        paid_by_gst_number: s.gst_number || prev.paid_by_gst_number,
      }));
      toast.success('Society details auto-filled');
    } catch (err: any) {
      toast.error(err.message || 'Failed to auto-fill society details');
    } finally {
      setModalLoading(false);
    }
  };

  // Add Expense: auto-populate next invoice id
  const handleAddExpenseClick = async () => {
    // Reset and open modal
    resetForm();
    setHasFormChanges(false);
    setOriginalFormData(null);
    setIsModalOpen(true);
    try {
      setModalLoading(true);
      const res = await apiClient<{ success: boolean; data: { next_id: number } }>(`/expenses/next-invoice-id`, {
        method: 'GET',
        withAuth: true,
      });
      const nextId = (res as any)?.data?.next_id;
      if (nextId !== undefined && nextId !== null) {
        setFormData(prev => ({ ...prev, invoice_id: String(nextId) }));
        toast.success(`Invoice ID auto-filled: ${nextId}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch next invoice ID');
    } finally {
      setModalLoading(false);
    }
  };

  // Download generated invoice for viewing expense
  const handleDownloadInvoice = async () => {
    if (!viewingExpense) return;
    try {
      setModalLoading(true);
      const res = await getExpenseInvoiceUrl(String(viewingExpense.id));
      const url = res?.data?.url;
      if (url) {
        window.open(url, '_blank');
        toast.success('Invoice generated');
      } else {
        toast.error('Invoice URL not available');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to download invoice');
    } finally {
      setModalLoading(false);
    }
  };
  
  // Form functions
  const resetForm = () => {
    setFormData({
      invoice_name: '',
      invoice_id: '',
      category: '',
      subcategory: '',
      type: 'society',
      credit_debit: 'debit',
      gross_amount: '',
      fees: '',
      tax_percentage: '',
      tax_amount: '',
      net_amount: '',
      payment_method: '',
      payment_details_specific: '',
      cheque_number: '',
      bank_name: '',
      transaction_date: '',
      clearing_date: '',
      receipt_no: '',
      wing_id: '',
      floor_id: '',
      flat_id: '',
      collected_by_name: '',
      collected_by_phone: '',
      collected_by_email: '',
      collected_by_gst_number: '',
      paid_by_name: '',
      paid_by_phone: '',
      paid_by_email: '',
      paid_by_gst_number: '',
      transaction_id: '',
      gst_percentage: '0',
      gst_amount: '',
      attachments: [],
      charges: [],
      notes: '',
      description: ''
    });
    setFormErrors({});
    setEditingExpense(null);
    setCurrentStep(1);
    setHasFormChanges(false);
    setOriginalFormData(null);
  };
  
  const handleEdit = (expense: ExpenseRecord) => {
    const initialFormData = {
      invoice_name: expense.invoice_name,
      invoice_id: expense.invoice_id,
      category: expense.category,
      subcategory: expense.subcategory,
      type: expense.type,
      credit_debit: expense.credit_debit,
      gross_amount: expense.gross_amount.toString(),
      fees: expense.fees.toString(),
      tax_percentage: expense.tax_percentage.toString(),
      tax_amount: expense.tax_amount.toString(),
      net_amount: expense.net_amount.toString(),
      payment_method: expense.payment_method,
      payment_details_specific: expense.payment_details_specific || '',
      cheque_number: expense.cheque_number || '',
      bank_name: expense.bank_name || '',
      transaction_date: expense.transaction_date,
      clearing_date: expense.clearing_date || '',
      receipt_no: (expense.receipt_no || expense.receipt_number || ''),
      wing_id: expense.wing_id || '',
      floor_id: expense.floor_id || '',
      flat_id: expense.flat_id || '',
      collected_by_name: expense.collected_by || '',
      collected_by_phone: expense.collected_by_contact || '',
      collected_by_email: '',
      collected_by_gst_number: expense.collected_by_gst_number || '',
      paid_by_name: expense.paid_by || '',
      paid_by_phone: expense.paid_by_contact || '',
      paid_by_email: '',
      paid_by_gst_number: expense.paid_by_gst_number || '',
      transaction_id: (expense.transaction_id || ''),
      gst_percentage: (expense.gst_percentage || 0).toString(),
      gst_amount: (expense.gst_amount || 0).toString(),
      attachments: [], // Files cannot be pre-populated in edit mode
      charges: (expense.charges || []).map(c => ({
        charge_name: c.charge_name,
        quantity: Number(c.quantity),
        rate: Number(c.rate),
        tax_percentage: Number(c.tax_percentage || 0),
        tax_amount: c.tax_amount !== undefined ? Number(c.tax_amount) : undefined,
        total: Number(c.total)
      })),
      notes: expense.notes || '',
      description: expense.description || ''
    };
    
    setFormData(initialFormData);
    setOriginalFormData(initialFormData);
    setHasFormChanges(false);
    setEditingExpense(expense);
    setIsModalOpen(true);
  };
  
  // Validation functions
  const validateStep1 = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.invoice_name.trim()) {
      errors.invoice_name = 'Invoice name is required';
    }
    if (!formData.category) {
      errors.category = 'Category is required';
    }
    if (!formData.subcategory) {
      errors.subcategory = 'Subcategory is required';
    }
    
    return errors;
  };
  
  const validateStep2 = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.gross_amount || parseFloat(formData.gross_amount) <= 0) {
      errors.gross_amount = 'Gross amount is required and must be greater than 0';
    }
    if (!formData.payment_method) {
      errors.payment_method = 'Payment method is required';
    }
    if (!formData.transaction_date) {
      errors.transaction_date = 'Transaction date is required';
    }

    // Conditional requirements based on payment method
    const pm = (formData.payment_method || '').toLowerCase().replace(/\s+/g, '_');
    if (pm === 'upi') {
      if (!formData.transaction_id || !formData.transaction_id.trim()) {
        errors.transaction_id = 'Transaction ID is required for UPI payments';
      }
    } else if (pm === 'bank_transfer') {
      if (!formData.bank_name || !formData.bank_name.trim()) {
        errors.bank_name = 'Bank name is required for Bank Transfer';
      }
      if (!formData.transaction_id || !formData.transaction_id.trim()) {
        errors.transaction_id = 'Transaction ID is required for Bank Transfer';
      }
    } else if (pm === 'cheque') {
      if (!formData.cheque_number || !formData.cheque_number.trim()) {
        errors.cheque_number = 'Cheque number is required for Cheque payments';
      }
      if (!formData.clearing_date || !formData.clearing_date.trim()) {
        errors.clearing_date = 'Clearing date is required for Cheque payments';
      }
    } else if (pm === 'card') {
      if (!formData.transaction_id || !formData.transaction_id.trim()) {
        errors.transaction_id = 'Transaction ID is required for Card payments';
      }
    }
    
    return errors;
  };
  
  const validateStep3 = () => {
    const errors: Record<string, string> = {};
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.collected_by_email && !emailRegex.test(formData.collected_by_email)) {
      errors.collected_by_email = 'Please enter a valid email address';
    }
    if (formData.paid_by_email && !emailRegex.test(formData.paid_by_email)) {
      errors.paid_by_email = 'Please enter a valid email address';
    }
    
    // Phone validation (10 digits)
    const phoneRegex = /^[0-9]{10}$/;
    if (formData.collected_by_phone && !phoneRegex.test(formData.collected_by_phone)) {
      errors.collected_by_phone = 'Please enter a valid 10-digit phone number';
    }
    if (formData.paid_by_phone && !phoneRegex.test(formData.paid_by_phone)) {
      errors.paid_by_phone = 'Please enter a valid 10-digit phone number';
    }
    
    return errors;
  };
  
  const validateStep4 = () => {
    const errors: Record<string, string> = {};
    
    // Add any step 4 specific validations here if needed
    // Currently step 4 fields are optional
    
    return errors;
  };
  
  const validateAllSteps = () => {
    const step1Errors = validateStep1();
    const step2Errors = validateStep2();
    const step3Errors = validateStep3();
    const step4Errors = validateStep4();
    
    return { ...step1Errors, ...step2Errors, ...step3Errors, ...step4Errors };
  };
  
  const navigateToStep = (targetStep: number) => {
    let errors: Record<string, string> = {};
    
    // Validate current step before navigation
    if (currentStep === 1) {
      errors = validateStep1();
    } else if (currentStep === 2) {
      errors = validateStep2();
    } else if (currentStep === 3) {
      errors = validateStep3();
    } else if (currentStep === 4) {
      errors = validateStep4();
    }
    
    setFormErrors(errors);
    
    // If there are errors, don't navigate
    if (Object.keys(errors).length > 0) {
      return false;
    }
    
    // Navigate to target step
    setCurrentStep(targetStep);
    return true;
  };
  
  const findFirstErrorStep = (errors: Record<string, string>) => {
    const step1Fields = ['invoice_name', 'category', 'subcategory'];
    const step2Fields = ['gross_amount', 'payment_method', 'transaction_date'];
    const step3Fields = ['collected_by_name', 'paid_by_name'];
    const step4Fields = ['notes', 'description'];
    
    const errorFields = Object.keys(errors);
    
    if (errorFields.some(field => step1Fields.includes(field))) {
      return 1;
    }
    if (errorFields.some(field => step2Fields.includes(field))) {
      return 2;
    }
    if (errorFields.some(field => step3Fields.includes(field))) {
      return 3;
    }
    if (errorFields.some(field => step4Fields.includes(field))) {
      return 4;
    }
    
    return 1; // Default to first step
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all steps
    const allErrors = validateAllSteps();
    setFormErrors(allErrors);
    
    // If there are errors, navigate to the first step with errors
    if (Object.keys(allErrors).length > 0) {
      const errorStep = findFirstErrorStep(allErrors);
      setCurrentStep(errorStep);
      return;
    }
    
    setModalLoading(true);
    
    try {
      // Prepare form data for multipart/form-data submission
      const formDataToSubmit = new FormData();
      
      // Add basic expense data
      const expenseData = {
        ...formData,
        societyId,
        created_by_name: user?.name || null,
        gross_amount: parseFloat(formData.gross_amount) || 0,
        fees: parseFloat(formData.fees) || 0,
        tax_percentage: parseFloat(formData.tax_percentage) || 0,
        tax_amount: parseFloat(formData.tax_amount) || 0,
        net_amount: parseFloat(formData.net_amount) || 0,
        gst_percentage: parseFloat(formData.gst_percentage) || 0,
        gst_amount: parseFloat(formData.gst_amount) || 0
      };
      
      // Add all non-file fields to FormData
      Object.entries(expenseData).forEach(([key, value]) => {
        if (key !== 'attachments' && key !== 'charges') {
          formDataToSubmit.append(key, value as string);
        }
      });
      
      // Add charges data as JSON string
      if (formData.charges && formData.charges.length > 0) {
        formDataToSubmit.append('charges', JSON.stringify(formData.charges));
      }
      
      // Add attachment files
      if (formData.attachments && formData.attachments.length > 0) {
        formData.attachments.forEach((file, index) => {
          formDataToSubmit.append('attachments', file);
        });
      }
      
      const url = editingExpense 
        ? `/expenses/${editingExpense.id}`
        : '/expenses';
      
      const method = editingExpense ? 'PUT' : 'POST';
      
      const result = await apiClient(url, {
        method,
        body: formDataToSubmit,
        withAuth: true
      });
      
      console.log('Expense saved successfully:', result);
      
      // Refresh expenses list
      await fetchExpenses();
      
      // Close modal and reset form
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setModalLoading(false);
    }
  };
  
  const addCharge = () => {
    const newCharge: Charge = {
      charge_name: '',
      quantity: 1,
      rate: 0,
      tax_percentage: 0,
      total: 0
    };
    setFormData(prev => ({
      ...prev,
      charges: [...prev.charges, newCharge]
    }));
  };
  
  const removeCharge = (index: number) => {
    setFormData(prev => ({
      ...prev,
      charges: prev.charges.filter((_, i) => i !== index)
    }));
  };
  
  const updateCharge = (index: number, field: keyof Charge, value: any) => {
    setFormData(prev => ({
      ...prev,
      charges: prev.charges.map((charge, i) => {
        if (i === index) {
          const updated = { ...charge, [field]: value };
          if (field === 'quantity' || field === 'rate' || field === 'tax_percentage') {
            const baseTotal = (Number(updated.quantity) || 0) * (Number(updated.rate) || 0);
            const taxPct = Number(updated.tax_percentage) || 0;
            updated.total = baseTotal + baseTotal * (taxPct / 100);
          }
          return updated;
        }
        return charge;
      })
    }));
  };

  const handleDelete = async (expenseId: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    try {
      await apiClient(`/expenses/${expenseId}`, {
        method: 'DELETE',
        withAuth: true
      });
      
      console.log('Expense deleted successfully');
      await fetchExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };
  
  // Calculate GST and Net Amount automatically
  useEffect(() => {
    const grossAmount = parseFloat(formData.gross_amount) || 0;
    const gstPercentage = parseFloat(formData.gst_percentage) || 0;
    const fees = parseFloat(formData.fees) || 0;
    
    // Calculate GST amount
    const gstAmount = (grossAmount * gstPercentage) / 100;
    
    // Calculate net amount (gross + fees + gst)
    const netAmount = grossAmount + fees + gstAmount;
    
    // Update form data with calculated values
    setFormData(prev => ({
      ...prev,
      gst_amount: gstAmount.toFixed(2),
      net_amount: netAmount.toFixed(2)
    }));
  }, [formData.gross_amount, formData.gst_percentage, formData.fees]);

  // Fetch expenses from API
  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await apiClient('/expenses', {
        method: 'GET',
        params: { societyId },
        withAuth: true
      });
      
      if (response.success) {
        // Handle nested data structure from backend
        const expensesData = response.data?.records ? response.data.records : 
                            Array.isArray(response.data) ? response.data : [];
        setExpenses(expensesData);
      } else {
        console.error('Failed to fetch expenses');
        setExpenses([]);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch wings, floors, and flats
  const fetchWings = async () => {
    try {
      const response = await apiClient('/billing/wings', {
        method: 'GET',
        params: { societyId },
        withAuth: true
      });
      
      if (response.success) {
        setWings((response.data || []).map((w: any) => ({ id: w.id ?? w.wing_id, name: w.name ?? w.wing_name })));
      }
    } catch (error) {
      console.error('Error fetching wings:', error);
    }
  };

  const fetchFloors = async (wingId: string) => {
    try {
      const response = await apiClient(`/billing/floors?wingId=${wingId}`, {
        method: 'GET',
        withAuth: true
      });
      
      if (response.success) {
        setFloors((response.data || []).map((f: any) => ({ id: f.id ?? f.floor_id, name: f.name ?? f.floor_number, wing_id: f.wing_id ?? wingId })));
      } else {
        setFloors([]);
      }
    } catch (error) {
      console.error('Error fetching floors:', error);
      setFloors([]);
    }
  };

  const fetchFlats = async (floorId: string) => {
    try {
      if (!formData.wing_id) {
        setFlats([]);
        return;
      }
      const response = await apiClient(`/billing/flats?wingId=${formData.wing_id}&floorId=${floorId}`, {
        method: 'GET',
        withAuth: true
      });
      
      if (response.success) {
        setFlats((response.data || []).map((fl: any) => ({ id: fl.id ?? fl.flat_id, name: fl.name ?? fl.flat_number, floor_id: fl.floor_id ?? floorId })));
      } else {
        setFlats([]);
      }
    } catch (error) {
      console.error('Error fetching flats:', error);
      setFlats([]);
    }
  };

  const fetchExportFloors = async (wingId: string) => {
    try {
      const response = await apiClient(`/billing/floors?wingId=${wingId}`, {
        method: 'GET',
        withAuth: true
      });
      
      if (response.success) {
        setExportFloors((response.data || []).map((f: any) => ({ id: f.id ?? f.floor_id, name: f.name ?? f.floor_number, wing_id: f.wing_id ?? wingId })));
      } else {
        setExportFloors([]);
      }
    } catch (error) {
      console.error('Error fetching export floors:', error);
      setExportFloors([]);
    }
  };

  const fetchExportFlats = async (floorId: string) => {
    try {
      const response = await apiClient(`/billing/flats?wingId=${exportWingId}&floorId=${floorId}`, {
        method: 'GET',
        withAuth: true
      });
      
      if (response.success) {
        setExportFlats((response.data || []).map((fl: any) => ({ id: fl.id ?? fl.flat_id, name: fl.name ?? fl.flat_number, floor_id: fl.floor_id ?? floorId })));
      } else {
        setExportFlats([]);
      }
    } catch (error) {
      console.error('Error fetching export flats:', error);
      setExportFlats([]);
    }
  };

  // Export functionality
  const resetExportModal = () => {
    setExportEmails(['']);
    setExportDateFrom(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
    setExportDateTo(new Date().toISOString().split('T')[0]);
    setExportCategories([]);
    setExportStatus('all');
    setExportWingId('');
    setExportFloorId('');
    setExportFlatIds([]);
    setExportFloors([]);
    setExportFlats([]);
  };

  const addExportEmail = () => {
    setExportEmails([...exportEmails, '']);
  };

  const removeExportEmail = (index: number) => {
    if (exportEmails.length > 1) {
      setExportEmails(exportEmails.filter((_, i) => i !== index));
    }
  };

  const updateExportEmail = (index: number, value: string) => {
    const newEmails = [...exportEmails];
    newEmails[index] = value;
    setExportEmails(newEmails);
  };

  const handleExport = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validEmails = exportEmails.map(e => e.trim()).filter(email => email !== '' && emailRegex.test(email));
    if (validEmails.length === 0) {
      toast.error('Please enter at least one valid email address');
      return;
    }

    if (!exportDateFrom || !exportDateTo) {
      toast.error('Please select date range');
      return;
    }

    const fromDate = new Date(exportDateFrom);
    const toDate = new Date(exportDateTo);
    if (fromDate > toDate) {
      toast.error('From date cannot be later than to date');
      return;
    }
    const daysDiff = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > 90) {
      toast.error('Date range cannot exceed 90 days');
      return;
    }

    try {
      setExportLoading(true);

      const response = await apiClient('/expenses/analytics/export', {
        method: 'POST',
        body: {
          emails: validEmails,
          dateFrom: exportDateFrom,
          dateTo: exportDateTo,
          categories: exportCategories,
          status: exportStatus,
          wingId: exportWingId,
          floorId: exportFloorId,
          flatIds: exportFlatIds,
          includeExcel: true
        },
        withAuth: true
      });

      if (response.success) {
        toast.success(`Export report sent successfully to ${validEmails.length} recipient(s)`);
        setShowExportModal(false);
        resetExportModal();
      } else {
        throw new Error(response.message || 'Export failed');
      }
    } catch (error) {
      console.error('Error exporting expenses:', error);
      toast.error('Error exporting expenses');
    } finally {
      setExportLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
    fetchWings();
  }, [societyId]);

  // Fetch floors when wing changes
  useEffect(() => {
    if (formData.wing_id) {
      fetchFloors(formData.wing_id);
    } else {
      setFloors([]);
      setFlats([]);
    }
  }, [formData.wing_id]);

  // Fetch flats when floor changes
  useEffect(() => {
    if (formData.floor_id) {
      fetchFlats(formData.floor_id);
    } else {
      setFlats([]);
    }
  }, [formData.floor_id]);
  
  // Fetch export floors when export wing changes
  useEffect(() => {
    if (exportWingId) {
      fetchExportFloors(exportWingId);
    } else {
      setExportFloors([]);
      setExportFlats([]);
      setExportFloorId('');
      setExportFlatIds([]);
    }
  }, [exportWingId]);

  // Fetch export flats when export floor changes
  useEffect(() => {
    if (exportFloorId) {
      fetchExportFlats(exportFloorId);
    } else {
      setExportFlats([]);
      setExportFlatIds([]);
    }
  }, [exportFloorId]);

  // Track form changes
  useEffect(() => {
    if (originalFormData) {
      const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalFormData);
      setHasFormChanges(hasChanges);
    }
  }, [formData, originalFormData]);
  
  // Filter and search logic
  const filteredExpenses = (Array.isArray(expenses) ? expenses : []).filter(expense => {
    const matchesSearch = expense.invoice_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || expense.category === filterCategory;
    const matchesType = !filterType || expense.type === filterType;
    return matchesSearch && matchesCategory && matchesType;
  });
  
  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedExpenses = filteredExpenses.slice(startIndex, startIndex + itemsPerPage);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex justify-between items-end">
        <div>
          <nav className="flex gap-2 text-[12px] font-bold text-[#565e74] mb-2 uppercase tracking-wide">
            <span>Management</span>
            <span>/</span>
            <span className="text-[#004ac6]">Expenses</span>
          </nav>
          <h2 className="text-[32px] font-bold leading-tight tracking-tight text-[#0b1c30]">Expense Registry</h2>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowExportModal(true)}
            className="bg-white border border-slate-200 text-[#565e74] px-5 py-2 rounded-lg flex items-center gap-2 transition-all font-bold text-[14px] hover:bg-slate-50 shadow-sm"
          >
            <Download className="w-4 h-4" /> Export Report
          </button>
          <button
            onClick={handleAddExpenseClick}
            className="bg-[#004ac6] text-white px-5 py-2 rounded-lg flex items-center gap-2 transition-all font-bold text-[14px] hover:bg-[#003da3] shadow-lg shadow-blue-200"
          >
            <Plus className="w-4 h-4" /> New Expense
          </button>
        </div>
      </div>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Expenses', value: expenses.length, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-500' },
          { label: 'Total Amount', value: formatCurrency(expenses.reduce((sum, e) => sum + (Number(e.net_amount) || 0), 0)), icon: DollarSign, color: 'text-green-600', bg: 'bg-green-500' },
          { label: 'Approved Amount', value: formatCurrency(expenses.filter(e => e.status === 'approved').reduce((sum, e) => sum + (Number(e.net_amount) || 0), 0)), icon: Check, color: 'text-emerald-600', bg: 'bg-emerald-500' },
          { label: 'Pending Approval', value: expenses.filter(e => e.status === 'pending').length, icon: Activity, color: 'text-orange-600', bg: 'bg-orange-500' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg", stat.bg)}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div className={clsx("text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider", stat.bg.replace('bg-', 'bg-').replace('500', '50'))}>
                <span className={stat.color}>Live</span>
              </div>
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{stat.label}</p>
              <h3 className="text-2xl font-bold text-[#0b1c30] tracking-tight">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>
      
      {/* Action Bar Section */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[300px]">
          <div className="relative flex-1 max-w-sm group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#004ac6] transition-colors" />
            <input
              type="text"
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-medium outline-none focus:bg-white focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-bold text-slate-600 outline-none hover:bg-white focus:ring-2 focus:ring-blue-600/10 transition-all cursor-pointer"
            >
              <option value="">All Categories</option>
              {availableCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-bold text-slate-600 outline-none hover:bg-white focus:ring-2 focus:ring-blue-600/10 transition-all cursor-pointer"
            >
              <option value="">All Types</option>
              <option value="society">Society</option>
              <option value="flat">Flat</option>
            </select>
            <button
              onClick={() => fetchExpenses()}
              className="p-2 text-slate-400 hover:text-[#004ac6] hover:bg-blue-50 rounded-xl transition-all"
            >
              <RefreshCw className={clsx("w-4 h-4", loading && "animate-spin")} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Tab Content */}
      {activeTab === 'expenses' && (
        <>
          {/* Expenses Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Invoice / Vendor</th>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Transaction</th>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedExpenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-[13px] font-bold text-[#0b1c30]">{expense.invoice_name}</div>
                      <div className="text-[11px] text-slate-400 font-medium">ID: {expense.invoice_id}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-[13px] font-bold text-slate-600">{expense.category}</div>
                      <div className="text-[11px] text-slate-400 font-medium">{expense.subcategory}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={clsx(
                      'inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider',
                      expense.type === 'society' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                    )}>
                      {expense.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={clsx(
                      'text-[14px] font-bold',
                      expense.credit_debit === 'credit' ? 'text-green-600' : 'text-red-600'
                    )}>
                      {expense.credit_debit === 'credit' ? '+' : '-'}{formatCurrency(expense.net_amount)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-[13px] font-bold text-slate-600">{expense.payment_method}</div>
                    <div className="text-[11px] text-slate-400 font-medium">{formatDate(expense.transaction_date)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={clsx(
                      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold text-[11px] uppercase',
                      expense.status === 'approved' ? 'bg-green-50 text-green-700' : expense.status === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'
                    )}>
                      <span className={clsx("w-1 h-1 rounded-full", expense.status === 'approved' ? 'bg-green-500' : expense.status === 'rejected' ? 'bg-red-500' : 'bg-yellow-500')}></span>
                      {expense.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-3 items-center">
                      <button
                        onClick={() => { setViewingExpense(expense); setViewModalOpen(true); }}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(expense)}
                        className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(expense.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">
            Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredExpenses.length)} of {filteredExpenses.length} Expenses
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 disabled:opacity-30 hover:bg-slate-50 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center px-4 bg-white border border-slate-200 rounded-lg text-[13px] font-bold text-slate-600">
              Page {currentPage} of {totalPages}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 disabled:opacity-30 hover:bg-slate-50 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
        </>
      )}
      
      {/* Add/Edit Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm overflow-y-auto h-full w-full z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative bg-white rounded-[24px] shadow-2xl w-full max-w-4xl overflow-hidden"
          >
            {/* Modal Header */}
            <div className="bg-slate-50/50 px-8 py-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-[20px] font-bold text-[#0b1c30]">
                  {editingExpense ? 'Modify Expense Record' : 'Create New Expense'}
                </h3>
                <div className="flex items-center gap-2 mt-2">
                  {[1, 2, 3, 4].map((step) => (
                    <div key={step} className="flex items-center gap-2">
                      <div className={clsx(
                        "w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold transition-all",
                        currentStep === step ? "bg-[#004ac6] text-white shadow-lg shadow-blue-200" : currentStep > step ? "bg-green-500 text-white" : "bg-slate-200 text-slate-500"
                      )}>
                        {currentStep > step ? "✓" : step}
                      </div>
                      {step < 4 && <div className={clsx("w-8 h-[2px] rounded-full", currentStep > step ? "bg-green-500" : "bg-slate-200")} />}
                    </div>
                  ))}
                  <span className="ml-2 text-[12px] font-bold text-slate-400 uppercase tracking-wider">
                    Step {currentStep}: {
                      currentStep === 1 ? 'Basis' :
                      currentStep === 2 ? 'Financials' :
                      currentStep === 3 ? 'Details' : 'Verification'
                    }
                  </span>
                </div>
              </div>
              <button
                onClick={handleModalClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
              
              {/* Modal Body */}
              <form onSubmit={handleSubmit} className="mt-6">
                {/* Step 1: Basic Information */}
                {currentStep === 1 && (
                  <div className="p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                      {/* Invoice Name */}
                      <div className="space-y-2">
                        <label className="text-[13px] font-bold text-[#565e74] uppercase tracking-wide">
                          Invoice Reference * 
                        </label>
                        <input
                          type="text"
                          value={formData.invoice_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, invoice_name: e.target.value }))}
                          className={clsx(
                            'w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-[14px] font-medium transition-all outline-none focus:bg-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600',
                            formErrors.invoice_name ? 'border-red-500 bg-red-50/30' : 'border-slate-100'
                          )}
                          placeholder="e.g., Monthly Security Services"
                        />
                        {formErrors.invoice_name && <p className="text-[11px] font-bold text-red-600 uppercase tracking-tight">{formErrors.invoice_name}</p>}
                      </div>

                      {/* Invoice ID */}
                      <div className="space-y-2">
                        <label className="text-[13px] font-bold text-[#565e74] uppercase tracking-wide">Invoice ID</label>
                        <input
                          type="text"
                          value={formData.invoice_id}
                          onChange={(e) => setFormData(prev => ({ ...prev, invoice_id: e.target.value }))}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[14px] font-medium transition-all outline-none focus:bg-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600"
                          placeholder="INV-2024-001"
                        />
                      </div>

                      {/* Type & Credit/Debit */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[13px] font-bold text-[#565e74] uppercase tracking-wide">Type *</label>
                          <select
                            value={formData.type}
                            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'society' | 'flat' }))}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[14px] font-bold text-slate-700 transition-all outline-none focus:bg-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600"
                          >
                            <option value="society">Society</option>
                            <option value="flat">Flat</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[13px] font-bold text-[#565e74] uppercase tracking-wide">Direction *</label>
                          <select
                            value={formData.credit_debit}
                            onChange={(e) => setFormData(prev => ({ ...prev, credit_debit: e.target.value as 'credit' | 'debit' }))}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[14px] font-bold text-slate-700 transition-all outline-none focus:bg-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600"
                          >
                            <option value="debit">Debit (-)</option>
                            <option value="credit">Credit (+)</option>
                          </select>
                        </div>
                      </div>

                      {/* Category & Subcategory */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[13px] font-bold text-[#565e74] uppercase tracking-wide">Category *</label>
                          <select
                            value={formData.category}
                            onChange={(e) => {
                              const category = e.target.value;
                              setFormData(prev => ({ ...prev, category, subcategory: '' }));
                            }}
                            className={clsx(
                              'w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-[14px] font-bold text-slate-700 transition-all outline-none focus:bg-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600',
                              formErrors.category ? 'border-red-500' : 'border-slate-100'
                            )}
                          >
                            <option value="">Select Category</option>
                            {Object.keys(subcategoryMapping).map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[13px] font-bold text-[#565e74] uppercase tracking-wide">Subcategory *</label>
                          <select
                            value={formData.subcategory}
                            onChange={(e) => setFormData(prev => ({ ...prev, subcategory: e.target.value }))}
                            className={clsx(
                              'w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-[14px] font-bold text-slate-700 transition-all outline-none focus:bg-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600',
                              formErrors.subcategory ? 'border-red-500' : 'border-slate-100'
                            )}
                            disabled={!formData.category}
                          >
                            <option value="">Select Subcategory</option>
                            {formData.category && subcategoryMapping[formData.category]?.map(subcat => (
                              <option key={subcat} value={subcat}>{subcat}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Step 1 Navigation */}
                    <div className="flex justify-end pt-8 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => navigateToStep(2)}
                        className="px-8 py-3 bg-[#004ac6] text-white rounded-xl font-bold text-[14px] hover:bg-[#003da3] shadow-lg shadow-blue-200 transition-all flex items-center gap-2"
                      >
                        Next: Financial Details <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: Financial Details */}
                {currentStep === 2 && (
                  <div className="p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                      {/* Gross Amount */}
                      <div className="space-y-2">
                        <label className="text-[13px] font-bold text-[#565e74] uppercase tracking-wide">Gross Amount *</label>
                        <div className="relative group">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[14px]">₹</span>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.gross_amount}
                            onChange={(e) => setFormData(prev => ({ ...prev, gross_amount: e.target.value }))}
                            className={clsx(
                              'w-full pl-8 pr-4 py-2.5 bg-slate-50 border rounded-xl text-[14px] font-bold transition-all outline-none focus:bg-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600',
                              formErrors.gross_amount ? 'border-red-500 bg-red-50/30' : 'border-slate-100'
                            )}
                            placeholder="0.00"
                          />
                        </div>
                        {formErrors.gross_amount && <p className="text-[11px] font-bold text-red-600 uppercase tracking-tight">{formErrors.gross_amount}</p>}
                      </div>

                      {/* Fees */}
                      <div className="space-y-2">
                        <label className="text-[13px] font-bold text-[#565e74] uppercase tracking-wide">Additional Fees</label>
                        <div className="relative group">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[14px]">₹</span>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.fees || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, fees: e.target.value }))}
                            className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[14px] font-bold transition-all outline-none focus:bg-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600"
                            placeholder="0.00"
                          />
                        </div>
                      </div>

                      {/* GST Percentage & Amount */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[13px] font-bold text-[#565e74] uppercase tracking-wide">GST (%)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.gst_percentage}
                            onChange={(e) => setFormData(prev => ({ ...prev, gst_percentage: e.target.value }))}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[14px] font-bold transition-all outline-none focus:bg-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600"
                            placeholder="18.00"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[13px] font-bold text-[#565e74] uppercase tracking-wide">GST Amount (₹)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.gst_amount}
                            onChange={(e) => setFormData(prev => ({ ...prev, gst_amount: e.target.value }))}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[14px] font-bold transition-all outline-none focus:bg-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600"
                            placeholder="0.00"
                          />
                        </div>
                      </div>

                      {/* Net Amount */}
                      <div className="space-y-2">
                        <label className="text-[13px] font-bold text-[#565e74] uppercase tracking-wide text-blue-600">Total Net Amount *</label>
                        <div className="relative group">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600 font-bold text-[14px]">₹</span>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.net_amount}
                            onChange={(e) => setFormData(prev => ({ ...prev, net_amount: e.target.value }))}
                            className="w-full pl-8 pr-4 py-2.5 bg-blue-50/30 border border-blue-100 rounded-xl text-[16px] font-extrabold text-[#004ac6] transition-all outline-none focus:bg-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600"
                            placeholder="0.00"
                          />
                        </div>
                      </div>

                      {/* Payment Method */}
                      <div className="space-y-2">
                        <label className="text-[13px] font-bold text-[#565e74] uppercase tracking-wide">Payment Method *</label>
                        <select
                          value={formData.payment_method}
                          onChange={(e) => setFormData(prev => ({ ...prev, payment_method: e.target.value }))}
                          className={clsx(
                            'w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-[14px] font-bold text-slate-700 transition-all outline-none focus:bg-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600',
                            formErrors.payment_method ? 'border-red-500' : 'border-slate-100'
                          )}
                        >
                          <option value="">Select Method</option>
                          {availablePaymentMethods.map(method => (
                            <option key={method} value={method}>{method}</option>
                          ))}
                        </select>
                        {formErrors.payment_method && <p className="text-[11px] font-bold text-red-600 uppercase tracking-tight">{formErrors.payment_method}</p>}
                      </div>

                      {/* Payment Method Specific Details */}
                      {formData.payment_method && (
                        <div className="space-y-4">
                      {(() => {
                        const pm = (formData.payment_method || '').toLowerCase().replace(/\s+/g, '_');
                        if (pm === 'upi' || pm === 'card') {
                          return (
                            <div className="space-y-2">
                              <label className="text-[13px] font-bold text-[#565e74] uppercase tracking-wide">Transaction ID *</label>
                              <input
                                type="text"
                                value={formData.transaction_id}
                                onChange={(e) => setFormData(prev => ({ ...prev, transaction_id: e.target.value }))}
                                className={clsx(
                                  'w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-[14px] font-medium transition-all outline-none focus:bg-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600',
                                  formErrors.transaction_id ? 'border-red-500' : 'border-slate-100'
                                )}
                                placeholder="Enter reference number"
                              />
                            </div>
                          );
                        }
                        if (pm === 'bank_transfer') {
                          return (
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-[13px] font-bold text-[#565e74] uppercase tracking-wide">Bank Name *</label>
                                <input
                                  type="text"
                                  value={formData.bank_name}
                                  onChange={(e) => setFormData(prev => ({ ...prev, bank_name: e.target.value }))}
                                  className={clsx('w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-[14px] font-medium outline-none focus:bg-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600', formErrors.bank_name ? 'border-red-500' : 'border-slate-100')}
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[13px] font-bold text-[#565e74] uppercase tracking-wide">Ref ID *</label>
                                <input
                                  type="text"
                                  value={formData.transaction_id}
                                  onChange={(e) => setFormData(prev => ({ ...prev, transaction_id: e.target.value }))}
                                  className={clsx('w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-[14px] font-medium outline-none focus:bg-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600', formErrors.transaction_id ? 'border-red-500' : 'border-slate-100')}
                                />
                              </div>
                            </div>
                          );
                        }
                        if (pm === 'cheque') {
                          return (
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-[13px] font-bold text-[#565e74] uppercase tracking-wide">Cheque # *</label>
                                <input
                                  type="text"
                                  value={formData.cheque_number}
                                  onChange={(e) => setFormData(prev => ({ ...prev, cheque_number: e.target.value }))}
                                  className={clsx('w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-[14px] font-medium outline-none focus:bg-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600', formErrors.cheque_number ? 'border-red-500' : 'border-slate-100')}
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[13px] font-bold text-[#565e74] uppercase tracking-wide">Clear Date *</label>
                                <input
                                  type="date"
                                  value={formData.clearing_date}
                                  onChange={(e) => setFormData(prev => ({ ...prev, clearing_date: e.target.value }))}
                                  className={clsx('w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-[14px] font-medium outline-none focus:bg-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600', formErrors.clearing_date ? 'border-red-500' : 'border-slate-100')}
                                />
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                        </div>
                      )}

                      {/* Transaction Date */}
                      <div className="space-y-2">
                        <label className="text-[13px] font-bold text-[#565e74] uppercase tracking-wide">Record Date *</label>
                        <input
                          type="date"
                          value={formData.transaction_date}
                          onChange={(e) => setFormData(prev => ({ ...prev, transaction_date: e.target.value }))}
                          className={clsx(
                            'w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-[14px] font-bold transition-all outline-none focus:bg-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600',
                            formErrors.transaction_date ? 'border-red-500' : 'border-slate-100'
                          )}
                        />
                      </div>
                    </div>

                    {/* Charges Section */}
                    <div className="border-t border-slate-100 pt-8 mt-8">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h4 className="text-[16px] font-bold text-[#0b1c30]">Line Items</h4>
                          <p className="text-[12px] font-medium text-slate-400">Add detailed breakdown of charges (Optional)</p>
                        </div>
                        <button
                          type="button"
                          onClick={addCharge}
                          className="px-4 py-2 bg-slate-100 text-[#565e74] rounded-lg font-bold text-[13px] hover:bg-slate-200 transition-all flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" /> Add Item
                        </button>
                      </div>
                      
                      {formData.charges.map((charge, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 bg-slate-50/50 border border-slate-100 rounded-xl mb-4 group relative">
                          <div className="md:col-span-2 space-y-1">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">Description</label>
                            <input
                              type="text"
                              value={charge.charge_name}
                              onChange={(e) => updateCharge(index, 'charge_name', e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[13px] font-medium outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all"
                              placeholder="e.g. Service Fee"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">Qty</label>
                            <input
                              type="number"
                              value={charge.quantity}
                              onChange={(e) => updateCharge(index, 'quantity', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[13px] font-medium outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">Rate</label>
                            <input
                              type="number"
                              step="0.01"
                              value={charge.rate}
                              onChange={(e) => updateCharge(index, 'rate', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[13px] font-medium outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">Total (₹)</label>
                            <div className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-[13px] font-bold text-slate-600">
                              {formatCurrency(charge.total)}
                            </div>
                          </div>
                          <div className="flex items-end pb-0.5">
                            <button
                              type="button"
                              onClick={() => removeCharge(index)}
                              className="w-full p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all flex items-center justify-center border border-red-100"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                      
                      {formData.charges.length > 0 && (
                        <div className="flex justify-end pt-4">
                          <div className="bg-[#0b1c30] px-6 py-2 rounded-xl text-white shadow-xl">
                            <span className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mr-3">Aggregated Charges</span>
                            <span className="text-[18px] font-bold font-mono">{formatCurrency(formData.charges.reduce((sum, charge) => sum + charge.total, 0))}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Step 2 Navigation */}
                    <div className="flex justify-between pt-10 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        className="px-8 py-3 bg-white border border-slate-200 text-slate-500 rounded-xl font-bold text-[14px] hover:bg-slate-50 transition-all flex items-center gap-2"
                      >
                        <ArrowLeft className="w-4 h-4" /> Previous
                      </button>
                      <button
                        type="button"
                        onClick={() => navigateToStep(3)}
                        className="px-8 py-3 bg-[#004ac6] text-white rounded-xl font-bold text-[14px] hover:bg-[#003da3] shadow-lg shadow-blue-200 transition-all flex items-center gap-2"
                      >
                        Next: Attachments <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Additional Information */}
                {currentStep === 3 && (
                  <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto">
                    {/* Collected By */}
                    <div className="space-y-6">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <div>
                          <h4 className="text-[16px] font-bold text-[#0b1c30]">Vendor / Recipient Details</h4>
                          <p className="text-[12px] font-medium text-slate-400">Information about who received the payment</p>
                        </div>
                        <button
                          type="button"
                          onClick={autoFillSocietyDetails}
                          className="px-4 py-2 bg-blue-50 text-[#004ac6] rounded-lg font-bold text-[12px] hover:bg-blue-100 transition-all flex items-center gap-2"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Auto-fill Society
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        <div className="space-y-2">
                          <label className="text-[13px] font-bold text-[#565e74] uppercase tracking-wide">Recipient Name</label>
                          <input
                            type="text"
                            value={formData.collected_by_name}
                            onChange={(e) => setFormData(prev => ({ ...prev, collected_by_name: e.target.value }))}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[14px] font-medium outline-none focus:bg-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all"
                            placeholder="Full name or company name"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[13px] font-bold text-[#565e74] uppercase tracking-wide">GST Number</label>
                          <input
                            type="text"
                            value={formData.collected_by_gst_number}
                            onChange={(e) => setFormData(prev => ({ ...prev, collected_by_gst_number: e.target.value }))}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[14px] font-medium outline-none focus:bg-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all"
                            placeholder="GSTIN (Optional)"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Paid By */}
                    <div className="space-y-6 pt-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <div>
                          <h4 className="text-[16px] font-bold text-[#0b1c30]">Payer Details</h4>
                          <p className="text-[12px] font-medium text-slate-400">Information about who made the payment</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        <div className="space-y-2">
                          <label className="text-[13px] font-bold text-[#565e74] uppercase tracking-wide">Payer Name</label>
                          <input
                            type="text"
                            value={formData.paid_by_name}
                            onChange={(e) => setFormData(prev => ({ ...prev, paid_by_name: e.target.value }))}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[14px] font-medium outline-none focus:bg-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all"
                            placeholder="Society admin or person name"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[13px] font-bold text-[#565e74] uppercase tracking-wide">Receipt #</label>
                          <input
                            type="text"
                            value={formData.receipt_no}
                            onChange={(e) => setFormData(prev => ({ ...prev, receipt_no: e.target.value }))}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[14px] font-medium outline-none focus:bg-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all"
                            placeholder="REC-001"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Notes & Attachments */}
                    <div className="space-y-6 pt-4">
                      <div className="border-b border-slate-100 pb-4">
                        <h4 className="text-[16px] font-bold text-[#0b1c30]">Verification Documents</h4>
                        <p className="text-[12px] font-medium text-slate-400">Upload invoices, receipts, or notes</p>
                      </div>
                      <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-2">
                          <label className="text-[13px] font-bold text-[#565e74] uppercase tracking-wide">Internal Notes</label>
                          <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[14px] font-medium outline-none focus:bg-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all min-h-[100px]"
                            placeholder="Add any internal comments or explanations..."
                          />
                        </div>

                      {/* Description */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description (Optional)
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter description"
                        />
                      </div>

                      {/* Notes */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Notes (Optional)
                        </label>
                        <textarea
                          value={formData.notes}
                          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter any additional notes"
                        />
                      </div>

                        <div className="space-y-2">
                          <label className="text-[13px] font-bold text-[#565e74] uppercase tracking-wide">Documentation (Max 10MB)</label>
                          <div 
                            className="border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-2xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all group"
                            onClick={() => {
                              const fileInput = document.querySelector('input[type="file"][multiple]') as HTMLInputElement;
                              fileInput?.click();
                            }}
                          >
                            <div className="flex flex-col items-center gap-3">
                              <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                                <Upload className="w-6 h-6 text-blue-600" />
                              </div>
                              <div>
                                <p className="text-[14px] font-bold text-[#0b1c30]">Drop files here or click to upload</p>
                                <p className="text-[12px] font-medium text-slate-400">PDF, JPG, PNG are supported</p>
                              </div>
                            </div>
                            <input
                              type="file"
                              multiple
                              className="hidden"
                              onChange={(e) => {
                                const files = Array.from(e.target.files || []);
                                const validFiles = files.filter(file => {
                                  const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
                                  const maxSize = 10 * 1024 * 1024;
                                  return validTypes.includes(file.type) && file.size <= maxSize;
                                });
                                setFormData(prev => ({ 
                                  ...prev, 
                                  attachments: [...(prev.attachments || []), ...validFiles] 
                                }));
                              }}
                            />
                          </div>

                          {/* File Preview */}
                          {formData.attachments && formData.attachments.length > 0 && (
                            <div className="grid grid-cols-2 gap-4 mt-4">
                              {formData.attachments.map((file, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                                    <span className="text-[12px] font-bold text-slate-600 truncate">{file instanceof File ? file.name : (file as any).name}</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setFormData(prev => ({
                                        ...prev,
                                        attachments: prev.attachments?.filter((_, i) => i !== idx)
                                      }));
                                    }}
                                    className="p-1 hover:bg-red-50 text-red-400 rounded-lg transition-all"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Step 3 Navigation */}
                    <div className="flex justify-between pt-10 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        className="px-8 py-3 bg-white border border-slate-200 text-slate-500 rounded-xl font-bold text-[14px] hover:bg-slate-50 transition-all flex items-center gap-2"
                      >
                        <ArrowLeft className="w-4 h-4" /> Previous
                      </button>
                      <button
                        type="button"
                        onClick={() => navigateToStep(4)}
                        className="px-8 py-3 bg-[#004ac6] text-white rounded-xl font-bold text-[14px] hover:bg-[#003da3] shadow-lg shadow-blue-200 transition-all flex items-center gap-2"
                      >
                        Next: Final Review <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
                {/* Step 4: Final Review */}
                {currentStep === 4 && (
                  <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Basic & Financial Summary */}
                      <div className="space-y-6">
                        <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100">
                          <h5 className="text-[14px] font-bold text-[#0b1c30] uppercase tracking-wider mb-4 pb-2 border-b border-slate-200/50">Core Information</h5>
                          <div className="space-y-4">
                            <div className="flex justify-between">
                              <span className="text-[12px] font-bold text-slate-400 uppercase">Description</span>
                              <span className="text-[13px] font-bold text-[#0b1c30]">{formData.invoice_name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[12px] font-bold text-slate-400 uppercase">Category</span>
                              <span className="text-[13px] font-bold text-[#0b1c30]">{formData.category}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[12px] font-bold text-slate-400 uppercase">Method</span>
                              <span className="text-[13px] font-bold text-[#0b1c30]">{formData.payment_method}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[12px] font-bold text-slate-400 uppercase">Date</span>
                              <span className="text-[13px] font-bold text-[#0b1c30]">{formData.transaction_date}</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-xl shadow-blue-100">
                          <h5 className="text-[14px] font-bold uppercase tracking-wider mb-4 pb-2 border-b border-blue-400/30">Financial Summary</h5>
                          <div className="space-y-4">
                            <div className="flex justify-between">
                              <span className="text-[12px] font-bold text-blue-200 uppercase">Gross Amount</span>
                              <span className="text-[15px] font-bold font-mono">{formatCurrency(parseFloat(formData.gross_amount || '0'))}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[12px] font-bold text-blue-200 uppercase">Taxes (GST)</span>
                              <span className="text-[15px] font-bold font-mono">{formatCurrency(parseFloat(formData.gst_amount || '0'))}</span>
                            </div>
                            <div className="pt-2 mt-2 border-t border-blue-400/30 flex justify-between items-center">
                              <span className="text-[13px] font-bold uppercase">Net Payable</span>
                              <span className="text-[20px] font-bold font-mono">{formatCurrency(parseFloat(formData.net_amount || '0'))}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Recipient & Additional Summary */}
                      <div className="space-y-6">
                        <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100">
                          <h5 className="text-[14px] font-bold text-[#0b1c30] uppercase tracking-wider mb-4 pb-2 border-b border-slate-200/50">Recipient Details</h5>
                          <div className="space-y-4">
                            <div className="flex justify-between">
                              <span className="text-[12px] font-bold text-slate-400 uppercase">Name</span>
                              <span className="text-[13px] font-bold text-[#0b1c30]">{formData.collected_by_name || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[12px] font-bold text-slate-400 uppercase">Receipt #</span>
                              <span className="text-[13px] font-bold text-[#0b1c30]">{formData.receipt_no || 'N/A'}</span>
                            </div>
                          </div>
                        </div>

                        {formData.charges.length > 0 && (
                          <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100">
                            <h5 className="text-[14px] font-bold text-[#0b1c30] uppercase tracking-wider mb-4 pb-2 border-b border-slate-200/50">Itemized Breakdown</h5>
                            <div className="space-y-3">
                              {formData.charges.map((charge, idx) => (
                                <div key={idx} className="flex justify-between text-[12px]">
                                  <span className="font-medium text-slate-500">{charge.charge_name} (x{charge.quantity})</span>
                                  <span className="font-bold text-[#0b1c30]">{formatCurrency(charge.total)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Step 4 Navigation */}
                    <div className="flex justify-between pt-10 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(3)}
                        className="px-8 py-3 bg-white border border-slate-200 text-slate-500 rounded-xl font-bold text-[14px] hover:bg-slate-50 transition-all flex items-center gap-2"
                      >
                        <ArrowLeft className="w-4 h-4" /> Previous
                      </button>
                      <button
                        type="submit"
                        className="px-10 py-3 bg-[#00c853] text-white rounded-xl font-bold text-[15px] hover:bg-[#00a844] shadow-lg shadow-green-100 transition-all flex items-center gap-2"
                        disabled={modalLoading}
                      >
                        {modalLoading ? (
                          <RefreshCw className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            <Check className="w-5 h-5" /> 
                            {editingExpense ? 'Update Expense Record' : 'Confirm & Save Expense'}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </motion.div>
          </div>
        )}

      {/* View Expense Modal */}
      {viewModalOpen && viewingExpense && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  Expense Details
                </h3>
                <button
                  onClick={() => setViewModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Invoice Name</label>
                    <p className="mt-1 text-sm text-gray-900">{viewingExpense.invoice_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Invoice ID</label>
                    <p className="mt-1 text-sm text-gray-900">{viewingExpense.invoice_id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Category</label>
                    <p className="mt-1 text-sm text-gray-900">{viewingExpense.category}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Subcategory</label>
                    <p className="mt-1 text-sm text-gray-900">{viewingExpense.subcategory}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Type</label>
                    <p className="mt-1 text-sm text-gray-900">{viewingExpense.type}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Status</label>
                    <span className={clsx(
                      'inline-flex px-2 py-1 text-xs font-semibold rounded-full',
                      getStatusColor(viewingExpense.status)
                    )}>
                      {viewingExpense.status}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Transaction Date</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(viewingExpense.transaction_date)}</p>
                  </div>
                  {viewingExpense.clearing_date && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Clearing Date</label>
                      <p className="mt-1 text-sm text-gray-900">{formatDate(viewingExpense.clearing_date)}</p>
                    </div>
                  )}
                  {viewingExpense.created_by_name && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Created By</label>
                      <p className="mt-1 text-sm text-gray-900">{viewingExpense.created_by_name}</p>
                    </div>
                  )}
                  {(viewingExpense.wing_names && viewingExpense.wing_names.length > 0) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Wing Names</label>
                      <p className="mt-1 text-sm text-gray-900">{viewingExpense.wing_names.join(', ')}</p>
                    </div>
                  )}
                  {(viewingExpense.flat_names && viewingExpense.flat_names.length > 0) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Flat Names</label>
                      <p className="mt-1 text-sm text-gray-900">{viewingExpense.flat_names.join(', ')}</p>
                    </div>
                  )}
                </div>

                {/* Financial Details Section */}
                <div className="mt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Financial Details</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {viewingExpense.gross_amount && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Gross Amount</label>
                          <p className="mt-1 text-sm text-gray-900">{formatCurrency(viewingExpense.gross_amount)}</p>
                        </div>
                      )}
                      {viewingExpense.gst_percentage && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500">GST Percentage</label>
                          <p className="mt-1 text-sm text-gray-900">{viewingExpense.gst_percentage}%</p>
                        </div>
                      )}
                      {viewingExpense.gst_amount && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500">GST Amount</label>
                          <p className="mt-1 text-sm text-gray-900">{formatCurrency(viewingExpense.gst_amount)}</p>
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Fees</label>
                        <p className="mt-1 text-sm text-gray-900">{formatCurrency(viewingExpense.fees)}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Net Amount</label>
                        <p className="mt-1 text-sm text-gray-900">{formatCurrency(viewingExpense.net_amount)}</p>
                      </div>
                      {viewingExpense.total_amount && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Total Amount</label>
                          <p className={clsx(
                            'mt-1 text-sm font-medium',
                            viewingExpense.credit_debit === 'credit' ? 'text-green-600' : 'text-red-600'
                          )}>
                            {viewingExpense.credit_debit === 'credit' ? '+' : '-'}{formatCurrency(viewingExpense.total_amount)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Payment Details Section */}
                <div className="mt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Payment Details</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Payment Method</label>
                        <p className="mt-1 text-sm text-gray-900">{viewingExpense.payment_method}</p>
                      </div>
                      {viewingExpense.payment_details_specific && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Payment Details</label>
                          <p className="mt-1 text-sm text-gray-900">{viewingExpense.payment_details_specific}</p>
                        </div>
                      )}
                      {(viewingExpense.receipt_no || viewingExpense.receipt_number) && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Receipt Number</label>
                          <p className="mt-1 text-sm text-gray-900">{viewingExpense.receipt_no || viewingExpense.receipt_number}</p>
                        </div>
                      )}
                      {viewingExpense.transaction_id && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Transaction ID</label>
                          <p className="mt-1 text-sm text-gray-900">{viewingExpense.transaction_id}</p>
                        </div>
                      )}
                      {viewingExpense.cheque_number && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Cheque Number</label>
                          <p className="mt-1 text-sm text-gray-900">{viewingExpense.cheque_number}</p>
                        </div>
                      )}
                      {viewingExpense.bank_name && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Bank Name</label>
                          <p className="mt-1 text-sm text-gray-900">{viewingExpense.bank_name}</p>
                        </div>
                      )}
                      {viewingExpense.paid_by && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Paid By</label>
                          <p className="mt-1 text-sm text-gray-900">{viewingExpense.paid_by}</p>
                        </div>
                      )}
                      {viewingExpense.paid_by_contact && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Paid By Contact</label>
                          <p className="mt-1 text-sm text-gray-900">{viewingExpense.paid_by_contact}</p>
                        </div>
                      )}
                      {viewingExpense.paid_by_gst_number && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Paid By GST Number</label>
                          <p className="mt-1 text-sm text-gray-900">{viewingExpense.paid_by_gst_number}</p>
                        </div>
                      )}
                      {viewingExpense.collected_by && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Collected By</label>
                          <p className="mt-1 text-sm text-gray-900">{viewingExpense.collected_by}</p>
                        </div>
                      )}
                      {viewingExpense.collected_by_contact && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Collected By Contact</label>
                          <p className="mt-1 text-sm text-gray-900">{viewingExpense.collected_by_contact}</p>
                        </div>
                      )}
                      {viewingExpense.collected_by_gst_number && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Collected By GST Number</label>
                          <p className="mt-1 text-sm text-gray-900">{viewingExpense.collected_by_gst_number}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Charges Section */}
                {viewingExpense.charges && viewingExpense.charges.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-md font-medium text-gray-900 mb-3">Charges Breakdown</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="space-y-3">
                        {viewingExpense.charges.map((charge, index) => (
                          <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{charge.charge_name}</p>
                              <p className="text-xs text-gray-500">Qty: {charge.quantity} × Rate: {formatCurrency(charge.rate)}</p>
                            </div>
                            <div className="text-sm font-medium text-gray-900">
                              {formatCurrency(charge.total)}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-300">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-900">Total Charges:</span>
                          <span className="text-sm font-bold text-gray-900">
                            {formatCurrency(
                              viewingExpense.charges.reduce((sum, charge) => {
                                const total = Number(charge.total) || 0;
                                return sum + total;
                              }, 0)
                            )}                          
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Attachments Section */}
                {viewingExpense.attachments && viewingExpense.attachments.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-md font-medium text-gray-900 mb-3">Attachments</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {viewingExpense.attachments.map((attachment, index) => (
                          <div key={index} className="flex items-center p-3 bg-white rounded-lg border border-gray-200">
                            <FileText className="w-5 h-5 text-blue-500 mr-3" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {attachment.filename}
                              </p>
                              <p className="text-xs text-gray-500">
                                {attachment.size ? `${Math.round(attachment.size / 1024)} KB` : 'Unknown size'}
                              </p>
                            </div>
                            <a
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 text-blue-600 hover:text-blue-800"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes and Description */}
                {(viewingExpense.notes || viewingExpense.description) && (
                  <div className="mt-6">
                    <h4 className="text-md font-medium text-gray-900 mb-3">Additional Information</h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      {viewingExpense.description && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">Description</label>
                          <p className="text-sm text-gray-900">{viewingExpense.description}</p>
                        </div>
                      )}
                      {viewingExpense.notes && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">Notes</label>
                          <p className="text-sm text-gray-900">{viewingExpense.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-4 pt-6 border-t">
                <button
                  onClick={handleDownloadInvoice}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                >
                  <Download className="w-4 h-4 inline mr-2" /> Download Invoice
                </button>
                <button
                  onClick={() => setViewModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Unsaved Changes</h3>
            </div>
            <p className="text-gray-600 mb-6">
              You have unsaved changes. Are you sure you want to close without saving?
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={cancelCloseModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmCloseModal}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Expense Report</h3>
              <form onSubmit={handleExport}>
                <div className="space-y-4">
                  {/* Email Recipients */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Recipients
                    </label>
                    {exportEmails.map((email, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => updateExportEmail(index, e.target.value)}
                          placeholder="Enter email address"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                        {exportEmails.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeExportEmail(index)}
                            className="px-3 py-2 text-red-600 hover:text-red-800"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addExportEmail}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      + Add another email
                    </button>
                  </div>

                  {/* Date Range */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        From Date
                      </label>
                      <input
                        type="date"
                        value={exportDateFrom}
                        onChange={(e) => setExportDateFrom(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        To Date
                      </label>
                      <input
                        type="date"
                        value={exportDateTo}
                        onChange={(e) => setExportDateTo(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status Filter
                    </label>
                    <select
                      value={exportStatus}
                      onChange={(e) => setExportStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="paid">Paid</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  {/* Wing Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Wing Filter
                    </label>
                    <select
                      value={exportWingId}
                      onChange={(e) => setExportWingId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">All Wings</option>
                      {wings.map((wing) => (
                        <option key={wing.id} value={wing.id}>
                          {wing.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Floor Filter */}
                  {exportWingId && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Floor Filter
                      </label>
                      <select
                        value={exportFloorId}
                        onChange={(e) => setExportFloorId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">All Floors</option>
                        {exportFloors.map((floor) => (
                          <option key={floor.id} value={floor.id}>
                            {floor.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Flat Filter */}
                  {exportFloorId && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Flat Filter
                      </label>
                      <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                        {exportFlats.map((flat) => (
                          <label key={flat.id} className="flex items-center space-x-2 py-1">
                            <input
                              type="checkbox"
                              checked={exportFlatIds.includes(flat.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setExportFlatIds([...exportFlatIds, flat.id]);
                                } else {
                                  setExportFlatIds(exportFlatIds.filter(id => id !== flat.id));
                                }
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">{flat.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowExportModal(false);
                      resetExportModal();
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={exportLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {exportLoading ? 'Exporting...' : 'Export & Send'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseManagement;