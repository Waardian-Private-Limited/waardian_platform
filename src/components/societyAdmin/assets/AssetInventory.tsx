'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
   Search, Plus, Package,
   TrendingDown,
   Activity, X, Save,
   ArrowDownRight, ArrowUpRight, History,
   Loader2, RefreshCw, IndianRupee, Layers, ChevronLeft, ChevronRight, Inbox
} from 'lucide-react';
import {
   getInventoryList, createInventoryItem, updateInventoryStock,
   getInventoryDashboard, getInventoryLogs, getAllAssets, getVendorsList
} from '@/lib/apiClient';
import { toast } from 'react-hot-toast';
import { format, isValid } from 'date-fns';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface InventoryItem {
   id: number;
   item_name: string;
   item_code: string;
   category: string;
   quantity: number;
   min_stock: number;
   unit: string;
   storage_location?: string;
}

interface InventoryLog {
   id: number;
   action: 'issue' | 'add' | 'return';
   quantity: number;
   item_name: string;
   remarks?: string;
   created_at: string;
}

interface InventoryDashboardData {
   stats: {
      total_items: number;
      low_stock_count: number;
      total_inventory_value: number;
   };
   recentLogs: InventoryLog[];
}

interface InventoryHistoryData {
   item: InventoryItem;
   logs: InventoryLog[];
}

