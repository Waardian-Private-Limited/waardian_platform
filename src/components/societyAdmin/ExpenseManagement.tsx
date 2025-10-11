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
  Receipt
} from 'lucide-react';
import clsx from 'clsx';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'react-hot-toast';

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
  const availablePaymentMethods = ['Cash', 'Bank Transfer', 'Cheque', 'UPI', 'Credit Card', 'Debit Card'];
  
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
  
  // Filter and search
  const filteredExpenses = (Array.isArray(expenses) ? expenses : []).filter(expense => {
    const matchesSearch = expense.invoice_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || expense.category === filterCategory;
    const matchesType = !filterType || expense.type === filterType;
    
    return matchesSearch && matchesCategory && matchesType;
  });
  
  // Pagination
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
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Expense Management</h1>
        <p className="text-gray-600">Manage society and flat expenses, track payments and generate reports.</p>
      </div>
      
      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('expenses')}
              className={clsx(
                'py-2 px-1 border-b-2 font-medium text-sm',
                activeTab === 'expenses'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4" />
                Expenses
              </div>
            </button>
            <button
              onClick={() => setActiveTab('fees')}
              className={clsx(
                'py-2 px-1 border-b-2 font-medium text-sm',
                activeTab === 'fees'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
            </button>
          </nav>
        </div>
      </div>
      
      {/* Action Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search expenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Filters */}
            <div className="flex gap-2">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {availableCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                <option value="society">Society</option>
                <option value="flat">Flat</option>
              </select>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex gap-2">
            <button 
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={() => {
                resetForm();
                setHasFormChanges(false);
                setOriginalFormData(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
            >
              <Plus className="w-4 h-4" />
              Add Expense
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
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Charges</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedExpenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{expense.invoice_name}</div>
                      <div className="text-sm text-gray-500">{expense.invoice_id}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{expense.category}</div>
                    <div className="text-sm text-gray-500">{expense.subcategory}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={clsx(
                      'inline-flex px-2 py-1 text-xs font-semibold rounded-full',
                      expense.type === 'society' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                    )}>
                      {expense.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={clsx(
                      'text-sm font-medium',
                      expense.credit_debit === 'credit' ? 'text-green-600' : 'text-red-600'
                    )}>
                      {expense.credit_debit === 'credit' ? '+' : '-'}{formatCurrency(expense.net_amount)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {expense.payment_method}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {expense.charges && expense.charges.length > 0 ? (
                      <div className="space-y-1">
                        {expense.charges.map((charge, index) => (
                          <div key={index} className="text-xs">
                            <span className="font-medium">{charge.charge_name}:</span> {charge.quantity} × ₹{charge.rate} = ₹{charge.total}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400">No charges</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(expense.transaction_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={clsx(
                      'inline-flex px-2 py-1 text-xs font-semibold rounded-full',
                      getStatusColor(expense.status)
                    )}>
                      {expense.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setViewingExpense(expense);
                          setViewModalOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(expense)}
                        className="text-green-600 hover:text-green-900"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(expense.id)}
                        className="text-red-600 hover:text-red-900"
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
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <p className="text-sm text-gray-700">
                  Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredExpenses.length)} of {filteredExpenses.length} results
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={clsx(
                      'relative inline-flex items-center px-4 py-2 text-sm font-medium border',
                      currentPage === page
                        ? 'bg-blue-50 border-blue-500 text-blue-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    )}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
        </>
      )}
      
      {/* Add/Edit Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-5xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {editingExpense ? 'Edit Expense' : 'Add New Expense'}
                  </h3>
                  <div className="flex items-center mt-2">
                    {[1, 2, 3, 4].map((step) => (
                      <div key={step} className="flex items-center">
                        <div className={clsx(
                          'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                          currentStep >= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                        )}>
                          {step}
                        </div>
                        {step < 4 && (
                          <div className={clsx(
                            'w-12 h-1 mx-2',
                            currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
                          )} />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Step {currentStep} of {totalSteps}: {
                      currentStep === 1 ? 'Basic Information' :
                      currentStep === 2 ? 'Financial Details' :
                      currentStep === 3 ? 'Additional Information' : 'Review & Submit'
                    }
                  </div>
                </div>
                <button
                  onClick={handleModalClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {/* Modal Body */}
              <form onSubmit={handleSubmit} className="mt-6">
                {/* Step 1: Basic Information */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Invoice Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Invoice Name * 
                          <span className="text-xs text-gray-500">(Name/title for this expense)</span>
                        </label>
                        <input
                          type="text"
                          value={formData.invoice_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, invoice_name: e.target.value }))}
                          className={clsx(
                            'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                            formErrors.invoice_name ? 'border-red-500' : 'border-gray-300'
                          )}
                          placeholder="Enter invoice name"
                        />
                        {formErrors.invoice_name && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.invoice_name}</p>
                        )}
                      </div>

                      {/* Invoice ID */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Invoice ID
                        </label>
                        <input
                          type="text"
                          value={formData.invoice_id}
                          onChange={(e) => setFormData(prev => ({ ...prev, invoice_id: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter invoice ID"
                        />
                      </div>

                      {/* Type */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Type *
                        </label>
                        <select
                          value={formData.type}
                          onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'society' | 'flat' }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="society">Society</option>
                          <option value="flat">Flat</option>
                        </select>
                      </div>

                      {/* Credit/Debit */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Credit/Debit *
                        </label>
                        <select
                          value={formData.credit_debit}
                          onChange={(e) => setFormData(prev => ({ ...prev, credit_debit: e.target.value as 'credit' | 'debit' }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="debit">Debit</option>
                          <option value="credit">Credit</option>
                        </select>
                      </div>

                      {/* Category */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Category *
                        </label>
                        <select
                          value={formData.category}
                          onChange={(e) => {
                            const category = e.target.value;
                            setFormData(prev => ({ 
                              ...prev, 
                              category,
                              subcategory: '' // Reset subcategory when category changes
                            }));
                          }}
                          className={clsx(
                            'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                            formErrors.category ? 'border-red-500' : 'border-gray-300'
                          )}
                        >
                          <option value="">Select Category</option>
                          {Object.keys(subcategoryMapping).map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                        {formErrors.category && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.category}</p>
                        )}
                      </div>

                      {/* Subcategory */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Subcategory *
                        </label>
                        <select
                          value={formData.subcategory}
                          onChange={(e) => setFormData(prev => ({ ...prev, subcategory: e.target.value }))}
                          className={clsx(
                            'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                            formErrors.subcategory ? 'border-red-500' : 'border-gray-300'
                          )}
                          disabled={!formData.category}
                        >
                          <option value="">Select Subcategory</option>
                          {formData.category && subcategoryMapping[formData.category]?.map(subcat => (
                            <option key={subcat} value={subcat}>{subcat}</option>
                          ))}
                        </select>
                        {formErrors.subcategory && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.subcategory}</p>
                        )}
                      </div>
                    </div>

                    {/* Step 1 Navigation */}
                    <div className="flex justify-end pt-6 border-t">
                      <button
                        type="button"
                        onClick={() => navigateToStep(2)}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
                      >
                        Next: Financial Details
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: Financial Details */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Gross Amount */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Gross Amount * 
                          <span className="text-xs text-gray-500">(Total amount before taxes and fees)</span>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.gross_amount}
                          onChange={(e) => setFormData(prev => ({ ...prev, gross_amount: e.target.value }))}
                          className={clsx(
                            'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                            formErrors.gross_amount ? 'border-red-500' : 'border-gray-300'
                          )}
                          placeholder="0.00"
                        />
                        {formErrors.gross_amount && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.gross_amount}</p>
                        )}
                      </div>

                      {/* Fees */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Fees 
                          <span className="text-xs text-gray-500">(Additional charges, if any)</span>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.fees || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, fees: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0.00"
                        />
                      </div>

                      {/* GST Percentage */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          GST Percentage
                          <span className="text-xs text-gray-500">(Goods and Services Tax)</span>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.gst_percentage}
                          onChange={(e) => setFormData(prev => ({ ...prev, gst_percentage: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="18.00"
                        />
                      </div>

                      {/* GST Amount (Editable now) */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          GST Amount
                          <span className="text-xs text-gray-500">(Editable if custom tax applied)</span>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.gst_amount}
                          onChange={(e) => setFormData(prev => ({ ...prev, gst_amount: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0.00"
                        />
                      </div>

                      {/* Net Amount (Editable now) */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Net Amount *
                          <span className="text-xs text-gray-500">(Final amount after all calculations)</span>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.net_amount}
                          onChange={(e) => setFormData(prev => ({ ...prev, net_amount: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0.00"
                        />
                      </div>

                      {/* Payment Method */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Payment Method *
                        </label>
                        <select
                          value={formData.payment_method}
                          onChange={(e) => setFormData(prev => ({ ...prev, payment_method: e.target.value }))}
                          className={clsx(
                            'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                            formErrors.payment_method ? 'border-red-500' : 'border-gray-300'
                          )}
                        >
                          <option value="">Select Payment Method</option>
                          {availablePaymentMethods.map(method => (
                            <option key={method} value={method}>{method}</option>
                          ))}
                        </select>
                        {formErrors.payment_method && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.payment_method}</p>
                        )}
                      </div>

                      {/* Payment Details Specific */}
                      {formData.payment_method && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {formData.payment_method === 'online' ? 'UPI VPA / Account Number / Last 4 digits of Card *' :
                            formData.payment_method === 'cheque' ? 'Cheque Number *' :
                            formData.payment_method === 'cash' ? 'Reference (Optional)' : 'Payment Details *'}
                          </label>
                          <input
                            type="text"
                            value={formData.payment_details_specific}
                            onChange={(e) => setFormData(prev => ({ ...prev, payment_details_specific: e.target.value }))}
                            placeholder={
                              formData.payment_method === 'online' ? 'Enter UPI VPA, Account Number, or Last 4 digits of Card' :
                              formData.payment_method === 'cheque' ? 'Enter Cheque Number' :
                              formData.payment_method === 'cash' ? 'Enter Reference (Optional)' : 'Enter Payment Details'
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      )}

                      {/* Transaction Date */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Transaction Date *
                        </label>
                        <input
                          type="date"
                          value={formData.transaction_date}
                          onChange={(e) => setFormData(prev => ({ ...prev, transaction_date: e.target.value }))}
                          className={clsx(
                            'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                            formErrors.transaction_date ? 'border-red-500' : 'border-gray-300'
                          )}
                        />
                        {formErrors.transaction_date && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.transaction_date}</p>
                        )}
                      </div>
                    </div>

                    {/* Charges Section */}
                    <div className="border-t pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-medium text-gray-900">Item-wise Charges (Optional)</h4>
                        <button
                          type="button"
                          onClick={addCharge}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500"
                        >
                          <Plus className="w-4 h-4 inline mr-2" />
                          Add Item
                        </button>
                      </div>
                      
                      {formData.charges.map((charge, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4 p-4 border border-gray-200 rounded-lg">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                            <input
                              type="text"
                              value={charge.charge_name}
                              onChange={(e) => updateCharge(index, 'charge_name', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Enter item name"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                            <input
                              type="number"
                              value={charge.quantity}
                              onChange={(e) => updateCharge(index, 'quantity', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="1"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Rate</label>
                            <input
                              type="number"
                              step="0.01"
                              value={charge.rate}
                              onChange={(e) => updateCharge(index, 'rate', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="0.00"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tax (%)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={charge.tax_percentage}
                              onChange={(e) => updateCharge(index, 'tax_percentage', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Total</label>
                            <input
                              type="number"
                              step="0.01"
                              value={charge.total}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                              readOnly
                            />
                          </div>
                          <div className="flex items-end">
                            <button
                              type="button"
                              onClick={() => removeCharge(index)}
                              className="w-full px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500"
                            >
                              <Trash2 className="w-4 h-4 mx-auto" />
                            </button>
                          </div>
                        </div>
                      ))}
                      
                      {formData.charges.length > 0 && (
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900">
                            Total Charges: {formatCurrency(formData.charges.reduce((sum, charge) => sum + charge.total, 0))}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Step 2 Navigation */}
                    <div className="flex justify-between pt-6 border-t">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:ring-2 focus:ring-gray-500"
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        onClick={() => navigateToStep(3)}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
                      >
                        Next: Additional Info
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Additional Information */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Collected By */}
                      <div className="md:col-span-2">
                        <h4 className="text-lg font-medium text-gray-900 mb-4">Collected By</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                            <input
                              type="text"
                              value={formData.collected_by_name}
                              onChange={(e) => setFormData(prev => ({ ...prev, collected_by_name: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Enter name"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Phone (Optional)</label>
                            <input
                              type="tel"
                              value={formData.collected_by_phone}
                              onChange={(e) => setFormData(prev => ({ ...prev, collected_by_phone: e.target.value }))}
                              className={clsx(
                                "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                                formErrors.collected_by_phone ? "border-red-500" : "border-gray-300"
                              )}
                              placeholder="Enter 10-digit phone number"
                            />
                            {formErrors.collected_by_phone && (
                              <p className="mt-1 text-sm text-red-600">{formErrors.collected_by_phone}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email (Optional)</label>
                            <input
                              type="email"
                              value={formData.collected_by_email}
                              onChange={(e) => setFormData(prev => ({ ...prev, collected_by_email: e.target.value }))}
                              className={clsx(
                                "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                                formErrors.collected_by_email ? "border-red-500" : "border-gray-300"
                              )}
                              placeholder="Enter email address"
                            />
                            {formErrors.collected_by_email && (
                              <p className="mt-1 text-sm text-red-600">{formErrors.collected_by_email}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">GST Number (Optional)</label>
                            <input
                              type="text"
                              value={formData.collected_by_gst_number}
                              onChange={(e) => setFormData(prev => ({ ...prev, collected_by_gst_number: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Enter GST Number"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Paid By */}
                      <div className="md:col-span-2">
                        <h4 className="text-lg font-medium text-gray-900 mb-4">Paid By</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                            <input
                              type="text"
                              value={formData.paid_by_name}
                              onChange={(e) => setFormData(prev => ({ ...prev, paid_by_name: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Enter name"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Phone (Optional)</label>
                            <input
                              type="tel"
                              value={formData.paid_by_phone}
                              onChange={(e) => setFormData(prev => ({ ...prev, paid_by_phone: e.target.value }))}
                              className={clsx(
                                "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                                formErrors.paid_by_phone ? "border-red-500" : "border-gray-300"
                              )}
                              placeholder="Enter 10-digit phone number"
                            />
                            {formErrors.paid_by_phone && (
                              <p className="mt-1 text-sm text-red-600">{formErrors.paid_by_phone}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email (Optional)</label>
                            <input
                              type="email"
                              value={formData.paid_by_email}
                              onChange={(e) => setFormData(prev => ({ ...prev, paid_by_email: e.target.value }))}
                              className={clsx(
                                "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                                formErrors.paid_by_email ? "border-red-500" : "border-gray-300"
                              )}
                              placeholder="Enter email address"
                            />
                            {formErrors.paid_by_email && (
                              <p className="mt-1 text-sm text-red-600">{formErrors.paid_by_email}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">GST Number (Optional)</label>
                            <input
                              type="text"
                              value={formData.paid_by_gst_number}
                              onChange={(e) => setFormData(prev => ({ ...prev, paid_by_gst_number: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Enter GST Number"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Transaction ID */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Transaction ID
                        </label>
                        <input
                          type="text"
                          value={formData.transaction_id}
                          onChange={(e) => setFormData(prev => ({ ...prev, transaction_id: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter transaction ID"
                        />
                      </div>

                      {/* Receipt No */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Receipt No
                        </label>
                        <input
                          type="text"
                          value={formData.receipt_no}
                          onChange={(e) => setFormData(prev => ({ ...prev, receipt_no: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter receipt number"
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

                      {/* Attachments */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Attachments (Optional)
                        </label>
                        <div 
                          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
                          onClick={() => {
                            const fileInput = document.querySelector('input[type="file"][multiple]') as HTMLInputElement;
                            fileInput?.click();
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.add('border-blue-400', 'bg-blue-50');
                          }}
                          onDragLeave={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
                            const files = Array.from(e.dataTransfer.files);
                            const validFiles = files.filter(file => {
                              const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
                              const maxSize = 10 * 1024 * 1024; // 10MB
                              return validTypes.includes(file.type) && file.size <= maxSize;
                            });
                            // Add new files to existing ones instead of replacing
                            setFormData(prev => ({ 
                              ...prev, 
                              attachments: [...prev.attachments, ...validFiles]
                            }));
                          }}
                        >
                          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 mb-2">Click to upload or drag and drop multiple files</p>
                          <p className="text-xs text-gray-500">PDF, JPG, PNG up to 10MB each • Multiple files supported</p>
                          <input
                            type="file"
                            multiple
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            onChange={(e) => {
                              const files = Array.from(e.target.files || []);
                              const validFiles = files.filter(file => {
                                const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
                                const maxSize = 10 * 1024 * 1024; // 10MB
                                return validTypes.includes(file.type) && file.size <= maxSize;
                              });
                              // Add new files to existing ones instead of replacing
                              setFormData(prev => ({ 
                                ...prev, 
                                attachments: [...prev.attachments, ...validFiles]
                              }));
                              // Reset the input to allow selecting the same files again
                              e.target.value = '';
                            }}
                          />
                        </div>
                        {formData.attachments.length > 0 && (
                          <div className="mt-2">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm text-gray-600">{formData.attachments.length} file(s) selected</p>
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, attachments: [] }));
                                }}
                                className="text-xs text-red-500 hover:text-red-700 underline"
                              >
                                Clear all
                              </button>
                            </div>
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                              {formData.attachments.map((file, index) => (
                                <div key={index} className="flex items-center justify-between text-xs text-gray-500 bg-gray-50 p-2 rounded">
                                  <div className="flex-1 min-w-0">
                                    <span className="truncate block">{file.name}</span>
                                    <span className="text-gray-400">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setFormData(prev => ({
                                        ...prev,
                                        attachments: prev.attachments.filter((_, i) => i !== index)
                                      }));
                                    }}
                                    className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Step 3 Navigation */}
                    <div className="flex justify-between pt-6 border-t">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:ring-2 focus:ring-gray-500"
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        onClick={() => navigateToStep(4)}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
                      >
                        Next: Review
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 4: Review & Submit */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Review Your Expense</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h5 className="font-medium text-gray-700 mb-2">Basic Information</h5>
                          <div className="space-y-2 text-sm">
                            <p><span className="font-medium">Invoice Name:</span> {formData.invoice_name}</p>
                            <p><span className="font-medium">Invoice ID:</span> {formData.invoice_id}</p>
                            <p><span className="font-medium">Category:</span> {formData.category}</p>
                            <p><span className="font-medium">Subcategory:</span> {formData.subcategory}</p>
                            <p><span className="font-medium">Type:</span> {formData.type}</p>
                            <p><span className="font-medium">Credit/Debit:</span> {formData.credit_debit}</p>
                            {formData.wing_id && (
                              <p><span className="font-medium">Wing:</span> {wings.find(w => w.id === formData.wing_id)?.name || formData.wing_id}</p>
                            )}
                            {formData.floor_id && (
                              <p><span className="font-medium">Floor:</span> {floors.find(f => f.id === formData.floor_id)?.name || formData.floor_id}</p>
                            )}
                            {formData.flat_id && (
                              <p><span className="font-medium">Flat:</span> {flats.find(fl => fl.id === formData.flat_id)?.name || formData.flat_id}</p>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <h5 className="font-medium text-gray-700 mb-2">Financial Details</h5>
                          <div className="space-y-2 text-sm">
                            <p><span className="font-medium">Gross Amount:</span> {formatCurrency(parseFloat(formData.gross_amount || '0'))}</p>
                            {formData.fees && <p><span className="font-medium">Fees:</span> {formatCurrency(parseFloat(formData.fees || '0'))}</p>}
                            {formData.tax_percentage && <p><span className="font-medium">Tax:</span> {formData.tax_percentage}% ({formatCurrency(parseFloat(formData.tax_amount || '0'))})</p>}
                            <p><span className="font-medium">GST:</span> {formData.gst_percentage}% ({formatCurrency(parseFloat(formData.gst_amount || '0'))})</p>
                            <p><span className="font-medium">Net Amount:</span> {formatCurrency(parseFloat(formData.net_amount || '0'))}</p>
                            <p><span className="font-medium">Payment Method:</span> {formData.payment_method}</p>
                            <p><span className="font-medium">Transaction Date:</span> {formData.transaction_date}</p>
                            {formData.clearing_date && <p><span className="font-medium">Clearing Date:</span> {formData.clearing_date}</p>}
                          </div>
                        </div>
                        
                        {(formData.payment_details_specific || formData.receipt_no || formData.transaction_id || formData.cheque_number || formData.bank_name) && (
                          <div className="md:col-span-2">
                            <h5 className="font-medium text-gray-700 mb-2">Payment Details</h5>
                            <div className="space-y-2 text-sm">
                              {formData.payment_details_specific && <p><span className="font-medium">Payment Details:</span> {formData.payment_details_specific}</p>}
                              {formData.receipt_no && <p><span className="font-medium">Receipt Number:</span> {formData.receipt_no}</p>}
                              {formData.transaction_id && <p><span className="font-medium">Transaction ID:</span> {formData.transaction_id}</p>}
                              {formData.cheque_number && <p><span className="font-medium">Cheque Number:</span> {formData.cheque_number}</p>}
                              {formData.bank_name && <p><span className="font-medium">Bank Name:</span> {formData.bank_name}</p>}
                            </div>
                          </div>
                        )}
                        
                        {formData.charges.length > 0 && (
                          <div className="md:col-span-2">
                            <h5 className="font-medium text-gray-700 mb-2">Item-wise Charges</h5>
                            <div className="space-y-2 text-sm">
                              {formData.charges.map((charge, index) => (
                                <div key={index} className="flex items-center justify-between">
                                  <div>
                                    <span className="font-medium">{charge.charge_name}</span>: {charge.quantity} × {formatCurrency(charge.rate)} = {formatCurrency(charge.total)}
                                    {typeof charge.tax_percentage === 'number' && charge.tax_percentage > 0 && (
                                      <span className="text-gray-500"> • Tax: {charge.tax_percentage}%{typeof charge.tax_amount === 'number' ? ` (${formatCurrency(charge.tax_amount)})` : ''}</span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="mt-3 pt-3 border-t border-gray-300">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-900">Total Charges:</span>
                                <span className="text-sm font-bold text-gray-900">
                                  {formatCurrency(formData.charges.reduce((sum, c) => sum + (c.total || 0), 0))}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {(formData.collected_by_name || formData.collected_by_phone || formData.collected_by_email || formData.collected_by_gst_number || formData.paid_by_name || formData.paid_by_phone || formData.paid_by_email || formData.paid_by_gst_number || formData.description || formData.notes) && (
                          <div className="md:col-span-2">
                            <h5 className="font-medium text-gray-700 mb-2">Additional Information</h5>
                            <div className="space-y-2 text-sm">
                              {formData.collected_by_name && <p><span className="font-medium">Collected By:</span> {formData.collected_by_name}</p>}
                              {formData.collected_by_phone && <p><span className="font-medium">Collected By Phone:</span> {formData.collected_by_phone}</p>}
                              {formData.collected_by_email && <p><span className="font-medium">Collected By Email:</span> {formData.collected_by_email}</p>}
                              {formData.collected_by_gst_number && <p><span className="font-medium">Collected By GST Number:</span> {formData.collected_by_gst_number}</p>}
                              {formData.paid_by_name && <p><span className="font-medium">Paid By:</span> {formData.paid_by_name}</p>}
                              {formData.paid_by_phone && <p><span className="font-medium">Paid By Phone:</span> {formData.paid_by_phone}</p>}
                              {formData.paid_by_email && <p><span className="font-medium">Paid By Email:</span> {formData.paid_by_email}</p>}
                              {formData.paid_by_gst_number && <p><span className="font-medium">Paid By GST Number:</span> {formData.paid_by_gst_number}</p>}
                              {formData.description && <p><span className="font-medium">Description:</span> {formData.description}</p>}
                              {formData.notes && <p><span className="font-medium">Notes:</span> {formData.notes}</p>}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Step 4 Navigation */}
                    <div className="flex justify-between pt-6 border-t">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(3)}
                        className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:ring-2 focus:ring-gray-500"
                      >
                        Previous
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500"
                        disabled={modalLoading}
                      >
                        {modalLoading && <RefreshCw className="w-4 h-4 animate-spin inline mr-2" />}
                        {editingExpense ? 'Update Expense' : 'Create Expense'}
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
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