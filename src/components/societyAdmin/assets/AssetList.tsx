"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Plus, Download, Package, MapPin, MoreVertical, Edit2, Boxes, ChevronRight, CheckCircle2, AlertCircle, HistoryIcon, Clock } from 'lucide-react';
import { apiClient, Asset, exportAssetsToExcel } from '@/lib/apiClient';
import clsx from 'clsx';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import AssetDetailsModal from './AssetDetailsModal';
import AssetEditModal from './AssetEditModal';

export default function AssetList() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);
  const [editAssetId, setEditAssetId] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeView, setActiveView] = useState<'list' | 'financials'>('list');
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
      <div className="flex items-center justify-center min-h-[60rem]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Asset Registry</h1>
          <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Manage and track society infrastructure</p>
        </div>
      </div>

      <div className="inline-flex p-1 bg-gray-100 rounded-xl mb-2">
        <button 
          onClick={() => setActiveView('list')}
          className={clsx("px-6 py-2 rounded-lg text-sm font-bold transition-all", activeView === 'list' ? "bg-blue-600 text-white shadow-sm" : "hover:text-gray-900 text-gray-500")}
        >
          Assets
        </button>
        <button 
          onClick={() => setActiveView('financials')}
          className={clsx("px-6 py-2 rounded-lg text-sm font-bold transition-all", activeView === 'financials' ? "bg-blue-600 text-white shadow-sm" : "hover:text-gray-900 text-gray-500")}
        >
          Financial Reports
        </button>
        <button 
          onClick={() => router.push('/societyadmin/asset-dashboard')}
          className="px-6 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-900 transition-all"
        >
          Admin Dashboard
        </button>
      </div>

      {activeView === 'list' ? (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-100 p-4 md:p-6 shadow-sm space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 flex-1">
                <div className="relative group min-w-[300px] flex-1">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 bg-gray-50 rounded-lg group-focus-within:bg-blue-50 transition-colors">
                    <Search className="text-gray-400 group-focus-within:text-blue-500" size={16} />
                  </div>
                  <input
                    type="text"
                    placeholder="Search assets by name or category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-14 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all placeholder:text-gray-400"
                  />
                </div>

                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 bg-gray-50 rounded-lg">
                    <Filter className="text-gray-400" size={16} />
                  </div>
                  <select 
                    value={activeCategory}
                    onChange={(e) => setActiveCategory(e.target.value)}
                    className="pl-14 pr-10 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium appearance-none min-w-[180px] outline-none hover:border-gray-300 transition-all cursor-pointer"
                  >
                    {categories.map(c => <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>)}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <ChevronRight className="rotate-90 text-gray-400" size={16} />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                 <button 
                   onClick={() => router.push('/societyadmin/asset-add')}
                   className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg transition-all shadow-lg active:scale-95 text-sm font-bold"
                 >
                   <Plus size={18} />
                   <span>Add Asset</span>
                 </button>
                 <button 
                   onClick={handleExport}
                   className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-3 rounded-lg transition-all shadow-lg active:scale-95 text-sm font-bold"
                 >
                   <Download size={18} />
                   <span>Export Excel</span>
                 </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden min-h-[500px]">
            {filteredAssets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-40 text-center space-y-4">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                  <Boxes size={40} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">No Assets Found</h2>
                  <p className="text-sm text-gray-500">Your search didn't match any records.</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[800px]">
                  <thead className="bg-gray-50/50 text-[11px] font-bold uppercase text-gray-400 tracking-wider">
                    <tr>
                      <th className="px-8 py-5 border-b border-gray-100">Name</th>
                      <th className="px-8 py-5 border-b border-gray-100">Category</th>
                      <th className="px-8 py-5 border-b border-gray-100">Location</th>
                      <th className="px-8 py-5 border-b border-gray-100">Status</th>
                      <th className="px-8 py-5 border-b border-gray-100">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredAssets.map(asset => (
                      <tr 
                        key={asset.id} 
                        className="group hover:bg-gray-50 transition-all cursor-pointer"
                        onClick={() => setSelectedAssetId(Number(asset.id))}
                      >
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
                              asset.status === 'missing' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                            }`}>
                              <Package size={20} />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">{asset.name}</p>
                              <p className="text-[11px] text-gray-400 font-medium">AST-ID: {asset.id.toString().padStart(4, '0')}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-[11px] font-bold shadow-sm border border-blue-100/50">
                            {asset.category}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-2 text-gray-500">
                            <MapPin size={14} className="text-gray-300" />
                            <span className="text-xs font-medium">{asset.location || 'Main Precinct'}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span
                            className={clsx(
                              'inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm border',
                              {
                                'bg-green-100 text-green-800 border-green-200': asset.status === 'in_use' || asset.status === 'active',
                                'bg-yellow-100 text-yellow-800 border-yellow-200': asset.status === 'under_maintenance',
                                'bg-red-100 text-red-800 border-red-200': asset.status === 'missing',
                                'bg-slate-100 text-slate-800 border-slate-200': asset.status === 'decommissioned',
                              }
                            )}
                          >
                            <div className={clsx('w-1.5 h-1.5 rounded-full mr-1.5', {
                              'bg-green-500': asset.status === 'in_use' || asset.status === 'active',
                              'bg-yellow-500': asset.status === 'under_maintenance',
                              'bg-red-500': asset.status === 'missing',
                              'bg-slate-500': asset.status === 'decommissioned',
                            })}></div>
                            {asset.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditAssetId(Number(asset.id));
                              }}
                              className="p-2 hover:bg-white rounded-lg transition-all text-blue-400 hover:text-blue-600 border border-transparent hover:border-blue-100 shadow-sm"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button className="p-2 hover:bg-white rounded-lg transition-all text-gray-300 hover:text-red-500">
                              <MoreVertical size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="p-6 border-t border-gray-50 bg-gray-50/50 flex items-center justify-between">
              <p className="text-xs font-medium text-gray-400">
                Showing <span className="text-gray-900">1 to {filteredAssets.length}</span> of <span className="text-gray-900">{filteredAssets.length}</span> assets
              </p>
              <div className="flex items-center gap-2">
                <button className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-300 cursor-not-allowed">Previous</button>
                <button className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-300 cursor-not-allowed">Next</button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <FinancialReportingModule assets={assets} onExport={handleExport} />
      )}

      {selectedAssetId && (
        <AssetDetailsModal 
          assetId={selectedAssetId} 
          onClose={() => setSelectedAssetId(null)} 
          onEdit={() => {
            setEditAssetId(selectedAssetId);
            setSelectedAssetId(null);
          }}
          onUpdate={() => {
            setSelectedAssetId(null);
            fetchData();
          }}
        />
      )}

      {editAssetId && (
        <AssetEditModal 
          assetId={editAssetId} 
          onClose={() => setEditAssetId(null)} 
          onUpdate={() => {
            setEditAssetId(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
}

function FinancialReportingModule({ assets, onExport }: { assets: Asset[], onExport: () => void }) {
  const [reportType, setReportType] = useState<'register' | 'depreciation' | 'disposal'>('register');

  const metrics = React.useMemo(() => {
    const totalPurchase = assets.reduce((sum, a) => sum + Number(a.purchase_cost || 0), 0);
    const totalDisposal = assets.filter(a => a.is_disposed).reduce((sum, a) => sum + Number(a.disposal_amount || 0), 0);
    
    const totalDepreciation = assets.reduce((sum, a) => {
      if (a.purchase_cost && a.useful_life_years) {
        const cost = Number(a.purchase_cost);
        const scrap = Number(a.scrap_value || 0);
        const purchaseDate = a.purchase_date ? new Date(a.purchase_date) : new Date();
        const yearsPassed = (new Date().getFullYear() - purchaseDate.getFullYear());
        const annualDep = (cost - scrap) / a.useful_life_years;
        return sum + Math.min(cost - scrap, Math.max(0, annualDep * yearsPassed));
      }
      return sum;
    }, 0);

    const totalCurrentValue = totalPurchase - totalDepreciation;
    
    const totalProfitLoss = assets.filter(a => a.is_disposed).reduce((sum, a) => {
       const cost = Number(a.purchase_cost || 0);
       const scrap = Number(a.scrap_value || 0);
       const annualDep = (cost - scrap) / (a.useful_life_years || 10);
       const dDate = a.disposal_date ? new Date(a.disposal_date) : new Date();
       const pDate = a.purchase_date ? new Date(a.purchase_date) : new Date();
       const yearsPassed = (dDate.getFullYear() - pDate.getFullYear());
       const bookValueAtDisposal = cost - (annualDep * Math.max(0, yearsPassed));
       return sum + (Number(a.disposal_amount || 0) - bookValueAtDisposal);
    }, 0);

    return { totalPurchase, totalCurrentValue, totalDepreciation, totalProfitLoss, totalDisposal };
  }, [assets]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-2">
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Global Asset Value</p>
           <p className="text-2xl font-black text-gray-900">₹{metrics.totalCurrentValue.toLocaleString()}</p>
           <p className="text-[10px] font-bold text-gray-400 italic">Net Book Value</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-2">
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Accumulated Dep.</p>
           <p className="text-2xl font-black text-red-600">₹{metrics.totalDepreciation.toLocaleString()}</p>
           <p className="text-[10px] font-bold text-red-400 italic">Total Value Loss</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-2">
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Liquidation Revenue</p>
           <p className="text-2xl font-black text-emerald-600">₹{metrics.totalDisposal.toLocaleString()}</p>
           <p className="text-[10px] font-bold text-emerald-400 italic">From Disposals</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-2">
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Net Realized P/L</p>
           <p className={clsx("text-2xl font-black", metrics.totalProfitLoss >= 0 ? "text-emerald-600" : "text-red-600")}>
              {metrics.totalProfitLoss >= 0 ? '+' : ''}₹{Math.abs(metrics.totalProfitLoss).toLocaleString()}
           </p>
           <p className="text-[10px] font-bold text-gray-400 italic">Liquidation Outcome</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
           <div className="flex gap-4">
              <button 
                onClick={() => setReportType('register')}
                className={clsx("text-xs font-black uppercase tracking-widest pb-1 border-b-2 transition-all", reportType === 'register' ? "border-blue-600 text-blue-600" : "border-transparent text-gray-400 hover:text-gray-600")}
              >
                Asset Register
              </button>
              <button 
                onClick={() => setReportType('depreciation')}
                className={clsx("text-xs font-black uppercase tracking-widest pb-1 border-b-2 transition-all", reportType === 'depreciation' ? "border-blue-600 text-blue-600" : "border-transparent text-gray-400 hover:text-gray-600")}
              >
                Depreciation Audit
              </button>
              <button 
                onClick={() => setReportType('disposal')}
                className={clsx("text-xs font-black uppercase tracking-widest pb-1 border-b-2 transition-all", reportType === 'disposal' ? "border-blue-600 text-blue-600" : "border-transparent text-gray-400 hover:text-gray-600")}
              >
                Liquidation Report
              </button>
           </div>
           <button 
             onClick={onExport}
             className="p-2 bg-white border border-gray-200 rounded-lg text-gray-400 hover:text-blue-600 transition-all shadow-sm"
           >
              <Download size={16} />
           </button>
        </div>

        <div className="flex-1 overflow-x-auto">
           <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50/50 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                 {reportType === 'register' && (
                   <tr>
                      <th className="px-8 py-5">Asset Descriptor</th>
                      <th className="px-8 py-5">Purchase Cost</th>
                      <th className="px-8 py-5">Current Valuation</th>
                      <th className="px-8 py-5">Total Dep.</th>
                      <th className="px-8 py-5">System Status</th>
                   </tr>
                 )}
                 {reportType === 'depreciation' && (
                   <tr>
                      <th className="px-8 py-5">Asset</th>
                      <th className="px-8 py-5">Valuation Method</th>
                      <th className="px-8 py-5">Useful Life</th>
                      <th className="px-8 py-5">Scrap Value</th>
                      <th className="px-8 py-5">Book Value</th>
                   </tr>
                 )}
                 {reportType === 'disposal' && (
                   <tr>
                      <th className="px-8 py-5">Liquidated Asset</th>
                      <th className="px-8 py-5">Purchase Value</th>
                      <th className="px-8 py-5">Disposal Date</th>
                      <th className="px-8 py-5">Sale Amount</th>
                      <th className="px-8 py-5">Outcome</th>
                   </tr>
                 )}
              </thead>
              <tbody className="divide-y divide-gray-100">
                 {assets.filter(a => {
                    if (reportType === 'disposal') return a.is_disposed;
                    return true;
                 }).map(asset => {
                    const cost = Number(asset.purchase_cost || 0);
                    const scrap = Number(asset.scrap_value || 0);
                    const life = Number(asset.useful_life_years || 10);
                    const pDate = asset.purchase_date ? new Date(asset.purchase_date) : new Date();
                    const yearsPassed = (new Date().getFullYear() - pDate.getFullYear());
                    const annualDep = (cost - scrap) / life;
                    const totalDep = Math.min(cost - scrap, Math.max(0, annualDep * yearsPassed));
                    const currentVal = cost - totalDep;

                    return (
                      <tr key={asset.id} className="hover:bg-gray-50 transition-all">
                        {reportType === 'register' && (
                          <>
                            <td className="px-8 py-5 font-bold text-gray-900 text-sm">
                               {asset.name}
                               <p className="text-[10px] text-gray-400 lowercase font-medium">AST-{asset.id}</p>
                            </td>
                            <td className="px-8 py-5 font-bold text-gray-800 text-sm">₹{cost.toLocaleString()}</td>
                            <td className="px-8 py-5 font-bold text-blue-600 text-sm">₹{currentVal.toLocaleString()}</td>
                            <td className="px-8 py-5 font-bold text-red-400 text-sm">₹{totalDep.toLocaleString()}</td>
                            <td className="px-8 py-5">
                               <span className={clsx("px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter shadow-sm border", 
                                  asset.status === 'decommissioned' ? "bg-slate-100 text-slate-600 border-slate-200" : "bg-blue-50 text-blue-600 border-blue-100")}>
                                  {asset.status}
                               </span>
                            </td>
                          </>
                        )}
                        {reportType === 'depreciation' && (
                          <>
                            <td className="px-8 py-5 font-bold text-gray-900 text-sm">{asset.name}</td>
                            <td className="px-8 py-5 font-bold text-gray-400 text-xs tracking-widest uppercase">Straight Line (SLM)</td>
                            <td className="px-8 py-5 font-bold text-gray-800 text-sm">{life} Years</td>
                            <td className="px-8 py-5 font-bold text-gray-800 text-sm">₹{scrap.toLocaleString()}</td>
                            <td className="px-8 py-5 font-black text-blue-600 text-sm">₹{currentVal.toLocaleString()}</td>
                          </>
                        )}
                        {reportType === 'disposal' && (
                          <>
                            <td className="px-8 py-5 font-bold text-gray-900 text-sm">{asset.name}</td>
                            <td className="px-8 py-5 font-bold text-gray-800 text-sm">₹{cost.toLocaleString()}</td>
                            <td className="px-8 py-5 font-bold text-gray-400 text-xs">{asset.disposal_date ? format(new Date(asset.disposal_date), 'MMM dd, yyyy') : 'N/A'}</td>
                            <td className="px-8 py-5 font-black text-emerald-600 text-sm">₹{Number(asset.disposal_amount || 0).toLocaleString()}</td>
                            <td className="px-8 py-5 font-bold text-sm">
                               {(() => {
                                  const dDate = asset.disposal_date ? new Date(asset.disposal_date) : new Date();
                                  const pDate = asset.purchase_date ? new Date(asset.purchase_date) : new Date();
                                  const yearsPass = (dDate.getFullYear() - pDate.getFullYear());
                                  const bVal = cost - (annualDep * Math.max(0, yearsPass));
                                  const diff = Number(asset.disposal_amount || 0) - bVal;
                                  return (
                                     <span className={diff >= 0 ? "text-emerald-600" : "text-red-600"}>
                                        {diff >= 0 ? 'PROFIT' : 'LOSS'} (₹{Math.abs(diff).toLocaleString()})
                                     </span>
                                  );
                               })()}
                            </td>
                          </>
                        )}
                      </tr>
                    );
                 })}
              </tbody>
           </table>
        </div>
      </div>
    </div>
  );
}
