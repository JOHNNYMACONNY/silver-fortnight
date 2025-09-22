import React, { useState, useEffect } from 'react';
import { 
  Share2, 
  Users, 
  Trophy, 
  MessageCircle,
  Heart,
  Eye,
  Calendar,
  Clock,
  Zap,
  Target,
  Award,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useMobileOptimization } from '../../hooks/useMobileOptimization';

export interface PracticeSocialProps {
  userId: string;
  className?: string;
  showChallenges?: boolean;
  showLeaderboard?: boolean;
}

interface PracticePost {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  skillName: string;
  duration: number;
  xpEarned: number;
  message?: string;
  timestamp: Date;
  likes: number;
  comments: number;
  isLiked: boolean;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

interface PracticeChallenge {
  id: string;
  title: string;
  description: string;
  skillName: string;
  targetDuration: number; // in minutes
  targetSessions: number;
  xpReward: number;
  participants: number;
  endDate: Date;
  isParticipating: boolean;
  progress: number; // percentage
  icon: string;
}

export const PracticeSocial: React.FC<PracticeSocialProps> = ({
  userId,
  className = '',
  showChallenges = true,
  showLeaderboard = true
}) => {
  const { isMobile } = useMobileOptimization();
  const [posts, setPosts] = useState<PracticePost[]>([]);
  const [challenges, setChallenges] = useState<PracticeChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'feed' | 'challenges' | 'leaderboard'>('feed');

  useEffect(() => {
    const loadSocialData = async () => {
      try {
        setLoading(true);
        
        // Mock data for now - in real app, this would fetch from API
        const mockPosts: PracticePost[] = [
          {
            id: '1',
            userId: 'user1',
            userName: 'Alex Chen',
            skillName: 'Trading Analysis',
            duration: 45,
            xpEarned: 120,
            message: 'Just completed a deep dive into technical analysis! Feeling more confident about chart patterns.',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
            likes: 12,
            comments: 3,
            isLiked: false,
            difficulty: 'intermediate'
          },
          {
            id: '2',
            userId: 'user2',
            userName: 'Sarah Johnson',
            skillName: 'Risk Management',
            duration: 30,
            xpEarned: 85,
            message: 'Practiced setting stop-losses and position sizing. Every session counts!',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
            likes: 8,
            comments: 1,
            isLiked: true,
            difficulty: 'beginner'
          },
          {
            id: '3',
            userId: 'user3',
            userName: 'Mike Rodriguez',
            skillName: 'Options Trading',
            duration: 60,
            xpEarned: 200,
            message: 'Advanced options strategies practice session. The Greeks are becoming clearer!',
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
            likes: 15,
            comments: 5,
            isLiked: false,
            difficulty: 'advanced'
          }
        ];

        const mockChallenges: PracticeChallenge[] = [
          {
            id: '1',
            title: '7-Day Practice Streak',
            description: 'Practice any trading skill for 7 consecutive days',
            skillName: 'Any Skill',
            targetDuration: 420, // 7 hours total
            targetSessions: 7,
            xpReward: 500,
            participants: 45,
            endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
            isParticipating: true,
            progress: 60,
            icon: '🔥'
          },
          {
            id: '2',
            title: 'Technical Analysis Master',
            description: 'Complete 10 technical analysis practice sessions',
            skillName: 'Technical Analysis',
            targetDuration: 300, // 5 hours total
            targetSessions: 10,
            xpReward: 300,
            participants: 23,
            endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
            isParticipating: false,
            progress: 0,
            icon: '📈'
          },
          {
            id: '3',
            title: 'Risk Management Focus',
            description: 'Practice risk management for 5 hours this week',
            skillName: 'Risk Management',
            targetDuration: 300, // 5 hours
            targetSessions: 5,
            xpReward: 250,
            participants: 18,
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            isParticipating: true,
            progress: 40,
            icon: '🛡️'
          }
        ];

        setPosts(mockPosts);
        setChallenges(mockChallenges);
      } catch (err) {
        setError('Failed to load social data');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadSocialData();
    }
  }, [userId]);

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
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

  const handleLike = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            isLiked: !post.isLiked,
            likes: post.isLiked ? post.likes - 1 : post.likes + 1
          }
        : post
    ));
  };

  const handleJoinChallenge = (challengeId: string) => {
    setChallenges(challenges.map(challenge =>
      challenge.id === challengeId
        ? { ...challenge, isParticipating: true, participants: challenge.participants + 1 }
        : challenge
    ));
  };

  if (loading) {
    return (
      <div className={cn('glassmorphic p-4 rounded-lg', className)}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Loading social features...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('glassmorphic p-4 rounded-lg border border-destructive/20', className)}>
        <div className="flex items-center gap-2 text-destructive">
          <Users className="h-4 w-4" />
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
          <Users className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Practice Community</h3>
        </div>
        <button className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
          <Share2 className="h-3 w-3" />
          Share Progress
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-muted/30 p-1 rounded-lg">
        {[
          { id: 'feed', label: 'Feed', icon: MessageCircle },
          { id: 'challenges', label: 'Challenges', icon: Target },
          { id: 'leaderboard', label: 'Leaderboard', icon: Trophy }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              activeTab === id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Feed Tab */}
      {activeTab === 'feed' && (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="p-4 rounded-lg bg-muted/30 border border-border/50">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                  {post.userName.charAt(0)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{post.userName}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatTimeAgo(post.timestamp)}
                    </span>
                  </div>
                  
                  <div className="text-sm text-muted-foreground mb-2">
                    Practiced <span className="font-medium">{post.skillName}</span> for{' '}
                    <span className="font-medium">{formatDuration(post.duration)}</span>
                    <span className={cn('ml-2 text-xs', getDifficultyColor(post.difficulty))}>
                      {post.difficulty}
                    </span>
                  </div>
                  
                  {post.message && (
                    <p className="text-sm text-foreground mb-3">{post.message}</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Award className="h-3 w-3" />
                      <span>+{post.xpEarned} XP</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatDuration(post.duration)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50">
                <button
                  onClick={() => handleLike(post.id)}
                  className={cn(
                    'flex items-center gap-1 text-xs transition-colors',
                    post.isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'
                  )}
                >
                  <Heart className={cn('h-3 w-3', post.isLiked && 'fill-current')} />
                  <span>{post.likes}</span>
                </button>
                
                <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <MessageCircle className="h-3 w-3" />
                  <span>{post.comments}</span>
                </button>
                
                <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <Share2 className="h-3 w-3" />
                  <span>Share</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Challenges Tab */}
      {activeTab === 'challenges' && showChallenges && (
        <div className="space-y-4">
          {challenges.map((challenge) => (
            <div key={challenge.id} className="p-4 rounded-lg bg-muted/30 border border-border/50">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{challenge.icon}</div>
                  <div>
                    <h4 className="font-medium text-sm">{challenge.title}</h4>
                    <p className="text-xs text-muted-foreground">{challenge.description}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm font-bold text-warning">+{challenge.xpReward} XP</div>
                  <div className="text-xs text-muted-foreground">Reward</div>
                </div>
              </div>
              
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Progress</span>
                  <span>{challenge.progress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${challenge.progress}%` }}
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>{challenge.participants} participants</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>Ends {challenge.endDate.toLocaleDateString()}</span>
                </div>
              </div>
              
              <button
                onClick={() => handleJoinChallenge(challenge.id)}
                disabled={challenge.isParticipating}
                className={cn(
                  'w-full py-2 px-4 rounded-md text-sm font-medium transition-colors',
                  challenge.isParticipating
                    ? 'bg-success/20 text-success cursor-not-allowed'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                )}
              >
                {challenge.isParticipating ? 'Participating' : 'Join Challenge'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && showLeaderboard && (
        <div className="space-y-3">
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Leaderboard coming soon!</p>
            <p className="text-xs">Compete with other traders and climb the ranks.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PracticeSocial;
