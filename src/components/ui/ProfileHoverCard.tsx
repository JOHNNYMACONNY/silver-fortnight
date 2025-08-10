import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { ReputationBadge } from './ReputationBadge';
import SkillBadge from './SkillBadge';
import { Skill } from '../../types/collaboration';
import ProfileImage from './ProfileImage';
import JohnRobertsProfileImage from './JohnRobertsProfileImage';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import AnimatedList from './AnimatedList';
import { X } from 'lucide-react';
import { Button } from './Button';
import { Card, CardContent, CardFooter, CardHeader } from './Card';
import { User } from '../../services/firestore';

interface UserSkill extends Skill {
  isCommon?: boolean;
}

export interface ProfileHoverCardProps {
  userId: string;
  displayName?: string;
  photoURL?: string;
  profilePicture?: string;
  bio?: string;
  skills?: Skill[];
  reputationScore?: number;
  children: React.ReactNode;
  className?: string;
  delay?: number;
  user?: User;
  onClose?: () => void;
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      damping: 15,
      stiffness: 400,
    },
  },
  exit: { opacity: 0, y: -20 },
} as const;

export const ProfileHoverCard: React.FC<ProfileHoverCardProps> = ({
  userId,
  displayName = 'User',
  photoURL,
  profilePicture,
  bio,
  skills = [],
  reputationScore = 0,
  children,
  className,
  delay = 500,
  user,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const commonSkills = (user?.skills as UserSkill[])?.filter((s: UserSkill) => s.isCommon).slice(0, 3);
  const otherSkills = (user?.skills as UserSkill[])?.filter((s: UserSkill) => !s.isCommon).slice(0, 5);

  const handleMouseEnter = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();

        // Calculate position
        const top = rect.bottom + window.scrollY;
        const left = rect.left + window.scrollX;

        setPosition({ top, left });
        setIsVisible(true);
      }
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    timerRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 300);
  };

  // Handle clicks outside the card
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isVisible &&
        cardRef.current &&
        triggerRef.current &&
        !cardRef.current.contains(event.target as Node) &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Animation variants
  const itemVariants = {
    hidden: { opacity: 0, y: 5 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <>
      <div
        ref={triggerRef}
        className={cn('inline-block', className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={cardRef}
            className={`fixed z-50 w-72 rounded-lg backdrop-blur-sm bg-card-glass border border-border-secondary p-4 shadow-lg`}
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`
            }}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={cardVariants}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <motion.div variants={itemVariants} className="flex items-center">
              {userId === 'TozfQg0dAHe4ToLyiSnkDqe3ECj2' ? (
                <JohnRobertsProfileImage
                  size="md"
                />
              ) : (
                <ProfileImage
                  photoURL={photoURL}
                  profilePicture={profilePicture}
                  displayName={displayName}
                  size="md"
                />
              )}
              <div className="ml-3">
                <motion.h3
                  variants={itemVariants}
                  className={`text-base font-medium text-text-primary`}
                >
                  {displayName}
                </motion.h3>
                {reputationScore > 0 && (
                  <motion.div
                    variants={itemVariants}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <ReputationBadge score={reputationScore} size="sm" />
                  </motion.div>
                )}
              </div>
            </motion.div>

            {bio && (
              <motion.p
                variants={itemVariants}
                className={`mt-2 text-sm text-text-muted line-clamp-2`}
              >
                {bio}
              </motion.p>
            )}

            {skills.length > 0 && (
              <motion.div variants={itemVariants} className="mt-3">
                <AnimatedList
                  className="flex flex-wrap gap-1.5"
                  animation="slideUp"
                  staggerDelay={0.02}
                  duration={0.2}
                >
                  {skills.slice(0, 4).map((skill) => (
                    <SkillBadge
                      key={skill.id}
                      skill={skill.name}
                      level={skill.level}
                      size="sm"
                    />
                  ))}

                  {skills.length > 4 && (
                    <span className="inline-flex items-center rounded-full bg-background-secondary px-2 py-0.5 text-xs font-medium text-text-secondary">
                      +{skills.length - 4} more
                    </span>
                  )}
                </AnimatedList>
              </motion.div>
            )}

            <motion.div
              variants={itemVariants}
              className="mt-3 text-right"
            >
              <Link
                to={`/profile/${userId}`}
                className="text-sm font-medium text-primary hover:text-primary/90 transition-colors duration-200"
              >
                View full profile
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ProfileHoverCard;
