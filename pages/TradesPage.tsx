/**
 * Trades Page
 * 
 * Displays a list of trades with filtering and search capabilities.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import TradeCard from '../src/components/features/trades/TradeCard';
import { Button } from '../src/components/ui/Button';
import { Input } from '../src/components/ui/Input';
import { useAuth } from '../src/AuthContext';
import { getDocuments, addDocument, updateDocument } from '../src/firebase-config';

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

export const TradesPage: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [skillsFilter, setSkillsFilter] = useState<string[]>([]);
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);
  
  // Fetch trades
  const fetchTrades = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const constraints = [];
      
      // Add status filter
      if (statusFilter !== 'all') {
        constraints.push({
          field: 'status',
          operator: '==',
          value: statusFilter
        });
      }
      
      // Add public filter if user is not logged in
      if (!currentUser) {
        constraints.push({
          field: 'isPublic',
          operator: '==',
          value: true
        });
      }
      
      const { data, error: fetchError } = await getDocuments('trades', constraints, 'createdAt', 'desc');
      
      if (fetchError) {
        setError(fetchError.message);
        return;
      }
      
      if (data) {
        setTrades(data);
        
        // Extract all unique skills
        const skills = new Set<string>();
        data.forEach((trade: any) => {
          if (trade.skillsOffered) {
            trade.skillsOffered.forEach((skill: string) => skills.add(skill));
          }
          if (trade.skillsWanted) {
            trade.skillsWanted.forEach((skill: string) => skills.add(skill));
          }
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
  const filteredTrades = trades.filter(trade => {
    // Search term filter
    const searchMatch = searchTerm === '' || 
      trade.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trade.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Skills filter
    const skillsMatch = skillsFilter.length === 0 || 
      skillsFilter.some(skill => 
        (trade.skillsOffered && trade.skillsOffered.includes(skill)) || 
        (trade.skillsWanted && trade.skillsWanted.includes(skill))
      );
    
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
    
    try {
      // Get the trade
      const { data: trade, error: getError } = await getDocuments('trades', [
        { field: 'id', operator: '==', value: tradeId }
      ]);
      
      if (getError || !trade || trade.length === 0) {
        console.error('Error getting trade:', getError);
        return;
      }
      
      // Add current user to participants
      const participants = trade[0].participants || [];
      
      if (!participants.includes(currentUser.uid)) {
        await updateDocument('trades', tradeId, {
          participants: [...participants, currentUser.uid]
        });
        
        // Refresh trades
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
    
    try {
      // Get the trade
      const { data: trade, error: getError } = await getDocuments('trades', [
        { field: 'id', operator: '==', value: tradeId }
      ]);
      
      if (getError || !trade || trade.length === 0) {
        console.error('Error getting trade:', getError);
        return;
      }
      
      // Remove current user from participants
      const participants = trade[0].participants || [];
      
      await updateDocument('trades', tradeId, {
        participants: participants.filter((id: string) => id !== currentUser.uid)
      });
      
      // Refresh trades
      fetchTrades();
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
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="all">All</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
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
            {filteredTrades.map(trade => (
              <TradeCard
                key={trade.id}
                trade={trade}
                onInitiateTrade={() => handleJoinTrade(trade.id)}
                showInitiateButton={currentUser && trade.participants && !trade.participants.includes(currentUser.uid)}
              />
            ))}
          </div>
        )
      )}
    </div>
  );
};