export default function AssetInventory() {
   const [inventory, setInventory] = useState<InventoryItem[]>([]);
   const [dashboardData, setDashboardData] = useState<InventoryDashboardData | null>(null);
   const [isLoading, setIsLoading] = useState(true);
   const [isAddModalOpen, setIsAddModalOpen] = useState(false);
   const [isActionModalOpen, setIsActionModalOpen] = useState(false);
   const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
   const [isOpeningHistory, setIsOpeningHistory] = useState(false);
   const [historyData, setHistoryData] = useState<InventoryHistoryData | null>(null);
   const [isHistoryOpen, setIsHistoryOpen] = useState(false);
   const [searchQuery, setSearchQuery] = useState('');

   // Pagination State
   const [currentPage, setCurrentPage] = useState(1);
   const itemsPerPage = 10;
   const router = useRouter();

   const fetchData = async () => {
      setIsLoading(true);
      try {
         const [invRes, dashRes] = await Promise.all([
            getInventoryList(),
            getInventoryDashboard()
         ]);
         if (invRes.success) setInventory(invRes.data || []);
         if (dashRes.success) setDashboardData(dashRes.data);
      } catch {
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
      } catch {
         toast.error('Protocol retrieval failure', { id: loadId });
      } finally {
         setIsOpeningHistory(false);
      }
   };

   const filteredInventory = useMemo(() => {
      return inventory.filter(i =>
         (i.item_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
         (i.item_code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
         (i.category || '').toLowerCase().includes(searchQuery.toLowerCase())
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
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">Accessing Inventory Vault...</p>
         </div>
      );
   }

   return (
      <div className="space-y-6 animate-in fade-in duration-500 pb-20 font-sans">
         {/* Modals */}
         <AnimatePresence>
            {isAddModalOpen && <AddInventoryModal onClose={() => setIsAddModalOpen(false)} onSuccess={() => { setIsAddModalOpen(false); fetchData(); }} />}
            {isActionModalOpen && <StockActionModal item={selectedItem} onClose={() => setIsActionModalOpen(false)} onSuccess={() => { setIsActionModalOpen(false); fetchData(); }} />}
            {isHistoryOpen && <InventoryHistoryView data={historyData} onClose={() => setIsHistoryOpen(false)} onAction={() => { setIsHistoryOpen(false); setIsActionModalOpen(true); setSelectedItem(historyData?.item || null); }} />}
         </AnimatePresence>

         {/* Header Area */}
         <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2">
            <div className="flex items-center gap-3">

               <div>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none mb-1">Asset Inventory</h1>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">Resource Logistics & Provisioning</p>
               </div>
            </div>


         </div>

         {/* KPI Section */}
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
               { label: 'Total Stock', value: stats.total_items, icon: <Layers size={18} />, color: 'blue' },
               { label: 'Critical Level', value: stats.low_stock_count, icon: <TrendingDown size={18} />, color: 'red' },
               { label: 'Recent Inflows', value: recentLogs.length, icon: <Activity size={18} />, color: 'blue' },
               { label: 'Total Valuation', value: `₹${Number(stats.total_inventory_value || 0).toLocaleString()}`, icon: <IndianRupee size={18} />, color: 'emerald' }
            ].map((stat, i) => (
               <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white p-5 rounded-none border border-slate-200 shadow-sm hover:shadow-md transition-all group"
               >
                  <div className="flex justify-between items-start mb-4">
                     <div className={clsx(
                        "p-2.5 rounded-none border transition-transform group-hover:scale-105 shadow-sm",
                        stat.color === 'blue' ? "bg-blue-50 text-blue-600 border-blue-100" :
                           stat.color === 'red' ? "bg-red-50 text-red-600 border-red-100" :
                              stat.color === 'emerald' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                 "bg-slate-50 text-slate-400 border-slate-100"
                     )}>
                        {stat.icon}
                     </div>
                     <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Logistics</div>
                  </div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">{stat.label}</p>
                  <h3 className="text-2xl font-bold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">{stat.value}</h3>
               </motion.div>
            ))}
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Main Content Pane */}
            <div className="lg:col-span-8 space-y-6">
               <div className="bg-white rounded-none border border-slate-200 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
                  {/* Integrated Header */}
                  <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-slate-50/50">
                     <div className="flex items-center gap-2 p-1 bg-white rounded-none border border-slate-200 shadow-sm w-fit">
                        <div className="px-5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-900">
                           Stock Ledger
                        </div>
                     </div>

                     <div className="relative group">
                        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                        <input
                           type="text"
                           placeholder="QUICK AUDIT..."
                           value={searchQuery}
                           onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                           className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-none text-[10px] font-bold uppercase tracking-widest outline-none focus:ring-1 focus:ring-blue-100 transition-all w-full sm:w-48 placeholder:text-slate-300"
                        />
                     </div>
                  </div>

                  {/* List Panel */}
                  <div className="flex-1 overflow-x-auto">
                     {paginatedList.length === 0 ? (
                        <div className="p-32 text-center">
                           <div className="w-16 h-16 bg-slate-50 rounded-none flex items-center justify-center mx-auto mb-4 border border-slate-100">
                              <Inbox size={32} className="text-slate-300" />
                           </div>
                           <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No matching resources found</p>
                        </div>
                     ) : (
                        <div className="flex flex-col h-full">
                           <table className="w-full text-left">
                              <thead>
                                 <tr className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 tracking-wider border-b border-slate-100">
                                    <th className="px-8 py-4">Resource Details</th>
                                    <th className="px-8 py-4">Current Reserve</th>
                                    <th className="px-8 py-4">Tactical Location</th>
                                    <th className="px-8 py-4 text-right">Operations</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                 {paginatedList.map((item, i) => (
                                    <motion.tr
                                       key={item.id}
                                       initial={{ opacity: 0 }}
                                       animate={{ opacity: 1 }}
                                       transition={{ delay: i * 0.02 }}
                                       className="hover:bg-slate-50 transition-all group cursor-pointer"
                                       onClick={() => openHistory(item.id)}
                                    >
                                       <td className="px-8 py-5">
                                          <div className="flex items-center gap-4">
                                             <div className={clsx(
                                                "w-10 h-10 rounded-none flex items-center justify-center border transition-all group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 shadow-sm",
                                                item.quantity <= item.min_stock ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                                             )}>
                                                <Package size={18} />
                                             </div>
                                             <div>
                                                <div className="font-bold text-slate-900 text-sm tracking-tight mb-1 group-hover:text-blue-600 transition-colors uppercase">{item.item_name}</div>
                                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">{item.category} • {item.item_code}</div>
                                             </div>
                                          </div>
                                       </td>
                                       <td className="px-8 py-5">
                                          <div className="flex flex-col gap-1">
                                             <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                                {item.quantity}
                                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{item.unit}</span>
                                             </div>
                                             {item.quantity <= item.min_stock && (
                                                <span className="text-[8px] font-bold text-red-600 uppercase tracking-widest animate-pulse leading-none italic">Critical Threshold</span>
                                             )}
                                          </div>
                                       </td>
                                       <td className="px-8 py-5">
                                          <div className="text-[9px] uppercase font-bold text-slate-500 tracking-widest leading-none bg-slate-100 px-3 py-1.5 rounded-none border border-slate-200 w-fit">{item.storage_location || 'DEPOT HQ'}</div>
                                       </td>
                                       <td className="px-8 py-5 text-right">
                                          <button
                                             onClick={(e) => { e.stopPropagation(); setSelectedItem(item); setIsActionModalOpen(true); }}
                                             className="bg-slate-900 text-white px-4 py-1.5 rounded-none text-[9px] font-bold uppercase tracking-widest transition-all hover:bg-blue-600 shadow-sm active:scale-95"
                                          >
                                             Refactor
                                          </button>
                                       </td>
                                    </motion.tr>
                                 ))}
                              </tbody>
                           </table>

                           {/* Pagination */}
                           <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between mt-auto">
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                 Page {currentPage} / {totalPages || 1} • {filteredInventory.length} OBJECTS
                              </p>
                              <div className="flex items-center gap-2">
                                 <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="p-2 bg-white border border-slate-200 rounded-none text-slate-400 hover:text-blue-600 disabled:opacity-30 shadow-sm transition-all active:scale-95"
                                 >
                                    <ChevronLeft size={16} />
                                 </button>
                                 <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                    className="p-2 bg-white border border-slate-200 rounded-none text-slate-400 hover:text-blue-600 disabled:opacity-30 shadow-sm transition-all active:scale-95"
                                 >
                                    <ChevronRight size={16} />
                                 </button>
                              </div>
                           </div>
                        </div>
                     )}
                  </div>
               </div>
            </div>

            {/* Sidebar Timeline */}
            <div className="lg:col-span-4 space-y-6">
               <div className="bg-white rounded-none p-8 shadow-sm flex flex-col h-full min-h-[500px] border border-slate-200 relative overflow-hidden group">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-900 flex items-center gap-3 border-b border-slate-100 pb-6 mb-8">
                     <div className="p-2.5 bg-slate-900 text-white rounded-none">
                        <History size={16} />
                     </div>
                     Transaction Timeline
                  </h3>

                  <div className="flex-1 space-y-10 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
                     {recentLogs.length > 0 ? recentLogs.map((log: InventoryLog) => (
                        <div key={log.id} className="relative pl-10 group/log transition-all hover:translate-x-1">
                           <div className={clsx(
                              "absolute left-[-11px] top-1 w-6 h-6 rounded-none border-2 border-white shadow-sm flex items-center justify-center z-10",
                              log.action === 'issue' ? 'bg-amber-500 text-white' :
                                 log.action === 'add' ? 'bg-emerald-500 text-white' :
                                    'bg-blue-600 text-white'
                           )}>
                              {log.action === 'issue' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                           </div>
                           <div className="bg-slate-50/50 p-5 rounded-none border border-slate-100 group-hover/log:bg-white transition-all group-hover/log:border-blue-100 group-hover/log:shadow-md">
                              <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest mb-2 leading-none">{formatDateSafe(log.created_at)}</p>
                              <p className="text-xs font-bold text-slate-900 leading-none mb-4 tracking-tight uppercase">
                                 {log.action === 'issue' ? 'Withdrawal' : 'Refill'}: {log.quantity} {log.item_name}
                              </p>
                              <p className="text-[10px] text-slate-500 font-bold uppercase leading-relaxed italic border-l-2 border-blue-100 pl-4 opacity-70">
                                 "{log.remarks || 'NO DETAILED NOTES ATTACHED.'}"
                              </p>
                           </div>
                        </div>
                     )) : (
                        <div className="py-24 text-center">
                           <Package size={40} className="text-slate-100 mx-auto mb-4" />
                           <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300 italic">Timeline Dormant</p>
                        </div>
                     )}
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}

function AddInventoryModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
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

   const handleSubmit = async (e: React.FormEvent) => {
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
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
         <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white w-full max-w-xl rounded-none shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]"
         >
            <div className="p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
               <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-white/10 rounded-none border border-white/20">
                     <Package size={20} />
                  </div>
                  <h2 className="text-xl font-bold tracking-tight uppercase leading-none">Resource Provisioning</h2>
               </div>
               <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-none transition-all active:scale-90"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
               <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="space-y-2">
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block pl-1">Item Nomenclature *</label>
                     <input required type="text" placeholder="E.G. COPPER CONDUCTOR 2.5MM" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-none font-bold text-xs uppercase outline-none focus:bg-white transition-all" value={formData.item_name} onChange={e => setFormData({ ...formData, item_name: e.target.value })} />
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                     <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block pl-1">Category Registry</label>
                        <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-none font-bold text-xs uppercase outline-none focus:bg-white transition-all" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                           <option value="Electrical">Electrical Ops</option>
                           <option value="Plumbing">Plumbing Ops</option>
                           <option value="Cleaning">Sanitation</option>
                           <option value="Tools">Tactical Tools</option>
                           <option value="Safety">HSSE Protocol</option>
                        </select>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block pl-1">Reserve Unit</label>
                        <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-none font-bold text-xs uppercase outline-none focus:bg-white transition-all" value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })}>
                           <option value="Pcs">Units (Pcs)</option>
                           <option value="Liters">Bulk (Ltrs)</option>
                           <option value="Kgs">Mass (Kgs)</option>
                           <option value="Rolls">Spools (Rolls)</option>
                        </select>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                     <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block pl-1">Initial Reserve</label>
                        <input type="number" placeholder="0" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-none font-bold text-xs outline-none focus:bg-white transition-all" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-1.5 block pl-1">Critical Threshold</label>
                        <input type="number" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-none font-bold text-xs outline-none focus:bg-white transition-all border-red-100" value={formData.min_stock} onChange={e => setFormData({ ...formData, min_stock: e.target.value })} />
                     </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block pl-1">Tactical Deployment Location</label>
                     <input type="text" placeholder="E.G. SECTOR A-12, CENTRAL DEPOT" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-none font-bold text-xs uppercase outline-none focus:bg-white transition-all" value={formData.storage_location} onChange={e => setFormData({ ...formData, storage_location: e.target.value })} />
                  </div>

                  <div className="flex gap-4 pt-10 border-t border-slate-100">
                     <button type="button" onClick={onClose} className="flex-1 py-3 text-[10px] font-bold uppercase text-slate-400 hover:text-slate-900 transition-all tracking-widest">Abort</button>
                     <button
                        type="submit"
                        disabled={isLoading}
                        className="flex-[2] py-3 bg-slate-900 text-white rounded-none font-bold uppercase text-[10px] tracking-widest shadow-lg flex items-center justify-center gap-2 hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50"
                     >
                        {isLoading ? <Loader2 size={16} className="animate-spin" /> : <><Save size={14} /> Commit Resource</>}
                     </button>
                  </div>
               </form>
            </div>
         </motion.div>
      </div>
   );
}

