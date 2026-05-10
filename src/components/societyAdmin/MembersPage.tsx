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
  Pencil,
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
  wingAccess?: string;
}

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
  const [itemsPerPage] = useState(10);
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
  const [activeTab, setActiveTab] = useState<'members' | 'dashboard'>('members');
  const [promotingUserId, setPromotingUserId] = useState<number | null>(null);
  const [promotionConfirmed, setPromotionConfirmed] = useState<boolean>(false);

  // Stats
  const [membersStats, setMembersStats] = useState<MembersDashboardStats | null>(null);

  const [wings, setWings] = useState<Wing[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [flats, setFlats] = useState<Flat[]>([]);

  // Modal filters/state
  const [modalWing, setModalWing] = useState('');
  const [modalFloor, setModalFloor] = useState('');
  const [modalFlat, setModalFlat] = useState('');
  const [modalFloors, setModalFloors] = useState<Floor[]>([]);
  const [modalFlats, setModalFlats] = useState<Flat[]>([]);
  const [modalStep, setModalStep] = useState<'basic' | 'location' | 'access'>('basic');
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

  // Helpers
  const toggleAccessWing = (wingId: string) => {
    setAdminWingAccessIds(prev =>
      prev.includes(wingId) ? prev.filter(id => id !== wingId) : [...prev, wingId]
    );
  };

  type ModuleKeys = Exclude<keyof AdminPermissions, 'canAssignAdmins'>;
  const setModulePermission = (moduleKey: ModuleKeys, type: 'read' | 'write', value: boolean) => {
    setAdminPerms(prev => ({
      ...prev,
      [moduleKey]: { ...(prev[moduleKey] as ModulePermission), [type]: value },
    }));
  };

  const renderModuleRow = (moduleKey: ModuleKeys, label: string) => (
    <div key={moduleKey} className="flex items-center justify-between border border-gray-100 rounded-lg p-3 bg-white">
      <span className="text-[13px] font-bold text-slate-700">{label}</span>
      <div className="flex items-center gap-6">
        <label className="inline-flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-slate-200 text-[#004ac6] focus:ring-[#004ac6]"
            checked={(adminPerms[moduleKey] as ModulePermission)?.read || false}
            onChange={(e) => setModulePermission(moduleKey, 'read', e.target.checked)}
          />
          <span>Read</span>
        </label>
        <label className="inline-flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-slate-200 text-[#004ac6] focus:ring-[#004ac6]"
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
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters, sortField, sortOrder, itemsPerPage]);

  const debouncedFetchData = useCallback(
    debounce(() => fetchData(), 500),
    [fetchData]
  );

  const fetchModalFloors = async (wingId: string) => {
    if (!wingId) {
      setModalFloors([]);
      return;
    }
    try {
      const response = await getFloors(wingId);
      if (response.success && response.data) {
        setModalFloors(response.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchModalFlats = async (wingId: string, floorId: string) => {
    if (!wingId || !floorId) {
      setModalFlats([]);
      return;
    }
    try {
      const response = await getFlats(wingId, floorId);
      if (response.success && response.data) {
        setModalFlats(response.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Lifecycle
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const response = await getWings();
        if (response.success && response.data) {
          setWings(response.data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    debouncedFetchData();
    return () => debouncedFetchData.cancel();
  }, [filters, currentPage, sortField, sortOrder, debouncedFetchData]);

  useEffect(() => {
    if (activeTab === 'dashboard' && !membersStats) {
      const loadStats = async () => {
        try {
          const res = await getMembersDashboardStats(societyId);
          if (res?.success && res.data) setMembersStats(res.data);
        } catch (err) {
          console.error(err);
        }
      };
      loadStats();
    }
  }, [activeTab, societyId, membersStats]);

  useEffect(() => {
    if (filters.wing) {
      const loadFloors = async () => {
        const res = await getFloors(filters.wing);
        if (res.success) setFloors(res.data || []);
      };
      loadFloors();
      setFilters(prev => ({ ...prev, floor: '', flat: '' }));
    } else {
      setFloors([]);
      setFilters(prev => ({ ...prev, floor: '', flat: '' }));
    }
  }, [filters.wing]);

  useEffect(() => {
    if (filters.wing && filters.floor) {
      const loadFlats = async () => {
        const res = await getFlats(filters.wing, filters.floor);
        if (res.success) setFlats(res.data || []);
      };
      loadFlats();
      setFilters(prev => ({ ...prev, flat: '' }));
    } else {
      setFlats([]);
      setFilters(prev => ({ ...prev, flat: '' }));
    }
  }, [filters.wing, filters.floor]);

  // Modal Initialization Effect
  useEffect(() => {
    if (isModalOpen) {
      if (editingMember) {
        setModalLoading(true);
        setSelectedRole(editingMember.userType === 'societyAdmin' ? 'societyAdmin' : 'member');
        setModalWing(String(editingMember.wing_id || ''));
        setModalFloor(String(editingMember.floor_id || ''));
        setModalFlat(String(editingMember.flat_id || ''));
        
        const loadModalData = async () => {
          if (editingMember.wing_id) {
            await fetchModalFloors(String(editingMember.wing_id));
            if (editingMember.floor_id) {
              await fetchModalFlats(String(editingMember.wing_id), String(editingMember.floor_id));
            }
          }
          setModalLoading(false);
        };
        loadModalData();
      } else {
        // Reset for Add
        setModalWing('');
        setModalFloor('');
        setModalFlat('');
        setModalFloors([]);
        setModalFlats([]);
        setSelectedRole('member');
        setModalStep('basic');
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
    }
  }, [isModalOpen, editingMember]);

  // Handlers
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
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleModalWingChange = async (e: ChangeEvent<HTMLSelectElement>) => {
    const wingId = e.target.value;
    setModalWing(wingId);
    setModalFloor('');
    setModalFlat('');
    setModalFlats([]);
    setFormErrors(prev => ({ ...prev, wing: wingId ? '' : 'Wing is required' }));
    if (wingId) await fetchModalFloors(wingId);
  };

  const handleModalFloorChange = async (e: ChangeEvent<HTMLSelectElement>) => {
    const floorId = e.target.value;
    setModalFloor(floorId);
    setModalFlat('');
    setFormErrors(prev => ({ ...prev, floor: floorId ? '' : 'Floor is required' }));
    if (modalWing && floorId) await fetchModalFlats(modalWing, floorId);
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
    if (Object.values(errors).some(Boolean)) return;

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

    setIsProcessing(true);
    try {
      if (editingMember?.user_id === undefined) {
        toast.error('Invalid member ID');
        return;
      }

      const resp = editingMember
        ? await updateSocietyMember(editingMember.user_id, payload)
        : await addSocietyMember(payload);

      if (resp.success) {
        toast.success(editingMember ? 'Member updated' : 'Member added');
        setIsModalOpen(false);
        fetchData();
      } else {
        toast.error(resp.message || 'Save failed');
      }
    } catch (err) {
      console.error(err);
      toast.error('Save failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMakeAdmin = async (member: SocietyMember) => {
    if (member.user_id === undefined) {
      toast.error('Invalid member ID');
      return;
    }
    setEditingMember(member);
    setPromotingUserId(member.user_id);
    setPromotionConfirmed(false);
    setSelectedRole('societyAdmin');
    setIsModalOpen(true);
    setModalStep('access');
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
      setSelectedFile(file);
    } else {
      toast.error('Please upload a valid CSV file');
    }
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

  const downloadTemplate = async () => {
    try {
      const response = await fetch('/templates/member-import-template.csv');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'member-import-template.csv';
      document.body.appendChild(a); a.click();
      window.URL.revokeObjectURL(url); document.body.removeChild(a);
    } catch (err) {
      toast.error('Download failed');
    }
  };

  const goToNextStep = () => setModalStep(prev => prev === 'basic' ? 'location' : 'access');
  const goToPrevStep = () => setModalStep(prev => prev === 'access' ? 'location' : 'basic');

  // Stats
  const totalMembersVal = (membersStats?.totalUsers ?? members.length);
  const activeMembersVal = (membersStats?.activeUsers ?? members.filter(m => m.status === 'active').length);
  const pendingMembersVal = (membersStats?.pendingApprovals ?? members.filter(m => m.status === 'pending_onboarding').length);
  const inactiveMembersVal = members.filter(m => m.status === 'inactive').length;
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
        <div className="animate-pulse text-slate-400 font-bold text-sm uppercase tracking-widest">Initialising Workspace...</div>
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
                <select name="wing" value={filters.wing} onChange={handleFilterChange} className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-[13px] font-bold outline-none">
                  <option value="">All Wings</option>
                  {wings.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
                <select name="floor" value={filters.floor} onChange={handleFilterChange} disabled={!filters.wing} className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-[13px] font-bold outline-none disabled:opacity-50">
                  <option value="">All Floors</option>
                  {floors.map(f => <option key={f.floor_id} value={f.floor_id}>Floor {f.floor_number}</option>)}
                </select>
                <select name="flat" value={filters.flat} onChange={handleFilterChange} disabled={!filters.floor} className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-[13px] font-bold outline-none disabled:opacity-50">
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
                    {members.length > 0 ? (
                      members.map((member) => (
                        <tr key={member.user_id} className="hover:bg-slate-50/50 transition-all">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-[#004ac6] font-bold text-xs">
                                {(member.firstName?.[0] || member.email?.[0] || '?').toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-[#0b1c30] text-[14px]">{member.firstName} {member.lastName}</p>
                                <p className="text-[12px] text-[#565e74] font-bold">{member.wing_name}-{member.flat_number}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-[13px] text-[#0b1c30] font-bold">{member.email}</div>
                            <div className="text-[11px] text-[#565e74] font-bold">{member.phoneNumber}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={clsx(
                              "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider",
                              (member.status || 'inactive') === 'active' ? 'bg-green-50 text-green-700' : (member.status || 'inactive') === 'pending_onboarding' ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'
                            )}>
                              <span className={clsx("w-1 h-1 rounded-full", (member.status || 'inactive') === 'active' ? 'bg-green-500' : (member.status || 'inactive') === 'pending_onboarding' ? 'bg-yellow-500' : 'bg-red-500')}></span>
                              {(member.status || 'inactive').replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={clsx("px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider", member.userType === 'societyAdmin' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500')}>
                              {member.userType === 'societyAdmin' ? 'Admin' : 'Member'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-4 items-center">
                              <button onClick={() => { setEditingMember(member); setIsModalOpen(true); }} className="text-[11px] font-bold text-[#004ac6] uppercase tracking-widest hover:underline">View Profile</button>
                              <button onClick={() => handleMakeAdmin(member)} className="p-1.5 text-slate-300 hover:text-blue-600 transition-all disabled:opacity-20" disabled={!!(member.userType === 'societyAdmin' || (promotingUserId !== null && promotingUserId === member.user_id))}><Shield className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-300 font-bold uppercase text-[12px] tracking-widest">No members found matching criteria</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                <span>Showing {members.length} of {totalItems} Results</span>
                <div className="flex gap-2">
                  <button onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0} className="p-1.5 hover:bg-white hover:shadow-sm rounded-md disabled:opacity-30 transition-all"><ChevronLeft className="w-4 h-4" /></button>
                  <button onClick={() => setCurrentPage(p => p + 1)} disabled={(currentPage + 1) * itemsPerPage >= totalItems} className="p-1.5 hover:bg-white hover:shadow-sm rounded-md disabled:opacity-30 transition-all"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'Total Members', value: totalMembersVal, color: 'text-slate-600', bg: 'bg-slate-400' },
                { label: 'Active', value: activeMembersVal, color: 'text-green-600', bg: 'bg-green-500' },
                { label: 'Pending', value: pendingMembersVal, color: 'text-yellow-600', bg: 'bg-yellow-500' },
                { label: 'Inactive', value: inactiveMembersVal, color: 'text-red-600', bg: 'bg-red-500' }
              ].map(stat => (
                <div key={stat.label} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                  <h3 className={clsx("text-2xl font-bold", stat.color)}>{stat.value}</h3>
                  <div className="mt-4 h-1 bg-slate-50 rounded-full overflow-hidden">
                    <div className={clsx("h-full rounded-full transition-all duration-700", stat.bg)} style={{ width: `${totalMembersVal ? (stat.value / totalMembersVal) * 100 : 0}%` }}></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                <h3 className="text-[14px] font-bold mb-6 border-b border-slate-50 pb-4 uppercase tracking-widest text-slate-400">Role Distribution</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3"><Shield className="w-5 h-5 text-blue-600" /> <span className="font-bold text-[13px]">Admins</span></div>
                    <span className="text-xl font-bold">{adminCount}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3"><Users className="w-5 h-5 text-slate-600" /> <span className="font-bold text-[13px]">Residents</span></div>
                    <span className="text-xl font-bold">{memberCount}</span>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                <h3 className="text-[14px] font-bold mb-6 border-b border-slate-50 pb-4 uppercase tracking-widest text-slate-400">Members by Wing</h3>
                <div className="space-y-4 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                  {Object.entries(wingStats).map(([wing, count]) => (
                    <div key={wing} className="space-y-1">
                      <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500"><span>{wing}</span> <span>{count}</span></div>
                      <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full" style={{ width: `${totalMembersVal ? (count / Math.max(...Object.values(wingStats))) * 100 : 0}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Global Modals */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0b1c30]/20 backdrop-blur-md">
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-100">
                <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-200"><Plus className="w-5 h-5 text-white" /></div>
                    <h3 className="text-xl font-bold">{editingMember ? 'Update Profile' : 'New Member'}</h3>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all"><X className="w-5 h-5 text-slate-400" /></button>
                </div>

                <div className="p-8">
                  {modalLoading ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-4">
                      <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                      <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Loading Member Context...</p>
                    </div>
                  ) : (
                    <form onSubmit={handleSave} className="space-y-8">
                      <div className="flex gap-4 p-1 bg-slate-50 rounded-xl w-fit border border-slate-100">
                        {['basic', 'location', 'access'].map((step) => (
                          <button
                            key={step}
                            type="button"
                            onClick={() => setModalStep(step as any)}
                            className={clsx(
                              "px-5 py-2 text-[11px] font-bold rounded-lg transition-all uppercase tracking-widest",
                              modalStep === step ? "bg-white text-blue-600 shadow-sm" : "text-slate-400"
                            )}
                          >
                            {step}
                          </button>
                        ))}
                      </div>

                      <div className="max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                        {modalStep === 'basic' && (
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">First Name</label>
                              <input name="firstName" defaultValue={editingMember?.firstName} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[14px] font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all" />
                              {formErrors.firstName && <p className="text-[10px] text-red-500 font-bold uppercase">{formErrors.firstName}</p>}
                            </div>
                            <div className="space-y-2">
                              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Last Name</label>
                              <input name="lastName" defaultValue={editingMember?.lastName} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[14px] font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all" />
                              {formErrors.lastName && <p className="text-[10px] text-red-500 font-bold uppercase">{formErrors.lastName}</p>}
                            </div>
                            <div className="col-span-2 space-y-2">
                              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
                              <input type="email" name="email" defaultValue={editingMember?.email} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[14px] font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all" />
                              {formErrors.email && <p className="text-[10px] text-red-500 font-bold uppercase">{formErrors.email}</p>}
                            </div>
                            <div className="col-span-2 space-y-2">
                              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Phone Number</label>
                              <input type="tel" name="phone" defaultValue={editingMember?.phoneNumber} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[14px] font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all" />
                            </div>
                          </div>
                        )}

                        {modalStep === 'location' && (
                          <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-2">
                              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Assign Wing</label>
                              <select value={modalWing} onChange={handleModalWingChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[14px] font-bold outline-none focus:bg-white focus:border-blue-600 transition-all">
                                <option value="">Select Wing</option>
                                {wings.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                              </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Floor</label>
                                <select value={modalFloor} onChange={handleModalFloorChange} disabled={!modalWing} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[14px] font-bold outline-none disabled:opacity-30">
                                  <option value="">Select Floor</option>
                                  {modalFloors.map(f => <option key={f.floor_id} value={f.floor_id}>Floor {f.floor_number}</option>)}
                                </select>
                              </div>
                              <div className="space-y-2">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Flat Unit</label>
                                <select value={modalFlat} onChange={handleModalFlatChange} disabled={!modalFloor} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[14px] font-bold outline-none disabled:opacity-30">
                                  <option value="">Select Flat</option>
                                  {modalFlats.map(f => <option key={f.flat_id} value={f.flat_id}>{f.flat_number}</option>)}
                                </select>
                              </div>
                            </div>
                          </div>
                        )}

                        {modalStep === 'access' && (
                          <div className="space-y-6">
                            {promotingUserId && (
                              <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-xl">
                                <p className="text-[12px] font-bold text-yellow-700 uppercase tracking-wide">Promotion Notice</p>
                                <p className="text-[12px] text-yellow-600 mt-1">You are upgrading this member to a Society Admin. Please configure their module permissions below.</p>
                                {!promotionConfirmed && (
                                  <button type="button" onClick={() => setPromotionConfirmed(true)} className="mt-3 text-[11px] font-bold text-yellow-800 underline uppercase tracking-widest">Confirm Promotion Intent</button>
                                )}
                              </div>
                            )}

                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                              <div className="flex items-center gap-3">
                                <ShieldPlus className="w-5 h-5 text-blue-600" />
                                <span className="text-[14px] font-bold">Account Role</span>
                              </div>
                              <select value={selectedRole} onChange={e => setSelectedRole(e.target.value as any)} className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-[13px] font-bold outline-none shadow-sm">
                                <option value="member">Resident</option>
                                <option value="societyAdmin">Society Admin</option>
                              </select>
                            </div>

                            {selectedRole === 'societyAdmin' && (
                              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="space-y-3">
                                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Wing Visibility</label>
                                  <div className="flex gap-4">
                                    <button type="button" onClick={() => { setAdminWingAccessAll(true); setAdminWingAccessIds([]); }} className={clsx("flex-1 py-3 rounded-xl border font-bold text-[13px] transition-all", adminWingAccessAll ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-slate-100 text-slate-400")}>Global Access</button>
                                    <button type="button" onClick={() => setAdminWingAccessAll(false)} className={clsx("flex-1 py-3 rounded-xl border font-bold text-[13px] transition-all", !adminWingAccessAll ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-slate-100 text-slate-400")}>Scoped Access</button>
                                  </div>
                                  {!adminWingAccessAll && (
                                    <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                      {wings.map(w => (
                                        <label key={w.id} className="flex items-center gap-2 p-2 hover:bg-white rounded-lg cursor-pointer transition-all">
                                          <input type="checkbox" checked={adminWingAccessIds.includes(String(w.id))} onChange={() => toggleAccessWing(String(w.id))} className="w-4 h-4 rounded border-slate-200 text-blue-600" />
                                          <span className="text-[12px] font-bold text-slate-600">{w.name}</span>
                                        </label>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <div className="space-y-3">
                                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Module Access Grid</label>
                                  <div className="space-y-2">
                                    {renderModuleRow('staff', 'Staff Management')}
                                    {renderModuleRow('notices', 'Digital Notices')}
                                    {renderModuleRow('task', 'Work Requests')}
                                    {renderModuleRow('complaints', 'Help Desk')}
                                    {renderModuleRow('voting', 'E-Voting')}
                                    {renderModuleRow('memberManagement', 'Directory Control')}
                                    {renderModuleRow('amenity', 'Facility Booking')}
                                    {renderModuleRow('billing', 'Financials')}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-4 pt-4">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3.5 bg-slate-100 text-slate-500 rounded-2xl font-bold text-[14px] hover:bg-slate-200 transition-all">Discard</button>
                        {modalStep !== 'basic' && (
                          <button type="button" onClick={goToPrevStep} className="flex-1 py-3.5 bg-slate-50 text-slate-600 border border-slate-100 rounded-2xl font-bold text-[14px] hover:bg-white transition-all">Previous</button>
                        )}
                        {modalStep !== 'access' ? (
                          <button type="button" onClick={goToNextStep} className="flex-[2] py-3.5 bg-blue-600 text-white rounded-2xl font-bold text-[14px] hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all">Continue to Next Step</button>
                        ) : (
                          <button type="submit" disabled={!!(isProcessing || (selectedRole === 'societyAdmin' && promotingUserId !== null && !promotionConfirmed))} className="flex-[2] py-3.5 bg-blue-600 text-white rounded-2xl font-bold text-[14px] hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all disabled:opacity-50">{isProcessing ? 'Synchronising...' : (editingMember ? 'Update Profile' : 'Complete Onboarding')}</button>
                        )}
                      </div>
                    </form>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Import Modal */}
        <AnimatePresence>
          {isImportModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0b1c30]/20 backdrop-blur-md">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl border border-slate-100">
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg"><Upload className="w-5 h-5 text-blue-600" /></div>
                    <h3 className="text-xl font-bold">Bulk Import</h3>
                  </div>
                  <button onClick={() => setIsImportModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-full"><XCircle className="w-6 h-6 text-slate-200" /></button>
                </div>

                <div className="space-y-8">
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-4">
                    <Download className="w-6 h-6 text-blue-600" />
                    <div className="space-y-1">
                      <p className="font-bold text-slate-800 text-[14px]">Standard Template</p>
                      <p className="text-[12px] text-slate-500 font-medium">Download the required structure to ensure data parity.</p>
                      <button onClick={downloadTemplate} className="mt-2 text-[11px] font-bold text-blue-600 hover:underline uppercase tracking-widest">Get CSV Schema</button>
                    </div>
                  </div>

                  <div className="border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center hover:bg-slate-50 transition-all cursor-pointer relative group">
                    <input type="file" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                    <div className="p-4 bg-slate-100 rounded-2xl w-fit mx-auto mb-4 group-hover:bg-white transition-all shadow-sm">
                      <Upload className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="font-bold text-[14px] text-slate-600">{selectedFile ? selectedFile.name : 'Upload your dataset'}</p>
                    <p className="text-[11px] text-slate-400 mt-1 font-bold uppercase tracking-widest">CSV Files Only</p>
                  </div>

                  <div className="flex gap-4">
                    <button onClick={() => setIsImportModalOpen(false)} className="flex-1 py-3.5 bg-slate-100 text-slate-500 rounded-2xl font-bold text-[14px]">Discard</button>
                    <button onClick={handleImportSubmit} disabled={!selectedFile || isProcessing} className="flex-[2] py-3.5 bg-blue-600 text-white rounded-2xl font-bold text-[14px] disabled:opacity-50 shadow-lg shadow-blue-100 transition-all">Start Batch Process</button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
};

export default MembersPage;