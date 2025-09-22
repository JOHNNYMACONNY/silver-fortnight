// src/components/ui/RealtimeStatusIndicator.tsx

import React from 'react';
import { Wifi, WifiOff, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { useRealtimeStatus } from '../../contexts/RealtimeContext';
import { cn } from '../../utils/cn';

interface RealtimeStatusIndicatorProps {
  showText?: boolean;
  showStats?: boolean;
  compact?: boolean;
  className?: string;
}

export const RealtimeStatusIndicator: React.FC<RealtimeStatusIndicatorProps> = ({
  showText = true,
  showStats = false,
  compact = false,
  className
}) => {
  const { isConnected, isReconnecting, health, stats, statusInfo } = useRealtimeStatus();

  const getIcon = () => {
    if (isReconnecting) {
      return <RefreshCw className="h-4 w-4 animate-spin" />;
    }
    
    if (!isConnected) {
      return <WifiOff className="h-4 w-4" />;
    }
    
    switch (health) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <WifiOff className="h-4 w-4" />;
    }
  };

  const getTooltipText = () => {
    if (isReconnecting) {
      return 'Reconnecting to real-time updates...';
    }
    
    if (!isConnected) {
      return 'Real-time updates are offline';
    }
    
    switch (health) {
      case 'healthy':
        return `Live updates active (${stats.activeSubscriptions} subscriptions)`;
      case 'degraded':
        return `Real-time updates unstable (${stats.errorCount} errors)`;
      default:
        return 'Real-time updates are offline';
    }
  };

  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center gap-1",
          statusInfo.color,
          className
        )}
        title={getTooltipText()}
      >
        {getIcon()}
        {showText && (
          <span className="text-xs font-medium">
            {statusInfo.text}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
        statusInfo.bgColor,
        className
      )}
      title={getTooltipText()}
    >
      {getIcon()}
      
      {showText && (
        <div className="flex flex-col">
          <span className={cn("text-sm font-medium", statusInfo.color)}>
            {statusInfo.text}
          </span>
          {isConnected && (
            <span className="text-xs text-gray-500">
              {stats.activeSubscriptions} active
            </span>
          )}
        </div>
      )}
      
      {showStats && isConnected && (
        <div className="ml-auto text-xs text-gray-500">
          <div>Updates: {stats.totalUpdates}</div>
          {stats.errorCount > 0 && (
            <div className="text-red-500">Errors: {stats.errorCount}</div>
          )}
        </div>
      )}
    </div>
  );
};

// Compact version for headers/navbars
export const RealtimeStatusDot: React.FC<{ className?: string }> = ({ className }) => {
  const { isConnected, isReconnecting, health } = useRealtimeStatus();

  const getDotColor = () => {
    if (isReconnecting) return 'bg-yellow-500';
    if (!isConnected) return 'bg-red-500';
    switch (health) {
      case 'healthy': return 'bg-green-500';
      case 'degraded': return 'bg-yellow-500';
      default: return 'bg-red-500';
    }
  };

  return (
    <div
      className={cn(
        "w-2 h-2 rounded-full transition-colors",
        getDotColor(),
        className
      )}
      title={`Real-time: ${isConnected ? 'Connected' : 'Disconnected'}`}
    />
  );
};

// Full status panel for settings/debugging
export const RealtimeStatusPanel: React.FC<{ className?: string }> = ({ className }) => {
  const { isConnected, isReconnecting, health, stats, statusInfo } = useRealtimeStatus();

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Real-time Status</h3>
        <RealtimeStatusIndicator showText={true} />
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="font-medium text-gray-700">Connection</div>
          <div className={statusInfo.color}>
            {statusInfo.text}
          </div>
        </div>
        
        <div>
          <div className="font-medium text-gray-700">Health</div>
          <div className={statusInfo.color}>
            {health.charAt(0).toUpperCase() + health.slice(1)}
          </div>
        </div>
        
        <div>
          <div className="font-medium text-gray-700">Active Subscriptions</div>
          <div className="text-gray-600">{stats.activeSubscriptions}</div>
        </div>
        
        <div>
          <div className="font-medium text-gray-700">Total Updates</div>
          <div className="text-gray-600">{stats.totalUpdates}</div>
        </div>
        
        {stats.errorCount > 0 && (
          <div className="col-span-2">
            <div className="font-medium text-red-700">Errors</div>
            <div className="text-red-600">{stats.errorCount}</div>
          </div>
        )}
        
        {stats.lastUpdate && (
          <div className="col-span-2">
            <div className="font-medium text-gray-700">Last Update</div>
            <div className="text-gray-600">
              {new Date(stats.lastUpdate).toLocaleString()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
