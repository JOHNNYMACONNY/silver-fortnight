/**
 * Real-time Metrics Component
 * 
 * Live updating metrics display with WebSocket-like real-time updates
 * and performance monitoring for TradeYa analytics.
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Users, 
  Target, 
  DollarSign, 
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface Metric {
  id: string;
  label: string;
  value: number;
  previousValue: number;
  unit: string;
  icon: React.ReactNode;
  color: string;
  trend: 'up' | 'down' | 'stable';
  lastUpdated: Date;
}

interface RealTimeMetricsProps {
  className?: string;
  updateInterval?: number;
  enableAnimations?: boolean;
}

const MOCK_METRICS: Omit<Metric, 'previousValue' | 'trend' | 'lastUpdated'>[] = [
  {
    id: 'active_users',
    label: 'Active Users',
    value: 1247,
    unit: '',
    icon: <Users className="h-4 w-4" />,
    color: 'text-blue-600',
  },
  {
    id: 'trades_per_minute',
    label: 'Trades/min',
    value: 23,
    unit: '',
    icon: <Target className="h-4 w-4" />,
    color: 'text-green-600',
  },
  {
    id: 'revenue_per_hour',
    label: 'Revenue/hr',
    value: 1847,
    unit: '$',
    icon: <DollarSign className="h-4 w-4" />,
    color: 'text-purple-600',
  },
  {
    id: 'response_time',
    label: 'Response Time',
    value: 245,
    unit: 'ms',
    icon: <Zap className="h-4 w-4" />,
    color: 'text-orange-600',
  },
  {
    id: 'success_rate',
    label: 'Success Rate',
    value: 98.7,
    unit: '%',
    icon: <Activity className="h-4 w-4" />,
    color: 'text-emerald-600',
  },
  {
    id: 'page_views',
    label: 'Page Views',
    value: 15623,
    unit: '',
    icon: <TrendingUp className="h-4 w-4" />,
    color: 'text-indigo-600',
  },
];

export const RealTimeMetrics: React.FC<RealTimeMetricsProps> = ({
  className = '',
  updateInterval = 5000, // 5 seconds
  enableAnimations = true,
}) => {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [isConnected, setIsConnected] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const intervalRef = useRef<NodeJS.Timeout>();
  const isMountedRef = useRef(true);

  // Initialize metrics
  useEffect(() => {
    const initialMetrics: Metric[] = MOCK_METRICS.map(metric => ({
      ...metric,
      previousValue: metric.value,
      trend: 'stable' as const,
      lastUpdated: new Date(),
    }));
    setMetrics(initialMetrics);
  }, []);

  // Simulate real-time updates
  useEffect(() => {
    const updateMetrics = () => {
      if (!isMountedRef.current) return;

      setMetrics(prevMetrics => 
        prevMetrics.map(metric => {
          // Generate realistic variations
          const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
          const newValue = Math.max(0, metric.value * (1 + variation));
          
          // Determine trend
          let trend: 'up' | 'down' | 'stable' = 'stable';
          const change = newValue - metric.value;
          const changePercent = Math.abs(change / metric.value) * 100;
          
          if (changePercent > 1) { // Only show trend if change is significant
            trend = change > 0 ? 'up' : 'down';
          }

          return {
            ...metric,
            previousValue: metric.value,
            value: Math.round(newValue * 100) / 100,
            trend,
            lastUpdated: new Date(),
          };
        })
      );

      setLastUpdate(new Date());
    };

    intervalRef.current = setInterval(updateMetrics, updateInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [updateInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-500" />;
      default:
        return <Minus className="h-3 w-3 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatValue = (value: number, unit: string) => {
    if (unit === '%') {
      return `${value.toFixed(1)}%`;
    }
    if (unit === '$') {
      return `$${value.toLocaleString()}`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toLocaleString();
  };

  const handleRefresh = () => {
    // Simulate connection status change
    setIsConnected(false);
    setTimeout(() => setIsConnected(true), 1000);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Real-time Metrics</h2>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                <Wifi className="h-3 w-3 mr-1" />
                Live
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                <WifiOff className="h-3 w-3 mr-1" />
                Connecting
              </Badge>
            )}
            <span className="text-sm text-muted-foreground">
              Last update: {lastUpdate.toLocaleTimeString()}
            </span>
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={!isConnected}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${!isConnected ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
              layout
            >
              <Card className="relative overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
                  <div className={metric.color}>
                    {metric.icon}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <motion.div
                      key={metric.value}
                      initial={enableAnimations ? { scale: 1.1 } : false}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className="text-2xl font-bold"
                    >
                      {formatValue(metric.value, metric.unit)}
                    </motion.div>
                    
                    <div className="flex items-center gap-1">
                      {getTrendIcon(metric.trend)}
                      <span className={`text-xs ${getTrendColor(metric.trend)}`}>
                        {metric.trend !== 'stable' && (
                          <motion.span
                            key={`${metric.value}-${metric.trend}`}
                            initial={enableAnimations ? { opacity: 0 } : false}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                          >
                            {metric.trend === 'up' ? '+' : '-'}
                            {Math.abs(((metric.value - metric.previousValue) / metric.previousValue) * 100).toFixed(1)}%
                          </motion.span>
                        )}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground mt-1">
                    Updated {metric.lastUpdated.toLocaleTimeString()}
                  </div>
                </CardContent>
                
                {/* Animated background indicator */}
                {enableAnimations && (
                  <motion.div
                    className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-transparent via-current to-transparent opacity-20"
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  />
                )}
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Live Activity Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {[
              { id: 1, action: 'New trade created', user: 'john_doe', time: '2s ago', type: 'trade' },
              { id: 2, action: 'User signed up', user: 'jane_smith', time: '5s ago', type: 'user' },
              { id: 3, action: 'Trade completed', user: 'mike_wilson', time: '12s ago', type: 'trade' },
              { id: 4, action: 'Collaboration started', user: 'sarah_jones', time: '18s ago', type: 'collaboration' },
              { id: 5, action: 'Profile updated', user: 'alex_brown', time: '25s ago', type: 'profile' },
            ].map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800"
              >
                <div className={`w-2 h-2 rounded-full ${
                  activity.type === 'trade' ? 'bg-green-500' :
                  activity.type === 'user' ? 'bg-blue-500' :
                  activity.type === 'collaboration' ? 'bg-purple-500' :
                  'bg-gray-500'
                }`} />
                <div className="flex-1">
                  <span className="text-sm font-medium">{activity.action}</span>
                  <span className="text-sm text-muted-foreground ml-2">by {activity.user}</span>
                </div>
                <span className="text-xs text-muted-foreground">{activity.time}</span>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RealTimeMetrics;

