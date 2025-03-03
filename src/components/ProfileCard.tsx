import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserProfile } from '../types';
import { ProfilePicture } from './ProfilePicture';
import { Star, Award, Link as LinkIcon, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { startConversation } from '../lib/messaging';

interface ProfileCardProps {
  profile: UserProfile;
  currentUserId?: string;
  onMessageClick?: () => void;
  compact?: boolean;
}

export function ProfileCard({ 
  profile, 
  currentUserId,
  onMessageClick, 
  compact = false 
}: ProfileCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleMessage = async () => {
    if (!currentUserId || isStartingChat || !profile.id) {
      console.warn('Invalid state for starting conversation:', { currentUserId, isStartingChat, profileId: profile.id });
      return;
    }
    
    setIsStartingChat(true);
    setError(null);

    try {
      const conversationId = await startConversation(currentUserId, profile);
      if (!conversationId) {
        throw new Error('Failed to get conversation ID');
      }
      navigate(`/messages/${conversationId}`);
      onMessageClick?.();
    } catch (err) {
      console.error('Failed to start conversation:', err);
      setError('Failed to start conversation');
    } finally {
      setIsStartingChat(false);
    }
  };

  // Get top skills (by endorsements)
  const topSkills = Object.entries(profile.endorsements || {})
    .sort(([, a], [, b]) => b.length - a.length)
    .slice(0, 3)
    .map(([skill]) => ({
      name: skill,
      level: profile.skillLevels?.[skill]?.level || 1,
      endorsements: profile.endorsements?.[skill]?.length || 0
    }));

  // Get most recent badge
  const latestBadge = profile.badges?.[0];

  return (
    <div className="relative group">
      {/* Animated border on hover */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-accent-clay to-accent-ochre 
                    opacity-0 group-hover:opacity-100 rounded-lg blur transition-all duration-300">
      </div>

      {/* Main content */}
      <div className="relative bg-earth-800 rounded-lg p-4">
        <div className="flex items-start gap-4">
          {/* Profile Picture with Level Badge */}
          <div className="relative">
            <ProfilePicture url={profile.profilePicture} size="lg" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-earth-800 
                          border-2 border-earth-700 flex items-center justify-center">
              <span className="text-xs font-bold text-accent-clay">
                {profile.level}
              </span>
            </div>
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-lg font-display font-semibold text-gray-900 truncate">
                  {profile.displayName}
                </h3>
                {profile.portfolio && (
                  <a
                    href={profile.portfolio}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-accent-clay hover:text-accent-ochre flex items-center gap-1"
                  >
                    <LinkIcon className="h-3 w-3" />
                    Portfolio
                  </a>
                )}
              </div>
              {currentUserId && currentUserId !== profile.id && (
                <button
                  onClick={handleMessage}
                  disabled={isStartingChat || !profile.id}
                  className="flex items-center gap-1 px-2 py-1 text-sm bg-accent-clay/10 
                           text-accent-clay rounded-full hover:bg-accent-clay/20 transition-colors
                           disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isStartingChat ? (
                    <>
                      <div className="h-3 w-3 border-2 border-accent-clay border-t-transparent rounded-full animate-spin" />
                      Starting chat...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="h-3 w-3" />
                      Message
                    </>
                  )}
                </button>
              )}
            </div>

            {error && (
              <p className="text-sm text-accent-rust mb-2">
                {error}
              </p>
            )}

            {/* Top Skills Preview */}
            {topSkills.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {topSkills.map(skill => (
                  <div
                    key={skill.name}
                    className="flex items-center gap-1 px-2 py-1 bg-accent-sage/10 
                             text-gray-900 rounded-full text-sm border border-accent-sage/20"
                  >
                    <Star className="h-3 w-3 text-accent-sage" />
                    <span>{skill.name}</span>
                    <span className="text-xs px-1.5 py-0.5 bg-accent-sage/20 rounded-full">
                      Lvl {skill.level}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Latest Achievement */}
            {latestBadge && !compact && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Award className="h-4 w-4 text-accent-ochre" />
                <span>Recently earned: {latestBadge.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Expandable Content */}
        {!compact && (
          <div className="mt-4">
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full flex items-center justify-center gap-1 py-1 text-sm 
                       text-gray-700 hover:text-accent-clay transition-colors"
            >
              {expanded ? (
                <>
                  Show Less <ChevronUp className="h-4 w-4" />
                </>
              ) : (
                <>
                  Show More <ChevronDown className="h-4 w-4" />
                </>
              )}
            </button>

            {expanded && (
              <div className="mt-4 pt-4 border-t border-earth-700">
                {/* Bio */}
                {profile.bio && (
                  <p className="text-sm text-gray-700 mb-4">{profile.bio}</p>
                )}

                {/* All Skills */}
                <div className="grid grid-cols-2 gap-3">
                  {profile.skills.map(skill => (
                    <div
                      key={skill}
                      className="flex items-center justify-between p-2 bg-earth-700/50 
                               rounded-lg text-sm"
                    >
                      <span className="text-gray-900">{skill}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-1.5 py-0.5 bg-accent-sage/20 rounded-full">
                          Lvl {profile.skillLevels?.[skill]?.level || 1}
                        </span>
                        {profile.endorsements?.[skill] && (
                          <span className="text-xs px-1.5 py-0.5 bg-accent-clay/20 rounded-full">
                            {profile.endorsements[skill].length} ⭐
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
