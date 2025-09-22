import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Clock, 
  Target, 
  Trophy, 
  Calendar,
  BarChart3,
  Zap,
  Award,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useMobileOptimization } from '../../hooks/useMobileOptimization';
import { PracticeAnalytics, getPracticeAnalytics } from '../../services/practiceAnalytics';

export interface PracticeAnalyticsProps {
  userId: string;
  className?: string;
  showDetailed?: boolean;
  timeRange?: 'week' | 'month' | 'year' | 'all';
}

export const PracticeAnalyticsComponent: React.FC<PracticeAnalyticsProps> = ({
  userId,
  className = '',
  showDetailed = false,
  timeRange = 'month'
}) => {
  const { isMobile } = useMobileOptimization();
  const [analytics, setAnalytics] = useState<PracticeAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        const response = await getPracticeAnalytics(userId, timeRange);
        
        if (response.success && response.data) {
          setAnalytics(response.data);
        } else {
          setError(response.error || 'Failed to load analytics');
        }
      } catch (err) {
        setError('Failed to load practice analytics');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadAnalytics();
    }
  }, [userId, timeRange]);

  if (loading) {
    return (
      <div className={cn('glassmorphic p-4 rounded-lg', className)}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className={cn('glassmorphic p-4 rounded-lg border border-destructive/20', className)}>
        <div className="flex items-center gap-2 text-destructive">
          <BarChart3 className="h-4 w-4" />
          <span className="text-sm">Failed to load analytics</span>
        </div>
      </div>
    );
  }

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getFrequencyColor = (frequency: string): string => {
    switch (frequency) {
      case 'daily': return 'text-success';
      case 'weekly': return 'text-primary';
      case 'monthly': return 'text-warning';
      default: return 'text-muted-foreground';
    }
  };

  const getFrequencyIcon = (frequency: string) => {
    switch (frequency) {
      case 'daily': return <Zap className="h-3 w-3" />;
      case 'weekly': return <Calendar className="h-3 w-3" />;
      case 'monthly': return <Clock className="h-3 w-3" />;
      default: return <BarChart3 className="h-3 w-3" />;
    }
  };

  return (
    <div className={cn('glassmorphic p-4 md:p-6 rounded-lg', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Practice Analytics</h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {getFrequencyIcon(analytics.practiceFrequency)}
          <span className={cn('capitalize', getFrequencyColor(analytics.practiceFrequency))}>
            {analytics.practiceFrequency} practice
          </span>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="text-center p-3 rounded-lg bg-primary/5 border border-primary/20">
          <div className="text-2xl font-bold text-primary">{analytics.totalSessions}</div>
          <div className="text-xs text-muted-foreground">Sessions</div>
        </div>
        
        <div className="text-center p-3 rounded-lg bg-success/5 border border-success/20">
          <div className="text-2xl font-bold text-success">{analytics.currentStreak}</div>
          <div className="text-xs text-muted-foreground">Day Streak</div>
        </div>
        
        <div className="text-center p-3 rounded-lg bg-warning/5 border border-warning/20">
          <div className="text-2xl font-bold text-warning">{formatDuration(analytics.totalDuration)}</div>
          <div className="text-xs text-muted-foreground">Total Time</div>
        </div>
        
        <div className="text-center p-3 rounded-lg bg-info/5 border border-info/20">
          <div className="text-2xl font-bold text-info">{analytics.totalXPEarned}</div>
          <div className="text-xs text-muted-foreground">XP Earned</div>
        </div>
      </div>

      {/* Weekly Goal Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Weekly Goal</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {Math.round(analytics.weeklyProgress)}% complete
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, analytics.weeklyProgress)}%` }}
          />
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {analytics.weeklyGoal} sessions this week
        </div>
      </div>

      {/* Skill Breakdown */}
      {analytics.skillBreakdown.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Top Skills</span>
          </div>
          <div className="space-y-2">
            {analytics.skillBreakdown.slice(0, 3).map((skill, index) => (
              <div key={skill.skillName} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                    {index + 1}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{skill.skillName}</div>
                    <div className="text-xs text-muted-foreground">
                      {skill.sessionsCount} sessions • {formatDuration(skill.totalDuration)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-medium text-success">
                    +{skill.improvementRate.toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground">improvement</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Achievements */}
      {analytics.achievements.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="h-4 w-4 text-warning" />
            <span className="text-sm font-medium">Recent Achievements</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {analytics.achievements.slice(0, 6).map((achievement) => (
              <div 
                key={achievement.id}
                className="flex items-center gap-2 p-2 rounded-lg bg-warning/5 border border-warning/20"
              >
                <Award className="h-4 w-4 text-warning" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{achievement.name}</div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {achievement.rarity}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed View */}
      {showDetailed && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Recent Sessions</span>
          </div>
          <div className="space-y-2">
            {analytics.recentSessions.slice(0, 5).map((session) => (
              <div key={session.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-success" />
                  <div>
                    <div className="text-sm font-medium">{session.skillName}</div>
                    <div className="text-xs text-muted-foreground">
                      {session.timestamp.toDate().toLocaleDateString()} • {session.difficulty}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-medium">{formatDuration(session.duration)}</div>
                  <div className="text-xs text-muted-foreground">+{session.xpEarned} XP</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View More Button */}
      <div className="flex justify-end mt-4">
        <button className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
          View detailed analytics
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
};

export default PracticeAnalyticsComponent;
