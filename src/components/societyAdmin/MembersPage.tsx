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

interface Props {
  societyId: string;
}

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
    </main>
  );
};

export default MembersPage;