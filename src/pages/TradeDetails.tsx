import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, updateDoc, addDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { MessageSquare, User, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import type { Trade, UserProfile } from '../types';
import { XP_CONFIG, awardExperience, checkAndAwardBadges } from '../lib/reputation';

export function TradeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trade, setTrade] = useState<Trade | null>(null);
  const [creator, setCreator] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startingChat, setStartingChat] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  useEffect(() => {
    async function fetchTradeAndCreator() {
      if (!id) return;

      try {
        const db = await getDb();
        const tradeDoc = await getDoc(doc(db, 'trades', id));
        if (!tradeDoc.exists()) {
          setError('Trade not found');
          return;
        }

        const tradeData = { id: tradeDoc.id, ...tradeDoc.data() } as Trade;
        setTrade(tradeData);

        // Fetch creator details
        const creatorDoc = await getDoc(doc(db, 'users', tradeData.creatorId));
        if (creatorDoc.exists()) {
          setCreator({ id: creatorDoc.id, ...creatorDoc.data() } as UserProfile);
        }
      } catch (err) {
        setError('Failed to load trade details');
      } finally {
        setLoading(false);
      }
    }

    fetchTradeAndCreator();
  }, [id]);

  const handleContact = async () => {
    if (!user || !trade || !creator) return;
    
    setStartingChat(true);
    try {
      // Check if a conversation already exists
      const db = await getDb();
      const conversationsRef = collection(db, 'conversations');
      const q = query(
        conversationsRef,
        where('participants', 'array-contains', user.uid),
        where('tradeId', '==', id)
      );
      
      const querySnapshot = await getDocs(q);
      let conversationId;
      
      if (querySnapshot.empty) {
        // Create new conversation
        const conversationDoc = await addDoc(conversationsRef, {
          participants: [user.uid, trade.creatorId],
          tradeId: id,
          tradeName: trade.title,
          lastMessage: '',
          unreadCount: {
            [trade.creatorId]: 0,
            [user.uid]: 0
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        conversationId = conversationDoc.id;
      } else {
        // Use existing conversation
        conversationId = querySnapshot.docs[0].id;
      }
      
      navigate(`/messages/${conversationId}`);
    } catch (err) {
      console.error('Failed to start conversation:', err);
      setError('Failed to start conversation');
    } finally {
      setStartingChat(false);
    }
  };

  const handleUpdateStatus = async (newStatus: Trade['status']) => {
    if (!trade || !user || updatingStatus) return;

    setUpdatingStatus(true);
    try {
      const db = await getDb();
      await updateDoc(doc(db, 'trades', trade.id), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });

      // Award XP when trade is completed
      if (newStatus === 'completed') {
        // Award XP to creator for their offered skills
        await awardExperience(trade.creatorId, XP_CONFIG.TRADE_COMPLETION, trade.offeredSkills);
        
        // Check and award badges for creator
        const creatorProfile = await getDoc(doc(db, 'users', trade.creatorId));
        if (creatorProfile.exists()) {
          await checkAndAwardBadges(trade.creatorId, creatorProfile.data() as UserProfile);
        }

        // Award XP to the other participant for their offered skills (if applicable)
        if (user.uid !== trade.creatorId) {
          await awardExperience(user.uid, XP_CONFIG.TRADE_COMPLETION, trade.requestedSkills);
          
          // Check and award badges for participant
          const participantProfile = await getDoc(doc(db, 'users', user.uid));
          if (participantProfile.exists()) {
            await checkAndAwardBadges(user.uid, participantProfile.data() as UserProfile);
          }
        }
      }

      setTrade(prev => prev ? { ...prev, status: newStatus } : null);
      setShowStatusModal(false);
    } catch (err) {
      setError('Failed to update trade status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !trade) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          {error || 'Trade not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="card card-form">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{trade.title}</h1>
              <div className="flex items-center text-gray-600 text-sm">
                <Calendar className="h-4 w-4 mr-1" />
                Posted {new Date(trade.createdAt).toLocaleDateString()}
              </div>
            </div>
            <div className="flex items-center">
              <span className={`badge-${trade.status}`}>
                {trade.status.replace('_', ' ').charAt(0).toUpperCase() + trade.status.replace('_', ' ').slice(1)}
              </span>
            </div>
          </div>

          {/* Creator Info */}
          {creator && (
            <div className="flex items-center mb-6 p-4 bg-gray-50 rounded-lg">
              <User className="h-12 w-12 text-gray-400 mr-4" />
              <div>
                <h3 className="font-medium text-gray-900">{creator.displayName}</h3>
                <p className="text-gray-600 text-sm">{creator.bio || 'No bio available'}</p>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
            <p className="text-gray-600 whitespace-pre-wrap">{trade.description}</p>
          </div>

          {/* Skills */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Offered Skills */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Skills Offered</h2>
              <div className="flex flex-wrap gap-2">
                {trade.offeredSkills.map((skill) => (
                  <span
                    key={skill}
                    className="px-2 py-1 bg-accent-sage/20 text-gray-900 text-sm rounded-full border border-accent-sage/30"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Requested Skills */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Skills Needed</h2>
              <div className="flex flex-wrap gap-2">
                {trade.requestedSkills.map((skill) => (
                  <span
                    key={skill}
                    className="px-2 py-1 bg-accent-clay/20 text-gray-900 text-sm rounded-full border border-accent-clay/30"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            {user && user.uid !== trade.creatorId && trade.status === 'open' && (
              <button
                onClick={handleContact}
                disabled={startingChat}
                className="btn-primary btn-full py-2 flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <MessageSquare className="h-5 w-5" />
                {startingChat ? 'Starting Chat...' : 'Contact Creator'}
              </button>
            )}
            
            {user && (user.uid === trade.creatorId || trade.status !== 'open') && (
              <button
                onClick={() => setShowStatusModal(true)}
                disabled={updatingStatus}
                className="btn-primary btn-full py-2 flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="h-5 w-5" />
                Update Status
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="card card-form p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Update Trade Status</h3>
            <div className="space-y-3">
              {trade.status === 'open' && (
                <>
                  <button
                    onClick={() => handleUpdateStatus('reserved')}
                    disabled={updatingStatus}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded hover:bg-accent-clay/30 bg-accent-clay/20 text-gray-900 border border-accent-clay/30"
                  >
                    <AlertCircle className="h-5 w-5" />
                    Mark as Reserved
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('in_progress')}
                    disabled={updatingStatus}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded hover:bg-accent-clay/30 bg-accent-clay/20 text-gray-900 border border-accent-clay/30"
                  >
                    <AlertCircle className="h-5 w-5" />
                    Mark as In Progress
                  </button>
                </>
              )}
              {trade.status === 'reserved' && (
                <button
                  onClick={() => handleUpdateStatus('in_progress')}
                  disabled={updatingStatus}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded hover:bg-accent-clay/30 bg-accent-clay/20 text-gray-900 border border-accent-clay/30"
                >
                  <AlertCircle className="h-5 w-5" />
                  Mark as In Progress
                </button>
              )}
              {trade.status === 'in_progress' && (
                <button
                  onClick={() => handleUpdateStatus('completed')}
                  disabled={updatingStatus}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded hover:bg-accent-ochre/30 bg-accent-ochre/20 text-gray-900 border border-accent-ochre/30"
                >
                  <CheckCircle2 className="h-5 w-5" />
                  Mark as Completed
                </button>
              )}
              {(trade.status === 'reserved' || trade.status === 'in_progress' || trade.status === 'completed') && (
                <button
                  onClick={() => handleUpdateStatus('cancelled')}
                  disabled={updatingStatus}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded hover:bg-accent-clay/30 bg-accent-clay/20 text-gray-900 border border-accent-clay/30"
                >
                  Cancel Trade
                </button>
              )}
              {(trade.status !== 'open' && trade.status !== 'cancelled') && (
                <button
                  onClick={() => handleUpdateStatus('open')}
                  disabled={updatingStatus}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded hover:bg-accent-sage/30 bg-accent-sage/20 text-gray-900 border border-accent-sage/30"
                >
                  Reopen Trade
                </button>
              )}
              <button
                onClick={() => setShowStatusModal(false)}
                className="w-full px-4 py-2 text-gray-600 hover:bg-gray-50 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
