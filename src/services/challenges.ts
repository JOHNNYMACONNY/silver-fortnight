import { getSyncFirebaseDb } from "../firebase-config";
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  runTransaction,
  updateDoc,
  deleteDoc,
  writeBatch,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData,
  onSnapshot,
} from "firebase/firestore";
import {
  Challenge,
  UserChallenge,
  ChallengeSubmission,
  ChallengeResponse,
  ChallengeListResponse,
  ChallengeProgressResponse,
  ChallengeFilters,
  ChallengeSortBy,
  ChallengeStatus,
  UserChallengeStatus,
  ChallengeType,
  ChallengeDifficulty,
  ChallengeCategory,
  ChallengeNotification,
  ChallengeNotificationType,
  XP_VALUES,
  XPSource,
} from "../types/gamification";
import { ServiceResponse } from "../types/services";
import { EmbeddedEvidence } from "../types/evidence";
import { awardXPWithLeaderboardUpdate } from "./gamification";
import { updateProgressionOnChallengeCompletion } from "./threeTierProgression";
import { markChallengeDay } from "./streaks";
import { addSkillXP } from "./skillXP";
import { logger } from '@utils/logging/logger';

// Real-time notification support
let challengeNotificationCallback:
  | ((notification: ChallengeNotification) => void)
  | null = null;
const challengeEventListeners: Array<
  (notification: ChallengeNotification) => void
> = [];

/**
 * Set callback for real-time challenge notifications
 */
export const setChallengeNotificationCallback = (
  callback: (notification: ChallengeNotification) => void
) => {
  challengeNotificationCallback = callback;
};

/**
 * Add a listener for challenge notifications (multi-listener API)
 */
export const addChallengeEventListener = (
  listener: (notification: ChallengeNotification) => void
): void => {
  challengeEventListeners.push(listener);
};

/**
 * Remove a previously added challenge notification listener
 */
export const removeChallengeEventListener = (
  listener: (notification: ChallengeNotification) => void
): void => {
  const index = challengeEventListeners.indexOf(listener);
  if (index >= 0) challengeEventListeners.splice(index, 1);
};

/**
 * Trigger real-time challenge notification
 */
const triggerChallengeNotification = (notification: ChallengeNotification) => {
  if (challengeNotificationCallback) {
    challengeNotificationCallback(notification);
  }
  // Broadcast to all listeners as well
  if (challengeEventListeners.length > 0) {
    for (const listener of challengeEventListeners) {
      try {
        listener(notification);
      } catch (err) {
        logger.warn('Challenge event listener failed', 'SERVICE', err);
      }
    }
  }
};

/**
 * Core Challenge Management Functions
 */

/**
 * Create a new challenge
 */
