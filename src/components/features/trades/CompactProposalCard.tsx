import React from 'react';
import { TradeProposal, TradeSkill } from '../../../services/firestore';
import ProfileImageWithUser from '../../ui/ProfileImageWithUser';
import { Card, CardHeader, CardContent } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { SkillBadge } from '../../ui/SkillBadge';

interface CompactProposalCardProps {
  proposal: TradeProposal;
  onAccept?: () => void;
  onReject?: () => void;
  onExpand: () => void;
  isCreator: boolean;
  className?: string;
}

const CompactProposalCard: React.FC<CompactProposalCardProps> = ({
  proposal,
  onAccept,
  onReject,
  onExpand,
  isCreator,
  className
}) => {
  // Format date
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Recently';

    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }).format(date);
    } catch (err) {
      return 'Invalid Date';
    }
  };

  // Get status variant
  const getStatusVariant = (status: string): 'default' | 'secondary' | 'outline' => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'default';
      case 'accepted':
        return 'secondary';
      case 'rejected':
        return 'outline';
      case 'withdrawn':
        return 'outline';
      default:
        return 'outline';
    }
  };

  // Smart message truncation - word-aware with better UX
  const truncateMessage = (message: string, maxLength: number = 100) => {
    if (message.length <= maxLength) return message;

    // Find the last complete word within the limit
    const truncated = message.substring(0, maxLength);
    const lastSpaceIndex = truncated.lastIndexOf(' ');

    if (lastSpaceIndex > maxLength * 0.8) {
      // If we can preserve most of the last word, do it
      return truncated.substring(0, lastSpaceIndex) + '...';
    } else {
      // Otherwise, cut at a reasonable word boundary
      const words = message.split(' ');
      let result = '';
      let currentLength = 0;

      for (const word of words) {
        const wordLength = word.length + (currentLength > 0 ? 1 : 0); // +1 for space
        if (currentLength + wordLength > maxLength - 3) break;
        result += (currentLength > 0 ? ' ' : '') + word;
        currentLength += wordLength;
      }
      return result + '...';
    }
  };

  return (
    <article 
      className={`min-h-[280px] max-h-[400px] w-full ${className}`}
      aria-labelledby={`compact-proposal-${proposal.id}`}
    >
      <Card
        variant="glass"
        depth="lg"
        glow="subtle"
        glowColor="orange"
        hover={true}
        interactive={true}
        className="min-h-[280px] max-h-[400px] w-full flex flex-col bg-card/95 backdrop-blur-sm border-glass"
      >
        {/* Header: User Info and Status */}
        <CardHeader className="pb-4 flex-shrink-0">
          <header className="flex flex-col gap-4">
              {/* User Profile Section */}
              <div className="flex items-center gap-4 min-w-0">
                <div className="flex-shrink-0">
                  <ProfileImageWithUser
                    userId={proposal.proposerId}
                    profileUrl={proposal.proposerPhotoURL}
                    size="medium"
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full ring-2 ring-border/50"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 
                    id={`compact-proposal-${proposal.id}`}
                    className="text-base sm:text-lg font-semibold text-foreground hover:text-primary/80 transition-colors duration-200 truncate"
                    title={proposal.proposerName || 'Anonymous'}
                  >
                    {proposal.proposerName || 'Anonymous'}
                  </h3>
                  <time 
                    dateTime={proposal.createdAt?.toDate?.()?.toISOString()}
                    className="text-xs sm:text-sm text-muted-foreground block"
                  >
                    {formatDate(proposal.createdAt)}
                  </time>
                </div>

                {/* Status Badge */}
                <Badge
                  variant={getStatusVariant(proposal.status)}
                  className="flex-shrink-0 text-xs px-2 py-1"
                  aria-label={`Status: ${proposal.status}`}
                >
                {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
              </Badge>
            </div>
          </header>
        </CardHeader>

      {/* Content: Message and Skills */}
      <CardContent className="flex-1 flex flex-col px-3 py-2 overflow-y-auto min-h-0">
        <main className="flex flex-col space-y-3 flex-1">
          {/* Proposal Message - Adaptive text handling */}
          <section className="flex-shrink-0">
            <div className="rounded-lg bg-muted/20 border border-border/30 hover:border-border/50 transition-all duration-200 hover:bg-muted/30 p-2 sm:p-3 overflow-hidden">
              <p 
                className="text-sm sm:text-base text-foreground/90 leading-relaxed line-clamp-3 break-words overflow-wrap-anywhere max-w-full"
                title={proposal.message}
              >
                {proposal.message}
              </p>
            </div>
          </section>

          {/* Skills Section - Enhanced visual hierarchy */}
          <section className="space-y-2 flex-shrink-0" aria-label="Skills summary">
            {/* Skills Offered - Enhanced styling */}
            {proposal.skillsOffered && proposal.skillsOffered.length > 0 && (
              <div className="flex items-start gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" aria-hidden="true"></span>
                  <span className="text-xs font-medium text-green-600 dark:text-green-400">
                    Offered:
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 min-w-0 flex-1" role="list">
                  {proposal.skillsOffered.slice(0, 3).map((skill, index) => (
                    <SkillBadge
                      key={`offered-${skill.name}-${index}`}
                      skill={skill.name}
                      level={skill.level}
                      size="sm"
                    />
                  ))}
                  {proposal.skillsOffered.length > 3 && (
                    <span className="text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded" aria-label={`${proposal.skillsOffered.length - 3} more skills`}>
                      +{proposal.skillsOffered.length - 3}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Skills Requested - Enhanced styling */}
            {proposal.skillsRequested && proposal.skillsRequested.length > 0 && (
              <div className="flex items-start gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" aria-hidden="true"></span>
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                    Requested:
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 min-w-0 flex-1" role="list">
                  {proposal.skillsRequested.slice(0, 3).map((skill, index) => (
                    <SkillBadge
                      key={`requested-${skill.name}-${index}`}
                      skill={skill.name}
                      level={skill.level}
                      size="sm"
                    />
                  ))}
                  {proposal.skillsRequested.length > 3 && (
                    <span className="text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded" aria-label={`${proposal.skillsRequested.length - 3} more skills`}>
                      +{proposal.skillsRequested.length - 3}
                    </span>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Evidence Count - Enhanced styling */}
          {proposal.evidence && proposal.evidence.length > 0 && (
            <aside className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded-md flex-shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500" aria-hidden="true"></span>
              <span className="font-medium">
                {proposal.evidence.length} evidence item{proposal.evidence.length !== 1 ? 's' : ''}
              </span>
            </aside>
          )}
        </main>
      </CardContent>

      {/* Footer: Enhanced Action Button */}
      <footer className="p-3 pt-0 flex-shrink-0 border-t border-border/10 mt-auto">
        <Button
          variant="glassmorphic"
          topic="trades"
          size="sm"
          onClick={onExpand}
          className="w-full text-sm font-medium hover:shadow-orange-500/20 transition-all duration-200 min-h-[44px]"
          aria-label="View full proposal details"
        >
          View Details
        </Button>
      </footer>
      </Card>
    </article>
  );
};

export default CompactProposalCard;
