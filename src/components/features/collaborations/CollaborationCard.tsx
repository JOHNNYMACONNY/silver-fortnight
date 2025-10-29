import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Collaboration } from '../../../services/firestore-exports';
import { cn } from '../../../utils/cn';
import { MapPin, Calendar, Clock, DollarSign, Plus } from 'lucide-react';
import ProfileAvatarButton from '../../ui/ProfileAvatarButton';
import { Card, CardHeader, CardContent, CardTitle } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { formatDate } from '../../../utils/dateUtils';
import { getSkillBadgeProps } from '../../../utils/skillMapping';

interface CollaborationCardProps {
  collaboration: Collaboration;
  className?: string;
  compact?: boolean;
  variant?: 'default' | 'glass' | 'elevated' | 'premium';
  enhanced?: boolean;
}

const statusToVariant: Record<Collaboration['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
  'open': 'default',
  'recruiting': 'default',
  'in-progress': 'secondary',
  'completed': 'outline',
  'cancelled': 'destructive',
};

export const CollaborationCard: React.FC<CollaborationCardProps> = ({ 
  collaboration, 
  className, 
  compact = false,
  variant = 'premium', // Use premium variant for standardization
  enhanced = true
}) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/collaborations/${collaboration.id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate(`/collaborations/${collaboration.id}`);
    }
  };

  const formattedDate = collaboration.createdAt 
    ? formatDate(collaboration.createdAt)
    : 'Recently posted';

  const creatorId = collaboration.creatorId;
  const creatorName = collaboration.creatorName ?? 'Unknown';
  const creatorPhotoURL = collaboration.creatorPhotoURL;

  return (
    <div
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`View collaboration: ${collaboration.title}`}
      className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg"
    >
      <Card 
        variant="premium"
        tilt={enhanced}
        depth="lg"
        glow={enhanced ? "subtle" : "none"}
        glowColor="purple"
        hover={true}
        interactive={true}
        onClick={handleCardClick}
        className={cn("h-[380px] flex flex-col cursor-pointer overflow-hidden", className)} // Fixed height
      >
      {/* Standardized Header: Profile + Title + Status */}
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Clickable Profile Avatar */}
            {creatorId && (
              <ProfileAvatarButton
                userId={creatorId}
                size={32}
                className="flex-shrink-0"
              />
            )}
            
            {/* Title (truncated) */}
            <CardTitle className="truncate text-base font-semibold">
              {collaboration.title}
            </CardTitle>
          </div>

          {/* Status Badge */}
          {collaboration.status && (
            <Badge 
              variant={statusToVariant[collaboration.status] || 'default'}
              className="flex-shrink-0"
            >
              {collaboration.status}
            </Badge>
          )}
        </div>
      </CardHeader>

      {/* Description Section */}
      <CardContent className="flex-1 overflow-hidden !flex !flex-col">
        {/* Description - Takes available space */}
        {collaboration.description && (
          <div className="flex-1 min-h-0 mb-3">
            <p className="text-sm text-muted-foreground line-clamp-4">
              {collaboration.description}
            </p>
          </div>
        )}
        
        {/* Skills Section - Compact */}
        {collaboration.skillsNeeded && collaboration.skillsNeeded.length > 0 && (
          <div className="flex-shrink-0 mb-3">
            <div className="flex flex-wrap gap-1.5">
              {collaboration.skillsNeeded.slice(0, compact ? 3 : 5).map((skill, index) => {
                const { topic, Icon } = getSkillBadgeProps(skill);
                return (
                  <Badge key={index} variant="default" topic={topic} className="flex items-center gap-1">
                    <Icon className="h-3 w-3" />
                    {skill}
                  </Badge>
                );
              })}

              {collaboration.skillsNeeded.length > (compact ? 3 : 5) && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Plus className="h-3 w-3" />
                  +{collaboration.skillsNeeded.length - (compact ? 3 : 5)} more
                </Badge>
              )}
            </div>
          </div>
        )}
        
        {/* Info Grid - Pinned to bottom */}
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mt-auto flex-shrink-0">
          <div className="flex items-center min-w-0">
            <Calendar className="mr-1 h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">Posted {formattedDate}</span>
          </div>

          {collaboration.location && (
            <div className="flex items-center min-w-0">
              <MapPin className="mr-1 h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{collaboration.isRemote ? 'Remote' : collaboration.location}</span>
            </div>
          )}

          {collaboration.timeline && (
            <div className="flex items-center min-w-0">
              <Clock className="mr-1 h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{collaboration.timeline}</span>
            </div>
          )}

          {collaboration.compensation && (
            <div className="flex items-center min-w-0">
              <DollarSign className="mr-1 h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{collaboration.compensation}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
    </div>
  );
};

export default CollaborationCard;