export const createChallenge = async (
  challengeData: Partial<Challenge>
): Promise<ChallengeResponse> => {
  try {
    const challengeRef = doc(collection(getSyncFirebaseDb(), "challenges"));
    const challenge: Challenge = {
      id: challengeRef.id,
      title: challengeData.title || "",
      description: challengeData.description || "",
      type: challengeData.type || ChallengeType.SKILL,
      category: challengeData.category!,
      difficulty: challengeData.difficulty || ChallengeDifficulty.BEGINNER,
      requirements: challengeData.requirements || [],
      rewards: challengeData.rewards || {
        xp: XP_VALUES.CHALLENGE_COMPLETION_BEGINNER,
      },
      startDate: challengeData.startDate || Timestamp.now(),
      endDate: challengeData.endDate!,
      status: challengeData.status || ChallengeStatus.DRAFT,
      participantCount: 0,
      completionCount: 0,
      instructions: challengeData.instructions || [],
      objectives: challengeData.objectives || [],
      createdBy: challengeData.createdBy!,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // Add optional fields only if they have values (Firestore doesn't allow undefined)
    if (challengeData.maxParticipants !== undefined) {
      challenge.maxParticipants = challengeData.maxParticipants;
    }
    if (challengeData.timeEstimate !== undefined) {
      challenge.timeEstimate = challengeData.timeEstimate;
    }
    if (challengeData.tags !== undefined && challengeData.tags.length > 0) {
      challenge.tags = challengeData.tags;
    }

    await setDoc(challengeRef, challenge);

    return {
      success: true,
      challengeId: challenge.id,
      data: challenge,
    };
  } catch (error) {
    logger.error('Error creating challenge:', 'SERVICE', {}, error as Error);
    return {
      success: false,
      error: "Failed to create challenge",
    };
  }
};

/**
 * Get a challenge by ID
 */
export const getChallenge = async (
  challengeId: string
): Promise<ChallengeResponse> => {
  try {
    const challengeRef = doc(getSyncFirebaseDb(), "challenges", challengeId);
    const challengeSnap = await getDoc(challengeRef);

    if (!challengeSnap.exists()) {
      return {
        success: false,
        error: "Challenge not found",
      };
    }

    return {
      success: true,
      data: { id: challengeSnap.id, ...challengeSnap.data() } as Challenge,
    };
  } catch (error) {
    logger.error('Error getting challenge:', 'SERVICE', {}, error as Error);
    return {
      success: false,
      error: "Failed to get challenge",
    };
  }
};

/**
 * Get challenges with filtering and pagination
 */
export const getChallenges = async (
  filters: ChallengeFilters = {}
): Promise<ChallengeListResponse> => {
  try {
    const queryRef = collection(getSyncFirebaseDb(), "challenges");
    const constraints: any[] = [];

    // Apply filters
    if (filters.type && filters.type.length > 0) {
      constraints.push(where("type", "in", filters.type));
    }

    if (filters.category && filters.category.length > 0) {
      constraints.push(where("category", "in", filters.category));
    }

    if (filters.difficulty && filters.difficulty.length > 0) {
      constraints.push(where("difficulty", "in", filters.difficulty));
    }

    if (filters.status && filters.status.length > 0) {
      constraints.push(where("status", "in", filters.status));
    }

    if (filters.startDate) {
      constraints.push(
        where("startDate", ">=", Timestamp.fromDate(filters.startDate))
      );
    }

    if (filters.endDate) {
      constraints.push(
        where("endDate", "<=", Timestamp.fromDate(filters.endDate))
      );
    }

    // Apply sorting
    const sortBy = filters.sortBy || ChallengeSortBy.CREATED_AT;
    const sortOrder = filters.sortOrder || "desc";
    constraints.push(orderBy(sortBy, sortOrder));

    // Apply limit
    const limitCount = filters.limit || 20;
    constraints.push(limit(limitCount));

    // Create and execute query
    const q = query(queryRef, ...constraints);
    const querySnapshot = await getDocs(q);

    const challenges: Challenge[] = querySnapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Record<string, unknown>),
    })) as Challenge[];

    return {
      success: true,
      challenges,
      total: challenges.length,
      hasMore: challenges.length === limitCount,
    };
  } catch (error) {
    logger.error('Error getting challenges:', 'SERVICE', {}, error as Error);
    return {
      success: false,
      challenges: [],
      total: 0,
      hasMore: false,
      error: "Failed to get challenges",
    };
  }
};

/**
 * Join a challenge
 */
export const joinChallenge = async (
  challengeId: string,
  userId: string
): Promise<ChallengeResponse> => {
  try {
    const result = await runTransaction(
      getSyncFirebaseDb(),
      async (transaction) => {
        const challengeRef = doc(
          getSyncFirebaseDb(),
          "challenges",
          challengeId
        );
        const challengeSnap = await transaction.get(challengeRef);

        if (!challengeSnap.exists()) {
          throw new Error("Challenge not found");
        }

        const challenge = challengeSnap.data() as Challenge;

        // Check if challenge is active
        if (challenge.status !== ChallengeStatus.ACTIVE) {
          throw new Error("Challenge is not active");
        }

        // Check if user already joined
        const userChallengeRef = doc(
          getSyncFirebaseDb(),
          "userChallenges",
          `${userId}_${challengeId}`
        );
        const userChallengeSnap = await transaction.get(userChallengeRef);

        if (userChallengeSnap.exists()) {
          throw new Error("User already joined this challenge");
        }

        // Check tier gating (soft flag)
        try {
          const enforce = String(
            (process as any)?.env?.VITE_ENFORCE_TIER_GATING || ""
          ).toLowerCase();
          const shouldEnforce =
            enforce === "1" || enforce === "true" || enforce === "yes";
          if (
            shouldEnforce &&
            (challenge.type === ChallengeType.TRADE ||
              challenge.type === ChallengeType.COLLABORATION)
          ) {
            // Lazy import to avoid circulars
            const { getUserThreeTierProgress } = await import(
              "./threeTierProgression"
            );
            const prog = await getUserThreeTierProgress(userId);
            const unlocked = prog.success ? prog.data?.unlockedTiers || [] : [];
            if (
              challenge.type === ChallengeType.TRADE &&
              !unlocked.includes("TRADE")
            ) {
              throw new Error(
                "Tier locked: Complete 3 Solo challenges and reach skill level 2 to unlock Trade challenges."
              );
            }
            if (
              challenge.type === ChallengeType.COLLABORATION &&
              !unlocked.includes("COLLABORATION")
            ) {
              throw new Error(
                "Tier locked: Complete 5 Trade challenges and reach skill level 3 to unlock Collaboration challenges."
              );
            }
          }
        } catch (e) {
          // If gating check fails unexpectedly, do not block join unless flag enforced and explicit lock thrown above
        }

        // Check max participants
        if (
          challenge.maxParticipants &&
          challenge.participantCount >= challenge.maxParticipants
        ) {
          throw new Error("Challenge is full");
        }

        // Create user challenge record
        const userChallenge: UserChallenge = {
          id: userChallengeRef.id,
          userId,
          challengeId,
          status: UserChallengeStatus.ACTIVE,
          progress: 0,
          maxProgress: challenge.requirements.length || 1,
          startedAt: Timestamp.now(),
          lastActivityAt: Timestamp.now(),
        };

        transaction.set(userChallengeRef, userChallenge);

        // Update challenge participant count
        transaction.update(challengeRef, {
          participantCount: challenge.participantCount + 1,
          updatedAt: Timestamp.now(),
        });

        return { challenge, userChallenge };
      }
    );

    // Award join XP (with leaderboard update)
    await awardXPWithLeaderboardUpdate(
      userId,
      XP_VALUES.CHALLENGE_JOIN,
      XPSource.CHALLENGE_JOIN,
      challengeId,
      `Joined challenge: ${result.challenge.title}`
    );

    // Send notification
    const notification: ChallengeNotification = {
      userId,
      type: ChallengeNotificationType.CHALLENGE_STARTED,
      challengeId,
      challengeTitle: result.challenge.title,
      createdAt: Timestamp.now(),
    };
    triggerChallengeNotification(notification);

    return {
      success: true,
      data: result.userChallenge,
    };
  } catch (error) {
    logger.error('Error joining challenge:', 'SERVICE', {}, error as Error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to join challenge",
    };
  }
};

