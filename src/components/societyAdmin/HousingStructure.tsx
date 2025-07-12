'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Building2, Layers, Home, Users } from 'lucide-react';
import { getWings, getFloors, getFlats, getSpecificMembers, Wing, Floor, Flat, SocietyMember } from '@/lib/societyAdminClient';

export default function FeaturesExplore() {
  const [wings, setWings] = useState<Wing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedWings, setExpandedWings] = useState<Set<string>>(new Set());
  const [expandedFloors, setExpandedFloors] = useState<Set<string>>(new Set());
  const [expandedFlats, setExpandedFlats] = useState<Set<string>>(new Set());

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const data = await getWings();
        console.log('Fetched wings:', data);
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
  }, []);

  const toggleExpandWing = async (wingId: string) => {
    const newSet = new Set(expandedWings);
    if (newSet.has(wingId)) {
      newSet.delete(wingId);
    } else {
      newSet.add(wingId);
      try {
        const floors = await getFloors(wingId);
        console.log('Setting floors for wing:', wingId, floors);
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
    console.log('toggleExpandFloor called with:', { wingId, floorId });
    const newSet = new Set(expandedFloors);
    if (newSet.has(floorId)) {
      newSet.delete(floorId);
    } else {
      newSet.add(floorId);
      try {
        const flats = await getFlats(wingId, floorId);
        console.log('Setting flats for floor:', floorId, flats);
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
    console.log('toggleExpandFlat called with:', { wingId, floorId, flatId });
    const newSet = new Set(expandedFlats);
    if (newSet.has(flatId)) {
      newSet.delete(flatId);
    } else {
      newSet.add(flatId);
      try {
        const members = await getSpecificMembers(wingId, floorId, flatId);
        console.log('Setting members for flat:', flatId, members);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="text-gray-600 text-lg font-medium"
        >
          Loading society structure...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="font-sans">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 flex items-center">
        <Building2 className="w-7 h-7 text-blue-600 mr-3" />
        <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Society Explorer
        </span>
      </h1>

      {/* Error message remains same */}

      <div className="space-y-4">
        {wings.length > 0 ? (
          wings.map((wing) => (
            <motion.div
              key={wing.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100"
            >
              <button
                onClick={() => toggleExpandWing(wing.id)}
                className="w-full flex items-center px-4 py-3 bg-gradient-to-r from-blue-50 to-gray-50 hover:from-blue-100 transition-all duration-300"
                aria-expanded={expandedWings.has(wing.id)}
                aria-label={`Toggle Wing ${wing.name}`}
              >
                <Building2 className="w-5 h-5 text-blue-600 mr-2" />
                <span className="font-semibold text-gray-800">Wing {wing.name}</span>
                {expandedWings.has(wing.id) ? (
                  <ChevronDown className="w-5 h-5 ml-auto text-gray-500" />
                ) : (
                  <ChevronRight className="w-5 h-5 ml-auto text-gray-500" />
                )}
              </button>

              <AnimatePresence>
                {expandedWings.has(wing.id) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-3 p-4 pt-0"
                  >
                    {wing.floors?.length ? (
                      wing.floors.map((floor) => (
                        <div key={floor.floor_id} className="bg-gray-50 rounded-lg shadow-sm">
                          <button
                            onClick={() => toggleExpandFloor(wing.id, floor.floor_id)}
                            className="w-full flex items-center px-4 py-2.5 hover:bg-gray-100 rounded-lg transition-all duration-200"
                            aria-expanded={expandedFloors.has(floor.floor_id)}
                            aria-label={`Toggle Floor ${floor.floor_number}`}
                          >
                            <Layers className="w-4 h-4 text-indigo-600 mr-2" />
                            <span className="text-sm font-medium text-gray-700">Floor: {floor.floor_number}</span>
                            {expandedFloors.has(floor.floor_id) ? (
                              <ChevronDown className="w-4 h-4 ml-auto text-gray-500" />
                            ) : (
                              <ChevronRight className="w-4 h-4 ml-auto text-gray-500" />
                            )}
                          </button>

                          <AnimatePresence>
                            {expandedFloors.has(floor.floor_id) && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="pl-4 pt-2 space-y-2"
                              >
                                {floor.flats?.length ? (
                                  floor.flats.map((flat) => (
                                    <div key={flat.flat_id} className="bg-white rounded-lg shadow-sm">
                                      <button
                                        onClick={() => toggleExpandFlat(wing.id, floor.floor_id, flat.flat_id)}
                                        className="w-full flex items-center px-4 py-2.5 hover:bg-gray-50 rounded-lg transition-all duration-200"
                                        aria-expanded={expandedFlats.has(flat.flat_id)}
                                        aria-label={`Toggle Flat ${flat.flat_number}`}
                                      >
                                        <Home className="w-4 h-4 text-green-600 mr-2" />
                                        <span className="text-sm text-gray-700">Flat {flat.flat_number}</span>
                                        {expandedFlats.has(flat.flat_id) ? (
                                          <ChevronDown className="w-4 h-4 ml-auto text-gray-400" />
                                        ) : (
                                          <ChevronRight className="w-4 h-4 ml-auto text-gray-400" />
                                        )}
                                      </button>

                                      <AnimatePresence>
                                        {expandedFlats.has(flat.flat_id) && (
                                          <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="p-4"
                                          >
                                            {flat.members?.length ? (
                                              <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                                                <table className="min-w-full text-sm text-gray-700">
                                                  <thead className="bg-gray-100 text-gray-600 font-semibold uppercase text-xs">
                                                    <tr>
                                                      <th className="px-4 py-3 text-left">👤 Name</th>
                                                      <th className="px-4 py-3 text-left">📧 Email</th>
                                                      <th className="px-4 py-3 text-left">📞 Phone</th>
                                                      <th className="px-4 py-3 text-left">🏷️ Role</th>
                                                      <th className="px-4 py-3 text-left">🏠 Status</th>
                                                    </tr>
                                                  </thead>
                                                  <tbody>
                                                    {flat.members.map((member, index) => (
                                                      <tr
                                                        key={member.id}
                                                        className={`${
                                                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                                                        } hover:bg-blue-50 transition-colors duration-150`}
                                                      >
                                                        <td className="px-4 py-3 font-medium">{member.name}</td>
                                                        <td className="px-4 py-3">{member.email}</td>
                                                        <td className="px-4 py-3">{member.phone_number}</td>
                                                        <td className="px-4 py-3 capitalize">{member.role}</td>
                                                        <td className="px-4 py-3">
                                                          <span className={`px-2 py-1 rounded-full text-xs ${
                                                            member.status === 'Active' 
                                                              ? 'bg-green-100 text-green-800' 
                                                              : 'bg-yellow-100 text-yellow-800'
                                                          }`}>
                                                            {member.status}
                                                          </span>
                                                        </td>
                                                      </tr>
                                                    ))}
                                                  </tbody>
                                                </table>
                                              </div>
                                            ) : (
                                              <p className="text-sm text-gray-500 text-center py-4">
                                                No members in this flat
                                              </p>
                                            )}
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-sm text-gray-500 pl-4 py-2">No flats available</p>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 pl-4 py-2">No floors available</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))
        ) : (
          <p className="text-sm text-gray-500 text-center py-6 bg-white rounded-xl shadow">
            No wings available. Start by adding a new wing.
          </p>
        )}
      </div>
    </div>
  );
}