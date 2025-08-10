import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import { 
  SkillAssessment, 
  SkillProgressAnalytics,
  SkillGap,
  createSkillAssessment,
  getSkillProgressAnalytics,
  identifySkillGaps
} from '../../services/skillAssessment';
import { SkillLevel } from '../../types/gamification';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Textarea } from '../ui/Textarea';
import { 
  Target, 
  TrendingUp, 
  Brain, 
  Award, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Lightbulb,
  Star
} from 'lucide-react';

interface SkillAssessmentInterfaceProps {
  userId: string;
  skillName: string;
  onAssessmentComplete?: (assessment: SkillAssessment) => void;
  className?: string;
}

export const SkillAssessmentInterface: React.FC<SkillAssessmentInterfaceProps> = ({
  userId,
  skillName,
  onAssessmentComplete,
  className = ''
}) => {
  const [currentLevel, setCurrentLevel] = useState<SkillLevel>(SkillLevel.BEGINNER);
  const [confidence, setConfidence] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analytics, setAnalytics] = useState<SkillProgressAnalytics | null>(null);
  const [skillGaps, setSkillGaps] = useState<SkillGap[]>([]);
  const [showAnalytics, setShowAnalytics] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, [userId, skillName]);

  const loadAnalytics = async () => {
    try {
      const analyticsResponse = await getSkillProgressAnalytics(userId, skillName);
      if (analyticsResponse.success && analyticsResponse.data) {
        setAnalytics(analyticsResponse.data);
        setCurrentLevel(analyticsResponse.data.currentLevel);
        setShowAnalytics(true);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const handleSubmitAssessment = async () => {
    setIsSubmitting(true);
    
    try {
      const assessment = {
        userId,
        skillName,
        assessmentType: 'self' as const,
        currentLevel,
        confidence,
        evidence: [],
        feedback,
        recommendations: generateRecommendations(currentLevel, confidence),
        nextMilestones: generateNextMilestones(currentLevel)
      };

      const response = await createSkillAssessment(assessment);
      
      if (response.success && response.data) {
        onAssessmentComplete?.(response.data);
        await loadAnalytics(); // Refresh analytics
      }
    } catch (error) {
      console.error('Error submitting assessment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateRecommendations = (level: SkillLevel, confidence: number): string[] => {
    const recommendations = [];
    
    if (confidence < 5) {
      recommendations.push('Practice more to build confidence');
      recommendations.push('Seek mentorship or guidance');
    }
    
    if (level === SkillLevel.BEGINNER) {
      recommendations.push('Complete foundational tutorials');
      recommendations.push('Work on simple projects');
    } else if (level === SkillLevel.INTERMEDIATE) {
      recommendations.push('Take on more complex challenges');
      recommendations.push('Collaborate with others');
    } else if (level === SkillLevel.ADVANCED) {
      recommendations.push('Lead projects in this skill area');
      recommendations.push('Mentor beginners');
    }
    
    return recommendations;
  };

  const generateNextMilestones = (level: SkillLevel) => {
    const milestones = [];
    
    switch (level) {
      case SkillLevel.BEGINNER:
        milestones.push({
          level: SkillLevel.INTERMEDIATE,
          description: 'Reach intermediate level',
          requirements: ['Complete 3 projects', 'Demonstrate practical application'],
          estimatedTimeToComplete: '2-3 months',
          xpReward: 200
        });
        break;
      case SkillLevel.INTERMEDIATE:
        milestones.push({
          level: SkillLevel.ADVANCED,
          description: 'Reach advanced level',
          requirements: ['Lead a project', 'Solve complex problems'],
          estimatedTimeToComplete: '4-6 months',
          xpReward: 400
        });
        break;
      case SkillLevel.ADVANCED:
        milestones.push({
          level: SkillLevel.EXPERT,
          description: 'Reach expert level',
          requirements: ['Teach others', 'Innovate in the field'],
          estimatedTimeToComplete: '6-12 months',
          xpReward: 600
        });
        break;
    }
    
    return milestones;
  };

  const getLevelColor = (level: SkillLevel) => {
    switch (level) {
      case SkillLevel.BEGINNER: return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case SkillLevel.INTERMEDIATE: return 'text-green-400 bg-green-500/20 border-green-500/30';
      case SkillLevel.ADVANCED: return 'text-purple-400 bg-purple-500/20 border-purple-500/30';
      case SkillLevel.EXPERT: return 'text-amber-400 bg-amber-500/20 border-amber-500/30';
    }
  };

  const getConfidenceColor = (conf: number) => {
    if (conf >= 8) return 'text-green-400';
    if (conf >= 6) return 'text-yellow-400';
    if (conf >= 4) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-3">
          <Target className="w-8 h-8 text-blue-400" />
          <h2 className="text-2xl font-bold text-white">Skill Assessment</h2>
        </div>
        <p className="text-gray-300">
          Assess your current level in <span className="font-semibold text-blue-300">{skillName}</span>
        </p>
      </div>

      {showAnalytics && analytics ? (
        /* Analytics View */
        <div className="space-y-6">
          {/* Current Progress */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <BarChart3 className="w-5 h-5" />
                <span>Current Progress</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <Badge className={getLevelColor(analytics.currentLevel)}>
                    {analytics.currentLevel}
                  </Badge>
                  <p className="text-sm text-gray-300 mt-1">Current Level</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {Math.round(analytics.progressPercentage)}%
                  </div>
                  <p className="text-sm text-gray-300">Progress to Next Level</p>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-blue-300">
                    {analytics.timeToNextLevel}
                  </div>
                  <p className="text-sm text-gray-300">Estimated Time</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${analytics.progressPercentage}%` }}
                />
              </div>

              {/* Trend Indicator */}
              <div className="flex items-center justify-center space-x-2">
                <TrendingUp className={cn(
                  "w-4 h-4",
                  analytics.trendDirection === 'improving' ? 'text-green-400' :
                  analytics.trendDirection === 'declining' ? 'text-red-400' : 'text-gray-400'
                )} />
                <span className={cn(
                  "text-sm capitalize",
                  analytics.trendDirection === 'improving' ? 'text-green-400' :
                  analytics.trendDirection === 'declining' ? 'text-red-400' : 'text-gray-400'
                )}>
                  {analytics.trendDirection}
                </span>
                <Badge variant="outline" className="border-gray-500 text-gray-300">
                  {analytics.competencyScore}/100
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Strengths and Improvements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths */}
            <Card className="bg-green-500/10 backdrop-blur-md border-green-500/20">
              <CardHeader>
                <CardTitle className="text-green-300 flex items-center space-x-2">
                  <Star className="w-5 h-5" />
                  <span>Strengths</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analytics.strengthAreas.map((strength, index) => (
                    <li key={index} className="text-green-200 text-sm flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{strength}</span>
                    </li>
                  ))}
                  {analytics.strengthAreas.length === 0 && (
                    <li className="text-green-200 text-sm">Complete more assessments to identify strengths</li>
                  )}
                </ul>
              </CardContent>
            </Card>

            {/* Improvement Areas */}
            <Card className="bg-orange-500/10 backdrop-blur-md border-orange-500/20">
              <CardHeader>
                <CardTitle className="text-orange-300 flex items-center space-x-2">
                  <Lightbulb className="w-5 h-5" />
                  <span>Areas for Growth</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analytics.improvementAreas.map((area, index) => (
                    <li key={index} className="text-orange-200 text-sm flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{area}</span>
                    </li>
                  ))}
                  {analytics.improvementAreas.length === 0 && (
                    <li className="text-orange-200 text-sm">Keep up the great work!</li>
                  )}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>Recent Activity</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Award className="w-4 h-4 text-blue-400" />
                      <div>
                        <p className="text-white text-sm font-medium">{activity.title}</p>
                        <p className="text-gray-400 text-xs">
                          {activity.date.toDate().toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-blue-500/20 text-blue-300">
                      +{activity.xpGained} XP
                    </Badge>
                  </div>
                ))}
                {analytics.recentActivity.length === 0 && (
                  <p className="text-gray-400 text-sm text-center py-4">
                    No recent activity. Complete challenges to see progress!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* New Assessment Button */}
          <div className="text-center">
            <Button
              onClick={() => setShowAnalytics(false)}
              className="bg-gradient-to-r from-blue-500 to-purple-500"
            >
              <Brain className="w-4 h-4 mr-2" />
              Take New Assessment
            </Button>
          </div>
        </div>
      ) : (
        /* Assessment Form */
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Brain className="w-5 h-5" />
              <span>Self Assessment</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Skill Level Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                What's your current skill level?
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.values(SkillLevel).map((level) => (
                  <button
                    key={level}
                    onClick={() => setCurrentLevel(level)}
                    className={cn(
                      "p-3 rounded-lg border text-sm font-medium transition-all",
                      currentLevel === level
                        ? getLevelColor(level)
                        : "border-gray-600 text-gray-300 hover:border-gray-500"
                    )}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Confidence Level */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                How confident are you? ({confidence}/10)
              </label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={confidence}
                  onChange={(e) => setConfidence(Number(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Not confident</span>
                  <span className={getConfidenceColor(confidence)}>
                    {confidence}/10
                  </span>
                  <span>Very confident</span>
                </div>
              </div>
            </div>

            {/* Additional Feedback */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Additional notes (optional)
              </label>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Share any specific experiences, challenges, or goals related to this skill..."
                rows={4}
                className="bg-gray-900/50 border-gray-600 text-white"
              />
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmitAssessment}
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Submitting Assessment...
                </>
              ) : (
                <>
                  <Target className="w-4 h-4 mr-2" />
                  Complete Assessment
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
