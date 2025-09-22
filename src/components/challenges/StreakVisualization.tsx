import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  Calendar, 
  Target, 
  Trophy,
  Clock,
  Zap,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useMobileOptimization } from '../../hooks/useMobileOptimization';
import { UserStreak, getUserStreak } from '../../services/streaks';

export interface StreakVisualizationProps {
  userId: string;
  className?: string;
  showHistory?: boolean;
  compact?: boolean;
}

interface StreakDay {
  date: Date;
  practiced: boolean;
  xpEarned?: number;
  isToday: boolean;
  isFuture: boolean;
}

export const StreakVisualization: React.FC<StreakVisualizationProps> = ({
  userId,
  className = '',
  showHistory = true,
  compact = false
}) => {
  const { isMobile } = useMobileOptimization();
  const [streak, setStreak] = useState<UserStreak | null>(null);
  const [streakDays, setStreakDays] = useState<StreakDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentWeek, setCurrentWeek] = useState(0);

  useEffect(() => {
    const loadStreakData = async () => {
      try {
        setLoading(true);
        const response = await getUserStreak(userId, 'skill_practice');
        
        if (response.success && response.data) {
          setStreak(response.data);
          generateStreakDays(response.data);
        } else {
          setError('Failed to load streak data');
        }
      } catch (err) {
        setError('Failed to load streak data');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadStreakData();
    }
  }, [userId]);

  const generateStreakDays = (streakData: UserStreak) => {
    const days: StreakDay[] = [];
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 20); // Show last 20 days

    for (let i = 0; i < 21; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const isToday = date.toDateString() === today.toDateString();
      const isFuture = date > today;
      
      // Check if this day was practiced (simplified logic)
      const lastActivity = streakData.lastActivity?.toDate();
      const daysSinceActivity = lastActivity 
        ? Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
        : 999;
      
      const practiced = !isFuture && daysSinceActivity <= (21 - i);
      
      days.push({
        date,
        practiced,
        xpEarned: practiced ? Math.floor(Math.random() * 50) + 10 : undefined,
        isToday,
        isFuture
      });
    }
    
    setStreakDays(days);
  };

  const getStreakMotivation = (currentStreak: number): { message: string; icon: React.ReactNode; color: string } => {
    if (currentStreak === 0) {
      return {
        message: "Start your practice streak today!",
        icon: <Target className="h-4 w-4" />,
        color: "text-muted-foreground"
      };
    } else if (currentStreak < 3) {
      return {
        message: "Great start! Keep it going!",
        icon: <Zap className="h-4 w-4" />,
        color: "text-primary"
      };
    } else if (currentStreak < 7) {
      return {
        message: "You're building momentum!",
        icon: <Flame className="h-4 w-4" />,
        color: "text-warning"
      };
    } else if (currentStreak < 30) {
      return {
        message: "Incredible dedication!",
        icon: <Trophy className="h-4 w-4" />,
        color: "text-success"
      };
    } else {
      return {
        message: "You're a practice master!",
        icon: <Trophy className="h-4 w-4" />,
        color: "text-warning"
      };
    }
  };

  const getNextMilestone = (currentStreak: number): number => {
    const milestones = [3, 7, 14, 30, 60, 100];
    return milestones.find(milestone => milestone > currentStreak) || 100;
  };

  if (loading) {
    return (
      <div className={cn('glassmorphic p-4 rounded-lg', className)}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Loading streak data...</span>
        </div>
      </div>
    );
  }

  if (error || !streak) {
    return (
      <div className={cn('glassmorphic p-4 rounded-lg border border-destructive/20', className)}>
        <div className="flex items-center gap-2 text-destructive">
          <Flame className="h-4 w-4" />
          <span className="text-sm">Failed to load streak data</span>
        </div>
      </div>
    );
  }

  const motivation = getStreakMotivation(streak.currentStreak);
  const nextMilestone = getNextMilestone(streak.currentStreak);
  const progressToMilestone = (streak.currentStreak / nextMilestone) * 100;

  return (
    <div className={cn('glassmorphic p-4 md:p-6 rounded-lg', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-warning" />
          <h3 className="text-lg font-semibold text-foreground">Practice Streak</h3>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-warning">{streak.currentStreak}</div>
          <div className="text-xs text-muted-foreground">days</div>
        </div>
      </div>

      {/* Motivation Message */}
      <div className={cn('flex items-center gap-2 p-3 rounded-lg bg-muted/30 mb-4', motivation.color)}>
        {motivation.icon}
        <span className="text-sm font-medium">{motivation.message}</span>
      </div>

      {/* Streak Calendar */}
      {showHistory && !compact && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-foreground">Recent Activity</h4>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setCurrentWeek(Math.max(0, currentWeek - 1))}
                className="p-1 hover:bg-muted rounded"
                disabled={currentWeek === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs text-muted-foreground px-2">Week {currentWeek + 1}</span>
              <button 
                onClick={() => setCurrentWeek(currentWeek + 1)}
                className="p-1 hover:bg-muted rounded"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
              <div key={day} className="text-center text-xs text-muted-foreground font-medium">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {streakDays.slice(currentWeek * 7, (currentWeek + 1) * 7).map((day, index) => (
              <div
                key={index}
                className={cn(
                  'aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-all duration-200',
                  day.practiced && 'bg-success text-success-foreground',
                  !day.practiced && !day.isFuture && 'bg-muted/30 text-muted-foreground',
                  day.isFuture && 'bg-muted/10 text-muted-foreground',
                  day.isToday && 'ring-2 ring-primary/50'
                )}
              >
                {day.date.getDate()}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compact Streak Display */}
      {compact && (
        <div className="flex items-center gap-2 mb-4">
          {streakDays.slice(-7).map((day, index) => (
            <div
              key={index}
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium',
                day.practiced && 'bg-success text-success-foreground',
                !day.practiced && !day.isFuture && 'bg-muted/30 text-muted-foreground',
                day.isFuture && 'bg-muted/10 text-muted-foreground',
                day.isToday && 'ring-2 ring-primary/50'
              )}
            >
              {day.date.getDate()}
            </div>
          ))}
        </div>
      )}

      {/* Milestone Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Next Milestone</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {streak.currentStreak}/{nextMilestone} days
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, progressToMilestone)}%` }}
          />
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {nextMilestone - streak.currentStreak} more days to reach {nextMilestone} days!
        </div>
      </div>

      {/* Streak Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-3 rounded-lg bg-muted/30">
          <div className="text-lg font-bold text-foreground">{streak.longestStreak}</div>
          <div className="text-xs text-muted-foreground">Longest Streak</div>
        </div>
        <div className="text-center p-3 rounded-lg bg-muted/30">
          <div className="text-lg font-bold text-foreground">{streak.freezesUsed || 0}</div>
          <div className="text-xs text-muted-foreground">Freezes Used</div>
        </div>
      </div>

      {/* Last Activity */}
      {streak.lastActivity && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>
              Last practiced: {streak.lastActivity.toDate().toLocaleDateString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StreakVisualization;
