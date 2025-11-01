import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Calendar,
  Globe,
  MapPin,
  Edit3,
  Share2,
  MessageSquare,
  Check,
  Star,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Activity,
  Copy as CopyIcon,
} from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Card, CardContent } from "../../../components/ui/Card";
import ReputationBadge from "../../../components/ui/ReputationBadge";
import { Tooltip } from "../../../components/ui/Tooltip";
import { ProfileImage } from "../../../components/ui/ProfileImage";
import {
  UserSocialStats,
  SocialFeatures,
} from "../../../components/features/SocialFeatures";
import { StreakWidgetCompact } from "../../../components/features/StreakWidgetCompact";
import StatChip from "../../../components/ui/StatChip";
import Stack from "../../../components/layout/primitives/Stack";
import type { UserProfile } from "../types";
import { logEvent } from "../../../services/analytics";

/**
 * User profile statistics
 */
interface ProfileStats {
  /** Total number of trades completed */
  totalTrades: number;
  /** Number of trades completed this week */
  tradesThisWeek: number;
  /** Current experience points */
  currentXP?: number;
}

/**
 * Reviews metadata
 */
interface ReviewsMeta {
  /** Average rating from reviews */
  avg: number;
  /** Total number of reviews */
  count: number;
}

/**
 * Mutual follows information
 */
interface MutualFollows {
  /** Number of mutual followers */
  count: number;
  /** Names of mutual followers */
  names: string[];
}

/**
 * Props for ProfileHeader component
 * Displays user profile information including avatar, stats, reviews, and action buttons
 */
export interface ProfileHeaderProps {
  /** User profile data */
  profile: UserProfile & { id?: string };
  /** Whether this is the current user's own profile */
  isOwnProfile: boolean;
  /** ID of the user whose profile is being displayed */
  targetUserId: string;
  /** User statistics (trades, XP) */
  stats: ProfileStats | null;
  /** User reputation score */
  repScore: number | null;
  /** Preview of recent reviews */
  reviewsPreview: Array<{ rating: number; comment: string }>;
  /** Whether reviews are currently loading */
  reviewsLoading: boolean;
  /** Reviews metadata (average rating, count) */
  reviewsMeta: ReviewsMeta | null;
  /** Mutual followers information */
  mutualFollows: MutualFollows;
  /** Reference to share button element */
  shareButtonRef: React.RefObject<HTMLButtonElement>;
  /** Callback when edit button is clicked */
  onEditClick: () => void;
  /** Callback when share button is clicked */
  onShareClick: () => void;
  /** Callback to copy profile link */
  onCopyLink: () => Promise<void>;
  /** Callback when tab is changed */
  onTabChange: (tab: any) => void;
}

