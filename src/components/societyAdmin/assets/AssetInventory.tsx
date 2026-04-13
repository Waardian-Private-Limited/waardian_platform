'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Filter, Plus, Package, 
  AlertCircle, TrendingDown,
  Activity, ChevronRight, X, Save,
  Truck, ArrowDownRight, ArrowUpRight, History, 
  MapPin, Clock, Info, User, Hammer, Loader2, CheckCircle, FilePlus, FileText,
  RefreshCw, IndianRupee, Layers, LayoutGrid, List, ChevronLeft
} from 'lucide-react';
import { 
  getInventoryList, createInventoryItem, updateInventoryStock, 
  getInventoryDashboard, getInventoryLogs, getAllAssets, getVendorsList,
  getStaffList, uploadFiles 
} from '@/lib/apiClient';
import { toast } from 'react-hot-toast';
import { format, isValid } from 'date-fns';
import clsx from 'clsx';

export default function AssetInventory() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isOpeningHistory, setIsOpeningHistory] = useState(false);
  const [historyData, setHistoryData] = useState<any>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [invRes, dashRes] = await Promise.all([
        getInventoryList(),
        getInventoryDashboard()
      ]);
      if (invRes.success) setInventory(invRes.data || []);
      if (dashRes.success) setDashboardData(dashRes.data);
    } catch (error) {
      toast.error('Failed to sync inventory');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openHistory = async (itemId: number) => {
    if (isOpeningHistory) return;
    setIsOpeningHistory(true);
    const loadId = toast.loading('Accessing Transaction History...');
    try {
      const res = await getInventoryLogs(itemId);
      if (res.success && res.data) {
        setHistoryData(res.data);
        setIsHistoryOpen(true);
        toast.dismiss(loadId);
      } else {
        toast.error('Ledger data unavailable for this resource', { id: loadId });
      }
    } catch (err) {
      toast.error('Protocol retrieval failure', { id: loadId });
    } finally {
      setIsOpeningHistory(false);
    }
  };

  const filteredInventory = useMemo(() => {
    return inventory.filter(i => 
      i.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.item_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [inventory, searchQuery]);

  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage);
  const paginatedList = filteredInventory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const stats = {
    total_items: dashboardData?.stats?.total_items ?? 0,
    low_stock_count: dashboardData?.stats?.low_stock_count ?? 0,
    total_inventory_value: dashboardData?.stats?.total_inventory_value ?? 0
  };
  const recentLogs = dashboardData?.recentLogs || [];

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="animate-spin text-blue-600" size={40} />
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none">Accessing Inventory Vault...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Modals */}
      {isAddModalOpen && <AddInventoryModal onClose={() => setIsAddModalOpen(false)} onSuccess={() => { setIsAddModalOpen(false); fetchData(); }} />}
      {isActionModalOpen && <StockActionModal item={selectedItem} onClose={() => setIsActionModalOpen(false)} onSuccess={() => { setIsActionModalOpen(false); fetchData(); }} />}
      {isHistoryOpen && <InventoryHistoryView data={historyData} onClose={() => setIsHistoryOpen(false)} onAction={() => { setIsHistoryOpen(false); setIsActionModalOpen(true); setSelectedItem(historyData.item); }} />}

      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-100 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/10">
              <Package className="text-white w-6 h-6" />
           </div>
           <div>
             <h1 className="text-xl font-bold text-gray-900 tracking-tight leading-none mb-1 uppercase">Asset Inventory</h1>
             <p className="text-xs text-gray-500 font-medium tracking-tight">Spare parts, consumables, and tactical resources</p>
           </div>
        </div>
        
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-lg shadow-blue-500/10 transition-all active:scale-95 font-black uppercase text-[10px] tracking-widest flex items-center gap-2"
        >
           <Plus size={16} />
           Provision Item
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
         <StatsTile label="Total Stock" value={stats.total_items.toString()} icon={<Layers size={20} />} color="blue" />
         <StatsTile label="Critical Level" value={stats.low_stock_count.toString()} icon={<TrendingDown size={20} />} color="red" />
         <StatsTile label="Recent Inflows" value={recentLogs.length.toString()} icon={<Activity size={20} />} color="indigo" />
         <StatsTile label="Valuation" value={Number(stats.total_inventory_value).toLocaleString()} isCurrency icon={<Truck size={20} />} color="emerald" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         <div className="lg:col-span-8 space-y-4">
            <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
               <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/30">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Stock Ledger</h3>
                  <div className="relative w-full sm:w-auto">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input 
                         type="text" 
                         placeholder="SEARCH REGISTRY..." 
                         value={searchQuery}
                         onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                         className="w-full sm:w-64 pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[10px] font-bold uppercase tracking-widest outline-none focus:ring-2 focus:ring-blue-100 transition-all" 
                      />
                  </div>
               </div>
               
               {paginatedList.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-20 text-center opacity-20">
                     <Package size={48} className="text-gray-400 mb-4" />
                     <p className="text-[10px] font-black uppercase tracking-widest">No matching resources found</p>
                  </div>
               ) : (
                  <div className="flex-1 flex flex-col">
                     <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left">
                           <thead className="bg-white text-[9px] uppercase tracking-[0.2em] text-gray-400 font-black border-b border-gray-100">
                              <tr>
                                 <th className="px-6 py-5">Resource Details</th>
                                 <th className="px-6 py-5">Current Reserve</th>
                                 <th className="px-6 py-5">Tactical Location</th>
                                 <th className="px-6 py-5 text-right">Action</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-50">
                              {paginatedList.map(item => (
                                 <tr key={item.id} className="group hover:bg-gray-50 transition-all cursor-pointer" onClick={() => openHistory(item.id)}>
                                    <td className="px-6 py-5">
                                       <div className="flex items-center gap-4">
                                          <div className={clsx(
                                            "w-10 h-10 rounded-lg flex items-center justify-center border shadow-sm transition-all group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600",
                                            item.quantity <= item.min_stock ? 'bg-red-50 text-red-600 border-red-100' : 'bg-white text-gray-400 border-gray-100'
                                          )}>
                                             <Package size={18} />
                                          </div>
                                          <div>
                                             <div className="font-bold text-gray-900 text-sm uppercase tracking-tight mb-1 group-hover:text-blue-600 transition-colors">{item.item_name}</div>
                                             <div className="text-[9px] text-gray-400 font-black uppercase tracking-widest leading-none">{item.category} • {item.item_code}</div>
                                          </div>
                                       </div>
                                    </td>
                                    <td className="px-6 py-5">
                                       <div className="flex flex-col">
                                          <div className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                             {item.quantity} 
                                             <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest">{item.unit}</span>
                                          </div>
                                          {item.quantity <= item.min_stock && (
                                             <span className="text-[8px] font-black text-red-600 uppercase tracking-widest mt-1 animate-pulse italic leading-none">CRITICAL LEVEL</span>
                                          )}
                                       </div>
                                    </td>
                                    <td className="px-6 py-5">
                                       <div className="text-[10px] uppercase font-bold text-gray-500 tracking-tight leading-none bg-gray-50 px-3 py-1.5 rounded border border-gray-100 w-fit">{item.storage_location || 'Point: HQ'}</div>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                       <button 
                                         onClick={(e) => { e.stopPropagation(); setSelectedItem(item); setIsActionModalOpen(true); }}
                                         className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all hover:bg-blue-600 hover:text-white hover:border-blue-600 shadow-sm active:scale-95"
                                       >
                                          Refactor Stock
                                       </button>
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>

                     {/* Pagination Controls */}
                     <div className="p-6 border-t border-gray-100 bg-white flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none">
                             Page <span className="text-gray-900">{currentPage}</span> of <span className="text-gray-900">{totalPages || 1}</span>
                           </p>
                           <div className="h-4 w-[1px] bg-gray-100" />
                           <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest leading-none">
                              Syncing <span className="text-gray-500">{paginatedList.length}</span> of <span className="text-gray-500">{filteredInventory.length}</span> Objects
                           </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={clsx(
                              "px-4 py-2 border rounded-lg text-[10px] font-black uppercase tracking-widest transition-all active:scale-95",
                              currentPage === 1 ? "bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                            )}
                          >
                            Previous
                          </button>
                          <button 
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className={clsx(
                              "px-4 py-2 border rounded-lg text-[10px] font-black uppercase tracking-widest transition-all active:scale-95",
                              currentPage === totalPages || totalPages === 0 ? "bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed" : "bg-blue-600 border-blue-600 text-white shadow-md hover:bg-blue-700"
                            )}
                          >
                            Next 10 Resources
                          </button>
                        </div>
                      </div>
                  </div>
               )}
            </div>
         </div>

         {/* Sidebar Timeline */}
         <div className="lg:col-span-4 space-y-4">
            <div className="bg-white border border-gray-100 rounded-lg p-6 shadow-sm flex flex-col h-full min-h-[500px]">
               <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                 <History size={14} className="text-blue-600" />
                 Transaction Timeline
               </h3>
               
               <div className="flex-1 space-y-10 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-gray-100">
                  {recentLogs.length > 0 ? recentLogs.map((log: any) => (
                    <div key={log.id} className="relative pl-8 group/log transition-all hover:translate-x-1">
                       <div className={clsx(
                         "absolute left-[-11px] top-1 w-6 h-6 rounded border-2 border-white shadow-sm flex items-center justify-center z-10",
                         log.action === 'issue' ? 'bg-amber-500 text-white' : 
                         log.action === 'add' ? 'bg-emerald-500 text-white' : 
                         'bg-sky-500 text-white'
                       )}>
                          {log.action === 'issue' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                       </div>
                       <div className="bg-gray-50/50 p-4 rounded-lg border border-gray-100 group-hover/log:bg-white transition-all group-hover/log:border-blue-100 group-hover/log:shadow-sm">
                          <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-2 leading-none">{formatDateSafe(log.created_at)}</p>
                          <p className="text-xs font-bold text-gray-900 leading-none mb-2 uppercase tracking-tight">
                            {log.action === 'issue' ? 'Withdrawal' : 'Refill'}: {log.quantity} {log.item_name}
                          </p>
                          <p className="text-[10px] text-gray-400 font-medium italic border-l-2 border-blue-100 pl-3 leading-relaxed">
                             "{log.remarks || 'NO DETAILED NOTES ATTACHED.'}"
                          </p>
                       </div>
                    </div>
                  )) : (
                    <div className="py-20 text-center opacity-20">
                       <Package size={48} className="text-gray-400 mx-auto mb-4" />
                       <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 italic font-medium">Timeline Dormant</p>
                    </div>
                  )}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}

function StatsTile({ label, value, icon, color, isCurrency }: any) {
   const colors: any = {
      blue: 'bg-blue-50 border-blue-100 text-blue-600',
      red: 'bg-red-50 border-red-100 text-red-600',
      emerald: 'bg-emerald-50 border-emerald-100 text-emerald-600',
      indigo: 'bg-indigo-50 border-indigo-100 text-indigo-600'
   };
   return (
      <div className={clsx("p-6 rounded-lg border transition-all flex items-center justify-between group hover:shadow-lg hover:bg-white", colors[color])}>
         <div>
            <p className="text-[9px] font-black uppercase tracking-widest mb-1.5 opacity-60 group-hover:opacity-100 transition-opacity">{label}</p>
            <h3 className="text-2xl font-bold tracking-tight leading-none flex items-center gap-1">
               {isCurrency && <IndianRupee size={16} className="mb-0.5" />}
               {value}
            </h3>
         </div>
         <div className="w-10 h-10 bg-white rounded flex items-center justify-center shadow-sm text-inherit transition-all group-hover:shadow-md">{icon}</div>
      </div>
   );
}

function AddInventoryModal({ onClose, onSuccess }: any) {
   const [vendors, setVendors] = useState<any[]>([]);
   const [assets, setAssets] = useState<any[]>([]);
   const [isLoading, setIsLoading] = useState(false);
   const [formData, setFormData] = useState({
      item_name: '',
      category: 'Electrical',
      description: '',
      quantity: '',
      unit: 'Pcs',
      min_stock: '5',
      purchase_date: format(new Date(), 'yyyy-MM-dd'),
      purchase_cost: '',
      vendor_id: '',
      invoice_number: '',
      storage_location: '',
      rack_shelf: '',
      linked_asset_id: '',
      used_for: 'General'
   });

   useEffect(() => {
     Promise.all([getVendorsList(), getAllAssets()]).then(([v, a]) => {
        if (v.success) setVendors(v.data || []);
        if (a.success) setAssets(a.data || []);
     });
   }, []);

   const handleSubmit = async (e: any) => {
      e.preventDefault();
      setIsLoading(true);
      try {
         const res = await createInventoryItem(formData);
         if (res.success) {
            toast.success('Inventory resource committed');
            onSuccess();
         }
      } catch (err: any) {
         toast.error(err.message || 'Creation failed');
      } finally {
         setIsLoading(false);
      }
   };

   return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
         <div className="bg-white w-full max-w-xl rounded-lg shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-500 border border-gray-100 flex flex-col max-h-[90vh]">
            <div className="p-6 bg-blue-600 text-white flex justify-between items-center shrink-0">
               <div className="flex items-center gap-3">
                  <Package size={20} />
                  <h2 className="text-xl font-bold tracking-tight uppercase leading-none">Resource Provisioning</h2>
               </div>
               <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-all active:scale-90"><X size={20} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
               <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block pl-1">Item Nomenclature *</label>
                     <input required type="text" placeholder="E.G. COPPER CONDUCTOR 2.5MM" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 font-bold text-xs h-10 uppercase outline-none" value={formData.item_name} onChange={e => setFormData({...formData, item_name: e.target.value})} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block pl-1">Category Registry</label>
                        <select className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg font-bold text-xs h-10 uppercase outline-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                           <option value="Electrical">Electrical Ops</option>
                           <option value="Plumbing">Plumbing Ops</option>
                           <option value="Cleaning">Sanitation</option>
                           <option value="Tools">Tactical Tools</option>
                           <option value="Safety">HSSE Protocol</option>
                        </select>
                     </div>
                     <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block pl-1">Reserve Unit</label>
                        <select className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg font-bold text-xs h-10 uppercase outline-none" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})}>
                           <option value="Pcs">Units (Pcs)</option>
                           <option value="Liters">Bulk (Ltrs)</option>
                           <option value="Kgs">Mass (Kgs)</option>
                           <option value="Rolls">Spools (Rolls)</option>
                        </select>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block pl-1">Initial Reserve</label>
                        <input type="number" placeholder="0" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg font-bold text-xs h-10 outline-none" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} />
                     </div>
                     <div>
                        <label className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1.5 block pl-1">Critical Threshold</label>
                        <input type="number" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg font-bold text-xs h-10 outline-none focus:ring-2 focus:ring-red-100" value={formData.min_stock} onChange={e => setFormData({...formData, min_stock: e.target.value})} />
                     </div>
                  </div>

                  <div>
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block pl-1">Tactical Deployment Location</label>
                     <input type="text" placeholder="E.G. SECTOR A-12, CENTRAL DEPOT" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg font-bold text-xs h-10 uppercase outline-none" value={formData.storage_location} onChange={e => setFormData({...formData, storage_location: e.target.value})} />
                  </div>

                  <div className="flex gap-4 pt-6 mt-4 border-t border-gray-100">
                     <button type="button" onClick={onClose} className="flex-1 py-3 text-[10px] font-black uppercase text-gray-400 hover:text-gray-900 transition-all tracking-widest">Abort Provisioning</button>
                     <button 
                       type="submit" 
                       disabled={isLoading}
                       className="flex-[2] py-4 bg-blue-600 text-white rounded-lg font-black uppercase text-xs tracking-[0.2em] shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2 hover:bg-blue-700 transition-all active:scale-95 disabled:bg-gray-100 disabled:text-gray-400"
                     >
                        {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Commit Resource
                     </button>
                  </div>
               </form>
            </div>
         </div>
      </div>
   );
}

function StockActionModal({ item, onClose, onSuccess }: any) {
   const [action, setAction] = useState<'issue' | 'add' | 'return'>('issue');
   const [quantity, setQuantity] = useState('');
   const [remarks, setRemarks] = useState('');
   const [isSubmitting, setIsSubmitting] = useState(false);

   const handleSubmit = async (e: any) => {
      e.preventDefault();
      const numQty = parseFloat(quantity);
      
      if (isNaN(numQty) || numQty <= 0) {
         return toast.error('Quantity must be greater than zero');
      }

      if (action === 'issue' && numQty > item.quantity) {
         return toast.error(`Inadequate Reserve: Only ${item.quantity} ${item.unit} available`);
      }

      setIsSubmitting(true);
      try {
         const res = await updateInventoryStock({
            itemId: item.id,
            action,
            quantity: numQty,
            remarks
         });
         if (res.success) {
            toast.success(`Protocol Committed: ${action.toUpperCase()}`);
            onSuccess();
         }
      } catch (err: any) {
         toast.error(err.message || 'Transmission failure');
      } finally {
         setIsSubmitting(false);
      }
   };

   return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
         <div className="bg-white w-full max-w-md rounded-lg shadow-2xl overflow-hidden border border-gray-100">
            <div className={clsx("p-6 text-white flex justify-between items-center", action === 'issue' ? 'bg-amber-500 shadow-lg shadow-amber-500/10' : 'bg-blue-600 shadow-lg shadow-blue-500/10')}>
               <div className="flex items-center gap-3">
                  <Activity size={18} />
                  <h3 className="font-bold uppercase tracking-tight text-sm leading-none">Resource Adjustment: {item.item_name}</h3>
               </div>
               <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-lg transition-all active:scale-90"><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8">
               <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-100 shadow-sm gap-1">
                  {[
                    { val: 'issue', label: 'Withdrawal' },
                    { val: 'add', label: 'Refill' },
                    { val: 'return', label: 'Return' }
                  ].map(tab => (
                    <button 
                      key={tab.val}
                      type="button"
                      onClick={() => setAction(tab.val as any)}
                      className={clsx(
                         "flex-1 py-2.5 rounded text-[10px] font-black uppercase tracking-widest transition-all",
                         action === tab.val ? "bg-white text-gray-900 shadow-md" : "text-gray-400 hover:text-gray-700 font-bold"
                      )}
                    >
                       {tab.label}
                    </button>
                  ))}
               </div>

               <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block text-center">Adjustment Payload ({item.unit})</label>
                  <input required type="number" min="0.01" step="0.01" className="w-full px-6 py-5 bg-gray-50 border-none rounded-lg font-black text-3xl text-center outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-gray-200" placeholder="0.00" value={quantity} onChange={e => setQuantity(e.target.value)} />
               </div>
               
               <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block pl-1">Technical Notes / Reason</label>
                  <textarea rows={2} placeholder="REASON FOR ADJUSTMENT..." className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold uppercase outline-none resize-none shadow-inner focus:ring-2 focus:ring-blue-100" value={remarks} onChange={e => setRemarks(e.target.value)} />
               </div>

               <button 
                  type="submit"
                  disabled={isSubmitting}
                  className={clsx(
                    "w-full py-4 text-white rounded-lg font-black uppercase text-xs tracking-[0.2em] shadow-lg transition-all active:scale-95 disabled:opacity-50",
                    action === 'issue' ? 'bg-amber-500 shadow-amber-500/10' : 'bg-blue-600 shadow-blue-500/10'
                  )}
               >
                  {isSubmitting ? <RefreshCw size={16} className="animate-spin mx-auto" /> : 'Commit Transaction'}
               </button>
            </form>
         </div>
      </div>
   );
}

function InventoryHistoryView({ data, onClose, onAction }: any) {
   if (!data || !data.item) return null;
   const { item, logs = [] } = data;
   return (
      <div className="fixed inset-0 z-[120] flex justify-end bg-black/50 backdrop-blur-sm">
         <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 border-l border-gray-100">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
               <div>
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight uppercase leading-none mb-2">{item.item_name}</h2>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">{item.item_code} <span className="mx-2 text-gray-100">|</span> Category: {item.category}</p>
               </div>
               <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-all active:scale-90"><X size={24} /></button>
            </div>

            <div className="p-8 grid grid-cols-2 gap-4 shrink-0">
               <div className="p-5 bg-blue-50 rounded-lg border border-blue-100 shadow-sm">
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1.5 leading-none">Reserve Status</p>
                  <p className="text-2xl font-black text-gray-900 leading-none">{item.quantity} <span className="text-[10px] font-black text-gray-400">{item.unit}</span></p>
               </div>
               <div className="p-5 bg-gray-50 rounded-lg border border-gray-100 shadow-sm">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 leading-none">Tactical Storage</p>
                  <p className="text-xs font-bold text-gray-700 uppercase truncate leading-none">{item.storage_location || 'DEPOT HQ'}</p>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-4 custom-scrollbar pb-32">
               <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-8 border-b border-gray-50 pb-4">Transaction Audit Log</h3>
               <div className="space-y-8 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-gray-100">
                  {logs.map((log: any) => (
                    <div key={log.id} className="relative pl-8 group transition-all hover:translate-x-1">
                       <div className={clsx(
                         "absolute left-[-11px] top-1 w-6 h-6 rounded border-2 border-white shadow-sm flex items-center justify-center z-10",
                         log.action === 'issue' ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'
                       )}>
                          {log.action === 'issue' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                       </div>
                       
                       <div className="bg-gray-50/50 p-5 rounded-lg border border-gray-100 hover:bg-white hover:border-blue-100 transition-all hover:shadow-sm">
                          <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-2 leading-none">{formatDateSafe(log.created_at)}</p>
                          <p className="text-sm font-bold text-gray-900 uppercase tracking-tight mb-3">
                            {log.action === 'issue' ? 'Field Withdrawal' : 'Logistics Refill'}: {log.quantity} {item.unit}
                          </p>
                          <p className="text-[11px] text-gray-500 italic bg-gray-100 p-3 rounded border-l-2 border-blue-500 leading-relaxed font-medium">
                             "{log.remarks || 'NO DETAILED NOTES RECORDED.'}"
                          </p>
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            <div className="p-6 border-t bg-gray-50/50 backdrop-blur-md shrink-0">
               <button 
                 onClick={onAction} 
                 className="w-full bg-blue-600 text-white py-3.5 rounded-lg font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-blue-500/10 active:scale-[0.98] transition-all hover:bg-blue-700 flex items-center justify-center gap-3 border border-blue-500"
               >
                  <Activity size={14} />
                  Execute Stock Adjustment
               </button>
            </div>
         </div>
      </div>
   );
}

function formatDateSafe(date: any) {
   if (!date) return 'UNSCHEDULED';
   const d = new Date(date);
   return isValid(d) ? format(d, 'dd MMM yyyy, HH:mm') : 'INVALID DATA';
}
