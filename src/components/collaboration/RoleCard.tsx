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
  onAbandon
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
        variant="premium"
        depth="lg"
        glow="subtle"
        glowColor="auto"
        hover={true}
        interactive={true}
        className="min-h-[400px] flex flex-col cursor-pointer overflow-hidden"
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
        <CardContent className="flex-1 flex flex-col gap-4 py-4">
          {/* Description */}
          {role.description && (
            <div className="flex-1">
              <p className="text-sm text-muted-foreground line-clamp-4 leading-relaxed">{role.description}</p>
            </div>
          )}
          
          {/* Skills Summary - Compact view */}
          {role.requiredSkills && role.requiredSkills.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {role.requiredSkills.slice(0, 4).map((skill) => (
                <Badge key={skill.name} variant="secondary" className="text-xs font-medium px-2 py-1">
                  {skill.name}
                </Badge>
              ))}
              {role.requiredSkills.length > 4 && (
                <Badge variant="outline" className="text-xs font-medium px-2 py-1">
                  +{role.requiredSkills.length - 4} more
                </Badge>
              )}
            </div>
          ) : (
            <Badge variant="outline" className="text-xs font-medium px-2 py-1 opacity-60 w-fit">
              No skills specified
            </Badge>
          )}

          {/* Application Count for Creators */}
          {role.applicationCount !== undefined && role.applicationCount > 0 && isCreator && (
            <div className="mt-auto pt-4 border-t border-border">
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
                  className={cn('text-muted-foreground hover:text-foreground mr-4 transition-colors')}
                >
                  Edit
                </button>
              )}
              {role.status === RoleState.FILLED && onAbandon && (
                <button
                  onClick={onAbandon}
                  className={cn('text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 mr-4 transition-colors')}
                  aria-label={`Abandon role ${role.title}`}
                >
                  Abandon Role
                </button>
              )}
              <button
                onClick={onManage}
                className={cn('bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors')}
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
                  className={cn('bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors')}
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
                  className={cn('bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors')}
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
