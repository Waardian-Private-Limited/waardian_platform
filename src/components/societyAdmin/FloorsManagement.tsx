'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, RefreshCw, Plus } from 'lucide-react';
import {
  Wing,
  Floor,
  FloorCreatePayload,
  getWings,
  getFloors,
  createFloor,
} from '@/lib/societyAdminClient';

const FLAT_TYPES = ['1RK','1BHK','2BHK','3BHK','4BHK'];

interface FloorsManagementProps {
  societyId: string;
}

export default function FloorsManagement({ societyId }: FloorsManagementProps) {
  const [wings, setWings] = useState<Wing[]>([]);
  const [selectedWingId, setSelectedWingId] = useState<string>('');
  const [floors, setFloors] = useState<Floor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [floorNumber, setFloorNumber] = useState<number>(1);
  const [flatTypes, setFlatTypes] = useState<Array<{ type: string; count: number; squareFootage: number }>>([
    { type: '1BHK', count: 4, squareFootage: 600 },
  ]);

  const fetchWings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getWings();
      setWings(data);
      if (data.length > 0 && !selectedWingId) setSelectedWingId(data[0].id);
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
    } catch (err: any) {
      setError(err.message || 'Failed to load floors');
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

  const updateFlatType = (index: number, key: 'type' | 'count' | 'squareFootage', value: string | number) => {
    setFlatTypes((prev) => {
      const next = [...prev];
      const item = { ...next[index] };
      (item as any)[key] = key === 'type' ? String(value) : Number(value);
      next[index] = item;
      return next;
    });
  };

  const addFlatTypeRow = () => setFlatTypes((prev) => [...prev, { type: '2BHK', count: 2, squareFootage: 800 }]);
  const removeFlatTypeRow = (idx: number) => setFlatTypes((prev) => prev.filter((_, i) => i !== idx));

  const handleCreateFloor = async () => {
    if (!selectedWingId || floorNumber < 0) return;
    setLoading(true);
    setError(null);
    try {
      const payload: FloorCreatePayload = {
        floorNumber,
        flatTypes,
      };
      const res = await createFloor(selectedWingId, payload);
      if (!res.success) throw new Error(res.message || 'Failed to create floor');
      setFloorNumber(floorNumber + 1);
      await fetchFloors(selectedWingId);
    } catch (err: any) {
      setError(err.message || 'Failed to create floor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Floor Management</h2>
        <button
          onClick={() => selectedWingId ? fetchFloors(selectedWingId) : fetchWings()}
          className="inline-flex items-center px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm"
        >
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </button>
      </div>

      {error && <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm">{error}</div>}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <label className="block text-sm text-gray-600 mb-1">Select Wing</label>
        <select
          value={selectedWingId}
          onChange={(e) => setSelectedWingId(e.target.value)}
          className="w-full border rounded-md px-3 py-2 text-sm"
        >
          {wings.map((w) => (
            <option key={w.id} value={w.id}>{w.name} (ID: {w.id})</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-lg font-medium mb-3">Create New Floor</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Floor Number</label>
            <input
              type="number"
              min={0}
              value={floorNumber}
              onChange={(e) => setFloorNumber(Number(e.target.value))}
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="mt-3">
          <label className="block text-sm text-gray-600 mb-2">Flat Types</label>
          <div className="space-y-2">
            {flatTypes.map((ft, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                <select
                  value={ft.type}
                  onChange={(e) => updateFlatType(idx, 'type', e.target.value)}
                  className="border rounded-md px-3 py-2 text-sm"
                >
                  {FLAT_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                 <input
                   type="number"
                   min={1}
                   value={ft.count}
                   onChange={(e) => updateFlatType(idx, 'count', Number(e.target.value))}
                   className="border rounded-md px-3 py-2 text-sm"
                   placeholder="Count"
                 />
                 <input
                   type="number"
                   min={100}
                   value={ft.squareFootage}
                   onChange={(e) => updateFlatType(idx, 'squareFootage', Number(e.target.value))}
                   className="border rounded-md px-3 py-2 text-sm"
                   placeholder="Sqft"
                 />
              </div>
            ))}
          </div>
          <button onClick={addFlatTypeRow} className="mt-2 inline-flex items-center px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm">
            <Plus className="w-4 h-4 mr-2" /> Add Flat Type
          </button>
        </div>
        <div className="mt-4">
          <button
            onClick={handleCreateFloor}
            className="inline-flex items-center px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm"
          >
            <Plus className="w-4 h-4 mr-2" /> Create Floor
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-lg font-medium mb-3">Existing Floors</h3>
        {loading && <p className="text-sm text-gray-500">Loading...</p>}
        {!loading && floors.length === 0 && (
          <p className="text-sm text-gray-500">No floors found for selected wing.</p>
        )}
        <ul className="divide-y">
          {floors.map((floor) => (
            <li key={floor.floor_id} className="py-3 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Floor {floor.floor_number}</p>
                <p className="text-xs text-gray-500">Floor ID: {floor.floor_id}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}