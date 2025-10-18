'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, Plus, Edit2, Check, X } from 'lucide-react';
import {
  Wing,
  Floor,
  Flat,
  getWings,
  getFloors,
  getFlats,
  createFlat,
  updateFlatDetails,
  FlatCreatePayload,
} from '@/lib/societyAdminClient';

const FLAT_TYPES = ['1RK','1BHK','2BHK','3BHK','4BHK'];

interface FlatsManagementProps {
  societyId: string;
}

export default function FlatsManagement({ societyId }: FlatsManagementProps) {
  const [wings, setWings] = useState<Wing[]>([]);
  const [selectedWingId, setSelectedWingId] = useState<string>('');
  const [floors, setFloors] = useState<Floor[]>([]);
  const [selectedFloorId, setSelectedFloorId] = useState<string>('');
  const [flats, setFlats] = useState<Flat[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create form state
  const [flatNumber, setFlatNumber] = useState('');
  const [squareFeet, setSquareFeet] = useState<number>(600);
  const [flatType, setFlatType] = useState<string>('1BHK');
  const [newFlatOccupancy, setNewFlatOccupancy] = useState<string>('vacant');

  // Edit state per flat
  const [editingFlatId, setEditingFlatId] = useState<string | null>(null);
  const [editSquareFeet, setEditSquareFeet] = useState<number>(600);
  const [editFlatType, setEditFlatType] = useState<string>('1BHK');
  const [editOccupancy, setEditOccupancy] = useState<string>('vacant');

  const fetchWings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getWings();
      setWings(data);
      if (data.length > 0) setSelectedWingId((prev) => prev || data[0].id);
    } catch (err: any) {
      setError(err.message || 'Failed to load wings');
    } finally {
      setLoading(false);
    }
  };

  const fetchFloors = async (wingId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getFloors(wingId);
      setFloors(data);
      if (data.length > 0) setSelectedFloorId((prev) => prev || data[0].floor_id.toString());
    } catch (err: any) {
      setError(err.message || 'Failed to load floors');
    } finally {
      setLoading(false);
    }
  };

  const fetchFlats = async (wingId: string, floorId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getFlats(wingId, floorId);
      setFlats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load flats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [societyId]);

  useEffect(() => {
    if (selectedWingId) fetchFloors(selectedWingId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWingId]);

  useEffect(() => {
    if (selectedWingId && selectedFloorId) fetchFlats(selectedWingId, selectedFloorId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWingId, selectedFloorId]);

  const handleCreateFlat = async () => {
    if (!selectedWingId || !selectedFloorId || !flatNumber.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const payload: FlatCreatePayload = {
        flatNumber: flatNumber.trim(),
        squareFeet,
        flatType,
        occupancyStatus: newFlatOccupancy,
      };
      const res = await createFlat(selectedWingId, selectedFloorId, payload);
      if (!res.success) throw new Error(res.message || 'Failed to create flat');
      setFlatNumber('');
      setSquareFeet(600);
      setFlatType('1BHK');
      await fetchFlats(selectedWingId, selectedFloorId);
    } catch (err: any) {
      setError(err.message || 'Failed to create flat');
    } finally {
      setLoading(false);
    }
  };

  const startEditFlat = (flat: Flat) => {
    setEditingFlatId(String(flat.flat_id));
    const sqft = typeof flat.square_feet === 'string' ? parseFloat(flat.square_feet) : (flat.square_feet ?? 0);
    setEditSquareFeet(Number.isFinite(sqft) ? sqft : 0);
    setEditFlatType(flat.flat_type || '');
    setEditOccupancy(flat.occupancy_status || 'vacant');
  };

  const cancelEditFlat = () => {
    setEditingFlatId(null);
  };

  const confirmEditFlat = async () => {
    if (!editingFlatId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await updateFlatDetails(String(editingFlatId), {
        square_feet: editSquareFeet,
        flat_type: editFlatType,
        occupancy_status: editOccupancy,
      });
      if (!res.success) throw new Error(res.message || 'Failed to update flat');
      cancelEditFlat();
      await fetchFlats(selectedWingId, selectedFloorId);
    } catch (err: any) {
      setError(err.message || 'Failed to update flat');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Flat Management</h2>
        <button
          onClick={() => selectedWingId && selectedFloorId ? fetchFlats(selectedWingId, selectedFloorId) : fetchWings()}
          className="inline-flex items-center px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm"
        >
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </button>
      </div>

      {error && <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <label className="block text-sm text-gray-600 mb-1">Select Wing</label>
          <select
            value={selectedWingId}
            onChange={(e) => { setSelectedWingId(e.target.value); setSelectedFloorId(''); }}
            className="w-full border rounded-md px-3 py-2 text-sm"
          >
            {wings.map((w) => (
              <option key={w.id} value={w.id}>{w.name} (ID: {w.id})</option>
            ))}
          </select>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <label className="block text-sm text-gray-600 mb-1">Select Floor</label>
          <select
            value={selectedFloorId}
            onChange={(e) => setSelectedFloorId(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm"
          >
            {floors.map((f) => (
              <option key={f.floor_id} value={f.floor_id.toString()}>Floor {f.floor_number} (ID: {f.floor_id})</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-lg font-medium mb-3">Create New Flat</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Flat Number</label>
            <input
              value={flatNumber}
              onChange={(e) => setFlatNumber(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm"
              placeholder="e.g., 101"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Square Feet</label>
            <input
              type="number"
              min={100}
              value={squareFeet}
              onChange={(e) => setSquareFeet(Number(e.target.value))}
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Flat Type</label>
            <select
              value={flatType}
              onChange={(e) => setFlatType(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm"
            >
              {FLAT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Occupancy Status</label>
            <select
              value={newFlatOccupancy}
              onChange={(e) => setNewFlatOccupancy(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm"
            >
              <option value="vacant">Vacant</option>
              <option value="owner_occupied">Owner Occupied</option>
              <option value="tenant_occupied">Tenant Occupied</option>
            </select>
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={handleCreateFlat}
            disabled={!selectedWingId || !selectedFloorId}
            className="inline-flex items-center px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm"
          >
            <Plus className="w-4 h-4 mr-2" /> Create Flat
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-lg font-medium mb-3">Existing Flats</h3>
        {loading && <p className="text-sm text-gray-500">Loading...</p>}
        {!loading && flats.length === 0 && (
          <p className="text-sm text-gray-500">No flats found for selected floor.</p>
        )}
        <ul className="divide-y">
          {flats.map((flat) => (
            <li key={flat.flat_id} className="py-3 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Flat {flat.flat_number}</p>
                <p className="text-xs text-gray-500">Flat ID: {flat.flat_id}</p>
                <p className="text-xs text-gray-500">
                  Type: {flat.flat_type || '—'} • Sqft: {typeof flat.square_feet === 'string' ? flat.square_feet : (flat.square_feet ?? '—')} • Status: {flat.occupancy_status || '—'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {editingFlatId === String(flat.flat_id) ? (
                  <>
                    <input
                      type="number"
                      value={editSquareFeet}
                      onChange={(e) => setEditSquareFeet(Number(e.target.value))}
                      className="border rounded-md px-3 py-2 text-sm w-24"
                      placeholder="Sqft"
                    />
                    <select
                      value={editFlatType}
                      onChange={(e) => setEditFlatType(e.target.value)}
                      className="border rounded-md px-3 py-2 text-sm w-24"
                    >
                      {FLAT_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <select
                      value={editOccupancy}
                      onChange={(e) => setEditOccupancy(e.target.value)}
                      className="border rounded-md px-3 py-2 text-sm"
                    >
                      <option value="vacant">Vacant</option>
                      <option value="owner_occupied">Owner Occupied</option>
                      <option value="tenant_occupied">Tenant Occupied</option>
                    </select>
                    <button
                      onClick={confirmEditFlat}
                      className="px-3 py-2 rounded-md bg-green-600 hover:bg-green-700 text-white text-sm"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={cancelEditFlat}
                      className="px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => startEditFlat(flat)}
                    className="inline-flex items-center px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm"
                  >
                    <Edit2 className="w-4 h-4 mr-2" /> Edit
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}