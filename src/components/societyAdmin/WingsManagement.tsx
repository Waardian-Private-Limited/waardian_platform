'use client';

import { useEffect, useState } from 'react';
import { Plus, RefreshCw, Edit2, Check, X } from 'lucide-react';
import {
  Wing,
  WingCreatePayload,
  getWings,
  createWing,
  renameWing,
} from '@/lib/societyAdminClient';

const FLAT_TYPES = ['1RK','1BHK','2BHK','3BHK','4BHK'];

interface WingsManagementProps {
  societyId: string;
  user?: { id: string; name?: string; email?: string };
}

export default function WingsManagement({ societyId }: WingsManagementProps) {
  const [wings, setWings] = useState<Wing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create form state
  const [name, setName] = useState('');
  const [floors, setFloors] = useState<number>(1);
  const [flatTypes, setFlatTypes] = useState<Array<{ type: string; count: number; squareFootage: number }>>([
    { type: '1BHK', count: 4, squareFootage: 600 },
  ]);

  // Rename state per wing
  const [renamingWingId, setRenamingWingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState<string>('');

  const fetchWings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getWings();
      if (data.success && data.data) setWings(data.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load wings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [societyId]);

  const handleAddWing = async () => {
    if (!name.trim() || floors < 1) return;
    setLoading(true);
    setError(null);
    try {
      const payload: WingCreatePayload = {
        name: name.trim(),
        floors,
        flatTypes,
      };
      const res = await createWing(payload);
      if (!res.success) throw new Error(res.message || 'Failed to create wing');
      setName('');
      setFloors(1);
      setFlatTypes([{ type: '1BHK', count: 4, squareFootage: 600 }]);
      await fetchWings();
    } catch (err: any) {
      setError(err.message || 'Failed to create wing');
    } finally {
      setLoading(false);
    }
  };

  const startRenaming = (wingId: string, currentName: string) => {
    setRenamingWingId(wingId);
    setRenameValue(currentName);
  };

  const cancelRenaming = () => {
    setRenamingWingId(null);
    setRenameValue('');
  };

  const confirmRename = async () => {
    if (!renamingWingId) return;
    if (!renameValue.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await renameWing(renamingWingId, renameValue.trim());
      if (!res.success) throw new Error(res.message || 'Failed to rename wing');
      cancelRenaming();
      await fetchWings();
    } catch (err: any) {
      setError(err.message || 'Failed to rename wing');
    } finally {
      setLoading(false);
    }
  };

  const updateFlatType = (index: number, key: 'type' | 'count' | 'squareFootage', value: string | number) => {
    setFlatTypes((prev) => {
      const next = [...prev];
      const item = { ...next[index] };
      (item as any)[key] = key === 'type' ? String(value) : Number(value);
      next[index] = item;
      return next;
    });
  };

  const addFlatTypeRow = () => {
    setFlatTypes((prev) => [...prev, { type: '1BHK', count: 1, squareFootage: 500 }]);
  };

  const removeFlatTypeRow = (index: number) => {
    setFlatTypes((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Wing Management</h2>
        <button
          onClick={fetchWings}
          className="inline-flex items-center px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm"
        >
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm">{error}</div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-lg font-medium mb-3">Create New Wing</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Wing Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm"
              placeholder="e.g., A"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Floors</label>
            <input
              type="number"
              min={1}
              value={floors}
              onChange={(e) => setFloors(Number(e.target.value))}
              className="w-full border rounded-md px-3 py-2 text-sm"
              placeholder="e.g., 10"
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
                  placeholder="Count per floor"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={100}
                    value={ft.squareFootage}
                    onChange={(e) => updateFlatType(idx, 'squareFootage', Number(e.target.value))}
                    className="border rounded-md px-3 py-2 text-sm w-full"
                    placeholder="Sqft"
                  />
                  <button
                    onClick={() => removeFlatTypeRow(idx)}
                    className="px-2 py-2 rounded-md bg-red-50 text-red-600 hover:bg-red-100"
                    title="Remove"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={addFlatTypeRow}
            className="mt-2 inline-flex items-center px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Flat Type
          </button>
        </div>
        <div className="mt-4">
          <button
            onClick={handleAddWing}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm"
          >
            <Plus className="w-4 h-4 mr-2" /> Create Wing
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-lg font-medium mb-3">Existing Wings</h3>
        {loading && <p className="text-sm text-gray-500">Loading...</p>}
        {!loading && wings.length === 0 && (
          <p className="text-sm text-gray-500">No wings found.</p>
        )}
        <ul className="divide-y">
          {wings.map((wing) => (
            <li key={wing.id} className="py-3 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{wing.name}</p>
                <p className="text-xs text-gray-500">Wing ID: {wing.id}</p>
              </div>
              <div className="flex items-center gap-2">
                {renamingWingId === wing.id ? (
                  <>
                    <input
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      className="border rounded-md px-3 py-2 text-sm"
                    />
                    <button
                      onClick={confirmRename}
                      className="px-3 py-2 rounded-md bg-green-600 hover:bg-green-700 text-white text-sm"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={cancelRenaming}
                      className="px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => startRenaming(wing.id, wing.name)}
                    className="inline-flex items-center px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm"
                  >
                    <Edit2 className="w-4 h-4 mr-2" /> Rename
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