/**
 * Update challenge progress
 */
export const updateChallengeProgress = async (
  userId: string,
  challengeId: string,
  progressIncrement: number = 1,
  metadata?: Record<string, any>
): Promise<ChallengeProgressResponse> => {
  try {
    const result = await runTransaction(
      getSyncFirebaseDb(),
      async (transaction) => {
        const userChallengeRef = doc(
          getSyncFirebaseDb(),
          "userChallenges",
          `${userId}_${challengeId}`
        );
        const userChallengeSnap = await transaction.get(userChallengeRef);

        if (!userChallengeSnap.exists()) {
          throw new Error("User challenge not found");
        }

        const userChallenge = userChallengeSnap.data() as UserChallenge;

        if (userChallenge.status !== UserChallengeStatus.ACTIVE) {
          throw new Error("Challenge is not active");
        }

        const newProgress = Math.min(
          userChallenge.progress + progressIncrement,
          userChallenge.maxProgress
        );
        const progressPercentage =
          (newProgress / userChallenge.maxProgress) * 100;
        const isCompleted = newProgress >= userChallenge.maxProgress;

        const updatedUserChallenge: UserChallenge = {
          ...userChallenge,
          progress: newProgress,
          lastActivityAt: Timestamp.now(),
          status: isCompleted
            ? UserChallengeStatus.COMPLETED
            : UserChallengeStatus.ACTIVE,
          completedAt: isCompleted ? Timestamp.now() : undefined,
          completionTimeMinutes:
            isCompleted && userChallenge.startedAt
              ? Math.round(
                  (Timestamp.now().toMillis() -
                    userChallenge.startedAt.toMillis()) /
                    60000
                )
              : undefined,
        };

        transaction.set(userChallengeRef, updatedUserChallenge);

        return {
          userChallenge: updatedUserChallenge,
          progressPercentage,
          isCompleted,
        };
      }
    );

    // Award progress XP
    const progressPercentage = result.progressPercentage;
    let xpAmount = 0;

    if (progressPercentage >= 25 && result.userChallenge.progress === 1) {
      xpAmount = XP_VALUES.CHALLENGE_PROGRESS_25;
    } else if (progressPercentage >= 50) {
      xpAmount = XP_VALUES.CHALLENGE_PROGRESS_50;
    } else if (progressPercentage >= 75) {
      xpAmount = XP_VALUES.CHALLENGE_PROGRESS_75;
    }

    if (xpAmount > 0) {
      await awardXPWithLeaderboardUpdate(
        userId,
        xpAmount,
        XPSource.CHALLENGE_PROGRESS,
        challengeId,
        `Challenge progress: ${progressPercentage.toFixed(0)}%`
      );
    }

    // Handle completion
    if (result.isCompleted) {
      await handleChallengeCompletion(
        userId,
        challengeId,
        result.userChallenge
      );
    } else {
      // Send progress notification
      const notification: ChallengeNotification = {
        userId,
        type: ChallengeNotificationType.CHALLENGE_PROGRESS,
        challengeId,
        challengeTitle: "", // Will be filled by the UI
        progress: result.userChallenge.progress,
        maxProgress: result.userChallenge.maxProgress,
        createdAt: Timestamp.now(),
      };
      triggerChallengeNotification(notification);
    }

    return {
      success: true,
      userChallenge: result.userChallenge,
      progressPercentage: result.progressPercentage,
      nextMilestone: getNextMilestone(result.progressPercentage),
    };
  } catch (error) {
    logger.error('Error updating challenge progress:', 'SERVICE', {}, error as Error);
    return {
      success: false,
      progressPercentage: 0,
      error:
        error instanceof Error ? error.message : "Failed to update progress",
    };
  }
};

