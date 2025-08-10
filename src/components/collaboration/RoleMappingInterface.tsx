import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { 
  Users, 
  Crown, 
  Wrench, 
  Heart,
  ChevronDown,
  ChevronRight,
  Settings,
  Plus,
  Minus,
  Info,
  Star,
  Clock,
  Target,
  Lightbulb,
  Zap
} from 'lucide-react';

// Simplified role types that map to complex backend roles
export type SimpleRoleType = 'Leader' | 'Builder' | 'Helper' | 'Learner';

export interface SimpleRole {
  type: SimpleRoleType;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  responsibilities: string[];
  timeCommitment: string;
  skillsNeeded: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface RoleMapping {
  simpleRole: SimpleRole;
  backendRoles: {
    id: string;
    title: string;
    description: string;
    requiredSkills: string[];
    permissions: string[];
  }[];
}

interface RoleMappingInterfaceProps {
  projectType: 'learning' | 'building' | 'creative' | 'research';
  teamSize: number;
  onRoleSelect: (roles: SimpleRole[]) => void;
  onAdvancedMode?: () => void;
  className?: string;
}

export const RoleMappingInterface: React.FC<RoleMappingInterfaceProps> = ({
  projectType,
  teamSize,
  onRoleSelect,
  onAdvancedMode,
  className = ''
}) => {
  const [selectedRoles, setSelectedRoles] = useState<SimpleRole[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [expandedRole, setExpandedRole] = useState<SimpleRoleType | null>(null);
  const [customizing, setCustomizing] = useState<SimpleRoleType | null>(null);

  // Define simple role templates
  const roleTemplates: Record<SimpleRoleType, SimpleRole> = {
    Leader: {
      type: 'Leader',
      title: 'Project Leader',
      description: 'Guides the team and makes key decisions',
      icon: <Crown className="w-5 h-5" />,
      color: 'from-yellow-500 to-orange-500',
      responsibilities: [
        'Set project direction and goals',
        'Coordinate team activities',
        'Make final decisions',
        'Communicate with stakeholders'
      ],
      timeCommitment: '5-8 hours/week',
      skillsNeeded: ['Leadership', 'Communication', 'Planning'],
      difficulty: 'Hard'
    },
    Builder: {
      type: 'Builder',
      title: 'Builder/Developer',
      description: 'Creates and implements the main project work',
      icon: <Wrench className="w-5 h-5" />,
      color: 'from-blue-500 to-purple-500',
      responsibilities: [
        'Develop core features',
        'Write code and documentation',
        'Test and debug',
        'Implement designs'
      ],
      timeCommitment: '4-6 hours/week',
      skillsNeeded: ['Technical Skills', 'Problem Solving', 'Attention to Detail'],
      difficulty: 'Medium'
    },
    Helper: {
      type: 'Helper',
      title: 'Support Helper',
      description: 'Assists others and handles supporting tasks',
      icon: <Heart className="w-5 h-5" />,
      color: 'from-green-500 to-teal-500',
      responsibilities: [
        'Support team members',
        'Handle research and documentation',
        'Test and provide feedback',
        'Manage project resources'
      ],
      timeCommitment: '2-4 hours/week',
      skillsNeeded: ['Organization', 'Research', 'Communication'],
      difficulty: 'Easy'
    },
    Learner: {
      type: 'Learner',
      title: 'Learning Participant',
      description: 'Focuses on learning while contributing',
      icon: <Lightbulb className="w-5 h-5" />,
      color: 'from-pink-500 to-rose-500',
      responsibilities: [
        'Learn new skills',
        'Ask questions and seek guidance',
        'Complete learning tasks',
        'Share learning progress'
      ],
      timeCommitment: '3-5 hours/week',
      skillsNeeded: ['Curiosity', 'Dedication', 'Open-mindedness'],
      difficulty: 'Easy'
    }
  };

  // Get recommended roles based on project type and team size
  const getRecommendedRoles = (): SimpleRole[] => {
    const recommendations: SimpleRole[] = [];
    
    // Always need at least one leader for teams > 1
    if (teamSize > 1) {
      recommendations.push(roleTemplates.Leader);
    }

    // Add builders based on project type
    if (projectType === 'building' || projectType === 'creative') {
      recommendations.push(roleTemplates.Builder);
      if (teamSize > 3) {
        recommendations.push({ ...roleTemplates.Builder, title: 'Senior Builder' });
      }
    }

    // Add learners for learning projects
    if (projectType === 'learning') {
      recommendations.push(roleTemplates.Learner);
      if (teamSize > 2) {
        recommendations.push({ ...roleTemplates.Learner, title: 'Learning Partner' });
      }
    }

    // Add helpers for larger teams
    if (teamSize > 2) {
      recommendations.push(roleTemplates.Helper);
    }

    return recommendations.slice(0, teamSize);
  };

  useEffect(() => {
    const recommended = getRecommendedRoles();
    setSelectedRoles(recommended);
  }, [projectType, teamSize]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'Medium': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case 'Hard': return 'text-purple-400 bg-purple-500/20 border-purple-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const handleRoleToggle = (roleType: SimpleRoleType) => {
    const role = roleTemplates[roleType];
    const isSelected = selectedRoles.some(r => r.type === roleType);
    
    if (isSelected) {
      setSelectedRoles(prev => prev.filter(r => r.type !== roleType));
    } else if (selectedRoles.length < teamSize) {
      setSelectedRoles(prev => [...prev, role]);
    }
  };

  const handleCustomizeRole = (roleType: SimpleRoleType, updates: Partial<SimpleRole>) => {
    setSelectedRoles(prev => prev.map(role => 
      role.type === roleType ? { ...role, ...updates } : role
    ));
  };

  const renderRoleCard = (roleType: SimpleRoleType) => {
    const role = roleTemplates[roleType];
    const isSelected = selectedRoles.some(r => r.type === roleType);
    const isExpanded = expandedRole === roleType;
    const isCustomizing = customizing === roleType;
    const selectedRole = selectedRoles.find(r => r.type === roleType);

    return (
      <Card 
        key={roleType}
        className={cn(
          "transition-all duration-300 cursor-pointer",
          isSelected 
            ? "bg-white/20 backdrop-blur-md border-white/40 ring-2 ring-blue-500/50" 
            : "bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15"
        )}
      >
        <CardHeader 
          className="pb-3"
          onClick={() => setExpandedRole(isExpanded ? null : roleType)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-r",
                role.color
              )}>
                {role.icon}
              </div>
              <div>
                <CardTitle className="text-white text-lg">
                  {selectedRole?.title || role.title}
                </CardTitle>
                <p className="text-gray-300 text-sm">{role.description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={getDifficultyColor(role.difficulty)}>
                {role.difficulty}
              </Badge>
              {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
            </div>
          </div>
        </CardHeader>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <CardContent className="space-y-4">
                {/* Role Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Responsibilities</h4>
                    <ul className="space-y-1">
                      {(selectedRole?.responsibilities || role.responsibilities).map((resp, index) => (
                        <li key={index} className="text-sm text-gray-400 flex items-start space-x-2">
                          <Target className="w-3 h-3 mt-1 text-blue-400 flex-shrink-0" />
                          <span>{resp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-gray-300 mb-1">Time Commitment</h4>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-400">{role.timeCommitment}</span>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-300 mb-1">Skills Needed</h4>
                      <div className="flex flex-wrap gap-1">
                        {(selectedRole?.skillsNeeded || role.skillsNeeded).map((skill, index) => (
                          <Badge key={index} variant="outline" className="text-xs border-gray-500 text-gray-300">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customization */}
                {showAdvanced && (
                  <div className="border-t border-gray-600 pt-4">
                    <Button
                      onClick={() => setCustomizing(isCustomizing ? null : roleType)}
                      variant="outline"
                      size="sm"
                      className="mb-3"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      {isCustomizing ? 'Done Customizing' : 'Customize Role'}
                    </Button>

                    <AnimatePresence>
                      {isCustomizing && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="space-y-3"
                        >
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              Custom Title
                            </label>
                            <Input
                              value={selectedRole?.title || role.title}
                              onChange={(e) => handleCustomizeRole(roleType, { title: e.target.value })}
                              className="bg-gray-800 border-gray-600 text-white"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              Custom Description
                            </label>
                            <Textarea
                              value={selectedRole?.description || role.description}
                              onChange={(e) => handleCustomizeRole(roleType, { description: e.target.value })}
                              className="bg-gray-800 border-gray-600 text-white"
                              rows={2}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-2">
                  <Button
                    onClick={() => handleRoleToggle(roleType)}
                    className={cn(
                      "flex-1",
                      isSelected 
                        ? "bg-red-500 hover:bg-red-600" 
                        : "bg-gradient-to-r from-blue-500 to-purple-500"
                    )}
                    disabled={!isSelected && selectedRoles.length >= teamSize}
                  >
                    {isSelected ? (
                      <>
                        <Minus className="w-4 h-4 mr-2" />
                        Remove Role
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Role
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    );
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="text-center space-y-2">
        <h3 className="text-xl font-bold text-white">Choose Team Roles</h3>
        <p className="text-gray-300">
          Select {teamSize} role{teamSize !== 1 ? 's' : ''} for your {projectType} project
        </p>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-400">
          {selectedRoles.length} of {teamSize} roles selected
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => setShowAdvanced(!showAdvanced)}
            variant="outline"
            size="sm"
          >
            <Settings className="w-4 h-4 mr-2" />
            {showAdvanced ? 'Simple Mode' : 'Advanced Mode'}
          </Button>
          {onAdvancedMode && (
            <Button
              onClick={onAdvancedMode}
              variant="outline"
              size="sm"
            >
              <Zap className="w-4 h-4 mr-2" />
              Full Editor
            </Button>
          )}
        </div>
      </div>

      {/* Role Selection */}
      <div className="space-y-4">
        {Object.keys(roleTemplates).map(roleType => 
          renderRoleCard(roleType as SimpleRoleType)
        )}
      </div>

      {/* Selected Roles Summary */}
      {selectedRoles.length > 0 && (
        <Card className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-md border-blue-500/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Selected Team Structure</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {selectedRoles.map((role, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-white/10 rounded-lg">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-r",
                    role.color
                  )}>
                    {role.icon}
                  </div>
                  <div>
                    <div className="text-white font-medium">{role.title}</div>
                    <div className="text-xs text-gray-400">{role.timeCommitment}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex space-x-3">
        <Button
          onClick={() => onRoleSelect(selectedRoles)}
          disabled={selectedRoles.length === 0}
          className="flex-1 bg-gradient-to-r from-green-500 to-blue-500"
        >
          <Star className="w-4 h-4 mr-2" />
          Confirm Roles ({selectedRoles.length})
        </Button>
      </div>

      {/* Help Text */}
      <div className="text-center">
        <div className="inline-flex items-center space-x-2 text-sm text-gray-400 bg-blue-500/10 px-3 py-2 rounded-lg">
          <Info className="w-4 h-4" />
          <span>Roles can be adjusted later as your project evolves</span>
        </div>
      </div>
    </div>
  );
};
