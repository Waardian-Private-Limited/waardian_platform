'use client';

import { useState, useEffect } from 'react';
import { X, PlusCircle } from 'lucide-react';
import {
  fetchSocieties,
  createSociety,
  updateSociety,
  deleteSociety,
} from '@/lib/superadmincontroller';

const SocietyForm = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; address: string; adminEmail: string; status: string }) => void;
  initialData: { id?: number; name: string; address: string; adminEmail: string; status: string };
  isLoading: boolean;
}) => {
  const [name, setName] = useState(initialData.name);
  const [address, setAddress] = useState(initialData.address);
  const [adminEmail, setAdminEmail] = useState(initialData.adminEmail);
  const [status, setStatus] = useState(initialData.status || 'active');
  const [errors, setErrors] = useState({ name: '', address: '', adminEmail: '' });

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({ name: '', address: '', adminEmail: '' });

    if (!name) {
      setErrors((prev) => ({ ...prev, name: 'Society name is required' }));
      return;
    }
    if (!address) {
      setErrors((prev) => ({ ...prev, address: 'Address is required' }));
      return;
    }
    if (!adminEmail) {
      setErrors((prev) => ({ ...prev, adminEmail: 'Admin email is required' }));
      return;
    }
    if (!validateEmail(adminEmail)) {
      setErrors((prev) => ({ ...prev, adminEmail: 'Please enter a valid email address' }));
      return;
    }

    onSubmit({ name, address, adminEmail, status });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 w-full max-w-md shadow-sm">
        <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-2">
          <h2 className="text-xl font-semibold text-gray-900">
            {initialData.id ? 'Edit Society' : 'Add New Society'}
          </h2>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-800">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-900 mb-1 block">Society Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter society name"
              disabled={isLoading}
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="text-sm text-gray-900 mb-1 block">Address</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter society address"
              rows={3}
              disabled={isLoading}
            />
            {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
          </div>
          <div>
            <label className="text-sm text-gray-900 mb-1 block">Admin Email</label>
            <input
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter admin email"
              disabled={isLoading}
            />
            {errors.adminEmail && <p className="text-red-500 text-sm mt-1">{errors.adminEmail}</p>}
          </div>
          <div>
            <label className="text-sm text-gray-900 mb-1 block">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="expired">Expired</option>
            </select>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center bg-blue-600 text-white px-3 py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:bg-blue-400"
              disabled={isLoading}
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              {isLoading ? 'Saving...' : initialData.id ? 'Update Society' : 'Add Society'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Societies = ({
  societies,
  onAdd,
  onEdit,
  onDelete,
}: {
  societies: {
    id: number;
    name: string;
    address: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
    contact_number?: string;
    email?: string;
    registration_number?: string;
    registration_date?: string;
    type?: string;
    sampleFlatNumber?: string;
    createdAt: string;
    subscription_opted_id: number;
    status: string;
  }[];
  onAdd: () => void;
  onEdit: (society: any) => void;
  onDelete: (id: number) => void;
}) => {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900">Society Management</h3>
        <button
          onClick={onAdd}
          className="bg-blue-600 text-white px-3 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
        >
          Add Society
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-gray-600 border-b">
              <th className="p-3">ID</th>
              <th className="p-3">Name</th>
              <th className="p-3">Address</th>
              <th className="p-3">Status</th>
              <th className="p-3">Created At</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {societies.length === 0 ? (

              <tr>
                <td colSpan={6} className="p-3 text-center text-gray-600">
                  No societies found
                </td>
              </tr>
            ) : (
              societies.map((society) => (
                <>
                  {/* Main Row */}
                  <tr
                    key={society.id}
                    className="border-b hover:bg-gray-50 transition"
                  >
                    <td className="p-3">{society.id}</td>
                    <td className="p-3 font-medium">{society.name}</td>
                    <td className="p-3">{society.address}</td>
                    <td className="p-3">{society.status}</td>
                    <td className="p-3">
                      {new Date(society.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3 space-x-3">
                      <button
                        onClick={() =>
                          setExpandedRow(expandedRow === society.id ? null : society.id)
                        }
                        className="text-gray-700 hover:text-gray-900 underline"
                      >
                        {expandedRow === society.id ? 'Hide Details' : 'View Details'}
                      </button>
                      <button
                        onClick={() => onEdit(society)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(society.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>

                  {/* Expanded Row */}
                  {expandedRow === society.id && (
                    <tr className="bg-gray-50">
                      <td colSpan={6} className="p-4">
                        <div className="grid grid-cols-2 gap-3 text-sm text-gray-700">
                          <p><strong>Address Line 1:</strong> {society.address_line1 || '-'}</p>
                          <p><strong>Address Line 2:</strong> {society.address_line2 || '-'}</p>
                          <p><strong>City:</strong> {society.city || '-'}</p>
                          <p><strong>State:</strong> {society.state || '-'}</p>
                          <p><strong>Country:</strong> {society.country || '-'}</p>
                          <p><strong>Pincode:</strong> {society.pincode || '-'}</p>
                          <p><strong>Contact Number:</strong> {society.contact_number || '-'}</p>
                          <p><strong>Email:</strong> {society.email || '-'}</p>
                          <p><strong>Registration No:</strong> {society.registration_number || '-'}</p>
                          <p><strong>Registration Date:</strong> {society.registration_date ? new Date(society.registration_date).toLocaleDateString() : '-'}</p>
                          <p><strong>Type:</strong> {society.type || '-'}</p>
                          <p><strong>Sample Flat:</strong> {society.sampleFlatNumber || '-'}</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default function SuperadminSociety() {
  console.log('SuperadminSociety rendered');
  const [societies, setSocieties] = useState<
    { id: number; name: string; address: string; createdAt: string; subscription_opted_id: number; status: string }[]
  >([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<{ id?: number; name: string; address: string; adminEmail: string; status: string }>({
    name: '',
    address: '',
    adminEmail: '',
    status: 'active',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    console.log('SuperadminSociety useEffect triggered');
    fetchSocieties()
      .then((data) => {
        console.log('Fetched societies:', data);
        setSocieties(data);
        console.log('Updated societies state:', data);
      })
      .catch((err) => {
        console.error('Failed to fetch societies:', err);
        setError('Failed to load societies');
      });
  }, []);

  const handleAddSociety = () => {
    setFormData({ name: '', address: '', adminEmail: '', status: 'active' });
    setIsFormOpen(true);
  };

  const handleEditSociety = (society: { id: number; name: string; address: string; subscription_opted_id: number; status: string }) => {
    setFormData({ id: society.id, name: society.name, address: society.address, adminEmail: '', status: society.status });
    setIsFormOpen(true);
  };

  const handleDeleteSociety = async (id: number) => {
    if (!confirm('Are you sure you want to delete this society?')) return;
    setIsLoading(true);
    try {
      await deleteSociety(id);
      setSocieties(societies.filter((s) => s.id !== id));
    } catch (err) {
      setError('Failed to delete society');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = async (data: { name: string; address: string; adminEmail: string; status: string }) => {
    setError('');
    setIsLoading(true);
    try {
      if (formData.id) {
        await updateSociety(formData.id, data);
        setSocieties(
          societies.map((s) =>
            s.id === formData.id
              ? { ...s, ...data, subscription_opted_id: s.subscription_opted_id }
              : s
          )
        );
      } else {
        const response = await createSociety(data);
        setSocieties([
          ...societies,
          { id: response.id, ...data, createdAt: new Date().toISOString(), subscription_opted_id: response.subscription_opted_id || 0 },
        ]);
      }
      setIsFormOpen(false);
      setFormData({ name: '', address: '', adminEmail: '', status: 'active' });
    } catch (err) {
      setError('Failed to save society');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex-1 bg-gray-50 min-h-[calc(100vh-8rem)] p-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Society Management</h1>
      {error && (
        <p className="text-red-500 text-sm mb-4 bg-red-100 p-3 rounded-lg">{error}</p>
      )}
      <Societies
        societies={societies}
        onAdd={handleAddSociety}
        onEdit={handleEditSociety}
        onDelete={handleDeleteSociety}
      />
      <SocietyForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={formData}
        isLoading={isLoading}
      />
    </main>
  );
}
