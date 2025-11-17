import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import { 
  AICodeReview, 
  CodeSubmission, 
  ReviewFeedback, 
  CodeSuggestion,
  aiCodeReviewService 
} from '../../services/ai/codeReviewService';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Textarea } from '../ui/Textarea';
import { logger } from '@utils/logging/logger';
import { 
  Brain, 
  Code, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  Lightbulb,
  TrendingUp,
  Target,
  Clock,
  Zap
} from 'lucide-react';

interface AICodeReviewInterfaceProps {
  challengeId: string;
  userId: string;
  language: string;
  onReviewComplete?: (review: AICodeReview) => void;
  className?: string;
}

export const AICodeReviewInterface: React.FC<AICodeReviewInterfaceProps> = ({
  challengeId,
  userId,
  language,
  onReviewComplete,
  className = ''
}) => {
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);
  const [review, setReview] = useState<AICodeReview | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Handle code submission for review
  const handleSubmitForReview = useCallback(async () => {
    if (!code.trim()) {
      setError('Please enter your code before submitting for review');
      return;
    }

    setIsReviewing(true);
    setError(null);

    try {
      const submission: CodeSubmission = {
        id: `submission_${Date.now()}`,
        userId,
        challengeId,
        code: code.trim(),
        language,
        description: description.trim() || undefined,
        submittedAt: new Date()
      };

      const reviewResponse = await aiCodeReviewService.reviewCode(submission);
      
      if (reviewResponse.success && reviewResponse.data) {
        setReview(reviewResponse.data);
        onReviewComplete?.(reviewResponse.data);
      } else {
        setError(reviewResponse.error || 'Failed to review code');
      }
    } catch (err) {
      logger.error('Code review error:', 'COMPONENT', {}, err as Error);
      setError('An unexpected error occurred during review');
    } finally {
      setIsReviewing(false);
    }
  }, [code, description, userId, challengeId, language, onReviewComplete]);

  // Get severity icon
  const getSeverityIcon = (severity: ReviewFeedback['severity']) => {
    switch (severity) {
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'info': return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  // Get severity color
  const getSeverityColor = (severity: ReviewFeedback['severity']) => {
    switch (severity) {
    case 'error': return 'border-error bg-red-500/10';
    case 'warning': return 'border-warning bg-yellow-500/10';
      case 'info': return 'border-blue-500/30 bg-blue-500/10';
    }
  };

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-primary';
    return 'text-red-400';
  };

  // Get impact color
  const getImpactColor = (impact: CodeSuggestion['impact']) => {
    switch (impact) {
    case 'high': return 'bg-red-500/20 text-red-300 border-error';
    case 'medium': return 'bg-yellow-500/20 text-yellow-300 border-warning';
    case 'low': return 'bg-green-500/20 text-green-300 border-success';
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-3">
          <Brain className="w-8 h-8 text-purple-400" />
          <h2 className="text-2xl font-bold text-white">AI Code Review</h2>
        </div>
        <p className="text-gray-300">
          Get instant feedback on your code with AI-powered analysis
        </p>
      </div>

      {!review ? (
        /* Code Submission Form */
        <Card className="glassmorphic">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Code className="w-5 h-5" />
              <span>Submit Your Code</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Code ({language})
              </label>
              <Textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={`Paste your ${language} code here...`}
                rows={12}
                className="bg-gray-900/50 border-gray-600 text-white font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description (Optional)
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what your code does, any challenges you faced, or specific areas you'd like feedback on..."
                rows={3}
                className="bg-gray-900/50 border-gray-600 text-white"
              />
            </div>

            {error && (
              <div className="bg-red-500/20 border border-error rounded-lg p-3">
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            <Button
              onClick={handleSubmitForReview}
              disabled={isReviewing || !code.trim()}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
            >
              {isReviewing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Analyzing Code...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  Get AI Review
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Review Results */
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Overall Score */}
            <Card className="glassmorphic">
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center space-x-4">
                    <div className="text-center">
                      <div className={cn("text-4xl font-bold", getScoreColor(review.overallScore))}>
                        {review.overallScore}
                      </div>
                      <div className="text-sm text-gray-300">Overall Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-semibold text-white capitalize">
                        {review.estimatedSkillLevel}
                      </div>
                      <div className="text-sm text-gray-300">Skill Level</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-medium text-gray-300">
                        {review.reviewTimeMs}ms
                      </div>
                      <div className="text-sm text-gray-300">Review Time</div>
                    </div>
                  </div>
                  
                  <p className="text-gray-300">
                    {aiCodeReviewService.getReviewSummary(review)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Feedback */}
            <Card className="glassmorphic">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Target className="w-5 h-5" />
                  <span>Detailed Feedback</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {review.feedback.map((feedback, index) => (
                  <div
                    key={index}
                    className={cn(
                      "p-4 rounded-lg border",
                      getSeverityColor(feedback.severity)
                    )}
                  >
                    <div className="flex items-start space-x-3">
                      {getSeverityIcon(feedback.severity)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-white capitalize">
                            {feedback.category.replace('-', ' ')}
                          </h4>
                          <Badge className={getScoreColor(feedback.score)}>
                            {feedback.score}/100
                          </Badge>
                        </div>
                        <p className="text-gray-300 text-sm">{feedback.message}</p>
                        {feedback.codeSnippet && (
                          <pre className="mt-2 p-2 bg-gray-900/50 rounded text-xs text-gray-300 overflow-x-auto">
                            <code>{feedback.codeSnippet}</code>
                          </pre>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Suggestions */}
            {review.suggestions.length > 0 && (
              <Card className="glassmorphic">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <Lightbulb className="w-5 h-5" />
                    <span>Suggestions for Improvement</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {review.suggestions.map((suggestion, index) => (
                    <div key={index} className="p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-white">{suggestion.title}</h4>
                        <div className="flex space-x-2">
                          <Badge className={getImpactColor(suggestion.impact)}>
                            {suggestion.impact} impact
                          </Badge>
                          <Badge variant="outline" className="border-gray-500 text-gray-300">
                            {suggestion.difficulty}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-gray-300 text-sm mb-3">{suggestion.description}</p>
                      
                      {suggestion.originalCode && suggestion.suggestedCode && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h5 className="text-sm font-medium text-red-300 mb-1">Current:</h5>
                            <pre className="p-2 bg-red-900/20 rounded text-xs text-gray-300 overflow-x-auto">
                              <code>{suggestion.originalCode}</code>
                            </pre>
                          </div>
                          <div>
                            <h5 className="text-sm font-medium text-green-300 mb-1">Suggested:</h5>
                            <pre className="p-2 bg-green-900/20 rounded text-xs text-gray-300 overflow-x-auto">
                              <code>{suggestion.suggestedCode}</code>
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Strengths and Next Steps */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Strengths */}
              <Card className="glassmorphic">
                <CardHeader>
                  <CardTitle className="text-green-300 flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5" />
                    <span>Strengths</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {review.strengths.map((strength, index) => (
                      <li key={index} className="text-green-200 text-sm flex items-start space-x-2">
                        <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Next Steps */}
              <Card className="glassmorphic">
                <CardHeader>
                  <CardTitle className="text-blue-300 flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5" />
                    <span>Next Steps</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {review.nextSteps.map((step, index) => (
                      <li key={index} className="text-blue-200 text-sm flex items-start space-x-2">
                        <Zap className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => {
                  setReview(null);
                  setCode('');
                  setDescription('');
                  setError(null);
                }}
                variant="outline"
              >
                Submit New Code
              </Button>
              <Button className="bg-gradient-to-r from-green-500 to-blue-500">
                Continue Challenge
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};
