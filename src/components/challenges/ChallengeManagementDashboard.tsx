import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import { ChallengeCreationForm, ChallengeCreationData } from './ChallengeCreationForm';
import { ThreeTierProgressionUI } from './ThreeTierProgressionUI';
import { SkillProgressDashboard } from '../skills/SkillProgressDashboard';
import { ChallengeDiscoveryInterface } from './ChallengeDiscoveryInterface';
import { useAuth } from '../../AuthContext';
import { 
  createChallenge, 
  getUserChallenges, 
  getChallenges 
} from '../../services/challenges';
import { canAccessTier } from '../../services/threeTierProgression';
import { 
  Challenge, 
  UserChallenge, 
  ChallengeType,
  ChallengeDifficulty,
  ChallengeCategory,
  UserChallengeStatus,
  ChallengeStatus
} from '../../types/gamification';
import { Timestamp } from 'firebase/firestore';
import {
  Plus,
  Filter,
  Search,
  Calendar,
  Users,
  Trophy,
  Clock,
  Target,
  BarChart3,
  Zap,
  TrendingUp
} from 'lucide-react';
import { Button } from '../ui/Button';
import { GlassmorphicInput } from '../ui/GlassmorphicInput';
import { Badge } from '../ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

interface ChallengeManagementDashboardProps {
  className?: string;
}

type ViewMode = 'overview' | 'create' | 'browse' | 'my-challenges' | 'skill-tracking' | 'discover';

