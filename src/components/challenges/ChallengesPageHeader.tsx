import React from 'react';
import { Award, Clock, Users } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { cn } from '../../utils/cn';
import { useMobileOptimization } from '../../hooks/useMobileOptimization';

export interface ChallengesPageHeaderProps {
  liveCount: number | null;
  activeTab: 'all' | 'active' | 'mine';
  onTabChange: (tab: 'all' | 'active' | 'mine') => void;
  className?: string;
  isLoading?: boolean;
  loadingMessage?: string;
}

export const ChallengesPageHeader: React.FC<ChallengesPageHeaderProps> = ({
  liveCount,
  activeTab,
  onTabChange,
  className = '',
  isLoading = false,
  loadingMessage = 'Loading challenges...'
}) => {
  const { isMobile, getTouchTargetClass, getOptimalSpacing } = useMobileOptimization();
  
  const tabs = [
    { key: 'all' as const, label: 'All', icon: Award },
    { key: 'active' as const, label: 'Active', icon: Clock },
    { key: 'mine' as const, label: 'My Challenges', icon: Users },
  ];

  return (
    <div className={cn("space-y-6", className)}>
      {/* Primary Header Card */}
      <Card variant="glass" depth="lg" glow="subtle" glowColor="auto" className="glassmorphic">
        <CardContent className="flex flex-col md:flex-row md:items-center md:justify-between p-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-foreground">Challenges</h1>
              {liveCount !== null && (
                <Badge 
                  variant="success" 
                  className="animate-pulse"
                  aria-label={`${liveCount} live challenges`}
                >
                  Live: {liveCount}
                </Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {isLoading ? loadingMessage : 'Participate in coding challenges to improve your skills'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation Card */}
      <Card variant="glass" depth="md" glow="subtle" glowColor="auto" className="glassmorphic">
        <CardContent className="p-4">
          <div 
            className="flex items-center gap-2" 
            role="tablist"
            aria-label="Challenge categories"
          >
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.key;
              
              return (
                <Button
                  key={tab.key}
                  variant={isActive ? "primary" : "ghost"}
                  size={isMobile ? "md" : "sm"}
                  onClick={() => onTabChange(tab.key)}
                  disabled={isLoading}
                  className={cn(
                    "transition-all duration-200 hover:scale-105",
                    getTouchTargetClass(isMobile ? "large" : "standard"),
                    isMobile && "px-4 py-3", // Larger padding on mobile
                    isLoading && "opacity-50 cursor-not-allowed"
                  )}
                  role="tab"
                  aria-pressed={isActive}
                  aria-selected={isActive}
                  aria-controls={`panel-${tab.key}`}
                  id={`tab-${tab.key}`}
                >
                  <IconComponent className="mr-2 h-4 w-4" aria-hidden="true" />
                  {tab.label}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
