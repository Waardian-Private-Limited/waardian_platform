'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { apiClient } from '@/lib/apiClient';

interface AnalyticsData {
  totalViews: number;
  uniqueViews: number;
  totalClicks: number;
  uniqueClicks: number;
  detailViews: number;
  buttonClicks: number;
  redirectActions: number;
  clickThroughRate: number;
  conversionRate: number;
  averageViewDuration: number;
  viewsByHour: Record<string, number>;
  viewsByDay: Record<string, number>;
  viewsBySociety: Record<string, number>;
  clicksByActionType: Record<string, number>;
  topReferrers: Array<{ referrer: string; count: number }>;
  userEngagement: {
    totalUsers: number;
    returningUsers: number;
    newUsers: number;
    averageSessionDuration: number;
  };
  deviceAnalytics: {
    platforms: Record<string, number>;
    appVersions: Record<string, number>;
  };
  recentEvents: Array<{
    id: string;
    eventType: string;
    timestamp: string | Date;
    placement: string;
    userId: string;
    societyId: string;
    platform: string;
  }>;
  performanceMetrics: {
    peakHours: Array<{ hour: number; count: number }>;
    bestPerformingDays: Array<{ day: string; count: number }>;
    topSocieties: Array<{ society: string; count: number }>;
  };
}

interface CampaignData {
  id: number;
  title: string;
  description: string;
  status: string;
  startDate: string;
  endDate: string;
  duration: number;
}

interface NotificationData {
  maxAllowed: number;
  sent: number;
  remaining: number;
}

