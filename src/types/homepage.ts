import { Timestamp } from "firebase/firestore";

export type ActivityAccent = "green" | "blue" | "purple" | "orange";

export interface HomeStats {
  trades: {
    active: number;
    completed: number;
  };
  community: {
    activeUsers: number;
    skillsTraded: number;
    collaborations: number;
    lastUpdated?: Timestamp;
  };
}

export interface CollaborationHighlight {
  id: string;
  title: string;
  summary: string;
  openRoles: number;
  status: string;
  accent: ActivityAccent;
}

export interface ChallengeSpotlight {
  id: string;
  title: string;
  rewardSummary?: string;
  deadline?: Date;
  status: string;
}

export interface ActivityFeedItem {
  id: string;
  type: "trade" | "trade_completed" | "collaboration" | "challenge";
  description: string;
  timestamp: Date;
  accent: ActivityAccent;
}

export interface HomePageData {
  stats: HomeStats;
  collaborationHighlights: CollaborationHighlight[];
  challengeSpotlight?: ChallengeSpotlight;
  activity: ActivityFeedItem[];
}

