import React from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { MapPin, Calendar } from 'lucide-react';
import { ReputationBadge } from './ReputationBadge';
import { SkillBadge } from './SkillBadge';
import { Skill } from '../../types/collaboration';
import { Card, CardHeader, CardContent, CardTitle } from './Card';
import ProfileAvatarButton from './ProfileAvatarButton';
import { Badge } from './Badge';

export interface ProfileCardProps {
  userId: string;
  displayName: string;
  photoURL?: string;
  profilePicture?: string;
  location?: string;
  joinDate: Date;
  bio?: string;
  skills?: Skill[];
  reputationScore?: number;
  className?: string;
  // Enhanced Card customization props
  variant?: 'default' | 'glass' | 'elevated' | 'premium';
  enhanced?: boolean;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  userId,
  displayName,
  photoURL,
  profilePicture,
  location,
  joinDate,
  bio,
  skills = [],
  reputationScore = 0,
  className,
  variant = 'premium',
  enhanced = true
}) => {
  const navigate = useNavigate();
  
  // Format join date
  const formattedJoinDate = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric'
  }).format(joinDate);

  // Navigation handlers
  const handleCardClick = () => {
    navigate(`/profile/${userId}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate(`/profile/${userId}`);
    }
  };

  return (
    <div
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`View profile: ${displayName}`}
      className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg"
    >
      <Card
        variant={variant}
        tilt={enhanced}
        depth="lg"
        glow={enhanced ? "subtle" : "none"}
        glowColor="blue" // Blue for profile/user theme
        hover={true}
        interactive={true}
        onClick={handleCardClick}
        className={cn("h-[380px] flex flex-col cursor-pointer overflow-hidden", className)}
      >
        {/* Standardized Header: Profile + Name + Reputation */}
        <CardHeader className="pb-3 flex-shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {/* ProfileAvatarButton - 32px standard size */}
              <ProfileAvatarButton
                userId={userId}
                size={32}
                className="flex-shrink-0"
              />
              
              {/* Name (truncated) */}
              <CardTitle className="truncate text-base font-semibold">
                {displayName}
              </CardTitle>
            </div>

            {/* Reputation Badge in status position */}
            {reputationScore > 0 && (
              <div className="flex-shrink-0">
                <ReputationBadge score={reputationScore} size="sm" />
              </div>
            )}
          </div>
        </CardHeader>

        {/* Content Section */}
        <CardContent className="flex-1 overflow-hidden px-4 pb-4">
          {/* Bio Section */}
          {bio && (
            <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
              {bio}
            </p>
          )}

          {/* Location & Join Date Row */}
          <div className="flex items-center text-sm text-muted-foreground mb-4 space-x-4">
            {location && (
              <div className="flex items-center">
                <MapPin className="mr-1.5 h-4 w-4" />
                <span className="truncate">{location}</span>
              </div>
            )}
            
            <div className="flex items-center">
              <Calendar className="mr-1.5 h-4 w-4" />
              <span>Joined {formattedJoinDate}</span>
            </div>
          </div>

          {/* Skills Section - Standardized Pattern */}
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {skills.slice(0, 3).map((skill, index) => (
                <SkillBadge
                  key={`${userId}-${skill.name}-${index}`}
                  skill={skill.name}
                  level={skill.level}
                  size="sm"
                />
              ))}

              {skills.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{skills.length - 3} more
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileCard;