/**
 * Handle challenge completion
 */
const handleChallengeCompletion = async (
  userId: string,
  challengeId: string,
  userChallenge: UserChallenge
): Promise<void> => {
  try {
    // Get challenge details
    const challengeResponse = await getChallenge(challengeId);
    if (!challengeResponse.success || !challengeResponse.data) {
      throw new Error("Challenge not found");
    }

    const challenge = challengeResponse.data as Challenge;

    // Update challenge completion count
    await runTransaction(getSyncFirebaseDb(), async (transaction) => {
      const challengeRef = doc(getSyncFirebaseDb(), "challenges", challengeId);
      const challengeSnap = await transaction.get(challengeRef);

      if (challengeSnap.exists()) {
        const challengeData = challengeSnap.data() as Challenge;
        transaction.update(challengeRef, {
          completionCount: challengeData.completionCount + 1,
          updatedAt: Timestamp.now(),
        });
      }
    });

    // Calculate completion XP based on difficulty
    let completionXP: number =
      XP_VALUES.CHALLENGE_COMPLETION_BEGINNER as number;

    switch (challenge.difficulty) {
      case ChallengeDifficulty.INTERMEDIATE:
        completionXP = XP_VALUES.CHALLENGE_COMPLETION_INTERMEDIATE;
        break;
      case ChallengeDifficulty.ADVANCED:
        completionXP = XP_VALUES.CHALLENGE_COMPLETION_ADVANCED;
        break;
      case ChallengeDifficulty.EXPERT:
        completionXP = XP_VALUES.CHALLENGE_COMPLETION_EXPERT;
        break;
    }

    // Check for early completion bonus (completed in less than 75% of estimated time)
    let bonusXP = 0;
    if (userChallenge.completionTimeMinutes && challenge.timeEstimate) {
      const estimatedMinutes = parseTimeEstimate(challenge.timeEstimate);
      if (
        estimatedMinutes &&
        userChallenge.completionTimeMinutes < estimatedMinutes * 0.75
      ) {
        bonusXP = XP_VALUES.CHALLENGE_EARLY_COMPLETION_BONUS;
      }
    }

    const totalXP = completionXP + bonusXP + (challenge.rewards.xp || 0);

    // Award completion XP (with leaderboard update)
    await awardXPWithLeaderboardUpdate(
      userId,
      totalXP,
      XPSource.CHALLENGE_COMPLETION,
      challengeId,
      `Completed challenge: ${challenge.title}${
        bonusXP > 0 ? " (Early completion bonus!)" : ""
      }`
    );

    // Update challenge streak
    try {
      await markChallengeDay(userId, new Date());
    } catch {}

    // Hook: Award skill-specific XP based on challenge category
    try {
      const skillName = (challenge.category || "")
        .toString()
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());
      if (skillName) {
        const skillAmount = Math.max(25, Math.round(totalXP * 0.5));
        await addSkillXP(
          userId,
          skillName,
          skillAmount,
          "challenge_completion",
          challengeId,
          `Completed challenge: ${challenge.title}`
        );
      }
    } catch (e) {
      // non-blocking
    }

    // Send completion notification
    const notification: ChallengeNotification = {
      userId,
      type: ChallengeNotificationType.CHALLENGE_COMPLETED,
      challengeId,
      challengeTitle: challenge.title,
      rewards: {
        xp: totalXP,
        badges: challenge.rewards.badges,
        specialRecognition: challenge.rewards.specialRecognition,
      },
      createdAt: Timestamp.now(),
    };
    triggerChallengeNotification(notification);
  } catch (error) {
    logger.error('Error handling challenge completion:', 'SERVICE', {}, error as Error);
  }
};

/**
 * Submit to a challenge
 */
export const submitToChallenge = async (
  userId: string,
  challengeId: string,
  submission: Partial<ChallengeSubmission>
): Promise<ChallengeResponse> => {
  try {
    const submissionRef = doc(
      collection(getSyncFirebaseDb(), "challengeSubmissions")
    );
    const challengeSubmission: ChallengeSubmission = {
      id: submissionRef.id,
      userId,
      challengeId,
      title: submission.title || "",
      description: submission.description || "",
      evidenceUrls: submission.evidenceUrls || [],
      evidenceTypes: submission.evidenceTypes || [],
      embeddedEvidence:
        (submission.embeddedEvidence as EmbeddedEvidence[]) || undefined,
      reflectionNotes: submission.reflectionNotes,
      submittedAt: Timestamp.now(),
      isPublic: submission.isPublic !== undefined ? submission.isPublic : true,
    };

    await setDoc(submissionRef, challengeSubmission);

    // Update user challenge status
    await updateDoc(
      doc(getSyncFirebaseDb(), "userChallenges", `${userId}_${challengeId}`),
      {
        status: UserChallengeStatus.SUBMITTED,
        lastActivityAt: Timestamp.now(),
      }
    );

    return {
      success: true,
      data: challengeSubmission,
    };
  } catch (error) {
    logger.error('Error submitting to challenge:', 'SERVICE', {}, error as Error);
    return {
      success: false,
      error: "Failed to submit to challenge",
    };
  }
};

