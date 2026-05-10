'use client';

import { useState, useEffect, ChangeEvent, FormEvent, useCallback } from 'react';
import {
  getSocietyMembers,
  addSocietyMember,
  updateSocietyMember,
  // deleteSocietyMember,
  // updateMemberStatus,
  getWings,
  getFloors,
  getFlats,
  Wing,
  Floor,
  Flat,
  importMembers,
  getMembersDashboardStats,
  makeMemberSocietyAdmin,
} from '@/lib/societyAdminClient';
import {
  Search,
  Filter,
  Plus,
  Edit,
  // Trash,
  // ToggleLeft,
  // ToggleRight,
  Upload,
  Download,
  Shield,
} from 'lucide-react';
import { toast } from 'react-toastify';
import clsx from 'clsx';
import { debounce } from 'lodash';

// Define the SocietyMember type to match the API response
interface SocietyMember {
  user_id: number;
  first_name?: string;
  last_name?: string;
  email: string;
  phone_number: string;
  status: 'active' | 'pending_onboarding' | 'inactive';
  userType: 'member' | 'societyAdmin';
  wing_id: string | number;
  floor_id: string | number;
  flat_id: string | number;
  flat_number: string;
  wing_name?: string;
  floor_number?: number;
  IAM?: string;
  member_type?: string;
  total?: number;
}

type Filters = {
  search: string;
  wing: string;
  floor: string;
  flat: string;
};

