import { UserProfile } from '../types';
import { calculateLevel, LEVEL_THRESHOLDS } from '../lib/reputation';
import { Award, Star, ThumbsUp, Trophy, Zap, Target } from 'lucide-react';
import { ChallengeBadge } from './ChallengeBadge';

interface ReputationCardProps {
  profile: UserProfile;
  showEndorsements?: boolean;
}

export function ReputationCard({ profile, showEndorsements = true }: ReputationCardProps) {
  // Ensure experience is a non-negative number or default to 0
  const experience = typeof profile.experience === 'number' && profile.experience >= 0 
    ? profile.experience 
    : 0;
  
  const level = calculateLevel(experience);
  const nextLevelXP = LEVEL_THRESHOLDS[level + 1] || LEVEL_THRESHOLDS[level];
  const currentLevelXP = LEVEL_THRESHOLDS[level];
  const progress = ((experience - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;

  return (
    <div className="card">
      {/* Level and XP */}
      <div className="p-6 border-b border-cyber-gray-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="relative group" role="presentation">
              {/* Animated glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-accent-clay via-accent-ochre to-accent-sage 
                            opacity-75 blur transition-all duration-300 group-hover:opacity-100 rounded-xl">
              </div>
              
              {/* Badge container with glass effect */}
              <div className="relative w-14 h-14 rounded-xl bg-gradient-to-br from-earth-800/95 to-earth-700/95 
                            flex items-center justify-center border border-earth-600/80 shadow-lg 
                            backdrop-blur-sm">
                <Trophy className="h-6 w-6 text-accent-clay" aria-hidden="true" />
                <div className="absolute inset-0 bg-noise opacity-10"></div>
              </div>
              
              {/* Level indicator with dynamic shadow */}
              <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full 
                            bg-gradient-to-br from-accent-rust to-accent-clay 
                            flex items-center justify-center
                            shadow-[0_0_15px_rgba(198,125,99,0.3)]
                            border-2 border-earth-800"
                 role="status"
                 aria-label={`Current level: ${level}`}>
                <span className="text-sm font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                  {level}
                </span>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-display font-semibold text-accent-rust">
                Level {level}
              </h3>
              <p className="text-sm text-gray-700" aria-label={`Experience points: ${profile.experience} out of ${nextLevelXP}`}>
                {profile.experience} / {nextLevelXP} XP
              </p>
            </div>
          </div>
          <Zap className="h-5 w-5 text-accent-rust animate-pulse" aria-hidden="true" />
        </div>
        
        {/* XP Progress Bar */}
        <div className="relative h-3 bg-earth-700/50 rounded-full overflow-hidden shadow-inner"
             role="progressbar"
             aria-valuenow={progress}
             aria-valuemin={0}
             aria-valuemax={100}
             aria-label="Level progress">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-accent-rust via-accent-clay to-accent-ochre 
                     transition-all duration-500 animate-shimmer bg-[length:200%_auto]"
            style={{ width: `${progress}%` }}
          />
          <div className="absolute inset-0 bg-noise opacity-10" />
        </div>
      </div>

      {/* Skill Levels */}
      <div className="p-6 border-b border-cyber-gray-800">
        <h3 className="text-lg font-display font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Star className="h-5 w-5 text-accent-rust" aria-hidden="true" />
          Skill Levels
        </h3>
        <div className="space-y-3">
          {Object.entries(profile.skillLevels || {}).map(([skill, { level, experience }]) => (
            <div key={skill} className="group">
              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-800 group-hover:text-accent-rust transition-colors">
                  {skill}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium px-2.5 py-1 rounded-full 
                                bg-gradient-to-r from-accent-rust to-accent-clay text-white 
                                shadow-[0_2px_8px_rgba(198,125,99,0.25)]"
                         role="status"
                         aria-label={`${skill} level ${level}`}>
                    Lvl {level}
                  </span>
                  {showEndorsements && profile.endorsements?.[skill] && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent-rust/10 text-accent-rust"
                         role="status"
                         aria-label={`${profile.endorsements[skill].length} endorsements`}>
                      <ThumbsUp className="h-3 w-3" aria-hidden="true" />
                      <span className="text-xs font-medium" aria-hidden="true">
                        {profile.endorsements[skill].length}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="h-1.5 bg-earth-700/50 rounded-full overflow-hidden"
                   role="progressbar"
                   aria-valuenow={(experience / 1000) * 100}
                   aria-valuemin={0}
                   aria-valuemax={100}
                   aria-label={`${skill} progress`}>
                <div 
                  className="h-full bg-gradient-to-r from-accent-rust to-accent-clay transition-all duration-300"
                  style={{ width: `${(experience / 1000) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Badges */}
      {profile.badges && profile.badges.length > 0 && (
        <div className="p-6">
          <h3 className="text-lg font-display font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-accent-rust" aria-hidden="true" />
            Achievements
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profile.badges.map((badge) => (
                <ChallengeBadge
                  key={badge.id}
                  type={badge.type || 'achievement'}
                  name={badge.name}
                  description={badge.description}
                  variant="profile"
                  size="md"
                />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
