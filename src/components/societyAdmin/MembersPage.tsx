'use client';

import { useState, useEffect, ChangeEvent, FormEvent, useCallback } from 'react';
import {
  getSocietyMembers,
  SocietyMember,
  addSocietyMember,
  updateSocietyMember,
  deleteSocietyMember,
  updateMemberStatus,
  getWings,
  getFloors,
  getFlats,
  Wing,
  Floor,
  Flat,
  importMembers,
} from '@/lib/societyAdminClient';
import {
  Users,
  Search,
  Filter,
  Plus,
  Edit,
  Trash,
  ToggleLeft,
  ToggleRight,
  Upload,
  Download,
} from 'lucide-react';
import { toast } from 'react-toastify';

type Filters = {
  search: string;
  wing: string;
  floor: string;
  flat: string;
  status: string;
};

const MembersPage = () => {
  const [members, setMembers] = useState<SocietyMember[]>([]);
  const [filters, setFilters] = useState<Filters>({
    search: '',
    wing: '',
    floor: '',
    flat: '',
    status: '',
  });
  const [loading, setLoading] = useState(true);
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

  // Filter data
  const [wings, setWings] = useState<Wing[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [flats, setFlats] = useState<Flat[]>([]);
  const [statuses] = useState<string[]>(['active', 'inactive', 'pending_onboarding']);

  // Modal filter data
  const [modalWing, setModalWing] = useState('');
  const [modalFloor, setModalFloor] = useState('');
  const [modalFloors, setModalFloors] = useState<Floor[]>([]);
  const [modalFlats, setModalFlats] = useState<Flat[]>([]);

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
        status: filters.status,
        sortField,
        sortOrder,
      });

      if (response.success && Array.isArray(response.data)) {
        setMembers(response.data);
        setTotalItems(response.total || 0);
      }
    } catch (err) {
      toast.error('Failed to load members');
      console.error('Error loading members:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters, sortField, sortOrder, itemsPerPage]);

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
      if (!wingId) return [];
      const floorsData = await getFloors(wingId);
      setModalFloors(floorsData);
      return floorsData;
    } catch (err) {
      toast.error('Failed to load floors');
      console.error('Error fetching floors:', err);
      return [];
    }
  };

  const fetchModalFlats = async (wingId: string, floorId: string) => {
    try {
      if (!wingId || !floorId) return [];
      const flatsData = await getFlats(wingId, floorId);
      setModalFlats(flatsData);
      return flatsData;
    } catch (err) {
      toast.error('Failed to load flats');
      console.error('Error fetching flats:', err);
      return [];
    }
  };

  // Initialize data
  useEffect(() => {
    fetchWings();
  }, []);

  // Handle wing filter change
  useEffect(() => {
    if (filters.wing) {
      fetchFloors(filters.wing);
    } else {
      setFloors([]);
      setFlats([]);
    }
  }, [filters.wing]);

  // Handle floor filter change
  useEffect(() => {
    if (filters.wing && filters.floor) {
      fetchFlats(filters.wing, filters.floor);
    } else {
      setFlats([]);
    }
  }, [filters.floor]);

  // Fetch data when filters or pagination changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Initialize modal with member data when editing
  useEffect(() => {
    if (isModalOpen && editingMember) {
      setModalWing(editingMember.wing_id || '');
      setModalFloor(editingMember.floor_id || '');
      
      const fetchEditingMemberData = async () => {
        if (editingMember.wing_id) {
          await fetchModalFloors(editingMember.wing_id);
          if (editingMember.floor_id) {
            await fetchModalFlats(editingMember.wing_id, editingMember.floor_id);
          }
        }
      };
      
      fetchEditingMemberData();
    } else if (isModalOpen) {
      setModalWing('');
      setModalFloor('');
      setModalFloors([]);
      setModalFlats([]);
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

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this member?')) {
      try {
        const response = await deleteSocietyMember(id);
        if (response.success) {
          toast.success('Member deleted successfully');
          fetchData();
        }
      } catch (error) {
        toast.error('Failed to delete member');
        console.error('Failed to delete member:', error);
      }
    }
  };

  const handleStatusToggle = async (id: number) => {
    const member = members.find((m) => m.id === id);
    if (!member) return;
    const newStatus = member.status === 'active' ? 'inactive' : 'active';
    try {
      const response = await updateMemberStatus(id, newStatus);
      if (response.success) {
        toast.success(`Member ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
        fetchData();
      }
    } catch (error) {
      toast.error('Failed to update status');
      console.error('Status toggle failed:', error);
    }
  };

  const handleAdd = () => {
    setEditingMember(null);
    setIsModalOpen(true);
  };

  const handleModalWingChange = async (e: ChangeEvent<HTMLSelectElement>) => {
    const wingId = e.target.value;
    setModalWing(wingId);
    setModalFloor('');
    setModalFlats([]);
    if (wingId) {
      await fetchModalFloors(wingId);
    }
  };

  const handleModalFloorChange = async (e: ChangeEvent<HTMLSelectElement>) => {
    const floorId = e.target.value;
    setModalFloor(floorId);
    if (modalWing && floorId) {
      await fetchModalFlats(modalWing, floorId);
    } else {
      setModalFlats([]);
    }
  };

  const handleSave = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const memberData = {
      first_name: formData.get('firstName') as string,
      last_name: formData.get('lastName') as string,
      email: formData.get('email') as string,
      phone_number: formData.get('phone') as string,
      member_type: formData.get('role') as string,
      wing_id: modalWing,
      floor_id: modalFloor,
      flat_id: formData.get('flat') as string,
    };

    try {
      setIsProcessing(true);
      if (editingMember) {
        const response = await updateSocietyMember(editingMember.id, {
          ...memberData,
          status: editingMember.status,
          name: `${memberData.first_name} ${memberData.last_name}`,
          role: memberData.member_type,
          flat_number: modalFlats.find(f => f.flat_id === memberData.flat_id)?.flat_number || ''
        });
        if (response.success) {
          toast.success('Member updated successfully');
          setIsModalOpen(false);
          fetchData();
        }
      } else {
        const response = await addSocietyMember({
          ...memberData,
          status: 'active',
          name: `${memberData.first_name} ${memberData.last_name}`,
          flat_number: modalFlats.find(f => f.flat_id === memberData.flat_id)?.flat_number || '',
          role: memberData.member_type
        });
        if (response.success) {
          toast.success('Member added successfully');
          setIsModalOpen(false);
          fetchData();
        }
      }
    } catch (error) {
      toast.error('Failed to save member');
      console.error('Failed to save member:', error);
    } finally {
      setIsProcessing(false);
    }
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

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600 text-lg font-medium">Loading members...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
        <Users className="w-8 h-8 text-blue-600 mr-3" />
        <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Members
        </span>
      </h1>

      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        {/* Filter Section */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-gray-600" />
            <input
              type="text"
              name="search"
              placeholder="Search by name or email"
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <select
              name="wing"
              value={filters.wing}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <Filter className="w-5 h-5 text-gray-600" />
            <select
              name="floor"
              value={filters.floor}
              onChange={handleFilterChange}
              disabled={!filters.wing}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
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
            <Filter className="w-5 h-5 text-gray-600" />
            <select
              name="flat"
              value={filters.flat}
              onChange={handleFilterChange}
              disabled={!filters.floor}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <option value="">All Flats</option>
              {flats.map((flat) => (
                <option key={flat.flat_id} value={flat.flat_id}>
                  Flat {flat.flat_number}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition duration-200 text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>

            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center justify-center gap-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition duration-200 text-sm"
            >
              <Upload className="w-4 h-4" />
              <span>Import</span>
            </button>
          </div>
        </div>

        {/* Members Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  onClick={() => handleSort('name')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
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
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center">
                    Email
                    {sortField === 'email' && (
                      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Flat
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Admin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {members.length > 0 ? (
                members.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{member.first_name} {member.last_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{member.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{member.flat_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          member.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : member.status === 'pending_onboarding'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        member.role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {member.role === 'admin' ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setEditingMember(member);
                            setIsModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(member.id)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          title="Delete"
                        >
                          <Trash className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleStatusToggle(member.id)}
                          className="text-gray-600 hover:text-gray-900 transition-colors"
                          title={member.status === 'active' ? 'Deactivate' : 'Activate'}
                        >
                          {member.status === 'active' ? (
                            <ToggleLeft className="w-5 h-5" />
                          ) : (
                            <ToggleRight className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    No members found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
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
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
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
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Add/Edit Member Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingMember ? 'Edit Member' : 'Add Member'}
              </h2>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      defaultValue={editingMember?.first_name || ''}
                      required
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      defaultValue={editingMember?.last_name || ''}
                      required
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    defaultValue={editingMember?.email || ''}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Wing
                    </label>
                    <select
                      name="wing"
                      value={modalWing}
                      onChange={handleModalWingChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Wing</option>
                      {wings.map((wing) => (
                        <option key={wing.id} value={wing.id}>
                          {wing.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Floor
                    </label>
                    <select
                      name="floor"
                      value={modalFloor}
                      onChange={handleModalFloorChange}
                      disabled={!modalWing}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      required
                    >
                      <option value="">Select Floor</option>
                      {modalFloors.map((floor) => (
                        <option key={floor.floor_id} value={floor.floor_id}>
                          Floor {floor.floor_number}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Flat
                    </label>
                    <select
                      name="flat"
                      defaultValue={editingMember?.flat_id || ''}
                      disabled={!modalFloor}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      required
                    >
                      <option value="">Select Flat</option>
                      {modalFlats.map((flat) => (
                        <option key={flat.flat_id} value={flat.flat_id}>
                          Flat {flat.flat_number}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      defaultValue={editingMember?.phone_number || ''}
                      required
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <select
                      name="role"
                      defaultValue={editingMember?.role || 'member'}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    disabled={isProcessing}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Processing...' : editingMember ? 'Update' : 'Add'} Member
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Import Members Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Import Members</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-4">
                    Import members from a CSV or Excel file. Download the template file to ensure proper formatting.
                  </p>
                  <div className="flex justify-center mb-4">
                    <button
                      onClick={downloadTemplate}
                      className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Template</span>
                    </button>
                  </div>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="w-10 h-10 mx-auto text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">
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
                      className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
                    >
                      Select File
                    </label>
                    {selectedFile && (
                      <p className="mt-2 text-sm text-gray-600">
                        Selected: {selectedFile.name}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsImportModalOpen(false);
                      setSelectedFile(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    disabled={isProcessing}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleImportSubmit}
                    disabled={!selectedFile || isProcessing}
                    className={`px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      !selectedFile || isProcessing ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isProcessing ? 'Importing...' : 'Import Members'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MembersPage;