type FormErrors = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  wing?: string;
  floor?: string;
  flat?: string;
  role?: string;
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
  const [promotingUserId, setPromotingUserId] = useState<number | null>(null);
  const [promotionConfirmed, setPromotionConfirmed] = useState<boolean>(false);
  // New: Tab state for Members and Dashboard
  const [activeTab, setActiveTab] = useState<'members' | 'dashboard'>('members');
  // New: Backend dashboard stats
  const [membersStats, setMembersStats] = useState<{
    totalUsers: number;
    newUsers: number;
    activeUsers: number;
    pendingApprovals: number;
    trends?: {
      totalUsers: number;
      newUsers: number;
      activeUsers: number;
      pendingApprovals: number;
    };
  } | null>(null);
  const [wings, setWings] = useState<Wing[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [flats, setFlats] = useState<Flat[]>([]);

  // Modal filter data
  const [modalWing, setModalWing] = useState('');
  const [modalFloor, setModalFloor] = useState('');
  const [modalFlat, setModalFlat] = useState('');
  const [modalFloors, setModalFloors] = useState<Floor[]>([]);
  const [modalFlats, setModalFlats] = useState<Flat[]>([]);
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

  // Debounced fetchData
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

      if (response.success) {
        let membersData: SocietyMember[] = [];
        let totalCount = 0;
        const payload = response.data as unknown;
        if (Array.isArray(payload)) {
          membersData = payload as SocietyMember[];
          totalCount = response.total || 0;
        } else if (
          payload &&
          typeof payload === 'object' &&
          'data' in (payload as { data?: SocietyMember[]; total?: number }) &&
          Array.isArray((payload as { data?: SocietyMember[]; total?: number }).data)
        ) {
          const obj = payload as { data?: SocietyMember[]; total?: number };
          membersData = obj.data || [];
          totalCount = typeof obj.total === 'number' ? obj.total : (response.total || 0);
        }
        setMembers(membersData);
        setTotalItems(totalCount);
      }
    } catch (err) {
      toast.error('Failed to load members');
      console.error('Error loading members:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters, sortField, sortOrder, itemsPerPage]);

  // Debounced search handler
  const debouncedFetchData = useCallback(
    debounce(() => {
      fetchData();
    }, 500),
    [fetchData]
  );

  const fetchWings = async () => {
    try {
      const wingsData = await getWings();
      setWings(wingsData);
    } catch (err) {
      toast.error('Failed to load wings');
      console.error('Error fetching wings:', err);
    }
  };

  const fetchFloors = async (wingId: string) => {
    try {
      if (!wingId) {
        setFloors([]);
        setFlats([]);
        return;
      }
      const floorsData = await getFloors(wingId);
      setFloors(floorsData);
    } catch (err) {
      toast.error('Failed to load floors');
      console.error('Error fetching floors:', err);
    }
  };

  const fetchFlats = async (wingId: string, floorId: string) => {
    try {
      if (!wingId || !floorId) {
        setFlats([]);
        return;
      }
      const flatsData = await getFlats(wingId, floorId);
      setFlats(flatsData);
    } catch (err) {
      toast.error('Failed to load flats');
      console.error('Error fetching flats:', err);
    }
  };

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

  const fetchModalFlats = async (wingId: string, floorId: string) => {
    try {
      if (!wingId || !floorId) {
        setModalFlats([]);
        setModalFlat('');
        return [];
      }
      const flatsData = await getFlats(wingId, floorId);
      setModalFlats(flatsData);
      return flatsData;
    } catch (err) {
      toast.error('Failed to load flats');
      console.error('Error fetching flats:', err);
      return [];
    }
  };

  useEffect(() => {
    fetchWings();
  }, []);

  useEffect(() => {
    if (filters.wing) {
      fetchFloors(filters.wing);
    } else {
      setFloors([]);
      setFlats([]);
    }
  }, [filters.wing]);

  useEffect(() => {
    if (filters.wing && filters.floor) {
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
          const wingId = String(editingMember.wing_id);
          setModalWing(wingId);
          if (wingId) {
            const floors = await fetchModalFloors(wingId);
            const floorId = String(editingMember.floor_id);
            setModalFloor(floorId);
            if (floorId && floors.some(f => String(f.floor_id) === floorId)) {
              await fetchModalFlats(wingId, floorId);
              setModalFlat(String(editingMember.flat_id));
            }
          }
        } catch (error) {
          console.error('Error loading member data:', error);
        } finally {
          setModalLoading(false);
        }
      };
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
  }, [isModalOpen, editingMember]);

  const handleFilterChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'wing' && { floor: '', flat: '' }),
      ...(name === 'floor' && { flat: '' }),
    }));
    setCurrentPage(0);
  };

  const handleSort = (field: 'name' | 'email') => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Removed: handleDelete (delete functionality disabled)
  // const handleDelete = async (user_id: number) => {
  //   if (confirm('Are you sure you want to delete this member?')) {
  //     try {
  //       const response = await deleteSocietyMember(user_id);
  //       if (response.success) {
  //         toast.success('Member deleted successfully');
  //         fetchData();
  //       }
  //     } catch (error) {
  //       toast.error('Failed to delete member');
  //       console.error('Failed to delete member:', error);
  //     }
  //   }
  // };

  // Removed: handleStatusToggle (status toggle disabled)
  // const handleStatusToggle = async (user_id: number) => {
  //   const member = members.find((m) => m.user_id === user_id);
  //   if (!member) return;
  //   const newStatus = member.status === 'active' ? 'inactive' : 'active';
  //   try {
  //     const response = await updateMemberStatus(user_id, newStatus);
  //     if (response.success) {
  //       toast.success(`Member ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
  //       fetchData();
  //     }
  //   } catch (error) {
  //     toast.error('Failed to update status');
  //     console.error('Status toggle failed:', error);
  //   }
  // };

  const handleAdd = () => {
    setEditingMember(null);
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
    const wingName = m.wing_name || (wings.find(w => String(w.id) === String(m.wing_id))?.name) || 'Unknown';
    acc[wingName] = (acc[wingName] || 0) + 1;
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600 text-base font-medium animate-pulse">Loading members...</div>
      </div>
    );
  }

  return (
    <main className="flex-1 bg-gray-50 min-h-[calc(100vh-4rem)] p-4">
      <div className="space-y-4">
        {/* Tab Navigation */}
        <div className="bg-white/90 backdrop-blur-sm rounded-lg border border-gray-100 p-2 shadow-sm">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('members')}
              className={clsx(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                activeTab === 'members' ? 'bg-blue-500 text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              Members
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={clsx(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                activeTab === 'dashboard' ? 'bg-blue-500 text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              Dashboard
            </button>
          </div>
        </div>

        {/* Members Tab Content */}
        {activeTab === 'members' && (
          <>
            {/* Filter Section */}
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="bg-white/90 backdrop-blur-sm rounded-lg border border-gray-100 p-3 shadow-sm">
                {/* existing filter inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-gray-100 rounded-md flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
                      <Search className="w-4 h-4 text-gray-600" />
                    </div>
                    <input
                      type="text"
                      name="search"
                      placeholder="Search by name or email"
                      value={filters.search}
                      onChange={handleFilterChange}
                      className="w-full p-1.5 bg-transparent border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400 text-sm"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-gray-100 rounded-md flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
                      <Filter className="w-4 h-4 text-gray-600" />
                    </div>
                    <select
                      name="wing"
                      value={filters.wing}
                      onChange={handleFilterChange}
                      className="w-full p-1.5 bg-transparent border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400 text-sm"
                    >
                      <option value="">All Wings</option>
                      {wings.map((wing) => (
                        <option key={wing.id} value={wing.id}>
                          {wing.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-gray-100 rounded-md flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
                      <Filter className="w-4 h-4 text-gray-600" />
                    </div>
                    <select
                      name="floor"
                      value={filters.floor}
                      onChange={handleFilterChange}
                      disabled={!filters.wing}
                      className="w-full p-1.5 bg-transparent border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:opacity-50 text-sm"
                    >
                      <option value="">All Floors</option>
                      {floors.map((floor) => (
                        <option key={floor.floor_id} value={floor.floor_id}>
                          Floor {floor.floor_number}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-gray-100 rounded-md flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
                      <Filter className="w-4 h-4 text-gray-600" />
                    </div>
                    <select
                      name="flat"
                      value={filters.flat}
                      onChange={handleFilterChange}
                      disabled={!filters.floor}
                      className="w-full p-1.5 bg-transparent border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:opacity-50 text-sm"
                    >
                      <option value="">All Flats</option>
                      {flats.map((flat) => (
                        <option key={flat.flat_id} value={flat.flat_id}>
                          {wings.find(w => String(w.id) === String(filters.wing))?.name || 'N/A'}-{flat.flat_number}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 mt-3 justify-end">
                  <button
                    onClick={handleAdd}
                    className="group flex items-center gap-1.5 bg-blue-500 text-white px-2.5 py-1.5 rounded-md hover:bg-blue-600 hover:shadow-md transition-all duration-200 text-sm"
                  >
                    <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span>Add Member</span>
                  </button>
                  <button
                    onClick={() => setIsImportModalOpen(true)}
                    className="group flex items-center gap-1.5 bg-emerald-500 text-white px-2.5 py-1.5 rounded-md hover:bg-emerald-600 hover:shadow-md transition-all duration-200 text-sm"
                  >
                    <Upload className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span>Import Members</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Members Table */}
            <div className="bg-white/90 backdrop-blur-sm rounded-lg border border-gray-100 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        onClick={() => handleSort('name')}
                        className="px-3 py-2 text-left text-xs font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center">
                          Name
                          {sortField === 'name' && (
                            <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('email')}
                        className="px-3 py-2 text-left text-xs font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center">
                          Email
                          {sortField === 'email' && (
                            <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-900">Flat</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-900">Status</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-900">Role</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {members.length > 0 ? (
                      members.map((member) => (
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
                            <div className="text-sm text-gray-500">
                              {member.wing_name || wings.find(w => String(w.id) === String(member.wing_id))?.name || 'N/A'}-{member.flat_number}
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
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div className="bg-white/90 backdrop-blur-sm rounded-lg border border-gray-100 p-3 flex items-center justify-between shadow-sm">
              <div className="text-sm text-gray-500">
                Showing{' '}
                <span className="font-medium">{(currentPage * itemsPerPage) + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min((currentPage + 1) * itemsPerPage, totalItems)}
                </span>{' '}
                of <span className="font-medium">{totalItems}</span> members
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 0))}
                  disabled={currentPage === 0}
                  className="px-2.5 py-1 bg-gray-100 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50 transition-all duration-200"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((p) =>
                      Math.min(p + 1, Math.floor((totalItems - 1) / itemsPerPage))
                    )
                  }
                  disabled={(currentPage + 1) * itemsPerPage >= totalItems}
                  className="px-2.5 py-1 bg-gray-100 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50 transition-all duration-200"
                >
                  Next
                </button>
              </div>
            </div>

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
            )}

            {/* Import Members Modal */}
            {isImportModalOpen && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden m-4">
                  <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
                  <div className="p-4">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Import Members</h2>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-600 mb-3">
                          Import members from a CSV or Excel file. Download the template file to ensure proper formatting.
                        </p>
                        <div className="flex justify-center mb-3">
                          <button
                            onClick={downloadTemplate}
                            className="group flex items-center gap-1.5 bg-blue-500 text-white px-2.5 py-1 rounded-md hover:bg-blue-600 hover:shadow-md transition-all duration-200 text-sm"
                          >
                            <Download className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            <span>Download Template</span>
                          </button>
                        </div>
                        <div className="border-2 border-dashed border-gray-200 rounded-md p-4 text-center">
                          <Upload className="w-6 h-6 mx-auto text-gray-400" />
                          <p className="mt-2 text-xs text-gray-600">
                            Drag and drop your file here, or click to browse
                          </p>
                          <input
                            type="file"
                            accept=".csv,.xlsx,.xls"
                            className="hidden"
                            id="csv-upload"
                            onChange={handleFileUpload}
                          />
                          <label
                            htmlFor="csv-upload"
                            className="mt-2 inline-flex items-center px-2.5 py-1 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600 hover:shadow-md transition-all duration-200 cursor-pointer"
                          >
                            Select File
                          </label>
                          {selectedFile && (
                            <p className="mt-2 text-xs text-gray-600">
                              Selected: {selectedFile.name}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2 pt-3">
                        <button
                          type="button"
                          onClick={() => {
                            setIsImportModalOpen(false);
                            setSelectedFile(null);
                          }}
                          className="px-2.5 py-1 bg-gray-100 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50 transition-all duration-200"
                          disabled={isProcessing}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleImportSubmit}
                          disabled={!selectedFile || isProcessing}
                          className={clsx(
                            'px-2.5 py-1 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600 hover:shadow-md transition-all duration-200',
                            { 'opacity-50 cursor-not-allowed': !selectedFile || isProcessing }
                          )}
                        >
                          {isProcessing ? 'Importing...' : 'Import Members'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

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
              </div>
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