'use client';

import { useState, useEffect, ChangeEvent, FormEvent, useCallback } from 'react';
import {
  getSocietyMembers,
  addSocietyMember,
  updateSocietyMember,
  getWings,
  getFloors,
  getFlats,
  Wing,
  Floor,
  Flat,
  importMembers,
  getMembersDashboardStats,
  makeMemberSocietyAdmin,
  SocietyMember,
  MembersDashboardStats,
} from '@/lib/societyAdminClient';
import {
  Search,
  Plus,
  Upload,
  Download,
  Shield,
  ChevronLeft,
  ChevronRight,
  XCircle,
  Users,
  X,
  ShieldPlus,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import debounce from 'lodash/debounce';

interface Filters {
  search: string;
  wing: string;
  floor: string;
  flat: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  wing?: string;
  floor?: string;
  flat?: string;
  role?: string;
}
  wingAccess?: string;
};

interface Props {
  societyId: string;
}

import type { AdminPermissions, ModulePermission, AddMemberPayload } from '@/lib/societyAdminClient';

const MembersPage = ({ societyId }: Props) => {
  const [members, setMembers] = useState<SocietyMember[]>([]);
  const [filters, setFilters] = useState<Filters>({
    search: '',
    wing: '',
    floor: '',
    flat: '',
  });
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage] = useState(5);
  const [totalItems, setTotalItems] = useState(0);
  const [sortField, setSortField] = useState<'name' | 'email' | ''>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<SocietyMember | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  
  // Tab state
  const [promotingUserId, setPromotingUserId] = useState<number | null>(null);
  const [promotionConfirmed, setPromotionConfirmed] = useState<boolean>(false);
  // New: Tab state for Members and Dashboard
  const [activeTab, setActiveTab] = useState<'members' | 'dashboard'>('members');
  
  // Stats
  const [membersStats, setMembersStats] = useState<MembersDashboardStats | null>(null);

  const [wings, setWings] = useState<Wing[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [flats, setFlats] = useState<Flat[]>([]);

  // Modal filters
  const [modalWing, setModalWing] = useState('');
  const [modalFloor, setModalFloor] = useState('');
  const [modalFlat, setModalFlat] = useState('');
  const [modalFloors, setModalFloors] = useState<Floor[]>([]);
  const [modalFlats, setModalFlats] = useState<Flat[]>([]);
  const [role, setRole] = useState<'member' | 'societyAdmin'>('member');
  const [modalStep, setModalStep] = useState<'basic' | 'location' | 'access'>('basic');

  // New: Admin permission state
  const [selectedRole, setSelectedRole] = useState<'member' | 'societyAdmin'>('member');
  const [adminWingAccessAll, setAdminWingAccessAll] = useState<boolean>(true);
  const [adminWingAccessIds, setAdminWingAccessIds] = useState<string[]>([]);
  const [adminPerms, setAdminPerms] = useState<AdminPermissions>({
    staff: { read: false, write: false },
    notices: { read: false, write: false },
    task: { read: false, write: false },
    complaints: { read: false, write: false },
    voting: { read: false, write: false },
    memberManagement: { read: false, write: false },
    amenity: { read: false, write: false },
    billing: { read: false, write: false },
    canAssignAdmins: false,
  });

  // New: helper to toggle wing selection
  const toggleAccessWing = (wingId: string) => {
    setAdminWingAccessIds(prev =>
      prev.includes(wingId) ? prev.filter(id => id !== wingId) : [...prev, wingId]
    );
  };

  // New: helper to set module permissions
  type ModuleKeys = Exclude<keyof AdminPermissions, 'canAssignAdmins'>;
  const setModulePermission = (
    moduleKey: ModuleKeys,
    type: 'read' | 'write',
    value: boolean
  ) => {
    setAdminPerms(prev => ({
      ...prev,
      [moduleKey]: { ...(prev[moduleKey] as ModulePermission), [type]: value },
    }));
  };

  // New: helper to render a module permission row
  const renderModuleRow = (moduleKey: ModuleKeys, label: string) => (
    <div className="flex items-center justify-between border border-gray-200 rounded p-2">
      <span className="text-sm text-gray-800">{label}</span>
      <div className="flex items-center gap-4">
        <label className="inline-flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            checked={(adminPerms[moduleKey] as ModulePermission)?.read || false}
            onChange={(e) => setModulePermission(moduleKey, 'read', e.target.checked)}
          />
          <span>Read</span>
        </label>
        <label className="inline-flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            checked={(adminPerms[moduleKey] as ModulePermission)?.write || false}
            onChange={(e) => setModulePermission(moduleKey, 'write', e.target.checked)}
          />
          <span>Write</span>
        </label>
      </div>
    </div>
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getSocietyMembers({
        page: currentPage,
        size: itemsPerPage,
        search: filters.search,
        wing: filters.wing,
        floor: filters.floor,
        flat: filters.flat,
        sortField,
        sortOrder,
      });

      if (response.success && response.data) {
        setMembers(response.data.data);
        setTotalItems(response.data.total);
      }
    } catch (err) {
      toast.error('Failed to load members');
      console.error('Error loading members:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters, sortField, sortOrder, itemsPerPage]);

  const fetchModalFloors = async (wingId: string) => {
    try {
      const response = await getFloors(wingId);
      if (response.success && response.data) {
        setModalFloors(response.data);
      }
    } catch (err) {
      console.error('Failed to load modal floors:', err);
    }
  };

  const fetchModalFlats = async (wingId: string, floorId: string) => {
    try {
      const response = await getFlats(wingId, floorId);
      if (response.success && response.data) {
        setModalFlats(response.data);
      }
    } catch (err) {
      console.error('Failed to load modal flats:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  const fetchModalFloors = async (wingId: string) => {
    try {
      if (!wingId) {
        setModalFloors([]);
        setModalFlats([]);
        setModalFloor('');
        setModalFlat('');
        return [];
      }
      const floorsData = await getFloors(wingId);
      setModalFloors(floorsData);
      return floorsData;
    } catch (err) {
      toast.error('Failed to load floors.');
      console.error('Error fetching floors:', err);
      return [];
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const response = await getWings();
        if (response.success && response.data) {
          setWings(response.data);
        }
      } catch (err) {
        console.error('Failed to load initial wings:', err);
      }
    };
    loadInitialData();
  }, [societyId]);

  useEffect(() => {
    const loadStats = async () => {
      if (activeTab === 'dashboard' && !membersStats) {
        try {
          const res = await getMembersDashboardStats(societyId);
          if (res?.success && res.data) setMembersStats(res.data);
        } catch (err) {
          console.error('Failed to load stats:', err);
        }
      }
    };
    loadStats();
  }, [activeTab, societyId, membersStats]);

  useEffect(() => {
    if (filters.wing) {
      const fetchFloorsData = async () => {
        try {
          const response = await getFloors(filters.wing);
          if (response.success && response.data) {
            setFloors(response.data);
          }
        } catch (err) {
          console.error('Failed to load floors:', err);
        }
      };
      fetchFloorsData();
      setFilters(prev => ({ ...prev, floor: '', flat: '' }));
    } else {
      setFloors([]);
      setFilters(prev => ({ ...prev, floor: '', flat: '' }));
    }
  }, [filters.wing]);

  useEffect(() => {
    if (filters.wing && filters.floor) {
      const fetchFlatsData = async () => {
      fetchFlats(filters.wing, filters.floor);
    } else {
      setFlats([]);
    }
  }, [filters.floor]);

  useEffect(() => {
    debouncedFetchData();
    return () => debouncedFetchData.cancel();
  }, [filters, currentPage, sortField, sortOrder, debouncedFetchData]);

  useEffect(() => {
    if (isModalOpen && editingMember) {
      setModalLoading(true);
      // Initialize role and reset admin access state when editing
      setSelectedRole(editingMember.userType === 'societyAdmin' ? 'societyAdmin' : 'member');
      setAdminWingAccessAll(true);
      setAdminWingAccessIds([]);
      setAdminPerms({
        staff: { read: false, write: false },
        notices: { read: false, write: false },
        task: { read: false, write: false },
        complaints: { read: false, write: false },
        voting: { read: false, write: false },
        memberManagement: { read: false, write: false },
        amenity: { read: false, write: false },
        billing: { read: false, write: false },
        canAssignAdmins: false,
      });
      const loadMemberData = async () => {
        try {
          const response = await getFlats(filters.wing, filters.floor);
          if (response.success && response.data) {
            setFlats(response.data);
          }
        } catch (err) {
          console.error('Failed to load flats:', err);
        }
      };
      fetchFlatsData();
      setFilters(prev => ({ ...prev, flat: '' }));
    } else {
      setFlats([]);
      setFilters(prev => ({ ...prev, flat: '' }));
      loadMemberData();
    } else if (isModalOpen) {
      setModalWing('');
      setModalFloor('');
      setModalFlat('');
      setModalFloors([]);
      setModalFlats([]);
      setSelectedRole('member');
      setAdminWingAccessAll(true);
      setAdminWingAccessIds([]);
      setAdminPerms({
        staff: { read: false, write: false },
        notices: { read: false, write: false },
        task: { read: false, write: false },
        complaints: { read: false, write: false },
        voting: { read: false, write: false },
        memberManagement: { read: false, write: false },
        amenity: { read: false, write: false },
        billing: { read: false, write: false },
        canAssignAdmins: false,
      });
    }
  }, [filters.floor]);

  const handleFilterChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(0);
  };

  const handleSort = (field: 'name' | 'email') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleAdd = () => {
    setEditingMember(null);
    setRole('member');
    setModalWing('');
    setModalFloor('');
    setModalFlat('');
    setModalWing('');
    setModalFloor('');
    setModalFlat('');
    setModalFloors([]);
    setModalFlats([]);
    setSelectedRole('member');
    setAdminWingAccessAll(true);
    setAdminWingAccessIds([]);
    setAdminPerms({
      staff: { read: false, write: false },
      notices: { read: false, write: false },
      task: { read: false, write: false },
      complaints: { read: false, write: false },
      voting: { read: false, write: false },
      memberManagement: { read: false, write: false },
      amenity: { read: false, write: false },
      billing: { read: false, write: false },
      canAssignAdmins: false,
    });
    setFormErrors({});
    setModalStep('basic');
    setIsModalOpen(true);
  };

  const handleModalWingChange = async (e: ChangeEvent<HTMLSelectElement>) => {
    const wingId = e.target.value;
    setModalWing(wingId);
    setModalFloor('');
    setModalFlat('');
    setModalFlats([]);
    if (wingId) fetchModalFloors(wingId);
  };

  const [promotingUserId, setPromotingUserId] = useState<number | null>(null);

  const handleMakeAdmin = async (member: SocietyMember) => {
    if (promotingUserId || !member.user_id) return;
    setPromotingUserId(member.user_id);
    try {
      const response = await makeMemberSocietyAdmin(member.user_id);
      if (response.success) {
        toast.success('Member promoted to Society Admin successfully');
        fetchData();
      } else {
        toast.error(response.message || 'Failed to promote member');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to promote member');
    } finally {
      setPromotingUserId(null);
    }
  };

  const handleSave = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      email: formData.get('email') as string,
      phoneNumber: formData.get('phone') as string,
      wingId: modalWing,
      floorId: modalFloor,
      flatId: modalFlat,
      userType: role,
    };

    setIsProcessing(true);
    try {
      let response;
      if (editingMember) {
        response = await updateSocietyMember(editingMember.user_id!, data as any);
      } else {
        response = await addSocietyMember(data as any);
      }

      if (response.success) {
        toast.success(editingMember ? 'Member updated!' : 'Member added!');
        setIsModalOpen(false);
        fetchData();
      } else {
        toast.error(response.message || 'Failed to save');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error saving member');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleImportSubmit = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    try {
      const response = await importMembers(selectedFile);
      if (response.success) {
        toast.success('Import successful!');
        setIsImportModalOpen(false);
        fetchData();
      } else {
        toast.error(response.message || 'Import failed');
      }
    } catch (err) {
      toast.error('Import failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadTemplate = () => {
    window.open('/templates/member-import-template.csv', '_blank');
  };

  const totalMembers = membersStats?.totalUsers ?? members.length;
  const activeMembers = membersStats?.activeUsers ?? members.filter(m => (m.status || 'inactive') === 'active').length;
  const pendingMembers = membersStats?.pendingApprovals ?? members.filter(m => (m.status || 'inactive') === 'pending_onboarding').length;
    setFormErrors(prev => ({ ...prev, wing: wingId ? '' : 'Wing is required', floor: '', flat: '' }));
    if (wingId) {
      await fetchModalFloors(wingId);
    }
  };

  const handleModalFloorChange = async (e: ChangeEvent<HTMLSelectElement>) => {
    const floorId = e.target.value;
    setModalFloor(floorId);
    setModalFlat('');
    setFormErrors(prev => ({ ...prev, floor: floorId ? '' : 'Floor is required', flat: '' }));
    if (modalWing && floorId) {
      await fetchModalFlats(modalWing, floorId);
    } else {
      setModalFlats([]);
    }
  };

  const handleModalFlatChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const flatId = e.target.value;
    setModalFlat(flatId);
    setFormErrors(prev => ({ ...prev, flat: flatId ? '' : 'Flat is required' }));
  };

  const handleSave = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;

    const firstName = (form.elements.namedItem('firstName') as HTMLInputElement)?.value?.trim() || '';
    const lastName = (form.elements.namedItem('lastName') as HTMLInputElement)?.value?.trim() || '';
    const email = (form.elements.namedItem('email') as HTMLInputElement)?.value?.trim() || '';
    const phone = (form.elements.namedItem('phone') as HTMLInputElement)?.value?.trim() || '';

    const errors: FormErrors = {};
    if (!firstName) errors.firstName = 'First name is required';
    if (!lastName) errors.lastName = 'Last name is required';
    if (!email) errors.email = 'Email is required';
    if (!modalWing) errors.wing = 'Wing is required';
    if (!modalFloor) errors.floor = 'Floor is required';
    if (!modalFlat) errors.flat = 'Flat is required';
    if (!selectedRole) errors.role = 'Role is required';
    if (selectedRole === 'societyAdmin' && !adminWingAccessAll && adminWingAccessIds.length === 0) {
      errors.wingAccess = 'Select at least one wing for admin access';
    }

    setFormErrors(errors);
    if (Object.values(errors).some(Boolean)) {
      return;
    }

    const selectedFlatObj = modalFlats.find((f) => String(f.flat_id) === String(modalFlat));
    const payload: AddMemberPayload = {
      name: `${firstName} ${lastName}`.trim(),
      firstName,
      lastName,
      email,
      flat_number: selectedFlatObj?.flat_number || '',
      phoneNumber: phone,
      userType: selectedRole,
      status: editingMember?.status || 'active',
      wingId: modalWing,
      floorId: modalFloor,
      flatId: modalFlat,
      ...(selectedRole === 'societyAdmin' ? {
        adminAccess: {
          wingAccess: {
            all: adminWingAccessAll,
            wingIds: adminWingAccessAll ? [] : adminWingAccessIds,
          },
          permissions: adminPerms,
        },
      } : {}),
    };

    try {
      setIsProcessing(true);
      const resp = editingMember
        ? await updateSocietyMember(editingMember.user_id, payload)
        : await addSocietyMember(payload);

      if (resp.success) {
        toast.success(editingMember ? 'Member updated' : 'Member added');
        setIsModalOpen(false);
        setEditingMember(null);
        // Reset modal form state
        setModalWing('');
        setModalFloor('');
        setModalFlat('');
        setModalFloors([]);
        setModalFlats([]);
        setSelectedRole('member');
        setAdminWingAccessAll(true);
        setAdminWingAccessIds([]);
        setAdminPerms({
          staff: { read: false, write: false },
          notices: { read: false, write: false },
          task: { read: false, write: false },
          complaints: { read: false, write: false },
          voting: { read: false, write: false },
          memberManagement: { read: false, write: false },
          amenity: { read: false, write: false },
          billing: { read: false, write: false },
          canAssignAdmins: false,
        });
        setFormErrors({});
        fetchData();
      } else {
        toast.error(resp.message || 'Save failed');
      }
    } catch (err) {
      console.error('Save member failed:', err);
      toast.error('Save failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const goToNextStep = () => {
    setModalStep((prev) => (prev === 'basic' ? 'location' : 'access'));
  };
  const goToPrevStep = () => {
    setModalStep((prev) => (prev === 'access' ? 'location' : 'basic'));
  };

  const handleMakeAdmin = async (member: SocietyMember) => {
    // Open multi-step modal on Access step prefilled
    setEditingMember(member);
    setPromotingUserId(member.user_id);
    setPromotionConfirmed(false);
    setSelectedRole('societyAdmin');
    const wingId = String(member.wing_id || '');
    const floorId = String(member.floor_id || '');
    const flatId = String(member.flat_id || '');
    setModalWing(wingId);
    setModalFloor(floorId);
    setModalFlat(flatId);
    await fetchModalFloors(wingId);
    if (wingId && floorId) {
      await fetchModalFlats(wingId, floorId);
    } else {
      setModalFlats([]);
    }
    setModalStep('access');
    setIsModalOpen(true);
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === 'text/csv' || file.name.endsWith('.csv') ||
      file.type.includes('spreadsheet') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      setSelectedFile(file);
    } else {
      toast.error('Please upload a valid CSV or Excel file');
    }
  };

  const handleImportSubmit = async () => {
    if (!selectedFile) return;

    try {
      setIsProcessing(true);
      const response = await importMembers(selectedFile);
      if (response.success) {
        toast.success('Members imported successfully!');
        setIsImportModalOpen(false);
        setSelectedFile(null);
        fetchData();
      } else {
        toast.error(response.message || 'Import failed');
      }
    } catch (error) {
      toast.error('Import failed. Please check the file format and try again.');
      console.error('Import error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await fetch('/templates/member-import-template.csv');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'member-import-template.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast.error('Failed to download template');
      console.error('Template download error:', error);
    }
  };

  // Fetch backend dashboard stats when opening dashboard tab (once per session)
  useEffect(() => {
    const loadStats = async () => {
      try {
        if (!membersStats && activeTab === 'dashboard') {
          const res = await getMembersDashboardStats(societyId);
          if (res?.success && res?.data) {
            setMembersStats(res.data);
          }
        }
      } catch (err) {
        console.error('Failed to load members dashboard stats:', err);
      }
    };
    loadStats();
  }, [activeTab, societyId, membersStats]);

  // New: Derived stats for Dashboard tab
  const totalMembers = (membersStats?.totalUsers ?? members.length);
  const activeMembers = (membersStats?.activeUsers ?? members.filter(m => m.status === 'active').length);
  const pendingMembers = (membersStats?.pendingApprovals ?? members.filter(m => m.status === 'pending_onboarding').length);
  const inactiveMembers = members.filter(m => m.status === 'inactive').length;
  const adminCount = members.filter(m => m.userType === 'societyAdmin').length;
  const memberCount = members.filter(m => m.userType === 'member').length;

  const wingStats = members.reduce<Record<string, number>>((acc, m) => {
    const name = m.wing_name || 'Unknown';
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});

  if (loading && members.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-pulse text-slate-400 font-medium">Initializing Workspace...</div>
      </div>
    );
  }

  return (
    <main className="flex-1 bg-white text-[#0b1c30] antialiased p-8 font-['Manrope',_sans-serif]">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <nav className="flex gap-2 text-[12px] font-bold text-[#565e74] mb-2 uppercase tracking-wide">
              <span>Management</span>
              <span>/</span>
              <span className="text-[#004ac6]">Members</span>
            </nav>
            <h2 className="text-[32px] font-bold leading-tight tracking-tight text-[#0b1c30]">Society Members</h2>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setIsImportModalOpen(true)}
              className="bg-white border border-slate-200 text-[#565e74] px-5 py-2 rounded-lg flex items-center gap-2 transition-all font-bold text-[14px] hover:bg-slate-50"
            >
              <Upload className="w-4 h-4" /> Import
            </button>
            <button 
              onClick={handleAdd}
              className="bg-[#004ac6] hover:bg-[#003ea8] text-white px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all font-bold text-[14px]"
            >
              <Plus className="w-4 h-4" /> Add Member
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-slate-50 rounded-lg w-fit border border-slate-100">
          <button
            onClick={() => setActiveTab('members')}
            className={clsx(
              "px-6 py-1.5 text-[13px] font-bold rounded-md transition-all",
              activeTab === 'members' ? "bg-white text-[#004ac6] shadow-sm border border-slate-100" : "text-[#565e74]"
            )}
          >
            Directory
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={clsx(
              "px-6 py-1.5 text-[13px] font-bold rounded-md transition-all",
              activeTab === 'dashboard' ? "bg-white text-[#004ac6] shadow-sm border border-slate-100" : "text-[#565e74]"
            )}
          >
            Insights
          </button>
        </div>

        {activeTab === 'members' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-100 p-3 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 flex-grow">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    name="search"
                    placeholder="Search members..."
                    value={filters.search}
                    onChange={handleFilterChange}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-lg text-[13px] outline-none focus:bg-white focus:ring-1 focus:ring-[#004ac6]"
                  />
                </div>
                <select name="wing" value={filters.wing} onChange={handleFilterChange} className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-[13px] font-medium outline-none">
                  <option value="">All Wings</option>
                  {wings.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
                <select 
                  name="floor" 
                  value={filters.floor} 
                  onChange={handleFilterChange} 
                  disabled={!filters.wing}
                  className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-[13px] font-medium outline-none disabled:opacity-50"
                >
                  <option value="">All Floors</option>
                  {floors.map(f => <option key={f.floor_id} value={f.floor_id}>{f.floor_number}</option>)}
                </select>
                <select 
                  name="flat" 
                  value={filters.flat} 
                  onChange={handleFilterChange} 
                  disabled={!filters.floor}
                  className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-[13px] font-medium outline-none disabled:opacity-50"
                >
                  <option value="">All Flats</option>
                  {flats.map(f => <option key={f.flat_id} value={f.flat_id}>{f.flat_number}</option>)}
                </select>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-50">
                  <thead className="bg-slate-50/50">
                    <tr>
                      <th onClick={() => handleSort('name')} className="px-6 py-4 text-left text-[11px] font-bold text-[#565e74] uppercase tracking-wider cursor-pointer hover:bg-slate-50 transition-colors">Name / Property</th>
                      <th onClick={() => handleSort('email')} className="px-6 py-4 text-left text-[11px] font-bold text-[#565e74] uppercase tracking-wider cursor-pointer hover:bg-slate-50 transition-colors">Contact</th>
                      <th className="px-6 py-4 text-left text-[11px] font-bold text-[#565e74] uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-[11px] font-bold text-[#565e74] uppercase tracking-wider">Role</th>
                      <th className="px-6 py-4 text-right text-[11px] font-bold text-[#565e74] uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {members.map((member) => (
                      <tr key={member.user_id} className="hover:bg-slate-50/50 transition-all">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-[#004ac6] font-bold text-xs">
                              {(member.firstName?.[0] || member.email?.[0] || member.name?.[0] || '?').toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-[#0b1c30] text-[14px]">{member.firstName} {member.lastName}</p>
                              <p className="text-[12px] text-[#565e74] font-medium">{member.wing_name}-{member.flat_number}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-[13px] text-[#0b1c30] font-bold">{member.email}</div>
                          <div className="text-[11px] text-[#565e74]">{member.phoneNumber}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={clsx(
                            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold text-[11px] uppercase",
                            (member.status || 'inactive') === 'active' ? 'bg-green-50 text-green-700' : (member.status || 'inactive') === 'pending_onboarding' ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'
                          )}>
                            <span className={clsx("w-1 h-1 rounded-full", (member.status || 'inactive') === 'active' ? 'bg-green-500' : (member.status || 'inactive') === 'pending_onboarding' ? 'bg-yellow-500' : 'bg-red-500')}></span>
                            {(member.status || 'inactive').replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={clsx("px-2.5 py-0.5 rounded-full font-bold text-[11px] uppercase", member.userType === 'societyAdmin' ? 'bg-blue-50 text-blue-700' : 'bg-slate-50 text-slate-700')}>
                            {member.userType === 'societyAdmin' ? 'Admin' : 'Member'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-4 items-center">
                            <button onClick={() => { setEditingMember(member); setRole((member.userType as 'member' | 'societyAdmin') || 'member'); setIsModalOpen(true); }} className="text-[12px] font-bold text-[#004ac6] hover:underline">View Details</button>
                            <button onClick={() => handleMakeAdmin(member)} className="p-1.5 text-slate-400 hover:text-blue-600 transition-all disabled:opacity-30" disabled={member.userType === 'societyAdmin' || promotingUserId === member.user_id}><Shield className="w-4 h-4" /></button>
                          </div>
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={clsx(
                                'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                                {
                                  'bg-green-100 text-green-800': member.status === 'active',
                                  'bg-yellow-100 text-yellow-800': member.status === 'pending_onboarding',
                                  'bg-red-100 text-red-800': member.status === 'inactive',
                                }
                              )}
                            >
                              <div className={`w-1.5 h-1.5 rounded-full mr-1 ${member.status === 'active' ? 'bg-green-500' :
                                  member.status === 'pending_onboarding' ? 'bg-yellow-500' : 'bg-red-500'
                                }`}></div>
                              {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={clsx(
                                'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                                {
                                  'bg-blue-100 text-blue-800': member.userType === 'societyAdmin',
                                  'bg-gray-100 text-gray-600': member.userType === 'member',
                                }
                              )}
                            >
                              <div className={`w-1.5 h-1.5 rounded-full mr-1 ${member.userType === 'societyAdmin' ? 'bg-blue-500' : 'bg-gray-400'
                                }`}></div>
                              {member.userType === 'societyAdmin' ? 'Society Admin' : 'Member'}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  setEditingMember(member);
                                  setIsModalOpen(true);
                                }}
                                className="text-blue-500 hover:text-blue-700 transition-colors"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              {/* Delete and Status Toggle removed as per request */}
                              {member.userType !== 'societyAdmin' && (
                                <button
                                  onClick={() => handleMakeAdmin(member)}
                                  className="text-purple-600 hover:text-purple-800 transition-colors disabled:opacity-50"
                                  title="Make Admin"
                                  disabled={promotingUserId === member.user_id}
                                >
                                  <Shield className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-3 py-4 text-center text-sm text-gray-500">
                          No members found
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                <span>Showing {members.length} of {totalItems} Results</span>
                <div className="flex gap-2">
                  <button onClick={() => setCurrentPage(p => Math.max(0, p-1))} disabled={currentPage === 0} className="p-1 hover:bg-slate-100 rounded-md disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                  <button onClick={() => setCurrentPage(p => p+1)} disabled={(currentPage+1)*itemsPerPage >= totalItems} className="p-1 hover:bg-slate-100 rounded-md disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'Total Members', value: totalMembers, color: 'text-slate-600', bg: 'bg-slate-400' },
                { label: 'Active', value: activeMembers, color: 'text-green-600', bg: 'bg-green-500' },
                { label: 'Pending', value: pendingMembers, color: 'text-yellow-600', bg: 'bg-yellow-500' },
                { label: 'Inactive', value: inactiveMembers, color: 'text-red-600', bg: 'bg-red-500' }
              ].map(stat => (
                <div key={stat.label} className="bg-white p-6 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                  <h3 className={clsx("text-2xl font-bold", stat.color)}>{stat.value}</h3>
                  <div className="mt-4 h-1 bg-slate-50 rounded-full overflow-hidden">
                    <div className={clsx("h-full rounded-full", stat.bg)} style={{ width: `${totalMembers ? (stat.value / totalMembers) * 100 : 0}%` }}></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl border border-slate-100">
                <h3 className="text-[14px] font-bold mb-6 border-b border-slate-50 pb-4">Role Distribution</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3"><Shield className="w-5 h-5 text-blue-600" /> <span className="font-bold text-[13px]">Admins</span></div>
                    <span className="text-xl font-bold">{adminCount}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3"><Users className="w-5 h-5 text-slate-600" /> <span className="font-bold text-[13px]">Residents</span></div>
                    <span className="text-xl font-bold">{memberCount}</span>
            {/* Add/Edit Member Modal */}
            {isModalOpen && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden m-4">
                  <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
                  <div className="p-4">
                    {modalLoading ? (
                      <div className="text-gray-600 text-sm font-medium animate-pulse text-center">
                        Loading modal data...
                      </div>
                    ) : (
                      <>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                          {editingMember ? 'Edit Member' : 'Add Member'}
                        </h2>
                        <form onSubmit={handleSave} className="space-y-3 flex flex-col">
                          <div className="flex-1 overflow-y-auto max-h-[65vh] pr-1">
                            {modalStep === 'basic' && (
                              <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">First Name</label>
                                    <input
                                      type="text"
                                      name="firstName"
                                      defaultValue={editingMember?.first_name || ''}
                                      className={clsx(
                                        'w-full p-1.5 border rounded-md focus:outline-none focus:ring-1 text-sm',
                                        formErrors.firstName ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-400'
                                      )}
                                    />
                                    {formErrors.firstName && (
                                      <p className="text-xs text-red-500 mt-1">{formErrors.firstName}</p>
                                    )}
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Last Name</label>
                                    <input
                                      type="text"
                                      name="lastName"
                                      defaultValue={editingMember?.last_name || ''}
                                      className={clsx(
                                        'w-full p-1.5 border rounded-md focus:outline-none focus:ring-1 text-sm',
                                        formErrors.lastName ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-400'
                                      )}
                                    />
                                    {formErrors.lastName && (
                                      <p className="text-xs text-red-500 mt-1">{formErrors.lastName}</p>
                                    )}
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                      type="email"
                                      name="email"
                                      defaultValue={editingMember?.email || ''}
                                      className={clsx(
                                        'w-full p-1.5 border rounded-md focus:outline-none focus:ring-1 text-sm',
                                        formErrors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-400'
                                      )}
                                    />
                                    {formErrors.email && (
                                      <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>
                                    )}
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                                    <input
                                      type="tel"
                                      name="phone"
                                      defaultValue={editingMember?.phone_number || ''}
                                      className={clsx(
                                        'w-full p-1.5 border rounded-md focus:outline-none focus:ring-1 text-sm',
                                        formErrors.phone ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-400'
                                      )}
                                    />
                                    {formErrors.phone && (
                                      <p className="text-xs text-red-500 mt-1">{formErrors.phone}</p>
                                    )}
                                  </div>
                                </div>
                              </>
                            )}

                            {modalStep === 'location' && (
                              <>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Wing</label>
                                    <select
                                      name="wing"
                                      value={modalWing}
                                      onChange={handleModalWingChange}
                                      className={clsx(
                                        'w-full p-1.5 border rounded-md focus:outline-none focus:ring-1 text-sm',
                                        formErrors.wing ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-400'
                                      )}
                                    >
                                      <option value="">Select Wing</option>
                                      {wings.map((wing) => (
                                        <option key={wing.id} value={wing.id}>{wing.name}</option>
                                      ))}
                                    </select>
                                    {formErrors.wing && (
                                      <p className="text-xs text-red-500 mt-1">{formErrors.wing}</p>
                                    )}
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Floor</label>
                                    <select
                                      name="floor"
                                      value={modalFloor}
                                      onChange={handleModalFloorChange}
                                      disabled={!modalWing}
                                      className={clsx(
                                        'w-full p-1.5 border rounded-md focus:outline-none focus:ring-1 text-sm',
                                        formErrors.floor ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-400',
                                        !modalWing && 'opacity-50'
                                      )}
                                    >
                                      <option value="">Select Floor</option>
                                      {modalFloors.map((floor) => (
                                        <option key={floor.floor_id} value={floor.floor_id}>Floor {floor.floor_number}</option>
                                      ))}
                                    </select>
                                    {formErrors.floor && (
                                      <p className="text-xs text-red-500 mt-1">{formErrors.floor}</p>
                                    )}
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Flat</label>
                                    <select
                                      name="flat"
                                      value={modalFlat}
                                      onChange={handleModalFlatChange}
                                      disabled={!modalFloor || modalFlats.length === 0}
                                      className={clsx(
                                        'w-full p-1.5 border rounded-md focus:outline-none focus:ring-1 text-sm',
                                        formErrors.flat ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-400',
                                        (!modalFloor || modalFlats.length === 0) && 'opacity-50'
                                      )}
                                    >
                                      <option value="">Select Flat</option>
                                      {modalFlats.map((flat) => (
                                        <option key={flat.flat_id} value={flat.flat_id}>{flat.flat_number}</option>
                                      ))}
                                    </select>
                                    {formErrors.flat && (
                                      <p className="text-xs text-red-500 mt-1">{formErrors.flat}</p>
                                    )}
                                  </div>
                                </div>
                              </>
                            )}

                            {modalStep === 'access' && (
                              <>
                                {promotingUserId && selectedRole === 'societyAdmin' && (
                                  <div className="mb-3 p-3 border border-yellow-200 bg-yellow-50 rounded">
                                    <p className="text-xs text-yellow-800">
                                      Promote this member to Society Admin? You can configure access below.
                                    </p>
                                    <div className="mt-2 flex gap-2">
                                      <button
                                        type="button"
                                        onClick={() => setPromotionConfirmed(true)}
                                        className="px-2 py-1 bg-yellow-600 text-white rounded text-xs hover:bg-yellow-700"
                                      >
                                        Yes, proceed
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => { setIsModalOpen(false); setPromotingUserId(null); setPromotionConfirmed(false); }}
                                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
                                    <select
                                      name="role"
                                      value={selectedRole}
                                      onChange={(e) => setSelectedRole(e.target.value as 'member' | 'societyAdmin')}
                                      className={clsx(
                                        'w-full p-1.5 border rounded-md focus:outline-none focus:ring-1 text-sm',
                                        formErrors.role ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-400'
                                      )}
                                    >
                                      <option value="member">Member</option>
                                      <option value="societyAdmin">Society Admin</option>
                                    </select>
                                    {formErrors.role && (
                                      <p className="text-xs text-red-500 mt-1">{formErrors.role}</p>
                                    )}
                                  </div>
                                </div>

                                {selectedRole === 'societyAdmin' && (
                                  <div className="space-y-3 mt-2 border-t border-gray-100 pt-3">
                                    <h3 className="text-sm font-semibold text-gray-900">Access Permissions</h3>
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1">Wing Access</label>
                                      <div className="flex items-center gap-3">
                                        <label className="inline-flex items-center gap-1 text-xs">
                                          <input type="radio" checked={adminWingAccessAll} onChange={() => { setAdminWingAccessAll(true); setAdminWingAccessIds([]); }} />
                                          <span>All Wings</span>
                                        </label>
                                        <label className="inline-flex items-center gap-1 text-xs">
                                          <input type="radio" checked={!adminWingAccessAll} onChange={() => setAdminWingAccessAll(false)} />
                                          <span>Specific Wings</span>
                                        </label>
                                      </div>
                                      {!adminWingAccessAll && (
                                        <div className="mt-2 grid grid-cols-2 gap-2 max-h-32 overflow-auto border border-gray-200 rounded p-2">
                                          {wings.map((wing) => (
                                            <label key={wing.id} className="flex items-center gap-2 text-xs">
                                              <input type="checkbox" checked={adminWingAccessIds.includes(String(wing.id))} onChange={() => toggleAccessWing(String(wing.id))} />
                                              <span>{wing.name}</span>
                                            </label>
                                          ))}
                                        </div>
                                      )}
                                      {formErrors.wingAccess && (
                                        <p className="text-xs text-red-500 mt-1">{formErrors.wingAccess}</p>
                                      )}
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1">Module Permissions</label>
                                      <div className="space-y-2">
                                        {renderModuleRow('staff', 'Staff')}
                                        {renderModuleRow('notices', 'Notice')}
                                        {renderModuleRow('task', 'Task')}
                                        {renderModuleRow('complaints', 'Complaint')}
                                        {renderModuleRow('voting', 'Voting')}
                                        {renderModuleRow('memberManagement', 'Member Management')}
                                        {renderModuleRow('amenity', 'Amenity')}
                                        {renderModuleRow('billing', 'Billing')}
                                        <div className="flex items-center justify-between border border-gray-200 rounded p-2">
                                          <span className="text-sm text-gray-800">Can Assign Admins</span>
                                          <label className="inline-flex items-center gap-1 text-xs">
                                            <input type="checkbox" checked={!!adminPerms.canAssignAdmins} onChange={(e) => setAdminPerms((prev) => ({ ...prev, canAssignAdmins: e.target.checked }))} />
                                          </label>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                          </div>

                          <div className="flex justify-end space-x-2 pt-3">
                            <button
                              type="button"
                              onClick={() => { setIsModalOpen(false); setPromotingUserId(null); setPromotionConfirmed(false); }}
                              className="px-2.5 py-1 bg-gray-100 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50 transition-all duration-200"
                              disabled={isProcessing}
                            >
                              Cancel
                            </button>
                            {modalStep !== 'basic' && (
                              <button
                                type="button"
                                onClick={goToPrevStep}
                                className="px-2.5 py-1 bg-gray-100 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50 transition-all duration-200"
                                disabled={isProcessing}
                              >
                                Back
                              </button>
                            )}
                            {modalStep !== 'access' && (
                              <button
                                type="button"
                                onClick={goToNextStep}
                                className="px-2.5 py-1 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600 hover:shadow-md disabled:opacity-50 transition-all duration-200"
                                disabled={isProcessing || modalLoading}
                              >
                                Next
                              </button>
                            )}
                            {modalStep === 'access' && (
                              <button
                                type="submit"
                                className="px-2.5 py-1 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600 hover:shadow-md disabled:opacity-50 transition-all duration-200"
                                disabled={isProcessing || modalLoading || (!!promotingUserId && selectedRole === 'societyAdmin' && !promotionConfirmed)}
                              >
                                {isProcessing ? 'Processing...' : editingMember ? 'Update' : 'Add'} Member
                              </button>
                            )}
                          </div>
                        </form>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-100">
                <h3 className="text-[14px] font-bold mb-6 border-b border-slate-50 pb-4">Residents by Wing</h3>
                <div className="space-y-4 max-h-[200px] overflow-y-auto pr-2">
                  {Object.entries(wingStats).map(([wing, count]) => (
                    <div key={wing} className="space-y-1">
                      <div className="flex justify-between text-[11px] font-bold uppercase"><span>{wing}</span> <span>{count}</span></div>
                      <div className="h-1 bg-slate-50 rounded-full overflow-hidden"><div className="h-full bg-blue-600" style={{ width: `${totalMembers ? (count / totalMembers) * 100 : 0}%` }}></div></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0b1c30]/10 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl border border-slate-100">
              <div className="px-8 py-5 border-b border-slate-50 flex justify-between items-center">
                <h3 className="text-xl font-bold">{editingMember ? 'Update Profile' : 'New Resident'}</h3>
                <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
              </div>
              <form onSubmit={handleSave} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">First Name</label>
                    <input name="firstName" defaultValue={editingMember?.firstName} className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-lg text-[13px] outline-none focus:bg-white focus:ring-1 focus:ring-blue-600" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Last Name</label>
                    <input name="lastName" defaultValue={editingMember?.lastName} className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-lg text-[13px] outline-none focus:bg-white focus:ring-1 focus:ring-blue-600" />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Email Address</label>
                    <input type="email" name="email" defaultValue={editingMember?.email} className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-lg text-[13px] outline-none focus:bg-white focus:ring-1 focus:ring-blue-600" />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Phone Number</label>
                    <input type="tel" name="phone" defaultValue={editingMember?.phoneNumber} className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-lg text-[13px] outline-none focus:bg-white focus:ring-1 focus:ring-blue-600" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 border-t border-slate-50 pt-6">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Wing</label>
                    <select value={modalWing} onChange={handleModalWingChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-[13px] outline-none">
                      <option value="">Select</option>
                      {wings.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Floor</label>
                    <select value={modalFloor} onChange={e => { setModalFloor(e.target.value); fetchModalFlats(modalWing, e.target.value); }} className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-[13px] outline-none">
                      <option value="">Select</option>
                      {modalFloors.map(f => <option key={f.floor_id} value={f.floor_id}>{f.floor_number}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Flat</label>
                    <select value={modalFlat} onChange={e => setModalFlat(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-[13px] outline-none">
                      <option value="">Select</option>
                      {modalFlats.map(f => <option key={f.flat_id} value={f.flat_id}>{f.flat_number}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100 mt-4">
                  <div className="flex items-center gap-3"><ShieldPlus className="w-5 h-5 text-blue-600" /><span className="text-[13px] font-bold">Administrative Rights</span></div>
                  <select value={role} onChange={e => setRole(e.target.value as any)} className="bg-white border border-slate-200 rounded px-3 py-1 text-[12px] font-bold outline-none">
                    <option value="member">Resident</option>
                    <option value="societyAdmin">Society Admin</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-6">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-lg font-bold text-[13px] hover:bg-slate-200 transition-all">Cancel</button>
                  <button type="submit" disabled={isProcessing} className="flex-[2] py-2.5 bg-blue-600 text-white rounded-lg font-bold text-[13px] hover:bg-blue-700 transition-all disabled:opacity-50">{isProcessing ? 'Processing...' : (editingMember ? 'Update Profile' : 'Confirm Registration')}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {isImportModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0b1c30]/10 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="bg-white rounded-2xl w-full max-w-lg p-8 shadow-2xl border border-slate-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Batch Import</h3>
                <button onClick={() => setIsImportModalOpen(false)}><XCircle className="w-6 h-6 text-slate-300" /></button>
              </div>
              <div className="space-y-6">
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-4">
                  <Download className="w-6 h-6 text-blue-600 mt-1" />
                  <div>
                    <p className="font-bold text-blue-700 text-sm">Download Schema</p>
                    <button onClick={downloadTemplate} className="text-xs text-blue-600 hover:underline">Download CSV Template</button>
                  </div>
        {/* Dashboard Tab Content */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-white/90 backdrop-blur-sm rounded-lg border border-gray-100 p-4 shadow-sm">
                <div className="text-xs text-gray-500">Total Members</div>
                <div className="mt-1 text-2xl font-semibold text-gray-900">{totalMembers}</div>
                <div className="mt-2 h-1.5 bg-gray-100 rounded">
                  <div className="h-1.5 bg-gray-400 rounded" style={{ width: `${totalMembers ? 100 : 0}%` }}></div>
                </div>
              </div>
              <div className="bg-white/90 backdrop-blur-sm rounded-lg border border-gray-100 p-4 shadow-sm">
                <div className="text-xs text-gray-500">Active</div>
                <div className="mt-1 text-2xl font-semibold text-green-600">{activeMembers}</div>
                <div className="mt-2 h-1.5 bg-green-100 rounded">
                  <div className="h-1.5 bg-green-500 rounded" style={{ width: `${totalMembers ? (activeMembers / totalMembers) * 100 : 0}%` }}></div>
                </div>
              </div>
              <div className="bg-white/90 backdrop-blur-sm rounded-lg border border-gray-100 p-4 shadow-sm">
                <div className="text-xs text-gray-500">Pending</div>
                <div className="mt-1 text-2xl font-semibold text-yellow-600">{pendingMembers}</div>
                <div className="mt-2 h-1.5 bg-yellow-100 rounded">
                  <div className="h-1.5 bg-yellow-500 rounded" style={{ width: `${totalMembers ? (pendingMembers / totalMembers) * 100 : 0}%` }}></div>
                </div>
              </div>
              <div className="bg-white/90 backdrop-blur-sm rounded-lg border border-gray-100 p-4 shadow-sm">
                <div className="text-xs text-gray-500">Inactive</div>
                <div className="mt-1 text-2xl font-semibold text-red-600">{inactiveMembers}</div>
                <div className="mt-2 h-1.5 bg-red-100 rounded">
                  <div className="h-1.5 bg-red-500 rounded" style={{ width: `${totalMembers ? (inactiveMembers / totalMembers) * 100 : 0}%` }}></div>
                </div>
              </div>
            </div>

            {/* Role Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="bg-white/90 backdrop-blur-sm rounded-lg border border-gray-100 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-900">Roles</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 rounded-md p-3 border border-blue-100">
                    <div className="text-xs text-blue-700">Society Admins</div>
                    <div className="text-xl font-semibold text-blue-800 mt-1">{adminCount}</div>
                  </div>
                  <div className="bg-gray-50 rounded-md p-3 border border-gray-100">
                    <div className="text-xs text-gray-700">Members</div>
                    <div className="text-xl font-semibold text-gray-800 mt-1">{memberCount}</div>
                  </div>
                </div>
              </div>

              {/* Members by Wing */}
              <div className="bg-white/90 backdrop-blur-sm rounded-lg border border-gray-100 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-900">Members by Wing</h3>
                </div>
                <div className="space-y-2">
                  {Object.entries(wingStats).length === 0 ? (
                    <p className="text-xs text-gray-500">No wing data available</p>
                  ) : (
                    Object.entries(wingStats)
                      .sort((a, b) => b[1] - a[1])
                      .map(([wingName, count], idx, arr) => {
                        const max = arr[0][1] || 1;
                        const pct = Math.round((count / max) * 100);
                        return (
                          <div key={wingName} className="flex items-center gap-3">
                            <div className="w-24 text-xs text-gray-700 truncate">{wingName}</div>
                            <div className="flex-1 h-2 bg-gray-100 rounded">
                              <div className="h-2 bg-blue-500 rounded" style={{ width: `${pct}%` }}></div>
                            </div>
                            <div className="w-10 text-right text-xs text-gray-600">{count}</div>
                          </div>
                        );
                      })
                  )}
                </div>
                <div className="border-2 border-dashed border-slate-100 rounded-2xl p-10 text-center hover:bg-slate-50 transition-all cursor-pointer relative">
                  <input type="file" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                  <Upload className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                  <p className="font-bold text-sm text-[#0b1c30]">{selectedFile ? selectedFile.name : 'Click to upload dataset'}</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setIsImportModalOpen(false)} className="flex-1 py-2.5 bg-slate-50 text-slate-500 rounded-lg font-bold text-[13px]">Cancel</button>
                  <button onClick={handleImportSubmit} disabled={!selectedFile || isProcessing} className="flex-[2] py-2.5 bg-blue-600 text-white rounded-lg font-bold text-[13px] disabled:opacity-50">Run Import</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
            </div>

            {/* Recent Members */}
            <div className="bg-white/90 backdrop-blur-sm rounded-lg border border-gray-100 overflow-hidden shadow-sm">
              <div className="p-3 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900">Recent Members</h3>
                <p className="text-xs text-gray-500">A quick look at the latest fetched members</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-900">Name</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-900">Email</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-900">Status</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-900">Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(members.slice(0, 8)).map((member) => (
                      <tr key={member.user_id} className="hover:bg-blue-50/50 transition-all duration-200">
                        <td className="px-3 py-2">
                          <div className="text-sm font-medium text-gray-900">
                            {member.first_name && member.last_name
                              ? `${member.first_name} ${member.last_name}`
                              : member.first_name || member.last_name || 'N/A'}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="text-sm text-gray-500">{member.email}</div>
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={clsx(
                              'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                              {
                                'bg-green-100 text-green-800': member.status === 'active',
                                'bg-yellow-100 text-yellow-800': member.status === 'pending_onboarding',
                                'bg-red-100 text-red-800': member.status === 'inactive',
                              }
                            )}
                          >
                            <div className={`w-1.5 h-1.5 rounded-full mr-1 ${member.status === 'active' ? 'bg-green-500' :
                                member.status === 'pending_onboarding' ? 'bg-yellow-500' : 'bg-red-500'
                              }`}></div>
                            {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={clsx(
                              'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                              {
                                'bg-blue-100 text-blue-800': member.userType === 'societyAdmin',
                                'bg-gray-100 text-gray-600': member.userType === 'member',
                              }
                            )}
                          >
                            <div className={`w-1.5 h-1.5 rounded-full mr-1 ${member.userType === 'societyAdmin' ? 'bg-blue-500' : 'bg-gray-400'
                              }`}></div>
                            {member.userType === 'societyAdmin' ? 'Society Admin' : 'Member'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {members.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-3 py-4 text-center text-sm text-gray-500">No members found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default MembersPage;