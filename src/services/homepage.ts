import {
  collection,
  getDocs,
  limit as limitQuery,
  orderBy,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import { getSyncFirebaseDb } from "../firebase-config";
import { getSystemStats, SystemStats } from "./firestore-extensions";
import { CollaborationService, Collaboration } from "./entities/CollaborationService";
import { getChallenges } from "./challenges";
import { ChallengeStatus, ChallengeSortBy, Challenge } from "../types/gamification";
import { ServiceResponse } from "../types/services";
import {
  ActivityFeedItem,
  ChallengeSpotlight,
  CollaborationHighlight,
  HomePageData,
  HomeStats,
} from "../types/homepage";

const collaborationService = new CollaborationService();
const DEFAULT_FEED_LIMIT = 6;

const buildHomeStats = (stats?: SystemStats | null): HomeStats => {
  return {
    trades: {
      active: Math.max(
        0,
        (stats?.totalTrades || 0) - (stats?.completedTrades || 0)
      ),
      completed: stats?.completedTrades || 0,
    },
    community: {
      activeUsers: stats?.activeUsers || 0,
      skillsTraded: stats?.skillsTraded || stats?.completedTrades || 0,
      collaborations: stats?.totalCollaborations || 0,
      lastUpdated: stats?.lastUpdated,
    },
  };
};

const mapCollaborationHighlights = (
  collaborations?: Collaboration[] | null
): CollaborationHighlight[] => {
  if (!collaborations) return [];

  return collaborations.map((collab) => {
    const openRoles =
      collab.roles?.filter((role) => role.status !== "filled").length || 0;
    const summary = collab.description
      ? collab.description.slice(0, 90)
      : "Collaboration opportunity";

    return {
      id: collab.id || "",
      title: collab.title,
      summary,
      openRoles,
      status: collab.status,
      accent: collab.status === "in-progress" ? "blue" : "purple",
    };
  });
};

const pickChallengeSpotlight = (
  challenges?: Challenge[]
): ChallengeSpotlight | undefined => {
  const challenge = Array.isArray(challenges) ? challenges[0] : undefined;
  if (!challenge) return undefined;

  const deadline =
    challenge.endDate instanceof Timestamp
      ? challenge.endDate.toDate()
      : challenge.endDate?.toDate?.() ?? undefined;

  return {
    id: challenge.id,
    title: challenge.title,
    rewardSummary: challenge.rewards?.xp
      ? `${challenge.rewards.xp} XP`
      : undefined,
    deadline,
    status: challenge.status,
  };
};

export const getGlobalActivityFeed = async (
  limit: number = DEFAULT_FEED_LIMIT
): Promise<ServiceResponse<ActivityFeedItem[]>> => {
  try {
    const db = getSyncFirebaseDb();
    const cappedLimit = Math.max(2, limit);

    const tradesQuery = query(
      collection(db, "trades"),
      where("status", "in", ["open", "in-progress", "completed"]),
      orderBy("createdAt", "desc"),
      limitQuery(cappedLimit)
    );

    const collaborationsQuery = query(
      collection(db, "collaborations"),
      where("status", "in", ["open", "recruiting", "in-progress"]),
      orderBy("createdAt", "desc"),
      limitQuery(cappedLimit)
    );

    const [tradeSnap, collaborationSnap] = await Promise.all([
      getDocs(tradesQuery),
      getDocs(collaborationsQuery),
    ]);

    const activities: ActivityFeedItem[] = [];

    tradeSnap.forEach((doc) => {
      const data = doc.data() as Record<string, any>;
      const createdAt: Date =
        data?.createdAt?.toDate?.() || data?.createdAt || new Date();
      const status: string = data?.status || "open";

      activities.push({
        id: `trade-${doc.id}`,
        type: status === "completed" ? "trade_completed" : "trade",
        description: data?.title
          ? `Trade: ${data.title}`
          : "New trade activity",
        timestamp: createdAt,
        accent: status === "completed" ? "green" : "orange",
      });
    });

    collaborationSnap.forEach((doc) => {
      const data = doc.data() as Record<string, any>;
      const createdAt: Date =
        data?.createdAt?.toDate?.() || data?.createdAt || new Date();

      activities.push({
        id: `collab-${doc.id}`,
        type: "collaboration",
        description: data?.title
          ? `Collaboration: ${data.title}`
          : "New collaboration posted",
        timestamp: createdAt,
        accent: "purple",
      });
    });

    activities.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );

    return {
      success: true,
      data: activities.slice(0, limit),
    };
  } catch (error: any) {
    console.error("Error fetching global activity feed:", error);
    return {
      success: false,
      error: error?.message || "Failed to load activity feed",
    };
  }
};

export const fetchHomePageData = async (): Promise<
  ServiceResponse<HomePageData>
> => {
  try {
    const [statsResult, collaborationsResult, challengeResult, activityResult] =
      await Promise.all([
        getSystemStats(),
        collaborationService.getCollaborationsByStatus("recruiting", 3),
        getChallenges({
          status: [ChallengeStatus.ACTIVE],
          sortBy: ChallengeSortBy.END_DATE,
          sortOrder: "asc",
          limit: 1,
        }),
        getGlobalActivityFeed(DEFAULT_FEED_LIMIT),
      ]);

    const stats = buildHomeStats(statsResult.data);
    const collaborationHighlights = mapCollaborationHighlights(
      collaborationsResult.data
    );

    const challengeSpotlight = pickChallengeSpotlight(
      challengeResult?.challenges
    );

    const activity =
      activityResult.success && activityResult.data
        ? activityResult.data
        : [];

    return {
      success: true,
      data: {
        stats,
        collaborationHighlights,
        challengeSpotlight,
        activity,
      },
    };
  } catch (error: any) {
    console.error("Error assembling HomePage data:", error);
    return {
      success: false,
      error: error?.message || "Failed to load home data",
    };
  }
};