const ProfileHeaderComponent: React.FC<ProfileHeaderProps> = ({
  profile,
  isOwnProfile,
  targetUserId,
  stats,
  repScore,
  reviewsPreview,
  reviewsLoading,
  reviewsMeta,
  mutualFollows,
  shareButtonRef,
  onEditClick,
  onShareClick,
  onCopyLink,
  onTabChange,
}) => {
  const navigate = useNavigate();
  const [isBioExpanded, setIsBioExpanded] = useState(false);

  return (
    <Card
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
                  <ProfileImage
                    photoURL={profile.photoURL}
                    profilePicture={profile.profilePicture}
                    displayName={profile.displayName}
                    size="xl"
                    className="h-24 w-24"
                  />
                </div>
              </div>
            </div>
            <Stack gap="sm" className="min-w-0 w-full text-center lg:text-left">
              <div className="flex items-baseline gap-3 flex-wrap justify-center lg:justify-start">
                <h1 className="group text-3xl sm:text-4xl font-semibold tracking-tight leading-none cursor-default relative inline-block">
                  <span className="text-foreground group-hover:opacity-0 transition-opacity duration-[600ms]">
                    {profile.displayName || "Anonymous User"}
                  </span>
                  <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-[600ms] bg-gradient-to-r from-primary-500 via-accent-500 to-secondary-500 bg-clip-text text-transparent animate-gradient-hover bg-[length:200%_200%]">
                    {profile.displayName || "Anonymous User"}
                  </span>
                </h1>
                {profile.handle && (!profile.handlePrivate || isOwnProfile) && (
                  <span className="inline-flex items-center gap-2 text-base text-muted-foreground/80 truncate">
                    @{profile.handle}
                    {profile.verified && (
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
                      onClick={onCopyLink}
                    >
                      <CopyIcon className="w-4 h-4" />
                    </button>
                    {profile.handlePrivate && isOwnProfile && (
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
                  <span>{profile.email}</span>
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
                          <Star key={i} className="w-3.5 h-3.5 fill-current" />
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
                {profile.tagline || "No tagline provided"}
              </p>

              {/* Bio - Enhanced formatting */}
              {profile.bio && (
                <div className="text-sm text-muted-foreground leading-relaxed">
                  {isBioExpanded ? (
                    <p className="whitespace-pre-wrap break-words">
                      {profile.bio}
                    </p>
                  ) : (
                    <p className="whitespace-pre-wrap break-words">
                      {profile.bio.length > 300
                        ? `${profile.bio.substring(0, 300)}...`
                        : profile.bio}
                    </p>
                  )}
                  {profile.bio.length > 300 && (
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
                {profile.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 hover:text-primary transition-colors group"
                  >
                    <Globe className="w-4 h-4 transition-transform group-hover:scale-110" />
                    <span className="truncate max-w-[200px]">
                      {profile.website.replace(/^https?:\/\//, "")}
                    </span>
                  </a>
                )}
                {profile.location && (
                  <div className="inline-flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">{profile.location}</span>
                  </div>
                )}
                {profile.metadata?.creationTime && (
                  <div className="inline-flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Joined{" "}
                      {new Date(
                        profile.metadata.creationTime
                      ).toLocaleDateString(undefined, {
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                )}
              </div>

              {/* Skills - Premium design */}
              {profile.skills && profile.skills.length > 0 && (
                <div
                  className="flex flex-wrap gap-1.5"
                  role="group"
                  aria-label="Skills"
                >
                  {profile.skills.slice(0, 8).map((skill, index) => (
                    <button
                      key={index}
                      type="button"
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-primary/10 to-accent/10 text-primary border border-primary/20 hover:border-primary/40 hover:shadow-md hover:shadow-primary/20 transition-all duration-200 backdrop-blur-sm"
                      onClick={() => {
                        // Dispatch custom event for PortfolioTab to filter by skill
                        window.dispatchEvent(
                          new CustomEvent("portfolio:filter-skill", {
                            detail: { skill },
                          })
                        );
                        onTabChange("portfolio");
                      }}
                      aria-label={`Filter portfolio by ${skill}`}
                    >
                      {skill}
                    </button>
                  ))}
                  {profile.skills.length > 8 && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-muted/50 text-muted-foreground backdrop-blur-sm">
                      +{profile.skills.length - 8} more
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
                    onFollowersClick={() =>
                      navigate(
                        `/directory?relation=followers&user=${targetUserId}`
                      )
                    }
                    onLeaderboardClick={() => navigate("/leaderboard")}
                  />
                </div>
              )}

              {/* Streak Widgets - Premium design */}
              {targetUserId && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-gradient-to-r from-muted/20 to-muted/30 rounded-lg px-3 py-2 border border-border/30 backdrop-blur-sm">
                  <StreakWidgetCompact userId={targetUserId} type="login" />
                  <span className="text-border">•</span>
                  <StreakWidgetCompact userId={targetUserId} type="challenge" />
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-2 relative">
                {isOwnProfile ? (
                  <>
                    <Button
                      variant="glassmorphic"
                      className="gap-2 shrink-0 border-primary/20 hover:border-primary/40 bg-gradient-to-r from-primary/10 to-accent/10 hover:from-primary/20 hover:to-accent/20 shadow-lg hover:shadow-xl hover:shadow-primary/20"
                      onClick={onEditClick}
                      aria-label="Edit your profile information"
                    >
                      <Edit3 className="w-4 h-4" aria-hidden="true" />
                      Edit Profile
                    </Button>
                    <Button
                      ref={shareButtonRef}
                      variant="ghost"
                      className="gap-2 shrink-0"
                      onClick={onShareClick}
                      aria-label="Share your profile on social media"
                      aria-haspopup="menu"
                    >
                      <Share2 className="w-4 h-4" aria-hidden="true" />
                      Share profile
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      className="gap-2 shrink-0"
                      onClick={() =>
                        navigate(`/messages/new?to=${targetUserId}`)
                      }
                    >
                      <MessageSquare className="w-4 h-4" />
                      Message
                    </Button>
                    <Button
                      ref={shareButtonRef}
                      variant="ghost"
                      className="gap-2 shrink-0"
                      onClick={onShareClick}
                    >
                      <Share2 className="w-4 h-4" />
                      Share profile
                    </Button>
                    <SocialFeatures
                      userId={targetUserId!}
                      userName={profile.displayName || "User"}
                      userAvatar={profile.profilePicture || profile.photoURL}
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
  );
};

export const ProfileHeader = React.memo(ProfileHeaderComponent);
