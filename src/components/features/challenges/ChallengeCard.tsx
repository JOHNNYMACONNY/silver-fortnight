import React from 'react';
import { cn } from '../../../utils/cn';
import { Card, CardHeader, CardContent, CardTitle, CardFooter } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { Clock, Award, Users, Target, Star } from 'lucide-react';
import { Challenge, ChallengeDifficulty, ChallengeType } from '../../../types/gamification';
import { ChallengeRecommendation } from '../../../services/challengeDiscovery';

export interface ChallengeCardProps {
  challenge: Challenge;
  recommendation?: ChallengeRecommendation;
  onSelect?: (challenge: Challenge) => void;
  className?: string;
  variant?: 'default' | 'glass' | 'elevated' | 'premium';
  enhanced?: boolean;
  footer?: React.ReactNode;
}

const getDifficultyBadgeVariant = (difficulty: ChallengeDifficulty) => {
  switch (difficulty) {
    case ChallengeDifficulty.BEGINNER:
      return 'default' as const;
    case ChallengeDifficulty.INTERMEDIATE:
      return 'secondary' as const;
    case ChallengeDifficulty.ADVANCED:
      return 'outline' as const;
    case ChallengeDifficulty.EXPERT:
      return 'outline' as const;
  }
};

const getTypeIcon = (type: ChallengeType) => {
  switch (type) {
    case ChallengeType.SOLO:
      return <Target className="w-4 h-4" />;
    case ChallengeType.TRADE:
      return <Users className="w-4 h-4" />;
    case ChallengeType.COLLABORATION:
      return <Users className="w-4 h-4" />;
    default:
      return <Target className="w-4 h-4" />;
  }
};

const getMatchColor = (match: ChallengeRecommendation['difficultyMatch']) => {
  switch (match) {
    case 'perfect':
      return 'text-green-500';
    case 'slightly-easy':
      return 'text-blue-500';
    case 'slightly-hard':
      return 'text-amber-500';
    case 'too-easy':
      return 'text-gray-500';
    case 'too-hard':
      return 'text-red-500';
  }
};

export const ChallengeCard: React.FC<ChallengeCardProps> = ({
  challenge,
  recommendation,
  onSelect,
  className,
  variant = 'premium',
  enhanced = true,
  footer,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect?.(challenge);
    }
  };

  return (
    <div
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`View challenge: ${challenge.title}`}
      className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg"
    >
      <Card
        variant={variant}
        tilt={enhanced}
        depth="lg"
        glow={enhanced ? 'subtle' : 'none'}
        glowColor="purple"
        hover
        interactive
        onClick={() => onSelect?.(challenge)}
        className={cn('h-[380px] flex flex-col cursor-pointer overflow-hidden', className)}
      >
        <CardHeader className="pb-3 flex-shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <CardTitle className="truncate text-base font-semibold">
                {challenge.title}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {getTypeIcon(challenge.type)}
              {recommendation && (
                <Badge variant="outline">{Math.round(recommendation.score)}%</Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden px-4 pb-4">
          {challenge.description && (
            <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{challenge.description}</p>
          )}

          <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
            <Badge variant={getDifficultyBadgeVariant(challenge.difficulty)}>
              {challenge.difficulty}
            </Badge>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{challenge.timeEstimate}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Award className="w-4 h-4" />
                <span>{challenge.rewards?.xp || 0} XP</span>
              </div>
            </div>
          </div>

          {recommendation && (
            <div className="space-y-2 p-3 rounded-lg border">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Recommendation</span>
                <span className={cn('text-sm', getMatchColor(recommendation.difficultyMatch))}>
                  {recommendation.difficultyMatch.replace('-', ' ')}
                </span>
              </div>
              {recommendation.reasons.length > 0 && (
                <ul className="space-y-1">
                  {recommendation.reasons.slice(0, 2).map((reason, index) => (
                    <li key={index} className="text-xs text-muted-foreground flex items-start gap-2">
                      <Star className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              )}
              {recommendation.matchedSkills.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {recommendation.matchedSkills.slice(0, 3).map((skill, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Est. completion: {recommendation.estimatedCompletionTime}</span>
                <div className="flex items-center space-x-1">
                  <Star className="w-3 h-3" />
                  <span>{Math.round(recommendation.score)}/100</span>
                </div>
              </div>
            </div>
          )}

          {challenge.tags && challenge.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-4">
              {challenge.tags.slice(0, 4).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {challenge.tags.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{challenge.tags.length - 4} more
                </Badge>
              )}
            </div>
          )}
        </CardContent>
        {footer && (
          <CardFooter className="mt-auto pt-0 px-4 pb-4">
            <div className="w-full">{footer}</div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default ChallengeCard;

