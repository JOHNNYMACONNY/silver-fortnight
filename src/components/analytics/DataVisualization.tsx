/**
 * Data Visualization Components
 * 
 * Interactive data visualization components for analytics dashboard
 * including charts, graphs, and visual representations of data.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart as PieChartIcon, 
  Activity,
  Target,
  Users,
  DollarSign
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../ui/Card';

interface ChartData {
  label: string;
  value: number;
  color?: string;
  growth?: number;
}

interface BarChartProps {
  data: ChartData[];
  title: string;
  description?: string;
  height?: number;
  showGrowth?: boolean;
  className?: string;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  title,
  description,
  height = 200,
  showGrowth = false,
  className = '',
}) => {
  const maxValue = Math.max(...data.map(item => item.value));
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          {title}
        </CardTitle>
        {description && (
          <CardDescription>{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="space-y-2"
            >
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{item.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{item.value.toLocaleString()}</span>
                  {showGrowth && item.growth !== undefined && (
                    <span className={`text-xs ${
                      item.growth > 0 ? 'text-green-600' : 
                      item.growth < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {item.growth > 0 ? '+' : ''}{item.growth.toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <motion.div
                  className={`h-2 rounded-full ${item.color || 'bg-blue-500'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${(item.value / maxValue) * 100}%` }}
                  transition={{ delay: index * 0.1 + 0.2, duration: 0.8 }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

interface LineChartProps {
  data: Array<{ label: string; value: number; color?: string }>;
  title: string;
  description?: string;
  height?: number;
  className?: string;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  title,
  description,
  height = 200,
  className = '',
}) => {
  const maxValue = Math.max(...data.map(item => item.value));
  const minValue = Math.min(...data.map(item => item.value));
  const range = maxValue - minValue;
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          {title}
        </CardTitle>
        {description && (
          <CardDescription>{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="relative" style={{ height }}>
          <svg width="100%" height={height} className="overflow-visible">
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0" />
              </linearGradient>
            </defs>
            
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
              <line
                key={index}
                x1="0"
                y1={height * ratio}
                x2="100%"
                y2={height * ratio}
                stroke="currentColor"
                strokeWidth="1"
                opacity="0.1"
              />
            ))}
            
            {/* Data line */}
            <motion.path
              d={data.map((item, index) => {
                const x = (index / (data.length - 1)) * 100;
                const y = height - ((item.value - minValue) / range) * height;
                return `${index === 0 ? 'M' : 'L'} ${x}% ${y}`;
              }).join(' ')}
              fill="none"
              stroke="rgb(59, 130, 246)"
              strokeWidth="2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, ease: "easeInOut" }}
            />
            
            {/* Area under curve */}
            <motion.path
              d={`M 0% ${height} ${data.map((item, index) => {
                const x = (index / (data.length - 1)) * 100;
                const y = height - ((item.value - minValue) / range) * height;
                return `L ${x}% ${y}`;
              }).join(' ')} L 100% ${height} Z`}
              fill="url(#lineGradient)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            />
            
            {/* Data points */}
            {data.map((item, index) => {
              const x = (index / (data.length - 1)) * 100;
              const y = height - ((item.value - minValue) / range) * height;
              
              return (
                <motion.circle
                  key={index}
                  cx={`${x}%`}
                  cy={y}
                  r="4"
                  fill="rgb(59, 130, 246)"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 + 0.8, duration: 0.3 }}
                  className="hover:r-6 transition-all duration-200"
                />
              );
            })}
          </svg>
          
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-muted-foreground">
            <span>{maxValue.toLocaleString()}</span>
            <span>{Math.round((maxValue + minValue) / 2).toLocaleString()}</span>
            <span>{minValue.toLocaleString()}</span>
          </div>
          
          {/* X-axis labels */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-muted-foreground">
            {data.map((item, index) => (
              <span key={index} className="text-center">
                {item.label}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface PieChartProps {
  data: ChartData[];
  title: string;
  description?: string;
  size?: number;
  className?: string;
}

export const PieChart: React.FC<PieChartProps> = ({
  data,
  title,
  description,
  size = 200,
  className = '',
}) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = 0;
  
  const segments = data.map((item, index) => {
    const percentage = item.value / total;
    const angle = percentage * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle += angle;
    
    const radius = size / 2 - 10;
    const centerX = size / 2;
    const centerY = size / 2;
    
    const startAngleRad = (startAngle - 90) * (Math.PI / 180);
    const endAngleRad = (endAngle - 90) * (Math.PI / 180);
    
    const x1 = centerX + radius * Math.cos(startAngleRad);
    const y1 = centerY + radius * Math.sin(startAngleRad);
    const x2 = centerX + radius * Math.cos(endAngleRad);
    const y2 = centerY + radius * Math.sin(endAngleRad);
    
    const largeArcFlag = angle > 180 ? 1 : 0;
    
    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ');
    
    return {
      ...item,
      pathData,
      percentage,
      angle,
      startAngle,
      endAngle,
    };
  });
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="h-5 w-5" />
          {title}
        </CardTitle>
        {description && (
          <CardDescription>{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center">
          <div className="relative">
            <svg width={size} height={size}>
              {segments.map((segment, index) => (
                <motion.path
                  key={segment.label}
                  d={segment.pathData}
                  fill={segment.color || `hsl(${(index * 137.5) % 360}, 70%, 60%)`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="hover:opacity-80 transition-opacity duration-200"
                />
              ))}
            </svg>
            
            {/* Center text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold">{total.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Legend */}
        <div className="mt-4 space-y-2">
          {segments.map((segment, index) => (
            <motion.div
              key={segment.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 + 0.5 }}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: segment.color || `hsl(${(index * 137.5) % 360}, 70%, 60%)` }}
                />
                <span className="text-sm">{segment.label}</span>
              </div>
              <div className="text-sm font-medium">
                {segment.value.toLocaleString()} ({segment.percentage.toFixed(1)}%)
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  description,
  icon,
  trend,
  className = '',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {icon}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span className={`text-xs ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
              <span className="text-xs text-muted-foreground">{trend.label}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

interface StatsGridProps {
  data: Array<{
    title: string;
    value: string | number;
    description?: string;
    icon?: React.ReactNode;
    trend?: {
      value: number;
      label: string;
      isPositive?: boolean;
    };
  }>;
  className?: string;
}

export const StatsGrid: React.FC<StatsGridProps> = ({
  data,
  className = '',
}) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
      {data.map((item, index) => (
        <MetricCard
          key={index}
          title={item.title}
          value={item.value}
          description={item.description}
          icon={item.icon}
          trend={item.trend}
        />
      ))}
    </div>
  );
};

export default {
  BarChart,
  LineChart,
  PieChart,
  MetricCard,
  StatsGrid,
};