/**
 * Get user's challenges
 */
export const getUserChallenges = async (
  userId: string,
  status?: UserChallengeStatus[]
): Promise<ChallengeListResponse> => {
  try {
    const queryRef = collection(getSyncFirebaseDb(), "userChallenges");
    const constraints: any[] = [where("userId", "==", userId)];

    if (status && status.length > 0) {
      constraints.push(where("status", "in", status));
    }

    constraints.push(orderBy("lastActivityAt", "desc"));

    const q = query(queryRef, ...constraints);
    const querySnapshot = await getDocs(q);

    const userChallenges = querySnapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Record<string, unknown>),
    })) as UserChallenge[];

    // Get challenge details for each user challenge
    const challengeIds = userChallenges.map((uc) => uc.challengeId);
    const challenges: Challenge[] = [];

    for (const challengeId of challengeIds) {
      const challengeResponse = await getChallenge(challengeId);
      if (challengeResponse.success && challengeResponse.data) {
        challenges.push(challengeResponse.data as Challenge);
      }
    }

    return {
      success: true,
      challenges,
      total: challenges.length,
      hasMore: false,
    };
  } catch (error) {
    logger.error('Error getting user challenges:', 'SERVICE', {}, error as Error);
    return {
      success: false,
      challenges: [],
      total: 0,
      hasMore: false,
      error: "Failed to get user challenges",
    };
  }
};

/**
 * Subscribe to a user's challenge submissions in real-time
 */
export const onUserChallengeSubmissions = (
  userId: string,
  handler: (submissions: ChallengeSubmission[]) => void
): (() => void) => {
  const qRef = collection(getSyncFirebaseDb(), "challengeSubmissions");
  const q = query(
    qRef,
    where("userId", "==", userId),
    orderBy("submittedAt", "desc")
  );
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const items: ChallengeSubmission[] = snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Record<string, unknown>),
    })) as ChallengeSubmission[];
    handler(items);
  });
  return unsubscribe;
};

/**
 * Subscribe to a specific challenge's participants/submissions in real-time
 */
export const onChallengeSubmissions = (
  challengeId: string,
  handler: (submissions: ChallengeSubmission[]) => void
): (() => void) => {
  const qRef = collection(getSyncFirebaseDb(), "challengeSubmissions");
  const q = query(
    qRef,
    where("challengeId", "==", challengeId),
    orderBy("submittedAt", "desc")
  );
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const items: ChallengeSubmission[] = snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Record<string, unknown>),
    })) as ChallengeSubmission[];
    handler(items);
  });
  return unsubscribe;
};

/**
 * Abandon a challenge
 */
export const abandonChallenge = async (
  userId: string,
  challengeId: string
): Promise<ChallengeResponse> => {
  try {
    const userChallengeRef = doc(
      getSyncFirebaseDb(),
      "userChallenges",
      `${userId}_${challengeId}`
    );
    await updateDoc(userChallengeRef, {
      status: UserChallengeStatus.ABANDONED,
      abandonedAt: Timestamp.now(),
      lastActivityAt: Timestamp.now(),
    });

    return {
      success: true,
    };
  } catch (error) {
    logger.error('Error abandoning challenge:', 'SERVICE', {}, error as Error);
    return {
      success: false,
      error: "Failed to abandon challenge",
    };
  }
};

/**
 * Leave a challenge (alias for abandon)
 */
export const leaveChallenge = async (
  userId: string,
  challengeId: string
): Promise<ChallengeResponse> => {
  return abandonChallenge(userId, challengeId);
};

/**
 * Get recommended challenges for a user
 */
