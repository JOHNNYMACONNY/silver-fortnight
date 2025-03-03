import { useState, useRef, useEffect } from 'react';
import { UserProfile } from '../types';
import { ProfilePicture } from './ProfilePicture';
import { Star, Award, Link as LinkIcon, MessageSquare, Calendar } from 'lucide-react';

interface ProfileHoverCardProps {
  profile: UserProfile;
  children: React.ReactNode;
  onMessageClick?: () => void;
}

export function ProfileHoverCard({ profile, children, onMessageClick }: ProfileHoverCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Get top skills (by endorsements)
  const topSkills = Object.entries(profile.endorsements || {})
    .sort(([, a], [, b]) => b.length - a.length)
    .slice(0, 3)
    .map(([skill]) => ({
      name: skill,
      level: profile.skillLevels?.[skill]?.level || 1,
      endorsements: profile.endorsements?.[skill]?.length || 0
    }));

  const updatePosition = () => {
    if (!triggerRef.current || !cardRef.current || !isVisible) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const cardRect = cardRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const scrollY = window.scrollY;
    
    // Calculate initial position
    let x = triggerRect.left;
    let y = scrollY + triggerRect.bottom + 8; // 8px offset from trigger

    // Check horizontal overflow
    if (x + cardRect.width > window.innerWidth) {
      x = window.innerWidth - cardRect.width - 16; // 16px margin from viewport edge
    }
    x = Math.max(16, x); // Ensure minimum 16px from left edge

    // Check vertical overflow and flip if needed
    const spaceBelow = viewportHeight - (triggerRect.bottom + 8);
    const spaceAbove = triggerRect.top - 8;
    
    if (cardRect.height > spaceBelow && spaceAbove > spaceBelow) {
      // Place above if there's more space there
      y = scrollY + triggerRect.top - cardRect.height - 8;
    }

    // Ensure the card stays within viewport vertically
    y = Math.max(scrollY + 16, Math.min(y, scrollY + viewportHeight - cardRect.height - 16));

    setPosition({ x, y });
  };

  useEffect(() => {
    if (isVisible) {
      // Initial position
      requestAnimationFrame(updatePosition);

      // Update position on scroll or resize
      const handleUpdate = () => {
        requestAnimationFrame(updatePosition);
      };

      window.addEventListener('scroll', handleUpdate, { passive: true });
      window.addEventListener('resize', handleUpdate, { passive: true });

      return () => {
        window.removeEventListener('scroll', handleUpdate);
        window.removeEventListener('resize', handleUpdate);
      };
    }
  }, [isVisible]);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 300);
  };

  return (
    <div 
      ref={triggerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="inline-block"
    >
      {children}

      {isVisible && (
        <div
          ref={cardRef}
          style={{
            position: 'absolute',
            left: position.x,
            top: position.y,
            zIndex: 50,
          }}
          onMouseEnter={() => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
          }}
          onMouseLeave={handleMouseLeave}
          className="w-80 animate-in fade-in zoom-in duration-200 origin-top"
        >
          {/* Card */}
          <div className="relative">
            {/* Animated gradient border */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-accent-clay to-accent-ochre 
                          opacity-75 rounded-lg blur"></div>
            
            {/* Main content */}
            <div className="relative bg-earth-800 rounded-lg shadow-xl">
              {/* Header */}
              <div className="p-4">
                <div className="flex items-start gap-4">
                  {/* Profile Picture with Level */}
                  <div className="relative">
                    <ProfilePicture url={profile.profilePicture} size="lg" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-earth-800 
                                  border-2 border-earth-700 flex items-center justify-center">
                      <span className="text-xs font-bold text-accent-clay">
                        {profile.level}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-display font-semibold text-gray-900 truncate">
                      {profile.displayName}
                    </h3>
                    
                    {/* Join date */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                      <Calendar className="h-3 w-3" />
                      <span>Joined {new Date(profile.createdAt).toLocaleDateString()}</span>
                    </div>

                    {/* Portfolio link */}
                    {profile.portfolio && (
                      <a
                        href={profile.portfolio}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 text-sm text-accent-clay hover:text-accent-ochre 
                                 flex items-center gap-1 transition-colors"
                      >
                        <LinkIcon className="h-3 w-3" />
                        Portfolio
                      </a>
                    )}
                  </div>
                </div>

                {/* Bio */}
                {profile.bio && (
                  <p className="mt-3 text-sm text-gray-700 line-clamp-2">
                    {profile.bio}
                  </p>
                )}
              </div>

              {/* Skills */}
              <div className="px-4 pb-4">
                <div className="flex flex-wrap gap-2">
                  {topSkills.map(skill => (
                    <div
                      key={skill.name}
                      className="flex items-center gap-1 px-2 py-1 bg-accent-sage/20 
                               text-gray-900 text-sm rounded-full border border-accent-sage/30"
                    >
                      <Star className="h-3 w-3 text-accent-sage" />
                      <span>{skill.name}</span>
                      <span className="text-xs px-1.5 py-0.5 bg-accent-sage/20 rounded-full">
                        Lvl {skill.level}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              {onMessageClick && (
                <div className="px-4 py-3 border-t border-earth-700">
                  <button
                    onClick={onMessageClick}
                    className="w-full flex items-center justify-center gap-2 py-2 
                             bg-accent-clay text-white rounded-lg hover:bg-accent-ochre 
                             transition-colors"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Send Message
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}