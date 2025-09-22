import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  TrendingUp, 
  Target,
  Filter,
  ChevronDown,
  Loader2,
  BarChart3,
  Award,
  Zap
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useMobileOptimization } from '../../hooks/useMobileOptimization';
import { PracticeSession, getPracticeAnalytics } from '../../services/practiceAnalytics';

export interface PracticeHistoryProps {
  userId: string;
  className?: string;
  showFilters?: boolean;
  maxSessions?: number;
}

export const PracticeHistory: React.FC<PracticeHistoryProps> = ({
  userId,
  className = '',
  showFilters = true,
  maxSessions = 20
}) => {
  const { isMobile } = useMobileOptimization();
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'week' | 'month' | 'year'>('month');
  const [skillFilter, setSkillFilter] = useState<string>('all');
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);

  useEffect(() => {
    const loadPracticeHistory = async () => {
      try {
        setLoading(true);
        const response = await getPracticeAnalytics(userId, filter);
        
        if (response.success && response.data) {
          const allSessions = response.data.recentSessions;
          setSessions(allSessions.slice(0, maxSessions));
          
          // Extract unique skills
          const skills = [...new Set(allSessions.map(s => s.skillName))];
          setAvailableSkills(skills);
        } else {
          setError(response.error || 'Failed to load practice history');
        }
      } catch (err) {
        setError('Failed to load practice history');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadPracticeHistory();
    }
  }, [userId, filter, maxSessions]);

  const filteredSessions = sessions.filter(session => 
    skillFilter === 'all' || session.skillName === skillFilter
  );

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDate = (timestamp: any): string => {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString();
  };

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'beginner': return 'text-success';
      case 'intermediate': return 'text-warning';
      case 'advanced': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return <Target className="h-3 w-3" />;
      case 'intermediate': return <TrendingUp className="h-3 w-3" />;
      case 'advanced': return <Zap className="h-3 w-3" />;
      default: return <BarChart3 className="h-3 w-3" />;
    }
  };

  const calculateStreak = (sessions: PracticeSession[]): number => {
    if (sessions.length === 0) return 0;
    
    const sortedSessions = sessions.sort((a, b) => 
      b.timestamp.toMillis() - a.timestamp.toMillis()
    );
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < sortedSessions.length; i++) {
      const sessionDate = new Date(sortedSessions[i].timestamp.toDate());
      sessionDate.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((today.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === streak) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const totalDuration = filteredSessions.reduce((sum, session) => sum + session.duration, 0);
  const totalXP = filteredSessions.reduce((sum, session) => sum + session.xpEarned, 0);
  const currentStreak = calculateStreak(filteredSessions);

  if (loading) {
    return (
      <div className={cn('glassmorphic p-4 rounded-lg', className)}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Loading practice history...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('glassmorphic p-4 rounded-lg border border-destructive/20', className)}>
        <div className="flex items-center gap-2 text-destructive">
          <BarChart3 className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('glassmorphic p-4 md:p-6 rounded-lg', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Practice History</h3>
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredSessions.length} sessions
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="text-center p-3 rounded-lg bg-primary/5 border border-primary/20">
          <div className="text-xl font-bold text-primary">{currentStreak}</div>
          <div className="text-xs text-muted-foreground">Day Streak</div>
        </div>
        
        <div className="text-center p-3 rounded-lg bg-success/5 border border-success/20">
          <div className="text-xl font-bold text-success">{formatDuration(totalDuration)}</div>
          <div className="text-xs text-muted-foreground">Total Time</div>
        </div>
        
        <div className="text-center p-3 rounded-lg bg-warning/5 border border-warning/20">
          <div className="text-xl font-bold text-warning">{totalXP}</div>
          <div className="text-xs text-muted-foreground">XP Earned</div>
        </div>
        
        <div className="text-center p-3 rounded-lg bg-info/5 border border-info/20">
          <div className="text-xl font-bold text-info">
            {filteredSessions.length > 0 ? 
              Math.round(totalDuration / filteredSessions.length) : 0}m
          </div>
          <div className="text-xs text-muted-foreground">Avg Session</div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="text-xs bg-muted border border-border rounded px-2 py-1"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
              <option value="all">All Time</option>
            </select>
          </div>
          
          {availableSkills.length > 1 && (
            <div className="flex items-center gap-2">
              <select
                value={skillFilter}
                onChange={(e) => setSkillFilter(e.target.value)}
                className="text-xs bg-muted border border-border rounded px-2 py-1"
              >
                <option value="all">All Skills</option>
                {availableSkills.map(skill => (
                  <option key={skill} value={skill}>{skill}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Sessions List */}
      <div className="space-y-2">
        {filteredSessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No practice sessions found</p>
            <p className="text-xs">Start practicing to see your history here!</p>
          </div>
        ) : (
          filteredSessions.map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-2 h-2 rounded-full bg-success flex-shrink-0" />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium truncate">{session.skillName}</span>
                    <div className={cn(
                      'flex items-center gap-1 text-xs',
                      getDifficultyColor(session.difficulty)
                    )}>
                      {getDifficultyIcon(session.difficulty)}
                      <span className="capitalize">{session.difficulty}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatDuration(session.duration)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Award className="h-3 w-3" />
                      <span>+{session.xpEarned} XP</span>
                    </div>
                    <span>{formatDate(session.timestamp)}</span>
                  </div>
                  
                  {session.notes && (
                    <div className="text-xs text-muted-foreground mt-1 italic">
                      "{session.notes}"
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex-shrink-0 ml-2">
                <div className="text-xs text-muted-foreground">
                  {session.completed ? 'Completed' : 'Incomplete'}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Load More Button */}
      {filteredSessions.length >= maxSessions && (
        <div className="flex justify-center mt-4">
          <button className="text-xs text-primary hover:text-primary/80 transition-colors">
            Load more sessions
          </button>
        </div>
      )}
    </div>
  );
};

export default PracticeHistory;
