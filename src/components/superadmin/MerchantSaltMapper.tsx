'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, Search, Building2, Save, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { fetchSocieties, updateMerchantMapper } from '@/lib/superadmincontroller';
import toast from 'react-hot-toast';

interface Society {
  id: number;
  name: string;
  easebuzz_key?: string;
  easebuzz_salt?: string;
  preferred_gateway?: 'razorpay' | 'easebuzz' | 'waardian';
  status: string;
}

export default function MerchantSaltMapper() {
  const [societies, setSocieties] = useState<Society[]>([]);
  const [filteredSocieties, setFilteredSocieties] = useState<Society[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<number | null>(null);
  const [credentials, setCredentials] = useState<Record<number, { key: string; salt: string; preferred: string }>>({});

  useEffect(() => {
    loadSocieties();
  }, []);

  useEffect(() => {
    const filtered = societies.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.id.toString().includes(searchQuery)
    );
    setFilteredSocieties(filtered);
  }, [searchQuery, societies]);

  const loadSocieties = async () => {
    try {
      setIsLoading(true);
      const data = await fetchSocieties();
      setSocieties(data);
      setFilteredSocieties(data);
      
      // Initialize credentials map
      const creds: Record<number, { key: string; salt: string; preferred: string }> = {};
      data.forEach((s: Society) => {
        creds[s.id] = { 
          key: s.easebuzz_key || '', 
          salt: s.easebuzz_salt || '',
          preferred: s.preferred_gateway || 'waardian'
        };
      });
      setCredentials(creds);
    } catch (error) {
      toast.error('Failed to load societies');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (id: number, field: 'key' | 'salt' | 'preferred', value: string) => {
    setCredentials(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
  };

  const handleSave = async (societyId: number) => {
    const { key, salt } = credentials[societyId];
    
    if (!key || !salt) {
      toast.error('Both Key and Salt are required');
      return;
    }

    try {
      setIsSaving(societyId);
      await updateMerchantMapper({
        societyId,
        easebuzz_key: key,
        easebuzz_salt: salt,
        preferred_gateway: credentials[societyId].preferred
      });
      toast.success('Credentials mapped successfully');
      
      // Update local state to reflect changes
      setSocieties(prev => prev.map(s => 
        s.id === societyId ? { ...s, easebuzz_key: key, easebuzz_salt: salt, preferred_gateway: credentials[societyId].preferred as any } : s
      ));
    } catch (error) {
      toast.error('Failed to update credentials');
    } finally {
      setIsSaving(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-600 font-medium">Loading societies...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="w-7 h-7 text-blue-600" />
              Merchant & Salt Mapper
            </h1>
            <p className="text-gray-500 mt-1">Configure Easebuzz credentials for each society</p>
          </div>
          
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search society name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>

        <div className="grid gap-4">
          {filteredSocieties.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No societies found matching your search</p>
            </div>
          ) : (
            filteredSocieties.map((society) => (
              <div 
                key={society.id}
                className="group flex flex-col lg:flex-row items-start lg:items-center gap-6 p-5 bg-white border border-gray-100 rounded-2xl hover:border-blue-200 hover:shadow-md hover:shadow-blue-500/5 transition-all duration-300"
              >
                <div className="flex items-center gap-4 min-w-[240px]">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
                    {society.id}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                      {society.name}
                    </h3>
                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                      society.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {society.status}
                    </span>
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                  <div className="relative">
                    <label className="text-[10px] font-bold text-gray-400 uppercase absolute -top-2 left-3 px-1 bg-white">
                      Easebuzz Key
                    </label>
                    <input
                      type="text"
                      value={credentials[society.id]?.key || ''}
                      onChange={(e) => handleInputChange(society.id, 'key', e.target.value)}
                      placeholder="Enter Merchant Key"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-sm font-mono"
                    />
                  </div>
                  <div className="relative">
                    <label className="text-[10px] font-bold text-gray-400 uppercase absolute -top-2 left-3 px-1 bg-white">
                      Easebuzz Salt
                    </label>
                    <input
                      type="text"
                      value={credentials[society.id]?.salt || ''}
                      onChange={(e) => handleInputChange(society.id, 'salt', e.target.value)}
                      placeholder="Enter Merchant Salt"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-sm font-mono"
                    />
                  </div>
                  <div className="relative">
                    <label className="text-[10px] font-bold text-gray-400 uppercase absolute -top-2 left-3 px-1 bg-white">
                      Preferred Gateway
                    </label>
                    <select
                      value={credentials[society.id]?.preferred || 'waardian'}
                      onChange={(e) => handleInputChange(society.id, 'preferred', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-sm font-medium"
                    >
                      <option value="waardian">Waardian (Default)</option>
                      <option value="razorpay">Razorpay (Self)</option>
                      <option value="easebuzz">Easebuzz (Self)</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={() => handleSave(society.id)}
                  disabled={isSaving === society.id}
                  className={`w-full lg:w-auto px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                    isSaving === society.id
                      ? 'bg-blue-50 text-blue-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20 active:scale-95'
                  }`}
                >
                  {isSaving === society.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Map Credentials
                    </>
                  )}
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-4">
        <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-bold mb-1">Security Note:</p>
          <p>These credentials are used for transaction processing and sub-merchant onboarding for each society. Ensure you are using the correct Salt and Key from the Easebuzz Dashboard.</p>
        </div>
      </div>
    </div>
  );
}
