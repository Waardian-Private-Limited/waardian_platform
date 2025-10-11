'use client';

import { useState, useEffect } from 'react';
import { X, PlusCircle, Eye } from 'lucide-react';
import {
  fetchSocieties,
  createSociety,
  updateSociety,
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
  onSubmit: (data: { name: string; address: string; adminEmail: string; status: string; isTrial: boolean; trialMonths: number }) => void;
  initialData: { id?: number; name: string; address: string; adminEmail: string; status: string; isTrial?: boolean; trialMonths?: number };
  isLoading: boolean;
}) => {
  const [name, setName] = useState(initialData.name);
  const [address, setAddress] = useState(initialData.address);
  const [adminEmail, setAdminEmail] = useState(initialData.adminEmail);
  const [status, setStatus] = useState(initialData.status || 'active');
  const [isTrial, setIsTrial] = useState(initialData.isTrial || false);
  const [trialMonths, setTrialMonths] = useState(initialData.trialMonths || 1);
  const [errors, setErrors] = useState({ name: '', address: '', adminEmail: '', trialMonths: '' });

  useEffect(() => {
    setName(initialData.name);
    setAddress(initialData.address);
    setAdminEmail(initialData.adminEmail);
    setStatus(initialData.status || 'active');
    setIsTrial(initialData.isTrial || false);
    setTrialMonths(initialData.trialMonths || 1);
  }, [initialData]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({ name: '', address: '', adminEmail: '', trialMonths: '' });

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
    if (isTrial && (trialMonths < 1 || trialMonths > 12)) {
      setErrors((prev) => ({ ...prev, trialMonths: 'Trial period must be between 1 and 12 months' }));
      return;
    }

    onSubmit({ name, address, adminEmail, status, isTrial, trialMonths });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 w-full max-w-md shadow-sm">
        <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-2">
          <h2 className="text-xl font-semibold text-gray-900">
            Add New Society
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
          <div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isTrial"
                checked={isTrial}
                onChange={(e) => setIsTrial(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={isLoading}
              />
              <label htmlFor="isTrial" className="text-sm text-gray-900">Trial Period</label>
            </div>
          </div>
          {isTrial && (
            <div>
              <label className="text-sm text-gray-900 mb-1 block">Trial Period (Months)</label>
              <input
                type="number"
                value={trialMonths}
                onChange={(e) => setTrialMonths(parseInt(e.target.value))}
                min={1}
                max={12}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
              {errors.trialMonths && <p className="text-red-500 text-sm mt-1">{errors.trialMonths}</p>}
            </div>
          )}
          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center bg-blue-600 text-white px-3 py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:bg-blue-400"
              disabled={isLoading}
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              {isLoading ? 'Saving...' : 'Add Society'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SocietyEditForm = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    address: string;
    adminEmail: string;
    status: string;
    isTrial: boolean;
    trialMonths: number;
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
  }) => void;
  initialData: {
    id?: number;
    name: string;
    address: string;
    adminEmail: string;
    status: string;
    isTrial?: boolean;
    trialMonths?: number;
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
  };
  isLoading: boolean;
}) => {
  const [name, setName] = useState(initialData.name);
  const [address, setAddress] = useState(initialData.address);
  const [adminEmail, setAdminEmail] = useState(initialData.adminEmail);
  const [status, setStatus] = useState(initialData.status || 'active');
  const [isTrial, setIsTrial] = useState(initialData.isTrial || false);
  const [trialMonths, setTrialMonths] = useState(initialData.trialMonths || 1);
  const [address_line1, setAddressLine1] = useState(initialData.address_line1 || '');
  const [address_line2, setAddressLine2] = useState(initialData.address_line2 || '');
  const [city, setCity] = useState(initialData.city || '');
  const [state, setState] = useState(initialData.state || '');
  const [country, setCountry] = useState(initialData.country || '');
  const [pincode, setPincode] = useState(initialData.pincode || '');
  const [contact_number, setContactNumber] = useState(initialData.contact_number || '');
  const [email, setEmail] = useState(initialData.email || '');
  const [registration_number, setRegistrationNumber] = useState(initialData.registration_number || '');
  const [registration_date, setRegistrationDate] = useState(initialData.registration_date || '');
  const [type, setType] = useState(initialData.type || '');
  const [sampleFlatNumber, setSampleFlatNumber] = useState(initialData.sampleFlatNumber || '');
  const [errors, setErrors] = useState({
    name: '',
    address: '',
    adminEmail: '',
    trialMonths: '',
  });

  useEffect(() => {
    setName(initialData.name);
    setAddress(initialData.address);
    setAdminEmail(initialData.adminEmail);
    setStatus(initialData.status || 'active');
    setIsTrial(initialData.isTrial || false);
    setTrialMonths(initialData.trialMonths || 1);
    setAddressLine1(initialData.address_line1 || '');
    setAddressLine2(initialData.address_line2 || '');
    setCity(initialData.city || '');
    setState(initialData.state || '');
    setCountry(initialData.country || '');
    setPincode(initialData.pincode || '');
    setContactNumber(initialData.contact_number || '');
    setEmail(initialData.email || '');
    setRegistrationNumber(initialData.registration_number || '');
    setRegistrationDate(initialData.registration_date || '');
    setType(initialData.type || '');
    setSampleFlatNumber(initialData.sampleFlatNumber || '');
  }, [initialData]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({ name: '', address: '', adminEmail: '', trialMonths: '' });

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
    if (isTrial && (trialMonths < 1 || trialMonths > 12)) {
      setErrors((prev) => ({ ...prev, trialMonths: 'Trial period must be between 1 and 12 months' }));
      return;
    }

    onSubmit({
      name,
      address,
      adminEmail,
      status,
      isTrial,
      trialMonths,
      address_line1,
      address_line2,
      city,
      state,
      country,
      pincode,
      contact_number,
      email,
      registration_number,
      registration_date,
      type,
      sampleFlatNumber,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 w-full max-w-2xl shadow-sm max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-2">
          <h2 className="text-xl font-semibold text-gray-900">Edit Society</h2>
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
          <div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isTrial"
                checked={isTrial}
                onChange={(e) => setIsTrial(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={isLoading}
              />
              <label htmlFor="isTrial" className="text-sm text-gray-900">Trial Period</label>
            </div>
          </div>
          {isTrial && (
            <div>
              <label className="text-sm text-gray-900 mb-1 block">Trial Period (Months)</label>
              <input
                type="number"
                value={trialMonths}
                onChange={(e) => setTrialMonths(parseInt(e.target.value))}
                min={1}
                max={12}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
              {errors.trialMonths && <p className="text-red-500 text-sm mt-1">{errors.trialMonths}</p>}
            </div>
          )}
          <div>
            <label className="text-sm text-gray-900 mb-1 block">Address Line 1</label>
            <input
              type="text"
              value={address_line1}
              onChange={(e) => setAddressLine1(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter address line 1"
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="text-sm text-gray-900 mb-1 block">Address Line 2</label>
            <input
              type="text"
              value={address_line2}
              onChange={(e) => setAddressLine2(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter address line 2"
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="text-sm text-gray-900 mb-1 block">City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter city"
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="text-sm text-gray-900 mb-1 block">State</label>
            <input
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter state"
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="text-sm text-gray-900 mb-1 block">Country</label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter country"
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="text-sm text-gray-900 mb-1 block">Pincode</label>
            <input
              type="text"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter pincode"
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="text-sm text-gray-900 mb-1 block">Contact Number</label>
            <input
              type="text"
              value={contact_number}
              onChange={(e) => setContactNumber(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter contact number"
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="text-sm text-gray-900 mb-1 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter email"
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="text-sm text-gray-900 mb-1 block">Registration Number</label>
            <input
              type="text"
              value={registration_number}
              onChange={(e) => setRegistrationNumber(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter registration number"
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="text-sm text-gray-900 mb-1 block">Registration Date</label>
            <input
              type="date"
              value={registration_date}
              onChange={(e) => setRegistrationDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="text-sm text-gray-900 mb-1 block">Type</label>
            <input
              type="text"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter type"
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="text-sm text-gray-900 mb-1 block">Sample Flat Number</label>
            <input
              type="text"
              value={sampleFlatNumber}
              onChange={(e) => setSampleFlatNumber(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter sample flat number"
              disabled={isLoading}
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center bg-blue-600 text-white px-3 py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:bg-blue-400"
              disabled={isLoading}
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              {isLoading ? 'Saving...' : 'Update Society'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SocietyDetailsModal = ({
  isOpen,
  onClose,
  society,
}: {
  isOpen: boolean;
  onClose: () => void;
  society: {
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
    status: string;
  };
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 w-full max-w-2xl shadow-sm">
        <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-2">
          <h2 className="text-xl font-semibold text-gray-900">Society Details</h2>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-800">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm text-gray-700">
          <p><strong>ID:</strong> {society.id}</p>
          <p><strong>Name:</strong> {society.name}</p>
          <p><strong>Address:</strong> {society.address}</p>
          <p><strong>Status:</strong> {society.status}</p>
          <p><strong>Created At:</strong> {new Date(society.createdAt).toLocaleDateString()}</p>
          <p><strong>Address Line 1:</strong> {society.address_line1 || '-'}</p>
          <p><strong>Address Line 2:</strong> {society.address_line2 || '-'}</p>
          <p><strong>City:</strong> {society.city || '-'}</p>
          <p><strong>State:</strong> {society.state || '-'}</p>
          <p><strong>Country:</strong> {society.country || '-'}</p>
          <p><strong>Pincode:</strong> {society.pincode || '-'}</p>
          <p><strong>Contact Number:</strong> {society.contact_number || '-'}</p>
          <p><strong>Email:</strong> {society.email || '-'}</p>
          <p><strong>Registration Number:</strong> {society.registration_number || '-'}</p>
          <p><strong>Registration Date:</strong> {society.registration_date ? new Date(society.registration_date).toLocaleDateString() : '-'}</p>
          <p><strong>Type:</strong> {society.type || '-'}</p>
          <p><strong>Sample Flat Number:</strong> {society.sampleFlatNumber || '-'}</p>
        </div>
      </div>
    </div>
  );
};

const Societies = ({
  societies,
  onAdd,
  onEdit,
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
}) => {
  const [selectedSociety, setSelectedSociety] = useState<any | null>(null);

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
              <th className="p-3">Status</th>
              <th className="p-3">Created At</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {societies.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-3 text-center text-gray-600">
                  No societies found
                </td>
              </tr>
            ) : (
              societies.map((society) => (
                <tr
                  key={society.id}
                  className="border-b hover:bg-gray-50 transition"
                >
                  <td className="p-3">{society.id}</td>
                  <td className="p-3 font-medium">{society.name}</td>
                  <td className="p-3">{society.status}</td>
                  <td className="p-3">
                    {new Date(society.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-3 space-x-3">
                    <button
                      onClick={() => setSelectedSociety(society)}
                      className="text-gray-700 hover:text-gray-900"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => onEdit(society)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <SocietyDetailsModal
        isOpen={!!selectedSociety}
        onClose={() => setSelectedSociety(null)}
        society={selectedSociety}
      />
    </div>
  );
};

export default function SuperadminSociety() {
  const [societies, setSocieties] = useState<
    {
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
    }[]
  >([]);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [formData, setFormData] = useState<{
    id?: number;
    name: string;
    address: string;
    adminEmail: string;
    status: string;
    isTrial?: boolean;
    trialMonths?: number;
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
  }>({
    name: '',
    address: '',
    adminEmail: '',
    status: 'active',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchSocieties()
      .then((data) => {
        setSocieties(data);
      })
      .catch((err) => {
        console.error('Failed to fetch societies:', err);
        setError('Failed to load societies');
      });
  }, []);

  const handleAddSociety = () => {
    setFormData({
      name: '',
      address: '',
      adminEmail: '',
      status: 'active',
      isTrial: false,
      trialMonths: 1,
    });
    setIsAddFormOpen(true);
  };

  const handleEditSociety = (society: any) => {
    // Reset any previous errors
    setError('');
    
    // Map all society data to form fields
    const formattedData = {
      id: society.id,
      name: society.name || '',
      address: society.address || '',
      adminEmail: society.email || society.adminEmail || '',  // Handle both email and adminEmail fields
      status: society.status || 'active',
      isTrial: Boolean(society.isTrial),
      trialMonths: society.trialMonths || 1,
      address_line1: society.address_line1 || '',
      address_line2: society.address_line2 || '',
      city: society.city || '',
      state: society.state || '',
      country: society.country || '',
      pincode: society.pincode || '',
      contact_number: society.contact_number || society.contactNumber || '',  // Handle both formats
      email: society.email || '',
      registration_number: society.registration_number || society.registrationNumber || '',  // Handle both formats
      registration_date: society.registration_date || society.registrationDate || '',  // Handle both formats
      type: society.type || society.societyType || '',  // Handle both formats
      sampleFlatNumber: society.sampleFlatNumber || '',
    };

    setFormData(formattedData);
    setIsEditFormOpen(true);
  };

  const handleAddFormSubmit = async (data: {
    name: string;
    address: string;
    adminEmail: string;
    status: string;
    isTrial: boolean;
    trialMonths: number;
  }) => {
    setError('');
    setIsLoading(true);
    try {
      const response = await createSociety(data);
      setSocieties([
        ...societies,
        {
          id: response.id,
          ...data,
          createdAt: new Date().toISOString(),
          subscription_opted_id: response.subscription_opted_id || 0,
        },
      ]);
      setIsAddFormOpen(false);
      setFormData({
        name: '',
        address: '',
        adminEmail: '',
        status: 'active',
        isTrial: false,
        trialMonths: 1,
      });
    } catch (err) {
      setError('Failed to save society');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditFormSubmit = async (data: {
    name: string;
    address: string;
    adminEmail: string;
    status: string;
    isTrial: boolean;
    trialMonths: number;
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
  }) => {
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
      }
      setIsEditFormOpen(false);
      setFormData({
        name: '',
        address: '',
        adminEmail: '',
        status: 'active',
        isTrial: false,
        trialMonths: 1,
      });
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
      />
      <SocietyForm
        isOpen={isAddFormOpen}
        onClose={() => setIsAddFormOpen(false)}
        onSubmit={handleAddFormSubmit}
        initialData={formData}
        isLoading={isLoading}
      />
      <SocietyEditForm
        isOpen={isEditFormOpen}
        onClose={() => setIsEditFormOpen(false)}
        onSubmit={handleEditFormSubmit}
        initialData={formData}
        isLoading={isLoading}
      />
    </main>
  );
}