import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { onChallengeSubmissions, getChallenge, joinChallenge, getUserChallengeProgress } from '../services/challenges';
import { getUserThreeTierProgress } from '../services/threeTierProgression';
import type { Challenge, UserChallenge } from '../types/gamification';
import EvidenceGallery from '../components/evidence/EvidenceGallery';
import { EmbeddedEvidence } from '../types/evidence';
import { useToast } from '../contexts/ToastContext';
import { ArrowLeft, Award, Clock, Calendar, User, Zap, Gift, Info } from 'lucide-react';
import { Tooltip } from '../components/ui/Tooltip';
import { ChallengeCompletionInterface } from '../components/challenges/ChallengeCompletionInterface';

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
  const [userChallenge, setUserChallenge] = useState<UserChallenge | null>(null);
  const [showCompletionForm, setShowCompletionForm] = useState(false);

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
          // Set userChallenge for completion interface
          if (prog.userChallenge) {
            setUserChallenge(prog.userChallenge as UserChallenge);
          }
        } else {
          setIsParticipating(false);
          setProgressPercentage(0);
          setUserChallenge(null);
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

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const getTimeRemaining = (ts: any) => {
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
  };

  const toTitleCase = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

  const normalizeDifficulty = (difficulty?: string) => {
    if (!difficulty) return 'Beginner';
    const d = difficulty.toLowerCase();
    return toTitleCase(d);
  };

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
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
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
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-6">
        <Link
          to="/challenges"
          className="inline-flex items-center text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors duration-200"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Challenges
        </Link>
      </div>

      <article className="glassmorphic overflow-hidden transition-all duration-200" role="article" aria-labelledby="challenge-title">
        {/* Header */}
        <header className="px-6 py-5 border-b border-glass flex justify-between items-center transition-colors duration-200">
          <div>
            <h1 id="challenge-title" className="text-2xl font-bold text-foreground">{challenge.title}</h1>
            <div className="flex items-center mt-2 space-x-4">
              {(
                // always show difficulty with safe default
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyClass((challenge as any).difficulty || '')}`}>
                  {normalizeDifficulty((challenge as any).difficulty)}
                </span>
              )}
              {(
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass((challenge as any).status || '')}`}>
                  {normalizeStatus((challenge as any).status)}
                </span>
              )}
                {/* Ending soon badge */}
                {(() => {
                  const remaining = getTimeRemaining((challenge as any).endDate || (challenge as any).deadline);
                  if (!remaining) return null;
                  if (remaining.days < 2 && remaining.hours > 0) {
                    return (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                        Ending soon
                      </span>
                    );
                  }
                  return null;
                })()}
            </div>
          </div>

            {normalizeStatus((challenge as any).status) === 'OPEN' && (
            <button
              onClick={handleParticipate}
              disabled={isParticipating || isLocked}
              className={`px-4 py-2 rounded-md ${
                isParticipating || isLocked
                  ? 'bg-success text-success-foreground cursor-not-allowed'
                  : 'bg-primary hover:bg-primary/90 text-primary-foreground'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200`}
              title={isLocked ? 'Unlock criteria not met yet' : undefined}
              aria-label={isParticipating ? 'Currently participating in challenge' : 'Join this challenge'}
            >
              {isParticipating ? 'Participating' : 'Participate'}
            </button>
          )}
        </header>

        {/* Content */}
        <div className="p-6">
          {/* Challenge details */}
          <section className="mb-8" aria-labelledby="challenge-details">
            <h2 id="challenge-details" className="text-lg font-semibold text-foreground mb-3">Challenge Details</h2>
            <p className="text-muted-foreground mb-6">{challenge.description}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {(challenge as any).category && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Award className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>Category: {(challenge as any).category}</span>
                </div>
              )}

              {((challenge as any).deadline?.toDate || (challenge as any).endDate?.toDate) && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>Deadline: {formatDate(((challenge as any).deadline || (challenge as any).endDate).toDate())}</span>
                </div>
              )}

              {(challenge as any).createdAt && (challenge as any).createdAt.toDate && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>Posted: {formatDate((challenge as any).createdAt.toDate())}</span>
                </div>
              )}

              {((challenge as any).participants || typeof (challenge as any).participantCount === 'number') && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <User className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>Participants: {Array.isArray((challenge as any).participants) ? (challenge as any).participants.length : (challenge as any).participantCount}</span>
                </div>
              )}
            </div>
          </section>

          {/* Rewards Overview */}
          <section className="mb-8" aria-labelledby="rewards-section">
            <h2 id="rewards-section" className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <Gift className="w-4 h-4" /> Rewards
              <Tooltip content={<div>Base XP is guaranteed on completion. Bonus XP depends on performance and timing.</div>}>
                <button aria-label="Rewards info" className="text-muted-foreground hover:text-foreground">
                  <Info className="w-4 h-4" />
                </button>
              </Tooltip>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glassmorphic p-4 rounded-lg border-glass bg-card/30 backdrop-blur-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Zap className="w-4 h-4 text-yellow-500" /> Base XP
                </div>
                <div className="text-2xl font-bold text-foreground">+{(challenge as any)?.rewards?.xp ?? 0}</div>
              </div>
              <div className="glassmorphic p-4 rounded-lg border-glass bg-card/40 backdrop-blur-md">
                <div className="text-sm font-medium text-foreground mb-2">Potential Bonuses</div>
                <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-1">
                  <li>Quality bonus: up to +50% of base</li>
                  <li>Early completion: up to +25% of base</li>
                  <li>First attempt: +15% of base</li>
                  <li>Streak bonus: awarded on completion streaks</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Unlock Checklist (soft guidance) */}
          {isLocked && (
            <section className="mb-8 glassmorphic p-4 rounded-lg border-glass bg-amber-50/50 dark:bg-amber-900/20 backdrop-blur-sm" aria-labelledby="unlock-criteria">
              <h3 id="unlock-criteria" className="text-sm font-semibold text-foreground mb-2">Unlock criteria</h3>
              <p className="text-xs text-muted-foreground">{lockReason}</p>
            </section>
          )}

          {/* Rules and Requirements */}
          {(challenge as any).rules && (
            <section className="mb-8" aria-labelledby="rules-section">
              <h2 id="rules-section" className="text-lg font-semibold text-foreground mb-3">Rules and Requirements</h2>
              <div className="glassmorphic p-4 rounded-lg border-glass transition-colors duration-200 backdrop-blur-md">
                <ul className="list-disc pl-5 space-y-2">
                  {Array.isArray((challenge as any).rules) ? (
                    (challenge as any).rules.map((rule: string, index: number) => (
                      <li key={index} className="text-muted-foreground">{rule}</li>
                    ))
                  ) : (
                    <li className="text-muted-foreground">{(challenge as any).rules}</li>
                  )}
                </ul>
              </div>
            </section>
          )}

          {/* Prizes */}
          {(challenge as any).prizes && (
            <section className="mb-8" aria-labelledby="prizes-section">
              <h2 id="prizes-section" className="text-lg font-semibold text-foreground mb-3">Prizes</h2>
              <div className="glassmorphic p-4 rounded-lg border-glass transition-colors duration-200 backdrop-blur-md">
                <ul className="list-disc pl-5 space-y-2">
                  {Array.isArray((challenge as any).prizes) ? (
                    (challenge as any).prizes.map((prize: string, index: number) => (
                      <li key={index} className="text-muted-foreground">{prize}</li>
                    ))
                  ) : (
                    <li className="text-muted-foreground">{(challenge as any).prizes}</li>
                  )}
                </ul>
              </div>
            </section>
          )}

          {/* Submission Guidelines */}
          {(challenge as any).submissionGuidelines && (
            <section className="mb-8" aria-labelledby="submission-guidelines">
              <h2 id="submission-guidelines" className="text-lg font-semibold text-foreground mb-3">Submission Guidelines</h2>
              <div className="glassmorphic p-4 rounded-lg border-glass transition-colors duration-200 backdrop-blur-md">
                <p className="text-muted-foreground">{(challenge as any).submissionGuidelines}</p>
              </div>
            </section>
          )}

          {/* Recent Submissions (with embedded evidence) */}
          {submissions && submissions.length > 0 && (
            <section className="mb-8" aria-labelledby="recent-submissions">
              <h2 id="recent-submissions" className="text-lg font-semibold text-foreground mb-3">Recent Submissions</h2>
              <div className="space-y-6">
                {submissions.slice(0, 5).map((submission) => (
                  <div key={submission.id} className="glassmorphic p-4 rounded-lg border-glass bg-card/20 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-md font-medium text-foreground">
                        {submission.title || 'Submission'}
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        {submission.submittedAt?.toDate ? new Date(submission.submittedAt.toDate()).toLocaleString() : ''}
                      </span>
                    </div>
                    {Array.isArray(submission.embeddedEvidence) && submission.embeddedEvidence.length > 0 ? (
                      <EvidenceGallery evidence={submission.embeddedEvidence as EmbeddedEvidence[]} />
                    ) : (
                      <p className="text-sm text-muted-foreground">No embedded evidence provided.</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Participation status and progress */}
          <section className="mt-8 flex flex-col items-center gap-3" aria-labelledby="participation-section">
            {isParticipating ? (
              <>
                <div className="glassmorphic w-full max-w-md p-6 rounded-xl border-glass backdrop-blur-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Your Progress</span>
                    <span className="text-sm text-foreground font-medium" aria-live="polite">{progressPercentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(0, progressPercentage))}%` }}
                      role="progressbar"
                      aria-valuenow={progressPercentage}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`Challenge progress: ${progressPercentage}%`}
                    />
                  </div>
                </div>
                
                {/* Complete Challenge Button */}
                {progressPercentage < 100 && !showCompletionForm && (
                  <button
                    onClick={() => setShowCompletionForm(true)}
                    className="px-6 py-3 rounded-md text-lg font-medium bg-success hover:bg-success/90 text-success-foreground focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-success transition-colors duration-200"
                    aria-label="Complete this challenge"
                  >
                    Complete Challenge
                  </button>
                )}
              </>
            ) : (
              normalizeStatus((challenge as any).status) === 'OPEN' && (
                <button
                  onClick={handleParticipate}
                  className="px-6 py-3 rounded-md text-lg font-medium bg-primary hover:bg-primary/90 text-primary-foreground focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200"
                  aria-label="Join this challenge"
                >
                  Join this Challenge
                </button>
              )
            )}
          </section>

          {/* Challenge Completion Interface */}
          {showCompletionForm && isParticipating && userChallenge && challenge && currentUser && (
            <section className="mt-8 glassmorphic p-6 rounded-xl border-glass backdrop-blur-xl" aria-labelledby="completion-interface">
              <ChallengeCompletionInterface
                challenge={challenge}
                userChallenge={userChallenge}
                userId={currentUser.uid}
                onComplete={(rewards) => {
                  addToast('success', `Challenge completed! You earned ${rewards.totalXP} XP!`);
                  setShowCompletionForm(false);
                  setProgressPercentage(100);
                  // Refresh challenge data
                  if (challengeId) fetchChallenge(challengeId);
                }}
                onCancel={() => setShowCompletionForm(false)}
              />
            </section>
          )}
        </div>
      </article>
    </main>
  );
};

export default ChallengeDetailPage;
