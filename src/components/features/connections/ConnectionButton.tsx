import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../AuthContext';
import { getConnections, getConnectionRequests, updateConnectionStatus, removeConnection } from '../../../services/firestore-exports';
import { useToast } from '../../../contexts/ToastContext';
import { Modal } from '../../ui/Modal';
import ConnectionRequestForm from './ConnectionRequestForm';
import { UserPlus, UserCheck, UserX, Loader2 } from 'lucide-react';
import { Button } from '../../ui/Button';

interface ConnectionButtonProps {
  userId: string;
  userName: string;
  userPhotoURL?: string;
}

export const ConnectionButton: React.FC<ConnectionButtonProps> = ({
  userId,
  userName,
  userPhotoURL
}) => {
  const { currentUser } = useAuth();
  const { addToast } = useToast();

  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [direction, setDirection] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRequestForm, setShowRequestForm] = useState(false);

  const fetchConnectionStatus = useCallback(async () => {
    if (!currentUser) return;

    setLoading(true);

    try {
      // Check for an accepted connection
      const { data: connections, error: connectionsError } = await getConnections(currentUser.uid);
      if (connectionsError) throw connectionsError;

      const acceptedConnection = connections?.find(conn => 
        (conn.userId === currentUser.uid && conn.connectedUserId === userId) ||
        (conn.userId === userId && conn.connectedUserId === currentUser.uid)
      );

      if (acceptedConnection) {
        setConnectionStatus('accepted');
        setConnectionId(acceptedConnection.id || null);
        setDirection(acceptedConnection.userId === currentUser.uid ? 'sent' : 'received');
      } else {
        // Check for a pending request sent by the current user
        const { data: sentRequests, error: sentRequestsError } = await getConnectionRequests(currentUser.uid);
        if (sentRequestsError) throw sentRequestsError;

        const sentPending = sentRequests?.find(req => req.connectedUserId === userId);

        if (sentPending) {
          setConnectionStatus('pending');
          setConnectionId(sentPending.id || null);
          setDirection('sent');
        } else {
          // Check for a pending request received by the current user
          const { data: receivedRequests, error: receivedRequestsError } = await getConnectionRequests(currentUser.uid);
          if (receivedRequestsError) throw receivedRequestsError;

          const receivedPending = receivedRequests?.find(req => req.userId === userId);

          if (receivedPending) {
            setConnectionStatus('pending');
            setConnectionId(receivedPending.id || null);
            setDirection('received');
          } else {
            // No connection or pending request found
            setConnectionStatus('none');
            setConnectionId(null);
            setDirection(null);
          }
        }
      }

    } catch (err: unknown) {
      console.error('Error checking connection status:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to check connection status';
      addToast('error', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentUser, userId, addToast]);

  useEffect(() => {
    if (currentUser && userId) {
      fetchConnectionStatus();
    }
  }, [currentUser, userId, fetchConnectionStatus]);

  const handleConnect = () => {
    setShowRequestForm(true);
  };

  const handleAccept = async () => {
    if (!connectionId || !currentUser) return;

    setLoading(true);

    try {
      const { error } = await updateConnectionStatus(currentUser.uid, connectionId, 'accepted');

      if (error) {
        // Pass error message instead of the entire object
        throw new Error(error.message);
      }

      setConnectionStatus('accepted');
      addToast('success', `You are now connected with ${userName}`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to accept connection request';
      addToast('error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!connectionId || !currentUser) return;

    setLoading(true);

    try {
      const { error } = await removeConnection(currentUser.uid, connectionId);

      if (error) {
        // Pass error message instead of the entire object
        throw new Error(error.message);
      }

      setConnectionStatus('none');
      setConnectionId(null);
      setDirection(null);
      addToast('success', 'Connection request rejected');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reject connection request';
      addToast('error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!connectionId || !currentUser) return;

    setLoading(true);

    try {
      const { error } = await removeConnection(currentUser.uid, connectionId);

      if (error) {
        // Pass error message instead of the entire object
        throw new Error(error.message);
      }

      setConnectionStatus('none');
      setConnectionId(null);
      setDirection(null);
      addToast('success', 'Connection removed');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove connection';
      addToast('error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSuccess = () => {
    setShowRequestForm(false);
    setConnectionStatus('pending');
    setDirection('sent');
    fetchConnectionStatus(); // Refresh the status
  };

  // Don't show the button if it's the current user's profile
  if (currentUser?.uid === userId) {
    return null;
  }

  if (loading) {
    return (
      <Button disabled isLoading>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  if (connectionStatus === 'accepted') {
    return (
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="icon" disabled>
          <UserCheck className="h-4 w-4" />
        </Button>

        <Button onClick={handleRemove} variant="destructive" size="icon">
          <UserX className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  if (connectionStatus === 'pending' && direction === 'sent') {
    return (
      <Button onClick={handleRemove} variant="outline" size="icon">
        <UserX className="h-4 w-4" />
      </Button>
    );
  }

  if (connectionStatus === 'pending' && direction === 'received') {
    return (
      <div className="flex items-center space-x-2">
        <Button onClick={handleAccept} variant="default" size="icon">
          <UserCheck className="h-4 w-4" />
        </Button>

        <Button onClick={handleReject} variant="destructive" size="icon">
          <UserX className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <>
      <Button onClick={handleConnect} variant="default" size="icon">
        <UserPlus className="h-4 w-4" />
      </Button>

      <Modal
        isOpen={showRequestForm}
        onClose={() => setShowRequestForm(false)}
        title="Send Connection Request"
      >
        <ConnectionRequestForm
          receiverId={userId}
          receiverName={userName}
          receiverPhotoURL={userPhotoURL}
          onSuccess={handleRequestSuccess}
          onCancel={() => setShowRequestForm(false)}
        />
      </Modal>
    </>
  );
};

export default ConnectionButton;
