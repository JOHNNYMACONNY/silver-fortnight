import React, { useState, useCallback, useMemo } from 'react';
import { User, Mail, Copy as CopyIcon, Check, Edit3, Share2, ExternalLink, Globe, MapPin, Calendar, Star, MessageSquare } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ProfileImage } from '../ui/ProfileImage';
import { ReputationBadge } from '../ui/ReputationBadge';
import { Tooltip } from '../ui/Tooltip';
import { cn } from '../../utils/cn';
import { useToast } from '../../contexts/ToastContext';
import { logEvent } from '../../services/analytics';
import { StreakWidgetCompact } from './StreakWidgetCompact';
import { SocialFeatures } from './SocialFeatures';
import type { User as UserType } from '../../services/entities/UserService';

interface UserProfileHeaderProps {
  user: UserType;
  isOwnProfile?: boolean;
  reputationScore?: number;
  mutualFollows?: { count: number; names: string[] };
  onEditProfile?: () => void;
  onShareProfile?: () => void;
  onMessageUser?: () => void;
  onSkillClick?: (skill: string) => void;
  onTabChange?: (tab: string) => void;
  className?: string;
  showActions?: boolean;
  compact?: boolean;
  enableAnalytics?: boolean;
  // Additional data for enhanced features
  reviewsMeta?: { avg: number; count: number };
  reviewsPreview?: Array<{ rating: number; comment: string }>;
  reviewsLoading?: boolean;
  showStreaks?: boolean;
  showSocialFeatures?: boolean;
  showSkills?: boolean;
  showReviews?: boolean;
  showMeta?: boolean;
}

interface ProfileLinkData {
  path: string;
  url: string;
  hasHandle: boolean;
}

