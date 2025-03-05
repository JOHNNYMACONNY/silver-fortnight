import React, { useState, useEffect } from 'react';
import { getUserRequests, updateRequestStatus, markRequestViewed } from '../lib/requests';
import type { TradeRequest, ProjectPositionRequest } from '../types/requests';
import { formatDistance } from 'date-fns';
import toast from '../utils/toast';

interface RequestManagerProps {
  currentUserId: string;
  mode: 'trade' | 'project';
}

export default function RequestManager({ currentUserId, mode }: RequestManagerProps) {
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const [requests, setRequests] = useState<{
    received: (TradeRequest | ProjectPositionRequest)[];
    sent: (TradeRequest | ProjectPositionRequest)[];
  }>({ received: [], sent: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updateInProgress, setUpdateInProgress] = useState<string | null>(null);

  const collectionName = mode === 'trade' ? 'tradeRequests' : 'projectRequests';

  useEffect(() => {
    loadRequests();
  }, [currentUserId, mode]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError('');
      const userRequests = await getUserRequests(currentUserId, collectionName);

      // Sort requests by date, most recent first
      const sortByDate = (a: any, b: any) => 
        b.createdAt.toMillis() - a.createdAt.toMillis();

      const sortedRequests = {
        received: userRequests.received.sort(sortByDate),
        sent: userRequests.sent.sort(sortByDate)
      };

      setRequests(sortedRequests);

      // Mark received requests as viewed
      for (const request of userRequests.received) {
        if (!request.viewedAt) {
          await markRequestViewed(request.id, collectionName);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load requests';
      setError(errorMessage);
      toast({
        type: 'error',
        title: 'Error loading requests',
        message: errorMessage
      });
      console.error('Error loading requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId: string, status: 'accepted' | 'declined') => {
    try {
      setUpdateInProgress(requestId);
      setError('');
      
      await updateRequestStatus(requestId, collectionName, status, currentUserId);
      
      toast({
        type: status === 'accepted' ? 'success' : 'info',
        title: `Request ${status}`,
        message: `The request has been successfully ${status}`
      });

      await loadRequests(); // Reload to get updated data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update request status';
      setError(errorMessage);
      toast({
        type: 'error',
        title: 'Error updating request',
        message: errorMessage
      });
      console.error('Error updating request status:', err);
    } finally {
      setUpdateInProgress(null);
    }
  };

  const renderStatus = (request: TradeRequest | ProjectPositionRequest) => {
    if (request.status === 'pending') {
      return (
        <div className="flex items-center space-x-2">
          <span className="px-2 py-1 text-sm rounded-full bg-yellow-100 text-yellow-800">
            Pending
          </span>
        </div>
      );
    }

    return (
      <span className={`px-2 py-1 text-sm rounded-full ${
        request.status === 'accepted' 
          ? 'bg-green-100 text-green-800'
          : 'bg-red-100 text-red-800'
      }`}>
        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
      </span>
    );
  };

  const renderRequest = (request: TradeRequest | ProjectPositionRequest) => {
    const isProjectRequest = 'projectName' in request;
    const itemName = isProjectRequest ? request.projectName : request.tradeName;
    const positionInfo = isProjectRequest ? ` - ${request.positionName}` : '';
    const isUpdating = updateInProgress === request.id;

    return (
      <div key={request.id} className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="flex justify-between items-start">
          <div className="flex-grow">
            <div className="flex items-center space-x-2">
              {request.sender?.photoURL && (
                <img
                  className="h-8 w-8 rounded-full object-cover"
                  src={request.sender.photoURL}
                  alt={request.sender.displayName}
                />
              )}
              <div>
                <h3 className="font-medium text-gray-900">
                  {itemName}{positionInfo}
                </h3>
                <p className="text-sm text-gray-500">
                  {request.type === 'invitation' ? 'Invitation' : 'Application'}
                  {' • '}
                  {formatDistance(request.createdAt.toDate(), new Date(), { addSuffix: true })}
                </p>
              </div>
            </div>
            {request.message && (
              <p className="mt-2 text-gray-700">{request.message}</p>
            )}
            <div className="mt-2">
              <a href={`/user/${request.sender.id}`} className="font-medium text-blue-600 hover:text-blue-500">
                {request.sender.displayName}
              </a>
              <img
                className="h-8 w-8 rounded-full object-cover"
                src={request.sender.photoURL}
                alt={request.sender.displayName}
              />
            </div>
            {isProjectRequest && request.proposedSkills && request.proposedSkills.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium text-gray-700">Relevant Skills:</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {request.proposedSkills.map((skill) => (
                    <span
                      key={skill}
                      className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {activeTab === 'received' && request.status === 'pending' && (
              <>
                <button
                  onClick={() => handleStatusUpdate(request.id, 'accepted')}
                  disabled={isUpdating}
                  className={`px-3 py-1 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed ${
                    isUpdating ? 'animate-pulse' : ''
                  }`}
                >
                  {isUpdating ? 'Processing...' : 'Accept'}
                </button>
                <button
                  onClick={() => handleStatusUpdate(request.id, 'declined')}
                  disabled={isUpdating}
                  className={`px-3 py-1 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed ${
                    isUpdating ? 'animate-pulse' : ''
                  }`}
                >
                  {isUpdating ? 'Processing...' : 'Decline'}
                </button>
              </>
            )}
            {request.status !== 'pending' && renderStatus(request)}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">Loading requests...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center">
          <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <p className="ml-2 text-red-600">{error}</p>
        </div>
        <button
          onClick={loadRequests}
          className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="border-b border-gray-200 mb-4">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('received')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'received'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Received ({requests.received.length})
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'sent'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Sent ({requests.sent.length})
          </button>
        </nav>
      </div>

      <div className="space-y-4">
        {requests[activeTab].length === 0 ? (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="mt-2 text-sm text-gray-500">
              No {activeTab} requests found
            </p>
          </div>
        ) : (
          requests[activeTab].map(renderRequest)
        )}
      </div>
    </div>
  );
}
