import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import { 
  Challenge, 
  UserChallenge,
  ChallengeDifficulty 
} from '../../types/gamification';
import { 
  ChallengeCompletionData,
  CompletionReward,
  completeChallenge,
  handlePostCompletionActions
} from '../../services/challengeCompletion';
import { submitToChallenge } from '../../services/challenges';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import EvidenceSubmitter from '../evidence/EvidenceSubmitter';
import EvidenceGallery from '../evidence/EvidenceGallery';
import { EmbeddedEvidence } from '../../types/evidence';
import { 
  CheckCircle, 
  Award, 
  Star, 
  Clock, 
  Target,
  Upload,
  Link,
  MessageSquare,
  Zap,
  Trophy,
  TrendingUp,
  Gift,
  Sparkles
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { useAccessibility } from '../../hooks/useAccessibility';
import { useMobileOptimization } from '../../hooks/useMobileOptimization';
import { ResponsiveContainer, ResponsiveStack } from '../layout/ResponsiveContainer';

interface ChallengeCompletionInterfaceProps {
  challenge: Challenge;
  userChallenge: UserChallenge;
  userId: string;
  onComplete?: (rewards: CompletionReward) => void;
  onCancel?: () => void;
  className?: string;
}

export const ChallengeCompletionInterface: React.FC<ChallengeCompletionInterfaceProps> = ({
  challenge,
  userChallenge,
  userId,
  onComplete,
  onCancel,
  className = ''
}) => {
  const [step, setStep] = useState<'submission' | 'review' | 'completed'>('submission');
  const [loading, setLoading] = useState(false);
  const [completionData, setCompletionData] = useState<ChallengeCompletionData>({
    completionMethod: 'manual',
    submissionData: {},
    difficultyRating: undefined,
    feedback: ''
  });
  const [rewards, setRewards] = useState<CompletionReward | null>(null);
  const [embeddedEvidence, setEmbeddedEvidence] = useState<EmbeddedEvidence[]>([]);

  // Hooks
  const { showToast } = useToast();
  const {
    announceToScreenReader,
    handleKeyboardNavigation,
    getFormFieldProps
  } = useAccessibility();
  const {
    isMobile,
    isTablet,
    getTouchTargetClass,
    shouldUseReducedAnimations,
    handleTouchFeedback,
    getOptimalSpacing,
  } = useMobileOptimization();

  const handleSubmissionChange = (field: string, value: any) => {
    setCompletionData(prev => ({
      ...prev,
      submissionData: {
        ...prev.submissionData,
        [field]: value
      }
    }));
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      // Persist submission first (stores embedded evidence as part of submission)
      await submitToChallenge(userId, challenge.id, {
        title: `Submission for ${challenge.title}`,
        description: completionData.submissionData?.description || '',
        evidenceUrls: completionData.submissionData?.links || [],
        evidenceTypes: [],
        embeddedEvidence,
        reflectionNotes: completionData.feedback,
        isPublic: true
      });

      const result = await completeChallenge(userId, challenge.id, {
        ...completionData,
        submissionData: {
          ...completionData.submissionData,
          // Maintain legacy link support if user added a single link in the field
          links: completionData.submissionData?.links,
          // New: store embedded evidence objects for previewable links
          embeddedEvidence: embeddedEvidence
        }
      });
      
      if (result.success && result.rewards) {
        setRewards(result.rewards);
        setStep('completed');
        
        // Handle post-completion actions
        await handlePostCompletionActions(userId, challenge, result.rewards, userChallenge);
        
        onComplete?.(result.rewards);
      } else {
        throw new Error(result.error || 'Failed to complete challenge');
      }
    } catch (error) {
      console.error('Error completing challenge:', error);
      // Show error message
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: ChallengeDifficulty) => {
    switch (difficulty) {
      case ChallengeDifficulty.BEGINNER: return 'text-green-400 bg-green-500/20 border-green-500/30';
      case ChallengeDifficulty.INTERMEDIATE: return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case ChallengeDifficulty.ADVANCED: return 'text-purple-400 bg-purple-500/20 border-purple-500/30';
      case ChallengeDifficulty.EXPERT: return 'text-amber-400 bg-amber-500/20 border-amber-500/30';
    }
  };

  const renderSubmissionStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <CheckCircle className="w-12 h-12 text-green-400 mx-auto" />
        <h3 className="text-xl font-bold text-white">Complete Challenge</h3>
        <p className="text-gray-300">Submit your work and provide feedback</p>
      </div>

      {/* Challenge Summary */}
      <Card className="glassmorphic">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">{challenge.title}</CardTitle>
            <Badge className={getDifficultyColor(challenge.difficulty)}>
              {challenge.difficulty}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-300 text-sm">{challenge.description}</p>
          <div className="flex items-center space-x-4 mt-3 text-sm text-gray-400">
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{challenge.timeEstimate}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Award className="w-4 h-4" />
              <span>{challenge.rewards?.xp || 0} XP</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submission Form */}
      <Card className="glassmorphic">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Upload className="w-5 h-5" aria-hidden="true" />
            <span>Submit Your Work</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Code Submission */}
          <div>
            <label
              htmlFor="code-submission"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Code (if applicable)
            </label>
            <textarea
              id="code-submission"
              value={completionData.submissionData?.code || ''}
              onChange={(e) => handleSubmissionChange('code', e.target.value)}
              placeholder="Paste your code here..."
              className="w-full h-32 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              aria-describedby="code-submission-hint"
            />
            <p id="code-submission-hint" className="text-xs text-gray-400 mt-1">
              Optional: Include relevant code snippets or solutions
            </p>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description-submission"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Description <span className="text-red-400" aria-label="required">*</span>
            </label>
            <textarea
              id="description-submission"
              value={completionData.submissionData?.description || ''}
              onChange={(e) => handleSubmissionChange('description', e.target.value)}
              placeholder="Describe your solution and approach..."
              className="w-full h-24 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              aria-describedby="description-submission-hint"
            />
            <p id="description-submission-hint" className="text-xs text-gray-400 mt-1">
              Required: Explain your approach, challenges faced, and lessons learned
            </p>
          </div>

          {/* Links */}
          <div>
            <label
              htmlFor="links-submission"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              <Link className="w-4 h-4 inline mr-1" aria-hidden="true" />
              Links (GitHub, Demo, etc.)
            </label>
            <Input
              id="links-submission"
              value={completionData.submissionData?.links?.[0] || ''}
              onChange={(e) => handleSubmissionChange('links', [e.target.value])}
              placeholder="https://github.com/username/project"
              className="bg-gray-800 border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              type="url"
              aria-describedby="links-submission-hint"
            />
            <p id="links-submission-hint" className="text-xs text-gray-400 mt-1">
              Optional: Share links to your code repository, live demo, or documentation
            </p>
          </div>

          {/* Embedded Evidence */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Portfolio Evidence (Embeds)
            </label>
            {embeddedEvidence.length > 0 && (
              <div className="mb-3">
                <EvidenceGallery evidence={embeddedEvidence} />
              </div>
            )}
            <EvidenceSubmitter
              evidence={embeddedEvidence}
              onChange={setEmbeddedEvidence}
              maxItems={6}
            />
          </div>

          {/* Difficulty Rating */}
          <fieldset>
            <legend className="block text-sm font-medium text-gray-300 mb-2">
              How difficult was this challenge for you?
            </legend>
            <div
              className="flex space-x-2"
              role="radiogroup"
              aria-labelledby="difficulty-rating-legend"
              aria-describedby="difficulty-rating-hint"
            >
              {[1, 2, 3, 4, 5].map((rating) => {
                const difficultyLabels = {
                  1: 'Very Easy',
                  2: 'Easy',
                  3: 'Moderate',
                  4: 'Hard',
                  5: 'Very Hard'
                };

                return (
                  <Button
                    key={rating}
                    variant={completionData.difficultyRating === rating ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCompletionData(prev => ({ ...prev, difficultyRating: rating as any }))}
                    className="w-12 h-12"
                    role="radio"
                    aria-checked={completionData.difficultyRating === rating}
                    aria-label={`${rating} - ${difficultyLabels[rating as keyof typeof difficultyLabels]}`}
                  >
                    {rating}
                  </Button>
                );
              })}
            </div>
            <p id="difficulty-rating-hint" className="text-xs text-gray-400 mt-1">
              1 = Very Easy, 5 = Very Hard
            </p>
          </fieldset>

          {/* Feedback */}
          <div>
            <label
              htmlFor="feedback-submission"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              <MessageSquare className="w-4 h-4 inline mr-1" aria-hidden="true" />
              Additional Feedback
            </label>
            <textarea
              id="feedback-submission"
              value={completionData.feedback || ''}
              onChange={(e) => setCompletionData(prev => ({ ...prev, feedback: e.target.value }))}
              placeholder="Any additional thoughts, challenges faced, or suggestions..."
              className="w-full h-20 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              aria-describedby="feedback-submission-hint"
            />
            <p id="feedback-submission-hint" className="text-xs text-gray-400 mt-1">
              Optional: Share any additional insights, challenges, or suggestions for improvement
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div
        className={cn(
          "flex space-x-3",
          isMobile && "flex-col space-x-0 space-y-3"
        )}
        role="group"
        aria-label="Challenge completion actions"
      >
        <Button
          onClick={onCancel}
          variant="outline"
          className={cn(
            "flex-1",
            getTouchTargetClass('large'),
            'touch-feedback'
          )}
          onTouchStart={(e) => handleTouchFeedback(e.currentTarget)}
          aria-label="Cancel challenge completion and return to previous screen"
        >
          Cancel
        </Button>
        <Button
          onClick={handleComplete}
          disabled={loading}
          className={cn(
            "flex-1 bg-gradient-to-r from-green-500 to-blue-500",
            getTouchTargetClass('large'),
            'touch-feedback'
          )}
          onTouchStart={(e) => handleTouchFeedback(e.currentTarget)}
          aria-label={loading ? "Submitting challenge completion..." : "Submit challenge completion"}
          aria-describedby={!completionData.submissionData?.description ? "description-required" : undefined}
        >
          {loading ? (
            <>
              <div
                className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"
                aria-hidden="true"
              />
              <span className="sr-only">Submitting...</span>
            </>
          ) : (
            <CheckCircle className="w-4 h-4 mr-2" aria-hidden="true" />
          )}
          Complete Challenge
        </Button>
        {!completionData.submissionData?.description && (
          <div id="description-required" className="sr-only">
            Description is required to complete the challenge
          </div>
        )}
      </div>
    </motion.div>
  );

  const renderCompletedStep = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6 text-center"
    >
      {/* Success Animation */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="relative"
      >
        <div className="w-24 h-24 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto">
          <Trophy className="w-12 h-12 text-white" />
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="absolute -top-2 -right-2"
        >
          <Sparkles className="w-8 h-8 text-yellow-400" />
        </motion.div>
      </motion.div>

      <div className="space-y-2">
        <h3 className="text-2xl font-bold text-white">Challenge Completed!</h3>
        <p className="text-gray-300">Congratulations on completing "{challenge.title}"</p>
      </div>

      {/* Rewards Summary */}
      {rewards && (
        <Card className="glassmorphic">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-center space-x-2">
              <Gift className="w-5 h-5" />
              <span>Rewards Earned</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* XP Rewards: Base vs Bonus */}
            <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                <span className="text-white font-medium">Experience Points</span>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-yellow-400">
                  +{rewards.xp + rewards.bonusXP} XP
                </div>
                <div className="text-xs text-gray-300">
                  <span className="text-gray-200">Base:</span> +{rewards.xp}
                  {rewards.bonusXP > 0 && (
                    <>
                      <span className="mx-1 text-gray-500">/</span>
                      <span className="text-green-400">Bonus:</span> +{rewards.bonusXP}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Special Rewards */}
            {rewards.specialRewards && rewards.specialRewards.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-300">Special Bonuses</h4>
                {rewards.specialRewards.map((reward, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-white/5 rounded">
                    <span className="text-sm text-gray-300">{reward.description}</span>
                    <Badge className="bg-green-500/20 text-green-300">
                      +{reward.value} XP
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            {/* Tier Progress */}
            {rewards.tierProgress && (
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium text-blue-300">Tier Progress</span>
                </div>
                {rewards.tierProgress.tierUnlocked ? (
                  <p className="text-sm text-green-300">
                    🎉 New tier unlocked: {rewards.tierProgress.tierUnlocked}!
                  </p>
                ) : (
                  <p className="text-sm text-blue-300">
                    Progress made toward next tier
                  </p>
                )}
              </div>
            )}

            {/* Achievements */}
            {rewards.achievements.length > 0 && (
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Award className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-medium text-purple-300">New Achievements</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {rewards.achievements.map((achievement, index) => (
                    <Badge key={index} className="bg-purple-500/30 text-purple-200">
                      {achievement}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex space-x-3">
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
          className="flex-1"
        >
          View Dashboard
        </Button>
        <Button
          onClick={() => {/* Navigate to next challenge */}}
          className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500"
        >
          <Target className="w-4 h-4 mr-2" />
          Next Challenge
        </Button>
      </div>
    </motion.div>
  );

  return (
    <ResponsiveContainer
      maxWidth="2xl"
      className={cn(className)}
      mobileFullWidth={true}
      mobilePadding="md"
      optimizeForTouch={true}
      as="div"
    >
      <div
        role="main"
        aria-label="Challenge completion interface"
        className={cn(
          'w-full',
          isMobile && 'touch-manipulation'
        )}
      >
      <AnimatePresence mode="wait">
        {step === 'submission' && (
          <motion.div
            key="submission"
            role="region"
            aria-label="Challenge submission form"
          >
            {renderSubmissionStep()}
          </motion.div>
        )}
        {step === 'completed' && (
          <motion.div
            key="completed"
            role="region"
            aria-label="Challenge completion results"
            aria-live="polite"
          >
            {renderCompletedStep()}
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </ResponsiveContainer>
  );
};
