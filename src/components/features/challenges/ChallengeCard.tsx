import React from "react";
import { cn } from "../../../utils/cn";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardFooter,
} from "../../ui/Card";
import { Badge } from "../../ui/Badge";
import { Clock, Award, Users, Target, Star, Lock } from "lucide-react";
import {
  Challenge,
  ChallengeDifficulty,
  ChallengeType,
} from "../../../types/gamification";
import { ChallengeRecommendation } from "../../../services/challengeDiscovery";
import { Tooltip } from "../../ui/Tooltip";
import { useAuth } from "../../../AuthContext";
import {
  getChallengeAccessStatus,
} from "../../../services/threeTierProgression";

export interface ChallengeCardProps {
  challenge: Challenge;
  recommendation?: ChallengeRecommendation;
  onSelect?: (challenge: Challenge) => void;
  className?: string;
  variant?: "default" | "glass" | "elevated" | "premium";
  enhanced?: boolean;
  footer?: React.ReactNode;
}

const getDifficultyConfig = (difficulty: ChallengeDifficulty) => {
  switch (difficulty) {
    case ChallengeDifficulty.BEGINNER:
      return { variant: "default" as const, color: "text-success" };
    case ChallengeDifficulty.INTERMEDIATE:
      return { variant: "secondary" as const, color: "text-info" };
    case ChallengeDifficulty.ADVANCED:
      return { variant: "outline" as const, color: "text-warning" };
    case ChallengeDifficulty.EXPERT:
      return { variant: "outline" as const, color: "text-destructive" };
    default:
      return { variant: "default" as const, color: "text-muted-foreground" };
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

const getMatchColor = (match: ChallengeRecommendation["difficultyMatch"]) => {
  switch (match) {
    case "perfect":
      return "text-success";
    case "slightly-easy":
      return "text-info";
    case "slightly-hard":
      return "text-warning";
    case "too-easy":
      return "text-muted-foreground";
    case "too-hard":
      return "text-destructive";
    default:
      return "text-muted-foreground";
  }
};

export const ChallengeCard: React.FC<ChallengeCardProps> = ({
  challenge,
  recommendation,
  onSelect,
  className,
  variant = "premium",
  enhanced = true,
  footer,
}) => {
  const { currentUser } = useAuth();
  const [locked, setLocked] = React.useState<boolean>(false);
  const [lockReason, setLockReason] = React.useState<string>("");

  React.useEffect(() => {
    (async () => {
      if (!currentUser?.uid) {
        setLocked(true); // Default to locked if no user
        setLockReason("Sign in to check access requirements.");
        return;
      }

      try {
        const status = await getChallengeAccessStatus(currentUser.uid, challenge);
        if (status.accessible) {
          setLocked(false);
          setLockReason("");
        } else {
          setLocked(true);
          setLockReason(status.reason);
        }
      } catch (err) {
        // preserve fail-safe
        console.error("Error checking challenge access:", err);
        setLocked(true);
        setLockReason("Could not verify access. Please try again later.");
      }
    })();
  }, [currentUser?.uid, challenge]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect?.(challenge);
    }
  };

  const difficultyConfig = getDifficultyConfig(challenge.difficulty);

  const getTierGlowColor = (type: ChallengeType): "green" | "orange" | "purple" | "auto" => {
    switch (type) {
      case ChallengeType.SOLO:
        return "green";
      case ChallengeType.TRADE:
        return "orange";
      case ChallengeType.COLLABORATION:
        return "purple";
      default:
        return "auto";
    }
  };

  return (
    <div
      data-testid={`challenge-card-${challenge.id}`}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`View challenge: ${challenge.title}`}
      className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg h-full"
    >
      <Card
        variant={variant}
        tilt={enhanced}
        depth="lg"
        glow="strong"
        glowColor={getTierGlowColor(challenge.type)}
        hover
        interactive
        onClick={() => onSelect?.(challenge)}
        className={cn(
          "flex flex-col cursor-pointer overflow-hidden h-full min-h-[420px]",
          className
        )}
      >
        {/* Cover Image */}
        {challenge.coverImage && (
          <div className="relative h-48 overflow-hidden bg-muted/20">
            <img
              src={challenge.coverImage}
              alt={challenge.title}
              className="w-full h-full object-cover transition-all duration-500 hover:scale-105 opacity-70"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background via-background/80 to-transparent" />

            {/* Top Badges */}
            <div className="absolute top-3 right-3 flex gap-2">
              {recommendation && (
                <Badge variant="default" className="bg-background/80 backdrop-blur text-foreground shadow-sm">
                  {Math.round(recommendation.score)}% Match
                </Badge>
              )}
            </div>

            {/* Type Badge */}
            <div className="absolute top-3 left-3">
              <Badge variant="secondary" className="backdrop-blur bg-background/60 shadow-sm border-none">
                <span className="flex items-center gap-1">
                  {getTypeIcon(challenge.type)}
                  <span className="capitalize">{challenge.type.toLowerCase()}</span>
                </span>
              </Badge>
            </div>
          </div>
        )}

        <CardHeader className={cn("pb-2 flex-shrink-0", challenge.coverImage ? "-mt-12 relative z-10 px-4" : "pt-6")}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col gap-1 min-w-0 flex-1">
              <CardTitle className="truncate text-lg font-bold leading-tight">
                {challenge.title}
              </CardTitle>
              {!challenge.coverImage && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <span className="flex items-center gap-1">
                    {getTypeIcon(challenge.type)}
                    <span className="capitalize">{challenge.type}</span>
                  </span>
                  <span>•</span>
                  <span className={cn("capitalize font-medium", difficultyConfig.color)}>
                    {challenge.difficulty}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 px-4 pb-4 space-y-4">
          {challenge.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {challenge.description}
            </p>
          )}

          {/* Stats Row */}
          <div className="flex items-center justify-between text-sm py-2 border-y border-border/40">
            {challenge.coverImage ? (
              <Badge variant={difficultyConfig.variant} className="capitalize">
                {challenge.difficulty}
              </Badge>
            ) : (
              <span></span> /* Spacer */
            )}

            <div className="flex items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-1.5" title="Estimated time">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">{challenge.timeEstimate}</span>
              </div>
              <div className="flex items-center gap-1.5" title="XP Reward">
                <Award className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-bold text-foreground">{challenge.rewards?.xp || 0} XP</span>
              </div>
            </div>
          </div>

          {locked && (
            <div className="bg-muted/30 p-2.5 rounded-lg border border-border/50">
              <Tooltip
                content={<div className="max-w-xs text-xs">{lockReason}</div>}
              >
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">Locked: Requirements not met</span>
                </div>
              </Tooltip>
            </div>
          )}

          {recommendation && (
            <div className="space-y-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-primary">Key Match Reasons</span>
                <span
                  className={cn(
                    "text-xs font-medium capitalize",
                    getMatchColor(recommendation.difficultyMatch)
                  )}
                >
                  {recommendation.difficultyMatch.replace("-", " ")}
                </span>
              </div>
              {recommendation.reasons.length > 0 && (
                <ul className="space-y-1">
                  {recommendation.reasons.slice(0, 2).map((reason, index) => (
                    <li
                      key={index}
                      className="text-xs text-muted-foreground flex items-start gap-2"
                    >
                      <Star className="w-3 h-3 mt-0.5 flex-shrink-0 text-primary/60" />
                      <span className="line-clamp-1">{reason}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {challenge.tags && challenge.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {challenge.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-0.5 rounded-full bg-secondary/50 text-[10px] sm:text-xs text-secondary-foreground font-medium border border-border/50"
                >
                  {tag}
                </span>
              ))}
              {challenge.tags.length > 3 && (
                <span className="px-2 py-0.5 text-[10px] text-muted-foreground">
                  +{challenge.tags.length - 3}
                </span>
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
