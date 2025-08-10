import React from 'react';
import { CollaborationApplication } from '../../../services/firestore-exports';
import { cn } from '../../../utils/cn';
import { Calendar } from 'lucide-react';
import ProfileHoverCard from '../../ui/ProfileHoverCard';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { formatDate } from '../../../utils/dateUtils';
import { getProfileImageUrl } from '../../../utils/imageUtils';

interface CollaborationApplicationCardProps {
  application: CollaborationApplication;
  isOwner: boolean;
  onAccept?: (applicationId: string) => void;
  onReject?: (applicationId: string) => void;
  className?: string;
  // Enhanced Card customization props for collaboration applications
  variant?: 'default' | 'glass' | 'elevated' | 'premium';
  enhanced?: boolean; // Enable/disable enhanced effects
}

const statusLabels = {
  'pending': 'Pending',
  'accepted': 'Accepted',
  'rejected': 'Rejected'
};

export const CollaborationApplicationCard: React.FC<CollaborationApplicationCardProps> = ({
  application,
  isOwner,
  onAccept,
  onReject,
  className,
  variant = 'elevated', // Default to elevated for application importance
  enhanced = true // Enable enhanced effects by default
}) => {
  // Format date
  const formattedDate = formatDate(application.createdAt);

  return (
    <Card 
      // Enhanced Card props for collaboration application styling
      variant={variant}
      tilt={enhanced}
      tiltIntensity={4} // Moderate tilt for professional feel
      depth="md"
      glow={enhanced ? "subtle" : "none"}
      glowColor="purple" // Purple for collaboration/creativity theme
      hover={true}
      interactive={true}
      className={cn(className)}
    >
      <CardHeader>
        <div className="flex justify-between items-start">
          <ProfileHoverCard
            userId={application.applicantId}
            displayName={application.applicantName ?? `User ${application.applicantId.substring(0, 5)}`}
            photoURL={application.applicantPhotoURL}
          >
            <div className="flex items-center">
              <img
                src={getProfileImageUrl(application.applicantPhotoURL ?? null, 40)}
                alt={application.applicantName ?? 'User'}
                className="h-10 w-10 rounded-full mr-3"
              />
              <div>
                <CardTitle className="text-base hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200">
                  {application.applicantName ?? `User ${application.applicantId.substring(0, 5)}`}
                </CardTitle>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <Calendar className="mr-1 h-3.5 w-3.5" />
                  <span>Applied {formattedDate}</span>
                </div>
              </div>
            </div>
          </ProfileHoverCard>
          
          <Badge variant={application.status === 'pending' ? 'default' : application.status === 'accepted' ? 'default' : 'destructive'}>
            {statusLabels[application.status]}
          </Badge>
        </div>
      </CardHeader>
        
      <CardContent>
        <p className="text-sm text-muted-foreground whitespace-pre-line">
          {application.message}
        </p>
      </CardContent>
        
      {isOwner && application.status === 'pending' && application.id && (
        <CardFooter className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={() => onReject?.(application.id!)}
          >
            Decline
          </Button>
          
          <Button
            onClick={() => onAccept?.(application.id!)}
          >
            Accept
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default CollaborationApplicationCard;
