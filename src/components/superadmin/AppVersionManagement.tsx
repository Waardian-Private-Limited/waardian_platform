'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Smartphone, 
  Globe, 
  AlertCircle, 
  CheckCircle2, 
  History,
  ShieldAlert,
  ArrowUpCircle,
  Loader2,
  Edit2,
  Trash2,
  MoreVertical
} from 'lucide-react';
import { getAppVersions, createAppVersion, updateAppVersion, deleteAppVersion } from '@/lib/superadmincontroller';
import { format } from 'date-fns';

interface AppVersion {
  id: number;
  version: string;
  source_platform: 'mobile' | 'web';
  is_force_update: boolean;
  release_notes: string;
  is_active: boolean;
  created_at: string;
}

export default function AppVersionManagement() {
  const [versions, setVersions] = useState<AppVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVersion, setEditingVersion] = useState<AppVersion | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    version: '',
    source_platform: 'mobile' as 'mobile' | 'web',
    is_force_update: false,
    release_notes: '',
    is_active: true
  });

  useEffect(() => {
    loadVersions();
  }, []);

  const loadVersions = async () => {
    setIsLoading(true);
    try {
      const response = await getAppVersions();
      if (response.success) {
        setVersions(response.data || []);
      }
    } catch (error) {
      console.error('Error loading versions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (v: AppVersion) => {
    setEditingVersion(v);
    setFormData({
      version: v.version,
      source_platform: v.source_platform,
      is_force_update: v.is_force_update,
      release_notes: v.release_notes || '',
      is_active: v.is_active
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this version?')) return;
    
    try {
      const response = await deleteAppVersion(id);
      if (response.success) {
        loadVersions();
      }
    } catch (error) {
      console.error('Error deleting version:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let response;
      if (editingVersion) {
        response = await updateAppVersion(editingVersion.id, formData);
      } else {
        response = await createAppVersion(formData);
      }

      if (response.success) {
        setShowAddModal(false);
        setEditingVersion(null);
        setFormData({
          version: '',
          source_platform: 'mobile',
          is_force_update: false,
          release_notes: '',
          is_active: true
        });
        loadVersions();
      }
    } catch (error) {
      console.error('Error saving version:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ArrowUpCircle className="w-8 h-8 text-blue-600" />
            App Version Management
          </h1>
          <p className="text-gray-500 mt-1">Control mobile and web application release cycles</p>
        </div>
        <button
          onClick={() => {
            setEditingVersion(null);
            setFormData({
              version: '',
              source_platform: 'mobile',
              is_force_update: false,
              release_notes: '',
              is_active: true
            });
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Release New Version
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Statistics Cards */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-xl">
            <Smartphone className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Latest Mobile</p>
            <p className="text-xl font-bold text-gray-900">
              {versions.find(v => v.source_platform === 'mobile' && v.is_active)?.version || 'N/A'}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-indigo-50 rounded-xl">
            <Globe className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Latest Web</p>
            <p className="text-xl font-bold text-gray-900">
              {versions.find(v => v.source_platform === 'web' && v.is_active)?.version || 'N/A'}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-orange-50 rounded-xl">
            <ShieldAlert className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Active Force Updates</p>
            <p className="text-xl font-bold text-gray-900">
              {versions.filter(v => v.is_active && v.is_force_update).length}
            </p>
          </div>
        </div>
      </div>

      {/* Version History List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <History className="w-5 h-5 text-gray-400" />
            Release History
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Version</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Platform</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Update Type</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Release Date</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
                    <p className="text-gray-400 mt-2">Loading version history...</p>
                  </td>
                </tr>
              ) : versions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    No release history found
                  </td>
                </tr>
              ) : (
                versions.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-bold text-gray-900">{v.version}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {v.source_platform === 'mobile' ? (
                          <Smartphone className="w-4 h-4 text-blue-500" />
                        ) : (
                          <Globe className="w-4 h-4 text-indigo-500" />
                        )}
                        <span className="text-gray-600 capitalize">{v.source_platform}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {v.is_force_update ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                          <AlertCircle className="w-3 h-3" />
                          Major (Force)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                          <CheckCircle2 className="w-3 h-3" />
                          Minor (Optional)
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {v.is_active ? (
                        <span className="text-green-600 font-bold flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                          Active
                        </span>
                      ) : (
                        <span className="text-gray-400 font-medium">Previous</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm">
                      {format(new Date(v.created_at), 'MMM dd, yyyy HH:mm')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(v)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(v.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Version Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <ArrowUpCircle className="w-6 h-6 text-blue-600" />
                {editingVersion ? 'Edit Version' : 'Release New Version'}
              </h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-white transition-colors"
              >
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Version Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1.0.5"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    value={formData.version}
                    onChange={e => setFormData({...formData, version: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Target Platform</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, source_platform: 'mobile'})}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${
                        formData.source_platform === 'mobile' 
                          ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold' 
                          : 'border-gray-100 text-gray-500 hover:border-gray-200'
                      }`}
                    >
                      <Smartphone className="w-5 h-5" />
                      Mobile
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, source_platform: 'web'})}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${
                        formData.source_platform === 'web' 
                          ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold' 
                          : 'border-gray-100 text-gray-500 hover:border-gray-200'
                      }`}
                    >
                      <Globe className="w-5 h-5" />
                      Web
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <input
                    type="checkbox"
                    id="forceUpdate"
                    className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    checked={formData.is_force_update}
                    onChange={e => setFormData({...formData, is_force_update: e.target.checked})}
                  />
                  <label htmlFor="forceUpdate" className="text-sm font-bold text-gray-700 cursor-pointer select-none">
                    Major Update (Mandatory Force Update)
                  </label>
                </div>

                {editingVersion && (
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <input
                      type="checkbox"
                      id="isActive"
                      className="w-5 h-5 rounded text-green-600 focus:ring-green-500 cursor-pointer"
                      checked={formData.is_active}
                      onChange={e => setFormData({...formData, is_active: e.target.checked})}
                    />
                    <label htmlFor="isActive" className="text-sm font-bold text-gray-700 cursor-pointer select-none">
                      Is Active Version
                    </label>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Release Notes</label>
                  <textarea
                    placeholder="Describe what's new in this version..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none h-32 resize-none transition-all"
                    value={formData.release_notes}
                    onChange={e => setFormData({...formData, release_notes: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-6 py-3 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    editingVersion ? 'Update Version' : 'Publish Release'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
