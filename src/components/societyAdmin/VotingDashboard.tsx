'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Calendar,
  Users,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  TrendingUp,
  Vote,
  AlertCircle,
  Play,
  Pause,
  Settings,
  Download,
  Share2,
  Target,
  PieChart,
  Activity,
  X,
  Upload,
  LineChart,
  RefreshCw,
  Calendar as CalendarIcon,
  ArrowUpRight,
  ArrowDownRight,
  Zap
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { LineChart as RechartsLineChart, Line, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Poll {
  id: number;
  title: string;
  description: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  startDate: string;
  endDate: string;
  totalVotes: number;
  totalEligible: number;
  audience: {
    type: string;
    totalEligible: number;
  };
  options: Array<{
    id: string;
    title: string;
    votes: number;
    percentage: number;
  }>;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  resultVisibility: string;
  // New fields to support result reveal and anonymity
  resultRevealTime?: string | null;
  isAnonymous?: boolean;
  canViewResults?: boolean;
}

interface VotingDashboardProps {
  societyId: string;
}

export default function VotingDashboard({ societyId }: VotingDashboardProps) {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState('polls');
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState('30d');
// Pagination state
const [page, setPage] = useState(1);
const [pageSize, setPageSize] = useState(10);
const [totalPages, setTotalPages] = useState(1);
const [totalCount, setTotalCount] = useState(0);

  // Fetch polls data from API
  const fetchPolls = async () => {
    setLoading(true);
    try {
      const response = await apiClient('/poll', {
        method: 'GET',
        withAuth: true,
        params: {
          page: String(page),
          limit: String(pageSize),
          status: statusFilter
        }
      });
      
      if (response.status === 'success') {
        // Helper function to safely parse JSON
        const safeJsonParse = (jsonString: any, fallback: any = null) => {
          if (!jsonString || typeof jsonString !== 'string' || jsonString.trim() === '') return fallback;
          try {
            return JSON.parse(jsonString);
          } catch (error) {
            console.warn('JSON parsing error:', error, 'for string:', jsonString);
            return fallback;
          }
        };

        const pagination = response.data?.pagination || {};
        setTotalPages(pagination.totalPages || 1);
        setTotalCount(pagination.total || 0);

        // Transform backend data to match frontend interface
        const transformedPolls = (response.data?.polls || []).map((poll: any) => {
          const audienceWings = safeJsonParse(poll.audience_wings, []);
          const totalEligible = Array.isArray(audienceWings) ? audienceWings.length : (poll.total_eligible || 0);
          
          // Compute status based on voting window if backend didn't provide computed_status
          const now = Date.now();
          const start = new Date(poll.start_date).getTime();
          const end = new Date(poll.end_date).getTime();
          const computedStatus = poll.computed_status || (poll.status === 'cancelled' ? 'cancelled' : (now < start ? 'scheduled' : (now <= end ? 'active' : 'completed')));

          const settingsJson = typeof poll.settings_json === 'object' ? poll.settings_json : safeJsonParse(poll.settings_json, {});
          const isAnonymous = !!(settingsJson?.anonymous || settingsJson?.isAnonymous);

          const options = Array.isArray(poll.options) ? poll.options.map((option: any, index: number) => ({
            id: String(option.id ?? index),
            title: option.title,
            votes: Number(option.votes || 0),
            percentage: Number(option.percentage || 0)
          })) : [];

          return {
            id: poll.id,
            title: poll.title,
            description: poll.description,
            status: computedStatus,
            startDate: poll.start_date,
            endDate: poll.end_date,
            totalVotes: Number(poll.total_votes || 0),
            totalEligible,
            audience: {
              type: poll.audience_type || 'All Residents',
              totalEligible
            },
            options,
            createdBy: poll.created_by,
            createdByName: poll.created_by_name,
            createdAt: poll.created_at,
            resultVisibility: poll.result_visibility || 'none',
            resultRevealTime: poll.result_reveal_time || null,
            isAnonymous,
            canViewResults: !!poll.can_view_results
          } as Poll;
        });
        
        setPolls(transformedPolls);
      } else {
        console.error('Failed to fetch polls:', response.message);
        setPolls([]);
        setTotalPages(1);
        setTotalCount(0);
      }
    } catch (error: any) {
      console.error('Error fetching polls:', error);
      setPolls([]);
      setTotalPages(1);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolls();
  }, [societyId, statusFilter, page, pageSize]);

  // Fetch analytics data
  const fetchAnalyticsData = async () => {
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    try {
      const response = await apiClient('/poll/analytics', {
        method: 'GET',
        params: {
          timeframe: analyticsTimeframe
        },
        withAuth: true
      });
      
      if (response.status === 'success') {
        setAnalyticsData(response.data.analytics);
      } else {
        throw new Error(response.message || 'Failed to fetch analytics data');
      }
    } catch (error: any) {
      console.error('Failed to fetch analytics data:', error);
      setAnalyticsError(error.message || 'Failed to load analytics data. Please try again.');
      setAnalyticsData(null);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchAnalyticsData();
    }
  }, [activeTab, analyticsTimeframe, societyId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Play className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'scheduled': return <Clock className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const filteredPolls = polls.filter(poll => {
    const matchesSearch = poll.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         poll.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || poll.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: polls.length,
    active: polls.filter(p => p.status === 'active').length,
    completed: polls.filter(p => p.status === 'completed').length,
    scheduled: polls.filter(p => p.status === 'scheduled').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Voting & Polls</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage community polls and voting initiatives
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Poll
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('polls')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'polls'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Vote className="w-4 h-4 inline mr-2" />
            Polls
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'analytics'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <BarChart3 className="w-4 h-4 inline mr-2" />
            Analytics
          </button>
        </nav>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'polls' && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Vote className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Polls</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Activity className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Polls</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.completed}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Scheduled</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.scheduled}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search polls..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="scheduled">Scheduled</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Polls List */}
      <div className="space-y-4">
        {filteredPolls.map((poll) => (
          <div key={poll.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{poll.title}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(poll.status)}`}>
                      {getStatusIcon(poll.status)}
                      <span className="ml-1 capitalize">{poll.status}</span>
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4">{poll.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="w-4 h-4 mr-2" />
                      {new Date(poll.startDate).toLocaleDateString()} - {new Date(poll.endDate).toLocaleDateString()}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Users className="w-4 h-4 mr-2" />
                      {poll.audience.type} ({poll.audience.totalEligible} eligible)
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      {poll.totalVotes} / {poll.totalEligible} votes ({((poll.totalVotes / poll.totalEligible) * 100).toFixed(1)}%)
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Participation</span>
                      <span>{poll.totalVotes} / {poll.totalEligible}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(poll.totalVotes / poll.totalEligible) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Options Preview */}
                  {poll.status !== 'scheduled' && poll.options.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700">Results Preview:</h4>
                      {poll.canViewResults ? (
                        poll.options.slice(0, 2).map((option) => (
                          <div key={option.id} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">{option.title}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-gray-200 rounded-full h-1.5">
                                <div 
                                  className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
                                  style={{ width: `${option.percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-gray-500 w-12 text-right">{option.percentage.toFixed(1)}%</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-gray-500">
                          Results are hidden until {poll.resultRevealTime ? new Date(poll.resultRevealTime).toLocaleString() : new Date(poll.endDate).toLocaleString()}
                        </p>
                      )}
                      {poll.options.length > 2 && (
                        <p className="text-xs text-gray-500">+{poll.options.length - 2} more options</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => {
                      setSelectedPoll(poll);
                      setShowDetailsModal(true);
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="More Options"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-lg shadow p-4 mt-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Rows per page</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="px-2 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>
          <div className="text-sm text-gray-600">
            Page {page} of {totalPages} • {totalCount} total
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              disabled={page === 1}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {filteredPolls.length === 0 && (
        <div className="text-center py-12">
          <Vote className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No polls found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : 'Get started by creating your first poll.'}
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <div className="mt-6">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Poll
              </button>
            </div>
          )}
        </div>
      )}
      </>
      )}

      {/* Analytics Tab Content */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Analytics Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Poll Analytics</h2>
              <p className="mt-1 text-sm text-gray-500">
                Comprehensive insights and statistics for your polls
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-3">
              <select
                value={analyticsTimeframe}
                onChange={(e) => setAnalyticsTimeframe(e.target.value)}
                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
              <button
                onClick={fetchAnalyticsData}
                disabled={analyticsLoading}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${analyticsLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Error State */}
          {analyticsError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Error Loading Analytics
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{analyticsError}</p>
                  </div>
                  <div className="mt-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={fetchAnalyticsData}
                        className="bg-red-100 px-2 py-1.5 rounded-md text-sm font-medium text-red-800 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {analyticsLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : analyticsData && !analyticsError ? (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Vote className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Polls
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">
                            {analyticsData.totalPolls || 0}
                          </div>
                          <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                            <ArrowUpRight className="self-center flex-shrink-0 h-4 w-4" />
                            <span className="sr-only">Increased by</span>
                            {analyticsData.pollsGrowth || 0}%
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Users className="h-8 w-8 text-green-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Participants
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">
                            {analyticsData.totalParticipants || 0}
                          </div>
                          <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                            <ArrowUpRight className="self-center flex-shrink-0 h-4 w-4" />
                            <span className="sr-only">Increased by</span>
                            {analyticsData.participationGrowth || 0}%
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <TrendingUp className="h-8 w-8 text-purple-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Avg Participation Rate
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">
                            {analyticsData.avgParticipationRate || 0}%
                          </div>
                          <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                            <ArrowUpRight className="self-center flex-shrink-0 h-4 w-4" />
                            <span className="sr-only">Increased by</span>
                            {analyticsData.participationRateChange || 0}%
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Zap className="h-8 w-8 text-yellow-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Active Polls
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">
                            {analyticsData.activePolls || 0}
                          </div>
                          <div className="ml-2 flex items-baseline text-sm font-semibold text-blue-600">
                            <Activity className="self-center flex-shrink-0 h-4 w-4" />
                            <span className="sr-only">Currently active</span>
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Participation Trends Chart */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Participation Trends</h3>
                    <LineChart className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="h-64">
                    {analyticsData?.participationTrends && analyticsData.participationTrends.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsLineChart data={analyticsData.participationTrends}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="participants" stroke="#3B82F6" strokeWidth={2} />
                        </RechartsLineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                        <div className="text-center">
                          <LineChart className="mx-auto h-12 w-12 text-gray-400" />
                          <h3 className="mt-2 text-sm font-medium text-gray-900">No Data Available</h3>
                          <p className="mt-1 text-sm text-gray-500">Participation trends will appear here</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Poll Status Distribution */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Poll Status Distribution</h3>
                    <PieChart className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="h-64">
                    {analyticsData?.statusDistribution && Object.keys(analyticsData.statusDistribution).length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={Object.entries(analyticsData.statusDistribution).map(([status, count]) => ({
                              name: status.charAt(0).toUpperCase() + status.slice(1),
                              value: count,
                              fill: status === 'active' ? '#10B981' :
                                    status === 'completed' ? '#3B82F6' :
                                    status === 'scheduled' ? '#F59E0B' : '#EF4444'
                            }))}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {Object.entries(analyticsData.statusDistribution).map(([status], index) => (
                              <Cell key={`cell-${index}`} fill={
                                status === 'active' ? '#10B981' :
                                status === 'completed' ? '#3B82F6' :
                                status === 'scheduled' ? '#F59E0B' : '#EF4444'
                              } />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                        <div className="text-center">
                          <PieChart className="mx-auto h-12 w-12 text-gray-400" />
                          <h3 className="mt-2 text-sm font-medium text-gray-900">No Data Available</h3>
                          <p className="mt-1 text-sm text-gray-500">Poll status distribution will appear here</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Audience Analytics */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Audience Analytics</h3>
                  <Target className="h-5 w-5 text-gray-400" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {analyticsData.audienceBreakdown && Object.entries(analyticsData.audienceBreakdown).map(([type, data]: [string, any]) => (
                    <div key={type} className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{data.count}</div>
                      <div className="text-sm text-gray-500">{type}</div>
                      <div className="text-xs text-gray-400">{data.percentage}% of total</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
                  <CalendarIcon className="h-5 w-5 text-gray-400" />
                </div>
                <div className="space-y-4">
                  {analyticsData.recentActivity && analyticsData.recentActivity.map((activity: any, index: number) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">{activity.description}</p>
                        <p className="text-xs text-gray-500">{activity.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No analytics data available</h3>
              <p className="mt-1 text-sm text-gray-500">Analytics data will appear here once polls are created.</p>
            </div>
          )}
        </div>
      )}

      {/* Enhanced Create Poll Modal */}
      {showCreateModal && <CreatePollModal onClose={() => setShowCreateModal(false)} societyId={societyId} />}

      {/* Enhanced Poll Details Modal */}
      {showDetailsModal && selectedPoll && <PollDetailsModal poll={selectedPoll} onClose={() => setShowDetailsModal(false)} />}
    </div>
  );
}

// PollDetailsModal Component
interface PollDetailsModalProps {
  poll: Poll;
  onClose: () => void;
}

const PollDetailsModal: React.FC<PollDetailsModalProps> = ({ poll, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showVotersList, setShowVotersList] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Play className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'scheduled': return <Clock className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const participationRate = (poll.totalVotes / poll.totalEligible) * 100;
  const winningOption = poll.options.reduce((prev, current) => 
    prev.votes > current.votes ? prev : current
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-semibold text-gray-900">{poll.title}</h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(poll.status)}`}>
                  {getStatusIcon(poll.status)}
                  <span className="ml-1 capitalize">{poll.status}</span>
                </span>
              </div>
              <p className="text-gray-600">{poll.description}</p>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Download Results">
                <Download className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Share Poll">
                <Share2 className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Settings">
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex px-6">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'results', label: 'Results', icon: PieChart },
              { id: 'voters', label: 'Voters', icon: Users },
              { id: 'timeline', label: 'Timeline', icon: Clock }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Users className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-blue-600">Total Votes</p>
                      <p className="text-2xl font-semibold text-blue-900">{poll.totalVotes}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Target className="h-8 w-8 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-green-600">Participation</p>
                      <p className="text-2xl font-semibold text-green-900">{participationRate.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <TrendingUp className="h-8 w-8 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-purple-600">Leading Option</p>
                      <p className="text-lg font-semibold text-purple-900">{winningOption.percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Clock className="h-8 w-8 text-orange-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-orange-600">Time Left</p>
                      <p className="text-lg font-semibold text-orange-900">
                        {poll.status === 'active' ? '2d 5h' : poll.status === 'completed' ? 'Ended' : 'Not Started'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Poll Information */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Poll Information</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Created By</span>
                      <span className="text-sm text-gray-900">{poll.createdByName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Created On</span>
                      <span className="text-sm text-gray-900">{new Date(poll.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Start Date</span>
                      <span className="text-sm text-gray-900">{new Date(poll.startDate).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">End Date</span>
                      <span className="text-sm text-gray-900">{new Date(poll.endDate).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Audience</span>
                      <span className="text-sm text-gray-900">{poll.audience.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Eligible Voters</span>
                      <span className="text-sm text-gray-900">{poll.audience.totalEligible}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Participation Progress</h4>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Overall Participation</span>
                        <span>{poll.totalVotes} / {poll.totalEligible}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${participationRate}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{participationRate.toFixed(1)}% participation rate</p>
                    </div>
                    
                    {poll.status === 'active' && (
                      <div className="mt-4 p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center">
                          <Activity className="w-5 h-5 text-green-600 mr-2" />
                          <span className="text-sm font-medium text-green-800">Poll is currently active</span>
                        </div>
                        <p className="text-xs text-green-600 mt-1">Residents can vote until {new Date(poll.endDate).toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'results' && (
            <div className="space-y-6">
              {/* Results Summary */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Voting Results</h4>
                {poll.canViewResults ? (
                  <div className="space-y-4">
                    {poll.options.map((option, index) => (
                      <div key={option.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium text-gray-900">{option.title}</h5>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-600">{option.votes} votes</span>
                            <span className="text-lg font-bold text-blue-600">{option.percentage.toFixed(1)}%</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className={`h-3 rounded-full transition-all duration-500 ${
                              index === 0 ? 'bg-blue-500' :
                              index === 1 ? 'bg-green-500' :
                              index === 2 ? 'bg-purple-500' :
                              'bg-orange-500'
                            }`}
                            style={{ width: `${option.percentage}%` }}
                          ></div>
                        </div>
                        {option.votes === winningOption.votes && option.votes > 0 && (
                          <div className="mt-2 flex items-center text-sm text-green-600">
                            <TrendingUp className="w-4 h-4 mr-1" />
                            Leading option
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                      <span className="text-sm text-yellow-800">
                        Results are hidden until {poll.resultRevealTime ? new Date(poll.resultRevealTime).toLocaleString() : new Date(poll.endDate).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Visual Chart Placeholder */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Visual Breakdown</h4>
                <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Chart visualization would be rendered here</p>
                    <p className="text-sm text-gray-400">Integration with chart library needed</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'voters' && (
            <div className="space-y-6">
              {/* Voter Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Voted</p>
                      <p className="text-2xl font-semibold text-gray-900">{poll.totalVotes}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Clock className="h-8 w-8 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Pending</p>
                      <p className="text-2xl font-semibold text-gray-900">{poll.totalEligible - poll.totalVotes}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Users className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Total Eligible</p>
                      <p className="text-2xl font-semibold text-gray-900">{poll.totalEligible}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Voter List */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-medium text-gray-900">Voter Details</h4>
                  <button
                    onClick={() => setShowVotersList(!showVotersList)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {showVotersList ? 'Hide' : 'Show'} Voter List
                  </button>
                </div>
                
                {showVotersList ? (
                  <div className="space-y-2">
                    <div className="text-sm text-gray-500 mb-4">
                      Note: Actual voter identities are kept confidential. This is for demonstration.
                    </div>
                    {/* Mock voter data */}
                    {Array.from({ length: Math.min(poll.totalVotes, 10) }, (_, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-600">{String.fromCharCode(65 + i)}</span>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">Resident {i + 1}</p>
                            <p className="text-xs text-gray-500">Flat {100 + i}</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className="text-xs text-gray-500">
                            {new Date(Date.now() - Math.random() * 86400000).toLocaleDateString()}
                          </span>
                          <CheckCircle className="w-4 h-4 text-green-500 ml-2" />
                        </div>
                      </div>
                    ))}
                    {poll.totalVotes > 10 && (
                      <p className="text-sm text-gray-500 text-center py-2">
                        ... and {poll.totalVotes - 10} more voters
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>Click "Show Voter List" to view voting details</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Poll Timeline</h4>
                <div className="space-y-4">
                  {/* Timeline items */}
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Plus className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">Poll Created</p>
                      <p className="text-xs text-gray-500">{new Date(poll.createdAt).toLocaleString()}</p>
                      <p className="text-xs text-gray-600">Created by {poll.createdByName}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Play className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">Voting Started</p>
                      <p className="text-xs text-gray-500">{new Date(poll.startDate).toLocaleString()}</p>
                    </div>
                  </div>

                  {poll.status === 'completed' && (
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900">Voting Ended</p>
                        <p className="text-xs text-gray-500">{new Date(poll.endDate).toLocaleString()}</p>
                        <p className="text-xs text-gray-600">Final participation: {participationRate.toFixed(1)}%</p>
                      </div>
                    </div>
                  )}

                  {poll.status === 'active' && (
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                        <Clock className="w-4 h-4 text-yellow-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900">Voting Ends</p>
                        <p className="text-xs text-gray-500">{new Date(poll.endDate).toLocaleString()}</p>
                        <p className="text-xs text-gray-600">Current participation: {participationRate.toFixed(1)}%</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// CreatePollModal Component
interface CreatePollModalProps {
  onClose: () => void;
  societyId: string;
}

const CreatePollModal: React.FC<CreatePollModalProps> = ({ onClose, societyId }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    resultRevealTime: '',
    audienceType: 'All Residents',
    resultVisibility: 'none',
    selectedWings: [],
    selectedFlats: [],
    options: [{ title: '', description: '' }, { title: '', description: '' }],
    pollImages: [],
    pollDocuments: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const audienceTypes = [
    'All Residents',
    'Only Owners', 
    'Selected Wings',
    'One Vote Per Flat',
    'Owner or Tenant (One Vote)',
    'Selected Flats'
  ];

  const resultVisibilityOptions = [
    { value: 'none', label: 'Hidden until reveal time' },
    { value: 'live', label: 'Show live results' },
    { value: 'after_voting', label: 'Show after voting ends' }
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, { title: '', description: '' }]
    }));
  };

  const removeOption = (index: number) => {
    if (formData.options.length > 2) {
      setFormData(prev => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index)
      }));
    }
  };

  const updateOption = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => 
        i === index ? { ...opt, [field]: value } : opt
      )
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    if (!formData.endDate) newErrors.endDate = 'End date is required';
    
    if (formData.startDate && formData.endDate) {
      if (new Date(formData.startDate) >= new Date(formData.endDate)) {
        newErrors.endDate = 'End date must be after start date';
      }
    }
    
    formData.options.forEach((option, index) => {
      if (!option.title.trim()) {
        newErrors[`option_${index}`] = 'Option title is required';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const pollData = {
        title: formData.title,
        description: formData.description,
        startDate: formData.startDate,
        endDate: formData.endDate,
        resultRevealTime: formData.resultRevealTime || null,
        audience: {
          type: formData.audienceType,
          wings: formData.selectedWings,
          flats: formData.selectedFlats
        },
        settings: {
          resultVisibility: formData.resultVisibility
        },
        options: formData.options.filter(opt => opt.title.trim()),
        pollImages: formData.pollImages,
        pollDocuments: formData.pollDocuments,
        status: 'scheduled'
      };
      
      // TODO: Replace with actual API call
      console.log('Creating poll:', pollData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onClose();
    } catch (error) {
      console.error('Error creating poll:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-gray-900">Create New Poll</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900">Basic Information</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Poll Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter poll title"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.title}
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                rows={3}
                placeholder="Enter poll description"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.description}
                </p>
              )}
            </div>
          </div>
          
          {/* Timing */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900">Timing</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.startDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.startDate && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.startDate}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.endDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.endDate && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.endDate}
                  </p>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Result Reveal Time (Optional)
              </label>
              <input
                type="datetime-local"
                value={formData.resultRevealTime}
                onChange={(e) => handleInputChange('resultRevealTime', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                If not set, results will be revealed immediately after voting ends
              </p>
            </div>
          </div>
          
          {/* Audience */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900">Audience</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Who can vote?
              </label>
              <select
                value={formData.audienceType}
                onChange={(e) => handleInputChange('audienceType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {audienceTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Settings */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900">Settings</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Result Visibility
              </label>
              <select
                value={formData.resultVisibility}
                onChange={(e) => handleInputChange('resultVisibility', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {resultVisibilityOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Poll Options */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-medium text-gray-900">Poll Options</h4>
              <button
                type="button"
                onClick={addOption}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Add Option
              </button>
            </div>
            
            {formData.options.map((option, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <h5 className="font-medium text-gray-900">Option {index + 1}</h5>
                  {formData.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Option Title *
                    </label>
                    <input
                      type="text"
                      value={option.title}
                      onChange={(e) => updateOption(index, 'title', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors[`option_${index}`] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter option title"
                    />
                    {errors[`option_${index}`] && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors[`option_${index}`]}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description (Optional)
                    </label>
                    <textarea
                      value={option.description}
                      onChange={(e) => updateOption(index, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={2}
                      placeholder="Enter option description"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                'Create Poll'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};