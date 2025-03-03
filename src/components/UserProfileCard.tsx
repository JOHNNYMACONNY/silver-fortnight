import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, MessageSquare, ExternalLink, Clock } from 'lucide-react';
import { ProfilePicture } from './ProfilePicture';
import { sendConnectionRequest } from '../lib/networking';
import { startConversation } from '../lib/messaging';
import type { UserProfile } from '../types';

interface UserProfileCardProps {
  profile: UserProfile;
  currentUserId?: string;
  connectionStatus: 'none' | 'pending' | 'accepted';
  onConnect?: (success: boolean) => void;
  onMessage?: (profile: UserProfile) => void;
}

export function UserProfileCard({ 
  profile, 
  currentUserId,
  connectionStatus: initialStatus,
  onConnect,
  onMessage 
}: UserProfileCardProps) {
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'pending' | 'accepted'>(initialStatus);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Update connection status when prop changes
  useEffect(() => {
    if (initialStatus !== connectionStatus) {
      setConnectionStatus(initialStatus);
    }
  }, [initialStatus]);

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
      onMessage?.(profile);
    } catch (err) {
      console.error('Failed to start conversation:', err);
      setError('Failed to start conversation');
    } finally {
      setIsStartingChat(false);
    }
  };

  const handleConnect = async () => {
    if (!currentUserId || isConnecting || !profile.id) {
      console.warn('Invalid state for connection:', { currentUserId, isConnecting, profileId: profile.id });
      return;
    }
    
    setIsConnecting(true);
    setError(null);
    
    try {
      await sendConnectionRequest(currentUserId, profile.id);
      setConnectionStatus('pending');
      onConnect?.(true);
    } catch (err) {
      console.error('Failed to send connection request:', err);
      setConnectionStatus('none');
      setError('Failed to send connection request');
      onConnect?.(false);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="card p-6">
      <div className="flex items-start gap-4">
        <Link to={`/users/${profile.id}`}>
          <ProfilePicture url={profile.profilePicture} size="lg" />
        </Link>
        <div className="flex-1 min-w-0">
          <Link 
            to={`/users/${profile.id}`}
            className="text-lg font-medium text-gray-900 truncate hover:text-accent-clay transition-colors"
          >
            {profile.displayName}
          </Link>
          {profile.portfolio && (
            <a
              href={profile.portfolio}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-accent-clay hover:text-accent-ochre flex items-center gap-1"
            >
              Portfolio <ExternalLink className="h-3 w-3" />
            </a>
          )}
          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
            {profile.bio || 'No bio available'}
          </p>
          {error && (
            <p className="text-sm text-accent-rust mt-2">
              {error}
            </p>
          )}
        </div>
      </div>

      {/* Skills */}
      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">
          Top Skills
        </h4>
        <div className="flex flex-wrap gap-2">
          {(profile.skills || []).slice(0, 3).map((skill) => (
            <span
              key={skill}
              className="px-2 py-1 bg-accent-sage/20 text-gray-900 text-sm rounded-full border border-accent-sage/30"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div 
        className="mt-4 pt-4 border-t border-earth-700 flex gap-2" 
        key={`${profile.id}-${connectionStatus}`}
      >
        {connectionStatus === 'accepted' ? (
          <button
            onClick={handleMessage}
            disabled={isStartingChat || !currentUserId || !profile.id}
            className="flex-1 btn-primary flex items-center justify-center gap-2"
          >
            {isStartingChat ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Starting chat...
              </>
            ) : (
              <>
                <MessageSquare className="h-4 w-4" />
                Message
              </>
            )}
          </button>
        ) : connectionStatus === 'pending' ? (
          <button
            disabled
            className="flex-1 btn-secondary flex items-center justify-center gap-2 opacity-75 cursor-not-allowed"
          >
            <Clock className="h-4 w-4" />
            Request Pending
          </button>
        ) : (
          <button
            onClick={handleConnect}
            disabled={isConnecting || !currentUserId || !profile.id}
            className="flex-1 btn-primary flex items-center justify-center gap-2"
          >
            {isConnecting ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                Connect
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
