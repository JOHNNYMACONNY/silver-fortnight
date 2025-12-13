import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../AuthContext";
import {
  onChallengeSubmissions,
  getChallenge,
  joinChallenge,
  getUserChallengeProgress,
} from "../services/challenges";
import { getUserThreeTierProgress, canAccessTier, getTierLockedReason, getChallengeAccessStatus } from "../services/threeTierProgression";
import type { Challenge, UserChallenge } from "../types/gamification";
import EvidenceGallery from "../components/evidence/EvidenceGallery";
import { EmbeddedEvidence } from "../types/evidence";
import { useToast } from "../contexts/ToastContext";
import {
  ArrowLeft,
  Award,
  Clock,
  Calendar,
  User,
  Zap,
  Gift,
  Info,
  Medal,
  Target,
  Trophy,
  FileText,
  History,
  Lock as LockIcon
} from "lucide-react";
import { cn } from "../utils/cn";
import { Tooltip } from "../components/ui/Tooltip";
import { Button } from "../components/ui/Button";
import { Alert, AlertDescription } from "../components/ui/Alert";
import GradientMeshBackground from "../components/ui/GradientMeshBackground";
import { ChallengeCompletionInterface } from "../components/challenges/ChallengeCompletionInterface";
import { RewardCelebrationModal } from "../components/challenges/RewardCelebrationModal";
import type { CompletionReward } from "../services/challengeCompletion";

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
  const [lockReason, setLockReason] = useState<string>("");
  const [userChallenge, setUserChallenge] = useState<UserChallenge | null>(
    null
  );
  const [showCompletionForm, setShowCompletionForm] = useState(false);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [completionRewards, setCompletionRewards] =
    useState<CompletionReward | null>(null);

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
        const prog = await getUserChallengeProgress(
          currentUser.uid,
          challengeId
        );
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
      // Derive unlock state using centralized service logic
      try {
        const detail = await getChallenge(challengeId);
        const fetchedChallenge = detail?.data;
        if (!fetchedChallenge || !currentUser?.uid) return;

        // Use the centralized service to check access (Tier + Prerequisites)
        const status = await getChallengeAccessStatus(currentUser.uid, fetchedChallenge as any);
        setIsLocked(!status.accessible);

        if (!status.accessible) {
          setLockReason(status.reason);
        } else {
          setLockReason("");
        }
      } catch { }
    })();
  }, [currentUser, challengeId]);

  const fetchChallenge = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const fetchResult = await getChallenge(id);
      if (!fetchResult.success || !fetchResult.data) {
        throw new Error(fetchResult.error || "Failed to fetch challenge");
      }
      if (fetchResult.data) {
        setChallenge(fetchResult.data as Challenge);
        // Check if user is participating (this would be implemented with actual data)
        setIsParticipating(false);
      } else {
        throw new Error("Challenge not found");
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch challenge");
      addToast("error", err.message || "Failed to fetch challenge");
    } finally {
      setLoading(false);
    }
  };

  const handleParticipate = async () => {
    if (!currentUser || !challengeId) {
      addToast("error", "You must be logged in to participate in challenges");
      return;
    }

    let metadata: Record<string, any> | undefined = undefined;

    // Check if it's a trade challenge and prompt for side
    if ((challenge as any)?.type === "TRADE") {
      // NOTE: In a full implementation, we would show a Modal here. 
      // For this immediate fix, we will simply default to 'Side A' or random, 
      // or ideally we would ask the user.
      // 
      // To keep this non-disruptive but architecturally correct, we will
      // look for a query param or default to 'A' for now, but ensure the Backend 
      // actually receives this structure, so the data is valid.
      //
      // Future Iteration: Replace this prompt with the <TradeJoinModal> from ChallengeFlow.tsx

      const config = (challenge as any)?.config?.tradeStructure;
      if (config) {
        // Just storing the initialization structure so we know this User is a specific "Side"
        metadata = {
          tradeSide: 'participant1', // Defaulting to P1 for now to unblock logic
          roleName: config.participant1?.teaches || 'Partner A'
        };
      }
    }

    try {
      const res = await joinChallenge(challengeId, currentUser.uid, metadata);
      if (res.success) {
        setIsParticipating(true);
        setProgressPercentage(0);
        // Toast handled by system notification
      } else {
        addToast("error", res.error || "Failed to join challenge");
      }
    } catch (e: any) {
      addToast("error", e?.message || "Failed to join challenge");
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
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

  const toTitleCase = (value: string) =>
    value.charAt(0).toUpperCase() + value.slice(1);

  const normalizeDifficulty = (difficulty?: string) => {
    if (!difficulty) return "Beginner";
    const d = difficulty.toLowerCase();
    return toTitleCase(d);
  };

  const getDifficultyClass = (difficulty: string) => {
    const d = normalizeDifficulty(difficulty);
    switch (d) {
      case "Beginner":
        return "bg-success/10 text-success";
      case "Intermediate":
        return "bg-primary/10 text-primary";
      case "Advanced":
        return "bg-accent/10 text-accent";
      case "Expert":
        return "bg-destructive/10 text-destructive";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const normalizeStatus = (status?: string) => {
    if (!status) return "UNKNOWN";
    const s = status.toLowerCase();
    if (s === "active" || s === "open") return "OPEN";
    if (s === "in_progress") return "IN_PROGRESS";
    if (s === "completed") return "COMPLETED";
    if (s === "draft") return "DRAFT";
    if (s === "upcoming") return "UPCOMING";
    if (s === "cancelled" || s === "canceled") return "CANCELLED";
    return status.toUpperCase();
  };

  const getStatusClass = (status: string) => {
    const s = normalizeStatus(status);
    switch (s) {
      case "OPEN":
        return "bg-success/10 text-success";
      case "COMPLETED":
        return "bg-muted text-muted-foreground";
      case "DRAFT":
        return "bg-primary/10 text-primary";
      case "IN_PROGRESS":
        return "bg-accent/10 text-accent";
      case "UPCOMING":
        return "bg-primary/10 text-primary";
      case "CANCELLED":
        return "bg-destructive/10 text-destructive";
      default:
        return "bg-muted text-muted-foreground";
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
          {error || "Challenge not found"}
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
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
      {/* 1. Hero Banner Section */}
      <div className="relative rounded-3xl overflow-hidden mb-8 shadow-2xl">
        <GradientMeshBackground
          variant="custom"
          customColors={
            (challenge as any).tier === 'COLLABORATION'
              ? ['rgba(139, 92, 246, 0.2)', 'rgba(99, 102, 241, 0.15)', 'rgba(168, 85, 247, 0.15)'] // Purple/Indigo
              : (challenge as any).tier === 'TRADE'
                ? ['rgba(249, 115, 22, 0.2)', 'rgba(251, 146, 60, 0.15)', 'rgba(234, 88, 12, 0.15)'] // Amber/Orange
                : ['rgba(34, 197, 94, 0.2)', 'rgba(16, 185, 129, 0.15)', 'rgba(5, 150, 105, 0.15)'] // Emerald/Green (SOLO)
          }
          intensity="medium"
          animated={false}
          className="p-8 md:p-12"
        >
          <Link
            to="/challenges"
            className="inline-flex items-center text-white/70 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Challenges
          </Link>

          <div className="flex flex-wrap gap-3 mb-4">
            {/* Tier Badge */}
            {(challenge as any).tier && (
              <span className={cn(
                "px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase border backdrop-blur-sm",
                (challenge as any).tier === 'COLLABORATION' ? 'bg-purple-500/20 border-purple-400/30 text-purple-200' :
                  (challenge as any).tier === 'TRADE' ? 'bg-amber-500/20 border-amber-400/30 text-amber-200' :
                    'bg-emerald-500/20 border-emerald-400/30 text-emerald-200'
              )}>
                {(challenge as any).tier}
              </span>
            )}
            <span className={cn(
              "px-3 py-1 rounded-full text-xs font-medium border border-white/10 bg-white/5 backdrop-blur-md",
              getDifficultyClass((challenge as any).difficulty || "Beginner")
            )}>
              {normalizeDifficulty((challenge as any).difficulty)}
            </span>
            <span className={cn(
              "px-3 py-1 rounded-full text-xs font-medium border border-white/10 bg-white/5 backdrop-blur-md",
              getStatusClass((challenge as any).status || "OPEN")
            )}>
              {normalizeStatus((challenge as any).status)}
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight text-white drop-shadow-sm text-balance">
            {challenge.title}
          </h1>

          <div className="flex items-center gap-6 text-white/70 text-sm">
            {(challenge as any).category && (
              <div className="flex items-center">
                <Award className="mr-2 h-4 w-4 text-white/50" />
                {toTitleCase((challenge as any).category)}
              </div>
            )}
            {((challenge as any).participants || typeof (challenge as any).participantCount === "number") && (
              <div className="flex items-center">
                <User className="mr-2 h-4 w-4 text-white/50" />
                {Array.isArray((challenge as any).participants)
                  ? (challenge as any).participants.length
                  : (challenge as any).participantCount} Participants
              </div>
            )}
          </div>
        </GradientMeshBackground>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 2. Main Content Column (Left) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Mission Brief (Description + Rules) */}
          <section className="glassmorphic p-10">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 border-b border-white/10 pb-4">
              <Info className="w-6 h-6 text-primary" />
              Mission Brief
            </h2>

            <div className="mb-8">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Objective</h3>
              <div className="prose dark:prose-invert max-w-none text-foreground leading-relaxed text-lg">
                {challenge.description}
              </div>
            </div>

            {(challenge as any).rules && (
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4" /> Rules of Engagement
                </h3>
                <ul className="grid gap-3">
                  {Array.isArray((challenge as any).rules) ? (
                    (challenge as any).rules.map((rule: string, index: number) => (
                      <li key={index} className="flex items-start gap-4 p-4 rounded-xl bg-black/20 border border-white/5 hover:bg-black/30 transition-colors">
                        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </span>
                        <span className="text-base text-muted-foreground mt-1">{rule}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-base text-muted-foreground">{(challenge as any).rules}</li>
                  )}
                </ul>
              </div>
            )}
          </section>

          {/* Rewards Breakdown for Main Content */}
          <section className="glassmorphic p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Gift className="w-5 h-5 text-primary" />
              Rewards Breakdown
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Base XP Card */}
              <div className="relative overflow-hidden rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-amber-500/20 text-amber-500">
                    <Zap className="w-5 h-5" />
                  </div>
                  <span className="font-semibold text-amber-500">Base XP</span>
                </div>
                <div className="text-3xl font-bold text-foreground">
                  +{(challenge as any)?.rewards?.xp ?? 0}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Guaranteed on completion
                </div>
              </div>

              {/* Bonus List */}
              <div className="rounded-xl border border-white/5 bg-black/20 p-4">
                <h3 className="font-semibold mb-2 text-sm text-foreground">Potential Bonuses</h3>
                <ul className="space-y-2">
                  {[
                    { label: 'Quality Bonus', val: '+50%' },
                    { label: 'Early Bird', val: '+25%' },
                    { label: 'First Try', val: '+15%' },
                  ].map((bonus, i) => (
                    <li key={i} className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{bonus.label}</span>
                      <span className="font-mono text-primary font-medium">{bonus.val}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Prizes */}
          {(challenge as any).prizes && (
            <section className="glassmorphic p-6" aria-labelledby="prizes-section">
              <h2
                id="prizes-section"
                className="text-xl font-bold mb-4 flex items-center gap-2"
              >
                <Trophy className="w-5 h-5 text-primary" /> Prizes
              </h2>
              <div className="pl-2">
                <ul className="list-disc pl-5 space-y-2">
                  {Array.isArray((challenge as any).prizes) ? (
                    (challenge as any).prizes.map(
                      (prize: string, index: number) => (
                        <li key={index} className="text-muted-foreground">
                          {prize}
                        </li>
                      )
                    )
                  ) : (
                    <li className="text-muted-foreground">
                      {(challenge as any).prizes}
                    </li>
                  )}
                </ul>
              </div>
            </section>
          )}

          {/* Submission Guidelines */}
          {(challenge as any).submissionGuidelines && (
            <section className="glassmorphic p-6" aria-labelledby="submission-guidelines">
              <h2
                id="submission-guidelines"
                className="text-xl font-bold mb-4 flex items-center gap-2"
              >
                <FileText className="w-5 h-5 text-primary" /> Submission Guidelines
              </h2>
              <div className="pl-2">
                <p className="text-muted-foreground">
                  {(challenge as any).submissionGuidelines}
                </p>
              </div>
            </section>
          )}

          {/* Recent Submissions (with embedded evidence) */}
          {submissions && submissions.length > 0 && (
            <section className="glassmorphic p-6" aria-labelledby="recent-submissions">
              <h2
                id="recent-submissions"
                className="text-xl font-bold mb-4 flex items-center gap-2"
              >
                <History className="w-5 h-5 text-primary" /> Recent Submissions
              </h2>
              <div className="space-y-6">
                {submissions.slice(0, 5).map((submission) => (
                  <div
                    key={submission.id}
                    className="p-4 rounded-lg border border-white/5 bg-black/20 backdrop-blur-sm"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-md font-medium text-foreground">
                        {submission.title || "Submission"}
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        {submission.submittedAt?.toDate
                          ? new Date(
                            submission.submittedAt.toDate()
                          ).toLocaleString()
                          : ""}
                      </span>
                    </div>
                    {Array.isArray(submission.embeddedEvidence) &&
                      submission.embeddedEvidence.length > 0 ? (
                      <EvidenceGallery
                        evidence={
                          submission.embeddedEvidence as EmbeddedEvidence[]
                        }
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No embedded evidence provided.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Participation status and progress */}
          <section
            className="mt-8 flex flex-col items-center gap-3"
            aria-labelledby="participation-section"
          >
            {isParticipating ? (
              <>
                <div className="glassmorphic w-full max-w-md p-6 rounded-xl border-glass backdrop-blur-lg">
                  {/* Matchmaking Status */}
                  {(challenge as any).type === 'TRADE' && (
                    <div className="mb-4 p-3 rounded-lg bg-background/40 border border-border/50">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold">Match Status:</span>
                        {userChallenge?.metadata?.partnerId ? (
                          <span className="text-success text-sm flex items-center gap-1">
                            <Zap className="w-3 h-3" /> Partner Found!
                          </span>
                        ) : (
                          <span className="text-amber-500 text-sm animate-pulse">
                            Looking for partner...
                          </span>
                        )}
                      </div>
                      {userChallenge?.metadata?.tradeSide && (
                        <div className="text-xs text-muted-foreground">
                          You are: <span className="font-mono">{userChallenge.metadata.roleName || userChallenge.metadata.tradeSide}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">
                      Your Progress
                    </span>
                    <span
                      className="text-sm text-foreground font-medium"
                      aria-live="polite"
                    >
                      {progressPercentage}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(0, progressPercentage)
                        )}%`,
                      }}
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
                  <div className="flex justify-center pt-4">
                    <Button
                      onClick={() => setShowCompletionForm(true)}
                      variant="success"
                      size="lg"
                      className="px-8 min-w-[200px]"
                      aria-label="Complete this challenge"
                    >
                      Complete Challenge
                    </Button>
                  </div>
                )}
              </>
            ) : null}
          </section>

          {/* Challenge Completion Interface */}
          {showCompletionForm &&
            isParticipating &&
            userChallenge &&
            challenge &&
            currentUser && (
              <section
                className="mt-8 glassmorphic p-6 rounded-xl border-glass backdrop-blur-xl"
                aria-labelledby="completion-interface"
              >
                <ChallengeCompletionInterface
                  challenge={challenge}
                  userChallenge={userChallenge}
                  userId={currentUser.uid}
                  onComplete={(rewards) => {
                    // Store rewards and show celebration modal
                    setCompletionRewards(rewards);
                    setShowCelebrationModal(true);
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

        {/* 3. Sidebar Column (Right) - Unified Challenge Status Card */}
        <div className="space-y-6">
          {/* Unified Challenge Status Card */}
          <div className="glassmorphic p-6">
            {/* Deadline Timer */}
            <div className="mb-6 pb-6 border-b border-white/10">
              <div className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wide">Time Remaining</div>
              {(() => {
                const remaining = getTimeRemaining((challenge as any).endDate || (challenge as any).deadline);
                if (remaining) {
                  return (
                    <div className="flex gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold font-mono text-foreground">{remaining.days}</div>
                        <div className="text-[10px] uppercase text-muted-foreground">Days</div>
                      </div>
                      <div className="text-2xl font-bold text-muted-foreground">:</div>
                      <div className="text-center">
                        <div className="text-2xl font-bold font-mono text-foreground">{remaining.hours}</div>
                        <div className="text-[10px] uppercase text-muted-foreground">Hours</div>
                      </div>
                    </div>
                  );
                }
                return <div className="text-xl font-bold">Ended</div>;
              })()}
            </div>

            {/* Primary CTA */}
            {normalizeStatus((challenge as any).status) === "OPEN" && (
              <Button
                onClick={handleParticipate}
                disabled={isParticipating || isLocked}
                variant={isParticipating ? "success" : "premium"}
                size="xl"
                fullWidth
                enableAnimations
                className={cn(
                  "font-bold text-lg shadow-xl mb-6",
                  isParticipating ? "cursor-not-allowed opacity-80" : "hover:scale-[1.02]"
                )}
              >
                {isParticipating ? "Joined" : "Participate Now"}
              </Button>
            )}

            {isLocked && (
              <Alert variant="destructive" className="mb-6 border-destructive/20 bg-destructive/10">
                <LockIcon className="h-4 w-4" />
                <AlertDescription className="ml-2 text-destructive-foreground">
                  {lockReason}
                </AlertDescription>
              </Alert>
            )}

            {/* Status & Deadline Info */}
            <div className="mb-6 pb-6 border-b border-white/10 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <span className={cn("font-medium", getStatusClass((challenge as any).status))}>
                  {normalizeStatus((challenge as any).status)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Deadline</span>
                <span className="font-medium text-foreground">
                  {((challenge as any).deadline || (challenge as any).endDate) ? formatDate(((challenge as any).deadline || (challenge as any).endDate).toDate()) : "N/A"}
                </span>
              </div>
            </div>

            {/* Live Leaderboard Section (within same card) */}
            <div>
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Medal className="w-5 h-5 text-amber-500" />
                Live Leaderboard
              </h3>
              <div className="text-center py-6 text-muted-foreground text-sm bg-black/20 rounded-xl border border-dashed border-white/10">
                {submissions.length > 0 ? (
                  <div className="space-y-3">
                    {submissions.slice(0, 5).map((sub, i) => (
                      <div key={sub.id} className="flex items-center justify-between p-2 rounded-lg bg-white/5 shadow-xs">
                        <span className="text-xs font-bold text-muted-foreground">#{i + 1}</span>
                        <span className="text-sm font-medium">{sub.title || "User"}</span>
                        <span className="text-xs text-primary font-mono">Submitted</span>
                      </div>
                    ))}
                    {submissions.length > 5 && (
                      <button className="text-xs text-center pt-2 text-primary hover:text-primary/80 transition-colors">
                        View all {submissions.length} participants →
                      </button>
                    )}
                  </div>
                ) : (
                  "Be the first to submit!"
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Celebration Modal */}
      {showCelebrationModal && completionRewards && challenge && (
        <RewardCelebrationModal
          isOpen={showCelebrationModal}
          onClose={() => {
            setShowCelebrationModal(false);
            addToast(
              "success",
              `Challenge completed! You earned ${completionRewards.xp + completionRewards.bonusXP
              } XP!`
            );
          }}
          rewards={completionRewards}
          challengeTitle={challenge.title}
        />
      )}
    </main>
  );
};

export default ChallengeDetailPage;
