import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Bookmark, 
  Share2, 
  ExternalLink,
  Heart,
  MessageCircle,
  Star,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  Plus
} from 'lucide-react';
import { Collaboration } from '../../../services/firestore-exports';
import { cn } from '../../../utils/cn';
import { formatDate } from '../../../utils/dateUtils';
import ProfileAvatarButton from '../../ui/ProfileAvatarButton';
import { Card, CardHeader, CardContent, CardFooter } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Tooltip } from '../../ui/Tooltip';
import { getSkillBadgeProps } from '../../../utils/skillMapping';

interface SearchResultPreviewProps {
  collaboration: Collaboration;
  className?: string;
  variant?: 'default' | 'compact' | 'detailed';
  showQuickActions?: boolean;
  showAnalytics?: boolean;
  onSave?: (collaborationId: string) => void;
  onShare?: (collaborationId: string) => void;
  onJoin?: (collaborationId: string) => void;
  isSaved?: boolean;
  isJoined?: boolean;
}

const statusConfig = {
  'open': { 
    label: 'Open', 
    variant: 'default' as const, 
    icon: Play,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20'
  },
  'recruiting': { 
    label: 'Recruiting', 
    variant: 'default' as const, 
    icon: Users,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20'
  },
  'in-progress': { 
    label: 'In Progress', 
    variant: 'secondary' as const, 
    icon: TrendingUp,
    color: 'text-primary',
    bgColor: 'bg-primary/10'
  },
  'completed': { 
    label: 'Completed', 
    variant: 'outline' as const, 
    icon: CheckCircle,
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-50 dark:bg-gray-900/20'
  },
  'cancelled': { 
    label: 'Cancelled', 
    variant: 'destructive' as const, 
    icon: XCircle,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/20'
  }
};

