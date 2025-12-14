import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../AuthContext";
import { useParams, useNavigate } from "react-router-dom";
import { getUserProfile } from "../../services/firestore-exports";
import { getEnvVar } from "../../config/env";
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
import {
  getFirebaseInstances,
  initializeFirebase,
} from "../../firebase-config";
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
import { ProfilePageSkeleton, TabContentSkeleton } from "./components/ProfilePageSkeleton";
import { ProfileShareMenu } from "./components/ProfileShareMenu";
import { ProfileTabs } from "./components/ProfileTabs";
import { AboutTab } from "./components/AboutTab";
import { CollaborationsTab } from "./components/CollaborationsTab";
import { TradesTab } from "./components/TradesTab";
import { useProfileData } from "./hooks/useProfileData";
import { useCollaborationsData } from "./hooks/useCollaborationsData";
import { useTradesData } from "./hooks/useTradesData";
import { useTabNavigation } from "./hooks/useTabNavigation";
import { useModalState } from "./hooks/useModalState";

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

  // Use custom hook for tab navigation
  const { activeTab, setActiveTab, handleTabChange } = useTabNavigation();

  const tabRefs = React.useRef<Record<TabType, HTMLButtonElement | null>>({
    about: null,
    portfolio: null,
    gamification: null,
    collaborations: null,
    trades: null,
  });

  const suppressSpyRef = React.useRef(false);
  const [isBioExpanded, setIsBioExpanded] = useState(false);

  // Use custom hook for modal state management
  const {
    isEditOpen,
    setIsEditOpen,
    openEditModal,
    closeEditModal,
    showShareMenu,
    setShowShareMenu,
    closeShareMenu,
    toggleShareMenu,
  } = useModalState();

  const collabSentinelRef = React.useRef<HTMLDivElement | null>(null);
  const tradesSentinelRef = React.useRef<HTMLDivElement | null>(null);
  const collabScrollBusyRef = React.useRef<boolean>(false);
  const tradesScrollBusyRef = React.useRef<boolean>(false);
  const shareButtonRef = useRef<HTMLButtonElement | null>(null);

  // Feature flag to control role enrichment reads
  const ENABLE_ROLE_ENRICHMENT: boolean = getEnvVar('VITE_PROFILE_ENRICH_ROLES', 'true') !== "false";
  const [roleEnrichmentEnabled, setRoleEnrichmentEnabled] = useState<boolean>(
    ENABLE_ROLE_ENRICHMENT
  );

  // Use prop userId if provided, otherwise use URL param
  const userId = propUserId || paramUserId;

  // Determine if this is the user's own profile
  const isOwnProfile = !userId || userId === currentUser?.uid;
  const targetUserId = userId || currentUser?.uid;

  // Use custom hook for profile data fetching
  const {
    userProfile,
    loading,
    stats,
    repScore,
    reviewsPreview,
    reviewsLoading,
    reviewsMeta,
    mutualFollows,
    setUserProfile,
    setMutualFollows,
  } = useProfileData(targetUserId, currentUser, isOwnProfile);

  // Use custom hook for collaborations data fetching
  const {
    collaborations,
    collaborationsLoading,
    collabVisibleCount,
    setCollabVisibleCount,
    collabFilter,
    setCollabFilter,
    userRoleByCollabId,
    setUserRoleByCollabId,
    isLoadingMoreCollabs,
    setIsLoadingMoreCollabs,
    filteredCollaborations,
  } = useCollaborationsData(
    targetUserId,
    activeTab,
    roleEnrichmentEnabled,
    showToast
  );

  // Use custom hook for trades data fetching
  const {
    trades,
    tradesLoading,
    tradesVisibleCount,
    setTradesVisibleCount,
    tradeFilter,
    setTradeFilter,
    isLoadingMoreTrades,
    setIsLoadingMoreTrades,
    filteredTrades,
  } = useTradesData(targetUserId, activeTab, showToast);

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
  const handleCopyProfileLink = useCallback(async () => {
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
  }, [targetUserId, userProfile, showToast]);

  // Inline banner edit handlers
  const handleBannerChange = useCallback(
    async (data: BannerData) => {
      if (!targetUserId) return;
      try {
        const res = await userService.updateUser(targetUserId, {
          banner: data,
        });
        if ((res as any)?.error) throw new Error((res as any).error);
        setUserProfile((prev) =>
          prev ? ({ ...prev, banner: data } as UserProfile) : prev
        );
        showToast("Banner updated", "success");
      } catch {
        showToast("Failed to update banner", "error");
      }
    },
    [targetUserId, showToast]
  );

  // Helpers
  const formatWebsiteLabel = useCallback((raw?: string | null): string => {
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
  }, []);

  const handleBannerRemove = useCallback(async () => {
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
  }, [targetUserId, showToast]);

  // Trades data is now fetched via useTradesData hook

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
          setCollabVisibleCount(
            Math.min(collabVisibleCount + 6, filteredCollaborations.length)
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
  }, [activeTab, collabVisibleCount, filteredCollaborations.length]);

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
          setTradesVisibleCount(
            Math.min(tradesVisibleCount + 6, filteredTrades.length)
          );
          setTimeout(() => {
            tradesScrollBusyRef.current = false;
          }, 200);
        }
      },
      { root: null, threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [activeTab, tradesVisibleCount, filteredTrades.length]);

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

  // Focus management: Move focus to tab panel when tab changes
  useEffect(() => {
    const panelId = `panel-${activeTab}`;
    const panel = document.getElementById(panelId);
    if (panel) {
      // Set tabindex to allow focus
      if (!panel.hasAttribute("tabindex")) {
        panel.setAttribute("tabindex", "-1");
      }
      // Announce tab change to screen readers
      const tabLabel = tabs.find((t) => t.id === activeTab)?.label || activeTab;
      const announcement = document.createElement("div");
      announcement.setAttribute("role", "status");
      announcement.setAttribute("aria-live", "polite");
      announcement.setAttribute("aria-atomic", "true");
      announcement.className = "sr-only";
      announcement.textContent = `${tabLabel} tab activated`;
      document.body.appendChild(announcement);
      setTimeout(() => announcement.remove(), 1000);
    }
  }, [activeTab, tabs]);

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

  // Tab navigation is now handled by useTabNavigation hook

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
      <>
        <PerformanceMonitor pageName="ProfilePage" />
        <ProfilePageSkeleton />
      </>
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
                  onClick={openEditModal}
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
          onEditClick={openEditModal}
          onShareClick={toggleShareMenu}
          onCopyLink={handleCopyProfileLink}
          onTabChange={handleTabChange}
        />

        {/* Tab Navigation */}
        <ProfileTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
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
                <AboutTab userProfile={{ ...userProfile, id: targetUserId! }} />
              </Box>
            )}

            {activeTab === "portfolio" && targetUserId && (
              <Box
                id="panel-portfolio"
                role="tabpanel"
                aria-labelledby="portfolio"
              >
                <React.Suspense fallback={<TabContentSkeleton type="grid" />}>
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
                <React.Suspense fallback={<TabContentSkeleton type="stats" />}>
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
                      setCollabVisibleCount(collabVisibleCount + 6);
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
                      setTradesVisibleCount(tradesVisibleCount + 6);
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
          onClose={closeEditModal}
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
          onClose={closeShareMenu}
          shareButtonRef={shareButtonRef}
          targetUserId={targetUserId!}
          userProfile={userProfile}
        />
      </Stack>
    </Box>
  );
};

export default ProfilePage;