export const UserProfileHeader: React.FC<UserProfileHeaderProps> = ({
  user,
  isOwnProfile = false,
  reputationScore = 0,
  mutualFollows = { count: 0, names: [] },
  onEditProfile,
  onShareProfile,
  onMessageUser,
  onSkillClick,
  onTabChange,
  className,
  showActions = true,
  compact = false,
  enableAnalytics = true,
  reviewsMeta,
  reviewsPreview = [],
  reviewsLoading = false,
  showStreaks = false,
  showSocialFeatures = false,
  showSkills = true,
  showReviews = true,
  showMeta = true
}) => {
  const [isBioExpanded, setIsBioExpanded] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const { showToast } = useToast();

  // Memoized profile link data
  const profileLinkData = useMemo((): ProfileLinkData => {
    const hasHandle = Boolean(user.handle && (!user.handlePrivate || isOwnProfile));
    const path = hasHandle ? `/u/${user.handle}` : `/profile/${user.uid}`;
    const url = `${window.location.origin}${path}`;
    
    return { path, url, hasHandle };
  }, [user.handle, user.handlePrivate, user.uid, isOwnProfile]);

  // Memoized display name with fallback
  const displayName = useMemo(() => {
    return user.displayName || 'Anonymous User';
  }, [user.displayName]);

  // Memoized bio truncation logic
  const shouldShowBioToggle = useMemo(() => {
    return Boolean(user.bio && user.bio.length > 140);
  }, [user.bio]);

  // Handle copy profile link with error handling and analytics
  const handleCopyProfileLink = useCallback(async () => {
    if (isSharing) return;
    
    setIsSharing(true);
    
    try {
      await navigator.clipboard.writeText(profileLinkData.url);
      showToast('Profile link copied to clipboard', 'success');
      
      if (enableAnalytics) {
        await logEvent('profile_share', {
          userId: user.uid,
          hasHandle: profileLinkData.hasHandle,
          method: 'clipboard',
          context: 'header'
        });
      }
      
      onShareProfile?.();
    } catch (error) {
      console.error('Failed to copy profile link:', error);
      showToast('Failed to copy profile link', 'error');
    } finally {
      setIsSharing(false);
    }
  }, [profileLinkData, isSharing, showToast, enableAnalytics, user.uid, onShareProfile]);

  // Handle bio toggle
  const handleBioToggle = useCallback(() => {
    setIsBioExpanded(prev => !prev);
  }, []);

  // Handle edit profile
  const handleEditProfile = useCallback(() => {
    if (enableAnalytics) {
      logEvent('profile_edit_clicked', {
        userId: user.uid,
        context: 'header'
      });
    }
    onEditProfile?.();
  }, [enableAnalytics, user.uid, onEditProfile]);

  // Handle skill click
  const handleSkillClick = useCallback((skill: string) => {
    if (enableAnalytics) {
      logEvent('profile_skill_chip_click', { skill });
    }
    onSkillClick?.(skill);
    onTabChange?.('portfolio');
  }, [enableAnalytics, onSkillClick, onTabChange]);

  // Format website label
  const formatWebsiteLabel = useCallback((url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url;
    }
  }, []);

  // Handle message user
  const handleMessageUser = useCallback(() => {
    if (enableAnalytics) {
      logEvent('profile_message_clicked', {
        userId: user.uid,
        context: 'header'
      });
    }
    onMessageUser?.();
  }, [enableAnalytics, user.uid, onMessageUser]);

  // Handle web share API if available
  const handleWebShare = useCallback(async () => {
    const shareData = {
      title: `${displayName}'s Profile`,
      text: `Check out ${displayName}'s profile on TradeYa`,
      url: profileLinkData.url
    };

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        if (enableAnalytics) {
          await logEvent('profile_share', {
            userId: user.uid,
            hasHandle: profileLinkData.hasHandle,
            method: 'web-share',
            context: 'header'
          });
        }
        onShareProfile?.();
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Web share failed:', error);
          await handleCopyProfileLink();
        }
      }
    } else {
      await handleCopyProfileLink();
    }
  }, [displayName, profileLinkData, enableAnalytics, user.uid, onShareProfile, handleCopyProfileLink]);

  // Memoized component classes
  const containerClasses = cn(
    "relative bg-card text-card-foreground rounded-lg shadow-sm border border-border glassmorphic bg-gradient-to-r from-primary-500/5 via-accent-500/5 to-secondary-500/5",
    compact ? "p-4" : "p-6",
    className
  );

  const imageSize = compact ? "w-16 h-16" : "w-24 h-24";
  const imageIconSize = compact ? "w-6 h-6" : "w-10 h-10";
  const nameSize = compact ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl";

  return (
    <div className={containerClasses}>
      <div className="flex items-start gap-4">
        {/* Profile Image */}
        <div className={cn(
          "relative rounded-full ring-4 ring-background shadow-md overflow-hidden bg-background shrink-0",
          imageSize
        )}>
          {user.photoURL || user.profilePicture ? (
            <ProfileImage
              photoURL={user.photoURL}
              profilePicture={user.profilePicture}
              displayName={displayName}
              size="xl"
              className={cn("object-cover", imageSize)}
            />
          ) : (
            <div className={cn(
              "rounded-full bg-muted flex items-center justify-center",
              imageSize
            )}>
              <User className={cn("text-muted-foreground", imageIconSize)} />
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap mb-2">
            {/* Name */}
            <h1 className={cn(
              "font-bold text-card-foreground truncate",
              nameSize
            )}>
              {displayName}
            </h1>

            {/* Handle */}
            {user.handle && (!user.handlePrivate || isOwnProfile) && (
              <div className="flex items-center gap-2 text-base text-muted-foreground">
                <span className="truncate">@{user.handle}</span>
                {user.verified && (
                  <span 
                    className="inline-flex items-center gap-1 text-success-600 dark:text-success-400" 
                    aria-label="Verified account" 
                    title="Verified account"
                  >
                    <Check className="w-4 h-4" />
                  </span>
                )}
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded p-2 hover:bg-muted/50 min-h-[44px] min-w-[44px]"
                  aria-label="Copy profile link"
                  title="Copy profile link"
                  onClick={handleCopyProfileLink}
                >
                  <CopyIcon className="w-4 h-4" />
                </button>
                {user.handlePrivate && isOwnProfile && (
                  <span 
                    className="text-xs text-muted-foreground" 
                    aria-label="Handle is private"
                    title="Handle is private"
                  >
                    (private)
                  </span>
                )}
              </div>
            )}

            {/* Reputation Badge */}
            {reputationScore > 0 && (
              <Tooltip
                content={
                  <div className="max-w-xs">
                    <p className="mb-2">
                      Reputation is based on your XP (50%), completed trades (30%), and followers (20%).
                    </p>
                    <a
                      className="underline text-primary hover:text-primary/80"
                      href="/docs/profile-reputation"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Learn more about reputation
                      <ExternalLink className="inline w-3 h-3 ml-1" />
                    </a>
                  </div>
                }
                position="top"
              >
                <span>
                  <ReputationBadge 
                    score={reputationScore} 
                    size="sm" 
                    showLabel={false} 
                    className="bg-transparent border-border text-muted-foreground cursor-help" 
                  />
                </span>
              </Tooltip>
            )}
          </div>

          {/* Email (own profile only) */}
          {isOwnProfile && user.email && (
            <p className="text-sm text-muted-foreground truncate flex items-center gap-2 mb-2">
              <Mail className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{user.email}</span>
            </p>
          )}

          {/* Tagline */}
          {user.tagline && (
            <p className="text-text-secondary mb-2 truncate">{user.tagline}</p>
          )}

          {/* Mutual followers (other profiles only) */}
          {!isOwnProfile && mutualFollows.count > 0 && (
            <p className="text-sm text-muted-foreground mb-2">
              Followed by {mutualFollows.names.join(', ')}
              {mutualFollows.count > mutualFollows.names.length && 
                ` and ${mutualFollows.count - mutualFollows.names.length} more`
              }
            </p>
          )}

          {/* Bio */}
          {user.bio && (
            <div className="mb-4">
              <p className={cn(
                "text-muted-foreground",
                !isBioExpanded && shouldShowBioToggle && "line-clamp-3"
              )}>
                {user.bio}
              </p>
              {shouldShowBioToggle && (
                <button
                  type="button"
                  className="text-sm text-primary hover:underline mt-1 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
                  onClick={handleBioToggle}
                  aria-expanded={isBioExpanded}
                  aria-controls="bio-content"
                >
                  {isBioExpanded ? 'Show less' : 'Read more'}
                </button>
              )}
            </div>
          )}

          {/* Meta row: website, location, member since */}
          {showMeta && (
            <div className="flex flex-wrap gap-2 mt-3">
              {user.website && (
                <a
                  href={user.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-foreground/80 hover:text-primary transition-colors rounded -m-1 p-2 min-h-[44px]"
                  aria-label={`Visit ${formatWebsiteLabel(user.website)}`}
                >
                  <Globe className="w-4 h-4" />
                  <span className="truncate max-w-[200px] sm:max-w-[280px]">{formatWebsiteLabel(user.website)}</span>
                </a>
              )}
              {user.location && (
                <span className="inline-flex items-center gap-2 text-sm text-muted-foreground rounded -m-1 p-2 min-h-[44px]">
                  <MapPin className="w-4 h-4" />
                  {user.location}
                </span>
              )}
              {user.createdAt && (
                <Badge variant="outline" className="inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {`Joined ${new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}`}
                </Badge>
              )}
            </div>
          )}

          {/* Skills */}
          {showSkills && Array.isArray(user.skills) && user.skills.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {user.skills.slice(0, 6).map((skill, idx) => (
                <button
                  key={`${skill}-${idx}`}
                  type="button"
                  onClick={() => handleSkillClick(skill)}
                  className="inline-flex items-center rounded-full border px-3 py-1 text-xs hover:bg-muted"
                  aria-label={`Filter portfolio by ${skill}`}
                >
                  {skill}
                </button>
              ))}
            </div>
          )}

          {/* Rating summary chip */}
          {showReviews && reviewsMeta && reviewsMeta.count > 0 && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-md border border-border/60 bg-muted/40 px-3 py-1 text-sm">
              <span className="inline-flex items-center gap-1">
                <Star className="w-4 h-4 text-warning-500" />
                <span className="text-foreground font-medium">{reviewsMeta.avg.toFixed(1)}</span>
              </span>
              <span className="text-muted-foreground">· {reviewsMeta.count}</span>
            </div>
          )}

          {/* Reviews preview */}
          {showReviews && (reviewsLoading || reviewsPreview.length > 0) && (
            <div className="mt-4 space-y-2">
              {reviewsLoading && reviewsPreview.length === 0 && (
                <>
                  <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
                </>
              )}
              {reviewsPreview.map((rev, idx) => (
                <div key={`rev-${idx}`} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="inline-flex items-center gap-0.5 text-warning-500">
                    {Array.from({ length: Math.min(5, Math.max(0, rev.rating)) }).map((_, i) => (
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
                  onClick={() => { window.location.href = `/reviews?user=${user.uid}`; }}
                  aria-label="See all reviews"
                >
                  See all reviews
                </button>
              )}
            </div>
          )}
        </div>

        {/* Streak widgets */}
        {showStreaks && user.uid && (
          <div className="hidden md:flex text-xs gap-2">
            <StreakWidgetCompact userId={user.uid} type="login" />
            <span className="text-muted-foreground">•</span>
            <StreakWidgetCompact userId={user.uid} type="challenge" />
          </div>
        )}
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex items-center gap-2 flex-wrap mt-5">
          {isOwnProfile ? (
            <>
              <Button variant="outline" className="gap-2" onClick={handleEditProfile}>
                <Edit3 className="w-4 h-4" />
                Edit Profile
              </Button>
              <Button variant="ghost" className="gap-2" onClick={handleWebShare}>
                <Share2 className="w-4 h-4" />
                Share profile
              </Button>
            </>
          ) : (
            <>
              <Button className="gap-2" onClick={handleMessageUser}>
                <MessageSquare className="w-4 h-4" />
                Message
              </Button>
              <Button variant="ghost" className="gap-2" onClick={handleWebShare}>
                <Share2 className="w-4 h-4" />
                Share profile
              </Button>
              {showSocialFeatures && (
                <SocialFeatures
                  userId={user.uid}
                  userName={user.displayName || 'User'}
                  userAvatar={user.profilePicture || user.photoURL}
                  compact
                  showStats={false}
                  showFollowButton
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default UserProfileHeader;