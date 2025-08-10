import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import { 
  SkillProgressAnalytics,
  SkillGap,
  getSkillProgressAnalytics,
  identifySkillGaps
} from '../../services/skillAssessment';
import { SkillLevel } from '../../types/gamification';
import { SkillAssessmentInterface } from './SkillAssessmentInterface';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { 
  TrendingUp, 
  Target, 
  Award, 
  Clock, 
  BarChart3,
  Plus,
  AlertTriangle,
  CheckCircle,
  Brain,
  Zap
} from 'lucide-react';

interface SkillProgressDashboardProps {
  userId: string;
  skills?: string[];
  className?: string;
}

export const SkillProgressDashboard: React.FC<SkillProgressDashboardProps> = ({
  userId,
  skills = ['JavaScript', 'React', 'Node.js', 'Python', 'Design'],
  className = ''
}) => {
  const [skillAnalytics, setSkillAnalytics] = useState<Record<string, SkillProgressAnalytics>>({});
  const [skillGaps, setSkillGaps] = useState<SkillGap[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [showAssessment, setShowAssessment] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSkillData();
  }, [userId, skills]);

  const loadSkillData = async () => {
    setLoading(true);
    try {
      // Load analytics for each skill
      const analyticsPromises = skills.map(async (skill) => {
        const response = await getSkillProgressAnalytics(userId, skill);
        return { skill, analytics: response.success ? response.data : null };
      });

      const analyticsResults = await Promise.all(analyticsPromises);
      const analyticsMap: Record<string, SkillProgressAnalytics> = {};
      
      analyticsResults.forEach(({ skill, analytics }) => {
        if (analytics) {
          analyticsMap[skill] = analytics;
        }
      });

      setSkillAnalytics(analyticsMap);

      // Identify skill gaps
      const targetSkills = skills.map(skill => ({
        skillName: skill,
        targetLevel: SkillLevel.ADVANCED // Default target
      }));

      const gapsResponse = await identifySkillGaps(userId, targetSkills);
      if (gapsResponse.success && gapsResponse.data) {
        setSkillGaps(gapsResponse.data);
      }
    } catch (error) {
      console.error('Error loading skill data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSkillClick = (skill: string) => {
    setSelectedSkill(skill);
    setShowAssessment(true);
  };

  const handleAssessmentComplete = () => {
    setShowAssessment(false);
    setSelectedSkill(null);
    loadSkillData(); // Refresh data
  };

  const getLevelColor = (level: SkillLevel) => {
    switch (level) {
      case SkillLevel.BEGINNER: return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case SkillLevel.INTERMEDIATE: return 'text-green-400 bg-green-500/20 border-green-500/30';
      case SkillLevel.ADVANCED: return 'text-purple-400 bg-purple-500/20 border-purple-500/30';
      case SkillLevel.EXPERT: return 'text-amber-400 bg-amber-500/20 border-amber-500/30';
    }
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'low': return 'text-green-400 bg-green-500/20 border-green-500/30';
    }
  };

  const getOverallProgress = () => {
    const analytics = Object.values(skillAnalytics);
    if (analytics.length === 0) return 0;
    
    const totalProgress = analytics.reduce((sum, skill) => sum + skill.progressPercentage, 0);
    return Math.round(totalProgress / analytics.length);
  };

  const getAverageCompetency = () => {
    const analytics = Object.values(skillAnalytics);
    if (analytics.length === 0) return 0;
    
    const totalCompetency = analytics.reduce((sum, skill) => sum + skill.competencyScore, 0);
    return Math.round(totalCompetency / analytics.length);
  };

  if (showAssessment && selectedSkill) {
    return (
      <div className={className}>
        <div className="mb-6">
          <Button
            onClick={() => setShowAssessment(false)}
            variant="outline"
            className="mb-4"
          >
            ← Back to Dashboard
          </Button>
        </div>
        <SkillAssessmentInterface
          userId={userId}
          skillName={selectedSkill}
          onAssessmentComplete={handleAssessmentComplete}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center py-12", className)}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        <span className="ml-3 text-gray-300">Loading skill data...</span>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-3">
          <BarChart3 className="w-8 h-8 text-blue-400" />
          <h2 className="text-2xl font-bold text-white">Skill Progress Dashboard</h2>
        </div>
        <p className="text-gray-300">
          Track your skill development and identify areas for growth
        </p>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">
              {getOverallProgress()}%
            </div>
            <p className="text-gray-300 text-sm">Overall Progress</p>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">
              {getAverageCompetency()}
            </div>
            <p className="text-gray-300 text-sm">Avg Competency Score</p>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-purple-400 mb-2">
              {Object.keys(skillAnalytics).length}
            </div>
            <p className="text-gray-300 text-sm">Skills Tracked</p>
          </CardContent>
        </Card>
      </div>

      {/* Skills Grid */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Target className="w-5 h-5" />
            <span>Your Skills</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {skills.map((skill) => {
              const analytics = skillAnalytics[skill];
              
              return (
                <motion.div
                  key={skill}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-4 bg-gray-800/50 rounded-lg border border-gray-600 cursor-pointer hover:border-gray-500 transition-all"
                  onClick={() => handleSkillClick(skill)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-white">{skill}</h3>
                    {analytics ? (
                      <Badge className={getLevelColor(analytics.currentLevel)}>
                        {analytics.currentLevel}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-gray-500 text-gray-400">
                        Not assessed
                      </Badge>
                    )}
                  </div>

                  {analytics ? (
                    <div className="space-y-3">
                      {/* Progress Bar */}
                      <div>
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                          <span>Progress</span>
                          <span>{Math.round(analytics.progressPercentage)}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${analytics.progressPercentage}%` }}
                          />
                        </div>
                      </div>

                      {/* Trend and Competency */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          <TrendingUp className={cn(
                            "w-3 h-3",
                            analytics.trendDirection === 'improving' ? 'text-green-400' :
                            analytics.trendDirection === 'declining' ? 'text-red-400' : 'text-gray-400'
                          )} />
                          <span className={cn(
                            "text-xs",
                            analytics.trendDirection === 'improving' ? 'text-green-400' :
                            analytics.trendDirection === 'declining' ? 'text-red-400' : 'text-gray-400'
                          )}>
                            {analytics.trendDirection}
                          </span>
                        </div>
                        <Badge variant="outline" className="border-gray-500 text-gray-300 text-xs">
                          {analytics.competencyScore}/100
                        </Badge>
                      </div>

                      {/* Time to next level */}
                      <div className="flex items-center space-x-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>{analytics.timeToNextLevel} to next level</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <Brain className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                      <p className="text-xs text-gray-400">Click to assess</p>
                    </div>
                  )}
                </motion.div>
              );
            })}

            {/* Add New Skill */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="p-4 bg-gray-800/30 rounded-lg border-2 border-dashed border-gray-600 cursor-pointer hover:border-gray-500 transition-all flex items-center justify-center"
            >
              <div className="text-center">
                <Plus className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Add Skill</p>
              </div>
            </motion.div>
          </div>
        </CardContent>
      </Card>

      {/* Skill Gaps */}
      {skillGaps.length > 0 && (
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5" />
              <span>Skill Gaps to Address</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {skillGaps.slice(0, 5).map((gap, index) => (
                <div key={index} className="p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-white">{gap.skillName}</h3>
                    <div className="flex items-center space-x-2">
                      <Badge className={getPriorityColor(gap.priority)}>
                        {gap.priority} priority
                      </Badge>
                      <Badge variant="outline" className="border-gray-500 text-gray-300">
                        {gap.estimatedTimeToClose}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 mb-3">
                    <div className="text-center">
                      <Badge className={getLevelColor(gap.currentLevel)}>
                        {gap.currentLevel}
                      </Badge>
                      <p className="text-xs text-gray-400 mt-1">Current</p>
                    </div>
                    <div className="flex-1 flex items-center">
                      <div className="flex-1 h-1 bg-gray-700 rounded">
                        <div className="h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded w-1/3" />
                      </div>
                    </div>
                    <div className="text-center">
                      <Badge className={getLevelColor(gap.targetLevel)}>
                        {gap.targetLevel}
                      </Badge>
                      <p className="text-xs text-gray-400 mt-1">Target</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Suggested Actions:</h4>
                    <ul className="space-y-1">
                      {gap.suggestedActions.slice(0, 3).map((action, actionIndex) => (
                        <li key={actionIndex} className="text-sm text-gray-400 flex items-start space-x-2">
                          <Zap className="w-3 h-3 mt-0.5 flex-shrink-0 text-blue-400" />
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          onClick={() => setShowAssessment(true)}
          className="bg-gradient-to-r from-blue-500 to-purple-500"
        >
          <Brain className="w-4 h-4 mr-2" />
          Take Skill Assessment
        </Button>
        <Button
          onClick={loadSkillData}
          variant="outline"
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          Refresh Progress
        </Button>
      </div>
    </div>
  );
};
