import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../../../services/entities/UserService';
import { Card, CardHeader, CardContent, CardTitle } from '../../ui/Card';
import ProfileAvatarButton from '../../ui/ProfileAvatarButton';
import { ReputationBadge } from '../../ui/ReputationBadge';
import SkillBadge from '../../ui/SkillBadge';
import ConnectionButton from '../connections/ConnectionButton';
import { MapPin, Check, Globe } from 'lucide-react';
import { Badge } from '../../ui/Badge';
import { cn } from '../../../utils/cn';

interface UserCardProps {
  user: User;
  currentUserId?: string | null;
  style?: React.CSSProperties;
  parseSkills: (skills?: string | string[] | any) => { name: string; level?: string }[];
  // Enhanced Card customization props for profiles
  variant?: 'default' | 'glass' | 'elevated' | 'premium';
  enhanced?: boolean; // Enable/disable enhanced effects
  className?: string;
}

const UserCard: React.FC<UserCardProps> = ({ 
  user, 
  currentUserId, 
  parseSkills,
  variant = 'premium', // Changed to premium for standardization
  enhanced = true, // Enable enhanced effects by default
  className = ''
}) => {
  const navigate = useNavigate();
  
  // Use the same fallback logic as User Directory filtering
  const getEffectiveDisplayName = (user: User): string => {
    return user.displayName || (user as any).name || user.email || `User ${user.id.substring(0, 5)}`;
  };

  const effectiveDisplayName = getEffectiveDisplayName(user);
  
  // Add navigation handler
  const handleCardClick = () => {
    navigate(`/profile/${user.id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate(`/profile/${user.id}`);
    }
  };

  return (
    <div
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`View user profile: ${effectiveDisplayName}`}
      className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg"
    >
      <Card
        variant="premium" // Use premium variant for standardization
        tilt={enhanced}
        depth="lg"
        glow={enhanced ? "subtle" : "none"}
        glowColor="blue" // Keep blue for user/connection theme
        hover={true}
        interactive={true}
        onClick={handleCardClick}
        className={cn("h-[380px] flex flex-col cursor-pointer overflow-hidden", className)}
      >
        {/* Standardized Header: Profile + Name + Reputation */}
        <CardHeader className="pb-3 flex-shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {/* Clickable Profile Avatar */}
              <ProfileAvatarButton
                userId={user.id}
                size={32}
                className="flex-shrink-0"
              />
              
              {/* User Name and Handle */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="truncate text-base font-semibold">
                    {effectiveDisplayName}
                  </CardTitle>
                  {user.verified && (
                    <Check className="w-4 h-4 text-success-600 dark:text-success-400 flex-shrink-0" />
                  )}
                </div>
                {user.handle && !user.handlePrivate && (
                  <p className="text-sm text-muted-foreground truncate">
                    @{user.handle}
                  </p>
                )}
              </div>
            </div>

            {/* Reputation Badge in status position */}
            {user.reputationScore && user.reputationScore > 0 && (
              <div className="flex-shrink-0">
                <ReputationBadge score={user.reputationScore} size="sm" />
              </div>
            )}
          </div>
        </CardHeader>

        {/* Content Section */}
        <CardContent className="flex-1 overflow-hidden px-4 pb-4">
          {/* Tagline section */}
          {user.tagline && (
            <p className="text-sm text-primary font-medium line-clamp-1 mb-2">
              {user.tagline}
            </p>
          )}

          {/* Bio section */}
          {user.bio && (
            <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
              {user.bio}
            </p>
          )}

          {/* Location and Website section */}
          <div className="space-y-2 mb-4">
            {user.location && (
              <div className="flex items-center text-sm text-muted-foreground">
                <MapPin className="mr-1.5 h-4 w-4 text-muted-foreground" />
                <span className="truncate">{user.location}</span>
              </div>
            )}
            {user.website && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Globe className="mr-1.5 h-4 w-4 text-muted-foreground" />
                <a
                  href={user.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate hover:text-primary transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  {user.website.replace(/^https?:\/\//, '')}
                </a>
              </div>
            )}
          </div>

          {/* Skills section - styled to match ChallengeCard category pills (outlined, rounded, small) */}
          {user.skills && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-1.5">
                {(() => {
                  try {
                    const parsedSkills = parseSkills(user.skills);
                    return (
                      <>
                        {parsedSkills.slice(0, 4).map((skill, index) => (
                          <Badge
                            key={`${user.id}-${skill.name}-${index}`}
                            variant="outline"
                            className="text-xs rounded-full px-3 py-1"
                          >
                            {skill.name}
                          </Badge>
                        ))}

                        {parsedSkills.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{parsedSkills.length - 4} more
                          </Badge>
                        )}
                      </>
                    );
                  } catch (error) {
                    console.error('Error rendering skills:', error);
                    return null;
                  }
                })()}
              </div>
            </div>
          )}

          {/* Connection Button - preserved functionality */}
          {currentUserId && (
            <div className="mt-auto pt-2" onClick={(e) => e.stopPropagation()}>
              <ConnectionButton
                userId={user.id}
                userName={effectiveDisplayName}
                userPhotoURL={user.photoURL}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserCard;