export const getRecommendedChallenges = async (
  userId: string
): Promise<ChallengeListResponse> => {
  try {
    // Heuristic: prefer categories the user recently engaged with
    const recent = await getUserChallenges(userId, [
      UserChallengeStatus.ACTIVE,
      UserChallengeStatus.COMPLETED,
    ]);
    const preferredCategories = new Set<ChallengeCategory>();
    const difficultyTally: Record<string, number> = {
      beginner: 0,
      intermediate: 0,
      advanced: 0,
      expert: 0,
    };

    if (recent.success && recent.challenges?.length) {
      for (const c of recent.challenges) {
        if (c.category)
          preferredCategories.add(c.category as ChallengeCategory);
        if (c.difficulty)
          difficultyTally[(c.difficulty as string).toLowerCase()] =
            (difficultyTally[(c.difficulty as string).toLowerCase()] || 0) + 1;
      }
    }

    const sortedDifficulties = Object.entries(difficultyTally)
      .sort((a, b) => b[1] - a[1])
      .map(([k]) => k as keyof typeof difficultyTally);

    // Default band: beginner/intermediate; otherwise center around user’s most common difficulty
    const band =
      sortedDifficulties.length > 0 &&
      difficultyTally[sortedDifficulties[0]] > 0
        ? (() => {
            const order = ["beginner", "intermediate", "advanced", "expert"];
            const idx = order.indexOf(sortedDifficulties[0]);
            const picks = new Set([order[idx]]);
            if (idx - 1 >= 0) picks.add(order[idx - 1]);
            if (idx + 1 < order.length) picks.add(order[idx + 1]);
            return Array.from(picks).map((d) =>
              d.toUpperCase()
            ) as ChallengeDifficulty[];
          })()
        : [ChallengeDifficulty.BEGINNER, ChallengeDifficulty.INTERMEDIATE];

    // Try category-focused query first if we have preferences
    if (preferredCategories.size > 0) {
      const res = await getChallenges({
        status: [ChallengeStatus.ACTIVE],
        category: Array.from(preferredCategories).slice(0, 10),
        difficulty: band,
        sortBy: ChallengeSortBy.PARTICIPANT_COUNT,
        sortOrder: "desc",
        limit: 10,
      });
      if (res.success && res.challenges && res.challenges.length > 0) {
        const joinedIds = new Set((recent.challenges || []).map((c) => c.id));
        const filtered = res.challenges.filter((c) => !joinedIds.has(c.id));
        return { ...res, challenges: filtered, total: filtered.length };
      }
    }

    // Fallback: no category filter
    const fallback = await getChallenges({
      status: [ChallengeStatus.ACTIVE],
      difficulty: band,
      sortBy: ChallengeSortBy.PARTICIPANT_COUNT,
      sortOrder: "desc",
      limit: 10,
    });
    if (fallback.success && fallback.challenges) {
      const joinedIds = new Set((recent.challenges || []).map((c) => c.id));
      const filtered = fallback.challenges.filter((c) => !joinedIds.has(c.id));
      return { ...fallback, challenges: filtered, total: filtered.length };
    }
    return fallback;
  } catch (error) {
    logger.error('Error getting recommended challenges:', 'SERVICE', {}, error as Error);
    return {
      success: false,
      challenges: [],
      total: 0,
      hasMore: false,
      error: "Failed to get recommended challenges",
    };
  }
};

/**
 * Get user's progress for a specific challenge
 */
export const getUserChallengeProgress = async (
  userId: string,
  challengeId: string
): Promise<ChallengeProgressResponse> => {
  try {
    const userChallengeRef = doc(
      getSyncFirebaseDb(),
      "userChallenges",
      `${userId}_${challengeId}`
    );
    const userChallengeSnap = await getDoc(userChallengeRef);

    if (!userChallengeSnap.exists()) {
      return {
        success: false,
        progressPercentage: 0,
        error: "User challenge not found",
      };
    }

    const userChallenge = {
      id: userChallengeSnap.id,
      ...(userChallengeSnap.data() as Record<string, unknown>),
    } as UserChallenge;
    const progressPercentage =
      (userChallenge.progress / userChallenge.maxProgress) * 100;

    return {
      success: true,
      userChallenge,
      progressPercentage,
      nextMilestone: getNextMilestone(progressPercentage),
    };
  } catch (error) {
    logger.error('Error getting user challenge progress:', 'SERVICE', {}, error as Error);
    return {
      success: false,
      progressPercentage: 0,
      error: "Failed to get challenge progress",
    };
  }
};

/**
 * Alternative interface functions for tests
 */

/**
 * Start a challenge (wrapper around joinChallenge for test compatibility)
 */
export const startChallenge = async (
  userId: string,
  challengeId: string
): Promise<{
  success: boolean;
  userChallenge?: UserChallenge;
  error?: string;
}> => {
  try {
    const result = await joinChallenge(userId, challengeId);
    if (result.success && result.data) {
      return {
        success: true,
        userChallenge: result.data as UserChallenge,
      };
    }
    return {
      success: false,
      error: result.error || "Failed to start challenge",
    };
  } catch (error) {
    logger.error('Error starting challenge:', 'SERVICE', {}, error as Error);
    return {
      success: false,
      error: "Failed to start challenge",
    };
  }
};

/**
 * Get challenge stats (wrapper around getUserChallengeStats for test compatibility)
 */
