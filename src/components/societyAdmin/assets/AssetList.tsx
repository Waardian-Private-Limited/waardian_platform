"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Plus, Download, Package, Edit2, ChevronRight, RefreshCw,
  TrendingUp, TrendingDown, IndianRupee, PieChart as PieChartIcon,
  Trash2, ChevronLeft, Boxes, LayoutGrid, Layers
} from 'lucide-react';
import { apiClient, Asset, exportAssetsToExcel } from '@/lib/apiClient';
import clsx from 'clsx';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import AssetDetailsModal from './AssetDetailsModal';
import AssetAddModal from './AssetAddModal';
import { motion, AnimatePresence } from 'framer-motion';

export default function AssetList() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);
  const [editAssetId, setEditAssetId] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const router = useRouter();

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await apiClient('/assets', { withAuth: true });
      if (res.success) {
        setAssets(res.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch assets:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = async () => {
    try {
      const blob = await exportAssetsToExcel({
        category: activeCategory === 'All' ? '' : activeCategory
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Assets_${activeCategory}_${format(new Date(), 'yyyyMMdd')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const categories = ['All', ...Array.from(new Set(assets.map(a => a.category)))];

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || asset.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="animate-spin text-blue-600" size={40} />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Syncing Asset Registry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 font-sans">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2">
        <div className="flex items-center gap-3">

          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none mb-1">Asset Registry</h1>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">Consolidated Resource Inventory</p>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-6 py-3 bg-slate-900 text-white rounded-none flex items-center gap-3 hover:bg-blue-600 transition-all shadow-xl active:scale-95 group"
        >
          <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
          <span className="text-[11px] font-black uppercase tracking-[0.2em]">Register New Asset</span>
        </button>
      </div>

      <FinancialReportingModule assets={assets} />

      <div className="bg-white rounded-none border border-slate-200 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
        {/* Integrated Header */}
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/50">
          <div className="flex gap-2 p-1 bg-white rounded-none border border-slate-200 shadow-sm overflow-x-auto no-scrollbar max-w-full md:max-w-md">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={clsx(
                  "px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-none transition-all whitespace-nowrap",
                  activeCategory === cat ? "bg-slate-900 text-white" : "text-slate-400 hover:text-slate-900"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <input
                type="text"
                placeholder="QUICK SEARCH..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-none text-[10px] font-bold uppercase tracking-widest outline-none focus:ring-1 focus:ring-blue-100 transition-all w-full md:w-56"
              />
            </div>
            <button
              onClick={handleExport}
              className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 rounded-none transition-all shadow-sm active:scale-95"
            >
              <Download size={16} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 tracking-wider border-b border-slate-100">
                <th className="px-8 py-4">Asset Descriptor</th>
                <th className="px-8 py-4">Classification</th>
                <th className="px-8 py-4">Status / Health</th>
                <th className="px-8 py-4">Primary Location</th>
                <th className="px-8 py-4 text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAssets.length > 0 ? filteredAssets.map((asset, i) => (
                <motion.tr
                  key={asset.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="hover:bg-slate-50 transition-all group cursor-pointer"
                  onClick={() => setSelectedAssetId(asset.id)}
                >
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-none flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                        <Package size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">{asset.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">AST-{asset.id.toString().padStart(4, '0')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-none border border-slate-200 uppercase tracking-widest">
                      {asset.category}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className={clsx(
                        "w-2 h-2 rounded-none",
                        asset.status === 'operational' || asset.status === 'active' || asset.status === 'available' ? "bg-emerald-500" :
                          asset.status === 'maintenance' || asset.status === 'under_maintenance' ? "bg-amber-500" :
                            "bg-red-500"
                      )} />
                      <span className={clsx(
                        "text-[9px] font-bold uppercase tracking-wider border px-2 py-0.5 rounded-none",
                        asset.status === 'operational' || asset.status === 'active' || asset.status === 'available' ? "text-emerald-700 border-emerald-100 bg-emerald-50" :
                          asset.status === 'maintenance' || asset.status === 'under_maintenance' ? "text-amber-700 border-amber-100 bg-amber-50" :
                            "text-red-700 border-red-100 bg-red-50"
                      )}>
                        {asset.status.replace('_', ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 uppercase tracking-tight">
                      <span className="text-slate-400">{asset.block_wing || '---'}</span>
                      <span className="text-slate-200">|</span>
                      <span>{asset.exact_location || 'DEPOT HQ'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditAssetId(asset.id); }}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white border border-transparent hover:border-slate-200 rounded-none transition-all active:scale-95"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedAssetId(asset.id); }}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white border border-transparent hover:border-slate-200 rounded-none transition-all active:scale-95"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              )) : (
                <tr>
                  <td colSpan={5} className="py-32 text-center">
                    <Package size={40} className="mx-auto mb-4 text-slate-100" />
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No Operational Assets Found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selectedAssetId && (
          <AssetDetailsModal
            assetId={selectedAssetId}
            onClose={() => setSelectedAssetId(null)}
            onEdit={() => {
              setEditAssetId(selectedAssetId);
              setSelectedAssetId(null);
            }}
            onUpdate={fetchData}
          />
        )}

        {(isAddModalOpen || editAssetId) && (
          <AssetAddModal
            assetId={editAssetId || undefined}
            onClose={() => {
              setIsAddModalOpen(false);
              setEditAssetId(null);
            }}
            onSuccess={() => {
              setIsAddModalOpen(false);
              setEditAssetId(null);
              fetchData();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function FinancialReportingModule({ assets }: { assets: Asset[] }) {
  const stats = React.useMemo(() => {
    const totalCost = assets.reduce((s, a) => s + Number(a.purchase_cost || 0), 0);
    const activeBookValue = assets.reduce((s, a) => {
      if (a.is_disposed) return s;
      const cost = Number(a.purchase_cost || 0);
      const scrap = Number(a.scrap_value || 0);
      const life = Number(a.useful_life_years || 10);
      const pDate = a.purchase_date ? new Date(a.purchase_date) : new Date();
      const yearsPassed = (new Date().getFullYear() - pDate.getFullYear());
      const annualDep = (cost - scrap) / life;
      const totalDep = Math.min(cost - scrap, Math.max(0, annualDep * yearsPassed));
      return s + (cost - totalDep);
    }, 0);

    const disposalProfitLoss = assets.filter(a => a.is_disposed).reduce((s, a) => {
      const proceeds = Number(a.disposal_amount || 0);
      const cost = Number(a.purchase_cost || 0);
      const scrap = Number(a.scrap_value || 0);
      const life = Number(a.useful_life_years || 10);
      const pDate = a.purchase_date ? new Date(a.purchase_date) : new Date();
      const yearsPassed = (new Date(a.disposal_date || new Date()).getFullYear() - pDate.getFullYear());
      const annualDep = (cost - scrap) / life;
      const totalDep = Math.min(cost - scrap, Math.max(0, annualDep * yearsPassed));
      const bookValue = cost - totalDep;
      return s + (proceeds - bookValue);
    }, 0);

    return { totalCost, activeBookValue, disposalProfitLoss };
  }, [assets]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-none border border-slate-200 shadow-sm flex items-center gap-6">
        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-none flex items-center justify-center border border-blue-100 shadow-sm">
          <IndianRupee size={20} />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5">Lifetime Acquisition</p>
          <p className="text-xl font-bold text-slate-900 tracking-tight">₹{(stats.totalCost || 0).toLocaleString()}</p>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-6 rounded-none border border-slate-200 shadow-sm flex items-center gap-6">
        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-none flex items-center justify-center border border-emerald-100 shadow-sm">
          <TrendingUp size={20} />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5">Net Book Value</p>
          <p className="text-xl font-bold text-slate-900 tracking-tight">₹{(stats.activeBookValue || 0).toLocaleString()}</p>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={clsx("p-6 rounded-none border shadow-sm flex items-center gap-6", stats.disposalProfitLoss >= 0 ? "bg-white border-slate-200" : "bg-red-50 border-red-100")}>
        <div className={clsx("w-12 h-12 rounded-none flex items-center justify-center border shadow-sm", stats.disposalProfitLoss >= 0 ? "bg-indigo-50 text-indigo-600 border-indigo-100" : "bg-red-600 text-white border-red-700")}>
          {stats.disposalProfitLoss >= 0 ? <PieChartIcon size={20} /> : <TrendingDown size={20} />}
        </div>
        <div>
          <p className={clsx("text-[10px] font-bold uppercase tracking-widest leading-none mb-1.5", stats.disposalProfitLoss >= 0 ? "text-slate-400" : "text-red-600")}>Liquidation Yield</p>
          <p className={clsx("text-xl font-bold tracking-tight", stats.disposalProfitLoss >= 0 ? "text-slate-900" : "text-red-700")}>
            {stats.disposalProfitLoss >= 0 ? '+' : ''}₹{Math.abs(stats.disposalProfitLoss || 0).toLocaleString()}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
