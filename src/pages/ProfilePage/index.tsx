import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../AuthContext";
import { useParams, useNavigate } from "react-router-dom";
import { getUserProfile } from "../../services/firestore-exports";
// Portfolio tab will be lazy-loaded for performance
// Lazy-load heavy components
const ReactLazy = React.lazy;
import {
  User,
  Trophy,
  Settings,
  Hash,
  Globe,
  MapPin,
  MessageSquare,
  UserPlus,
  Edit3,
  Share2,
  Save,
  X,
  Check,
  Star,
  TrendingUp,
  Activity,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import ReputationBadge from "../../components/ui/ReputationBadge";
import { Tooltip } from "../../components/ui/Tooltip";
import { getDashboardStats } from "../../services/dashboard";
import { getUserSocialStats } from "../../services/leaderboards";
import { getRelatedUserIds, getUsersByIds } from "../../services/firestore";
import {
  UserSocialStats,
  SocialFeatures,
} from "../../components/features/SocialFeatures";
import { ProfileImage } from "../../components/ui/ProfileImage";
import { ProfileBanner } from "../../components/ui/ProfileBanner";
import type { BannerData } from "../../utils/imageUtils";
import { StreakWidgetCompact } from "../../components/features/StreakWidgetCompact";
import StatChip from "../../components/ui/StatChip";
import { SimpleModal } from "../../components/ui/SimpleModal";
import { userService } from "../../services/entities/UserService";
import { useToast } from "../../contexts/ToastContext";
import {
  uploadProfileImage,
  uploadImage,
} from "../../services/cloudinary/cloudinaryService";
import { collaborationService } from "../../services/entities/CollaborationService";
import { tradeService } from "../../services/entities/TradeService";
import { getUserReviews } from "../../services/firestore-exports";
import { logEvent } from "../../services/analytics";
import { collection, getDocs, query, where } from "firebase/firestore";
import { getFirebaseInstances, initializeFirebase } from "../../firebase-config";
import Box from "../../components/layout/primitives/Box";
import Stack from "../../components/layout/primitives/Stack";
import Cluster from "../../components/layout/primitives/Cluster";
import Grid from "../../components/layout/primitives/Grid";
// HomePage patterns imports
import PerformanceMonitor from "../../components/ui/PerformanceMonitor";
import AnimatedHeading from "../../components/ui/AnimatedHeading";
import GradientMeshBackground from "../../components/ui/GradientMeshBackground";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
} from "../../components/ui/Card";
import { classPatterns, animations } from "../../utils/designSystem";
import { semanticClasses } from "../../utils/semanticColors";
import { motion } from "framer-motion";
import { ProfileHeader } from "./components/ProfileHeader";
import { ProfileEditModal } from "./components/ProfileEditModal";
import { ProfileShareMenu } from "./components/ProfileShareMenu";
import { ProfileTabs } from "./components/ProfileTabs";
import { AboutTab } from "./components/AboutTab";
import { CollaborationsTab } from "./components/CollaborationsTab";
import { TradesTab } from "./components/TradesTab";

type TabType =
  | "about"
  | "portfolio"
  | "gamification"
  | "collaborations"
  | "trades";

interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  handle?: string;
  verified?: boolean;
  handlePrivate?: boolean;
  tagline?: string;
  photoURL?: string;
  bio?: string;
  skills?: string[];
  location?: string;
  website?: string;
  metadata?: {
    creationTime?: string;
    lastSignInTime?: string;
  };
  profilePicture?: string; // Added for consistency with ProfileImage component
  banner?: BannerData | string | null;
}

interface ProfilePageProps {
  userId?: string; // Optional prop for when used in modals
}