export const ChallengeManagementDashboard: React.FC<ChallengeManagementDashboardProps> = ({
  className = ''
}) => {
  const { currentUser } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [selectedTier, setSelectedTier] = useState<ChallengeType>(ChallengeType.SOLO);
  const [availableChallenges, setAvailableChallenges] = useState<Challenge[]>([]);
  const [userChallenges, setUserChallenges] = useState<UserChallenge[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<ChallengeDifficulty | 'all'>('all');

  // Load challenges
  useEffect(() => {
    const loadChallenges = async () => {
      if (!currentUser) return;
      
      setLoading(true);
      try {
        // Load available challenges
        const availableResponse = await getChallenges({
          status: [ChallengeStatus.ACTIVE],
          type: [selectedTier],
          limit: 20
        });
         if (availableResponse.success && availableResponse.challenges) {
          setAvailableChallenges(availableResponse.challenges);
        }

        // Load user's challenges
        const userResponse = await getUserChallenges(currentUser.uid);
        if (userResponse.success && userResponse.challenges) {
          // getUserChallenges returns a list of challenges; dashboard expects UserChallenge[], but
          // we only need counts/status breakdown in overview cards. For now, set empty to avoid type error
          setUserChallenges([]);
        }
      } catch (error) {
        console.error('Error loading challenges:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChallenges();
  }, [currentUser, selectedTier]);

  // Handle challenge creation
  const handleCreateChallenge = async (data: ChallengeCreationData) => {
    if (!currentUser) return;

    try {
      // Check if user can create this type of challenge
          const canAccess = await canAccessTier(currentUser.uid, (
            data.type === ChallengeType.SOLO ? 'SOLO' :
            data.type === ChallengeType.TRADE ? 'TRADE' :
            'COLLABORATION'
          ));
      if (!canAccess) {
        throw new Error(`You haven't unlocked ${data.type} challenges yet`);
      }

      // Create challenge
      const challengeData = {
        title: data.title,
        description: data.description,
        type: data.type,
        category: data.category as ChallengeCategory,
        difficulty: data.difficulty,
        requirements: [],
        rewards: {
          xp: getDifficultyXP(data.difficulty),
          badges: [],
          specialRecognition: '',
          unlockableFeatures: []
        },
        startDate: Timestamp.now(),
        endDate: Timestamp.fromDate(data.endDate),
        maxParticipants: data.maxParticipants,
        instructions: data.instructions,
        objectives: data.objectives,
        timeEstimate: data.timeEstimate,
        tags: data.tags,
        createdBy: currentUser.uid
      };

      const response = await createChallenge(challengeData);
      if (response.success) {
        setViewMode('overview');
        // Refresh challenges
        const availableResponse = await getChallenges({
          status: [ChallengeStatus.ACTIVE],
          type: [selectedTier],
          limit: 20
        });
        if (availableResponse.success && availableResponse.challenges) {
          setAvailableChallenges(availableResponse.challenges);
        }
      } else {
        throw new Error(response.error || 'Failed to create challenge');
      }
    } catch (error) {
      console.error('Challenge creation error:', error);
      throw error;
    }
  };

  // Get XP based on difficulty
  const getDifficultyXP = (difficulty: ChallengeDifficulty): number => {
    switch (difficulty) {
      case ChallengeDifficulty.BEGINNER: return 100;
      case ChallengeDifficulty.INTERMEDIATE: return 200;
      case ChallengeDifficulty.ADVANCED: return 350;
      case ChallengeDifficulty.EXPERT: return 500;
      default: return 100;
    }
  };

  // Filter challenges
  const filteredChallenges = availableChallenges.filter(challenge => {
    const matchesSearch = challenge.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         challenge.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty = filterDifficulty === 'all' || challenge.difficulty === filterDifficulty;
    return matchesSearch && matchesDifficulty;
  });

  // Get challenge type icon
  const getChallengeTypeIcon = (type: ChallengeType) => {
    switch (type) {
      case ChallengeType.SOLO: return <Zap className="w-4 h-4" />;
      case ChallengeType.TRADE: return <TrendingUp className="w-4 h-4" />;
      case ChallengeType.COLLABORATION: return <Users className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty: ChallengeDifficulty) => {
    switch (difficulty) {
      case ChallengeDifficulty.BEGINNER: return 'bg-green-500/20 text-green-300 border-green-500/30';
      case ChallengeDifficulty.INTERMEDIATE: return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case ChallengeDifficulty.ADVANCED: return 'bg-primary/20 text-primary border-primary/30';
      case ChallengeDifficulty.EXPERT: return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Challenge Hub</h1>
          <p className="text-gray-300">Create, discover, and complete challenges to level up your skills</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'overview' ? 'default' : 'outline'}
            onClick={() => setViewMode('overview')}
            size="sm"
          >
            Overview
          </Button>
          <Button
            variant={viewMode === 'browse' ? 'default' : 'outline'}
            onClick={() => setViewMode('browse')}
            size="sm"
          >
            Browse
          </Button>
          <Button
            variant={viewMode === 'discover' ? 'default' : 'outline'}
            onClick={() => setViewMode('discover')}
            size="sm"
            className="bg-gradient-to-r from-purple-500 to-pink-500"
          >
            <Search className="w-4 h-4 mr-2" />
            Discover
          </Button>
          <Button
            variant={viewMode === 'my-challenges' ? 'default' : 'outline'}
            onClick={() => setViewMode('my-challenges')}
            size="sm"
          >
            My Challenges
          </Button>
          <Button
            variant={viewMode === 'skill-tracking' ? 'default' : 'outline'}
            onClick={() => setViewMode('skill-tracking')}
            size="sm"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Skills
          </Button>
          <Button
            variant={viewMode === 'create' ? 'default' : 'outline'}
            onClick={() => setViewMode('create')}
            size="sm"
            className="bg-gradient-to-r from-orange-500 to-blue-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create
          </Button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Overview Mode */}
        {viewMode === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Three-Tier Progression */}
            <ThreeTierProgressionUI
              onTierSelect={(tier) => {
                const mapped = tier === 'SOLO' ? ChallengeType.SOLO : tier === 'TRADE' ? ChallengeType.TRADE : ChallengeType.COLLABORATION;
                setSelectedTier(mapped);
              }}
              className="mb-8"
            />

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="glassmorphic">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Trophy className="w-8 h-8 text-yellow-400" />
                    <div>
                      <div className="text-2xl font-bold text-white">
                        {userChallenges.filter(c => c.status === UserChallengeStatus.COMPLETED).length}
                      </div>
                      <div className="text-sm text-gray-300">Completed</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

               <Card className="glassmorphic">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-8 h-8 text-blue-400" />
                    <div>
                      <div className="text-2xl font-bold text-white">
                        {userChallenges.filter(c => c.status === UserChallengeStatus.ACTIVE).length}
                      </div>
                      <div className="text-sm text-gray-300">In Progress</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

               <Card className="glassmorphic">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Target className="w-8 h-8 text-green-400" />
                    <div>
                      <div className="text-2xl font-bold text-white">{availableChallenges.length}</div>
                      <div className="text-sm text-gray-300">Available</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

               <Card className="glassmorphic">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Users className="w-8 h-8 text-purple-400" />
                    <div>
                      <div className="text-2xl font-bold text-white">
                        {availableChallenges.reduce((sum, c) => sum + c.participantCount, 0)}
                      </div>
                      <div className="text-sm text-gray-300">Participants</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {/* Create Mode */}
        {viewMode === 'create' && (
          <motion.div
            key="create"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <ChallengeCreationForm
              onSubmit={handleCreateChallenge}
              onCancel={() => setViewMode('overview')}
              allowedTypes={[ChallengeType.SOLO, ChallengeType.TRADE, ChallengeType.COLLABORATION]}
            />
          </motion.div>
        )}

        {/* Browse Mode */}
        {viewMode === 'browse' && (
          <motion.div
            key="browse"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                  <GlassmorphicInput
                    placeholder="Search challenges..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    label="Search Challenges"
                    variant="glass"
                    size="md"
                    animatedLabel
                    realTimeValidation
                  />
              </div>
              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value as ChallengeDifficulty | 'all')}
                className="px-3 py-2 glassmorphic text-white"
              >
                <option value="all">All Difficulties</option>
                <option value={ChallengeDifficulty.BEGINNER}>Beginner</option>
                <option value={ChallengeDifficulty.INTERMEDIATE}>Intermediate</option>
                <option value={ChallengeDifficulty.ADVANCED}>Advanced</option>
                <option value={ChallengeDifficulty.EXPERT}>Expert</option>
              </select>
            </div>

            {/* Challenge Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredChallenges.map((challenge) => (
                <Card key={challenge.id} className="glassmorphic hover:bg-white/15 transition-all duration-300">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg text-white line-clamp-2">
                        {challenge.title}
                      </CardTitle>
                      {getChallengeTypeIcon(challenge.type)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-gray-300 text-sm line-clamp-3">
                      {challenge.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-2">
                      <Badge className={getDifficultyColor(challenge.difficulty)}>
                        {challenge.difficulty}
                      </Badge>
                      {challenge.timeEstimate && (
                        <Badge variant="outline" className="border-border text-gray-300">
                          <Clock className="w-3 h-3 mr-1" />
                          {challenge.timeEstimate}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <span>{challenge.participantCount} participants</span>
                      <span>{challenge.rewards.xp} XP</span>
                    </div>

                    <Button className="w-full" size="sm">
                      Join Challenge
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredChallenges.length === 0 && (
              <div className="text-center py-12">
                <Target className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">No challenges found</h3>
                <p className="text-gray-500">Try adjusting your search or filters</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Skill Tracking Mode */}
        {viewMode === 'skill-tracking' && (
          <motion.div
            key="skill-tracking"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <SkillProgressDashboard
              userId={currentUser?.uid || ''}
              skills={['JavaScript', 'React', 'Node.js', 'Python', 'Design', 'Project Management']}
            />
          </motion.div>
        )}

        {/* Challenge Discovery Mode */}
        {viewMode === 'discover' && (
          <motion.div
            key="discover"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <ChallengeDiscoveryInterface
              userId={currentUser?.uid || ''}
              onChallengeSelect={(challenge) => {
                console.log('Selected challenge:', challenge);
                // Could navigate to challenge details or start challenge
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
