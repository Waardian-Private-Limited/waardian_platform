'use client';

import React, { useState, useEffect } from 'react';
import { 
  Package, Plus, Search, Filter, Calendar, Check, X, 
  Clock, DollarSign, Shield, Info, AlertCircle, Truck, 
  Settings, FileSignature, BarChart3, ChevronRight, MapPin, History, User
} from 'lucide-react';
import { 
  getAllAssets, createAsset, getAllBookings, updateBookingStatus, 
  Asset, AssetBooking, checkOutAsset, checkInAsset, markAssetMissing 
} from '@/lib/apiClient';
import { toast } from 'react-hot-toast';

export default function AssetManagement({ activeSection = 'asset-list' }: { activeSection?: string }) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [bookings, setBookings] = useState<AssetBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  const [newAsset, setNewAsset] = useState<Partial<Asset>>({
    name: '',
    description: '',
    category: 'Clubhouse',
    is_bookable: true,
    pricing_model: 'free',
    price: 0,
    security_deposit: 0,
    max_booking_hours: 4,
    approval_required: false,
    rules: '',
    location_id: 1,
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [assetsRes, bookingsRes] = await Promise.all([
        getAllAssets(),
        getAllBookings()
      ]);
      if (assetsRes.success) setAssets(assetsRes.data || []);
      if (bookingsRes.success) setBookings(bookingsRes.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load asset data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await createAsset(newAsset);
      if (res.success) {
        toast.success('Asset created successfully');
        setIsModalOpen(false);
        fetchData();
      }
    } catch (error) {
      toast.error('Failed to create asset. Check all fields.');
    }
  };

  const currentSection = activeSection.replace('asset-', '');

  const renderContent = () => {
    switch (currentSection) {
      case 'dashboard':
        return <AssetsOverview assets={assets} bookings={bookings} />;
      case 'movement':
        return <AssetMovementHistory assets={assets} />;
      case 'reports':
        return <ReportsPlaceholder assets={assets} />;
      case 'maintenance':
        return <EmptyState label="Maintenance Records" />;
      case 'amc':
        return <EmptyState label="AMC Contracts" />;
      case 'inventory':
        return <EmptyState label="Inventory Items" />;
      case 'vendors':
        return <EmptyState label="Vendors" />;
      case 'list':
      case 'management':
      default:
        return (
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="w-full lg:w-64 space-y-6 flex-shrink-0">
               <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 h-fit sticky top-20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <Filter size={18} className="text-blue-600" />
                    Categories
                  </h3>
                </div>
                <div className="space-y-1">
                  {['All Assets', 'Clubhouse', 'Sports', 'Equipment', 'Electronics', 'General'].map(cat => {
                    const count = cat === 'All Assets' ? assets.length : assets.filter(a => a.category === cat).length;
                    return (
                      <button
                        key={cat}
                        onClick={() => setSearchQuery(cat === 'All Assets' ? '' : cat)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${
                          searchQuery === cat || (cat === 'All Assets' && !searchQuery) ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <span>{cat}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-gray-100 text-gray-500">{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-6">
               <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden min-h-[500px]">
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search by ID or name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-blue-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-400 text-sm"
                    />
                  </div>
                </div>
                <AssetsTable assets={assets.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()))} onSelect={setSelectedAsset} />
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-200">
             <Package className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 capitalize">
              {currentSection.replace('-', ' ')}
            </h1>
            <div className="flex items-center gap-2 text-gray-500 text-sm">
               <span>Society Admin</span>
               <ChevronRight size={14} />
               <span className="text-blue-600 font-medium capitalize">{currentSection}</span>
            </div>
          </div>
        </div>
        <button 
           onClick={() => setIsModalOpen(true)}
           className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl transition-all shadow-lg active:scale-95 font-bold"
         >
           <Plus className="w-4 h-4" />
           <span>Provision New Asset</span>
         </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-40">
           <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div>
           <p className="text-gray-500 font-medium">Syncing Asset Registry...</p>
        </div>
      ) : renderContent()}

      {/* Modals & Popups */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col scale-100 transition-transform">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Provision New Asset</h2>
                <p className="text-xs text-gray-500 mt-0.5">Initialize lifecycle tracking for high-value society resources.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:bg-gray-100 p-2 rounded-xl transition-all"><X /></button>
            </div>
            <form onSubmit={handleCreateAsset} className="p-6 space-y-5 overflow-y-auto">
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Primary Identification</label>
                  <input required value={newAsset.name} onChange={e => setNewAsset({...newAsset, name: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none mt-1" placeholder="e.g. Sony Laser Projector V-90" />
                </div>
                <div>
                   <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Deployment Location</label>
                   <select value={newAsset.location_id} onChange={e => setNewAsset({...newAsset, location_id: Number(e.target.value)})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl mt-1">
                     <option value={1}>Clubhouse Main Store</option>
                     <option value={2}>Admin Office / Lobby</option>
                     <option value={3}>Basement Maintenance Hub</option>
                   </select>
                </div>
                <div>
                   <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Asset Category</label>
                   <select value={newAsset.category} onChange={e => setNewAsset({...newAsset, category: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl mt-1">
                     <option>Clubhouse</option>
                     <option>Sports</option>
                     <option>Electronics</option>
                     <option>Maintenance</option>
                   </select>
                </div>
                <div className="col-span-2 p-4 bg-blue-50 rounded-2xl border border-blue-100 border-dashed">
                   <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer font-bold text-blue-900 text-sm">
                        <input type="checkbox" checked={newAsset.is_bookable} onChange={e => setNewAsset({...newAsset, is_bookable: e.target.checked})} className="w-5 h-5 accent-blue-600" />
                        Bookable by Residents
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer font-bold text-blue-900 text-sm">
                        <input type="checkbox" checked={newAsset.approval_required} onChange={e => setNewAsset({...newAsset, approval_required: e.target.checked})} className="w-5 h-5 accent-blue-600" />
                        Admin Approval Required
                      </label>
                   </div>
                </div>
              </div>
              <div className="pt-6 flex justify-end gap-3">
                 <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 font-bold text-gray-500 hover:text-gray-900 transition-colors">Discard</button>
                 <button type="submit" className="px-10 py-3 bg-blue-600 text-white rounded-xl shadow-xl shadow-blue-100 font-bold hover:bg-blue-700 active:scale-95 transition-all">Verify & Commit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function AssetsOverview({ assets, bookings }: { assets: Asset[], bookings: AssetBooking[] }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard icon={<Package className="text-blue-600" />} label="Total Inventory" value={assets.length} />
        <StatsCard icon={<Truck className="text-orange-600" />} label="Movable Assets" value={assets.filter(a => a.category === 'Equipment' || a.category === 'Electronics').length} />
        <StatsCard icon={<AlertCircle className="text-red-600" />} label="Missing / Offline" value={assets.filter(a => a.status === 'missing').length} />
        <StatsCard icon={<Clock className="text-yellow-600" />} label="Active Bookings" value={bookings.filter(b => b.status === 'confirmed').length} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
               <History className="text-blue-600" /> 
               Recent Activity
            </h3>
            <div className="space-y-4">
               {bookings.slice(0, 5).map(b => (
                 <div key={b.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-100">
                       <Calendar size={18} className="text-blue-500" />
                    </div>
                    <div>
                       <p className="text-sm font-bold">{b.first_name} {b.last_name}</p>
                       <p className="text-[11px] text-gray-500">Booked {b.asset_name}</p>
                    </div>
                    <span className="ml-auto text-[10px] font-bold text-gray-400 capitalize">{b.status}</span>
                 </div>
               ))}
            </div>
         </div>

         <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
               <MapPin className="text-red-600" /> 
               Top Booked Locations
            </h3>
            <div className="space-y-4">
               {['Clubhouse Main Hall', 'Guest Room 1', 'Sports Court A'].map((loc, i) => (
                 <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-500">{i+1}</div>
                    <div className="flex-1">
                       <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">{loc}</span>
                          <span className="text-xs font-bold text-blue-600">{10 - i*2} bookings</span>
                       </div>
                       <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-blue-600 h-full" style={{ width: `${100 - i*20}%` }}></div>
                       </div>
                    </div>
                 </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
}

function AssetMovementHistory({ assets }: { assets: Asset[] }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden min-h-[500px]">
      <div className="p-6 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
         <div>
            <h2 className="text-xl font-bold">Asset Movement & Custody</h2>
            <p className="text-sm text-gray-500">Track real-time location changes and holder transitions.</p>
         </div>
         <div className="flex gap-2">
            <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold flex items-center gap-2">
               <Filter size={14} /> Filter
            </button>
         </div>
      </div>
      <div className="p-20 text-center space-y-4">
         <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
            <Truck size={32} className="text-blue-400" />
         </div>
         <h3 className="text-lg font-bold">Traceability System Initialized</h3>
         <p className="text-gray-500 max-w-sm mx-auto">Movement logs will appear here once assets are checked out by staff or residents.</p>
         <button className="text-blue-600 font-bold hover:underline">Provision Movement Record</button>
      </div>
    </div>
  );
}

function AssetsTable({ assets, onSelect }: { assets: Asset[], onSelect: any }) {
  if (assets.length === 0) return <EmptyState label="Assets" />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-gray-50 text-gray-500 text-[10px] font-bold uppercase tracking-widest border-b border-gray-100">
          <tr>
            <th className="px-6 py-4">Asset Details</th>
            <th className="px-6 py-4">Category</th>
            <th className="px-6 py-4">Real-time Location</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {assets.map(asset => (
            <tr key={asset.id} className="hover:bg-blue-50/30 transition-colors group cursor-pointer" onClick={() => onSelect(asset)}>
              <td className="px-6 py-5">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${
                     asset.status === 'missing' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                  }`}>
                    <Package className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{asset.name}</div>
                    <div className="text-[11px] text-gray-500 font-medium">Trace ID: AST-{asset.id.toString().padStart(4, '0')}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-5"><span className="px-3 py-1 bg-white border border-gray-100 text-gray-600 rounded-full text-[11px] font-bold">{asset.category}</span></td>
              <td className="px-6 py-5">
                 <div className="flex items-center gap-2 text-gray-600">
                    <MapPin size={14} className="text-gray-400" />
                    <span className="text-xs font-semibold">{asset.location_id ? `Lobby / Store ${asset.location_id}` : 'Not Specified'}</span>
                 </div>
              </td>
              <td className="px-6 py-5">
                <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                  asset.status === 'active' ? 'bg-green-100 text-green-700' : 
                  asset.status === 'missing' ? 'bg-red-600 text-white shadow-lg shadow-red-200' : 
                  'bg-orange-100 text-orange-700'
                }`}>
                  {asset.status.replace('_', ' ')}
                </span>
              </td>
              <td className="px-6 py-5 text-right">
                <button className="p-2 hover:bg-white rounded-lg transition-all text-gray-400 hover:text-blue-600">
                  <ChevronRight size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatsCard({ icon, label, value }: { icon: any, label: string, value: any }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
      <div className="flex items-center space-x-4">
         <div className="p-4 bg-gray-50 rounded-2xl">{icon}</div>
         <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{label}</p>
            <p className="text-2xl font-black text-gray-900">{value}</p>
         </div>
      </div>
    </div>
  );
}

function EmptyState({ label, icon = <Info /> }: { label: string, icon?: any }) {
  return (
    <div className="flex flex-col items-center justify-center p-20 text-center bg-white rounded-2xl border border-dashed border-gray-300">
      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-400">
        {icon}
      </div>
      <h2 className="text-lg font-bold text-gray-900 mb-1">Module Sync Pending</h2>
      <p className="text-sm text-gray-500 max-w-xs mx-auto">Real-time data for {label} will be available once the integration is fully authorized.</p>
    </div>
  );
}

function ReportsPlaceholder({ assets }: { assets: Asset[] }) {
   return <div className="p-10 text-center">Charts and Analytics loading...</div>;
}
