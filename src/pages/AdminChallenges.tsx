import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { getFunctions } from 'firebase/functions';
import { Challenge } from '../types';
import { ChallengeEditor } from '../components/ChallengeEditor';
import { Clock, Edit, Play, AlertTriangle } from 'lucide-react';

export function AdminChallenges() {
  const [pendingChallenges, setPendingChallenges] = useState<Challenge[]>([]);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: () => void;

    // Subscribe to pending challenges
    const initializeQuery = async () => {
      const db = await getDb();
      const q = query(
        collection(db, 'challenges'),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );

      unsubscribe = onSnapshot(
        q, 
        (snapshot) => {
          const challenges = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Challenge[];
          setPendingChallenges(challenges);
          setLoading(false);
        },
        (err) => {
          console.error('Error fetching challenges:', err);
          setError('Failed to load challenges');
          setLoading(false);
        }
      );
    };

    initializeQuery().catch(err => {
      console.error('Failed to initialize query:', err);
      setError('Failed to load challenges');
      setLoading(false);
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const handleActivate = async (challengeId: string) => {
    try {
      const { httpsCallable } = await import('firebase/functions');
      const functions = getFunctions();
      const activateChallenge = httpsCallable(functions, 'manuallyActivateChallenge');
      
      await activateChallenge({ challengeId });
    } catch (err) {
      console.error('Failed to activate challenge:', err);
      setError('Failed to activate challenge');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white p-6 rounded-lg shadow-md">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Challenge Management</h1>
        <p className="text-gray-600">Review and activate pending challenges</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {editingChallenge ? (
        <ChallengeEditor
          challenge={editingChallenge}
          type={editingChallenge.type}
          onSave={() => setEditingChallenge(null)}
          onCancel={() => setEditingChallenge(null)}
        />
      ) : (
        <div className="space-y-6">
          {pendingChallenges.map((challenge) => (
            <div key={challenge.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{challenge.title}</h3>
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <Clock className="h-4 w-4 mr-1" />
                    {challenge.type.charAt(0).toUpperCase() + challenge.type.slice(1)} Challenge
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingChallenge(challenge)}
                    className="p-2 text-gray-600 hover:text-indigo-600 transition-colors"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleActivate(challenge.id)}
                    className="p-2 text-gray-600 hover:text-green-600 transition-colors"
                  >
                    <Play className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <p className="text-gray-600 mb-4">{challenge.description}</p>

              <div className="space-y-4">
                {/* Requirements */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Requirements</h4>
                  <div className="space-y-2">
                    {challenge.requirements.map((req, index) => (
                      <div key={index} className="flex items-center text-sm text-gray-600">
                        <span className="w-24">{req.type}:</span>
                        <span className="font-medium">{req.count}</span>
                        {req.skillCategory && (
                          <span className="ml-2 text-gray-500">in {req.skillCategory}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rewards */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Rewards</h4>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full">
                      {challenge.rewards.xp} XP
                    </div>
                    {challenge.rewards.badge && (
                      <div className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full">
                        {challenge.rewards.badge} Badge
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {pendingChallenges.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg shadow-md">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Pending Challenges
              </h3>
              <p className="text-gray-600">
                New challenges will appear here when generated
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
