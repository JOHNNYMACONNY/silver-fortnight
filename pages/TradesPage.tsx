/**
 * Trades Page
 * 
 * Displays a list of trades with filtering and search capabilities.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { doc, runTransaction } from 'firebase/firestore';
import TradeCard from '../src/components/features/trades/TradeCard';
import { Button } from '../src/components/ui/Button';
import { Input } from '../src/components/ui/Input';
import { useAuth } from '../src/AuthContext';
import { getDocuments, getSyncFirebaseDb } from '../src/firebase-config';

// Icons (you can replace these with your preferred icon library)
const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const FilterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

const RefreshIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

type StatusFilter =
  | 'all'
  | 'open'
  | 'in-progress'
  | 'pending_evidence'
  | 'pending_confirmation'
  | 'completed';

const STATUS_QUERY_MAP: Record<Exclude<StatusFilter, 'all'>, string[]> = {
  open: ['open', 'active', 'draft'],
  'in-progress': ['in-progress', 'in_progress', 'matched', 'pending_confirmation', 'pending_evidence'],
  pending_evidence: ['pending_evidence'],
  pending_confirmation: ['pending_confirmation'],
  completed: ['completed']
};

const STATUS_MATCH_MAP: Record<Exclude<StatusFilter, 'all'>, string[]> = {
  open: ['open'],
  'in-progress': ['in-progress', 'pending_confirmation', 'pending_evidence'],
  pending_evidence: ['pending_evidence'],
  pending_confirmation: ['pending_confirmation'],
  completed: ['completed']
};

export const TradesPage: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [skillsFilter, setSkillsFilter] = useState<string[]>([]);
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);

  const normalizeTradeStatus = (status: string | undefined): string => {
    const normalized = typeof status === 'string' ? status.toLowerCase() : '';
    switch (normalized) {
      case 'active':
      case 'draft':
        return 'open';
      case 'in_progress':
      case 'matched':
        return 'in-progress';
      case 'pending_evidence':
      case 'pending-evidence':
        return 'pending_evidence';
      case 'pending_confirmation':
      case 'pending-confirmation':
        return 'pending_confirmation';
      case 'cancelled':
        return 'cancelled';
      case 'completed':
        return 'completed';
      case 'open':
        return 'open';
      case 'in-progress':
        return 'in-progress';
      default:
        return normalized || 'unknown';
    }
  };

  const extractSkillNames = (skillSource: any): string[] => {
    if (!Array.isArray(skillSource)) {
      return [];
    }

    return skillSource
      .map((skill) => {
        if (typeof skill === 'string') {
          return skill.trim();
        }

        if (skill && typeof skill === 'object') {
          if (typeof skill.name === 'string') {
            return skill.name.trim();
          }
          if ('label' in skill && typeof (skill as any).label === 'string') {
            return (skill as any).label.trim();
          }
          if ('title' in skill && typeof (skill as any).title === 'string') {
            return (skill as any).title.trim();
          }
        }

        return null;
      })
      .filter((value): value is string => Boolean(value));
  };

  const collectAllSkillNames = (trade: any): string[] => {
    const offered = extractSkillNames(trade?.skillsOffered ?? trade?.offeredSkills);
    const wanted = extractSkillNames(trade?.skillsWanted ?? trade?.requestedSkills);
    const legacy = extractSkillNames(trade?.skills);

    return Array.from(new Set([...offered, ...wanted, ...legacy]));
  };

  const getParticipantIds = (trade: any, includeInterested = false): string[] => {
    const ids = new Set<string>();

    if (Array.isArray(trade?.participants)) {
      trade.participants
        .filter((id: unknown): id is string => typeof id === 'string' && id.length > 0)
        .forEach((id: string) => ids.add(id));
    } else if (trade?.participants && typeof trade.participants === 'object') {
      Object.values(trade.participants)
        .filter((id): id is string => typeof id === 'string' && id.length > 0)
        .forEach((id: string) => ids.add(id));
    }

    if (includeInterested && Array.isArray(trade?.interestedUsers)) {
      trade.interestedUsers
        .filter((id: unknown): id is string => typeof id === 'string' && id.length > 0)
        .forEach((id: string) => ids.add(id));
    }

    return Array.from(ids);
  };

  const buildJoinUpdate = (trade: any, userId: string): Record<string, any> | null => {
    if (!trade) {
      return null;
    }

    if (trade.participants && !Array.isArray(trade.participants) && typeof trade.participants === 'object') {
      const participantsObj = { ...trade.participants };

      if (participantsObj.creator === userId || participantsObj.participant === userId) {
        return null;
      }

      if (!participantsObj.participant) {
        return { participants: { ...participantsObj, participant: userId } };
      }

      const interestedUsers: string[] = Array.isArray(trade.interestedUsers) ? [...trade.interestedUsers] : [];
      if (!interestedUsers.includes(userId)) {
        interestedUsers.push(userId);
        return { interestedUsers };
      }

      return null;
    }

    const participantIds = getParticipantIds(trade);
    if (participantIds.includes(userId)) {
      return null;
    }

    return { participants: [...participantIds, userId] };
  };

  const buildLeaveUpdate = (trade: any, userId: string): Record<string, any> | null => {
    if (!trade) {
      return null;
    }

    if (trade.participants && !Array.isArray(trade.participants) && typeof trade.participants === 'object') {
      const participantsObj = { ...trade.participants };
      const updatePayload: Record<string, any> = {};
      let changed = false;

      if (participantsObj.participant === userId) {
        participantsObj.participant = null;
        changed = true;
      }

      if (changed) {
        updatePayload.participants = participantsObj;
      }

      if (Array.isArray(trade.interestedUsers) && trade.interestedUsers.includes(userId)) {
        updatePayload.interestedUsers = trade.interestedUsers.filter((id: string) => id !== userId);
      }

      return Object.keys(updatePayload).length > 0 ? updatePayload : null;
    }

    const participantIds = getParticipantIds(trade);
    if (!participantIds.includes(userId)) {
      if (Array.isArray(trade.interestedUsers) && trade.interestedUsers.includes(userId)) {
        return { interestedUsers: trade.interestedUsers.filter((id: string) => id !== userId) };
      }
      return null;
    }

    return { participants: participantIds.filter((id: string) => id !== userId) };
  };
  
  // Fetch trades
  const fetchTrades = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const constraints = [];
      
      // Add status filter
      if (statusFilter !== 'all') {
        const constraintStatuses = STATUS_QUERY_MAP[statusFilter] ?? [statusFilter];

        if (constraintStatuses.length === 1) {
          constraints.push({
            field: 'status',
            operator: '==',
            value: constraintStatuses[0]
          });
        } else {
          constraints.push({
            field: 'status',
            operator: 'in',
            value: constraintStatuses
          });
        }
      }
      
      // Add public filter if user is not logged in
      if (!currentUser) {
        constraints.push({
          field: 'visibility',
          operator: '==',
          value: 'public'
        });
      }
      
      const { data, error: fetchError } = await getDocuments('trades', constraints, 'createdAt', 'desc');
      
      if (fetchError) {
        setError(fetchError.message);
        return;
      }
      
      if (data) {
        const tradesWithNormalizedStatus = data.map((trade: any) => ({
          ...trade,
          normalizedStatus: normalizeTradeStatus(trade?.status)
        }));

        const normalizedTrades = !currentUser
          ? tradesWithNormalizedStatus.filter((trade: any) => (trade?.visibility ?? 'public') === 'public')
          : tradesWithNormalizedStatus;

        setTrades(normalizedTrades);
        
        // Extract all unique skills
        const skills = new Set<string>();
        normalizedTrades.forEach((trade: any) => {
          collectAllSkillNames(trade).forEach((skill) => skills.add(skill));
        });
        
        setAvailableSkills(Array.from(skills).sort());
      }
    } catch (err: any) {
      console.error('Error fetching trades:', err);
      setError(err.message || 'Failed to fetch trades');
    } finally {
      setLoading(false);
    }
  };
  
  // Initial fetch
  useEffect(() => {
    fetchTrades();
  }, [currentUser, statusFilter]);
  
  // Filter trades based on search term and skills filter
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredTrades = trades.filter((trade) => {
    const title = typeof trade.title === 'string' ? trade.title : '';
    const description = typeof trade.description === 'string' ? trade.description : '';
    const normalizedStatus =
      typeof (trade as any).normalizedStatus === 'string'
        ? (trade as any).normalizedStatus
        : normalizeTradeStatus(trade.status);

    if (statusFilter !== 'all') {
      const allowedStatuses = STATUS_MATCH_MAP[statusFilter] ?? [statusFilter];
      if (!allowedStatuses.includes(normalizedStatus)) {
        return false;
      }
    }

    const searchMatch =
      normalizedSearchTerm === '' ||
      title.toLowerCase().includes(normalizedSearchTerm) ||
      description.toLowerCase().includes(normalizedSearchTerm);

    if (skillsFilter.length === 0) {
      return searchMatch;
    }

    const offered = extractSkillNames(trade?.skillsOffered ?? trade?.offeredSkills);
    const wanted = extractSkillNames(trade?.skillsWanted ?? trade?.requestedSkills);
    const legacy = extractSkillNames(trade?.skills);
    const skillSet = new Set([...offered, ...wanted, ...legacy]);

    const skillsMatch = skillsFilter.some((skill) => skillSet.has(skill));

    return searchMatch && skillsMatch;
  });
  
  // Toggle skill selection
  const toggleSkill = (skill: string) => {
    setSkillsFilter(prev => 
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };
  
  // Join a trade
  const handleJoinTrade = async (tradeId: string) => {
    if (!currentUser) return;

    const trade = trades.find((item) => item.id === tradeId);

    if (!trade) {
      console.error('Trade not found when attempting to join:', tradeId);
      return;
    }

    try {
      const db = getSyncFirebaseDb();
      const didUpdate = await runTransaction(db, async (transaction) => {
        const tradeRef = doc(db, 'trades', tradeId);
        const snapshot = await transaction.get(tradeRef);

        if (!snapshot.exists()) {
          console.error('Trade not found in Firestore when attempting to join:', tradeId);
          return false;
        }

        const snapshotData = snapshot.data();
        const updatePayload = buildJoinUpdate(
          {
            id: tradeRef.id,
            ...(snapshotData ?? {})
          },
          currentUser.uid
        );

        if (!updatePayload) {
          return false;
        }

        transaction.update(tradeRef, updatePayload);
        return true;
      });

      if (didUpdate) {
        fetchTrades();
      }
    } catch (err: any) {
      console.error('Error joining trade:', err);
      alert('Failed to join trade. Please try again.');
    }
  };
  
  // Leave a trade
  const handleLeaveTrade = async (tradeId: string) => {
    if (!currentUser) return;

    const trade = trades.find((item) => item.id === tradeId);

    if (!trade) {
      console.error('Trade not found when attempting to leave:', tradeId);
      return;
    }

    try {
      const db = getSyncFirebaseDb();
      const didUpdate = await runTransaction(db, async (transaction) => {
        const tradeRef = doc(db, 'trades', tradeId);
        const snapshot = await transaction.get(tradeRef);

        if (!snapshot.exists()) {
          console.error('Trade not found in Firestore when attempting to leave:', tradeId);
          return false;
        }

        const snapshotData = snapshot.data();
        const updatePayload = buildLeaveUpdate(
          {
            id: tradeRef.id,
            ...(snapshotData ?? {})
          },
          currentUser.uid
        );

        if (!updatePayload) {
          return false;
        }

        transaction.update(tradeRef, updatePayload);
        return true;
      });

      if (didUpdate) {
        fetchTrades();
      }
    } catch (err: any) {
      console.error('Error leaving trade:', err);
      alert('Failed to leave trade. Please try again.');
    }
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Skill Trades</h1>
          <p className="mt-1 text-gray-500">
            Exchange skills and services with other members
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            leftIcon={<RefreshIcon />}
            onClick={fetchTrades}
            disabled={loading}
          >
            Refresh
          </Button>
          
          {currentUser && (
            <Link to="/trades/create">
              <Button
                variant="primary"
                leftIcon={<PlusIcon />}
              >
                Create Trade
              </Button>
            </Link>
          )}
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative flex-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <Input
                placeholder="Search trades..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
          </div>
          
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="rounded-md border border-gray-300 px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="all">All</option>
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="pending_evidence">Pending Evidence</option>
              <option value="pending_confirmation">Pending Confirmation</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
        
        {/* Skills Filter */}
        {availableSkills.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <FilterIcon />
              <h3 className="text-sm font-medium text-gray-700">Filter by Skills</h3>
              
              {skillsFilter.length > 0 && (
                <button
                  onClick={() => setSkillsFilter([])}
                  className="text-xs text-orange-600 hover:text-orange-800"
                >
                  Clear Filters
                </button>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2">
              {availableSkills.map(skill => (
                <button
                  key={skill}
                  onClick={() => toggleSkill(skill)}
                  className={`px-2 py-1 rounded-md text-xs font-medium ${
                    skillsFilter.includes(skill)
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          <p className="font-medium">Error loading trades</p>
          <p>{error}</p>
        </div>
      )}
      
      {/* Loading state */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-orange-500 mb-4"></div>
          <p className="text-gray-600">Loading trades...</p>
        </div>
      )}
      
      {/* Trades grid */}
      {!loading && (
        filteredTrades.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Trades Found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || skillsFilter.length > 0
                ? 'No trades match your search criteria. Try adjusting your filters.'
                : 'There are no trades available at the moment.'}
            </p>
            {currentUser && (
              <Link to="/trades/create">
                <Button
                  variant="primary"
                  leftIcon={<PlusIcon />}
                >
                  Create the First Trade
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTrades.map(trade => {
              const userIsParticipant = currentUser ? getParticipantIds(trade, true).includes(currentUser.uid) : false;
              return (
                <TradeCard
                  key={trade.id}
                  trade={trade}
                  onInitiateTrade={() => handleJoinTrade(trade.id)}
                  showInitiateButton={Boolean(currentUser && !userIsParticipant)}
                />
              );
            })}
          </div>
        )
      )}
    </div>
  );
};
