'use client';

import { useState, useEffect } from 'react';
import { Users, Building2, ShieldCheck, Calendar, Sparkles, TrendingUp } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';

interface FooterProps {
  user: any;
}

interface FooterStats {
  totalMembers: number;
  activeMembers: number;
  totalFlats: number;
  occupiedFlats: number;
  subscriptionStatus: 'active' | 'inactive';
  validTill: string;
}

export default function Footer({ user }: FooterProps) {
  const [stats, setStats] = useState<FooterStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFooterStats = async () => {
      if (!user?.societyId) return;

      try {
        setLoading(true);

        const data = await apiClient<{ data: FooterStats }>(
          '/society-admin/footer-stats',
          {
            method: 'GET',
            withAuth: true,
            params: { societyId: user.societyId },
          }
        );

        setStats(data.data);
      } catch (error) {
        console.error('Failed to fetch footer stats:', error);
        setStats({
          totalMembers: 120,
          activeMembers: 112,
          totalFlats: 160,
          occupiedFlats: 150,
          subscriptionStatus: 'inactive',
          validTill: new Date().toISOString(),
        });
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchFooterStats();
    }
  }, [user]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  const getOccupancyPercentage = () => {
    if (!stats) return 0;
    return Math.round((stats.occupiedFlats / stats.totalFlats) * 100);
  };

  const getActivityPercentage = () => {
    if (!stats) return 0;
    return Math.round((stats.activeMembers / stats.totalMembers) * 100);
  };

  const getDaysUntilExpiry = () => {
    if (!stats) return 0;
    const today = new Date();
    const validTill = new Date(stats.validTill);
    const timeDiff = validTill.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  };

  const SkeletonStat = () => (
    <div className="flex items-center space-x-3 animate-pulse">
      <div className="w-8 h-8 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl"></div>
      <div className="space-y-1.5">
        <div className="h-2.5 bg-gray-200 rounded-full w-14"></div>
        <div className="h-2 bg-gray-100 rounded-full w-10"></div>
      </div>
    </div>
  );

  return (
    <footer className="relative bg-gradient-to-r from-slate-50 via-white to-slate-50 border-t border-gray-100 backdrop-blur-xl sticky bottom-0 z-20 shadow-lg shadow-black/5">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 via-transparent to-purple-50/30 pointer-events-none"></div>
      
      <div className="relative px-6 py-2">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Enhanced Stats Section */}
            <div className="flex flex-wrap items-center gap-4">
              {loading ? (
                <>
                  <SkeletonStat />
                  <SkeletonStat />
                  <SkeletonStat />
                  <SkeletonStat />
                </>
              ) : stats ? (
                <>
                  {/* Members Stat with Activity Indicator */}
                  <div className="group relative">
                    <div className="flex items-center space-x-2 p-2 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/70 border border-blue-200/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 hover:scale-105">
                      <div className="relative">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                          <Users className="w-4 h-4 text-white" />
                        </div>
                        {getActivityPercentage() > 90 && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center animate-pulse">
                            <TrendingUp className="w-2 h-2 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-baseline space-x-1">
                          <span className="text-base font-bold text-blue-900">
                            {stats.activeMembers}
                          </span>
                          <span className="text-xs text-blue-600 font-medium">
                            /{stats.totalMembers}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-blue-700 font-medium">Members</span>
                          <div className="flex items-center space-x-1">
                            <div className="w-6 h-1 bg-blue-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                                style={{ width: `${isNaN(getActivityPercentage()) ? 0 : getActivityPercentage()}%` }}
                              ></div>
                            </div>
                            <span className="text-[10px] font-semibold text-blue-800">
                              {isNaN(getActivityPercentage()) ? 0 : getActivityPercentage()}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Flats Stat with Occupancy Indicator */}
                  <div className="group relative">
                    <div className="flex items-center space-x-2 p-2 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/70 border border-emerald-200/50 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 hover:scale-105">
                      <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
                        <Building2 className="w-4 h-4 text-white" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-baseline space-x-1">
                          <span className="text-base font-bold text-emerald-900">
                            {stats.occupiedFlats}
                          </span>
                          <span className="text-xs text-emerald-600 font-medium">
                            /{stats.totalFlats}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-emerald-700 font-medium">Flats</span>
                          <div className="flex items-center space-x-1">
                            <div className="w-6 h-1 bg-emerald-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-500"
                                style={{ width: `${getOccupancyPercentage()}%` }}
                              ></div>
                            </div>
                            <span className="text-[10px] font-semibold text-emerald-800">
                              {getOccupancyPercentage()}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Subscription Status */}
                  <div className="group relative">
                    <div className={`flex items-center space-x-2 p-2 rounded-xl border transition-all duration-300 hover:scale-105 ${
                      stats.subscriptionStatus === 'active'
                        ? 'bg-gradient-to-br from-green-50 to-emerald-100/70 border-green-200/50 hover:shadow-lg hover:shadow-green-500/10'
                        : 'bg-gradient-to-br from-red-50 to-rose-100/70 border-red-200/50 hover:shadow-lg hover:shadow-red-500/10'
                    }`}>
                      <div className="relative">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-lg ${
                          stats.subscriptionStatus === 'active'
                            ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/25'
                            : 'bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/25'
                        }`}>
                          <ShieldCheck className="w-4 h-4 text-white" />
                        </div>
                        {stats.subscriptionStatus === 'active' && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-pulse">
                            <Sparkles className="w-2 h-2 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className={`text-xs font-bold capitalize ${
                          stats.subscriptionStatus === 'active'
                            ? 'text-green-900'
                            : 'text-red-900'
                        }`}>
                          {stats.subscriptionStatus}
                        </div>
                        <span className={`text-[10px] font-medium ${
                          stats.subscriptionStatus === 'active'
                            ? 'text-green-700'
                            : 'text-red-700'
                        }`}>
                          Subscription
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Validity with Countdown */}
                  <div className="group relative">
                    <div className={`flex items-center space-x-2 p-2 rounded-xl border transition-all duration-300 hover:scale-105 ${
                      getDaysUntilExpiry() > 30
                        ? 'bg-gradient-to-br from-indigo-50 to-purple-100/70 border-indigo-200/50 hover:shadow-lg hover:shadow-indigo-500/10'
                        : getDaysUntilExpiry() > 7
                        ? 'bg-gradient-to-br from-amber-50 to-orange-100/70 border-amber-200/50 hover:shadow-lg hover:shadow-amber-500/10'
                        : 'bg-gradient-to-br from-red-50 to-rose-100/70 border-red-200/50 hover:shadow-lg hover:shadow-red-500/10'
                    }`}>
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-lg ${
                        getDaysUntilExpiry() > 30
                          ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/25'
                          : getDaysUntilExpiry() > 7
                          ? 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/25'
                          : 'bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/25'
                      }`}>
                        <Calendar className="w-4 h-4 text-white" />
                      </div>
                      <div className="min-w-0">
                        <div className={`text-xs font-bold ${
                          getDaysUntilExpiry() > 30
                            ? 'text-indigo-900'
                            : getDaysUntilExpiry() > 7
                            ? 'text-amber-900'
                            : 'text-red-900'
                        }`}>
                          {formatDate(stats.validTill)}
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className={`text-[10px] font-medium ${
                            getDaysUntilExpiry() > 30
                              ? 'text-indigo-700'
                              : getDaysUntilExpiry() > 7
                              ? 'text-amber-700'
                              : 'text-red-700'
                          }`}>
                            Valid Till
                          </span>
                          {getDaysUntilExpiry() <= 30 && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                              getDaysUntilExpiry() > 7
                                ? 'bg-amber-200 text-amber-800'
                                : 'bg-red-200 text-red-800'
                            }`}>
                              {getDaysUntilExpiry()}d left
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center space-x-2 text-red-500 font-medium">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span>Stats unavailable</span>
                </div>
              )}
            </div>

            {/* Enhanced Copyright */}
            <div className="flex items-center space-x-2 text-gray-500">
              <div className="hidden sm:flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                <span className="text-sm font-medium bg-gradient-to-r from-gray-600 to-gray-500 bg-clip-text text-transparent">
                  &copy; {new Date().getFullYear()} Waardian
                </span>
              </div>
              <div className="sm:hidden flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                <span className="text-sm font-medium bg-gradient-to-r from-gray-600 to-gray-500 bg-clip-text text-transparent">
                  &copy; {new Date().getFullYear()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}