import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { onChallengeSubmissions, getChallenge, joinChallenge, getUserChallengeProgress } from '../services/challenges';
import { getUserThreeTierProgress } from '../services/threeTierProgression';
import type { Challenge } from '../types/gamification';
import { EmbeddedEvidence } from '../types/evidence';
import { useToast } from '../contexts/ToastContext';
import { ArrowLeft, Award, Clock, Calendar, User, Zap, Gift, Info, Trophy, Target, Users, Star, ChevronRight } from 'lucide-react';
import { Tooltip } from '../components/ui/Tooltip';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { formatDate, getTimeRemaining, getDifficultyVariant, normalizeDifficulty, normalizeStatus, getStatusVariant } from '../utils/challengeUtils';

// Lazy load EvidenceGallery for better performance
const EvidenceGallery = lazy(() => import('../components/evidence/EvidenceGallery'));

export const ChallengeDetailPage: React.FC = () => {
  const { challengeId } = useParams<{ challengeId: string }>();
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  // const navigate = useNavigate();

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isParticipating, setIsParticipating] = useState(false);
  const [progressPercentage, setProgressPercentage] = useState<number>(0);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [lockReason, setLockReason] = useState<string>('');

  // Memoized values for performance
  const memoizedChallenge = useMemo(() => challenge, [challenge?.id]);
  const memoizedSubmissions = useMemo(() => submissions, [submissions]);

  // Memoized utility functions
  const memoizedFormatDate = useCallback((date: Date) => {
    return formatDate(date);
  }, []);

  const memoizedGetTimeRemaining = useCallback((ts: any) => {
    try {
      const end = ts?.toDate ? ts.toDate() : new Date(ts);
      const diffMs = end.getTime() - Date.now();
      if (isNaN(diffMs)) return null;
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const days = Math.floor(hours / 24);
      return { hours, days };
    } catch {
      return null;
    }
  }, []);

  // Keyboard navigation handler
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleParticipate();
    }
  }, []);

  useEffect(() => {
    if (challengeId) {
      fetchChallenge(challengeId);
      // Subscribe to submissions for this challenge
      const unsubscribe = onChallengeSubmissions(challengeId, (items) => {
        setSubmissions(items);
      });
      return () => unsubscribe();
    }
  }, [challengeId]);

  // Determine participation/progress for current user
  useEffect(() => {
    (async () => {
      if (!currentUser?.uid || !challengeId) return;
      try {
        const prog = await getUserChallengeProgress(currentUser.uid, challengeId);
        if (prog.success) {
          setIsParticipating(true);
          setProgressPercentage(Math.round(prog.progressPercentage || 0));
        } else {
          setIsParticipating(false);
          setProgressPercentage(0);
        }
      } catch {
        // ignore
      }
      // Derive unlock state (soft checklist) for tiered challenges
      try {
        const detail = await getChallenge(challengeId);
        const type = (detail?.data as any)?.type;
        if (!type || !currentUser?.uid) return;
        const progress = await getUserThreeTierProgress(currentUser.uid);
        const unlocked = progress.success ? (progress.data?.unlockedTiers || []) : [];
        if (type === 'TRADE' && !unlocked.includes('TRADE')) {
          setIsLocked(true);
          setLockReason('Complete 3 Solo challenges and reach skill level 2 to unlock Trade challenges.');
        } else if (type === 'COLLABORATION' && !unlocked.includes('COLLABORATION')) {
          setIsLocked(true);
          setLockReason('Complete 5 Trade challenges and reach skill level 3 to unlock Collaboration challenges.');
        } else {
          setIsLocked(false);
          setLockReason('');
        }
      } catch {}
    })();
  }, [currentUser, challengeId]);

  const fetchChallenge = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const fetchResult = await getChallenge(id);
      if (!fetchResult.success || !fetchResult.data) {
        throw new Error(fetchResult.error || 'Failed to fetch challenge');
      }
      if (fetchResult.data) {
        setChallenge(fetchResult.data as Challenge);
        // Check if user is participating (this would be implemented with actual data)
        setIsParticipating(false);
      } else {
        throw new Error('Challenge not found');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch challenge');
      addToast('error', err.message || 'Failed to fetch challenge');
    } finally {
      setLoading(false);
    }
  };

  const handleParticipate = async () => {
    if (!currentUser || !challengeId) {
      addToast('error', 'You must be logged in to participate in challenges');
      return;
    }
    try {
      const res = await joinChallenge(challengeId, currentUser.uid);
      if (res.success) {
        setIsParticipating(true);
        setProgressPercentage(0);
        addToast('success', 'You are now participating in this challenge!');
      } else {
        addToast('error', res.error || 'Failed to join challenge');
      }
    } catch (e: any) {
      addToast('error', e?.message || 'Failed to join challenge');
    }
  };

  const toTitleCase = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

  const getDifficultyClass = (difficulty: string) => {
    const d = normalizeDifficulty(difficulty);
    switch (d) {
      case 'Beginner':
        return 'bg-success/10 text-success';
      case 'Intermediate':
        return 'bg-primary/10 text-primary';
      case 'Advanced':
        return 'bg-accent/10 text-accent';
      case 'Expert':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const normalizeStatus = (status?: string) => {
    if (!status) return 'UNKNOWN';
    const s = status.toLowerCase();
    if (s === 'active' || s === 'open') return 'OPEN';
    if (s === 'in_progress') return 'IN_PROGRESS';
    if (s === 'completed') return 'COMPLETED';
    if (s === 'draft') return 'DRAFT';
    if (s === 'upcoming') return 'UPCOMING';
    if (s === 'cancelled' || s === 'canceled') return 'CANCELLED';
    return status.toUpperCase();
  };

  const getStatusClass = (status: string) => {
    const s = normalizeStatus(status);
    switch (s) {
      case 'OPEN':
        return 'bg-success/10 text-success';
      case 'COMPLETED':
        return 'bg-muted text-muted-foreground';
      case 'DRAFT':
        return 'bg-primary/10 text-primary';
      case 'IN_PROGRESS':
        return 'bg-accent/10 text-accent';
      case 'UPCOMING':
        return 'bg-primary/10 text-primary';
      case 'CANCELLED':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col justify-center items-center py-12 space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading challenge details...</p>
        </div>
      </div>
    );
  }

  if (error || !challenge) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg mb-6 transition-colors duration-200">
          {error || 'Challenge not found'}
        </div>
        <Link
          to="/challenges"
          className="inline-flex items-center text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors duration-200"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Challenges
        </Link>
      </div>
    );
  }

  return (
    <div 
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      role="main"
      aria-label="Challenge details page"
    >
      {/* Screen reader live region for dynamic updates */}
      <div 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
        id="challenge-updates"
      >
        {memoizedSubmissions.length > 0 && `${memoizedSubmissions.length} submissions received`}
      </div>

      {/* Enhanced Navigation */}
      <nav className="mb-8" aria-label="Challenge navigation">
        <Link
          to="/challenges"
          className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-all duration-200 group"
          aria-label="Return to challenges list"
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
          Back to Challenges
        </Link>
      </nav>

      {/* Main Challenge Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Main Content Area (3/4 width on large screens) */}
        <div className="lg:col-span-3 space-y-6">
          <Card 
            variant="glass" 
            depth="lg" 
            glow="subtle" 
            glowColor="orange"
            hover={true}
            className="glassmorphic transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl"
          >
            {/* Enhanced Header */}
            <CardHeader className="space-y-6 pb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-3">
                  <CardTitle 
                    className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent"
                  >
                    {memoizedChallenge?.title}
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-3" role="group" aria-label="Challenge metadata">
                    <Badge 
                      variant="secondary" 
                      className={`${getDifficultyClass((memoizedChallenge as any)?.difficulty || '')} font-medium`}
                      role="img"
                      aria-label={`Difficulty level: ${normalizeDifficulty((memoizedChallenge as any)?.difficulty)}`}
                    >
                      <Target className="w-3 h-3 mr-1" aria-hidden="true" />
                      {normalizeDifficulty((memoizedChallenge as any)?.difficulty)}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={`${getStatusClass((memoizedChallenge as any)?.status || '')} font-medium`}
                      role="img"
                      aria-label={`Status: ${normalizeStatus((memoizedChallenge as any)?.status)}`}
                    >
                      <Award className="w-3 h-3 mr-1" aria-hidden="true" />
                      {normalizeStatus((memoizedChallenge as any)?.status)}
                    </Badge>
                    {/* Enhanced ending soon badge */}
                {(() => {
                  const remaining = memoizedGetTimeRemaining((memoizedChallenge as any)?.endDate || (memoizedChallenge as any)?.deadline);
                  if (!remaining) return null;
                  if (remaining.days < 2 && remaining.hours > 0) {
                    return (
                          <Badge variant="secondary" className="animate-pulse font-medium bg-warning/10 text-warning border-warning/20">
                            <Clock className="w-3 h-3 mr-1" />
                        Ending soon
                          </Badge>
                    );
                  }
                  return null;
                })()}
            </div>
          </div>
        </div>
        </CardHeader>

        {/* Enhanced Action Button */}
        {normalizeStatus((memoizedChallenge as any)?.status) === 'OPEN' && (
          <div className="px-6 pb-6">
            <Button
              variant={isParticipating ? "secondary" : "primary"}
              size="lg"
              onClick={handleParticipate}
              onKeyDown={handleKeyDown}
              disabled={isParticipating || isLocked}
              leftIcon={isParticipating ? <Trophy className="w-4 h-4" aria-hidden="true" /> : <Star className="w-4 h-4" aria-hidden="true" />}
              className="transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
              aria-label={isLocked ? 'Challenge locked - unlock criteria not met' : isParticipating ? 'Currently participating in challenge' : 'Join challenge'}
              title={isLocked ? 'Unlock criteria not met yet' : undefined}
              tabIndex={0}
            >
              {isParticipating ? 'Participating' : 'Join Challenge'}
            </Button>
          </div>
        )}

            {/* Enhanced Content - Fixed Display */}
            <CardContent className="space-y-6">
              {/* Challenge Overview */}
              <Card variant="glass" depth="md" glow="subtle" glowColor="auto" className="glassmorphic p-6 hover:scale-[1.01] transition-all duration-200 hover:shadow-lg">
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                    <Info className="w-5 h-5 text-primary" />
                    Challenge Overview
                  </h2>
                  <p className="text-base leading-relaxed text-muted-foreground">
                    {challenge.description}
                  </p>
                </div>
              </Card>

              {/* Challenge Information */}
              <Card variant="glass" depth="md" glow="subtle" glowColor="auto" className="glassmorphic p-6 hover:scale-[1.01] transition-all duration-200 hover:shadow-lg">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    Challenge Information
                  </h3>
                  <p className="text-sm text-muted-foreground">Key details about this challenge</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  {(challenge as any).category && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="p-2 rounded-full bg-primary/10">
                        <Award className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Category</p>
                        <p className="text-sm text-muted-foreground">{(challenge as any).category}</p>
                      </div>
                </div>
              )}

              {((challenge as any).deadline?.toDate || (challenge as any).endDate?.toDate) && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="p-2 rounded-full bg-warning/10">
                        <Clock className="w-4 h-4 text-warning" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Deadline</p>
                        <p className="text-sm text-muted-foreground">{formatDate(((challenge as any).deadline || (challenge as any).endDate).toDate())}</p>
                      </div>
                </div>
              )}

              {(challenge as any).createdAt && (challenge as any).createdAt.toDate && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="p-2 rounded-full bg-success/10">
                        <Calendar className="w-4 h-4 text-success" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Posted</p>
                        <p className="text-sm text-muted-foreground">{formatDate((challenge as any).createdAt.toDate())}</p>
                      </div>
                </div>
              )}

              {((challenge as any).participants || typeof (challenge as any).participantCount === 'number') && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="p-2 rounded-full bg-accent/10">
                        <Users className="w-4 h-4 text-accent" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Participants</p>
                        <p className="text-sm text-muted-foreground">{Array.isArray((challenge as any).participants) ? (challenge as any).participants.length : (challenge as any).participantCount}</p>
                      </div>
                </div>
              )}
            </div>
              </Card>

              {/* Enhanced Rewards Section */}
              <Card variant="glass" depth="lg" glow="strong" glowColor="orange" className="glassmorphic p-6 hover:scale-[1.02] transition-all duration-200 hover:shadow-2xl">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                      <Gift className="w-5 h-5 text-primary" />
                      Rewards & Bonuses
                    </h2>
              <Tooltip content={<div>Base XP is guaranteed on completion. Bonus XP depends on performance and timing.</div>}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Info className="w-4 h-4" />
                      </Button>
              </Tooltip>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Base XP Card */}
                    <Card variant="glass" depth="md" glow="subtle" glowColor="orange" className="glassmorphic p-6 hover:scale-105 transition-all duration-200 bg-gradient-to-br from-primary/5 to-primary/10 hover:shadow-lg">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 rounded-full bg-primary/20">
                          <Zap className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">Base XP</p>
                          <p className="text-xs text-muted-foreground">Guaranteed reward</p>
                        </div>
                      </div>
                      <div className="text-3xl font-bold text-primary">+{(challenge as any)?.rewards?.xp ?? 0}</div>
                    </Card>

                    {/* Potential Bonuses Card */}
                    <Card variant="glass" depth="md" glow="subtle" glowColor="purple" className="glassmorphic p-6 hover:scale-105 transition-all duration-200 bg-gradient-to-br from-accent/5 to-accent/10 hover:shadow-lg">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 rounded-full bg-accent/20">
                          <Trophy className="w-6 h-6 text-accent" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">Potential Bonuses</p>
                          <p className="text-xs text-muted-foreground">Performance-based</p>
                        </div>
                      </div>
                      <ul className="text-sm text-muted-foreground space-y-2">
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-accent"></div>
                          Quality bonus: up to +50% of base
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-accent"></div>
                          Early completion: up to +25% of base
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-accent"></div>
                          First attempt: +15% of base
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-accent"></div>
                          Streak bonus: awarded on completion streaks
                        </li>
                      </ul>
                    </Card>
                  </div>
                </div>
              </Card>

              {/* Enhanced Unlock Checklist */}
              {isLocked && (
                <Card variant="glass" depth="md" glow="subtle" glowColor="orange" className="glassmorphic p-6 border-warning/20 bg-warning/5 hover:scale-[1.01] transition-all duration-200 hover:shadow-lg">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-warning/20">
                      <Info className="w-5 h-5 text-warning" />
              </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-foreground">Unlock Requirements</h3>
                      <p className="text-sm text-muted-foreground">{lockReason}</p>
                      <Button variant="outline" size="sm" className="mt-3">
                        View Requirements
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
              </div>
            </div>
                </Card>
              )}

              {/* Enhanced Rules and Requirements */}
          {(challenge as any).rules && (
                <Card variant="glass" depth="md" glow="subtle" glowColor="blue" className="glassmorphic p-6 hover:scale-[1.01] transition-all duration-200 hover:shadow-lg">
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                        <Target className="w-5 h-5 text-primary" />
                        Rules and Requirements
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1">Guidelines you must follow to complete this challenge</p>
                    </div>
                    <div className="space-y-3">
                  {Array.isArray((challenge as any).rules) ? (
                    (challenge as any).rules.map((rule: string, index: number) => (
                          <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                            <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                            <p className="text-sm text-muted-foreground">{rule}</p>
                          </div>
                    ))
                  ) : (
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                          <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                          <p className="text-sm text-muted-foreground">{(challenge as any).rules}</p>
                        </div>
                  )}
              </div>
            </div>
                </Card>
          )}

              {/* Enhanced Prizes */}
          {(challenge as any).prizes && (
                <Card variant="glass" depth="md" glow="subtle" glowColor="orange" className="glassmorphic p-6 hover:scale-[1.01] transition-all duration-200 hover:shadow-lg">
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-primary" />
                        Prizes
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1">Rewards you can earn by completing this challenge</p>
                    </div>
                    <div className="space-y-3">
                  {Array.isArray((challenge as any).prizes) ? (
                    (challenge as any).prizes.map((prize: string, index: number) => (
                          <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                            <div className="w-2 h-2 rounded-full bg-accent mt-2 flex-shrink-0"></div>
                            <p className="text-sm text-muted-foreground">{prize}</p>
                          </div>
                    ))
                  ) : (
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                          <div className="w-2 h-2 rounded-full bg-accent mt-2 flex-shrink-0"></div>
                          <p className="text-sm text-muted-foreground">{(challenge as any).prizes}</p>
                        </div>
                  )}
              </div>
            </div>
                </Card>
          )}

              {/* Enhanced Submission Guidelines */}
          {(challenge as any).submissionGuidelines && (
                <Card variant="glass" depth="md" glow="subtle" glowColor="blue" className="glassmorphic p-6 hover:scale-[1.01] transition-all duration-200 hover:shadow-lg">
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                        <Info className="w-5 h-5 text-primary" />
                        Submission Guidelines
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1">How to submit your work for this challenge</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/30">
                      <p className="text-sm text-muted-foreground leading-relaxed">{(challenge as any).submissionGuidelines}</p>
              </div>
            </div>
                </Card>
          )}

              {/* Enhanced Recent Submissions */}
          {submissions && submissions.length > 0 && (
                <Card variant="glass" depth="md" glow="subtle" glowColor="purple" className="glassmorphic p-6 hover:scale-[1.01] transition-all duration-200 hover:shadow-lg">
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        Recent Submissions
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1">See what others have submitted for this challenge</p>
                    </div>
                    <div className="space-y-4">
                      {submissions.slice(0, 3).map((submission, index) => (
                        <Card 
                          key={submission.id} 
                          variant="glass" 
                          depth="sm" 
                          glow="subtle" 
                          glowColor="auto"
                          className="glassmorphic p-4 hover:scale-[1.02] transition-all duration-200 bg-muted/20 hover:shadow-md"
                        >
                          <div className="flex items-center justify-between mb-3">
                      <h3 className="text-md font-medium text-foreground">
                        {submission.title || 'Submission'}
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        {submission.submittedAt?.toDate ? new Date(submission.submittedAt.toDate()).toLocaleString() : ''}
                      </span>
                    </div>
                    {Array.isArray(submission.embeddedEvidence) && submission.embeddedEvidence.length > 0 ? (
                      <Suspense fallback={<div className="animate-pulse bg-gray-700 h-64 rounded-lg" aria-label="Loading evidence gallery" />}>
                      <EvidenceGallery evidence={submission.embeddedEvidence as EmbeddedEvidence[]} />
                      </Suspense>
                    ) : (
                      <p className="text-sm text-muted-foreground">No embedded evidence provided.</p>
                    )}
                        </Card>
                ))}
              </div>
            </div>
                </Card>
          )}

              {/* Enhanced Participation Status */}
              <Card variant="elevated" className="p-6 hover:scale-[1.01] transition-all duration-200">
                <div className="flex flex-col items-center gap-4">
            {isParticipating ? (
                    <div className="w-full max-w-md space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-medium text-foreground">Your Progress</span>
                        <span className="text-lg font-bold text-primary">{progressPercentage}%</span>
                </div>
                      <div className="w-full h-4 bg-muted rounded-full overflow-hidden shadow-inner">
                  <div
                          className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500 ease-out rounded-full shadow-sm"
                    style={{ width: `${Math.min(100, Math.max(0, progressPercentage))}%` }}
                  />
                </div>
              </div>
            ) : (
              normalizeStatus((challenge as any).status) === 'OPEN' && (
                      <Button
                        variant="primary"
                        size="xl"
                  onClick={handleParticipate}
                        leftIcon={<Star className="w-5 h-5" />}
                        className="px-8 py-4 text-lg font-semibold hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                        disabled={isLocked}
                        fullWidth
                >
                  Join this Challenge
                      </Button>
              )
            )}
          </div>
              </Card>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar (1/3 width on large screens) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Enhanced Quick Actions */}
          <Card variant="glass" depth="lg" glow="subtle" glowColor="blue" className="glassmorphic p-6 hover:scale-[1.02] transition-all duration-200 hover:shadow-xl">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Quick Actions
            </h3>
            <div className="space-y-3">
              <Button variant="outline" size="sm" fullWidth className="justify-start">
                <Award className="w-4 h-4 mr-2" />
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">View Leaderboard</span>
                  <span className="text-xs text-muted-foreground">See top performers</span>
                </div>
              </Button>
              <Button variant="outline" size="sm" fullWidth className="justify-start">
                <Users className="w-4 h-4 mr-2" />
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">Share Challenge</span>
                  <span className="text-xs text-muted-foreground">Get referral XP</span>
                </div>
              </Button>
              <Button variant="outline" size="sm" fullWidth className="justify-start">
                <Info className="w-4 h-4 mr-2" />
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">Get Help</span>
                  <span className="text-xs text-muted-foreground">Contact support</span>
                </div>
              </Button>
            </div>
          </Card>

          {/* Challenge Progress & Insights */}
          <Card variant="glass" depth="lg" glow="subtle" glowColor="purple" className="glassmorphic p-6 hover:scale-[1.02] transition-all duration-200 hover:shadow-xl">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Challenge Insights
            </h3>
            <div className="space-y-4">
              {(() => {
                const remaining = memoizedGetTimeRemaining((memoizedChallenge as any)?.endDate || (memoizedChallenge as any)?.deadline);
                return remaining ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Time Remaining</span>
                    <span className="text-sm font-medium text-foreground">
                      {remaining.days > 0 ? `${remaining.days}d ${remaining.hours % 24}h` : `${remaining.hours}h`}
                    </span>
                  </div>
                ) : null;
              })()}
              
              {((challenge as any).participants || typeof (challenge as any).participantCount === 'number') && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Participants</span>
                  <span className="text-sm font-medium text-foreground">
                    {Array.isArray((challenge as any).participants) ? (challenge as any).participants.length : (challenge as any).participantCount}
                  </span>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Completion Rate</span>
                <span className="text-sm font-medium text-success">65%</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Avg. Time</span>
                <span className="text-sm font-medium text-foreground">2.3 days</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ChallengeDetailPage;
