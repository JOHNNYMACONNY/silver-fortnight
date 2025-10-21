/**
 * Smart Performance Monitor Component for TradeYa
 * 
 * Enhanced performance monitoring dashboard that displays Week 2 smart optimization
 * features: intelligent preloading, resource optimization, adaptive loading, and
 * intelligent caching analytics.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Button } from './Button';
import { Badge } from './Badge';
import { Progress } from './Progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './Tabs';
import { useSmartPerformance, useIntelligentPreloading, useAdaptiveLoading, useResourceOptimization, useIntelligentCaching } from '../../contexts/SmartPerformanceContext';
import { usePerformance } from '../../contexts/PerformanceContext';
import { Activity, Zap, Target, Brain, Database, Network, Cpu, HardDrive, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock, Users } from 'lucide-react';

/**
 * Smart Performance Monitor Props
 */
export interface SmartPerformanceMonitorProps {
  /** Show detailed analytics */
  showDetailedAnalytics?: boolean;
  /** Enable real-time updates */
  realTimeUpdates?: boolean;
  /** Update interval in milliseconds */
  updateInterval?: number;
  /** Compact mode */
  compact?: boolean;
}

/**
 * Performance status badge component
 */
const StatusBadge: React.FC<{ status: 'active' | 'inactive' | 'error' }> = ({ status }) => {
  const variants = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    error: 'bg-red-100 text-red-800'
  };

  const icons = {
    active: <CheckCircle className="w-3 h-3 mr-1" />,
    inactive: <Clock className="w-3 h-3 mr-1" />,
    error: <AlertTriangle className="w-3 h-3 mr-1" />
  };

  return (
    <Badge className={variants[status]}>
      {icons[status]}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

/**
 * Metric card component
 */
const MetricCard: React.FC<{
  title: string;
  value: string | number;
  trend?: number;
  icon: React.ReactNode;
  description?: string;
}> = ({ title, value, trend, icon, description }) => {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {description && (
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          )}
        </div>
        <div className="flex flex-col items-end">
          <div className="text-blue-600 mb-2">{icon}</div>
          {trend !== undefined && (
            <div className={`flex items-center text-xs ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

/**
 * Main Smart Performance Monitor Component
 */
export const SmartPerformanceMonitor: React.FC<SmartPerformanceMonitorProps> = ({
  showDetailedAnalytics = true,
  realTimeUpdates = true,
  updateInterval = 5000,
  compact = false
}) => {
  // Hooks
  const basePerformance = usePerformance();
  const smartPerformance = useSmartPerformance();
  const intelligentPreloading = useIntelligentPreloading();
  const adaptiveLoading = useAdaptiveLoading();
  const resourceOptimization = useResourceOptimization();
  const intelligentCaching = useIntelligentCaching();

  // Local state
  const [selectedTab, setSelectedTab] = useState('overview');
  const [refreshKey, setRefreshKey] = useState(0);

  // Auto-refresh effect
  useEffect(() => {
    if (!realTimeUpdates) return;

    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, updateInterval);

    return () => clearInterval(interval);
  }, [realTimeUpdates, updateInterval]);

  // Format number helper
  const formatNumber = (num: number, suffix?: string): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M${suffix || ''}`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K${suffix || ''}`;
    return `${num.toFixed(0)}${suffix || ''}`;
  };

  // Format time helper
  const formatTime = (ms: number): string => {
    if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
    return `${ms.toFixed(0)}ms`;
  };

  // Calculate overall performance score
  const calculateOverallScore = (): number => {
    const baseScore = basePerformance.performanceScore;
    const optimizationImpact = smartPerformance.optimizationSummary?.improvements.loadTime || 0;
    const cacheBonus = (intelligentCaching.stats?.hitRate || 0) * 10;
    
    return Math.min(100, baseScore + optimizationImpact / 10 + cacheBonus);
  };

  const overallScore = calculateOverallScore();

  if (compact) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Brain className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-medium">Smart Performance</p>
              <p className="text-sm text-gray-600">Score: {overallScore.toFixed(0)}/100</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <StatusBadge status={smartPerformance.smartFeaturesStatus.preloading} />
            <StatusBadge status={smartPerformance.smartFeaturesStatus.adaptiveLoading} />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6" key={refreshKey}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Brain className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Smart Performance Monitor</h2>
            <p className="text-gray-600">AI-powered optimization analytics and insights</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => smartPerformance.forceOptimizationCycle()}
          >
            <Zap className="w-4 h-4 mr-2" />
            Optimize Now
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => smartPerformance.resetSmartPerformance()}
          >
            Reset
          </Button>
        </div>
      </div>

      {/* Performance Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Overall Score"
          value={`${overallScore.toFixed(0)}/100`}
          trend={overallScore - basePerformance.performanceScore}
          icon={<Target className="w-6 h-6" />}
          description="AI-optimized performance score"
        />
        
        <MetricCard
          title="Load Time"
          value={formatTime(basePerformance.metrics.loadTime || 0)}
          trend={smartPerformance.optimizationSummary ? 
            -((smartPerformance.optimizationSummary.improvements.loadTime / (basePerformance.metrics.loadTime || 1)) * 100) : 
            undefined}
          icon={<Clock className="w-6 h-6" />}
          description="Page load performance"
        />

        <MetricCard
          title="Cache Hit Rate"
          value={`${((intelligentCaching.stats?.hitRate || 0) * 100).toFixed(1)}%`}
          trend={intelligentCaching.stats?.hitRate ? 
            (intelligentCaching.stats.hitRate - 0.6) * 100 : 
            undefined}
          icon={<Database className="w-6 h-6" />}
          description="Intelligent cache efficiency"
        />

        <MetricCard
          title="Active Optimizations"
          value={smartPerformance.optimizationSummary?.totalOptimizations || 0}
          icon={<Activity className="w-6 h-6" />}
          description="Current optimizations running"
        />
      </div>

      {/* Detailed Analytics Tabs */}
      {showDetailedAnalytics && (
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="preloading">Preloading</TabsTrigger>
            <TabsTrigger value="adaptive">Adaptive</TabsTrigger>
            <TabsTrigger value="optimization">Optimization</TabsTrigger>
            <TabsTrigger value="caching">Caching</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Component Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="w-5 h-5 mr-2" />
                    Component Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Intelligent Preloading</span>
                    <StatusBadge status={smartPerformance.smartFeaturesStatus.preloading} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Resource Optimization</span>
                    <StatusBadge status={smartPerformance.smartFeaturesStatus.resourceOptimization} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Adaptive Loading</span>
                    <StatusBadge status={smartPerformance.smartFeaturesStatus.adaptiveLoading} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Intelligent Caching</span>
                    <StatusBadge status={smartPerformance.smartFeaturesStatus.intelligentCaching} />
                  </div>
                </CardContent>
              </Card>

              {/* Performance Trends */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Performance Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Load Time Improvement</span>
                        <span>{formatTime(smartPerformance.optimizationSummary?.improvements.loadTime || 0)}</span>
                      </div>
                      <Progress 
                        value={Math.min(100, (smartPerformance.optimizationSummary?.improvements.loadTime || 0) / 10)} 
                        className="h-2"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Memory Savings</span>
                        <span>{formatNumber(smartPerformance.optimizationSummary?.improvements.memorySavings || 0, 'B')}</span>
                      </div>
                      <Progress 
                        value={Math.min(100, (smartPerformance.optimizationSummary?.improvements.memorySavings || 0) / 1024 / 1024)} 
                        className="h-2"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Network Savings</span>
                        <span>{formatNumber(smartPerformance.optimizationSummary?.improvements.networkSavings || 0, 'B')}</span>
                      </div>
                      <Progress 
                        value={Math.min(100, (smartPerformance.optimizationSummary?.improvements.networkSavings || 0) / 1024 / 1024)} 
                        className="h-2"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="w-5 h-5 mr-2" />
                  AI Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {smartPerformance.getOptimizationRecommendations().map((recommendation, index) => (
                    <div key={index} className="flex items-start space-x-2 p-2 bg-blue-50 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-blue-600 mt-0.5" />
                      <span className="text-sm text-blue-800">{recommendation}</span>
                    </div>
                  ))}
                  {smartPerformance.getOptimizationRecommendations().length === 0 && (
                    <div className="flex items-center space-x-2 p-2 bg-green-50 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-800">All systems optimized! Performance is excellent.</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preloading Tab */}
          <TabsContent value="preloading" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Zap className="w-5 h-5 mr-2" />
                    Intelligent Preloading
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Status</span>
                      <StatusBadge status={intelligentPreloading.status} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Active Preloads</span>
                      <span className="text-sm font-bold">{intelligentPreloading.activePreloads.length}</span>
                    </div>
                    <Button 
                      onClick={intelligentPreloading.triggerPreloading}
                      className="w-full"
                      size="sm"
                    >
                      Trigger Intelligent Preloading
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Active Preload Candidates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {intelligentPreloading.activePreloads.map((preload, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <p className="text-xs font-medium truncate">{preload.url}</p>
                          <p className="text-xs text-gray-600">{preload.reason}</p>
                        </div>
                        <Badge className="text-xs">
                          {(preload.confidenceScore * 100).toFixed(0)}%
                        </Badge>
                      </div>
                    ))}
                    {intelligentPreloading.activePreloads.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">No active preloads</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Adaptive Loading Tab */}
          <TabsContent value="adaptive" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="w-5 h-5 mr-2" />
                    Adaptive Loading Strategy
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {adaptiveLoading.deviceCapabilities && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Device Capabilities</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex justify-between">
                            <span>CPU Tier:</span>
                            <Badge>{adaptiveLoading.deviceCapabilities.cpuTier}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Memory:</span>
                            <span>{adaptiveLoading.deviceCapabilities.memory.toFixed(1)}GB</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Cores:</span>
                            <span>{adaptiveLoading.deviceCapabilities.hardwareConcurrency}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Touch:</span>
                            <span>{adaptiveLoading.deviceCapabilities.touchSupport ? 'Yes' : 'No'}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {adaptiveLoading.networkInfo && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Network Conditions</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex justify-between">
                            <span>Type:</span>
                            <Badge>{adaptiveLoading.networkInfo.effectiveType}</Badge>
                          </div>
                          {adaptiveLoading.networkInfo.downlink && (
                            <div className="flex justify-between">
                              <span>Speed:</span>
                              <span>{adaptiveLoading.networkInfo.downlink.toFixed(1)} Mbps</span>
                            </div>
                          )}
                          {adaptiveLoading.networkInfo.rtt && (
                            <div className="flex justify-between">
                              <span>Latency:</span>
                              <span>{adaptiveLoading.networkInfo.rtt}ms</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span>Data Saver:</span>
                            <span>{adaptiveLoading.networkInfo.saveData ? 'On' : 'Off'}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Loading Decisions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {adaptiveLoading.recentDecisions.map((decision, index) => (
                      <div key={index} className="p-2 bg-gray-50 rounded">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium">{decision.strategy.name}</span>
                          <Badge className="text-xs">
                            {(decision.confidence * 100).toFixed(0)}%
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600">{decision.reasoning[0]}</p>
                      </div>
                    ))}
                    {adaptiveLoading.recentDecisions.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">No recent decisions</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Resource Optimization Tab */}
          <TabsContent value="optimization" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Cpu className="w-5 h-5 mr-2" />
                    Resource Optimization
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {resourceOptimization.summary && (
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium">Images Optimized</p>
                          <p className="text-lg font-bold">{resourceOptimization.summary.resourceStats.optimizedImages}</p>
                        </div>
                        <div>
                          <p className="font-medium">Fonts Optimized</p>
                          <p className="text-lg font-bold">{resourceOptimization.summary.resourceStats.optimizedFonts}</p>
                        </div>
                      </div>
                    )}
                    <Button 
                      onClick={() => resourceOptimization.optimize()}
                      className="w-full"
                      size="sm"
                    >
                      Optimize Resources
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Optimization History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {resourceOptimization.history.map((entry, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <p className="text-xs font-medium">{entry.type}</p>
                          <p className="text-xs text-gray-600">
                            {new Date(entry.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge className={entry.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                            {entry.success ? 'Success' : 'Failed'}
                          </Badge>
                          <p className="text-xs text-gray-600 mt-1">
                            +{entry.impact.toFixed(0)}ms
                          </p>
                        </div>
                      </div>
                    ))}
                    {resourceOptimization.history.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">No optimization history</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Intelligent Caching Tab */}
          <TabsContent value="caching" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Database className="w-5 h-5 mr-2" />
                    Intelligent Cache
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {intelligentCaching.stats && (
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span>Hit Rate</span>
                          <span className="font-bold">{(intelligentCaching.stats.hitRate * 100).toFixed(1)}%</span>
                        </div>
                        <Progress value={intelligentCaching.stats.hitRate * 100} className="h-2" />
                        
                        <div className="flex justify-between text-sm">
                          <span>Total Entries</span>
                          <span className="font-bold">{intelligentCaching.stats.totalEntries}</span>
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <span>Memory Usage</span>
                          <span className="font-bold">{formatNumber(intelligentCaching.stats.memoryUsage, 'B')}</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex space-x-2">
                      <Button 
                        onClick={() => intelligentCaching.manageCache('warm')}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        Warm Cache
                      </Button>
                      <Button 
                        onClick={() => intelligentCaching.manageCache('clear')}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        Clear Cache
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cache Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  {intelligentCaching.stats && (
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Cache Efficiency</span>
                          <span>{(intelligentCaching.stats.hitRate * 100).toFixed(1)}%</span>
                        </div>
                        <Progress value={intelligentCaching.stats.hitRate * 100} className="h-2" />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Hits</p>
                          <p className="text-lg font-bold text-green-600">
                            {Math.round(intelligentCaching.stats.totalEntries * intelligentCaching.stats.hitRate)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Misses</p>
                          <p className="text-lg font-bold text-red-600">
                            {Math.round(intelligentCaching.stats.totalEntries * (1 - intelligentCaching.stats.hitRate))}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600 mb-2">Average Entry Size</p>
                        <p className="text-lg font-bold">{formatNumber(intelligentCaching.stats.averageEntrySize, 'B')}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default SmartPerformanceMonitor;