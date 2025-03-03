import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Tag, Clock, User, Users } from 'lucide-react';
import { useFirestore } from '../hooks';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import type { Trade, UserProfile } from '../types';
import { ProfilePicture } from '../components/ProfilePicture';
import { ProfileHoverCard } from '../components/ProfileHoverCard';

export function Discover() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const { data: trades, loading, error } = useFirestore<Trade>('trades');
  const [creators, setCreators] = useState<{ [key: string]: UserProfile }>({});

  // Fetch creators' profiles
  useEffect(() => {
    const fetchCreators = async () => {
      try {
        const database = await getDb(); // Get initialized db instance
        const creatorIds = new Set(trades.map(trade => trade.creatorId));
        const creatorsData: { [key: string]: UserProfile } = {};
        
        for (const creatorId of creatorIds) {
          try {
            const creatorDoc = await getDoc(doc(database, 'users', creatorId));
            if (creatorDoc.exists()) {
              creatorsData[creatorId] = {
                id: creatorDoc.id,
                ...creatorDoc.data()
              } as UserProfile;
            }
          } catch (err) {
            console.error('Error fetching creator:', err);
          }
        }
        
        setCreators(creatorsData);
      } catch (err) {
        console.error('Error initializing database:', err);
      }
    };

    if (trades.length > 0) {
      fetchCreators();
    }
  }, [trades]);

  const filteredTrades = trades.filter(trade => {
    const matchesSearch = trade.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trade.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSkills = selectedSkills.length === 0 || 
      trade.requestedSkills.some(skill => selectedSkills.includes(skill));
    
    return matchesSearch && matchesSkills;
  });

  // Get all unique skills for filtering
  const allSkills = Array.from(new Set(
    trades.flatMap(trade => [...trade.offeredSkills, ...trade.requestedSkills])
  )).sort();

  const handleSkillToggle = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const handleStartChat = async (creatorId: string) => {
    navigate(`/messages/${creatorId}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-white mb-2">
          Discover Trades
        </h1>
        <p className="text-gray-200">
          Find skill trading opportunities or share your expertise
        </p>
      </div>

      {/* Search and Filter Section */}
      <div className="mb-8 space-y-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search trades..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-earth-800 border border-earth-700 rounded-lg 
                         text-gray-900 placeholder-gray-500
                          focus:border-accent-clay focus:ring-1 focus:ring-accent-clay/30 
                         transition-all duration-300"
            />
          </div>
          <button className="btn-secondary flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter
          </button>
        </div>

        {/* Skills Filter */}
        <div className="bg-earth-800 border border-earth-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Filter by Skills
          </h3>
          <div className="flex flex-wrap gap-2">
            {allSkills.map((skill) => (
              <button
                key={skill}
                onClick={() => handleSkillToggle(skill)}
                className={`px-3 py-1 rounded-full text-sm transition-all duration-300 ${
                  selectedSkills.includes(skill)
                    ? 'bg-accent-clay text-white'
                    : 'bg-earth-700 text-gray-900 hover:bg-earth-600'
                }`}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Auth Check */}
      {!user ? (
        <div className="col-span-full text-center py-12">
          <div className="bg-earth-800 border border-earth-700 rounded-lg p-8 max-w-2xl mx-auto animate-fade-in">
            {/* Icon Section */}
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-accent-clay/10 flex items-center justify-center">
                <Users className="h-10 w-10 text-accent-clay" />
              </div>
            </div>
            
            {/* Main Message */}
            <h2 className="text-2xl font-display font-semibold text-gray-900 mb-3">
              Welcome to Skill Trading
            </h2>
            <p className="text-gray-700 mb-6 max-w-md mx-auto">
              Join our community to discover skill trading opportunities and connect with other professionals.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => navigate('/signup')}
                className="btn-primary px-8 py-3 rounded-lg transform transition-all duration-200 hover:scale-105"
              >
                Sign Up
              </button>
              <button 
                onClick={() => navigate('/login')}
                className="btn-secondary px-8 py-3 rounded-lg transform transition-all duration-200 hover:scale-105"
              >
                Log In
              </button>
            </div>
          </div>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="animate-pulse card p-6">
              <div className="h-6 bg-earth-700 rounded w-3/4 mb-4"></div>
              <div className="space-y-2 mb-4">
                <div className="h-4 bg-earth-700 rounded w-full"></div>
                <div className="h-4 bg-earth-700 rounded w-5/6"></div>
              </div>
              <div className="h-10 bg-earth-700 rounded"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">Error loading trades</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrades.map((trade) => {
            const creator = creators[trade.creatorId];
            
            return (
              <div
                key={trade.id}
                onClick={() => navigate(`/trades/${trade.id}`)}
                className="card p-6 card-hover cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-display font-semibold text-gray-900">
                    {trade.title}
                  </h3>
                  <span className={`
                    status-badge
                    ${trade.status === 'open' ? 'status-badge-active' : 
                      trade.status === 'in-progress' ? 'status-badge-pending' : 
                      'status-badge-completed'}
                  `}>
                    {trade.status.charAt(0).toUpperCase() + trade.status.slice(1)}
                  </span>
                </div>
                
                <p className="text-gray-700 mb-6 line-clamp-2">
                  {trade.description}
                </p>

                <div className="space-y-4">
                  {/* Offered Skills */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Offering</h4>
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
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Looking for</h4>
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

                {/* Footer */}
                <div className="flex justify-between items-center mt-6 pt-4 border-t border-earth-700">
                  <div className="flex items-center gap-2 text-gray-900">
                    {creator ? (
                      <ProfileHoverCard 
                        profile={creator}
                        onMessageClick={() => handleStartChat(creator.id)}
                      >
                        <div className="flex items-center gap-2 cursor-pointer">
                          <ProfilePicture url={creator.profilePicture} size="sm" />
                          <span className="text-sm font-medium">{creator.displayName}</span>
                        </div>
                      </ProfileHoverCard>
                    ) : (
                      <>
                        <User className="h-4 w-4" />
                        <span className="text-sm font-medium">Loading...</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center text-gray-900">
                    <Clock className="h-4 w-4 mr-1" />
                    <span className="text-sm font-medium">
                      {new Date(trade.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredTrades.length === 0 && (
            <div className="col-span-full text-center py-12">
              <div className="bg-earth-800 border border-earth-700 rounded-lg p-8">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-display font-semibold text-gray-900 mb-2">
                  No trades found
                </h3>
                <p className="text-gray-700">
                  Try adjusting your search or filters
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
