'use client';

import { useEffect } from 'react';
import { useDashboardStore } from '@/lib/store/useDashboardStore';
import { Building2, Calendar, Users, CheckCircle, AlertCircle, FileText, TrendingUp, Activity, Home } from 'lucide-react';
import clsx from 'clsx';

interface Props {
  societyId: number;
}

export default function SocietyAdminDashboard({ societyId }: Props) {
  const { data, loading, fetchDashboard } = useDashboardStore();

  useEffect(() => {
    if (societyId) {
      fetchDashboard(societyId);
    }
  }, [societyId, fetchDashboard]);

  const getOccupancyPercent = (occupied: number, total: number) =>
    total === 0 ? 0 : Math.round((occupied / total) * 100);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  const getDaysUntilExpiry = () => {
    if (!data?.validTill) return 0;
    const today = new Date();
    const validTill = new Date(data.validTill);
    const timeDiff = validTill.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  };

  const SkeletonCard = () => (
    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-gray-100/50 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg"></div>
        <div className="flex-1 space-y-1">
          <div className="h-2 bg-gray-200 rounded-full w-16"></div>
          <div className="h-3 bg-gray-300 rounded-full w-12"></div>
        </div>
      </div>
    </div>
  );

  const SkeletonWing = () => (
    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-gray-100/50 animate-pulse">
      <div className="flex items-center justify-between mb-2">
        <div className="h-5 bg-gray-200 rounded-full w-16"></div>
        <div className="h-3 bg-gray-200 rounded-full w-12"></div>
      </div>
      <div className="space-y-1">
        <div className="h-1.5 bg-gray-200 rounded-full w-full"></div>
        <div className="h-2 bg-gray-100 rounded-full w-20"></div>
      </div>
    </div>
  );

  return (
    <main className="flex-1 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 min-h-[calc(100vh-6rem)] relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 via-transparent to-purple-50/20 pointer-events-none"></div>
      <div className="absolute top-0 left-1/4 w-64 h-64 bg-gradient-to-br from-blue-200/10 to-purple-200/10 rounded-full blur-2xl animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-gradient-to-br from-emerald-200/10 to-cyan-200/10 rounded-full blur-2xl animate-pulse delay-1000 pointer-events-none"></div>

      <div className="relative z-10 p-4 space-y-6">        
        {/* Summary Stats */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            [...Array(4)].map((_, idx) => <SkeletonCard key={idx} />)
          ) : (
            <>
              <StatCard 
                icon={<Building2 className="w-4 h-4" />} 
                label="Total Flats" 
                value={data?.totalFlats ?? 0}
                gradient="from-blue-500 to-cyan-600"
                bgGradient="from-blue-50 to-cyan-50"
                progress={100}
                trend="+0%"
              />
              <StatCard 
                icon={<Users className="w-4 h-4" />} 
                label="Active Members" 
                value={data?.totalActiveMember ?? 0}
                gradient="from-emerald-500 to-green-600"
                bgGradient="from-emerald-50 to-green-50"
                progress={data?.totalActiveMember && data?.totalFlats ? Math.min((data.totalActiveMember / data.totalFlats) * 100, 100) : 0}
                trend="+12%"
              />
              <StatCard 
                icon={<FileText className="w-4 h-4" />} 
                label="Active Notices" 
                value={data?.totalNotices ?? 0}
                gradient="from-amber-500 to-orange-600"
                bgGradient="from-amber-50 to-orange-50"
                progress={75}
                trend="+5%"
              />
              <StatCard 
                icon={<AlertCircle className="w-4 h-4" />} 
                label="Open Complaints" 
                value={data?.totalComplaints ?? 0}
                gradient="from-red-500 to-pink-600"
                bgGradient="from-red-50 to-pink-50"
                progress={30}
                trend="-8%"
              />
            </>
          )}
        </section>

        {/* Wing Cards */}
        <section className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Home className="w-3 h-3 text-white" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Wing Management</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-gray-300 via-gray-200 to-transparent"></div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {loading ? (
              [...Array(4)].map((_, idx) => <SkeletonWing key={idx} />)
            ) : (
              data?.wings?.map((wing) => {
                const occupancyPercent = getOccupancyPercent(wing.occupiedFlats, wing.totalFlats);
                const isEmpty = wing.occupiedFlats === 0;
                const isFull = wing.occupiedFlats === wing.totalFlats;
                
                return (
                  <div key={wing.wing} className="group relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative bg-white/80 backdrop-blur-xl rounded-xl border border-white/40 p-4 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 hover:scale-102">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold shadow-md ${
                            isFull ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/25' :
                            isEmpty ? 'bg-gradient-to-br from-gray-400 to-gray-500 shadow-gray-400/25' :
                            'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/25'
                          }`}>
                            {wing.wing}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 text-sm">Wing {wing.wing}</h3>
                            <p className="text-xs text-gray-600">
                              {wing.occupiedFlats} of {wing.totalFlats} occupied
                            </p>
                          </div>
                        </div>
                        
                        <div className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          occupancyPercent >= 90 ? 'bg-green-100 text-green-800' :
                          occupancyPercent >= 70 ? 'bg-blue-100 text-blue-800' :
                          occupancyPercent >= 50 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {occupancyPercent}%
                        </div>
                      </div>
                      
                      {/* Occupancy Progress Bar */}
                      <div className="space-y-1">
                        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ease-out ${
                              occupancyPercent >= 90 ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
                              occupancyPercent >= 70 ? 'bg-gradient-to-r from-blue-500 to-indigo-600' :
                              occupancyPercent >= 50 ? 'bg-gradient-to-r from-yellow-500 to-amber-600' :
                              'bg-gradient-to-r from-gray-400 to-gray-500'
                            }`}
                            style={{ 
                              width: `${occupancyPercent}%`,
                              animationDelay: `${Math.random() * 0.5}s`
                            }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Occupancy Rate</span>
                          <span className="font-semibold">{wing.occupiedFlats}/{wing.totalFlats}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Recent Activities Table */}
        <section className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-3 h-3 text-white" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Recent Activities</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-gray-300 via-gray-200 to-transparent"></div>
          </div>

          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-2xl blur-lg"></div>
            <div className="relative bg-white/80 backdrop-blur-xl rounded-xl border border-white/40 overflow-hidden shadow-lg shadow-purple-500/5">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100/80 backdrop-blur-sm">
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-900">Flat</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-900">Owner</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-900">Status</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-900">Payment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100/50">
                    {data?.members?.map((m, idx) => (
                      <tr key={idx} className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 transition-all duration-300">
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-gradient-to-br from-blue-100 to-blue-200 rounded-md flex items-center justify-center">
                              <span className="text-xs font-bold text-blue-800">{m.flat}</span>
                            </div>
                            <span className="font-medium text-gray-900 text-sm">Flat {m.flat}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900 text-sm">{m.owner}</div>
                          <div className="text-xs text-gray-500">Primary Contact</div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={clsx(
                              'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold shadow-sm',
                              {
                                'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200': m.status === 'Resident',
                                'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border border-yellow-200': m.status === 'Tenant',
                                'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-200': m.status === 'Vacant',
                              }
                            )}
                          >
                            <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                              m.status === 'Resident' ? 'bg-green-500' :
                              m.status === 'Tenant' ? 'bg-yellow-500' : 'bg-red-500'
                            }`}></div>
                            {m.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={clsx(
                              'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold shadow-sm',
                              {
                                'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200': m.payment === 'Paid',
                                'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border border-yellow-200': m.payment === 'Pending',
                                'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-200': m.payment === 'Overdue',
                                'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 border border-gray-200': m.payment === 'N/A',
                              }
                            )}
                          >
                            <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                              m.payment === 'Paid' ? 'bg-green-500' :
                              m.payment === 'Pending' ? 'bg-yellow-500' :
                              m.payment === 'Overdue' ? 'bg-red-500' : 'bg-gray-400'
                            }`}></div>
                            {m.payment}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* Footer Stats */}
        <footer className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-2xl blur-lg"></div>
          <div className="relative bg-white/80 backdrop-blur-xl rounded-xl border border-white/40 p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-100">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-500/25">
                  <Building2 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium text-blue-700">Total Properties</p>
                  <p className="text-lg font-bold text-blue-900">{data?.totalFlats ?? '--'}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border border-emerald-100">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-md ${
                  data?.subscriptionStatus === 'active' 
                    ? 'bg-gradient-to-br from-emerald-500 to-green-600 shadow-emerald-500/25' 
                    : 'bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/25'
                }`}>
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600">Subscription</p>
                  <p className={clsx('text-sm font-bold capitalize', {
                    'text-emerald-700': data?.subscriptionStatus === 'active',
                    'text-red-600': data?.subscriptionStatus !== 'active',
                  })}>
                    {data?.subscriptionStatus ?? '--'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-md ${
                  getDaysUntilExpiry() > 30
                    ? 'bg-gradient-to-br from-purple-500 to-pink-600 shadow-purple-500/25'
                    : getDaysUntilExpiry() > 7
                    ? 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/25'
                    : 'bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/25'
                }`}>
                  <Calendar className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600">Valid Until</p>
                  <p className="text-sm font-bold text-gray-900">
                    {data?.validTill ? formatDate(data.validTill) : '--'}
                  </p>
                  {getDaysUntilExpiry() <= 30 && data?.validTill && (
                    <p className={`text-xs font-bold ${
                      getDaysUntilExpiry() > 7 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {getDaysUntilExpiry()} days left
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}

function StatCard({ 
  icon, 
  label, 
  value, 
  gradient, 
  bgGradient, 
  progress, 
  trend 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string | number;
  gradient: string;
  bgGradient: string;
  progress: number;
  trend: string;
}) {
  return (
    <div className="group relative">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="relative bg-white/80 backdrop-blur-xl rounded-xl border border-white/40 p-4 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 hover:scale-102">
        <div className="flex items-center justify-between mb-3">
          <div className={`w-10 h-10 bg-gradient-to-br ${gradient} rounded-lg flex items-center justify-center shadow-md shadow-blue-500/25 text-white`}>
            {icon}
          </div>
          <div className={`px-1.5 py-0.5 bg-gradient-to-r ${bgGradient} rounded-md text-xs font-bold ${
            trend.startsWith('+') ? 'text-green-700' : trend.startsWith('-') ? 'text-red-700' : 'text-gray-700'
          }`}>
            {trend}
          </div>
        </div>
        
        <div className="space-y-2">
          <div>
            <p className="text-xs font-medium text-gray-600 mb-0.5">{label}</p>
            <p className="text-xl font-bold text-gray-900">{value}</p>
          </div>
          
          <div className="space-y-1">
            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r ${gradient} rounded-full transition-all duration-1000 ease-out`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Performance</span>
              <span className="font-semibold">{Math.round(progress)}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}