function StockActionModal({ item, onClose, onSuccess }: { item: InventoryItem | null; onClose: () => void; onSuccess: () => void }) {
   const [action, setAction] = useState<'issue' | 'add' | 'return'>('issue');
   const [quantity, setQuantity] = useState('');
   const [remarks, setRemarks] = useState('');
   const [isSubmitting, setIsSubmitting] = useState(false);

   if (!item) return null;

   const handleSubmit = async (e: React.FormEvent) => {
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
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
         <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white w-full max-w-md rounded-none shadow-2xl overflow-hidden border border-slate-200"
         >
            <div className={clsx("p-8 text-white flex justify-between items-center", action === 'issue' ? 'bg-amber-500' : 'bg-slate-900')}>
               <div className="flex items-center gap-4">
                  <Activity size={20} />
                  <h3 className="font-bold uppercase tracking-widest text-xs leading-none">Adjustment: {item.item_name}</h3>
               </div>
               <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-none transition-all active:scale-90"><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-10 space-y-10">
               <div className="flex bg-slate-50 p-1 rounded-none border border-slate-200 shadow-sm gap-1">
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
                           "flex-1 py-2.5 rounded-none text-[10px] font-bold uppercase tracking-widest transition-all",
                           action === tab.val ? "bg-white text-slate-900 shadow-sm border border-slate-200" : "text-slate-400 hover:text-slate-900"
                        )}
                     >
                        {tab.label}
                     </button>
                  ))}
               </div>

               <div className="space-y-4">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block text-center">Adjustment Payload ({item.unit})</label>
                  <input required type="number" min="0.01" step="0.01" className="w-full px-6 py-6 bg-slate-50 border border-slate-200 rounded-none font-bold text-3xl text-center outline-none focus:bg-white transition-all" placeholder="0.00" value={quantity} onChange={e => setQuantity(e.target.value)} />
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block pl-1">Technical Notes / Reason</label>
                  <textarea rows={2} placeholder="REASON FOR ADJUSTMENT..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-none text-[10px] font-bold uppercase outline-none resize-none focus:bg-white transition-all" value={remarks} onChange={e => setRemarks(e.target.value)} />
               </div>

               <button
                  type="submit"
                  disabled={isSubmitting}
                  className={clsx(
                     "w-full py-4 text-white rounded-none font-bold uppercase text-[10px] tracking-widest shadow-lg transition-all active:scale-95 disabled:opacity-50",
                     action === 'issue' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-slate-900 hover:bg-blue-600'
                  )}
               >
                  {isSubmitting ? <RefreshCw size={16} className="animate-spin mx-auto" /> : 'Commit Transaction'}
               </button>
            </form>
         </motion.div>
      </div>
   );
}