export const getChallengeStats = async (
  userId: string
): Promise<{
  totalCompleted: number;
  totalActive: number;
  totalXPEarned: number;
  averageCompletionTime: number;
  streakCount: number;
  completionRate?: number;
}> => {
  try {
    const stats = await getUserChallengeStats(userId);
    const totalChallenges = stats.totalCompleted + stats.totalActive;
    const completionRate =
      totalChallenges > 0 ? (stats.totalCompleted / totalChallenges) * 100 : 0;

    return {
      ...stats,
      completionRate,
    };
  } catch (error) {
    logger.error('Error getting challenge stats:', 'SERVICE', {}, error as Error);
    return {
      totalCompleted: 0,
      totalActive: 0,
      totalXPEarned: 0,
      averageCompletionTime: 0,
      streakCount: 0,
      completionRate: 0,
    };
  }
};

/**
 * Complete a challenge manually (for testing and admin purposes)
 */
export const completeChallenge = async (
  userChallengeId: string
): Promise<{
  success: boolean;
  userChallenge?: UserChallenge;
  error?: string;
}> => {
  try {
    const userChallengeRef = doc(
      getSyncFirebaseDb(),
      "userChallenges",
      userChallengeId
    );
    const userChallengeSnap = await getDoc(userChallengeRef);

    if (!userChallengeSnap.exists()) {
      return {
        success: false,
        error: "User challenge not found",
      };
    }

    const userChallenge = {
      id: userChallengeSnap.id,
      ...(userChallengeSnap.data() as Record<string, unknown>),
    } as UserChallenge;

    if (userChallenge.status === UserChallengeStatus.COMPLETED) {
      return {
        success: false,
        error: "Challenge already completed",
      };
    }

    // Update challenge to completed
    const updatedData = {
      status: UserChallengeStatus.COMPLETED,
      progress: userChallenge.maxProgress,
      completedAt: Timestamp.now(),
      lastActivityAt: Timestamp.now(),
      completionTimeMinutes: Math.floor(
        (Date.now() - userChallenge.startedAt.toMillis()) / (1000 * 60)
      ),
    };

    await updateDoc(userChallengeRef, updatedData);

    // Get challenge details for XP calculation
    const challengeResponse = await getChallenge(userChallenge.challengeId);
    if (challengeResponse.success && challengeResponse.data) {
      const challenge = challengeResponse.data as Challenge;

      // Award XP based on difficulty
      let xpAmount: number = 100; // Default for beginner
      switch (challenge.difficulty) {
        case ChallengeDifficulty.INTERMEDIATE:
          xpAmount = 200;
          break;
        case ChallengeDifficulty.ADVANCED:
          xpAmount = 350;
          break;
        case ChallengeDifficulty.EXPERT:
          xpAmount = 500;
          break;
      }

      await awardXPWithLeaderboardUpdate(
        userChallenge.userId,
        xpAmount,
        XPSource.CHALLENGE_COMPLETION,
        challenge.id
      );

      // Update three-tier progression if this is a tier-based challenge
      if (
        [
          ChallengeType.SOLO,
          ChallengeType.TRADE,
          ChallengeType.COLLABORATION,
        ].includes(challenge.type)
      ) {
        await updateProgressionOnChallengeCompletion(
          userChallenge.userId,
          challenge.type,
          challenge.category ? [challenge.category] : []
        );
      }
    }

    const updatedUserChallenge = { ...userChallenge, ...updatedData };

    return {
      success: true,
      userChallenge: updatedUserChallenge,
    };
  } catch (error) {
    logger.error('Error completing challenge:', 'SERVICE', {}, error as Error);
    return {
      success: false,
      error: "Failed to complete challenge",
    };
  }
};

/**
 * Helper Functions
 */

/**
 * Parse time estimate string to minutes
 */
const parseTimeEstimate = (timeEstimate: string): number | null => {
  const match = timeEstimate.match(/(\d+)\s*(minutes?|hours?|days?)/i);
  if (!match) return null;

  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case "minute":
    case "minutes":
      return value;
    case "hour":
    case "hours":
      return value * 60;
    case "day":
    case "days":
      return value * 24 * 60;
    default:
      return null;
  }
};

/**
 * Get next milestone for progress
 */
const getNextMilestone = (progressPercentage: number): string => {
  if (progressPercentage < 25) return "25% completion";
  if (progressPercentage < 50) return "50% completion";
  if (progressPercentage < 75) return "75% completion";
  if (progressPercentage < 100) return "Challenge completion";
  return "Completed!";
};

/**
 * Get active challenges (convenience function for UI)
 */
export const getActiveChallenges = async (): Promise<ChallengeListResponse> => {
  return getChallenges({
    status: [ChallengeStatus.ACTIVE],
    sortBy: ChallengeSortBy.END_DATE,
    sortOrder: "asc",
    limit: 50,
  });
};

/**
 * Subscribe to active challenges for real-time updates
 */
