import React from 'react';
import { CollaborationRoleData, RoleState } from '../../types/collaboration';
import { SkillBadge } from '../ui/SkillBadge';
import ProfileImageWithUser from '../ui/ProfileImageWithUser';
import ProfileAvatarButton from '../ui/ProfileAvatarButton';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import Box from '../layout/primitives/Box';

interface RoleCardProps {
  role: CollaborationRoleData;
  collaborationId: string;
  isCreator: boolean;
  onApply?: () => void;
  onManage?: () => void;
  onEdit?: () => void;
  onRequestCompletion?: () => void;
  onAbandon?: () => void;
  // Enhanced Card customization props
  variant?: 'default' | 'glass' | 'elevated' | 'premium';
  enhanced?: boolean;
}

// Create a stable composite key for roles
const createRoleKey = (roleId: string, collaborationId: string, context: string) => {
  return `role-${roleId}-collab-${collaborationId}-${context}`;
};

export const RoleCard: React.FC<RoleCardProps> = ({
  role,
  collaborationId,
  isCreator,
  onApply,
  onManage,
  onEdit,
  onRequestCompletion,
  onAbandon,
  variant = 'premium', // Default to premium for role importance
  enhanced = true // Enable enhanced effects by default
}) => {
  // Determine avatar user ID (use participantId if available, else fallback)
  const avatarUserId = role.participantId || '';
  // Fallback for title
  const displayTitle = role.title && role.title.trim() ? role.title : 'Untitled Role';

  // Keyboard activation handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if ((e.key === 'Enter' || e.key === ' ') && (onManage || onApply)) {
      e.preventDefault();
      if (isCreator && onManage) onManage();
      else if (!isCreator && onApply) onApply();
    }
  };

  return (
    <Box
      tabIndex={0}
      role="group"
      aria-label={`Role: ${displayTitle}`}
      onKeyDown={handleKeyDown}
      className="focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 rounded-lg @container"
      style={{ containerType: 'inline-size' }}
    >
      <Card 
        variant={variant}
        tilt={enhanced}
        tiltIntensity={4} // Moderate tilt for professional feel
        depth="lg"
        glow={enhanced ? "subtle" : "none"}
        glowColor="purple" // Purple for collaboration/creativity theme
        hover={true}
        interactive={true}
        className="h-[380px] flex flex-col cursor-pointer overflow-hidden"
      >
        <CardHeader className="pb-3 flex-shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {/* Avatar in header */}
              <ProfileAvatarButton userId={avatarUserId} size={32} className="flex-shrink-0" />
              <CardTitle className="truncate text-base font-semibold">
                {displayTitle}
              </CardTitle>
            </div>
            {/* Status badge using shared Badge component */}
            {role.status && (
              <Badge variant={
                role.status === RoleState.OPEN ? 'default' :
                role.status === RoleState.FILLED ? 'secondary' :
                role.status === RoleState.COMPLETED ? 'outline' :
                role.status === RoleState.ABANDONED ? 'destructive' :
                'secondary'
              }>
                {role.status.charAt(0) + role.status.slice(1).toLowerCase()}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-2">
          {/* Description */}
          {role.description && (
            <p className="text-sm text-muted-foreground line-clamp-3 mb-2">{role.description}</p>
          )}
          {/* Skills (show up to 3 requiredSkills as badges, '+N more' if more) */}
          {role.requiredSkills && role.requiredSkills.length > 0 ? (
            <div className="flex flex-wrap gap-1 mt-1">
              {role.requiredSkills.slice(0, 3).map((skill) => (
                <Badge key={skill.name} variant="secondary" className="text-xs font-medium px-2 py-0.5">
                  {skill.name}
                </Badge>
              ))}
              {role.requiredSkills.length > 3 && (
                <Badge variant="outline" className="text-xs font-medium px-2 py-0.5">
                  +{role.requiredSkills.length - 3} more
                </Badge>
              )}
            </div>
          ) : (
            <Badge variant="outline" className="text-xs font-medium px-2 py-0.5 opacity-60">
              No skills specified
            </Badge>
          )}
          {/* Required Skills */}
          <div className="mt-4">
            <h4 className="text-sm font-medium text-foreground">Required Skills</h4>
            <div className="mt-1 flex flex-wrap gap-2">
              {role.requiredSkills?.map((skill) => (
                <SkillBadge
                  key={createRoleKey(role.id, collaborationId, `required-${skill.name}`)}
                  skill={skill.name}
                  level={
                    skill.level === 'beginner' || skill.level === 'intermediate' || skill.level === 'advanced' || skill.level === 'expert'
                      ? skill.level
                      : 'intermediate'
                  }
                />
              ))}
            </div>
          </div>

          {role.preferredSkills && role.preferredSkills.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-foreground">Preferred Skills</h4>
              <div className="mt-1 flex flex-wrap gap-2">
                {role.preferredSkills.map((skill) => (
                  <SkillBadge
                    key={createRoleKey(role.id, collaborationId, `preferred-${skill.name}`)}
                    skill={skill.name}
                    level={
                      skill.level === 'beginner' || skill.level === 'intermediate' || skill.level === 'advanced' || skill.level === 'expert'
                        ? skill.level
                        : 'intermediate'
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {/* Remove participant avatar from content section */}
          {/* {role.participantId && (
            <div className="mt-4 border-t border-border pt-4">
              <h4 className="text-sm font-medium text-foreground">Assigned To</h4>
              <div className="mt-1">
                <ProfileImageWithUser
                  userId={role.participantId}
                  profileUrl={role.participantPhotoURL}
                  size="small"
                />
              </div>
            </div>
          )} */}

          {role.applicationCount !== undefined && role.applicationCount > 0 && isCreator && (
            <div className="mt-4 border-t border-border pt-4">
              <span className="text-sm font-medium text-foreground">
                {role.applicationCount} application{role.applicationCount !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end">
          {/* Actions will be updated in next steps */}
          {isCreator ? (
            <>
              {role.status !== RoleState.COMPLETED && role.status !== RoleState.ABANDONED && (
                <button
                  onClick={onEdit}
                  className={cn('inline-flex items-center px-3 py-1.5 border border-border rounded-md shadow-sm text-sm font-medium text-foreground bg-card hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring mr-2 transition-colors')}
                  aria-label={`Edit role ${role.title}`}
                >
                  Edit
                </button>
              )}
              {role.status === RoleState.FILLED && onAbandon && (
                <button
                  onClick={onAbandon}
                  className={cn('inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 dark:text-amber-300 dark:bg-amber-900/20 dark:hover:bg-amber-900/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 mr-2 transition-colors')}
                  aria-label={`Abandon role ${role.title}`}
                >
                  Abandon Role
                </button>
              )}
              <button
                onClick={onManage}
                className={cn('inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors')}
                aria-label={`${role.status === RoleState.OPEN ? 'Manage applications' : 'Manage role'} for ${role.title}`}
              >
                {role.status === RoleState.OPEN ? 'Manage Applications' : 'Manage Role'}
              </button>
            </>
          ) : (
            <>
              {role.status === RoleState.OPEN && (
                <button
                  onClick={onApply}
                  className={cn('inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors')}
                  aria-label={`Apply for ${role.title}`}
                >
                  Apply
                </button>
              )}
              {role.status === RoleState.FILLED &&
               role.participantId &&
               onRequestCompletion &&
               !role.completionStatus && (
                <button
                  onClick={onRequestCompletion}
                  className={cn('inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors')}
                  aria-label={`Request completion for ${role.title}`}
                >
                  Request Role Completion
                </button>
              )}
            </>
          )}
        </CardFooter>
      </Card>
    </Box>
  );
};

export default RoleCard;
