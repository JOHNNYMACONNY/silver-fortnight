/**
 * Analytics Dashboard Component
 * 
 * Comprehensive analytics dashboard displaying real-time metrics,
 * business intelligence, and performance monitoring for TradeYa.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Activity, 
  Download, 
  RefreshCw,
  Calendar,
  Filter,
  Eye,
  Target,
  Zap,
  Globe,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { useAnalytics } from '../../hooks/useAnalytics';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { Skeleton } from '../ui/Skeleton';
import { Alert, AlertDescription, AlertTitle } from '../ui/Alert';

interface AnalyticsDashboardProps {
  userId?: string;
  className?: string;
}

interface TimeRange {
  label: string;
  value: string;
  days: number;
}

const TIME_RANGES: TimeRange[] = [
  { label: 'Last 7 days', value: '7d', days: 7 },
  { label: 'Last 30 days', value: '30d', days: 30 },
  { label: 'Last 90 days', value: '90d', days: 90 },
  { label: 'Last year', value: '1y', days: 365 },
];

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  userId,
  className = '',
}) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('30d');
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isExporting, setIsExporting] = useState(false);

  const {
    isLoading,
    error,
    lastUpdated,
    userMetrics,
    businessMetrics,
    performanceMetrics,
    fetchAllMetrics,
    exportData,
    trackEvent,
  } = useAnalytics(userId, {
    enableRealTimeUpdates: true,
    updateInterval: 30000,
    enableAutoTracking: true,
  });

  // Fetch metrics on mount and time range change
  useEffect(() => {
    const timeRange = TIME_RANGES.find(range => range.value === selectedTimeRange);
    if (timeRange) {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - timeRange.days * 24 * 60 * 60 * 1000);
      
      fetchAllMetrics({ start: startDate, end: endDate });
    }
  }, [selectedTimeRange, fetchAllMetrics]);

  // Track dashboard view
  useEffect(() => {
    trackEvent('analytics_dashboard_viewed', {
      time_range: selectedTimeRange,
      user_id: userId,
    });
  }, [trackEvent, selectedTimeRange, userId]);

  const handleExport = async (format: 'json' | 'csv' | 'xlsx') => {
    setIsExporting(true);
    try {
      const timeRange = TIME_RANGES.find(range => range.value === selectedTimeRange);
      if (timeRange) {
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - timeRange.days * 24 * 60 * 60 * 1000);
        
        const blob = await exportData(format, { start: startDate, end: endDate });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${selectedTimeRange}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        trackEvent('analytics_exported', { format, time_range: selectedTimeRange });
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatPercentage = (num: number): string => {
    return `${(num * 100).toFixed(1)}%`;
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <ArrowUp className="h-4 w-4 text-green-500" />;
    if (growth < 0) return <ArrowDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (error) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={`w-full max-w-7xl mx-auto p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Real-time insights and business intelligence
            {lastUpdated && (
              <span className="ml-2 text-sm">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_RANGES.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const timeRange = TIME_RANGES.find(range => range.value === selectedTimeRange);
              if (timeRange) {
                const endDate = new Date();
                const startDate = new Date(endDate.getTime() - timeRange.days * 24 * 60 * 60 * 1000);
                fetchAllMetrics({ start: startDate, end: endDate });
              }
            }}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('csv')}
              disabled={isExporting}
            >
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('json')}
              disabled={isExporting}
            >
              <Download className="h-4 w-4 mr-2" />
              JSON
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {businessMetrics ? (
              <>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(businessMetrics.totalUsers)}</div>
                    <p className="text-xs text-muted-foreground">
                      {formatNumber(businessMetrics.activeUsers)} active
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(businessMetrics.totalTrades)}</div>
                    <p className="text-xs text-muted-foreground">
                      {formatPercentage(businessMetrics.tradeSuccessRate)} success rate
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${formatNumber(businessMetrics.totalRevenue)}</div>
                    <p className="text-xs text-muted-foreground">
                      ${businessMetrics.averageRevenuePerUser.toFixed(2)} per user
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Engagement</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{businessMetrics.engagementScore.toFixed(0)}</div>
                    <p className="text-xs text-muted-foreground">
                      {formatPercentage(businessMetrics.growthRate)} growth
                    </p>
                  </CardContent>
                </Card>
              </>
            ) : (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="space-y-0 pb-2">
                    <Skeleton className="h-4 w-20" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-16 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Charts Placeholder */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
                <CardDescription>Monthly active users over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Chart visualization would go here</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Skills</CardTitle>
                <CardDescription>Most popular skills by usage</CardDescription>
              </CardHeader>
              <CardContent>
                {businessMetrics?.topSkills ? (
                  <div className="space-y-3">
                    {businessMetrics.topSkills.map((skill, index) => (
                      <div key={skill.skill} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{skill.skill}</span>
                          <Badge variant="secondary">{formatNumber(skill.count)}</Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          {getGrowthIcon(skill.growth)}
                          <span className={`text-sm ${getGrowthColor(skill.growth)}`}>
                            {formatPercentage(skill.growth)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          {userMetrics ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Session Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Sessions</span>
                    <span className="font-medium">{userMetrics.totalSessions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Avg Duration</span>
                    <span className="font-medium">{formatDuration(userMetrics.averageSessionDuration)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Page Views</span>
                    <span className="font-medium">{userMetrics.pageViews}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Interactions</span>
                    <span className="font-medium">{userMetrics.interactions}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Engagement</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Bounce Rate</span>
                    <span className="font-medium">{formatPercentage(userMetrics.bounceRate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Conversion Rate</span>
                    <span className="font-medium">{formatPercentage(userMetrics.conversionRate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Last Active</span>
                    <span className="font-medium text-sm">
                      {userMetrics.lastActive.toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Pages</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {userMetrics.topPages.map((page, index) => (
                      <div key={page.page} className="flex items-center justify-between">
                        <span className="text-sm">{page.page}</span>
                        <Badge variant="outline">{page.views}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <div key={j} className="flex justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Business Tab */}
        <TabsContent value="business" className="space-y-6">
          {businessMetrics ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-2xl font-bold">{formatNumber(businessMetrics.totalUsers)}</div>
                      <p className="text-xs text-muted-foreground">Total Users</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{formatNumber(businessMetrics.activeUsers)}</div>
                      <p className="text-xs text-muted-foreground">Active Users</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{formatNumber(businessMetrics.newUsers)}</div>
                      <p className="text-xs text-muted-foreground">New Users</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{formatPercentage(businessMetrics.userRetentionRate)}</div>
                      <p className="text-xs text-muted-foreground">Retention Rate</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Revenue Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-2xl font-bold">${formatNumber(businessMetrics.totalRevenue)}</div>
                      <p className="text-xs text-muted-foreground">Total Revenue</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">${businessMetrics.averageRevenuePerUser.toFixed(2)}</div>
                      <p className="text-xs text-muted-foreground">ARPU</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{formatNumber(businessMetrics.totalTrades)}</div>
                      <p className="text-xs text-muted-foreground">Total Trades</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{formatPercentage(businessMetrics.tradeSuccessRate)}</div>
                      <p className="text-xs text-muted-foreground">Success Rate</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Top Locations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {businessMetrics.topLocations.map((location, index) => (
                      <div key={location.location} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{location.location}</span>
                          <Badge variant="secondary">{formatNumber(location.users)} users</Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          {getGrowthIcon(location.growth)}
                          <span className={`text-sm ${getGrowthColor(location.growth)}`}>
                            {formatPercentage(location.growth)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-32 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          {performanceMetrics ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Core Web Vitals</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">LCP</span>
                    <span className="font-medium">{performanceMetrics.largestContentfulPaint.toFixed(0)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">FID</span>
                    <span className="font-medium">{performanceMetrics.firstInputDelay.toFixed(0)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">CLS</span>
                    <span className="font-medium">{performanceMetrics.cumulativeLayoutShift.toFixed(3)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Loading Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Page Load</span>
                    <span className="font-medium">{performanceMetrics.pageLoadTime.toFixed(0)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">TTI</span>
                    <span className="font-medium">{performanceMetrics.timeToInteractive.toFixed(0)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">FCP</span>
                    <span className="font-medium">{performanceMetrics.firstContentfulPaint.toFixed(0)}ms</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Health</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Uptime</span>
                    <span className="font-medium">{formatPercentage(performanceMetrics.uptime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Error Rate</span>
                    <span className="font-medium">{formatPercentage(performanceMetrics.errorRate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Cache Hit</span>
                    <span className="font-medium">{formatPercentage(performanceMetrics.cacheHitRate)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Array.from({ length: 3 }).map((_, j) => (
                      <div key={j} className="flex justify-between">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;