export const onActiveChallenges = (
  handler: (challenges: Challenge[]) => void
): (() => void) => {
  const qRef = collection(getSyncFirebaseDb(), "challenges");
  const qConstraints: any[] = [];
  qConstraints.push(where("status", "==", ChallengeStatus.ACTIVE));
  qConstraints.push(orderBy("endDate", "asc"));
  const q = query(qRef, ...qConstraints);
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const items: Challenge[] = snapshot.docs.map(
      (d) =>
        ({ id: d.id, ...(d.data() as Record<string, unknown>) } as Challenge)
    );
    handler(items);
  });
  return unsubscribe;
};

/**
 * Get daily challenges (convenience function for UI)
 */
export const getDailyChallenges = async (): Promise<ChallengeListResponse> => {
  return getChallenges({
    type: [ChallengeType.DAILY],
    status: [ChallengeStatus.ACTIVE],
    sortBy: ChallengeSortBy.CREATED_AT,
    sortOrder: "desc",
    limit: 10,
  });
};

/**
 * Get weekly challenges (convenience function for UI)
 */
export const getWeeklyChallenges = async (): Promise<ChallengeListResponse> => {
  return getChallenges({
    type: [ChallengeType.WEEKLY],
    status: [ChallengeStatus.ACTIVE],
    sortBy: ChallengeSortBy.CREATED_AT,
    sortOrder: "desc",
    limit: 10,
  });
};

/**
 * Featured daily challenge (first ACTIVE daily by soonest end date)
 */
export const getFeaturedDaily = async (): Promise<Challenge | null> => {
  const res = await getChallenges({
    type: [ChallengeType.WEEKLY],
    status: [ChallengeStatus.ACTIVE],
    sortBy: ChallengeSortBy.END_DATE,
    sortOrder: "asc",
    limit: 1,
  });
  if (!res.success || !res.challenges?.length) return null;
  return res.challenges[0];
};

/**
 * Featured weekly challenge (most recently created ACTIVE weekly)
 */
export const getFeaturedWeekly = async (): Promise<Challenge | null> => {
  const res = await getChallenges({
    type: [ChallengeType.WEEKLY],
    status: [ChallengeStatus.ACTIVE],
    sortBy: ChallengeSortBy.CREATED_AT,
    sortOrder: "desc",
    limit: 1,
  });
  if (!res.success || !res.challenges?.length) return null;
  return res.challenges[0];
};

/**
 * Get user's active challenges
 */
export const getUserActiveChallenges = async (
  userId: string
): Promise<ChallengeListResponse> => {
  return getUserChallenges(userId, [UserChallengeStatus.ACTIVE]);
};

/**
 * Get user's completed challenges
 */
export const getUserCompletedChallenges = async (
  userId: string
): Promise<ChallengeListResponse> => {
  return getUserChallenges(userId, [UserChallengeStatus.COMPLETED]);
};

/**
 * Get challenge stats for a user
 */
export const getUserChallengeStats = async (
  userId: string
): Promise<{
  totalCompleted: number;
  totalActive: number;
  totalXPEarned: number;
  averageCompletionTime: number;
  streakCount: number;
}> => {
  try {
    const userChallengesQuery = query(
      collection(getSyncFirebaseDb(), "userChallenges"),
      where("userId", "==", userId)
    );

    const snapshot = await getDocs(userChallengesQuery);
    const userChallenges = snapshot.docs.map(
      (doc) => doc.data() as UserChallenge
    );

    const completed = userChallenges.filter(
      (uc) => uc.status === UserChallengeStatus.COMPLETED
    );
    const active = userChallenges.filter(
      (uc) => uc.status === UserChallengeStatus.ACTIVE
    );

    const totalCompletionTime = completed.reduce(
      (sum, uc) => sum + (uc.completionTimeMinutes || 0),
      0
    );

    const averageCompletionTime =
      completed.length > 0 ? totalCompletionTime / completed.length : 0;

    // Calculate streak (simplified - consecutive days with challenge activity)
    const sortedChallenges = userChallenges
      .filter((uc) => uc.lastActivityAt)
      .sort(
        (a, b) => b.lastActivityAt.toMillis() - a.lastActivityAt.toMillis()
      );

    let streakCount = 0;
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const challenge of sortedChallenges) {
      const challengeDate = new Date(challenge.lastActivityAt.toDate());
      challengeDate.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor(
        (currentDate.getTime() - challengeDate.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      if (daysDiff === streakCount) {
        streakCount++;
      } else {
        break;
      }
    }

    return {
      totalCompleted: completed.length,
      totalActive: active.length,
      totalXPEarned: 0, // Would need to calculate from XP transactions
      averageCompletionTime,
      streakCount,
    };
  } catch (error) {
    logger.error('Error getting user challenge stats:', 'SERVICE', {}, error as Error);
    return {
      totalCompleted: 0,
      totalActive: 0,
      totalXPEarned: 0,
      averageCompletionTime: 0,
      streakCount: 0,
    };
  }
};
