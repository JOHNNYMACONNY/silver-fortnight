import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../contexts/AdminContext';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { Challenge } from '../types';
import { ChallengeCard } from '../components/ChallengeCard';
import { Trophy, Calendar, RefreshCw, Sparkles, Filter } from 'lucide-react';
import { checkAndGenerateChallenges } from '../lib/ai-challenges';
import { showError } from '../lib/alerts';

export function Challenges() {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'weekly' | 'monthly'>('all');

  const fetchChallenges = async () => {
    if (!user) return;

    try {
      // Fetch both weekly and monthly challenges
      const db = await getDb();
      const weeklyQuery = query(
        collection(db, 'challenges'),
        where('type', '==', 'weekly'),
        where('status', 'in', ['pending', 'active'])
      );

      const monthlyQuery = query(
        collection(db, 'challenges'),
        where('type', '==', 'monthly'),
        where('status', 'in', ['pending', 'active'])
      );

      const [weeklySnapshot, monthlySnapshot] = await Promise.all([
        getDocs(weeklyQuery),
        getDocs(monthlyQuery)
      ]);

      if (!weeklySnapshot.empty || !monthlySnapshot.empty) {
        const weeklyData = weeklySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          startDate: doc.data().startDate?.toDate() || null,
          endDate: doc.data().endDate?.toDate() || null,
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date()
        } as Challenge));

        const monthlyData = monthlySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          startDate: doc.data().startDate?.toDate() || null,
          endDate: doc.data().endDate?.toDate() || null,
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date()
        } as Challenge));

        // Sort and limit each type to 10 challenges
        // Sort challenges prioritizing AI-generated ones
        const sortChallenges = (challenges: Challenge[]) => {
          return challenges
            .sort((a, b) => {
              // Sort by source (AI first)
              if (a.source === 'ai' && b.source !== 'ai') return -1;
              if (a.source !== 'ai' && b.source === 'ai') return 1;
              // Then by creation date
              return b.createdAt.getTime() - a.createdAt.getTime();
            })
            .slice(0, 10);
        };

        const sortedWeekly = sortChallenges(weeklyData);
        const sortedMonthly = sortChallenges(monthlyData);

        // Combine all challenges
        setChallenges([...sortedWeekly, ...sortedMonthly]);
      } else {
        await checkAndGenerateChallenges();
        await fetchChallenges();
      }
    } catch (err) {
      console.error('Failed to fetch challenges:', err);
      await showError(
        'Error Loading Challenges',
        'Unable to load challenges. Please try refreshing the page.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, [user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await checkAndGenerateChallenges();
      await fetchChallenges();
    } catch (err) {
      console.error('Failed to refresh challenges:', err);
      await showError(
        'Refresh Failed',
        'Unable to refresh challenges. Please try again.'
      );
    } finally {
      setRefreshing(false);
    }
  };

  const filteredChallenges = challenges.filter(
    challenge => filter === 'all' || challenge.type === filter
  );

  return (
    <div className="min-h-screen">
      {/* Dynamic background */}
      <div className="fixed inset-0 bg-mesh opacity-30"></div>
      <div className="fixed inset-0 bg-noise"></div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-accent-clay to-accent-ochre rounded-lg">
              <Trophy className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-display font-bold text-white">
              Active Challenges
            </h1>
          </div>
          <p className="text-xl text-gray-300">
            Complete challenges to earn XP and unlock special rewards
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-8">
          {/* Filter Tabs */}
          <div className="flex gap-2 p-1 bg-earth-800/50 backdrop-blur-sm rounded-lg">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                filter === 'all'
                  ? 'bg-gradient-to-r from-accent-clay to-accent-ochre text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              All Challenges
            </button>
            <button
              onClick={() => setFilter('weekly')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                filter === 'weekly'
                  ? 'bg-gradient-to-r from-accent-clay to-accent-ochre text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setFilter('monthly')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                filter === 'monthly'
                  ? 'bg-gradient-to-r from-accent-clay to-accent-ochre text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
          </div>

          {/* Refresh Button - Only visible to admins */}
          {isAdmin && (
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-earth-800/50 backdrop-blur-sm 
                       text-white rounded-lg hover:bg-earth-800/70 transition-all duration-300
                       disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Check for New Challenges'}
            </button>
          )}
        </div>

        {/* Challenges Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="card p-6 animate-pulse">
                <div className="h-6 bg-earth-700/50 rounded w-3/4 mb-4"></div>
                <div className="space-y-2 mb-4">
                  <div className="h-4 bg-earth-700/50 rounded w-full"></div>
                  <div className="h-4 bg-earth-700/50 rounded w-5/6"></div>
                </div>
                <div className="h-10 bg-earth-700/50 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                userProgress={user?.challengeProgress?.[challenge.id]}
              />
            ))}

            {filteredChallenges.length === 0 && (
              <div className="col-span-full">
                <div className="card p-12 text-center">
                  <Sparkles className="h-12 w-12 text-accent-clay mx-auto mb-4" />
                  <h3 className="text-xl font-display font-semibold text-gray-900 mb-2">
                    No Active Challenges
                  </h3>
                  <p className="text-gray-600 mb-6">
                    There are no active challenges at the moment. Click refresh to check for new ones.
                  </p>
                  {isAdmin && (
                    <button
                      onClick={handleRefresh}
                      disabled={refreshing}
                      className="btn-primary inline-flex items-center gap-2"
                    >
                      <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                      Check for New Challenges
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