const categoryConfig = {
  'tech': { label: 'Technology', color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-900/20' },
  'design': { label: 'Design', color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-50 dark:bg-purple-900/20' },
  'marketing': { label: 'Marketing', color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-50 dark:bg-green-900/20' },
  'content': { label: 'Content', color: 'text-primary', bgColor: 'bg-primary/10' },
  'business': { label: 'Business', color: 'text-indigo-600 dark:text-indigo-400', bgColor: 'bg-indigo-50 dark:bg-indigo-900/20' },
  'education': { label: 'Education', color: 'text-teal-600 dark:text-teal-400', bgColor: 'bg-teal-50 dark:bg-teal-900/20' }
};

export const SearchResultPreview: React.FC<SearchResultPreviewProps> = ({
  collaboration,
  className,
  variant = 'default',
  showQuickActions = true,
  showAnalytics = false,
  onSave,
  onShare,
  onJoin,
  isSaved = false,
  isJoined = false
}) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const statusInfo = statusConfig[collaboration.status] || statusConfig['open'];
  const categoryInfo = collaboration.category ? categoryConfig[collaboration.category as keyof typeof categoryConfig] : null;
  const StatusIcon = statusInfo.icon;

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onSave) return;
    
    setIsSaving(true);
    try {
      await onSave(collaboration.id!);
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onShare) {
      onShare(collaboration.id!);
    } else {
      // Default share behavior
      navigator.share?.({
        title: collaboration.title,
        text: collaboration.description,
        url: `${window.location.origin}/collaborations/${collaboration.id}`
      }).catch(() => {
        // Fallback to copying URL
        navigator.clipboard.writeText(`${window.location.origin}/collaborations/${collaboration.id}`);
      });
    }
  };

  const handleJoin = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onJoin) {
      onJoin(collaboration.id!);
    } else {
      navigate(`/collaborations/${collaboration.id}`);
    }
  };

  const handleCardClick = () => {
    navigate(`/collaborations/${collaboration.id}`);
  };

  const formatDescription = (description: string, maxLength: number = 120) => {
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength).trim() + '...';
  };

  const getUrgencyIndicator = () => {
    if (collaboration.status === 'open' && collaboration.maxParticipants && collaboration.participants) {
      const fillRate = collaboration.participants.length / collaboration.maxParticipants;
      if (fillRate >= 0.8) {
        return { urgent: true, message: 'Almost full!' };
      } else if (fillRate >= 0.5) {
        return { urgent: false, message: 'Filling up' };
      }
    }
    return null;
  };

  const urgencyInfo = getUrgencyIndicator();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={cn("group", className)}
    >
      <Card
        variant="glass"
        tilt={true}
        depth="md"
        glow="subtle"
        glowColor="purple"
        hover={true}
        interactive={true}
        onClick={handleCardClick}
        className={cn(
          "relative overflow-hidden cursor-pointer transition-all duration-300",
          variant === 'compact' ? "h-48" : "h-80",
          isHovered && "scale-[1.02] shadow-xl"
        )}
      >
        {/* Urgency Indicator */}
        {urgencyInfo && (
          <div className={cn(
            "absolute top-3 right-3 z-10 px-2 py-1 rounded-full text-xs font-medium",
            urgencyInfo.urgent 
              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" 
              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
          )}>
            <AlertCircle className="w-3 h-3 inline mr-1" />
            {urgencyInfo.message}
          </div>
        )}

        {/* Header */}
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {/* Creator Avatar */}
              {collaboration.creatorId && (
                <ProfileAvatarButton
                  userId={collaboration.creatorId}
                  size={variant === 'compact' ? 28 : 36}
                  className="flex-shrink-0"
                />
              )}
              
              {/* Title and Creator */}
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                  {collaboration.title}
                </h3>
                {collaboration.creatorName && (
                  <p className="text-xs text-muted-foreground truncate">
                    by {collaboration.creatorName}
                  </p>
                )}
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-2">
              <Badge 
                variant={statusInfo.variant}
                className={cn("flex items-center gap-1", statusInfo.bgColor)}
              >
                <StatusIcon className="w-3 h-3" />
                {statusInfo.label}
              </Badge>
            </div>
          </div>
        </CardHeader>

        {/* Content */}
        <CardContent className="flex-1">
          {/* Description */}
          {collaboration.description && (
            <p className="text-sm text-muted-foreground line-clamp-3 mb-4 leading-relaxed">
              {formatDescription(collaboration.description, variant === 'compact' ? 80 : 120)}
            </p>
          )}
          
          {/* Category Badge */}
          {categoryInfo && (
            <div className="mb-3">
              <Badge 
                variant="outline" 
                className={cn("text-xs", categoryInfo.bgColor, categoryInfo.color)}
              >
                {categoryInfo.label}
              </Badge>
            </div>
          )}

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-4">
            <div className="flex items-center">
              <Calendar className="mr-1 h-3.5 w-3.5" />
              <span>Posted {formatDate(collaboration.createdAt)}</span>
            </div>

            {collaboration.location && (
              <div className="flex items-center">
                <MapPin className="mr-1 h-3.5 w-3.5" />
                <span>{collaboration.isRemote ? 'Remote' : collaboration.location}</span>
              </div>
            )}

            {collaboration.timeline && (
              <div className="flex items-center">
                <Clock className="mr-1 h-3.5 w-3.5" />
                <span>{collaboration.timeline}</span>
              </div>
            )}

            {collaboration.maxParticipants && (
              <div className="flex items-center">
                <Users className="mr-1 h-3.5 w-3.5" />
                <span>
                  {collaboration.participants?.length || 0}/{collaboration.maxParticipants}
                </span>
              </div>
            )}
          </div>

          {/* Skills Section */}
          {collaboration.skillsNeeded && collaboration.skillsNeeded.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {collaboration.skillsNeeded.slice(0, variant === 'compact' ? 2 : 4).map((skill, index) => {
                const { topic, Icon } = getSkillBadgeProps(skill);
                return (
                  <Badge key={index} variant="default" topic={topic} size="sm" className="flex items-center gap-1">
                    <Icon className="h-3 w-3" />
                    {skill}
                  </Badge>
                );
              })}
              {collaboration.skillsNeeded.length > (variant === 'compact' ? 2 : 4) && (
                <Badge variant="outline" size="sm" className="flex items-center gap-1">
                  <Plus className="h-3 w-3" />
                  +{collaboration.skillsNeeded.length - (variant === 'compact' ? 2 : 4)} more
                </Badge>
              )}
            </div>
          )}
        </CardContent>

        {/* Quick Actions Footer */}
        {showQuickActions && (
          <CardFooter className="pt-3 border-t border-border/50">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                {/* Join Button */}
                <Tooltip content={isJoined ? "Already joined" : "Join collaboration"}>
                  <Button
                    size="sm"
                    variant={isJoined ? "outline" : "default"}
                    onClick={handleJoin}
                    disabled={isJoined || collaboration.status !== 'open'}
                    className="h-8 px-3"
                  >
                    {isJoined ? "Joined" : "Join"}
                  </Button>
                </Tooltip>
              </div>

              <div className="flex items-center gap-1">
                {/* Save Button */}
                <Tooltip content={isSaved ? "Remove from saved" : "Save collaboration"}>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="h-8 w-8 p-0"
                  >
                    <AnimatePresence mode="wait">
                      {isSaved ? (
                        <motion.div
                          key="saved"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                        >
                          <Bookmark className="h-4 w-4 fill-current text-primary" />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="unsaved"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                        >
                          <Bookmark className="h-4 w-4" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Button>
                </Tooltip>

                {/* Share Button */}
                <Tooltip content="Share collaboration">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleShare}
                    className="h-8 w-8 p-0"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </Tooltip>

                {/* View Details */}
                <Tooltip content="View details">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCardClick}
                    className="h-8 w-8 p-0"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </Tooltip>
              </div>
            </div>
          </CardFooter>
        )}

        {/* Analytics Overlay (Optional) */}
        {showAnalytics && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute bottom-4 left-4 right-4 text-white text-xs">
              <div className="flex items-center justify-between">
                <span>👥 {collaboration.participants?.length || 0} participants</span>
                <span>⭐ Popular</span>
              </div>
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
};

export default SearchResultPreview; 