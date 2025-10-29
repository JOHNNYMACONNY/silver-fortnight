import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../AuthContext";
import { useParams, useNavigate } from "react-router-dom";
import { getUserProfile } from "../services/firestore-exports";
// Portfolio tab will be lazy-loaded for performance
// Lazy-load heavy components
const ReactLazy = React.lazy;
import {
  User,
  Trophy,
  Settings,
  Mail,
  Calendar,
  Hash,
  Globe,
  MapPin,
  MessageSquare,
  UserPlus,
  Edit3,
  Share2,
  Save,
  X,
  Copy as CopyIcon,
  Check,
  Star,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Activity,
  Link2,
  Twitter,
  Facebook,
  Linkedin,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import ReputationBadge from "../components/ui/ReputationBadge";
import { Tooltip } from "../components/ui/Tooltip";
import { getDashboardStats } from "../services/dashboard";
import { getUserSocialStats } from "../services/leaderboards";
import { getRelatedUserIds, getUsersByIds } from "../services/firestore";
import {
  UserSocialStats,
  SocialFeatures,
} from "../components/features/SocialFeatures";
import { ProfileImage } from "../components/ui/ProfileImage";
import { ProfileBanner } from "../components/ui/ProfileBanner";
import type { BannerData } from "../utils/imageUtils";
import { StreakWidgetCompact } from "../components/features/StreakWidgetCompact";
import StatChip from "../components/ui/StatChip";
import { SimpleModal } from "../components/ui/SimpleModal";
import { userService } from "../services/entities/UserService";
import { useToast } from "../contexts/ToastContext";
import {
  uploadProfileImage,
  uploadImage,
} from "../services/cloudinary/cloudinaryService";
import { collaborationService } from "../services/entities/CollaborationService";
import { tradeService } from "../services/entities/TradeService";
import { getUserReviews } from "../services/firestore-exports";
import { logEvent } from "../services/analytics";
import { CollaborationCard } from "../components/features/collaborations/CollaborationCard";
import TradeCard from "../components/features/trades/TradeCard";
import { collection, getDocs, query, where } from "firebase/firestore";
import { getFirebaseInstances, initializeFirebase } from "../firebase-config";
import Box from "../components/layout/primitives/Box";
import Stack from "../components/layout/primitives/Stack";
import Cluster from "../components/layout/primitives/Cluster";
import Grid from "../components/layout/primitives/Grid";
// HomePage patterns imports
import PerformanceMonitor from "../components/ui/PerformanceMonitor";
import AnimatedHeading from "../components/ui/AnimatedHeading";
import GradientMeshBackground from "../components/ui/GradientMeshBackground";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
} from "../components/ui/Card";
import { classPatterns, animations } from "../utils/designSystem";
import { semanticClasses } from "../utils/semanticColors";
import { motion } from "framer-motion";

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
  const tabScrollRef = React.useRef<HTMLDivElement | null>(null);
  const [tabHasOverflow, setTabHasOverflow] = useState(false);
  const [tabCanScrollLeft, setTabCanScrollLeft] = useState(false);
  const [tabCanScrollRight, setTabCanScrollRight] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const updateTabScrollState = React.useCallback(() => {
    const el = tabScrollRef.current;
    if (!el) return;
    const canLeft = el.scrollLeft > 0;
    const canRight = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
    setTabCanScrollLeft(canLeft);
    setTabCanScrollRight(canRight);
    setTabHasOverflow(el.scrollWidth > el.clientWidth + 1);
  }, []);
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
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: "",
    tagline: "",
    bio: "",
    website: "",
    location: "",
  });
  const [handleError, setHandleError] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [skillsInput, setSkillsInput] = useState("");
  const [skillsDraft, setSkillsDraft] = useState<string[]>([]);
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
  const [shareDropdownPosition, setShareDropdownPosition] = useState<{ top: number; left: number } | null>(null);

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
  useEffect(() => {
    if (!userProfile) return;
    setEditForm({
      displayName: userProfile.displayName || "",
      tagline: userProfile.tagline || "",
      // handle added later in form render; keep state in sync via separate input
      bio: userProfile.bio || "",
      website: userProfile.website || "",
      location: userProfile.location || "",
    });
    setSkillsDraft(
      Array.isArray(userProfile.skills) ? [...userProfile.skills] : []
    );
    setAvatarFile(null);
    setAvatarPreviewUrl(null);
    // Prefill handle from display name if empty and user has no handle yet
    try {
      const handleInput = document.getElementById(
        "edit-handle-input"
      ) as HTMLInputElement | null;
      if (handleInput && !userProfile.handle) {
        const src = (userProfile.displayName || "").toLowerCase();
        const guess = src.replace(/[^a-z0-9_]/g, "").slice(0, 20);
        handleInput.value = guess;
      }
    } catch {}
  }, [userProfile]);

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
          console.warn('Could not fetch reviews (permissions):', error);
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
            const db = (await import('../firebase-config')).db;
            const { collection, query, where, getDocs } = await import('firebase/firestore');
            const followsQuery = query(
              collection(db, 'userFollows'),
              where('followingId', '==', targetUserId)
            );
            const followsSnapshot = await getDocs(followsQuery);
            actualFollowersCount = followsSnapshot.size;
          } catch (error) {
            console.warn('Could not fetch actual follower count, using socialStats:', error);
            actualFollowersCount = (socialResult as any)?.data?.followersCount || 0;
          }
          
          // Composite reputation: XP (50%), trades (30%), followers (20%)
          const xpNorm = Math.min(1, Number(data.currentXP || 0) / 5000);
          const tradesNorm = Math.min(
            1,
            Number(data.totalTrades || 0) / 100
          );
          const followersNorm = Math.min(
            1,
            actualFollowersCount / 1000
          );
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
              ? all.reduce((sum, r) => sum + Number(r.rating || 0), 0) /
                count
              : 0;
          setReviewsMeta({ avg, count });
          const list = all.slice(0, 2).map((r) => ({
            rating: Number(r.rating || 0),
            comment: String(r.comment || ""),
          }));
          setReviewsPreview(list);
        }
      } catch (error) {
        console.error('Error fetching profile stats:', error);
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

  const getProfileUrl = () => {
    if (!targetUserId) return "";
    const path = userProfile?.handle
      ? `/u/${userProfile.handle}`
      : `/profile/${targetUserId}`;
    return `${window.location.origin}${path}`;
  };

  const handleShareProfile = async () => {
    if (!showShareMenu && shareButtonRef.current) {
      const rect = shareButtonRef.current.getBoundingClientRect();
      const dropdownWidth = 224; // w-56 = 14rem * 16px
      const dropdownHeight = 235; // Approximate height with 5 items
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      // Smart positioning: flip upward if not enough space below
      const shouldFlipUp = spaceBelow < dropdownHeight + 16 && spaceAbove > spaceBelow;
      
      setShareDropdownPosition({
        top: shouldFlipUp ? rect.top - dropdownHeight - 8 : rect.bottom + 8,
        left: Math.max(16, Math.min(rect.right - dropdownWidth, window.innerWidth - dropdownWidth - 16))
      });
    }
    setShowShareMenu(!showShareMenu);
  };

  const handleCopyLink = async () => {
    const url = getProfileUrl();
    try {
      await navigator.clipboard.writeText(url);
      showToast("Profile link copied!", "success");
      setShowShareMenu(false);
      await logEvent("profile_share", {
        userId: targetUserId,
        method: "clipboard",
      });
    } catch (error) {
      console.error("Failed to copy link:", error);
      showToast("Failed to copy link", "error");
    }
  };

  const handleShareNative = async () => {
    const url = getProfileUrl();
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${userProfile?.displayName || "User"}'s Profile on TradeYa`,
          text: `Check out ${userProfile?.displayName || "this user"}'s profile on TradeYa!`,
          url,
        });
        setShowShareMenu(false);
        await logEvent("profile_share", {
          userId: targetUserId,
          method: "native",
        });
      }
    } catch (error: any) {
      if (error.name !== "AbortError") {
        console.error("Failed to share:", error);
      }
    }
  };

  const handleShareTwitter = () => {
    const url = getProfileUrl();
    const text = `Check out ${userProfile?.displayName || "this user"}'s profile on TradeYa!`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      "_blank"
    );
    setShowShareMenu(false);
    logEvent("profile_share", {
      userId: targetUserId,
      method: "twitter",
    });
  };

  const handleShareLinkedIn = () => {
    const url = getProfileUrl();
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      "_blank"
    );
    setShowShareMenu(false);
    logEvent("profile_share", {
      userId: targetUserId,
      method: "linkedin",
    });
  };

  const handleShareFacebook = () => {
    const url = getProfileUrl();
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      "_blank"
    );
    setShowShareMenu(false);
    logEvent("profile_share", {
      userId: targetUserId,
      method: "facebook",
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

  const handleEditSave = async () => {
    if (!targetUserId) return;
    setSavingEdit(true);
    try {
      let uploadedPublicId: string | undefined;
      if (avatarFile) {
        // Try dedicated profile preset first
        const res = await uploadProfileImage(avatarFile);
        if (res.error) {
          // Fallback to generic upload preset (portfolio) in the same folder
          const retry = await uploadImage(avatarFile, "users/profiles");
          if (retry.error) {
            throw new Error(retry.error);
          }
          uploadedPublicId = retry.publicId;
        } else {
          uploadedPublicId = res.publicId;
        }
      }

      const updates: any = {
        displayName: editForm.displayName?.trim() || undefined,
        tagline: editForm.tagline?.trim() || undefined,
        bio: editForm.bio?.trim() || undefined,
        website: editForm.website?.trim() || undefined,
        location: editForm.location?.trim() || undefined,
        // Always send an array for skills so clearing skills persists as []
        skills: Array.isArray(skillsDraft) ? skillsDraft : [],
        profilePicture: uploadedPublicId || undefined,
      };
      // Optional handle validation/update
      const raw =
        (
          document.getElementById(
            "edit-handle-input"
          ) as HTMLInputElement | null
        )?.value || "";
      const candidate = raw
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "")
        .slice(0, 20);
      if (candidate) {
        if (candidate.length < 3) {
          setHandleError("Handle must be at least 3 characters");
          setSavingEdit(false);
          return;
        }
        try {
          await initializeFirebase();
          const { db } = await getFirebaseInstances();
          if (db) {
            const usersRef = collection(db, "users");
            const qh = query(usersRef, where("handle", "==", candidate));
            const snap = await getDocs(qh);
            const taken = snap.docs.some((d) => d.id !== targetUserId);
            if (taken) {
              setHandleError("This handle is already taken");
              setSavingEdit(false);
              return;
            }
          }
          updates.handle = candidate;
          setHandleError(null);
        } catch (err) {
          console.warn("Handle availability check failed", err);
          updates.handle = candidate;
        }
      }
      const res = await userService.updateUser(targetUserId, updates);
      if (res.error) {
        showToast(res.error.message || "Failed to update profile", "error");
        return;
      }
      setUserProfile((prev) =>
        prev ? ({ ...prev, ...updates } as UserProfile) : prev
      );
      showToast("Profile updated", "success");
      setIsEditOpen(false);
    } catch (e: any) {
      showToast(e?.message || "Failed to update profile", "error");
    } finally {
      setSavingEdit(false);
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
  }, [
    activeTab,
    targetUserId,
    collaborationsLoading,
    tradesLoading,
  ]);

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
        import("../components/features/portfolio/PortfolioTab");
      },
    },
    {
      id: "gamification",
      label: "Progress",
      icon: <Trophy className="w-4 h-4" />,
      onHover: () => {
        // Prefetch gamification bundle on hover for faster tab switch
        import("../components/gamification");
      },
    },
    { id: "collaborations", label: "Collaborations" },
    { id: "trades", label: "Trades" },
  ];

  // Define lazy components
  const GamificationDashboardLazy = ReactLazy(() =>
    import("../components/gamification").then((m) => ({
      default: m.GamificationDashboard,
    }))
  );
  const NotificationPreferencesLazy = ReactLazy(() =>
    import("../components/gamification").then((m) => ({
      default: m.NotificationPreferences,
    }))
  );
  const PortfolioTabLazy = ReactLazy(() =>
    import("../components/features/portfolio/PortfolioTab").then((m) => ({
      default: m.PortfolioTab,
    }))
  );

  const handleTabKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    const ids = tabs.map((t) => t.id);
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const dir = e.key === "ArrowRight" ? 1 : -1;
      const nextIndex = (index + dir + ids.length) % ids.length;
      const nextId = ids[nextIndex];
      setActiveTab(nextId);
      tabRefs.current[nextId]?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      setActiveTab(ids[0]);
      tabRefs.current[ids[0]]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      const last = ids[ids.length - 1];
      setActiveTab(last);
      tabRefs.current[last]?.focus();
    }
  };

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
      const behavior = prefersReducedMotion ? "auto" : "smooth";
      panel?.scrollIntoView({ behavior, block: "start" });
    } else {
      // Fallback to last tab from localStorage
      try {
        const last = localStorage.getItem(
          "tradeya_profile_last_tab"
        ) as TabType | null;
        if (last && valid.includes(last)) setActiveTab(last);
      } catch {}
    }
    // restore tab scroll position
    try {
      const savedScroll = localStorage.getItem("tradeya_profile_tab_scroll");
      if (savedScroll && tabScrollRef.current) {
        tabScrollRef.current.scrollLeft = Number(savedScroll);
      }
    } catch {}
    const onHashChange = () => {
      const h = (window.location.hash || "").replace("#", "");
      if (valid.includes(h as TabType)) setActiveTab(h as TabType);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // Listen to reduced motion preference
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    )
      return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const applyPref = () => setPrefersReducedMotion(!!mediaQuery.matches);
    applyPref();
    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", applyPref);
      return () => mediaQuery.removeEventListener("change", applyPref);
    } else if (typeof mediaQuery.addListener === "function") {
      mediaQuery.addListener(applyPref);
      return () => mediaQuery.removeListener(applyPref);
    }
  }, []);

  // Observe tab scroller for overflow and scroll position changes
  useEffect(() => {
    const el = tabScrollRef.current;
    if (!el) return;
    const onScroll = () => updateTabScrollState();
    const onResize = () => updateTabScrollState();
    updateTabScrollState();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [updateTabScrollState]);

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
        <Card
          id="profile-header"
          variant="glass"
          className="relative -mt-4 sm:-mt-6 md:-mt-8 mb-6 bg-gradient-to-r from-primary-500/5 via-accent-500/5 to-secondary-500/5"
        >
          <CardContent className="p-4 sm:p-6">
            {/* Main Profile Grid Layout - Two Column System */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
              {/* Left Column: Avatar + Basic Info (2/5 on desktop) */}
              <div className="lg:col-span-2 flex flex-col items-center gap-4">
                {/* Premium Avatar with Glassmorphic Border */}
                <div className="relative shrink-0">
                  {/* Outer glow effect */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/30 via-accent/20 to-primary/30 blur-2xl opacity-50 animate-pulse" />
                  
                  {/* Circular ring with glassmorphic border */}
                  <div className="relative p-1 rounded-full bg-border/50 shadow-xl">
                    {/* Avatar container */}
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-background shadow-inner">
                      {userProfile.photoURL || userProfile.profilePicture ? (
                        <ProfileImage
                          photoURL={userProfile.photoURL}
                          profilePicture={userProfile.profilePicture}
                          displayName={userProfile.displayName}
                          size="xl"
                          className="h-24 w-24"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full glassmorphic border-glass backdrop-blur-xl bg-white/10 flex items-center justify-center">
                          <User className="w-10 h-10 text-gray-400 dark:text-gray-300" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <Stack gap="2" className="min-w-0 w-full text-center lg:text-left">
                  <div className="flex items-baseline gap-3 flex-wrap justify-center lg:justify-start">
                    <h1 className="group text-3xl sm:text-4xl font-semibold tracking-tight leading-none cursor-default relative inline-block">
                      <span className="text-foreground group-hover:opacity-0 transition-opacity duration-[600ms]">
                        {userProfile.displayName || "Anonymous User"}
                      </span>
                      <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-[600ms] bg-gradient-to-r from-primary-500 via-accent-500 to-secondary-500 bg-clip-text text-transparent animate-gradient-hover bg-[length:200%_200%]">
                        {userProfile.displayName || "Anonymous User"}
                      </span>
                    </h1>
                    {userProfile.handle &&
                      (!userProfile.handlePrivate || isOwnProfile) && (
                        <span className="inline-flex items-center gap-2 text-base text-muted-foreground/80 truncate">
                          @{userProfile.handle}
                          {userProfile.verified && (
                            <span
                              className="inline-flex items-center gap-1 text-success-500"
                              aria-label="Verified account"
                              title="Verified account"
                            >
                              <Check className="w-4 h-4" />
                            </span>
                          )}
                          <button
                            type="button"
                            className="inline-flex items-center justify-center rounded-xl p-2 hover:bg-white/10 dark:hover:bg-white/10 backdrop-blur-xl transition-all duration-200 min-h-[44px] min-w-[44px]"
                            aria-label="Copy profile link"
                            title="Copy profile link"
                            onClick={async () => {
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
                            }}
                          >
                            <CopyIcon className="w-4 h-4" />
                          </button>
                          {userProfile.handlePrivate && isOwnProfile && (
                            <span
                              className="text-xs text-muted-foreground"
                              aria-label="Handle is private"
                            >
                              (private)
                            </span>
                          )}
                        </span>
                      )}
                  </div>
                  <div className="flex items-center gap-3 flex-wrap justify-center lg:justify-start">
                    <Tooltip
                      content={
                        <span>
                          Reputation is based on your XP (50%), completed trades
                          (30%), and followers (20%).
                          <a
                            className="ml-2 underline text-primary"
                            href="/docs/profile-reputation"
                            target="_blank"
                            rel="noreferrer"
                          >
                            What's reputation?
                          </a>
                        </span>
                      }
                      position="top"
                    >
                      <span>
                        <ReputationBadge
                          score={repScore ?? 0}
                          size="sm"
                          showLabel={true}
                          className="bg-muted/50 border-border/50 text-foreground cursor-help"
                        />
                      </span>
                    </Tooltip>
                  </div>
                {isOwnProfile && (
                  <p className="text-sm text-muted-foreground truncate flex items-center gap-2 justify-center lg:justify-start">
                    <Mail className="w-4 h-4" />
                    <span>{userProfile.email}</span>
                  </p>
                )}

                {/* Mutual followers snippet (viewer != owner) */}
                {!isOwnProfile && mutualFollows.count > 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Followed by {mutualFollows.names.join(", ")}
                    {mutualFollows.count > mutualFollows.names.length
                      ? ` and ${
                          mutualFollows.count - mutualFollows.names.length
                        } more`
                      : ""}
                  </p>
                )}


                {/* Rating summary chip */}
                {reviewsMeta && reviewsMeta.count > 0 && (
                  <div className="mt-3 inline-flex items-center gap-2 rounded-md border border-border/60 bg-muted/40 px-3 py-1 text-sm">
                    <span className="inline-flex items-center gap-1">
                      <Star className="w-4 h-4 text-warning-500" />
                      <span className="text-foreground font-medium">
                        {reviewsMeta.avg.toFixed(1)}
                      </span>
                    </span>
                    <span className="text-muted-foreground">
                      · {reviewsMeta.count}
                    </span>
                  </div>
                )}

                {/* Reviews preview */}
                {(reviewsLoading || reviewsPreview.length > 0) && (
                  <div className="mt-4 space-y-2">
                    {reviewsLoading && reviewsPreview.length === 0 && (
                      <>
                        <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                        <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
                      </>
                    )}
                    {reviewsPreview.map((rev, idx) => (
                      <div
                        key={`rev-${idx}`}
                        className="text-sm text-muted-foreground flex items-start gap-2"
                      >
                        <span className="inline-flex items-center gap-0.5 text-warning-500">
                          {Array.from({
                            length: Math.min(5, Math.max(0, rev.rating)),
                          }).map((_, i) => (
                            <Star
                              key={i}
                              className="w-3.5 h-3.5 fill-current"
                            />
                          ))}
                        </span>
                        <span className="truncate">{rev.comment}</span>
                      </div>
                    ))}
                    {reviewsMeta && reviewsMeta.count > 0 && (
                      <button
                        type="button"
                        className="text-xs text-primary hover:underline"
                        onClick={() => {
                          window.location.href = `/reviews?user=${targetUserId}`;
                        }}
                        aria-label="See all reviews"
                      >
                        See all reviews
                      </button>
                    )}
                  </div>
                )}
              </Stack>
            </div>

            {/* Right Column: Bio, Contact Info, Skills, Actions, Stats (3/5 on desktop) */}
            <div className="lg:col-span-3">
                <Stack gap="md">
                  {/* Tagline */}
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {userProfile.tagline || "No tagline provided"}
                  </p>
                  
                  {/* Bio - Enhanced formatting */}
                  {userProfile.bio && (
                    <div className="text-sm text-muted-foreground leading-relaxed">
                      {isBioExpanded ? (
                        <p className="whitespace-pre-wrap break-words">{userProfile.bio}</p>
                      ) : (
                        <p className="whitespace-pre-wrap break-words">
                          {userProfile.bio.length > 300
                            ? `${userProfile.bio.substring(0, 300)}...`
                            : userProfile.bio}
                        </p>
                      )}
                      {userProfile.bio.length > 300 && (
                        <button
                          type="button"
                          className="mt-2 text-primary hover:text-primary/80 font-medium transition-colors inline-flex items-center gap-1"
                          onClick={() => setIsBioExpanded(!isBioExpanded)}
                        >
                          {isBioExpanded ? (
                            <>
                              Read less
                              <ChevronLeft className="w-3 h-3" />
                            </>
                          ) : (
                            <>
                              Read more
                              <ChevronRight className="w-3 h-3" />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                  
                  {/* Contact Info - Cleaner layout */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                    {userProfile.website && (
                      <a
                        href={userProfile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 hover:text-primary transition-colors group"
                      >
                        <Globe className="w-4 h-4 transition-transform group-hover:scale-110" />
                        <span className="truncate max-w-[200px]">
                          {userProfile.website.replace(/^https?:\/\//, "")}
                        </span>
                      </a>
                    )}
                    {userProfile.location && (
                      <div className="inline-flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate">{userProfile.location}</span>
                      </div>
                    )}
                    {userProfile.metadata?.creationTime && (
                      <div className="inline-flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Joined{" "}
                          {new Date(userProfile.metadata.creationTime).toLocaleDateString(undefined, {
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Skills - Premium design */}
                  {userProfile.skills && userProfile.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {userProfile.skills.slice(0, 8).map((skill, index) => (
                        <button
                          key={index}
                          type="button"
                          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-primary/10 to-accent/10 text-primary border border-primary/20 hover:border-primary/40 hover:shadow-md hover:shadow-primary/20 transition-all duration-200 backdrop-blur-sm"
                          onClick={() => {
                            // Dispatch custom event for PortfolioTab to filter by skill
                            window.dispatchEvent(new CustomEvent('portfolio:filter-skill', { 
                              detail: { skill } 
                            }));
                            setActiveTab("portfolio");
                          }}
                          aria-label={`Filter portfolio by ${skill}`}
                        >
                          {skill}
                        </button>
                      ))}
                      {userProfile.skills.length > 8 && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-muted/50 text-muted-foreground backdrop-blur-sm">
                          +{userProfile.skills.length - 8} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Social Stats - Moved higher for prominence */}
                  {targetUserId && (
                    <div className="w-full">
                      <UserSocialStats 
                        userId={targetUserId} 
                        compact 
                        onFollowersClick={() => navigate(`/directory?relation=followers&user=${targetUserId}`)}
                        onLeaderboardClick={() => navigate('/leaderboard')}
                      />
                    </div>
                  )}

                  {/* Streak Widgets - Premium design */}
                  {targetUserId && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-gradient-to-r from-muted/20 to-muted/30 rounded-lg px-3 py-2 border border-border/30 backdrop-blur-sm">
                      <StreakWidgetCompact userId={targetUserId} type="login" />
                      <span className="text-border">•</span>
                      <StreakWidgetCompact
                        userId={targetUserId}
                        type="challenge"
                      />
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-2 relative">
                    {isOwnProfile ? (
                      <>
                        <Button
                          variant="glassmorphic"
                          className="gap-2 shrink-0 border-primary/20 hover:border-primary/40 bg-gradient-to-r from-primary/10 to-accent/10 hover:from-primary/20 hover:to-accent/20 shadow-lg hover:shadow-xl hover:shadow-primary/20"
                          onClick={() => setIsEditOpen(true)}
                        >
                          <Edit3 className="w-4 h-4" />
                          Edit Profile
                        </Button>
                        <Button
                          ref={shareButtonRef}
                          variant="ghost"
                          className="gap-2 shrink-0"
                          onClick={handleShareProfile}
                        >
                          <Share2 className="w-4 h-4" />
                          Share profile
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          className="gap-2 shrink-0"
                          onClick={() => navigate(`/messages/new?to=${targetUserId}`)}
                        >
                          <MessageSquare className="w-4 h-4" />
                          Message
                        </Button>
                        <Button
                          ref={shareButtonRef}
                          variant="ghost"
                          className="gap-2 shrink-0"
                          onClick={handleShareProfile}
                        >
                          <Share2 className="w-4 h-4" />
                          Share profile
                        </Button>
                        <SocialFeatures
                          userId={targetUserId!}
                          userName={userProfile.displayName || "User"}
                          userAvatar={
                            userProfile.profilePicture || userProfile.photoURL
                          }
                          compact
                          showStats={false}
                          showFollowButton
                        />
                      </>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="w-full h-px bg-gradient-to-r from-transparent via-border/50 to-transparent"></div>

                  {/* Trade Stats with Icons */}
                  {stats && (
                    <div className="grid grid-cols-2 gap-3 text-sm w-full">
                      <StatChip 
                        label="Trades" 
                        value={stats.totalTrades} 
                        icon={<TrendingUp className="w-4 h-4" />}
                      />
                      <StatChip 
                        label="This week" 
                        value={stats.tradesThisWeek}
                        icon={<Activity className="w-4 h-4" />}
                      />
                    </div>
                  )}
                </Stack>
            </div>

            </div>
          </CardContent>
        </Card>

        {/* Tab Navigation */}
        <Card
          className="glassmorphic bg-white/5 backdrop-blur-sm rounded-lg border border-border/30 shadow-sm overflow-hidden"
        >
          <div className="-mb-px sticky top-16 z-sticky glassmorphic backdrop-blur-xl bg-white/10">
              <div className="relative">
                <div
                  className={`pointer-events-none absolute left-0 top-0 h-full w-6 bg-gradient-to-r from-white/10 to-transparent transition-opacity duration-200 ${
                    tabHasOverflow && tabCanScrollLeft
                      ? "opacity-100"
                      : "opacity-0"
                  }`}
                />
                <div
                  className={`pointer-events-none absolute right-0 top-0 h-full w-6 bg-gradient-to-l from-white/10 to-transparent transition-opacity duration-200 ${
                    tabHasOverflow && tabCanScrollRight
                      ? "opacity-100"
                      : "opacity-0"
                  }`}
                />
                <div
                  ref={tabScrollRef}
                  className="overflow-x-auto scroll-smooth px-6 scrollbar-hide"
                  role="tablist"
                  aria-label="Profile sections"
                  onScroll={() => {
                    try {
                      if (!tabScrollRef.current) return;
                      localStorage.setItem(
                        "tradeya_profile_tab_scroll",
                        String(tabScrollRef.current.scrollLeft)
                      );
                    } catch {}
                  }}
                >
                  {/* desktop scroll chevrons (fade in/out on overflow) */}
                  <button
                    type="button"
                    className={`hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 items-center justify-center rounded-full border shadow-sm transition-opacity duration-200 ${
                      tabHasOverflow
                        ? tabCanScrollLeft
                          ? "opacity-100 glassmorphic border-glass backdrop-blur-xl bg-white/10 hover:bg-white/15"
                          : "opacity-50 glassmorphic border-glass backdrop-blur-xl bg-white/5 cursor-not-allowed"
                        : "opacity-0 pointer-events-none"
                    }`}
                    onClick={() => {
                      const scroller = tabScrollRef.current;
                      const behavior = prefersReducedMotion ? "auto" : "smooth";
                      scroller?.scrollBy({ left: -160, behavior });
                    }}
                    aria-label="Scroll tabs left"
                    aria-hidden={!tabHasOverflow}
                    tabIndex={tabHasOverflow ? 0 : -1}
                    disabled={!tabHasOverflow || !tabCanScrollLeft}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    className={`hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 items-center justify-center rounded-full border shadow-sm transition-opacity duration-200 ${
                      tabHasOverflow
                        ? tabCanScrollRight
                          ? "opacity-100 glassmorphic border-glass backdrop-blur-xl bg-white/10 hover:bg-white/15"
                          : "opacity-50 glassmorphic border-glass backdrop-blur-xl bg-white/5 cursor-not-allowed"
                        : "opacity-0 pointer-events-none"
                    }`}
                    onClick={() => {
                      const scroller = tabScrollRef.current;
                      const behavior = prefersReducedMotion ? "auto" : "smooth";
                      scroller?.scrollBy({ left: 160, behavior });
                    }}
                    aria-label="Scroll tabs right"
                    aria-hidden={!tabHasOverflow}
                    tabIndex={tabHasOverflow ? 0 : -1}
                    disabled={!tabHasOverflow || !tabCanScrollRight}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <div className="flex gap-4">
                    {tabs.map((tab, index) => (
                      <button
                        key={tab.id}
                        role="tab"
                        id={tab.id}
                        aria-selected={activeTab === tab.id}
                        aria-controls={`panel-${tab.id}`}
                        tabIndex={activeTab === tab.id ? 0 : -1}
                        onMouseEnter={() => tab.onHover?.()}
                        onClick={() => {
                          setActiveTab(tab.id);
                          // Update hash for deep-linking
                          try {
                            window.history.replaceState({}, "", `#${tab.id}`);
                          } catch {}
                          try {
                            localStorage.setItem(
                              "tradeya_profile_last_tab",
                              tab.id
                            );
                          } catch {}
                          const panel = document.getElementById(
                            `panel-${tab.id}`
                          );
                          const behavior = prefersReducedMotion
                            ? "auto"
                            : "smooth";
                          panel?.scrollIntoView({ behavior, block: "start" });
                        }}
                        onKeyDown={(e) => handleTabKeyDown(e, index)}
                        ref={(el) => {
                          (tabRefs.current as any)[tab.id] = el;
                        }}
                        className={`shrink-0 group relative whitespace-nowrap py-4 px-3 min-h-[44px] border-b-2 font-medium text-sm flex items-center gap-2 transition-colors duration-200 ${
                          activeTab === tab.id
                            ? "border-primary text-foreground"
                            : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                        }`}
                      >
                        {tab.icon}
                        <span className="flex items-center gap-1">
                          {tab.label}
                          {typeof getTabCount(tab.id) === "number" && (
                            <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full glassmorphic border-glass backdrop-blur-xl bg-white/10 px-1 text-xs text-foreground">
                              {getTabCount(tab.id)}
                            </span>
                          )}
                        </span>
                        {/* underline animation */}
                        <span
                          className={`absolute left-0 -bottom-[2px] h-[2px] bg-primary transition-all duration-300 ${
                            activeTab === tab.id
                              ? "w-full opacity-100"
                              : "w-0 opacity-0 group-hover:w-full"
                          }`}
                          aria-hidden="true"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
        </Card>

        {/* Tab Content */}
        <Card
          variant="glass"
          className="rounded-lg shadow-sm border border-border"
        >
          <CardContent className="p-4 sm:p-6">
            {activeTab === "about" && (
              <Box id="panel-about" role="tabpanel" aria-labelledby="about">
                <Stack gap="md">
                  <Grid columns={{ base: 1, md: 2 }} gap={{ base: 'md', md: 'lg' }}>
                    <Box>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">
                        Email
                      </label>
                      {userProfile.email ? (
                        <div className="px-4 py-3 rounded-xl glassmorphic border-glass backdrop-blur-xl bg-white/5 text-foreground flex items-center gap-2 justify-between">
                          <span className="flex items-center gap-2 min-w-0">
                            <Mail className="w-4 h-4 text-orange-500 dark:text-orange-400" />
                            <span className="truncate">
                              {userProfile.email}
                            </span>
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="shrink-0 inline-flex items-center justify-center min-h-[44px] min-w-[44px]"
                            onClick={() =>
                              navigator.clipboard.writeText(userProfile.email)
                            }
                            aria-label="Copy email"
                          >
                            <CopyIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="h-10 bg-muted rounded animate-pulse" />
                      )}
                    </Box>
                    {userProfile.metadata?.creationTime && (
                      <Box>
                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                          Joined
                        </label>
                        <p className="px-4 py-3 rounded-xl glassmorphic border-glass backdrop-blur-xl bg-white/5 text-foreground flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                          <span>
                            {new Date(
                              userProfile.metadata.creationTime
                            ).toLocaleDateString()}
                          </span>
                        </p>
                      </Box>
                    )}
                    {userProfile.metadata?.lastSignInTime && (
                      <Box>
                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                          Last sign-in
                        </label>
                        <p className="px-4 py-3 rounded-xl glassmorphic border-glass backdrop-blur-xl bg-white/5 text-foreground flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-green-500 dark:text-green-400" />
                          <span>
                            {new Date(
                              userProfile.metadata.lastSignInTime
                            ).toLocaleDateString()}
                          </span>
                        </p>
                      </Box>
                    )}
                  </Grid>
                </Stack>
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
                {collaborationsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-40 bg-muted rounded-lg animate-pulse"
                      />
                    ))}
                  </div>
                ) : !collaborations || collaborations.length === 0 ? (
                  <div className="text-center py-12 space-y-4">
                    <p className="text-muted-foreground">
                      No collaborations yet.
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      {isOwnProfile && (
                        <Button
                          topic="collaboration"
                          onClick={() => navigate("/collaborations/new")}
                        >
                          Create a collaboration
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => navigate("/collaborations")}
                      >
                        Browse collaborations
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                      <div className="text-sm text-muted-foreground">
                        <span className="hidden sm:inline">Showing </span>
                        {Math.min(
                          collabVisibleCount,
                          filteredCollaborations.length
                        )}{" "}
                        of {filteredCollaborations.length}
                        <span className="sm:hidden"> collaborations</span>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <label className="text-sm text-muted-foreground hidden sm:inline">Show:</label>
                        <select
                          className="w-full sm:w-auto rounded-xl border-glass glassmorphic backdrop-blur-xl bg-white/5 text-foreground text-sm px-3 py-2 outline-hidden focus:ring-2 focus:ring-primary/50 transition-all duration-200"
                          value={collabFilter}
                          onChange={(e) => {
                            setCollabFilter(e.target.value as any);
                            setCollabVisibleCount(6);
                          }}
                        >
                          <option value="all">All collaborations</option>
                          <option value="yours">Created by me</option>
                        </select>
                      </div>
                    </div>
                    <div
                      id="profile-trades-list"
                      className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4"
                    >
                      {filteredCollaborations
                        .slice(0, collabVisibleCount)
                        .map((c) => (
                          <div key={c.id} className="space-y-2">
                            <CollaborationCard
                              collaboration={c as any}
                              variant="premium"
                            />
                            {/* Role hint */}
                            <div className="text-xs text-muted-foreground">
                              {c?.creatorId === targetUserId ? (
                                <Badge variant="outline">
                                  Your role: Creator
                                </Badge>
                              ) : userRoleByCollabId[c.id] ? (
                                <Badge variant="outline">
                                  Your role: {userRoleByCollabId[c.id]}
                                </Badge>
                              ) : Array.isArray(c?.participants) &&
                                c.participants.includes(targetUserId) ? (
                                <Badge variant="outline">
                                  Your role: Participant
                                </Badge>
                              ) : null}
                            </div>
                          </div>
                        ))}
                    </div>
                    <div className="flex flex-col sm:flex-row justify-center sm:justify-end gap-2 mt-4">
                      {filteredCollaborations &&
                        collabVisibleCount < filteredCollaborations.length && (
                          <Button
                            variant="outline"
                            className="w-full sm:w-auto"
                            onClick={() => {
                              setIsLoadingMoreCollabs(true);
                              // small delay to allow smooth UI feedback
                              setTimeout(() => {
                                setCollabVisibleCount((n) => n + 6);
                                setIsLoadingMoreCollabs(false);
                              }, 150);
                            }}
                            disabled={isLoadingMoreCollabs}
                            aria-busy={isLoadingMoreCollabs}
                            aria-controls="profile-collaborations-list"
                          >
                            {isLoadingMoreCollabs ? "Loading…" : "Load more"}
                          </Button>
                        )}
                      <span className="sr-only" aria-live="polite">
                        {isLoadingMoreCollabs
                          ? "Loading more collaborations"
                          : ""}
                      </span>
                      <Button
                        variant="outline"
                        className="w-full sm:w-auto"
                        onClick={() => navigate("/collaborations")}
                      >
                        View all collaborations
                      </Button>
                    </div>
                    <div
                      ref={collabSentinelRef}
                      className="h-1"
                      aria-hidden="true"
                    />
                  </>
                )}
              </Box>
            )}

            {activeTab === "trades" && (
              <Box
                id="panel-trades"
                role="tabpanel"
                aria-labelledby="trades"
                className="py-6"
              >
                {tradesLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-32 bg-muted rounded-lg animate-pulse"
                      />
                    ))}
                  </div>
                ) : !trades || trades.length === 0 ? (
                  <div className="text-center py-12 space-y-4">
                    <p className="text-muted-foreground">No active trades.</p>
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => navigate("/trades")}
                      >
                        Browse trades
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                      <div className="text-sm text-muted-foreground">
                        <span className="hidden sm:inline">Showing </span>
                        {Math.min(tradesVisibleCount, filteredTrades.length)} of{" "}
                        {filteredTrades.length}
                        <span className="sm:hidden"> trades</span>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <label className="text-sm text-muted-foreground hidden sm:inline">Show:</label>
                        <select
                          className="w-full sm:w-auto rounded-xl border-glass glassmorphic backdrop-blur-xl bg-white/5 text-foreground text-sm px-3 py-2 outline-hidden focus:ring-2 focus:ring-primary/50 transition-all duration-200"
                          value={tradeFilter}
                          onChange={(e) => {
                            setTradeFilter(e.target.value as any);
                            setTradesVisibleCount(6);
                          }}
                        >
                          <option value="all">All trades</option>
                          <option value="yours">Created by me</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                      {filteredTrades.slice(0, tradesVisibleCount).map((t) => (
                        <TradeCard
                          key={t.id}
                          trade={t as any}
                          showStatus={true}
                        />
                      ))}
                    </div>
                    <div className="flex flex-col sm:flex-row justify-center sm:justify-end gap-2 mt-4">
                      {filteredTrades &&
                        tradesVisibleCount < filteredTrades.length && (
                          <Button
                            variant="outline"
                            className="w-full sm:w-auto"
                            onClick={() => {
                              setIsLoadingMoreTrades(true);
                              setTimeout(() => {
                                setTradesVisibleCount((n) => n + 6);
                                setIsLoadingMoreTrades(false);
                              }, 150);
                            }}
                            disabled={isLoadingMoreTrades}
                            aria-busy={isLoadingMoreTrades}
                            aria-controls="profile-trades-list"
                          >
                            {isLoadingMoreTrades ? "Loading…" : "Load more"}
                          </Button>
                        )}
                      <span className="sr-only" aria-live="polite">
                        {isLoadingMoreTrades ? "Loading more trades" : ""}
                      </span>
                      <Button
                        variant="outline"
                        className="w-full sm:w-auto"
                        onClick={() => navigate("/trades")}
                      >
                        View all trades
                      </Button>
                    </div>
                    <div
                      ref={tradesSentinelRef}
                      className="h-1"
                      aria-hidden="true"
                    />
                  </>
                )}
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Edit profile modal */}
        <SimpleModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          title="Edit Profile"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleEditSave();
            }}
            className="space-y-4"
          >
            {/* Avatar uploader */}
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 rounded-full overflow-hidden ring-2 ring-border">
                {avatarPreviewUrl ? (
                  <img
                    src={
                      avatarPreviewUrl && avatarPreviewUrl.startsWith("blob:")
                        ? avatarPreviewUrl
                        : undefined
                    }
                    alt="New avatar preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ProfileImage
                    photoURL={userProfile?.photoURL}
                    profilePicture={userProfile?.profilePicture || null}
                    displayName={userProfile?.displayName}
                    size="lg"
                    className="h-16 w-16"
                  />
                )}
                {avatarPreviewUrl && (
                  <button
                    type="button"
                    className="absolute -top-2 -right-2 bg-background border border-border rounded-full p-1 shadow"
                    onClick={() => {
                      setAvatarPreviewUrl(null);
                      setAvatarFile(null);
                    }}
                    aria-label="Remove selected avatar"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Profile Photo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setAvatarFile(file);
                    if (file) {
                      const url = URL.createObjectURL(file);
                      setAvatarPreviewUrl(url);
                    } else {
                      setAvatarPreviewUrl(null);
                    }
                  }}
                  className="block text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  PNG or JPG up to ~5MB
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={editForm.displayName}
                onChange={(e) =>
                  setEditForm({ ...editForm, displayName: e.target.value })
                }
                className="w-full rounded-xl border-glass glassmorphic backdrop-blur-xl bg-white/5 px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 transition-all duration-200"
                maxLength={80}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Tagline
              </label>
              <input
                type="text"
                value={editForm.tagline}
                onChange={(e) =>
                  setEditForm({ ...editForm, tagline: e.target.value })
                }
                className="w-full rounded-xl border-glass glassmorphic backdrop-blur-xl bg-white/5 px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 transition-all duration-200"
                maxLength={120}
                placeholder="One sentence that captures what you do"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Handle
              </label>
              <input
                id="edit-handle-input"
                type="text"
                defaultValue={userProfile?.handle || ""}
                onChange={(e) => {
                  const v = e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9_]/g, "")
                    .slice(0, 20);
                  e.target.value = v;
                  if (v && v.length < 3)
                    setHandleError("Handle must be at least 3 characters");
                  else setHandleError(null);
                }}
                placeholder="your_handle"
                className={`w-full rounded-xl glassmorphic backdrop-blur-xl bg-white/5 px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 transition-all duration-200 ${
                  handleError ? "border-red-500 dark:border-red-500 focus:ring-red-500" : "border-glass focus:ring-orange-500 dark:focus:ring-orange-400"
                }`}
                maxLength={20}
              />
              <p
                className={`mt-1 text-xs ${
                  handleError ? "text-destructive" : "text-muted-foreground"
                }`}
              >
                Letters, numbers, underscores; 3–20 chars. Used for
                /u/your_handle.
              </p>
              {!handleError &&
                (
                  document.getElementById(
                    "edit-handle-input"
                  ) as HTMLInputElement | null
                )?.value?.length! >= 3 && (
                  <div className="mt-1 inline-flex items-center gap-1 text-xs text-success-600 dark:text-success-400">
                    <Check className="w-3.5 h-3.5" />
                    Looks good
                  </div>
                )}
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Profile link:</span>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                  onClick={async () => {
                    const input = document.getElementById(
                      "edit-handle-input"
                    ) as HTMLInputElement | null;
                    const h = (
                      input?.value ||
                      userProfile?.handle ||
                      ""
                    ).trim();
                    const path = h ? `/u/${h}` : `/profile/${targetUserId}`;
                    const url = `${window.location.origin}${path}`;
                    await navigator.clipboard.writeText(url);
                    showToast("Profile link copied", "success");
                    await logEvent("profile_share", {
                      userId: targetUserId,
                      hasHandle: !!h,
                      method: "clipboard",
                      context: "modal",
                    });
                  }}
                  aria-label="Copy profile link"
                >
                  <CopyIcon className="w-3.5 h-3.5" />
                  Copy
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Bio
              </label>
              <textarea
                value={editForm.bio}
                onChange={(e) =>
                  setEditForm({ ...editForm, bio: e.target.value })
                }
                className="w-full rounded-xl border-glass glassmorphic backdrop-blur-xl bg-white/5 px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 transition-all duration-200"
                rows={4}
                maxLength={500}
              />
            </div>
            {/* Skills editor */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Skills
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const name = skillsInput.trim();
                      if (!name) return;
                      const exists = skillsDraft.some(
                        (s) => s.toLowerCase() === name.toLowerCase()
                      );
                      if (!exists && skillsDraft.length < 10) {
                        setSkillsDraft([...skillsDraft, name]);
                      }
                      setSkillsInput("");
                    }
                  }}
                  placeholder="Add a skill and press Enter"
                  className="w-full rounded-xl border-glass glassmorphic backdrop-blur-xl bg-white/5 px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 transition-all duration-200"
                />
                <Button
                  type="button"
                  onClick={() => {
                    const name = skillsInput.trim();
                    if (!name) return;
                    const exists = skillsDraft.some(
                      (s) => s.toLowerCase() === name.toLowerCase()
                    );
                    if (!exists && skillsDraft.length < 10) {
                      setSkillsDraft([...skillsDraft, name]);
                    }
                    setSkillsInput("");
                  }}
                  className="shrink-0"
                >
                  Add
                </Button>
              </div>
              {skillsDraft.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {skillsDraft.map((skill, idx) => (
                    <span
                      key={`${skill}-${idx}`}
                      className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-1 text-sm"
                    >
                      {skill}
                      <button
                        type="button"
                        className="ml-1 rounded-full p-0.5 hover:bg-muted"
                        aria-label={`Remove ${skill}`}
                        onClick={() =>
                          setSkillsDraft(
                            skillsDraft.filter((_, i) => i !== idx)
                          )
                        }
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Up to 10 skills. Use simple names like “Audio Mixing”, “Video
                Editing”.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Website
                </label>
                <input
                  type="url"
                  value={editForm.website}
                  onChange={(e) =>
                    setEditForm({ ...editForm, website: e.target.value })
                  }
                  placeholder="https://example.com"
                  className="w-full rounded-xl border-glass glassmorphic backdrop-blur-xl bg-white/5 px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) =>
                    setEditForm({ ...editForm, location: e.target.value })
                  }
                  className="w-full rounded-xl border-glass glassmorphic backdrop-blur-xl bg-white/5 px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 transition-all duration-200"
                  maxLength={120}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsEditOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="gap-2" disabled={savingEdit}>
                <Save className="w-4 h-4" />
                {savingEdit ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </form>
        </SimpleModal>

      {/* Share Profile Dropdown - Rendered via Portal */}
      {showShareMenu && shareDropdownPosition && createPortal(
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowShareMenu(false)}
          />
          <div 
            className="fixed z-50 w-56 glassmorphic bg-background/95 backdrop-blur-xl border border-border/50 rounded-lg shadow-xl py-2"
            style={{
              top: `${shareDropdownPosition.top}px`,
              left: `${shareDropdownPosition.left}px`
            }}
          >
            <button
              type="button"
              className="w-full px-4 py-2.5 text-left hover:bg-muted/50 flex items-center gap-3 transition-colors rounded-md"
              onClick={handleCopyLink}
            >
              <Link2 className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Copy link</span>
            </button>
            {navigator.share && (
              <button
                type="button"
                className="w-full px-4 py-2.5 text-left hover:bg-muted/50 flex items-center gap-3 transition-colors rounded-md"
                onClick={handleShareNative}
              >
                <Share2 className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Share...</span>
              </button>
            )}
            <div className="h-px bg-border/50 my-2" />
            <button
              type="button"
              className="w-full px-4 py-2.5 text-left hover:bg-muted/50 flex items-center gap-3 transition-colors rounded-md"
              onClick={handleShareTwitter}
            >
              <Twitter className="w-4 h-4 text-[#1DA1F2]" />
              <span className="text-sm">Share on Twitter</span>
            </button>
            <button
              type="button"
              className="w-full px-4 py-2.5 text-left hover:bg-muted/50 flex items-center gap-3 transition-colors rounded-md"
              onClick={handleShareLinkedIn}
            >
              <Linkedin className="w-4 h-4 text-[#0A66C2]" />
              <span className="text-sm">Share on LinkedIn</span>
            </button>
            <button
              type="button"
              className="w-full px-4 py-2.5 text-left hover:bg-muted/50 flex items-center gap-3 transition-colors rounded-md"
              onClick={handleShareFacebook}
            >
              <Facebook className="w-4 h-4 text-[#1877F2]" />
              <span className="text-sm">Share on Facebook</span>
            </button>
          </div>
        </>,
        document.body
      )}
      </Stack>
    </Box>
  );
};

export default ProfilePage;