function InventoryHistoryView({ data, onClose, onAction }: { data: InventoryHistoryData | null; onClose: () => void; onAction: () => void }) {
   if (!data || !data.item) return null;
   const { item, logs = [] } = data;
   return (
      <div className="fixed inset-0 z-[120] flex justify-end">
         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
         <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 rounded-none relative"
         >
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10 shrink-0">
               <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight uppercase leading-none mb-2">{item.item_name}</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">{item.item_code} <span className="mx-2 text-slate-200">|</span> Category: {item.category}</p>
               </div>
               <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-none text-slate-400 transition-all active:scale-90"><X size={24} /></button>
            </div>

            <div className="p-10 grid grid-cols-2 gap-8 shrink-0">
               <div className="p-6 bg-blue-50 rounded-none border border-blue-100 shadow-sm group hover:bg-white hover:shadow-lg transition-all">
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2 leading-none">Reserve Status</p>
                  <p className="text-3xl font-bold text-slate-900 leading-none">{item.quantity} <span className="text-[10px] font-bold text-slate-400">{item.unit}</span></p>
               </div>
               <div className="p-6 bg-slate-50 rounded-none border border-slate-200 shadow-sm group hover:bg-white hover:shadow-lg transition-all">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 leading-none">Tactical Storage</p>
                  <p className="text-sm font-bold text-slate-500 uppercase truncate leading-none">{item.storage_location || 'DEPOT HQ'}</p>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto px-10 py-4 custom-scrollbar pb-32">
               <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-10 border-b border-slate-100 pb-6">Transaction Audit Log</h3>
               <div className="space-y-10 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
                  {logs.length > 0 ? logs.map((log: InventoryLog, i) => (
                     <div key={log.id} className="relative pl-10 group transition-all hover:translate-x-1">
                        <div className={clsx(
                           "absolute left-[-11px] top-1 w-6 h-6 rounded-none border-2 border-white shadow-sm flex items-center justify-center z-10",
                           log.action === 'issue' ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'
                        )}>
                           {log.action === 'issue' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        </div>

                        <div className="bg-slate-50/50 p-6 rounded-none border border-slate-100 hover:bg-white hover:border-blue-100 transition-all hover:shadow-xl">
                           <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest mb-2 leading-none">{formatDateSafe(log.created_at)}</p>
                           <p className="text-sm font-bold text-slate-900 uppercase tracking-tight mb-4">
                              {log.action === 'issue' ? 'Field Withdrawal' : 'Logistics Refill'}: {log.quantity} {item.unit}
                           </p>
                           <p className="text-[10px] text-slate-500 font-bold uppercase leading-relaxed italic border-l-2 border-blue-600 pl-4 opacity-80">
                              "{log.remarks || 'NO DETAILED NOTES RECORDED.'}"
                           </p>
                        </div>
                     </div>
                  )) : (
                     <div className="py-24 text-center">
                        <Inbox size={40} className="text-slate-100 mx-auto mb-4" />
                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No transaction logs available</p>
                     </div>
                  )}
               </div>
            </div>

            <div className="p-10 border-t bg-white sticky bottom-0 z-10 shrink-0">
               <button
                  onClick={onAction}
                  className="w-full bg-slate-900 text-white py-4 rounded-none font-bold uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all hover:bg-blue-600 flex items-center justify-center gap-3"
               >
                  <Activity size={16} />
                  Execute Stock Adjustment
               </button>
            </div>
         </motion.div>
      </div>
   );
}

function formatDateSafe(date: string | Date | null | undefined) {
   if (!date) return 'UNSCHEDULED';
   const d = new Date(date);
   return isValid(d) ? format(d, 'dd MMM yyyy, HH:mm').toUpperCase() : 'INVALID DATA';
}