interface CampaignAnalytics {
  campaign: CampaignData;
  analytics: AnalyticsData;
  notifications: NotificationData;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function PromotionsPage() {
  const [campaignId, setCampaignId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [analyticsData, setAnalyticsData] = useState<CampaignAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pushTitle, setPushTitle] = useState('');
  const [pushMessage, setPushMessage] = useState('');
  const [sendingPush, setSendingPush] = useState(false);
  const [pushError, setPushError] = useState('');
  const [pushSuccess, setPushSuccess] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchAnalytics = async (silent = false) => {
    if (!campaignId.trim()) {
      setError('Please enter a campaign ID');
      return;
    }

    if (!phoneNumber.trim()) {
      setError('Please enter a phone number');
      return;
    }

    if (!silent) {
      setLoading(true);
      setError('');
    }
    
    try {
      const data = await apiClient(`/promotion/campaigns/${campaignId}/analytics`, {
        method: 'POST',
        body: { phoneNumber },
        withAuth: true
      });
      
      if (data.success) {
        setAnalyticsData(data.data);
        setLastUpdated(new Date());
        if (!silent) {
          setError('');
        }
      } else {
        if (!silent) {
          setError(data.message || 'Failed to fetch analytics');
        }
      }
    } catch (err: any) {
      if (!silent) {
        setError(err.message || 'Failed to fetch analytics. Please check your connection.');
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const sendPushNotification = async () => {
    if (!pushTitle.trim() || !pushMessage.trim()) {
      setPushError('Please enter both title and message');
      return;
    }

    if (!analyticsData) {
      setPushError('Please fetch campaign analytics first');
      return;
    }

    // Check time restrictions (11 PM to 6 AM IST)
    const now = new Date();
    const istTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    const hour = istTime.getHours();
    
    if (hour >= 23 || hour < 6) {
      setPushError('Push notifications are not allowed between 11 PM and 6 AM IST');
      return;
    }

    if (analyticsData.notifications.remaining <= 0) {
      setPushError('No push notifications remaining for this campaign');
      return;
    }

    setSendingPush(true);
    setPushError('');
    setPushSuccess('');
    
    try {
      const data = await apiClient(`/promotion/campaigns/${campaignId}/push-notification`, {
        method: 'POST',
        body: {
          title: pushTitle,
          message: pushMessage,
          phoneNumber
        },
        withAuth: true
      });
      
      if (data.success) {
        setPushSuccess(`Push notification sent  successfully!`);
        setPushTitle('');
        setPushMessage('');
        // Refresh analytics to update notification count
        fetchAnalytics(true);
      } else {
        setPushError(data.message || 'Failed to send push notification');
      }
    } catch (err: any) {
      setPushError(err.message || 'Failed to send push notification. Please check your connection.');
    } finally {
      setSendingPush(false);
    }
  };

  // Prepare chart data
  const hourlyData = analyticsData ? Object.entries(analyticsData.analytics.viewsByHour)
    .map(([hour, views]) => ({ hour: `${hour}:00`, views }))
    .sort((a, b) => parseInt(a.hour) - parseInt(b.hour)) : [];

  const dailyData = analyticsData ? Object.entries(analyticsData.analytics.viewsByDay)
    .map(([day, views]) => ({ day, views }))
    .sort((a, b) => new Date(a.day).getTime() - new Date(b.day).getTime()) : [];

  const societyData = analyticsData ? Object.entries(analyticsData.analytics.viewsBySociety)
    .map(([society, views]) => ({ society, views }))
    .slice(0, 10) : [];

  const actionData = analyticsData ? Object.entries(analyticsData.analytics.clicksByActionType)
    .map(([action, clicks], index) => ({ 
      action, 
      clicks, 
      fill: COLORS[index % COLORS.length] 
    })) : [];

  // Auto-refresh effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (autoRefresh && analyticsData && campaignId && phoneNumber) {
      interval = setInterval(() => {
        fetchAnalytics(true); // Silent refresh
      }, 30000); // Refresh every 30 seconds
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [autoRefresh, analyticsData, campaignId, phoneNumber]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Promotion Analytics Dashboard</h1>
          <p className="text-gray-600">View detailed analytics and send push notifications for your campaigns</p>
        </div>

        {/* Campaign ID Input */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Campaign Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="campaignId" className="block text-sm font-medium text-gray-700 mb-2">
                  Campaign ID
                </label>
                <input
                  id="campaignId"
                  type="text"
                  value={campaignId}
                  onChange={(e) => setCampaignId(e.target.value)}
                  placeholder="Enter campaign ID"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  id="phoneNumber"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter business phone number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button 
                onClick={() => fetchAnalytics(false)} 
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Loading...' : 'Fetch Analytics'}
              </Button>
              {analyticsData && !autoRefresh && (
                <Button 
                  onClick={() => fetchAnalytics(false)} 
                  disabled={loading}
                  variant="outline"
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  {loading ? 'Refreshing...' : '🔄 Refresh'}
                </Button>
              )}
              {analyticsData && (
                <Button 
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  variant={autoRefresh ? 'default' : 'outline'}
                  className={autoRefresh ? 'bg-green-600 hover:bg-green-700' : ''}
                >
                  {autoRefresh ? 'Live Mode ON' : 'Enable Live Mode'}
                </Button>
              )}
            </div>
            {error && (
              <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}
            {lastUpdated && (
              <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
                {autoRefresh && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Live updates enabled (refreshes every 30s)</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {analyticsData && (
          <>
            {/* Campaign Info */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Campaign Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Title</p>
                    <p className="font-semibold">{analyticsData.campaign.title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <Badge variant={analyticsData.campaign.status === 'active' ? 'default' : 'secondary'}>
                      {analyticsData.campaign.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Duration</p>
                    <p className="font-semibold">{analyticsData.campaign.duration} days</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Start Date</p>
                    <p className="font-semibold">
                      {new Date(analyticsData.campaign.startDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {analyticsData.campaign.description && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600">Description</p>
                    <p className="text-gray-800">{analyticsData.campaign.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-blue-600">
                    {analyticsData.analytics.totalViews.toLocaleString()}
                  </div>
                  <p className="text-sm text-gray-600">Total Views</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-green-600">
                    {analyticsData.analytics.totalClicks.toLocaleString()}
                  </div>
                  <p className="text-sm text-gray-600">Total Clicks</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-purple-600">
                    {analyticsData.analytics.clickThroughRate.toFixed(2)}%
                  </div>
                  <p className="text-sm text-gray-600">Click Through Rate</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-orange-600">
                    {analyticsData.analytics.uniqueViews.toLocaleString()}
                  </div>
                  <p className="text-sm text-gray-600">Unique Views</p>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-emerald-600">
                    {analyticsData.analytics.conversionRate.toFixed(2)}%
                  </div>
                  <p className="text-sm text-gray-600">Conversion Rate</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-cyan-600">
                    {analyticsData.analytics.averageViewDuration.toFixed(1)}s
                  </div>
                  <p className="text-sm text-gray-600">Avg View Duration</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-rose-600">
                    {analyticsData.analytics.userEngagement.totalUsers.toLocaleString()}
                  </div>
                  <p className="text-sm text-gray-600">Total Users</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-amber-600">
                    {analyticsData.analytics.recentEvents.length}
                  </div>
                  <p className="text-sm text-gray-600">Recent Events</p>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="text-xl font-bold text-indigo-600">
                    {analyticsData.analytics.detailViews.toLocaleString()}
                  </div>
                  <p className="text-sm text-gray-600">Detail Views</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-xl font-bold text-pink-600">
                    {analyticsData.analytics.buttonClicks.toLocaleString()}
                  </div>
                  <p className="text-sm text-gray-600">Button Clicks</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-xl font-bold text-teal-600">
                    {analyticsData.analytics.redirectActions.toLocaleString()}
                  </div>
                  <p className="text-sm text-gray-600">Redirect Actions</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Hourly Views */}
              <Card>
                <CardHeader>
                  <CardTitle>Views by Hour</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={hourlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="views" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Daily Views */}
              <Card>
                <CardHeader>
                  <CardTitle>Views by Day</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="views" stroke="#10B981" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Society Views and Action Types */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Top Societies */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Societies by Views</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={societyData} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="society" type="category" width={100} />
                      <Tooltip />
                      <Bar dataKey="views" fill="#8B5CF6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Clicks by Action Type */}
              <Card>
                <CardHeader>
                  <CardTitle>Clicks by Action Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={actionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ action, percent }) => `${action} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="clicks"
                      >
                        {actionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Analytics Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Device Analytics */}
              <Card>
                <CardHeader>
                  <CardTitle>Platform Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(analyticsData.analytics.deviceAnalytics.platforms).map(([platform, count]) => (
                      <div key={platform} className="flex justify-between items-center">
                        <span className="text-sm font-medium">{platform}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ 
                                width: `${(count / Math.max(...Object.values(analyticsData.analytics.deviceAnalytics.platforms))) * 100}%` 
                              }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Referrers */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Referrers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analyticsData.analytics.topReferrers.slice(0, 5).map((referrer, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm font-medium truncate">{referrer.referrer || 'Direct'}</span>
                        <span className="text-sm text-gray-600">{referrer.count}</span>
                      </div>
                    ))}
                    {analyticsData.analytics.topReferrers.length === 0 && (
                      <p className="text-sm text-gray-500">No referrer data available</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Peak Hours */}
              <Card>
                <CardHeader>
                  <CardTitle>Peak Hours</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analyticsData.analytics.performanceMetrics.peakHours.map((hour, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm font-medium">{hour.hour}:00</span>
                        <span className="text-sm text-gray-600">{hour.count} views</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Best Performing Days */}
              <Card>
                <CardHeader>
                  <CardTitle>Best Days</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analyticsData.analytics.performanceMetrics.bestPerformingDays.slice(0, 5).map((day, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm font-medium">{new Date(day.day).toLocaleDateString()}</span>
                        <span className="text-sm text-gray-600">{day.count} views</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Societies */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Societies</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analyticsData.analytics.performanceMetrics.topSocieties.slice(0, 5).map((society, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm font-medium">{society.society}</span>
                        <span className="text-sm text-gray-600">{society.count} views</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Events */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {analyticsData.analytics.recentEvents.map((event, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="text-sm font-medium">{event.eventType}</span>
                        <p className="text-xs text-gray-600">
                          {event.placement} • {event.platform}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-600">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {event.societyId}
                        </p>
                      </div>
                    </div>
                  ))}
                  {analyticsData.analytics.recentEvents.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">No recent events</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Push Notifications */}
            <Card>
              <CardHeader>
                <CardTitle>Push Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {analyticsData.notifications.maxAllowed}
                    </div>
                    <p className="text-sm text-gray-600">Max Allowed</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {analyticsData.notifications.sent}
                    </div>
                    <p className="text-sm text-gray-600">Sent</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {analyticsData.notifications.remaining}
                    </div>
                    <p className="text-sm text-gray-600">Remaining</p>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Send Push Notification</h3>
                  
                  {analyticsData.notifications.remaining <= 0 ? (
                    <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                      No push notifications remaining for this campaign.
                    </div>
                  ) : (
                    <>
                      <div>
                        <label htmlFor="pushTitle" className="block text-sm font-medium text-gray-700 mb-2">
                          Notification Title
                        </label>
                        <input
                          id="pushTitle"
                          type="text"
                          value={pushTitle}
                          onChange={(e) => setPushTitle(e.target.value)}
                          placeholder="Enter notification title"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="pushMessage" className="block text-sm font-medium text-gray-700 mb-2">
                          Notification Message
                        </label>
                        <textarea
                          id="pushMessage"
                          value={pushMessage}
                          onChange={(e) => setPushMessage(e.target.value)}
                          placeholder="Enter notification message"
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <Button 
                        onClick={sendPushNotification} 
                        disabled={sendingPush || analyticsData.notifications.remaining <= 0}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {sendingPush ? 'Sending...' : 'Send Push Notification'}
                      </Button>
                    </>
                  )}
                  
                  {pushError && (
                    <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                      {pushError}
                    </div>
                  )}
                  
                  {pushSuccess && (
                    <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                      {pushSuccess}
                    </div>
                  )}
                  
                  <div className="text-sm text-gray-600">
                    <p>• Push notifications are blocked between 11 PM and 6 AM IST</p>
                    <p>• Notifications will be sent to users based on campaign targeting</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}