const ProfilePage: React.FC<ProfilePageProps> = ({ userId: propUserId }) => {
  const { currentUser } = useAuth();
  const { userId: paramUserId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>("about");
  const tabRefs = React.useRef<Record<TabType, HTMLButtonElement | null>>({
    about: null,
    portfolio: null,
    gamification: null,
    collaborations: null,
    trades: null,
  });

  // no navigation needed in this component
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    totalTrades: number;
    tradesThisWeek: number;
    currentXP?: number;
  } | null>(null);
  const [repScore, setRepScore] = useState<number | null>(null);
  const [reviewsPreview, setReviewsPreview] = useState<
    Array<{ rating: number; comment: string }>
  >([]);
  const [reviewsLoading, setReviewsLoading] = useState<boolean>(false);
  const [reviewsMeta, setReviewsMeta] = useState<{
    avg: number;
    count: number;
  } | null>(null);
  const [mutualFollows, setMutualFollows] = useState<{
    count: number;
    names: string[];
  }>({ count: 0, names: [] });
  const suppressSpyRef = React.useRef(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isBioExpanded, setIsBioExpanded] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [collaborations, setCollaborations] = useState<any[] | null>(null);
  const [collaborationsLoading, setCollaborationsLoading] = useState(false);
  const [trades, setTrades] = useState<any[] | null>(null);
  const [tradesLoading, setTradesLoading] = useState(false);
  const [collabVisibleCount, setCollabVisibleCount] = useState(6);
  const [tradesVisibleCount, setTradesVisibleCount] = useState(6);
  const [userRoleByCollabId, setUserRoleByCollabId] = useState<
    Record<string, string>
  >({});
  const [isLoadingMoreCollabs, setIsLoadingMoreCollabs] = useState(false);
  const [isLoadingMoreTrades, setIsLoadingMoreTrades] = useState(false);
  const [collabFilter, setCollabFilter] = useState<"all" | "yours">("all");
  const [tradeFilter, setTradeFilter] = useState<"all" | "yours">("all");
  const collabSentinelRef = React.useRef<HTMLDivElement | null>(null);
  const tradesSentinelRef = React.useRef<HTMLDivElement | null>(null);
  const collabScrollBusyRef = React.useRef<boolean>(false);
  const tradesScrollBusyRef = React.useRef<boolean>(false);
  const shareButtonRef = useRef<HTMLButtonElement | null>(null);

  // Feature flag to control role enrichment reads
  const viteEnv: any =
    (typeof import.meta !== "undefined" && (import.meta as any).env) || {};
  const ENABLE_ROLE_ENRICHMENT: boolean =
    viteEnv.VITE_PROFILE_ENRICH_ROLES !== "false";
  const [roleEnrichmentEnabled, setRoleEnrichmentEnabled] = useState<boolean>(
    ENABLE_ROLE_ENRICHMENT
  );

  // Use prop userId if provided, otherwise use URL param
  const userId = propUserId || paramUserId;

  // Determine if this is the user's own profile
  const isOwnProfile = !userId || userId === currentUser?.uid;
  const targetUserId = userId || currentUser?.uid;

  // Note: Banner FX settings currently persist in localStorage client-side.
  useEffect(() => {
    const loadUserProfile = async () => {
      setLoading(true);
      try {
        if (targetUserId) {
          // Always fetch Firestore profile data to get Cloudinary profilePicture
          const { data: profile, error } = await getUserProfile(targetUserId);
          if (error) {
            console.error("Error loading user profile:", error);
            // Fallback to Firebase Auth data for own profile if Firestore fetch fails
            if (isOwnProfile && currentUser) {
              setUserProfile({
                uid: currentUser.uid,
                email: currentUser.email || "",
                displayName: currentUser.displayName || undefined,
                photoURL: currentUser.photoURL || undefined,
                metadata: {
                  creationTime: currentUser.metadata.creationTime,
                  lastSignInTime: currentUser.metadata.lastSignInTime,
                },
              });
            }
          } else if (profile) {
            // Merge Firestore data with Firebase Auth metadata for own profile
            if (isOwnProfile && currentUser) {
              setUserProfile({
                ...profile,
                metadata: {
                  creationTime: currentUser.metadata.creationTime,
                  lastSignInTime: currentUser.metadata.lastSignInTime,
                },
              } as UserProfile);
            } else {
              setUserProfile(profile as UserProfile);
            }
            // Stats are deferred via IntersectionObserver
          }
        }
      } catch (error) {
        console.error("Error loading user profile:", error);
        // Fallback to Firebase Auth data for own profile if there's an error
        if (isOwnProfile && currentUser) {
          setUserProfile({
            uid: currentUser.uid,
            email: currentUser.email || "",
            displayName: currentUser.displayName || undefined,
            photoURL: currentUser.photoURL || undefined,
            metadata: {
              creationTime: currentUser.metadata.creationTime,
              lastSignInTime: currentUser.metadata.lastSignInTime,
            },
          });
        }
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [userId, currentUser, isOwnProfile, targetUserId]);

  // Keep edit form in sync when profile loads
  // Fetch stats when component mounts or targetUserId changes
  useEffect(() => {
    if (!targetUserId) return;
    if (stats && repScore !== null) return; // Don't refetch if we already have data

    (async () => {
      try {
        setReviewsLoading(true);
        // Fetch stats and social stats (skip reviews if permissions error)
        const [statsResult, socialResult] = await Promise.all([
          getDashboardStats(targetUserId),
          getUserSocialStats(targetUserId),
        ]);

        // Try to get reviews, but don't fail if there's a permissions error
        let reviewsResult: any = null;
        try {
          reviewsResult = await getUserReviews(targetUserId);
        } catch (error) {
          console.warn("Could not fetch reviews (permissions):", error);
        }

        if ((statsResult as any)?.data) {
          const data = (statsResult as any).data;
          setStats({
            totalTrades: data.totalTrades,
            tradesThisWeek: data.tradesThisWeek,
            currentXP: data.currentXP,
          });

          // Get actual follower count from userFollows collection for accurate reputation
          let actualFollowersCount = 0;
          try {
            const db = (await import("../../firebase-config")).db;
            if (db) {
              const { collection, query, where, getDocs } = await import(
                "firebase/firestore"
              );
              const followsQuery = query(
                collection(db, "userFollows"),
                where("followingId", "==", targetUserId)
              );
              const followsSnapshot = await getDocs(followsQuery);
              actualFollowersCount = followsSnapshot.size;
            } else {
              actualFollowersCount =
                (socialResult as any)?.data?.followersCount || 0;
            }
          } catch (error) {
            console.warn(
              "Could not fetch actual follower count, using socialStats:",
              error
            );
            actualFollowersCount =
              (socialResult as any)?.data?.followersCount || 0;
          }

          // Composite reputation: XP (50%), trades (30%), followers (20%)
          const xpNorm = Math.min(1, Number(data.currentXP || 0) / 5000);
          const tradesNorm = Math.min(1, Number(data.totalTrades || 0) / 100);
          const followersNorm = Math.min(1, actualFollowersCount / 1000);
          const composite = Math.round(
            100 * (0.5 * xpNorm + 0.3 * tradesNorm + 0.2 * followersNorm)
          );
          setRepScore(composite);
        }
        if (
          reviewsResult &&
          (reviewsResult as any)?.data &&
          Array.isArray((reviewsResult as any).data)
        ) {
          const all = (reviewsResult as any).data as Array<any>;
          const count = all.length;
          const avg =
            count > 0
              ? all.reduce((sum, r) => sum + Number(r.rating || 0), 0) / count
              : 0;
          setReviewsMeta({ avg, count });
          const list = all.slice(0, 2).map((r) => ({
            rating: Number(r.rating || 0),
            comment: String(r.comment || ""),
          }));
          setReviewsPreview(list);
        }
      } catch (error) {
        console.error("Error fetching profile stats:", error);
      } finally {
        setReviewsLoading(false);
      }
    })();
  }, [targetUserId, stats, repScore]);

  const completenessPercent = React.useMemo(() => {
    if (!userProfile) return 0;
    let score = 0;
    const weights = 20; // five items * 20 = 100
    if (userProfile.photoURL || userProfile.profilePicture) score += weights;
    if (userProfile.bio && userProfile.bio.trim().length >= 20)
      score += weights;
    if (Array.isArray(userProfile.skills) && userProfile.skills.length > 0)
      score += weights;
    if (userProfile.location) score += weights;
    if (userProfile.website) score += weights;
    return score;
  }, [userProfile]);

  const missingFields = React.useMemo(() => {
    if (!userProfile) return [] as string[];
    const fields: string[] = [];
    if (!(userProfile.photoURL || userProfile.profilePicture))
      fields.push("photo");
    if (!(userProfile.bio && userProfile.bio.trim().length >= 20))
      fields.push("bio");
    if (!(Array.isArray(userProfile.skills) && userProfile.skills.length > 0))
      fields.push("skills");
    if (!userProfile.location) fields.push("location");
    if (!userProfile.website) fields.push("website");
    return fields;
  }, [userProfile]);



  // Handler for copying link from ProfileHeader component
  const handleCopyProfileLink = async () => {
    if (!targetUserId || !userProfile) return;
    const path =
      userProfile.handle && !userProfile.handlePrivate
        ? `/u/${userProfile.handle}`
        : `/profile/${targetUserId}`;
    const url = `${window.location.origin}${path}`;
    await navigator.clipboard.writeText(url);
    showToast("Profile link copied", "success");
    await logEvent("profile_share", {
      userId: targetUserId,
      hasHandle: true,
      method: "clipboard",
      context: "header",
    });
  };



  // Inline banner edit handlers
  const handleBannerChange = async (data: BannerData) => {
    if (!targetUserId) return;
    try {
      const res = await userService.updateUser(targetUserId, { banner: data });
      if ((res as any)?.error) throw new Error((res as any).error);
      setUserProfile((prev) =>
        prev ? ({ ...prev, banner: data } as UserProfile) : prev
      );
      showToast("Banner updated", "success");
    } catch {
      showToast("Failed to update banner", "error");
    }
  };

  // Helpers
  const formatWebsiteLabel = (raw?: string | null): string => {
    if (!raw) return "";
    try {
      const url = raw.startsWith("http")
        ? new URL(raw)
        : new URL(`https://${raw}`);
      // Remove leading www.
      return url.host.replace(/^www\./, "");
    } catch {
      return raw.replace(/^https?:\/\//, "").replace(/\/$/, "");
    }
  };

  const handleBannerRemove = async () => {
    if (!targetUserId) return;
    try {
      const res = await userService.updateUser(targetUserId, { banner: null });
      if ((res as any)?.error) throw new Error((res as any).error);
      setUserProfile((prev) =>
        prev ? ({ ...prev, banner: undefined } as UserProfile) : prev
      );
      showToast("Banner removed", "success");
    } catch {
      showToast("Failed to remove banner", "error");
    }
  };

  // Lazy fetch for collaborations and trades when tabs are activated
  useEffect(() => {
    if (!targetUserId) return;
    if (
      activeTab === "collaborations" &&
      collaborations === null &&
      !collaborationsLoading
    ) {
      setCollaborationsLoading(true);
      collaborationService
        .getCollaborationsForUser(targetUserId)
        .then((res) => {
          if (res.error) {
            showToast(
              res.error.message || "Failed to load collaborations",
              "error"
            );
            setCollaborations([]);
          } else {
            setCollaborations(res.data || []);
          }
        })
        .catch(() => setCollaborations([]))
        .finally(() => setCollaborationsLoading(false));
    } else if (activeTab === "trades" && trades === null && !tradesLoading) {
      setTradesLoading(true);
      tradeService
        .getActiveTradesForUser(targetUserId)
        .then((res) => {
          if (res.error) {
            showToast(res.error.message || "Failed to load trades", "error");
            setTrades([]);
          } else {
            setTrades(res.data || []);
          }
        })
        .catch(() => setTrades([]))
        .finally(() => setTradesLoading(false));
    }
  }, [activeTab, targetUserId, collaborationsLoading, tradesLoading]);

  // Enrich collaborations with specific user role title from roles subcollection if available
  useEffect(() => {
    if (!roleEnrichmentEnabled) return;
    if (!targetUserId || !collaborations || collaborations.length === 0) return;
    let isCancelled = false;
    (async () => {
      try {
        await initializeFirebase();
        const { db } = await getFirebaseInstances();
        if (!db || isCancelled) return;
        const roleMap: Record<string, string> = {};
        // Fetch roles for currently visible set first to avoid excessive reads
        const slice = collaborations.slice(0, collabVisibleCount);
        for (const c of slice) {
          // Skip if we already have a cached role for this collaboration
          if (userRoleByCollabId[c.id]) continue;
          try {
            const rolesRef = collection(db, "collaborations", c.id, "roles");
            const q = query(
              rolesRef,
              where("participantId", "==", targetUserId)
            );
            const snap = await getDocs(q);
            const first = snap.docs[0]?.data() as any | undefined;
            if (first?.title) {
              roleMap[c.id] = String(first.title);
            }
          } catch {
            // ignore per-collaboration role fetch errors
          }
        }
        if (!isCancelled && Object.keys(roleMap).length > 0) {
          setUserRoleByCollabId((prev) => ({ ...prev, ...roleMap }));
        }
      } catch {
        // ignore batch errors
      }
    })();
    return () => {
      isCancelled = true;
    };
  }, [
    targetUserId,
    collaborations,
    collabVisibleCount,
    roleEnrichmentEnabled,
    userRoleByCollabId,
  ]);

  // Filter helpers
  const filteredCollaborations = React.useMemo(() => {
    if (!collaborations) return [] as any[];
    if (collabFilter === "yours") {
      return collaborations.filter(
        (c) =>
          c?.creatorId === targetUserId ||
          (Array.isArray(c?.participants) &&
            c.participants.includes(targetUserId))
      );
    }
    return collaborations;
  }, [collaborations, collabFilter, targetUserId]);

  const filteredTrades = React.useMemo(() => {
    if (!trades) return [] as any[];
    if (tradeFilter === "yours") {
      return trades.filter(
        (t) =>
          t?.creatorId === targetUserId || t?.participantId === targetUserId
      );
    }
    return trades;
  }, [trades, tradeFilter, targetUserId]);

  // Infinite scroll for collaborations
  useEffect(() => {
    if (activeTab !== "collaborations") return;
    const sentinel = collabSentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !collabScrollBusyRef.current) {
          collabScrollBusyRef.current = true;
          setCollabVisibleCount((n) =>
            Math.min(n + 6, filteredCollaborations.length)
          );
          setTimeout(() => {
            collabScrollBusyRef.current = false;
          }, 200);
        }
      },
      { root: null, threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [activeTab]);

  // Infinite scroll for trades
  useEffect(() => {
    if (activeTab !== "trades") return;
    const sentinel = tradesSentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !tradesScrollBusyRef.current) {
          tradesScrollBusyRef.current = true;
          setTradesVisibleCount((n) => Math.min(n + 6, filteredTrades.length));
          setTimeout(() => {
            tradesScrollBusyRef.current = false;
          }, 200);
        }
      },
      { root: null, threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [activeTab]);

  // Scrollspy: update active tab while scrolling
  useEffect(() => {
    const panels: { id: TabType; el: HTMLElement | null }[] = [
      {
        id: "about",
        el: document.getElementById("panel-about") as HTMLElement | null,
      },
      {
        id: "portfolio",
        el: document.getElementById("panel-portfolio") as HTMLElement | null,
      },
      {
        id: "gamification",
        el: document.getElementById("panel-gamification") as HTMLElement | null,
      },
      {
        id: "collaborations",
        el: document.getElementById(
          "panel-collaborations"
        ) as HTMLElement | null,
      },
      {
        id: "trades",
        el: document.getElementById("panel-trades") as HTMLElement | null,
      },
    ];
    const valid = panels.filter((p) => !!p.el) as {
      id: TabType;
      el: HTMLElement;
    }[];
    if (valid.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (suppressSpyRef.current) return;
        // Pick the entry with highest intersection ratio
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const targetId = valid.find((p) => p.el === visible.target)?.id;
        if (targetId && targetId !== activeTab) {
          setActiveTab(targetId);
        }
      },
      { root: null, threshold: [0.5, 0.75] }
    );

    valid.forEach((p) => observer.observe(p.el));
    return () => observer.disconnect();
  }, [activeTab]);

  const tabs: {
    id: TabType;
    label: string;
    icon?: React.ReactNode;
    onHover?: () => void;
  }[] = [
    { id: "about", label: "About", icon: <User className="w-4 h-4" /> },
    {
      id: "portfolio",
      label: "Portfolio",
      onHover: () => {
        import("../../components/features/portfolio/PortfolioTab");
      },
    },
    {
      id: "gamification",
      label: "Progress",
      icon: <Trophy className="w-4 h-4" />,
      onHover: () => {
        // Prefetch gamification bundle on hover for faster tab switch
        import("../../components/gamification");
      },
    },
    { id: "collaborations", label: "Collaborations" },
    { id: "trades", label: "Trades" },
  ];

  // Define lazy components
  const GamificationDashboardLazy = ReactLazy(() =>
    import("../../components/gamification").then((m) => ({
      default: m.GamificationDashboard,
    }))
  );
  const NotificationPreferencesLazy = ReactLazy(() =>
    import("../../components/gamification").then((m) => ({
      default: m.NotificationPreferences,
    }))
  );
  const PortfolioTabLazy = ReactLazy(() =>
    import("../../components/features/portfolio/PortfolioTab").then((m) => ({
      default: m.PortfolioTab,
    }))
  );



  // Deep-link support for tabs (#about, #portfolio, #progress, #collaborations, #trades)
  useEffect(() => {
    const hash = (window.location.hash || "").replace("#", "");
    const valid = [
      "about",
      "portfolio",
      "gamification",
      "collaborations",
      "trades",
    ] as TabType[];
    if (valid.includes(hash as TabType)) {
      setActiveTab(hash as TabType);
      // Scroll to the panel for a11y
      const panel = document.getElementById(`panel-${hash}`);
      panel?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      // Fallback to last tab from localStorage
      try {
        const last = localStorage.getItem(
          "tradeya_profile_last_tab"
        ) as TabType | null;
        if (last && valid.includes(last)) setActiveTab(last);
      } catch {}
    }
    const onHashChange = () => {
      const h = (window.location.hash || "").replace("#", "");
      if (valid.includes(h as TabType)) setActiveTab(h as TabType);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);



  // Mutual followers snippet for non-owners
  useEffect(() => {
    (async () => {
      if (!currentUser || isOwnProfile || !targetUserId) return;
      try {
        const [iFollowRes, theyFollowersRes] = await Promise.all([
          getRelatedUserIds(currentUser.uid, "following"),
          getRelatedUserIds(targetUserId, "followers"),
        ]);
        const iFollow = (iFollowRes.data?.ids || []) as string[];
        const theirFollowers = (theyFollowersRes.data?.ids || []) as string[];
        if (!iFollow.length || !theirFollowers.length) return;
        const intersect = iFollow.filter((id) => theirFollowers.includes(id));
        const count = intersect.length;
        let names: string[] = [];
        if (count > 0) {
          const usersRes = await getUsersByIds(intersect.slice(0, 2));
          names = (usersRes.data || []).map((u) => u.displayName || "User");
        }
        setMutualFollows({ count, names });
      } catch {
        // ignore
      }
    })();
  }, [currentUser, isOwnProfile, targetUserId]);

  // Optional small count badges on tabs
  const getTabCount = (id: TabType): number | undefined => {
    switch (id) {
      case "collaborations":
        return Array.isArray(collaborations)
          ? collaborations.length
          : undefined;
      case "trades":
        return Array.isArray(trades) ? trades.length : undefined;
      case "portfolio":
        return undefined; // handled inside tab
      default:
        return undefined;
    }
  };

  if (loading) {
    return (
      <Box className={classPatterns.homepageContainer}>
        <PerformanceMonitor pageName="ProfilePage" />
        <div className="animate-pulse">
          <div className="glassmorphic border-glass backdrop-blur-xl bg-white/10 h-48 rounded-xl mb-6" />
          <div className="glassmorphic border-glass backdrop-blur-xl bg-white/10 rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-full glassmorphic border-glass backdrop-blur-xl bg-white/10" />
              <div className="flex-1">
                <div className="h-6 w-56 glassmorphic border-glass backdrop-blur-xl bg-white/10 rounded mb-2" />
                <div className="h-4 w-72 glassmorphic border-glass backdrop-blur-xl bg-white/10 rounded" />
              </div>
            </div>
          </div>
        </div>
      </Box>
    );
  }

  if (!userProfile) {
    return (
      <Box className={classPatterns.homepageContainer}>
        <PerformanceMonitor pageName="ProfilePage" />
        <Card variant="glass" className="text-center p-12">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-foreground">
              User Not Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              The requested user profile could not be found.
            </p>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box className={classPatterns.homepageContainer}>
      <PerformanceMonitor pageName="ProfilePage" />
      <Stack gap="md">
        {/* Banner */}
        <ProfileBanner
          height="md"
          bannerUrl={userProfile.banner as any}
          isEditable={isOwnProfile}
          onBannerChange={handleBannerChange}
          onBannerRemove={handleBannerRemove}
          enableFxOverlay={(userProfile as any)?.bannerFx?.enable ?? true}
          fxPreset={(userProfile as any)?.bannerFx?.preset ?? "ribbons"}
          fxOpacity={(userProfile as any)?.bannerFx?.opacity ?? 0.24}
          fxBlendMode={
            (userProfile as any)?.bannerFx?.blendMode ?? ("overlay" as any)
          }
          onFxSettingsApply={async (fx) => {
            if (!isOwnProfile || !targetUserId) return;
            try {
              const res = await userService.updateUser(targetUserId, {
                bannerFx: fx,
              } as any);
              if ((res as any)?.error) throw new Error((res as any).error);
              setUserProfile((prev) =>
                prev ? ({ ...prev, bannerFx: fx } as any) : prev
              );
              showToast("Banner FX saved", "success");
            } catch {
              showToast("Failed to save banner FX", "error");
            }
          }}
        />

        {/* Profile completeness banner (own profile) */}
        {isOwnProfile && completenessPercent < 100 && (
          <Card
            variant="glass"
            className="border-amber-200/20 bg-amber-50/5 dark:bg-amber-950/5"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    Complete your profile
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {completenessPercent}% complete • Add{" "}
                    {(() => {
                      const display = missingFields.slice(0, 3).join(", ");
                      const remaining = Math.max(0, missingFields.length - 3);
                      return remaining > 0
                        ? `${display} and ${remaining} more`
                        : display;
                    })()}
                  </p>
                  <div className="mt-2 h-2 w-full rounded glassmorphic border-glass backdrop-blur-xl bg-white/10">
                    <div
                      className="h-2 rounded bg-primary"
                      style={{ width: `${completenessPercent}%` }}
                    />
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="shrink-0"
                  onClick={() => setIsEditOpen(true)}
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Complete now
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Profile Header */}
        <ProfileHeader
          profile={{ ...userProfile, id: targetUserId! }}
          isOwnProfile={isOwnProfile}
          targetUserId={targetUserId!}
          stats={stats}
          repScore={repScore}
          reviewsPreview={reviewsPreview}
          reviewsLoading={reviewsLoading}
          reviewsMeta={reviewsMeta}
          mutualFollows={mutualFollows}
          shareButtonRef={shareButtonRef}
          onEditClick={() => setIsEditOpen(true)}
          onShareClick={() => setShowShareMenu(!showShareMenu)}
          onCopyLink={handleCopyProfileLink}
          onTabChange={setActiveTab}
        />

        {/* Tab Navigation */}
        <ProfileTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          tabRefs={tabRefs}
          tabs={tabs}
          getTabCount={getTabCount}
        />

        {/* Tab Content */}
        <Card
          variant="glass"
          className="rounded-lg shadow-sm border border-border"
        >
          <CardContent className="p-4 sm:p-6">
            {activeTab === "about" && userProfile && (
              <Box id="panel-about" role="tabpanel" aria-labelledby="about">
                <AboutTab
                  userProfile={{ ...userProfile, id: targetUserId! }}
                />
              </Box>
            )}

            {activeTab === "portfolio" && targetUserId && (
              <Box
                id="panel-portfolio"
                role="tabpanel"
                aria-labelledby="portfolio"
              >
                <React.Suspense
                  fallback={
                    <>
                      <div
                        id="profile-portfolio-list"
                        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4"
                      >
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div
                            key={i}
                            className="rounded-lg border border-border p-4"
                          >
                            <div className="h-32 bg-muted rounded animate-pulse mb-3" />
                            <div className="h-4 w-3/4 bg-muted rounded animate-pulse mb-2" />
                            <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
                          </div>
                        ))}
                      </div>
                      <div className="text-center py-6">
                        <p className="text-sm text-muted-foreground">
                          Loading portfolio…
                        </p>
                      </div>
                    </>
                  }
                >
                  <PortfolioTabLazy
                    userId={targetUserId}
                    isOwnProfile={isOwnProfile}
                  />
                </React.Suspense>
              </Box>
            )}

            {activeTab === "gamification" && targetUserId && (
              <div
                id="panel-gamification"
                role="tabpanel"
                aria-labelledby="gamification"
                className="w-full"
              >
                <React.Suspense
                  fallback={
                    <div className="animate-pulse space-y-4">
                      <div className="h-6 w-40 bg-muted rounded" />
                      <div className="h-32 bg-muted rounded" />
                    </div>
                  }
                >
                  <div className="w-full space-y-6">
                    <GamificationDashboardLazy userId={targetUserId} />
                    {isOwnProfile && (
                      <div className="border-t border-border pt-6">
                        <div className="flex items-center gap-2 mb-6">
                          <Settings className="w-5 h-5 text-muted-foreground" />
                          <h3 className="text-lg font-semibold text-foreground">
                            Notification Settings
                          </h3>
                        </div>
                        <NotificationPreferencesLazy />
                      </div>
                    )}
                  </div>
                </React.Suspense>
              </div>
            )}

            {activeTab === "collaborations" && (
              <Box
                id="panel-collaborations"
                role="tabpanel"
                aria-labelledby="collaborations"
                className="py-6"
              >
                <CollaborationsTab
                  collaborations={collaborations}
                  collaborationsLoading={collaborationsLoading}
                  filteredCollaborations={filteredCollaborations}
                  userRoleByCollabId={userRoleByCollabId}
                  targetUserId={targetUserId!}
                  collabVisibleCount={collabVisibleCount}
                  onLoadMore={() => {
                    setIsLoadingMoreCollabs(true);
                    setTimeout(() => {
                      setCollabVisibleCount((n) => n + 6);
                      setIsLoadingMoreCollabs(false);
                    }, 150);
                  }}
                  isLoadingMore={isLoadingMoreCollabs}
                  collabFilter={collabFilter}
                  onFilterChange={(filter) => {
                    setCollabFilter(filter);
                    setCollabVisibleCount(6);
                  }}
                  isOwnProfile={isOwnProfile}
                  onNavigate={navigate}
                  sentinelRef={collabSentinelRef}
                />
              </Box>
            )}

            {activeTab === "trades" && (
              <Box
                id="panel-trades"
                role="tabpanel"
                aria-labelledby="trades"
                className="py-6"
              >
                <TradesTab
                  trades={trades}
                  tradesLoading={tradesLoading}
                  filteredTrades={filteredTrades}
                  tradesVisibleCount={tradesVisibleCount}
                  onLoadMore={() => {
                    setIsLoadingMoreTrades(true);
                    setTimeout(() => {
                      setTradesVisibleCount((n) => n + 6);
                      setIsLoadingMoreTrades(false);
                    }, 150);
                  }}
                  isLoadingMore={isLoadingMoreTrades}
                  tradeFilter={tradeFilter}
                  onFilterChange={(filter) => {
                    setTradeFilter(filter);
                    setTradesVisibleCount(6);
                  }}
                  onNavigate={navigate}
                  sentinelRef={tradesSentinelRef}
                />
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Edit profile modal */}
        <ProfileEditModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          userProfile={
            userProfile ? { ...userProfile, id: targetUserId! } : null
          }
          targetUserId={targetUserId!}
          onSaveSuccess={(updates) => {
            setUserProfile((prev) =>
              prev ? ({ ...prev, ...updates } as UserProfile) : prev
            );
          }}
        />

        {/* Share Profile Menu */}
        <ProfileShareMenu
          isOpen={showShareMenu}
          onClose={() => setShowShareMenu(false)}
          shareButtonRef={shareButtonRef}
          targetUserId={targetUserId!}
          userProfile={userProfile}
        />
      </Stack>
    </Box>
  );
};

export default ProfilePage;
