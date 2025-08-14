import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import {
  getConnections,
  getConnectionRequests,
  getSentConnectionRequests,
  updateConnectionStatus,
  removeConnection
} from '../services/firestore-exports';
import ConnectionsList from '../components/features/connections/ConnectionsList';
import { useToast } from '../contexts/ToastContext';
import { UserPlus, UserCheck, Clock } from 'lucide-react';


type TabType = 'connections' | 'requests' | 'sent';

export const ConnectionsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<TabType>('connections');
  const [connections, setConnections] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser, activeTab]);

  const fetchData = async () => {
    if (!currentUser) return;

    setLoading(true);
    setError(null);

    try {
      switch (activeTab) {
        case 'connections': {
          const { data: connectionsList, error: connectionsError } = await getConnections(currentUser.uid);
          if (connectionsError) throw new Error(connectionsError.message);
          setConnections(connectionsList || []);
          break;
        }

        case 'requests': {
          const { data: requestsList, error: requestsError } = await getConnectionRequests(currentUser.uid);
          if (requestsError) throw new Error(requestsError.message);
          setRequests(requestsList || []);
          break;
        }

        case 'sent': {
          const { data: sentList, error: sentError } = await getSentConnectionRequests(currentUser.uid);
          if (sentError) throw new Error(sentError.message);
          setSentRequests(sentList || []);
          break;
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      addToast('error', err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (connectionId: string) => {
    if (!currentUser) return;
    
    try {
      const { error } = await updateConnectionStatus(currentUser.uid, connectionId, 'accepted');

      if (error) {
        throw new Error(error.message);
      }

      addToast('success', 'Connection request accepted');

      // Update the requests list
      setRequests(requests.filter(request => request.id !== connectionId));

      // Refresh connections if we're on the connections tab
      if (activeTab === 'connections') {
        fetchData();
      }
    } catch (err: any) {
      addToast('error', err.message || 'Failed to accept connection request');
    }
  };

  const handleReject = async (connectionId: string) => {
    if (!currentUser) return;
    
    try {
      const { error } = await removeConnection(currentUser.uid, connectionId);

      if (error) {
        throw new Error(error.message);
      }

      addToast('success', 'Connection request rejected');

      // Update the requests list
      setRequests(requests.filter(request => request.id !== connectionId));
    } catch (err: any) {
      addToast('error', err.message || 'Failed to reject connection request');
    }
  };

  const handleRemove = async (connectionId: string) => {
    if (!currentUser) return;
    
    try {
      const { error } = await removeConnection(currentUser.uid, connectionId);

      if (error) {
        throw new Error(error.message);
      }

      addToast('success', 'Connection removed');

      // Update the appropriate list based on the active tab
      if (activeTab === 'connections') {
        setConnections(connections.filter(connection => connection.id !== connectionId));
      } else if (activeTab === 'sent') {
        setSentRequests(sentRequests.filter(request => request.id !== connectionId));
      }
    } catch (err: any) {
      addToast('error', err.message || 'Failed to remove connection');
    }
  };

  if (!currentUser) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-card p-6 rounded-lg shadow-sm border border-border text-center transition-all">
          <h2 className="text-xl font-semibold text-foreground mb-4">Sign in Required</h2>
          <p className="text-muted-foreground mb-6">
            You need to be signed in to view your connections.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="glassmorphic rounded-xl px-4 py-4 md:px-6 md:py-5 flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Connections</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your professional network
          </p>
        </div>
      </div>

      <div className="mb-8">
        <nav className="glassmorphic rounded-xl px-2 py-2 flex space-x-2" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('connections')}
            className={`px-3 py-2 font-medium text-sm rounded-md flex items-center transition-colors ${
              activeTab === 'connections'
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <UserCheck className="mr-2 h-5 w-5" />
            My Connections
            {connections.length > 0 && (
              <span className="ml-2 bg-primary/20 text-primary py-0.5 px-2 rounded-full text-xs">
                {connections.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`px-3 py-2 font-medium text-sm rounded-md flex items-center transition-colors ${
              activeTab === 'requests'
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <UserPlus className="mr-2 h-5 w-5" />
            Requests
            {requests.length > 0 && (
              <span className="ml-2 bg-primary/20 text-primary py-0.5 px-2 rounded-full text-xs">
                {requests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('sent')}
            className={`px-3 py-2 font-medium text-sm rounded-md flex items-center transition-colors ${
              activeTab === 'sent'
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Clock className="mr-2 h-5 w-5" />
            Sent
            {sentRequests.length > 0 && (
              <span className="ml-2 bg-primary/20 text-primary py-0.5 px-2 rounded-full text-xs">
                {sentRequests.length}
              </span>
            )}
          </button>
        </nav>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {activeTab === 'connections' && (
            <ConnectionsList
              connections={connections}
              currentUserId={currentUser.uid}
              onRemove={handleRemove}
              emptyMessage="You don't have any connections yet. Connect with other users to grow your network."
            />
          )}

          {activeTab === 'requests' && (
            <ConnectionsList
              connections={requests}
              currentUserId={currentUser.uid}
              onAccept={handleAccept}
              onReject={handleReject}
              emptyMessage="You don't have any pending connection requests."
            />
          )}

          {activeTab === 'sent' && (
            <ConnectionsList
              connections={sentRequests}
              currentUserId={currentUser.uid}
              onRemove={handleRemove}
              emptyMessage="You haven't sent any connection requests."
            />
          )}
        </>
      )}
    </div>
  );
};

export default ConnectionsPage;
