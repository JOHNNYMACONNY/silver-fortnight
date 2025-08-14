import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import { useAuth } from '../../AuthContext';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { ImprovedProjectCreationWizard } from './ImprovedProjectCreationWizard';
import {
  Users,
  Plus,
  Search,
  Filter,
  Clock,
  MapPin,
  Star,
  ArrowRight,
  Lightbulb,
  Target,
  Zap,
  Heart,
  MessageCircle,
  Calendar,
  CheckCircle,
  Wand2
} from 'lucide-react';

// Simplified collaboration data structure
interface SimpleCollaboration {
  id: string;
  title: string;
  description: string;
  category: 'Learning' | 'Building' | 'Creative' | 'Research' | 'Social';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  timeCommitment: '1-2 hours' | '3-5 hours' | '5-10 hours' | '10+ hours';
  teamSize: number;
  currentMembers: number;
  skillsNeeded: string[];
  status: 'recruiting' | 'active' | 'completed';
  createdBy: string;
  createdAt: Date;
  isRemote: boolean;
  estimatedDuration: string;
  tags: string[];
}

interface SimplifiedCollaborationInterfaceProps {
  className?: string;
}

export const SimplifiedCollaborationInterface: React.FC<SimplifiedCollaborationInterfaceProps> = ({
  className = ''
}) => {
  const { currentUser } = useAuth();
  const [view, setView] = useState<'discover' | 'my-projects' | 'create'>('discover');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [collaborations, setCollaborations] = useState<SimpleCollaboration[]>([]);
  const [loading, setLoading] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    const mockCollaborations: SimpleCollaboration[] = [
      {
        id: '1',
        title: 'Build a Recipe Sharing App',
        description: 'Create a mobile app where people can share and discover recipes from around the world.',
        category: 'Building',
        difficulty: 'Intermediate',
        timeCommitment: '5-10 hours',
        teamSize: 4,
        currentMembers: 2,
        skillsNeeded: ['React Native', 'UI/UX Design', 'Backend'],
        status: 'recruiting',
        createdBy: 'user1',
        createdAt: new Date(),
        isRemote: true,
        estimatedDuration: '6 weeks',
        tags: ['mobile', 'food', 'social']
      },
      {
        id: '2',
        title: 'Learn JavaScript Together',
        description: 'Study group for beginners to learn JavaScript fundamentals through pair programming.',
        category: 'Learning',
        difficulty: 'Beginner',
        timeCommitment: '3-5 hours',
        teamSize: 6,
        currentMembers: 4,
        skillsNeeded: ['Beginner-friendly', 'Patience', 'Teaching'],
        status: 'recruiting',
        createdBy: 'user2',
        createdAt: new Date(),
        isRemote: true,
        estimatedDuration: '8 weeks',
        tags: ['javascript', 'learning', 'beginner']
      },
      {
        id: '3',
        title: 'Design a Sustainable City',
        description: 'Creative project to design an eco-friendly city using digital tools and research.',
        category: 'Creative',
        difficulty: 'Advanced',
        timeCommitment: '10+ hours',
        teamSize: 5,
        currentMembers: 3,
        skillsNeeded: ['3D Modeling', 'Research', 'Environmental Science'],
        status: 'active',
        createdBy: 'user3',
        createdAt: new Date(),
        isRemote: false,
        estimatedDuration: '12 weeks',
        tags: ['sustainability', 'design', 'research']
      }
    ];
    setCollaborations(mockCollaborations);
  }, []);

  const categories = ['all', 'Learning', 'Building', 'Creative', 'Research', 'Social'];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Learning': return <Lightbulb className="w-4 h-4" />;
      case 'Building': return <Target className="w-4 h-4" />;
      case 'Creative': return <Heart className="w-4 h-4" />;
      case 'Research': return <Search className="w-4 h-4" />;
      case 'Social': return <Users className="w-4 h-4" />;
      default: return <Star className="w-4 h-4" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'Intermediate': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case 'Advanced': return 'text-purple-400 bg-purple-500/20 border-purple-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'recruiting': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'active': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'completed': return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const filteredCollaborations = collaborations.filter(collab => {
    const matchesSearch = collab.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         collab.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         collab.skillsNeeded.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || collab.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const renderCollaborationCard = (collaboration: SimpleCollaboration) => (
    <Card 
      key={collaboration.id}
      className="glassmorphic transition-all duration-300 cursor-pointer group"
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            {getCategoryIcon(collaboration.category)}
            <CardTitle className="text-lg text-white line-clamp-2 flex-1">
              {collaboration.title}
            </CardTitle>
          </div>
          <Badge className={getStatusColor(collaboration.status)}>
            {collaboration.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-300 text-sm line-clamp-3">
          {collaboration.description}
        </p>

        {/* Team Progress */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-300">
              {collaboration.currentMembers}/{collaboration.teamSize} members
            </span>
          </div>
          <div className="w-24 bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(collaboration.currentMembers / collaboration.teamSize) * 100}%` }}
            />
          </div>
        </div>

        {/* Meta Information */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>{collaboration.timeCommitment}/week</span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="w-3 h-3" />
            <span>{collaboration.estimatedDuration}</span>
          </div>
          <div className="flex items-center space-x-1">
            <MapPin className="w-3 h-3" />
            <span>{collaboration.isRemote ? 'Remote' : 'In-person'}</span>
          </div>
        </div>

        {/* Difficulty and Skills */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Badge className={getDifficultyColor(collaboration.difficulty)}>
              {collaboration.difficulty}
            </Badge>
            <div className="flex items-center space-x-1 text-xs text-gray-400">
              <Zap className="w-3 h-3" />
              <span>{collaboration.skillsNeeded.length} skills needed</span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-1">
            {collaboration.skillsNeeded.slice(0, 3).map((skill, index) => (
              <Badge key={index} variant="outline" className="text-xs border-gray-500 text-gray-300">
                {skill}
              </Badge>
            ))}
            {collaboration.skillsNeeded.length > 3 && (
              <Badge variant="outline" className="text-xs border-gray-500 text-gray-400">
                +{collaboration.skillsNeeded.length - 3} more
              </Badge>
            )}
          </div>
        </div>

        {/* Action Button */}
        <Button 
          className="w-full group-hover:bg-gradient-to-r group-hover:from-blue-500 group-hover:to-purple-500 transition-all duration-300"
          variant={collaboration.status === 'recruiting' ? 'default' : 'outline'}
        >
          {collaboration.status === 'recruiting' ? (
            <>
              <Users className="w-4 h-4 mr-2" />
              Join Project
            </>
          ) : collaboration.status === 'active' ? (
            <>
              <MessageCircle className="w-4 h-4 mr-2" />
              View Progress
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              View Results
            </>
          )}
          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </CardContent>
    </Card>
  );

  const renderDiscoverView = () => (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search projects by title, skills, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 glassmorphic"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="whitespace-nowrap"
            >
              {category !== 'all' && getCategoryIcon(category)}
              <span className={category !== 'all' ? 'ml-1' : ''}>
                {category === 'all' ? 'All' : category}
              </span>
            </Button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCollaborations.map(renderCollaborationCard)}
      </div>

      {filteredCollaborations.length === 0 && (
        <div className="text-center py-12">
          <Target className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">No projects found</h3>
          <p className="text-gray-500">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );

  const renderMyProjectsView = () => (
    <div className="space-y-6">
      <div className="text-center py-12">
        <Users className="w-16 h-16 text-gray-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-400 mb-2">Your Projects</h3>
        <p className="text-gray-500 mb-6">Projects you've joined or created will appear here</p>
        <Button onClick={() => setView('discover')} className="bg-gradient-to-r from-blue-500 to-purple-500">
          <Search className="w-4 h-4 mr-2" />
          Discover Projects
        </Button>
      </div>
    </div>
  );

  const renderCreateView = () => {
    const [showWizard, setShowWizard] = useState(false);

    if (showWizard) {
      return (
        <div className="max-w-6xl mx-auto">
          <ImprovedProjectCreationWizard
            onComplete={(data) => {
              console.log('Project created:', data);
              // TODO: Integrate with backend
              setView('my-projects');
              setShowWizard(false);
            }}
            onCancel={() => {
              setShowWizard(false);
              setView('discover');
            }}
            mode="guided"
          />
        </div>
      );
    }

    return (
      <div className="max-w-2xl mx-auto">
        <Card className="glassmorphic">
          <CardHeader>
            <CardTitle className="text-white text-center">Create New Project</CardTitle>
          </CardHeader>
          <CardContent className="text-center py-12">
            <Plus className="w-16 h-16 text-blue-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Start Your Collaboration</h3>
            <p className="text-gray-300 mb-6">
              Use our smart wizard to create the perfect collaboration project
            </p>
            <Button
              onClick={() => setShowWizard(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              <Wand2 className="w-4 h-4 mr-2" />
              Start Creation Wizard
            </Button>
            <div className="mt-4">
              <Button onClick={() => setView('discover')} variant="outline">
                <ArrowRight className="w-4 h-4 mr-2" />
                Back to Discovery
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <Users className="w-8 h-8 text-blue-400" />
          <h2 className="text-2xl font-bold text-white">Collaboration Hub</h2>
        </div>
        <p className="text-gray-300 max-w-2xl mx-auto">
          Find amazing people to learn and build with. Join existing projects or start your own collaborative journey.
        </p>
      </div>

      {/* Navigation */}
      <div className="flex justify-center space-x-2">
        <Button
          variant={view === 'discover' ? 'default' : 'outline'}
          onClick={() => setView('discover')}
          size="sm"
        >
          <Search className="w-4 h-4 mr-2" />
          Discover
        </Button>
        <Button
          variant={view === 'my-projects' ? 'default' : 'outline'}
          onClick={() => setView('my-projects')}
          size="sm"
        >
          <Users className="w-4 h-4 mr-2" />
          My Projects
        </Button>
        <Button
          variant={view === 'create' ? 'default' : 'outline'}
          onClick={() => setView('create')}
          size="sm"
          className="bg-gradient-to-r from-green-500 to-blue-500"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create
        </Button>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {view === 'discover' && renderDiscoverView()}
          {view === 'my-projects' && renderMyProjectsView()}
          {view === 'create' && renderCreateView()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
