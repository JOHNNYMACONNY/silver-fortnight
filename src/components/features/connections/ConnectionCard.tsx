// To fix "Cannot find module 'react'": ensure 'react' and '@types/react' are installed (e.g., npm install react @types/react) and tsconfig.json is correctly configured.
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Connection, User } from '../../../services/firestore-exports';
import { getUserProfile } from '../../../services/firestore-exports';
import { cn } from '../../../utils/cn';
import { Calendar, MessageCircle, UserCheck, UserX } from 'lucide-react';
import ProfileAvatarButton from '../../ui/ProfileAvatarButton';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { Card, CardHeader, CardContent, CardTitle } from '../../ui/Card';
import { formatDate } from '../../../utils/dateUtils';
import { logger } from '@utils/logging/logger';

interface ConnectionCardProps {
  connection: Connection;
  currentUserId: string;
  onAccept?: (connectionId: string) => void;
  onReject?: (connectionId: string) => void;
  onRemove?: (connectionId: string) => void;
  className?: string;
  // Enhanced Card customization props for standardization
  variant?: 'default' | 'glass' | 'elevated' | 'premium'; // Allow premium variant for consistency
  enhanced?: boolean; // Enable enhanced effects by default
}

export const ConnectionCard: React.FC<ConnectionCardProps> = ({
  connection,
  currentUserId,
  onAccept,
  onReject,
  onRemove,
  className,
  variant = 'premium', // Premium variant for consistency with CollaborationCard
  enhanced = true
}) => {
  // Assert additional properties on the connection object
  const typedConnection = connection as Connection & {
    senderId: string;
    receiverId: string;
    senderName: string;
    receiverName: string;
    senderPhotoURL?: string;
    receiverPhotoURL?: string;
    message?: string; // Add this line
    // Old format fields for backward compatibility
    userId?: string;
    connectedUserId?: string;
  };

  // State for fallback user data
  const [fallbackUserData, setFallbackUserData] = useState<{
    senderData?: User;
    receiverData?: User;
  }>({});

  // Handle both old and new connection data formats
  const isNewFormat = typedConnection.senderId !== undefined;
  
  // Determine if the current user is the sender or receiver
  const isSender = isNewFormat 
    ? typedConnection.senderId === currentUserId
    : typedConnection.userId === currentUserId;

  // Get the other user's details (supporting both formats)
  const otherUserId = isNewFormat
    ? (isSender ? typedConnection.receiverId : typedConnection.senderId)
    : (isSender ? typedConnection.connectedUserId : typedConnection.userId);
    
  const otherUserName = isNewFormat
    ? (isSender ? typedConnection.receiverName : typedConnection.senderName)
    : undefined; // Old format doesn't have names
    
  const otherUserPhoto = isNewFormat
    ? (isSender ? typedConnection.receiverPhotoURL : typedConnection.senderPhotoURL)
    : undefined; // Old format doesn't have photos

  // Fallback logic for missing names - same as UserCard
  const getEffectiveDisplayName = (user: User | undefined, originalName: string | undefined, userId: string | undefined): string => {
    if (originalName) return originalName;
    if (user) {
      return user.displayName || (user as any).name || user.email || `User ${userId?.substring(0, 5) || 'Unknown'}`;
    }
    return `User ${userId?.substring(0, 5) || 'Unknown'}`;
  };

  // Get effective names using fallback logic
  const effectiveOtherUserName = getEffectiveDisplayName(
    isSender ? fallbackUserData.receiverData : fallbackUserData.senderData,
    otherUserName,
    otherUserId
  );

  // Fetch user data when names are missing
  useEffect(() => {
    const fetchMissingUserData = async () => {
      logger.debug('🔍 ConnectionCard: Checking if user data fetch needed', 'COMPONENT', {
        senderName: typedConnection.senderName,
        receiverName: typedConnection.receiverName,
        senderId: typedConnection.senderId,
        receiverId: typedConnection.receiverId,
        userId: typedConnection.userId,
        connectedUserId: typedConnection.connectedUserId,
        otherUserId,
        isSender,
        isNewFormat,
        otherUserName
      });

      // For old format connections, we always need to fetch the other user's data since names don't exist
      // For new format connections, only fetch if name is missing but ID exists
      const needsOtherUserData = !otherUserName && otherUserId;
      
      const needsSenderData = isNewFormat && !typedConnection.senderName && typedConnection.senderId;
      const needsReceiverData = isNewFormat && !typedConnection.receiverName && typedConnection.receiverId;

      logger.debug('🔍 ConnectionCard: Fetch requirements', 'COMPONENT', {
        needsOtherUserData,
        needsSenderData,
        needsReceiverData,
        oldFormat: !isNewFormat
      });

      if (!needsOtherUserData && !needsSenderData && !needsReceiverData) {
        logger.debug('🔍 ConnectionCard: No fetch needed, exiting', 'COMPONENT');
        return;
      }

      try {
        logger.debug('🚀 ConnectionCard: Starting user data fetch...', 'COMPONENT');
        const fetchPromises: Promise<any>[] = [];
        
        // Handle old format - fetch the other user's data
        if (needsOtherUserData) {
          logger.debug('📞 ConnectionCard: Fetching other user data for (old format):', 'COMPONENT', otherUserId);
          fetchPromises.push(
            getUserProfile(otherUserId).then(result => ({
              type: isSender ? 'receiver' : 'sender',
              data: result.data
            }))
          );
        }
        
        // Handle new format - fetch missing sender/receiver data
        if (needsSenderData) {
          logger.debug('📞 ConnectionCard: Fetching sender data for:', 'COMPONENT', typedConnection.senderId);
          fetchPromises.push(
            getUserProfile(typedConnection.senderId).then(result => ({
              type: 'sender',
              data: result.data
            }))
          );
        }

        if (needsReceiverData) {
          logger.debug('📞 ConnectionCard: Fetching receiver data for:', 'COMPONENT', typedConnection.receiverId);
          fetchPromises.push(
            getUserProfile(typedConnection.receiverId).then(result => ({
              type: 'receiver', 
              data: result.data
            }))
          );
        }

        const results = await Promise.all(fetchPromises);
        logger.debug('📄 ConnectionCard: Fetch results:', 'COMPONENT', results);
        
        const newFallbackData: { senderData?: User; receiverData?: User } = {};
        
        results.forEach(result => {
          if (result.type === 'sender' && result.data) {
            logger.debug('✅ ConnectionCard: Got sender data:', 'COMPONENT', result.data);
            newFallbackData.senderData = result.data;
          } else if (result.type === 'receiver' && result.data) {
            logger.debug('✅ ConnectionCard: Got receiver data:', 'COMPONENT', result.data);
            newFallbackData.receiverData = result.data;
          }
        });

        logger.debug('🎯 ConnectionCard: Setting fallback data:', 'COMPONENT', newFallbackData);
        setFallbackUserData(newFallbackData);
      } catch (error) {
        logger.error('❌ ConnectionCard: Error fetching fallback user data:', 'COMPONENT', {}, error as Error);
      }
    };

    fetchMissingUserData();
  }, [typedConnection.senderId, typedConnection.receiverId, typedConnection.senderName, typedConnection.receiverName, typedConnection.userId, typedConnection.connectedUserId, otherUserId, isSender, isNewFormat, otherUserName]);

  // Format date
  const formattedDate = formatDate(typedConnection.createdAt);

  // Add navigation handlers for whole-card click
  const navigate = useNavigate();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      // Don't navigate if focus is on interactive elements
      if ((e.target as HTMLElement).tagName === 'BUTTON') {
        return;
      }
      e.preventDefault();
      navigate(`/profile/${otherUserId}`);
    }
  };

  return (
    <div
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`View connection with ${effectiveOtherUserName}`}
      className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg"
    >
      <Card 
        // Enhanced Card props for connection standardization
        variant="premium" // Use premium variant for consistency with CollaborationCard
        tilt={enhanced}
        depth="lg" // Large depth for consistency
        glow={enhanced ? "subtle" : "none"}
        glowColor="blue" // Blue for connection/trust theme
        hover={true}
        interactive={true}
        onClick={() => navigate(`/profile/${otherUserId}`)} // Add whole-card navigation
        className={cn("h-[380px] flex flex-col cursor-pointer overflow-hidden", className)} // Fixed height
      >
        {/* Standardized Header: Profile + Name + Status */}
        <CardHeader className="pb-3 flex-shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {/* Clickable Profile Avatar - 32px standard */}
              <ProfileAvatarButton
                userId={otherUserId}
                size={32}
                className="flex-shrink-0"
              />
              
              {/* User Name (truncated) - Using effective name with fallback */}
              <CardTitle className="truncate text-base font-semibold">
                {effectiveOtherUserName}
              </CardTitle>
            </div>

            {/* Status Badge in header position */}
            <div className="flex-shrink-0">
              {typedConnection.status === 'pending' && !isSender && (
                <Badge variant="secondary">Pending</Badge>
              )}
              {typedConnection.status === 'pending' && isSender && (
                <Badge variant="default">Sent</Badge>
              )}
              {typedConnection.status === 'accepted' && (
                <Badge variant="default">Connected</Badge>
              )}
            </div>
          </div>
        </CardHeader>

        {/* Content Section */}
        <CardContent className="flex-1 overflow-hidden px-4 pb-4">
          {/* Date Information */}
          <div className="flex items-center text-sm text-muted-foreground mb-4">
            <Calendar className="mr-1.5 h-4 w-4" />
            <span>{typedConnection.status === 'pending' ? 'Requested' : 'Connected'} {formattedDate}</span>
          </div>

          {/* Connection Message */}
          {typedConnection.message && (
            <div className="mb-4">
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {typedConnection.message}
              </p>
            </div>
          )}

          {/* Connection Actions - Bottom Section */}
          <div className="mt-auto pt-2">
            <div className="flex flex-wrap gap-2 justify-end">
              {/* Accepted Status Actions */}
              {typedConnection.status === 'accepted' && (
                <>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/messages?userId=${otherUserId}`}>
                      <MessageCircle className="mr-1.5 h-4 w-4" />
                      Message
                    </Link>
                  </Button>

                  <Button
                    onClick={(e) => { e.stopPropagation(); typedConnection.id && onRemove?.(typedConnection.id) }}
                    variant="destructive"
                    size="sm"
                  >
                    <UserX className="mr-1.5 h-4 w-4" />
                    Remove
                  </Button>
                </>
              )}

              {/* Pending Request Actions (Receiver) */}
              {typedConnection.status === 'pending' && !isSender && (
                <>
                  <Button
                    onClick={(e) => { e.stopPropagation(); typedConnection.id && onReject?.(typedConnection.id) }}
                    variant="outline"
                    size="sm"
                  >
                    <UserX className="mr-1.5 h-4 w-4" />
                    Decline
                  </Button>

                  <Button
                    onClick={(e) => { e.stopPropagation(); typedConnection.id && onAccept?.(typedConnection.id) }}
                    variant="default"
                    size="sm"
                  >
                    <UserCheck className="mr-1.5 h-4 w-4" />
                    Accept
                  </Button>
                </>
              )}

              {/* Pending Request Actions (Sender) */}
              {typedConnection.status === 'pending' && isSender && (
                <Button
                  onClick={(e) => { e.stopPropagation(); typedConnection.id && onRemove?.(typedConnection.id) }}
                  variant="outline"
                  size="sm"
                >
                  <UserX className="mr-1.5 h-4 w-4" />
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConnectionCard;
