'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Building2, Layers, Home, Users, Mail, Phone, Search, Filter, RefreshCw } from 'lucide-react';
import { getWings, getFloors, getFlats, getSpecificMembers, Wing, Floor, Flat, SocietyMember } from '@/lib/societyAdminClient';

interface HousingStructureProps {
  societyId: string;
}

export default function HousingStructure({ societyId }: HousingStructureProps) {
  const [wings, setWings] = useState<Wing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedWings, setExpandedWings] = useState<Set<string>>(new Set());
  const [expandedFloors, setExpandedFloors] = useState<Set<string>>(new Set());
  const [expandedFlats, setExpandedFlats] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        // console.log('Fetching wings for societyId:', societyId);
        const data = await getWings();
        // console.log('Fetched wings:', data);
        if (isMounted) {
          setWings(data);
          setLoading(false);
        }
      } catch (err: any) {
        console.error('Failed to fetch wings:', err.message);
        if (isMounted) {
          setError(err.message || 'Failed to load wings');
          setLoading(false);
        }
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [societyId]);

  const toggleExpandWing = async (wingId: string) => {
    const newSet = new Set(expandedWings);
    if (newSet.has(wingId)) {
      newSet.delete(wingId);
    } else {
      newSet.add(wingId);
      try {
        const floors = await getFloors(wingId);
        // console.log('Setting floors for wing:', wingId, floors);
        setWings((prev) =>
          prev.map((w) => (w.id === wingId ? { ...w, floors } : w))
        );
      } catch (err: any) {
        console.error(`Failed to fetch floors for wing ${wingId}:`, err.message);
        setError(err.message || 'Failed to load floors');
      }
    }
    setExpandedWings(newSet);
  };

  const toggleExpandFloor = async (wingId: string, floorId: string) => {
    // console.log('toggleExpandFloor called with:', { societyId, wingId, floorId });
    const newSet = new Set(expandedFloors);
    if (newSet.has(floorId)) {
      newSet.delete(floorId);
    } else {
      newSet.add(floorId);
      try {
        const flats = await getFlats(wingId, floorId);
        // console.log('Setting flats for floor:', floorId, flats);
        setWings((prev) =>
          prev.map((w) =>
            w.id === wingId && w.floors
              ? {
                  ...w,
                  floors: w.floors.map((f) =>
                    f.floor_id === floorId ? { ...f, flats } : f
                  ),
                }
              : w
          )
        );
      } catch (err: any) {
        console.error(`Failed to fetch flats for floor ${floorId}:`, err.message);
        setError(err.message || 'Failed to load flats');
      }
    }
    setExpandedFloors(newSet);
  };

  const toggleExpandFlat = async (wingId: string, floorId: string, flatId: string) => {
    // console.log('toggleExpandFlat called with:', { societyId, wingId, floorId, flatId });
    const newSet = new Set(expandedFlats);
    if (newSet.has(flatId)) {
      newSet.delete(flatId);
    } else {
      newSet.add(flatId);
      try {
        const members = await getSpecificMembers(wingId, floorId, flatId);
        // console.log('Setting members for flat:', flatId, members);
        setWings((prev) =>
          prev.map((w) =>
            w.id === wingId && w.floors
              ? {
                  ...w,
                  floors: w.floors.map((f) =>
                    f.floor_id === floorId && f.flats
                      ? {
                          ...f,
                          flats: f.flats.map((fl) =>
                            fl.flat_id === flatId ? { ...fl, members: members || [] } : fl
                          ),
                        }
                      : f
                  ),
                }
              : w
          )
        );
      } catch (err: any) {
        console.error(`Failed to fetch members for flat ${flatId}:`, err.message);
        setError(err.message || 'Failed to load members');
      }
    }
    setExpandedFlats(newSet);
  };

  const refreshData = async () => {
    setLoading(true);
    setError(null);
    try {
      // console.log('Fetching wings for societyId:', societyId);
      const data = await getWings();
      // console.log('Fetched wings:', data);
      setWings(data);
      setExpandedWings(new Set());
      setExpandedFloors(new Set());
      setExpandedFlats(new Set());
    } catch (err: any) {
      console.error('Failed to fetch wings:', err.message);
      setError(err.message || 'Failed to refresh data');
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = (members: SocietyMember[]) => {
    return members.filter(member => {
      const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           member.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === 'all' || 
                           member.status.toLowerCase() === filterStatus;
      return matchesSearch && matchesFilter;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-md p-6 max-w-md w-full transform transition-all duration-300 ease-out hover:shadow-lg">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <Building2 className="w-8 h-8 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-800">Loading Society Structure</h3>
              <p className="text-gray-600 text-sm">Please wait while we fetch the data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6 border border-gray-200 transform transition-all duration-300 hover:shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800 tracking-tight">
                  Society Explorer
                </h1>
                <p className="text-gray-600 text-sm mt-1">Manage and explore your housing structure</p>
              </div>
            </div>
            <button
              onClick={refreshData}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="text-sm font-medium">Refresh</span>
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6 border border-gray-200 transform transition-all duration-300 hover:shadow-lg">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search members by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all duration-200"
              />
            </div>
            <div className="relative">
              <Filter className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
                className="pl-10 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all duration-200 bg-white appearance-none"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg mb-6 flex items-center space-x-3 transform transition-all duration-300 hover:shadow-md">
            <div className="w-4 h-4 bg-red-500 rounded-full flex-shrink-0"></div>
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {/* Wings List */}
        <div className="space-y-6">
          {wings.length > 0 ? (
            wings.map((wing, wingIndex) => (
              <div
                key={wing.id}
                className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 transform transition-all duration-300 hover:shadow-lg"
              >
                <button
                  onClick={() => toggleExpandWing(wing.id)}
                  className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-all duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Building2 className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-semibold text-gray-800">Wing {wing.name}</h3>
                      <p className="text-gray-600 text-sm">
                        {wing.floors?.length || 0} floors • Click to explore
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      {wingIndex + 1} of {wings.length}
                    </div>
                    {expandedWings.has(wing.id) ? (
                      <ChevronDown className="w-4 h-4 text-gray-500 transition-transform duration-200" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-500 transition-transform duration-200" />
                    )}
                  </div>
                </button>

                {expandedWings.has(wing.id) && (
                  <div className="p-4 space-y-4 bg-gray-50">
                    {wing.floors?.length ? (
                      wing.floors.map((floor) => (
                        <div key={floor.floor_id} className="bg-white rounded-lg shadow-sm border border-gray-200 transform transition-all duration-200 hover:shadow-md">
                          <button
                            onClick={() => toggleExpandFloor(wing.id, floor.floor_id)}
                            className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors duration-200 rounded-lg"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-indigo-100 rounded-lg">
                                <Layers className="w-5 h-5 text-indigo-600" />
                              </div>
                              <div className="text-left">
                                <h4 className="text-base font-medium text-gray-800">Floor {floor.floor_number}</h4>
                                <p className="text-gray-600 text-sm">{floor.flats?.length || 0} flats</p>
                              </div>
                            </div>
                            {expandedFloors.has(floor.floor_id) ? (
                              <ChevronDown className="w-4 h-4 text-gray-500 transition-transform duration-200" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-500 transition-transform duration-200" />
                            )}
                          </button>

                          {expandedFloors.has(floor.floor_id) && (
                            <div className="px-3 pb-4 space-y-3">
                              {floor.flats?.length ? (
                                floor.flats.map((flat) => (
                                  <div key={flat.flat_id} className="bg-gray-50 rounded-lg border border-gray-200 transform transition-all duration-200 hover:shadow-md">
                                    <button
                                      onClick={() => toggleExpandFlat(wing.id, floor.floor_id, flat.flat_id)}
                                      className="w-full flex items-center justify-between p-3 hover:bg-gray-100 transition-colors duration-200 rounded-lg"
                                    >
                                      <div className="flex items-center space-x-3">
                                        <div className="p-2 bg-green-100 rounded-lg">
                                          <Home className="w-5 h-5 text-green-600" />
                                        </div>
                                        <div className="text-left">
                                          <h5 className="text-base font-medium text-gray-800">Flat {flat.flat_number}</h5>
                                          <p className="text-gray-600 text-sm">{flat.members?.length || 0} members</p>
                                        </div>
                                      </div>
                                      {expandedFlats.has(flat.flat_id) ? (
                                        <ChevronDown className="w-4 h-4 text-gray-500 transition-transform duration-200" />
                                      ) : (
                                        <ChevronRight className="w-4 h-4 text-gray-500 transition-transform duration-200" />
                                      )}
                                    </button>

                                    {expandedFlats.has(flat.flat_id) && (
                                      <div className="p-3 bg-white rounded-lg mx-2 mb-3 shadow-sm">
                                        {flat.members?.length ? (
                                          <div className="space-y-3">
                                            {filteredMembers(flat.members).map((member) => (
                                              <div
                                                key={member.id}
                                                className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-all duration-200 border border-gray-200 transform hover:shadow-sm"
                                              >
                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                                  <div className="flex items-center space-x-3">
                                                    <div className="p-2 bg-blue-100 rounded-lg">
                                                      <Users className="w-5 h-5 text-blue-600" />
                                                    </div>
                                                    <div>
                                                      <h6 className="text-base font-medium text-gray-800">{member.name}</h6>
                                                      <p className="text-gray-600 text-sm capitalize">{member.userType}</p>
                                                    </div>
                                                  </div>
                                                  <div className="flex items-center space-x-4 text-sm">
                                                    <div className="flex items-center space-x-2 text-gray-600">
                                                      <Mail className="w-4 h-4" />
                                                      <span className="hidden sm:inline">{member.email}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-2 text-gray-600">
                                                      <Phone className="w-4 h-4" />
                                                      <span className="hidden sm:inline">{member.phoneNumber}</span>
                                                    </div>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                      member.status === 'Active'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                      {member.status}
                                                    </span>
                                                  </div>
                                                </div>
                                                {/* Mobile view for contact info */}
                                                <div className="sm:hidden mt-2 space-y-1 text-sm text-gray-600">
                                                  <div className="flex items-center space-x-2">
                                                    <Mail className="w-4 h-4" />
                                                    <span>{member.email}</span>
                                                  </div>
                                                  <div className="flex items-center space-x-2">
                                                    <Phone className="w-4 h-4" />
                                                    <span>{member.phoneNumber}</span>
                                                  </div>
                                                </div>
                                              </div>
                                            ))}
                                            {filteredMembers(flat.members).length === 0 && (
                                              <p className="text-center text-gray-600 text-sm py-4">
                                                No members match your search criteria
                                              </p>
                                            )}
                                          </div>
                                        ) : (
                                          <div className="text-center py-6">
                                            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                            <p className="text-gray-600 text-sm">No members in this flat</p>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))
                              ) : (
                                <p className="text-center text-gray-600 text-sm py-4">No flats available</p>
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-600 text-sm py-6">No floors available</p>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="bg-white rounded-xl shadow-md p-8 text-center border border-gray-200 transform transition-all duration-300 hover:shadow-lg">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No Wings Available</h3>
              <p className="text-gray-600 text-sm mb-4">Start building your society structure by adding a new wing.</p>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                Add First Wing
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}